"""
거버넌스 API 시리얼라이저
"""
from rest_framework import serializers
from .models import PolicyRule, PolicyViolation, ApprovalRequest, ApprovalWorkflow


class PolicyRuleSerializer(serializers.ModelSerializer):
    """정책 규칙 시리얼라이저"""

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    violation_count = serializers.SerializerMethodField()

    class Meta:
        model = PolicyRule
        fields = [
            'rule_id', 'code', 'name_ko', 'name_en',
            'category', 'category_display', 'description',
            'conditions', 'actions', 'severity', 'severity_display',
            'is_active', 'metadata', 'created_at', 'updated_at',
            'violation_count',
        ]
        read_only_fields = ['rule_id', 'created_at', 'updated_at', 'violation_count']

    def get_violation_count(self, obj):
        """위반 횟수 반환"""
        return obj.violations.filter(status='open').count()


class PolicyViolationSerializer(serializers.ModelSerializer):
    """정책 위반 시리얼라이저"""

    policy_rule_code = serializers.CharField(source='policy_rule.code', read_only=True)
    policy_rule_name = serializers.CharField(source='policy_rule.name_ko', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    entity_type_display = serializers.CharField(source='get_entity_type_display', read_only=True)

    class Meta:
        model = PolicyViolation
        fields = [
            'violation_id', 'policy_rule', 'policy_rule_code', 'policy_rule_name',
            'violating_entity', 'entity_type', 'entity_type_display',
            'violation_details', 'severity', 'severity_display',
            'status', 'status_display', 'resolution',
            'resolved_at', 'resolved_by', 'detected_at', 'updated_at',
        ]
        read_only_fields = ['violation_id', 'detected_at', 'updated_at']


class PolicyViolationResolveSerializer(serializers.Serializer):
    """위반 해결 시리얼라이저"""

    resolution = serializers.CharField(required=True, max_length=1000)
    resolved_by = serializers.CharField(required=False, max_length=100, default="System")


class ApprovalRequestSerializer(serializers.ModelSerializer):
    """승인 요청 시리얼라이저"""

    recommendation_id = serializers.UUIDField(source='recommendation.recommendation_id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approval_level_display = serializers.CharField(source='get_approval_level_display', read_only=True)
    business_impact_display = serializers.CharField(source='get_business_impact_display', read_only=True)
    current_status_days = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            'request_id', 'recommendation', 'recommendation_id',
            'title', 'description', 'requested_by',
            'approval_level', 'approval_level_display',
            'status', 'status_display', 'current_approver',
            'business_impact', 'business_impact_display',
            'approval_history', 'rejection_reason',
            'created_at', 'approved_at', 'current_status_days',
        ]
        read_only_fields = [
            'request_id', 'recommendation_id', 'approval_history',
            'created_at', 'approved_at', 'current_status_days',
        ]

    def get_current_status_days(self, obj):
        """현재 상태 경과 일수"""
        from django.utils import timezone
        if obj.status == 'approved' and obj.approved_at:
            return (timezone.now() - obj.approved_at).days
        return (timezone.now() - obj.created_at).days


class ApprovalRequestDecisionSerializer(serializers.Serializer):
    """승인 결정 시리얼라이저"""

    action = serializers.ChoiceField(choices=['approve', 'reject', 'cancel'])
    approver = serializers.CharField(required=False, max_length=100, default="System")
    comment = serializers.CharField(required=False, max_length=1000, default="")
    reason = serializers.CharField(required=False, max_length=1000, default="")


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    """승인 워크플로우 시리얼라이저"""

    level_count = serializers.SerializerMethodField()
    is_active_display = serializers.CharField(source='get_is_active_display', read_only=True)

    class Meta:
        model = ApprovalWorkflow
        fields = [
            'workflow_id', 'code', 'name', 'description',
            'category', 'approval_levels', 'conditions',
            'is_active', 'is_active_display',
            'level_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['workflow_id', 'created_at', 'updated_at', 'level_count']

    def get_level_count(self, obj):
        """승인 단계 수 반환"""
        return len(obj.approval_levels)


class ApprovalWorkflowEvaluateSerializer(serializers.Serializer):
    """워크플로우 평가 시리얼라이저"""

    context = serializers.JSONField(required=True)
    business_impact = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        required=False,
        default='medium'
    )
