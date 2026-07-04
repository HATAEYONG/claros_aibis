/**
 * AutoML Service
 *
 * TypeScript service for AutoML API endpoints
 * Phase 5: AutoML (Automatic Machine Learning)
 */

// Types
export interface HistoricalDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface AutoMLTrainRequest {
  model_id: string;
  tool: 'autogluon' | 'flaml' | 'custom';
  train_data: HistoricalDataPoint[];
  target_col?: string;
  time_col?: string;
  prediction_length?: number;
  time_limit?: number;
  eval_metric?: string;
  presets?: string[];
}

export interface AutoMLTrainResponse {
  success: boolean;
  model_id: string;
  tool: string;
  training_result: {
    status: string;
    tool: string;
    training_time_seconds?: number;
    num_models_trained?: number;
    best_model?: string;
    best_score?: number;
    leaderboard?: Array<{
      model: string;
      score_val: number;
    }>;
  };
  is_fitted: boolean;
  trained_at: string;
}

export interface AutoMLPredictRequest {
  model_id: string;
  horizon?: number;
}

export interface AutoMLPredictResponse {
  success: boolean;
  model_id: string;
  forecast: number[];
  dates: string[];
  horizon: number;
  generated_at: string;
}

export interface AutoEnsembleRequest {
  ensemble_id: string;
  train_data: HistoricalDataPoint[];
  val_data: HistoricalDataPoint[];
  target_col?: string;
  time_col?: string;
  max_models?: number;
  weight_optimization?: 'greedy' | 'bayesian';
}

export interface AutoEnsembleResponse {
  success: boolean;
  ensemble_id: string;
  result: {
    num_candidates: number;
    num_selected: number;
    models: string[];
    weights: Record<string, number>;
    expected_mape: number;
  };
  created_at: string;
}

export interface AutoFeatureEngineeringRequest {
  data: HistoricalDataPoint[];
  target_col?: string;
  time_col?: string;
  max_features?: number;
  selection_method?: 'importance' | 'correlation' | 'mutual';
  include_tsfresh?: boolean;
}

export interface AutoFeatureEngineeringResponse {
  success: boolean;
  num_generated: number;
  num_selected: number;
  selected_features: string[];
  feature_importance: Record<string, number>;
  features: any[];
}

export interface HPORequest {
  model_id?: string;
  train_data: HistoricalDataPoint[];
  val_data: HistoricalDataPoint[];
  target_col?: string;
  time_col?: string;
  model_type: 'tft' | 'prophet' | 'lstm';
  n_trials?: number;
  timeout?: number;
}

export interface HPOResponse {
  success: boolean;
  model_type: string;
  best_params: Record<string, any>;
  best_value: number;
  n_trials: number;
  optimized_at: string;
}

export interface FeatureSelectionRequest {
  features_df: any[];
  target_col?: string;
  method?: 'rfe' | 'kbest' | 'sfs';
  n_features?: number;
}

export interface FeatureSelectionResponse {
  success: boolean;
  method: string;
  original_features: number;
  selected_features: string[];
  num_selected: number;
}

export interface AutoPreprocessRequest {
  data: HistoricalDataPoint[];
  target_col?: string;
  impute_method?: 'forward_fill' | 'backward_fill' | 'mean' | 'median' | 'knn';
  outlier_method?: 'iqr' | 'zscore' | 'isolation';
  scaling_method?: 'standard' | 'minmax' | 'robust';
}

export interface AutoPreprocessResponse {
  success: boolean;
  original_rows: number;
  processed_rows: number;
  preprocessing_steps: {
    imputation: string;
    outlier_handling: string;
    scaling: string;
  };
  sample_data: any[];
}

export interface AutoMLInfo {
  [key: string]: {
    name: string;
    provider: string;
    description: string;
    available: boolean;
    install_command: string;
    supported_models?: string[];
    features?: string[];
  };
}

export interface AutoMLInfoResponse {
  success: boolean;
  tools: AutoMLInfo;
  timestamp: string;
}

