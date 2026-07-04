// Forecast Service V2
// 고도화된 ML Pipeline 기반 예측 서비스
// TFT, Prophet, LSTM, 앙상블 모델 지원

/**
 * 예측 모델 유형
 */
export type ForecastModelType = 'tft' | 'prophet' | 'lstm' | 'ensemble' | 'arima';

/**
 * 예측 결과 타입
 */
export interface ForecastResult {
  status: 'success' | 'error';
  forecast?: number[];
  dates?: string[];
  lower_bound?: number[];
  upper_bound?: number[];
  metadata?: ForecastMetadata;
  error?: string;
}

/**
 * 예측 메타데이터
 */
export interface ForecastMetadata {
  model_type: ForecastModelType;
  horizon: number;
  context_data_points: number;
  prediction_timestamp: string;
  service_version: string;
  ensemble_weights?: Record<string, number>;
  individual_predictions?: Record<string, any>;
}

/**
 * 모델 학습 결과
 */
export interface TrainingResult {
  status: 'success' | 'error';
  model_id?: number;
  model_type?: ForecastModelType;
  training_results?: Record<string, any>;
  trained_at?: string;
  error?: string;
}

/**
 * 모델 평가 메트릭스
 */
export interface EvaluationMetrics {
  status: 'success' | 'error';
  metrics?: {
    mape: number;
    mae: number;
    rmse: number;
    rmspe?: number;
    theil_u?: number;
  };
  evaluated_at?: string;
  error?: string;
}

/**
 * 모델 비교 결과
 */
export interface ModelComparison {
  status: 'success' | 'error';
  comparisons?: Record<ForecastModelType, {
    prediction: number[];
    metadata: ForecastMetadata;
  }>;
  horizon?: number;
  compared_at?: string;
  error?: string;
}

/**
 * 모델 정보
 */
export interface ModelInfo {
  status: 'success' | 'error';
  info?: {
    models: string[];
    ensemble_method?: string;
    realtime_enabled: boolean;
    ab_testing_enabled: boolean;
    cache_enabled: boolean;
    cache_size: number;
    prediction_stats: Record<string, any>;
  };
  error?: string;
}

/**
 * 예측 요청 파라미터
 */
export interface ForecastRequest {
  model_code: string;
  horizon: number;
  model_type?: ForecastModelType;
  context_data: Array<Record<string, any>>;
  return_individual?: boolean;
  confidence_level?: 0.8 | 0.9 | 0.95;
}

/**
 * 배치 예측 요청
 */
export interface BatchForecastRequest {
  requests: Array<{
    model_code: string;
    horizon: number;
    model_type?: ForecastModelType;
    context_data: Array<Record<string, any>>;
  }>;
  parallel?: boolean;
}

/**
 * Forecast Service V2
 */
class ForecastServiceV2 {
  private baseURL: string;

