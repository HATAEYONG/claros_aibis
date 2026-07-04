from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HourlyProductionViewSet, LineUtilizationViewSet,
    WorkerProductivityViewSet, OEEComponentViewSet,
    ProductionEfficiencyViewSet, DailyProductionSummaryViewSet
)

router = DefaultRouter()
router.register(r'hourly-production', HourlyProductionViewSet)
router.register(r'line-utilization', LineUtilizationViewSet)
router.register(r'worker-productivity', WorkerProductivityViewSet)
router.register(r'oee-component', OEEComponentViewSet)
router.register(r'efficiency', ProductionEfficiencyViewSet)
router.register(r'daily-summary', DailyProductionSummaryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
