from rest_framework import serializers
from .models import (
    OntologyCategory,
    OntologyElement,
    ERPTableMapping,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog,
    OntologyNode,
    OntologyEdge,
)


class ERPTableMappingSerializer(serializers.ModelSerializer):
    """ERP 테이블 맵핑 시리얼라이저"""

    class Meta:
        model = ERPTableMapping
        fields = [
            'id', 'table_name', 'table_description', 'module',
            'key_columns', 'link_columns', 'data_flow_direction', 'is_active'
        ]


class OntologyElementSerializer(serializers.ModelSerializer):
    """온톨로지 요소 시리얼라이저"""
    erp_tables = ERPTableMappingSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = OntologyElement
        fields = [
            'id', 'code', 'name_ko', 'name_en', 'description',
            'icon', 'color', 'sort_order', 'is_active',
            'category_name', 'table_count', 'erp_tables'
        ]

    def get_table_count(self, obj):
        return obj.erp_tables.filter(is_active=True).count()


class OntologyElementListSerializer(serializers.ModelSerializer):
    """온톨로지 요소 목록 시리얼라이저"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = OntologyElement
        fields = [
            'id', 'code', 'name_ko', 'name_en', 'icon', 'color',
            'category_name', 'table_count', 'is_active'
        ]

    def get_table_count(self, obj):
        return obj.erp_tables.filter(is_active=True).count()


class OntologyCategorySerializer(serializers.ModelSerializer):
    """온톨로지 카테고리 시리얼라이저"""
    elements = OntologyElementListSerializer(many=True, read_only=True)
    element_count = serializers.SerializerMethodField()
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = OntologyCategory
        fields = [
            'code', 'name', 'name_en', 'description', 'level',
            'sort_order', 'is_active', 'element_count', 'table_count', 'elements'
        ]

    def get_element_count(self, obj):
        return obj.elements.filter(is_active=True).count()

    def get_table_count(self, obj):
        total = 0
        for element in obj.elements.filter(is_active=True):
            total += element.erp_tables.filter(is_active=True).count()
        return total


class OntologyCategoryListSerializer(serializers.ModelSerializer):
    """온톨로지 카테고리 목록 시리얼라이저"""
    element_count = serializers.SerializerMethodField()
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = OntologyCategory
        fields = [
            'code', 'name', 'name_en', 'level', 'sort_order',
            'element_count', 'table_count', 'is_active'
        ]

    def get_element_count(self, obj):
        return obj.elements.filter(is_active=True).count()

    def get_table_count(self, obj):
        total = 0
        for element in obj.elements.filter(is_active=True):
            total += element.erp_tables.filter(is_active=True).count()
        return total


class OntologyRelationSerializer(serializers.ModelSerializer):
    """온톨로지 관계 시리얼라이저"""
    source_name = serializers.CharField(source='source_element.name_ko', read_only=True)
    target_name = serializers.CharField(source='target_element.name_ko', read_only=True)
    source_category = serializers.CharField(source='source_element.category.code', read_only=True)
    target_category = serializers.CharField(source='target_element.category.code', read_only=True)
    relation_type_display = serializers.CharField(source='get_relation_type_display', read_only=True)

    class Meta:
        model = OntologyRelation
        fields = [
            'id', 'source_element', 'target_element', 'relation_type',
            'relation_type_display', 'link_key', 'description', 'weight',
            'source_name', 'target_name', 'source_category', 'target_category'
        ]


class DataFlowMetricsSerializer(serializers.ModelSerializer):
    """데이터 흐름 지표 시리얼라이저"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = DataFlowMetrics
        fields = [
            'id', 'category', 'category_name', 'metric_date',
            'metric_name', 'metric_value', 'metric_unit',
            'previous_value', 'change_rate', 'status'
        ]


class OntologyAnalysisLogSerializer(serializers.ModelSerializer):
    """온톨로지 분석 로그 시리얼라이저"""

    class Meta:
        model = OntologyAnalysisLog
        fields = [
            'id', 'analysis_type', 'start_category', 'end_category',
            'analysis_date', 'parameters', 'result_summary',
            'record_count', 'execution_time_ms', 'status',
            'error_message', 'created_at', 'completed_at'
        ]


class OntologyFlowChainSerializer(serializers.Serializer):
    """온톨로지 데이터 흐름 체인 시리얼라이저"""
    start_category = serializers.CharField()
    end_category = serializers.CharField()
    flow_chain = serializers.ListField()
    total_elements = serializers.IntegerField()
    total_tables = serializers.IntegerField()


class Impact4M2ESerializer(serializers.Serializer):
    """4M2E 영향도 분석 시리얼라이저"""
    target_date = serializers.DateField()
    man = serializers.DictField()
    machine = serializers.DictField()
    material = serializers.DictField()
    method = serializers.DictField()
    environment = serializers.DictField()
    energy = serializers.DictField()
    total_cost = serializers.DecimalField(max_digits=18, decimal_places=2)


class CostToESGSerializer(serializers.Serializer):
    """원가→ESG 추적 시리얼라이저"""
    cost_month = serializers.CharField()
    environment = serializers.DictField()
    social = serializers.DictField()
    governance = serializers.DictField()
    esg_score = serializers.DecimalField(max_digits=5, decimal_places=2)


# ==========================================
# Knowledge Graph Serializers
# ==========================================

class OntologyNodeSerializer(serializers.ModelSerializer):
    """온톨로지 노드 시리얼라이저"""

    node_type_display = serializers.CharField(source='get_node_type_display', read_only=True)
    outgoing_edges_count = serializers.SerializerMethodField()
    incoming_edges_count = serializers.SerializerMethodField()

    class Meta:
        model = OntologyNode
        fields = [
            'node_id', 'node_type', 'node_type_display', 'name', 'code',
            'category', 'labels', 'properties', 'metadata', 'is_active',
            'outgoing_edges_count', 'incoming_edges_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['node_id', 'created_at', 'updated_at']

    def get_outgoing_edges_count(self, obj):
        return obj.outgoing_edges.filter(is_active=True).count()

    def get_incoming_edges_count(self, obj):
        return obj.incoming_edges.filter(is_active=True).count()


class OntologyEdgeSerializer(serializers.ModelSerializer):
    """온톨로지 엣지 시리얼라이저"""

    relationship_type_display = serializers.CharField(source='get_relationship_type_display', read_only=True)
    source_node_name = serializers.CharField(source='source_node.name', read_only=True)
    target_node_name = serializers.CharField(source='target_node.name', read_only=True)

    class Meta:
        model = OntologyEdge
        fields = [
            'edge_id', 'source_node', 'target_node', 'source_node_name', 'target_node_name',
            'relationship_type', 'relationship_type_display', 'properties',
            'weight', 'confidence', 'metadata', 'is_active', 'created_at',
        ]
        read_only_fields = ['edge_id', 'created_at']


class GraphPathSerializer(serializers.Serializer):
    """그래프 경로 시리얼라이저"""
    nodes = serializers.ListField(child=serializers.CharField())
    edges = serializers.ListField()
    length = serializers.IntegerField()


class GraphSubgraphSerializer(serializers.Serializer):
    """하위 그래프 시리얼라이저"""
    nodes = serializers.ListField()
    edges = serializers.ListField()
    statistics = serializers.DictField()


class GraphCentralitySerializer(serializers.Serializer):
    """중심성 분석 시리얼라이저"""
    node_id = serializers.CharField()
    degree_centrality = serializers.FloatField()
    betweenness_centrality = serializers.FloatField()
    closeness_centrality = serializers.FloatField()
    pagerank = serializers.FloatField()
