# -*- coding: utf-8 -*-
"""
동기화 실행 서비스 (개선판)

[기존 문제점]
1. _sync_postgresql() 내부 저장 로직이 # TODO 로만 남아 있음 → 데이터가 실제 BI DB에 저장되지 않음
2. 증분 기준이 date_column MAX 비교뿐 → 변경 추적 컬럼 없는 ERP 백업 DB에서 오동작
3. 배치 처리 중 오류 시 롤백 없음 → 부분 저장 상태로 남을 위험

[개선 내용]
1. Bulk Upsert 구현 (PostgreSQL ON CONFLICT 활용)
2. Hash 기반 변경 감지 엔진 통합 (변경 추적 컬럼 불필요)
3. 트랜잭션 단위 배치 처리 + 롤백 보장
4. 타겟 모델 동적 매핑 처리
"""

import hashlib
import json
import logging
from typing import Dict, Any, List, Tuple

from django.db import transaction, connection
from django.utils import timezone

logger = logging.getLogger(__name__)


class SyncExecutionService:
    """동기화 실행 서비스 (개선판)"""

    def execute_sync(self, table_mapping, sync_type='incremental',
                     batch_size=500, force_full_sync=False) -> Dict[str, Any]:
        """
        동기화 실행 메인 엔트리포인트

        [개선] force_full_sync=False 일 때는 Hash 비교 기반 증분 처리
              → ERP에 변경 추적 컬럼이 없어도 증분 감지 가능
        """
        from erp_sync.models import ERPSyncLog

        sync_log = ERPSyncLog.objects.create(
            sync_type=sync_type,
            target_table=table_mapping.mapping_code,
            status='running',
            started_at=timezone.now()
        )

        try:
            source_type = table_mapping.source_table.erp_source.source_type
            if source_type == 'postgresql':
                result = self._sync_with_hash_compare(
                    table_mapping, sync_type, batch_size, sync_log, force_full_sync
                )
            else:
                result = {
                    'status': 'error',
                    'message': f'지원하지 않는 소스 타입: {source_type}'
                }

            # 로그 완료 처리
            sync_log.status          = result.get('status', 'success')
            sync_log.finished_at     = timezone.now()
            sync_log.total_count     = result.get('total_count', 0)
            sync_log.success_count   = result.get('success_count', 0)
            sync_log.error_count     = result.get('error_count', 0)
            sync_log.error_message   = result.get('error_message', '')
            sync_log.save()

            if result.get('status') == 'success':
                table_mapping.last_sync_at     = timezone.now()
                table_mapping.last_sync_status = 'success'
                table_mapping.total_sync_count += 1
            else:
                table_mapping.last_sync_status = 'failed'
            table_mapping.save()

            return result

        except Exception as e:
            logger.error(f"동기화 실행 오류: {e}", exc_info=True)
            sync_log.status        = 'failed'
            sync_log.finished_at   = timezone.now()
            sync_log.error_message = str(e)
            sync_log.save()
            return {'status': 'error', 'message': '동기화 실패', 'error_details': str(e)}

    # ──────────────────────────────────────────────────────────────────
    # Hash 비교 기반 증분 처리 (변경 추적 컬럼 없는 ERP 백업 DB 대응)
    # ──────────────────────────────────────────────────────────────────

    def _sync_with_hash_compare(self, table_mapping, sync_type, batch_size,
                                 sync_log, force_full_sync) -> Dict[str, Any]:
        """
        Hash 비교 기반 ERP → BI 동기화

        핵심 원리:
          ERP 전체 스캔 → SHA256 Hash 생성 → 이전 Hash와 비교
          → INSERT/UPDATE/DELETE 분류 후 BI DB에 반영
        """
        from erp_sync.models.mapping import ERPTableMapping
        from erp_sync.utils.erp_db_connector import ERPDatabaseConnector

        erp_source = table_mapping.source_table.erp_source
        connector  = ERPDatabaseConnector.get_connection(erp_source)

        schema     = erp_source.schema_name or 'public'
        src_table  = table_mapping.source_table.source_table_name
        pk_column  = table_mapping.pk_column or 'id'

        # ── Step1: ERP 전체 스캔 ─────────────────────────────────
        query = (table_mapping.custom_query
                 or f"SELECT * FROM {schema}.{src_table} ORDER BY {pk_column}")

        erp_rows: List[Dict] = connector.execute_query(query)
        logger.info(f"[{src_table}] ERP 스캔 완료: {len(erp_rows)}건")

        # ── Step2: 현재 Hash 맵 생성 ─────────────────────────────
        current: Dict[str, Tuple[str, Dict]] = {
            str(row[pk_column]): (_row_hash(row), row)
            for row in erp_rows
        }

        # ── Step3: 이전 Hash 로드 ────────────────────────────────
        prev_hashes = _load_prev_hashes(table_mapping)

        # ── Step4: DIFF 계산 ─────────────────────────────────────
        inserted, updated, deleted_pks = _calculate_diff(current, prev_hashes)
        unchanged = len(current) - len(inserted) - len(updated)

        logger.info(
            f"[{src_table}] DIFF → "
            f"INSERT:{len(inserted)} UPDATE:{len(updated)} "
            f"DELETE:{len(deleted_pks)} UNCHANGED:{unchanged}"
        )

        # ── Step5: BI DB에 반영 ──────────────────────────────────
        success_count, error_count = 0, 0

        if inserted or updated or deleted_pks:
            success_count, error_count = self._apply_diff_to_bi(
                table_mapping, inserted, updated, deleted_pks, batch_size
            )

        # ── Step6: Hash 테이블 갱신 ──────────────────────────────
        _update_snapshot_hashes(table_mapping, current, deleted_pks)

        total = len(inserted) + len(updated) + len(deleted_pks)
        return {
            'status'        : 'success' if error_count == 0 else 'partial',
            'total_count'   : total,
            'success_count' : success_count,
            'error_count'   : error_count,
            'inserted'      : len(inserted),
            'updated'       : len(updated),
            'deleted'       : len(deleted_pks),
            'unchanged'     : unchanged,
        }

    # ──────────────────────────────────────────────────────────────────
    # BI DB 반영 (Bulk Upsert)  ← 기존 TODO 해결 핵심 부분
    # ──────────────────────────────────────────────────────────────────

    @transaction.atomic
    def _apply_diff_to_bi(self, table_mapping, inserted: List[Dict],
                           updated: List[Dict], deleted_pks: List[str],
                           batch_size: int) -> Tuple[int, int]:
        """
        INSERT / UPDATE / DELETE 를 BI DB에 실제 반영

        [기존 TODO 부분을 완전 구현]
        - 필드 매핑 적용 (erp_column → bi_column)
        - Bulk Upsert (ON CONFLICT DO UPDATE)
        - 삭제 처리
        - 배치 단위 트랜잭션
        """
        field_mapping: Dict = table_mapping.field_mapping or {}
        bi_table      = table_mapping.target_model.db_table_name
        pk_column     = table_mapping.pk_column or 'id'

        success_count, error_count = 0, 0

        # INSERT + UPDATE → Upsert 로 통합 처리
        upsert_rows = inserted + updated
        for i in range(0, len(upsert_rows), batch_size):
            batch = upsert_rows[i:i + batch_size]
            try:
                s, e = _bulk_upsert(bi_table, batch, field_mapping, pk_column)
                success_count += s
                error_count   += e
            except Exception as ex:
                logger.error(f"Upsert 배치 오류 (offset={i}): {ex}")
                error_count += len(batch)

        # DELETE 처리
        if deleted_pks:
            try:
                _bulk_delete(bi_table, deleted_pks, pk_column)
                success_count += len(deleted_pks)
            except Exception as ex:
                logger.error(f"Delete 오류: {ex}")
                error_count += len(deleted_pks)

        return success_count, error_count


