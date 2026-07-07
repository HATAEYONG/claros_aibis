// -*- coding: utf-8 -*-
/**
 * KPI 관리 페이지
 * 8개 카테고리 80개 KPI 관리
 */
import React, { useState, useEffect } from 'react';
import { kpiService, kpiDefinitionAPI, kpiFactAPI, type KPIDefinition, type KPIFact, type KPISummary } from '@/services/kpiService';

// KPI 카테고리
const KPI_CATEGORIES: Record<string, string> = {
  financial: '재무',
  cost: '원가',
  production: '생산',
  quality: '품질',
  sales: '영업',
  purchase: '구매',
  manufacturing: '제조',
  accounting: '관리회계',
};

// 상태별 색상
const STATUS_COLORS: Record<string, string> = {
  good: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
};

const KPIManagementPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('financial');
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [kpiFacts, setKpiFacts] = useState<KPIFact[]>([]);
  const [summary, setSummary] = useState<KPISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKPIs, setSelectedKPIs] = useState<Set<string>>(new Set());
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);
  const [recalculateParams, setRecalculateParams] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    plant: '',
    line: '',
    department: '',
  });
  const [recalculating, setRecalculating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadKPIDefinitions();
    loadKPIFacts();
    loadSummary();
  }, [activeCategory, currentYear]);

  const loadKPIDefinitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const definitions = await kpiService.getKPIsByCategory(activeCategory);
      setKPIDefinitions(definitions);
    } catch (err: any) {
      setError(err.message || 'KPI 정의 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadKPIFacts = async () => {
    try {
      const latestFacts = await kpiService.getLatestKPISummary();
      setKpiFacts(latestFacts);
    } catch (err: any) {
      console.error('KPI 팩트 로딩 실패:', err);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await kpiService.getKPIAchievementStatus(currentYear);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('KPI 요약 로딩 실패:', err);
    }
  };

  // KPI 재계산
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const kpiCodes = selectedKPIs.size > 0 ? Array.from(selectedKPIs) : undefined;
      const result = await kpiService.recalculateKPIs(
        recalculateParams.start_date,
        recalculateParams.end_date,
        {
          kpiCodes,
          plant: recalculateParams.plant || undefined,
          line: recalculateParams.line || undefined,
          department: recalculateParams.department || undefined,
        }
      );

      alert(`재계산 완료: ${result.saved || 0}개 저장`);
      setShowRecalculateModal(false);
      loadKPIFacts();
      loadSummary();
    } catch (err: any) {
      alert(`재계산 실패: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  // KPI 레지스트리 동기화
  const handleSyncRegistry = async () => {
    if (!confirm('KPI 레지스트리를 동기화하시겠습니까?')) return;

    setSyncing(true);
    try {
      const result = await kpiService.syncKPIRegistry();
      alert(`동기화 완료: ${result.created || 0}개 생성, ${result.updated || 0}개 업데이트`);
      loadKPIDefinitions();
    } catch (err: any) {
      alert(`동기화 실패: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // 현재 카테고리의 KPI 실적 필터링
  const getCategoryFacts = () => {
    const categoryCodes = kpiDefinitions.map(kpi => kpi.kpi_code);
    return kpiFacts.filter(fact => categoryCodes.includes(fact.kpi_code || ''));
  };

  // KPI 카드 렌더링
  const renderKPICard = (kpi: KPIDefinition) => {
    const latestFact = kpiFacts.find(f => f.kpi_code === kpi.kpi_code);

    return (
      <div key={kpi.kpi_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{kpi.kpi_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.kpi_code}</p>
          </div>
          {latestFact && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[latestFact.status]}`}>
              {latestFact.status === 'good' ? '양호' : latestFact.status === 'warning' ? '주의' : latestFact.status === 'critical' ? '위험' : '중립'}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">실적값</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {latestFact ? `${latestFact.actual_value} ${kpi.unit || ''}` : '-'}
            </p>
          </div>

          {latestFact && latestFact.target_value && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">목표값</p>
              <p className="text-lg text-gray-700 dark:text-gray-300">{latestFact.target_value} {kpi.unit || ''}</p>
            </div>
          )}

          {latestFact && latestFact.achievement_rate && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">달성율</p>
              <p className="text-lg text-gray-700 dark:text-gray-300">{latestFact.achievement_rate.toFixed(1)}%</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">집계 방법</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {kpi.aggregation_method === 'sum' ? '합계' : kpi.aggregation_method === 'avg' ? '평균' : kpi.aggregation_method === 'count' ? '개수' : '-'}
            </p>
          </div>

          {latestFact && latestFact.date && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">기준일</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{latestFact.date}</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedKPIs.has(kpi.kpi_code)}
              onChange={(e) => {
                const newSelected = new Set(selectedKPIs);
                if (e.target.checked) {
                  newSelected.add(kpi.kpi_code);
                } else {
                  newSelected.delete(kpi.kpi_code);
                }
                setSelectedKPIs(newSelected);
              }}
              className="rounded"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">재계산 선택</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI 관리</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">8개 카테고리 80개 KPI 관리 및 모니터링</p>
      </div>

      {/* 도구 모음 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="number"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-24 dark:bg-gray-700 dark:text-white"
          />
          <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">년</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSyncRegistry}
            disabled={syncing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {syncing ? '동기화 중...' : '레지스트리 동기화'}
          </button>
          <button
            onClick={() => setShowRecalculateModal(true)}
            disabled={selectedKPIs.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            재계산 ({selectedKPIs.size}개 선택)
          </button>
          <button
            onClick={() => setShowRecalculateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            전체 재계산
          </button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {Object.entries(KPI_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setSelectedKPIs(new Set());
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeCategory === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* 요약 통계 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">총 팩트 수</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_facts || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">양호</p>
            <p className="text-2xl font-bold text-green-600">{summary.status_distribution?.good || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">주의</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.status_distribution?.warning || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">위험</p>
            <p className="text-2xl font-bold text-red-600">{summary.status_distribution?.critical || 0}</p>
          </div>
        </div>
      )}

      {/* KPI 카드 그리드 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : kpiDefinitions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>KPI 정의가 없습니다.</p>
          <button
            onClick={handleSyncRegistry}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            레지스트리 동기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kpiDefinitions.map(renderKPICard)}
        </div>
      )}

      {/* 재계산 모달 */}
      {showRecalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4 dark:text-white">KPI 재계산</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시작일</label>
                <input
                  type="date"
                  value={recalculateParams.start_date}
                  onChange={(e) => setRecalculateParams({ ...recalculateParams, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료일</label>
                <input
                  type="date"
                  value={recalculateParams.end_date}
                  onChange={(e) => setRecalculateParams({ ...recalculateParams, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">공장 (선택)</label>
                <input
                  type="text"
                  value={recalculateParams.plant}
                  onChange={(e) => setRecalculateParams({ ...recalculateParams, plant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">라인 (선택)</label>
                <input
                  type="text"
                  value={recalculateParams.line}
                  onChange={(e) => setRecalculateParams({ ...recalculateParams, line: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">부서 (선택)</label>
                <input
                  type="text"
                  value={recalculateParams.department}
                  onChange={(e) => setRecalculateParams({ ...recalculateParams, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRecalculateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                취소
              </button>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {recalculating ? '계산 중...' : '재계산'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagementPage;
