from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class ExecutiveSummary(models.Model):
    """경영진 요약 리포트"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    revenue = models.DecimalField('매출 (억원)', max_digits=15, decimal_places=2, default=0)
    revenue_growth = models.DecimalField('매출 성장률 (%)', max_digits=5, decimal_places=2, default=0)
    operating_profit = models.DecimalField('영업이익 (억원)', max_digits=15, decimal_places=2, default=0)
    operating_margin = models.DecimalField('영업이익률 (%)', max_digits=5, decimal_places=2, default=0)
    net_profit = models.DecimalField('순이익 (억원)', max_digits=15, decimal_places=2, default=0)
    net_margin = models.DecimalField('순이익률 (%)', max_digits=5, decimal_places=2, default=0)

    production_volume = models.IntegerField('생산량', default=0)
    quality_rate = models.DecimalField('품질률 (%)', max_digits=5, decimal_places=2, default=0)
    employee_count = models.IntegerField('직원 수', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_executive_summary'
        verbose_name = '경영진 요약'
        verbose_name_plural = '경영진 요약'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"경영진 요약 - {self.fiscal_year}년 {self.fiscal_month}월"


class DepartmentComparison(models.Model):
    """부서별 비교"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    department = models.CharField('부서', max_length=100)
    revenue = models.DecimalField('매출 (억원)', max_digits=15, decimal_places=2, default=0)
    cost = models.DecimalField('비용 (억원)', max_digits=15, decimal_places=2, default=0)
    profit = models.DecimalField('이익 (억원)', max_digits=15, decimal_places=2, default=0)
    headcount = models.IntegerField('인원', default=0)
    productivity = models.DecimalField('생산성', max_digits=15, decimal_places=2, default=0)
    target_achievement = models.DecimalField('목표 달성률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_department_comparison'
        verbose_name = '부서별 비교'
        verbose_name_plural = '부서별 비교'
        ordering = ['-fiscal_year', '-fiscal_month', '-profit']

    def __str__(self):
        return f"{self.department} - {self.fiscal_year}년 {self.fiscal_month}월"


class KeyMetricSummary(models.Model):
    """주요 지표 요약"""
    TREND_CHOICES = [
        ('up', '상승'),
        ('stable', '유지'),
        ('down', '하락'),
    ]

    STATUS_CHOICES = [
        ('good', '양호'),
        ('warning', '주의'),
        ('critical', '위험'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    metric_name = models.CharField('지표명', max_length=100)
    category = models.CharField('분류', max_length=100)
    current_value = models.DecimalField('현재값', max_digits=15, decimal_places=2, default=0)
    target_value = models.DecimalField('목표값', max_digits=15, decimal_places=2, default=0)
    previous_value = models.DecimalField('전기값', max_digits=15, decimal_places=2, default=0)
    change_rate = models.DecimalField('변동률 (%)', max_digits=5, decimal_places=2, default=0)
    trend = models.CharField('추세', max_length=10, choices=TREND_CHOICES, default='stable')
    status = models.CharField('상태', max_length=10, choices=STATUS_CHOICES, default='good')
    unit = models.CharField('단위', max_length=50, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_key_metric_summary'
        verbose_name = '주요 지표 요약'
        verbose_name_plural = '주요 지표 요약'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.metric_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class RiskOpportunity(models.Model):
    """리스크 및 기회"""
    TYPE_CHOICES = [
        ('risk', '리스크'),
        ('opportunity', '기회'),
    ]

    PRIORITY_CHOICES = [
        ('high', '높음'),
        ('medium', '보통'),
        ('low', '낮음'),
    ]

    STATUS_CHOICES = [
        ('identified', '식별'),
        ('analyzing', '분석중'),
        ('mitigating', '대응중'),
        ('resolved', '해결'),
        ('monitoring', '모니터링'),
    ]

    item_type = models.CharField('유형', max_length=20, choices=TYPE_CHOICES)
    title = models.CharField('제목', max_length=200)
    description = models.TextField('설명')
    category = models.CharField('분류', max_length=100)
    priority = models.CharField('우선순위', max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='identified')

    impact = models.DecimalField('영향도 (억원)', max_digits=15, decimal_places=2, default=0)
    probability = models.DecimalField('발생확률 (%)', max_digits=5, decimal_places=2, default=0)
    response_plan = models.TextField('대응 계획', blank=True)
    owner = models.CharField('담당자', max_length=100)
    due_date = models.DateField('처리 기한', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_risk_opportunity'
        verbose_name = '리스크/기회'
        verbose_name_plural = '리스크/기회'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"[{self.get_item_type_display()}] {self.title}"


class Recommendation(models.Model):
    """권고 사항"""
    PRIORITY_CHOICES = [
        ('high', '높음'),
        ('medium', '보통'),
        ('low', '낮음'),
    ]

    STATUS_CHOICES = [
        ('pending', '검토대기'),
        ('approved', '승인'),
        ('in-progress', '진행중'),
        ('completed', '완료'),
        ('rejected', '반려'),
    ]

    CATEGORY_CHOICES = [
        ('financial', '재무'),
        ('operational', '운영'),
        ('strategic', '전략'),
        ('hr', '인사'),
        ('technology', '기술'),
    ]

    title = models.CharField('제목', max_length=200)
    description = models.TextField('설명')
    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField('우선순위', max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='pending')

    expected_benefit = models.DecimalField('예상 효과 (억원)', max_digits=15, decimal_places=2, default=0)
    required_investment = models.DecimalField('필요 투자 (억원)', max_digits=15, decimal_places=2, default=0)
    roi_estimate = models.DecimalField('예상 ROI (%)', max_digits=5, decimal_places=2, default=0)

    proposed_by = models.CharField('제안자', max_length=100)
    approved_by = models.CharField('승인자', max_length=100, blank=True)
    target_date = models.DateField('목표일', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_recommendation'
        verbose_name = '권고 사항'
        verbose_name_plural = '권고 사항'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"


class MonthlyReport(models.Model):
    """월간 리포트"""
    STATUS_CHOICES = [
        ('draft', '초안'),
        ('review', '검토중'),
        ('approved', '승인'),
        ('published', '발행'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    title = models.CharField('제목', max_length=200)
    summary = models.TextField('요약')
    highlights = models.TextField('주요 성과', blank=True)
    concerns = models.TextField('주요 이슈', blank=True)
    next_month_plan = models.TextField('차월 계획', blank=True)

    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='draft')
    author = models.CharField('작성자', max_length=100)
    reviewer = models.CharField('검토자', max_length=100, blank=True)
    approved_by = models.CharField('승인자', max_length=100, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'reports_monthly'
        verbose_name = '월간 리포트'
        verbose_name_plural = '월간 리포트'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"월간 리포트 - {self.fiscal_year}년 {self.fiscal_month}월"