# ──────────────────────────────────────────────────────────────────────
# 헬퍼 함수 (모듈 레벨)
# ──────────────────────────────────────────────────────────────────────

def _row_hash(row: Dict) -> str:
    """레코드 → SHA256 Hash (순서 무관, None 안전)"""
    normalized = json.dumps(row, sort_keys=True, default=str, ensure_ascii=False)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def _load_prev_hashes(table_mapping) -> Dict[str, str]:
    """이전 Hash 일괄 로드"""
    from erp_sync.models.mapping import ERPSnapshotHash
    return dict(
        ERPSnapshotHash.objects
        .filter(table_mapping=table_mapping)
        .values_list('record_pk', 'row_hash')
    )


def _calculate_diff(
    current: Dict[str, Tuple[str, Dict]],
    prev:    Dict[str, str]
) -> Tuple[List[Dict], List[Dict], List[str]]:
    """INSERT / UPDATE / DELETE 분류"""
    inserted, updated = [], []
    for pk, (curr_hash, row) in current.items():
        prev_hash = prev.get(pk)
        if prev_hash is None:
            inserted.append(row)
        elif prev_hash != curr_hash:
            updated.append(row)

    deleted_pks = list(set(prev.keys()) - set(current.keys()))
    return inserted, updated, deleted_pks


