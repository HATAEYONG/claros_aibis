"""
거버넌스 모델 — 정책 규칙, 위반, 승인 요청
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class PolicyRule(models.Model):
    """정책 규칙"""

    rule_id = models.UUIDField("규칙 ID", primary_key=True, default=uuid.uuid4)

    # 규칙 식별
    code = models.CharField("규칙 코드", max_length=50, unique=True)
    name_ko = models.CharField("한글명", max_length=100)
    name_en = models.CharField("영문명", max_length=100, blank=True)

    # 분류
    category = models.CharField(
        "카테고리", max_length=50,
        choices=[
            ("compliance", "준수"),
            ("security", "보안"),
            ("quality", "품질"),
            ("safety", "안전"),
            ("financial", "재무"),
            ("operational", "운영"),
        ]
    )

    # 설명
    description = models.TextField("설명")

    # 규칙 조건
    conditions = models.JSONField("조건", default=list)

    # 규칙 액션
    actions = models.JSONField("액션", default=list)

    # 심각도
    severity = models.CharField(
        "심각도", max_length=20,
        choices=[
            ("INFO", "정보"),
            ("LOW", "낮음"),
            ("MEDIUM", "보통"),
            ("HIGH", "높음"),
            ("CRITICAL", "긴급"),
        ],
        default="MEDIUM"
    )

    # 상태
    is_active = models.BooleanField("활성여부", default=True)

    # 메타데이터
    metadata = models.JSONField("메타데이터", default=dict)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "정책 규칙"
        verbose_name_plural = "정책 규칙"
        ordering = ["category", "code"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["code"]),
        ]

    def __str__(self):
        return f"[{self.code}] {self.name_ko}"

    def evaluate(self, context: dict) -> bool:
        """
        규칙 평가

        Args:
            context: 평가 컨텍스트

        Returns:
            위반 여부 (True: 위반)
        """
        for condition in self.conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")

            context_value = context.get(field)

            if operator == "eq" and context_value == value:
                return True
            elif operator == "ne" and context_value != value:
                return True
            elif operator == "gt" and context_value is not None and context_value > value:
                return True
            elif operator == "lt" and context_value is not None and context_value < value:
                return True
            elif operator == "gte" and context_value is not None and context_value >= value:
                return True
            elif operator == "lte" and context_value is not None and context_value <= value:
                return True
            elif operator == "in" and context_value in value:
                return True
            elif operator == "not_in" and context_value not in value:
                return True

        return False


class PolicyViolation(models.Model):
    """정책 위반"""

    violation_id = models.UUIDField("위반 ID", primary_key=True, default=uuid.uuid4)

    # 연결
    policy_rule = models.ForeignKey(
        PolicyRule,
        on_delete=models.CASCADE,
        related_name="violations",
        verbose_name="정책 규칙"
    )

    # 위반 주체
    violating_entity = models.CharField("위반 주체", max_length=200)
    entity_type = models.CharField(
        "주체 유형", max_length=50,
        choices=[
            ("user", "사용자"),
            ("agent", "에이전트"),
            ("system", "시스템"),
            ("process", "프로세스"),
        ]
    )

    # 위반 상세
    violation_details = models.JSONField("위반 상세", default=dict)

    # 심각도
    severity = models.CharField(
        "심각도", max_length=20,
        choices=[
            ("INFO", "정보"),
            ("LOW", "낮음"),
            ("MEDIUM", "보통"),
            ("HIGH", "높음"),
            ("CRITICAL", "긴급"),
        ]
    )

    # 상태
    status = models.CharField(
        "상태", max_length=20,
        choices=[
            ("open", "발생"),
            ("investigating", "조사중"),
            ("resolved", "해결"),
            ("dismissed", "무시"),
        ],
        default="open"
    )

    # 해결
    resolution = models.TextField("해결 방안", blank=True)
    resolved_at = models.DateTimeField("해결 시각", null=True, blank=True)
    resolved_by = models.CharField("해결자", max_length=100, blank=True)

    # 시각
    detected_at = models.DateTimeField("탐지 시각", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "정책 위반"
        verbose_name_plural = "정책 위반"
        ordering = ["-detected_at"]
        indexes = [
            models.Index(fields=["policy_rule", "status"]),
            models.Index(fields=["severity", "status"]),
        ]

    def __str__(self):
        return f"[{self.policy_rule.code}] {self.violating_entity} - {self.status}"

    def resolve(self, resolution: str, user: str = ""):
        """위반 해결"""
        self.status = "resolved"
        self.resolution = resolution
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.save(update_fields=["status", "resolution", "resolved_at", "resolved_by", "updated_at"])


class ApprovalRequest(models.Model):
    """승인 요청"""

    request_id = models.UUIDField("요청 ID", primary_key=True, default=uuid.uuid4)

    # 연결
    recommendation = models.ForeignKey(
        "ai.Recommendation",
        on_delete=models.CASCADE,
        related_name="approval_requests",
        null=True,
        blank=True,
        verbose_name="관련 추천"
    )

    # 요청 정보
    title = models.CharField("제목", max_length=200)
    description = models.TextField("설명")

    # 요청자
    requested_by = models.CharField("요청자", max_length=100)

    # 승인 레벨
    approval_level = models.IntegerField(
        "승인 레벨",
        choices=[
            (1, "L1"),
            (2, "L2"),
            (3, "L3"),
            (4, "L4"),
            (5, "L5"),
            (6, "L6"),
        ]
    )

    # 상태
    status = models.CharField(
        "상태", max_length=20,
        choices=[
            ("pending", "대기"),
            ("approved", "승인"),
            ("rejected", "거부"),
            ("cancelled", "취소"),
        ],
        default="pending"
    )

    # 현재 승인자
    current_approver = models.CharField("현재 승인자", max_length=100, blank=True)

    # 업무 영향도
    business_impact = models.CharField(
        "업무 영향도", max_length=20,
        choices=[
            ("low", "낮음"),
            ("medium", "보통"),
            ("high", "높음"),
            ("critical", "긴급"),
        ]
    )

    # 승인 내역
    approval_history = models.JSONField("승인 내역", default=list)

    # 거부 사유
    rejection_reason = models.TextField("거부 사유", blank=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    approved_at = models.DateTimeField("승인 시각", null=True, blank=True)

    class Meta:
        verbose_name = "승인 요청"
        verbose_name_plural = "승인 요청"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "approval_level"]),
            models.Index(fields=["requested_by", "status"]),
        ]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"

    def approve(self, approver: str, comment: str = ""):
        """승인"""
        self.status = "approved"
        self.current_approver = approver
        self.approved_at = timezone.now()

        # 승인 내역 추가
        self.approval_history.append({
            "action": "approved",
            "approver": approver,
            "comment": comment,
            "timestamp": timezone.now().isoformat()
        })

        self.save(update_fields=["status", "current_approver", "approved_at", "approval_history"])

    def reject(self, approver: str, reason: str):
        """거부"""
        self.status = "rejected"
        self.current_approver = approver
        self.rejection_reason = reason

        # 승인 내역 추가
        self.approval_history.append({
            "action": "rejected",
            "approver": approver,
            "reason": reason,
            "timestamp": timezone.now().isoformat()
        })

        self.save(update_fields=["status", "current_approver", "rejection_reason", "approval_history"])

    def cancel(self):
        """취소"""
        self.status = "cancelled"
        self.save(update_fields=["status"])


class ApprovalWorkflow(models.Model):
    """승인 워크플로우 템플릿"""

    workflow_id = models.UUIDField("워크플로우 ID", primary_key=True, default=uuid.uuid4)

    # 식별
    code = models.CharField("코드", max_length=50, unique=True)
    name = models.CharField("명칭", max_length=100)
    description = models.TextField("설명", blank=True)

    # 카테고리
    category = models.CharField("카테고리", max_length=50)

    # 승인 단계
    approval_levels = models.JSONField("승인 단계", default=list)

    # 조건
    conditions = models.JSONField("조건", default=dict)

    # 상태
    is_active = models.BooleanField("활성여부", default=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "승인 워크플로우"
        verbose_name_plural = "승인 워크플로우"
        ordering = ["category", "code"]

    def __str__(self):
        return f"[{self.code}] {self.name}"

    def get_required_level(self, context: dict) -> int:
        """
        컨텍스트에 따른 필요 승인 레벨 반환

        Args:
            context: 평가 컨텍스트

        Returns:
            필요 승인 레벨
        """
        # 기본 레벨
        base_level = len(self.approval_levels)

        # 조건 기반 레벨 조정
        conditions = self.conditions or {}
        business_impact = context.get("business_impact", "medium")

        impact_level_map = {
            "low": 0,
            "medium": 0,
            "high": 1,
            "critical": 2
        }

        adjustment = impact_level_map.get(business_impact, 0)

        return min(base_level + adjustment, 6)
