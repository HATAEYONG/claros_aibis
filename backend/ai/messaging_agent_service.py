"""
자율 AI 메시징 에이전트 서비스
Slack, Telegram, Discord 등 메시징 플랫폼과 연동하여
BI 대시보드와 상호작용하는 자율 AI 에이전트 기능 제공
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import aiohttp
import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class MessagingPlatform(Enum):
    """지원하는 메시징 플랫폼"""
    SLACK = "slack"
    TELEGRAM = "telegram"
    DISCORD = "discord"
    WHATSAPP = "whatsapp"


class AgentCapability(Enum):
    """AI 에이전트 기능"""
    QUERY_DATA = "query_data"  # 데이터 조회
    GENERATE_REPORT = "generate_report"  # 리포트 생성
    ANALYZE_TRENDS = "analyze_trends"  # 트렌드 분석
    EXECUTE_ACTION = "execute_action"  # 작업 실행
    SCHEDULE_TASK = "schedule_task"  # 작업 예약
    NOTIFY = "notify"  # 알림 전송


class MessagingAgentConfig:
    """메시징 에이전트 설정"""

    def __init__(self):
        # Slack 설정
        self.slack_bot_token = os.getenv('SLACK_BOT_TOKEN', '')
        self.slack_signing_secret = os.getenv('SLACK_SIGNING_SECRET', '')
        self.slack_app_id = os.getenv('SLACK_APP_ID', '')

        # Telegram 설정
        self.telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
        self.telegram_webhook_url = os.getenv('TELEGRAM_WEBHOOK_URL', '')

        # Discord 설정
        self.discord_bot_token = os.getenv('DISCORD_BOT_TOKEN', '')
        self.discord_client_id = os.getenv('DISCORD_CLIENT_ID', '')
        self.discord_guild_id = os.getenv('DISCORD_GUILD_ID', '')

        # WhatsApp 설정 (Twilio/Meta API)
        self.whatsapp_phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')
        self.whatsapp_access_token = os.getenv('WHATSAPP_ACCESS_TOKEN', '')

        # AI 서비스 설정
        self.ai_service_url = os.getenv('AI_SERVICE_URL', 'http://localhost:8000/api/ai/')
        self.dashboard_url = os.getenv('DASHBOARD_URL', 'http://localhost:3000')

        # 에이전트 설정
        self.agent_name = os.getenv('AGENT_NAME', 'Claros AI Assistant')
        self.auto_respond_enabled = os.getenv('AUTO_RESPOND_ENABLED', 'true').lower() == 'true'
        self.proactive_notifications = os.getenv('PROACTIVE_NOTIFICATIONS', 'true').lower() == 'true'


class MessagingAgentService:
    """메시징 플랫폼 연동 서비스"""

    def __init__(self, config: Optional[MessagingAgentConfig] = None):
        self.config = config or MessagingAgentConfig()
        self.active_sessions: Dict[str, Dict] = {}
        self.message_handlers: Dict[MessagingPlatform, List[Callable]] = {
            platform: [] for platform in MessagingPlatform
        }
        self.capabilities = {
            AgentCapability.QUERY_DATA: self._handle_query_data,
            AgentCapability.GENERATE_REPORT: self._handle_generate_report,
            AgentCapability.ANALYZE_TRENDS: self._handle_analyze_trends,
            AgentCapability.EXECUTE_ACTION: self._handle_execute_action,
            AgentCapability.SCHEDULE_TASK: self._handle_schedule_task,
            AgentCapability.NOTIFY: self._handle_notify,
        }

    async def process_message(
        self,
        platform: MessagingPlatform,
        message: str,
        user_id: str,
        channel_id: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        메시지 처리 및 응답 생성

        Args:
            platform: 메시징 플랫폼
            message: 사용자 메시지
            user_id: 사용자 ID
            channel_id: 채널 ID
            context: 추가 컨텍스트 정보

        Returns:
            응답 딕셔너리
        """
        try:
            # 세션 관리
            session_key = f"{platform.value}_{user_id}_{channel_id}"
            if session_key not in self.active_sessions:
                self.active_sessions[session_key] = {
                    'platform': platform.value,
                    'user_id': user_id,
                    'channel_id': channel_id,
                    'created_at': timezone.now(),
                    'message_count': 0,
                    'context': {}
                }

            session = self.active_sessions[session_key]
            session['message_count'] += 1
            session['last_activity'] = timezone.now()

            if context:
                session['context'].update(context)

            # 의도 파악 및 기능 매핑
            intent = await self._analyze_intent(message, session)

            # 해당 기능 실행
            response = await self._execute_capability(intent, message, session)

            # 응답 전송
            await self._send_response(platform, channel_id, response)

            return {
                'success': True,
                'intent': intent,
                'response': response,
                'session_id': session_key
            }

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': '메시지 처리 중 오류가 발생했습니다.'
            }

    async def _analyze_intent(self, message: str, session: Dict) -> AgentCapability:
        """
        메시지 의도 분석

        Args:
            message: 사용자 메시지
            session: 세션 정보

        Returns:
            에이전트 기능 유형
        """
        message_lower = message.lower()

        # 간단한 키워드 기반 의도 파악
        # 실제 구현에서는 LLM을 사용하여 더 정교한 분석 가능

        query_keywords = ['조회', '보여줘', '어떻게', '현황', '몇개', '얼마', '검색', 'find', 'show', 'what']
        report_keywords = ['리포트', '보고서', 'report', '생성', '만들어', 'export']
        analyze_keywords = ['분석', 'trend', '추세', '비교', 'analyze', '통계']
        action_keywords = ['실행', '작업', 'action', 'execute', '시작', '중지']
        schedule_keywords = ['예약', 'schedule', '알림', 'reminder', '매일', '매주']
        notify_keywords = ['알려줘', 'notify', '알림', '보고']

        for keyword in query_keywords:
            if keyword in message:
                return AgentCapability.QUERY_DATA

        for keyword in report_keywords:
            if keyword in message:
                return AgentCapability.GENERATE_REPORT

        for keyword in analyze_keywords:
            if keyword in message:
                return AgentCapability.ANALYZE_TRENDS

        for keyword in action_keywords:
            if keyword in message:
                return AgentCapability.EXECUTE_ACTION

        for keyword in schedule_keywords:
            if keyword in message:
                return AgentCapability.SCHEDULE_TASK

        for keyword in notify_keywords:
            if keyword in message:
                return AgentCapability.NOTIFY

        # 기본값: 데이터 조회
        return AgentCapability.QUERY_DATA

    async def _execute_capability(
        self,
        capability: AgentCapability,
        message: str,
        session: Dict
    ) -> str:
        """
        기능 실행

        Args:
            capability: 에이전트 기능
            message: 사용자 메시지
            session: 세션 정보

        Returns:
            실행 결과 메시지
        """
        handler = self.capabilities.get(capability)
        if handler:
            return await handler(message, session)
        else:
            return "죄송합니다. 해당 기능은 아직 지원하지 않습니다."

    async def _handle_query_data(self, message: str, session: Dict) -> str:
        """데이터 조회 처리"""
        try:
            # AI 서비스를 통해 데이터 조회
            ai_service_url = f"{self.config.ai_service_url}chat/"

            payload = {
                'message': message,
                'context': session.get('context', {}),
                'source': 'messaging_agent'
            }

            response = requests.post(ai_service_url, json=payload, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                return response_data.get('response', '조회 결과를 찾을 수 없습니다.')
            else:
                return "데이터 조회 중 오류가 발생했습니다."

        except Exception as e:
            logger.error(f"Error in query_data: {str(e)}")
            return f"조회 중 오류가 발생했습니다: {str(e)}"

    async def _handle_generate_report(self, message: str, session: Dict) -> str:
        """리포트 생성 처리"""
        try:
            # 리포트 생성 요청 파싱
            # 예: "월간 생산 리포트 생성" -> {"type": "production", "period": "monthly"}

            report_type = self._extract_report_type(message)
            period = self._extract_period(message)

            # AI 서비스를 통해 리포트 생성
            report_service_url = f"{self.config.ai_service_url}generate_report/"

            payload = {
                'report_type': report_type,
                'period': period,
                'format': 'pdf',
                'context': session.get('context', {})
            }

            response = requests.post(report_service_url, json=payload, timeout=60)
            response_data = response.json()

            if response.status_code == 200:
                report_url = response_data.get('report_url', '')
                return f"리포트가 생성되었습니다.\n다음 링크에서 다운로드하세요: {self.config.dashboard_url}/reports/{response_data.get('report_id', '')}"
            else:
                return "리포트 생성 중 오류가 발생했습니다."

        except Exception as e:
            logger.error(f"Error in generate_report: {str(e)}")
            return f"리포트 생성 중 오류가 발생했습니다: {str(e)}"

    async def _handle_analyze_trends(self, message: str, session: Dict) -> str:
        """트렌드 분석 처리"""
        try:
            # 트렌드 분석 요청
            analyze_url = f"{self.config.ai_service_url}analyze_trends/"

            payload = {
                'query': message,
                'context': session.get('context', {})
            }

            response = requests.post(analyze_url, json=payload, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                return response_data.get('analysis', '분석 결과를 생성할 수 없습니다.')
            else:
                return "트렌드 분석 중 오류가 발생했습니다."

        except Exception as e:
            logger.error(f"Error in analyze_trends: {str(e)}")
            return f"트렌드 분석 중 오류가 발생했습니다: {str(e)}"

    async def _handle_execute_action(self, message: str, session: Dict) -> str:
        """작업 실행 처리"""
        try:
            # 작업 파싱 및 실행
            # 예: "생산 라인 1 시작" -> 실행

            action = self._extract_action(message)

            # 작업 실행 API 호출
            action_url = f"{self.config.ai_service_url}execute_action/"

            payload = {
                'action': action,
                'parameters': self._extract_parameters(message),
                'user_id': session.get('user_id')
            }

            response = requests.post(action_url, json=payload, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                return f"작업이 실행되었습니다: {action}"
            else:
                return f"작업 실행 중 오류가 발생했습니다: {response_data.get('error', '')}"

        except Exception as e:
            logger.error(f"Error in execute_action: {str(e)}")
            return f"작업 실행 중 오류가 발생했습니다: {str(e)}"

    async def _handle_schedule_task(self, message: str, session: Dict) -> str:
        """작업 예약 처리"""
        try:
            # 예약 작업 파싱
            schedule = self._extract_schedule(message)

            # 예약 API 호출
            schedule_url = f"{self.config.ai_service_url}schedule_task/"

            payload = {
                'task': schedule.get('task'),
                'schedule': schedule.get('schedule'),
                'channel_id': session.get('channel_id'),
                'platform': session.get('platform')
            }

            response = requests.post(schedule_url, json=payload, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                return f"작업이 예약되었습니다: {schedule.get('task')}"
            else:
                return "작업 예약 중 오류가 발생했습니다."

        except Exception as e:
            logger.error(f"Error in schedule_task: {str(e)}")
            return f"작업 예약 중 오류가 발생했습니다: {str(e)}"

    async def _handle_notify(self, message: str, session: Dict) -> str:
        """알림 처리"""
        try:
            # 알림 설정
            notification = self._extract_notification(message)

            # 알림 설정 API 호출
            notify_url = f"{self.config.ai_service_url}set_notification/"

            payload = {
                'notification_type': notification.get('type'),
                'conditions': notification.get('conditions'),
                'channel_id': session.get('channel_id'),
                'platform': session.get('platform')
            }

            response = requests.post(notify_url, json=payload, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                return f"알림이 설정되었습니다: {notification.get('type')}"
            else:
                return "알림 설정 중 오류가 발생했습니다."

        except Exception as e:
            logger.error(f"Error in notify: {str(e)}")
            return f"알림 설정 중 오류가 발생했습니다: {str(e)}"

    async def _send_response(self, platform: MessagingPlatform, channel_id: str, response: str):
        """플랫폼별 응답 전송"""
        try:
            if platform == MessagingPlatform.SLACK:
                await self._send_slack_message(channel_id, response)
            elif platform == MessagingPlatform.TELEGRAM:
                await self._send_telegram_message(channel_id, response)
            elif platform == MessagingPlatform.DISCORD:
                await self._send_discord_message(channel_id, response)
            elif platform == MessagingPlatform.WHATSAPP:
                await self._send_whatsapp_message(channel_id, response)
        except Exception as e:
            logger.error(f"Error sending response: {str(e)}")

    async def _send_slack_message(self, channel_id: str, message: str):
        """Slack 메시지 전송"""
        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.config.slack_bot_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel_id,
            "text": message
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                return await response.json()

    async def _send_telegram_message(self, chat_id: str, message: str):
        """Telegram 메시지 전송"""
        url = f"https://api.telegram.org/bot{self.config.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                return await response.json()

    async def _send_discord_message(self, channel_id: str, message: str):
        """Discord 메시지 전송"""
        url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
        headers = {
            "Authorization": f"Bot {self.config.discord_bot_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "content": message
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                return await response.json()

    async def _send_whatsapp_message(self, phone_number: str, message: str):
        """WhatsApp 메시지 전송"""
        url = f"https://graph.facebook.com/v17.0/{self.config.whatsapp_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.config.whatsapp_access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {"body": message}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                return await response.json()

    def _extract_report_type(self, message: str) -> str:
        """메시지에서 리포트 유형 추출"""
        message_lower = message.lower()
        if '생산' in message or 'production' in message:
            return 'production'
        elif '품질' in message or 'quality' in message:
            return 'quality'
        elif '영업' in message or 'sales' in message:
            return 'sales'
        elif '재무' in message or 'financial' in message:
            return 'financial'
        else:
            return 'general'

    def _extract_period(self, message: str) -> str:
        """메시지에서 기간 추출"""
        message_lower = message.lower()
        if '일간' in message or 'daily' in message:
            return 'daily'
        elif '주간' in message or 'weekly' in message:
            return 'weekly'
        elif '월간' in message or 'monthly' in message:
            return 'monthly'
        elif '연간' in message or 'yearly' in message:
            return 'yearly'
        else:
            return 'monthly'

    def _extract_action(self, message: str) -> str:
        """메시지에서 작업 추출"""
        # 간단한 구현 - 실제로는 더 복잡한 NLP 필요
        if '시작' in message or 'start' in message:
            return 'start'
        elif '중지' in message or 'stop' in message:
            return 'stop'
        elif '재시작' in message or 'restart' in message:
            return 'restart'
        else:
            return 'unknown'

    def _extract_parameters(self, message: str) -> Dict:
        """메시지에서 파라미터 추출"""
        # 간단한 구현
        return {'raw_message': message}

    def _extract_schedule(self, message: str) -> Dict:
        """메시지에서 예약 정보 추출"""
        return {
            'task': 'notification',
            'schedule': 'daily',
            'time': '09:00'
        }

    def _extract_notification(self, message: str) -> Dict:
        """메시지에서 알림 정보 추출"""
        return {
            'type': 'kpi_alert',
            'conditions': {'threshold': 90}
        }

    async def send_proactive_notification(
        self,
        platform: MessagingPlatform,
        channel_id: str,
        notification: Dict[str, Any]
    ):
        """
        자율 알림 전송

        Args:
            platform: 메시징 플랫폼
            channel_id: 채널 ID
            notification: 알림 내용
        """
        if not self.config.proactive_notifications:
            return

        try:
            message = self._format_notification(notification)
            await self._send_response(platform, channel_id, message)

            logger.info(f"Proactive notification sent to {platform.value}:{channel_id}")

        except Exception as e:
            logger.error(f"Error sending proactive notification: {str(e)}")

    def _format_notification(self, notification: Dict[str, Any]) -> str:
        """알림 메시지 포맷팅"""
        notification_type = notification.get('type', 'info')

        if notification_type == 'kpi_alert':
            kpi_name = notification.get('kpi_name', '')
            current_value = notification.get('current_value', '')
            threshold = notification.get('threshold', '')
            status = notification.get('status', '')

            return (
                f"🚨 *KPI 알림*\n\n"
                f"*KPI*: {kpi_name}\n"
                f"*현재값*: {current_value}\n"
                f"*임계값*: {threshold}\n"
                f"*상태*: {status}\n\n"
                f"상세 내용은 대시보드에서 확인하세요: {self.config.dashboard_url}"
            )
        elif notification_type == 'anomaly_detected':
            return (
                f"⚠️ *이상 감지 알림*\n\n"
                f"{notification.get('description', '')}\n\n"
                f"상세 내용은 대시보드에서 확인하세요: {self.config.dashboard_url}"
            )
        else:
            return f"📢 {notification.get('message', '새로운 알림이 있습니다.')}"


# Singleton 인스턴스
_messaging_agent_service = None


def get_messaging_agent_service() -> MessagingAgentService:
    """메시징 에이전트 서비스 싱글톤 인스턴스 반환"""
    global _messaging_agent_service
    if _messaging_agent_service is None:
        _messaging_agent_service = MessagingAgentService()
    return _messaging_agent_service
