"""
Edge AI & TinyML

Optimization and deployment of ML models for edge devices
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
import logging
import json
import hashlib

logger = logging.getLogger(__name__)

# Try to import edge AI libraries
EDGE_AI_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    EDGE_AI_AVAILABLE = True
except ImportError:
    pass

try:
    import tensorflow as tf
    EDGE_AI_AVAILABLE = True
except ImportError:
    pass


class EdgeAIOptimizer:
    """
    Edge AI Optimizer

    Optimizes ML models for edge deployment
    """

    def __init__(
        self,
        target_device: str = 'microcontroller',
        max_memory_kb: int = 256,
        max_flash_kb: int = 512,
        inference_time_ms: float = 100
    ):
        """
        Initialize Edge AI Optimizer

        Args:
            target_device: Target device type ('microcontroller', 'mobile', 'iot')
            max_memory_kb: Maximum RAM in KB
            max_flash_kb: Maximum flash storage in KB
            inference_time_ms: Maximum inference time in ms
        """
        self.target_device = target_device
        self.max_memory_kb = max_memory_kb
        self.max_flash_kb = max_flash_kb
        self.inference_time_ms = inference_time_ms

        self.optimization_history = []

        logger.info(f"EdgeAIOptimizer initialized for {target_device}")

    def optimize(
        self,
        model_config: Dict[str, Any],
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize model for edge deployment

        Args:
            model_config: Model configuration
            constraints: Additional constraints

        Returns:
            Optimization results
        """
        logger.info(f"Optimizing model for {self.target_device}")

        if constraints is None:
            constraints = {}

        # Apply optimizations
        quantizer = ModelQuantizer(
            quantization_type=constraints.get('quantization', 'int8'),
            per_channel=constraints.get('per_channel', False)
        )

        quantized_model = quantizer.quantize(model_config)

        # Estimate size
        size_kb = self._estimate_model_size(quantized_model)

        # Check constraints
        meets_constraints = (
            size_kb <= self.max_flash_kb and
            self._estimate_memory(quantized_model) <= self.max_memory_kb
        )

        result = {
            'original_config': model_config,
            'optimized_config': quantized_model,
            'estimated_size_kb': size_kb,
            'estimated_memory_kb': self._estimate_memory(quantized_model),
            'estimated_inference_time_ms': self._estimate_inference_time(quantized_model),
            'meets_constraints': meets_constraints,
            'target_device': self.target_device,
            'optimized_at': datetime.now().isoformat()
        }

        self.optimization_history.append(result)

        return result

    def _estimate_model_size(self, model_config: Dict[str, Any]) -> float:
        """Estimate model size in KB"""
        # Simple estimation based on parameters
        total_params = 0

        if 'layers' in model_config:
            for layer in model_config['layers']:
                if 'units' in layer:
                    total_params += layer['units']
                if 'input_dim' in layer and 'units' in layer:
                    total_params += layer['input_dim'] * layer['units']

        # Assume 4 bytes per parameter (float32), convert to KB
        size_bytes = total_params * 4
        size_kb = size_bytes / 1024

        return size_kb

    def _estimate_memory(self, model_config: Dict[str, Any]) -> float:
        """Estimate runtime memory in KB"""
        # Memory for activations + parameters
        size = self._estimate_model_size(model_config)
        # Add buffer for activations
        return size * 1.5

    def _estimate_inference_time(self, model_config: Dict[str, Any]) -> float:
        """Estimate inference time in ms"""
        # Rough estimation based on FLOPs
        flops = 0

        if 'layers' in model_config:
            for layer in model_config['layers']:
                if 'units' in layer:
                    flops += layer['units'] * 2  # Multiply-add

        # Assume 1 MFLOP per ms on edge device
        return flops / 1_000_000

    def suggest_optimizations(
        self,
        model_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Suggest optimizations for edge deployment

        Args:
            model_config: Model configuration

        Returns:
            List of optimization suggestions
        """
        suggestions = []

        # Analyze model
        size_kb = self._estimate_model_size(model_config)

        if size_kb > self.max_flash_kb:
            suggestions.append({
                'type': 'pruning',
                'description': 'Model size exceeds flash limit. Apply pruning to reduce parameters.',
                'priority': 'high',
                'expected_reduction': '50-70%'
            })

        if model_config.get('layers'):
            num_layers = len(model_config['layers'])
            if num_layers > 10:
                suggestions.append({
                    'type': 'layer_reduction',
                    'description': f'{num_layers} layers may be too many. Consider reducing.',
                    'priority': 'medium',
                    'suggested_max_layers': 8
                })

        suggestions.append({
            'type': 'quantization',
            'description': 'Quantize from float32 to int8 for 4x size reduction.',
            'priority': 'high',
            'expected_reduction': '75%'
        })

        suggestions.append({
            'type': 'operator_fusion',
            'description': 'Fuse consecutive operations for faster inference.',
            'priority': 'medium'
        })

        return suggestions


class TinyMLCompiler:
    """
    TinyML Compiler

    Compiles models for edge deployment
    """

    def __init__(
        self,
        target_framework: str = 'tflite',
        optimization_level: str = 'high'
    ):
        """
        Initialize TinyML Compiler

        Args:
            target_framework: Target framework ('tflite', 'onnx', 'c')
            optimization_level: Optimization level ('low', 'medium', 'high')
        """
        self.target_framework = target_framework
        self.optimization_level = optimization_level

        logger.info(f"TinyMLCompiler initialized for {target_framework}")

    def compile(
        self,
        model_config: Dict[str, Any],
        output_format: str = 'tflite'
    ) -> Dict[str, Any]:
        """
        Compile model for edge deployment

        Args:
            model_config: Model configuration
            output_format: Output format

        Returns:
            Compilation results
        """
        logger.info(f"Compiling model to {output_format}")

        # Simulated compilation
        compilation_id = hashlib.md5(
            json.dumps(model_config, sort_keys=True).encode()
        ).hexdigest()[:8]

        result = {
            'compilation_id': compilation_id,
            'input_config': model_config,
            'output_format': output_format,
            'target_framework': self.target_framework,
            'optimization_level': self.optimization_level,
            'status': 'success',
            'compiled_at': datetime.now().isoformat(),
            'output_file': f'model_{compilation_id}.{output_format}',
            'size_bytes': self._estimate_compiled_size(model_config),
            'supported_apis': self._get_supported_apis()
        }

        return result

    def _estimate_compiled_size(self, model_config: Dict[str, Any]) -> int:
        """Estimate compiled model size in bytes"""
        # Rough estimation
        total_params = 0
        if 'layers' in model_config:
            for layer in model_config['layers']:
                if 'units' in layer:
                    total_params += layer['units']

        return total_params * 4  # 4 bytes per parameter

    def _get_supported_apis(self) -> List[str]:
        """Get supported APIs for target platform"""
        if self.target_framework == 'tflite':
            return [
                'tflite::MicroInterpreter',
                'tflite::MicroMutableOpResolver',
                'tensorflow/lite/micro/micro_interpreter.h'
            ]
        elif self.target_framework == 'onnx':
            return [
                'ONNX Runtime',
                'onnxruntime::Session',
                'onnxruntime_cxx_api.h'
            ]
        else:
            return ['custom_c_api']

    def generate_c_code(self, model_config: Dict[str, Any]) -> str:
        """
        Generate C code for edge deployment

        Args:
            model_config: Model configuration

        Returns:
            Generated C code
        """
        # Generate header
        header = f"""
/*
 * Auto-generated TinyML model
 * Generated: {datetime.now().isoformat()}
 * Target: {self.target_framework}
 */

#ifndef TINYML_MODEL_H
#define TINYML_MODEL_H

#include <stdint.h>

#define MODEL_INPUT_SIZE {model_config.get('input_size', 64)}
#define MODEL_OUTPUT_SIZE {model_config.get('output_size', 1)}
"""

        # Generate model structure
        model_struct = f"""

// Model structure
typedef struct {{
    int32_t input_dim;
    int32_t output_dim;
    int32_t num_layers;
    const void* weights;
}} TinyMLModel;

// Function declarations
int tinyml_init(TinyMLModel* model);
int tinyml_predict(const TinyMLModel* model, const float* input, float* output);
void tinyml_cleanup(TinyMLModel* model);

#endif // TINYML_MODEL_H
"""

        return header + model_struct


class ModelQuantizer:
    """
    Model Quantization

    Quantizes models for edge deployment
    """

    def __init__(
        self,
        quantization_type: str = 'int8',
        per_channel: bool = False,
        calibration_data: Optional[pd.DataFrame] = None
    ):
        """
        Initialize Model Quantizer

        Args:
            quantization_type: Quantization type ('int8', 'uint8', 'float16')
            per_channel: Use per-channel quantization
            calibration_data: Data for calibration
        """
        self.quantization_type = quantization_type
        self.per_channel = per_channel
        self.calibration_data = calibration_data

        self.quantization_params = {}

    def quantize(
        self,
        model_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Quantize model

        Args:
            model_config: Model configuration

        Returns:
            Quantized model configuration
        """
        logger.info(f"Quantizing model to {self.quantization_type}")

        quantized_config = model_config.copy()
        quantized_config['quantization'] = {
            'type': self.quantization_type,
            'per_channel': self.per_channel
        }

        # Calculate quantization parameters
        if self.quantization_type == 'int8':
            scale, zero_point = self._calculate_quantization_params()
            quantized_config['quantization']['scale'] = scale
            quantized_config['quantization']['zero_point'] = zero_point

        # Quantize layers
        if 'layers' in quantized_config:
            quantized_layers = []
            for layer in quantized_config['layers']:
                quantized_layer = layer.copy()
                quantized_layer['dtype'] = self._get_quantized_dtype()
                quantized_layers.append(quantized_layer)
            quantized_config['layers'] = quantized_layers

        return quantized_config

    def _calculate_quantization_params(self) -> Tuple[float, int]:
        """Calculate scale and zero point for quantization"""
        # Default values
        scale = 1.0 / 128.0
        zero_point = 0

        if self.calibration_data is not None:
            # Calculate from calibration data
            data = self.calibration_data.values.flatten()
            min_val = float(np.min(data))
            max_val = float(np.max(data))

            # For int8: range [-128, 127]
            qmin = -128
            qmax = 127

            scale = (max_val - min_val) / (qmax - qmin)
            zero_point = int(qmin - min_val / scale)

        return scale, zero_point

    def _get_quantized_dtype(self) -> str:
        """Get quantized data type"""
        if self.quantization_type == 'int8':
            return 'int8_t'
        elif self.quantization_type == 'uint8':
            return 'uint8_t'
        elif self.quantization_type == 'float16':
            return 'float16_t'
        else:
            return 'float32'

    def dequantize(
        self,
        quantized_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Dequantize model configuration

        Args:
            quantized_config: Quantized model configuration

        Returns:
            Dequantized configuration
        """
        logger.info("Dequantizing model")

        dequantized_config = quantized_config.copy()

        # Remove quantization metadata
        if 'quantization' in dequantized_config:
            del dequantized_config['quantization']

        # Restore float types
        if 'layers' in dequantized_config:
            dequantized_layers = []
            for layer in dequantized_config['layers']:
                dequantized_layer = layer.copy()
                dequantized_layer['dtype'] = 'float32'
                dequantized_layers.append(dequantized_layer)
            dequantized_config['layers'] = dequantized_layers

        return dequantized_config

    def get_quantization_stats(
        self,
        original_config: Dict[str, Any],
        quantized_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get quantization statistics"""
        original_size = self._calculate_size(original_config, 'float32')
        quantized_size = self._calculate_size(quantized_config, self.quantization_type)

        return {
            'original_size_bytes': original_size,
            'quantized_size_bytes': quantized_size,
            'compression_ratio': original_size / quantized_size if quantized_size > 0 else 0,
            'size_reduction_percent': (1 - quantized_size / original_size) * 100 if original_size > 0 else 0,
            'quantization_type': self.quantization_type
        }

    def _calculate_size(
        self,
        config: Dict[str, Any],
        dtype: str
    ) -> int:
        """Calculate model size in bytes"""
        bytes_per_value = {
            'float32': 4,
            'float16': 2,
            'int8': 1,
            'uint8': 1
        }.get(dtype, 4)

        total_params = 0
        if 'layers' in config:
            for layer in config['layers']:
                if 'units' in layer:
                    total_params += layer['units']

        return total_params * bytes_per_value


class EdgeDeployer:
    """
    Edge Model Deployer

    Handles deployment to edge devices
    """

    def __init__(
        self,
        device_type: str = 'arduino',
        connection_type: str = 'serial'
    ):
        """
        Initialize Edge Deployer

        Args:
            device_type: Target device type
            connection_type: Connection type
        """
        self.device_type = device_type
        self.connection_type = connection_type

        self.deployment_history = []

        logger.info(f"EdgeDeployer initialized for {device_type}")

    def deploy(
        self,
        model_config: Dict[str, Any],
        device_id: str,
        deployment_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Deploy model to edge device

        Args:
            model_config: Model configuration
            device_id: Device identifier
            deployment_config: Deployment configuration

        Returns:
            Deployment results
        """
        logger.info(f"Deploying model to device {device_id}")

        if deployment_config is None:
            deployment_config = {}

        deployment_id = f"deploy_{datetime.now().timestamp()}"

        # Simulate deployment
        result = {
            'deployment_id': deployment_id,
            'device_id': device_id,
            'device_type': self.device_type,
            'model_config': model_config,
            'status': 'deployed',
            'deployment_config': deployment_config,
            'deployed_at': datetime.now().isoformat(),
            'verification_status': 'verified'
        }

        self.deployment_history.append(result)

        return result

    def verify_deployment(
        self,
        deployment_id: str,
        test_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Verify deployment on edge device

        Args:
            deployment_id: Deployment identifier
            test_data: Test data for verification

        Returns:
            Verification results
        """
        logger.info(f"Verifying deployment {deployment_id}")

        # Simulate verification
        inference_times = np.random.uniform(50, 100, 10)
        predictions = test_data['value'].values[:10] * (1 + np.random.randn(10) * 0.01)

        return {
            'deployment_id': deployment_id,
            'verification_status': 'passed',
            'avg_inference_time_ms': float(np.mean(inference_times)),
            'max_inference_time_ms': float(np.max(inference_times)),
            'min_inference_time_ms': float(np.min(inference_times)),
            'predictions': predictions.tolist(),
            'verified_at': datetime.now().isoformat()
        }

    def rollback_deployment(
        self,
        deployment_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Rollback deployment

        Args:
            deployment_id: Deployment identifier
            reason: Rollback reason

        Returns:
            Rollback results
        """
        logger.info(f"Rolling back deployment {deployment_id}: {reason}")

        return {
            'deployment_id': deployment_id,
            'rollback_status': 'rolled_back',
            'reason': reason,
            'rolled_back_at': datetime.now().isoformat()
        }

    def get_device_status(self, device_id: str) -> Dict[str, Any]:
        """Get device status"""
        return {
            'device_id': device_id,
            'device_type': self.device_type,
            'connection_type': self.connection_type,
            'status': 'connected',
            'memory_used_kb': np.random.randint(50, 200),
            'flash_used_kb': np.random.randint(100, 400),
            'cpu_usage_percent': np.random.uniform(10, 50),
            'last_seen': datetime.now().isoformat()
        }


def get_edge_ai_libraries() -> Dict[str, bool]:
    """Get availability of edge AI libraries"""
    return {
        'tensorflow': EDGE_AI_AVAILABLE,
        'tflite_micro': False,
        'onnxruntime': False,
        'tinymlgen': False,
        'edge_impulse': False
    }


def install_edge_ai_libraries() -> str:
    """Return pip install command for edge AI libraries"""
    return "pip install tensorflow-lite onnxruntime"
