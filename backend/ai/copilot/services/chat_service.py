# -*- coding: utf-8 -*-
"""
ChatService - Copilot 채팅 서비스
대화 관리, 메시지 처리, 컨텍스트 유지 기능 제공
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from django.utils import timezone
from django.db import transaction
import uuid

from ai.copilot.models import (
    Conversation, Message, ConversationContext, ConversationFeedback
)
from ai.copilot.agents.copilot_agent import CopilotAgent
from ai.agent_orchestration_service import QueryAnalyzer

logger = logging.getLogger(__name__)


class ChatService:
    """
    Copilot 채팅 서비스

    대화 세션 관리, 메시지 처리, 컨텍스트 유지 등
    Copilot의 핵심 기능을 제공합니다.
    """

    def __init__(self):
        self.copilot_agent = CopilotAgent()
        self.query_analyzer = QueryAnalyzer()

    @transaction.atomic
    def create_conversation(
        self,
        user_id: str,
        title: str = None,
        metadata: dict = None
    ) -> Conversation:
        """
        새 대화 세션 생성

        Args:
            user_id: 사용자 ID
            title: 대화 제목 (선택)
            metadata: 추가 메타데이터

        Returns:
            Conversation: 생성된 대화 세션
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user = User.objects.get(id=user_id)

        conversation = Conversation.objects.create(
            user=user,
            title=title or '새 대화',
            metadata=metadata or {}
        )

        # 기본 컨텍스트 생성
        ConversationContext.objects.create(conversation=conversation)

        logger.info(f"[ChatService] Created conversation {conversation.id} for user {user_id}")
        return conversation

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        대화 세션 조회

        Args:
            conversation_id: 대화 세션 ID

        Returns:
            Conversation: 대화 세션 (없으면 None)
        """
        try:
            return Conversation.objects.get(id=conversation_id, is_active=True)
        except Conversation.DoesNotExist:
            return None

    def list_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Conversation]:
        """
        사용자의 대화 목록 조회

        Args:
            user_id: 사용자 ID
            limit: 반환할 개수
            offset: 오프셋

        Returns:
            List[Conversation]: 대화 세션 목록
        """
        return Conversation.objects.filter(
            user_id=user_id,
            is_active=True
        ).order_by('-updated_at')[offset:offset + limit]

    @transaction.atomic
    def send_message(
        self,
        conversation_id: str,
        content: str,
        role: str = 'user',
        metadata: dict = None
    ) -> Dict[str, Any]:
        """
        메시지 전송 및 응답 생성

        Args:
            conversation_id: 대화 세션 ID
            content: 메시지 내용
            role: 역할 (user, assistant, system)
            metadata: 추가 메타데이터

        Returns:
            dict: 응답 (메시지, 답변, 관련 질문 등)
        """
        # 대화 세션 조회
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation not found: {conversation_id}")

        # 사용자 메시지 저장
        user_message = Message.objects.create(
            conversation=conversation,
            role=role,
            content=content,
            metadata=metadata or {}
        )

        logger.info(f"[ChatService] Received message in {conversation_id}: {content[:100]}...")

        # 쿼리 분석 및 컨텍스트 업데이트
        query_analysis = self._analyze_and_update_context(conversation, content)

        # CopilotAgent 실행
        from ai.agents.base.agent import AgentInput
        agent_input = AgentInput(
            request_id=str(uuid.uuid4()),
            query=content,
            context={
                'conversation_id': str(conversation.id),
                'query_analysis': query_analysis,
                'user_id': str(conversation.user.id),
            },
            parameters=query_analysis.get('parameters', {}),
            requested_by=conversation.user.username,
        )

        start_time = timezone.now()
        output = self.copilot_agent.run(agent_input)
        execution_time = int((timezone.now() - start_time).total_seconds() * 1000)

        # 어시스턴트 메시지 저장
        assistant_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=output.result.get('answer', ''),
            metadata={
                'query_analysis': query_analysis,
                'summary': output.result.get('summary', ''),
            },
            agent_trace=output.metadata.get('agent_trace', []),
            execution_time_ms=execution_time,
            confidence=output.confidence,
        )

        # 대화 세션 업데이트
        conversation.updated_at = timezone.now()
        if not conversation.title or conversation.title == '새 대화':
            # 첫 메시지를 제목으로 설정
            conversation.title = content[:50] + '...' if len(content) > 50 else content
        conversation.save()

        # 응답 생성
        response = {
            'conversation_id': str(conversation.id),
            'user_message': {
                'id': str(user_message.id),
                'role': user_message.role,
                'content': user_message.content,
                'created_at': user_message.created_at.isoformat(),
            },
            'assistant_message': {
                'id': str(assistant_message.id),
                'role': assistant_message.role,
                'content': assistant_message.content,
                'created_at': assistant_message.created_at.isoformat(),
                'confidence': output.confidence,
                'execution_time_ms': execution_time,
            },
            'metadata': {
                'agent_trace': output.metadata.get('agent_trace', []),
                'query_analysis': query_analysis,
            },
            'answer': output.result.get('answer', ''),
            'summary': output.result.get('summary', ''),
            'data_points': output.result.get('data_points', []),
            'insights': output.result.get('insights', []),
            'related_questions': output.result.get('related_questions', []),
            'recommendations': output.recommendations,
            'warnings': output.warnings,
            'evidence': output.evidence_refs,
        }

        logger.info(f"[ChatService] Response generated for {conversation_id}")
        return response

    def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        대화 기록 조회

        Args:
            conversation_id: 대화 세션 ID
            limit: 반환할 메시지 수

        Returns:
            List[dict]: 메시지 목록
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return []

        messages = Message.objects.filter(
            conversation=conversation
        ).order_by('created_at')[:limit]

        return [
            {
                'id': str(msg.id),
                'role': msg.role,
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
                'confidence': msg.confidence,
                'execution_time_ms': msg.execution_time_ms,
            }
            for msg in messages
        ]

    def get_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """
        대화 컨텍스트 조회

        Args:
            conversation_id: 대화 세션 ID

        Returns:
            dict: 컨텍스트 정보
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return {}

        context = conversation.get_context()

        return {
            'conversation_id': str(conversation.id),
            'domain': context.domain,
            'query_type': context.query_type,
            'intent': context.intent,
            'entities': context.entities,
            'parameters': context.parameters,
            'summary': context.summary,
            'related_events': context.related_events,
            'related_kpis': context.related_kpis,
        }

    @transaction.atomic
    def submit_feedback(
        self,
        conversation_id: str,
        message_id: str = None,
        rating: int = None,
        comment: str = None,
        feedback_type: str = None
    ) -> ConversationFeedback:
        """
        피드백 제출

        Args:
            conversation_id: 대화 세션 ID
            message_id: 메시지 ID (선택)
            rating: 평점 (1-5)
            comment: 코멘트
            feedback_type: 피드백 유형

        Returns:
            ConversationFeedback: 생성된 피드백
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation not found: {conversation_id}")

        message = None
        if message_id:
            try:
                message = Message.objects.get(id=message_id, conversation=conversation)
            except Message.DoesNotExist:
                pass

        feedback = ConversationFeedback.objects.create(
            conversation=conversation,
            message=message,
            rating=rating,
            comment=comment,
            feedback_type=feedback_type
        )

        logger.info(f"[ChatService] Feedback submitted for {conversation_id}: {rating}점")
        return feedback

    def _analyze_and_update_context(
        self,
        conversation: Conversation,
        query: str
    ) -> Dict[str, Any]:
        """
        쿼리 분석 및 컨텍스트 업데이트

        Args:
            conversation: 대화 세션
            query: 사용자 질문

        Returns:
            dict: 쿼리 분석 결과
        """
        # 기존 컨텍스트 가져오기
        context_obj = conversation.get_context()

        # 쿼리 분석
        query_analysis = self.query_analyzer.analyze(
            message=query,
            context={
                'domain': context_obj.domain,
                'query_type': context_obj.query_type,
                'parameters': context_obj.parameters,
            }
        )

        # 컨텍스트 업데이트
        updates = {}
        if query_analysis.get('domain'):
            updates['domain'] = query_analysis['domain']
        if query_analysis.get('type'):
            updates['query_type'] = query_analysis['type']
        if query_analysis.get('intent'):
            updates['intent'] = query_analysis['intent']
        if query_analysis.get('entities'):
            # 엔티티 병합
            existing_entities = context_obj.entities or {}
            new_entities = query_analysis['entities']
            updates['entities'] = {**existing_entities, **new_entities}
        if query_analysis.get('parameters'):
            # 파라미터 병합
            existing_params = context_obj.parameters or {}
            new_params = query_analysis['parameters']
            updates['parameters'] = {**existing_params, **new_params}

        if updates:
            for key, value in updates.items():
                setattr(context_obj, key, value)
            context_obj.save()

        return query_analysis

    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """
        대화 요약 조회

        Args:
            conversation_id: 대화 세션 ID

        Returns:
            dict: 대화 요약
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return {}

        messages = Message.objects.filter(conversation=conversation)
        context = conversation.get_context()

        return {
            'conversation_id': str(conversation.id),
            'title': conversation.title,
            'created_at': conversation.created_at.isoformat(),
            'updated_at': conversation.updated_at.isoformat(),
            'message_count': messages.count(),
            'domain': context.domain,
            'query_type': context.query_type,
            'summary': context.summary,
        }

    def delete_conversation(self, conversation_id: str) -> bool:
        """
        대화 세션 삭제 (비활성화)

        Args:
            conversation_id: 대화 세션 ID

        Returns:
            bool: 삭제 성공 여부
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return False

        conversation.is_active = False
        conversation.save()

        logger.info(f"[ChatService] Conversation {conversation_id} deactivated")
        return True


class ContextManager:
    """
    컨텍스트 관리자

    대화 컨텍스트의 저장, 조회, 업데이트를 담당합니다.
    """

    @staticmethod
    def get_context(conversation_id: str) -> Optional[ConversationContext]:
        """컨텍스트 조회"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, is_active=True)
            return conversation.get_context()
        except Conversation.DoesNotExist:
            return None

    @staticmethod
    def update_context(conversation_id: str, **kwargs) -> bool:
        """컨텍스트 업데이트"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, is_active=True)
            conversation.update_context(**kwargs)
            return True
        except Conversation.DoesNotExist:
            return False

    @staticmethod
    def clear_context(conversation_id: str) -> bool:
        """컨텍스트 초기화"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, is_active=True)
            context = conversation.get_context()
            context.domain = ''
            context.query_type = ''
            context.intent = ''
            context.entities = {}
            context.parameters = {}
            context.summary = ''
            context.related_events = []
            context.related_kpis = []
            context.save()
            return True
        except Conversation.DoesNotExist:
            return False


class ResponseFormatter:
    """
    응답 포매터

    에이전트 출력을 사용자 친화적인 형식으로 변환합니다.
    """

    @staticmethod
    def format_answer(answer: str, summary: str = None) -> str:
        """답변 포맷팅"""
        if summary:
            return f"{summary}\n\n{answer}"
        return answer

    @staticmethod
    def format_evidence(evidence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """증거 포맷팅"""
        formatted = []
        for ev in evidence:
            formatted.append({
                'type': ev.get('evidence_type', 'unknown'),
                'source': ev.get('source', ''),
                'description': ev.get('description', ''),
                'source_agent': ev.get('source_agent', ''),
            })
        return formatted

    @staticmethod
    def format_recommendations(recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """권고사항 포맷팅"""
        formatted = []
        for rec in recommendations:
            if isinstance(rec, dict):
                formatted.append({
                    'title': rec.get('title', ''),
                    'priority': rec.get('priority', 'medium'),
                    'description': rec.get('description', ''),
                })
            elif isinstance(rec, str):
                formatted.append({
                    'title': rec,
                    'priority': 'medium',
                    'description': '',
                })
        return formatted
