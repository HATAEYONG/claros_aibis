// XAI Service
// 설명 가능 AI 서비스

/**
 * SHAP 설명 결과 타입
 */
export interface SHAPExplanation {
  instance_id: number;
  prediction: number | null;
  expected_value: number;
  shap_values: number[];
  feature_importance: Record<string, number>;
  top_positive: Array<{ feature: string; value: number }>;
  top_negative: Array<{ feature: string; value: number }>;
  plot_type: string;
  explained_at: string;
}

/**
 * 배치 설명 결과 타입
 */
export interface BatchExplanation {
  num_instances: number;
  global_feature_importance: Record<string, number>;
  mean_abs_shap: number[];
  feature_names: string[];
  explained_at: string;
}

/**
 * 전역 변수 중요도 타입
 */
export interface GlobalImportance {
  feature_importance: FeatureImportanceItem[];
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  plot_type: string;
}

/**
 * 변수 중요도 아이템
 */
export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  std?: number;
}

/**
 * 순열 중요도 결과 타입
 */
export interface PermutationImportance {
  baseline_score: number;
  feature_importance: FeatureImportanceItem[];
  feature_names: string[];
  importance_values: number[];
  importance_std: number[];
  computed_at: string;
}

/**
 * Attention 시각화 결과 타입
 */
export interface AttentionVisualization {
  plot_path: string;
  layer_name: string;
  sample_idx: number;
  head_idx: number;
}

/**
 * 시점별 중요도 타입
 */
export interface TemporalImportance {
  attention_received: number[];
  attention_given: number[];
  most_attended_time: number;
  least_attended_time: number;
  time_points: number[];
  aggregated: boolean;
  analyzed_at: string;
}

/**
 * XAI 리포트 생성 요청 타입
 */
export interface XAIReportRequest {
  model_name: string;
  model_type: string;
  training_period?: string;
  metrics?: Record<string, number>;
  hyperparameters?: Record<string, any>;
  feature_importance?: FeatureImportanceItem[];
  global_importance?: Record<string, number>;
  predictions?: PredictionExplanation[];
  insights?: string[];
  recommendations?: string[];
  report_format?: 'html' | 'markdown' | 'json';
}

/**
 * 예측 설명 타입
 */
export interface PredictionExplanation {
  instance_id: string;
  prediction: number;
  actual?: number;
  explanation?: {
    top_positive: Array<{ feature: string; value: number }>;
    top_negative: Array<{ feature: string; value: number }>;
  };
  shap_values?: number[];
}

/**
 * XAI 리포트 결과 타입
 */
export interface XAIReportResult {
  status: 'success' | 'error';
  report_path?: string;
  format?: string;
  error?: string;
}

/**
 * 예측 비교 결과 타입
 */
export interface PredictionComparison {
  instance_a: {
    prediction: number | null;
    top_features: Array<{ feature: string; value: number }>;
  };
  instance_b: {
    prediction: number | null;
    top_features: Array<{ feature: string; value: number }>;
  };
  prediction_diff: number;
  shap_difference: Record<string, number>;
  most_different_features: Array<{ feature: string; difference: number }>;
}

class XAIService {
  private baseURL: string;

  constructor(baseURL: string = '/api/ml-pipeline/xai') {
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
   * XAI 헬스 체크
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    shap_available: boolean;
    timestamp: string;
  }> {
    return this.request('/health/');
  }

  /**
   * 단일 예측 설명 (SHAP)
   */
  async explainPrediction(params: {
    model_name?: string;
    instance: number[];
    feature_names?: string[];
    plot_type?: string;
  }): Promise<{ status: string; explanation: SHAPExplanation }> {
    return this.request('/explain/prediction/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 배치 예측 설명 (전역 변수 중요도)
   */
  async explainBatch(params: {
    model_name?: string;
    instances: number[][];
    max_samples?: number;
  }): Promise<{ status: string; explanation: BatchExplanation }> {
    return this.request('/explain/batch/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 전역 변수 중요도 조회
   */
  async getGlobalImportance(params?: {
    model_name?: string;
    plot_type?: string;
  }): Promise<{ status: string; importance: GlobalImportance }> {
    const queryParams = new URLSearchParams({
      ...(params?.model_name && { model_name: params.model_name }),
      ...(params?.plot_type && { plot_type: params.plot_type }),
    });

    return this.request(`/importance/global/?${queryParams.toString()}`);
  }

  /**
   * 순열 중요도 계산
   */
  async computePermutationImportance(params: {
    model_name?: string;
    X: number[][];
    y: number[];
    n_repeats?: number;
  }): Promise<{ status: string; importance: PermutationImportance }> {
    return this.request('/importance/permutation/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Attention 시각화
   */
  async visualizeAttention(params: {
    model_name?: string;
    input_data: number[][];
    sample_idx?: number;
    head_idx?: number;
    interactive?: boolean;
  }): Promise<{ status: string; plot_path: string }> {
    return this.request('/visualize/attention/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * XAI 리포트 생성
   */
  async generateReport(
    request: XAIReportRequest
  ): Promise<XAIReportResult> {
    return this.request('/report/generate/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Variable Selection 중요도 조회
   */
  async getVariableImportance(params?: {
    model_name?: string;
    top_k?: number;
  }): Promise<{
    status: string;
    model_name: string;
    top_variables: Array<{
      rank: number;
      variable: string;
      weight: number;
    }>;
  }> {
    const queryParams = new URLSearchParams({
      ...(params?.model_name && { model_name: params.model_name }),
      ...(params?.top_k && { top_k: params.top_k.toString() }),
    });

    return this.request(`/importance/variables/?${queryParams.toString()}`);
  }

  /**
   * 두 예측의 SHAP 설명 비교
   */
  async comparePredictions(params: {
    model_name?: string;
    instance_a: number[];
    instance_b: number[];
  }): Promise<{ status: string; comparison: PredictionComparison }> {
    return this.request('/compare/predictions/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

const xaiService = new XAIService();

export default xaiService;
