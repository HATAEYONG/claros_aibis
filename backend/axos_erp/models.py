"""
AXOS ERP V10.4 통합 모델

이 모델은 AXOS ERP V10.4 Production Stack의 기능을 통합하기 위한 모델입니다.
- 이벤트 허브 (Event Hub)
- AI 리스크 분석 (Risk Scoring)
- 포캐스팅 (Forecasting)
- 알림 관리 (Alert Management)
- 워크플로우 (Workflow)
- 프로세스 그래프 (Process Graph / OCPM)
"""
import uuid
import json
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class EventHub(models.Model):
    """이벤트 허브 모델"""
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.CharField("주제", max_length=100, db_index=True)
    event_key = models.CharField("이벤트 키", max_length=200, db_index=True)
    event_type = models.CharField("이벤트 유형", max_length=100)
    payload_json = models.JSONField("페이로드", default=dict)
    created_at = models.DateTimeField("생성 시간", auto_now_add=True, db_index=True)
    processed = models.BooleanField("처리 여부", default=False)

    class Meta:
        db_table = "axos_event_hub"
        ordering = ["-created_at"]
        verbose_name = "이벤트 허브"
        verbose_name_plural = "이벤트 허브"

    def __str__(self):
        return f"{self.topic}:{self.event_key}"


class RiskScore(models.Model):
    """AI 리스크 분석 점수 모델"""
    risk_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    object_type = models.CharField("객체 유형", max_length=100, db_index=True)
    object_id = models.CharField("객체 ID", max_length=200, db_index=True)
    score = models.IntegerField("리스크 점수", validators=[MinValueValidator(0), MaxValueValidator(100)])
    level = models.CharField("리스크 레벨", max_length=20, choices=[
        ("LOW", "낮음"),
        ("MEDIUM", "중간"),
        ("HIGH", "높음"),
    ])
    explanation_json = models.JSONField("설명", default=dict)
    features_json = models.JSONField("특성", default=dict)
    created_at = models.DateTimeField("생성 시간", auto_now_add=True, db_index=True)

    class Meta:
        db_table = "axos_risk_scores"
        ordering = ["-created_at"]
        verbose_name = "리스크 점수"
        verbose_name_plural = "리스크 점수"
        indexes = [
            models.Index(fields=["object_type", "object_id"]),
            models.Index(fields=["level"]),
            models.Index(fields=["score"]),
        ]

    def __str__(self):
        return f"{self.object_type}:{self.object_id} - {self.score}점"


class ForecastRecord(models.Model):
    """포캐스팅 기록 모델"""
    forecast_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revenue = models.DecimalField("수익", max_digits=15, decimal_places=2)
    cost = models.DecimalField("비용", max_digits=15, decimal_places=2)
    delay_penalty = models.DecimalField("지연 벌금", max_digits=15, decimal_places=2, default=0)
    rework_cost = models.DecimalField("재작업 비용", max_digits=15, decimal_places=2, default=0)
    forecast_margin = models.DecimalField("예상 마진", max_digits=15, decimal_places=2)
    risk_level = models.CharField("리스크 레벨", max_length=20, choices=[
        ("HIGH", "높음"),
        ("NORMAL", "정상"),
    ])
    recommendation = models.TextField("권장사항")
    created_at = models.DateTimeField("생성 시간", auto_now_add=True, db_index=True)

    class Meta:
        db_table = "axos_forecast_records"
        ordering = ["-created_at"]
        verbose_name = "포캐스팅 기록"
        verbose_name_plural = "포캐스팅 기록"
        indexes = [
            models.Index(fields=["risk_level"]),
            models.Index(fields=["forecast_margin"]),
        ]

    def __str__(self):
        return f"예상 마진: {self.forecast_margin}원 ({self.risk_level})"


