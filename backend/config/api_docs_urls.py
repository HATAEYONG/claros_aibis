# -*- coding: utf-8 -*-
"""
API Documentation URLs
API 문서화 URL 설정
"""
from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

app_name = 'api_docs'

urlpatterns = [
    # OpenAPI Schema
    path('schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI
    path('swagger/', SpectacularSwaggerView.as_view(url_name='api_docs:schema'), name='swagger-ui'),

    # ReDoc UI
    path('redoc/', SpectacularRedocView.as_view(url_name='api_docs:schema'), name='redoc'),
]
