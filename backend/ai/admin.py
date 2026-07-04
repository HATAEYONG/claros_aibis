from django.contrib import admin
from .models import (
    AgentRunLog, AnalysisPlan, Recommendation,
    ReflectionLog, AgentMemory, Document, DocumentChunk
)


@admin.register(AgentRunLog)
class AgentRunLogAdmin(admin.ModelAdmin):
    """Agent 실행 로그 Admin"""
    list_display = [
        "request_id", "agent_name", "status",
        "confidence", "execution_time_ms", "created_at"
    ]
    list_filter = ["agent_name", "status", "agent_domain", "evaluated"]
    search_fields = ["request_id", "agent_name"]
    readonly_fields = ["request_id", "created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("기본 정보", {
            "fields": ("request_id", "agent_name", "agent_version", "agent_layer", "agent_domain")
        }),
        ("입출력", {
            "fields": ("input_data", "output_data")
        }),
        ("결과", {
            "fields": ("status", "confidence", "execution_time_ms", "has_evidence")
        }),
        ("평가", {
            "fields": ("evaluated", "evaluation_score", "evaluation_note")
        }),
        ("연결", {
            "fields": ("parent_run_id", "triggered_event_id")
        }),
        ("시간", {
            "fields": ("created_at",)
        }),
    )


@admin.register(AnalysisPlan)
class AnalysisPlanAdmin(admin.ModelAdmin):
    """분석 계획 Admin"""
    list_display = [
        "plan_id", "plan_type", "description",
        "status", "completed_steps", "total_steps", "created_at"
    ]
    list_filter = ["plan_type", "status"]
    search_fields = ["plan_id", "description"]
    readonly_fields = ["plan_id", "created_at", "updated_at"]


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    """권고안 Admin"""
    list_display = [
        "recommendation_id", "title", "domain", "priority",
        "approved", "adopted", "created_at"
    ]
    list_filter = ["domain", "priority", "approved", "adopted"]
    search_fields = ["title", "description"]
    readonly_fields = ["recommendation_id", "created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("기본 정보", {
            "fields": ("recommendation_id", "title", "description")
        }),
        ("분류", {
            "fields": ("domain", "process_code", "priority", "impact_area")
        }),
        ("연결", {
            "fields": ("related_events", "related_kpis", "evidence_refs")
        }),
        ("예상 효과", {
            "fields": ("estimated_impact",)
        }),
        ("실행 항목", {
            "fields": ("action_items",)
        }),
        ("승인", {
            "fields": ("approval_level", "approved", "approved_by", "approved_at")
        }),
        ("피드백", {
            "fields": ("adopted", "adoption_feedback", "measured_improvement")
        }),
        ("생성 Agent", {
            "fields": ("generated_by_agent", "agent_run_id")
        }),
        ("시간", {
            "fields": ("created_at", "expires_at")
        }),
    )

    actions = ["approve_recommendations", "reject_recommendations", "mark_adopted"]

    def approve_recommendations(self, request, queryset):
        """선택된 권고사항 승인"""
        for rec in queryset:
            rec.approved = True
            rec.approved_by = request.user.username
            rec.save()
        self.message_user(request, f"{queryset.count()}개 권고사항을 승인했습니다.")
    approve_recommendations.short_description = "선택된 권고사항 승인"

    def reject_recommendations(self, request, queryset):
        """선택된 권고사항 거부"""
        for rec in queryset:
            rec.approved = False
            rec.approved_by = request.user.username
            rec.save()
        self.message_user(request, f"{queryset.count()}개 권고사항을 거부했습니다.")
    reject_recommendations.short_description = "선택된 권고사항 거부"

    def mark_adopted(self, request, queryset):
        """선택된 권고사항 채택 표시"""
        for rec in queryset:
            rec.adopted = True
            rec.save()
        self.message_user(request, f"{queryset.count()}개 권고사항을 채택으로 표시했습니다.")
    mark_adopted.short_description = "선택된 권고사항 채택 표시"


@admin.register(ReflectionLog)
class ReflectionLogAdmin(admin.ModelAdmin):
    """리플렉션 로그 Admin"""
    list_display = [
        "reflection_id", "agent_run", "reflection_type", "created_at"
    ]
    list_filter = ["reflection_type"]
    search_fields = ["agent_run__agent_name", "lessons_learned"]
    readonly_fields = ["reflection_id", "created_at"]


@admin.register(AgentMemory)
class AgentMemoryAdmin(admin.ModelAdmin):
    """Agent 메모리 Admin"""
    list_display = [
        "memory_id", "memory_type", "domain", "key",
        "importance", "frequency", "is_active", "last_used"
    ]
    list_filter = ["memory_type", "domain", "is_active"]
    search_fields = ["key", "value"]
    readonly_fields = ["memory_id", "created_at"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """RAG 문서 Admin"""
    list_display = [
        "doc_id", "title", "content_type", "source_type",
        "is_processed", "chunk_count", "created_at"
    ]
    list_filter = ["content_type", "source_type", "is_processed"]
    search_fields = ["title", "source_uri"]
    readonly_fields = ["doc_id", "created_at", "updated_at"]


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    """문서 청크 Admin"""
    list_display = [
        "chunk_id", "document", "chunk_index",
        "text_preview", "created_at"
    ]
    list_filter = ["document"]
    search_fields = ["text"]
    readonly_fields = ["chunk_id", "created_at"]

    def text_preview(self, obj):
        """텍스트 미리보기"""
        return obj.text[:100] + "..." if len(obj.text) > 100 else obj.text
    text_preview.short_description = "텍스트"
