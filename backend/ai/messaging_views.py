"""
메시징 플랫폼 웹훅 및 API 뷰
Slack, Telegram, Discord 등 메시징 플랫폼과의 연동을 위한 API 엔드포인트
"""

import json
import logging
import hashlib
import hmac
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .messaging_agent_service import (
    get_messaging_agent_service,
    MessagingPlatform,
    MessagingAgentConfig
)

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class SlackWebhookView(View):
    """Slack 웹훅 뷰"""

    def post(self, request, *args, **kwargs):
        """Slack 이벤트 수신"""
        try:
            data = json.loads(request.body)

            # URL 검증 (Slack 요구사항)
            if 'type' in data and data['type'] == 'url_verification':
                return JsonResponse({'challenge': data['challenge']})

            # 이벤트 처리
            if 'event' in data:
                event = data['event']

                # 메시지 이벤트 처리
                if event.get('type') == 'message':
                    # 봇 메시지 무시
                    if event.get('subtype') == 'bot_message':
                        return HttpResponse(status=200)

                    # 사용자 메시지 처리
                    user_id = event.get('user')
                    channel_id = event.get('channel')
                    message = event.get('text', '')

                    if message and user_id:
                        service = get_messaging_agent_service()
                        import asyncio
                        result = asyncio.run(service.process_message(
                            MessagingPlatform.SLACK,
                            message,
                            user_id,
                            channel_id
                        ))

                        return JsonResponse(result)

            return HttpResponse(status=200)

        except Exception as e:
            logger.error(f"Error in Slack webhook: {str(e)}")
            return HttpResponse(status=500)

    def get(self, request, *args, **kwargs):
        """Slack 웹훅 설정 확인"""
        return JsonResponse({'status': 'Slack webhook is active'})


@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(View):
    """Telegram 웹훅 뷰"""

    def post(self, request, *args, **kwargs):
        """Telegram 업데이트 수신"""
        try:
            data = json.loads(request.body)

            if 'message' in data:
                message = data['message']
                chat_id = str(message['chat']['id'])
                user_id = str(message['from']['id'])
                text = message.get('text', '')

                if text:
                    service = get_messaging_agent_service()
                    import asyncio
                    result = asyncio.run(service.process_message(
                        MessagingPlatform.TELEGRAM,
                        text,
                        user_id,
                        chat_id
                    ))

                    return JsonResponse(result)

            return HttpResponse(status=200)

        except Exception as e:
            logger.error(f"Error in Telegram webhook: {str(e)}")
            return HttpResponse(status=500)

    def get(self, request, *args, **kwargs):
        """Telegram 웹훅 설정 확인"""
        return JsonResponse({'status': 'Telegram webhook is active'})