// API Base URL
const API_BASE = '/api/ml-pipeline/automl';

// =====================================================
// 성능 개선을 위한 캐싱 및 배치 처리
// =====================================================

// 모델 메타데이터 캐시
interface ModelMetadata {
  model_id: string;
  created_at: string;
  trained_at?: string;
  training_time?: number;
  best_score?: number;
  num_models_trained?: number;
  features?: string[];
}

const modelCache = new Map<string, ModelMetadata>();
const predictionCache = new Map<string, { forecast: number[]; timestamp: number; expiresAt: number }>();
const PREDICTION_CACHE_TTL = 5 * 60 * 1000; // 5분

// 진행 중인 작업 추적
interface JobTracker {
  jobs: Map<string, {
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    startTime: number;
    result?: any;
    error?: string;
  }>;

  start(jobId: string): void;
  update(jobId: string, progress: number, result?: any): void;
  complete(jobId: string, result: any): void;
  fail(jobId: string, error: string): void;
  get(jobId: string): any;
  isRunning(jobId: string): boolean;
}

const jobTracker: JobTracker = {
  jobs: new Map(),

  start(jobId: string): void {
    this.jobs.set(jobId, {
      status: 'running',
      progress: 0,
      startTime: Date.now()
    });
  },

  update(jobId: string, progress: number, result?: any): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      if (result) job.result = result;
    }
  },

  complete(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
    }
  },

  fail(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
    }
  },

  get(jobId: string): any {
    return this.jobs.get(jobId);
  },

  isRunning(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    return job?.status === 'running';
  }
};

/**
 * AutoML Service Class
 * 성능 최적화 버전 - 캐싱, 배치 처리, 진행 상태 추적 포함
 */
class AutoMLService {
  /**
   * Check AutoML module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Train AutoML model (성능 최적화 버전)
   * - 캐싱 지원
   * - 진행 상태 추적
   * - 데이터 압축 전송
   */
  async train(request: AutoMLTrainRequest, options: {
    useCache?: boolean;
    trackProgress?: boolean;
    compressData?: boolean;
  } = {}): Promise<AutoMLTrainResponse> {
    const { useCache = true, trackProgress = true, compressData = true } = options;

    // 캐시 확인
    if (useCache) {
      const cached = modelCache.get(request.model_id);
      if (cached && cached.trained_at) {
        console.log(`[AutoML] Using cached model: ${request.model_id}`);
        return {
          success: true,
          model_id: cached.model_id,
          tool: 'cached',
          training_result: {
            status: 'completed',
            tool: 'cached',
            training_time_seconds: cached.training_time,
            best_score: cached.best_score
          },
          is_fitted: true,
          trained_at: cached.trained_at
        };
      }
    }

    // 작업 ID 생성 및 진행 상태 추적 시작
    const jobId = `train-${request.model_id}-${Date.now()}`;
    if (trackProgress) {
      jobTracker.start(jobId);
    }

    try {
      // 데이터 압축 (대용량 데이터 경우)
      const requestBody = compressData && request.train_data.length > 1000
        ? { ...request, train_data: this.compressData(request.train_data) }
        : request;

      const response = await fetch(`${API_BASE}/train/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Compress': compressData ? 'true' : 'false',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Training failed');
      }

      const result = await response.json();

      // 결과 캐싱
      if (result.success && useCache) {
        modelCache.set(request.model_id, {
          model_id: result.model_id,
          created_at: new Date().toISOString(),
          trained_at: result.trained_at,
          training_time: result.training_result?.training_time_seconds,
          best_score: result.training_result?.best_score,
          num_models_trained: result.training_result?.num_models_trained
        });
      }

      // 진행 상태 완료
      if (trackProgress) {
        jobTracker.complete(jobId, result);
      }

      return result;
    } catch (error) {
      if (trackProgress) {
        jobTracker.fail(jobId, error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  /**
   * 데이터 압축 헬퍼
   */
  private compressData(data: any[]): any {
    // 간단한 압축: 중복 제거, 필요한 필드만 유지
    const compressed = data.map((item, idx) => ({
      i: idx,
      d: item.date,
      v: item.value
    }));
    return { _compressed: true, data: compressed };
  }

  /**
   * Generate AutoML forecast (성능 최적화 버전)
   * - 결과 캐싱
   * - 배치 예측 지원
   */
  async predict(
    request: AutoMLPredictRequest,
    options: { useCache?: boolean; forceRefresh?: boolean } = {}
  ): Promise<AutoMLPredictResponse> {
    const { useCache = true, forceRefresh = false } = options;

    // 캐시 확인
    const cacheKey = `${request.model_id}-${request.horizon || 30}`;
    if (useCache && !forceRefresh) {
      const cached = predictionCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[AutoML] Using cached prediction: ${cacheKey}`);
        return {
          success: true,
          model_id: request.model_id,
          forecast: cached.forecast,
          dates: this.generateDates(request.horizon || 30),
          horizon: request.horizon || 30,
          generated_at: new Date(cached.timestamp).toISOString()
        };
      }
    }

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

