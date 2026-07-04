/**
 * Model Optimization Service
 *
 * TypeScript service for model optimization API endpoints
 * Phase 4: Model Optimization for AI Prediction System
 */

// Types
export interface QuantizeRequest {
  model_id: string;
  quant_type: 'dynamic' | 'static' | 'fp16';
  dtype: 'qint8' | 'quint8' | 'fp16';
  calibration_data?: number[];
}

export interface QuantizeResponse {
  success: boolean;
  model_id: string;
  quantization_type: string;
  dtype: string;
  original_size_mb: number;
  quantized_size_mb: number;
  compression_ratio: number;
  size_reduction_pct: number;
  model_path: string;
  optimized_at: string;
}

export interface PruneRequest {
  model_id: string;
  sparsity: number;
  method: 'l1_unstructured' | 'l1_structured' | 'random';
  finetune_epochs?: number;
  finetune_lr?: number;
}

export interface PruneResponse {
  success: boolean;
  model_id: string;
  target_sparsity: number;
  achieved_sparsity: number;
  method: string;
  original_parameters: number;
  pruned_parameters: number;
  parameters_removed: number;
  finetune_epochs: number;
  model_path: string;
  optimized_at: string;
}

export interface DistillRequest {
  teacher_model_id: string;
  student_model_id?: string;
  temperature?: number;
  alpha?: number;
  epochs?: number;
  train_data?: Array<{ x: number; y: number }>;
}

export interface DistillResponse {
  success: boolean;
  teacher_model_id: string;
  student_model_id: string;
  temperature: number;
  alpha: number;
  epochs: number;
  teacher_parameters: number;
  student_parameters: number;
  compression_ratio: number;
  size_reduction_pct: number;
  model_path: string;
  optimized_at: string;
}

export interface ConvertONNXRequest {
  model_id: string;
  input_shape: number[];
  opset_version?: number;
  dynamic_axes?: boolean;
}

export interface ConvertONNXResponse {
  success: boolean;
  model_id: string;
  onnx_path: string;
  input_shape: number[];
  opset_version: number;
  dynamic_axes: boolean;
  pytorch_size_mb: number;
  onnx_size_mb: number;
  converted_at: string;
}

export interface ConvertTensorRTRequest {
  model_id: string;
  input_shape: number[];
  precision: 'fp32' | 'fp16' | 'int8';
  max_batch_size?: number;
}

export interface ConvertTensorRTResponse {
  success: boolean;
  model_id: string;
  engine_path: string;
  input_shape: number[];
  precision: string;
  max_batch_size: number;
  tensorrt_version: string;
  expected_speedup: string;
  converted_at: string;
}

export interface BenchmarkRequest {
  model_id: string;
  optimizations?: string[];
  input_shape: number[];
  num_runs?: number;
  warmup_runs?: number;
}

export interface BenchmarkResponse {
  success: boolean;
  model_id: string;
  input_shape: number[];
  num_runs: number;
  warmup_runs: number;
  benchmarks: {
    original?: {
      mean_latency_ms: number;
      std_latency_ms: number;
      min_latency_ms: number;
      max_latency_ms: number;
      throughput_per_second: number;
    };
    optimized?: {
      mean_latency_ms: number;
      std_latency_ms: number;
      min_latency_ms: number;
      max_latency_ms: number;
      throughput_per_second: number;
    };
  };
  summary: {
    original_latency_ms?: number;
    optimized_latency_ms?: number;
    speedup?: number;
  };
  benchmarked_at: string;
}

export interface OptimizationInfo {
  quantization: {
    description: string;
    techniques: {
      [key: string]: {
        description: string;
        benefits: string[];
        limitations: string[];
      };
    };
  };
  pruning: {
    description: string;
    techniques: {
      [key: string]: {
        description: string;
        benefits: string[];
        limitations: string[];
      };
    };
  };
  distillation: {
    description: string;
    techniques: {
      [key: string]: {
        description: string;
        benefits: string[];
        limitations: string[];
      };
    };
  };
  format_conversion: {
    description: string;
    techniques: {
      [key: string]: {
        description: string;
        benefits: string[];
        limitations: string[];
      };
    };
  };
}

