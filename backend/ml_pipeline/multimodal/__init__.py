"""
Multimodal Prediction Module

Phase 6: Multimodal Prediction for AI Prediction System

This module provides multimodal forecasting capabilities:
- Text encoding (BERT, RoBERTa)
- Image encoding (ResNet, ViT)
- Audio encoding (Whisper)
- Video encoding
- Multimodal fusion
"""

from .multimodal_forecaster import (
    MultimodalForecaster,
    MultimodalFusion,
    CrossModalAttention
)

from .encoders import (
    TextEncoder,
    ImageEncoder,
    AudioEncoder,
    VideoEncoder
)

__all__ = [
    'MultimodalForecaster',
    'MultimodalFusion',
    'CrossModalAttention',
    'TextEncoder',
    'ImageEncoder',
    'AudioEncoder',
    'VideoEncoder'
]

__version__ = '1.0.0'
