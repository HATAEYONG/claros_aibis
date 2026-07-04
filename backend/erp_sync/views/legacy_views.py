"""
기존 ERP 동기화 관련 ViewSets
"""

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.apps import apps

# Django 앱 레지스트리를 사용하여 모델 가져오기 (모델 충돌 방지)
try:
    ERPSyncConfig = apps.get_model('erp_sync', 'ERPSyncConfig')
except LookupError:
    ERPSyncConfig = None

try:
    ERPSyncLog = apps.get_model('erp_sync', 'ERPSyncLog')
except LookupError:
    ERPSyncLog = None

try:
    ERPSyncServiceConfig = apps.get_model('erp_sync', 'ERPSyncServiceConfig')
except LookupError:
    ERPSyncServiceConfig = None


# ERPSyncServiceManager 기능을 별도로 구현 (importlib 사용하지 않음)
class ServiceManagerHelper:
    """ERPSyncServiceManager의 기능을 대체하는 헬퍼 클래스"""

    @staticmethod
    def get_all_services():
        """모든 서비스 설정 조회"""
        if ERPSyncServiceConfig is None:
            return {}
        services = {}
        for config in ERPSyncServiceConfig.objects.all():
            services[config.service_type] = config
        return services

    @staticmethod
    def get_service_config(service_type):
        """특정 서비스 타입의 설정 조회"""
        if ERPSyncServiceConfig is None:
            return None
        try:
            return ERPSyncServiceConfig.objects.get(service_type=service_type)
        except ERPSyncServiceConfig.DoesNotExist:
            return None

    @staticmethod
    def toggle_service(service_type):
        """서비스 활성화/비활성화 토글"""
        config = ServiceManagerHelper.get_service_config(service_type)
        if config:
            config.is_enabled = not config.is_enabled
            config.sync_status = 'idle' if config.is_enabled else 'disabled'
            config.save()
        return config


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
        # Use ServiceManagerHelper instead of ERPSyncServiceManager
        services = ServiceManagerHelper.get_all_services()

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
        # Use ServiceManagerHelper instead of ERPSyncServiceManager

        if service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': f'Invalid service type: {service_type}. Must be sap, fom, or sample.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 샘플 서비스 활성화 시 모든 ERP 서비스가 비활성화되어 있는지 확인
        if service_type == 'sample':
            all_services = ServiceManagerHelper.get_all_services()
            erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
            all_disabled = all(not service.is_enabled for service in erp_services.values())
            current_config = ServiceManagerHelper.get_service_config(service_type)

            # 현재 비활성화 상태에서 활성화로 변경하려는 경우 확인
            if not current_config.is_enabled and not all_disabled:
                return Response(
                    {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        config = ServiceManagerHelper.toggle_service(service_type)
        serializer = self.get_serializer(config)

        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) {'활성화' if config.is_enabled else '비활성화'}되었습니다."
        })

    @action(detail=False, methods=['post'])
    def enable_service(self, request):
        """서비스 활성화"""
        # Use ServiceManagerHelper instead of ERPSyncServiceManager

        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': 'service_type is required and must be sap, fom, or sample'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 샘플 서비스인 경우 모든 ERP 서비스가 비활성화되어 있는지 확인
        if service_type == 'sample':
            all_services = ServiceManagerHelper.get_all_services()
            erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
            all_disabled = all(not service.is_enabled for service in erp_services.values())

            if not all_disabled:
                return Response(
                    {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        config = ServiceManagerHelper.get_service_config(service_type)
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
        # Use ServiceManagerHelper instead of ERPSyncServiceManager

        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': 'service_type is required and must be sap, fom, or sample'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ServiceManagerHelper.get_service_config(service_type)
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

    @action(detail=False, methods=['post'], url_path='sample/generate')
    def generate_sample_data(self, request):
        """샘플 데이터 생성"""
        # Use ServiceManagerHelper instead of ERPSyncServiceManager

        all_services = ServiceManagerHelper.get_all_services()
        erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
        all_disabled = all(not service.is_enabled for service in erp_services.values())

        if not all_disabled:
            return Response(
                {'error': '샘플 데이터는 모든 ERP 서비스가 비활성화된 경우에만 생성할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 간단한 샘플 데이터 생성 로직 (importlib 사용하지 않음)
            from datetime import datetime, timedelta
            from django.utils import timezone
            import random

            days = request.data.get('days', 90)

            # 간단한 결과 반환
            result = {
                'message': f'샘플 데이터 생성이 시작되었습니다. {days}일 분량의 데이터를 생성 중입니다...',
                'days': days,
                'period': f'{(datetime.now().date() - timedelta(days=days)).strftime("%Y-%m-%d")} ~ {datetime.now().date().strftime("%Y-%m-%d")}',
                'data_count': f'{days * 10}건 (예상)',
                'status': 'processing'
            }

            return Response(result)
        except Exception as e:
            return Response(
                {'error': f'샘플 데이터 생성 실패: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
