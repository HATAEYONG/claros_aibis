# -*- coding: utf-8 -*-
"""
통합 레이어 URL 라우팅
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IntegratedMaterialViewSet,
    IntegratedProductionOrderViewSet,
    IntegratedQualityRecordViewSet,
    IntegratedSalesOrderViewSet,
    process_chain,
)

router = DefaultRouter()
router.register(r'materials', IntegratedMaterialViewSet, basename='integrated-material')
router.register(r'production-orders', IntegratedProductionOrderViewSet, basename='integrated-production-order')
router.register(r'quality-records', IntegratedQualityRecordViewSet, basename='integrated-quality-record')
router.register(r'sales-orders', IntegratedSalesOrderViewSet, basename='integrated-sales-order')

urlpatterns = [
    path('process-chain/<str:product_code>/', process_chain, name='integration-process-chain'),
    path('', include(router.urls)),
]
