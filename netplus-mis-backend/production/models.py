from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class ProductionLine(models.Model):
    """생산 라인"""
    name = models.CharField('라인명', max_length=100)
    code = models.CharField('라인 코드', max_length=50, unique=True)
    location = models.CharField('위치', max_length=200)
    capacity = models.IntegerField('일일 생산능력', validators=[MinValueValidator(0)])
    is_active = models.BooleanField('가동 여부', default=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'production_lines'
        verbose_name = '생산 라인'
        verbose_name_plural = '생산 라인'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class WorkOrder(models.Model):
    """작업 지시서"""
    STATUS_CHOICES = [
        ('planned', '계획'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ]
    
    order_number = models.CharField('작업지시 번호', max_length=50, unique=True)
    production_line = models.ForeignKey(
        ProductionLine, 
        on_delete=models.CASCADE, 
        verbose_name='생산 라인',
        related_name='work_orders'
    )
    product_name = models.CharField('제품명', max_length=200)
    product_code = models.CharField('제품 코드', max_length=100)
    
    target_quantity = models.IntegerField('목표 수량', validators=[MinValueValidator(1)])
    actual_quantity = models.IntegerField('실제 생산량', default=0, validators=[MinValueValidator(0)])
    defect_quantity = models.IntegerField('불량 수량', default=0, validators=[MinValueValidator(0)])
    
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planned')
    
    planned_start = models.DateTimeField('계획 시작일시')
    planned_end = models.DateTimeField('계획 종료일시')
    actual_start = models.DateTimeField('실제 시작일시', null=True, blank=True)
    actual_end = models.DateTimeField('실제 종료일시', null=True, blank=True)
    
    notes = models.TextField('비고', blank=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'work_orders'
        verbose_name = '작업 지시서'
        verbose_name_plural = '작업 지시서'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order_number} - {self.product_name}"
    
    @property
    def achievement_rate(self):
        """달성률 계산"""
        if self.target_quantity > 0:
            return round((self.actual_quantity / self.target_quantity) * 100, 2)
        return 0


class DailyProduction(models.Model):
    """일일 생산 실적"""
    production_line = models.ForeignKey(
        ProductionLine, 
        on_delete=models.CASCADE, 
        verbose_name='생산 라인',
        related_name='daily_productions'
    )
    production_date = models.DateField('생산일자')
    
    target_quantity = models.IntegerField('목표 생산량')
    actual_quantity = models.IntegerField('실제 생산량')
    defect_quantity = models.IntegerField('불량 수량', default=0)
    
    operating_hours = models.DecimalField('가동 시간', max_digits=5, decimal_places=2, default=0)
    downtime_hours = models.DecimalField('비가동 시간', max_digits=5, decimal_places=2, default=0)
    
    efficiency = models.DecimalField('생산 효율 (%)', max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'daily_productions'
        verbose_name = '일일 생산 실적'
        verbose_name_plural = '일일 생산 실적'
        ordering = ['-production_date']
        unique_together = ['production_line', 'production_date']
    
    def __str__(self):
        return f"{self.production_line.name} - {self.production_date}"
    
    @property
    def defect_rate(self):
        """불량률 계산"""
        if self.actual_quantity > 0:
            return round((self.defect_quantity / self.actual_quantity) * 100, 2)
        return 0


class Equipment(models.Model):
    """생산 설비"""
    STATUS_CHOICES = [
        ('running', '가동중'),
        ('idle', '대기'),
        ('maintenance', '정비중'),
        ('breakdown', '고장'),
    ]
    
    name = models.CharField('설비명', max_length=100)
    code = models.CharField('설비 코드', max_length=50, unique=True)
    production_line = models.ForeignKey(
        ProductionLine, 
        on_delete=models.CASCADE, 
        verbose_name='생산 라인',
        related_name='equipment'
    )
    
    manufacturer = models.CharField('제조사', max_length=200)
    model = models.CharField('모델명', max_length=200)
    purchase_date = models.DateField('구매일자')
    
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='idle')
    last_maintenance = models.DateField('최근 정비일', null=True, blank=True)
    next_maintenance = models.DateField('다음 정비 예정일', null=True, blank=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'equipment'
        verbose_name = '생산 설비'
        verbose_name_plural = '생산 설비'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.name} ({self.code})"