from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class HourlyProduction(models.Model):
    """시간당 생산량"""
    production_date = models.DateField('생산일자')
    hour = models.IntegerField('시간', validators=[MinValueValidator(0), MaxValueValidator(23)])

    line_id = models.CharField('라인 ID', max_length=50)
    line_name = models.CharField('라인명', max_length=100)
    target_output = models.IntegerField('목표 생산량', default=0)
    actual_output = models.IntegerField('실제 생산량', default=0)
    achievement_rate = models.DecimalField('달성률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_hourly_production'
        verbose_name = '시간당 생산량'
        verbose_name_plural = '시간당 생산량'
        ordering = ['-production_date', '-hour']

    def __str__(self):
        return f"{self.line_name} - {self.production_date} {self.hour}시"


class LineUtilization(models.Model):
    """라인 가동률"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    line_id = models.CharField('라인 ID', max_length=50)
    line_name = models.CharField('라인명', max_length=100)
    planned_time = models.DecimalField('계획 가동시간 (시간)', max_digits=10, decimal_places=2, default=0)
    actual_time = models.DecimalField('실제 가동시간 (시간)', max_digits=10, decimal_places=2, default=0)
    downtime = models.DecimalField('정지시간 (시간)', max_digits=10, decimal_places=2, default=0)
    utilization_rate = models.DecimalField('가동률 (%)', max_digits=5, decimal_places=2, default=0)
    target_rate = models.DecimalField('목표 가동률 (%)', max_digits=5, decimal_places=2, default=90)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_line_utilization'
        verbose_name = '라인 가동률'
        verbose_name_plural = '라인 가동률'
        ordering = ['-fiscal_year', '-fiscal_month', '-utilization_rate']

    def __str__(self):
        return f"{self.line_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class WorkerProductivity(models.Model):
    """작업자 생산성"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    worker_id = models.CharField('작업자 ID', max_length=50)
    worker_name = models.CharField('작업자명', max_length=100)
    department = models.CharField('부서', max_length=100)
    work_hours = models.DecimalField('근무시간', max_digits=10, decimal_places=2, default=0)
    output_quantity = models.IntegerField('생산량', default=0)
    productivity = models.DecimalField('생산성 (개/시간)', max_digits=10, decimal_places=2, default=0)
    target_productivity = models.DecimalField('목표 생산성', max_digits=10, decimal_places=2, default=0)
    achievement_rate = models.DecimalField('달성률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_worker'
        verbose_name = '작업자 생산성'
        verbose_name_plural = '작업자 생산성'
        ordering = ['-fiscal_year', '-fiscal_month', '-productivity']

    def __str__(self):
        return f"{self.worker_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class OEEComponent(models.Model):
    """OEE 구성요소"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    line_id = models.CharField('라인 ID', max_length=50)
    line_name = models.CharField('라인명', max_length=100)

    availability = models.DecimalField('가용성 (%)', max_digits=5, decimal_places=2, default=0)
    availability_target = models.DecimalField('가용성 목표 (%)', max_digits=5, decimal_places=2, default=90)
    performance = models.DecimalField('성능 (%)', max_digits=5, decimal_places=2, default=0)
    performance_target = models.DecimalField('성능 목표 (%)', max_digits=5, decimal_places=2, default=95)
    quality_rate = models.DecimalField('품질률 (%)', max_digits=5, decimal_places=2, default=0)
    quality_target = models.DecimalField('품질 목표 (%)', max_digits=5, decimal_places=2, default=99)
    oee = models.DecimalField('OEE (%)', max_digits=5, decimal_places=2, default=0)
    oee_target = models.DecimalField('OEE 목표 (%)', max_digits=5, decimal_places=2, default=85)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_oee_component'
        verbose_name = 'OEE 구성요소'
        verbose_name_plural = 'OEE 구성요소'
        ordering = ['-fiscal_year', '-fiscal_month', '-oee']

    def __str__(self):
        return f"{self.line_name} OEE - {self.fiscal_year}년 {self.fiscal_month}월"


class ProductionEfficiency(models.Model):
    """생산 효율"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    category = models.CharField('구분', max_length=100)
    target_value = models.DecimalField('목표값', max_digits=15, decimal_places=2, default=0)
    actual_value = models.DecimalField('실적값', max_digits=15, decimal_places=2, default=0)
    efficiency = models.DecimalField('효율 (%)', max_digits=5, decimal_places=2, default=0)
    unit = models.CharField('단위', max_length=50, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_efficiency'
        verbose_name = '생산 효율'
        verbose_name_plural = '생산 효율'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.category} - {self.fiscal_year}년 {self.fiscal_month}월"


class DailyProductionSummary(models.Model):
    """일일 생산 요약"""
    production_date = models.DateField('생산일자', unique=True)

    total_target = models.IntegerField('총 목표 생산량', default=0)
    total_actual = models.IntegerField('총 실제 생산량', default=0)
    total_defects = models.IntegerField('총 불량 수', default=0)
    overall_efficiency = models.DecimalField('전체 효율 (%)', max_digits=5, decimal_places=2, default=0)
    defect_rate = models.DecimalField('불량률 (%)', max_digits=5, decimal_places=2, default=0)
    active_lines = models.IntegerField('가동 라인 수', default=0)
    total_workers = models.IntegerField('총 작업자 수', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'productivity_daily_summary'
        verbose_name = '일일 생산 요약'
        verbose_name_plural = '일일 생산 요약'
        ordering = ['-production_date']

    def __str__(self):
        return f"일일 생산 요약 - {self.production_date}"