    const result = await response.json();

    // 결과 캐싱
    if (result.success && useCache) {
      predictionCache.set(cacheKey, {
        forecast: result.forecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + PREDICTION_CACHE_TTL
      });
    }

    return result;
  }

  /**
   * 배치 예측 (여러 모델에 대한 예측 병렬 처리)
   */
  async predictBatch(
    requests: AutoMLPredictRequest[],
    options: { maxConcurrent?: number; useCache?: boolean } = {}
  ): Promise<AutoMLPredictResponse[]> {
    const { maxConcurrent = 5, useCache = true } = options;
    const results: AutoMLPredictResponse[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(req => this.predict(req, { useCache }))
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results[i + idx] = result.value;
        } else {
          errors.push({ index: i + idx, error: result.reason as Error });
        }
      });
    }

    if (errors.length > 0) {
      console.warn(`[AutoML] ${errors.length} predictions failed:`, errors);
    }

    return results;
  }

  /**
   * 날짜 생성 헬퍼
   */
  private generateDates(horizon: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= horizon; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  /**
   * Get AutoML leaderboard
   */
  async getLeaderboard(modelId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/leaderboard/?model_id=${modelId}`);

    if (!response.ok) {
      throw new Error('Failed to get leaderboard');
    }

    return response.json();
  }

  /**
   * Build automatic ensemble (성능 최적화 버전)
   * - 병렬 모델 학습 지원
   * - 진행 상태 추적
   */
  async buildEnsemble(
    request: AutoEnsembleRequest,
    options: { trackProgress?: boolean; parallelTraining?: boolean } = {}
  ): Promise<AutoEnsembleResponse> {
    const { trackProgress = true, parallelTraining = true } = options;

    const jobId = `ensemble-${request.ensemble_id}-${Date.now()}`;
    if (trackProgress) {
      jobTracker.start(jobId);
    }

    try {
      // 병렬 학습 옵션 헤더 추가
      const response = await fetch(`${API_BASE}/ensemble/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parallel-Training': parallelTraining ? 'true' : 'false',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ensemble building failed');
      }

      const result = await response.json();

      if (trackProgress) {
        jobTracker.complete(jobId, result);
      }

      return result;
    } catch (error) {
      if (trackProgress) {
        jobTracker.fail(jobId, error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  /**
   * Generate features automatically
   */
  async generateFeatures(request: AutoFeatureEngineeringRequest): Promise<AutoFeatureEngineeringResponse> {
    const response = await fetch(`${API_BASE}/features/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Feature generation failed');
    }

    return response.json();
  }

  /**
   * Run hyperparameter optimization (성능 최적화 버전)
   * - 조기 종료 지원
   * - 진행 상태 추적
   * - 결과 캐싱
   */
  async optimizeHyperparameters(
    request: HPORequest,
    options: {
      earlyStopping?: boolean;
      trackProgress?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<HPOResponse> {
    const {
      earlyStopping = true,
      trackProgress = true,
      useCache = true
    } = options;

    const cacheKey = `hpo-${request.model_type}-${request.train_data.length}-${request.n_trials}`;
    if (useCache) {
      // HPO는 캐싱이 더 까다로우므로 선택적 사용
      const cached = modelCache.get(cacheKey);
      if (cached && cached.best_score) {
        console.log(`[AutoML] Using cached HPO result: ${cacheKey}`);
        return {
          success: true,
          model_type: request.model_type,
          best_params: {},
          best_value: cached.best_score,
          n_trials: request.n_trials || 100,
          optimized_at: cached.trained_at || new Date().toISOString()
        };
      }
    }

    const jobId = `hpo-${request.model_type}-${Date.now()}`;
    if (trackProgress) {
      jobTracker.start(jobId);
    }

    try {
      const response = await fetch(`${API_BASE}/hpo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Early-Stopping': earlyStopping ? 'true' : 'false',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'HPO failed');
      }

      const result = await response.json();

      if (result.success && useCache) {
        modelCache.set(cacheKey, {
          model_id: cacheKey,
          created_at: new Date().toISOString(),
          trained_at: result.optimized_at,
          best_score: result.best_value
        });
      }

      if (trackProgress) {
        jobTracker.complete(jobId, result);
      }

      return result;
    } catch (error) {
      if (trackProgress) {
        jobTracker.fail(jobId, error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  /**
   * Automatic feature selection
   */
  async selectFeatures(request: FeatureSelectionRequest): Promise<FeatureSelectionResponse> {
    const response = await fetch(`${API_BASE}/features/select/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Feature selection failed');
    }

    return response.json();
  }

  /**
   * Automatic data preprocessing
   */
  async preprocess(request: AutoPreprocessRequest): Promise<AutoPreprocessResponse> {
    const response = await fetch(`${API_BASE}/preprocess/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Preprocessing failed');
    }

    return response.json();
  }

  /**
   * Get AutoML information
   */
  async getInfo(): Promise<AutoMLInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get AutoML info');
    }

    return response.json();
  }

  /**
   * List all AutoML models
   */
  async listModels(): Promise<any> {
    const response = await fetch(`${API_BASE}/models/`);

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare training request with defaults
   */
  static prepareTrainRequest(
    modelId: string,
    trainData: HistoricalDataPoint[],
    options: Partial<AutoMLTrainRequest> = {}
  ): AutoMLTrainRequest {
    return {
      model_id: modelId,
      tool: options.tool || 'autogluon',
      train_data: trainData,
      target_col: options.target_col || 'value',
      time_col: options.time_col || 'date',
      prediction_length: options.prediction_length || 30,
      time_limit: options.time_limit || 3600,
      eval_metric: options.eval_metric || 'MAPE',
      presets: options.presets || ['fast_training', 'best_quality']
    };
  }

  /**
   * Helper method: Prepare HPO request with defaults
   */
  static prepareHPORequest(
    trainData: HistoricalDataPoint[],
    valData: HistoricalDataPoint[],
    modelType: 'tft' | 'prophet' | 'lstm',
    options: Partial<HPORequest> = {}
  ): HPORequest {
    return {
      train_data: trainData,
      val_data: valData,
      model_type: modelType,
      target_col: options.target_col || 'value',
      time_col: options.time_col || 'date',
      n_trials: options.n_trials || 100,
      timeout: options.timeout
    };
  }

  // =====================================================
  // 성능 최적화 유틸리티 메서드
  // =====================================================

  /**
   * 캐시 클리어
   */
  clearCache(options: { models?: boolean; predictions?: boolean } = {}): void {
    const { models = true, predictions = true } = options;

    if (models) {
      modelCache.clear();
      console.log('[AutoML] Model cache cleared');
    }

    if (predictions) {
      predictionCache.clear();
      console.log('[AutoML] Prediction cache cleared');
    }
  }

  /**
   * 캐시 통계 가져오기
   */
  getCacheStats(): { models: number; predictions: number } {
    return {
      models: modelCache.size,
      predictions: predictionCache.size
    };
  }

  /**
   * 진행 상태 구독
   */
  subscribeToJobProgress(
    callback: (jobId: string, status: any) => void
  ): () => void {
    // 간단한 구현 - 실제로는 이벤트 이미터 사용 권장
    const interval = setInterval(() => {
      jobTracker.jobs.forEach((status, jobId) => {
        if (status.status === 'running' || status.status === 'completed') {
          callback(jobId, status);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }

  /**
   * 작업 상태 가져오기
   */
  getJobStatus(jobId: string): any {
    return jobTracker.get(jobId);
  }

  /**
   * 모든 작업 상태 가져오기
   */
  getAllJobs(): Map<string, any> {
    return new Map(jobTracker.jobs);
  }

  /**
   * 완료된 작업 정리
   */
  cleanupCompletedJobs(olderThanMs: number = 3600000): void {
    const now = Date.now();
    jobTracker.jobs.forEach((status, jobId) => {
      if (
        (status.status === 'completed' || status.status === 'failed') &&
        now - status.startTime > olderThanMs
      ) {
        jobTracker.jobs.delete(jobId);
      }
    });
  }

  /**
   * 모델 성능 비교
   */
  async compareModels(
    modelIds: string[],
    testData: HistoricalDataPoint[]
  ): Promise<Array<{ model_id: string; score: number; predictions: number[] }>> {
    const results = await Promise.all(
      modelIds.map(async (modelId) => {
        try {
          const response = await this.predict({ model_id: modelId, horizon: testData.length });
          // 간단한 MAPE 계산
          const actual = testData.map(d => d.value);
          const predicted = response.forecast;
          const mape = this.calculateMAPE(actual, predicted);

          return {
            model_id: modelId,
            score: mape,
            predictions: predicted
          };
        } catch (error) {
          return {
            model_id: modelId,
            score: Infinity,
            predictions: []
          };
        }
      })
    );

    return results.sort((a, b) => a.score - b.score);
  }

  /**
   * MAPE 계산 헬퍼
   */
  private calculateMAPE(actual: number[], predicted: number[]): number {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
        count++;
      }
    }

    return count > 0 ? (sum / count) * 100 : 0;
  }

  /**
   * 자동 모델 선택 (최적 성능 모델 선택)
   */
  async selectBestModel(
    modelIds: string[],
    testData: HistoricalDataPoint[]
  ): Promise<{ model_id: string; score: number } | null> {
    const comparisons = await this.compareModels(modelIds, testData);

    if (comparisons.length === 0) return null;

    const best = comparisons[0];
    return {
      model_id: best.model_id,
      score: best.score
    };
  }

  /**
   * 배치 학습 (여러 모델 동시 학습)
   */
  async trainBatch(
    requests: AutoMLTrainRequest[],
    options: { maxConcurrent?: number; trackProgress?: boolean } = {}
  ): Promise<AutoMLTrainResponse[]> {
    const { maxConcurrent = 3, trackProgress = true } = options;
    const results: AutoMLTrainResponse[] = [];

    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(req => this.train(req, { trackProgress, useCache: false }))
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results[i + idx] = result.value;
        } else {
          results[i + idx] = {
            success: false,
            model_id: batch[idx].model_id,
            tool: 'error',
            training_result: { status: 'failed' },
            is_fitted: false,
            trained_at: new Date().toISOString()
          } as AutoMLTrainResponse;
        }
      });
    }

    return results;
  }

  /**
   * 모델 압축 및 내보내기
   */
  exportModel(modelId: string): { model_id: string; data: any } {
    const cached = modelCache.get(modelId);
    return {
      model_id: modelId,
      data: cached || null
    };
  }

  /**
   * 모델 가져오기
   */
  importModel(modelData: { model_id: string; data: any }): void {
    if (modelData.data) {
      modelCache.set(modelData.model_id, modelData.data);
    }
  }
}

// Export singleton instance
export const automlService = new AutoMLService();
export default automlService;