export interface OptimizationInfoResponse {
  success: boolean;
  optimizations: OptimizationInfo;
  hardware_info: {
    cuda_available: boolean;
    cuda_device_count: number;
    cuda_device_name?: string;
  };
  timestamp: string;
}

export interface OptimizedModel {
  filename: string;
  size_mb: number;
  created_at: string;
  modified_at: string;
}

export interface OptimizedModelsResponse {
  success: boolean;
  models: OptimizedModel[];
  total_count: number;
  timestamp: string;
}

// API Base URL
const API_BASE = '/api/ml-pipeline/optimization';

/**
 * Model Optimization Service Class
 */
class ModelOptimizationService {
  /**
   * Check optimization module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Quantize model (FP32 → FP16/INT8)
   */
  async quantize(request: QuantizeRequest): Promise<QuantizeResponse> {
    const response = await fetch(`${API_BASE}/quantize/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Quantization failed');
    }

    return response.json();
  }

  /**
   * Prune model (remove connections)
   */
  async prune(request: PruneRequest): Promise<PruneResponse> {
    const response = await fetch(`${API_BASE}/prune/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Pruning failed');
    }

    return response.json();
  }

  /**
   * Knowledge distillation (teacher → student)
   */
  async distill(request: DistillRequest): Promise<DistillResponse> {
    const response = await fetch(`${API_BASE}/distill/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Distillation failed');
    }

    return response.json();
  }

  /**
   * Convert model to ONNX format
   */
  async convertToONNX(request: ConvertONNXRequest): Promise<ConvertONNXResponse> {
    const response = await fetch(`${API_BASE}/convert_onnx/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ONNX conversion failed');
    }

    return response.json();
  }

  /**
   * Convert model to TensorRT engine (GPU only)
   */
  async convertToTensorRT(request: ConvertTensorRTRequest): Promise<ConvertTensorRTResponse> {
    const response = await fetch(`${API_BASE}/convert_tensorrt/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'TensorRT conversion failed');
    }

    return response.json();
  }

  /**
   * Benchmark inference speed before/after optimization
   */
  async benchmark(request: BenchmarkRequest): Promise<BenchmarkResponse> {
    const response = await fetch(`${API_BASE}/benchmark/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Benchmark failed');
    }

    return response.json();
  }

  /**
   * Get information about available optimization techniques
   */
  async getInfo(): Promise<OptimizationInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get optimization info');
    }

    return response.json();
  }

  /**
   * List all optimized models
   */
  async listModels(): Promise<OptimizedModelsResponse> {
    const response = await fetch(`${API_BASE}/models/`);

    if (!response.ok) {
      throw new Error('Failed to list optimized models');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare quantization request with defaults
   */
  static prepareQuantizeRequest(
    modelId: string,
    options: Partial<QuantizeRequest> = {}
  ): QuantizeRequest {
    return {
      model_id: modelId,
      quant_type: options.quant_type || 'dynamic',
      dtype: options.dtype || 'qint8',
      calibration_data: options.calibration_data,
    };
  }

  /**
   * Helper method: Prepare prune request with defaults
   */
  static preparePruneRequest(
    modelId: string,
    sparsity: number,
    options: Partial<PruneRequest> = {}
  ): PruneRequest {
    return {
      model_id: modelId,
      sparsity,
      method: options.method || 'l1_unstructured',
      finetune_epochs: options.finetune_epochs || 5,
      finetune_lr: options.finetune_lr,
    };
  }

  /**
   * Helper method: Prepare distillation request with defaults
   */
  static prepareDistillRequest(
    teacherModelId: string,
    options: Partial<DistillRequest> = {}
  ): DistillRequest {
    return {
      teacher_model_id: teacherModelId,
      student_model_id: options.student_model_id || 'student',
      temperature: options.temperature || 3.0,
      alpha: options.alpha || 0.5,
      epochs: options.epochs || 50,
      train_data: options.train_data,
    };
  }
}

// Export singleton instance
export const modelOptimizationService = new ModelOptimizationService();
export default modelOptimizationService;
