from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# ============================================================================
# 기존 모델들 (유지)
# ============================================================================

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


# ============================================================================
# FOM ERP 동기화 팩트 테이블 (추가)
# ============================================================================

class FactProduction(models.Model):
    """생산 실적 팩트 테이블 (PPC100 동기화)"""

    work_date = models.DateField(db_index=True, verbose_name='작업일')
    plant = models.CharField(max_length=10, db_index=True, verbose_name='공장')
    line = models.CharField(max_length=20, verbose_name='라인')
    product_id = models.CharField(max_length=50, db_index=True, verbose_name='제품코드')
    product_name = models.CharField(max_length=200, verbose_name='제품명')

    # 수량
    qty_plan = models.IntegerField(default=0, verbose_name='계획수량')
    qty_actual = models.IntegerField(default=0, verbose_name='실적수량')
    qty_bad = models.IntegerField(default=0, verbose_name='불량수량')
    qty_good = models.IntegerField(default=0, verbose_name='양품수량')

    # 시간
    work_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='작업시간')
    setup_time = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='준비시간')
    downtime = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='비가동시간')

    # 효율
    efficiency = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='효율(%)')
    uph = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='시간당생산량')

    # 메타
    source_id = models.CharField(max_length=100, unique=True, verbose_name='원천ID')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='동기화시각')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'fact_production'
        managed = True
        ordering = ['-work_date', 'plant']
        indexes = [
            models.Index(fields=['work_date', 'plant']),
            models.Index(fields=['product_id']),
        ]
        verbose_name = '생산실적'
        verbose_name_plural = '생산실적'

    def __str__(self):
        return f"{self.work_date} {self.plant} {self.product_name}"


class FactEquipment(models.Model):
    """설비 가동 팩트 테이블 (FAC300 동기화)"""

    operation_date = models.DateField(db_index=True, verbose_name='가동일자')
    equipment_id = models.CharField(max_length=50, db_index=True, verbose_name='설비코드')
    equipment_name = models.CharField(max_length=200, verbose_name='설비명')
    plant = models.CharField(max_length=10, verbose_name='공장')
    line = models.CharField(max_length=20, verbose_name='라인')

    # 가동 시간
    planned_time = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='계획시간')
    actual_time = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='실가동시간')
    downtime = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='비가동시간')

    # 고장 정보
    failure_count = models.IntegerField(default=0, verbose_name='고장횟수')
    failure_time = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='고장시간')

    # 생산 실적
    output_qty = models.IntegerField(default=0, verbose_name='생산수량')
    defect_qty = models.IntegerField(default=0, verbose_name='불량수량')

    # 효율 지표
    availability = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='가동률(%)')
    performance = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='성능률(%)')
    quality_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='품질률(%)')
    oee = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='OEE(%)')

    # 메타
    source_id = models.CharField(max_length=100, unique=True, verbose_name='원천ID')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='동기화시각')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'fact_equipment'
        managed = True
        ordering = ['-operation_date', 'equipment_id']
        indexes = [
            models.Index(fields=['operation_date', 'plant']),
            models.Index(fields=['equipment_id']),
        ]
        verbose_name = '설비가동'
        verbose_name_plural = '설비가동'

    def __str__(self):
        return f"{self.operation_date} {self.equipment_name}"


# ============================================================================
# Dimension Tables (마스터 데이터)
# ============================================================================

class DimProduct(models.Model):
    """제품 마스터 (MAT100 동기화)"""

    product_id = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='제품코드')
    product_name = models.CharField(max_length=200, verbose_name='제품명')
    product_name_en = models.CharField(max_length=200, null=True, verbose_name='제품명(영문)')

    # 분류
    category = models.CharField(max_length=50, null=True, verbose_name='제품군')
    product_type = models.CharField(max_length=20, null=True, verbose_name='제품유형')
    product_group = models.CharField(max_length=50, null=True, verbose_name='제품그룹')

    # 규격
    specification = models.CharField(max_length=200, null=True, verbose_name='규격')
    unit = models.CharField(max_length=10, verbose_name='단위')
    weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, verbose_name='중량')

    # 원가
    standard_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, verbose_name='표준원가')
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, verbose_name='판매가')

    # 상태
    is_active = models.BooleanField(default=True, verbose_name='사용여부')

    # 메타
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'dim_product'
        managed = True
        verbose_name = '제품마스터'
        verbose_name_plural = '제품마스터'

    def __str__(self):
        return f"{self.product_id} {self.product_name}"


class DimEquipment(models.Model):
    """설비 마스터 (FAC200 동기화)"""

    equipment_id = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='설비코드')
    equipment_name = models.CharField(max_length=200, verbose_name='설비명')

    # 위치
    plant = models.CharField(max_length=10, verbose_name='공장')
    line = models.CharField(max_length=20, null=True, verbose_name='라인')
    location = models.CharField(max_length=100, null=True, verbose_name='설치위치')

    # 사양
    manufacturer = models.CharField(max_length=100, null=True, verbose_name='제조사')
    model = models.CharField(max_length=100, null=True, verbose_name='모델명')
    capacity = models.DecimalField(max_digits=10, decimal_places=2, null=True, verbose_name='생산능력')

    # 관리
    install_date = models.DateField(null=True, verbose_name='설치일자')
    acquisition_cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, verbose_name='취득원가')
    depreciation_cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, verbose_name='감가상각비')

    # 상태
    status = models.CharField(max_length=20, default='ACTIVE', verbose_name='상태')  # ACTIVE/MAINTENANCE/INACTIVE

    # 메타
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'dim_equipment'
        managed = True
        verbose_name = '설비마스터'
        verbose_name_plural = '설비마스터'

    def __str__(self):
        return f"{self.equipment_id} {self.equipment_name}"


class DimBOM(models.Model):
    """BOM (자재 소요량) 마스터 (MAT200 동기화)"""

    parent_product = models.CharField(max_length=50, db_index=True, verbose_name='부모제품코드')
    child_product = models.CharField(max_length=50, db_index=True, verbose_name='자제품코드')

    # BOM 정보
    quantity = models.DecimalField(max_digits=10, decimal_places=4, verbose_name='소요량')
    unit = models.CharField(max_length=10, verbose_name='단위')
    level = models.IntegerField(default=1, verbose_name='레벨')
    sequence = models.IntegerField(default=0, verbose_name='순서')

    # 대체품
    is_substitute = models.BooleanField(default=False, verbose_name='대체품여부')
    substitute_for = models.CharField(max_length=50, null=True, verbose_name='대체대상')

    # 유효성
    valid_from = models.DateField(verbose_name='유효시작일')
    valid_to = models.DateField(null=True, verbose_name='유효종료일')
    is_active = models.BooleanField(default=True, verbose_name='사용여부')

    # 메타
    source_id = models.CharField(max_length=100, unique=True, verbose_name='원천ID')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'dim_bom'
        managed = True
        verbose_name = 'BOM'
        verbose_name_plural = 'BOM'

    def __str__(self):
        return f"{self.parent_product} -> {self.child_product}"