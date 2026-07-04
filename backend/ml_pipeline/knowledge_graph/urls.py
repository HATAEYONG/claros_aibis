"""
Knowledge Graph URL Configuration

URL routing for knowledge graph module
"""

from django.urls import path
from . import api

app_name = 'knowledge_graph'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health_check'),

    # Training and prediction
    path('train/', api.train_graph_forecaster, name='train'),
    path('predict/', api.graph_predict, name='predict'),

    # Causal inference
    path('causality/discover/', api.discover_causality, name='discover_causality'),
    path('causality/explain/', api.explain_causal_path, name='explain_causal_path'),
    path('causality/effect/', api.compute_causal_effect, name='compute_causal_effect'),

    # Knowledge graph operations
    path('graph/build/', api.build_knowledge_graph, name='build_graph'),
    path('graph/path/', api.get_graph_path, name='get_path'),

    # Feature extraction
    path('features/graph/', api.extract_graph_features, name='extract_graph_features'),
    path('features/causal/', api.extract_causal_features, name='extract_causal_features'),

    # Module info
    path('info/', api.get_knowledge_graph_info, name='info'),
]
