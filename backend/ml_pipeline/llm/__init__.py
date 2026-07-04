"""
LLM-based Forecasting Module

Phase 4: LLM Integration for AI Prediction System

This module provides foundation model-based forecasting capabilities:
- TimeGPT (Nixtla)
- Chronos (Amazon)
- GPT-4T (OpenAI)
- Local LLM support
"""

from .llm_forecaster import (
    LLMForecaster,
    TimeGPTForecaster,
    PromptEngineer,
    MultimodalLLMForecaster
)

__all__ = [
    'LLMForecaster',
    'TimeGPTForecaster',
    'PromptEngineer',
    'MultimodalLLMForecaster'
]

__version__ = '1.0.0'
