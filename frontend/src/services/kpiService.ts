// -*- coding: utf-8 -*-
/**
 * KPI 서비스
 * KPI 관리 API 호출
 */
import api from './api';

// KPI 정의 타입
export interface KPIDefinition {
  kpi_id?: number;
  kpi_code: string;
  kpi_name: string;
  kpi_name_en?: string;
  kpi_type: string;
  domain: string;
  description?: string;
  aggregation_method: string;
  unit?: string;
  target_direction: string;
  threshold_warning?: number;
  threshold_critical?: number;
  calculation_logic?: string;
  source_tables?: string[];
  owner_department?: number;
  owner_department_name?: string;
  owner_department_code?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  latest_fact?: KPIFact;
  latest_value?: number;
  latest_status?: string;
}

// KPI 팩트 타입
export interface KPIFact {
  fact_id?: string;
  kpi?: number;
  kpi_code?: string;
  kpi_name?: string;
  kpi_unit?: string;
  kpi_target_direction?: string;
  date: string;
  year: number;
  quarter: number;
  month: number;
  week?: number;
  plant?: string;
  line?: string;
  department?: string;
  product?: number;
  product_code?: string;
  product_name?: string;
  vendor?: number;
  vendor_code?: string;
  vendor_name?: string;
  customer?: number;
  customer_code?: string;
  customer_name?: string;
  actual_value: number;
  target_value?: number;
  baseline_value?: number;
  achievement_rate?: number;
  variance?: number;
  variance_rate?: number;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  source_system?: string;
  source_table?: string;
  calculated_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

// API 응답 타입
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BatchOperationResult {
  created?: number;
  updated?: number;
  deleted?: number;
  failed?: number;
  saved?: number;
  total?: number;
  results?: any[];
  errors?: any[];
  message?: string;
}

export interface KPISummary {
  period: {
    year: number;
    quarter?: number;
    month?: number;
  };
  status_distribution: Record<string, number>;
  kpi_summary: Array<{
    kpi__kpi_code: string;
    kpi__kpi_name: string;
    count: number;
    avg_value: number;
  }>;
  total_facts: number;
}

// KPI 정의 API
export const kpiDefinitionAPI = {
  getKPIDefinitions: async (params?: Record<string, any>): Promise<PaginatedResponse<KPIDefinition>> => {
    return await api.get('/api/data-hub/analytics/definitions/', { params });
  },

  getKPIDefinition: async (kpiId: number): Promise<KPIDefinition> => {
    return await api.get(`/api/data-hub/analytics/definitions/${kpiId}/`);
  },

  createKPIDefinition: async (kpi: Partial<KPIDefinition>): Promise<KPIDefinition> => {
    return await api.post('/api/data-hub/analytics/definitions/', kpi);
  },

  updateKPIDefinition: async (kpiId: number, kpi: Partial<KPIDefinition>): Promise<KPIDefinition> => {
    return await api.put(`/api/data-hub/analytics/definitions/${kpiId}/`, kpi);
  },

  deleteKPIDefinition: async (kpiId: number): Promise<void> => {
    await api.delete(`/api/data-hub/analytics/definitions/${kpiId}/`);
  },

  getCategories: async (): Promise<{ categories: Record<string, string> }> => {
    return await api.get('/api/data-hub/analytics/definitions/categories/');
  },

  getRegistry: async (): Promise<{ registry: Record<string, any> }> => {
    return await api.get('/api/data-hub/analytics/definitions/registry/');
  },

  syncRegistry: async (): Promise<BatchOperationResult> => {
    return await api.post('/api/data-hub/analytics/definitions/sync_registry/', {});
  },

  bulkCalculate: async (request: {
    kpi_codes?: string[];
    start_date: string;
    end_date: string;
    plant?: string;
    line?: string;
    department?: string;
  }): Promise<BatchOperationResult> => {
    return await api.post('/api/data-hub/analytics/definitions/bulk_calculate/', request);
  },
};

// KPI 팩트 API
export const kpiFactAPI = {
  getKPIFacts: async (params?: Record<string, any>): Promise<PaginatedResponse<KPIFact>> => {
    return await api.get('/api/data-hub/analytics/facts/', { params });
  },

  getKPIFact: async (factId: string): Promise<KPIFact> => {
    return await api.get(`/api/data-hub/analytics/facts/${factId}/`);
  },

  createKPIFact: async (fact: Partial<KPIFact>): Promise<KPIFact> => {
    return await api.post('/api/data-hub/analytics/facts/', fact);
  },

  updateKPIFact: async (factId: string, fact: Partial<KPIFact>): Promise<KPIFact> => {
    return await api.put(`/api/data-hub/analytics/facts/${factId}/`, fact);
  },

  deleteKPIFact: async (factId: string): Promise<void> => {
    await api.delete(`/api/data-hub/analytics/facts/${factId}/`);
  },

  getLatestFacts: async (params?: {
    kpi_codes?: string;
    plant?: string;
    limit?: number;
  }): Promise<{ count: number; results: KPIFact[] }> => {
    return await api.get('/api/data-hub/analytics/facts/latest/', { params });
  },

  getSummary: async (params?: {
    year?: number;
    quarter?: number;
    month?: number;
  }): Promise<KPISummary> => {
    return await api.get('/api/data-hub/analytics/facts/summary/', { params });
  },
};

// 통합 KPI 서비스
export const kpiService = {
  // KPI 카테고리별 조회
  getKPIsByCategory: async (category: string): Promise<KPIDefinition[]> => {
    const response = await kpiDefinitionAPI.getKPIDefinitions({ domain: category });
    return response.results;
  },

  // 최신 KPI 실적 조회
  getLatestKPISummary: async (plant?: string): Promise<KPIFact[]> => {
    const response = await kpiFactAPI.getLatestFacts({
      plant,
      limit: 100
    });
    return response.results;
  },

  // KPI 재계산
  recalculateKPIs: async (
    startDate: string,
    endDate: string,
    options?: {
      kpiCodes?: string[];
      plant?: string;
      line?: string;
      department?: string;
    }
  ): Promise<BatchOperationResult> => {
    return await kpiDefinitionAPI.bulkCalculate({
      kpi_codes: options?.kpiCodes,
      start_date: startDate,
      end_date: endDate,
      plant: options?.plant,
      line: options?.line,
      department: options?.department,
    });
  },

  // KPI 레지스트리 동기화
  syncKPIRegistry: async (): Promise<BatchOperationResult> => {
    return await kpiDefinitionAPI.syncRegistry();
  },

  // KPI 목표 달성 현황 조회
  getKPIAchievementStatus: async (year?: number, month?: number): Promise<KPISummary> => {
    return await kpiFactAPI.getSummary({ year, month });
  },

  // KPI 트렌드 데이터 조회
  getKPITrend: async (
    kpiCode: string,
    startDate: string,
    endDate: string,
    plant?: string
  ): Promise<KPIFact[]> => {
    const response = await kpiFactAPI.getKPIFacts({
      kpi__kpi_code: kpiCode,
      date__gte: startDate,
      date__lte: endDate,
      plant,
      ordering: 'date'
    });
    return response.results;
  },

  // 특정 KPI의 최신 실적값 조회
  getLatestKPIValue: async (kpiCode: string, plant?: string): Promise<KPIFact | null> => {
    const response = await kpiFactAPI.getLatestFacts({
      kpi_codes: kpiCode,
      plant,
      limit: 1
    });
    return response.results.length > 0 ? response.results[0] : null;
  },

  // 상태별 KPI 필터링
  getKPIsByStatus: async (status: 'good' | 'warning' | 'critical', year?: number): Promise<KPIFact[]> => {
    const response = await kpiFactAPI.getKPIFacts({
      status,
      year
    });
    return response.results;
  },
};