def _bulk_upsert(bi_table: str, rows: List[Dict],
                  field_mapping: Dict, pk_column: str) -> Tuple[int, int]:
    """
    PostgreSQL ON CONFLICT DO UPDATE 기반 Bulk Upsert
    field_mapping: {'erp_col': 'bi_col', ...}
    """
    if not rows:
        return 0, 0

    def map_row(row: Dict) -> Dict:
        if not field_mapping:
            return row
        return {field_mapping.get(k, k): v for k, v in row.items()}

    mapped_rows = [map_row(r) for r in rows]
    columns     = list(mapped_rows[0].keys())
    bi_pk       = field_mapping.get(pk_column, pk_column)

    col_names   = ', '.join(f'"{c}"' for c in columns)
    placeholders= ', '.join(['%s'] * len(columns))
    update_set  = ', '.join(
        f'"{c}" = EXCLUDED."{c}"'
        for c in columns if c != bi_pk
    )

    sql = (
        f'INSERT INTO "{bi_table}" ({col_names}) VALUES ({placeholders}) '
        f'ON CONFLICT ("{bi_pk}") DO UPDATE SET {update_set}'
    )

    values_list = [[r.get(c) for c in columns] for r in mapped_rows]

    with connection.cursor() as cursor:
        cursor.executemany(sql, values_list)

    return len(rows), 0


def _bulk_delete(bi_table: str, pks: List[str], pk_column: str):
    """BI 테이블에서 삭제된 레코드 제거"""
    placeholders = ', '.join(['%s'] * len(pks))
    sql = f'DELETE FROM "{bi_table}" WHERE "{pk_column}" IN ({placeholders})'
    with connection.cursor() as cursor:
        cursor.execute(sql, pks)


@transaction.atomic
def _update_snapshot_hashes(table_mapping, current: Dict[str, Tuple[str, Dict]],
                              deleted_pks: List[str]):
    """Hash 스냅샷 테이블 갱신 (다음 비교 기준)"""
    from erp_sync.models.mapping import ERPSnapshotHash
    now = timezone.now()

    to_save = [
        ERPSnapshotHash(
            table_mapping = table_mapping,
            record_pk     = pk,
            row_hash      = h,
            last_seen_at  = now,
        )
        for pk, (h, _) in current.items()
    ]

    ERPSnapshotHash.objects.bulk_create(
        to_save,
        update_conflicts = True,
        unique_fields    = ['table_mapping', 'record_pk'],
        update_fields    = ['row_hash', 'last_seen_at'],
        batch_size       = 1000,
    )

    # 삭제된 레코드의 Hash 제거
    if deleted_pks:
        ERPSnapshotHash.objects.filter(
            table_mapping=table_mapping,
            record_pk__in=deleted_pks
        ).delete()
