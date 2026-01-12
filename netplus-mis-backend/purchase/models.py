from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class MonthlyPurchase(models.Model):
    """월별 구매액"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    purchase_amount = models.DecimalField('구매액', max_digits=15, decimal_places=2, default=0)
    previous_month_change = models.DecimalField('전월 대비 증감률 (%)', max_digits=5, decimal_places=2, default=0)
    order_count = models.IntegerField('발주 건수', default=0)
    pending_orders = models.IntegerField('입고 대기 건수', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_monthly'
        verbose_name = '월별 구매'
        verbose_name_plural = '월별 구매'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"구매 - {self.fiscal_year}년 {self.fiscal_month}월"


class Inventory(models.Model):
    """재고 현황"""
    CATEGORY_CHOICES = [
        ('A', 'A등급 (고가/중요)'),
        ('B', 'B등급 (중간)'),
        ('C', 'C등급 (저가)'),
    ]

    STATUS_CHOICES = [
        ('adequate', '적정'),
        ('low', '부족'),
        ('high', '과다'),
        ('critical', '긴급'),
    ]

    item_code = models.CharField('품목코드', max_length=50)
    item_name = models.CharField('품목명', max_length=200)
    category = models.CharField('ABC 등급', max_length=1, choices=CATEGORY_CHOICES)

    current_stock = models.IntegerField('현재 재고', default=0)
    safety_stock = models.IntegerField('안전 재고', default=0)
    stock_value = models.DecimalField('재고가치', max_digits=15, decimal_places=2, default=0)
    turnover_rate = models.DecimalField('회전율', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='adequate')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_inventory'
        verbose_name = '재고'
        verbose_name_plural = '재고'
        ordering = ['-stock_value']

    def __str__(self):
        return f"{self.item_code} - {self.item_name}"


class PurchaseOrder(models.Model):
    """발주 현황"""
    STATUS_CHOICES = [
        ('ordered', '발주완료'),
        ('in-transit', '운송중'),
        ('received', '입고완료'),
        ('delayed', '지연'),
    ]

    po_number = models.CharField('PO 번호', max_length=50, unique=True)
    supplier_name = models.CharField('공급사', max_length=200)
    item_name = models.CharField('품목', max_length=200)

    quantity = models.IntegerField('수량', default=0)
    unit_price = models.DecimalField('단가', max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField('총액', max_digits=15, decimal_places=2, default=0)

    order_date = models.DateField('발주일')
    delivery_date = models.DateField('납기일')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='ordered')
    is_urgent = models.BooleanField('긴급 여부', default=False)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_order'
        verbose_name = '발주'
        verbose_name_plural = '발주'
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.po_number} - {self.item_name}"


class Supplier(models.Model):
    """공급업체"""
    GRADE_CHOICES = [
        ('A', 'A등급'),
        ('B', 'B등급'),
        ('C', 'C등급'),
        ('D', 'D등급'),
    ]

    TREND_CHOICES = [
        ('up', '상승'),
        ('stable', '유지'),
        ('down', '하락'),
    ]

    supplier_code = models.CharField('업체코드', max_length=50, unique=True)
    supplier_name = models.CharField('업체명', max_length=200)

    quality_score = models.DecimalField('품질 점수', max_digits=5, decimal_places=2, default=0)
    delivery_score = models.DecimalField('납기 점수', max_digits=5, decimal_places=2, default=0)
    price_score = models.DecimalField('가격 점수', max_digits=5, decimal_places=2, default=0)
    service_score = models.DecimalField('서비스 점수', max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField('종합 점수', max_digits=5, decimal_places=2, default=0)

    grade = models.CharField('등급', max_length=1, choices=GRADE_CHOICES, default='B')
    trend = models.CharField('추세', max_length=10, choices=TREND_CHOICES, default='stable')
    purchase_share = models.DecimalField('구매 비중 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_supplier'
        verbose_name = '공급업체'
        verbose_name_plural = '공급업체'
        ordering = ['-total_score']

    def __str__(self):
        return f"{self.supplier_code} - {self.supplier_name}"


class MaterialPrice(models.Model):
    """원자재 가격 동향"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    material_code = models.CharField('원자재코드', max_length=50)
    material_name = models.CharField('원자재명', max_length=200)
    unit_price = models.DecimalField('단가', max_digits=12, decimal_places=2, default=0)
    previous_price = models.DecimalField('전월 단가', max_digits=12, decimal_places=2, default=0)
    change_rate = models.DecimalField('변동률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_material_price'
        verbose_name = '원자재 가격'
        verbose_name_plural = '원자재 가격'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.material_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class InventoryTurnover(models.Model):
    """재고 회전율"""
    CATEGORY_CHOICES = [
        ('raw', '원자재'),
        ('parts', '부자재'),
        ('finished', '완제품'),
        ('semi', '반제품'),
        ('consumable', '소모품'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    turnover_rate = models.DecimalField('회전율', max_digits=5, decimal_places=2, default=0)
    days_in_inventory = models.IntegerField('재고일수', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'purchase_inventory_turnover'
        verbose_name = '재고 회전율'
        verbose_name_plural = '재고 회전율'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.get_category_display()} - {self.fiscal_year}년 {self.fiscal_month}월"
