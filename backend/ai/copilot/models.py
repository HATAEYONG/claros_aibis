# -*- coding: utf-8 -*-
"""
Copilot 데이터 모델
자연어 질의응답 인터페이스를 위한 대화 및 메시지 모델
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Conversation(models.Model):
    """대화 세션 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='copilot_conversations',
        verbose_name='사용자'
    )
    title = models.CharField(max_length=255, blank=True, verbose_name='대화 제목')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')
    is_active = models.BooleanField(default=True, verbose_name='활성 여부')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='메타데이터')

    # 대화 컨텍스트 캐싱
    _context_cache = None

    class Meta:
        db_table = 'copilot_conversation'
        ordering = ['-updated_at']
        verbose_name = '대화 세션'
        verbose_name_plural = '대화 세션들'

    def __str__(self):
        return f"{self.title or '무제'} ({self.user.username})"

    def get_context(self):
        """대화 컨텍스트 가져오기 (캐싱)"""
        if self._context_cache is None:
            try:
                self._context_cache = self.context
            except ConversationContext.DoesNotExist:
                # 기본 컨텍스트 생성
                self._context_cache = ConversationContext.objects.create(
                    conversation=self
                )
        return self._context_cache

    def update_context(self, **kwargs):
        """대화 컨텍스트 업데이트"""
        context = self.get_context()
        for key, value in kwargs.items():
            if hasattr(context, key):
                setattr(context, key, value)
        context.save()


class Message(models.Model):
    """대화 메시지 모델"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='대화 세션'
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        verbose_name='역할'
    )
    content = models.TextField(verbose_name='메시지 내용')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='메타데이터')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')

    # 에이전트 실행 추적
    agent_trace = models.JSONField(default=list, blank=True, verbose_name='에이전트 추적')
    execution_time_ms = models.IntegerField(null=True, blank=True, verbose_name='실행 시간(ms)')
    confidence = models.FloatField(null=True, blank=True, verbose_name='신뢰도')

    class Meta:
        db_table = 'copilot_message'
        ordering = ['created_at']
        verbose_name = '메시지'
        verbose_name_plural = '메시지들'

    def __str__(self):
        content_preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"[{self.role}] {content_preview}"


class ConversationContext(models.Model):
    """대화 컨텍스트 모델"""
    conversation = models.OneToOneField(
        Conversation,
        on_delete=models.CASCADE,
        related_name='context',
        verbose_name='대화 세션'
    )

    # 쿼리 분석 결과
    domain = models.CharField(max_length=50, blank=True, verbose_name='도메인')
    query_type = models.CharField(max_length=50, blank=True, verbose_name='쿼리 타입')
    intent = models.CharField(max_length=50, blank=True, verbose_name='의도')

    # 추출된 엔티티
    entities = models.JSONField(default=dict, blank=True, verbose_name='엔티티')

    # 쿼리 파라미터
    parameters = models.JSONField(default=dict, blank=True, verbose_name='파라미터')

    # 대화 히스토리 요약
    summary = models.TextField(blank=True, verbose_name='대화 요약')

    # 관련 컨텍스트
    related_events = models.JSONField(default=list, blank=True, verbose_name='관련 이벤트')
    related_kpis = models.JSONField(default=list, blank=True, verbose_name='관련 KPI')

    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'copilot_conversation_context'
        verbose_name = '대화 컨텍스트'
        verbose_name_plural = '대화 컨텍스트들'

    def __str__(self):
        return f"Context for {self.conversation}"


class ConversationFeedback(models.Model):
    """대화 피드백 모델"""
    RATING_CHOICES = [
        (1, 'Very Bad'),
        (2, 'Bad'),
        (3, 'Neutral'),
        (4, 'Good'),
        (5, 'Very Good'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name='대화 세션'
    )
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        null=True,
        blank=True,
        verbose_name='메시지'
    )
    rating = models.IntegerField(choices=RATING_CHOICES, verbose_name='평점')
    comment = models.TextField(blank=True, verbose_name='코멘트')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')

    # 피드백 분석용
    feedback_type = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='피드백 유형',
        help_text='accuracy, relevance, helpfulness 등'
    )

    class Meta:
        db_table = 'copilot_feedback'
        ordering = ['-created_at']
        verbose_name = '피드백'
        verbose_name_plural = '피드백들'

    def __str__(self):
        return f"Feedback for {self.conversation} - {self.rating}점"


class CopilotSession(models.Model):
    """Copilot 세션 모델 (웹소켓 연결 관리)"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='copilot_sessions',
        verbose_name='사용자'
    )
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='sessions',
        null=True,
        blank=True,
        verbose_name='대화 세션'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='상태'
    )
    connected_at = models.DateTimeField(auto_now_add=True, verbose_name='연결일시')
    last_activity_at = models.DateTimeField(auto_now=True, verbose_name='마지막 활동일시')
    disconnected_at = models.DateTimeField(null=True, blank=True, verbose_name='연결 종료일시')

    # 클라이언트 정보
    client_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name='클라이언트 IP')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')

    class Meta:
        db_table = 'copilot_session'
        ordering = ['-last_activity_at']
        verbose_name = 'Copilot 세션'
        verbose_name_plural = 'Copilot 세션들'

    def __str__(self):
        return f"Session for {self.user.username} ({self.status})"

    def is_active(self):
        """세션 활성 상태 확인"""
        if self.status != 'active':
            return False

        # 30분 이상 비활성이면 만료로 간주
        from datetime import timedelta
        if timezone.now() - self.last_activity_at > timedelta(minutes=30):
            self.status = 'expired'
            self.save()
            return False

        return True
