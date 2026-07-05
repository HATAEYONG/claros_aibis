"""
거버넌스 API 뷰
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models import PolicyRule, PolicyViolation, ApprovalRequest, ApprovalWorkflow
from .serializers import (
    PolicyRuleSerializer,
    PolicyViolationSerializer,
    PolicyViolationResolveSerializer,
    ApprovalRequestSerializer,
    ApprovalRequestDecisionSerializer,
    ApprovalWorkflowSerializer,
    ApprovalWorkflowEvaluateSerializer,
)


class PolicyRuleViewSet(viewsets.ModelViewSet):
    """정책 규칙 ViewSet"""

    serializer_class = PolicyRuleSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'rule_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = PolicyRule.objects.all()

        # 카테고리 필터
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # 활성 상태 필터
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # 심각도 필터
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        # 검색
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name_ko__icontains=search) |
                Q(name_en__icontains=search)
            )

        return queryset.annotate(
            violation_count=Count('violations', filter=Q(violations__status='open'))
        )

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """카테고리 목록"""
        categories = [choice[0] for choice in PolicyRule._meta.get_field('category').choices]
        return Response({'categories': categories})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """정책 규칙 통계"""
        total = PolicyRule.objects.count()
        active = PolicyRule.objects.filter(is_active=True).count()
        by_category = PolicyRule.objects.values('category').annotate(
            count=Count('rule_id')
        ).order_by('-count')

        by_severity = PolicyRule.objects.values('severity').annotate(
            count=Count('rule_id')
        ).order_by('-count')

        return Response({
            'total': total,
            'active': active,
            'by_category': list(by_category),
            'by_severity': list(by_severity),
        })


class PolicyViolationViewSet(viewsets.ModelViewSet):
    """정책 위반 ViewSet"""

    serializer_class = PolicyViolationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'violation_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = PolicyViolation.objects.select_related('policy_rule').all()

        # 상태 필터
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # 심각도 필터
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        # 정책 규칙 필터
        policy_rule = self.request.query_params.get('policy_rule')
        if policy_rule:
            queryset = queryset.filter(policy_rule__code=policy_rule)

        # 위반 주체 필터
        entity = self.request.query_params.get('entity')
        if entity:
            queryset = queryset.filter(violating_entity__icontains=entity)

        # 검색
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(violating_entity__icontains=search) |
                Q(violation_details__icontains=search)
            )

        return queryset.order_by('-detected_at')

    @action(detail=True, methods=['post'])
    def resolve(self, request, violation_id=None):
        """위반 해결"""
        violation = self.get_object()
        serializer = PolicyViolationResolveSerializer(data=request.data)

        if serializer.is_valid():
            violation.resolve(
                resolution=serializer.validated_data['resolution'],
                user=serializer.validated_data.get('resolved_by', request.user.username)
            )
            return Response({
                'message': '위반이 해결되었습니다.',
                'violation_id': str(violation.violation_id),
                'status': violation.status,
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, violation_id=None):
        """위반 무시"""
        violation = self.get_object()
        violation.status = 'dismissed'
        violation.resolution = request.data.get('reason', '무시 처리됨')
        violation.resolved_at = timezone.now()
        violation.resolved_by = request.user.username
        violation.save()

        return Response({
            'message': '위반이 무시되었습니다.',
            'violation_id': str(violation.violation_id),
            'status': violation.status,
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """위반 통계"""
        total = PolicyViolation.objects.count()
        open_count = PolicyViolation.objects.filter(status='open').count()
        resolved_count = PolicyViolation.objects.filter(status='resolved').count()

        by_severity = PolicyViolation.objects.values('severity').annotate(
            count=Count('violation_id')
        ).order_by('-count')

        by_status = PolicyViolation.objects.values('status').annotate(
            count=Count('violation_id')
        ).order_by('-count')

        by_category = PolicyViolation.objects.values(
            'policy_rule__category'
        ).annotate(
            count=Count('violation_id')
        ).order_by('-count')

        return Response({
            'total': total,
            'open': open_count,
            'resolved': resolved_count,
            'by_severity': list(by_severity),
            'by_status': list(by_status),
            'by_category': list(by_category),
        })


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    """승인 요청 ViewSet"""

    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'request_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = ApprovalRequest.objects.select_related('recommendation').all()

        # 상태 필터
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # 승인 레벨 필터
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(approval_level=int(level))

        # 요청자 필터
        requester = self.request.query_params.get('requester')
        if requester:
            queryset = queryset.filter(requested_by__icontains=requester)

        # 영향도 필터
        impact = self.request.query_params.get('impact')
        if impact:
            queryset = queryset.filter(business_impact=impact)

        # 검색
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def decide(self, request, request_id=None):
        """승인 결정"""
        approval_request = self.get_object()
        serializer = ApprovalRequestDecisionSerializer(data=request.data)

        if serializer.is_valid():
            action = serializer.validated_data['action']
            approver = serializer.validated_data.get('approver', request.user.username)

            if action == 'approve':
                comment = serializer.validated_data.get('comment', '')
                approval_request.approve(approver=approver, comment=comment)
                message = '승인 요청이 승인되었습니다.'

            elif action == 'reject':
                reason = serializer.validated_data.get('reason', '')
                approval_request.reject(approver=approver, reason=reason)
                message = '승인 요청이 거부되었습니다.'

            elif action == 'cancel':
                approval_request.cancel()
                message = '승인 요청이 취소되었습니다.'

            return Response({
                'message': message,
                'request_id': str(approval_request.request_id),
                'status': approval_request.status,
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, request_id=None):
        """승인 (간편 API)"""
        approval_request = self.get_object()
        comment = request.data.get('comment', '')
        approver = request.data.get('approver', request.user.username)

        approval_request.approve(approver=approver, comment=comment)

        return Response({
            'message': '승인 요청이 승인되었습니다.',
            'request_id': str(approval_request.request_id),
            'status': approval_request.status,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, request_id=None):
        """거부 (간편 API)"""
        approval_request = self.get_object()
        reason = request.data.get('reason', '거부 사유가 없습니다.')
        approver = request.data.get('approver', request.user.username)

        approval_request.reject(approver=approver, reason=reason)

        return Response({
            'message': '승인 요청이 거부되었습니다.',
            'request_id': str(approval_request.request_id),
            'status': approval_request.status,
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """대기 중인 승인 요청"""
        pending = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """내 승인 요청"""
        username = request.query_params.get('username', request.user.username)
        my_requests = self.get_queryset().filter(requested_by=username)
        serializer = self.get_serializer(my_requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """승인 요청 통계"""
        total = ApprovalRequest.objects.count()
        pending = ApprovalRequest.objects.filter(status='pending').count()
        approved = ApprovalRequest.objects.filter(status='approved').count()
        rejected = ApprovalRequest.objects.filter(status='rejected').count()

        by_level = ApprovalRequest.objects.values('approval_level').annotate(
            count=Count('request_id')
        ).order_by('-count')

        by_impact = ApprovalRequest.objects.values('business_impact').annotate(
            count=Count('request_id')
        ).order_by('-count')

        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'by_level': list(by_level),
            'by_impact': list(by_impact),
        })


class ApprovalWorkflowViewSet(viewsets.ModelViewSet):
    """승인 워크플로우 ViewSet"""

    serializer_class = ApprovalWorkflowSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'workflow_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = ApprovalWorkflow.objects.all()

        # 카테고리 필터
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # 활성 상태 필터
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # 검색
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search)
            )

        return queryset.order_by('category', 'code')

    @action(detail=True, methods=['post'])
    def evaluate(self, request, workflow_id=None):
        """워크플로우 평가"""
        workflow = self.get_object()
        serializer = ApprovalWorkflowEvaluateSerializer(data=request.data)

        if serializer.is_valid():
            context = serializer.validated_data['context']
            context['business_impact'] = serializer.validated_data.get('business_impact', 'medium')

            required_level = workflow.get_required_level(context)

            return Response({
                'workflow_id': str(workflow.workflow_id),
                'workflow_code': workflow.code,
                'workflow_name': workflow.name,
                'required_level': required_level,
                'approval_levels': workflow.approval_levels[:required_level],
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """카테고리 목록"""
        categories = ApprovalWorkflow.objects.values('category').distinct().values_list('category', flat=True)
        return Response({'categories': list(categories)})
