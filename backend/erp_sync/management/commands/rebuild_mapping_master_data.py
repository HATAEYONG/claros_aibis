# -*- coding: utf-8 -*-
"""
ERP 매핑 마스터 데이터(ERPTargetModel/ERPTargetField/ERPTableMapping/ERPFieldMapping)를
전량 삭제하고, 실제로 검증된 매핑(import_real_yh_data.py / import_real_cost_data.py에서
이미 구현·실행·검증한 것)을 기준으로 다시 만든다.

기존 데이터는 132개 타겟모델 중 130개가 설치되지 않은 가상의 앱(dashboard, kpi,
financial 등)을 가리키고, 실제 앱과 일치하는 2개마저 필드 매핑이 현재 스키마와
전혀 맞지 않는(전부 무효) 상태였다 — 이번에 전량 재구축한다.

소스 필드 정의는 복원된 실제 MSSQL(LOCAL_BACKUP)에서 라이브로 조회해서 채우고,
타겟 필드 정의는 실제 Django 모델을 introspect해서 채우므로 손으로 잘못 적을
여지가 없다.

사용법:
    python manage.py rebuild_mapping_master_data
"""
from django.apps import apps as django_apps
from django.core.management.base import BaseCommand, CommandError


# 소스 테이블별 메타 정보(모듈 분류/설명) — SAP_ERD_ANALYSIS.md 기준
SOURCE_TABLES = {
    "PPC100": ("PRODUCTION", "PP.생산실적"),
    "QMM100": ("QUALITY", "QM.수입검사정보"),
    "SDD100": ("SALES", "SD.매출정보"),
    "SDY100": ("SALES", "SD.년판매계획정보"),
    "BCV100": ("COMMON", "BC.거래처정보"),
    "LCB100": ("PURCHASE", "LC.LOCATION 품목보관현황"),
    "MMB150": ("PURCHASE", "MM.구매발주 상세"),
    "COS520_YH": ("FINANCIAL", "품목별 원가계산내역(분기 누적 스냅샷)"),
}

# 타겟 Django 모델 목록: (app_label, model_name, model_type)
TARGET_MODELS = [
    ("production", "ProductionLine", "dimension"),
    ("production", "DailyProduction", "fact"),
    ("quality", "QualityInspection", "fact"),
    ("sales", "MonthlySales", "fact"),
    ("sales", "TopCustomer", "fact"),
    ("purchase", "Inventory", "snapshot"),
    ("reports", "ExecutiveSummary", "aggregate"),
]

