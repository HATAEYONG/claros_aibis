/**
 * API Service
 * 백엔드 API와 통신하는 서비스
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 공통 fetch 함수
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =====================================================
// 시스템 API
// =====================================================

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchAPI('/health');
}

export async function testDBConnection(): Promise<{ connected: boolean; message: string }> {
  return fetchAPI('/db/test');
}

export async function getTables(): Promise<{ tables: string[]; count: number }> {
  return fetchAPI('/db/tables');
}

export async function getTableSchema(tableName: string): Promise<{ tableName: string; schema: any[] }> {
  return fetchAPI(`/db/schema/${tableName}`);
}

// =====================================================
// 로트 추적 API
// =====================================================

export interface LotTraceResult {
  lotNo: string;
  productInfo?: {
    productCode: string;
    productName: string;
    specification?: string;
    quantity: number;
    productionDate: string;
    lineCode?: string;
  };
  materialInfo?: Array<{
    materialCode: string;
    materialName: string;
    lotNo: string;
    supplierCode?: string;
    supplierName?: string;
    receiveDate: string;
    quantity: number;
  }>;
  processInfo?: Array<{
    processCode: string;
    processName: string;
    startTime: string;
    endTime?: string;
    workerName?: string;
    equipmentCode?: string;
    equipmentName?: string;
    status: string;
  }>;
  qualityInfo?: Array<{
    inspectionId: string;
    inspectionType: string;
    inspectionDate: string;
    result: 'PASS' | 'FAIL' | 'PENDING';
    inspector?: string;
    defectType?: string;
    defectQty?: number;
  }>;
  equipmentInfo?: Array<{
    equipmentCode: string;
    equipmentName: string;
    equipmentType?: string;
    status: string;
    lastMaintenance?: string;
    operatingHours?: number;
  }>;
  workerInfo?: Array<{
    workerId: string;
    workerName: string;
    department?: string;
    shift?: string;
    skillLevel?: string;
  }>;
  defectInfo?: Array<{
    defectId: string;
    defectType: string;
    defectDate: string;
    quantity: number;
    cause?: string;
    action?: string;
    status: string;
  }>;
  traceHistory: Array<{
    timestamp: string;
    event: string;
    description: string;
    relatedTable?: string;
    relatedId?: string;
  }>;
}

export async function traceLot(lotNo: string): Promise<LotTraceResult> {
  return fetchAPI(`/lot/trace/${encodeURIComponent(lotNo)}`);
}

// =====================================================
// 원인 분석 API
// =====================================================

export interface CausalQueryResult {
  category: string;
  subcategory: string;
  data: any[];
  insights: string[];
}

export interface CausalAnalysisResult {
  man: CausalQueryResult;
  machine: CausalQueryResult;
  material: CausalQueryResult;
  method: CausalQueryResult;
  measurement: CausalQueryResult;
  summary: string[];
}

export async function getCausalAnalysis(
  lotNo?: string,
  startDate?: string,
  endDate?: string
): Promise<CausalAnalysisResult> {
  const params = new URLSearchParams();
  if (lotNo) params.append('lotNo', lotNo);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  return fetchAPI(`/analysis/causal${queryString ? `?${queryString}` : ''}`);
}

export async function getDefectAnalysis(defectType: string): Promise<{
  defectType: string;
  causes: Array<{
    defect_type: string;
    cause: string;
    occurrence_count: number;
    actions_taken: string;
  }>;
  totalOccurrences: number;
}> {
  return fetchAPI(`/analysis/defect/${encodeURIComponent(defectType)}`);
}

// =====================================================
// 대시보드 API
// =====================================================

export async function getDefectSummary(startDate?: string, endDate?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  return fetchAPI(`/dashboard/defects${queryString ? `?${queryString}` : ''}`);
}

export async function getEquipmentStatus(): Promise<any[]> {
  return fetchAPI('/dashboard/equipment');
}

export async function getDailyProduction(date?: string): Promise<any[]> {
  const params = date ? `?date=${date}` : '';
  return fetchAPI(`/dashboard/production${params}`);
}

// =====================================================
// SQL 실행 API
// =====================================================

export interface SQLExecuteResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export async function executeSQL(sql: string): Promise<SQLExecuteResult> {
  return fetchAPI('/sql/execute', {
    method: 'POST',
    body: JSON.stringify({ sql }),
  });
}

// =====================================================
// 연결 상태 관리
// =====================================================

let isBackendAvailable = false;

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const result = await healthCheck();
    isBackendAvailable = result.status === 'ok';
    return isBackendAvailable;
  } catch {
    isBackendAvailable = false;
    return false;
  }
}

export function isBackendConnected(): boolean {
  return isBackendAvailable;
}
