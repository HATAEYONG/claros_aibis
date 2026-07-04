/**
 * 에이전트 서비스 - 에이전트 오케스트레이션 API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 에이전트 관련 타입
export interface AgentInfo {
  name: string;
  version: string;
  domain: string;
  layer: string;
  description: string;
  requires_human_approval: boolean;
}

export interface AgentExecutionRequest {
  agent_name: string;
  query?: string;
  context?: Record<string, any>;
  parameters?: Record<string, any>;
  evidence_required?: boolean;
  requested_by?: string;
  parent_run_id?: string;
  domain?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentExecutionResult {
  request_id: string;
  agent_name: string;
  status: string;
  result: Record<string, any>;
  evidence_refs: Array<{
    evidence_type: string;
    source: string;
    source_id: string;
    description: string;
  }>;
  confidence: number;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
  warnings: string[];
  errors: string[];
  metadata: Record<string, any>;
  execution_time_ms: number;
  next_agents: string[];
}

export interface AgentStats {
  total_runs: number;
  success_runs: number;
  success_rate: number;
  avg_execution_time_ms: number;
  layer_stats: Record<string, {
    total: number;
    success: number;
    success_rate: number;
  }>;
}

export interface AgentRunLog {
  request_id: string;
  agent_name: string;
  status: string;
  confidence: number;
  execution_time_ms: number;
  created_at: string;
}

/**
 * 에이전트 레지스트리 조회
 */
export async function getAgentRegistry(): Promise<{ total: number; agents: AgentInfo[] }> {
  const response = await fetch(`${API_BASE_URL}/agents/registry/`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent registry');
  }
  return response.json();
}

/**
 * 에이전트 통계 조회
 */
export async function getAgentStats(): Promise<AgentStats> {
  const response = await fetch(`${API_BASE_URL}/agents/stats/`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent stats');
  }
  return response.json();
}

/**
 * 에이전트 실행
 */
export async function executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
  const response = await fetch(`${API_BASE_URL}/agents/execute/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to execute agent');
  }

  return response.json();
}

/**
 * 에이전트 실행 로그 조회
 */
export async function getAgentRunLogs(params?: {
  agent_name?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: AgentRunLog[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/agents/runs/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent run logs');
  }
  return response.json();
}

/**
 * 에이전트 실행 로그 상세 조회
 */
export async function getAgentRunLog(runId: string): Promise<AgentRunLog> {
  const response = await fetch(`${API_BASE_URL}/agents/runs/${runId}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent run log');
  }
  return response.json();
}

/**
 * KPI 에이전트 실행 (편차 감지)
 */
export async function executeKPIAgent(params: {
  kpi_code: string;
  kpi_name: string;
  observed_value: number;
  target_value: number;
  threshold_pct: number;
  domain: string;
}): Promise<AgentExecutionResult> {
  return executeAgent({
    agent_name: 'KPIAgent',
    parameters: params,
  });
}

/**
 * 리스크 에이전트 실행
 */
export async function executeRiskAgent(params: {
  risk_type: 'supplier' | 'quality' | 'budget' | 'cashflow' | 'production';
  [key: string]: any;
}): Promise<AgentExecutionResult> {
  return executeAgent({
    agent_name: 'RiskAgent',
    parameters: params,
  });
}

/**
 * 근본 원인 분석 에이전트 실행
 */
export async function executeRootCauseAgent(params: {
  event_id?: string;
  issue_type?: string;
  analysis_depth?: number;
  context?: Record<string, any>;
}): Promise<AgentExecutionResult> {
  return executeAgent({
    agent_name: 'RootCauseAgent',
    parameters: params,
  });
}

/**
 * 추천 에이전트 실행
 */
export async function executeRecommendationAgent(params: {
  analysis_type: string;
  root_causes: Array<{
    category: string;
    cause: string;
    confidence: number;
  }>;
  context?: Record<string, any>;
}): Promise<AgentExecutionResult> {
  return executeAgent({
    agent_name: 'RecommendationAgent',
    parameters: params,
  });
}

/**
 * 예측 에이전트 실행
 */
export async function executeForecastAgent(params: {
  target_type: string;
  horizon: '1d' | '1w' | '1m' | '3m';
  parameters?: Record<string, any>;
}): Promise<AgentExecutionResult> {
  return executeAgent({
    agent_name: 'ForecastAgent',
    parameters: params,
  });
}
