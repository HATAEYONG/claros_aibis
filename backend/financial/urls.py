from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialStatementViewSet, FinancialRatioViewSet, FinancialKPIViewSet
)

router = DefaultRouter()
router.register(r'statements', FinancialStatementViewSet, basename='financial-statement')
router.register(r'ratios', FinancialRatioViewSet, basename='financial-ratio')
router.register(r'kpi', FinancialKPIViewSet, basename='financial-kpi')

urlpatterns = [
    path('', include(router.urls)),
]