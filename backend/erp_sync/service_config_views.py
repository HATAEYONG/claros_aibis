# -*- coding: utf-8 -*-
"""
ERP 동기화 서비스 설정 별도 뷰 함수
"""

from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([AllowAny])
def enable_sample_service_view(request):
    """샘플 데이터 서비스 활성화"""
    # 샘플 데이터 서비스 활성화 로직
    try:
        from .sample_data_service import SampleDataService

        service = SampleDataService()

        if not service.is_all_services_disabled():
            return Response(
                {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = service.activate_sample_service()

        return Response({
            'service': {
                'config_id': config.config_id,
                'service_type': config.service_type,
                'service_name': config.service_name,
                'is_enabled': config.is_enabled,
                'sync_status': config.sync_status,
            },
            'message': '샘플 데이터 서비스가 활성화되었습니다.'
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_sample_data_view(request):
    """샘플 데이터 생성"""
    try:
        from .sample_data_service import SampleDataService

        service = SampleDataService()

        if not service.is_all_services_disabled():
            return Response(
                {'error': '샘플 데이터는 모든 ERP 서비스가 비활성화된 경우에만 생성할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 요청에서 일수 가져오기 (기본값 90일)
        import json
        try:
            request_data = json.loads(request.body) if request.body else {}
            days = request_data.get('days', 90)
        except:
            days = 90

        result = service.generate_sample_data(days)

        return Response(result)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
