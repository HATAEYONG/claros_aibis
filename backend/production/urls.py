from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductionLineViewSet,
    WorkOrderViewSet,
    DailyProductionViewSet,
    EquipmentViewSet,
    ProductionKPIViewSet,
)

router = DefaultRouter()
router.register(r'lines', ProductionLineViewSet, basename='production-line')
router.register(r'work-orders', WorkOrderViewSet, basename='work-order')
router.register(r'daily-productions', DailyProductionViewSet, basename='daily-production')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'kpi', ProductionKPIViewSet, basename='production-kpi')

urlpatterns = [
    path('', include(router.urls)),
]