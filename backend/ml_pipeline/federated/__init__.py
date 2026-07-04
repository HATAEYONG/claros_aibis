"""
Federated Learning Module

Phase 7: Federated Learning for AI Prediction System

This module provides federated learning capabilities:
- Federated forecasting across multiple clients
- Secure aggregation (FedAvg, FedBuff)
- Privacy-preserving model training
- Client management and coordination
"""

from .federated_forecaster import (
    FederatedForecaster,
    FederatedClient,
    FedAvg,
    FedBuff
)

from .secure_aggregation import (
    SecureAggregator,
    DifferentialPrivacy
)

__all__ = [
    'FederatedForecaster',
    'FederatedClient',
    'FedAvg',
    'FedBuff',
    'SecureAggregator',
    'DifferentialPrivacy'
]

__version__ = '1.0.0'
