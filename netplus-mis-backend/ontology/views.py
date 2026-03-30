from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date, datetime
import time

from .models import (
    OntologyCategory,
    OntologyElement,
    ERPTableMapping,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog,
    OntologyNode,
    OntologyEdge
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


# 더미 데이터 헬퍼 함수
def get_dummy_ontology_categories():
    """온톨로지 카테고리 더미 데이터"""
    return [
        {'id': 1, 'code': '6M', 'name_ko': '6M', 'name_en': '6M', 'level': 1, 'sort_order': 1, 'is_active': True},
        {'id': 2, 'code': '4M2E', 'name_ko': '4M2E', 'name_en': '4M2E', 'level': 2, 'sort_order': 2, 'is_active': True},
        {'id': 3, 'code': 'COST', 'name_ko': '원가', 'name_en': 'Cost', 'level': 3, 'sort_order': 3, 'is_active': True},
        {'id': 4, 'code': 'FINANCIAL', 'name_ko': '재무', 'name_en': 'Financial', 'level': 4, 'sort_order': 4, 'is_active': True},
        {'id': 5, 'code': 'ESG', 'name_ko': 'ESG', 'name_en': 'ESG', 'level': 5, 'sort_order': 5, 'is_active': True},
    ]


def get_dummy_ontology_elements():
    """온톨로지 요소 더미 데이터"""
    return [
        {'id': 1, 'code': 'MAN', 'name_ko': '인력', 'name_en': 'Man', 'category': '6M', 'sort_order': 1, 'is_active': True},
        {'id': 2, 'code': 'MACHINE', 'name_ko': '설비', 'name_en': 'Machine', 'category': '6M', 'sort_order': 2, 'is_active': True},
        {'id': 3, 'code': 'MATERIAL', 'name_ko': '자재', 'name_en': 'Material', 'category': '6M', 'sort_order': 3, 'is_active': True},
        {'id': 4, 'code': 'METHOD', 'name_ko': '방법', 'name_en': 'Method', 'category': '6M', 'sort_order': 4, 'is_active': True},
        {'id': 5, 'code': 'MANPOWER', 'name_ko': '인원', 'name_en': 'Manpower', 'category': '4M2E', 'sort_order': 1, 'is_active': True},
        {'id': 6, 'code': 'ENVIRONMENT', 'name_ko': '환경', 'name_en': 'Environment', 'category': '4M2E', 'sort_order': 5, 'is_active': True},
    ]


def get_dummy_erp_mappings():
    """ERP 테이블 맵핑 더미 데이터"""
    return [
        {'id': 1, 'element': 'MAN', 'module': 'HR', 'table_name': 'EMP_MASTER', 'table_description': '사원마스터', 'is_active': True},
        {'id': 2, 'element': 'MACHINE', 'module': 'PRODUCTION', 'table_name': 'EQ_MASTER', 'table_description': '설비마스터', 'is_active': True},
        {'id': 3, 'element': 'MATERIAL', 'module': 'PURCHASE', 'table_name': 'MAT_MASTER', 'table_description': '자재마스터', 'is_active': True},
    ]


def get_dummy_ontology_relations():
    """온톨로지 관계 더미 데이터"""
    return [
        {'id': 1, 'source_element': 'MAN', 'target_element': 'MANPOWER', 'relation_type': 'maps_to', 'is_active': True},
        {'id': 2, 'source_element': 'MACHINE', 'target_element': 'ENVIRONMENT', 'relation_type': 'impacts', 'is_active': True},
        {'id': 3, 'source_element': 'MATERIAL', 'target_element': 'COST', 'relation_type': 'contributes_to', 'is_active': True},
    ]


def get_dummy_data_flow_metrics():
    """데이터 흐름 지표 더미 데이터"""
    return [
        {'id': 1, 'category': '6M', 'status': 'active', 'metric_date': '2024-12-01', 'record_count': 1500, 'data_quality': 98.5},
        {'id': 2, 'category': '4M2E', 'status': 'active', 'metric_date': '2024-12-01', 'record_count': 850, 'data_quality': 97.2},
        {'id': 3, 'category': 'COST', 'status': 'active', 'metric_date': '2024-12-01', 'record_count': 420, 'data_quality': 99.1},
    ]


def get_dummy_analysis_logs():
    """분석 로그 더미 데이터"""
    return [
        {'id': 1, 'analysis_type': 'FLOW_CHAIN', 'start_category': '6M', 'end_category': 'ESG', 'status': 'completed', 'analysis_date': '2024-12-01', 'record_count': 3200, 'execution_time_ms': 150},
        {'id': 2, 'analysis_type': 'IMPACT_4M2E', 'start_category': '4M2E', 'end_category': 'COST', 'status': 'completed', 'analysis_date': '2024-12-01', 'record_count': 850, 'execution_time_ms': 85},
    ]


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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_ontology_categories())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """카테고리 요약 정보"""
        if not self.get_queryset().exists():
            return Response({
                'status': 'success',
                'data': [
                    {'category': '6M', 'element_count': 4, 'relation_count': 6},
                    {'category': '4M2E', 'element_count': 6, 'relation_count': 8},
                    {'category': 'COST', 'element_count': 5, 'relation_count': 4},
                    {'category': 'FINANCIAL', 'element_count': 8, 'relation_count': 10},
                    {'category': 'ESG', 'element_count': 7, 'relation_count': 6},
                ]
            })
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_ontology_elements())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """카테고리별 요소 조회"""
        category_code = request.query_params.get('category')
        if not category_code:
            return Response(
                {'error': 'category 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(
            category__code=category_code,
            is_active=True
        ).order_by('sort_order')

        if not queryset.exists():
            return Response({
                'status': 'success',
                'category': category_code,
                'data': [d for d in get_dummy_ontology_elements() if d['category'] == category_code]
            })

        serializer = OntologyElementSerializer(queryset, many=True)
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_erp_mappings())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_element(self, request):
        """요소별 ERP 테이블 조회"""
        element_id = request.query_params.get('element_id')
        if not element_id:
            return Response(
                {'error': 'element_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(
            element_id=element_id,
            is_active=True
        )

        if not queryset.exists():
            return Response({
                'status': 'success',
                'element_id': element_id,
                'data': [d for d in get_dummy_erp_mappings() if d['element'] == element_id]
            })

        serializer = self.get_serializer(queryset, many=True)
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_ontology_relations())
        return super().list(request, *args, **kwargs)


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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_data_flow_metrics())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """지표 요약"""
        category_code = request.query_params.get('category')

        if not self.get_queryset().exists():
            return Response({
                'status': 'success',
                'data': [
                    {'category': '6M', 'total_records': 1500, 'avg_quality': 98.5, 'status': 'active'},
                    {'category': '4M2E', 'total_records': 850, 'avg_quality': 97.2, 'status': 'active'},
                    {'category': 'COST', 'total_records': 420, 'avg_quality': 99.1, 'status': 'active'},
                ]
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_analysis_logs())
        return super().list(request, *args, **kwargs)


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


# ==========================================
# Knowledge Graph API Views (AIBIS Enterprise AI Platform)
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kg_stats(request):
    """지식 그래프 통계 API"""
    try:
        from .services.knowledge_graph import KnowledgeGraphService

        service = KnowledgeGraphService()
        stats = service.get_graph_statistics()

        return Response({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kg_nodes(request):
    """지식 그래프 노드 목록 API"""
    try:
        from .services.knowledge_graph import KnowledgeGraphService

        service = KnowledgeGraphService()

        # 필터 파라미터
        node_type = request.query_params.get('node_type')
        category = request.query_params.get('category')
        limit = int(request.query_params.get('limit', 50))

        # 노드 조회
        if node_type:
            nodes = service.get_nodes_by_type(node_type)[:limit]
        elif category:
            nodes = service.get_nodes_by_category(category)[:limit]
        else:
            nodes = OntologyNode.objects.filter(is_active=True)[:limit]

        node_list = []
        for node in nodes:
            node_list.append({
                'node_id': str(node.node_id),
                'node_type': node.node_type,
                'name': node.name,
                'code': node.code or '',
                'category': node.category or '',
                'labels': node.labels or [],
                'properties': node.properties or {},
            })

        return Response({
            'status': 'success',
            'count': len(node_list),
            'data': node_list
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def kg_query(request):
    """지식 그래프 쿼리 API"""
    try:
        from .services.knowledge_graph import KnowledgeGraphService

        query_type = request.data.get('query_type', 'neighbors')
        parameters = request.data.get('parameters', {})

        service = KnowledgeGraphService()
        query_service = service.build_and_query()

        result = {}

        if query_type == 'neighbors':
            node_id = parameters.get('node_id')
            direction = parameters.get('direction', 'out')
            depth = parameters.get('depth', 1)

            if not node_id:
                return Response({
                    'error': 'node_id 파라미터가 필요합니다.',
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)

            neighbors = query_service.get_neighbors(node_id, direction, depth)
            result = {
                'node_id': node_id,
                'neighbors': neighbors,
                'count': len(neighbors)
            }

        elif query_type == 'shortest_path':
            source = parameters.get('source')
            target = parameters.get('target')

            if not source or not target:
                return Response({
                    'error': 'source, target 파라미터가 필요합니다.',
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)

            path = query_service.find_shortest_path(source, target)
            result = {
                'source': source,
                'target': target,
                'path': path,
                'length': len(path) - 1 if path else 0
            }

        elif query_type == 'centrality':
            method = parameters.get('method', 'degree')
            top_n = parameters.get('top_n', 10)

            centrality = query_service.calculate_centrality(method, top_n)
            result = {
                'method': method,
                'top_n': top_n,
                'centrality': centrality
            }

        elif query_type == 'subgraph':
            node_ids = parameters.get('node_ids', [])
            include_neighbors = parameters.get('include_neighbors', False)

            if not node_ids:
                return Response({
                    'error': 'node_ids 파라미터가 필요합니다.',
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)

            subgraph = query_service.get_subgraph(node_ids, include_neighbors)
            result = {
                'node_count': subgraph.number_of_nodes(),
                'edge_count': subgraph.number_of_edges(),
                'nodes': list(subgraph.nodes())
            }

        else:
            return Response({
                'error': f'지원하지 않는 쿼리 유형: {query_type}',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'status': 'success',
            'query_type': query_type,
            'data': result
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kg_search(request):
    """지식 그래프 노드 검색 API"""
    try:
        from .services.knowledge_graph import KnowledgeGraphService

        term = request.query_params.get('term', '')
        limit = int(request.query_params.get('limit', 10))

        if not term:
            return Response({
                'error': 'term 파라미터가 필요합니다.',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        service = KnowledgeGraphService()
        nodes = service.search_nodes(term, limit)

        return Response({
            'status': 'success',
            'query': term,
            'count': len(nodes),
            'data': nodes
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
