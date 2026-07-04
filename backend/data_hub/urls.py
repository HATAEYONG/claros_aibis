# -*- coding: utf-8 -*-
"""
Data Hub URL 설정
데이터 통합 계층 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from data_hub.views import DataSourceViewSet, DataSyncLogViewSet, DataMartViewSet

router = DefaultRouter()
router.register(r'data-sources', DataSourceViewSet, basename='data-hub-data-source')
router.register(r'sync-logs', DataSyncLogViewSet, basename='data-hub-sync-log')
router.register(r'marts', DataMartViewSet, basename='data-hub-mart')

app_name = 'data_hub'

urlpatterns = [
    path('', include(router.urls)),
    # ERP Sync Data Hub Routes
    path('master/', include('erp_sync.data_hub.master.urls')),
    path('analytics/', include('erp_sync.data_hub.analytics.urls')),
]
