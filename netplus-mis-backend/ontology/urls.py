from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OntologyCategoryViewSet,
    OntologyElementViewSet,
    ERPTableMappingViewSet,
    OntologyRelationViewSet,
    DataFlowMetricsViewSet,
    OntologyAnalysisLogViewSet,
    OntologyFlowAPIView,
    Impact4M2EAPIView,
    CostToESGTraceAPIView,
    OntologyGraphAPIView,
    OntologyDashboardAPIView,
    kg_stats,
    kg_nodes,
    kg_query,
    kg_search,
)

router = DefaultRouter()
router.register(r'categories', OntologyCategoryViewSet, basename='ontology-category')
router.register(r'elements', OntologyElementViewSet, basename='ontology-element')
router.register(r'erp-tables', ERPTableMappingViewSet, basename='erp-table-mapping')
router.register(r'relations', OntologyRelationViewSet, basename='ontology-relation')
router.register(r'metrics', DataFlowMetricsViewSet, basename='data-flow-metrics')
router.register(r'logs', OntologyAnalysisLogViewSet, basename='ontology-analysis-log')

urlpatterns = [
    # ViewSet 라우터
    path('', include(router.urls)),

    # 커스텀 API 엔드포인트
    path('flow/', OntologyFlowAPIView.as_view(), name='ontology-flow'),
    path('impact/4m2e/', Impact4M2EAPIView.as_view(), name='impact-4m2e'),
    path('trace/cost-to-esg/<str:cost_mon>/', CostToESGTraceAPIView.as_view(), name='cost-to-esg-trace'),
    path('graph/', OntologyGraphAPIView.as_view(), name='ontology-graph'),
    path('dashboard/', OntologyDashboardAPIView.as_view(), name='ontology-dashboard'),

    # 지식 그래프 API 엔드포인트 (Phase 7)
    path('kg/stats/', kg_stats, name='knowledge-graph-stats'),
    path('kg/nodes/', kg_nodes, name='knowledge-graph-nodes'),
    path('kg/query/', kg_query, name='knowledge-graph-query'),
    path('kg/search/', kg_search, name='knowledge-graph-search'),
]
