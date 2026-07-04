/**
 * LLM Forecasting Service
 *
 * TypeScript service for LLM-based forecasting API endpoints
 * Phase 4: LLM Integration for AI Prediction System
 */

// Types
export interface HistoricalDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface LLMPredictionRequest {
  model_type: 'timegpt' | 'chronos' | 'gpt-4t' | 'local';
  historical_data: HistoricalDataPoint[];
  horizon: number;
  target_col?: string;
  external_context?: string;
  use_api?: boolean;
}

export interface LLMPredictionResponse {
  success: boolean;
  model_type: string;
  prediction: {
    forecast: number[];
    dates: string[];
    lower_bound?: number[];
    upper_bound?: number[];
  };
  explanation?: string;
  confidence?: number;
  reasoning?: string;
  prompt_used?: string;
  horizon: number;
  generated_at: string;
}

export interface LLMBatchRequest {
  model_type: 'timegpt' | 'chronos' | 'gpt-4t' | 'local';
  series: {
    series_id: string;
    historical_data: HistoricalDataPoint[];
    horizon: number;
    external_context?: string;
    use_api?: boolean;
  }[];
}

export interface LLMBatchResponse {
  success: boolean;
  model_type: string;
  results: {
    series_id: string;
    success: boolean;
    prediction?: any;
    explanation?: string;
    confidence?: number;
    error?: string;
  }[];
  total_series: number;
  successful: number;
  generated_at: string;
}

export interface LLMCompareRequest {
  models: string[];
  historical_data: HistoricalDataPoint[];
  horizon: number;
  test_period?: number;
  use_api?: boolean;
}

export interface LLMCompareResponse {
  success: boolean;
  horizon: number;
  test_period: number;
  comparisons: {
    model_type: string;
    mape?: number;
    mae?: number;
    rmse?: number;
    explanation?: string;
    confidence?: number;
    error?: string;
  }[];
  best_model: string | null;
  rankings: {
    model: string;
    mape?: number;
  }[];
  generated_at: string;
}

export interface MultimodalRequest {
  numerical_data: HistoricalDataPoint[];
  text_context?: string;
  image_url?: string;
  audio_url?: string;
  horizon: number;
}

export interface MultimodalResponse {
  success: boolean;
  prediction: number[];
  modality_contributions?: {
    numerical: number;
    text: number;
    image: number;
    audio: number;
  };
  explanation?: string;
  confidence?: number;
  horizon: number;
  generated_at: string;
}

export interface PromptGenerationRequest {
  domain?: string;
  historical_data: HistoricalDataPoint[];
  horizon: number;
  include_explanations?: boolean;
  custom_instructions?: string;
}

export interface PromptGenerationResponse {
  success: boolean;
  domain: string;
  system_prompt: string;
  user_prompt: string;
  prompt_length: number;
  token_estimate: number;
  generated_at: string;
}

export interface ModelInfo {
  name: string;
  provider: string;
  description: string;
  api_required: boolean;
  api_url?: string;
  strengths: string[];
  limitations: string[];
}

export interface ModelInfoResponse {
  success: boolean;
  models: {
    [key: string]: ModelInfo;
  };
  default_model: string;
  timestamp: string;
}

// API Base URL
const API_BASE = '/api/ml-pipeline/llm';

/**
 * LLM Forecasting Service Class
 */
class LLMForecastService {
  /**
   * Check LLM module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Generate LLM-based forecast
   */
  async predict(request: LLMPredictionRequest): Promise<LLMPredictionResponse> {
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
   * Generate LLM-based batch forecasts for multiple series
   */
  async predictBatch(request: LLMBatchRequest): Promise<LLMBatchResponse> {
    const response = await fetch(`${API_BASE}/predict_batch/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Batch prediction failed');
    }

    return response.json();
  }

  /**
   * Compare multiple LLM models for forecasting
   */
  async compareModels(request: LLMCompareRequest): Promise<LLMCompareResponse> {
    const response = await fetch(`${API_BASE}/compare/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Model comparison failed');
    }

    return response.json();
  }

  /**
   * Generate multimodal LLM forecast
   */
  async multimodalPredict(request: MultimodalRequest): Promise<MultimodalResponse> {
    const response = await fetch(`${API_BASE}/multimodal_predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Multimodal prediction failed');
    }

    return response.json();
  }

  /**
   * Generate optimized prompt for time series forecasting
   */
  async generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    const response = await fetch(`${API_BASE}/generate_prompt/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prompt generation failed');
    }

    return response.json();
  }

  /**
   * Get information about available LLM models
   */
  async getModelInfo(): Promise<ModelInfoResponse> {
    const response = await fetch(`${API_BASE}/models/info/`);

    if (!response.ok) {
      throw new Error('Failed to get model info');
    }

    return response.json();
  }

  /**
   * Helper method: Convert time series data to historical data points
   */
  static toHistoricalData(dates: string[] | Date[], values: number[]): HistoricalDataPoint[] {
    return dates.map((date, index) => ({
      date: typeof date === 'string' ? date : date.toISOString().split('T')[0],
      value: values[index],
    }));
  }

  /**
   * Helper method: Prepare prediction request with defaults
   */
  static preparePredictionRequest(
    historicalData: HistoricalDataPoint[],
    options: Partial<LLMPredictionRequest> = {}
  ): LLMPredictionRequest {
    return {
      model_type: options.model_type || 'timegpt',
      historical_data: historicalData,
      horizon: options.horizon || 30,
      target_col: options.target_col || 'value',
      external_context: options.external_context,
      use_api: options.use_api !== undefined ? options.use_api : true,
    };
  }
}

// Export singleton instance
export const llmForecastService = new LLMForecastService();
export default llmForecastService;
