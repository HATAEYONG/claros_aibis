"""
ERP 소스 관련 Serializers
"""

from rest_framework import serializers
from erp_sync.models.erp_source import ERPSource, ERPTableDefinition, ERPFieldDefinition


class ERPSourceSerializer(serializers.ModelSerializer):
    """ERP 소스 시리얼라이저"""
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = ERPSource
        fields = [
            'erp_source_id',
            'source_code',
            'source_name',
            'source_type',
            'description',
            'host',
            'port',
            'database_name',
            'schema_name',
            'is_default',
            'is_active',
            'table_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['erp_source_id', 'created_at', 'updated_at']

    def get_table_count(self, obj):
        return obj.table_definitions.count()


class ERPSourceDetailSerializer(ERPSourceSerializer):
    """ERP 소스 상세 시리얼라이저"""
    tables = serializers.SerializerMethodField()

    class Meta(ERPSourceSerializer.Meta):
        fields = ERPSourceSerializer.Meta.fields + ['tables']

    def get_tables(self, obj):
        tables = obj.table_definitions.all()[:10]  # 최대 10개
        return ERPTableDefinitionSerializer(tables, many=True).data


class ERPTableDefinitionSerializer(serializers.ModelSerializer):
    """ERP 테이블 정의 시리얼라이저"""
    erp_source = ERPSourceSerializer(read_only=True)
    erp_source_id = serializers.IntegerField(write_only=True)
    field_count = serializers.SerializerMethodField()
    mappings_count = serializers.SerializerMethodField()

    class Meta:
        model = ERPTableDefinition
        fields = [
            'table_id',
            'erp_source',
            'erp_source_id',
            'source_table_name',
            'source_table_comment',
            'module_code',
            'module_name',
            'record_count',
            'field_count',
            'mappings_count',
            'last_synced_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['table_id', 'created_at', 'updated_at']

    def get_field_count(self, obj):
        return obj.field_definitions.count()

    def get_mappings_count(self, obj):
        return obj.table_mappings.count()


class ERPTableDefinitionDetailSerializer(ERPTableDefinitionSerializer):
    """ERP 테이블 정의 상세 시리얼라이저"""
    fields = serializers.SerializerMethodField()
    mappings = serializers.SerializerMethodField()

    class Meta(ERPTableDefinitionSerializer.Meta):
        fields = ERPTableDefinitionSerializer.Meta.fields + ['fields', 'mappings']

    def get_fields(self, obj):
        fields = obj.field_definitions.all().order_by('field_position')
        return ERPFieldDefinitionSerializer(fields, many=True).data

    def get_mappings(self, obj):
        mappings = obj.table_mappings.all()[:5]
        from erp_sync.serializers.mapping_serializers import ERPTableMappingSerializer
        return ERPTableMappingSerializer(mappings, many=True).data


class ERPFieldDefinitionSerializer(serializers.ModelSerializer):
    """ERP 필드 정의 시리얼라이저"""

    class Meta:
        model = ERPFieldDefinition
        fields = [
            'field_id',
            'table_definition',
            'source_field_name',
            'source_field_type',
            'source_field_comment',
            'is_primary_key',
            'is_nullable',
            'is_foreign_key',
            'referenced_table',
            'referenced_field',
            'field_position',
            'created_at',
        ]
        read_only_fields = ['field_id', 'created_at']


class ERPFieldDefinitionDetailSerializer(ERPFieldDefinitionSerializer):
    """ERP 필드 정의 상세 시리얼라이저"""
    table_definition = ERPTableDefinitionSerializer(read_only=True)
    mappings_count = serializers.SerializerMethodField()

    class Meta(ERPFieldDefinitionSerializer.Meta):
        fields = ERPFieldDefinitionSerializer.Meta.fields + ['mappings_count']

    def get_mappings_count(self, obj):
        return obj.field_mappings.count()
