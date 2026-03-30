# -*- coding: utf-8 -*-
"""
마스터 데이터 모델
ERP 시스템 간 정규화된 마스터 데이터
"""
from django.db import models
from django.utils import timezone


class MasterProduct(models.Model):
    """
    마스터 제품/품목
    EMAX, SAP 등 ERP 시스템의 품목 정보를 통합
    """
    PRODUCT_TYPE_CHOICES = [
        ('raw_material', '원자재'),
        ('semi_finished', '반제품'),
        ('finished_good', '완제품'),
        ('packaging', '포장재'),
        ('consumable', '소모품'),
    ]

    product_id = models.AutoField(primary_key=True)
    product_code = models.CharField('제품 코드', max_length=50, unique=True)
    product_name = models.CharField('제품명', max_length=200)
    product_name_en = models.CharField('제품명(영문)', max_length=200, blank=True)
    product_type = models.CharField('제품 유형', max_length=20, choices=PRODUCT_TYPE_CHOICES)
    specification = models.TextField('규격', blank=True)

    # 분류 정보
    category_l1 = models.CharField('대분류', max_length=50, blank=True)
    category_l2 = models.CharField('중분류', max_length=50, blank=True)
    category_l3 = models.CharField('소분류', max_length=50, blank=True)

    # 단위 및 측정
    unit = models.CharField('단위', max_length=10, blank=True)
    weight = models.DecimalField('중량(kg)', max_digits=10, decimal_places=3, null=True, blank=True)
    dimensions = models.CharField('치수', max_length=50, blank=True)

    # 공급망
    primary_vendor = models.ForeignKey(
        'erp_sync.MasterVendor',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='primary_products',
        verbose_name='주 공급처'
    )

    # 원가 정보
    standard_cost = models.DecimalField('표준 원가', max_digits=18, decimal_places=2, null=True, blank=True)
    last_purchase_price = models.DecimalField('최근 구매 단가', max_digits=18, decimal_places=2, null=True, blank=True)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict, help_text='{erp_code: erp_item_id}')

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_product'
        verbose_name = '마스터 제품'
        verbose_name_plural = '마스터 제품'
        ordering = ['product_code']
        indexes = [
            models.Index(fields=['product_code']),
            models.Index(fields=['product_type']),
            models.Index(fields=['category_l1', 'category_l2']),
        ]

    def __str__(self):
        return f'{self.product_code} - {self.product_name}'


class MasterVendor(models.Model):
    """
    마스터 공급처
    모든 ERP 시스템의 공급처 정보를 통합
    """
    vendor_id = models.AutoField(primary_key=True)
    vendor_code = models.CharField('공급처 코드', max_length=50, unique=True)
    vendor_name = models.CharField('공급처명', max_length=200)
    vendor_name_en = models.CharField('공급처명(영문)', max_length=200, blank=True)

    # 분류
    vendor_type = models.CharField('공급처 유형', max_length=50, blank=True)
    business_type = models.CharField('업태', max_length=50, blank=True)
    business_category = models.CharField('업종', max_length=50, blank=True)

    # 연락처
    contact_person = models.CharField('담당자', max_length=100, blank=True)
    contact_email = models.EmailField('이메일', blank=True)
    contact_phone = models.CharField('연락처', max_length=50, blank=True)
    fax = models.CharField('팩스', max_length=50, blank=True)

    # 주소
    address = models.CharField('주소', max_length=500, blank=True)
    postal_code = models.CharField('우편번호', max_length=10, blank=True)
    country = models.CharField('국가', max_length=50, blank=True)
    region = models.CharField('지역', max_length=50, blank=True)

    # 계약 정보
    payment_terms = models.CharField('결제 조건', max_length=100, blank=True)
    currency = models.CharField('통화', max_length=10, default='KRW')
    credit_limit = models.DecimalField('신용 한도', max_digits=18, decimal_places=2, null=True, blank=True)

    # 평가
    rating = models.CharField('등급', max_length=10, blank=True)
    risk_level = models.CharField('리스크 수준', max_length=20, choices=[
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
        ('critical', '매우높음'),
    ], default='medium')

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_vendor'
        verbose_name = '마스터 공급처'
        verbose_name_plural = '마스터 공급처'
        ordering = ['vendor_code']
        indexes = [
            models.Index(fields=['vendor_code']),
            models.Index(fields=['vendor_type']),
            models.Index(fields=['risk_level']),
        ]

    def __str__(self):
        return f'{self.vendor_code} - {self.vendor_name}'


