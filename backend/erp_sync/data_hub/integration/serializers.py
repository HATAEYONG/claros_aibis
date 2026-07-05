# -*- coding: utf-8 -*-
"""
통합 레이어 시리얼라이저
O2C/P2P 프로세스가 마스터 데이터를 통해 실제로 이어지는 것을 API로 노출
"""
from rest_framework import serializers

from .models import (
    IntegratedMaterial, IntegratedProductionOrder,
    IntegratedQualityRecord, IntegratedSalesOrder,
)


class IntegratedMaterialSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    primary_vendor_name = serializers.CharField(source='primary_vendor.vendor_name', read_only=True)

    class Meta:
        model = IntegratedMaterial
        fields = [
            'material_id', 'product', 'product_code', 'product_name',
            'plant', 'warehouse', 'location',
            'quantity_on_hand', 'quantity_reserved', 'quantity_available', 'safety_stock',
            'moving_average_cost', 'standard_cost', 'total_value',
            'primary_vendor', 'primary_vendor_name', 'lead_time_days',
            'last_receipt_date', 'last_issue_date', 'turnover_rate', 'days_of_supply',
            'is_abcs', 'is_slow_moving', 'erp_sources',
            'last_synced_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['material_id', 'last_synced_at', 'created_at', 'updated_at']


class IntegratedProductionOrderSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    equipment_name = serializers.CharField(source='equipment.equipment_name', read_only=True)
    production_supervisor_name = serializers.CharField(source='production_supervisor.employee_name', read_only=True)

    class Meta:
        model = IntegratedProductionOrder
        fields = [
            'order_id', 'order_number', 'order_type', 'product', 'product_code', 'product_name',
            'quantity_ordered', 'quantity_produced', 'quantity_scrapped',
            'plant', 'line', 'equipment', 'equipment_name',
            'start_date_scheduled', 'start_date_actual', 'end_date_scheduled', 'end_date_actual',
            'status', 'progress', 'standard_cost', 'actual_cost',
            'production_supervisor', 'production_supervisor_name', 'erp_sources',
            'last_synced_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['order_id', 'last_synced_at', 'created_at', 'updated_at']


class IntegratedQualityRecordSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    inspector_name = serializers.CharField(source='inspector.employee_name', read_only=True)
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)

    class Meta:
        model = IntegratedQualityRecord
        fields = [
            'record_id', 'record_number', 'record_type', 'product', 'product_code', 'product_name',
            'lot_number', 'batch_number',
            'inspection_quantity', 'ok_quantity', 'ng_quantity', 'rework_quantity',
            'result', 'defect_types', 'defect_details',
            'inspection_date', 'inspector', 'inspector_name',
            'customer', 'customer_name', 'claim_number',
            'capa_required', 'capa_number', 'capa_due_date', 'capa_status',
            'erp_sources', 'last_synced_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['record_id', 'last_synced_at', 'created_at', 'updated_at']


class IntegratedSalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sales_person_name = serializers.CharField(source='sales_person.employee_name', read_only=True)

    class Meta:
        model = IntegratedSalesOrder
        fields = [
            'order_id', 'order_number', 'customer', 'customer_name', 'customer_po',
            'product', 'product_code', 'product_name',
            'quantity_ordered', 'quantity_shipped', 'quantity_invoiced',
            'unit_price', 'currency', 'total_amount',
            'order_date', 'request_date', 'promise_date', 'actual_shipment_date',
            'status', 'progress', 'sales_person', 'sales_person_name', 'remarks',
            'erp_sources', 'last_synced_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['order_id', 'last_synced_at', 'created_at', 'updated_at']


class ProcessChainSerializer(serializers.Serializer):
    """제품 하나를 축으로 수주→생산→품질→재고 전 과정을 한 번에 묶어 보여주는 뷰용 시리얼라이저"""
    product_code = serializers.CharField()
    product_name = serializers.CharField()
    sales_orders = IntegratedSalesOrderSerializer(many=True)
    production_orders = IntegratedProductionOrderSerializer(many=True)
    quality_records = IntegratedQualityRecordSerializer(many=True)
    materials = IntegratedMaterialSerializer(many=True)
