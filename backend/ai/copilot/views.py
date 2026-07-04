# -*- coding: utf-8 -*-
"""
Copilot API 뷰
자연어 질의응답 API 엔드포인트 제공
"""
import logging
from typing import Dict, Any

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from ai.copilot.models import Conversation, Message, ConversationFeedback
from ai.copilot.services.chat_service import (
    ChatService, ContextManager, ResponseFormatter
)

logger = logging.getLogger(__name__)
User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    """
    대화 세션 관리 API

    - 대화 생성, 조회, 목록, 삭제
    - 메시지 전송
    - 대화 기록 조회
    - 피드백 제출
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.chat_service = ChatService()

    def get_queryset(self):
        """쿼리셋 필터링"""
        return Conversation.objects.filter(
            user=self.request.user,
            is_active=True
        )

    def create(self, request):
        """
        새 대화 세션 생성

        POST /api/copilot/conversations/
        {
            "title": "대화 제목 (선택)",
            "metadata": {}
        }
        """
        try:
            title = request.data.get('title')
            metadata = request.data.get('metadata', {})

            conversation = self.chat_service.create_conversation(
                user_id=str(request.user.id),
                title=title,
                metadata=metadata
            )

            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, pk=None):
        """
        대화 세션 조회

        GET /api/copilot/conversations/{id}/
        """
        conversation = self.chat_service.get_conversation(pk)
        if not conversation:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 대화 요약 포함
        summary = self.chat_service.get_conversation_summary(pk)

        serializer = self.get_serializer(conversation)
        data = serializer.data
        data['summary'] = summary

        return Response(data)

    def list(self, request):
        """
        대화 세션 목록 조회

        GET /api/copilot/conversations/
        """
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        conversations = self.chat_service.list_conversations(
            user_id=str(request.user.id),
            limit=limit,
            offset=offset
        )

        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """
        대화 세션 삭제 (비활성화)

        DELETE /api/copilot/conversations/{id}/
        """
        success = self.chat_service.delete_conversation(pk)
        if not success:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """
        메시지 전송 및 응답 받기

        POST /api/copilot/conversations/{id}/chat/
        {
            "content": "메시지 내용",
            "metadata": {}
        }
        """
        try:
            content = request.data.get('content', '').strip()
            if not content:
                return Response(
                    {'error': 'Message content is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            metadata = request.data.get('metadata', {})

            response = self.chat_service.send_message(
                conversation_id=pk,
                content=content,
                role='user',
                metadata=metadata
            )

            return Response(response)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        대화 기록 조회

        GET /api/copilot/conversations/{id}/history/?limit=50
        """
        limit = int(request.query_params.get('limit', 50))

        messages = self.chat_service.get_conversation_history(
            conversation_id=pk,
            limit=limit
        )

        return Response({
            'conversation_id': pk,
            'messages': messages,
            'count': len(messages),
        })

    @action(detail=True, methods=['get'])
    def context(self, request, pk=None):
        """
        대화 컨텍스트 조회

        GET /api/copilot/conversations/{id}/context/
        """
        context_data = self.chat_service.get_conversation_context(pk)
        if not context_data:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(context_data)

    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """
        피드백 제출

        POST /api/copilot/conversations/{id}/feedback/
        {
            "message_id": "메시지 ID (선택)",
            "rating": 5,
            "comment": "코멘트",
            "feedback_type": "accuracy"
        }
        """
        try:
            message_id = request.data.get('message_id')
            rating = request.data.get('rating')
            comment = request.data.get('comment', '')
            feedback_type = request.data.get('feedback_type')

            if rating is None:
                return Response(
                    {'error': 'Rating is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            feedback = self.chat_service.submit_feedback(
                conversation_id=pk,
                message_id=message_id,
                rating=rating,
                comment=comment,
                feedback_type=feedback_type
            )

            return Response({
                'id': str(feedback.id),
                'rating': feedback.rating,
                'comment': feedback.comment,
                'created_at': feedback.created_at.isoformat(),
            })

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error submitting feedback: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def clear_context(self, request, pk=None):
        """
        대화 컨텍스트 초기화

        POST /api/copilot/conversations/{id}/clear_context/
        """
        success = ContextManager.clear_context(pk)
        if not success:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({'message': 'Context cleared'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        사용자별 Copilot 통계

        GET /api/copilot/conversations/stats/
        """
        user = request.user

        conversations = Conversation.objects.filter(
            user=user,
            is_active=True
        )

        messages = Message.objects.filter(
            conversation__in=conversations
        )

        feedbacks = ConversationFeedback.objects.filter(
            conversation__in=conversations
        )

        # 평균 평점 계산
        avg_rating = feedbacks.aggregate(
            avg_rating=models.Avg('rating')
        )['avg_rating'] or 0

        return Response({
            'total_conversations': conversations.count(),
            'total_messages': messages.count(),
            'total_feedbacks': feedbacks.count(),
            'average_rating': round(avg_rating, 2),
            'active_conversations_24h': conversations.filter(
                updated_at__gte=timezone.now() - timedelta(hours=24)
            ).count(),
        })


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    메시지 조회 API

    - 메시지 목록 조회
    - 메시지 상세 조회
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """쿼리셋 필터링"""
        conversation_id = self.request.query_params.get('conversation_id')
        if not conversation_id:
            return Message.objects.none()

        # 사용자가 접근 가능한 대화인지 확인
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=self.request.user,
                is_active=True
            )
        except Conversation.DoesNotExist:
            return Message.objects.none()

        return Message.objects.filter(
            conversation=conversation
        ).order_by('created_at')

    def list(self, request):
        """
        메시지 목록 조회

        GET /api/copilot/messages/?conversation_id={id}
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """
        메시지 상세 조회

        GET /api/copilot/messages/{id}/
        """
        # 사용자가 접근 가능한 메시지인지 확인
        try:
            message = Message.objects.get(
                id=pk,
                conversation__user=request.user,
                conversation__is_active=True
            )
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(message)
        return Response(serializer.data)


# 직렬화기 (간단 구현)
from rest_framework import serializers


class ConversationSerializer(serializers.ModelSerializer):
    """대화 세션 직렬화기"""

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'created_at', 'updated_at',
            'is_active', 'metadata'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at'
        ]


class MessageSerializer(serializers.ModelSerializer):
    """메시지 직렬화기"""

    class Meta:
        model = Message
        fields = [
            'id', 'role', 'content', 'created_at',
            'metadata', 'confidence', 'execution_time_ms'
        ]
        read_only_fields = ['id', 'created_at']


# ViewSet에 직렬화기 설정
ConversationViewSet.serializer_class = ConversationSerializer
MessageViewSet.serializer_class = MessageSerializer
