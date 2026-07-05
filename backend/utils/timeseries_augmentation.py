# -*- coding: utf-8 -*-
"""
시계열 데이터 증강 엔진

과거 특정 시점까지만 존재하는(원격 YH 백업 DB에서 유래한) 시계열 테이블들을
오늘 날짜까지, 그리고 향후 일정 기간까지 자동으로 연장 생성한다.

원칙:
- 실제 외부 ERP 소스를 흉내내는 테이블(erp_sync 앱, Fact*/Dim* 모델)은 건드리지 않는다.
  그건 "실제로 연동 안 됨"이 사실이고, 그 사실을 감추면 안 된다.
- 여기서 다루는 대상은 이미 샘플/실데이터 패턴으로 채워져 있던 "분석용 집계 테이블"
  (accounting/cost/sales/... 등)뿐이다 — 이미 존재하는 값들의 추세·계절성·분산을
  그대로 이어받아 자연스럽게 미래로 연장할 뿐, 없던 걸 지어내지 않는다.
- 카테고리(부서/제품/거래처 등) 조합별로 독립적인 시계열로 취급해 각각 연장한다.
"""
import logging
import random
from datetime import date, timedelta
from decimal import Decimal

from django.db import models as django_models
from django.utils import timezone

logger = logging.getLogger(__name__)

# 카테고리(차원) 필드로 취급할 최대 distinct 값 개수
DIMENSION_MAX_DISTINCT = 20

# 월별 집계 확장 버퍼 (이번 달 기준 +N개월)
MONTHLY_BUFFER_MONTHS = 12
# 일별 집계 확장 버퍼 (오늘 기준 +N일)
DAILY_BUFFER_DAYS = 30

# 추세를 낼 근거로 인정할 최소 히스토리 건수(그룹당)
MIN_HISTORY_PER_GROUP = 3
# 모델당 확장할 그룹 수 상한(과도한 dimension 조합 폭증 방지, 데이터 풍부한 그룹 우선)
MAX_GROUPS_PER_MODEL = 60


def _is_fy_fm_model(model):
    field_names = {f.name for f in model._meta.get_fields() if hasattr(f, "get_internal_type")}
    return "fiscal_year" in field_names and "fiscal_month" in field_names


def _get_single_date_field(model):
    """모델이 fy/fm이 아니라 단일 DateField를 시간축으로 쓰는 경우 그 필드명을 반환"""
    date_fields = [
        f.name for f in model._meta.get_fields()
        if hasattr(f, "get_internal_type") and getattr(f, "concrete", False)
        and f.get_internal_type() == "DateField"
    ]
    return date_fields[0] if len(date_fields) == 1 else None


def _classify_fields(model, time_field_names):
    """
    필드를 always_dimension(항상 카테고리 취급) / cardinality_check(카디널리티 보고
    나중에 dimension·metric·copy_forward로 재분류할 후보) / skip으로 분류.
    """
    excluded = {"id", "created_at", "updated_at"} | set(time_field_names)
    always_dimension = []
    cardinality_check = []
    skip_fields = []

    for f in model._meta.get_fields():
        if not hasattr(f, "get_internal_type") or not getattr(f, "concrete", False):
            continue
        if f.name in excluded:
            continue
        internal = f.get_internal_type()
        if internal in ("ForeignKey", "BooleanField"):
            always_dimension.append(f.name)
        elif internal == "TextField":
            skip_fields.append(f.name)  # 노트류 텍스트, 마지막 값 그대로 복사
        elif internal in ("CharField", "IntegerField", "BigIntegerField", "DecimalField", "FloatField", "AutoField"):
            cardinality_check.append(f.name)
        else:
            skip_fields.append(f.name)

    return always_dimension, cardinality_check, skip_fields


def _split_by_cardinality(model, always_dimension, cardinality_check, sample_qs):
    """
    cardinality_check 후보를 실제 데이터의 distinct 값 개수로
    dimension(카테고리) / metric(수치, 추세 투영) / copy_forward(그 외, 마지막 값 복사)로 재분류.
    """
    if not cardinality_check:
        return always_dimension, [], []

    rows = list(sample_qs.values(*cardinality_check)[:500])
    total = len(rows)
    dimension, metric, copy_forward = list(always_dimension), [], []

    numeric_types = {
        f.name: f.get_internal_type()
        for f in model._meta.get_fields()
        if hasattr(f, "get_internal_type") and getattr(f, "concrete", False)
    }

    for name in cardinality_check:
        distinct = len({r[name] for r in rows})
        is_numeric = numeric_types.get(name) in ("IntegerField", "BigIntegerField", "DecimalField", "FloatField", "AutoField")

        if is_numeric:
            # 표본이 적으면 연속값도 우연히 겹칠 수 있으므로, 숫자 필드는 값이 뚜렷하게
            # 반복(평균 2회 이상)될 때만 dimension으로 본다. 그 외엔 metric(추세 투영 대상).
            looks_categorical = total >= 6 and distinct <= DIMENSION_MAX_DISTINCT and distinct <= max(1, total * 0.5)
            if looks_categorical:
                dimension.append(name)
            else:
                metric.append(name)
            continue

        if total > 0 and distinct <= DIMENSION_MAX_DISTINCT and distinct < total:
            dimension.append(name)
        else:
            # 카디널리티 높은 문자열(lot_number 등) — 평균 낼 수 없으니 마지막 값 그대로 이어감
            copy_forward.append(name)

    return dimension, metric, copy_forward


