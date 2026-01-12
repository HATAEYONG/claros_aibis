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
]
