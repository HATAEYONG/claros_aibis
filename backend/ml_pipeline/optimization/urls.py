"""
Model Optimization URL Configuration

URL routing for model optimization API endpoints
"""

from django.urls import path
from . import api

app_name = 'optimization'

urlpatterns = [
    # Health check
    path('health/', api.health_check, name='health'),

    # Optimization endpoints
    path('quantize/', api.optimize_quantize, name='quantize'),
    path('prune/', api.optimize_prune, name='prune'),
    path('distill/', api.optimize_distill, name='distill'),

    # Format conversion
    path('convert_onnx/', api.convert_onnx, name='convert_onnx'),
    path('convert_tensorrt/', api.convert_tensorrt, name='convert_tensorrt'),

    # Benchmarking
    path('benchmark/', api.benchmark_inference, name='benchmark'),

    # Information
    path('info/', api.optimization_info, name='info'),
    path('models/', api.list_optimized_models, name='list_models'),
]
