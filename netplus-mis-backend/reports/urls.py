from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExecutiveSummaryViewSet, DepartmentComparisonViewSet,
    KeyMetricSummaryViewSet, RiskOpportunityViewSet,
    RecommendationViewSet, MonthlyReportViewSet
)

router = DefaultRouter()
router.register(r'executive-summary', ExecutiveSummaryViewSet)
router.register(r'department-comparison', DepartmentComparisonViewSet)
router.register(r'key-metric', KeyMetricSummaryViewSet)
router.register(r'risk-opportunity', RiskOpportunityViewSet)
router.register(r'recommendation', RecommendationViewSet)
router.register(r'monthly-report', MonthlyReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
