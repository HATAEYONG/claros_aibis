/**
 * 데이터 신선성 체크 유틸리티
 *
 * 데이터 파이프라인 각 스테이지의 데이터 신선성을 확인하고
 * 자동 갱신을 처리하는 유틸리티
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';

// =====================================================
// 데이터 신선성 정보 타입
// =====================================================

export interface DataFreshnessStatus {
  is_fresh: boolean;
  hours_since_sync: number;
  last_sync_time: string | null;
  next_sync_time: string | null;
  data_source: string;
  status: 'fresh' | 'stale' | 'warning' | 'unknown';
}

export interface FreshnessConfig {
  max_age_hours: number;     // 데이터 유효 시간 (시간)
  warning_age_hours: number;  // 경고 표시 시간 (시간)
  auto_refresh: boolean;      // 자동 갱신 여부
  refresh_interval: number;  // 갱신 주기 (ms)
}

// =====================================================
// 기본 신선성 설정
// =====================================================

const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  max_age_hours: 24,          // 24시간 이내면 신선
  warning_age_hours: 12,      // 12시간 이후 경고
  auto_refresh: true,         // 자동 갱신 활성화
  refresh_interval: 300000,   // 5분마다 갱신
};

// 도메인별 신선성 설정
const DOMAIN_FRESHNESS_CONFIGS: Record<string, Partial<FreshnessConfig>> = {
  // 실시간에 가까운 데이터
  production: {
    max_age_hours: 4,
    warning_age_hours: 2,
    refresh_interval: 60000, // 1분
  },
  quality: {
    max_age_hours: 4,
    warning_age_hours: 2,
    refresh_interval: 60000,
  },
  inventory: {
    max_age_hours: 8,
    warning_age_hours: 4,
    refresh_interval: 120000, // 2분
  },

  // 일일 데이터
  sales: {
    max_age_hours: 48,
    warning_age_hours: 24,
    refresh_interval: 300000, // 5분
  },
  financial: {
    max_age_hours: 72,
    warning_age_hours: 48,
    refresh_interval: 600000, // 10분
  },

  // 분석/예측 데이터
  predictions: {
    max_age_hours: 24,
    warning_age_hours: 12,
    refresh_interval: 300000, // 5분
  },
};

// =====================================================
// 데이터 신선성 확인 서비스
// =====================================================

class DataFreshnessChecker {
  private freshnessCache = new Map<string, { status: DataFreshnessStatus; timestamp: number }>();
  private cacheTimeout = 30000; // 30초 캐시

  /**
   * 데이터 신선성 확인
   * @param source 데이터 소스 (테이블명 또는 도메인)
   * @param config 신선성 설정
   */
  async checkFreshness(
    source: string,
    config?: Partial<FreshnessConfig>
  ): Promise<DataFreshnessStatus> {
    // 캐시 확인
    const cached = this.freshnessCache.get(source);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.status;
    }

    try {
      // 도메인별 설정 병합
      const domainConfig = DOMAIN_FRESHNESS_CONFIGS[source] || {};
      const effectiveConfig: FreshnessConfig = {
        ...DEFAULT_FRESHNESS_CONFIG,
        ...domainConfig,
        ...config,
      };

      // 동기화 로그 API 호출
      const response = await api.get<any>(
        `/api/erp-sync/logs/freshness/${source}/`
      );

      const status: DataFreshnessStatus = {
        is_fresh: this.calculateFreshness(response, effectiveConfig),
        hours_since_sync: response.hours_since_sync || 0,
        last_sync_time: response.last_sync_time || null,
        next_sync_time: response.next_sync_time || null,
        data_source: source,
        status: this.calculateStatus(response, effectiveConfig),
      };

      // 캐시 저장
      this.freshnessCache.set(source, {
        status,
        timestamp: Date.now(),
      });

      return status;
    } catch (error) {
      // API 호출 실패 시 알 수 없음 상태 반환
      return {
        is_fresh: false,
        hours_since_sync: 999,
        last_sync_time: null,
        next_sync_time: null,
        data_source: source,
        status: 'unknown',
      };
    }
  }

  /**
   * 데이터 신선성 계산
   */
  private calculateFreshness(
    response: any,
    config: FreshnessConfig
  ): boolean {
    const hoursSince = response.hours_since_sync || 0;
    return hoursSince <= config.max_age_hours;
  }

  /**
   * 데이터 상태 계산
   */
  private calculateStatus(
    response: any,
    config: FreshnessConfig
  ): 'fresh' | 'stale' | 'warning' | 'unknown' {
    const hoursSince = response.hours_since_sync || 0;

    if (hoursSince <= config.max_age_hours) {
      return 'fresh';
    } else if (hoursSince <= config.warning_age_hours) {
      return 'warning';
    } else {
      return 'stale';
    }
  }

  /**
   * 여러 데이터 소스의 신선성 한 번에 확인
   */
  async checkMultipleFreshness(
    sources: string[],
    config?: Partial<FreshnessConfig>
  ): Promise<Map<string, DataFreshnessStatus>> {
    const results = new Map<string, DataFreshnessStatus>();

    await Promise.all(
      sources.map(async (source) => {
        const status = await this.checkFreshness(source, config);
        results.set(source, status);
      })
    );

    return results;
  }

  /**
   * 캐시 비우기
   */
  clearCache(): void {
    this.freshnessCache.clear();
  }
}

