# -*- coding: utf-8 -*-
"""
Forecasting URL Configuration
시계열 예측 API 엔드포인트

V2: 고도화된 ML Pipeline 모델 지원
- TFT (Temporal Fusion Transformer)
- Prophet 2.0
- LSTM
- 앙상블 모델
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ForecastModelViewSet, ForecastViewSet
from .views_v2 import (
    ForecastModelViewSetV2,
    ForecastViewSetV2,
    health_check,
    trigger_retrain
)

# V1 API (기존)
router_v1 = DefaultRouter()
router_v1.register(r'models', ForecastModelViewSet, basename='forecast-model')
router_v1.register(r'forecast', ForecastViewSet, basename='forecasting')

# V2 API (고도화된 ML Pipeline)
router_v2 = DefaultRouter()
router_v2.register(r'v2/models', ForecastModelViewSetV2, basename='forecast-model-v2')
router_v2.register(r'v2/forecast', ForecastViewSetV2, basename='forecasting-v2')

app_name = 'forecasting'

urlpatterns = [
    # V1 API (기존)
    path('v1/', include(router_v1.urls)),

    # V2 API (고도화된 ML Pipeline)
    path('', include(router_v2.urls)),

    # V2 전용 엔드포인트
    path('v2/health/', health_check, name='health-check'),
    path('v2/retrain/', trigger_retrain, name='trigger-retrain'),
]
