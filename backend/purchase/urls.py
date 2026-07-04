from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonthlyPurchaseViewSet, InventoryViewSet, PurchaseOrderViewSet,
    SupplierViewSet, MaterialPriceViewSet, InventoryTurnoverViewSet,
    PurchaseKPIViewSet
)

router = DefaultRouter()
router.register(r'monthly', MonthlyPurchaseViewSet, basename='monthly-purchase')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'material-prices', MaterialPriceViewSet, basename='material-price')
router.register(r'turnover', InventoryTurnoverViewSet, basename='inventory-turnover')
router.register(r'kpi', PurchaseKPIViewSet, basename='purchase-kpi')

urlpatterns = [
    path('', include(router.urls)),
]
