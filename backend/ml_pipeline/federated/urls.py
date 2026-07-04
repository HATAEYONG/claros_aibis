"""
Federated Learning URL Configuration

URL routing for federated learning API endpoints
"""

from django.urls import path
from . import api

app_name = 'federated'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health'),

    # System management
    path('initialize/', api.initialize_system, name='initialize'),
    path('register_client/', api.register_client, name='register_client'),

    # Training and prediction
    path('train_round/', api.train_round, name='train_round'),
    path('predict/', api.federated_predict, name='predict'),

    # Information
    path('system_info/', api.system_info, name='system_info'),
    path('client_info/', api.client_info, name='client_info'),

    # Privacy and security
    path('secure_aggregate/', api.secure_aggregate, name='secure_aggregate'),
    path('add_dp_noise/', api.add_dp_noise, name='add_dp_noise'),

    # General information
    path('info/', api.federated_info, name='info'),
    path('systems/', api.list_systems, name='list_systems'),
]
