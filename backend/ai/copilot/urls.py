# -*- coding: utf-8 -*-
"""
Copilot URL 설정
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ai.copilot.views import ConversationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='copilot-conversation')
router.register(r'messages', MessageViewSet, basename='copilot-message')

app_name = 'copilot'

urlpatterns = [
    path('', include(router.urls)),
]
