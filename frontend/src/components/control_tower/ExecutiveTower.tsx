/**
 * 경영진 컨트롤 타워 컴포넌트 (향상된 버전)
 * 전사적 경영 지표를 시각화
 * 데모 데이터 지원, 탭 네비게이션 추가
 */
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  Users,
  Factory,
  ShoppingCart,
  Target,
  Brain,
  BarChart3,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

// API 서비스 가져오기 (사용 가능한 경우)
let getExecutiveTower: any, getExecutiveSummary: any, getEventStatistics: any, getAgentStats: any;
try {
  const services = require('../../services/controlTowerService');
  getExecutiveTower = services.getExecutiveTower;
  getExecutiveSummary = services.getExecutiveSummary;
} catch (e) {
  // 서비스 없음 - 데모 데이터 사용
}

try {
  const eventService = require('../../services/eventService');
  getEventStatistics = eventService.getEventStatistics;
} catch (e) {
  // 서비스 없음 - 데모 데이터 사용
}

try {
  const agentService = require('../../services/agentService');
  getAgentStats = agentService.getAgentStats;
} catch (e) {
  // 서비스 없음 - 데모 데이터 사용
}

interface ExecutiveTowerProps {
  period?: string;
  onRefresh?: () => void;
}

// 데모 데이터
const demoData = {
  financial_summary: {
    revenue: 152.3,
    operating_profit: 18.5,
    net_profit: 12.8,
    revenue_growth_pct: 2.5,
    operating_margin: 12.2,
    net_margin: 8.4
  },
  operational_summary: {
    production_volume: 450000,
    production_rate: 87.5,
    oee: 78.3,
    defect_rate: 1.2,
    on_time_delivery: 94.5
  },
  kpis: [
    { name: '매출', value: 152.3, target: 150, variance_pct: 1.5, status: 'on_track' },
    { name: '영업이익률', value: 12.2, target: 11, variance_pct: 10.9, status: 'on_track' },
    { name: '생산가동율', value: 87.5, target: 85, variance_pct: 2.9, status: 'on_track' },
    { name: 'OEE', value: 78.3, target: 80, variance_pct: -2.1, status: 'warning' },
    { name: '불량률', value: 1.2, target: 1.5, variance_pct: -20.0, status: 'on_track' },
    { name: '납기준수율', value: 94.5, target: 95, variance_pct: -0.5, status: 'on_track' },
    { name: '재고회전율', value: 8.2, target: 8, variance_pct: 2.5, status: 'on_track' },
    { name: '고객만족도', value: 4.2, target: 4.0, variance_pct: 5.0, status: 'on_track' }
  ],
  alerts: [
    { title: '원자재 가격 급등', severity: 'HIGH', event_type: 'COST_VARIANCE', event_time: new Date().toISOString() },
    { title: '공급자 품질 이슈', severity: 'MEDIUM', event_type: 'QUALITY_ISSUE', event_time: new Date().toISOString() },
    { title: '설비 가동율 저하', severity: 'MEDIUM', event_type: 'EQUIPMENT_DOWNTIME', event_time: new Date().toISOString() }
  ],
  recommendations: [
    { title: '원자재 가격 헷징 제안', description: '선물 시장 활용으로 리스크 40% 감소 가능', priority: 'high', domain: '원가관리', created_at: new Date().toISOString() },
    { title: '현금흐름 최적화', description: '매출채권 회수 기간 단축으로 연간 12억 원 개선', priority: 'high', domain: '재무관리', created_at: new Date().toISOString() },
    { title: 'OEE 개선 방안', description: '비가동 시간 분석 및 개선으로 목표 85% 달성', priority: 'medium', domain: '생산관리', created_at: new Date().toISOString() }
  ],
  domain_health: [
    { domain: '재무', status: 'good', score: 92, alerts: 0 },
    { domain: '영업', status: 'good', score: 88, alerts: 1 },
    { domain: '생산', status: 'warning', score: 78, alerts: 2 },
    { domain: '품질', status: 'warning', score: 82, alerts: 1 },
    { domain: '구매', status: 'critical', score: 65, alerts: 3 },
    { domain: '인사', status: 'good', score: 85, alerts: 1 }
  ]
};

const ExecutiveTower: React.FC<ExecutiveTowerProps> = ({ period = '7d', onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(demoData);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'kpi' | 'risks' | 'recommendations'>('overview');
  const [refreshTime, setRefreshTime] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const towerData = getExecutiveTower
        ? await getExecutiveTower({ period })
        : demoData;
      setData(towerData);
      setRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to load executive tower data:', error);
      setData(demoData);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    onRefresh?.();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 헤더 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전사</span>
          </div>
          <div className="text-3xl font-bold">85.3%</div>
          <div className="text-sm text-blue-100">종합 건전도 점수</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">성장</span>
          </div>
          <div className="text-3xl font-bold">+2.5%</div>
          <div className="text-sm text-green-100">전월 대비 매출</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Brain className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">AI</span>
          </div>
          <div className="text-3xl font-bold">24개</div>
          <div className="text-sm text-purple-100">활성 에이전트</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">리스크</span>
          </div>
          <div className="text-3xl font-bold">5건</div>
          <div className="text-sm text-orange-100">관리 이슈</div>
        </div>
      </div>

      {/* 도메인별 건전도 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">도메인별 건전도</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.domain_health.map((domain: any) => (
            <div
              key={domain.domain}
              className={`p-3 rounded-lg border-2 ${
                domain.status === 'good'
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : domain.status === 'warning'
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{domain.domain}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{domain.score}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">알림 {domain.alerts}건</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKPI = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">핵심 KPI 현황</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi: any, index: number) => (
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
  );

  const renderRisks = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">리스크 모니터링</h3>
      <div className="space-y-3">
        {data.alerts.map((alert: any, index: number) => (
          <AlertItem key={index} alert={alert} />
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI 추천사항</h3>
      <div className="space-y-3">
        {data.recommendations.map((rec: any, index: number) => (
          <RecommendationItem key={index} recommendation={rec} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">경영진 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            전사 현황을 한눈에 파악하는 경영진 대시보드
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">갱신: {refreshTime.toLocaleTimeString('ko-KR')}</div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-lg ${
              loading
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview' as const, label: '개요', icon: BarChart3 },
            { id: 'kpi' as const, label: 'KPI', icon: Target },
            { id: 'risks' as const, label: '리스크', icon: AlertTriangle },
            { id: 'recommendations' as const, label: '추천', icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'kpi' && renderKPI()}
          {selectedTab === 'risks' && renderRisks()}
          {selectedTab === 'recommendations' && renderRecommendations()}
        </div>
      </div>

      {/* 실시간 모니터링 상태바 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium">실시간 AI 감시 활성화</div>
            <div className="text-sm text-blue-100">20개 에이전트가 24시간 데이터를 분석 중</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">24</div>
            <div className="text-xs text-blue-100">활성</div>
          </div>
        </div>
      </div>
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
