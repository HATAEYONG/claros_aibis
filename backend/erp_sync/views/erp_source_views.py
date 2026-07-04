"""
ERP 소스 관련 ViewSets (임시 비활성화)
"""

from rest_framework import viewsets, status
from rest_framework.response import Response


class ERPSourceViewSet(viewsets.ModelViewSet):
    """ERP 소스 관리 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Source 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPTableDefinitionViewSet(viewsets.ModelViewSet):
    """ERP 테이블 정의 관리 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Table Definition 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPFieldDefinitionViewSet(viewsets.ModelViewSet):
    """ERP 필드 정의 조회 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Field Definition 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
