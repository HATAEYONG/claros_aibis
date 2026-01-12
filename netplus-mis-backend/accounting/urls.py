from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BudgetActualViewSet, DepartmentProfitabilityViewSet,
    KPIPerformanceViewSet, FinancialRatioAnalysisViewSet,
    BudgetAllocationViewSet, InvestmentROIViewSet
)

router = DefaultRouter()
router.register(r'budget-actual', BudgetActualViewSet)
router.register(r'department-profitability', DepartmentProfitabilityViewSet)
router.register(r'kpi-performance', KPIPerformanceViewSet)
router.register(r'financial-ratio', FinancialRatioAnalysisViewSet)
router.register(r'budget-allocation', BudgetAllocationViewSet)
router.register(r'investment-roi', InvestmentROIViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
