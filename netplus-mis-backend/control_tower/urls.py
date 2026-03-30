"""
컨트롤 타워 앱 URL 설정
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ControlTowerConfigViewSet,
    DashboardLayoutViewSet,
    ExecutiveTowerViewSet,
    FunctionalTowerViewSet,
    ProcessTowerViewSet,
)

app_name = "control_tower"

router = DefaultRouter()
router.register(r'configs', ControlTowerConfigViewSet, basename='tower-config')
router.register(r'layouts', DashboardLayoutViewSet, basename='tower-layout')
router.register(r'executive', ExecutiveTowerViewSet, basename='executive-tower')
router.register(r'functional', FunctionalTowerViewSet, basename='functional-tower')
router.register(r'process', ProcessTowerViewSet, basename='process-tower')

urlpatterns = [
    path('', include(router.urls)),
]
