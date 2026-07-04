# -*- coding: utf-8 -*-
"""
분석 레이어 URL 라우팅
KPI 및 KRI URL 설정
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    KPIDefinitionViewSet,
    KPIFactViewSet,
    KRIDefinitionViewSet,
    KRIFactViewSet,
)

# ViewSet 등록을 위한 라우터
router = DefaultRouter()
router.register(r'definitions', KPIDefinitionViewSet, basename='kpi-definition')
router.register(r'facts', KPIFactViewSet, basename='kpi-fact')
router.register(r'kri-definitions', KRIDefinitionViewSet, basename='kri-definition')
router.register(r'kri-facts', KRIFactViewSet, basename='kri-fact')

urlpatterns = [
    path('', include(router.urls)),
]
