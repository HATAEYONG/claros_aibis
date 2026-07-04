# ML Pipeline XAI URL Configuration
# 설명 가능 AI API 엔드포인트

from django.urls import path
from . import api as xai_api

app_name = 'xai'

urlpatterns = [
    # XAI Service
    path('health/', xai_api.xai_health_check, name='xai-health'),

    # SHAP Explanations
    path('explain/prediction/', xai_api.explain_prediction, name='explain-prediction'),
    path('explain/batch/', xai_api.explain_batch, name='explain-batch'),
    path('importance/global/', xai_api.get_global_importance, name='global-importance'),
    path('importance/permutation/', xai_api.compute_permutation_importance, name='permutation-importance'),

    # Attention Visualization
    path('visualize/attention/', xai_api.visualize_attention, name='visualize-attention'),

    # XAI Reports
    path('report/generate/', xai_api.generate_xai_report, name='generate-xai-report'),

    # Variable Selection
    path('importance/variables/', xai_api.get_variable_importance, name='variable-importance'),

    # Comparison
    path('compare/predictions/', xai_api.compare_predictions, name='compare-predictions'),
]
