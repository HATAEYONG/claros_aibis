from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class BudgetActual(models.Model):
    """예산 vs 실적"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    category = models.CharField('구분', max_length=100)
    budget = models.DecimalField('예산 (억원)', max_digits=15, decimal_places=2, default=0)
    actual = models.DecimalField('실적 (억원)', max_digits=15, decimal_places=2, default=0)
    variance = models.DecimalField('차이 (억원)', max_digits=15, decimal_places=2, default=0)
    variance_rate = models.DecimalField('차이율 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_budget_actual'
        verbose_name = '예산 vs 실적'
        verbose_name_plural = '예산 vs 실적'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.category} - {self.fiscal_year}년 {self.fiscal_month}월"


class DepartmentProfitability(models.Model):
    """부서별 수익성"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    department = models.CharField('부서', max_length=100)
    revenue = models.DecimalField('매출 (억원)', max_digits=15, decimal_places=2, default=0)
    cost = models.DecimalField('비용 (억원)', max_digits=15, decimal_places=2, default=0)
    profit = models.DecimalField('이익 (억원)', max_digits=15, decimal_places=2, default=0)
    margin = models.DecimalField('수익률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_department_profitability'
        verbose_name = '부서별 수익성'
        verbose_name_plural = '부서별 수익성'
        ordering = ['-fiscal_year', '-fiscal_month', '-profit']

    def __str__(self):
        return f"{self.department} - {self.fiscal_year}년 {self.fiscal_month}월"


class KPIPerformance(models.Model):
    """KPI 성과"""
    STATUS_CHOICES = [
        ('achieved', '달성'),
        ('on-track', '진행중'),
        ('at-risk', '위험'),
        ('missed', '미달'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    kpi_name = models.CharField('KPI명', max_length=200)
    target = models.DecimalField('목표', max_digits=15, decimal_places=2, default=0)
    actual = models.DecimalField('실적', max_digits=15, decimal_places=2, default=0)
    achievement_rate = models.DecimalField('달성률 (%)', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='on-track')
    unit = models.CharField('단위', max_length=50, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_kpi_performance'
        verbose_name = 'KPI 성과'
        verbose_name_plural = 'KPI 성과'
        ordering = ['-fiscal_year', '-fiscal_month', '-achievement_rate']

    def __str__(self):
        return f"{self.kpi_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class FinancialRatioAnalysis(models.Model):
    """재무비율 분석"""
    CATEGORY_CHOICES = [
        ('profitability', '수익성'),
        ('stability', '안정성'),
        ('activity', '활동성'),
        ('growth', '성장성'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    ratio_name = models.CharField('비율명', max_length=100)
    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    value = models.DecimalField('값 (%)', max_digits=10, decimal_places=2, default=0)
    industry_avg = models.DecimalField('업계평균 (%)', max_digits=10, decimal_places=2, default=0)
    target = models.DecimalField('목표 (%)', max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_financial_ratio'
        verbose_name = '재무비율 분석'
        verbose_name_plural = '재무비율 분석'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.ratio_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class BudgetAllocation(models.Model):
    """예산 배분"""
    fiscal_year = models.IntegerField('회계연도')

    department = models.CharField('부서', max_length=100)
    allocated_budget = models.DecimalField('배정 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    used_budget = models.DecimalField('사용 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    remaining_budget = models.DecimalField('잔여 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    usage_rate = models.DecimalField('사용률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_budget_allocation'
        verbose_name = '예산 배분'
        verbose_name_plural = '예산 배분'
        ordering = ['-fiscal_year', '-allocated_budget']
        unique_together = ['fiscal_year', 'department']

    def __str__(self):
        return f"{self.department} - {self.fiscal_year}년"


class InvestmentROI(models.Model):
    """투자 ROI"""
    STATUS_CHOICES = [
        ('planned', '계획'),
        ('in-progress', '진행중'),
        ('completed', '완료'),
    ]

    project_name = models.CharField('프로젝트명', max_length=200)
    investment_amount = models.DecimalField('투자금액 (억원)', max_digits=15, decimal_places=2, default=0)
    expected_return = models.DecimalField('예상 수익 (억원)', max_digits=15, decimal_places=2, default=0)
    actual_return = models.DecimalField('실제 수익 (억원)', max_digits=15, decimal_places=2, default=0)
    roi = models.DecimalField('ROI (%)', max_digits=10, decimal_places=2, default=0)
    payback_period = models.DecimalField('회수기간 (개월)', max_digits=5, decimal_places=1, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planned')

    start_date = models.DateField('시작일', null=True, blank=True)
    end_date = models.DateField('종료일', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'accounting_investment_roi'
        verbose_name = '투자 ROI'
        verbose_name_plural = '투자 ROI'
        ordering = ['-created_at']

    def __str__(self):
        return self.project_name
