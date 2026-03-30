/**
 * 경영진 컨트롤 타워 컴포넌트
 * 전사적 경영 지표를 시각화
 */
import React, { useState, useEffect } from 'react';
import { getExecutiveTower, getExecutiveSummary } from '../../services/controlTowerService';
import { getEventStatistics } from '../../services/eventService';
import { getAgentStats } from '../../services/agentService';

interface ExecutiveTowerProps {
  period?: string;
  onRefresh?: () => void;
}

const ExecutiveTower: React.FC<ExecutiveTowerProps> = ({ period = '7d', onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [eventStats, setEventStats] = useState<any>(null);
  const [agentStats, setAgentStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [towerData, summaryData, eventsData, agentsData] = await Promise.all([
        getExecutiveTower({ period }),
        getExecutiveSummary(period),
        getEventStatistics(parseInt(period)),
        getAgentStats(),
      ]);

      setData(towerData);
      setSummary(summaryData);
      setEventStats(eventsData);
      setAgentStats(agentsData);
    } catch (error) {
      console.error('Failed to load executive tower data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="executive-tower">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">경영진 컨트롤 타워</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">전사적 경영 지표 개요</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          새로고침
        </button>
      </div>

      {/* 주요 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="총 이벤트"
          value={eventStats?.total_events || 0}
          change={summary?.alerts?.find((a: any) => a.type === 'event')?.count || 0}
          color="blue"
        />
        <SummaryCard
          title="긴급 이벤트"
          value={eventStats?.severity_distribution?.find((s: any) => s.severity === 'CRITICAL')?.count || 0}
          change={0}
          color="red"
        />
        <SummaryCard
          title="대기 승인"
          value={summary?.summary?.pending_approvals || 0}
          change={0}
          color="yellow"
        />
        <SummaryCard
          title="에이전트 성공률"
          value={`${agentStats?.success_rate?.toFixed(1) || 0}%`}
          change={0}
          color="green"
        />
      </div>

      {/* 재무 요약 */}
      {data?.financial_summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">재무 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricItem
              label="매출액"
              value={`${data.financial_summary.revenue?.toLocaleString() || 0}억원`}
              change={`${data.financial_summary.revenue_growth_pct?.toFixed(1) || 0}%`}
            />
            <MetricItem
              label="영업이익"
              value={`${data.financial_summary.operating_profit?.toLocaleString() || 0}억원`}
              change={`${data.financial_summary.operating_margin?.toFixed(1) || 0}%`}
            />
            <MetricItem
              label="당기순이익"
              value={`${data.financial_summary.net_profit?.toLocaleString() || 0}억원`}
              change={`${data.financial_summary.net_margin?.toFixed(1) || 0}%`}
            />
            <MetricItem
              label="생산량"
              value={`${(data.operational_summary?.production_volume / 10000).toFixed(1) || 0}만개`}
              change="0%"
            />
          </div>
        </div>
      )}

      {/* KPI 현황 */}
      {data?.kpis && data.kpis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">핵심 KPI 현황</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.kpis.slice(0, 8).map((kpi: any, index: number) => (
              <KPICard
                key={index}
                name={kpi.name}
                value={kpi.value}
                target={kpi.target}
                variance={kpi.variance_pct}
                status={kpi.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* 주요 알림 */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">주요 알림</h3>
          <div className="space-y-2">
            {data.alerts.slice(0, 5).map((alert: any, index: number) => (
              <AlertItem key={index} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* 추천사항 */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI 추천사항</h3>
          <div className="space-y-3">
            {data.recommendations.slice(0, 5).map((rec: any, index: number) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 서브 컴포넌트
const SummaryCard: React.FC<{
  title: string;
  value: number | string;
  change: number;
  color: string;
}> = ({ title, value, change, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} p-4 rounded-lg`}>
      <div className="text-sm opacity-75">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {change !== 0 && (
        <div className="text-sm mt-1 opacity-75">{change > 0 ? '+' : ''}{change}</div>
      )}
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string; change: string }> = ({ label, value, change }) => {
  const isPositive = parseFloat(change) >= 0;

  return (
    <div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{value}</div>
      <div className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change}
      </div>
    </div>
  );
};

const KPICard: React.FC<{
  name: string;
  value: number;
  target: number;
  variance: number;
  status: string;
}> = ({ name, value, target, variance, status }) => {
  const statusColors = {
    on_track: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  const statusLabels = {
    on_track: '정상',
    warning: '주의',
    critical: '위험',
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
      <div className="text-sm text-gray-600 dark:text-gray-400">{name}</div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
        <div className={`text-xs ${statusColors[status as keyof typeof statusColors]}`}>
          {statusLabels[status as keyof typeof statusLabels]}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">목표: {target} (편차: {variance.toFixed(1)}%)</div>
    </div>
  );
};

const AlertItem: React.FC<{ alert: any }> = ({ alert }) => {
  const severityColors = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-700',
    HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    LOW: 'bg-blue-50 border-blue-200 text-blue-700',
    INFO: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`border ${severityColors[alert.severity]} rounded p-3`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{alert.title}</div>
        <div className="text-sm">{alert.event_type}</div>
      </div>
      <div className="text-sm mt-1 opacity-75">{new Date(alert.event_time).toLocaleString()}</div>
    </div>
  );
};

const RecommendationItem: React.FC<{ recommendation: any }> = ({ recommendation }) => {
  const priorityColors = {
    urgent: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className={`border ${priorityColors[recommendation.priority as keyof typeof priorityColors]} rounded p-3`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{recommendation.title}</div>
        <div className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
          {recommendation.domain}
        </div>
      </div>
      <div className="text-sm mt-2 opacity-75">{recommendation.description}</div>
      <div className="text-xs mt-2 opacity-60">{new Date(recommendation.created_at).toLocaleString()}</div>
    </div>
  );
};

export default ExecutiveTower;
