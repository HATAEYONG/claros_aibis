# -*- coding: utf-8 -*-
"""
Time Replay Engine
apps/time_replay/engine.py

[역할]
  과거 ERP 백업 데이터 → 현재 시간 기준 실시간 증분 주입
  ─────────────────────────────────────────────────────────
  ERP DB가 과거 백업 데이터이고 현재일 기준 신규 데이터가 없으므로,
  Time Replay Engine이 과거 데이터를 현재 시간으로 재매핑하여
  BI 대시보드에서 실시간 증분 분석이 가능하도록 합니다.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

from django.db import connections, transaction
from django.utils import timezone

from .models import ReplaySession, ReplayTableConfig

logger = logging.getLogger(__name__)


class TimeReplayEngine:
    """
    과거 ERP 데이터 → 현재 시간 기준 실시간 증분 주입 엔진

    [핵심 원리]
      1. 과거 시간축을 현재로 선형 변환
         source_dt → replay_start_at + (source_dt - source_from) / speed_factor
      2. chunk_minutes 단위로 슬라이스하여 순차 주입
      3. 타임스탬프 재매핑으로 BI 대시보드에서 '현재 시각'으로 표시
    """

    def __init__(self, session: ReplaySession):
        self.session = session

    # ─────────────────────────────────────────────────────
    # 청크 데이터 추출
    # ─────────────────────────────────────────────────────

    def get_next_chunk(self, table_config: ReplayTableConfig) -> List[Dict]:
        """
        현재 재생 시점 기준으로 다음 처리할 과거 데이터 청크 반환

        [처리 범위]
          last_replayed_source_time ~ 현재 재생 중인 과거 시점
        """
        now_source = self.session.get_current_replay_source_time()
        from_time  = (
            table_config.last_replayed_source_time
            or self.session.source_date_from
        )
        to_time    = min(now_source, self.session.source_date_to)

        if from_time >= to_time:
            return []   # 이미 최신 상태 또는 재생 완료

        return self._fetch_erp_slice(
            table_config.table_mapping,
            from_time,
            to_time,
        )

    def _fetch_erp_slice(
        self,
        table_mapping,
        from_dt: datetime,
        to_dt: datetime,
    ) -> List[Dict]:
        """
        ERP 백업 DB에서 특정 시간 범위의 데이터 슬라이스 추출

        [주의]
          ERP DB는 읽기 전용 백업 DB이므로 erp_readonly 별칭 사용
          settings.py DATABASES에 erp_readonly 추가 필요 (설정 가이드 참조)
        """
        date_col  = self.session.source_date_col
        schema    = table_mapping.source_table.erp_source.schema_name or 'public'
        src_table = table_mapping.source_table.source_table_name

        # erp_readonly DB 별칭이 없으면 default 사용 (개발 환경)
        db_alias = 'erp_readonly' if _db_alias_exists('erp_readonly') else 'default'

        with connections[db_alias].cursor() as cursor:
            cursor.execute(
                f"""
                SELECT *
                FROM   "{schema}"."{src_table}"
                WHERE  "{date_col}" > %s
                  AND  "{date_col}" <= %s
                ORDER  BY "{date_col}" ASC
                """,
                [from_dt, to_dt],
            )
            cols = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        return [dict(zip(cols, row)) for row in rows]

    # ─────────────────────────────────────────────────────
    # 타임스탬프 재매핑
    # ─────────────────────────────────────────────────────

    def remap_timestamps(self, records: List[Dict]) -> List[Dict]:
        """
        과거 타임스탬프 → 현재 시간으로 변환

        [목적]
          BI 대시보드에서 '현재 시간' 기준으로 표시되도록
          날짜/시간 관련 모든 컬럼의 값을 선형 변환합니다.

        [변환 대상 컬럼]
          컬럼명에 'date', 'time', 'dt', '_at' 포함 → 모두 변환
        """
        date_col = self.session.source_date_col
        remapped = []

        for record in records:
            r = record.copy()
            for col_name, val in r.items():
                if val is None or not isinstance(val, datetime):
                    continue
                # 날짜/시간 컬럼 판별
                low = col_name.lower()
                if any(kw in low for kw in ('date', 'time', 'dt', '_at', 'cdt', 'mdt')):
                    r[col_name] = self.session.source_to_real_time(val)
            remapped.append(r)

        return remapped

    # ─────────────────────────────────────────────────────
    # BI DB 주입
    # ─────────────────────────────────────────────────────

    @transaction.atomic
    def inject_to_bi(
        self,
        table_config: ReplayTableConfig,
        records: List[Dict],
    ) -> int:
        """
        변환된 레코드를 BI DB에 Bulk Upsert

        [처리 순서]
          1. 타임스탬프 재매핑 (과거 → 현재)
          2. 필드 매핑 변환 (ERP 컬럼 → BI 컬럼)
          3. BI DB Bulk Upsert (ON CONFLICT DO UPDATE)
          4. 재생 진행 상태 갱신
        """
        if not records:
            return 0

        from erp_sync.utils.erp_db_connector import _bulk_upsert  # 개선된 sync_execution_service 의존

        # 1. 타임스탬프 재매핑
        remapped = self.remap_timestamps(records)

        # 2. 필드 매핑 적용
        field_mapping: Dict = {}
        for fm in table_config.table_mapping.field_mappings.filter(is_active=True):
            field_mapping[fm.source_field.source_field_name] = fm.target_field.field_name

        if field_mapping:
            mapped = [{field_mapping.get(k, k): v for k, v in r.items()} for r in remapped]
        else:
            mapped = remapped

        # 3. BI DB Upsert
        bi_table  = table_config.table_mapping.target_model.db_table_name
        pk_column = table_config.table_mapping.pk_column or 'id'

        from erp_sync.services.sync_execution_service import _bulk_upsert
        saved, _ = _bulk_upsert(bi_table, mapped, {}, pk_column)

        # 4. 진행 상태 갱신
        last_src = max(r[self.session.source_date_col] for r in records)
        table_config.last_replayed_source_time = last_src
        table_config.injected_count           += saved
        table_config.save(update_fields=['last_replayed_source_time', 'injected_count'])

        return saved


# ─────────────────────────────────────────────────────────────
# 유틸리티
# ─────────────────────────────────────────────────────────────

def _db_alias_exists(alias: str) -> bool:
    """Django DATABASES 설정에 DB 별칭이 존재하는지 확인"""
    from django.conf import settings
    return alias in settings.DATABASES
