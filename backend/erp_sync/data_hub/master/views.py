# -*- coding: utf-8 -*-
"""
마스터 데이터 API 뷰
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from utils.export_import import ExportImportMixin
from utils.batch_operations import BatchOperationsMixin

from .models import (
    MasterProduct, MasterVendor, MasterCustomer,
    MasterDepartment, MasterEmployee, MasterEquipment,
    MasterAccount, MasterWarehouse, MasterProcess, MasterBank
)
from .serializers import (
    MasterProductSerializer, MasterVendorSerializer, MasterCustomerSerializer,
    MasterDepartmentSerializer, MasterEmployeeSerializer, MasterEquipmentSerializer,
    MasterAccountSerializer, MasterWarehouseSerializer, MasterProcessSerializer,
    MasterBankSerializer
)


class MasterProductViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 제품 ViewSet"""

    serializer_class = MasterProductSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'product_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product_type', 'category_l1', 'category_l2', 'is_active']
    search_fields = ['product_code', 'product_name', 'product_name_en', 'specification']
    ordering_fields = ['product_code', 'product_name', 'created_at']
    ordering = ['product_code']

    def get_queryset(self):
        queryset = MasterProduct.objects.select_related('primary_vendor').all()
        return queryset

    def get_export_field_names(self):
        return {
            'product_code': '제품 코드',
            'product_name': '제품명',
            'product_type': '제품 유형',
            'category_l1': '대분류',
            'category_l2': '중분류',
            'unit': '단위',
            'standard_cost': '표준 원가',
            'is_active': '활성화',
        }


class MasterVendorViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 공급처 ViewSet"""

    serializer_class = MasterVendorSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'vendor_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vendor_type', 'risk_level', 'is_active']
    search_fields = ['vendor_code', 'vendor_name', 'vendor_name_en', 'contact_person']
    ordering_fields = ['vendor_code', 'vendor_name', 'created_at']
    ordering = ['vendor_code']

    def get_queryset(self):
        return MasterVendor.objects.all()

    def get_export_field_names(self):
        return {
            'vendor_code': '공급처 코드',
            'vendor_name': '공급처명',
            'vendor_type': '공급처 유형',
            'risk_level': '리스크 수준',
            'rating': '등급',
            'contact_person': '담당자',
            'contact_email': '이메일',
            'is_active': '활성화',
        }


class MasterCustomerViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 고객사 ViewSet"""

    serializer_class = MasterCustomerSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'customer_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['customer_type', 'tier', 'is_active']
    search_fields = ['customer_code', 'customer_name', 'customer_name_en', 'contact_person']
    ordering_fields = ['customer_code', 'customer_name', 'created_at']
    ordering = ['customer_code']

    def get_queryset(self):
        return MasterCustomer.objects.all()

    def get_export_field_names(self):
        return {
            'customer_code': '고객사 코드',
            'customer_name': '고객사명',
            'customer_type': '고객 유형',
            'tier': '등급',
            'industry': '산업군',
            'contact_person': '담당자',
            'is_active': '활성화',
        }


class MasterDepartmentViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 부서 ViewSet"""

    serializer_class = MasterDepartmentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'department_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department_type', 'level', 'plant', 'is_active']
    search_fields = ['department_code', 'department_name', 'department_name_en', 'path']
    ordering_fields = ['level', 'department_code', 'created_at']
    ordering = ['level', 'department_code']

    def get_queryset(self):
        return MasterDepartment.objects.select_related('parent_department', 'manager').all()

    def get_export_field_names(self):
        return {
            'department_code': '부서 코드',
            'department_name': '부서명',
            'department_type': '부서 유형',
            'level': '조직 레벨',
            'path': '조직 경로',
            'cost_center': '비용 센터',
            'plant': '공장',
            'is_active': '활성화',
        }


class MasterEmployeeViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 직원 ViewSet"""

    serializer_class = MasterEmployeeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'employee_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'status', 'employment_type']
    search_fields = ['employee_code', 'employee_name', 'employee_name_en', 'email', 'phone']
    ordering_fields = ['employee_code', 'employee_name', 'created_at']
    ordering = ['employee_code']

    def get_queryset(self):
        return MasterEmployee.objects.select_related('department').all()

    def get_export_field_names(self):
        return {
            'employee_code': '사번',
            'employee_name': '성명',
            'department_code': '부서 코드',
            'department_name': '부서명',
            'position': '직위',
            'job_title': '직책',
            'status': '상태',
            'email': '이메일',
        }


class MasterEquipmentViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 설비 ViewSet"""

    serializer_class = MasterEquipmentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'equipment_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment_type', 'plant', 'line', 'status', 'is_active']
    search_fields = ['equipment_code', 'equipment_name', 'equipment_name_en', 'manufacturer', 'model']
    ordering_fields = ['equipment_code', 'equipment_name', 'created_at']
    ordering = ['plant', 'line', 'equipment_code']

    def get_queryset(self):
        return MasterEquipment.objects.select_related('responsible_person').all()

    def get_export_field_names(self):
        return {
            'equipment_code': '설비 코드',
            'equipment_name': '설비명',
            'equipment_type': '설비 유형',
            'plant': '공장',
            'line': '라인',
            'status': '상태',
            'manufacturer': '제조사',
            'model': '모델',
            'capacity': '용량',
        }


class MasterAccountViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 계정과목 ViewSet"""

    serializer_class = MasterAccountSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'account_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['account_type', 'category_l1', 'category_l2', 'is_active']
    search_fields = ['account_code', 'account_name', 'account_name_en']
    ordering_fields = ['account_code', 'account_name', 'created_at']
    ordering = ['account_code']

    def get_queryset(self):
        return MasterAccount.objects.select_related('control_account').all()

    def get_export_field_names(self):
        return {
            'account_code': '계정 코드',
            'account_name': '계정과목명',
            'account_type': '계정 유형',
            'category_l1': '대분류',
            'category_l2': '중분류',
            'is_consolidated': '통합 항목',
            'is_tax_related': '세무 관련',
        }

    @action(detail=False, methods=['get'])
    def account_types(self, request):
        """계정 유형 목록"""
        types = [choice[0] for choice in MasterAccount.ACCOUNT_TYPE_CHOICES]
        return Response({'account_types': types})


class MasterWarehouseViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 창고 ViewSet"""

    serializer_class = MasterWarehouseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'warehouse_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['warehouse_type', 'plant', 'temperature_controlled', 'is_active']
    search_fields = ['warehouse_code', 'warehouse_name', 'warehouse_name_en']
    ordering_fields = ['warehouse_code', 'warehouse_name', 'created_at']
    ordering = ['plant', 'warehouse_code']

    def get_queryset(self):
        return MasterWarehouse.objects.select_related('manager').all()

    def get_export_field_names(self):
        return {
            'warehouse_code': '창고 코드',
            'warehouse_name': '창고명',
            'warehouse_type': '창고 유형',
            'plant': '공장',
            'building': '건물',
            'capacity': '용량',
            'current_utilization': '사용률(%)',
            'temperature_controlled': '온도 제어',
        }

    @action(detail=False, methods=['get'])
    def warehouse_types(self, request):
        """창고 유형 목록"""
        types = [choice[0] for choice in MasterWarehouse.WAREHOUSE_TYPE_CHOICES]
        return Response({'warehouse_types': types})


class MasterProcessViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 공정 ViewSet"""

    serializer_class = MasterProcessSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'process_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['process_type', 'process_category', 'plant', 'line', 'is_active']
    search_fields = ['process_code', 'process_name', 'process_name_en', 'work_center']
    ordering_fields = ['process_code', 'process_name', 'created_at']
    ordering = ['plant', 'line', 'process_code']

    def get_queryset(self):
        return MasterProcess.objects.select_related('responsible_person').prefetch_related('equipment').all()

    def get_export_field_names(self):
        return {
            'process_code': '공정 코드',
            'process_name': '공정명',
            'process_type': '공정 유형',
            'plant': '공장',
            'line': '라인',
            'standard_cycle_time': '표준 공시간(초)',
            'standard_setup_time': '준비 시간(분)',
            'standard_capacity': '능률(개/시)',
        }

    @action(detail=False, methods=['get'])
    def process_types(self, request):
        """공정 유형 목록"""
        types = [choice[0] for choice in MasterProcess.PROCESS_TYPE_CHOICES]
        return Response({'process_types': types})


class MasterBankViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """마스터 은행 ViewSet"""

    serializer_class = MasterBankSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'bank_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['bank_type', 'bank_category', 'is_active']
    search_fields = ['bank_code', 'bank_name', 'bank_name_en', 'swift_code']
    ordering_fields = ['bank_code', 'bank_name', 'created_at']
    ordering = ['bank_code']

    def get_queryset(self):
        return MasterBank.objects.all()

    def get_export_field_names(self):
        return {
            'bank_code': '은행 코드',
            'bank_name': '은행명',
            'bank_type': '은행 유형',
            'swift_code': 'SWIFT 코드',
            'bank_branch_code': '지점 코드',
            'bank_branch_name': '지점명',
            'contact_phone': '연락처',
        }

    @action(detail=False, methods=['get'])
    def bank_types(self, request):
        """은행 유형 목록"""
        types = [choice[0] for choice in MasterBank.BANK_TYPE_CHOICES]
        return Response({'bank_types': types})