// 싱글톤 인스턴스
const freshnessChecker = new DataFreshnessChecker();

export default freshnessChecker;

// =====================================================
// React Hook: useDataFreshness
// =====================================================

export interface UseDataFreshnessOptions extends Partial<FreshnessConfig> {
  enabled?: boolean;  // 체크 활성화 여부
  onStale?: (status: DataFreshnessStatus) => void;  // 데이터 부실 시 콜백
  onRefresh?: () => void;  // 자동 갱신 시 콜백
}

export function useDataFreshness(
  source: string,
  options: UseDataFreshnessOptions = {}
) {
  const {
    enabled = true,
    onStale,
    onRefresh,
    ...configOptions
  } = options;

  const [status, setStatus] = useState<DataFreshnessStatus>({
    is_fresh: false,
    hours_since_sync: 0,
    last_sync_time: null,
    next_sync_time: null,
    data_source: source,
    status: 'unknown',
  });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 신선성 확인 함수
  const checkFreshness = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const result = await freshnessChecker.checkFreshness(source, configOptions);
      setStatus(result);

      // 데이터 부실 시 콜백
      if (onStale && result.status === 'stale') {
        onStale(result);
      }
    } catch (error) {
      console.error(`[${source}] 신선성 확인 실패:`, error);
    } finally {
      setLoading(false);
    }
  }, [source, enabled, configOptions, onStale]);

  // 초기 확인 및 주기적 갱신
  useEffect(() => {
    if (!enabled) return;

    // 초기 확인
    checkFreshness();

    // 도메인별 설정 가져오기
    const domainConfig = DOMAIN_FRESHNESS_CONFIGS[source] || {};
    const effectiveConfig: FreshnessConfig = {
      ...DEFAULT_FRESHNESS_CONFIG,
      ...domainConfig,
      ...configOptions,
    };

    // 주기적 갱신 설정
    if (effectiveConfig.auto_refresh) {
      intervalRef.current = setInterval(() => {
        checkFreshness();
        if (onRefresh) {
          onRefresh();
        }
      }, effectiveConfig.refresh_interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [source, enabled, checkFreshness, configOptions, onRefresh]);

  return {
    status,
    loading,
    isFresh: status.is_fresh,
    isStale: status.status === 'stale',
    isWarning: status.status === 'warning',
    refresh: checkFreshness,
  };
}

// =====================================================
// React Hook: useMultipleDataFreshness
// =====================================================

export function useMultipleDataFreshness(
  sources: string[],
  options: UseDataFreshnessOptions = {}
) {
  const {
    enabled = true,
    onStale,
    onRefresh,
    ...configOptions
  } = options;

  const [statuses, setStatuses] = useState<Map<string, DataFreshnessStatus>>(new Map());
  const [loading, setLoading] = useState(false);

  const checkAllFreshness = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const results = await freshnessChecker.checkMultipleFreshness(sources, configOptions);
      setStatuses(results);

      // 모든 데이터 부실 시 콜백
      const staleSources = Array.from(results.entries())
        .filter(([_, status]) => status.status === 'stale');

      if (onStale && staleSources.length > 0) {
        onStale(staleSources[0][1]); // 첫 번째 부실 데이터로 콜백
      }
    } catch (error) {
      console.error('복수 데이터 신선성 확인 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [sources, enabled, configOptions, onStale]);

  useEffect(() => {
    if (!enabled) return;

    checkAllFreshness();

    // 도메인별 설정 중 최소 갱신 주기 사용
    const minRefreshInterval = Math.min(
      ...sources.map(source => {
        const domainConfig = DOMAIN_FRESHNESS_CONFIGS[source] || {};
        return domainConfig.refresh_interval || DEFAULT_FRESHNESS_CONFIG.refresh_interval;
      })
    );

    const interval = setInterval(() => {
      checkAllFreshness();
      if (onRefresh) {
        onRefresh();
      }
    }, minRefreshInterval);

    return () => clearInterval(interval);
  }, [sources, enabled, checkAllFreshness, onRefresh]);

  return {
    statuses,
    loading,
    isAllFresh: Array.from(statuses.values()).every(s => s.is_fresh),
    hasStale: Array.from(statuses.values()).some(s => s.status === 'stale'),
    refresh: checkAllFreshness,
  };
}

// =====================================================
// 신선성 표시 컴포넌트 유틸리티
// =====================================================

export interface FreshnessIndicatorProps {
  status: DataFreshnessStatus;
  loading?: boolean;
  onRefresh?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export function getFreshnessColor(status: DataFreshnessStatus): string {
  switch (status.status) {
    case 'fresh':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'stale':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-500';
  }
}

export function getFreshnessBgColor(status: DataFreshnessStatus): string {
  switch (status.status) {
    case 'fresh':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'stale':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
}

export function getFreshnessIcon(status: DataFreshnessStatus): string {
  switch (status.status) {
    case 'fresh':
      return '✓';
    case 'warning':
      return '⚠';
    case 'stale':
      return '⚠';
    default:
      return '?';
  }
}

export function getFreshnessLabel(status: DataFreshnessStatus): string {
  switch (status.status) {
    case 'fresh':
      return '최신';
    case 'warning':
      return `주의 (${status.hours_since_sync.toFixed(1)}시간 전)`;
    case 'stale':
      return `부실 (${status.hours_since_sync.toFixed(1)}시간 전)`;
    default:
      return '알 수 없음';
  }
}
