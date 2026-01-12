from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date, datetime
import time

from .models import (
    OntologyCategory,
    OntologyElement,
    ERPTableMapping,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog
)
from .serializers import (
    OntologyCategorySerializer,
    OntologyCategoryListSerializer,
    OntologyElementSerializer,
    OntologyElementListSerializer,
    ERPTableMappingSerializer,
    OntologyRelationSerializer,
    DataFlowMetricsSerializer,
    OntologyAnalysisLogSerializer,
)
from .services import OntologyService


class OntologyCategoryViewSet(viewsets.ModelViewSet):
    """온톨로지 카테고리 ViewSet"""
    queryset = OntologyCategory.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['level', 'is_active']
    ordering_fields = ['level', 'sort_order', 'code']
    ordering = ['level', 'sort_order']
    lookup_field = 'code'

    def get_serializer_class(self):
        if self.action == 'list':
            return OntologyCategoryListSerializer
        return OntologyCategorySerializer

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """카테고리 요약 정보"""
        summaries = OntologyService.get_category_summary()
        return Response({
            'status': 'success',
            'data': summaries
        })


class OntologyElementViewSet(viewsets.ModelViewSet):
    """온톨로지 요소 ViewSet"""
    queryset = OntologyElement.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['code', 'name_ko', 'name_en']
    ordering_fields = ['category', 'sort_order', 'code']
    ordering = ['category', 'sort_order']

    def get_serializer_class(self):
        if self.action == 'list':
            return OntologyElementListSerializer
        return OntologyElementSerializer

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """카테고리별 요소 조회"""
        category_code = request.query_params.get('category')
        if not category_code:
            return Response(
                {'error': 'category 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        elements = self.queryset.filter(
            category__code=category_code,
            is_active=True
        ).order_by('sort_order')

        serializer = OntologyElementSerializer(elements, many=True)
        return Response({
            'status': 'success',
            'category': category_code,
            'data': serializer.data
        })


class ERPTableMappingViewSet(viewsets.ModelViewSet):
    """ERP 테이블 맵핑 ViewSet"""
    queryset = ERPTableMapping.objects.all()
    serializer_class = ERPTableMappingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['element', 'module', 'is_active']
    search_fields = ['table_name', 'table_description']

    @action(detail=False, methods=['get'])
    def by_element(self, request):
        """요소별 ERP 테이블 조회"""
        element_id = request.query_params.get('element_id')
        if not element_id:
            return Response(
                {'error': 'element_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tables = self.queryset.filter(
            element_id=element_id,
            is_active=True
        )

        serializer = self.get_serializer(tables, many=True)
        return Response({
            'status': 'success',
            'element_id': element_id,
            'data': serializer.data
        })


class OntologyRelationViewSet(viewsets.ModelViewSet):
    """온톨로지 관계 ViewSet"""
    queryset = OntologyRelation.objects.all()
    serializer_class = OntologyRelationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['relation_type', 'is_active']
    ordering_fields = ['source_element', 'target_element']


class OntologyFlowAPIView(APIView):
    """온톨로지 데이터 흐름 API"""

    def get(self, request):
        """6M → 4M2E → 원가 → 재무 → ESG 전체 흐름 조회"""
        start = request.query_params.get('start', '6M')
        end = request.query_params.get('end', 'ESG')

        start_time = time.time()
        flow_chain = OntologyService.get_data_flow_chain(start, end)
        execution_time = int((time.time() - start_time) * 1000)

        # 분석 로그 저장
        log = OntologyService.create_analysis_log(
            analysis_type='FLOW_CHAIN',
            start_category=start,
            end_category=end,
            analysis_date=date.today()
        )
        OntologyService.complete_analysis_log(
            log=log,
            result_summary={'total_elements': flow_chain['total_elements']},
            record_count=flow_chain['total_elements'],
            execution_time_ms=execution_time
        )

        return Response({
            'status': 'success',
            'data': flow_chain,
            'execution_time_ms': execution_time
        })


class Impact4M2EAPIView(APIView):
    """4M2E 영향도 분석 API"""

    def get(self, request):
        """4M2E 요소별 원가 영향도 분석"""
        date_str = request.query_params.get('date')

        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = date.today()

        start_time = time.time()
        result = OntologyService.get_4m2e_impact_analysis(target_date)
        execution_time = int((time.time() - start_time) * 1000)

        return Response({
            'status': 'success',
            'data': result,
            'execution_time_ms': execution_time
        })


class CostToESGTraceAPIView(APIView):
    """원가 → ESG 추적 API"""

    def get(self, request, cost_mon):
        """특정 월의 원가 데이터가 ESG에 미치는 영향 추적"""
        start_time = time.time()
        result = OntologyService.trace_cost_to_esg(cost_mon)
        execution_time = int((time.time() - start_time) * 1000)

        # 분석 로그 저장
        log = OntologyService.create_analysis_log(
            analysis_type='COST_TO_ESG',
            start_category='COST',
            end_category='ESG',
            analysis_date=date.today(),
            parameters={'cost_month': cost_mon}
        )
        OntologyService.complete_analysis_log(
            log=log,
            result_summary={'esg_score': float(result['esg_score'])},
            record_count=1,
            execution_time_ms=execution_time
        )

        return Response({
            'status': 'success',
            'data': result,
            'execution_time_ms': execution_time
        })


class OntologyGraphAPIView(APIView):
    """온톨로지 관계 그래프 API"""

    def get(self, request):
        """온톨로지 관계 그래프 데이터 조회"""
        graph_data = OntologyService.get_relations_graph()

        return Response({
            'status': 'success',
            'data': graph_data
        })


class DataFlowMetricsViewSet(viewsets.ModelViewSet):
    """데이터 흐름 지표 ViewSet"""
    queryset = DataFlowMetrics.objects.all()
    serializer_class = DataFlowMetricsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    ordering_fields = ['metric_date', 'category']
    ordering = ['-metric_date']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """지표 요약"""
        category_code = request.query_params.get('category')
        metrics = OntologyService.get_metrics_summary(category_code)

        return Response({
            'status': 'success',
            'data': metrics
        })


class OntologyAnalysisLogViewSet(viewsets.ReadOnlyModelViewSet):
    """온톨로지 분석 로그 ViewSet (읽기 전용)"""
    queryset = OntologyAnalysisLog.objects.all()
    serializer_class = OntologyAnalysisLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['analysis_type', 'status', 'start_category', 'end_category']
    ordering_fields = ['created_at', 'execution_time_ms']
    ordering = ['-created_at']


class OntologyDashboardAPIView(APIView):
    """온톨로지 대시보드 통합 API"""

    def get(self, request):
        """대시보드 전체 데이터 조회"""
        start_time = time.time()

        # 카테고리 요약
        category_summary = OntologyService.get_category_summary()

        # 전체 흐름
        flow_chain = OntologyService.get_data_flow_chain('6M', 'ESG')

        # 4M2E 영향도
        impact_4m2e = OntologyService.get_4m2e_impact_analysis()

        # 현재 월의 ESG 추적
        current_month = date.today().strftime('%Y%m')
        esg_trace = OntologyService.trace_cost_to_esg(current_month)

        execution_time = int((time.time() - start_time) * 1000)

        return Response({
            'status': 'success',
            'data': {
                'category_summary': category_summary,
                'flow_chain': flow_chain,
                'impact_4m2e': impact_4m2e,
                'esg_trace': esg_trace
            },
            'execution_time_ms': execution_time
        })
