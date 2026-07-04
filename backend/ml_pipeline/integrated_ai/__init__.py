"""
Integrated AI System Module

Phase 10: Complete System Integration & Production Deployment

This module provides comprehensive AI system integration:
- Unified AI Orchestrator
- Meta-Learning capabilities
- Production deployment automation
- Complete observability
- AI governance
"""

from .orchestrator import (
    AIOrchestrator,
    ModelRouter,
    AutoPipeline,
    PredictionPipeline
)

from .meta_learning import (
    MetaLearner,
    ModelZoo,
    TransferLearning,
    FewShotLearning
)

from .deployment import (
    ModelDeployer,
    CanaryDeployer,
    BlueGreenDeployer,
    RollbackManager
)

from .observability import (
    SystemMonitor,
    AlertManager,
    DashboardGenerator,
    TelemetryCollector
)

from .governance import (
    AIGovernance,
    ModelAuditor,
    ComplianceChecker,
    EthicsMonitor
)

__all__ = [
    'AIOrchestrator',
    'ModelRouter',
    'AutoPipeline',
    'PredictionPipeline',
    'MetaLearner',
    'ModelZoo',
    'TransferLearning',
    'FewShotLearning',
    'ModelDeployer',
    'CanaryDeployer',
    'BlueGreenDeployer',
    'RollbackManager',
    'SystemMonitor',
    'AlertManager',
    'DashboardGenerator',
    'TelemetryCollector',
    'AIGovernance',
    'ModelAuditor',
    'ComplianceChecker',
    'EthicsMonitor'
]

__version__ = '1.0.0'
