/**
 * 컨트롤 타워 서비스 - 통합 대시보드 API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 컨트롤 타워 관련 타입
export type TowerType = 'executive' | 'functional' | 'process';

export interface ControlTowerData {
  tower_type: TowerType;
  timestamp: string;
  summary: {
    total_events: number;
    critical_events: number;
    pending_approvals: number;
    active_recommendations: number;
  };
  kpis: Array<{
    code: string;
    name: string;
    value: number;
    target: number;
    variance_pct: number;
    status: 'on_track' | 'warning' | 'critical';
  }>;
  alerts: Array<{
    event_id: string;
    title: string;
    severity: string;
    event_type: string;
    event_time: string;
  }>;
  recommendations: Array<{
    recommendation_id: string;
    title: string;
    priority: string;
    domain: string;
    created_at: string;
  }>;
  metrics: Record<string, any>;
}

export interface ExecutiveTowerData extends ControlTowerData {
  tower_type: 'executive';
  financial_summary: {
    revenue: number;
    revenue_growth_pct: number;
    operating_profit: number;
    operating_margin: number;
    net_profit: number;
  };
  operational_summary: {
    production_volume: number;
    quality_rate: number;
    on_time_delivery_rate: number;
    inventory_turnover: number;
  };
  risk_summary: {
    total_risks: number;
    high_risks: number;
    open_violations: number;
  };
}

export interface FunctionalTowerData extends ControlTowerData {
  tower_type: 'functional';
  domain: string;
  domain_metrics: Record<string, any>;
}

export interface ProcessTowerData extends ControlTowerData {
  tower_type: 'process';
  process_code: string;
  process_name: string;
  process_metrics: {
    cycle_time: number;
    throughput: number;
    efficiency: number;
    quality_rate: number;
  };
}

/**
 * 경영진 컨트롤 타워 조회
 */
export async function getExecutiveTower(params?: {
  period?: string;
  domain?: string;
}): Promise<ExecutiveTowerData> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.domain) queryParams.append('domain', params.domain);

  const response = await fetch(`${API_BASE_URL}/control-tower/executive/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch executive tower data');
  }
  return response.json();
}

/**
 * 기능별 컨트롤 타워 조회
 */
export async function getFunctionalTower(domain: string, params?: {
  period?: string;
}): Promise<FunctionalTowerData> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);

  const response = await fetch(`${API_BASE_URL}/control-tower/functional/${domain}/?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch functional tower data for domain: ${domain}`);
  }
  return response.json();
}

/**
 * 프로세스 컨트롤 타워 조회
 */
export async function getProcessTower(processCode: string, params?: {
  period?: string;
}): Promise<ProcessTowerData> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);

  const response = await fetch(`${API_BASE_URL}/control-tower/process/${processCode}/?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch process tower data for: ${processCode}`);
  }
  return response.json();
}

/**
 * 모든 컨트롤 타워 데이터 조회 (통합)
 */
export async function getAllTowerData(params?: {
  period?: string;
}): Promise<{
  executive: ExecutiveTowerData;
  functional: Record<string, FunctionalTowerData>;
  process: Record<string, ProcessTowerData>;
}> {
  const queryParams = params?.period ? `?period=${params.period}` : '';

  // 병렬로 모든 타워 데이터 조회
  const [executive, financial, production, quality, sales, purchase] = await Promise.all([
    getExecutiveTower(params),
    getFunctionalTower('financial', params),
    getFunctionalTower('production', params),
    getFunctionalTower('quality', params),
    getFunctionalTower('sales', params),
    getFunctionalTower('purchase', params),
  ]);

  return {
    executive,
    functional: {
      financial,
      production,
      quality,
      sales,
      purchase,
    },
    process: {},
  };
}

/**
 * 컨트롤 타워 설정 조회
 */
export async function getTowerConfig(towerType: TowerType): Promise<{
  config_id: string;
  name: string;
  code: string;
  description: string;
  config: Record<string, any>;
  metrics: any[];
  alert_config: Record<string, any>;
}> {
  const response = await fetch(`${API_BASE_URL}/control-tower/config/${towerType}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tower config for: ${towerType}`);
  }
  return response.json();
}

/**
 * 컨트롤 타워 대시보드 레이아웃 조회
 */
export async function getTowerLayout(towerType: TowerType): Promise<{
  layout_id: string;
  name: string;
  layout: Record<string, any>;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/control-tower/layout/${towerType}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tower layout for: ${towerType}`);
  }
  return response.json();
}

/**
 * 경영진 대시보드용 집계 데이터 조회
 */
export async function getExecutiveSummary(period?: string): Promise<{
  period: string;
  summary: {
    total_revenue: number;
    revenue_growth: number;
    total_cost: number;
    cost_variance: number;
    operating_profit: number;
    net_profit: number;
    production_volume: number;
    quality_rate: number;
    employee_count: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    count: number;
  }>;
  trends: {
    revenue: Array<{ period: string; value: number }>;
    cost: Array<{ period: string; value: number }>;
    production: Array<{ period: string; value: number }>;
    quality: Array<{ period: string; value: number }>;
  };
}> {
  const queryParams = period ? `?period=${period}` : '';
  const response = await fetch(`${API_BASE_URL}/control-tower/summary/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch executive summary');
  }
  return response.json();
}

/**
 * 원가 컨트롤 타워 데이터 조회
 */
export async function getCostTower(params?: {
  period?: string;
  cost_center?: string;
}): Promise<{
  domain: 'cost';
  period: string;
  summary: {
    total_cost: number;
    standard_cost: number;
    variance: number;
    variance_pct: number;
  };
  cost_centers: Array<{
    cost_center: string;
    name: string;
    actual_cost: number;
    standard_cost: number;
    variance_pct: number;
    status: string;
  }>;
  alerts: Array<{
    cost_center: string;
    variance_pct: number;
    severity: string;
  }>;
}> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.cost_center) queryParams.append('cost_center', params.cost_center);

  const response = await fetch(`${API_BASE_URL}/control-tower/functional/cost/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cost tower data');
  }
  return response.json();
}

/**
 * 품질 컨트롤 타워 데이터 조회
 */
export async function getQualityTower(params?: {
  period?: string;
  product?: string;
}): Promise<{
  domain: 'quality';
  period: string;
  summary: {
    total_inspections: number;
    pass_rate: number;
    defect_rate: number;
    capa_open: number;
    capa_overdue: number;
  };
  top_defects: Array<{
    defect_type: string;
    count: number;
    trend: string;
  }>;
  alerts: Array<{
    product: string;
    defect_rate: number;
    severity: string;
  }>;
}> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.product) queryParams.append('product', params.product);

  const response = await fetch(`${API_BASE_URL}/control-tower/functional/quality/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quality tower data');
  }
  return response.json();
}

/**
 * 생산 컨트롤 타워 데이터 조회
 */
export async function getProductionTower(params?: {
  period?: string;
  line?: string;
}): Promise<{
  domain: 'production';
  period: string;
  summary: {
    planned_volume: number;
    actual_volume: number;
    achievement_rate: number;
    efficiency: number;
    downtime: number;
  };
  lines: Array<{
    line: string;
    name: string;
    planned: number;
    actual: number;
    achievement_rate: number;
    status: string;
  }>;
  alerts: Array<{
    line: string;
    shortfall_pct: number;
    severity: string;
  }>;
}> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.line) queryParams.append('line', params.line);

  const response = await fetch(`${API_BASE_URL}/control-tower/functional/production/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch production tower data');
  }
  return response.json();
}
