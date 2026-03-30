# -*- coding: utf-8 -*-
"""
분석 레이어 모델
KPI (Key Performance Indicator) 및 KRI (Key Risk Indicator) 팩트 데이터
"""
from django.db import models
from django.utils import timezone
import uuid


class KPIDefinition(models.Model):
    """
    KPI 정의
    측정할 KPI의 메타데이터 정의
    """
    KPI_TYPE_CHOICES = [
        ('efficiency', '효율성'),
        ('quality', '품질'),
        ('cost', '원가'),
        ('delivery', '납기'),
        ('safety', '안전'),
        ('financial', '재무'),
        ('productivity', '생산성'),
    ]

    AGGREGATION_CHOICES = [
        ('sum', '합계'),
        ('avg', '평균'),
        ('min', '최소'),
        ('max', '최대'),
        ('count', '개수'),
    ]

    kpi_id = models.AutoField(primary_key=True)
    kpi_code = models.CharField('KPI 코드', max_length=50, unique=True)
    kpi_name = models.CharField('KPI명', max_length=200)
    kpi_name_en = models.CharField('KPI명(영문)', max_length=200, blank=True)

    kpi_type = models.CharField('KPI 유형', max_length=20, choices=KPI_TYPE_CHOICES)
    domain = models.CharField('도메인', max_length=50, help_text='cost, financial, production, quality, sales, hr')

    description = models.TextField('설명', blank=True)

    # 측정 방법
    aggregation_method = models.CharField('집계 방법', max_length=10, choices=AGGREGATION_CHOICES)
    unit = models.CharField('단위', max_length=20, blank=True)

    # 목표 설정
    target_direction = models.CharField('목표 방향', max_length=10, choices=[
        ('high', '높을수록 좋음'),
        ('low', '낮을수록 좋음'),
        ('target', '목표값 근접'),
    ], default='high')

    # 경고 임계값
    threshold_warning = models.DecimalField('경고 임계값', max_digits=18, decimal_places=4, null=True, blank=True)
    threshold_critical = models.DecimalField('위험 임계값', max_digits=18, decimal_places=4, null=True, blank=True)

    # 계산 로직 (선택 사항)
    calculation_logic = models.TextField('계산 로직', blank=True, help_text='SQL 또는 Python 표현식')
    source_tables = models.JSONField('원본 테이블', default=list)

    # 담당 조직
    owner_department = models.ForeignKey(
        'erp_sync.MasterDepartment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='owned_kpis',
        verbose_name='담당 부서'
    )

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'kpi_definition'
        verbose_name = 'KPI 정의'
        verbose_name_plural = 'KPI 정의'
        ordering = ['domain', 'kpi_code']
        indexes = [
            models.Index(fields=['kpi_code']),
            models.Index(fields=['kpi_type']),
            models.Index(fields=['domain']),
        ]

    def __str__(self):
        return f'{self.kpi_code} - {self.kpi_name}'