# 테이블 매핑: mapping_code -> {
#   source_table, target: (app_label, model_name), sync_type, priority, description,
#   fields: [(source_field, target_field, transform_rule, description), ...]
# }
TABLE_MAPPINGS = {
    "PPC100_TO_DAILY_PRODUCTION": {
        "source_table": "PPC100",
        "target": ("production", "DailyProduction"),
        "sync_type": "full",
        "priority": 3,
        "description": (
            "생산실적(PPC100)을 work_dt+wc_cd로 집계해 라인별 일일 생산실적으로 변환. "
            "wc_cd는 ProductionLine.code로 매핑되어 라인을 식별한다."
        ),
        "fields": [
            ("work_dt", "production_date", "date_format", "work_dt DATE 캐스팅"),
            ("wc_cd", "production_line", "lookup", "wc_cd -> ProductionLine.code 조회/생성"),
            ("req_qty", "target_quantity", "custom", "SUM(req_qty) 그룹집계"),
            ("good_qty", "actual_quantity", "custom", "SUM(good_qty + bad_qty) 그룹집계"),
            ("bad_qty", "defect_quantity", "custom", "SUM(bad_qty) 그룹집계(actual_quantity 합산에도 포함됨)"),
            ("real_tm", "operating_hours", "custom", "SUM(real_tm)/60 분->시간 환산, 24시간 상한"),
            ("stop_tm", "downtime_hours", "custom", "SUM(stop_tm)/60 분->시간 환산, 24시간 상한"),
        ],
    },
    "QMM100_TO_QUALITY_INSPECTION": {
        "source_table": "QMM100",
        "target": ("quality", "QualityInspection"),
        "sync_type": "full",
        "priority": 3,
        "description": "수입검사정보(QMM100)를 건별로 그대로 품질검사 실적으로 변환.",
        "fields": [
            ("iqc_no", "inspection_number", "none", "고유 검사번호, unique 키(LOT 번호로도 재사용됨)"),
            ("iqc_dt", "inspection_date", "date_format", "datetime -> date"),
            ("itm_id", "product_code", "custom", "f'ITM-{itm_id}' 포맷(product_name도 동일 값에서 파생)"),
            ("iqc_rid", "inspector", "custom", "f'검사원{iqc_rid}' 포맷(사원마스터 미조사)"),
            ("smp_qty", "sample_size", "decimal_cast", "varchar -> int 캐스팅, 최소 1"),
            ("bad_qty", "defect_count", "decimal_cast", "sample_size 상한 클램프(result도 bad_qty==0 여부로 이 값에서 파생)"),
        ],
    },
    "SDD100_TO_MONTHLY_SALES": {
        "source_table": "SDD100",
        "target": ("sales", "MonthlySales"),
        "sync_type": "full",
        "priority": 2,
        "description": "매출정보(SDD100)를 연월 단위로 집계해 실적 매출로 반영.",
        "fields": [
            ("sal_dt", "fiscal_month", "custom", "YEAR(sal_dt)/MONTH(sal_dt)로 fiscal_year+fiscal_month 동시 산출"),
            ("sal_amt", "actual_amount", "custom", "SUM(sal_amt) 연월 그룹집계"),
        ],
    },
    "SDY100_TO_MONTHLY_SALES": {
        "source_table": "SDY100",
        "target": ("sales", "MonthlySales"),
        "sync_type": "full",
        "priority": 3,
        "description": "년판매계획정보(SDY100)를 연월 단위로 집계해 목표 매출로 반영.",
        "fields": [
            ("plan_year", "fiscal_year", "decimal_cast", "char -> int 캐스팅"),
            ("plan_mon", "fiscal_month", "decimal_cast", "char -> int 캐스팅"),
            ("plan_amt", "target_amount", "custom", "SUM(plan_amt) 연월 그룹집계, 없으면 실적*1.05로 대체"),
        ],
    },
    "SDD100_TO_TOP_CUSTOMER": {
        "source_table": "SDD100",
        "target": ("sales", "TopCustomer"),
        "sync_type": "full",
        "priority": 3,
        "description": "매출정보(SDD100)를 거래처별로 집계 후 BCV100과 조인해 월별 매출 상위 5개 거래처 산출.",
        "custom_query": "SDD100을 cust_cd+연월로 집계 후 LEFT JOIN BCV100 ON cust_cd, 상위 5개만 채택",
        "fields": [
            ("sal_dt", "fiscal_month", "custom", "YEAR(sal_dt)/MONTH(sal_dt)로 fiscal_year+fiscal_month 동시 산출"),
            ("cust_cd", "customer_name", "lookup", "BCV100.cust_nm 조인(customer_code에도 cust_cd 그대로 사용)"),
            ("sal_amt", "revenue", "custom", "SUM(sal_amt), 월별 상위 5개만 채택"),
        ],
    },
    "LCB100_TO_INVENTORY": {
        "source_table": "LCB100",
        "target": ("purchase", "Inventory"),
        "sync_type": "full",
        "priority": 3,
        "description": "LOCATION 품목보관현황(LCB100)을 품목별로 집계한 현재 재고 스냅샷.",
        "fields": [
            ("itm_id", "item_code", "custom", "f'ITM-{itm_id}' 포맷(item_name도 동일 값에서 파생)"),
            ("qty", "current_stock", "custom", "SUM(qty), disuse_yn='Y' 제외"),
        ],
    },
    "MMB150_TO_INVENTORY": {
        "source_table": "MMB150",
        "target": ("purchase", "Inventory"),
        "sync_type": "full",
        "priority": 4,
        "description": "구매발주 상세(MMB150)의 최근 단가로 재고가치를 보강.",
        "fields": [
            ("itm_id", "item_code", "lookup", "LCB100.itm_id와 조인 키"),
            ("po_up", "stock_value", "custom", "품목별 최근 po_up(ROW_NUMBER 최신 1건) * current_stock"),
        ],
    },
    "COS520_YH_TO_EXECUTIVE_SUMMARY": {
        "source_table": "COS520_YH",
        "target": ("reports", "ExecutiveSummary"),
        "sync_type": "full",
        "priority": 2,
        "description": (
            "품목별 원가계산내역(COS520_YH)은 분기말(3/6/9/12월) 회계연도 누적 스냅샷이다. "
            "분기 간 차이를 그 분기의 실제 원가로 보고 3개월에 균등 배분해 월별 원가를 산출, "
            "매출(실측)과 대조해 영업이익/영업이익률을 계산한다. 순이익은 법인세 등을 반영해 "
            "영업이익의 78%로 근사(완전한 실측 아님)."
        ),
        "fields": [
            ("cost_mon", "fiscal_month", "custom", "'YYYY-MM' 파싱으로 fiscal_year+fiscal_month 동시 산출"),
            ("mat_cost", "operating_profit", "custom", "sum_amt=mat+lab+out+etc_cost 구성요소, 분기증분/3=월원가, revenue-월원가"),
            ("lab_cost", "operating_profit", "custom", "sum_amt 구성요소"),
            ("out_cost", "operating_profit", "custom", "sum_amt 구성요소"),
            ("etc_cost", "operating_profit", "custom", "sum_amt 구성요소"),
            ("sum_amt", "net_margin", "custom", "월원가 기준 operating_margin, net_profit(영업이익*0.78 근사)도 이 값에서 파생"),
        ],
    },
    "SDD100_TO_EXECUTIVE_SUMMARY": {
        "source_table": "SDD100",
        "target": ("reports", "ExecutiveSummary"),
        "sync_type": "full",
        "priority": 2,
        "description": "매출정보(SDD100) 월별 집계를 억원 단위로 환산해 경영요약 매출로 반영(MonthlySales와 동일 소스).",
        "fields": [
            ("sal_dt", "fiscal_month", "custom", "YEAR(sal_dt)/MONTH(sal_dt)로 fiscal_year+fiscal_month 동시 산출"),
            ("sal_amt", "revenue", "custom", "SUM(sal_amt)/100,000,000 (원 -> 억원 환산)"),
        ],
    },
}


