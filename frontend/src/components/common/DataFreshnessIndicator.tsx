/**
 * 데이터 신선성 표시 컴포넌트
 *
 * 데이터 파이프라인 각 단계의 데이터 신선성을 시각적으로 표시
 */

import React from 'react';
import { RefreshIcon, ClockIcon } from '@/components/icons/Icons';
import {
  DataFreshnessStatus,
  getFreshnessColor,
  getFreshnessBgColor,
  getFreshnessIcon,
  getFreshnessLabel,
} from '@/utils/dataFreshness';

interface DataFreshnessIndicatorProps {
  status: DataFreshnessStatus;
  loading?: boolean;
  onRefresh?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  position?: 'inline' | 'card' | 'banner';
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  status,
  loading = false,
  onRefresh,
  showDetails = true,
  compact = false,
  position = 'inline',
}) => {
  // 배너 형태 (상단 경고)
  if (position === 'banner' && status.status === 'stale') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-xl">⚠</span>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">데이터가 부실합니다</p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {status.data_source} 데이터가 {status.hours_since_sync.toFixed(1)}시간 전 동기화되었습니다.
                최신 정보를 위해 새로고침해주세요.
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshIcon size={16} className="animate-spin" />
                  <span className="ml-2">갱신 중...</span>
                </>
              ) : (
                <>
                  <RefreshIcon size={16} />
                  <span className="ml-2">새로고침</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 카드 형태
  if (position === 'card') {
    return (
      <div className={`border rounded-lg p-4 ${getFreshnessBgColor(status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${getFreshnessColor(status)}`}>
              {loading ? (
                <RefreshIcon size={20} className="animate-spin" />
              ) : (
                getFreshnessIcon(status)
              )}
            </span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">데이터 상태</p>
              <p className={`font-semibold ${getFreshnessColor(status)}`}>
                {getFreshnessLabel(status)}
              </p>
            </div>
          </div>
          {showDetails && (
            <div className="text-right text-sm">
              <p className="text-gray-500">
                데이터 출처: {status.data_source}
              </p>
              {status.last_sync_time && (
                <p className="text-gray-500">
                  마지막 동기화: {new Date(status.last_sync_time).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 인라인 형태 (기본)
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getFreshnessBgColor(status)} ${getFreshnessColor(status)}`}>
        <span>{getFreshnessIcon(status)}</span>
        <span>{getFreshnessLabel(status)}</span>
      </div>
    );
  }

  // 표준 인라인 형태
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getFreshnessBgColor(status)}`}>
      <div className="flex items-center gap-2">
        <span className={loading ? 'animate-spin' : ''}>
          {loading ? <ClockIcon size={16} /> : getFreshnessIcon(status)}
        </span>
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">데이터 상태: </span>
          <span className={`font-semibold ml-1 ${getFreshnessColor(status)}`}>
            {getFreshnessLabel(status)}
          </span>
        </div>
      </div>
      {showDetails && status.hours_since_sync > 0 && (
        <div className="text-xs text-gray-500">
          {status.hours_since_sync.toFixed(1)}시간 전
        </div>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
};

/**
 * 다중 데이터 신선성 표시 컴포넌트
 */
interface MultiDataFreshnessIndicatorProps {
  statuses: Map<string, DataFreshnessStatus>;
  loading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

export const MultiDataFreshnessIndicator: React.FC<MultiDataFreshnessIndicatorProps> = ({
  statuses,
  loading = false,
  onRefresh,
  compact = false,
}) => {
  const statusArray = Array.from(statuses.entries());

  if (statusArray.length === 0) {
    return null;
  }

  // 요약 형태
  if (compact) {
    const freshCount = statusArray.filter(([_, s]) => s.status === 'fresh').length;
    const totalCount = statusArray.length;
    const allFresh = freshCount === totalCount;

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        allFresh
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
      }`}>
        <span className="font-medium">
          {allFresh ? '✓ 모든 데이터 최신' : `⚠ ${freshCount}/${totalCount} 데이터 최신`}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    );
  }

  // 상세 형태
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          데이터 신선성 ({statusArray.length}개 소스)
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
            <span>전체 갱신</span>
          </button>
        )}
      </div>
      <div className="space-y-1">
        {statusArray.map(([source, status]) => (
          <div key={source} className={`flex items-center justify-between px-3 py-2 rounded border ${getFreshnessBgColor(status)}`}>
            <div className="flex items-center gap-2">
              <span className={getFreshnessColor(status)}>{getFreshnessIcon(status)}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {source}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${getFreshnessColor(status)}`}>
                {getFreshnessLabel(status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 데이터 신선성 배너 컴포넌트
 * 상단에 표시되어 전체 데이터 상태를 한눈에 확인
 */
interface DataFreshnessBannerProps {
  statuses: Map<string, DataFreshnessStatus>;
  onRefresh?: () => void;
  autoHide?: boolean;  // 모든 데이터가 신선하면 숨김
}

export const DataFreshnessBanner: React.FC<DataFreshnessBannerProps> = ({
  statuses,
  onRefresh,
  autoHide = true,
}) => {
  const statusArray = Array.from(statuses.entries());
  const staleCount = statusArray.filter(([_, s]) => s.status === 'stale').length;
  const warningCount = statusArray.filter(([_, s]) => s.status === 'warning').length;

  // 모든 데이터가 신선하고 autoHide가 true면 숨김
  if (autoHide && staleCount === 0 && warningCount === 0) {
    return null;
  }

  const hasIssues = staleCount > 0 || warningCount > 0;
  const bgColor = staleCount > 0
    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500';

  return (
    <div className={`border-l-4 p-4 ${bgColor} mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xl ${staleCount > 0 ? 'animate-pulse' : ''}`}>
            {staleCount > 0 ? '⚠️' : '⚡'}
          </span>
          <div>
            <p className={`font-semibold ${staleCount > 0 ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              {staleCount > 0 ? '데이터 부실 경고' : '데이터 갱신 권장'}
            </p>
            <p className={`text-sm ${staleCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
              {staleCount > 0
                ? `${staleCount}개 데이터소스가 오래되었습니다. 최신 정보를 위해 데이터를 갱신해주세요.`
                : `${warningCount}개 데이터소스의 데이터가 곧 만료됩니다.`
              }
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshIcon size={16} />
            <span>데이터 갱신</span>
          </button>
        )}
      </div>

      {/* 문제가 있는 데이터소스 목록 */}
      {hasIssues && (
        <div className="mt-3 space-y-1">
          {statusArray
            .filter(([_, status]) => status.status === 'stale' || status.status === 'warning')
            .map(([source, status]) => (
              <div key={source} className={`text-sm px-2 py-1 rounded ${
                status.status === 'stale'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
              }`}>
                {source}: {status.hours_since_sync.toFixed(1)}시간 전
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DataFreshnessIndicator;