class AlertRecord(models.Model):
    """알림 관리 모델"""
    alert_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert_type = models.CharField("알림 유형", max_length=100, db_index=True)
    title = models.CharField("제목", max_length=500)
    severity = models.CharField("심각도", max_length=20, choices=[
        ("CRITICAL", "긴급"),
        ("HIGH", "높음"),
        ("MEDIUM", "중간"),
        ("LOW", "낮음"),
    ], db_index=True)
    source_object_type = models.CharField("소스 객체 유형", max_length=100)
    source_object_id = models.CharField("소스 객체 ID", max_length=200)
    dedup_key = models.CharField("중복 방지 키", max_length=200, blank=True, db_index=True)
    status = models.CharField("상태", max_length=20, choices=[
        ("OPEN", "열림"),
        ("ACKNOWLEDGED", "확인됨"),
        ("RESOLVED", "해결됨"),
    ], default="OPEN", db_index=True)
    detail_json = models.JSONField("상세 정보", default=dict)
    created_at = models.DateTimeField("생성 시간", auto_now_add=True, db_index=True)
    acknowledged_at = models.DateTimeField("확인 시간", null=True, blank=True)
    resolved_at = models.DateTimeField("해결 시간", null=True, blank=True)

    class Meta:
        db_table = "axos_alert_records"
        ordering = ["-created_at"]
        verbose_name = "알림"
        verbose_name_plural = "알림"
        indexes = [
            models.Index(fields=["alert_type"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["status"]),
            models.Index(fields=["dedup_key"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class WorkflowTask(models.Model):
    """워크플로우 태스크 모델"""
    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.CharField("태스크 유형", max_length=100, db_index=True)
    title = models.CharField("제목", max_length=500)
    owner_role = models.CharField("담당자 역할", max_length=100, db_index=True)
    source_object_type = models.CharField("소스 객체 유형", max_length=100)
    source_object_id = models.CharField("소스 객체 ID", max_length=200)
    status = models.CharField("상태", max_length=20, choices=[
        ("OPEN", "대기중"),
        ("IN_PROGRESS", "진행중"),
        ("COMPLETED", "완료"),
        ("CANCELLED", "취소"),
    ], default="OPEN", db_index=True)
    detail_json = models.JSONField("상세 정보", default=dict)
    created_at = models.DateTimeField("생성 시간", auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField("완료 시간", null=True, blank=True)

    class Meta:
        db_table = "axos_workflow_tasks"
        ordering = ["-created_at"]
        verbose_name = "워크플로우 태스크"
        verbose_name_plural = "워크플로우 태스크"
        indexes = [
            models.Index(fields=["task_type"]),
            models.Index(fields=["owner_role"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class ProcessGraph(models.Model):
    """프로세스 그래프 모델 (OCPM)"""
    graph_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    node_id = models.CharField("노드 ID", max_length=200, db_index=True)
    node_label = models.CharField("노드 레이블", max_length=500)
    node_type = models.CharField("노드 유형", max_length=50, choices=[
        ("product", "제품"),
        ("material", "자재"),
        ("equipment", "설비"),
        ("process", "공정"),
        ("quality", "품질"),
        ("order", "주문"),
    ], db_index=True)
    status = models.CharField("상태", max_length=20, choices=[
        ("active", "활성"),
        ("inactive", "비활성"),
        ("error", "오류"),
        ("warning", "경고"),
    ], default="active")
    metadata_json = models.JSONField("메타데이터", default=dict)
    created_at = models.DateTimeField("생성 시간", auto_now_add=True)
    updated_at = models.DateTimeField("수정 시간", auto_now=True)

    class Meta:
        db_table = "axos_process_graph"
        ordering = ["node_id"]
        verbose_name = "프로세스 그래프"
        verbose_name_plural = "프로세스 그래프"
        indexes = [
            models.Index(fields=["node_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.node_label} ({self.node_type})"


class ProcessGraphEdge(models.Model):
    """프로세스 그래프 엣지 모델"""
    edge_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_node = models.CharField("소스 노드 ID", max_length=200, db_index=True)
    target_node = models.CharField("타겟 노드 ID", max_length=200, db_index=True)
    label = models.CharField("레이블", max_length=200, blank=True)
    edge_type = models.CharField("엣지 유형", max_length=50, choices=[
        ("flow", "흐름"),
        ("dependency", "의존성"),
        ("constraint", "제약"),
    ], default="flow")
    created_at = models.DateTimeField("생성 시간", auto_now_add=True)

    class Meta:
        db_table = "axos_process_graph_edges"
        ordering = ["source_node", "target_node"]
        verbose_name = "프로세스 그래프 엣지"
        verbose_name_plural = "프로세스 그래프 엣지"
        indexes = [
            models.Index(fields=["source_node", "target_node"]),
            models.Index(fields=["edge_type"]),
        ]

    def __str__(self):
        return f"{self.source_node} -> {self.target_node}"
