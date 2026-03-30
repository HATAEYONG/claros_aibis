"""
컨트롤 타워 모델 — 경영진, 기능별, 프로세스 대시보드
"""
import uuid
from django.db import models


class ControlTowerConfig(models.Model):
    """컨트롤 타워 설정"""

    config_id = models.UUIDField("설정 ID", primary_key=True, default=uuid.uuid4)

    # 식별
    name = models.CharField("명칭", max_length=100)
    code = models.CharField("코드", max_length=50, unique=True)

    # 타입
    tower_type = models.CharField(
        "타워 유형", max_length=30,
        choices=[
            ("executive", "경영진"),
            ("functional", "기능별"),
            ("process", "프로세스"),
        ]
    )

    # 설명
    description = models.TextField("설명", blank=True)

    # 구성
    config = models.JSONField("설정", default=dict)

    # 메트릭 정의
    metrics = models.JSONField("메트릭", default=list)

    # 알림 설정
    alert_config = models.JSONField("알림 설정", default=dict)

    # 상태
    is_active = models.BooleanField("활성", default=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "컨트롤 타워 설정"
        verbose_name_plural = "컨트롤 타워 설정"
        ordering = ["tower_type", "code"]

    def __str__(self):
        return f"[{self.tower_type}] {self.name}"


class DashboardLayout(models.Model):
    """대시보드 레이아웃"""

    layout_id = models.UUIDField("레이아웃 ID", primary_key=True, default=uuid.uuid4)

    # 연결
    tower_config = models.ForeignKey(
        ControlTowerConfig,
        on_delete=models.CASCADE,
        related_name="layouts",
        verbose_name="타워 설정"
    )

    # 식별
    name = models.CharField("명칭", max_length=100)

    # 레이아웃 구성
    layout = models.JSONField("레이아웃", default=dict)

    # 위젯 목록
    widgets = models.JSONField("위젯", default=list)

    # 기본 여부
    is_default = models.BooleanField("기본", default=False)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "대시보드 레이아웃"
        verbose_name_plural = "대시보드 레이아웃"
        ordering = ["tower_config", "-is_default", "name"]

    def __str__(self):
        return f"{self.tower_config.name} - {self.name}"