class Command(BaseCommand):
    help = "무효한 ERP 매핑 마스터 데이터를 전량 삭제하고, 실제 검증된 매핑으로 재구축한다"

    def handle(self, *args, **options):
        self._delete_stale_mapping_data()
        cursor = self._connect_mssql()
        source_tables = self._rebuild_source_catalog(cursor)
        target_models = self._rebuild_target_catalog()
        self._rebuild_table_and_field_mappings(source_tables, target_models)
        self.stdout.write(self.style.SUCCESS("매핑 마스터 데이터 재구축 완료"))

    def _delete_stale_mapping_data(self):
        from erp_sync.models import ERPFieldMapping, ERPTableMapping, ERPTargetField, ERPTargetModel

        self.stdout.write("기존 무효 매핑 마스터 데이터 삭제 중...")
        fm = ERPFieldMapping.objects.all().count()
        tm = ERPTableMapping.objects.all().count()
        tf = ERPTargetField.objects.all().count()
        tgt = ERPTargetModel.objects.all().count()
        ERPFieldMapping.objects.all().delete()
        ERPTableMapping.objects.all().delete()
        ERPTargetField.objects.all().delete()
        ERPTargetModel.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(
            f"  삭제 완료: ERPFieldMapping {fm}건, ERPTableMapping {tm}건, "
            f"ERPTargetField {tf}건, ERPTargetModel {tgt}건"
        ))

    def _connect_mssql(self):
        try:
            import pyodbc
        except ImportError:
            raise CommandError("pyodbc가 설치되어 있지 않습니다: pip install pyodbc")

        from erp_sync.models import ERPConnectionConfigModel

        try:
            config = ERPConnectionConfigModel.objects.get(source_code="LOCAL_BACKUP")
        except ERPConnectionConfigModel.DoesNotExist:
            raise CommandError("LOCAL_BACKUP 연결 설정이 없습니다.")

        if config.source_type != "mssql":
            raise CommandError(
                f"LOCAL_BACKUP이 mssql 타입이 아닙니다(현재: {config.source_type}). "
                "실제 YH 백업을 복원한 MSSQL 컨테이너로 설정을 바꾼 뒤 다시 실행하세요."
            )

        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={config.host},{config.port or 1433};"
            f"DATABASE={config.database_name};"
            f"UID={config.username};"
            f"PWD={config.password};"
        )
        return pyodbc.connect(conn_str, timeout=config.connection_timeout or 10).cursor()

    def _rebuild_source_catalog(self, cursor):
        """실제 MSSQL에서 라이브로 컬럼 정의를 조회해 ERPTableDefinition/ERPFieldDefinition을 갱신"""
        from erp_sync.models import ERPSource, ERPTableDefinition, ERPFieldDefinition

        self.stdout.write("소스 테이블 카탈로그(실측 MSSQL 조회) 재구축 중...")
        erp_source, _ = ERPSource.objects.get_or_create(
            source_code="YH",
            defaults={"source_name": "YH 원격 DB", "source_type": "mssql"},
        )

        table_defs = {}
        for table_name, (module_code, comment) in SOURCE_TABLES.items():
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]

            table_def, _ = ERPTableDefinition.objects.update_or_create(
                erp_source=erp_source, source_table_name=table_name,
                defaults={
                    "source_table_comment": comment,
                    "module_code": module_code,
                    "module_name": module_code,
                    "record_count": row_count,
                },
            )
            table_defs[table_name] = table_def

            cursor.execute(
                """
                SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
                """,
                table_name,
            )
            for col_name, data_type, position, is_nullable in cursor.fetchall():
                ERPFieldDefinition.objects.update_or_create(
                    table_definition=table_def, source_field_name=col_name,
                    defaults={
                        "source_field_type": data_type,
                        "is_nullable": (is_nullable == "YES"),
                        "field_position": position,
                    },
                )
            self.stdout.write(f"  {table_name}: {row_count}건, 컬럼 카탈로그 갱신 완료")

        return table_defs

    def _rebuild_target_catalog(self):
        """실제 Django 모델을 introspect해 ERPTargetModel/ERPTargetField를 채운다"""
        from erp_sync.models import ERPTargetModel, ERPTargetField

        self.stdout.write("타겟 모델 카탈로그(실측 Django 모델 introspection) 재구축 중...")
        target_models = {}
        for app_label, model_name, model_type in TARGET_MODELS:
            model = django_apps.get_model(app_label, model_name)
            target_model, _ = ERPTargetModel.objects.update_or_create(
                model_name=model_name,
                defaults={
                    "model_label": model._meta.verbose_name or model_name,
                    "app_label": app_label,
                    "model_type": model_type,
                    "db_table_name": model._meta.db_table,
                    "description": f"실제 Django 모델 {app_label}.{model_name} (자동 introspection)",
                },
            )
            target_models[(app_label, model_name)] = target_model

            field_count = 0
            for f in model._meta.get_fields():
                if not getattr(f, "concrete", False):
                    continue
                field_type = type(f).__name__
                ERPTargetField.objects.update_or_create(
                    target_model=target_model, field_name=f.name,
                    defaults={
                        "field_type": field_type if field_type in dict(ERPTargetField.DJANGO_FIELD_TYPES) else "CharField",
                        "field_label": str(getattr(f, "verbose_name", f.name)),
                        "is_required": not getattr(f, "blank", True) and not getattr(f, "null", True),
                        "is_unique": getattr(f, "unique", False),
                        "max_length": getattr(f, "max_length", None),
                        "decimal_places": getattr(f, "decimal_places", None),
                    },
                )
                field_count += 1
            self.stdout.write(f"  {app_label}.{model_name}: 필드 {field_count}개 등록")

        return target_models

    def _rebuild_table_and_field_mappings(self, source_tables, target_models):
        from erp_sync.models import ERPTableMapping, ERPFieldMapping, ERPFieldDefinition, ERPTargetField

        self.stdout.write("테이블/필드 매핑 재구축 중...")
        tm_count = 0
        fm_count = 0
        for mapping_code, spec in TABLE_MAPPINGS.items():
            source_table_def = source_tables[spec["source_table"]]
            target_model = target_models[spec["target"]]

            table_mapping, _ = ERPTableMapping.objects.update_or_create(
                mapping_code=mapping_code,
                defaults={
                    "source_table": source_table_def,
                    "target_model": target_model,
                    "mapping_name": f"{spec['source_table']} -> {spec['target'][1]}",
                    "description": spec["description"],
                    "sync_priority": spec["priority"],
                    "sync_type": spec["sync_type"],
                    "is_active": True,
                    "custom_query": spec.get("custom_query", ""),
                    "created_by": "rebuild_mapping_master_data",
                },
            )
            tm_count += 1

            for order, (src_field, tgt_field, transform, desc) in enumerate(spec["fields"]):
                try:
                    source_field = ERPFieldDefinition.objects.get(
                        table_definition=source_table_def, source_field_name=src_field
                    )
                except ERPFieldDefinition.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"  건너뜀: {spec['source_table']}.{src_field} 소스 필드 없음"
                    ))
                    continue
                try:
                    target_field = ERPTargetField.objects.get(
                        target_model=target_model, field_name=tgt_field
                    )
                except ERPTargetField.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"  건너뜀: {spec['target'][1]}.{tgt_field} 타겟 필드 없음"
                    ))
                    continue

                ERPFieldMapping.objects.update_or_create(
                    table_mapping=table_mapping, source_field=source_field,
                    defaults={
                        "target_field": target_field,
                        "transform_rule": transform,
                        "transform_expression": desc,
                        "field_order": order,
                    },
                )
                fm_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"  테이블 매핑 {tm_count}건, 필드 매핑 {fm_count}건 생성"
        ))
