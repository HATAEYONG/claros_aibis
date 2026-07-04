"""
Model Optimization Module

Phase 4: Model Optimization for AI Prediction System

This module provides model optimization capabilities:
- Quantization (FP32 → FP16/INT8)
- Pruning (sparsity optimization)
- Knowledge Distillation
- ONNX/TensorRT conversion
"""

from .model_optimizer import (
    ModelOptimizer,
    TensorRTInferenceEngine,
    create_student_model,
    optimize_for_inference
)

__all__ = [
    'ModelOptimizer',
    'TensorRTInferenceEngine',
    'create_student_model',
    'optimize_for_inference'
]

__version__ = '1.0.0'
