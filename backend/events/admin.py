from django.contrib import admin
from .models import Event, EventCorrelation, EventType, EventSeverity, EventStatus


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """이벤트 Admin"""
    list_display = [
        "event_id", "event_type", "severity", "status",
        "scope_name", "domain", "event_time"
    ]
    list_filter = ["event_type", "severity", "status", "domain", "process_code"]
    search_fields = ["title", "description", "scope_id", "scope_name"]
    readonly_fields = [
        "event_id", "created_at", "updated_at",
        "acknowledged_at", "resolved_at"
    ]
    date_hierarchy = "event_time"

    fieldsets = (
        ("기본 정보", {
            "fields": ("event_id", "event_type", "severity", "status")
        }),
        ("범위", {
            "fields": ("scope_type", "scope_id", "scope_name")
        }),
        ("도메인/프로세스", {
            "fields": ("domain", "process_code")
        }),
        ("상세", {
            "fields": ("title", "description")
        }),
        ("수치", {
            "fields": ("observed_value", "threshold_value", "deviation_pct")
        }),
        ("KPI/KRI", {
            "fields": ("kpi_code", "kri_code")
        }),
        ("출처/근거", {
            "fields": ("source", "source_detail", "evidence_refs")
        }),
        ("Agent 연결", {
            "fields": ("detected_by_agent", "agent_run_id")
        }),
        ("확인 정보", {
            "fields": ("acknowledged_at", "acknowledged_by")
        }),
        ("해결 정보", {
            "fields": ("resolved_at", "resolved_by", "resolution_note")
        }),
        ("시간", {
            "fields": ("event_time", "created_at", "updated_at")
        }),
    )

    actions = ["acknowledge_events", "resolve_events"]

    def acknowledge_events(self, request, queryset):
        """선택된 이벤트 확인 처리"""
        for event in queryset:
            event.acknowledge(user=request.user.username)
        self.message_user(request, f"{queryset.count()}개 이벤트를 확인했습니다.")
    acknowledge_events.short_description = "선택된 이벤트 확인"

    def resolve_events(self, request, queryset):
        """선택된 이벤트 해결 처리"""
        for event in queryset:
            event.resolve(note="Admin을 통해 일괄 해결", user=request.user.username)
        self.message_user(request, f"{queryset.count()}개 이벤트를 해결했습니다.")
    resolve_events.short_description = "선택된 이벤트 해결"


@admin.register(EventCorrelation)
class EventCorrelationAdmin(admin.ModelAdmin):
    """이벤트 상관관계 Admin"""
    list_display = [
        "correlation_id", "source_event", "target_event",
        "correlation_type", "confidence", "created_at"
    ]
    list_filter = ["correlation_type"]
    search_fields = ["description"]
    readonly_fields = ["correlation_id", "created_at"]
