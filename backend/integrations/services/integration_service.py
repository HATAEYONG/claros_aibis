# -*- coding: utf-8 -*-
"""
External Integration Service
외부 연동 서비스
"""
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.conf import settings

from ..models import IntegrationConfig, IntegrationLog, WebhookConfig, WebhookDelivery, DataExchange

logger = logging.getLogger(__name__)


class IntegrationService:
    """연동 서비스"""

    def __init__(self):
        self.session = requests.Session()
        self.timeout = 30

    def execute_sync(self, integration_code: str, action_type: str = 'sync',
                    data: Optional[Dict] = None) -> Dict[str, Any]:
        """연동 실행"""
        try:
            integration = IntegrationConfig.objects.get(code=integration_code, is_active=True)
        except IntegrationConfig.DoesNotExist:
            return {
                'success': False,
                'error': f'Integration {integration_code} not found or inactive'
            }

        # 로그 생성
        log = IntegrationLog.objects.create(
            integration=integration,
            action_type=action_type,
            status='running',
            request_data=data or {},
            started_at=timezone.now()
        )

        try:
            result = self._execute_integration(integration, data)

            log.status = 'success' if result.get('success') else 'failed'
            log.response_data = result
            log.records_processed = result.get('records_processed', 0)
            log.records_succeeded = result.get('records_succeeded', 0)
            log.records_failed = result.get('records_failed', 0)
            log.completed_at = timezone.now()
            log.duration_seconds = (log.completed_at - log.started_at).total_seconds()
            log.save()

            # 마지막 동기화 시간 업데이트
            if action_type == 'sync' and result.get('success'):
                integration.last_sync_at = timezone.now()
                integration.save()

            return result

        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
            log.completed_at = timezone.now()
            log.duration_seconds = (log.completed_at - log.started_at).total_seconds()
            log.save()

            logger.error(f"Integration error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'log_id': str(log.id)
            }

    def _execute_integration(self, integration: IntegrationConfig,
                           data: Optional[Dict] = None) -> Dict[str, Any]:
        """연동 실행 (내부)"""
        if integration.integration_type == 'api':
            return self._call_api(integration, data)
        elif integration.integration_type == 'erp':
            return self._sync_erp(integration, data)
        elif integration.integration_type == 'webhook':
            return self._trigger_webhook(integration, data)
        else:
            return {
                'success': False,
                'error': f'Unsupported integration type: {integration.integration_type}'
            }

    def _call_api(self, integration: IntegrationConfig,
                 data: Optional[Dict] = None) -> Dict[str, Any]:
        """API 호출"""
        try:
            headers = self._build_headers(integration)
            params = data or integration.parameters

            response = self.session.request(
                method='GET',
                url=integration.endpoint_url,
                headers=headers,
                params=params,
                timeout=self.timeout
            )

            result = {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'data': response.json() if response.content else {},
                'records_processed': 1,
                'records_succeeded': 1 if response.status_code == 200 else 0,
                'records_failed': 0 if response.status_code == 200 else 1,
            }

            if response.status_code != 200:
                result['error'] = f'API returned status {response.status_code}'

            return result

        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'API call failed: {str(e)}',
                'records_processed': 0,
                'records_succeeded': 0,
                'records_failed': 1,
            }

    def _sync_erp(self, integration: IntegrationConfig,
                  data: Optional[Dict] = None) -> Dict[str, Any]:
        """ERP 동기화"""
        # ERP 연동은 실제 ERP 시스템과의 연동이 필요
        # 여기서는 시뮬레이션만 수행
        return {
            'success': True,
            'message': 'ERP sync completed (simulated)',
            'records_processed': 100,
            'records_succeeded': 98,
            'records_failed': 2,
            'sync_details': {
                'synced_at': timezone.now().isoformat(),
                'entities': ['sales', 'production', 'quality', 'inventory']
            }
        }

    def _trigger_webhook(self, integration: IntegrationConfig,
                        data: Optional[Dict] = None) -> Dict[str, Any]:
        """웹훅 트리거"""
        try:
            payload = {
                'event': data.get('event', 'integration.trigger'),
                'data': data,
                'timestamp': timezone.now().isoformat()
            }

            response = requests.post(
                integration.endpoint_url,
                json=payload,
                headers=integration.headers,
                timeout=self.timeout
            )

            return {
                'success': response.status_code in [200, 201, 202, 204],
                'status_code': response.status_code,
                'records_processed': 1,
                'records_succeeded': 1 if response.status_code in [200, 201, 202, 204] else 0,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'records_processed': 0,
            }

    def _build_headers(self, integration: IntegrationConfig) -> Dict[str, str]:
        """헤더 빌드"""
        headers = integration.headers.copy()

        if integration.auth_type == 'bearer':
            token = integration.auth_config.get('token')
            if token:
                headers['Authorization'] = f'Bearer {token}'
        elif integration.auth_type == 'api_key':
            key = integration.auth_config.get('api_key')
            key_header = integration.auth_config.get('key_header', 'X-API-Key')
            if key:
                headers[key_header] = key

        return headers

    def get_integration_status(self, integration_code: str) -> Dict[str, Any]:
        """연동 상태 조회"""
        try:
            integration = IntegrationConfig.objects.get(code=integration_code)
        except IntegrationConfig.DoesNotExist:
            return {'error': 'Integration not found'}

        recent_logs = IntegrationLog.objects.filter(
            integration=integration
        ).order_by('-created_at')[:10]

        return {
            'integration': {
                'code': integration.code,
                'name': integration.name,
                'type': integration.integration_type,
                'is_active': integration.is_active,
                'last_sync_at': integration.last_sync_at,
            },
            'recent_logs': [
                {
                    'action_type': log.action_type,
                    'status': log.status,
                    'created_at': log.created_at.isoformat(),
                    'duration_seconds': log.duration_seconds,
                }
                for log in recent_logs
            ],
            'stats': {
                'total_syncs': recent_logs.filter(action_type='sync').count(),
                'success_rate': self._calculate_success_rate(recent_logs),
            }
        }

    def _calculate_success_rate(self, logs) -> float:
        """성공률 계산"""
        if not logs:
            return 0.0
        success_count = logs.filter(status='success').count()
        return round(success_count / logs.count() * 100, 2)


