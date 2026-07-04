"""
Multimodal Prediction URL Configuration

URL routing for multimodal prediction API endpoints
"""

from django.urls import path
from . import api

app_name = 'multimodal'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health'),

    # Training and prediction
    path('train/', api.multimodal_train, name='train'),
    path('predict/', api.multimodal_predict, name='predict'),

    # Encoding endpoints
    path('encode/text/', api.encode_text, name='encode_text'),
    path('encode/image/', api.encode_image, name='encode_image'),
    path('encode/audio/', api.encode_audio, name='encode_audio'),
    path('encode/video/', api.encode_video, name='encode_video'),

    # Fusion
    path('fusion/', api.fusion_features, name='fusion'),

    # Information
    path('info/', api.multimodal_info, name='info'),
    path('models/', api.list_models, name='list_models'),
]
