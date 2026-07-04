# -*- coding: utf-8 -*-
"""
Security URL Configuration
보안 API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AuditLogViewSet, SecurityEventViewSet, LoginAttemptViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'events', SecurityEventViewSet, basename='security-event')
router.register(r'login-attempts', LoginAttemptViewSet, basename='login-attempt')

app_name = 'security'

urlpatterns = [
    path('', include(router.urls)),
]
