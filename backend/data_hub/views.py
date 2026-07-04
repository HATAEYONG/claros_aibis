# -*- coding: utf-8 -*-
"""
Data Hub API 뷰
데이터 통합 계층 API 엔드포인트 제공
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from data_hub.models import DataSource, DataSyncLog, DataMart
from data_hub.services.ingestion_service import IngestionService
from data_hub.serializers import (
    DataSourceSerializer, DataSyncLogSerializer, DataMartSerializer
)


class DataSourceViewSet(viewsets.ModelViewSet):
    """데이터 소스 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = DataSource.objects.all()

    def get_queryset(self):
        return DataSource.objects.all().order_by('name')

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """데이터 소스 동기화"""
        source = self.get_object()
        service = IngestionService()

        sync_log = service.sync_data_source(str(source.id))

        return Response({
            'sync_log_id': str(sync_log.id),
            'status': sync_log.status,
            'records_processed': sync_log.records_processed,
            'records_succeeded': sync_log.records_succeeded,
            'records_failed': sync_log.records_failed,
        })

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """데이터 소스 상태 조회"""
        source = self.get_object()
        service = IngestionService()

        status_info = service.get_sync_status(str(source.id))

        return Response(status_info)

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """연결 테스트"""
        source = self.get_object()

        from data_hub.connectors.mssql_connector import MSSQLConnector
        from data_hub.connectors.postgresql_connector import PostgreSQLConnector

        connector_map = {
            'mssql': MSSQLConnector,
            'postgresql': PostgreSQLConnector,
        }

        connector_class = connector_map.get(source.source_type)
        if not connector_class:
            return Response({
                'error': f'Unsupported source type: {source.source_type}'
            }, status=status.HTTP_400_BAD_REQUEST)

        connector = connector_class(source.connection_params)
        success = connector.test_connection()

        return Response({
            'success': success,
            'message': 'Connection successful' if success else 'Connection failed'
        })


# ViewSet에 직렬화기 설정
DataSourceViewSet.serializer_class = DataSourceSerializer


class DataSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    """데이터 동기화 로그 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = DataSyncLog.objects.all()

    def get_queryset(self):
        return DataSyncLog.objects.all().order_by('-started_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 동기화 로그 조회"""
        limit = int(request.query_params.get('limit', 20))
        logs = DataSyncLog.objects.all().order_by('-started_at')[:limit]

        return Response({
            'logs': [
                {
                    'id': str(log.id),
                    'data_source': log.data_source.name,
                    'status': log.status,
                    'started_at': log.started_at.isoformat(),
                    'completed_at': log.completed_at.isoformat() if log.completed_at else None,
                    'duration_seconds': log.duration_seconds,
                    'records_processed': log.records_processed,
                    'records_succeeded': log.records_succeeded,
                    'records_failed': log.records_failed,
                }
                for log in logs
            ]
        })


# ViewSet에 직렬화기 설정
DataSyncLogViewSet.serializer_class = DataSyncLogSerializer


class DataMartViewSet(viewsets.ModelViewSet):
    """데이터 마트 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = DataMart.objects.all()

    def get_queryset(self):
        return DataMart.objects.all().order_by('name')

    @action(detail=True, methods=['post'])
    def build(self, request, pk=None):
        """데이터 마트 빌드"""
        mart = self.get_object()

        from data_hub.services.ingestion_service import MartService
        service = MartService()

        success = service.build_mart(str(mart.id))

        return Response({
            'success': success,
            'message': 'Mart build completed' if success else 'Mart build failed'
        })

    @action(detail=True, methods=['get'])
    def refresh(self, request, pk=None):
        """데이터 마트 갱신"""
        return self.build(request, pk)

    @action(detail=False, methods=['post'])
    def refresh_all(self, request):
        """모든 마트 갱신"""
        schedule = request.data.get('schedule')

        from data_hub.services.ingestion_service import MartService
        service = MartService()

        results = service.refresh_all_marts(schedule)

        return Response(results)


# ViewSet에 직렬화기 설정
DataMartViewSet.serializer_class = DataMartSerializer
