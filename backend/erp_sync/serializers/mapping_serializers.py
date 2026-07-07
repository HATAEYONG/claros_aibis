"""
ERP 매핑 관련 Serializers
"""

from rest_framework import serializers
from erp_sync.models import ERPTableMapping, ERPFieldMapping, ERPMappingValidation
from erp_sync.models import ERPTableDefinition, ERPFieldDefinition
from erp_sync.models import ERPTargetModel, ERPTargetField


class ERPFieldMappingSerializer(serializers.ModelSerializer):
    """ERP 필드 매핑 시리얼라이저"""
    source_field = serializers.SerializerMethodField()
    target_field = serializers.SerializerMethodField()

    class Meta:
        model = ERPFieldMapping
        fields = [
            'field_mapping_id',
            'table_mapping',
            'source_field',
            'target_field',
            'is_key_field',
            'is_required',
            'transform_rule',
            'transform_expression',
            'default_value',
            'validation_rule',
            'error_handling',
            'field_order',
            'created_at',
        ]
        read_only_fields = ['field_mapping_id', 'created_at']

    def get_source_field(self, obj):
        from erp_sync.serializers.erp_source_serializers import ERPFieldDefinitionSerializer
        return ERPFieldDefinitionSerializer(obj.source_field).data

    def get_target_field(self, obj):
        from erp_sync.serializers.mis_target_serializers import ERPTargetFieldSerializer
        return ERPTargetFieldSerializer(obj.target_field).data


class ERPTableMappingSerializer(serializers.ModelSerializer):
    """ERP 테이블 매핑 시리얼라이저"""
    source_table = serializers.SerializerMethodField()
    target_model = serializers.SerializerMethodField()
    source_table_id = serializers.IntegerField(write_only=True)
    target_model_id = serializers.IntegerField(write_only=True)
    field_mappings_count = serializers.SerializerMethodField()
    sync_priority_display = serializers.CharField(source='get_sync_priority_display', read_only=True)
    sync_type_display = serializers.CharField(source='get_sync_type_display', read_only=True)

    class Meta:
        model = ERPTableMapping
        fields = [
            'mapping_id',
            'mapping_code',
            'source_table',
            'target_model',
            'source_table_id',
            'target_model_id',
            'mapping_name',
            'description',
            'sync_priority',
            'sync_priority_display',
            'sync_type',
            'sync_type_display',
            'is_active',
            'date_column',
            'custom_query',
            'last_sync_at',
            'last_sync_status',
            'total_sync_count',
            'field_mappings_count',
            'created_at',
            'updated_at',
            'created_by',
        ]
        read_only_fields = ['mapping_id', 'created_at', 'updated_at', 'total_sync_count']

    def get_source_table(self, obj):
        from erp_sync.serializers.erp_source_serializers import ERPTableDefinitionSerializer
        return ERPTableDefinitionSerializer(obj.source_table).data

    def get_target_model(self, obj):
        from erp_sync.serializers.mis_target_serializers import ERPTargetModelSerializer
        return ERPTargetModelSerializer(obj.target_model).data

    def get_field_mappings_count(self, obj):
        return obj.field_mappings.count()

    def create(self, validated_data):
        """source_table_id와 target_model_id를 사용하여 객체 생성"""
        source_table_id = validated_data.pop('source_table_id')
        target_model_id = validated_data.pop('target_model_id')

        from erp_sync.models import ERPTableDefinition
        from erp_sync.models import ERPTargetModel

        source_table = ERPTableDefinition.objects.get(table_id=source_table_id)
        target_model = ERPTargetModel.objects.get(target_model_id=target_model_id)

        validated_data['source_table'] = source_table
        validated_data['target_model'] = target_model

        return super().create(validated_data)


class ERPTableMappingDetailSerializer(ERPTableMappingSerializer):
    """ERP 테이블 매핑 상세 시리얼라이저"""
    field_mappings = ERPFieldMappingSerializer(
        many=True,
        read_only=True
    )

    class Meta(ERPTableMappingSerializer.Meta):
        fields = ERPTableMappingSerializer.Meta.fields + ['field_mappings']


class ERPMappingValidationSerializer(serializers.ModelSerializer):
    """ERP 매핑 검증 시리얼라이저"""
    table_mapping = ERPTableMappingSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    validation_type_display = serializers.CharField(source='get_validation_type_display', read_only=True)

    class Meta:
        model = ERPMappingValidation
        fields = [
            'validation_id',
            'table_mapping',
            'validation_type',
            'validation_type_display',
            'status',
            'status_display',
            'validation_details',
            'error_message',
            'validated_at',
        ]
        read_only_fields = ['validation_id', 'validated_at']


# 생성/수정을 위한 간소화된 시리얼라이저

class ERPTableMappingCreateSerializer(serializers.ModelSerializer):
    """ERP 테이블 매핑 생성 시리얼라이저"""
    source_table_id = serializers.IntegerField(write_only=True)
    target_model_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ERPTableMapping
        fields = [
            'mapping_code',
            'mapping_name',
            'description',
            'source_table_id',
            'target_model_id',
            'sync_priority',
            'sync_type',
            'is_active',
            'date_column',
            'custom_query',
        ]

    def create(self, validated_data):
        source_table_id = validated_data.pop('source_table_id')
        target_model_id = validated_data.pop('target_model_id')

        source_table = ERPTableDefinition.objects.get(table_id=source_table_id)
        target_model = ERPTargetModel.objects.get(target_model_id=target_model_id)

        validated_data['source_table'] = source_table
        validated_data['target_model'] = target_model

        return ERPTableMapping.objects.create(**validated_data)


class ERPFieldMappingCreateSerializer(serializers.ModelSerializer):
    """ERP 필드 매핑 생성 시리얼라이저"""
    source_field_id = serializers.IntegerField(write_only=True)
    target_field_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ERPFieldMapping
        fields = [
            'table_mapping',
            'source_field_id',
            'target_field_id',
            'is_key_field',
            'is_required',
            'transform_rule',
            'transform_expression',
            'default_value',
            'validation_rule',
            'error_handling',
            'field_order',
        ]

    def create(self, validated_data):
        source_field_id = validated_data.pop('source_field_id')
        target_field_id = validated_data.pop('target_field_id')

        source_field = ERPFieldDefinition.objects.get(field_id=source_field_id)
        target_field = ERPTargetField.objects.get(target_field_id=target_field_id)

        validated_data['source_field'] = source_field
        validated_data['target_field'] = target_field

        return ERPFieldMapping.objects.create(**validated_data)


class ERPFieldMappingBulkCreateSerializer(serializers.Serializer):
    """ERP 필드 매핑 일괄 생성 시리얼라이저"""
    table_mapping_id = serializers.IntegerField()
    auto_match = serializers.BooleanField(default=False)
    mappings = ERPFieldMappingCreateSerializer(many=True, required=False)

    def validate_mappings(self, value):
        if not value:
            raise serializers.ValidationError("매핑 데이터가 필요합니다.")
        return value
