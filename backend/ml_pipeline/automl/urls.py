"""
AutoML URL Configuration

URL routing for AutoML API endpoints
"""

from django.urls import path
from . import api

app_name = 'automl'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health'),

    # Training and prediction
    path('train/', api.automl_train, name='train'),
    path('predict/', api.automl_predict, name='predict'),
    path('leaderboard/', api.automl_leaderboard, name='leaderboard'),

    # Ensemble
    path('ensemble/', api.auto_ensemble, name='ensemble'),

    # Feature engineering
    path('features/', api.auto_feature_engineering, name='features'),
    path('features/select/', api.feature_selection, name='feature_selection'),

    # Hyperparameter optimization
    path('hpo/', api.hyperparameter_optimization, name='hpo'),

    # Preprocessing
    path('preprocess/', api.auto_preprocess, name='preprocess'),

    # Information
    path('info/', api.automl_info, name='info'),
    path('models/', api.list_models, name='list_models'),
]