@method_decorator(csrf_exempt, name='dispatch')
class DiscordWebhookView(View):
    """Discord 웹훅 뷰"""

    def post(self, request, *args, **kwargs):
        """Discord 인터랙션 수신"""
        try:
            data = json.loads(request.body)

            # PING/PONG 핸들shake
            if data.get('type') == 1:
                return JsonResponse({'type': 1})

            # 슬래시 커맨드 또는 메시지 처리
            if data.get('type') == 2:  # Application Command
                # 슬래시 커맨드 처리
                command_name = data.get('data', {}).get('name')
                user_id = data.get('member', {}).get('user', {}).get('id')
                channel_id = data.get('channel_id')

                service = get_messaging_agent_service()
                import asyncio
                result = asyncio.run(service.process_message(
                    MessagingPlatform.DISCORD,
                    f"/{command_name}",
                    user_id,
                    channel_id
                ))

                return JsonResponse({
                    'type': 4,  # ChannelMessageWithSource
                    'data': {'content': result.get('response', '처리되었습니다.')}
                })

            elif data.get('type') == 3:  # MessageComponent
                # 컴포넌트 상호작용 처리
                pass

            return HttpResponse(status=200)

        except Exception as e:
            logger.error(f"Error in Discord webhook: {str(e)}")
            return HttpResponse(status=500)

    def get(self, request, *args, **kwargs):
        """Discord 웹훅 설정 확인"""
        return JsonResponse({'status': 'Discord webhook is active'})


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def messaging_agent_config(request):
    """메시징 에이전트 설정 조회/업데이트"""

    if request.method == 'GET':
        config = MessagingAgentConfig()
        config_data = {
            'agent_name': config.agent_name,
            'auto_respond_enabled': config.auto_respond_enabled,
            'proactive_notifications': config.proactive_notifications,
            'supported_platforms': [p.value for p in MessagingPlatform],
            'capabilities': [
                'query_data',
                'generate_report',
                'analyze_trends',
                'execute_action',
                'schedule_task',
                'notify'
            ]
        }
        return Response(config_data)

    elif request.method == 'POST':
        # 설정 업데이트 (환경 변수 또는 DB 저장)
        data = request.data

        # 설정 업데이트 로직
        # 실제 구현에서는 DB에 저장하거나 환경 변수 파일 업데이트

        return Response({
            'message': '설정이 업데이트되었습니다.',
            'config': data
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def send_test_message(request):
    """테스트 메시지 전송"""

    try:
        platform = request.data.get('platform')
        channel_id = request.data.get('channel_id')
        message = request.data.get('message', '테스트 메시지입니다.')

        if not platform or not channel_id:
            return Response(
                {'error': 'platform과 channel_id는 필수입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            platform_enum = MessagingPlatform(platform)
        except ValueError:
            return Response(
                {'error': f'지원하지 않는 플랫폼입니다: {platform}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = get_messaging_agent_service()
        # 비동기로 메시지 전송
        import asyncio
        asyncio.create_task(service._send_response(platform_enum, channel_id, message))

        return Response({
            'message': '테스트 메시지가 전송되었습니다.',
            'platform': platform,
            'channel_id': channel_id
        })

    except Exception as e:
        logger.error(f"Error sending test message: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def agent_sessions(request):
    """활성 세션 조회"""

    service = get_messaging_agent_service()
    sessions = []

    for session_key, session_data in service.active_sessions.items():
        sessions.append({
            'session_id': session_key,
            'platform': session_data.get('platform'),
            'user_id': session_data.get('user_id'),
            'channel_id': session_data.get('channel_id'),
            'message_count': session_data.get('message_count'),
            'created_at': session_data.get('created_at'),
            'last_activity': session_data.get('last_activity')
        })

    return Response({
        'total_sessions': len(sessions),
        'sessions': sessions
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def proactive_notification(request):
    """자율 알림 전송"""

    try:
        platform = request.data.get('platform')
        channel_id = request.data.get('channel_id')
        notification = request.data.get('notification', {})

        if not platform or not channel_id:
            return Response(
                {'error': 'platform과 channel_id는 필수입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            platform_enum = MessagingPlatform(platform)
        except ValueError:
            return Response(
                {'error': f'지원하지 않는 플랫폼입니다: {platform}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = get_messaging_agent_service()

        # 비동기로 알림 전송
        import asyncio
        asyncio.create_task(
            service.send_proactive_notification(platform_enum, channel_id, notification)
        )

        return Response({
            'message': '알림이 전송되었습니다.',
            'platform': platform,
            'channel_id': channel_id
        })

    except Exception as e:
        logger.error(f"Error sending proactive notification: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def process_agent_message(request):
    """메시징 에이전트 메시지 처리 (테스트용)"""

    try:
        platform = request.data.get('platform')
        message = request.data.get('message')
        user_id = request.data.get('user_id', 'test_user')
        channel_id = request.data.get('channel_id', 'test_channel')
        context = request.data.get('context', {})

        if not platform or not message:
            return Response(
                {'error': 'platform과 message는 필수입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            platform_enum = MessagingPlatform(platform)
        except ValueError:
            return Response(
                {'error': f'지원하지 않는 플랫폼입니다: {platform}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = get_messaging_agent_service()

        # 비동기로 메시지 처리
        import asyncio
        result = asyncio.run(service.process_message(
            platform_enum,
            message,
            user_id,
            channel_id,
            context
        ))

        return Response(result)

    except Exception as e:
        logger.error(f"Error processing agent message: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
