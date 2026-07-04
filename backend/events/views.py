"""
이벤트 REST API 뷰
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from events.models import (
    Event, EventCorrelation, EventType, EventSeverity,
    EventStatus, DomainChoices, ProcessChoices
)
from events.services import EventDetectionService, EventCorrelationService

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    """이벤트 ViewSet"""
    queryset = Event.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["event_type", "severity", "status", "domain", "process_code"]
    search_fields = ["title", "description", "scope_id", "scope_name"]
    ordering_fields = ["event_time", "created_at", "severity"]
    ordering = ["-event_time"]

    def get_queryset(self):
        """쿼리셋 커스터마이징"""
        queryset = super().get_queryset()

        # 날짜 범위 필터
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                queryset = queryset.filter(event_time__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                queryset = queryset.filter(event_time__lte=end_date)
            except ValueError:
                pass

        # 심각도 필터 (이상)
        min_severity = self.request.query_params.get("min_severity")
        if min_severity:
            severity_order = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
            try:
                min_index = severity_order.index(min_severity.upper())
                valid_severities = severity_order[min_index:]
                queryset = queryset.filter(severity__in=valid_severities)
            except ValueError:
                pass

        return queryset

    def retrieve(self, request, *args, **kwargs):
        """이벤트 상세 조회 (상관관계 포함)"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # 상관관계 조회
        correlations_from = EventCorrelation.objects.filter(source_event=instance)
        correlations_to = EventCorrelation.objects.filter(target_event=instance)

        data = serializer.data
        data["correlations_from"] = [
            {
                "correlation_id": str(c.correlation_id),
                "target_event_id": str(c.target_event.event_id),
                "correlation_type": c.correlation_type,
                "confidence": c.confidence,
                "description": c.description
            }
            for c in correlations_from
        ]
        data["correlations_to"] = [
            {
                "correlation_id": str(c.correlation_id),
                "source_event_id": str(c.source_event.event_id),
                "correlation_type": c.correlation_type,
                "confidence": c.confidence,
                "description": c.description
            }
            for c in correlations_to
        ]

        return Response(data)

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        """이벤트 확인"""
        event = self.get_object()
        user = request.user.username if request.user.is_authenticated else "system"

        event.acknowledge(user=user)

        return Response({
            "message": "이벤트가 확인되었습니다.",
            "event_id": str(event.event_id),
            "status": event.status,
            "acknowledged_at": event.acknowledged_at,
            "acknowledged_by": event.acknowledged_by
        })

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """이벤트 해결"""
        event = self.get_object()
        user = request.user.username if request.user.is_authenticated else "system"
        note = request.data.get("note", "")

        event.resolve(note=note, user=user)

        return Response({
            "message": "이벤트가 해결되었습니다.",
            "event_id": str(event.event_id),
            "status": event.status,
            "resolved_at": event.resolved_at,
            "resolved_by": event.resolved_by,
            "resolution_note": event.resolution_note
        })

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        """이벤트 무시"""
        event = self.get_object()
        event.dismiss()

        return Response({
            "message": "이벤트가 무시되었습니다.",
            "event_id": str(event.event_id),
            "status": event.status
        })

    @action(detail=True, methods=["get"])
    def correlations(self, request, pk=None):
        """이벤트 상관관계 조회"""
        event = self.get_object()

        # 나가는 상관관계
        correlations_from = EventCorrelation.objects.filter(
            source_event=event
        ).select_related("target_event")

        # 들어오는 상관관계
        correlations_to = EventCorrelation.objects.filter(
            target_event=event
        ).select_related("source_event")

        # 연결된 이벤트 ID 목록
        related_event_ids = set()
        for c in correlations_from:
            related_event_ids.add(c.target_event.event_id)
        for c in correlations_to:
            related_event_ids.add(c.source_event.event_id)

        # 관련 이벤트 조회
        related_events = Event.objects.filter(event_id__in=related_event_ids)

        # 이벤트 딕셔너리
        event_dict = {str(e.event_id): {
            "event_id": str(e.event_id),
            "event_type": e.event_type,
            "severity": e.severity,
            "status": e.status,
            "title": e.title,
            "scope_name": e.scope_name,
            "domain": e.domain,
            "event_time": e.event_time.isoformat()
        } for e in related_events}

        return Response({
            "correlations_from": [
                {
                    "correlation_id": str(c.correlation_id),
                    "correlation_type": c.correlation_type,
                    "confidence": c.confidence,
                    "description": c.description,
                    "target_event": event_dict.get(str(c.target_event.event_id))
                }
                for c in correlations_from
            ],
            "correlations_to": [
                {
                    "correlation_id": str(c.correlation_id),
                    "correlation_type": c.correlation_type,
                    "confidence": c.confidence,
                    "description": c.description,
                    "source_event": event_dict.get(str(c.source_event.event_id))
                }
                for c in correlations_to
            ]
        })

    @action(detail=True, methods=["post"])
    def auto_correlate(self, request, pk=None):
        """자동 상관관계 분석"""
        event = self.get_object()
        max_correlations = int(request.data.get("max_correlations", 5))

        correlations = EventCorrelationService.auto_correlate_event(
            event=event,
            max_correlations=max_correlations
        )

        return Response({
            "message": f"{len(correlations)}개 상관관계가 생성되었습니다.",
            "correlations": [
                {
                    "correlation_id": str(c.correlation_id),
                    "source_event_id": str(c.source_event.event_id),
                    "target_event_id": str(c.target_event.event_id),
                    "correlation_type": c.correlation_type,
                    "confidence": c.confidence
                }
                for c in correlations
            ]
        })

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """이벤트 통계"""
        # 기간 설정
        days = int(request.query_params.get("days", 7))
        start_date = timezone.now() - timedelta(days=days)

        # 기간 내 이벤트
        events = Event.objects.filter(event_time__gte=start_date)

        # 상태별 카운트
        status_counts = events.values("status").annotate(
            count=Count("event_id")
        ).order_by("-count")

        # 심각도별 카운트
        severity_counts = events.values("severity").annotate(
            count=Count("event_id")
        ).order_by("-count")

        # 이벤트 유형별 카운트
        type_counts = events.values("event_type").annotate(
            count=Count("event_id")
        ).order_by("-count")

        # 도메인별 카운트
        domain_counts = events.values("domain").annotate(
            count=Count("event_id")
        ).order_by("-count")

        # 평균 해결 시간
        resolved_events = events.filter(
            status=EventStatus.RESOLVED,
            resolved_at__isnull=False
        )
        avg_resolution_time = None
        if resolved_events.exists():
            resolution_times = [
                (e.resolved_at - e.event_time).total_seconds() / 3600
                for e in resolved_events
            ]
            avg_resolution_time = sum(resolution_times) / len(resolution_times)

        return Response({
            "period_days": days,
            "total_events": events.count(),
            "status_distribution": list(status_counts),
            "severity_distribution": list(severity_counts),
            "type_distribution": list(type_counts),
            "domain_distribution": list(domain_counts),
            "avg_resolution_time_hours": avg_resolution_time
        })

    @action(detail=False, methods=["get"])
    def clusters(self, request):
        """이벤트 클러스터 조회"""
        hours = int(request.query_params.get("hours", 24))
        min_events = int(request.query_params.get("min_events", 2))

        clusters = EventCorrelationService.get_event_clusters(
            hours=hours,
            min_events=min_events
        )

        return Response({
            "hours": hours,
            "min_events": min_events,
            "clusters": [
                {
                    "domain": c["domain"],
                    "process_code": c["process_code"],
                    "event_count": c["event_count"],
                    "event_types": c["event_types"]
                }
                for c in clusters
            ]
        })


# 시리얼라이저 (DRF 시리얼라이저가 없으므로 간단히 구현)
from rest_framework import serializers


class EventSerializer(serializers.ModelSerializer):
    """이벤트 시리얼라이저"""

    class Meta:
        model = Event
        fields = "__all__"


class EventCorrelationSerializer(serializers.ModelSerializer):
    """이벤트 상관관계 시리얼라이저"""

    class Meta:
        model = EventCorrelation
        fields = "__all__"
