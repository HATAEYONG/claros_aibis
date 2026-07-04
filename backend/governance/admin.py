from django.contrib import admin
from .models import PolicyRule, PolicyViolation, ApprovalRequest, ApprovalWorkflow


@admin.register(PolicyRule)
class PolicyRuleAdmin(admin.ModelAdmin):
    """정책 규칙 Admin"""
    list_display = [
        "rule_id", "code", "name_ko", "category",
        "severity", "is_active", "created_at"
    ]
    list_filter = ["category", "severity", "is_active"]
    search_fields = ["code", "name_ko", "name_en", "description"]
    readonly_fields = ["rule_id", "created_at", "updated_at"]


@admin.register(PolicyViolation)
class PolicyViolationAdmin(admin.ModelAdmin):
    """정책 위반 Admin"""
    list_display = [
        "violation_id", "policy_rule", "violating_entity",
        "severity", "status", "detected_at"
    ]
    list_filter = ["policy_rule__category", "severity", "status", "entity_type"]
    search_fields = ["violating_entity", "violation_details"]
    readonly_fields = ["violation_id", "detected_at", "updated_at"]
    date_hierarchy = "detected_at"

    actions = ["resolve_violations"]

    def resolve_violations(self, request, queryset):
        """선택된 위반 해결"""
        for violation in queryset.filter(status="open"):
            violation.resolve(resolution="Admin을 통해 일괄 해결", user=request.user.username)
        self.message_user(request, f"{queryset.count()}개 위반을 해결했습니다.")
    resolve_violations.short_description = "선택된 위반 해결"


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    """승인 요청 Admin"""
    list_display = [
        "request_id", "title", "approval_level",
        "status", "business_impact", "requested_by", "created_at"
    ]
    list_filter = ["status", "approval_level", "business_impact"]
    search_fields = ["title", "description", "requested_by"]
    readonly_fields = ["request_id", "created_at", "approved_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("기본 정보", {
            "fields": ("request_id", "title", "description", "recommendation")
        }),
        ("요청자", {
            "fields": ("requested_by",)
        }),
        ("승인", {
            "fields": ("approval_level", "status", "current_approver", "business_impact")
        }),
        ("결과", {
            "fields": ("approval_history", "rejection_reason")
        }),
        ("시간", {
            "fields": ("created_at", "approved_at")
        }),
    )

    actions = ["approve_requests", "reject_requests"]

    def approve_requests(self, request, queryset):
        """선택된 요청 승인"""
        for req in queryset.filter(status="pending"):
            req.approve(approver=request.user.username, comment="Admin 승인")
        self.message_user(request, f"{queryset.count()}개 요청을 승인했습니다.")
    approve_requests.short_description = "선택된 요청 승인"

    def reject_requests(self, request, queryset):
        """선택된 요청 거부"""
        for req in queryset.filter(status="pending"):
            req.reject(approver=request.user.username, reason="Admin 거부")
        self.message_user(request, f"{queryset.count()}개 요청을 거부했습니다.")
    reject_requests.short_description = "선택된 요청 거부"


@admin.register(ApprovalWorkflow)
class ApprovalWorkflowAdmin(admin.ModelAdmin):
    """승인 워크플로우 Admin"""
    list_display = [
        "workflow_id", "code", "name", "category",
        "is_active", "created_at"
    ]
    list_filter = ["category", "is_active"]
    search_fields = ["code", "name", "description"]
    readonly_fields = ["workflow_id", "created_at", "updated_at"]
