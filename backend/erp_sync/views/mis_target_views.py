"""
MIS 타겟 모델 관련 ViewSets (임시 비활성화)
"""

from rest_framework import viewsets, status
from rest_framework.response import Response


class ERPTargetModelViewSet(viewsets.ModelViewSet):
    """MIS 타겟 모델 관리 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Target Model 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ERPTargetFieldViewSet(viewsets.ModelViewSet):
    """MIS 타겟 필드 조회 ViewSet (임시)"""
    def get_queryset(self):
        """임시 빈 쿼리셋"""
        return []

    def list(self, request, *args, **kwargs):
        """임시 응답"""
        return Response({"message": "ERP Target Field 기능은 현재 비활성화되어 있습니다."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
