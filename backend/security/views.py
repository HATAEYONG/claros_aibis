# -*- coding: utf-8 -*-
"""
Security API Views
보안 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .models import AuditLog, SecurityEvent, LoginAttempt
from .serializers import AuditLogSerializer, SecurityEventSerializer, LoginAttemptSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """감사 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = AuditLog.objects.all()

    def get_queryset(self):
        return AuditLog.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return AuditLogSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 감사 로그 조회"""
        action = request.query_params.get('action')
        actor_type = request.query_params.get('actor_type')
        target_type = request.query_params.get('target_type')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 100))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        if action:
            queryset = queryset.filter(action=action)
        if actor_type:
            queryset = queryset.filter(actor_type=actor_type)
        if target_type:
            queryset = queryset.filter(target_type=target_type)

        logs = queryset[:limit]
        serializer = self.get_serializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """사용자별 감사 로그 조회"""
        user_id = request.query_params.get('user_id')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 50))

        if not user_id:
            return Response({
                'error': 'user_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(
            actor_id=user_id,
            timestamp__gte=since
        )

        logs = queryset[:limit]
        serializer = self.get_serializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'count': len(serializer.data),
        })


class SecurityEventViewSet(viewsets.ReadOnlyModelViewSet):
    """보안 이벤트 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = SecurityEvent.objects.all()

    def get_queryset(self):
        return SecurityEvent.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return SecurityEventSerializer

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """보안 이벤트 해결"""
        event = self.get_object()
        event.is_resolved = True
        event.resolved_by = request.user
        event.resolved_at = timezone.now()
        event.resolution_notes = request.data.get('resolution_notes', '')
        event.save()

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 보안 이벤트 조회"""
        event_type = request.query_params.get('event_type')
        severity = request.query_params.get('severity')
        is_resolved = request.query_params.get('is_resolved')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 50))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        if event_type:
            queryset = queryset.filter(event_type=event_type)
        if severity:
            queryset = queryset.filter(severity=severity)
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=(is_resolved.lower() == 'true'))

        events = queryset[:limit]
        serializer = self.get_serializer(events, many=True)

        return Response({
            'events': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """보안 통계 조회"""
        hours = int(request.query_params.get('hours', 24))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        # 이벤트 유형별 집계
        event_counts = queryset.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')

        # 심각도별 집계
        severity_counts = queryset.values('severity').annotate(
            count=Count('id')
        ).order_by('-severity')

        # 미해결 이벤트 수
        unresolved_count = queryset.filter(is_resolved=False).count()

        return Response({
            'period_hours': hours,
            'total_events': queryset.count(),
            'unresolved_events': unresolved_count,
            'by_type': list(event_counts),
            'by_severity': list(severity_counts),
        })


class LoginAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """로그인 시도 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = LoginAttempt.objects.all()

    def get_queryset(self):
        return LoginAttempt.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return LoginAttemptSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 로그인 시도 조회"""
        username = request.query_params.get('username')
        was_successful = request.query_params.get('was_successful')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 50))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        if username:
            queryset = queryset.filter(username=username)
        if was_successful is not None:
            queryset = queryset.filter(was_successful=(was_successful.lower() == 'true'))

        attempts = queryset[:limit]
        serializer = self.get_serializer(attempts, many=True)

        return Response({
            'attempts': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=False, methods=['get'])
    def failed_attempts(self, request):
        """실패한 로그인 시도 조회"""
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 100))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(
            timestamp__gte=since,
            was_successful=False
        )

        attempts = queryset[:limit]
        serializer = self.get_serializer(attempts, many=True)

        return Response({
            'attempts': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=False, methods=['get'])
    def suspicious_ips(self, request):
        """의심스러운 IP 주소 조회"""
        hours = int(request.query_params.get('hours', 24))
        threshold = int(request.query_params.get('threshold', 5))
        limit = int(request.query_params.get('limit', 20))

        since = timezone.now() - timedelta(hours=hours)

        # 지정된 시간 내에 threshold 이상의 실패한 로그인 시도가 있는 IP
        suspicious_ips = LoginAttempt.objects.filter(
            timestamp__gte=since,
            was_successful=False
        ).values('ip_address').annotate(
            failed_count=Count('id')
        ).filter(
            failed_count__gte=threshold
        ).order_by('-failed_count')[:limit]

        return Response({
            'suspicious_ips': list(suspicious_ips),
            'count': len(suspicious_ips),
        })