class KPIFact(models.Model):
    """
    KPI 팩트
    실제 KPI 측정값 (시계열 데이터)
    """
    fact_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    kpi = models.ForeignKey(
        KPIDefinition,
        on_delete=models.CASCADE,
        related_name='facts',
        verbose_name='KPI'
    )

    # 시간 차원
    date = models.DateField('날짜', db_index=True)
    year = models.IntegerField('년', db_index=True)
    quarter = models.IntegerField('분기', db_index=True)
    month = models.IntegerField('월', db_index=True)
    week = models.IntegerField('주', null=True, blank=True)

    # 차원
    plant = models.CharField('공장', max_length=50, blank=True, db_index=True)
    line = models.CharField('라인', max_length=50, blank=True, db_index=True)
    department = models.CharField('부서', max_length=50, blank=True, db_index=True)
    product = models.ForeignKey(
        'erp_sync.MasterProduct',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='kpi_facts',
        verbose_name='제품'
    )
    vendor = models.ForeignKey(
        'erp_sync.MasterVendor',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='kpi_facts',
        verbose_name='공급처'
    )
    customer = models.ForeignKey(
        'erp_sync.MasterCustomer',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='kpi_facts',
        verbose_name='고객사'
    )

    # 측정값
    actual_value = models.DecimalField('실적값', max_digits=18, decimal_places=4)
    target_value = models.DecimalField('목표값', max_digits=18, decimal_places=4, null=True, blank=True)
    baseline_value = models.DecimalField('기준값', max_digits=18, decimal_places=4, null=True, blank=True)

    # 달성도
    achievement_rate = models.DecimalField('달성율(%)', max_digits=10, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField('차이', max_digits=18, decimal_places=4, null=True, blank=True)
    variance_rate = models.DecimalField('차이율(%)', max_digits=10, decimal_places=2, null=True, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=[
        ('good', '양호'),
        ('warning', '주의'),
        ('critical', '위험'),
        ('neutral', '중립'),
    ], default='neutral')

    # 출처
    source_system = models.CharField('출처 시스템', max_length=50, blank=True)
    source_table = models.CharField('출처 테이블', max_length=100, blank=True)

    # 메타데이터
    calculated_at = models.DateTimeField('계산 시각', auto_now_add=True)
    updated_at = models.DateTimeField('수정 시각', auto_now=True)
    metadata = models.JSONField('메타데이터', default=dict)

    class Meta:
        db_table = 'kpi_fact'
        verbose_name = 'KPI 팩트'
        verbose_name_plural = 'KPI 팩트'
        unique_together = [['kpi', 'date', 'plant', 'line', 'product']]
        ordering = ['-date', 'kpi']
        indexes = [
            models.Index(fields=['kpi', 'date']),
            models.Index(fields=['date', 'plant']),
            models.Index(fields=['year', 'month']),
        ]

    def __str__(self):
        return f'{self.kpi.kpi_code} - {self.date}'


class KRIDefinition(models.Model):
    """
    KRI 정의
    측정할 리스크 지표(KRI)의 메타데이터 정의
    """
    KRI_TYPE_CHOICES = [
        ('operational', '운영 리스크'),
        ('financial', '재무 리스크'),
        ('supply_chain', '공급망 리스크'),
        ('quality', '품질 리스크'),
        ('safety', '안전 리스크'),
        ('compliance', '준수 리스크'),
        ('strategic', '전략 리스크'),
    ]

    kri_id = models.AutoField(primary_key=True)
    kri_code = models.CharField('KRI 코드', max_length=50, unique=True)
    kri_name = models.CharField('KRI명', max_length=200)
    kri_name_en = models.CharField('KRI명(영문)', max_length=200, blank=True)

    kri_type = models.CharField('KRI 유형', max_length=20, choices=KRI_TYPE_CHOICES)
    domain = models.CharField('도메인', max_length=50)

    description = models.TextField('설명', blank=True)

    # 측정 방법
    aggregation_method = models.CharField('집계 방법', max_length=10)
    unit = models.CharField('단위', max_length=20, blank=True)

    # 리스크 수준
    risk_level_low = models.DecimalField('낮은 리스크 기준', max_digits=18, decimal_places=4, null=True, blank=True)
    risk_level_medium = models.DecimalField('중간 리스크 기준', max_digits=18, decimal_places=4, null=True, blank=True)
    risk_level_high = models.DecimalField('높은 리스크 기준', max_digits=18, decimal_places=4, null=True, blank=True)

    # 계산 로직
    calculation_logic = models.TextField('계산 로직', blank=True)
    source_tables = models.JSONField('원본 테이블', default=list)

    # 담당 조직
    owner_department = models.ForeignKey(
        'erp_sync.MasterDepartment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='owned_kris',
        verbose_name='담당 부서'
    )

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'kri_definition'
        verbose_name = 'KRI 정의'
        verbose_name_plural = 'KRI 정의'
        ordering = ['domain', 'kri_code']
        indexes = [
            models.Index(fields=['kri_code']),
            models.Index(fields=['kri_type']),
            models.Index(fields=['domain']),
        ]

    def __str__(self):
        return f'{self.kri_code} - {self.kri_name}'


class KRIFact(models.Model):
    """
    KRI 팩트
    실제 KRI 측정값 (시계열 데이터)
    """
    fact_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    kri = models.ForeignKey(
        KRIDefinition,
        on_delete=models.CASCADE,
        related_name='facts',
        verbose_name='KRI'
    )

    # 시간 차원
    date = models.DateField('날짜', db_index=True)
    year = models.IntegerField('년', db_index=True)
    quarter = models.IntegerField('분기', db_index=True)
    month = models.IntegerField('월', db_index=True)

    # 차원
    plant = models.CharField('공장', max_length=50, blank=True, db_index=True)
    line = models.CharField('라인', max_length=50, blank=True, db_index=True)
    department = models.CharField('부서', max_length=50, blank=True, db_index=True)
    vendor = models.ForeignKey(
        'erp_sync.MasterVendor',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='kri_facts',
        verbose_name='공급처'
    )

    # 측정값
    actual_value = models.DecimalField('실제값', max_digits=18, decimal_places=4)

    # 리스크 수준 평가
    risk_level = models.CharField('리스크 수준', max_length=20, choices=[
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
        ('critical', '매우높음'),
    ], default='low')

    risk_score = models.DecimalField('리스크 점수', max_digits=5, decimal_places=2, null=True, blank=True)

    # 상세
    description = models.TextField('설명', blank=True)

    # 출처
    source_system = models.CharField('출처 시스템', max_length=50, blank=True)
    source_table = models.CharField('출처 테이블', max_length=100, blank=True)

    # 메타데이터
    calculated_at = models.DateTimeField('계산 시각', auto_now_add=True)
    updated_at = models.DateTimeField('수정 시각', auto_now=True)
    metadata = models.JSONField('메타데이터', default=dict)

    class Meta:
        db_table = 'kri_fact'
        verbose_name = 'KRI 팩트'
        verbose_name_plural = 'KRI 팩트'
        unique_together = [['kri', 'date', 'plant', 'line', 'vendor']]
        ordering = ['-date', 'kri']
        indexes = [
            models.Index(fields=['kri', 'date']),
            models.Index(fields=['date', 'plant']),
            models.Index(fields=['year', 'month']),
        ]

    def __str__(self):
        return f'{self.kri.kri_code} - {self.date} ({self.risk_level})'
