/**
 * ML 예측 API 서비스
 *
 * 데이터 파이프라인 Stage 2(수집) → Stage 3(분석) 데이터를 활용한 예측
 */

import api from './api';
import { dashboardService, kpiService } from './dashboardDataService';

// =====================================================
// ML 파이프라인 예측 API
// =====================================================

/**
 * 품질 예측 API
 * Stage 2: quality_inspections, defect_records 테이블 데이터 활용
 * Stage 3: 품질 KPI 분석 결과 활용
 */
export const qualityPredictionService = {
  // 품질 KPI 예측 (불량률, Cpk, 클레임 발생 등)
  async getPredictions(params?: {
    horizon?: string;  // 예측 기간: 1d, 1w, 1m, 3m
    model_id?: string;
    feature_ids?: string[];
  }) {
    // 먼저 Stage 2에서 최신 품질 데이터 가져오기
    const qualityData = await dashboardService.getQualityDashboard();

    // Stage 3에서 품질 KPI 가져오기
    const qualityKPI = await kpiService.getQualityPerformance();

    // ML 예측 API 호출 (Stage 2/3 데이터를 피처로 활용)
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.model_id) queryParams.append('model_id', params.model_id);

    // Stage 2/3 데이터를 컨텍스트로 전달 (실제 구현에서는 쿼리 파라미터 또는 POST body로 전달)
    // 현재는 기본 API 호출만 수행
    return api.get<any>(
      `/api/ml/predict/quality/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  },

  // 품질 이상 감지 (Anomaly Detection)
  async detectAnomalies() {
    return api.get<any>('/api/ml/anomaly/quality/');
  },

  // 품질 예측을 위한 학습 데이터 조회
  async getTrainingData(params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    // Stage 2: 품질 검사 데이터 (quality_inspections)
    // Stage 2: 불량 기록 데이터 (defect_records)
    return api.get<any>(
      `/api/ml/training-data/quality/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 생산 예측 API
 * Stage 2: daily_productions, work_orders 테이블 데이터 활용
 */
export const productionPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    production_line_id?: number;
  }) {
    // Stage 2: 생산 데이터
    const productionData = await dashboardService.getProductionDashboard();

    // Stage 3: 생산 KPI
    const productionKPI = await kpiService.getProductionPerformance();

    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.production_line_id) queryParams.append('production_line_id', params.production_line_id.toString());

    return api.get<any>(
      `/api/ml/predict/production/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 재고 예측 API
 * Stage 2: inventory_items, inventory_movements 테이블 데이터 활용
 */
export const inventoryPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    item_code?: string;
  }) {
    // Stage 2: 재고 데이터
    const inventoryData = await dashboardService.getInventoryDashboard();

    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.item_code) queryParams.append('item_code', params.item_code);

    return api.get<any>(
      `/api/ml/predict/inventory/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 재무 예측 API
 * Stage 2: journal_entries, financial_statements 테이블 데이터 활용
 */
export const financePredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    fiscal_year?: string;
  }) {
    // Stage 2: 재무 데이터
    const financialData = await dashboardService.getFinancialDashboard();

    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);

    return api.get<any>(
      `/api/ml/predict/finance/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 4M2E 예측 API
 * Stage 2: cost_centers, cost_elements, cost_allocations 테이블 데이터 활용
 */
export const fourM2EPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    dimension?: string;  // MAN, MACHINE, MATERIAL, METHOD, ENVIRO, ENERGY
  }) {
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.dimension) queryParams.append('dimension', params.dimension);

    return api.get<any>(
      `/api/ml/predict/fourm2e/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  },

  // 4M2E 영향도 예측
  async getImpactPrediction(params?: {
    target_kpi?: string;
    scenario_id?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.target_kpi) queryParams.append('target_kpi', params.target_kpi);
    if (params?.scenario_id) queryParams.append('scenario_id', params.scenario_id);

    return api.get<any>(
      `/api/ml/predict/fourm2e-impact/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 시나리오 예측 API
 * Stage 3: 분석 결과를 기반으로 시나리오 시뮬레이션
 */
export const scenarioPredictionService = {
  async getPredictions(params?: {
    scenario_type?: string;  // optimistic, realistic, pessimistic
    target_domain?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.scenario_type) queryParams.append('scenario_type', params.scenario_type);
    if (params?.target_domain) queryParams.append('target_domain', params.target_domain);

    return api.get<any>(
      `/api/ml/predict/scenario/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * ESG 예측 API
 */
export const esgPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    category?: string;  // environmental, social, governance
  }) {
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.category) queryParams.append('category', params.category);

    return api.get<any>(
      `/api/ml/predict/esg/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 코스 분해 예측 API
 * Stage 2: cost_allocations, standard_costs 테이블 데이터 활용
 */
export const costBreakdownPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    cost_center_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.cost_center_id) queryParams.append('cost_center_id', params.cost_center_id.toString());

    return api.get<any>(
      `/api/ml/predict/cost-breakdown/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

/**
 * 코스 드라이버 예측 API
 * Stage 2: cost_elements, cost_allocations 테이블 데이터 활용
 */
export const costDriverPredictionService = {
  async getPredictions(params?: {
    horizon?: string;
    dimension?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.horizon) queryParams.append('horizon', params.horizon);
    if (params?.dimension) queryParams.append('dimension', params.dimension);

    return api.get<any>(
      `/api/ml/predict/cost-driver/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

// =====================================================
// ML 모델 관리 API
// =====================================================

export const mlModelService = {
  // 모델 목록 조회
  async getModels(params?: {
    model_type?: string;
    is_deployed?: boolean;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.model_type) queryParams.append('model_type', params.model_type);
    if (params?.is_deployed !== undefined) queryParams.append('is_deployed', params.is_deployed.toString());
    if (params?.status) queryParams.append('status', params.status);

    return api.get<any>(
      `/api/ml/models/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  },

  // 모델 학습 요청
  async trainModel(modelId: string, trainingData: any) {
    return api.post<any>(`/api/ml/models/${modelId}/train/`, trainingData);
  },

  // 예측 요청
  async predict(modelId: string, inputData: any) {
    return api.post<any>(`/api/ml/models/${modelId}/predict/`, inputData);
  },

  // 학습 작업 상태 조회
  async getTrainingJobs(params?: {
    model_id?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.model_id) queryParams.append('model_id', params.model_id);
    if (params?.status) queryParams.append('status', params.status);

    return api.get<any>(
      `/api/ml/training-jobs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }
};

// =====================================================
// 피쳐 저장소 API
// =====================================================

export const featureStoreService = {
  // 피쳐 목록 조회
  async getFeatures(params?: {
    feature_type?: string;
    source_table?: string;
    is_active?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.feature_type) queryParams.append('feature_type', params.feature_type);
    if (params?.source_table) queryParams.append('source_table', params.source_table);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    return api.get<any>(
      `/api/ml/features/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  },

  // 도메인별 피쳐 조회 (Stage 2 테이블 데이터를 피쳐로 제공)
  async getFeaturesByDomain(domain: string) {
    return api.get<any>(`/api/ml/features/domain/${domain}/`);
  }
};

// =====================================================
// ERP 동기화 로그 API (Stage 1 → Stage 2 연결)
// =====================================================

export const syncLogService = {
  // 동기화 로그 조회
  async getSyncLogs(params?: {
    source_id?: number;
    status?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.source_id) queryParams.append('source_id', params.source_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return api.get<any>(
      `/api/erp-sync/logs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  },

  // 최신 동기화 상태 조회
  async getLatestSyncStatus() {
    return api.get<any>('/api/erp-sync/logs/latest/');
  },

  // 데이터 신선성 확인 (Stage 2 컴포넌트 활용)
  async getDataFreshness(sourceTable: string) {
    return api.get<any>(`/api/erp-sync/logs/freshness/${sourceTable}/`);
  }
};

export default {
  quality: qualityPredictionService,
  production: productionPredictionService,
  inventory: inventoryPredictionService,
  finance: financePredictionService,
  fourM2E: fourM2EPredictionService,
  scenario: scenarioPredictionService,
  esg: esgPredictionService,
  costBreakdown: costBreakdownPredictionService,
  costDriver: costDriverPredictionService,
  models: mlModelService,
  features: featureStoreService,
  syncLogs: syncLogService,
};
