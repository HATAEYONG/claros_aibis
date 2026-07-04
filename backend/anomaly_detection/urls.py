# -*- coding: utf-8 -*-
"""
Anomaly Detection URL Configuration
이상탐지 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AnomalyDetectorViewSet, AnomalyAlertViewSet, AnomalyDetectionViewSet

router = DefaultRouter()
router.register(r'detectors', AnomalyDetectorViewSet, basename='anomaly-detector')
router.register(r'alerts', AnomalyAlertViewSet, basename='anomaly-alert')
router.register(r'detection', AnomalyDetectionViewSet, basename='anomaly-detection')

app_name = 'anomaly_detection'

urlpatterns = [
    path('', include(router.urls)),
]
