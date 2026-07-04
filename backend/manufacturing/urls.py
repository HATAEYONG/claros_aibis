from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkshopStatusViewSet, CycleTimeViewSet, OEEMetricViewSet,
    ManpowerAllocationViewSet, WorkStandardViewSet, EquipmentDowntimeViewSet,
    ManufacturingKPIViewSet
)

router = DefaultRouter()
router.register(r'workshop-status', WorkshopStatusViewSet)
router.register(r'cycle-time', CycleTimeViewSet)
router.register(r'oee-metric', OEEMetricViewSet)
router.register(r'manpower-allocation', ManpowerAllocationViewSet)
router.register(r'work-standard', WorkStandardViewSet)
router.register(r'equipment-downtime', EquipmentDowntimeViewSet)
router.register(r'kpi', ManufacturingKPIViewSet, basename='manufacturing-kpi')

urlpatterns = [
    path('', include(router.urls)),
]
