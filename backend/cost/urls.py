from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonthlyCostViewSet, ProductCostViewSet, CostReductionProjectViewSet,
    CostDriverViewSet, BreakEvenAnalysisViewSet, CostStructureViewSet,
    CostKPIViewSet, cost_breakdown_4m2e, cost_driver_analysis_api
)

router = DefaultRouter()
router.register(r'monthly', MonthlyCostViewSet, basename='monthly-cost')
router.register(r'products', ProductCostViewSet, basename='product-cost')
router.register(r'projects', CostReductionProjectViewSet, basename='cost-reduction-project')
router.register(r'drivers', CostDriverViewSet, basename='cost-driver')
router.register(r'break-even', BreakEvenAnalysisViewSet, basename='break-even')
router.register(r'structure', CostStructureViewSet, basename='cost-structure')
router.register(r'kpi', CostKPIViewSet, basename='cost-kpi')

urlpatterns = [
    path('', include(router.urls)),
    # 4M2E 코스 분석 API
    path('breakdown-4m2e/', cost_breakdown_4m2e, name='cost-breakdown-4m2e'),
    path('driver-analysis/', cost_driver_analysis_api, name='cost-driver-analysis'),
]
