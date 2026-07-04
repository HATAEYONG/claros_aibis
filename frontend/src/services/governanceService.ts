/**
 * 거버넌스 서비스 - 정책 및 승인 관리 API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 거버넌스 관련 타입
export type PolicyCategory = 'compliance' | 'security' | 'quality' | 'safety' | 'financial' | 'operational';
export type PolicySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ViolationStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type EntityType = 'user' | 'agent' | 'system' | 'process';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type BusinessImpact = 'low' | 'medium' | 'high' | 'critical';

export interface PolicyRule {
  rule_id: string;
  code: string;
  name_ko: string;
  name_en: string;
  category: PolicyCategory;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: any[];
  severity: PolicySeverity;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PolicyViolation {
  violation_id: string;
  policy_rule: Partial<PolicyRule>;
  violating_entity: string;
  entity_type: EntityType;
  violation_details: Record<string, any>;
  severity: PolicySeverity;
  status: ViolationStatus;
  resolution: string;
  resolved_at?: string;
  resolved_by?: string;
  detected_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  request_id: string;
  recommendation_id?: string;
  title: string;
  description: string;
  requested_by: string;
  approval_level: number;
  status: ApprovalStatus;
  current_approver?: string;
  business_impact: BusinessImpact;
  approval_history: Array<{
    action: string;
    approver?: string;
    user?: string;
    comment?: string;
    reason?: string;
    timestamp: string;
  }>;
  rejection_reason: string;
  created_at: string;
  approved_at?: string;
}

export interface ApprovalStatistics {
  period_days: number;
  total_requests: number;
  approved: number;
  rejected: number;
  pending: number;
  approval_rate: number;
  level_distribution: Record<string, number>;
  avg_processing_time_hours: number | null;
}

/**
 * 정책 규칙 목록 조회
 */
export async function getPolicyRules(params?: {
  category?: PolicyCategory;
  severity?: PolicySeverity;
  is_active?: boolean;
}): Promise<PolicyRule[]> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

  const response = await fetch(`${API_BASE_URL}/governance/policies/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch policy rules');
  }
  return response.json();
}

/**
 * 정책 위반 목록 조회
 */
export async function getPolicyViolations(params?: {
  policy_rule?: string;
  severity?: PolicySeverity;
  status?: ViolationStatus;
  entity_type?: EntityType;
}): Promise<PolicyViolation[]> {
  const queryParams = new URLSearchParams();
  if (params?.policy_rule) queryParams.append('policy_rule', params.policy_rule);
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.entity_type) queryParams.append('entity_type', params.entity_type);

  const response = await fetch(`${API_BASE_URL}/governance/violations/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch policy violations');
  }
  return response.json();
}

/**
 * 정책 위반 해결
 */
export async function resolveViolation(violationId: string, resolution: string): Promise<{
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/governance/violations/${violationId}/resolve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolution }),
  });

  if (!response.ok) {
    throw new Error('Failed to resolve violation');
  }
  return response.json();
}

/**
 * 승인 요청 목록 조회
 */
export async function getApprovalRequests(params?: {
  status?: ApprovalStatus;
  approval_level?: number;
  business_impact?: BusinessImpact;
  requested_by?: string;
}): Promise<ApprovalRequest[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.approval_level) queryParams.append('approval_level', params.approval_level.toString());
  if (params?.business_impact) queryParams.append('business_impact', params.business_impact);
  if (params?.requested_by) queryParams.append('requested_by', params.requested_by);

  const response = await fetch(`${API_BASE_URL}/governance/approvals/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval requests');
  }
  return response.json();
}

/**
 * 승인 요청 상세 조회
 */
export async function getApprovalRequest(requestId: string): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE_URL}/governance/approvals/${requestId}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval request');
  }
  return response.json();
}

/**
 * 승인 요청 생성
 */
export async function createApprovalRequest(params: {
  title: string;
  description: string;
  requested_by: string;
  recommendation_id?: string;
  category?: string;
  business_impact?: BusinessImpact;
  context?: Record<string, any>;
}): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE_URL}/governance/approvals/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to create approval request');
  }
  return response.json();
}

/**
 * 승인 요청 승인
 */
export async function approveRequest(requestId: string, approver: string, comment?: string): Promise<{
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/governance/approvals/${requestId}/approve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ approver, comment }),
  });

  if (!response.ok) {
    throw new Error('Failed to approve request');
  }
  return response.json();
}

/**
 * 승인 요청 거부
 */
export async function rejectRequest(requestId: string, approver: string, reason: string): Promise<{
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/governance/approvals/${requestId}/reject/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ approver, reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject request');
  }
  return response.json();
}

/**
 * 승인 통계 조회
 */
export async function getApprovalStatistics(days?: number): Promise<ApprovalStatistics> {
  const queryParams = days ? `?days=${days}` : '';
  const response = await fetch(`${API_BASE_URL}/governance/statistics/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch approval statistics');
  }
  return response.json();
}

/**
 * 대기 중인 승인 요청 조회
 */
export async function getPendingApprovals(user?: string): Promise<ApprovalRequest[]> {
  const queryParams = user ? `?requested_by=${user}` : '';
  const response = await fetch(`${API_BASE_URL}/governance/pending/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending approvals');
  }
  return response.json();
}

/**
 * 추천사항 승인 요청 생성 (편의 함수)
 */
export async function createRecommendationApproval(recommendationId: string, approver: string): Promise<ApprovalRequest> {
  // 추천 정보 조회
  const recResponse = await fetch(`${API_BASE_URL}/ai/recommendations/${recommendationId}/`);
  if (!recResponse.ok) {
    throw new Error('Failed to fetch recommendation');
  }
  const recommendation = await recResponse.json();

  return createApprovalRequest({
    title: recommendation.title,
    description: recommendation.description,
    requested_by: approver,
    recommendation_id: recommendationId,
    category: recommendation.domain,
    business_impact: recommendation.priority === 'urgent' ? 'critical' :
                   recommendation.priority === 'high' ? 'high' : 'medium',
  });
}
