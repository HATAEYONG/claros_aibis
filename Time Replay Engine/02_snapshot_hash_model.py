# -*- coding: utf-8 -*-
"""
ERPSnapshotHash 모델
erp_sync/models/mapping.py 파일 맨 아래에 추가하세요.

[역할]
  ERP 백업 DB(변경 추적 컬럼 없음)에서 변경 감지를 가능하게 하는
  SHA-256 Hash 스냅샷 테이블.
  매 동기화 사이클마다 이전 Hash와 현재 Hash를 비교하여
  INSERT / UPDATE / DELETE를 분류합니다.
"""

from django.db import models
from django.utils import timezone


class ERPSnapshotHash(models.Model):
    """
    ERP 레코드별 Hash 스냅샷
    ─────────────────────────────────────────────────────
    ・ 변경 추적 컬럼(updated_at 등)이 없는 ERP 백업 DB 대응
    ・ 매 sync 사이클에 전체 스캔 → SHA-256 Hash 저장
    ・ 다음 사이클에 Hash 비교로 INSERT/UPDATE/DELETE 판단
    """

    table_mapping = models.ForeignKey(
        'erp_sync.ERPTableMapping',
        on_delete=models.CASCADE,
        related_name='snapshot_hashes',
        verbose_name='테이블 매핑',
        db_index=True,
    )
    record_pk = models.CharField(
        'ERP 레코드 PK',
        max_length=200,
        help_text='ERP 원본 테이블의 PK 값 (문자열 변환)',
    )
    row_hash = models.CharField(
        '행 Hash',
        max_length=64,
        help_text='SHA-256 해시값 (전체 행 직렬화 후 계산)',
    )
    last_seen_at = models.DateTimeField(
        '마지막 확인 시각',
        default=timezone.now,
        db_index=True,
    )
    bi_synced_at = models.DateTimeField(
        'BI 반영 시각',
        null=True,
        blank=True,
    )

    class Meta:
        db_table        = 'erp_snapshot_hash'
        verbose_name    = 'ERP 스냅샷 Hash'
        verbose_name_plural = 'ERP 스냅샷 Hash'
        unique_together = [['table_mapping', 'record_pk']]
        indexes = [
            models.Index(fields=['table_mapping', 'last_seen_at']),
        ]

    def __str__(self):
        return f'{self.table_mapping.mapping_code}:{self.record_pk}'
