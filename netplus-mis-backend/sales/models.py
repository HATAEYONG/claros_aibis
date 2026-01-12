from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class MonthlySales(models.Model):
    """월별 매출 데이터"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    target_amount = models.DecimalField('목표 매출', max_digits=15, decimal_places=2, default=0)
    actual_amount = models.DecimalField('실제 매출', max_digits=15, decimal_places=2, default=0)
    achievement_rate = models.DecimalField('달성률 (%)', max_digits=5, decimal_places=2, default=0)

    new_customers = models.IntegerField('신규 거래처', default=0)
    contract_rate = models.DecimalField('계약 성사율 (%)', max_digits=5, decimal_places=2, default=0)
    pipeline_value = models.DecimalField('파이프라인 금액', max_digits=15, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_monthly'
        verbose_name = '월별 매출'
        verbose_name_plural = '월별 매출'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"매출 - {self.fiscal_year}년 {self.fiscal_month}월"


class ProductSales(models.Model):
    """제품별 매출"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    product_code = models.CharField('제품코드', max_length=50)
    product_name = models.CharField('제품명', max_length=200)
    sales_amount = models.DecimalField('매출액', max_digits=15, decimal_places=2, default=0)
    sales_quantity = models.IntegerField('판매수량', default=0)
    share_rate = models.DecimalField('비중 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_product'
        verbose_name = '제품별 매출'
        verbose_name_plural = '제품별 매출'
        ordering = ['-fiscal_year', '-fiscal_month', '-sales_amount']

    def __str__(self):
        return f"{self.product_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class CustomerTier(models.Model):
    """고객 등급별 매출"""
    TIER_CHOICES = [
        ('VIP', 'VIP'),
        ('Gold', 'Gold'),
        ('Silver', 'Silver'),
        ('Bronze', 'Bronze'),
        ('New', 'New'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    tier = models.CharField('등급', max_length=20, choices=TIER_CHOICES)
    customer_count = models.IntegerField('고객수', default=0)
    sales_amount = models.DecimalField('매출액', max_digits=15, decimal_places=2, default=0)
    share_rate = models.DecimalField('비중 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_customer_tier'
        verbose_name = '고객등급별 매출'
        verbose_name_plural = '고객등급별 매출'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.tier} - {self.fiscal_year}년 {self.fiscal_month}월"


class SalesPipeline(models.Model):
    """영업 파이프라인"""
    STAGE_CHOICES = [
        ('lead', '신규 리드'),
        ('contact', '상담 중'),
        ('proposal', '제안 제출'),
        ('negotiation', '협상 중'),
        ('closing', '계약 임박'),
    ]

    stage = models.CharField('단계', max_length=20, choices=STAGE_CHOICES)
    opportunity_count = models.IntegerField('기회 건수', default=0)
    total_value = models.DecimalField('총 금액', max_digits=15, decimal_places=2, default=0)
    conversion_rate = models.DecimalField('전환율 (%)', max_digits=5, decimal_places=2, default=0)

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_pipeline'
        verbose_name = '영업 파이프라인'
        verbose_name_plural = '영업 파이프라인'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.get_stage_display()} - {self.fiscal_year}년 {self.fiscal_month}월"


class SalesTeamPerformance(models.Model):
    """영업팀 성과"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    salesperson_name = models.CharField('영업사원명', max_length=100)
    target_amount = models.DecimalField('목표', max_digits=15, decimal_places=2, default=0)
    actual_amount = models.DecimalField('실적', max_digits=15, decimal_places=2, default=0)
    deal_count = models.IntegerField('계약 건수', default=0)
    conversion_rate = models.DecimalField('성사율 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_team_performance'
        verbose_name = '영업팀 성과'
        verbose_name_plural = '영업팀 성과'
        ordering = ['-fiscal_year', '-fiscal_month', '-actual_amount']

    def __str__(self):
        return f"{self.salesperson_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class TopCustomer(models.Model):
    """주요 거래처"""
    STATUS_CHOICES = [
        ('active', '활성'),
        ('warning', '주의'),
        ('hot', 'HOT'),
        ('inactive', '비활성'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    customer_code = models.CharField('거래처코드', max_length=50)
    customer_name = models.CharField('거래처명', max_length=200)
    revenue = models.DecimalField('매출액', max_digits=15, decimal_places=2, default=0)
    growth_rate = models.DecimalField('성장률 (%)', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='active')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'sales_top_customer'
        verbose_name = '주요 거래처'
        verbose_name_plural = '주요 거래처'
        ordering = ['-fiscal_year', '-fiscal_month', '-revenue']

    def __str__(self):
        return f"{self.customer_name} - {self.fiscal_year}년 {self.fiscal_month}월"
