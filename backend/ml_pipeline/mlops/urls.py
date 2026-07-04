# ML Pipeline MLOps URL Configuration
# MLOps API 엔드포인트

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import api as mlops_api

app_name = 'mlops'

urlpatterns = [
    # Model Registry
    path('registry/health/', mlops_api.registry_health_check, name='registry-health'),
    path('registry/models/', mlops_api.list_models, name='list-models'),
    path('registry/models/<str:model_name>/', mlops_api.get_model_detail, name='get-model-detail'),
    path('registry/models/transition/', mlops_api.transition_model_stage, name='transition-model-stage'),
    path('registry/models/compare/', mlops_api.compare_models, name='compare-models'),

    # A/B Testing
    path('ab-testing/create/', mlops_api.create_ab_test, name='create-ab-test'),
    path('ab-testing/<str:test_id>/start/', mlops_api.start_ab_test, name='start-ab-test'),
    path('ab-testing/<str:test_id>/result/', mlops_api.get_ab_test_result, name='get-ab-test-result'),
    path('ab-testing/list/', mlops_api.list_ab_tests, name='list-ab-tests'),

    # Model Monitoring
    path('monitoring/start/', mlops_api.start_monitoring, name='start-monitoring'),
    path('monitoring/record/', mlops_api.record_prediction, name='record-prediction'),
    path('monitoring/metrics/', mlops_api.get_metrics_summary, name='get-metrics-summary'),
    path('monitoring/alerts/', mlops_api.get_alerts, name='get-alerts'),

    # CI/CD Pipeline
    path('pipeline/trigger/', mlops_api.trigger_pipeline, name='trigger-pipeline'),
    path('pipeline/runs/<str:run_id>/', mlops_api.get_pipeline_run, name='get-pipeline-run'),
    path('pipeline/runs/list/', mlops_api.list_pipeline_runs, name='list-pipeline-runs'),
]
