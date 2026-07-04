# -*- coding: utf-8 -*-
"""
External Integration API Views
외부 연동 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import IntegrationConfig, IntegrationLog, WebhookConfig, WebhookDelivery, DataExchange
from .serializers import (
    IntegrationConfigSerializer, IntegrationLogSerializer,
    WebhookConfigSerializer, WebhookDeliverySerializer,
    DataExchangeSerializer
)
from .services.integration_service import IntegrationService, WebhookService, DataExportService


class IntegrationConfigViewSet(viewsets.ModelViewSet):
    """연동 설정 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = IntegrationConfig.objects.all()

    def get_queryset(self):
        return IntegrationConfig.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return IntegrationConfigSerializer

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """연동 실행"""
        integration = self.get_object()
        data = request.data.get('data', {})

        service = IntegrationService()
        result = service.execute_sync(
            integration_code=integration.code,
            action_type='sync',
            data=data
        )

        return Response(result)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """연동 상태 조회"""
        integration = self.get_object()

        service = IntegrationService()
        status_info = service.get_integration_status(
            integration_code=integration.code
        )

        return Response(status_info)


class IntegrationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """연동 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = IntegrationLog.objects.all()

    def get_queryset(self):
        return IntegrationLog.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return IntegrationLogSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 로그 조회"""
        integration_code = request.query_params.get('integration_code')
        action_type = request.query_params.get('action_type')
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))

        queryset = self.get_queryset()

        if integration_code:
            queryset = queryset.filter(integration__code=integration_code)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        logs = queryset[:limit]
        serializer = self.get_serializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'count': len(logs),
        })


class WebhookConfigViewSet(viewsets.ModelViewSet):
    """웹훅 설정 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = WebhookConfig.objects.all()

    def get_queryset(self):
        return WebhookConfig.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return WebhookConfigSerializer

    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """웹훽 테스트"""
        webhook = self.get_object()
        test_data = request.data.get('test_data', {'test': True})

        service = WebhookService()
        result = service.deliver_webhook(
            webhook_code=webhook.code,
            event_data=test_data,
            event_id='test'
        )

        return Response(result)

    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """전송 기록 조회"""
        webhook = self.get_object()
        limit = int(request.query_params.get('limit', 50))

        service = WebhookService()
        deliveries = service.get_webhook_deliveries(
            webhook_code=webhook.code,
            limit=limit
        )

        return Response({
            'deliveries': deliveries,
            'count': len(deliveries),
        })


class WebhookDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """웹훅 전송 기록 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = WebhookDelivery.objects.all()

    def get_queryset(self):
        return WebhookDelivery.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return WebhookDeliverySerializer


class DataExchangeViewSet(viewsets.ModelViewSet):
    """데이터 교환 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = DataExchange.objects.all()

    def get_queryset(self):
        return DataExchange.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return DataExchangeSerializer

    @action(detail=False, methods=['post'])
    def export(self, request):
        """데이터 내보내기"""
        data_type = request.data.get('data_type')
        file_format = request.data.get('file_format', 'csv')
        filters = request.data.get('filters', {})
        columns = request.data.get('columns', [])
        requested_by = request.data.get('requested_by', request.user.username if request.user.is_authenticated else 'system')

        service = DataExportService()
        result = service.create_export_job(
            data_type=data_type,
            file_format=file_format,
            filters=filters,
            columns=columns,
            requested_by=requested_by
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def import_data(self, request):
        """데이터 가져오기"""
        # Import 기능 구현
        return Response({
            'message': 'Import functionality not yet implemented'
        })

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """교환 작업 처리"""
        exchange = self.get_object()

        if exchange.exchange_type == 'export':
            service = DataExportService()
            result = service.process_export_job(str(exchange.id))
        else:
            result = {
                'success': False,
                'error': 'Import processing not yet implemented'
            }

        return Response(result)


class IntegrationViewSet(viewsets.ViewSet):
    """연동 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_integration(self, request):
        """연동 생성"""
        name = request.data.get('name')
        code = request.data.get('code')
        integration_type = request.data.get('integration_type', 'api')
        endpoint_url = request.data.get('endpoint_url', '')
        auth_type = request.data.get('auth_type', 'none')
        auth_config = request.data.get('auth_config', {})
        headers = request.data.get('headers', {})
        parameters = request.data.get('parameters', {})
        sync_interval = request.data.get('sync_interval', 60)
        description = request.data.get('description', '')

        try:
            integration = IntegrationConfig.objects.create(
                name=name,
                code=code,
                integration_type=integration_type,
                endpoint_url=endpoint_url,
                auth_type=auth_type,
                auth_config=auth_config,
                headers=headers,
                parameters=parameters,
                sync_interval=sync_interval,
                description=description
            )

            serializer = IntegrationConfigSerializer(integration)

            return Response({
                'success': True,
                'integration': serializer.data
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def execute_sync(self, request):
        """연동 실행"""
        integration_code = request.data.get('integration_code')
        action_type = request.data.get('action_type', 'sync')
        data = request.data.get('data', {})

        service = IntegrationService()
        result = service.execute_sync(
            integration_code=integration_code,
            action_type=action_type,
            data=data
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def status(self, request):
        """연동 상태 조회"""
        integration_code = request.query_params.get('integration_code')

        if not integration_code:
            return Response({
                'error': 'integration_code is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        service = IntegrationService()
        status_info = service.get_integration_status(integration_code)

        return Response(status_info)

    @action(detail=False, methods=['post'])
    def create_webhook(self, request):
        """웹훅 생성"""
        name = request.data.get('name')
        code = request.data.get('code')
        event_type = request.data.get('event_type')
        target_url = request.data.get('target_url')
        http_method = request.data.get('http_method', 'POST')
        headers = request.data.get('headers', {})
        payload_template = request.data.get('payload_template', {})
        description = request.data.get('description', '')

        service = WebhookService()
        result = service.create_webhook(
            name=name,
            code=code,
            event_type=event_type,
            target_url=target_url,
            http_method=http_method,
            headers=headers,
            payload_template=payload_template,
            description=description
        )

        status_code = status.HTTP_201_CREATED if result.get('success') else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)

    @action(detail=False, methods=['post'])
    def deliver_webhook(self, request):
        """웹훅 전송"""
        webhook_code = request.data.get('webhook_code')
        event_data = request.data.get('event_data', {})
        event_id = request.data.get('event_id', '')

        service = WebhookService()
        result = service.deliver_webhook(
            webhook_code=webhook_code,
            event_data=event_data,
            event_id=event_id
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def logs(self, request):
        """연동 로그 조회"""
        integration_code = request.query_params.get('integration_code')
        action_type = request.query_params.get('action_type')
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))

        queryset = IntegrationLog.objects.all().order_by('-created_at')

        if integration_code:
            queryset = queryset.filter(integration__code=integration_code)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        logs = queryset[:limit]
        serializer = IntegrationLogSerializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'count': len(logs),
        })
