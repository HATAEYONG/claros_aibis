"""
Agent 운영 모델 — L4: Agent Ops Layer
실행 로그, 분석 계획, 권고안, 평가, 리플렉션, 메모리
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class AgentRunLog(models.Model):
    """Agent 실행 이력 — 평가·리플렉션의 기반 데이터"""

    request_id = models.UUIDField("요청 ID", primary_key=True, default=uuid.uuid4)
    agent_name = models.CharField("Agent명", max_length=100, db_index=True)
    agent_version = models.CharField("버전", max_length=20, blank=True)
    agent_layer = models.CharField("계층", max_length=30, blank=True)
    agent_domain = models.CharField("도메인", max_length=30, blank=True)

    # 입출력
    input_data = models.JSONField("입력", default=dict)
    output_data = models.JSONField("출력", default=dict)

    # 결과
    status = models.CharField("상태", max_length=20)
    confidence = models.FloatField("신뢰도", default=0.0)
    execution_time_ms = models.IntegerField("실행시간(ms)", default=0)
    has_evidence = models.BooleanField("근거 포함", default=False)

    # 평가 (EvaluationAgent가 채움)
    evaluated = models.BooleanField("평가 완료", default=False)
    evaluation_score = models.FloatField("평가 점수", null=True, blank=True)
    evaluation_note = models.TextField("평가 노트", blank=True)

    # 연결
    parent_run_id = models.UUIDField("상위 실행 ID", null=True, blank=True)
    triggered_event_id = models.UUIDField("연관 이벤트 ID", null=True, blank=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Agent 실행 로그"
        verbose_name_plural = "Agent 실행 로그"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["agent_name", "status"]),
            models.Index(fields=["parent_run_id"]),
            models.Index(fields=["agent_domain", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.agent_name}] {self.status} ({self.execution_time_ms}ms)"


class AnalysisPlan(models.Model):
    """분석 계획 — AnalysisPlannerAgent가 생성"""

    plan_id = models.UUIDField("계획 ID", primary_key=True, default=uuid.uuid4)
    request_id = models.UUIDField("요청 ID", db_index=True)

    plan_type = models.CharField("계획 유형", max_length=30)
    description = models.TextField("설명")

    steps = models.JSONField("실행 단계", default=list)
    status = models.CharField("상태", max_length=20, default="planned")
    completed_steps = models.IntegerField("완료 단계", default=0)
    total_steps = models.IntegerField("전체 단계", default=0)

    # 연결
    agent_run_id = models.UUIDField("Agent 실행 ID", null=True, blank=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "분석 계획"
        verbose_name_plural = "분석 계획"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.plan_type}] {self.description}"


class Recommendation(models.Model):
    """권고안 — RecommendationAgent가 생성"""

    recommendation_id = models.UUIDField("권고 ID", primary_key=True, default=uuid.uuid4)
    title = models.CharField("제목", max_length=300)
    description = models.TextField("설명")

    # 분류
    domain = models.CharField("도메인", max_length=30, blank=True)
    process_code = models.CharField("프로세스", max_length=20, blank=True)
    priority = models.CharField(
        "우선순위", max_length=20,
        choices=[("urgent", "긴급"), ("high", "높음"), ("medium", "보통"), ("low", "낮음")]
    )
    impact_area = models.CharField("영향 영역", max_length=50)

    # 연결
    related_events = models.JSONField("관련 이벤트", default=list)
    related_kpis = models.JSONField("관련 KPI", default=list)
    evidence_refs = models.JSONField("근거 참조", default=list)

    # 예상 효과
    estimated_impact = models.JSONField("예상 효과", default=dict)

    # 실행 항목
    action_items = models.JSONField("액션 항목", default=list)

    # 승인
    approval_level = models.CharField("승인 레벨", max_length=20, blank=True)
    approved = models.BooleanField("승인 여부", null=True, blank=True)
    approved_by = models.CharField("승인자", max_length=100, blank=True)
    approved_at = models.DateTimeField("승인일시", null=True, blank=True)

    # 피드백 루프
    adopted = models.BooleanField("채택 여부", null=True, blank=True)
    adoption_feedback = models.TextField("채택 피드백", blank=True)
    measured_improvement = models.JSONField("측정된 개선", null=True, blank=True)

    # 생성 Agent
    generated_by_agent = models.CharField("생성 Agent", max_length=100)
    agent_run_id = models.UUIDField("Agent 실행 ID", null=True, blank=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField("만료 시각", null=True, blank=True)

    class Meta:
        verbose_name = "권고안"
        verbose_name_plural = "권고안"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["domain", "priority"]),
            models.Index(fields=["approved", "adopted"]),
        ]

    def __str__(self):
        return f"[{self.priority}] {self.title}"


class ReflectionLog(models.Model):
    """리플렉션 로그 — ReflectionAgent가 생성"""

    reflection_id = models.UUIDField(
        "리플렉션 ID", primary_key=True, default=uuid.uuid4
    )

    agent_run = models.ForeignKey(
        AgentRunLog, on_delete=models.CASCADE,
        related_name="reflections", verbose_name="Agent 실행"
    )

    # 반성 유형
    reflection_type = models.CharField(
        "반성 유형", max_length=50,
        choices=[("outcome", "결과"), ("process", "프로세스"), ("strategy", "전략")],
        default="outcome"
    )

    # 반성 내용
    what_went_well = models.TextField("잘된 점", blank=True)
    what_went_wrong = models.TextField("잘못된 점", blank=True)
    lessons_learned = models.TextField("학습 포인트", blank=True)
    improvement_suggestions = models.JSONField("개선 제안", default=list)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)

    class Meta:
        verbose_name = "리플렉션 로그"
        verbose_name_plural = "리플렉션 로그"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.reflection_type}] {self.agent_run.agent_name}"


class AgentMemory(models.Model):
    """Agent 장기 메모리 — MemoryCuratorAgent가 관리"""

    memory_id = models.UUIDField("메모리 ID", primary_key=True, default=uuid.uuid4)

    memory_type = models.CharField(
        "유형", max_length=30,
        choices=[("pattern", "패턴"), ("context", "컨텍스트"), ("preference", "선호"), ("exception", "예외")],
        default="pattern"
    )

    domain = models.CharField("도메인", max_length=30, blank=True)
    key = models.CharField("키", max_length=200, db_index=True)
    value = models.JSONField("값")

    # 메타데이터
    frequency = models.IntegerField("출현 빈도", default=1)
    importance = models.FloatField("중요도", default=1.0)
    last_used = models.DateTimeField("마지막 사용", auto_now=True)
    is_active = models.BooleanField("활성", default=True)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)

    class Meta:
        verbose_name = "Agent 메모리"
        verbose_name_plural = "Agent 메모리"
        unique_together = ["memory_type", "key"]
        ordering = ["-last_used"]
        indexes = [
            models.Index(fields=["memory_type", "is_active"]),
            models.Index(fields=["domain", "importance"]),
        ]

    def __str__(self):
        return f"[{self.memory_type}] {self.key}"


class Document(models.Model):
    """RAG 문서 — 문서 관리"""

    doc_id = models.UUIDField("문서 ID", primary_key=True, default=uuid.uuid4)

    # 문서 정보
    title = models.CharField("제목", max_length=200)
    content_type = models.CharField("콘텐츠 유형", max_length=50)

    # 출처
    source_uri = models.CharField("출처 URI", max_length=500)
    source_type = models.CharField("출처 유형", max_length=50, blank=True)

    # 메타데이터
    metadata = models.JSONField("메타데이터", default=dict)

    # 상태
    is_processed = models.BooleanField("처리 완료", default=False)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)
    updated_at = models.DateTimeField("수정일시", auto_now=True)

    class Meta:
        verbose_name = "RAG 문서"
        verbose_name_plural = "RAG 문서"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "is_processed"]),
        ]

    def __str__(self):
        return self.title

    def chunk_count(self):
        """청크 수 반환"""
        return self.chunks.count()


class DocumentChunk(models.Model):
    """문서 청크 — RAG 검색 단위"""

    chunk_id = models.UUIDField("청크 ID", primary_key=True, default=uuid.uuid4)

    # 문서 연결
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE,
        related_name="chunks", verbose_name="문서"
    )

    # 청크 정보
    chunk_index = models.IntegerField("청크 인덱스")
    text = models.TextField("텍스트")

    # 벡터 임베딩
    embedding = models.JSONField("임베딩 벡터", null=True, blank=True)

    # 메타데이터
    metadata = models.JSONField("메타데이터", default=dict)

    # 시각
    created_at = models.DateTimeField("생성일시", auto_now_add=True)

    class Meta:
        verbose_name = "문서 청크"
        verbose_name_plural = "문서 청크"
        unique_together = [["document", "chunk_index"]]
        ordering = ["document", "chunk_index"]
        indexes = [
            models.Index(fields=["document", "chunk_index"]),
        ]

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"
