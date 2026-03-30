from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class QualityInspection(models.Model):
    """품질 검사"""
    INSPECTION_TYPE_CHOICES = [
        ('incoming', '수입 검사'),
        ('in_process', '공정 검사'),
        ('final', '최종 검사'),
        ('outgoing', '출하 검사'),
    ]
    
    RESULT_CHOICES = [
        ('pass', '합격'),
        ('fail', '불합격'),
        ('conditional', '조건부 합격'),
    ]
    
    inspection_number = models.CharField('검사 번호', max_length=50, unique=True)
    inspection_type = models.CharField('검사 유형', max_length=20, choices=INSPECTION_TYPE_CHOICES)
    product_name = models.CharField('제품명', max_length=200)
    product_code = models.CharField('제품 코드', max_length=100)
    lot_number = models.CharField('LOT 번호', max_length=100)
    
    inspection_date = models.DateField('검사일자')
    inspector = models.CharField('검사자', max_length=100)
    
    sample_size = models.IntegerField('샘플 수량', validators=[MinValueValidator(1)])
    defect_count = models.IntegerField('불량 수량', default=0, validators=[MinValueValidator(0)])
    
    result = models.CharField('검사 결과', max_length=20, choices=RESULT_CHOICES)
    notes = models.TextField('비고', blank=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'quality_inspections'
        verbose_name = '품질 검사'
        verbose_name_plural = '품질 검사'
        ordering = ['-inspection_date']
    
    def __str__(self):
        return f"{self.inspection_number} - {self.product_name}"
    
    @property
    def defect_rate(self):
        """불량률 계산"""
        if self.sample_size > 0:
            return round((self.defect_count / self.sample_size) * 100, 2)
        return 0


class DefectType(models.Model):
    """불량 유형"""
    name = models.CharField('불량 유형', max_length=100)
    code = models.CharField('코드', max_length=50, unique=True)
    description = models.TextField('설명', blank=True)
    severity = models.CharField('심각도', max_length=20, choices=[
        ('critical', '치명적'),
        ('major', '중대'),
        ('minor', '경미'),
    ])
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'defect_types'
        verbose_name = '불량 유형'
        verbose_name_plural = '불량 유형'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class DefectRecord(models.Model):
    """불량 기록"""
    inspection = models.ForeignKey(
        QualityInspection,
        on_delete=models.CASCADE,
        verbose_name='품질 검사',
        related_name='defect_records'
    )
    defect_type = models.ForeignKey(
        DefectType,
        on_delete=models.PROTECT,
        verbose_name='불량 유형'
    )
    
    quantity = models.IntegerField('불량 수량', validators=[MinValueValidator(1)])
    location = models.CharField('발생 위치', max_length=200, blank=True)
    description = models.TextField('상세 설명', blank=True)
    
    corrective_action = models.TextField('시정 조치', blank=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'defect_records'
        verbose_name = '불량 기록'
        verbose_name_plural = '불량 기록'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.defect_type.name} - {self.quantity}개"


class CustomerComplaint(models.Model):
    """고객 클레임"""
    STATUS_CHOICES = [
        ('received', '접수'),
        ('investigating', '조사중'),
        ('resolving', '개선중'),
        ('resolved', '완료'),
        ('closed', '종료'),
    ]
    
    SEVERITY_CHOICES = [
        ('high', '높음'),
        ('medium', '보통'),
        ('low', '낮음'),
    ]
    
    complaint_number = models.CharField('클레임 번호', max_length=50, unique=True)
    customer_name = models.CharField('고객명', max_length=200)
    product_name = models.CharField('제품명', max_length=200)
    product_code = models.CharField('제품 코드', max_length=100)
    
    complaint_date = models.DateField('접수일자')
    description = models.TextField('내용')
    severity = models.CharField('심각도', max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField('처리 상태', max_length=20, choices=STATUS_CHOICES, default='received')
    
    assigned_to = models.CharField('담당자', max_length=100, blank=True)
    root_cause = models.TextField('근본 원인', blank=True)
    corrective_action = models.TextField('시정 조치', blank=True)
    preventive_action = models.TextField('예방 조치', blank=True)
    
    resolution_date = models.DateField('완료일자', null=True, blank=True)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'customer_complaints'
        verbose_name = '고객 클레임'
        verbose_name_plural = '고객 클레임'
        ordering = ['-complaint_date']
    
    def __str__(self):
        return f"{self.complaint_number} - {self.customer_name}"


class ProcessCapability(models.Model):
    """공정 능력 (CPK)"""
    product_name = models.CharField('제품명', max_length=200)
    product_code = models.CharField('제품 코드', max_length=100)
    process_name = models.CharField('공정명', max_length=200)
    
    measurement_date = models.DateField('측정일자')
    
    usl = models.DecimalField('상한 규격', max_digits=10, decimal_places=3)
    lsl = models.DecimalField('하한 규격', max_digits=10, decimal_places=3)
    target = models.DecimalField('목표값', max_digits=10, decimal_places=3)
    
    mean = models.DecimalField('평균', max_digits=10, decimal_places=3)
    std_dev = models.DecimalField('표준편차', max_digits=10, decimal_places=3)
    
    cp = models.DecimalField('CP', max_digits=5, decimal_places=2, default=0)
    cpk = models.DecimalField('CPK', max_digits=5, decimal_places=2, default=0)
    ppk = models.DecimalField('PPK', max_digits=5, decimal_places=2, default=0)
    
    sample_size = models.IntegerField('샘플 수')
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'process_capabilities'
        verbose_name = '공정 능력'
        verbose_name_plural = '공정 능력'
        ordering = ['-measurement_date']
    
    def __str__(self):
        return f"{self.product_name} - {self.process_name} (CPK: {self.cpk})"


# ============================================================================
# FOM ERP 동기화 팩트 테이블 (추가)
# ============================================================================

class FactQuality(models.Model):
    """품질 검사 팩트 테이블 (QUA100 동기화)"""

    inspection_date = models.DateField(db_index=True, verbose_name='검사일자')
    inspection_type = models.CharField(max_length=20, verbose_name='검사구분')  # 입고/공정/출하
    product_id = models.CharField(max_length=50, db_index=True, verbose_name='제품코드')
    product_name = models.CharField(max_length=200, verbose_name='제품명')
    lot_no = models.CharField(max_length=50, db_index=True, verbose_name='LOT번호')

    # 검사 수량
    qty_inspected = models.IntegerField(default=0, verbose_name='검사수량')
    qty_passed = models.IntegerField(default=0, verbose_name='합격수량')
    qty_failed = models.IntegerField(default=0, verbose_name='불합격수량')
    qty_rework = models.IntegerField(default=0, verbose_name='재작업수량')

    # 불량 정보
    defect_type = models.CharField(max_length=50, null=True, verbose_name='불량유형')
    defect_cause = models.CharField(max_length=50, null=True, verbose_name='불량원인')
    defect_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, verbose_name='불량률(%)')

    # 측정값 (통계적 공정 관리용)
    measured_value = models.DecimalField(max_digits=10, decimal_places=4, null=True, verbose_name='측정값')
    spec_lower = models.DecimalField(max_digits=10, decimal_places=4, null=True, verbose_name='하한규격')
    spec_upper = models.DecimalField(max_digits=10, decimal_places=4, null=True, verbose_name='상한규격')

    # 검사자
    inspector = models.CharField(max_length=50, null=True, verbose_name='검사자')

    # 메타
    source_id = models.CharField(max_length=100, unique=True, verbose_name='원천ID')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='동기화시각')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'fact_quality'
        managed = True
        ordering = ['-inspection_date']
        indexes = [
            models.Index(fields=['inspection_date', 'inspection_type']),
            models.Index(fields=['product_id']),
            models.Index(fields=['lot_no']),
        ]
        verbose_name = '품질검사'
        verbose_name_plural = '품질검사'

    def __str__(self):
        return f"{self.inspection_date} {self.inspection_type} {self.product_name}"