class WebhookService:
    """웹훅 서비스"""

    def __init__(self):
        self.session = requests.Session()
        self.timeout = 10

    def create_webhook(self, name: str, code: str, event_type: str,
                      target_url: str, http_method: str = 'POST',
                      headers: Optional[Dict] = None,
                      payload_template: Optional[Dict] = None,
                      description: str = '') -> Dict[str, Any]:
        """웹훅 생성"""
        try:
            webhook = WebhookConfig.objects.create(
                name=name,
                code=code,
                event_type=event_type,
                target_url=target_url,
                http_method=http_method,
                headers=headers or {},
                payload_template=payload_template or {},
                description=description
            )

            return {
                'success': True,
                'webhook_id': str(webhook.id),
                'code': webhook.code,
                'message': 'Webhook created successfully'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def deliver_webhook(self, webhook_code: str, event_data: Dict[str, Any],
                       event_id: Optional[str] = None) -> Dict[str, Any]:
        """웹훅 전송"""
        try:
            webhook = WebhookConfig.objects.get(code=webhook_code, is_active=True)
        except WebhookConfig.DoesNotExist:
            return {
                'success': False,
                'error': f'Webhook {webhook_code} not found or inactive'
            }

        # 전송 기록 생성
        delivery = WebhookDelivery.objects.create(
            webhook=webhook,
            event_id=event_id or '',
            payload=event_data,
            status='pending'
        )

        try:
            payload = self._build_payload(webhook, event_data)

            response = self.session.request(
                method=webhook.http_method,
                url=webhook.target_url,
                json=payload,
                headers=webhook.headers,
                timeout=self.timeout
            )

            delivery.response_status = response.status_code
            delivery.response_body = response.text[:1000]  # Limit response size
            delivery.status = 'delivered' if response.status_code in [200, 201, 202, 204] else 'failed'
            delivery.delivered_at = timezone.now()
            delivery.save()

            return {
                'success': delivery.status == 'delivered',
                'delivery_id': str(delivery.id),
                'status_code': response.status_code,
                'status': delivery.status
            }

        except Exception as e:
            delivery.status = 'failed'
            delivery.error_message = str(e)
            delivery.attempt_count += 1
            delivery.save()

            return {
                'success': False,
                'error': str(e),
                'delivery_id': str(delivery.id)
            }

    def _build_payload(self, webhook: WebhookConfig,
                      event_data: Dict[str, Any]) -> Dict[str, Any]:
        """페이로드 빌드"""
        payload = webhook.payload_template.copy()
        payload.update({
            'event': webhook.event_type,
            'data': event_data,
            'timestamp': timezone.now().isoformat()
        })
        return payload

    def get_webhook_deliveries(self, webhook_code: str,
                              limit: int = 50) -> List[Dict[str, Any]]:
        """웹훅 전송 기록 조회"""
        try:
            webhook = WebhookConfig.objects.get(code=webhook_code)
        except WebhookConfig.DoesNotExist:
            return []

        deliveries = WebhookDelivery.objects.filter(
            webhook=webhook
        ).order_by('-created_at')[:limit]

        return [
            {
                'delivery_id': str(d.id),
                'event_id': d.event_id,
                'status': d.status,
                'response_status': d.response_status,
                'attempt_count': d.attempt_count,
                'delivered_at': d.delivered_at.isoformat() if d.delivered_at else None,
                'created_at': d.created_at.isoformat(),
            }
            for d in deliveries
        ]


class DataExportService:
    """데이터 내보내기 서비스"""

    def create_export_job(self, data_type: str, file_format: str,
                         filters: Optional[Dict] = None,
                         columns: Optional[List[str]] = None,
                         requested_by: str = 'system') -> Dict[str, Any]:
        """내보내기 작업 생성"""
        try:
            exchange = DataExchange.objects.create(
                exchange_type='export',
                data_type=data_type,
                file_format=file_format,
                filters=filters or {},
                columns=columns or [],
                status='pending',
                requested_by=requested_by
            )

            return {
                'success': True,
                'exchange_id': str(exchange.id),
                'message': 'Export job created'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def process_export_job(self, exchange_id: str) -> Dict[str, Any]:
        """내보내기 작업 처리"""
        try:
            exchange = DataExchange.objects.get(id=exchange_id, exchange_type='export')
        except DataExchange.DoesNotExist:
            return {
                'success': False,
                'error': 'Export job not found'
            }

        exchange.status = 'processing'
        exchange.started_at = timezone.now()
        exchange.save()

        try:
            # 데이터 추출 (시뮬레이션)
            data = self._extract_data(exchange.data_type, exchange.filters)

            # 파일 생성 (시뮬레이션)
            file_path = self._generate_file(exchange, data)

            exchange.status = 'completed'
            exchange.file_path = file_path
            exchange.record_count = len(data)
            exchange.completed_at = timezone.now()
            exchange.save()

            return {
                'success': True,
                'file_path': file_path,
                'record_count': len(data)
            }

        except Exception as e:
            exchange.status = 'failed'
            exchange.error_message = str(e)
            exchange.completed_at = timezone.now()
            exchange.save()

            return {
                'success': False,
                'error': str(e)
            }

    def _extract_data(self, data_type: str, filters: Dict) -> List[Dict]:
        """데이터 추출 (시뮬레이션)"""
        # 실제 구현에서는 DB에서 데이터 조회
        return [
            {'id': 1, 'name': 'Sample 1', 'value': 100},
            {'id': 2, 'name': 'Sample 2', 'value': 200},
        ]

    def _generate_file(self, exchange: DataExchange,
                      data: List[Dict]) -> str:
        """파일 생성 (시뮬레이션)"""
        # 실제 구현에서는 pandas 등을 사용하여 파일 생성
        return f"/exports/{exchange.data_type}_{exchange.id}.{exchange.file_format}"