class MasterCustomer(models.Model):
    """
    마스터 고객사
    모든 ERP 시스템의 고객사 정보를 통합
    """
    customer_id = models.AutoField(primary_key=True)
    customer_code = models.CharField('고객사 코드', max_length=50, unique=True)
    customer_name = models.CharField('고객사명', max_length=200)
    customer_name_en = models.CharField('고객사명(영문)', max_length=200, blank=True)

    # 분류
    customer_type = models.CharField('고객 유형', max_length=50, blank=True)
    industry = models.CharField('산업군', max_length=100, blank=True)

    # 연락처
    contact_person = models.CharField('담당자', max_length=100, blank=True)
    contact_email = models.EmailField('이메일', blank=True)
    contact_phone = models.CharField('연락처', max_length=50, blank=True)

    # 주소
    address = models.CharField('주소', max_length=500, blank=True)
    postal_code = models.CharField('우편번호', max_length=10, blank=True)
    country = models.CharField('국가', max_length=50, blank=True)

    # 계약 정보
    payment_terms = models.CharField('결제 조건', max_length=100, blank=True)
    currency = models.CharField('통화', max_length=10, default='KRW')
    credit_limit = models.DecimalField('신용 한도', max_digits=18, decimal_places=2, null=True, blank=True)

    # 등급
    tier = models.CharField('등급', max_length=20, choices=[
        ('strategic', '전략'),
        ('key', '핵심'),
        ('standard', '일반'),
        ('small', '소규모'),
    ], default='standard')

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_customer'
        verbose_name = '마스터 고객사'
        verbose_name_plural = '마스터 고객사'
        ordering = ['customer_code']
        indexes = [
            models.Index(fields=['customer_code']),
            models.Index(fields=['customer_type']),
            models.Index(fields=['tier']),
        ]

    def __str__(self):
        return f'{self.customer_code} - {self.customer_name}'


class MasterDepartment(models.Model):
    """
    마스터 부서
    조직 구조의 단일 진실 공급원
    """
    department_id = models.AutoField(primary_key=True)
    department_code = models.CharField('부서 코드', max_length=50, unique=True)
    department_name = models.CharField('부서명', max_length=100)
    department_name_en = models.CharField('부서명(영문)', max_length=100, blank=True)

    # 계층 구조
    parent_department = models.ForeignKey(
        'erp_sync.MasterDepartment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='child_departments',
        verbose_name='상위 부서'
    )
    level = models.IntegerField('조직 레벨', default=1)
    path = models.CharField('조직 경로', max_length=500, blank=True)

    # 분류
    department_type = models.CharField('부서 유형', max_length=50, choices=[
        ('executive', '경영진'),
        ('production', '생산'),
        ('sales', '영업'),
        ('purchase', '구매'),
        ('quality', '품질'),
        ('finance', '재무'),
        ('hr', '인사'),
        ('it', 'IT'),
        ('support', '지원'),
    ])

    # 책임자
    manager = models.ForeignKey(
        'erp_sync.MasterEmployee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='managed_departments',
        verbose_name='부서장'
    )

    # 비용 센터
    cost_center = models.CharField('비용 센터', max_length=50, blank=True)
    plant = models.CharField('공장', max_length=50, blank=True)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_department'
        verbose_name = '마스터 부서'
        verbose_name_plural = '마스터 부서'
        ordering = ['level', 'department_code']
        indexes = [
            models.Index(fields=['department_code']),
            models.Index(fields=['department_type']),
            models.Index(fields=['level']),
        ]

    def __str__(self):
        return f'{self.department_code} - {self.department_name}'


