"""
AXOS ERP V10.4 통합 시리얼라이저
"""
from rest_framework import serializers
from .models import (
    EventHub, RiskScore, ForecastRecord, AlertRecord,
    WorkflowTask, ProcessGraph, ProcessGraphEdge
)


class EventHubSerializer(serializers.ModelSerializer):
    """이벤트 허브 시리얼라이저"""
    class Meta:
        model = EventHub
        fields = [
            "event_id", "topic", "event_key", "event_type",
            "payload_json", "created_at", "processed"
        ]
        read_only_fields = ["event_id", "created_at"]


class EventHubPublishSerializer(serializers.Serializer):
    """이벤트 발행 시리얼라이저"""
    topic = serializers.CharField(max_length=100)
    event_key = serializers.CharField(max_length=200)
    event_type = serializers.CharField(max_length=100)
    payload_json = serializers.JSONField(default=dict)


class RiskScoreSerializer(serializers.ModelSerializer):
    """리스크 점수 시리얼라이저"""
    explanation = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    class Meta:
        model = RiskScore
        fields = [
            "risk_id", "object_type", "object_id", "score", "level",
            "explanation", "features", "created_at"
        ]
        read_only_fields = ["risk_id", "created_at"]

    def get_explanation(self, obj):
        """설명 JSON 반환"""
        return obj.explanation_json

    def get_features(self, obj):
        """특성 JSON 반환"""
        return obj.features_json


class RiskScoreRequestSerializer(serializers.Serializer):
    """리스크 점수 요청 시리얼라이저"""
    object_type = serializers.CharField(max_length=100)
    object_id = serializers.CharField(max_length=200)
    features = serializers.JSONField(default=dict)


class ForecastRecordSerializer(serializers.ModelSerializer):
    """포캐스팅 기록 시리얼라이저"""
    class Meta:
        model = ForecastRecord
        fields = [
            "forecast_id", "revenue", "cost", "delay_penalty", "rework_cost",
            "forecast_margin", "risk_level", "recommendation", "created_at"
        ]
        read_only_fields = ["forecast_id", "created_at"]


class ForecastRequestSerializer(serializers.Serializer):
    """포캐스팅 요청 시리얼라이저"""
    revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    delay_penalty = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    rework_cost = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)


class AlertRecordSerializer(serializers.ModelSerializer):
    """알림 시리얼라이저"""
    detail = serializers.SerializerMethodField()

    class Meta:
        model = AlertRecord
        fields = [
            "alert_id", "alert_type", "title", "severity",
            "source_object_type", "source_object_id", "dedup_key",
            "status", "detail", "created_at", "acknowledged_at", "resolved_at"
        ]
        read_only_fields = ["alert_id", "created_at"]

    def get_detail(self, obj):
        """상세 정보 JSON 반환"""
        return obj.detail_json


class AlertCreateSerializer(serializers.Serializer):
    """알림 생성 시리얼라이저"""
    alert_type = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=500)
    severity = serializers.ChoiceField(choices=["CRITICAL", "HIGH", "MEDIUM", "LOW"])
    source_object_type = serializers.CharField(max_length=100, default="")
    source_object_id = serializers.CharField(max_length=200, default="")
    dedup_key = serializers.CharField(max_length=200, default="", required=False)
    detail_json = serializers.JSONField(default=dict, required=False)


class AlertActionSerializer(serializers.Serializer):
    """알림 액션 시리얼라이저"""
    action = serializers.ChoiceField(choices=["acknowledge", "resolve", "close"])


class WorkflowTaskSerializer(serializers.ModelSerializer):
    """워크플로우 태스크 시리얼라이저"""
    detail = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowTask
        fields = [
            "task_id", "task_type", "title", "owner_role",
            "source_object_type", "source_object_id", "status",
            "detail", "created_at", "completed_at"
        ]
        read_only_fields = ["task_id", "created_at"]

    def get_detail(self, obj):
        """상세 정보 JSON 반환"""
        return obj.detail_json


class TaskCreateSerializer(serializers.Serializer):
    """태스크 생성 시리얼라이저"""
    task_type = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=500)
    owner_role = serializers.CharField(max_length=100)
    source_object_type = serializers.CharField(max_length=100, default="")
    source_object_id = serializers.CharField(max_length=200, default="")
    detail_json = serializers.JSONField(default=dict, required=False)


class TaskActionSerializer(serializers.Serializer):
    """태스크 액션 시리얼라이저"""
    action = serializers.ChoiceField(choices=["start", "complete", "cancel"])


class ProcessGraphSerializer(serializers.ModelSerializer):
    """프로세스 그래프 시리얼라이저"""
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = ProcessGraph
        fields = [
            "graph_id", "node_id", "node_label", "node_type",
            "status", "metadata", "created_at", "updated_at"
        ]
        read_only_fields = ["graph_id", "created_at", "updated_at"]

    def get_metadata(self, obj):
        """메타데이터 JSON 반환"""
        return obj.metadata_json


class ProcessGraphEdgeSerializer(serializers.ModelSerializer):
    """프로세스 그래프 엣지 시리얼라이저"""
    class Meta:
        model = ProcessGraphEdge
        fields = ["edge_id", "source_node", "target_node", "label", "edge_type", "created_at"]
        read_only_fields = ["edge_id", "created_at"]


class GraphUpdateSerializer(serializers.Serializer):
    """그래프 업데이트 시리얼라이저"""
    nodes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=[]
    )
    edges = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=[]
    )


class GraphDataSerializer(serializers.Serializer):
    """그래프 데이터 시리얼라이저"""
    nodes = ProcessGraphSerializer(many=True)
    edges = ProcessGraphEdgeSerializer(many=True)
