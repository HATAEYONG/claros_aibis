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

// =====================================================
// API 응답 시간 개선 유틸리티
// =====================================================

/**
 * 캐시 관리자
 */
class DashboardDataCache {
  private cache = new Map<string, { data: any; timestamp: number; expiresAt: number }>();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2분

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const dashboardCache = new DashboardDataCache();

/**
 * 병렬 API 호출 헬퍼
 */
export async function fetchDashboardDataParallel<T>(
  fetchers: Array<() => Promise<T>>,
  options: { maxConcurrent?: number; timeout?: number } = {}
): Promise<T[]> {
  const { maxConcurrent = 5, timeout = 30000 } = options;
  const results: T[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < fetchers.length; i += maxConcurrent) {
    const batch = fetchers.slice(i, i + maxConcurrent);

    const batchPromises = batch.map((fetcher, idx) =>
      Promise.race([
        fetcher(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ])
    );

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results[i + idx] = result.value;
      } else {
        errors.push({ index: i + idx, error: result.reason as Error });
        results[i + idx] = null as T;
      }
    });
  }

  if (errors.length > 0) {
    console.warn('[DashboardData] Some requests failed:', errors);
  }

  return results;
}

/**
 * 대시보드 배치 데이터 로더
 */
export const dashboardBatchLoader = {
  /**
   * 전체 대시보드 데이터 로드 (병렬 처리)
   */
  async loadAllDashboardData(params?: { date?: string }, useCache: boolean = true) {
    const cacheKey = `all-dashboard-${JSON.stringify(params)}`;

    if (useCache && dashboardCache.has(cacheKey)) {
      console.log('[DashboardData] Using cached data for all dashboards');
      return dashboardCache.get(cacheKey);
    }

    const fetchers = [
      () => dashboardService.getExecutiveSummary(),
      () => dashboardService.getSalesDashboard(params),
      () => dashboardService.getProductionDashboard(params),
      () => dashboardService.getQualityDashboard(params),
      () => dashboardService.getInventoryDashboard(params),
      () => dashboardService.getProcurementDashboard(params),
      () => dashboardService.getFinancialDashboard(params),
      () => dashboardService.getHRDashboard(params)
    ];

    const results = await fetchDashboardDataParallel(fetchers, { maxConcurrent: 4 });

    const data = {
      executiveSummary: results[0],
      sales: results[1],
      production: results[2],
      quality: results[3],
      inventory: results[4],
      procurement: results[5],
      financial: results[6],
      hr: results[7]
    };

    if (useCache) {
      dashboardCache.set(cacheKey, data);
    }

    return data;
  },

  /**
   * KPI 데이터 로드 (병렬 처리)
   */
  async loadAllKPIs(params?: { date?: string }, useCache: boolean = true) {
    const cacheKey = `all-kpis-${JSON.stringify(params)}`;

    if (useCache && dashboardCache.has(cacheKey)) {
      console.log('[DashboardData] Using cached data for all KPIs');
      return dashboardCache.get(cacheKey);
    }

    const fetchers = [
      () => kpiService.getSalesPerformance(params),
      () => kpiService.getProductionPerformance(params),
      () => kpiService.getQualityPerformance(params),
      () => kpiService.getEquipmentEfficiency(params)
    ];

    const results = await fetchDashboardDataParallel(fetchers, { maxConcurrent: 4 });

    const data = {
      salesPerformance: results[0],
      productionPerformance: results[1],
      qualityPerformance: results[2],
      equipmentEfficiency: results[3]
    };

    if (useCache) {
      dashboardCache.set(cacheKey, data);
    }

    return data;
  }
};

/**
 * 데이터 프리로더 (백그라운드에서 미리 로딩)
 */
class DataPreloader {
  private preloadQueue = new Set<string>();
  private isPreloading = false;

