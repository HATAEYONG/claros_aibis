# -*- coding: utf-8 -*-
"""
ERP 맵핑 관리 시리얼라이저
"""

from rest_framework import serializers
from .models import (
    ERPSyncConfig, ERPSyncLog, ERPSyncServiceConfig,
    ERPSalesYearPlan, ERPShipmentPlan, ERPShipmentPlanItem,
    ERPDeliveryHistory, ERPBOM, ERPMRP, ERPMRPMaterial,
    ERPProductionResult, ERPMESData,
    ERPQualityItem, ERPShipmentInspection, ERPShipmentDefect,
    ERPSupplier, ERPSupplierEvaluation, ERPSPC,
    ERPBarcodeDelivery, ERPMaterialPlan, ERPInventoryCheck,
    ERPLocation, ERPLocationStock,
    ERPWorkInProcess, ERPProductLedger, ERPAccountLedger,
    # FOM Models
    FOMProductionData, FOMInventoryData, FOMQualityData, FOMEquipmentData,
    FOMCostData, FOMFinanceData, FOMProductMaster, FOMEquipmentMaster, FOMBOMData
)

# ============================================================
# ERP 매핑 관리 시스템 Serializers (신규)
# ============================================================
# 모듈화된 매핑 관리 serializers import
from erp_sync.serializers import (
    # ERP Source
    ERPSourceSerializer,
    ERPTableDefinitionSerializer,
    ERPFieldDefinitionSerializer,
    # MIS Target
    ERPTargetModelSerializer,
    ERPTargetFieldSerializer,
    # Mapping
    ERPTableMappingSerializer as NewERPTableMappingSerializer,
    ERPFieldMappingSerializer as NewERPFieldMappingSerializer,
    ERPMappingValidationSerializer,
)


class ERPSyncConfigSerializer(serializers.ModelSerializer):
    """ERP 동기화 설정 시리얼라이저"""
    sync_interval_display = serializers.CharField(source='get_sync_interval_display', read_only=True)
    sync_priority_display = serializers.CharField(source='get_sync_priority_display', read_only=True)

    class Meta:
        model = ERPSyncConfig
        fields = [
            'id', 'config_id', 'erp_table', 'mis_model', 'sync_interval',
            'sync_interval_display', 'sync_priority', 'sync_priority_display',
            'is_active', 'last_sync_at', 'sync_query', 'field_mapping',
            'date_column'
        ]
        read_only_fields = ['config_id', 'last_sync_at']


