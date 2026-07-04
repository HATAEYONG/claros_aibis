"""
URL Configuration for Next Generation AI API

Phase 11: Next-Generation AI Technologies
"""

from django.urls import path
from . import api

app_name = 'next_gen_ai'

urlpatterns = [
    # Health and Info
    path('health/', api.health_check, name='health_check'),
    path('info/', api.info, name='info'),

    # Diffusion Models (4 endpoints)
    path('diffusion/train/', api.diffusion_train, name='diffusion_train'),
    path('diffusion/predict/', api.diffusion_predict, name='diffusion_predict'),

    # Neural Architecture Search (2 endpoints)
    path('nas/search/', api.nas_search, name='nas_search'),
    path('nas/best-architecture/', api.nas_best_architecture, name='nas_best_architecture'),

    # Advanced Causal ML (3 endpoints)
    path('causal/discover/', api.causal_discover, name='causal_discover'),
    path('causal/estimate-effect/', api.causal_estimate_effect, name='causal_estimate_effect'),
    path('causal/counterfactual/', api.causal_counterfactual, name='causal_counterfactual'),

    # Multi-Agent Systems (4 endpoints)
    path('multi-agent/create/', api.multi_agent_create, name='multi_agent_create'),
    path('multi-agent/train/', api.multi_agent_train, name='multi_agent_train'),
    path('multi-agent/predict/', api.multi_agent_predict, name='multi_agent_predict'),
    path('multi-agent/status/', api.multi_agent_status, name='multi_agent_status'),

    # Edge AI (4 endpoints)
    path('edge/optimize/', api.edge_optimize, name='edge_optimize'),
    path('edge/compile/', api.edge_compile, name='edge_compile'),
    path('edge/quantize/', api.edge_quantize, name='edge_quantize'),
    path('edge/deploy/', api.edge_deploy, name='edge_deploy'),

    # Digital Twin (4 endpoints)
    path('digital-twin/create/', api.digital_twin_create, name='digital_twin_create'),
    path('digital-twin/sync/', api.digital_twin_sync, name='digital_twin_sync'),
    path('digital-twin/simulate/', api.digital_twin_simulate, name='digital_twin_simulate'),
    path('digital-twin/status/', api.digital_twin_status, name='digital_twin_status'),

    # Quantum ML (3 endpoints)
    path('quantum/convert/', api.quantum_convert, name='quantum_convert'),
    path('quantum/optimize/', api.quantum_optimize, name='quantum_optimize'),
    path('quantum/map-qubits/', api.quantum_map_qubits, name='quantum_map_qubits'),
]
