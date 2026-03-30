"""
MIS 타겟 모델 관련 ViewSets
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from erp_sync.models.mis_target import ERPTargetModel, ERPTargetField
from erp_sync.serializers.mis_target_serializers import (
    ERPTargetModelSerializer,
    ERPTargetModelDetailSerializer,
    ERPTargetFieldSerializer,
)


class ERPTargetModelViewSet(viewsets.ModelViewSet):
    """MIS 타겟 모델 관리 ViewSet"""
    queryset = ERPTargetModel.objects.all()
    serializer_class = ERPTargetModelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['app_label', 'model_type']
    search_fields = ['model_name', 'model_label']
    ordering_fields = ['app_label', 'model_name']
    ordering = ['app_label', 'model_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ERPTargetModelDetailSerializer
        return ERPTargetModelSerializer

    @action(detail=False, methods=['get'])
    def by_module(self, request):
        """모듈별 그룹화된 모델 목록"""
        models = self.get_queryset()
        grouped = {}

        for model in models:
            app_label = model.app_label
            if app_label not in grouped:
                grouped[app_label] = []
            grouped[app_label].append(ERPTargetModelSerializer(model).data)

        return Response({
            'modules': grouped,
            'total_count': models.count()
        })


class ERPTargetFieldViewSet(viewsets.ReadOnlyModelViewSet):
    """MIS 타겟 필드 조회 ViewSet (읽기 전용)"""
    queryset = ERPTargetField.objects.select_related('target_model').all()
    serializer_class = ERPTargetFieldSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['target_model', 'field_type', 'is_required']
    search_fields = ['field_name', 'field_label']
    ordering_fields = ['target_model', 'field_name']
    ordering = ['target_model', 'field_name']

    @action(detail=False, methods=['get'])
    def by_model(self, request):
        """모델별 필드 목록"""
        model_id = request.query_params.get('model_id')
        if not model_id:
            return Response(
                {'error': 'model_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fields = self.get_queryset().filter(target_model_id=model_id)
        serializer = self.get_serializer(fields, many=True)
        return Response(serializer.data)
