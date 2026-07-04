"""
Next-Generation AI Module

Phase 11: Next-Generation AI Technologies for Time Series

This module provides cutting-edge AI capabilities:
- Diffusion Models for time series generation
- Neural Architecture Search (NAS)
- Advanced Causal ML
- Multi-Agent Systems
- Edge AI & TinyML
- Digital Twin Integration
"""

from .diffusion_forecaster import (
    DiffusionForecaster,
    TimeSeriesDiffusion,
    ConditionalDiffusion,
    DDPMScheduler,
    DDIMScheduler
)

from .neural_architecture_search import (
    NeuralArchitectureSearch,
    EvolutionaryNAS,
    DARTSNAS,
    ProxyNAS
)

from .advanced_causal import (
    AdvancedCausalLearner,
    CausalDiscovery,
    CausalEffectEstimator,
    CounterfactualPredictor
)

from .multi_agent import (
    MultiAgentSystem,
    ForecastingAgent,
    CoordinatorAgent,
    AgentCommunication
)

from .edge_ai import (
    EdgeAIOptimizer,
    TinyMLCompiler,
    ModelQuantizer,
    EdgeDeployer
)

from .digital_twin import (
    DigitalTwin,
    SimulationEngine,
    TwinSync,
    WhatIfAnalyzer
)

from .quantum_ready import (
    QuantumMLConverter,
    QuantumInspiredOptimizer,
    QubitMapper
)

__all__ = [
    'DiffusionForecaster',
    'TimeSeriesDiffusion',
    'ConditionalDiffusion',
    'DDPMScheduler',
    'DDIMScheduler',
    'NeuralArchitectureSearch',
    'EvolutionaryNAS',
    'DARTSNAS',
    'ProxyNAS',
    'AdvancedCausalLearner',
    'CausalDiscovery',
    'CausalEffectEstimator',
    'CounterfactualPredictor',
    'MultiAgentSystem',
    'ForecastingAgent',
    'CoordinatorAgent',
    'AgentCommunication',
    'EdgeAIOptimizer',
    'TinyMLCompiler',
    'ModelQuantizer',
    'EdgeDeployer',
    'DigitalTwin',
    'SimulationEngine',
    'TwinSync',
    'WhatIfAnalyzer',
    'QuantumMLConverter',
    'QuantumInspiredOptimizer',
    'QubitMapper'
]

__version__ = '11.0.0'
