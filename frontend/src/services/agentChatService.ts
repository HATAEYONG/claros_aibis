/**
 * AI Agent Chat Service
 * 에이전트 오케스트레이션 기반 AI 챗봇 서비스
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentTrace?: AgentTraceEntry[];
  evidence?: Evidence[];
  relatedQueries?: string[];
  recommendations?: Recommendation[];
  warnings?: string[];
  confidence?: number;
  status?: 'success' | 'partial' | 'error' | 'no_results';
}

export interface AgentTraceEntry {
  sequence: number;
  agent_name: string;
  agent_domain: string;
  agent_layer: string;
  status: string;
  confidence: number;
  execution_time_ms: number;
  started_at: string;
  completed_at: string;
  result_summary: string;
  evidence_count: number;
}

export interface Evidence {
  evidence_type: string;
  source: string;
  source_id?: string;
  source_agent?: string;
  description: string;
  data?: Record<string, any>;
  timestamp?: string;
}

export interface Recommendation {
  title?: string;
  type?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  description: string;
  expected_impact?: string;
  source_agent?: string;
}

export interface AgentInfo {
  name: string;
  version: string;
  domain: string;
  layer: string;
  description: string;
  requires_human_approval: boolean;
}

export interface AgentRegistryResponse {
  total_count: number;
  agents: AgentInfo[];
  by_domain: Record<string, AgentInfo[]>;
  by_layer: Record<string, AgentInfo[]>;
}

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
  user?: string;
  use_agents?: boolean;
}

export interface ChatResponse {
  answer: string;
  status: 'success' | 'partial' | 'error' | 'no_results';
  confidence: number;
  agent_trace: AgentTraceEntry[];
  evidence: Evidence[];
  related_queries: string[];
  recommendations: Recommendation[];
  warnings: string[];
  metadata?: {
    query_analysis?: Record<string, any>;
    agents_executed?: number;
    total_execution_time_ms?: number;
  };
}

export interface AgentExecuteRequest {
  agent_name: string;
  query: string;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface AgentExecuteResponse {
  agent_name: string;
  status: string;
  result: Record<string, any>;
  confidence: number;
  evidence: Evidence[];
  recommendations: Recommendation[];
  warnings: string[];
  errors: string[];
  execution_time_ms: number;
  metadata: Record<string, any>;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AI_API_BASE = `${API_BASE_URL}/api/v1/ai`;

/**
 * Enhanced AI Chat (에이전트 오케스트레이션 기반)
 */
export async function sendAgentChat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${AI_API_BASE}/chat/v2/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      context: request.context || {},
      user: request.user || 'anonymous',
      use_agents: request.use_agents !== false, // 기본값: true
    }),
  });

  if (!response.ok) {
    throw new Error(`AI chat failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 직접 에이전트 실행
 */
export async function executeAgent(request: AgentExecuteRequest): Promise<AgentExecuteResponse> {
  const response = await fetch(`${AI_API_BASE}/agents/execute/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Agent execution failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 에이전트 레지스트리 조회
 */
export async function getAgentRegistry(): Promise<AgentRegistryResponse> {
  const response = await fetch(`${AI_API_BASE}/agents/registry/`);

  if (!response.ok) {
    throw new Error(`Failed to fetch agent registry: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 에이전트 실행 이력 조회
 */
export async function getAgentHistory(params?: {
  agent_name?: string;
  limit?: number;
  status?: string;
}): Promise<{ total_count: number; executions: any[] }> {
  const queryParams = new URLSearchParams();
  if (params?.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await fetch(`${AI_API_BASE}/agents/history/?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch agent history: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 채팅 메시지 생성 헬퍼
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}`,
    role: 'user',
    content,
    timestamp: Date.now(),
  };
}

export function createAssistantMessage(response: ChatResponse): ChatMessage {
  return {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: response.answer,
    timestamp: Date.now(),
    agentTrace: response.agent_trace,
    evidence: response.evidence,
    relatedQueries: response.related_queries,
    recommendations: response.recommendations,
    warnings: response.warnings,
    confidence: response.confidence,
    status: response.status,
  };
}

export function createErrorMessage(error: string): ChatMessage {
  return {
    id: `msg-${Date.now()}`,
    role: 'system',
    content: `오류가 발생했습니다: ${error}`,
    timestamp: Date.now(),
  };
}

/**
 * 에이전트 레이어 색상 매핑
 */
export const AGENT_LAYER_COLORS: Record<string, string> = {
  monitoring: 'bg-blue-500',
  domain: 'bg-green-500',
  intelligence: 'bg-teal-500',
  analysis: 'bg-purple-500',
  decision: 'bg-orange-500',
  learning: 'bg-pink-500',
};

/**
 * 에이전트 레이어 한글명
 */
export const AGENT_LAYER_NAMES: Record<string, string> = {
  monitoring: '모니터링',
  domain: '도메인 지능',
  intelligence: '지능형',
  analysis: '분석',
  decision: '의사결정',
  learning: '학습',
};

/**
 * 신뢰도 레벨 계산
 */
export function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low';
  color: string;
  text: string;
} {
  if (confidence >= 0.8) {
    return { level: 'high', color: 'text-green-600', text: '높음' };
  } else if (confidence >= 0.5) {
    return { level: 'medium', color: 'text-yellow-600', text: '중간' };
  } else {
    return { level: 'low', color: 'text-red-600', text: '낮음' };
  }
}

/**
 * 상태 색상 매핑
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'no_results':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * 우선순위 색상 매핑
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
