"""
AutoML (Automatic Machine Learning) Module

Phase 5: AutoML for AI Prediction System

This module provides automated machine learning capabilities:
- AutoML: AutoGluon-based automatic model selection
- AutoFeatureEngineer: Automated feature engineering
- HPO: Hyperparameter optimization with Optuna
- AutoEnsemble: Automatic ensemble construction
"""

from .automl_forecaster import (
    AutoMLForecaster,
    AutoGluonForecaster,
    AutoEnsemble
)

from .auto_feature_engineer import (
    AutoFeatureEngineer,
    FeatureSelector,
    AutoPreprocessor
)

from .hpo import (
    HyperparameterOptimizer,
    OptunaOptimizer
)

__all__ = [
    'AutoMLForecaster',
    'AutoGluonForecaster',
    'AutoEnsemble',
    'AutoFeatureEngineer',
    'FeatureSelector',
    'AutoPreprocessor',
    'HyperparameterOptimizer',
    'OptunaOptimizer'
]

__version__ = '1.0.0'
