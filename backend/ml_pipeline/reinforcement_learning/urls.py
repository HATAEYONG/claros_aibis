"""
Reinforcement Learning URL Configuration

URL routing for reinforcement learning module
"""

from django.urls import path
from . import api

app_name = 'reinforcement_learning'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health_check'),

    # Training and prediction
    path('train/', api.train_rl_forecaster, name='train'),
    path('predict/', api.rl_predict, name='predict'),

    # Adaptive learning
    path('adapt/', api.adapt_model, name='adapt_model'),
    path('adapt/stats/', api.get_adaptation_stats, name='adaptation_stats'),

    # Concept drift detection
    path('drift/detect/', api.detect_drift, name='detect_drift'),
    path('drift/stats/', api.get_drift_stats, name='drift_stats'),

    # Performance monitoring
    path('performance/update/', api.update_performance, name='update_performance'),
    path('performance/summary/', api.get_performance_summary, name='performance_summary'),

    # Model selection and ensemble
    path('select_model/', api.select_model, name='select_model'),
    path('ensemble/update_weights/', api.update_ensemble_weights, name='update_ensemble_weights'),

    # Reward calculation
    path('reward/calculate/', api.calculate_reward, name='calculate_reward'),

    # Module info
    path('info/', api.get_rl_info, name='info'),
]
