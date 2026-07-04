/**
 * 이벤트 서비스 - 이벤트 관리 API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 이벤트 관련 타입
export type EventType =
  | 'KPI_DEVIATION'
  | 'COST_VARIANCE_BREACH'
  | 'MATERIAL_PRICE_SPIKE'
  | 'SUPPLIER_RISK_ALERT'
  | 'OUTPUT_SHORTFALL'
  | 'CAPACITY_OVERLOAD'
  | 'DEFECT_CLUSTER'
  | 'CAPA_OVERDUE'
  | 'CASHFLOW_STRESS'
  | 'BUDGET_OVERRUN'
  | 'ABNORMAL_JOURNAL'
  | 'OVERTIME_SURGE'
  | 'SOP_NONCOMPLIANCE'
  | 'APPROVAL_BYPASS';

export type EventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
export type EventDomain = 'cost' | 'finance' | 'purchasing' | 'production' | 'quality' | 'inventory' | 'maintenance' | 'sales' | 'hr' | 'compliance';

export interface Event {
  event_id: string;
  event_type: EventType;
  severity: EventSeverity;
  status: EventStatus;
  scope_type: string;
  scope_id: string;
  scope_name: string;
  domain: EventDomain;
  process_code: string;
  title: string;
  description: string;
  observed_value?: number;
  threshold_value?: number;
  deviation_pct?: number;
  kpi_code: string;
  kri_code: string;
  source: string;
  source_detail: Record<string, any>;
  evidence_refs: Array<any>;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  detected_by_agent?: string;
  agent_run_id?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

export interface EventCorrelation {
  correlation_id: string;
  source_event_id: string;
  target_event_id: string;
  correlation_type: string;
  confidence: number;
  description: string;
  analysis_method: string;
  time_lag_seconds?: number;
  created_at: string;
}

export interface EventStatistics {
  period_days: number;
  total_events: number;
  status_distribution: Array<{ status: string; count: number }>;
  severity_distribution: Array<{ severity: string; count: number }>;
  type_distribution: Array<{ event_type: string; count: number }>;
  domain_distribution: Array<{ domain: string; count: number }>;
  avg_resolution_time_hours: number | null;
}

export interface EventCluster {
  domain: string;
  process_code: string;
  event_count: number;
  event_types: string[];
}

/**
 * 이벤트 목록 조회
 */
export async function getEvents(params?: {
  event_type?: EventType;
  severity?: EventSeverity;
  status?: EventStatus;
  domain?: EventDomain;
  start_date?: string;
  end_date?: string;
  min_severity?: EventSeverity;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: Event[]; count: number }> {
  const queryParams = new URLSearchParams();

  if (params?.event_type) queryParams.append('event_type', params.event_type);
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.domain) queryParams.append('domain', params.domain);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.min_severity) queryParams.append('min_severity', params.min_severity);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/events/events/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

/**
 * 이벤트 상세 조회
 */
export async function getEvent(eventId: string): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }
  return response.json();
}

/**
 * 이벤트 확인
 */
export async function acknowledgeEvent(eventId: string, user?: string): Promise<{
  message: string;
  event_id: string;
  status: EventStatus;
  acknowledged_at: string;
  acknowledged_by: string;
}> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/acknowledge/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user }),
  });

  if (!response.ok) {
    throw new Error('Failed to acknowledge event');
  }
  return response.json();
}

/**
 * 이벤트 해결
 */
export async function resolveEvent(eventId: string, note: string, user?: string): Promise<{
  message: string;
  event_id: string;
  status: EventStatus;
  resolved_at: string;
  resolved_by: string;
}> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/resolve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ note, user }),
  });

  if (!response.ok) {
    throw new Error('Failed to resolve event');
  }
  return response.json();
}

/**
 * 이벤트 무시
 */
export async function dismissEvent(eventId: string): Promise<{
  message: string;
  event_id: string;
  status: EventStatus;
}> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/dismiss/`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to dismiss event');
  }
  return response.json();
}

/**
 * 이벤트 상관관계 조회
 */
export async function getEventCorrelations(eventId: string): Promise<{
  correlations_from: Array<{
    correlation_id: string;
    target_event_id: string;
    correlation_type: string;
    confidence: number;
    description: string;
    target_event?: Partial<Event>;
  }>;
  correlations_to: Array<{
    correlation_id: string;
    source_event_id: string;
    correlation_type: string;
    confidence: number;
    description: string;
    source_event?: Partial<Event>;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/correlations/`);
  if (!response.ok) {
    throw new Error('Failed to fetch event correlations');
  }
  return response.json();
}

/**
 * 자동 상관관계 분석 실행
 */
export async function autoCorrelateEvent(eventId: string, maxCorrelations?: number): Promise<{
  message: string;
  correlations: Array<{
    correlation_id: string;
    source_event_id: string;
    target_event_id: string;
    correlation_type: string;
    confidence: number;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/auto_correlate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_correlations: maxCorrelations || 5 }),
  });

  if (!response.ok) {
    throw new Error('Failed to auto correlate event');
  }
  return response.json();
}

/**
 * 이벤트 통계 조회
 */
export async function getEventStatistics(days?: number): Promise<EventStatistics> {
  const queryParams = days ? `?days=${days}` : '';
  const response = await fetch(`${API_BASE_URL}/events/statistics/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch event statistics');
  }
  return response.json();
}

/**
 * 이벤트 클러스터 조회
 */
export async function getEventClusters(hours?: number, minEvents?: number): Promise<{
  hours: number;
  min_events: number;
  clusters: EventCluster[];
}> {
  const queryParams = new URLSearchParams();
  if (hours) queryParams.append('hours', hours.toString());
  if (minEvents) queryParams.append('min_events', minEvents.toString());

  const response = await fetch(`${API_BASE_URL}/events/clusters/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch event clusters');
  }
  return response.json();
}

/**
 * KPI 편차 이벤트 생성
 */
export async function createKPIDeviationEvent(params: {
  kpi_code: string;
  kpi_name: string;
  observed_value: number;
  target_value: number;
  threshold_pct: number;
  domain: string;
  scope_type?: string;
  scope_id?: string;
}): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/events/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'KPI_DEVIATION',
      ...params,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create KPI deviation event');
  }
  return response.json();
}

/**
 * 공급자 위험 이벤트 생성
 */
export async function createSupplierRiskEvent(params: {
  supplier_code: string;
  supplier_name: string;
  risk_score: number;
  risk_factors: string[];
}): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/events/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'SUPPLIER_RISK_ALERT',
        domain: 'purchasing',
        process_code: 'P2P',
        scope_type: 'supplier',
        scope_id: params.supplier_code,
        scope_name: params.supplier_name,
        title: `공급자 위험 경고: ${params.supplier_name}`,
        description: `위험 점수 ${params.risk_score}점 (${params.risk_factors.join(', ')})`,
        observed_value: params.risk_score,
        threshold_value: 70,
        deviation_pct: params.risk_score - 70,
        source_detail: { risk_factors: params.risk_factors },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create supplier risk event');
  }
  return response.json();
}