class ERPSyncLogSerializer(serializers.ModelSerializer):
    """ERP 동기화 로그 시리얼라이저"""
    sync_type_display = serializers.CharField(source='get_sync_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = ERPSyncLog
        fields = [
            'sync_id', 'sync_type', 'sync_type_display', 'target_table',
            'status', 'status_display', 'started_at', 'finished_at',
            'total_count', 'success_count', 'error_count',
            'error_message', 'duration_seconds'
        ]
        read_only_fields = ['sync_id']

    def get_duration_seconds(self, obj):
        """소요 시간 계산"""
        if obj.started_at and obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None


# ERP 테이블 시리얼라이저

class ERPSalesYearPlanSerializer(serializers.ModelSerializer):
    """영업계획 시리얼라이저"""

    class Meta:
        model = ERPSalesYearPlan
        fields = '__all__'


class ERPShipmentPlanSerializer(serializers.ModelSerializer):
    """출하계획 시리얼라이저"""

    class Meta:
        model = ERPShipmentPlan
        fields = '__all__'


class ERPProductionResultSerializer(serializers.ModelSerializer):
    """생산실적 시리얼라이저"""

    class Meta:
        model = ERPProductionResult
        fields = '__all__'


class ERPShipmentInspectionSerializer(serializers.ModelSerializer):
    """출하검사 시리얼라이저"""

    class Meta:
        model = ERPShipmentInspection
        fields = '__all__'


class ERPLocationStockSerializer(serializers.ModelSerializer):
    """로케이션재고 시리얼라이저"""

    class Meta:
        model = ERPLocationStock
        fields = '__all__'


class ERPAccountLedgerSerializer(serializers.ModelSerializer):
    """계정원장 시리얼라이저"""

    class Meta:
        model = ERPAccountLedger
        fields = '__all__'


# FOM 시리얼라이저

class FOMProductionDataSerializer(serializers.ModelSerializer):
    """FOM 생산실적 시리얼라이저"""

    class Meta:
        model = FOMProductionData
        fields = '__all__'


class FOMInventoryDataSerializer(serializers.ModelSerializer):
    """FOM 재고현황 시리얼라이저"""

    class Meta:
        model = FOMInventoryData
        fields = '__all__'


class FOMQualityDataSerializer(serializers.ModelSerializer):
    """FOM 품질검사 시리얼라이저"""

    class Meta:
        model = FOMQualityData
        fields = '__all__'


class FOMEquipmentDataSerializer(serializers.ModelSerializer):
    """FOM 설비운전 시리얼라이저"""

    class Meta:
        model = FOMEquipmentData
        fields = '__all__'


class FOMCostDataSerializer(serializers.ModelSerializer):
    """FOM 원가현황 시리얼라이저"""

    class Meta:
        model = FOMCostData
        fields = '__all__'


class FOMFinanceDataSerializer(serializers.ModelSerializer):
    """FOM 재무현황 시리얼라이저"""

    class Meta:
        model = FOMFinanceData
        fields = '__all__'


class FOMProductMasterSerializer(serializers.ModelSerializer):
    """FOM 품목마스터 시리얼라이저"""

    class Meta:
        model = FOMProductMaster
        fields = '__all__'


class FOMEquipmentMasterSerializer(serializers.ModelSerializer):
    """FOM 설비마스터 시리얼라이저"""

    class Meta:
        model = FOMEquipmentMaster
        fields = '__all__'


class FOMBOMDataSerializer(serializers.ModelSerializer):
    """FOM BOM 시리얼라이저"""

    class Meta:
        model = FOMBOMData
        fields = '__all__'


# 맵핑 관리 관련 시리얼라이저

class ERPTableMappingSerializer(serializers.Serializer):
    """ERP 테이블 맵핑 정보 시리얼라이저"""
    module = serializers.CharField()
    erp_table = serializers.CharField()
    erp_table_name = serializers.CharField()
    mis_model = serializers.CharField()
    mis_model_name = serializers.CharField()
    sync_priority = serializers.IntegerField()
    is_active = serializers.BooleanField()
    last_sync_at = serializers.DateTimeField(allow_null=True)
    field_count = serializers.IntegerField()
    description = serializers.CharField(allow_blank=True)


class ERPModuleMappingSerializer(serializers.Serializer):
    """ERP 모듈별 맵핑 정보 시리얼라이저"""
    module_code = serializers.CharField()
    module_name = serializers.CharField()
    module_description = serializers.CharField()
    table_count = serializers.IntegerField()
    tables = ERPTableMappingSerializer(many=True)


class ERPFieldMappingSerializer(serializers.Serializer):
    """ERP 필드 맵핑 시리얼라이저"""
    erp_field = serializers.CharField()
    erp_field_type = serializers.CharField()
    mis_field = serializers.CharField()
    mis_field_type = serializers.CharField()
    is_key = serializers.BooleanField()
    is_required = serializers.BooleanField()
    transform_rule = serializers.CharField(allow_null=True, allow_blank=True)


# ============================================================
# ERP 동기화 서비스 설정 Serializers
# ============================================================

class ERPSyncServiceConfigSerializer(serializers.ModelSerializer):
    """ERP 동기화 서비스 설정 시리얼라이저"""
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    sync_status_display = serializers.CharField(source='get_sync_status_display', read_only=True)
    success_rate = serializers.SerializerMethodField()

    class Meta:
        model = ERPSyncServiceConfig
        fields = [
            'id', 'config_id', 'service_type', 'service_type_display',
            'service_name', 'is_enabled', 'sync_status', 'sync_status_display',
            'last_sync_at', 'last_error_message', 'total_sync_count',
            'success_sync_count', 'failed_sync_count', 'success_rate',
            'sync_interval_minutes', 'sync_table_settings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['config_id', 'created_at', 'updated_at', 'last_sync_at']

    def get_success_rate(self, obj):
        """성공률 계산"""
        if obj.total_sync_count > 0:
            return round(obj.success_sync_count / obj.total_sync_count * 100, 2)
        return 0


class ERPSyncServiceToggleSerializer(serializers.Serializer):
    """ERP 동기화 서비스 토글 시리얼라이저"""
    service_type = serializers.ChoiceField(choices=['sap', 'fom'])
    is_enabled = serializers.BooleanField(required=False)
