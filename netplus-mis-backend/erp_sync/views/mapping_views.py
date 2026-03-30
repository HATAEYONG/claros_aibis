"""
ERP 매핑 관련 ViewSets
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from erp_sync.models.mapping import ERPTableMapping, ERPFieldMapping, ERPMappingValidation
from erp_sync.serializers.mapping_serializers import (
    ERPTableMappingSerializer,
    ERPTableMappingDetailSerializer,
    ERPTableMappingCreateSerializer,
    ERPFieldMappingSerializer,
    ERPFieldMappingCreateSerializer,
    ERPFieldMappingBulkCreateSerializer,
    ERPMappingValidationSerializer,
)
from erp_sync.services.mapping_validation_service import MappingValidationService
from erp_sync.services.sync_execution_service import SyncExecutionService


class ERPTableMappingViewSet(viewsets.ModelViewSet):
    """ERP 테이블 매핑 관리 ViewSet"""
    queryset = ERPTableMapping.objects.select_related(
        'source_table__erp_source',
        'target_model'
    ).all()
    serializer_class = ERPTableMappingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source_table__erp_source', 'target_model', 'is_active', 'sync_priority']
    search_fields = ['mapping_code', 'mapping_name']
    ordering_fields = ['sync_priority', 'mapping_code']
    ordering = ['sync_priority', 'mapping_code']

    def get_serializer_class(self):
        if self.action == 'create':
            return ERPTableMappingCreateSerializer
        if self.action == 'retrieve':
            return ERPTableMappingDetailSerializer
        return ERPTableMappingSerializer

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """매핑 검증"""
        table_mapping = self.get_object()
        service = MappingValidationService()

        try:
            result = service.validate_table_mapping(table_mapping)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '검증 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """동기화 실행"""
        table_mapping = self.get_object()
        service = SyncExecutionService()

        sync_type = request.data.get('sync_type', table_mapping.sync_type)
        batch_size = request.data.get('batch_size', 1000)
        force_full_sync = request.data.get('force_full_sync', False)

        try:
            result = service.execute_sync(
                table_mapping,
                sync_type=sync_type,
                batch_size=batch_size,
                force_full_sync=force_full_sync
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '동기화 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ERPFieldMappingViewSet(viewsets.ModelViewSet):
    """ERP 필드 매핑 관리 ViewSet"""
    queryset = ERPFieldMapping.objects.select_related(
        'table_mapping',
        'source_field',
        'target_field'
    ).all()
    serializer_class = ERPFieldMappingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['table_mapping', 'is_key_field']
    search_fields = ['source_field__source_field_name', 'target_field__field_name']
    ordering_fields = ['table_mapping', 'field_order']
    ordering = ['table_mapping', 'field_order']

    def get_serializer_class(self):
        if self.action == 'create':
            return ERPFieldMappingCreateSerializer
        return ERPFieldMappingSerializer

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """일괄 필드 매핑 생성"""
        serializer = ERPFieldMappingBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        table_mapping_id = serializer.validated_data['table_mapping_id']
        auto_match = serializer.validated_data['auto_match']
        mappings_data = serializer.validated_data.get('mappings', [])

        try:
            from erp_sync.services.mapping_bulk_service import MappingBulkService
            service = MappingBulkService()

            result = service.bulk_create_field_mappings(
                table_mapping_id,
                mappings_data,
                auto_match=auto_match
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '일괄 생성 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """일괄 필드 매핑 삭제"""
        field_mapping_ids = request.data.get('field_mapping_ids', [])

        if not field_mapping_ids:
            return Response(
                {'error': 'field_mapping_ids가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count = ERPFieldMapping.objects.filter(
            field_mapping_id__in=field_mapping_ids
        ).delete()[0]

        return Response({
            'status': 'success',
            'deleted_count': deleted_count
        })


class ERPMappingValidationViewSet(viewsets.ReadOnlyModelViewSet):
    """ERP 매핑 검증 기록 조회 ViewSet"""
    queryset = ERPMappingValidation.objects.select_related('table_mapping').all()
    serializer_class = ERPMappingValidationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['table_mapping', 'validation_type', 'status']
    ordering_fields = ['validated_at']
    ordering = ['-validated_at']


class ERPMappingImportViewSet(viewsets.ViewSet):
    """ERP 매핑 가져오기/내보내기 ViewSet"""

    @action(detail=False, methods=['post'])
    def import_from_csv(self, request):
        """CSV에서 매핑 가져오기"""
        from erp_sync.services.mapping_import_service import MappingImportService

        csv_file = request.FILES.get('file')
        erp_source_id = request.data.get('erp_source_id')
        import_type = request.data.get('import_type', 'both')
        overwrite = request.data.get('overwrite', False)

        if not csv_file:
            return Response(
                {'error': 'CSV 파일이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not erp_source_id:
            return Response(
                {'error': 'erp_source_id가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MappingImportService()
            result = service.import_from_csv(
                csv_file,
                erp_source_id,
                import_type=import_type,
                overwrite=overwrite
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': 'CSV 가져오기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_to_csv(self, request):
        """CSV로 매핑 내보내기"""
        from erp_sync.services.mapping_export_service import MappingExportService
        from rest_framework import HttpResponse

        erp_source_id = request.query_params.get('erp_source_id')
        include_mappings = request.query_params.get('include_mappings', 'false')
        export_format = request.query_params.get('format', 'tables')

        if not erp_source_id:
            return Response(
                {'error': 'erp_source_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MappingExportService()
            csv_content = service.export_to_csv(
                erp_source_id,
                include_mappings=include_mappings.lower() == 'true',
                export_format=export_format
            )

            response = HttpResponse(csv_content, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="erp_mapping_{erp_source_id}.csv"'
            return response
        except Exception as e:
            return Response({
                'status': 'error',
                'message': 'CSV 내보내기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_to_json(self, request):
        """JSON으로 매핑 내보내기"""
        from erp_sync.services.mapping_export_service import MappingExportService
        from rest_framework import HttpResponse
        import json

        erp_source_id = request.query_params.get('erp_source_id')
        include_mappings = request.query_params.get('include_mappings', 'false')
        export_format = request.query_params.get('format', 'tables')

        if not erp_source_id:
            return Response(
                {'error': 'erp_source_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MappingExportService()
            json_content = service.export_to_json(
                erp_source_id,
                include_mappings=include_mappings.lower() == 'true',
                export_format=export_format
            )

            response = HttpResponse(json_content, content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="erp_mapping_{erp_source_id}.json"'
            return response
        except Exception as e:
            return Response({
                'status': 'error',
                'message': 'JSON 내보내기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def import_from_json(self, request):
        """JSON에서 매핑 가져오기"""
        from erp_sync.services.mapping_import_service import MappingImportService

        json_file = request.FILES.get('file')
        overwrite = request.data.get('overwrite', False)

        if not json_file:
            return Response(
                {'error': 'JSON 파일이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = MappingImportService()
            result = service.import_from_json(
                json_file,
                overwrite=overwrite
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': 'JSON 가져오기 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """템플릿 다운로드"""
        from erp_sync.services.mapping_export_service import MappingExportService
        from rest_framework import HttpResponse

        template_type = request.query_params.get('type', 'tables')

        try:
            service = MappingExportService()
            template_content = service.get_template(template_type)

            if template_type == 'json':
                response = HttpResponse(template_content, content_type='application/json')
                response['Content-Disposition'] = 'attachment; filename="erp_mapping_template.json"'
            else:
                response = HttpResponse(template_content, content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="erp_mapping_template.csv"'

            return response
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '템플릿 다운로드 실패',
                'error_details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
