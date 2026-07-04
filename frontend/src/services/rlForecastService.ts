/**
 * Reinforcement Learning Forecast Service
 *
 * TypeScript service for reinforcement learning-based forecasting API endpoints
 * Phase 9: Reinforcement Learning for AI Prediction System
 */

// Types
export interface RLForecasterConfig {
  rl_algorithm?: 'dqn' | 'ppo' | 'a3c';
  state_dim?: number;
  action_dim?: number;
  learning_rate?: number;
  gamma?: number;
  buffer_size?: number;
  episodes?: number;
  max_steps?: number;
}

export interface TrainRLForecasterRequest {
  train_data: Record<string, number[]>;
  validation_data?: Record<string, number[]>;
  target_col?: string;
  config?: RLForecasterConfig;
}

export interface TrainRLForecasterResponse {
  success: boolean;
  training_result: {
    status: string;
    rl_algorithm: string;
    episodes: number;
    final_reward: number;
    evaluation?: {
      mape: number;
      mae: number;
      rmse: number;
      samples: number;
    };
    trained_at: string;
  };
}

export interface RLPredictRequest {
  data: Record<string, number[]>;
  horizon?: number;
  target_col?: string;
}

export interface RLPredictResponse {
  success: boolean;
  forecast: {
    forecast: number[];
    dates: string[];
    horizon: number;
    action: number;
    confidence: number;
    generated_at: string;
  };
}

export interface AdaptModelRequest {
  model_info?: Record<string, any>;
  new_data: Record<string, number[]>;
  target_col?: string;
  config?: {
    window_size?: number;
    threshold?: number;
  };
}

export interface AdaptModelResponse {
  success: boolean;
  adaptation_result: {
    status: string;
    adaptation_count: number;
    adaptation_time: string;
    samples_used: number;
    result: {
      method: string;
      update_samples: number;
      new_performance: number;
    };
  };
}

export interface DetectDriftRequest {
  prediction: number;
  actual: number;
  baseline_error?: number;
  method?: 'ddm' | 'eddm' | 'adwin' | 'page_hinkley';
}

export interface DetectDriftResponse {
  success: boolean;
  drift_detection: {
    status: 'normal' | 'warning' | 'drift' | 'insufficient_data';
    method: string;
    current_error?: number;
    mean_error?: number;
    drift_threshold?: number;
    warning_threshold?: number;
  };
}

export interface UpdatePerformanceRequest {
  predictions: number[];
  actuals: number[];
}

export interface UpdatePerformanceResponse {
  success: boolean;
  metrics: {
    mape: number;
    mae: number;
    rmse: number;
  };
  should_retrain: boolean;
  retrain_reason: string;
}

export interface SelectModelRequest {
  state: number[];
  available_models?: string[];
  explore?: boolean;
}

export interface SelectModelResponse {
  success: boolean;
  selected_model: string;
  available_models: string[];
}

export interface UpdateEnsembleWeightsRequest {
  predictions: Record<string, number[]>;
  actuals: number[];
  learning_rate?: number;
}

export interface UpdateEnsembleWeightsResponse {
  success: boolean;
  ensemble_weights: Record<string, number>;
  normalized_sum: number;
}

export interface CalculateRewardRequest {
  prediction: number;
  actual: number;
  reward_type?: 'accuracy' | 'business' | 'forecasting';
  context?: Record<string, any>;
}

export interface CalculateRewardResponse {
  success: boolean;
  reward: number;
  reward_type: string;
}

export interface AdaptationStatsResponse {
  success: boolean;
  adaptation_stats: {
    total_adaptations: number;
    last_adaptation: string | null;
    window_size: number;
    threshold: number;
  };
}

export interface DriftStatsResponse {
  success: boolean;
  drift_stats: {
    total_drifts: number;
    total_warnings: number;
    last_drift: string | null;
    last_warning: string | null;
    detection_method: string;
    window_size: number;
  };
}

export interface PerformanceSummaryResponse {
  success: boolean;
  performance_summary: {
    baseline: Record<string, number | null>;
    current: Record<string, number>;
    trend: Record<string, {
      mean: number;
      std: number;
      min: number;
      max: number;
    }>;
    alerts: {
      total: number;
      last: {
        metric: string;
        baseline: number;
        current: number;
        degradation: number;
        time: string;
      } | null;
    };
  };
}