  async preload(keys: string[]): Promise<void> {
    if (this.isPreloading) return;

    this.isPreloading = true;
    const newKeys = keys.filter(key => !this.preloadQueue.has(key));
    newKeys.forEach(key => this.preloadQueue.add(key));

    try {
      // 백그라운드에서 데이터 프리로딩
      await Promise.all(
        newKeys.map(async key => {
          if (!dashboardCache.has(key)) {
            // 실제 프리로딩 로직은 필요에 따라 구현
            console.log(`[Preloader] Preloading: ${key}`);
          }
        })
      );
    } finally {
      this.isPreloading = false;
    }
  }
}

export const dataPreloader = new DataPreloader();

/**
 * API 요청 최적화 헬퍼 - 중복 요청 방지
 */
class RequestOptimizer {
  private pendingRequests = new Map<string, Promise<any>>();

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    cache: boolean = true
  ): Promise<T> {
    // 캐시 확인
    if (cache && dashboardCache.has(key)) {
      return dashboardCache.get(key);
    }

    // 진행 중인 요청이 있으면 재사용
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestOptimizer] Reusing pending request: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // 새 요청 시작
    const promise = fetcher().then(data => {
      if (cache) {
        dashboardCache.set(key, data);
      }
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  cancelPending(key?: string): void {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestOptimizer = new RequestOptimizer();

/**
 * 대시보드 데이터 서비스 향상 버전
 */
export const enhancedDashboardService = {
  ...dashboardService,

  // 캐싱이 포함된 경영진 요약
  getExecutiveSummaryOptimized: async (params?: { period_type?: string; period_value?: string }) => {
    const key = `executive-summary-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getExecutiveSummary(params));
  },

  // 캐싱이 포함된 영업 대시보드
  getSalesDashboardOptimized: async (params?: { date?: string }) => {
    const key = `sales-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getSalesDashboard(params));
  },

  // 캐싱이 포함된 생산 대시보드
  getProductionDashboardOptimized: async (params?: { date?: string; factory_code?: string }) => {
    const key = `production-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getProductionDashboard(params));
  },

  // 캐싱이 포함된 품질 대시보드
  getQualityDashboardOptimized: async (params?: { date?: string }) => {
    const key = `quality-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getQualityDashboard(params));
  },

  // 캐싱이 포함된 재고 대시보드
  getInventoryDashboardOptimized: async (params?: { asof_date?: string }) => {
    const key = `inventory-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getInventoryDashboard(params));
  },

  // 캐싱이 포함된 구매 대시보드
  getProcurementDashboardOptimized: async (params?: { date?: string }) => {
    const key = `procurement-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getProcurementDashboard(params));
  },

  // 캐싱이 포함된 재무 대시보드
  getFinancialDashboardOptimized: async (params?: { fiscal_year?: string; fiscal_month?: string }) => {
    const key = `financial-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getFinancialDashboard(params));
  },

  // 캐싱이 포함된 HR 대시보드
  getHRDashboardOptimized: async (params?: { asof_date?: string }) => {
    const key = `hr-dashboard-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => dashboardService.getHRDashboard(params));
  }
};

/**
 * KPI 서비스 향상 버전
 */
export const enhancedKPIService = {
  ...kpiService,

  getSalesPerformanceOptimized: async (params?: { period_type?: string; period_value?: string }) => {
    const key = `sales-kpi-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => kpiService.getSalesPerformance(params));
  },

  getProductionPerformanceOptimized: async (params?: { date?: string }) => {
    const key = `production-kpi-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => kpiService.getProductionPerformance(params));
  },

  getQualityPerformanceOptimized: async (params?: { date?: string }) => {
    const key = `quality-kpi-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => kpiService.getQualityPerformance(params));
  },

  getEquipmentEfficiencyOptimized: async (params?: { date?: string }) => {
    const key = `equipment-kpi-${JSON.stringify(params)}`;
    return requestOptimizer.fetch(key, () => kpiService.getEquipmentEfficiency(params));
  }
};
