from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonthlySalesViewSet, ProductSalesViewSet, CustomerTierViewSet,
    SalesPipelineViewSet, SalesTeamPerformanceViewSet, TopCustomerViewSet
)

router = DefaultRouter()
router.register(r'monthly', MonthlySalesViewSet, basename='monthly-sales')
router.register(r'products', ProductSalesViewSet, basename='product-sales')
router.register(r'customer-tiers', CustomerTierViewSet, basename='customer-tier')
router.register(r'pipeline', SalesPipelineViewSet, basename='sales-pipeline')
router.register(r'team', SalesTeamPerformanceViewSet, basename='sales-team')
router.register(r'customers', TopCustomerViewSet, basename='top-customer')

urlpatterns = [
    path('', include(router.urls)),
]
