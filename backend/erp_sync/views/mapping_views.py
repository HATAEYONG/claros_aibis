"""
ERP 매핑 관련 ViewSets (임시 비활성화)
"""

from rest_framework import viewsets, status
from rest_framework.response import Response


class ERPTableMappingViewSet(viewsets.ModelViewSet):
    """ERP 테이블 매핑 관리 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Table Mapping 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPFieldMappingViewSet(viewsets.ModelViewSet):
    """ERP 필드 매핑 관리 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Field Mapping 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPMappingValidationViewSet(viewsets.ModelViewSet):
    """ERP 매핑 검증 기록 조회 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Mapping Validation 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPMappingImportViewSet(viewsets.ViewSet):
    """ERP 매핑 가져오기/내보내기 ViewSet (임시)"""
    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Mapping Import 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