  constructor(baseURL: string = '/api/forecasting') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(
      `${this.baseURL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 예측 생성 (V2)
   */
  async predict(params: ForecastRequest): Promise<ForecastResult> {
    return this.request<ForecastResult>('/v2/forecast/predict/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 배치 예측 (V2)
   */
  async predictBatch(
    params: BatchForecastRequest
  ): Promise<{
    status: 'success' | 'error';
    data?: {
      results: ForecastResult[];
      total: number;
      success: number;
      failed: number;
    };
    error?: string;
  }> {
    return this.request('/v2/forecast/predict_batch/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 모델 비교 (V2)
   */
  async compareModels(
    context_data: Array<Record<string, any>>,
    horizon: number = 30,
    model_types: ForecastModelType[] = ['tft', 'prophet', 'lstm', 'ensemble']
  ): Promise<ModelComparison> {
    return this.request<ModelComparison>('/v2/forecast/compare_models/', {
      method: 'POST',
      body: JSON.stringify({
        context_data,
        horizon,
        model_types,
      }),
    });
  }

  /**
   * 모델 학습 (V2)
   */
  async trainModel(
    model_id: number,
    historical_data: Array<Record<string, any>>,
    model_type: ForecastModelType = 'ensemble',
    epochs: number = 20,
    validation_split: number = 0.2
  ): Promise<TrainingResult> {
    return this.request<TrainingResult>(
      `/v2/models/${model_id}/train/`,
      {
        method: 'POST',
        body: JSON.stringify({
          model_type,
          historical_data,
          epochs,
          validation_split,
        }),
      }
    );
  }

  /**
   * 모델 평가 (V2)
   */
  async evaluateModel(
    model_id: number,
    actual_data: Array<Record<string, any>>,
    prediction_data: number[],
    model_type: ForecastModelType = 'ensemble'
  ): Promise<EvaluationMetrics> {
    return this.request<EvaluationMetrics>(
      `/v2/models/${model_id}/evaluate/`,
      {
        method: 'POST',
        body: JSON.stringify({
          actual_data,
          prediction_data,
          model_type,
        }),
      }
    );
  }

  /**
   * 모델 정보 조회 (V2)
   */
  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>('/v2/forecast/model_info/');
  }

  /**
   * 모델 가중치 업데이트 (V2)
   */
  async updateWeights(
    weights: Record<string, number>,
    adaptive: boolean = false
  ): Promise<{
    status: 'success' | 'error';
    weights?: Record<string, number>;
    updated_at?: string;
    error?: string;
  }> {
    return this.request('/v2/forecast/update_weights/', {
      method: 'POST',
      body: JSON.stringify({
        weights,
        adaptive,
      }),
    });
  }

  /**
   * 예측 성능 통계 조회 (V2)
   */
  async getPerformanceStats(
    model_type?: ForecastModelType
  ): Promise<{
    status: 'success' | 'error';
    stats?: Record<string, any>;
    error?: string;
  }> {
    const params = model_type ? `?model_type=${model_type}` : '';
    return this.request(`/v2/forecast/performance_stats/${params}`);
  }

  /**
   * 예측 이력 조회 (V2)
   */
  async getForecastHistory(
    model_id: number,
    limit: number = 10,
    start_date?: string,
    end_date?: string
  ): Promise<{
    history: Array<{
      id: number;
      forecast_date: string;
      forecast_period_days: number;
      forecast_values: number[];
      metadata: any;
    }>;
    count: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
    });

    return this.request(
      `/v2/models/${model_id}/history/?${params.toString()}`
    );
  }

  /**
   * 헬스 체크 (V2)
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    service: string;
    models_loaded: string[];
    ensemble_enabled: boolean;
    realtime_enabled: boolean;
    timestamp: string;
    error?: string;
  }> {
    return this.request('/v2/health/');
  }

  /**
   * 모델 재학습 트리거 (V2)
   */
  async triggerRetrain(
    force: boolean = false,
    model_type: ForecastModelType = 'ensemble'
  ): Promise<{
    status: 'success' | 'error';
    message?: string;
    model_type?: ForecastModelType;
    force?: boolean;
    triggered_at?: string;
    error?: string;
  }> {
    return this.request('/v2/retrain/', {
      method: 'POST',
      body: JSON.stringify({
        force,
        model_type,
      }),
    });
  }
}

// V1 API 호환성을 위한 서비스
class ForecastServiceV1 {
  private baseURL: string;

  constructor(baseURL: string = '/api/forecasting') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(
      `${this.baseURL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async predict(model_code: string, horizon: number): Promise<any> {
    return this.request('/v1/forecast/predict/', {
      method: 'POST',
      body: JSON.stringify({
        model_code,
        horizon,
      }),
    });
  }

  async train(
    model_code: string,
    historical_data: Array<Record<string, any>>
  ): Promise<any> {
    return this.request('/v1/forecast/train/', {
      method: 'POST',
      body: JSON.stringify({
        model_code,
        historical_data,
      }),
    });
  }
}

// 통합 Forecast Service
class ForecastService {
  v1: ForecastServiceV1;
  v2: ForecastServiceV2;

  constructor() {
    this.v1 = new ForecastServiceV1();
    this.v2 = new ForecastServiceV2();
  }

  /**
   * 기본 예측 (V2 앙상블 사용)
   */
  async predict(
    model_code: string,
    context_data: Array<Record<string, any>>,
    horizon: number = 30,
    model_type: ForecastModelType = 'ensemble'
  ): Promise<ForecastResult> {
    return this.v2.predict({
      model_code,
      context_data,
      horizon,
      model_type,
    });
  }

  /**
   * 모델 비교
   */
  async compareModels(
    context_data: Array<Record<string, any>>,
    horizon: number = 30
  ): Promise<ModelComparison> {
    return this.v2.compareModels(context_data, horizon);
  }

  /**
   * 모델 정보 조회
   */
  async getModelInfo(): Promise<ModelInfo> {
    return this.v2.getModelInfo();
  }

  /**
   * 헬스 체크
   */
  async healthCheck() {
    return this.v2.healthCheck();
  }
}

const forecastService = new ForecastService();

export default forecastService;
export {
  ForecastServiceV1,
  ForecastServiceV2,
  ForecastService,
};
export type {
  ForecastModelType,
  ForecastResult,
  ForecastMetadata,
  TrainingResult,
  EvaluationMetrics,
  ModelComparison,
  ModelInfo,
  ForecastRequest,
  BatchForecastRequest,
};
