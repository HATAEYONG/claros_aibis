# -*- coding: utf-8 -*-
"""
Monitoring API Views
시스템 모니터링 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Avg, Max, Min, Count
from datetime import timedelta

from .models import SystemMetric, APILog, ErrorLog, PerformanceLog, HealthCheck
from .serializers import (
    SystemMetricSerializer, APILogSerializer, ErrorLogSerializer,
    PerformanceLogSerializer, HealthCheckSerializer, SystemHealthSerializer
)
from .services.monitoring_service import MonitoringService


class SystemMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """시스템 메트릭 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = SystemMetric.objects.all()

    def get_queryset(self):
        return SystemMetric.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return SystemMetricSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 메트릭 조회"""
        metric_name = request.query_params.get('metric_name')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 100))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        if metric_name:
            queryset = queryset.filter(metric_name=metric_name)

        metrics = queryset[:limit]
        serializer = self.get_serializer(metrics, many=True)

        return Response({
            'metrics': serializer.data,
            'count': len(serializer.data),
        })


class APILogViewSet(viewsets.ReadOnlyModelViewSet):
    """API 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = APILog.objects.all()

    def get_queryset(self):
        return APILog.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return APILogSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 API 로그 조회"""
        path = request.query_params.get('path')
        status_code = request.query_params.get('status_code')
        user_id = request.query_params.get('user_id')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 50))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        if path:
            queryset = queryset.filter(path__icontains=path)
        if status_code:
            queryset = queryset.filter(status_code=status_code)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        logs = queryset[:limit]
        serializer = self.get_serializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """API 통계 조회"""
        hours = int(request.query_params.get('hours', 24))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(timestamp__gte=since)

        stats = queryset.aggregate(
            total_requests=Count('id'),
            avg_response_time=Avg('response_time_ms'),
            max_response_time=Max('response_time_ms'),
            error_count=Count('id', filter=~Q(status_code__lt=400))
        )

        # 상태 코드별 집계
        status_counts = queryset.values('status_code').annotate(
            count=Count('id')
        ).order_by('-count')

        return Response({
            'period_hours': hours,
            'total_requests': stats['total_requests'],
            'avg_response_time_ms': round(stats['avg_response_time'] or 0, 2),
            'max_response_time_ms': round(stats['max_response_time'] or 0, 2),
            'error_count': stats['error_count'],
            'status_distribution': list(status_counts),
        })


class ErrorLogViewSet(viewsets.ReadOnlyModelViewSet):
    """에러 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = ErrorLog.objects.all()

    def get_queryset(self):
        return ErrorLog.objects.all().order_by('-occurred_at')

    def get_serializer_class(self):
        return ErrorLogSerializer

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """에러 해제"""
        error = self.get_object()
        error.is_resolved = True
        error.resolved_at = timezone.now()
        error.resolved_by = request.user
        error.save()

        serializer = self.get_serializer(error)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 에러 로그 조회"""
        error_type = request.query_params.get('error_type')
        is_resolved = request.query_params.get('is_resolved')
        hours = int(request.query_params.get('hours', 24))
        limit = int(request.query_params.get('limit', 50))

        since = timezone.now() - timedelta(hours=hours)
        queryset = self.get_queryset().filter(occurred_at__gte=since)

        if error_type:
            queryset = queryset.filter(error_type=error_type)
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=(is_resolved.lower() == 'true'))

        errors = queryset[:limit]
        serializer = self.get_serializer(errors, many=True)

        return Response({
            'errors': serializer.data,
            'count': len(serializer.data),
        })


class PerformanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """성능 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = PerformanceLog.objects.all()

    def get_queryset(self):
        return PerformanceLog.objects.all().order_by('-timestamp')

    def get_serializer_class(self):
        return PerformanceLogSerializer

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """성능 메트릭 조회"""
        operation_name = request.query_params.get('operation_name')
        hours = int(request.query_params.get('hours', 24))

        service = MonitoringService()
        metrics = service.get_performance_metrics(
            operation_name=operation_name,
            hours=hours
        )

        return Response(metrics)


class HealthCheckViewSet(viewsets.ReadOnlyModelViewSet):
    """헬스 체크 API"""
    permission_classes = [AllowAny]  # 헬스 체크는 인증 없이 접근 가능
    queryset = HealthCheck.objects.all()

    def get_queryset(self):
        return HealthCheck.objects.all().order_by('-last_check')

    def get_serializer_class(self):
        return HealthCheckSerializer


@api_view(['GET'])
def health_check(request):
    """시스템 헬스 체크 (인증 없이 접근 가능)"""
    service = MonitoringService()
    health = service.get_system_health()

    return Response(health, status=status.HTTP_200_OK)


@api_view(['GET'])
def metrics(request):
    """애플리케이션 메트릭"""
    service = MonitoringService()

    # 시스템 메트릭 수집
    hours = int(request.query_params.get('hours', 1))
    since = timezone.now() - timedelta(hours=hours)

    recent_metrics = SystemMetric.objects.filter(
        timestamp__gte=since
    ).order_by('-timestamp')[:100]

    serializer = SystemMetricSerializer(recent_metrics, many=True)

    # API 통계
    api_stats = APILog.objects.filter(
        timestamp__gte=since
    ).aggregate(
        total_requests=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        error_rate=Count('id', filter=Q(status_code__gte=400)) * 100.0 / Count('id')
    )

    return Response({
        'metrics': serializer.data,
        'api_stats': api_stats,
        'period_hours': hours,
    })


from django.db.models import Q