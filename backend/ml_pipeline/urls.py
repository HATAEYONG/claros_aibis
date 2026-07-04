# -*- coding: utf-8 -*-
"""
ML Pipeline URL Configuration
ML Pipeline API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MLModelViewSet,
    TrainingJobViewSet,
    PredictionRequestViewSet,
    FeatureStoreViewSet,
    PipelineViewSet
)

# V1 API (기존)
router = DefaultRouter()
router.register(r'models', MLModelViewSet, basename='ml-model')
router.register(r'training-jobs', TrainingJobViewSet, basename='training-job')
router.register(r'predictions', PredictionRequestViewSet, basename='prediction-request')
router.register(r'features', FeatureStoreViewSet, basename='feature-store')
router.register(r'pipeline', PipelineViewSet, basename='ml-pipeline')

app_name = 'ml_pipeline'

urlpatterns = [
    # V1 API (기존)
    path('v1/', include(router.urls)),

    # V2 API (ML Pipeline Upgrade)
    path('', include('ml_pipeline.upgrade.urls')),

    # MLOps API
    path('mlops/', include('ml_pipeline.mlops.urls')),

    # XAI API
    path('xai/', include('ml_pipeline.xai.urls')),

    # LLM API (Phase 4)
    path('llm/', include('ml_pipeline.llm.urls')),

    # Model Optimization API (Phase 4)
    path('optimization/', include('ml_pipeline.optimization.urls')),

    # AutoML API (Phase 5)
    path('automl/', include('ml_pipeline.automl.urls')),

    # Multimodal API (Phase 6)
    path('multimodal/', include('ml_pipeline.multimodal.urls')),

    # Federated Learning API (Phase 7)
    path('federated/', include('ml_pipeline.federated.urls')),

    # Knowledge Graph API (Phase 8)
    path('knowledge_graph/', include('ml_pipeline.knowledge_graph.urls')),

    # Reinforcement Learning API (Phase 9)
    path('reinforcement_learning/', include('ml_pipeline.reinforcement_learning.urls')),

    # Integrated AI API (Phase 10)
    path('integrated_ai/', include('ml_pipeline.integrated_ai.urls')),

    # Next Generation AI API (Phase 11)
    path('next_gen_ai/', include('ml_pipeline.next_gen_ai.urls')),
]
