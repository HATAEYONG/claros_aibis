"""
MIS 타겟 모델 관련 Serializers
"""

from rest_framework import serializers
from erp_sync.models.mis_target import ERPTargetModel, ERPTargetField


class ERPTargetFieldSerializer(serializers.ModelSerializer):
    """MIS 타겟 필드 시리얼라이저"""

    class Meta:
        model = ERPTargetField
        fields = [
            'target_field_id',
            'target_model',
            'field_name',
            'field_type',
            'field_label',
            'is_required',
            'is_unique',
            'max_length',
            'decimal_places',
            'created_at',
        ]
        read_only_fields = ['target_field_id', 'created_at']


class ERPTargetModelSerializer(serializers.ModelSerializer):
    """MIS 타겟 모델 시리얼라이저"""
    field_count = serializers.SerializerMethodField()
    mappings_count = serializers.SerializerMethodField()

    class Meta:
        model = ERPTargetModel
        fields = [
            'target_model_id',
            'model_name',
            'model_label',
            'app_label',
            'model_type',
            'db_table_name',
            'description',
            'field_count',
            'mappings_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['target_model_id', 'created_at', 'updated_at']

    def get_field_count(self, obj):
        return obj.target_fields.count()

    def get_mappings_count(self, obj):
        return obj.table_mappings.count()


class ERPTargetModelDetailSerializer(ERPTargetModelSerializer):
    """MIS 타겟 모델 상세 시리얼라이저"""
    fields = ERPTargetFieldSerializer(source='target_fields', many=True, read_only=True)
    mappings = serializers.SerializerMethodField()

    class Meta(ERPTargetModelSerializer.Meta):
        fields = ERPTargetModelSerializer.Meta.fields + ['fields', 'mappings']

    def get_mappings(self, obj):
        mappings = obj.table_mappings.all()[:5]
        from erp_sync.serializers.mapping_serializers import ERPTableMappingSerializer
        return ERPTableMappingSerializer(mappings, many=True).data
