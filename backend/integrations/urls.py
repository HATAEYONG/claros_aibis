# -*- coding: utf-8 -*-
"""
External Integration URL Configuration
외부 연동 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IntegrationConfigViewSet,
    IntegrationLogViewSet,
    WebhookConfigViewSet,
    WebhookDeliveryViewSet,
    DataExchangeViewSet,
    IntegrationViewSet
)

router = DefaultRouter()
router.register(r'configs', IntegrationConfigViewSet, basename='integration-config')
router.register(r'logs', IntegrationLogViewSet, basename='integration-log')
router.register(r'webhooks', WebhookConfigViewSet, basename='webhook-config')
router.register(r'webhook-deliveries', WebhookDeliveryViewSet, basename='webhook-delivery')
router.register(r'exchanges', DataExchangeViewSet, basename='data-exchange')
router.register(r'integration', IntegrationViewSet, basename='integration')

app_name = 'integrations'

urlpatterns = [
    path('', include(router.urls)),
]
