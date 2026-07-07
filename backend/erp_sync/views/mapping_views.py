"""
ERP 매핑 관련 ViewSets

ERPTableMapping/ERPFieldMapping/ERPMappingValidation은 rebuild_mapping_master_data
관리 명령으로 실제 검증된 데이터(복원된 YH 백업 실측 컬럼 + 실제 Django 모델
introspection 기반)로 채워진다. 예전에는 매핑 데이터 자체가 설치되지 않은 앱을
가리키는 등 무효했기 때문에 이 ViewSet들이 임시로 503을 반환하도록 막아뒀었다.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from erp_sync.models import ERPTableMapping, ERPFieldMapping, ERPMappingValidation
from erp_sync.serializers.mapping_serializers import (
    ERPTableMappingSerializer,
    ERPTableMappingDetailSerializer,
    ERPTableMappingCreateSerializer,
    ERPFieldMappingSerializer,
    ERPFieldMappingCreateSerializer,
    ERPMappingValidationSerializer,
)


class ERPTableMappingViewSet(viewsets.ModelViewSet):
    """ERP 테이블 매핑 관리 ViewSet"""
    queryset = ERPTableMapping.objects.select_related('source_table', 'target_model').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ERPTableMappingDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ERPTableMappingCreateSerializer
        return ERPTableMappingSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'count': queryset.count(), 'results': serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'status': 'success', 'result': serializer.data})

    @action(detail=True, methods=['get'], url_path='field-mappings')
    def field_mappings(self, request, pk=None):
        """이 테이블 매핑에 속한 필드 매핑 목록"""
        mapping = self.get_object()
        fields = mapping.field_mappings.select_related('source_field', 'target_field').order_by('field_order')
        serializer = ERPFieldMappingSerializer(fields, many=True)
        return Response({'status': 'success', 'count': fields.count(), 'results': serializer.data})


class ERPFieldMappingViewSet(viewsets.ModelViewSet):
    """ERP 필드 매핑 관리 ViewSet"""
    queryset = ERPFieldMapping.objects.select_related(
        'table_mapping', 'source_field', 'target_field'
    ).all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ERPFieldMappingCreateSerializer
        return ERPFieldMappingSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        table_mapping_id = request.GET.get('table_mapping')
        if table_mapping_id:
            queryset = queryset.filter(table_mapping_id=table_mapping_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'count': queryset.count(), 'results': serializer.data})


class ERPMappingValidationViewSet(viewsets.ReadOnlyModelViewSet):
    """ERP 매핑 검증 기록 조회 ViewSet (검증 기록은 검증 실행 시에만 생성되므로 읽기 전용)"""
    queryset = ERPMappingValidation.objects.select_related('table_mapping').all()
    serializer_class = ERPMappingValidationSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'status': 'success', 'count': queryset.count(), 'results': serializer.data})


class ERPMappingImportViewSet(viewsets.ViewSet):
    """ERP 매핑 가져오기/내보내기 ViewSet (임시 - 파일 기반 대량 가져오기는 이번 범위 밖)"""
    def list(self, request, *args, **kwargs):
        return Response(
            {"message": "ERP Mapping Import 기능은 현재 비활성화되어 있습니다."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
