# -*- coding: utf-8 -*-
"""
Time Replay 모델
apps/time_replay/models.py

[목적]
  과거 ERP 백업 데이터를 현재 시간 기준으로 재생하여
  BI 대시보드에서 실시간 증분 분석을 시연합니다.

  현재 ERP DB = 과거 백업 데이터 (정적)
  현재일 기준 신규 데이터 없음
  → Time Replay Engine으로 과거 데이터를 "실시간처럼" 주입
"""

from datetime import timedelta, datetime
from django.db import models
from django.utils import timezone


class ReplaySession(models.Model):
    """
    시간 재생 세션
    ─────────────────────────────────────────────
    과거 ERP 데이터를 현재 시간 기준으로 재생하는 설정.
    speed_factor 배수만큼 빠르게 과거 데이터를 현재로 주입합니다.

    예시 (speed_factor=60, 1일치 데이터):
      실제 소요  = 24시간 / 60 = 24분
      5분마다   = 5 × 60 = 300분(5시간)치 과거 데이터 처리
    """

    class Status(models.TextChoices):
        READY    = 'READY',    '준비'
        RUNNING  = 'RUNNING',  '재생중'
        PAUSED   = 'PAUSED',   '일시정지'
        FINISHED = 'FINISHED', '완료'
        ERROR    = 'ERROR',    '오류'

    # ── 기본 정보 ──────────────────────────────────────
    name   = models.CharField('세션명', max_length=100)
    status = models.CharField(
        '상태', max_length=10,
        choices=Status.choices, default=Status.READY
    )

    # ── 과거 데이터 범위 ───────────────────────────────
    source_date_from = models.DateTimeField('과거 데이터 시작일')
    source_date_to   = models.DateTimeField('과거 데이터 종료일')
    source_date_col  = models.CharField(
        '날짜 기준 컬럼명', max_length=100,
        help_text='ERP 테이블의 날짜 컬럼명 (예: cdt, prd_dt, qc_dt)'
    )

    # ── 재생 설정 ──────────────────────────────────────
    replay_start_at = models.DateTimeField(
        '재생 시작 시각 (현재 기준점)',
        default=timezone.now,
    )
    speed_factor = models.IntegerField(
        '재생 속도 배수',
        default=60,
        help_text=(
            '1=실시간, 60=60배속(1일→24분), '
            '1440=1440배속(1년→약6시간)'
        )
    )
    chunk_minutes = models.IntegerField(
        '증분 단위(분)', default=5,
        help_text='한 번에 처리할 과거 데이터 시간 단위'
    )

    # ── 진행 상태 ──────────────────────────────────────
    current_source_time = models.DateTimeField(
        '현재 재생 중인 과거 시점', null=True, blank=True
    )
    total_injected = models.IntegerField('총 주입 건수', default=0)
    error_message  = models.TextField('오류 메시지', blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'replay_session'
        verbose_name    = '시간 재생 세션'
        verbose_name_plural = '시간 재생 세션'
        ordering        = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_status_display()})'

    # ── 핵심 시간 변환 메서드 ───────────────────────────

    def get_current_replay_source_time(self) -> datetime:
        """
        현재 재생 기준 = 과거의 어느 시점까지 처리됐는지 계산

        공식:
          경과_실제_초 = now - replay_start_at
          경과_과거_초 = 경과_실제_초 × speed_factor
          현재_재생_과거_시점 = source_date_from + 경과_과거_초
        """
        elapsed_real_sec    = (timezone.now() - self.replay_start_at).total_seconds()
        elapsed_source_sec  = elapsed_real_sec * self.speed_factor
        current_source      = self.source_date_from + timedelta(seconds=elapsed_source_sec)
        return min(current_source, self.source_date_to)

    def source_to_real_time(self, source_dt: datetime) -> datetime:
        """
        과거 타임스탬프 → 현재 시간으로 선형 변환
        BI 대시보드에서 '현재 시간'으로 표시되도록 처리

        공식:
          과거_오프셋_초 = source_dt - source_date_from
          실제_오프셋_초 = 과거_오프셋_초 / speed_factor
          실제_시각 = replay_start_at + 실제_오프셋_초
        """
        offset_source = (source_dt - self.source_date_from).total_seconds()
        offset_real   = offset_source / self.speed_factor
        return self.replay_start_at + timedelta(seconds=offset_real)

    @property
    def progress_pct(self) -> float:
        """재생 진행률 (0~100)"""
        total = (self.source_date_to - self.source_date_from).total_seconds()
        if total <= 0:
            return 100.0
        done = (
            (self.current_source_time or self.source_date_from) - self.source_date_from
        ).total_seconds()
        return min(100.0, done / total * 100)

    @property
    def estimated_finish_minutes(self) -> float:
        """남은 예상 완료 시간(분)"""
        total_source = (self.source_date_to - self.source_date_from).total_seconds()
        remaining    = total_source * (1 - self.progress_pct / 100)
        return remaining / self.speed_factor / 60


class ReplayTableConfig(models.Model):
    """
    재생 세션별 테이블 설정
    ─────────────────────────────────────────────
    어느 ERP 테이블을 재생할지, 어디까지 재생했는지를 추적합니다.
    """

    session       = models.ForeignKey(
        ReplaySession, on_delete=models.CASCADE,
        related_name='table_configs', verbose_name='세션'
    )
    table_mapping = models.ForeignKey(
        'erp_sync.ERPTableMapping', on_delete=models.CASCADE,
        verbose_name='테이블 매핑'
    )
    last_replayed_source_time = models.DateTimeField(
        '마지막 재생 완료된 과거 시점', null=True, blank=True
    )
    injected_count = models.IntegerField('주입 건수', default=0)

    class Meta:
        db_table        = 'replay_table_config'
        unique_together = [['session', 'table_mapping']]
        verbose_name    = '재생 테이블 설정'

    def __str__(self):
        return f'{self.session.name} - {self.table_mapping.mapping_code}'
