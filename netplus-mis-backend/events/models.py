"""
이벤트 모델 — 기업 운영 이벤트의 표준 단위
모든 경고, 분석, 권고는 이벤트로부터 시작된다.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class EventType(models.TextChoices):
    """14개 이벤트 패밀리"""
    KPI_DEVIATION = "KPI_DEVIATION", "KPI 편차"
    COST_VARIANCE_BREACH = "COST_VARIANCE_BREACH", "원가 편차 초과"
    MATERIAL_PRICE_SPIKE = "MATERIAL_PRICE_SPIKE", "자재 단가 급등"
    SUPPLIER_RISK_ALERT = "SUPPLIER_RISK_ALERT", "공급처 리스크"
    OUTPUT_SHORTFALL = "OUTPUT_SHORTFALL", "생산 실적 미달"
    CAPACITY_OVERLOAD = "CAPACITY_OVERLOAD", "설비 과부하"
    DEFECT_CLUSTER = "DEFECT_CLUSTER", "불량 군집"
    CAPA_OVERDUE = "CAPA_OVERDUE", "CAPA 지연"
    CASHFLOW_STRESS = "CASHFLOW_STRESS", "현금흐름 압박"
    BUDGET_OVERRUN = "BUDGET_OVERRUN", "예산 초과"
    ABNORMAL_JOURNAL = "ABNORMAL_JOURNAL", "전표 이상 패턴"
    OVERTIME_SURGE = "OVERTIME_SURGE", "초과근무 급증"
    SOP_NONCOMPLIANCE = "SOP_NONCOMPLIANCE", "SOP 미준수"
    APPROVAL_BYPASS = "APPROVAL_BYPASS", "승인 우회"


class EventSeverity(models.TextChoices):
    """이벤트 심각도"""
    INFO = "INFO", "정보"
    LOW = "LOW", "낮음"
    MEDIUM = "MEDIUM", "보통"
    HIGH = "HIGH", "높음"
    CRITICAL = "CRITICAL", "긴급"


class EventStatus(models.TextChoices):
    """이벤트 상태"""
    OPEN = "open", "발생"
    ACKNOWLEDGED = "acknowledged", "확인"
    IN_PROGRESS = "in_progress", "처리중"
    RESOLVED = "resolved", "해결"
    DISMISSED = "dismissed", "무시"


class DomainChoices(models.TextChoices):
    """도메인 구분"""
    COST = "cost", "원가"
    FINANCE = "finance", "재무"
    PURCHASING = "purchasing", "구매"
    PRODUCTION = "production", "생산"
    QUALITY = "quality", "품질"
    INVENTORY = "inventory", "재고"
    MAINTENANCE = "maintenance", "설비"
    SALES = "sales", "영업"
    HR = "hr", "인사"
    COMPLIANCE = "compliance", "컴플라이언스"


class ProcessChoices(models.TextChoices):
    """핵심 프로세스 구분"""
    O2C = "O2C", "Order to Cash"
    P2P = "P2P", "Procure to Pay"
    P2PROD = "P2Prod", "Plan to Produce"
    Q2R = "Q2R", "Quality to Resolution"
    R2R = "R2R", "Record to Report"
    H2R = "H2R", "Hire to Retire"


class Event(models.Model):
    """기업 운영 이벤트 — 모든 경고·분석·권고의 기본 단위"""

    event_id = models.UUIDField(
        "이벤트 ID", primary_key=True, default=uuid.uuid4
    )

    # 이벤트 분류
    event_type = models.CharField(
        "이벤트 유형", max_length=50,
        choices=EventType.choices, db_index=True
    )
    severity = models.CharField(
        "심각도", max_length=20,
        choices=EventSeverity.choices, db_index=True
    )
    status = models.CharField(
        "상태", max_length=20,
        choices=EventStatus.choices, default=EventStatus.OPEN
    )

    # ── 범위 ──
    scope_type = models.CharField("범위 유형", max_length=50)
    scope_id = models.CharField("범위 ID", max_length=100)
    scope_name = models.CharField("범위명", max_length=200, blank=True)

    # ── 도메인 / 프로세스 ──
    domain = models.CharField(
        "도메인", max_length=30,
        choices=DomainChoices.choices, blank=True
    )
    process_code = models.CharField(
        "프로세스", max_length=20,
        choices=ProcessChoices.choices, blank=True
    )

    # ── 제목 및 설명 ──
    title = models.CharField("제목", max_length=200)
    description = models.TextField("설명")

    # ── 수치 ──
    observed_value = models.DecimalField(
        "관측값", max_digits=20, decimal_places=4, null=True, blank=True
    )
    threshold_value = models.DecimalField(
        "기준값", max_digits=20, decimal_places=4, null=True, blank=True
    )
    deviation_pct = models.DecimalField(
        "편차(%)", max_digits=10, decimal_places=2, null=True, blank=True
    )

    # ── KPI/KRI 연결 ──
    kpi_code = models.CharField("KPI 코드", max_length=50, blank=True)
    kri_code = models.CharField("KRI 코드", max_length=50, blank=True)

    # ── 출처·근거 ──
    source = models.CharField("출처", max_length=100, blank=True)
    source_detail = models.JSONField("출처 상세", default=dict, blank=True)
    evidence_refs = models.JSONField("근거 참조", default=list, blank=True)

    # ── 해결 정보 ──
    resolved_at = models.DateTimeField("해결일시", null=True, blank=True)
    resolved_by = models.CharField("해결자", max_length=100, blank=True)
    resolution_note = models.TextField("해결 내용", blank=True)

    # ── Agent 연결 ──
    detected_by_agent = models.CharField(
        "감지 Agent", max_length=100, blank=True
    )
    agent_run_id = models.UUIDField("Agent 실행 ID", null=True, blank=True)

    # ── 확인 정보 ──
    acknowledged_at = models.DateTimeField("확인일시", null=True, blank=True)
    acknowledged_by = models.CharField("확인자", max_length=100, blank=True)

    # ── 시각 ──
    event_time = models.DateTimeField("이벤트 발생 시각", db_index=True)
    created_at = models.DateTimeField("생성일시", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "이벤트"
        verbose_name_plural = "이벤트"
        ordering = ["-event_time"]
        indexes = [
            models.Index(fields=["event_type", "severity", "status"]),
            models.Index(fields=["scope_type", "scope_id"]),
            models.Index(fields=["domain", "process_code"]),
            models.Index(fields=["status", "event_time"]),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.get_event_type_display()} — {self.scope_name or self.scope_id}"

    def acknowledge(self, user: str = ""):
        """이벤트 확인"""
        from django.utils import timezone
        self.status = EventStatus.ACKNOWLEDGED
        self.acknowledged_at = timezone.now()
        self.acknowledged_by = user
        self.save(update_fields=["status", "acknowledged_at", "acknowledged_by", "updated_at"])

    def resolve(self, note: str, user: str = ""):
        """이벤트 해결"""
        self.status = EventStatus.RESOLVED
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.resolution_note = note
        self.save(update_fields=[
            "status", "resolved_at", "resolved_by",
            "resolution_note", "updated_at"
        ])

    def dismiss(self):
        """이벤트 무시"""
        self.status = EventStatus.DISMISSED
        self.save(update_fields=["status", "updated_at"])


class EventCorrelation(models.Model):
    """이벤트 간 상관관계"""

    correlation_id = models.UUIDField(
        "상관관계 ID", primary_key=True, default=uuid.uuid4
    )

    source_event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="correlations_from",
        verbose_name="소스 이벤트"
    )
    target_event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="correlations_to",
        verbose_name="타겟 이벤트"
    )

    correlation_type = models.CharField(
        "상관 유형", max_length=30
    )  # causal | temporal | co_occurrence
    confidence = models.FloatField(
        "신뢰도",
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    description = models.TextField("설명", blank=True)

    # 분석 메타데이터
    analysis_method = models.CharField("분석 방법", max_length=50, blank=True)
    time_lag_seconds = models.IntegerField("시간 지연(초)", null=True, blank=True)

    created_at = models.DateTimeField("생성일시", auto_now_add=True)

    class Meta:
        verbose_name = "이벤트 상관관계"
        verbose_name_plural = "이벤트 상관관계"
        unique_together = ["source_event", "target_event"]
        indexes = [
            models.Index(fields=["correlation_type", "confidence"]),
        ]

    def __str__(self):
        return f"{self.source_event.event_id} → {self.target_event.event_id} ({self.correlation_type})"
