/**
 * ERP 매핑 데이터 기반 API 서비스
 *
 * ERP 매핑 시스템을 통해 조회된 데이터를 프론트엔드에 제공하는 서비스
 */

import api from './api';

// Dashboard 레이어 API
export const dashboardService = {
  // 경영진단 요약
  getExecutiveSummary: (params?: { period_type?: string; period_value?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period_type) queryParams.append('period_type', params.period_type);
    if (params?.period_value) queryParams.append('period_value', params.period_value);
    return api.get<any>(`/api/erp-sync/dashboard/executive-summary/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 영업 관리 대시보드
  getSalesDashboard: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/dashboard/sales/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 생산 관리 대시보드
  getProductionDashboard: (params?: { date?: string; factory_code?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.factory_code) queryParams.append('factory_code', params.factory_code);
    return api.get<any>(`/api/erp-sync/dashboard/production/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 품질 관리 대시보드
  getQualityDashboard: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/dashboard/quality/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 재고 관리 대시보드
  getInventoryDashboard: (params?: { asof_date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.asof_date) queryParams.append('asof_date', params.asof_date);
    return api.get<any>(`/api/erp-sync/dashboard/inventory/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 구매 관리 대시보드
  getProcurementDashboard: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/dashboard/procurement/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 재무/회계 대시보드
  getFinancialDashboard: (params?: { fiscal_year?: string; fiscal_month?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
    if (params?.fiscal_month) queryParams.append('fiscal_month', params.fiscal_month);
    return api.get<any>(`/api/erp-sync/dashboard/financial/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 인사/HR 대시보드
  getHRDashboard: (params?: { asof_date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.asof_date) queryParams.append('asof_date', params.asof_date);
    return api.get<any>(`/api/erp-sync/dashboard/hr/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },
};

// KPI 레이어 API
export const kpiService = {
  // 영업 실적 KPI
  getSalesPerformance: (params?: { period_type?: string; period_value?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period_type) queryParams.append('period_type', params.period_type);
    if (params?.period_value) queryParams.append('period_value', params.period_value);
    return api.get<any>(`/api/erp-sync/kpi/sales-performance/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 생산 실적 KPI
  getProductionPerformance: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/kpi/production-performance/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 품질 실적 KPI
  getQualityPerformance: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/kpi/quality-performance/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  // 설비 효율 KPI
  getEquipmentEfficiency: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    return api.get<any>(`/api/erp-sync/kpi/equipment-efficiency/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },
};

// 원본 ERP 테이블 데이터 API
export const rawTableService = {
  // 원본 테이블 데이터 조회
  getTableData: (appLabel: string, tableName: string, params?: { erp_source?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.erp_source) queryParams.append('erp_source', params.erp_source);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get<any>(`/api/erp-sync/data/${appLabel}/${tableName}/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },
};

export default {
  dashboard: dashboardService,
  kpi: kpiService,
  rawTable: rawTableService,
};