def _month_add(year, month, delta):
    total = year * 12 + (month - 1) + delta
    return total // 12, total % 12 + 1


def _project_value(history, steps_ahead, field_name):
    """
    history: 시간순 정렬된 값 리스트(Decimal/float/int 혼재 가능)
    steps_ahead: 마지막 데이터 이후 몇 스텝 뒤인지
    추세(선형회귀) + 계절성(월별 평균, 데이터 12개 이상일 때) + 노이즈로 다음 값을 생성
    """
    values = [float(v) for v in history if v is not None]
    if not values:
        return None

    n = len(values)
    mean = sum(values) / n
    variance = sum((v - mean) ** 2 for v in values) / n if n > 1 else 0
    std = variance ** 0.5

    # 선형 추세 (least squares)
    if n >= 2:
        xs = list(range(n))
        x_mean = sum(xs) / n
        y_mean = mean
        num = sum((xs[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        den = sum((xs[i] - x_mean) ** 2 for i in xs) or 1
        slope = num / den
    else:
        slope = 0

    last_value = values[-1]
    projected = last_value + slope * steps_ahead

    # 노이즈: 표준편차의 25% 수준으로 자연스러운 변주(완전 직선이 아니게)
    noise_scale = std * 0.25 if std > 0 else abs(mean) * 0.03
    projected += random.gauss(0, noise_scale) if noise_scale else 0

    # 비율/달성률류 필드는 과도한 이탈 방지
    lname = field_name.lower()
    if "rate" in lname or "margin" in lname or "achievement" in lname:
        lo = min(values) * 0.7
        hi = max(values) * 1.15
        projected = max(lo, min(hi, projected))
    else:
        # 금액/수량류는 음수 방지
        if min(values) >= 0:
            projected = max(0, projected)

    return projected


def _cast_like(original_value, new_value):
    if isinstance(original_value, Decimal):
        return Decimal(str(round(new_value, 2)))
    if isinstance(original_value, int):
        return int(round(new_value))
    if isinstance(original_value, float):
        return round(new_value, 4)
    return new_value


def extend_model_timeseries(model, today=None, dry_run=False):
    """
    단일 모델의 시계열을 오늘(+버퍼)까지 연장한다.
    반환: (생성된 행 수, 로그 메시지)
    """
    today = today or date.today()
    is_fy_fm = _is_fy_fm_model(model)
    date_field = None if is_fy_fm else _get_single_date_field(model)

    if not is_fy_fm and not date_field:
        return 0, f"{model._meta.db_table}: 시간축 필드를 찾을 수 없어 건너뜀"

    time_field_names = ["fiscal_year", "fiscal_month"] if is_fy_fm else [date_field]
    if not model.objects.exists():
        return 0, f"{model._meta.db_table}: 기존 데이터가 없어 건너뜀(증강 대상 아님)"

    always_dimension, cardinality_check, skip_fields = _classify_fields(model, time_field_names)
    dimension_fields, metric_fields, copy_forward_fields = _split_by_cardinality(
        model, always_dimension, cardinality_check, model.objects.all()
    )

    # 차원 조합별로 그룹핑
    all_rows = list(model.objects.all().order_by(*time_field_names))
    groups = {}
    for row in all_rows:
        key = tuple(getattr(row, d) for d in dimension_fields)
        groups.setdefault(key, []).append(row)

    # 히스토리가 너무 적은 조합(1~2건)은 추세를 낼 근거가 없으므로 건너뜀.
    # 이런 사례가 많다는 건 dimension 조합이 지나치게 세분화됐다는 신호이기도 하다.
    groups = {k: v for k, v in groups.items() if len(v) >= MIN_HISTORY_PER_GROUP}

    # 그래도 그룹 수가 과도하면(=한 번에 생성될 행 수 폭증 위험) 데이터가 가장 풍부한
    # 그룹 위주로만 제한한다 — 전수 커버보다 안정성 우선.
    if len(groups) > MAX_GROUPS_PER_MODEL:
        groups = dict(
            sorted(groups.items(), key=lambda kv: len(kv[1]), reverse=True)[:MAX_GROUPS_PER_MODEL]
        )

    if not groups:
        return 0, f"{model._meta.db_table}: 유효한 시계열 그룹이 없어 건너뜀"

    if is_fy_fm:
        target_year, target_month = today.year, today.month
        target_year, target_month = _month_add(target_year, target_month, MONTHLY_BUFFER_MONTHS)
        target_period_index = target_year * 12 + target_month
    else:
        target_date = today + timedelta(days=DAILY_BUFFER_DAYS)

    created = 0
    to_create = []

    for key, rows in groups.items():
        if is_fy_fm:
            last_row = rows[-1]
            last_period_index = last_row.fiscal_year * 12 + last_row.fiscal_month
            if last_period_index >= target_period_index:
                continue
            steps_total = target_period_index - last_period_index
        else:
            last_row = rows[-1]
            last_date = getattr(last_row, date_field)
            if last_date >= target_date:
                continue
            steps_total = (target_date - last_date).days

        for step in range(1, steps_total + 1):
            new_obj = model()
            for d, v in zip(dimension_fields, key):
                setattr(new_obj, d, v)

            if is_fy_fm:
                py, pm = _month_add(last_row.fiscal_year, last_row.fiscal_month, step)
                new_obj.fiscal_year = py
                new_obj.fiscal_month = pm
            else:
                setattr(new_obj, date_field, last_date + timedelta(days=step))

            for m in metric_fields:
                history = [getattr(r, m) for r in rows]
                projected = _project_value(history, step, m)
                if projected is not None:
                    setattr(new_obj, m, _cast_like(getattr(rows[-1], m), projected))

            # 카디널리티 높은 문자열(lot_number 등)·TextField는 평균 낼 수 없으니
            # 마지막 값을 그대로 이어가되, 완전히 똑같아 보이지 않도록 순번을 붙인다
            for name in copy_forward_fields + skip_fields:
                base = getattr(rows[-1], name, "") or ""
                setattr(new_obj, name, f"{base}-AUG{step}" if base else base)

            # unique 필드(예: inspection_number)는 마지막 값에 순번을 붙여 충돌 방지(위 값을 덮어씀)
            for f in model._meta.get_fields():
                if not hasattr(f, "unique") or not getattr(f, "concrete", False):
                    continue
                if getattr(f, "unique", False) and f.name not in dimension_fields + metric_fields + time_field_names + ["id"]:
                    base = getattr(rows[-1], f.name, "") or ""
                    setattr(new_obj, f.name, f"{base}-AUG{step}" if base else f"AUG-{new_obj.__class__.__name__}-{step}")

            if hasattr(new_obj, "created_at"):
                new_obj.created_at = timezone.now()
            if hasattr(new_obj, "updated_at"):
                new_obj.updated_at = timezone.now()

            to_create.append(new_obj)
            created += 1

    if to_create and not dry_run:
        model.objects.bulk_create(to_create, ignore_conflicts=True)

    return created, f"{model._meta.db_table}: {created}건 생성 (그룹 {len(groups)}개)"


def extend_all_timeseries(models_list, today=None, dry_run=False):
    """models_list: [(app_label, ModelClass), ...] 형태로 전달받아 순차 확장"""
    results = []
    for model in models_list:
        try:
            count, msg = extend_model_timeseries(model, today=today, dry_run=dry_run)
            results.append((model, count, msg))
            logger.info(f"[TimeseriesAugmentation] {msg}")
        except Exception as e:
            logger.error(f"[TimeseriesAugmentation] {model._meta.db_table} 확장 실패: {e}")
            results.append((model, 0, f"{model._meta.db_table}: 실패 - {e}"))
    return results


def get_target_models():
    """
    증강 대상 모델 자동 탐지.
    erp_sync(실제 ERP 소스 흉내), Fact*/Dim*(스타 스키마, 실연동 전용), business_process(개별 주문
    트랜잭션, 주기적 집계와 성격이 달라 이번 범위에서 제외)는 제외한다.
    """
    from django.apps import apps

    exclude_apps = {"erp_sync", "business_process"}
    daily_agg_whitelist = {
        ("production", "DailyProduction"),
        ("productivity", "DailyProductionSummary"),
        ("productivity", "HourlyProduction"),
        ("quality", "QualityInspection"),
    }

    targets = []
    for model in apps.get_models():
        app_label = model._meta.app_label
        if app_label in exclude_apps:
            continue
        name = model.__name__
        if name.startswith("Fact") or name.startswith("Dim"):
            continue
        if _is_fy_fm_model(model):
            targets.append(model)
        elif (app_label, name) in daily_agg_whitelist:
            targets.append(model)

    return targets
