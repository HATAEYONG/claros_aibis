# -*- coding: utf-8 -*-
"""
Monitoring URL Configuration
시스템 모니터링 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SystemMetricViewSet,
    APILogViewSet,
    ErrorLogViewSet,
    PerformanceLogViewSet,
    HealthCheckViewSet,
    health_check,
    metrics
)

router = DefaultRouter()
router.register(r'metrics', SystemMetricViewSet, basename='system-metric')
router.register(r'api-logs', APILogViewSet, basename='api-log')
router.register(r'errors', ErrorLogViewSet, basename='error-log')
router.register(r'performance', PerformanceLogViewSet, basename='performance-log')
router.register(r'health-checks', HealthCheckViewSet, basename='health-check')

app_name = 'monitoring'

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health-check'),
    path('metrics/', metrics, name='metrics'),
]
