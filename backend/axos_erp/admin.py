"""
AXOS ERP V10.4 통합 Admin 설정
"""
from django.contrib import admin
from .models import (
    EventHub, RiskScore, ForecastRecord, AlertRecord,
    WorkflowTask, ProcessGraph, ProcessGraphEdge
)


@admin.register(EventHub)
class EventHubAdmin(admin.ModelAdmin):
    """이벤트 허브 Admin"""
    list_display = ["event_id", "topic", "event_key", "event_type", "created_at", "processed"]
    list_filter = ["topic", "event_type", "processed", "created_at"]
    search_fields = ["event_key", "event_type"]
    readonly_fields = ["event_id", "created_at"]
    ordering = ["-created_at"]


@admin.register(RiskScore)
class RiskScoreAdmin(admin.ModelAdmin):
    """리스크 점수 Admin"""
    list_display = ["risk_id", "object_type", "object_id", "score", "level", "created_at"]
    list_filter = ["object_type", "level", "created_at"]
    search_fields = ["object_id"]
    readonly_fields = ["risk_id", "created_at"]
    ordering = ["-created_at"]


@admin.register(ForecastRecord)
class ForecastRecordAdmin(admin.ModelAdmin):
    """포캐스팅 기록 Admin"""
    list_display = ["forecast_id", "revenue", "cost", "forecast_margin", "risk_level", "created_at"]
    list_filter = ["risk_level", "created_at"]
    readonly_fields = ["forecast_id", "created_at"]
    ordering = ["-created_at"]


@admin.register(AlertRecord)
class AlertRecordAdmin(admin.ModelAdmin):
    """알림 Admin"""
    list_display = ["alert_id", "alert_type", "title", "severity", "status", "created_at"]
    list_filter = ["alert_type", "severity", "status", "created_at"]
    search_fields = ["title", "source_object_id", "dedup_key"]
    readonly_fields = ["alert_id", "created_at"]
    ordering = ["-created_at"]


@admin.register(WorkflowTask)
class WorkflowTaskAdmin(admin.ModelAdmin):
    """워크플로우 태스크 Admin"""
    list_display = ["task_id", "task_type", "title", "owner_role", "status", "created_at"]
    list_filter = ["task_type", "owner_role", "status", "created_at"]
    search_fields = ["title", "source_object_id", "owner_role"]
    readonly_fields = ["task_id", "created_at"]
    ordering = ["-created_at"]


@admin.register(ProcessGraph)
class ProcessGraphAdmin(admin.ModelAdmin):
    """프로세스 그래프 Admin"""
    list_display = ["graph_id", "node_id", "node_label", "node_type", "status", "updated_at"]
    list_filter = ["node_type", "status", "created_at", "updated_at"]
    search_fields = ["node_id", "node_label"]
    readonly_fields = ["graph_id", "created_at", "updated_at"]
    ordering = ["node_id"]


@admin.register(ProcessGraphEdge)
class ProcessGraphEdgeAdmin(admin.ModelAdmin):
    """프로세스 그래프 엣지 Admin"""
    list_display = ["edge_id", "source_node", "target_node", "edge_type", "created_at"]
    list_filter = ["edge_type", "created_at"]
    search_fields = ["source_node", "target_node"]
    readonly_fields = ["edge_id", "created_at"]
    ordering = ["source_node", "target_node"]
