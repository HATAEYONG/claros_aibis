"""
ERP 연결 설정 API View
DB 모델 기반 연결 설정 관리 API
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from erp_sync.models import ERPConnectionConfigModel
from erp_sync.serializers.connection_config_serializers import (
    ERPConnectionConfigSerializer,
    ERPConnectionConfigListSerializer,
    ERPConnectionConfigCreateSerializer,
    ERPConnectionConfigUpdateSerializer,
    ConnectionTestSerializer,
    ToggleConnectionSerializer,
    ResetConnectionSerializer,
)
from erp_sync.services.erp_connection_service import ERPConnectionService
import logging

logger = logging.getLogger(__name__)


class ERPConnectionConfigViewSet(viewsets.ModelViewSet):
    """ERP 연결 설정 ViewSet"""

    queryset = ERPConnectionConfigModel.objects.all()
    serializer_class = ERPConnectionConfigSerializer

    def get_serializer_class(self):
        """액션별 시리얼라이저 선택"""
        if self.action == 'list':
            return ERPConnectionConfigListSerializer
        elif self.action == 'create':
            return ERPConnectionConfigCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ERPConnectionConfigUpdateSerializer
        return ERPConnectionConfigSerializer

    def list(self, request, *args, **kwargs):
        """연결 설정 목록 조회"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'status': 'success',
            'count': queryset.count(),
            'results': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        """연결 설정 상세 조회"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return Response({
            'status': 'success',
            'result': serializer.data
        })

    def create(self, request, *args, **kwargs):
        """연결 설정 생성"""
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            instance = serializer.save()
            response_serializer = ERPConnectionConfigSerializer(instance)

            return Response({
                'status': 'success',
                'message': f'연결 설정 "{instance.source_code}"가 생성되었습니다.',
                'result': response_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'status': 'error',
            'message': '생성 실패',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """연결 설정 수정"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)

        if serializer.is_valid():
            instance = serializer.save()
            response_serializer = ERPConnectionConfigSerializer(instance)

            return Response({
                'status': 'success',
                'message': f'연결 설정 "{instance.source_code}"가 수정되었습니다.',
                'result': response_serializer.data
            })

        return Response({
            'status': 'error',
            'message': '수정 실패',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """연결 설정 삭제"""
        instance = self.get_object()
        source_code = instance.source_code
        instance.delete()

        return Response({
            'status': 'success',
            'message': f'연결 설정 "{source_code}"가 삭제되었습니다.'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='test-connection')
    def test_connection(self, request):
        """
        연결 테스트
        POST /api/erp-sync/config/test-connection/
        {
            "source_code": "YH"
        }
        """
        serializer = ConnectionTestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': '잘못된 요청',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        source_code = serializer.validated_data['source_code']

        # 연결 서비스로 테스트
        service = ERPConnectionService()
        result = service.test_connection(source_code)

        return Response({
            'status': result.get('status', 'unknown'),
            'source_code': source_code,
            'result': result
        })

    @action(detail=False, methods=['post'], url_path='toggle-connection')
    def toggle_connection(self, request):
        """
        연결 on/off 토글
        POST /api/erp-sync/config/toggle-connection/
        {
            "source_code": "YH",
            "enabled": false  // optional
        }
        """
        serializer = ToggleConnectionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': '잘못된 요청',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        source_code = serializer.validated_data['source_code']
        enabled = serializer.validated_data.get('enabled')

        try:
            config = get_object_or_404(ERPConnectionConfigModel, source_code=source_code)

            # enabled가 지정되지 않으면 토글
            if enabled is None:
                config.is_enabled = not config.is_enabled
            else:
                config.is_enabled = enabled

            config.save()

            response_serializer = ERPConnectionConfigSerializer(config)

            return Response({
                'status': 'success',
                'message': f'연결 "{source_code}"가 {"활성화" if config.is_enabled else "비활성화"}되었습니다.',
                'result': response_serializer.data
            })

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='reset-connection')
    def reset_connection(self, request):
        """
        연결 상태 초기화
        POST /api/erp-sync/config/reset-connection/
        {
            "source_code": "YH"
        }
        """
        serializer = ResetConnectionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': '잘못된 요청',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        source_code = serializer.validated_data['source_code']

        try:
            config = get_object_or_404(ERPConnectionConfigModel, source_code=source_code)

            # 실패 카운트 및 에러 초기화
            config.failure_count = 0
            config.last_connection_error = ''
            config.save()

            response_serializer = ERPConnectionConfigSerializer(config)

            return Response({
                'status': 'success',
                'message': f'연결 "{source_code}" 상태가 초기화되었습니다.',
                'result': response_serializer.data
            })

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='status')
    def status(self, request, pk=None):
        """
        특정 연결의 상세 상태 조회
        GET /api/erp-sync/config/{pk}/status/
        """
        instance = self.get_object()

        return Response({
            'status': 'success',
            'source_code': instance.source_code,
            'result': {
                'is_enabled': instance.is_enabled,
                'can_attempt': instance.can_attempt_connection(),
                'use_fallback': instance.use_fallback,
                'fallback_source': instance.fallback_source.source_code if instance.fallback_source else None,
                'last_attempt': instance.last_connection_attempt,
                'last_success': instance.last_connection_success,
                'last_error': instance.last_connection_error,
                'failure_count': instance.failure_count,
                'cooldown_until': instance.last_connection_attempt.isoformat() + f' +{instance.cooldown_seconds}s' if instance.last_connection_attempt else None,
            }
        })
