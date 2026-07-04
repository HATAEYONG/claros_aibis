"""
Integrated AI URL Configuration

URL routing for integrated AI module
"""

from django.urls import path
from . import api

app_name = 'integrated_ai'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health_check'),

    # Orchestration
    path('orchestrate/predict/', api.orchestrate_prediction, name='orchestrate_predict'),
    path('orchestrate/optimize/', api.auto_optimize, name='auto_optimize'),
    path('orchestrate/status/', api.get_system_status, name='system_status'),
    path('orchestrate/recommendations/', api.get_recommendations, name='recommendations'),

    # Meta-learning
    path('meta/train/', api.meta_train, name='meta_train'),
    path('meta/few_shot/', api.few_shot_adapt, name='few_shot_adapt'),
    path('meta/models/', api.list_models, name='list_models'),

    # Deployment
    path('deploy/', api.deploy_model, name='deploy_model'),
    path('deploy/rollback/', api.rollback_deployment, name='rollback_deployment'),

    # Observability
    path('metrics/record/', api.record_metric, name='record_metric'),
    path('metrics/health/', api.get_system_health, name='system_health'),
    path('metrics/summary/', api.get_metrics_summary, name='metrics_summary'),

    # Governance
    path('governance/compliance/', api.check_compliance, name='check_compliance'),
    path('governance/audit/', api.audit_model, name='audit_model'),
    path('governance/report/', api.get_governance_report, name='governance_report'),

    # Module info
    path('info/', api.get_integrated_ai_info, name='info'),
]
