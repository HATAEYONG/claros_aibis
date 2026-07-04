# -*- coding: utf-8 -*-
"""
통합 레이어 모델
ERP 시스템 간 정규화된 비즈니스 데이터
Source Layer의 데이터를 통합하여 단일 진실 공급원(SSOT) 제공
"""
from django.db import models
from django.utils import timezone


class IntegratedMaterial(models.Model):
    """
    통합 자재 데이터
    재고, 입출하, 원가 정보를 통합
    """
    material_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        'erp_sync.MasterProduct',
        on_delete=models.PROTECT,
        related_name='materials',
        verbose_name='제품'
    )

    # 재고 정보
    plant = models.CharField('공장', max_length=50)
    warehouse = models.CharField('창고', max_length=50, blank=True)
    location = models.CharField('위치', max_length=100, blank=True)

    quantity_on_hand = models.DecimalField('현재고량', max_digits=18, decimal_places=4, default=0)
    quantity_reserved = models.DecimalField('예약된 수량', max_digits=18, decimal_places=4, default=0)
    quantity_available = models.DecimalField('가용 수량', max_digits=18, decimal_places=4, default=0)
    safety_stock = models.DecimalField('안전 재고', max_digits=18, decimal_places=4, default=0)

    # 원가 정보
    moving_average_cost = models.DecimalField('이동 평균 단가', max_digits=18, decimal_places=4, null=True, blank=True)
    standard_cost = models.DecimalField('표준 단가', max_digits=18, decimal_places=4, null=True, blank=True)
    total_value = models.DecimalField('총 재고 가액', max_digits=18, decimal_places=2, default=0)

    # 공급망
    primary_vendor = models.ForeignKey(
        'erp_sync.MasterVendor',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='supplied_materials',
        verbose_name='주 공급처'
    )
    lead_time_days = models.IntegerField('리드타임(일)', default=0)

    # 분석 데이터
    last_receipt_date = models.DateField('최종 입고일', null=True, blank=True)
    last_issue_date = models.DateField('최종 출고일', null=True, blank=True)
    turnover_rate = models.DecimalField('회전율', max_digits=10, decimal_places=4, null=True, blank=True)
    days_of_supply = models.IntegerField('공급 가능 일수', default=0)

    # 상태
    is_abcs = models.CharField('ABC 분류', max_length=10, blank=True)  # A/B/C 분류
    is_slow_moving = models.BooleanField('저회전 여부', default=False)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    last_synced_at = models.DateTimeField('마지막 동기화', auto_now=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'integrated_material'
        verbose_name = '통합 자재'
        verbose_name_plural = '통합 자재'
        unique_together = [['product', 'plant', 'warehouse']]
        ordering = ['plant', 'warehouse', 'product']
        indexes = [
            models.Index(fields=['product', 'plant']),
            models.Index(fields=['quantity_available']),
            models.Index(fields=['last_synced_at']),
        ]

    def __str__(self):
        return f'{self.product.product_code} - {self.plant}/{self.warehouse}'


class IntegratedProductionOrder(models.Model):
    """
    통합 생산 오더
    생산 계획과 실적을 통합
    """
    order_id = models.AutoField(primary_key=True)
    order_number = models.CharField('오더 번호', max_length=50, unique=True)
    order_type = models.CharField('오더 유형', max_length=20, choices=[
        ('standard', '표준'),
        ('rework', '재작업'),
        ('disassembly', '분해'),
        ('rush', '긴급'),
    ])

    # 제품 정보
    product = models.ForeignKey(
        'erp_sync.MasterProduct',
        on_delete=models.PROTECT,
        related_name='production_orders',
        verbose_name='제품'
    )

    # 수량
    quantity_ordered = models.DecimalField('계획 수량', max_digits=18, decimal_places=4)
    quantity_produced = models.DecimalField('생산 수량', max_digits=18, decimal_places=4, default=0)
    quantity_scrapped = models.DecimalField('폐기 수량', max_digits=18, decimal_places=4, default=0)

    # 일정
    plant = models.CharField('공장', max_length=50)
    line = models.CharField('라인', max_length=50, blank=True)
    equipment = models.ForeignKey(
        'erp_sync.MasterEquipment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='production_orders',
        verbose_name='설비'
    )

    start_date_scheduled = models.DateField('계획 시작일')
    start_date_actual = models.DateField('실제 시작일', null=True, blank=True)
    end_date_scheduled = models.DateField('계획 종료일')
    end_date_actual = models.DateField('실제 종료일', null=True, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=[
        ('created', '생성'),
        ('released', '해제'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ], default='created')

    progress = models.DecimalField('진행률(%)', max_digits=5, decimal_places=2, default=0)

    # 원가
    standard_cost = models.DecimalField('표준 원가', max_digits=18, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField('실제 원가', max_digits=18, decimal_places=2, null=True, blank=True)

    # 담당
    production_supervisor = models.ForeignKey(
        'erp_sync.MasterEmployee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='supervised_orders',
        verbose_name='생산 담당자'
    )

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    last_synced_at = models.DateTimeField('마지막 동기화', auto_now=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'integrated_production_order'
        verbose_name = '통합 생산 오더'
        verbose_name_plural = '통합 생산 오더'
        ordering = ['-start_date_scheduled', 'order_number']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date_scheduled']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f'{self.order_number} - {self.product.product_name}'


class IntegratedQualityRecord(models.Model):
    """
    통합 품질 기록
    검사 결과, 불량, CAPA 정보를 통합
    """
    record_id = models.AutoField(primary_key=True)
    record_number = models.CharField('기록 번호', max_length=50, unique=True)
    record_type = models.CharField('기록 유형', max_length=20, choices=[
        ('incoming', '입고검사'),
        ('in_process', '공정검사'),
        ('final', '최종검사'),
        ('shipping', '출하검사'),
        ('customer_claim', '고객클레임'),
    ])

    # 제품 정보
    product = models.ForeignKey(
        'erp_sync.MasterProduct',
        on_delete=models.PROTECT,
        related_name='quality_records',
        verbose_name='제품'
    )
    lot_number = models.CharField('LOT 번호', max_length=50, blank=True)
    batch_number = models.CharField('배치 번호', max_length=50, blank=True)

    # 수량
    inspection_quantity = models.DecimalField('검사 수량', max_digits=18, decimal_places=4)
    ok_quantity = models.DecimalField('합격 수량', max_digits=18, decimal_places=4, default=0)
    ng_quantity = models.DecimalField('불량 수량', max_digits=18, decimal_places=4, default=0)
    rework_quantity = models.DecimalField('재작업 수량', max_digits=18, decimal_places=4, default=0)

    # 결과
    result = models.CharField('검사 결과', max_length=20, choices=[
        ('accepted', '합격'),
        ('rejected', '불합격'),
        ('conditional', '조건부합격'),
        ('rework', '재작업'),
    ])

    defect_types = models.JSONField('불량 유형', default=list)
    defect_details = models.TextField('불량 상세', blank=True)

    # 일정
    inspection_date = models.DateField('검사일자')
    inspector = models.ForeignKey(
        'erp_sync.MasterEmployee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='inspections',
        verbose_name='검사자'
    )

    # 고객 관련
    customer = models.ForeignKey(
        'erp_sync.MasterCustomer',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='quality_records',
        verbose_name='고객사'
    )
    claim_number = models.CharField('클레임 번호', max_length=50, blank=True)

    # CAPA
    capa_required = models.BooleanField('CAPA 필요', default=False)
    capa_number = models.CharField('CAPA 번호', max_length=50, blank=True)
    capa_due_date = models.DateField('CAPA 기한', null=True, blank=True)
    capa_status = models.CharField('CAPA 상태', max_length=20, blank=True)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    last_synced_at = models.DateTimeField('마지막 동기화', auto_now=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'integrated_quality_record'
        verbose_name = '통합 품질 기록'
        verbose_name_plural = '통합 품질 기록'
        ordering = ['-inspection_date', 'record_number']
        indexes = [
            models.Index(fields=['record_number']),
            models.Index(fields=['record_type']),
            models.Index(fields=['inspection_date']),
            models.Index(fields=['result']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f'{self.record_number} - {self.result}'


class IntegratedSalesOrder(models.Model):
    """
    통합 영업 오더
    수주, 출하, 매출 정보를 통합
    """
    order_id = models.AutoField(primary_key=True)
    order_number = models.CharField('오더 번호', max_length=50, unique=True)

    # 고객 정보
    customer = models.ForeignKey(
        'erp_sync.MasterCustomer',
        on_delete=models.PROTECT,
        related_name='sales_orders',
        verbose_name='고객사'
    )
    customer_po = models.CharField('고객 PO 번호', max_length=50, blank=True)

    # 제품 정보
    product = models.ForeignKey(
        'erp_sync.MasterProduct',
        on_delete=models.PROTECT,
        related_name='sales_orders',
        verbose_name='제품'
    )

    # 수량 및 단가
    quantity_ordered = models.DecimalField('주문 수량', max_digits=18, decimal_places=4)
    quantity_shipped = models.DecimalField('출하 수량', max_digits=18, decimal_places=4, default=0)
    quantity_invoiced = models.DecimalField('청구 수량', max_digits=18, decimal_places=4, default=0)
    unit_price = models.DecimalField('단가', max_digits=18, decimal_places=4)
    currency = models.CharField('통화', max_length=10, default='KRW')
    total_amount = models.DecimalField('총액', max_digits=18, decimal_places=2)

    # 일정
    order_date = models.DateField('주문일자')
    request_date = models.DateField('납품 요청일')
    promise_date = models.DateField('납품 약속일')
    actual_shipment_date = models.DateField('실제 출하일', null=True, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=[
        ('draft', '작성중'),
        ('confirmed', '확정'),
        ('in_production', '생산중'),
        ('shipped', '출하완료'),
        ('invoiced', '청구완료'),
        ('cancelled', '취소'),
    ], default='draft')

    progress = models.DecimalField('진행률(%)', max_digits=5, decimal_places=2, default=0)

    # 담당
    sales_person = models.ForeignKey(
        'erp_sync.MasterEmployee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sales_orders',
        verbose_name='영업 담당자'
    )

    # 비고
    remarks = models.TextField('비고', blank=True)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    last_synced_at = models.DateTimeField('마지막 동기화', auto_now=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'integrated_sales_order'
        verbose_name = '통합 영업 오더'
        verbose_name_plural = '통합 영업 오더'
        ordering = ['-order_date', 'order_number']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['customer']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        return f'{self.order_number} - {self.customer.customer_name}'
