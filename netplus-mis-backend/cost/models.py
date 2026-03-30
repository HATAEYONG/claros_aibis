from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class MonthlyCost(models.Model):
    """월별 원가"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    total_cost = models.DecimalField('총원가 (억원)', max_digits=15, decimal_places=2, default=0)
    unit_cost = models.DecimalField('단위당 원가 (원)', max_digits=12, decimal_places=2, default=0)
    material_cost = models.DecimalField('직접재료비', max_digits=15, decimal_places=2, default=0)
    labor_cost = models.DecimalField('직접노무비', max_digits=15, decimal_places=2, default=0)
    overhead_cost = models.DecimalField('제조경비', max_digits=15, decimal_places=2, default=0)
    selling_admin_cost = models.DecimalField('판매관리비', max_digits=15, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_monthly'
        verbose_name = '월별 원가'
        verbose_name_plural = '월별 원가'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"원가 - {self.fiscal_year}년 {self.fiscal_month}월"


class ProductCost(models.Model):
    """제품별 원가"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    product_code = models.CharField('제품코드', max_length=50)
    product_name = models.CharField('제품명', max_length=200)
    production_volume = models.IntegerField('생산량', default=0)

    material_cost = models.DecimalField('재료비 (원)', max_digits=12, decimal_places=2, default=0)
    labor_cost = models.DecimalField('노무비 (원)', max_digits=12, decimal_places=2, default=0)
    overhead_cost = models.DecimalField('경비 (원)', max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField('총원가 (원)', max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField('판매가 (원)', max_digits=12, decimal_places=2, default=0)
    margin = models.DecimalField('이익 (원)', max_digits=12, decimal_places=2, default=0)
    margin_rate = models.DecimalField('이익률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_product'
        verbose_name = '제품별 원가'
        verbose_name_plural = '제품별 원가'
        ordering = ['-fiscal_year', '-fiscal_month', '-total_cost']

    def __str__(self):
        return f"{self.product_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class CostReductionProject(models.Model):
    """원가 절감 프로젝트"""
    CATEGORY_CHOICES = [
        ('material', '재료비'),
        ('labor', '노무비'),
        ('overhead', '경비'),
    ]

    STATUS_CHOICES = [
        ('planned', '계획'),
        ('in-progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
    ]

    project_id = models.CharField('프로젝트 ID', max_length=50, unique=True)
    title = models.CharField('프로젝트명', max_length=200)
    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)

    target_saving = models.DecimalField('목표 절감액 (억원)', max_digits=10, decimal_places=2, default=0)
    actual_saving = models.DecimalField('실제 절감액 (억원)', max_digits=10, decimal_places=2, default=0)
    progress = models.DecimalField('진척도 (%)', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planned')

    responsible_person = models.CharField('담당자', max_length=100)
    due_date = models.DateField('마감일')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_reduction_project'
        verbose_name = '원가 절감 프로젝트'
        verbose_name_plural = '원가 절감 프로젝트'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_id} - {self.title}"


class CostDriver(models.Model):
    """원가 동인"""
    TREND_CHOICES = [
        ('up', '증가'),
        ('stable', '안정'),
        ('down', '감소'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    driver_name = models.CharField('동인명', max_length=100)
    impact_rate = models.DecimalField('영향도 (%)', max_digits=5, decimal_places=2, default=0)
    change_rate = models.DecimalField('변동률 (%)', max_digits=5, decimal_places=2, default=0)
    trend = models.CharField('추세', max_length=10, choices=TREND_CHOICES, default='stable')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_driver'
        verbose_name = '원가 동인'
        verbose_name_plural = '원가 동인'
        ordering = ['-fiscal_year', '-fiscal_month', '-impact_rate']

    def __str__(self):
        return f"{self.driver_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class BreakEvenAnalysis(models.Model):
    """손익분기점 분석"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    fixed_cost = models.DecimalField('고정비 (억원)', max_digits=15, decimal_places=2, default=0)
    variable_cost_ratio = models.DecimalField('변동비율 (%)', max_digits=5, decimal_places=2, default=0)
    break_even_point = models.DecimalField('손익분기점 (억원)', max_digits=15, decimal_places=2, default=0)
    actual_sales = models.DecimalField('실제 매출 (억원)', max_digits=15, decimal_places=2, default=0)
    margin_of_safety = models.DecimalField('안전마진율 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_break_even'
        verbose_name = '손익분기점 분석'
        verbose_name_plural = '손익분기점 분석'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"손익분기점 - {self.fiscal_year}년 {self.fiscal_month}월"


class CostStructure(models.Model):
    """원가 구조"""
    COST_TYPE_CHOICES = [
        ('direct_material', '직접재료비'),
        ('direct_labor', '직접노무비'),
        ('manufacturing_overhead', '제조경비'),
        ('selling_admin', '판매관리비'),
        ('profit', '이익'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    cost_type = models.CharField('원가 유형', max_length=30, choices=COST_TYPE_CHOICES)
    amount = models.DecimalField('금액 (억원)', max_digits=15, decimal_places=2, default=0)
    ratio = models.DecimalField('비율 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'cost_structure'
        verbose_name = '원가 구조'
        verbose_name_plural = '원가 구조'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.get_cost_type_display()} - {self.fiscal_year}년 {self.fiscal_month}월"


# ============================================================================
# FOM ERP 동기화 팩트 테이블 (추가)
# ============================================================================

class FactCost(models.Model):
    """원가 팩트 테이블 (ACC200 동기화)"""

    cost_month = models.DateField(db_index=True, verbose_name='원가월')
    product_id = models.CharField(max_length=50, db_index=True, verbose_name='제품코드')
    product_name = models.CharField(max_length=200, verbose_name='제품명')
    cost_center = models.CharField(max_length=20, null=True, verbose_name='원가부문')

    # 원가 구성
    material_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='재료비')
    labor_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='노무비')
    overhead_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='경비')
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='단위원가')

    # 표준 vs 실제
    standard_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, verbose_name='표준원가')
    variance = models.DecimalField(max_digits=15, decimal_places=2, null=True, verbose_name='원가차이')
    variance_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='차이율(%)')

    # 생산 수량
    output_qty = models.IntegerField(default=0, verbose_name='생산수량')
    total_cost = models.DecimalField(max_digits=18, decimal_places=2, verbose_name='총원가')

    # 메타
    source_id = models.CharField(max_length=100, unique=True, verbose_name='원천ID')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='동기화시각')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'fact_cost'
        managed = True
        ordering = ['-cost_month', 'product_id']
        indexes = [
            models.Index(fields=['cost_month']),
            models.Index(fields=['product_id']),
        ]
        verbose_name = '원가'
        verbose_name_plural = '원가'

    def __str__(self):
        return f"{self.cost_month} {self.product_name}"
