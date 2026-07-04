"""
Knowledge Graph-based Prediction Module

Phase 8: Knowledge Graph for AI Prediction System

This module provides knowledge graph capabilities:
- Neural Graph Forecaster (GNN-based forecasting)
- Knowledge Graph management
- Causal inference
- Graph feature extraction
"""

from .graph_forecaster import (
    NeuralGraphForecaster,
    GraphNeuralNetwork,
    CausalInference
)

from .knowledge_graph import (
    KnowledgeGraph,
    GraphBuilder,
    CausalGraphBuilder
)

from .graph_features import (
    GraphFeatureExtractor,
    CausalFeatureExtractor
)

__all__ = [
    'NeuralGraphForecaster',
    'GraphNeuralNetwork',
    'CausalInference',
    'KnowledgeGraph',
    'GraphBuilder',
    'CausalGraphBuilder',
    'GraphFeatureExtractor',
    'CausalFeatureExtractor'
]

__version__ = '1.0.0'