export interface RLInfoResponse {
  success: boolean;
  info: {
    module: string;
    version: string;
    description: string;
    features: {
      rl_algorithms: string[];
      adaptive_learning: string[];
      reward_systems: string[];
      ensemble_methods: string[];
    };
    available_libraries: {
      gymnasium: boolean;
      stable_baselines3: boolean;
    };
    supported_algorithms: string[];
    drift_detection_methods: string[];
    timestamp: string;
  };
}

// API Base URL
const API_BASE = '/api/ml-pipeline/reinforcement_learning';

/**
 * Reinforcement Learning Forecast Service Class
 */
class RLForecastService {
  /**
   * Check RL module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Train RL Forecaster
   */
  async trainForecaster(request: TrainRLForecasterRequest): Promise<TrainRLForecasterResponse> {
    const response = await fetch(`${API_BASE}/train/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training failed');
    }

    return response.json();
  }

  /**
   * Generate RL-based forecast
   */
  async predict(request: RLPredictRequest): Promise<RLPredictResponse> {
    const response = await fetch(`${API_BASE}/predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Adapt model to new data
   */
  async adaptModel(request: AdaptModelRequest): Promise<AdaptModelResponse> {
    const response = await fetch(`${API_BASE}/adapt/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Adaptation failed');
    }

    return response.json();
  }

  /**
   * Detect concept drift
   */
  async detectDrift(request: DetectDriftRequest): Promise<DetectDriftResponse> {
    const response = await fetch(`${API_BASE}/drift/detect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Drift detection failed');
    }

    return response.json();
  }

  /**
   * Update performance monitoring
   */
  async updatePerformance(request: UpdatePerformanceRequest): Promise<UpdatePerformanceResponse> {
    const response = await fetch(`${API_BASE}/performance/update/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Performance update failed');
    }

    return response.json();
  }

  /**
   * Select model using RL agent
   */
  async selectModel(request: SelectModelRequest): Promise<SelectModelResponse> {
    const response = await fetch(`${API_BASE}/select_model/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Model selection failed');
    }

    return response.json();
  }

  /**
   * Update ensemble weights adaptively
   */
  async updateEnsembleWeights(request: UpdateEnsembleWeightsRequest): Promise<UpdateEnsembleWeightsResponse> {
    const response = await fetch(`${API_BASE}/ensemble/update_weights/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ensemble weight update failed');
    }

    return response.json();
  }

  /**
   * Calculate reward
   */
  async calculateReward(request: CalculateRewardRequest): Promise<CalculateRewardResponse> {
    const response = await fetch(`${API_BASE}/reward/calculate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Reward calculation failed');
    }

    return response.json();
  }

  /**
   * Get adaptation statistics
   */
  async getAdaptationStats(): Promise<AdaptationStatsResponse> {
    const response = await fetch(`${API_BASE}/adapt/stats/`);

    if (!response.ok) {
      throw new Error('Failed to get adaptation stats');
    }

    return response.json();
  }

  /**
   * Get drift detection statistics
   */
  async getDriftStats(): Promise<DriftStatsResponse> {
    const response = await fetch(`${API_BASE}/drift/stats/`);

    if (!response.ok) {
      throw new Error('Failed to get drift stats');
    }

    return response.json();
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<PerformanceSummaryResponse> {
    const response = await fetch(`${API_BASE}/performance/summary/`);

    if (!response.ok) {
      throw new Error('Failed to get performance summary');
    }

    return response.json();
  }

  /**
   * Get RL module information
   */
  async getInfo(): Promise<RLInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get RL info');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare training request with defaults
   */
  static prepareTrainingRequest(
    trainData: Record<string, number[]>,
    options: Partial<TrainRLForecasterRequest> = {}
  ): TrainRLForecasterRequest {
    return {
      train_data: trainData,
      validation_data: options.validation_data,
      target_col: options.target_col || 'value',
      config: options.config || {
        rl_algorithm: 'dqn',
        state_dim: 64,
        action_dim: 10,
        episodes: 100
      }
    };
  }

  /**
   * Helper method: Prepare drift detection request
   */
  static prepareDriftDetectionRequest(
    prediction: number,
    actual: number,
    method: 'ddm' | 'eddm' | 'adwin' | 'page_hinkley' = 'ddm',
    baselineError?: number
  ): DetectDriftRequest {
    return {
      prediction,
      actual,
      baseline_error: baselineError,
      method
    };
  }
}

// Export singleton instance
export const rlForecastService = new RLForecastService();
export default rlForecastService;
