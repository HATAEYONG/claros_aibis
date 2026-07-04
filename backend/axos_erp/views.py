"""
AXOS ERP V10.4 통합 API 뷰

이 뷰는 AXOS ERP V10.4 Production Stack의 기능을 통합하기 위한 API를 제공합니다.
- 이벤트 허브 (Event Hub)
- AI 리스크 분석 (Risk Scoring)
- 포캐스팅 (Forecasting)
- 알림 관리 (Alert Management)
- 워크플로우 (Workflow)
- 프로세스 그래프 (Process Graph / OCPM)
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    EventHub, RiskScore, ForecastRecord, AlertRecord,
    WorkflowTask, ProcessGraph, ProcessGraphEdge
)
from .serializers import (
    EventHubSerializer, EventHubPublishSerializer,
    RiskScoreSerializer, RiskScoreRequestSerializer,
    ForecastRecordSerializer, ForecastRequestSerializer,
    AlertRecordSerializer, AlertCreateSerializer, AlertActionSerializer,
    WorkflowTaskSerializer, TaskCreateSerializer, TaskActionSerializer,
    ProcessGraphSerializer, ProcessGraphEdgeSerializer, GraphUpdateSerializer, GraphDataSerializer
)

logger = logging.getLogger(__name__)


# ==================== 이벤트 허브 (Event Hub) ====================

class EventHubViewSet(viewsets.ModelViewSet):
    """이벤트 허브 ViewSet"""
    queryset = EventHub.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = EventHubSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["topic", "event_type", "processed"]
    search_fields = ["event_key", "event_type", "topic"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request):
        """이벤트 발행"""
        serializer = EventHubPublishSerializer(data=request.data)
        if serializer.is_valid():
            # 중복 확인 (dedup_key가 있는 경우)
            event_key = serializer.validated_data.get("event_key")
            if EventHub.objects.filter(event_key=event_key).exists():
                return Response({
                    "published": False,
                    "deduped": True,
                    "message": "이미 존재하는 이벤트 키입니다.",
                    "event_key": event_key
                }, status=status.HTTP_200_OK)

            # 이벤트 생성
            event = EventHub.objects.create(**serializer.validated_data)

            return Response({
                "published": True,
                "deduped": False,
                "event_key": event.event_key,
                "event_id": str(event.event_id),
                "count": EventHub.objects.count()
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def topics(self, request):
        """주제 목록 조회"""
        topics = EventHub.objects.values_list("topic", flat=True).distinct()
        return Response({"topics": list(topics)})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def statistics(self, request):
        """이벤트 통계"""
        total_events = EventHub.objects.count()
        processed_events = EventHub.objects.filter(processed=True).count()
        topic_distribution = list(
            EventHub.objects.values("topic")
            .annotate(count=Count("event_id"))
            .order_by("-count")
        )

        return Response({
            "total_events": total_events,
            "processed_events": processed_events,
            "pending_events": total_events - processed_events,
            "topic_distribution": topic_distribution
        })


# ==================== AI 리스크 분석 (Risk Scoring) ====================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_risk_score(request):
    """리스크 점수 계산"""
    serializer = RiskScoreRequestSerializer(data=request.data)
    if serializer.is_valid():
        object_type = serializer.validated_data.get("object_type")
        object_id = serializer.validated_data.get("object_id")
        features = serializer.validated_data.get("features", {})

        # 리스크 점수 계산 로직
        score = 25  # 기본 점수
        reasons = []

        if features.get("downtime"):
            score += 45
            reasons.append("equipment downtime")
        if features.get("duration_min", 0) >= 60:
            score += 10
            reasons.append("long duration")
        if features.get("quality_hold"):
            score += 25
            reasons.append("quality hold")

        score = min(100, score)

        # 레벨 결정
        if score >= 70:
            level = "HIGH"
        elif score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        # 리스크 점수 저장
        risk_score = RiskScore.objects.create(
            object_type=object_type,
            object_id=object_id,
            score=score,
            level=level,
            explanation_json={"top_reasons": reasons or ["normal flow"]},
            features_json=features
        )

        response_serializer = RiskScoreSerializer(risk_score)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RiskScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """리스크 점수 ViewSet"""
    queryset = RiskScore.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = RiskScoreSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["object_type", "level"]
    search_fields = ["object_id"]
    ordering_fields = ["created_at", "score"]
    ordering = ["-created_at"]


# ==================== 포캐스팅 (Forecasting) ====================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_forecast_margin(request):
    """마진 예측 계산"""
    serializer = ForecastRequestSerializer(data=request.data)
    if serializer.is_valid():
        revenue = serializer.validated_data.get("revenue")
        cost = serializer.validated_data.get("cost")
        delay_penalty = serializer.validated_data.get("delay_penalty", 0)
        rework_cost = serializer.validated_data.get("rework_cost", 0)

        # 마진 계산
        margin = revenue - cost - delay_penalty - rework_cost

        # 리스크 레벨 결정
        risk_level = "HIGH" if margin < 0 else "NORMAL"

        # 권장사항
        recommendation = "Adjust production / procurement" if margin < 0 else "Within target"

        # 포캐스팅 기록 저장
        forecast = ForecastRecord.objects.create(
            revenue=revenue,
            cost=cost,
            delay_penalty=delay_penalty,
            rework_cost=rework_cost,
            forecast_margin=margin,
            risk_level=risk_level,
            recommendation=recommendation
        )

        response_serializer = ForecastRecordSerializer(forecast)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForecastRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """포캐스팅 기록 ViewSet"""
    queryset = ForecastRecord.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ForecastRecordSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["risk_level"]
    ordering_fields = ["created_at", "forecast_margin"]
    ordering = ["-created_at"]


# ==================== 알림 관리 (Alert Management) ====================

class AlertRecordViewSet(viewsets.ModelViewSet):
    """알림 관리 ViewSet"""
    queryset = AlertRecord.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AlertRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["alert_type", "severity", "status"]
    search_fields = ["title", "source_object_id"]
    ordering_fields = ["created_at", "severity"]
    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        """알림 생성 (중복 제거 지원)"""
        serializer = AlertCreateSerializer(data=request.data)
        if serializer.is_valid():
            dedup_key = serializer.validated_data.get("dedup_key")

            # 중복 확인
            if dedup_key:
                existing_alert = AlertRecord.objects.filter(
                    dedup_key=dedup_key,
                    status="OPEN"
                ).first()
                if existing_alert:
                    alert_serializer = AlertRecordSerializer(existing_alert)
                    return Response({
                        "created": False,
                        "deduped": True,
                        "alert": alert_serializer.data
                    }, status=status.HTTP_200_OK)

            # 새 알림 생성
            alert = AlertRecord.objects.create(**serializer.validated_data)
            alert_serializer = AlertRecordSerializer(alert)

            return Response({
                "created": True,
                "deduped": False,
                "alert": alert_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def acknowledge(self, request, pk=None):
        """알림 확인"""
        alert = self.get_object()
        if alert.status == "OPEN":
            alert.status = "ACKNOWLEDGED"
            alert.acknowledged_at = timezone.now()
            alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        """알림 해결"""
        alert = self.get_object()
        alert.status = "RESOLVED"
        alert.resolved_at = timezone.now()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def close(self, request, pk=None):
        """알림 닫기"""
        alert = self.get_object()
        alert.status = "RESOLVED"
        alert.resolved_at = timezone.now()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


# ==================== 워크플로우 (Workflow) ====================

class WorkflowTaskViewSet(viewsets.ModelViewSet):
    """워크플로우 태스크 ViewSet"""
    queryset = WorkflowTask.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = WorkflowTaskSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["task_type", "owner_role", "status"]
    search_fields = ["title", "source_object_id", "owner_role"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        """태스크 생성 (중복 제거 지원)"""
        serializer = TaskCreateSerializer(data=request.data)
        if serializer.is_valid():
            task_type = serializer.validated_data.get("task_type")
            source_object_type = serializer.validated_data.get("source_object_type", "")
            source_object_id = serializer.validated_data.get("source_object_id", "")

            # 중복 확인
            existing_task = WorkflowTask.objects.filter(
                task_type=task_type,
                source_object_type=source_object_type,
                source_object_id=source_object_id,
                status="OPEN"
            ).first()

            if existing_task:
                task_serializer = WorkflowTaskSerializer(existing_task)
                return Response({
                    "created": False,
                    "deduped": True,
                    "task": task_serializer.data
                }, status=status.HTTP_200_OK)

            # 새 태스크 생성
            task = WorkflowTask.objects.create(**serializer.validated_data)
            task_serializer = WorkflowTaskSerializer(task)

            return Response({
                "created": True,
                "deduped": False,
                "task": task_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        """태스크 시작"""
        task = self.get_object()
        if task.status == "OPEN":
            task.status = "IN_PROGRESS"
            task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """태스크 완료"""
        task = self.get_object()
        task.status = "COMPLETED"
        task.completed_at = timezone.now()
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """태스크 취소"""
        task = self.get_object()
        task.status = "CANCELLED"
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)


# ==================== 프로세스 그래프 (Process Graph / OCPM) ====================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_graph_data(request):
    """프로세스 그래프 데이터 조회"""
    nodes = ProcessGraph.objects.all()
    edges = ProcessGraphEdge.objects.all()

    node_serializer = ProcessGraphSerializer(nodes, many=True)
    edge_serializer = ProcessGraphEdgeSerializer(edges, many=True)

    return Response({
        "nodes": node_serializer.data,
        "edges": edge_serializer.data,
        "statistics": {
            "total_nodes": nodes.count(),
            "total_edges": edges.count()
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_graph(request):
    """프로세스 그래프 업데이트"""
    serializer = GraphUpdateSerializer(data=request.data)
    if serializer.is_valid():
        nodes_data = serializer.validated_data.get("nodes", [])
        edges_data = serializer.validated_data.get("edges", [])

        created_nodes = []
        created_edges = []

        # 노드 추가
        for node_data in nodes_data:
            node_id = node_data.get("id") or node_data.get("node_id")
            if not node_id:
                continue

            node, created = ProcessGraph.objects.get_or_create(
                node_id=node_id,
                defaults={
                    "node_label": node_data.get("label", ""),
                    "node_type": node_data.get("type", "process"),
                    "status": node_data.get("status", "active"),
                    "metadata_json": node_data.get("metadata", {})
                }
            )

            if created:
                created_nodes.append(node)

        # 엣지 추가
        for edge_data in edges_data:
            source = edge_data.get("source") or edge_data.get("source_node")
            target = edge_data.get("target") or edge_data.get("target_node")
            if not source or not target:
                continue

            edge, created = ProcessGraphEdge.objects.get_or_create(
                source_node=source,
                target_node=target,
                defaults={
                    "label": edge_data.get("label", ""),
                    "edge_type": edge_data.get("type", "flow")
                }
            )

            if created:
                created_edges.append(edge)

        return Response({
            "updated": True,
            "created_nodes": len(created_nodes),
            "created_edges": len(created_edges),
            "total_nodes": ProcessGraph.objects.count(),
            "total_edges": ProcessGraphEdge.objects.count()
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProcessGraphViewSet(viewsets.ModelViewSet):
    """프로세스 그래프 ViewSet"""
    queryset = ProcessGraph.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProcessGraphSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["node_type", "status"]
    search_fields = ["node_id", "node_label"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["node_id"]


class ProcessGraphEdgeViewSet(viewsets.ModelViewSet):
    """프로세스 그래프 엣지 ViewSet"""
    queryset = ProcessGraphEdge.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProcessGraphEdgeSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["edge_type"]
    ordering_fields = ["created_at"]
    ordering = ["source_node", "target_node"]


# ==================== 헬스 체크 ====================

@api_view(["GET"])
@permission_classes([AllowAny])
def axos_health_check(request):
    """AXOS ERP API 헬스 체크"""
    return Response({
        "status": "ok",
        "service": "axos_erp_integration",
        "version": "v1.0",
        "timestamp": timezone.now().isoformat()
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def axos_dashboard_summary(request):
    """AXOS ERP 대시보드 요약"""
    return Response({
        "events": EventHub.objects.count(),
        "risk_scores": RiskScore.objects.count(),
        "forecasts": ForecastRecord.objects.count(),
        "alerts": AlertRecord.objects.filter(status="OPEN").count(),
        "tasks": WorkflowTask.objects.filter(status="OPEN").count(),
        "graph_nodes": ProcessGraph.objects.count(),
        "graph_edges": ProcessGraphEdge.objects.count(),
        "high_risk_count": RiskScore.objects.filter(level="HIGH").count(),
        "critical_alerts": AlertRecord.objects.filter(severity="CRITICAL", status="OPEN").count()
    })
