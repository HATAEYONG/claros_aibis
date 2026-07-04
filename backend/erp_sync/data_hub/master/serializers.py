# -*- coding: utf-8 -*-
"""
마스터 데이터 시리얼라이저
"""
from rest_framework import serializers
from .models import (
    MasterProduct, MasterVendor, MasterCustomer,
    MasterDepartment, MasterEmployee, MasterEquipment,
    MasterAccount, MasterWarehouse, MasterProcess, MasterBank
)


class MasterProductSerializer(serializers.ModelSerializer):
    """마스터 제품 시리얼라이저"""

    primary_vendor_name = serializers.CharField(source='primary_vendor.vendor_name', read_only=True)
    primary_vendor_code = serializers.CharField(source='primary_vendor.vendor_code', read_only=True)

    class Meta:
        model = MasterProduct
        fields = [
            'product_id', 'product_code', 'product_name', 'product_name_en',
            'product_type', 'specification', 'category_l1', 'category_l2', 'category_l3',
            'unit', 'weight', 'dimensions', 'primary_vendor', 'primary_vendor_name',
            'primary_vendor_code', 'standard_cost', 'last_purchase_price',
            'erp_sources', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['product_id', 'created_at', 'updated_at']


class MasterVendorSerializer(serializers.ModelSerializer):
    """마스터 공급처 시리얼라이저"""

    class Meta:
        model = MasterVendor
        fields = [
            'vendor_id', 'vendor_code', 'vendor_name', 'vendor_name_en',
            'vendor_type', 'business_type', 'business_category',
            'contact_person', 'contact_email', 'contact_phone', 'fax',
            'address', 'postal_code', 'country', 'region',
            'payment_terms', 'currency', 'credit_limit',
            'rating', 'risk_level', 'erp_sources',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['vendor_id', 'created_at', 'updated_at']


class MasterCustomerSerializer(serializers.ModelSerializer):
    """마스터 고객사 시리얼라이저"""

    class Meta:
        model = MasterCustomer
        fields = [
            'customer_id', 'customer_code', 'customer_name', 'customer_name_en',
            'customer_type', 'industry',
            'contact_person', 'contact_email', 'contact_phone',
            'address', 'postal_code', 'country',
            'payment_terms', 'currency', 'credit_limit', 'tier',
            'erp_sources', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['customer_id', 'created_at', 'updated_at']


class MasterDepartmentSerializer(serializers.ModelSerializer):
    """마스터 부서 시리얼라이저"""

    parent_department_name = serializers.CharField(source='parent_department.department_name', read_only=True)
    parent_department_code = serializers.CharField(source='parent_department.department_code', read_only=True)
    manager_name = serializers.CharField(source='manager.employee_name', read_only=True)
    manager_code = serializers.CharField(source='manager.employee_code', read_only=True)

    class Meta:
        model = MasterDepartment
        fields = [
            'department_id', 'department_code', 'department_name', 'department_name_en',
            'parent_department', 'parent_department_name', 'parent_department_code',
            'level', 'path', 'department_type', 'manager', 'manager_name',
            'manager_code', 'cost_center', 'plant', 'erp_sources',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['department_id', 'created_at', 'updated_at']


class MasterEmployeeSerializer(serializers.ModelSerializer):
    """마스터 직원 시리얼라이저"""

    department_name = serializers.CharField(source='department.department_name', read_only=True)
    department_code = serializers.CharField(source='department.department_code', read_only=True)

    class Meta:
        model = MasterEmployee
        fields = [
            'employee_id', 'employee_code', 'employee_name', 'employee_name_en',
            'department', 'department_name', 'department_code', 'position',
            'job_title', 'employment_type', 'email', 'phone', 'mobile',
            'status', 'hire_date', 'resignation_date', 'erp_sources',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']


class MasterEquipmentSerializer(serializers.ModelSerializer):
    """마스터 설비 시리얼라이저"""

    responsible_person_name = serializers.CharField(source='responsible_person.employee_name', read_only=True)
    responsible_person_code = serializers.CharField(source='responsible_person.employee_code', read_only=True)

    class Meta:
        model = MasterEquipment
        fields = [
            'equipment_id', 'equipment_code', 'equipment_name', 'equipment_name_en',
            'equipment_type', 'equipment_category', 'plant', 'line', 'location',
            'manufacturer', 'model', 'capacity', 'capacity_unit', 'status',
            'installation_date', 'warranty_expiry', 'responsible_person',
            'responsible_person_name', 'responsible_person_code', 'erp_sources',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['equipment_id', 'created_at', 'updated_at']


class MasterAccountSerializer(serializers.ModelSerializer):
    """마스터 계정과목 시리얼라이저"""

    control_account_name = serializers.CharField(source='control_account.account_name', read_only=True)
    control_account_code = serializers.CharField(source='control_account.account_code', read_only=True)

    class Meta:
        model = MasterAccount
        fields = [
            'account_id', 'account_code', 'account_name', 'account_name_en',
            'account_type', 'category_l1', 'category_l2', 'description',
            'control_account', 'control_account_name', 'control_account_code',
            'is_consolidated', 'is_tax_related', 'tax_code', 'erp_sources',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['account_id', 'created_at', 'updated_at']


class MasterWarehouseSerializer(serializers.ModelSerializer):
    """마스터 창고 시리얼라이저"""

    manager_name = serializers.CharField(source='manager.employee_name', read_only=True)
    manager_code = serializers.CharField(source='manager.employee_code', read_only=True)

    class Meta:
        model = MasterWarehouse
        fields = [
            'warehouse_id', 'warehouse_code', 'warehouse_name', 'warehouse_name_en',
            'warehouse_type', 'plant', 'building', 'floor', 'location',
            'capacity', 'capacity_unit', 'current_utilization', 'manager',
            'manager_name', 'manager_code', 'temperature_controlled',
            'temperature_min', 'temperature_max', 'erp_sources',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['warehouse_id', 'created_at', 'updated_at']


class MasterProcessSerializer(serializers.ModelSerializer):
    """마스터 공정 시리얼라이저"""

    responsible_person_name = serializers.CharField(source='responsible_person.employee_name', read_only=True)
    responsible_person_code = serializers.CharField(source='responsible_person.employee_code', read_only=True)

    class Meta:
        model = MasterProcess
        fields = [
            'process_id', 'process_code', 'process_name', 'process_name_en',
            'process_type', 'process_category', 'plant', 'line', 'work_center',
            'standard_cycle_time', 'standard_setup_time', 'standard_capacity',
            'equipment', 'responsible_person', 'responsible_person_name',
            'responsible_person_code', 'quality_standard', 'acceptance_criteria',
            'erp_sources', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['process_id', 'created_at', 'updated_at']


class MasterBankSerializer(serializers.ModelSerializer):
    """마스터 은행 시리얼라이저"""

    class Meta:
        model = MasterBank
        fields = [
            'bank_id', 'bank_code', 'bank_name', 'bank_name_en',
            'bank_type', 'bank_category', 'swift_code', 'bank_branch_code',
            'bank_branch_name', 'contact_phone', 'contact_email', 'fax',
            'address', 'postal_code', 'country', 'virtual_account_prefix',
            'default_account_number', 'payment_method', 'transfer_fee_rate',
            'erp_sources', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['bank_id', 'created_at', 'updated_at']
