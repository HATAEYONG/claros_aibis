from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class WorkshopStatus(models.Model):
    """작업장 현황"""
    STATUS_CHOICES = [
        ('running', '가동중'),
        ('idle', '대기'),
        ('maintenance', '정비중'),
        ('stopped', '중지'),
    ]

    workshop_id = models.CharField('작업장 ID', max_length=50, unique=True)
    workshop_name = models.CharField('작업장명', max_length=100)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='idle')
    current_product = models.CharField('현재 생산품', max_length=200, blank=True)
    operator_count = models.IntegerField('작업자 수', default=0)
    target_output = models.IntegerField('목표 생산량', default=0)
    actual_output = models.IntegerField('실제 생산량', default=0)
    efficiency = models.DecimalField('효율 (%)', max_digits=5, decimal_places=2, default=0)

    last_updated = models.DateTimeField('최종 갱신', auto_now=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'manufacturing_workshop_status'
        verbose_name = '작업장 현황'
        verbose_name_plural = '작업장 현황'
        ordering = ['workshop_id']

    def __str__(self):
        return f"{self.workshop_id} - {self.workshop_name}"


class CycleTime(models.Model):
    """사이클 타임"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    process_name = models.CharField('공정명', max_length=100)
    standard_time = models.DecimalField('표준 시간 (초)', max_digits=10, decimal_places=2, default=0)
    actual_time = models.DecimalField('실제 시간 (초)', max_digits=10, decimal_places=2, default=0)
    variance = models.DecimalField('편차 (초)', max_digits=10, decimal_places=2, default=0)
    variance_rate = models.DecimalField('편차율 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'manufacturing_cycle_time'
        verbose_name = '사이클 타임'
        verbose_name_plural = '사이클 타임'
        ordering = ['-fiscal_year', '-fiscal_month', 'process_name']

    def __str__(self):
        return f"{self.process_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class OEEMetric(models.Model):
    """OEE 지표 (설비종합효율)"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    equipment_id = models.CharField('설비 ID', max_length=50)
    equipment_name = models.CharField('설비명', max_length=100)
    availability = models.DecimalField('가동률 (%)', max_digits=5, decimal_places=2, default=0)
    performance = models.DecimalField('성능 (%)', max_digits=5, decimal_places=2, default=0)
    quality = models.DecimalField('품질 (%)', max_digits=5, decimal_places=2, default=0)
    oee = models.DecimalField('OEE (%)', max_digits=5, decimal_places=2, default=0)
    target_oee = models.DecimalField('목표 OEE (%)', max_digits=5, decimal_places=2, default=85)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'manufacturing_oee_metric'
        verbose_name = 'OEE 지표'
        verbose_name_plural = 'OEE 지표'
        ordering = ['-fiscal_year', '-fiscal_month', '-oee']

    def __str__(self):
        return f"{self.equipment_name} OEE - {self.fiscal_year}년 {self.fiscal_month}월"


class ManpowerAllocation(models.Model):
    """인력 배치"""
    SHIFT_CHOICES = [
        ('day', '주간'),
        ('night', '야간'),
        ('swing', '교대'),
    ]

    workshop = models.CharField('작업장', max_length=100)
    shift = models.CharField('근무조', max_length=10, choices=SHIFT_CHOICES, default='day')
    allocated_workers = models.IntegerField('배정 인원', default=0)
    present_workers = models.IntegerField('출근 인원', default=0)
    absent_workers = models.IntegerField('결근 인원', default=0)
    overtime_workers = models.IntegerField('잔업 인원', default=0)
    attendance_rate = models.DecimalField('출근률 (%)', max_digits=5, decimal_places=2, default=0)

    date = models.DateField('날짜')
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'manufacturing_manpower_allocation'
        verbose_name = '인력 배치'
        verbose_name_plural = '인력 배치'
        ordering = ['-date', 'workshop']

    def __str__(self):
        return f"{self.workshop} - {self.date} ({self.get_shift_display()})"


class WorkStandard(models.Model):
    """작업 표준"""
    STATUS_CHOICES = [
        ('active', '적용중'),
        ('draft', '초안'),
        ('obsolete', '폐기'),
    ]

    standard_id = models.CharField('표준 ID', max_length=50, unique=True)
    title = models.CharField('제목', max_length=200)
    process = models.CharField('공정', max_length=100)
    version = models.CharField('버전', max_length=20)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='draft')

    standard_time = models.DecimalField('표준 시간 (분)', max_digits=10, decimal_places=2, default=0)
    required_skill_level = models.CharField('필요 숙련도', max_length=50, blank=True)
    description = models.TextField('설명', blank=True)

    effective_date = models.DateField('시행일', null=True, blank=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'manufacturing_work_standard'
        verbose_name = '작업 표준'
        verbose_name_plural = '작업 표준'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.standard_id} - {self.title}"


class EquipmentDowntime(models.Model):
    """설비 다운타임"""
    REASON_CHOICES = [
        ('breakdown', '고장'),
        ('maintenance', '정비'),
        ('changeover', '품목교체'),
        ('material', '자재대기'),
        ('quality', '품질문제'),
        ('other', '기타'),
    ]

    equipment_id = models.CharField('설비 ID', max_length=50)
    equipment_name = models.CharField('설비명', max_length=100)
    reason = models.CharField('사유', max_length=20, choices=REASON_CHOICES)
    downtime_minutes = models.IntegerField('다운타임 (분)', default=0)
    description = models.TextField('상세 설명', blank=True)

    start_time = models.DateTimeField('시작 시간')
    end_time = models.DateTimeField('종료 시간', null=True, blank=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'manufacturing_equipment_downtime'
        verbose_name = '설비 다운타임'
        verbose_name_plural = '설비 다운타임'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.equipment_name} - {self.get_reason_display()} ({self.downtime_minutes}분)"
