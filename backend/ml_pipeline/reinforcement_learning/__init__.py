"""
Reinforcement Learning-based Adaptive Forecasting Module

Phase 9: Reinforcement Learning for AI Prediction System

This module provides RL-based forecasting capabilities:
- RL-based forecasting (DQN, PPO, A3C)
- Adaptive learning with online updates
- Reward-based model selection
- Dynamic ensemble weights
- RL agent for hyperparameter tuning
"""

from .rl_forecaster import (
    RLForecaster,
    DQNAgent,
    PPOAgent,
    A3CAgent,
    ModelSelectionAgent,
    AdaptiveEnsemble
)

from .adaptive_learning import (
    AdaptiveLearner,
    OnlineModelUpdater,
    ConceptDriftDetector,
    PerformanceMonitor
)

from .reward_system import (
    RewardCalculator,
    ForecastingReward,
    AccuracyReward,
    BusinessReward
)

__all__ = [
    'RLForecaster',
    'DQNAgent',
    'PPOAgent',
    'A3CAgent',
    'ModelSelectionAgent',
    'AdaptiveEnsemble',
    'AdaptiveLearner',
    'OnlineModelUpdater',
    'ConceptDriftDetector',
    'PerformanceMonitor',
    'RewardCalculator',
    'ForecastingReward',
    'AccuracyReward',
    'BusinessReward'
]

__version__ = '1.0.0'
