# -*- coding: utf-8 -*-
"""
Visualization URL Configuration
데이터 시각화 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardViewSet,
    DashboardWidgetViewSet,
    ChartTemplateViewSet,
    DataStreamViewSet,
    VisualizationViewSet
)

router = DefaultRouter()
router.register(r'dashboards', DashboardViewSet, basename='dashboard')
router.register(r'widgets', DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'templates', ChartTemplateViewSet, basename='chart-template')
router.register(r'streams', DataStreamViewSet, basename='data-stream')
router.register(r'visualization', VisualizationViewSet, basename='visualization')

app_name = 'visualization'

urlpatterns = [
    path('', include(router.urls)),
]
