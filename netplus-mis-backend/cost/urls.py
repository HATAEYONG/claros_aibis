from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonthlyCostViewSet, ProductCostViewSet, CostReductionProjectViewSet,
    CostDriverViewSet, BreakEvenAnalysisViewSet, CostStructureViewSet
)

router = DefaultRouter()
router.register(r'monthly', MonthlyCostViewSet, basename='monthly-cost')
router.register(r'products', ProductCostViewSet, basename='product-cost')
router.register(r'projects', CostReductionProjectViewSet, basename='cost-reduction-project')
router.register(r'drivers', CostDriverViewSet, basename='cost-driver')
router.register(r'break-even', BreakEvenAnalysisViewSet, basename='break-even')
router.register(r'structure', CostStructureViewSet, basename='cost-structure')

urlpatterns = [
    path('', include(router.urls)),
]
