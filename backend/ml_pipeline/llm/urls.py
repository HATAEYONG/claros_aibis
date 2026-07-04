"""
LLM Forecasting URL Configuration

URL routing for LLM-based forecasting API endpoints
"""

from django.urls import path
from . import api

app_name = 'llm'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health'),

    # Prediction endpoints
    path('predict/', api.llm_predict, name='predict'),
    path('predict_batch/', api.llm_predict_batch, name='predict_batch'),
    path('compare/', api.llm_compare_models, name='compare_models'),

    # Multimodal
    path('multimodal_predict/', api.llm_multimodal_predict, name='multimodal_predict'),

    # Prompt engineering
    path('generate_prompt/', api.llm_generate_prompt, name='generate_prompt'),

    # Model information
    path('models/info/', api.llm_model_info, name='model_info'),

    # Fine-tuning (future)
    path('fine_tune/', api.llm_fine_tune, name='fine_tune'),
]
