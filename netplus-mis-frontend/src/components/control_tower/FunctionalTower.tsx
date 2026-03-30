/**
 * 기능별 컨트롤 타워 컴포넌트
 * 도메인별 상세 지표를 시각화
 */
import React, { useState, useEffect } from 'react';
import { getFunctionalTower } from '../../services/controlTowerService';

interface FunctionalTowerProps {
  domain: string;
  domainName?: string;
  period?: string;
}

const FunctionalTower: React.FC<FunctionalTowerProps> = ({
  domain,
  domainName,
  period = '7d'
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [domain, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const towerData = await getFunctionalTower(domain, { period });
      setData(towerData);
    } catch (error) {
      console.error(`Failed to load functional tower data for domain: ${domain}:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="functional-tower">
      {/* 헤더 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {domainName || getDomainDisplayName(domain)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getDomainDescription(domain)}
        </p>
      </div>

      {/* 요약 정보 */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryMetric
            title="이벤트"
            value={data.summary.total_events}
            color="blue"
          />
          <SummaryMetric
            title="추천사항"
            value={data.summary.active_recommendations}
            color="green"
          />
          <SummaryMetric
            title="긴급 알림"
            value={data.summary.critical_events}
            color="red"
          />
        </div>
      )}

      {/* KPI 현황 */}
      {data?.kpis && data.kpis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">KPI 현황</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.kpis.map((kpi: any, index: number) => (
              <DomainKPICard key={index} kpi={kpi} />
            ))}
          </div>
        </div>
      )}

      {/* 알림 */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">알림</h4>
          <div className="space-y-2">
            {data.alerts.map((alert: any, index: number) => (
              <DomainAlert key={index} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* 추천사항 */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">추천사항</h4>
          <div className="space-y-3">
            {data.recommendations.map((rec: any, index: number) => (
              <DomainRecommendation key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* 도메인별 메트릭 */}
      {data?.domain_metrics && Object.keys(data.domain_metrics).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">상세 지표</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.domain_metrics).map(([key, value]: [string, any], index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">{key}</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 서브 컴포넌트
const SummaryMetric: React.FC<{
  title: string;
  value: number;
  color: string;
}> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} p-4 rounded-lg`}>
      <div className="text-sm opacity-75">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
};

const DomainKPICard: React.FC<{ kpi: any }> = ({ kpi }) => {
  const variance = ((kpi.value - kpi.target) / kpi.target * 100).toFixed(1);
  const isPositive = parseFloat(variance) >= 0;
  const status = kpi.status || 'on_track';

  const statusConfig = {
    on_track: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.on_track;

  return (
    <div className={`border ${config.border} ${config.bg} rounded p-4`}>
      <div className={`${config.text} text-sm font-medium mb-1`}>{kpi.name || kpi.code}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {kpi.value?.toLocaleString() || '-'}
        </div>
        <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{variance}%
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">목표: {kpi.target?.toLocaleString() || '-'}</div>
    </div>
  );
};

const DomainAlert: React.FC<{ alert: any }> = ({ alert }) => {
  const severityConfig = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-700',
    HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    LOW: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const config = severityConfig[alert.severity] || severityConfig.LOW;

  return (
    <div className={`border ${config} rounded p-3`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{alert.title}</div>
        <div className="text-xs">{new Date(alert.event_time).toLocaleString()}</div>
      </div>
      {alert.description && (
        <div className="text-sm mt-1 opacity-75">{alert.description}</div>
      )}
    </div>
  );
};

const DomainRecommendation: React.FC<{ recommendation: any }> = ({ recommendation }) => {
  const priorityConfig = {
    urgent: 'bg-red-50 border-red-200 text-red-700',
    high: 'bg-orange-50 border-orange-200 text-orange-700',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    low: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const config = priorityConfig[recommendation.priority] || priorityConfig.medium;

  return (
    <div className={`border ${config} rounded p-3`}>
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

// 헬퍼 함수
function getDomainDisplayName(domain: string): string {
  const names: Record<string, string> = {
    financial: '재무 컨트롤 타워',
    production: '생산 컨트롤 타워',
    quality: '품질 컨트롤 타워',
    cost: '원가 컨트롤 타워',
    sales: '영업 컨트롤 타워',
    purchase: '구매 컨트롤 타워',
    hr: '인사 컨트롤 타워',
    esg: 'ESG 컨트롤 타워',
  };
  return names[domain] || domain;
}

function getDomainDescription(domain: string): string {
  const descriptions: Record<string, string> = {
    financial: '재무 성과 및 예산 관리',
    production: '생산 현황 및 효율',
    quality: '품질 관리 및 불량률',
    cost: '원가 구조 및 편차 분석',
    sales: '영업 실적 및 시장 동향',
    purchase: '구매 관리 및 공급자 관리',
    hr: '인력 관리 및 생산성',
    esg: 'ESG 경영 및 지속가능 경영',
  };
  return descriptions[domain] || '';
}

export default FunctionalTower;