class MasterEmployee(models.Model):
    """
    마스터 직원
    모든 시스템의 직원 정보를 통합
    """
    employee_id = models.AutoField(primary_key=True)
    employee_code = models.CharField('사번', max_length=50, unique=True)
    employee_name = models.CharField('성명', max_length=100)
    employee_name_en = models.CharField('성명(영문)', max_length=100, blank=True)

    # 인사 정보
    department = models.ForeignKey(
        'erp_sync.MasterDepartment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='employees',
        verbose_name='소속 부서'
    )
    position = models.CharField('직위', max_length=50, blank=True)
    job_title = models.CharField('직책', max_length=100, blank=True)
    employment_type = models.CharField('고용 형태', max_length=50, blank=True)

    # 연락처
    email = models.EmailField('이메일', blank=True)
    phone = models.CharField('전화번호', max_length=50, blank=True)
    mobile = models.CharField('휴대폰', max_length=50, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=[
        ('active', '재직'),
        ('resigned', '퇴사'),
        ('on_leave', '휴직'),
    ], default='active')
    hire_date = models.DateField('입사일', null=True, blank=True)
    resignation_date = models.DateField('퇴사일', null=True, blank=True)

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_employee'
        verbose_name = '마스터 직원'
        verbose_name_plural = '마스터 직원'
        ordering = ['employee_code']
        indexes = [
            models.Index(fields=['employee_code']),
            models.Index(fields=['department']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.employee_code} - {self.employee_name}'


class MasterEquipment(models.Model):
    """
    마스터 설비
    생산 설비 및 기계 정보
    """
    equipment_id = models.AutoField(primary_key=True)
    equipment_code = models.CharField('설비 코드', max_length=50, unique=True)
    equipment_name = models.CharField('설비명', max_length=200)
    equipment_name_en = models.CharField('설비명(영문)', max_length=200, blank=True)

    # 분류
    equipment_type = models.CharField('설비 유형', max_length=50, blank=True)
    equipment_category = models.CharField('설비 분류', max_length=50, blank=True)

    # 위치
    plant = models.CharField('공장', max_length=50, blank=True)
    line = models.CharField('라인', max_length=50, blank=True)
    location = models.CharField('위치', max_length=100, blank=True)

    # 사양
    manufacturer = models.CharField('제조사', max_length=100, blank=True)
    model = models.CharField('모델', max_length=100, blank=True)
    capacity = models.DecimalField('용량', max_digits=18, decimal_places=4, null=True, blank=True)
    capacity_unit = models.CharField('용량 단위', max_length=20, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=[
        ('operational', '가동'),
        ('maintenance', '정비'),
        ('breakdown', '고장'),
        ('idle', '유휴'),
        ('retired', '폐기'),
    ], default='operational')

    # 설치 정보
    installation_date = models.DateField('설치일', null=True, blank=True)
    warranty_expiry = models.DateField('보증 만료일', null=True, blank=True)

    # 담당자
    responsible_person = models.ForeignKey(
        'erp_sync.MasterEmployee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='responsible_equipments',
        verbose_name='설비 담당자'
    )

    # ERP 링크
    erp_sources = models.JSONField('ERP 출처', default=dict)

    # 메타데이터
    is_active = models.BooleanField('활성화', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'master_equipment'
        verbose_name = '마스터 설비'
        verbose_name_plural = '마스터 설비'
        ordering = ['plant', 'line', 'equipment_code']
        indexes = [
            models.Index(fields=['equipment_code']),
            models.Index(fields=['equipment_type']),
            models.Index(fields=['plant', 'line']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.equipment_code} - {self.equipment_name}'
