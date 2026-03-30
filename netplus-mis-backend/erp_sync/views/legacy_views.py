"""
기존 ERP 동기화 관련 ViewSets
"""

import importlib.util
import os
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

# models.py에서 기존 모델들을 직접 import
_current_dir = os.path.dirname(os.path.abspath(__file__))
_models_py_path = os.path.join(_current_dir, '..', 'models.py')

spec = importlib.util.spec_from_file_location("erp_sync.models_legacy", _models_py_path)
legacy_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy_models)

ERPSyncConfig = legacy_models.ERPSyncConfig
ERPSyncLog = legacy_models.ERPSyncLog
ERPSyncServiceConfig = legacy_models.ERPSyncServiceConfig

# Service Manager도 가져오기
ERPSyncServiceManager = legacy_models.ERPSyncServiceManager


class ERPSyncConfigViewSet(viewsets.ModelViewSet):
    """ERP 동기화 설정 관리 ViewSet"""
    queryset = ERPSyncConfig.objects.all()
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        return ERPSyncConfig.objects.all()

    def get_serializer(self, *args, **kwargs):
        """동적 Serializer 생성 (모델 기반)"""
        from rest_framework.serializers import ModelSerializer

        class ERPSyncConfigSerializer(ModelSerializer):
            class Meta:
                model = ERPSyncConfig
                fields = '__all__'

        return ERPSyncConfigSerializer(*args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """활성화 토글"""
        config = self.get_object()
        config.is_active = not config.is_active
        config.save()
        return Response({
            'status': 'success',
            'is_active': config.is_active
        })


class ERPSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ERP 동기화 로그 조회 ViewSet"""
    queryset = ERPSyncLog.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'sync_type', 'target_table']

    def get_queryset(self):
        return ERPSyncLog.objects.select_related().all()

    def get_serializer(self, *args, **kwargs):
        """동적 Serializer 생성 (모델 기반)"""
        from rest_framework.serializers import ModelSerializer

        class ERPSyncLogSerializer(ModelSerializer):
            class Meta:
                model = ERPSyncLog
                fields = '__all__'

        return ERPSyncLogSerializer(*args, **kwargs)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """동기화 통계"""
        total_count = ERPSyncLog.objects.count()
        success_count = ERPSyncLog.objects.filter(status='success').count()
        failed_count = ERPSyncLog.objects.filter(status='failed').count()
        running_count = ERPSyncLog.objects.filter(status='running').count()

        return Response({
            'total': total_count,
            'success': success_count,
            'failed': failed_count,
            'running': running_count,
            'success_rate': f'{(success_count / total_count * 100):.1f}%' if total_count > 0 else '0%'
        })


class ERPSyncServiceConfigViewSet(viewsets.ModelViewSet):
    """ERP 동기화 서비스 설정 관리 ViewSet"""
    queryset = ERPSyncServiceConfig.objects.all()

    def get_serializer(self, *args, **kwargs):
        """동적 Serializer 생성 (모델 기반)"""
        from rest_framework.serializers import ModelSerializer

        class ERPSyncServiceConfigSerializer(ModelSerializer):
            service_type_display = serializers.SerializerMethodField()
            sync_status_display = serializers.SerializerMethodField()
            success_rate = serializers.SerializerMethodField()

            class Meta:
                model = ERPSyncServiceConfig
                fields = '__all__'

            def get_service_type_display(self, obj):
                return obj.get_service_type_display()

            def get_sync_status_display(self, obj):
                return obj.get_sync_status_display()

            def get_success_rate(self, obj):
                if obj.total_sync_count > 0:
                    return round(obj.success_sync_count / obj.total_sync_count * 100, 2)
                return 0

        return ERPSyncServiceConfigSerializer(*args, **kwargs)

    @action(detail=False, methods=['get'])
    def all_services(self, request):
        """모든 서비스 설정 조회"""
        services = ERPSyncServiceManager.get_all_services()

        result = []
        for service_type, config in services.items():
            serializer = self.get_serializer(config)
            result.append(serializer.data)

        return Response({
            'services': result,
            'summary': {
                'total_services': len(result),
                'enabled_count': sum(1 for s in result if s['is_enabled']),
                'disabled_count': sum(1 for s in result if not s['is_enabled'])
            }
        })

    @action(detail=False, methods=['post'], url_path='toggle/(?P<service_type>[^/]+)')
    def toggle_service(self, request, service_type=None):
        """서비스 활성화/비활성화 토글"""
        if service_type not in ['emax', 'fom']:
            return Response(
                {'error': f'Invalid service type: {service_type}. Must be emax or fom.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ERPSyncServiceManager.toggle_service(service_type)
        serializer = self.get_serializer(config)

        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) {'활성화' if config.is_enabled else '비활성화'}되었습니다."
        })

    @action(detail=False, methods=['post'])
    def enable_service(self, request):
        """서비스 활성화"""
        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['emax', 'fom']:
            return Response(
                {'error': 'service_type is required and must be emax or fom'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ERPSyncServiceManager.get_service_config(service_type)
        if not config.is_enabled:
            config.is_enabled = True
            config.sync_status = 'idle'
            config.save()

        serializer = self.get_serializer(config)
        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) 활성화되었습니다."
        })

    @action(detail=False, methods=['post'])
    def disable_service(self, request):
        """서비스 비활성화"""
        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['emax', 'fom']:
            return Response(
                {'error': 'service_type is required and must be emax or fom'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ERPSyncServiceManager.get_service_config(service_type)
        if config.is_enabled:
            config.is_enabled = False
            config.sync_status = 'disabled'
            config.save()

        serializer = self.get_serializer(config)
        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) 비활성화되었습니다."
        })

        result = []
        for service_type, config in services.items():
            serializer = self.get_serializer(config)
            result.append(serializer.data)

        return Response({
            'services': result,
            'summary': {
                'total_services': len(result),
                'enabled_count': sum(1 for s in result if s['is_enabled']),
                'disabled_count': sum(1 for s in result if not s['is_enabled'])
            }
        })


class ERPMappingViewSet(viewsets.ViewSet):
    """기존 ERP 매핑 관리 ViewSet (하위 호환용)"""

    def list(self, request):
        """매핑 목록 조회"""
        return Response({
            'message': '이 API는 신규 매핑 관리 시스템으로 마이그레이션되었습니다.',
            'new_endpoints': {
                'table_mappings': '/api/erp-sync/table-mappings/',
                'field_mappings': '/api/erp-sync/field-mappings/',
            }
        })

    def retrieve(self, request, pk=None):
        """매핑 상세 조회"""
        return Response({
            'message': '이 API는 신규 매핑 관리 시스템으로 마이그레이션되었습니다.',
            'new_endpoints': {
                'table_mappings': '/api/erp-sync/table-mappings/',
                'field_mappings': '/api/erp-sync/field-mappings/',
            }
        })
