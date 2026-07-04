# -*- coding: utf-8 -*-
"""
WebSocket URL routing for Claros MIS

Real-time data streaming via WebSocket
"""
from django.urls import re_path

from .ws_consumers import (
    DashboardConsumer,
    KPIConsumer,
    NotificationConsumer,
)

websocket_urlpatterns = [
    re_path(r'ws/dashboard/$', DashboardConsumer.as_asgi()),
    re_path(r'ws/kpi/$', KPIConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]
