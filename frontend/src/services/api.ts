const API_BASE_URL = import.meta.env.VITE_API_URL || '';  // 백엔드 API 기본 URL (Vite proxy adds /api prefix)

// 시연용 목업 데이터 모드 (환경 변수로 제어)
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
}

// Generic API response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // 시연용 목업 데이터 반환
      console.warn(`API 연결 실패 (${endpoint}), 목업 데이터 사용:`, error);
      return this.getMockData<T>(endpoint) as T;
    }
  }

  // 목업 데이터 생성 (시연용)
  private getMockData<T>(endpoint: string): T {
    // 경영진단 요약
    if (endpoint.includes('executive-summary')) {
      return {
        revenue: { current: 52500000000, target: 50000000000, achievement: 105, trend: 'up' },
        operating_profit: { current: 6800000000, target: 6500000000, achievement: 105, trend: 'up' },
        net_income: { current: 5200000000, target: 5000000000, achievement: 104, trend: 'up' },
        production_rate: { current: 94.5, target: 92, achievement: 103, trend: 'stable' },
        quality_rate: { current: 98.2, target: 97, achievement: 101, trend: 'up' },
        inventory_turnover: { current: 8.2, target: 7.5, achievement: 109, trend: 'up' }
      } as T;
    }

    // 생산 대시보드
    if (endpoint.includes('production')) {
      return {
        daily_production: [
          { date: '2026-03-25', planned: 2500, actual: 2450, rate: 98.0 },
          { date: '2026-03-26', planned: 2500, actual: 2480, rate: 99.2 },
          { date: '2026-03-27', planned: 2500, actual: 2520, rate: 100.8 },
          { date: '2026-03-28', planned: 2500, actual: 2470, rate: 98.8 },
          { date: '2026-03-29', planned: 2500, actual: 2510, rate: 100.4 },
          { date: '2026-03-30', planned: 2400, actual: 2380, rate: 99.2 },
          { date: '2026-03-31', planned: 2400, actual: 2420, rate: 100.8 }
        ],
        summary: {
          total_planned: 17300,
          total_actual: 17230,
          avg_rate: 99.6,
          defect_rate: 1.8,
          oee: 82.3
        }
      } as T;
    }

    // 품질 대시보드
    if (endpoint.includes('quality')) {
      return {
        inspections: [
          { date: '2026-03-25', inspected: 2500, passed: 2455, failed: 45, rate: 98.2 },
          { date: '2026-03-26', inspected: 2480, passed: 2438, failed: 42, rate: 98.3 },
          { date: '2026-03-27', inspected: 2520, passed: 2472, failed: 48, rate: 98.1 },
          { date: '2026-03-28', inspected: 2470, passed: 2425, failed: 45, rate: 98.2 },
          { date: '2026-03-29', inspected: 2510, passed: 2464, failed: 46, rate: 98.2 }
        ],
        summary: {
          total_inspected: 12480,
          total_passed: 12254,
          total_failed: 226,
          avg_rate: 98.2,
          cpk: 1.42
        },
        defect_types: [
          { type: '크기 불량', count: 85, rate: 37.6 },
          { type: '외관 불량', count: 65, rate: 28.8 },
          { type: '기능 불량', count: 42, rate: 18.6 },
          { type: '기타', count: 34, rate: 15.0 }
        ]
      } as T;
    }

    // 재무 지표
    if (endpoint.includes('ratios')) {
      return {
        profitability: {
          roe: 14.5,
          roa: 8.2,
          operating_profit_margin: 12.9,
          net_profit_margin: 9.9
        },
        stability: {
          debt_ratio: 45.2,
          current_ratio: 1.8,
          quick_ratio: 1.2
        },
        activity: {
          total_asset_turnover: 1.5,
          inventory_turnover: 8.2,
          receivable_turnover: 12.5
        },
        growth: {
          revenue_growth: 8.5,
          net_income_growth: 12.3
        }
      } as T;
    }

    // 기본 응답
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    } as T;
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<{ access_token: string; access?: string; refresh?: string; user: User }> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('로그인 실패');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('access_token');

    await fetch(`${this.baseURL}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    localStorage.removeItem('access_token');
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${this.baseURL}/auth/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  async refreshToken(): Promise<{ access_token: string }> {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${this.baseURL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  // ========== Accounting API ==========
  accounting = {
    getBudgetActual: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/budget-actual/${params ? `?${params}` : ''}`),
    getBudgetActualSummary: (year?: number) =>
      this.get<any>(`/api/accounting/budget-actual/summary/${year ? `?year=${year}` : ''}`),
    getDepartmentProfitability: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/department-profitability/${params ? `?${params}` : ''}`),
    getKPIPerformance: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/kpi-performance/${params ? `?${params}` : ''}`),
    getFinancialRatio: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/financial-ratio/${params ? `?${params}` : ''}`),
    getBudgetAllocation: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/budget-allocation/${params ? `?${params}` : ''}`),
    getInvestmentROI: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/accounting/investment-roi/${params ? `?${params}` : ''}`),
  };

  // ========== Manufacturing API ==========
  manufacturing = {
    getWorkshopStatus: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/workshop-status/${params ? `?${params}` : ''}`),
    getWorkshopSummary: () =>
      this.get<any>('/api/manufacturing/workshop-status/summary/'),
    getCycleTime: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/cycle-time/${params ? `?${params}` : ''}`),
    getOEEMetric: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/oee-metric/${params ? `?${params}` : ''}`),
    getManpowerAllocation: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/manpower-allocation/${params ? `?${params}` : ''}`),
    getWorkStandard: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/work-standard/${params ? `?${params}` : ''}`),
    getEquipmentDowntime: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/manufacturing/equipment-downtime/${params ? `?${params}` : ''}`),
  };

  // ========== Productivity API ==========
  productivity = {
    getHourlyProduction: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/hourly-production/${params ? `?${params}` : ''}`),
    getLineUtilization: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/line-utilization/${params ? `?${params}` : ''}`),
    getWorkerProductivity: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/worker-productivity/${params ? `?${params}` : ''}`),
    getOEEComponent: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/oee-component/${params ? `?${params}` : ''}`),
    getEfficiency: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/efficiency/${params ? `?${params}` : ''}`),
    getDailySummary: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/productivity/daily-summary/${params ? `?${params}` : ''}`),
    getRecentSummary: (days?: number) =>
      this.get<any[]>(`/api/productivity/daily-summary/recent/${days ? `?days=${days}` : ''}`),
  };

  // ========== Development API ==========
  development = {
    getRDProject: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/rd-project/${params ? `?${params}` : ''}`),
    getRDProjectSummary: () =>
      this.get<any>('/api/development/rd-project/summary/'),
    getInnovationMetric: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/innovation-metric/${params ? `?${params}` : ''}`),
    getPatent: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/patent/${params ? `?${params}` : ''}`),
    getRDPersonnel: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/rd-personnel/${params ? `?${params}` : ''}`),
    getTechnologyRoadmap: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/technology-roadmap/${params ? `?${params}` : ''}`),
    getRDBudget: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/development/rd-budget/${params ? `?${params}` : ''}`),
  };

  // ========== Reports API ==========
  reports = {
    getExecutiveSummary: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/executive-summary/${params ? `?${params}` : ''}`),
    getLatestExecutiveSummary: () =>
      this.get<any>('/api/reports/executive-summary/latest/'),
    getDepartmentComparison: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/department-comparison/${params ? `?${params}` : ''}`),
    getKeyMetric: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/key-metric/${params ? `?${params}` : ''}`),
    getAlerts: () =>
      this.get<any[]>('/api/reports/key-metric/alerts/'),
    getRiskOpportunity: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/risk-opportunity/${params ? `?${params}` : ''}`),
    getRecommendation: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/recommendation/${params ? `?${params}` : ''}`),
    getMonthlyReport: (params?: string) =>
      this.get<PaginatedResponse<any>>(`/api/reports/monthly-report/${params ? `?${params}` : ''}`),
  };

  // ========== Financial API ==========
  financial = {
    getStatements: (params?: string) =>
      this.get<any>(`/api/financial/statements/${params ? `?${params}` : ''}`),
    getRatios: (params?: string) =>
      this.get<any>(`/api/financial/ratios/${params ? `?${params}` : ''}`.replace(/\/\?/, '/?')),
  };

  // ========== Production API ==========
  production = {
    getLines: (params?: string) =>
      this.get<any>(`/api/production/lines/${params ? `?${params}` : ''}`),
    getLinePerformance: (lineId: number) =>
      this.get<any>(`/api/production/lines/${lineId}/performance/`),
    getWorkOrders: (params?: string) =>
      this.get<any>(`/api/production/work-orders/${params ? `?${params}` : ''}`),
    getWorkOrderDashboard: () =>
      this.get<any>('/api/production/work-orders/dashboard/'),
    getDailyProductions: (params?: string) =>
      this.get<any>(`/api/production/daily-productions/${params ? `?${params}` : ''}`),
    getWeeklySummary: () =>
      this.get<any>('/api/production/daily-productions/weekly_summary/'),
    getEquipment: (params?: string) =>
      this.get<any>(`/api/production/equipment/${params ? `?${params}` : ''}`),
    getMaintenanceSchedule: () =>
      this.get<any>('/api/production/equipment/maintenance_schedule/'),
  };

  // ========== Quality API ==========
  quality = {
    getInspections: (params?: string) =>
      this.get<any>(`/api/quality/inspections/${params ? `?${params}` : ''}`),
    getInspectionStatistics: (params?: string) =>
      this.get<any>(`/api/quality/inspections/statistics/${params ? `?${params}` : ''}`),
    getDefectAnalysis: (days?: number) =>
      this.get<any>(`/api/quality/inspections/defect_analysis/${days ? `?days=${days}` : ''}`),
    getDefectTypes: () =>
      this.get<any>('/api/quality/defect-types/'),
    getDefectRecords: (params?: string) =>
      this.get<any>(`/api/quality/defect-records/${params ? `?${params}` : ''}`),
    getComplaints: (params?: string) =>
      this.get<any>(`/api/quality/complaints/${params ? `?${params}` : ''}`),
    getComplaintsSummary: () =>
      this.get<any>('/api/quality/complaints/summary/'),
    getProcessCapabilities: (params?: string) =>
      this.get<any>(`/api/quality/process-capabilities/${params ? `?${params}` : ''}`),
    getBelowThreshold: (threshold?: number) =>
      this.get<any>(`/api/quality/process-capabilities/below_threshold/${threshold ? `?threshold=${threshold}` : ''}`),
  };

  // ========== Sales API ==========
  sales = {
    getMonthly: (params?: string) =>
      this.get<any>(`/api/sales/monthly/${params ? `?${params}` : ''}`),
    getProducts: (params?: string) =>
      this.get<any>(`/api/sales/products/${params ? `?${params}` : ''}`),
    getCustomerTiers: (params?: string) =>
      this.get<any>(`/api/sales/customer-tiers/${params ? `?${params}` : ''}`),
    getPipeline: (params?: string) =>
      this.get<any>(`/api/sales/pipeline/${params ? `?${params}` : ''}`),
    getTeam: (params?: string) =>
      this.get<any>(`/api/sales/team/${params ? `?${params}` : ''}`),
    getCustomers: (params?: string) =>
      this.get<any>(`/api/sales/customers/${params ? `?${params}` : ''}`),
  };

  // ========== Purchase API ==========
  purchase = {
    getMonthly: (params?: string) =>
      this.get<any>(`/api/purchase/monthly/${params ? `?${params}` : ''}`),
    getInventory: (params?: string) =>
      this.get<any>(`/api/purchase/inventory/${params ? `?${params}` : ''}`),
    getOrders: (params?: string) =>
      this.get<any>(`/api/purchase/orders/${params ? `?${params}` : ''}`),
    getSuppliers: (params?: string) =>
      this.get<any>(`/api/purchase/suppliers/${params ? `?${params}` : ''}`),
    getMaterialPrices: (params?: string) =>
      this.get<any>(`/api/purchase/material-prices/${params ? `?${params}` : ''}`),
    getTurnover: (params?: string) =>
      this.get<any>(`/api/purchase/turnover/${params ? `?${params}` : ''}`),
  };

  // ========== ESG API ==========
  esg = {
    getScores: (params?: string) =>
      this.get<any>(`/api/esg/scores/${params ? `?${params}` : ''}`),
    getScoresSummary: (year?: number) =>
      this.get<any>(`/api/esg/scores/summary/${year ? `?year=${year}` : ''}`),
    getScoresTrend: (year?: number) =>
      this.get<any>(`/api/esg/scores/trend/${year ? `?year=${year}` : ''}`),
    getCarbon: (params?: string) =>
      this.get<any>(`/api/esg/carbon/${params ? `?${params}` : ''}`),
    getCarbonTrend: (year?: number) =>
      this.get<any>(`/api/esg/carbon/trend/${year ? `?year=${year}` : ''}`),
    getEnergy: (params?: string) =>
      this.get<any>(`/api/esg/energy/${params ? `?${params}` : ''}`),
    getEnergyBySource: (params?: string) =>
      this.get<any>(`/api/esg/energy/by_source/${params ? `?${params}` : ''}`),
    get4M2E: (params?: string) =>
      this.get<any>(`/api/esg/4m2e/${params ? `?${params}` : ''}`),
    get4M2ESummary: (params?: string) =>
      this.get<any>(`/api/esg/4m2e/summary/${params ? `?${params}` : ''}`),
    getProjects: (params?: string) =>
      this.get<any>(`/api/esg/projects/${params ? `?${params}` : ''}`),
    getProjectsInProgress: () =>
      this.get<any>('/api/esg/projects/in_progress/'),
    getProjectsInvestmentSummary: () =>
      this.get<any>('/api/esg/projects/investment_summary/'),
    getSocial: (params?: string) =>
      this.get<any>(`/api/esg/social/${params ? `?${params}` : ''}`),
    getSocialSummary: (year?: number) =>
      this.get<any>(`/api/esg/social/summary/${year ? `?year=${year}` : ''}`),
    getGovernance: (params?: string) =>
      this.get<any>(`/api/esg/governance/${params ? `?${params}` : ''}`),
    getGovernanceEvaluation: (year?: number) =>
      this.get<any>(`/api/esg/governance/evaluation/${year ? `?year=${year}` : ''}`),
  };

  // ========== Cost API ==========
  cost = {
    getMonthly: (params?: string) =>
      this.get<any>(`/api/cost/monthly/${params ? `?${params}` : ''}`),
    getMonthlySummary: (year: number) =>
      this.get<any>(`/api/cost/monthly/summary/?year=${year}`),
    getMontlyTrend: (year: number) =>
      this.get<any>(`/api/cost/monthly/trend/?year=${year}`),
    getProducts: (params?: string) =>
      this.get<any>(`/api/cost/products/${params ? `?${params}` : ''}`),
    getProductComparison: (params?: string) =>
      this.get<any>(`/api/cost/products/comparison/${params ? `?${params}` : ''}`),
    getProductProfitability: (params?: string) =>
      this.get<any>(`/api/cost/products/profitability/${params ? `?${params}` : ''}`),
    getProjects: (params?: string) =>
      this.get<any>(`/api/cost/projects/${params ? `?${params}` : ''}`),
    getProjectsInProgress: () =>
      this.get<any>('/api/cost/projects/in_progress/'),
    getProjectsSummary: () =>
      this.get<any>('/api/cost/projects/summary/'),
    getDrivers: (params?: string) =>
      this.get<any>(`/api/cost/drivers/${params ? `?${params}` : ''}`),
    getDriverAnalysis: (params?: string) =>
      this.get<any>(`/api/cost/drivers/analysis/${params ? `?${params}` : ''}`),
    getBreakEven: (params?: string) =>
      this.get<any>(`/api/cost/break-even/${params ? `?${params}` : ''}`),
    getBreakEvenLatest: (year?: number) =>
      this.get<any>(`/api/cost/break-even/latest/${year ? `?year=${year}` : ''}`),
    getBreakEvenTrend: (year?: number) =>
      this.get<any>(`/api/cost/break-even/trend/${year ? `?year=${year}` : ''}`),
    getStructure: (params?: string) =>
      this.get<any>(`/api/cost/structure/${params ? `?${params}` : ''}`),
    getStructureBreakdown: (params?: string) =>
      this.get<any>(`/api/cost/structure/breakdown/${params ? `?${params}` : ''}`),
  };

  // ========== AI Prediction API ==========
  predictions = {
    // Get all available prediction models
    getModels: () =>
      this.get<any>('/api/ai/predictions/'),
    // Get prediction for a specific KPI
    predict: (code: string) =>
      this.get<any>(`/api/ai/predictions/predict/?code=${code}`),
    // Detect anomalies for a KPI
    getAnomalies: (kpiCode: string, threshold?: number) =>
      this.get<any>(`/api/ai/predictions/anomalies/?kpi_code=${kpiCode}&threshold=${threshold || 2.0}`),
    // Get all predictions for a module
    getAllPredictions: (module?: string) =>
      this.get<any>(`/api/ai/predictions/all_predictions/${module ? `?module=${module}` : ''}`),
    // Finance predictions
    getFinancePredictions: () =>
      this.get<any>('/api/ai/predictions/finance/'),
    // Production predictions
    getProductionPredictions: () =>
      this.get<any>('/api/ai/predictions/production/'),
    // Quality predictions
    getQualityPredictions: () =>
      this.get<any>('/api/ai/predictions/quality/'),
    // Inventory predictions
    getInventoryPredictions: () =>
      this.get<any>('/api/ai/predictions/inventory/'),
    // Historical financial data for charts
    getFinanceHistorical: (days?: number) =>
      this.get<any>(`/api/ai/predictions/finance/historical/${days ? `?days=${days}` : ''}`),
  };

  // ========== Forecast V2 API (ML Pipeline Upgrade) ==========
  forecastV2 = {
    // Health check
    healthCheck: () =>
      this.get<any>('/api/forecasting/v2/health/'),

    // Model info
    getModelInfo: () =>
      this.get<any>('/api/forecasting/v2/forecast/model_info/'),

    // Predictions
    predict: (data: any) =>
      this.post<any>('/api/forecasting/v2/forecast/predict/', data),

    predictBatch: (requests: any) =>
      this.post<any>('/api/forecasting/v2/forecast/predict_batch/', { requests }),

    compareModels: (data: any) =>
      this.post<any>('/api/forecasting/v2/forecast/compare_models/', data),

    // Model operations
    trainModel: (modelId: number, data: any) =>
      this.post<any>(`/api/forecasting/v2/models/${modelId}/train/`, data),

    evaluateModel: (modelId: number, data: any) =>
      this.post<any>(`/api/forecasting/v2/models/${modelId}/evaluate/`, data),

    getForecastHistory: (modelId: number, params?: string) =>
      this.get<any>(`/api/forecasting/v2/models/${modelId}/history/${params ? `?${params}` : ''}`),

    // Weights and performance
    updateWeights: (weights: any) =>
      this.post<any>('/api/forecasting/v2/forecast/update_weights/', weights),

    getPerformanceStats: (modelType?: string) =>
      this.get<any>(`/api/forecasting/v2/forecast/performance_stats/${modelType ? `?model_type=${modelType}` : ''}`),

    // Retraining
    triggerRetrain: (data: any) =>
      this.post<any>('/api/forecasting/v2/retrain/', data),
  };
}

const api = new ApiService(API_BASE_URL);

export default api;
export type { LoginCredentials, User, PaginatedResponse };
