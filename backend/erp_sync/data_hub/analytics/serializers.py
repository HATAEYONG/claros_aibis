# -*- coding: utf-8 -*-
"""
분석 레이어 시리얼라이저
KPI 및 KRI 시리얼라이저
"""
from rest_framework import serializers
from .models import KPIDefinition, KPIFact, KRIDefinition, KRIFact


class KPIDefinitionSerializer(serializers.ModelSerializer):
    """KPI 정의 시리얼라이저"""

    owner_department_name = serializers.CharField(source='owner_department.department_name', read_only=True)
    owner_department_code = serializers.CharField(source='owner_department.department_code', read_only=True)

    class Meta:
        model = KPIDefinition
        fields = [
            'kpi_id', 'kpi_code', 'kpi_name', 'kpi_name_en',
            'kpi_type', 'domain', 'description', 'aggregation_method',
            'unit', 'target_direction', 'threshold_warning',
            'threshold_critical', 'calculation_logic', 'source_tables',
            'owner_department', 'owner_department_name', 'owner_department_code',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['kpi_id', 'created_at', 'updated_at']


class KPIFactSerializer(serializers.ModelSerializer):
    """KPI 팩트 시리얼라이저"""

    kpi_code = serializers.CharField(source='kpi.kpi_code', read_only=True)
    kpi_name = serializers.CharField(source='kpi.kpi_name', read_only=True)
    kpi_unit = serializers.CharField(source='kpi.unit', read_only=True)
    kpi_target_direction = serializers.CharField(source='kpi.target_direction', read_only=True)

    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    vendor_code = serializers.CharField(source='vendor.vendor_code', read_only=True)
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    customer_code = serializers.CharField(source='customer.customer_code', read_only=True)
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)

    class Meta:
        model = KPIFact
        fields = [
            'fact_id', 'kpi', 'kpi_code', 'kpi_name', 'kpi_unit',
            'kpi_target_direction', 'date', 'year', 'quarter', 'month',
            'week', 'plant', 'line', 'department', 'product',
            'product_code', 'product_name', 'vendor', 'vendor_code',
            'vendor_name', 'customer', 'customer_code', 'customer_name',
            'actual_value', 'target_value', 'baseline_value',
            'achievement_rate', 'variance', 'variance_rate', 'status',
            'source_system', 'source_table', 'calculated_at', 'updated_at',
            'metadata'
        ]
        read_only_fields = ['fact_id', 'calculated_at', 'updated_at']


class KPIDefinitionDetailSerializer(KPIDefinitionSerializer):
    """KPI 정의 상세 시리얼라이저 (최근 팩트 포함)"""

    latest_fact = serializers.SerializerMethodField()
    latest_value = serializers.SerializerMethodField()
    latest_status = serializers.SerializerMethodField()

    class Meta(KPIDefinitionSerializer.Meta):
        fields = KPIDefinitionSerializer.Meta.fields + [
            'latest_fact', 'latest_value', 'latest_status'
        ]

    def get_latest_fact(self, obj):
        latest = obj.facts.order_by('-date').first()
        if latest:
            return KPIFactSerializer(latest).data
        return None

    def get_latest_value(self, obj):
        latest = obj.facts.order_by('-date').first()
        return latest.actual_value if latest else None

    def get_latest_status(self, obj):
        latest = obj.facts.order_by('-date').first()
        return latest.status if latest else None


class KRIDefinitionSerializer(serializers.ModelSerializer):
    """KRI 정의 시리얼라이저"""

    owner_department_name = serializers.CharField(source='owner_department.department_name', read_only=True)
    owner_department_code = serializers.CharField(source='owner_department.department_code', read_only=True)

    class Meta:
        model = KRIDefinition
        fields = [
            'kri_id', 'kri_code', 'kri_name', 'kri_name_en',
            'kri_type', 'domain', 'description', 'aggregation_method',
            'unit', 'risk_level_low', 'risk_level_medium', 'risk_level_high',
            'calculation_logic', 'source_tables', 'owner_department',
            'owner_department_name', 'owner_department_code',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['kri_id', 'created_at', 'updated_at']


class KRIFactSerializer(serializers.ModelSerializer):
    """KRI 팩트 시리얼라이저"""

    kri_code = serializers.CharField(source='kri.kri_code', read_only=True)
    kri_name = serializers.CharField(source='kri.kri_name', read_only=True)
    kri_unit = serializers.CharField(source='kri.unit', read_only=True)

    vendor_code = serializers.CharField(source='vendor.vendor_code', read_only=True)
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)

    class Meta:
        model = KRIFact
        fields = [
            'fact_id', 'kri', 'kri_code', 'kri_name', 'kri_unit',
            'date', 'year', 'quarter', 'month', 'plant', 'line',
            'department', 'vendor', 'vendor_code', 'vendor_name',
            'actual_value', 'risk_level', 'risk_score', 'description',
            'source_system', 'source_table', 'calculated_at', 'updated_at',
            'metadata'
        ]
        read_only_fields = ['fact_id', 'calculated_at', 'updated_at']
