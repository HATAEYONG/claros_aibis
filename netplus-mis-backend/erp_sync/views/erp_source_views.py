"""
ERP 소스 관련 ViewSets
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from erp_sync.models.erp_source import ERPSource, ERPTableDefinition, ERPFieldDefinition
from erp_sync.serializers.erp_source_serializers import (
    ERPSourceSerializer,
    ERPSourceDetailSerializer,
    ERPTableDefinitionSerializer,
    ERPTableDefinitionDetailSerializer,
    ERPFieldDefinitionSerializer,
)
from erp_sync.services.erp_connection_service import ERPConnectionService


class ERPSourceViewSet(viewsets.ModelViewSet):
    """ERP 소스 관리 ViewSet"""
    queryset = ERPSource.objects.all()
    serializer_class = ERPSourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source_type', 'is_active']
    search_fields = ['source_code', 'source_name']
    ordering_fields = ['source_code', 'created_at']
    ordering = ['-is_default', 'source_code']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ERPSourceDetailSerializer
        return ERPSourceSerializer

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """연결 테스트"""
        erp_source = self.get_object()
        service = ERPConnectionService()

        try:
            result = service.test_connection(erp_source)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '연결 실패',
                'error_code': 'CONNECTION_FAILED',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def import_tables(self, request, pk=None):
        """테이블 정의 가져오기"""
        erp_source = self.get_object()
        service = ERPConnectionService()

        module_filter = request.data.get('module_filter', [])
        table_name_pattern = request.data.get('table_name_pattern', '%')
        import_fields = request.data.get('import_fields', True)

        try:
            result = service.import_table_definitions(
                erp_source,
                module_filter=module_filter,
                table_name_pattern=table_name_pattern,
                import_fields=import_fields
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '테이블 가져오기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ERPTableDefinitionViewSet(viewsets.ModelViewSet):
    """ERP 테이블 정의 관리 ViewSet"""
    queryset = ERPTableDefinition.objects.select_related('erp_source').all()
    serializer_class = ERPTableDefinitionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['erp_source', 'module_code']
    search_fields = ['source_table_name', 'source_table_comment']
    ordering_fields = ['module_code', 'source_table_name']
    ordering = ['module_code', 'source_table_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ERPTableDefinitionDetailSerializer
        return ERPTableDefinitionSerializer

    @action(detail=True, methods=['post'])
    def import_fields(self, request, pk=None):
        """필드 정의 가져오기"""
        table_definition = self.get_object()
        service = ERPConnectionService()

        try:
            result = service.import_field_definitions(table_definition)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '필드 가져오기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ERPFieldDefinitionViewSet(viewsets.ReadOnlyModelViewSet):
    """ERP 필드 정의 조회 ViewSet (읽기 전용)"""
    queryset = ERPFieldDefinition.objects.select_related('table_definition__erp_source').all()
    serializer_class = ERPFieldDefinitionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['table_definition', 'is_primary_key', 'is_nullable']
    search_fields = ['source_field_name', 'source_field_comment']
    ordering_fields = ['table_definition', 'field_position']
    ordering = ['table_definition', 'field_position']
