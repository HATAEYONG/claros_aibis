"""
Business Process URL Configuration
O2C, P2P 프로세스 관리 API URL 라우팅
"""
from django.urls import path
from .views import (
    o2c_stages, o2c_orders,
    p2p_stages, p2p_orders
)
from . import ai_analytics

urlpatterns = [
    # O2C (Order to Cash) API
    path('o2c/stages/', o2c_stages, name='o2c-stages'),
    path('o2c/orders/', o2c_orders, name='o2c-orders'),

    # P2P (Procure to Pay) API
    path('p2p/stages/', p2p_stages, name='p2p-stages'),
    path('p2p/orders/', p2p_orders, name='p2p-orders'),

    # AI Analytics API
    path('ai/o2c/predictions/', ai_analytics.o2c_predictions, name='o2c-predictions'),
    path('ai/p2p/predictions/', ai_analytics.p2p_predictions, name='p2p-predictions'),
    path('ai/optimization/', ai_analytics.process_optimization, name='process-optimization'),
    path('ai/anomaly-detection/', ai_analytics.anomaly_detection, name='anomaly-detection'),
]
