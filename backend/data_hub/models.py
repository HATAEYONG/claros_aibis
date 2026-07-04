# -*- coding: utf-8 -*-
"""
Data Hub 데이터 모델
데이터 통합 계층 - 수집, 정규화, 마트 관리
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class DataSource(models.Model):
    """데이터 소스 정의"""
    SOURCE_TYPE_CHOICES = [
        ('mssql', 'MS SQL Server'),
        ('postgresql', 'PostgreSQL'),
        ('api', 'REST API'),
        ('file', 'File'),
        ('oracle', 'Oracle'),
        ('mysql', 'MySQL'),
    ]

    SYNC_SCHEDULE_CHOICES = [
        ('realtime', 'Realtime (15min)'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('manual', 'Manual'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, verbose_name='데이터 소스명')
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        verbose_name='소스 유형'
    )
    connection_params = models.JSONField(
        verbose_name='연결 파라미터',
        help_text='호스트, 포트, 사용자, 비밀번호, 데이터베이스 등'
    )
    sync_schedule = models.CharField(
        max_length=20,
        choices=SYNC_SCHEDULE_CHOICES,
        default='daily',
        verbose_name='동기화 스케줄'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='상태'
    )
    is_active = models.BooleanField(default=True, verbose_name='활성 여부')
    last_sync_at = models.DateTimeField(null=True, blank=True, verbose_name='마지막 동기화일시')
    last_sync_status = models.CharField(max_length=20, blank=True, verbose_name='마지막 동기화 상태')
    last_sync_message = models.TextField(blank=True, verbose_name='마지막 동기화 메시지')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    # 추가 설정
    batch_size = models.IntegerField(default=1000, verbose_name='배치 사이즈')
    timeout_seconds = models.IntegerField(default=300, verbose_name='타임아웃(초)')
    retry_attempts = models.IntegerField(default=3, verbose_name='재시도 횟수')

    class Meta:
        db_table = 'data_hub_data_source'
        ordering = ['name']
        verbose_name = '데이터 소스'
        verbose_name_plural = '데이터 소스들'

    def __str__(self):
        return f"{self.name} ({self.get_source_type_display()})"


class DataSyncLog(models.Model):
    """데이터 동기화 로그"""
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name='sync_logs',
        verbose_name='데이터 소스'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name='상태')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='시작일시')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='완료일시')
    duration_seconds = models.IntegerField(null=True, blank=True, verbose_name='소요 시간(초)')
    records_processed = models.IntegerField(default=0, verbose_name='처리된 레코드 수')
    records_succeeded = models.IntegerField(default=0, verbose_name='성공한 레코드 수')
    records_failed = models.IntegerField(default=0, verbose_name='실패한 레코드 수')
    error_message = models.TextField(blank=True, verbose_name='에러 메시지')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='메타데이터')

    # 동기화 타입
    sync_type = models.CharField(
        max_length=20,
        default='full',
        verbose_name='동기화 타입',
        help_text='full, incremental, realtime'
    )

    # 테이블별 상세 정보
    tables_synced = models.JSONField(default=list, blank=True, verbose_name='동기화된 테이블')

    class Meta:
        db_table = 'data_hub_sync_log'
        ordering = ['-started_at']
        verbose_name = '동기화 로그'
        verbose_name_plural = '동기화 로그들'

    def __str__(self):
        return f"{self.data_source.name} - {self.status} ({self.started_at})"

    def save(self, *args, **kwargs):
        if self.completed_at and self.started_at:
            from datetime import timedelta
            duration = self.completed_at - self.started_at
            self.duration_seconds = int(duration.total_seconds())
        super().save(*args, **kwargs)


class DataMart(models.Model):
    """데이터 마트 정의"""
    MART_TYPE_CHOICES = [
        ('fact', 'Fact Table'),
        ('dimension', 'Dimension Table'),
        ('aggregate', 'Aggregate Table'),
        ('snapshot', 'Snapshot Table'),
    ]

    REFRESH_SCHEDULE_CHOICES = [
        ('realtime', 'Realtime'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('building', 'Building'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, verbose_name='마트명')
    mart_type = models.CharField(max_length=20, choices=MART_TYPE_CHOICES, verbose_name='마트 유형')
    target_table = models.CharField(max_length=100, verbose_name='대상 테이블명')
    source_query = models.TextField(verbose_name='소스 쿼리')
    refresh_schedule = models.CharField(
        max_length=20,
        choices=REFRESH_SCHEDULE_CHOICES,
        default='daily',
        verbose_name='갱신 스케줄'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='상태'
    )
    is_active = models.BooleanField(default=True, verbose_name='활성 여부')
    last_refresh_at = models.DateTimeField(null=True, blank=True, verbose_name='마지막 갱신일시')
    last_refresh_status = models.CharField(max_length=20, blank=True, verbose_name='마지막 갱신 상태')
    row_count = models.IntegerField(default=0, verbose_name='행 수')
    size_mb = models.FloatField(default=0.0, verbose_name='크기(MB)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    # 마트 정의
    description = models.TextField(blank=True, verbose_name='설명')
    business_domain = models.CharField(max_length=50, blank=True, verbose_name='비즈니스 도메인')
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_marts',
        verbose_name='소유자'
    )

    # 갱신 설정
    depends_on = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        related_name='dependents',
        verbose_name='의존 마트'
    )

    class Meta:
        db_table = 'data_hub_mart'
        ordering = ['name']
        verbose_name = '데이터 마트'
        verbose_name_plural = '데이터 마트들'

    def __str__(self):
        return f"{self.name} ({self.get_mart_type_display()})"


class DataQualityRule(models.Model):
    """데이터 품질 규칙"""
    RULE_TYPE_CHOICES = [
        ('not_null', 'Not Null'),
        ('unique', 'Unique'),
        ('range', 'Range'),
        ('pattern', 'Pattern'),
        ('custom', 'Custom'),
        ('referential', 'Referential'),
        ('completeness', 'Completeness'),
    ]

    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, verbose_name='규칙명')
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES, verbose_name='규칙 유형')
    target_table = models.CharField(max_length=100, verbose_name='대상 테이블')
    target_column = models.CharField(max_length=100, blank=True, verbose_name='대상 컬럼')
    rule_params = models.JSONField(default=dict, blank=True, verbose_name='규칙 파라미터')
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='medium',
        verbose_name='심각도'
    )
    is_active = models.BooleanField(default=True, verbose_name='활성 여부')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    # 규칙 정의
    description = models.TextField(blank=True, verbose_name='설명')
    error_message = models.CharField(max_length=255, blank=True, verbose_name='에러 메시지')

    class Meta:
        db_table = 'data_hub_quality_rule'
        ordering = ['name']
        verbose_name = '데이터 품질 규칙'
        verbose_name_plural = '데이터 품질 규칙들'

    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"


class DataQualityCheck(models.Model):
    """데이터 품질 검사 결과"""
    STATUS_CHOICES = [
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('warning', 'Warning'),
        ('skipped', 'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rule = models.ForeignKey(
        DataQualityRule,
        on_delete=models.CASCADE,
        related_name='checks',
        verbose_name='품질 규칙'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name='상태')
    checked_at = models.DateTimeField(auto_now_add=True, verbose_name='검사일시')
    total_records = models.IntegerField(default=0, verbose_name='전체 레코드 수')
    failed_records = models.IntegerField(default=0, verbose_name='실패한 레코드 수')
    failure_rate = models.FloatField(default=0.0, verbose_name='실패율')
    error_details = models.JSONField(default=list, blank=True, verbose_name='에러 상세')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='메타데이터')

    # 동기화와 연결
    sync_log = models.ForeignKey(
        DataSyncLog,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quality_checks',
        verbose_name='동기화 로그'
    )

    class Meta:
        db_table = 'data_hub_quality_check'
        ordering = ['-checked_at']
        verbose_name = '데이터 품질 검사'
        verbose_name_plural = '데이터 품질 검사들'

    def __str__(self):
        return f"{self.rule.name} - {self.status} ({self.checked_at})"


class DataLineage(models.Model):
    """데이터 계보 (Data Lineage)"""
    ENTITY_TYPE_CHOICES = [
        ('table', 'Table'),
        ('column', 'Column'),
        ('mart', 'Mart'),
        ('report', 'Report'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES, verbose_name='소스 엔티티 유형')
    source_entity = models.CharField(max_length=255, verbose_name='소스 엔티티')
    target_entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES, verbose_name='타겟 엔티티 유형')
    target_entity = models.CharField(max_length=255, verbose_name='타겟 엔티티')
    transformation = models.TextField(blank=True, verbose_name='변환 설명')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')

    class Meta:
        db_table = 'data_hub_lineage'
        ordering = ['-created_at']
        verbose_name = '데이터 계보'
        verbose_name_plural = '데이터 계보들'

    def __str__(self):
        return f"{self.source_entity} -> {self.target_entity}"
