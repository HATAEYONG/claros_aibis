/**
 * API Service
 * 백엔드 API와 통신하는 서비스
 * 향상된 에러 처리, 재시도 로직, 캐싱 포함
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// =====================================================
// 에러 타입 정의
// =====================================================

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// =====================================================
// 캐싱 설정
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5분

function getCacheKey(endpoint: string, options?: FetchAPIOptions): string {
  const method = options?.method || 'GET';
  const body = options?.body;
  return `${method}:${endpoint}:${body || ''}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// =====================================================
// 재시도 로직
// =====================================================

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(status: number, attempt: number, config: RetryConfig): boolean {
  return attempt < config.maxRetries && config.retryableStatuses.includes(status);
}

// =====================================================
// 공통 fetch 함수 (향상된 버전)
// =====================================================

interface FetchAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: RequestInit['body'];
  timeout?: number;
  retry?: Partial<RetryConfig>;
  cache?: boolean | number; // false = no cache, true = default TTL, number = custom TTL
  skipCache?: boolean;
  signal?: AbortSignal;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchAPIOptions = {}
): Promise<T> {
  const {
    timeout = 30000, // 30초 기본 타임아웃
    retry = {},
    cache: cacheOption = false,
    skipCache = false,
    ...fetchOptions
  } = options;

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry };
  const cacheKey = getCacheKey(endpoint, fetchOptions);

  // 캐시 확인 (GET 요청만)
  if (!skipCache && cacheOption && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) return cached;
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        signal: controller.signal,
        ...fetchOptions,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 재시도 가능한 상태인지 확인
        if (shouldRetry(response.status, attempt, retryConfig)) {
          attempt++;
          await sleep(retryConfig.retryDelay * attempt); // 지수 백오프
          continue;
        }
        throw new APIError(response.status, response.statusText);
      }

      const data = await response.json();

      // 캐시 저장 (GET 요청만)
      if (cacheOption && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        const ttl = typeof cacheOption === 'number' ? cacheOption : DEFAULT_CACHE_TTL;
        setCache(cacheKey, data, ttl);
      }

      return data;

    } catch (error) {
      lastError = error as Error;

      // 타임아웃 에러
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new TimeoutError();
        attempt++;
        await sleep(retryConfig.retryDelay * attempt);
        continue;
      }

      // 네트워크 에러 (재시도)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        attempt++;
        await sleep(retryConfig.retryDelay * attempt);
        continue;
      }

      // API 에러 (이미 처리됨)
      if (error instanceof APIError) {
        throw error;
      }

      // 기타 에러는 재시도하지 않음
      throw error;
    }
  }

  throw lastError || new NetworkError('Max retries exceeded');
}

// =====================================================
// 시스템 API
// =====================================================

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchAPI('/health', { cache: 30000 }); // 30초 캐시
}

export async function testDBConnection(): Promise<{ connected: boolean; message: string }> {
  return fetchAPI('/db/test', { skipCache: true }); // 항상 새로운 요청
}

export async function getTables(): Promise<{ tables: string[]; count: number }> {
  return fetchAPI('/db/tables', { cache: true }); // 기본 캐시 사용
}

export async function getTableSchema(tableName: string): Promise<{ tableName: string; schema: any[] }> {
  return fetchAPI(`/db/schema/${tableName}`, { cache: 10 * 60 * 1000 }); // 10분 캐시
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
  return fetchAPI(`/lot/trace/${encodeURIComponent(lotNo)}`, { cache: 60000 }); // 1분 캐시
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
  return fetchAPI(`/dashboard/defects${queryString ? `?${queryString}` : ''}`, { cache: 120000 }); // 2분 캐시
}

export async function getEquipmentStatus(): Promise<any[]> {
  return fetchAPI('/dashboard/equipment', { cache: 60000 }); // 1분 캐시
}

export async function getDailyProduction(date?: string): Promise<any[]> {
  const params = date ? `?date=${date}` : '';
  return fetchAPI(`/dashboard/production${params}`, { cache: true });
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

// =====================================================
// 로딩 상태 관리
// =====================================================

class LoadingStateManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<(state: Map<string, boolean>) => void>();

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  setLoading(key: string, loading: boolean): void {
    if (loading) {
      this.loadingStates.set(key, true);
    } else {
      this.loadingStates.delete(key);
    }
    this.notifyListeners();
  }

  isAnyLoading(): boolean {
    return this.loadingStates.size > 0;
  }

  subscribe(listener: (state: Map<string, boolean>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = new Map(this.loadingStates);
    this.listeners.forEach(listener => listener(state));
  }

  clear(): void {
    this.loadingStates.clear();
    this.notifyListeners();
  }
}

export const loadingManager = new LoadingStateManager();

// =====================================================
// API 요청 래퍼 (로딩 상태 자동 관리)
// =====================================================

interface WithLoadingOptions<T> extends FetchAPIOptions {
  loadingKey?: string;
}

export async function withLoading<T>(
  key: string,
  apiCall: () => Promise<T>,
  options: WithLoadingOptions<T> = {}
): Promise<T> {
  const loadingKey = options.loadingKey || key;
  loadingManager.setLoading(loadingKey, true);

  try {
    return await apiCall();
  } finally {
    loadingManager.setLoading(loadingKey, false);
  }
}

// =====================================================
// 배치 요청 유틸리티
// =====================================================

export async function fetchBatch<T>(
  requests: Array<() => Promise<T>>,
  options: { maxConcurrent?: number; delayMs?: number } = {}
): Promise<T[]> {
  const { maxConcurrent = 5, delayMs = 100 } = options;
  const results: T[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch.map(fn => fn()));

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results[i + idx] = result.value;
      } else {
        errors.push({ index: i + idx, error: result.reason as Error });
        results[i + idx] = null as T;
      }
    });

    if (i + maxConcurrent < requests.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} requests failed:`, errors);
  }

  return results;
}

// =====================================================
// 요청 취소 유틸리티
// =====================================================

class RequestManager {
  private controllers = new Map<string, AbortController>();

  create(requestId: string): AbortController {
    this.cancel(requestId); // 기존 요청 취소
    const controller = new AbortController();
    this.controllers.set(requestId, controller);
    return controller;
  }

  cancel(requestId: string): void {
    const controller = this.controllers.get(requestId);
    if (controller) {
      controller.abort();
      this.controllers.delete(requestId);
    }
  }

  cancelAll(): void {
    this.controllers.forEach(controller => controller.abort());
    this.controllers.clear();
  }
}

export const requestManager = new RequestManager();

// =====================================================
// 통계 유틸리티
// =====================================================

interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  avgResponseTime: number;
}

class APIStatsManager {
  private stats: APIStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    avgResponseTime: 0,
  };
  private responseTimes: number[] = [];

  recordRequest(success: boolean, cached: boolean, responseTime: number): void {
    this.stats.totalRequests++;
    if (success) this.stats.successfulRequests++;
    else this.stats.failedRequests++;
    if (cached) this.stats.cachedRequests++;

    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    this.stats.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  getStats(): APIStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      avgResponseTime: 0,
    };
    this.responseTimes = [];
  }
}

export const apiStats = new APIStatsManager();

// 통계 수집이 포함된 fetchAPI 래퍼
async function fetchAPIWithStats<T>(
  endpoint: string,
  options: FetchAPIOptions = {}
): Promise<T> {
  const startTime = Date.now();
  let cached = false;
  let success = false;

  try {
    // 캐시 확인
    if (options.cache && !options.skipCache) {
      const cacheKey = getCacheKey(endpoint, options);
      const cachedData = getFromCache<T>(cacheKey);
      if (cachedData) {
        cached = true;
        success = true;
        apiStats.recordRequest(success, cached, Date.now() - startTime);
        return cachedData;
      }
    }

    // 통계를 위해 기본 fetchAPI 호출
    const result = await fetchAPI<T>(endpoint, options);
    success = true;
    return result;
  } catch (error) {
    // 에러도 기록
    success = false;
    throw error;
  } finally {
    apiStats.recordRequest(success, cached, Date.now() - startTime);
  }
}

// 통계가 필요한 경우 fetchAPIWithStats 사용
export { fetchAPIWithStats as fetchAPIWithStats };
