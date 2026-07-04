"""
Model Optimization API

REST API endpoints for model optimization
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

import os
import json
import torch
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import tempfile
import shutil

from .model_optimizer import (
    ModelOptimizer,
    TensorRTInferenceEngine,
    create_student_model,
    optimize_for_inference
)

logger = logging.getLogger(__name__)

# Global optimizer instances
_optimizers: Dict[str, ModelOptimizer] = {}


def get_optimizer(model_id: str, model: torch.nn.Module) -> ModelOptimizer:
    """Get or create model optimizer instance"""
    if model_id not in _optimizers:
        _optimizers[model_id] = ModelOptimizer(model)
    return _optimizers[model_id]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """Optimization module health check"""
    torch_available = torch.cuda.is_available() if torch.is_available() else False

    return Response({
        'status': 'healthy',
        'module': 'Model Optimization',
        'version': '1.0.0',
        'torch_version': torch.__version__ if torch.is_available() else None,
        'cuda_available': torch_available,
        'cuda_device_count': torch.cuda.device_count() if torch_available else 0,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def optimize_quantize(request):
    """
    Quantize model (FP32 → FP16/INT8)

    POST /api/ml-pipeline/optimization/quantize/

    Body:
    {
        "model_id": "tft_v1",
        "quant_type": "dynamic",  // dynamic, static, fp16
        "dtype": "qint8",  // qint8, quint8, fp16
        "calibration_data": [...]  // required for static quantization
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        quant_type = data.get('quant_type', 'dynamic')
        dtype_str = data.get('dtype', 'qint8')

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Map dtype string to torch dtype
        dtype_map = {
            'qint8': torch.qint8,
            'quint8': torch.quint8,
            'fp16': torch.float16
        }
        dtype = dtype_map.get(dtype_str, torch.qint8)

        # Prepare calibration data if provided
        calibration_data = None
        if data.get('calibration_data'):
            calibration_data = torch.tensor(
                data['calibration_data'],
                dtype=torch.float32
            )

        # Create dummy model for demonstration
        # In production, load actual model from registry
        dummy_model = torch.nn.Sequential(
            torch.nn.Linear(10, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )

        optimizer = ModelOptimizer(dummy_model)

        # Get original size
        original_size = optimizer._get_model_size()

        # Quantize
        quantized_model = optimizer.quantize(
            calibration_data=calibration_data,
            quant_type=quant_type,
            dtype=dtype
        )

        # Get new size
        quantized_size = optimizer._get_model_size(model=quantized_model)

        # Calculate compression ratio
        compression_ratio = original_size / quantized_size if quantized_size > 0 else 0

        # Save quantized model
        model_path = f'optimized_models/{model_id}_quantized_{quant_type}.pt'
        os.makedirs('optimized_models', exist_ok=True)
        torch.save(quantized_model.state_dict(), model_path)

        return Response({
            'success': True,
            'model_id': model_id,
            'quantization_type': quant_type,
            'dtype': dtype_str,
            'original_size_mb': round(original_size / (1024 * 1024), 2),
            'quantized_size_mb': round(quantized_size / (1024 * 1024), 2),
            'compression_ratio': round(compression_ratio, 2),
            'size_reduction_pct': round((1 - 1/compression_ratio) * 100, 2),
            'model_path': model_path,
            'optimized_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Quantization error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def optimize_prune(request):
    """
    Prune model (remove connections)

    POST /api/ml-pipeline/optimization/prune/

    Body:
    {
        "model_id": "tft_v1",
        "sparsity": 0.3,  // 30% of connections removed
        "method": "l1_unstructured",  // l1_unstructured, l1_structured, random
        "finetune_epochs": 5,
        "finetune_lr": 0.001
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        sparsity = float(data.get('sparsity', 0.3))
        method = data.get('method', 'l1_unstructured')
        finetune_epochs = int(data.get('finetune_epochs', 5))

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not 0 < sparsity < 1:
            return Response({
                'error': 'sparsity must be between 0 and 1'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create dummy model
        dummy_model = torch.nn.Sequential(
            torch.nn.Linear(10, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )

        optimizer = ModelOptimizer(dummy_model)

        # Get original size and parameter count
        original_params = sum(p.numel() for p in dummy_model.parameters())

        # Prune
        pruned_model = optimizer.prune(
            sparsity=sparsity,
            method=method,
            finetune_epochs=finetune_epochs
        )

        # Get new parameter count
        pruned_params = sum(p.numel() for p in pruned_model.parameters() if p.requires_grad)

        # Calculate sparsity achieved
        achieved_sparsity = 1 - (pruned_params / original_params)

        # Save pruned model
        model_path = f'optimized_models/{model_id}_pruned_{int(sparsity*100)}.pt'
        os.makedirs('optimized_models', exist_ok=True)
        torch.save(pruned_model.state_dict(), model_path)

        return Response({
            'success': True,
            'model_id': model_id,
            'target_sparsity': sparsity,
            'achieved_sparsity': round(achieved_sparsity, 4),
            'method': method,
            'original_parameters': original_params,
            'pruned_parameters': pruned_params,
            'parameters_removed': original_params - pruned_params,
            'finetune_epochs': finetune_epochs,
            'model_path': model_path,
            'optimized_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Pruning error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def optimize_distill(request):
    """
    Knowledge distillation (teacher → student)

    POST /api/ml-pipeline/optimization/distill/

    Body:
    {
        "teacher_model_id": "tft_large",
        "student_model_id": "tft_small",
        "temperature": 3.0,
        "alpha": 0.5,
        "epochs": 50,
        "train_data": [...]
    }
    """
    try:
        data = request.data
        teacher_model_id = data.get('teacher_model_id')
        student_model_id = data.get('student_model_id', 'student')
        temperature = float(data.get('temperature', 3.0))
        alpha = float(data.get('alpha', 0.5))
        epochs = int(data.get('epochs', 50))
        train_data = data.get('train_data', [])

        if not teacher_model_id:
            return Response({
                'error': 'teacher_model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create dummy teacher and student models
        teacher_model = torch.nn.Sequential(
            torch.nn.Linear(10, 128),
            torch.nn.ReLU(),
            torch.nn.Linear(128, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 1)
        )

        # Student model is smaller
        student_model = create_student_model(
            teacher_architecture='large',
            student_size='small'
        )

        optimizer = ModelOptimizer(teacher_model)

        # Get teacher size
        teacher_params = sum(p.numel() for p in teacher_model.parameters())

        # Prepare training data
        if train_data:
            X = torch.tensor([[d['x']] for d in train_data], dtype=torch.float32)
            y = torch.tensor([[d['y']] for d in train_data], dtype=torch.float32)
        else:
            # Dummy data
            X = torch.randn(100, 10)
            y = torch.randn(100, 1)

        # Distill
        student_model = optimizer.distill(
            teacher_model=teacher_model,
            student_data=(X, y),
            temperature=temperature,
            alpha=alpha,
            epochs=epochs
        )

        # Get student size
        student_params = sum(p.numel() for p in student_model.parameters())

        # Calculate compression
        compression_ratio = teacher_params / student_params

        # Save student model
        model_path = f'optimized_models/{student_model_id}_distilled.pt'
        os.makedirs('optimized_models', exist_ok=True)
        torch.save(student_model.state_dict(), model_path)

        return Response({
            'success': True,
            'teacher_model_id': teacher_model_id,
            'student_model_id': student_model_id,
            'temperature': temperature,
            'alpha': alpha,
            'epochs': epochs,
            'teacher_parameters': teacher_params,
            'student_parameters': student_params,
            'compression_ratio': round(compression_ratio, 2),
            'size_reduction_pct': round((1 - 1/compression_ratio) * 100, 2),
            'model_path': model_path,
            'optimized_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Distillation error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_onnx(request):
    """
    Convert model to ONNX format

    POST /api/ml-pipeline/optimization/convert_onnx/

    Body:
    {
        "model_id": "tft_v1",
        "input_shape": [1, 10],  // example input shape
        "opset_version": 14,
        "dynamic_axes": true
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        input_shape = data.get('input_shape', [1, 10])
        opset_version = int(data.get('opset_version', 14))
        dynamic_axes = data.get('dynamic_axes', True)

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create dummy model
        dummy_model = torch.nn.Sequential(
            torch.nn.Linear(10, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )
        dummy_model.eval()

        optimizer = ModelOptimizer(dummy_model)

        # Create dummy input
        dummy_input = torch.randn(*input_shape)

        # Define dynamic axes if enabled
        dynamic_axes_dict = None
        if dynamic_axes:
            dynamic_axes_dict = {
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }

        # Convert to ONNX
        onnx_path = f'optimized_models/{model_id}.onnx'
        os.makedirs('optimized_models', exist_ok=True)

        optimizer.convert_to_onnx(
            dummy_input=tuple(dummy_input.shape),
            onnx_path=onnx_path,
            opset_version=opset_version,
            dynamic_axes=dynamic_axes_dict,
            input_names=['input'],
            output_names=['output']
        )

        # Get file sizes
        pytorch_size = optimizer._get_model_size()
        onnx_size = os.path.getsize(onnx_path)

        return Response({
            'success': True,
            'model_id': model_id,
            'onnx_path': onnx_path,
            'input_shape': input_shape,
            'opset_version': opset_version,
            'dynamic_axes': dynamic_axes,
            'pytorch_size_mb': round(pytorch_size / (1024 * 1024), 2),
            'onnx_size_mb': round(onnx_size / (1024 * 1024), 2),
            'converted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"ONNX conversion error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_tensorrt(request):
    """
    Convert model to TensorRT engine (GPU only)

    POST /api/ml-pipeline/optimization/convert_tensorrt/

    Body:
    {
        "model_id": "tft_v1",
        "input_shape": [1, 10],
        "precision": "fp16",  // fp32, fp16, int8
        "max_batch_size": 16
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        input_shape = data.get('input_shape', [1, 10])
        precision = data.get('precision', 'fp16')
        max_batch_size = int(data.get('max_batch_size', 16))

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check CUDA availability
        if not torch.cuda.is_available():
            return Response({
                'error': 'CUDA is not available. TensorRT conversion requires GPU.',
                'cuda_available': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if TensorRT is available
        try:
            import tensorrt as trt
        except ImportError:
            return Response({
                'error': 'TensorRT is not installed. Install with: pip install tensorrt',
                'tensorrt_available': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create dummy model
        dummy_model = torch.nn.Sequential(
            torch.nn.Linear(10, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )
        dummy_model.eval()
        dummy_model = dummy_model.cuda()

        # Create TensorRT engine
        engine_path = f'optimized_models/{model_id}_tensorrt.engine'
        os.makedirs('optimized_models', exist_ok=True)

        inference_engine = TensorRTInferenceEngine(
            model=dummy_model,
            input_shape=tuple(input_shape),
            precision=precision
        )

        inference_engine.build_engine(
            onnx_path=f'optimized_models/{model_id}.onnx',
            engine_path=engine_path,
            max_batch_size=max_batch_size
        )

        return Response({
            'success': True,
            'model_id': model_id,
            'engine_path': engine_path,
            'input_shape': input_shape,
            'precision': precision,
            'max_batch_size': max_batch_size,
            'tensorrt_version': trt.__version__,
            'expected_speedup': '5-10x',
            'converted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"TensorRT conversion error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def benchmark_inference(request):
    """
    Benchmark inference speed before/after optimization

    POST /api/ml-pipeline/optimization/benchmark/

    Body:
    {
        "model_id": "tft_v1",
        "optimizations": ["quantized", "onnx"],
        "input_shape": [1, 10],
        "num_runs": 100,
        "warmup_runs": 10
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        optimizations = data.get('optimizations', ['quantized'])
        input_shape = data.get('input_shape', [1, 10])
        num_runs = int(data.get('num_runs', 100))
        warmup_runs = int(data.get('warmup_runs', 10))

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create dummy model
        dummy_model = torch.nn.Sequential(
            torch.nn.Linear(10, 64),
            torch.nn.ReLU(),
            torch.nn.Linear(64, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 1)
        )
        dummy_model.eval()

        optimizer = ModelOptimizer(dummy_model)

        # Run benchmark
        results = optimizer.benchmark_inference(
            dummy_input=torch.randn(*input_shape),
            num_runs=num_runs,
            warmup_runs=warmup_runs,
            compare_with=optimizations
        )

        return Response({
            'success': True,
            'model_id': model_id,
            'input_shape': input_shape,
            'num_runs': num_runs,
            'warmup_runs': warmup_runs,
            'benchmarks': results,
            'summary': {
                'original_latency_ms': results.get('original', {}).get('mean_latency_ms'),
                'optimized_latency_ms': results.get('optimized', {}).get('mean_latency_ms'),
                'speedup': results.get('speedup')
            },
            'benchmarked_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Benchmark error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def optimization_info(request):
    """
    Get information about available optimization techniques

    GET /api/ml-pipeline/optimization/info/
    """
    optimization_info = {
        'quantization': {
            'description': 'Reduce model precision (FP32 → FP16/INT8)',
            'techniques': {
                'dynamic': {
                    'description': 'Dynamic quantization during inference',
                    'benefits': ['4x model size reduction', '2-3x speedup'],
                    'limitations': ['Limited to linear layers', 'No retraining required']
                },
                'static': {
                    'description': 'Static quantization with calibration',
                    'benefits': ['Best accuracy', '4x model size reduction', '2-4x speedup'],
                    'limitations': ['Requires calibration data', 'Longer setup time']
                },
                'fp16': {
                    'description': 'Half-precision floating point',
                    'benefits': ['2x model size reduction', 'GPU acceleration'],
                    'limitations': ['Minimal accuracy loss', 'Requires GPU support']
                }
            }
        },
        'pruning': {
            'description': 'Remove unimportant model connections',
            'techniques': {
                'l1_unstructured': {
                    'description': 'Remove weights with smallest L1 norm',
                    'benefits': ['30-50% size reduction', 'Faster inference'],
                    'limitations': ['May require fine-tuning', 'Irregular sparsity']
                },
                'l1_structured': {
                    'description': 'Remove entire channels/filters',
                    'benefits': ['Regular sparsity', 'Hardware acceleration'],
                    'limitations': ['Higher accuracy loss', 'Requires careful tuning']
                }
            }
        },
        'distillation': {
            'description': 'Train smaller student model from larger teacher',
            'techniques': {
                'standard': {
                    'description': 'Knowledge distillation with temperature scaling',
                    'benefits': ['Significant size reduction', 'Good accuracy retention'],
                    'limitations': ['Requires training time', 'Hyperparameter tuning']
                }
            }
        },
        'format_conversion': {
            'description': 'Convert to optimized inference formats',
            'techniques': {
                'onnx': {
                    'description': 'Open Neural Network Exchange format',
                    'benefits': ['Cross-framework', 'Optimization tools', 'Hardware acceleration'],
                    'limitations': ['Limited operator support']
                },
                'tensorrt': {
                    'description': 'NVIDIA GPU optimization',
                    'benefits': ['5-10x speedup', 'Low latency', 'GPU-optimized'],
                    'limitations': ['NVIDIA GPU required', 'Proprietary format']
                }
            }
        }
    }

    hardware_info = {
        'cuda_available': torch.cuda.is_available() if torch.is_available() else False,
        'cuda_device_count': torch.cuda.device_count() if torch.cuda.is_available() else 0,
        'cuda_device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() and torch.cuda.device_count() > 0 else None
    }

    return Response({
        'success': True,
        'optimizations': optimization_info,
        'hardware_info': hardware_info,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_optimized_models(request):
    """
    List all optimized models

    GET /api/ml-pipeline/optimization/models/
    """
    optimized_dir = 'optimized_models'
    models = []

    if os.path.exists(optimized_dir):
        for filename in os.listdir(optimized_dir):
            filepath = os.path.join(optimized_dir, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                models.append({
                    'filename': filename,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })

    models.sort(key=lambda x: x['modified_at'], reverse=True)

    return Response({
        'success': True,
        'models': models,
        'total_count': len(models),
        'timestamp': datetime.now().isoformat()
    })
