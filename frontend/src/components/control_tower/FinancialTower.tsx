// FinancialTower.tsx - 재무 컨트롤 타워 컴포넌트
import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  PieChart,
  BarChart3,
  CreditCard,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  variance: number;
  status: 'on-track' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical';
  title: string;
  description: string;
  affectedKPI: string;
  actionRequired: boolean;
}

interface FinancialMetric {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
}

const FinancialTower: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const kpis: KPI[] = [
    {
      id: 'revenue',
      name: '매출액',
      value: 15420000000,
      target: 15000000000,
      variance: 420000000,
      status: 'on-track',
      trend: 'up',
      unit: '원'
    },
    {
      id: 'operating-profit',
      name: '영업이익',
      value: 2180000000,
      target: 2000000000,
      variance: 180000000,
      status: 'on-track',
      trend: 'up',
      unit: '원'
    },
    {
      id: 'operating-margin',
      name: '영업이익률',
      value: 14.1,
      target: 13.5,
      variance: 0.6,
      status: 'on-track',
      trend: 'up',
      unit: '%'
    },
    {
      id: 'cash-flow',
      name: '현금흐름',
      value: 3250000000,
      target: 3000000000,
      variance: 250000000,
      status: 'on-track',
      trend: 'stable',
      unit: '원'
    },
    {
      id: 'accounts-receivable',
      name: '미수금',
      value: 892000000,
      target: 800000000,
      variance: 92000000,
      status: 'warning',
      trend: 'up',
      unit: '원'
    },
    {
      id: 'debt-ratio',
      name: '부채비율',
      value: 42.3,
      target: 40.0,
      variance: 2.3,
      status: 'warning',
      trend: 'up',
      unit: '%'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: '미수금 증가',
      description: '미수금이 목표 대비 11.5% 초과했습니다. 회수 조치가 필요합니다.',
      affectedKPI: '미수금',
      actionRequired: true
    },
    {
      id: '2',
      type: 'warning',
      title: '부채비율 상승',
      description: '부채비율이 목표 40%를 초과했습니다. 자본 구조 개선이 필요합니다.',
      affectedKPI: '부채비율',
      actionRequired: true
    }
  ];

  const financialMetrics: FinancialMetric[] = [
    { category: '매출원가', actual: 10458000000, budget: 10200000000, variance: 258000000, variancePercent: 2.5 },
    { category: '판관비', actual: 2184000000, budget: 2100000000, variance: 84000000, variancePercent: 4.0 },
    { category: '영업외수익', actual: 320000000, budget: 350000000, variance: -30000000, variancePercent: -8.6 },
    { category: '영업외비용', actual: 185000000, budget: 200000000, variance: -15000000, variancePercent: -7.5 }
  ];

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '억원';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(0) + '만원';
    }
    return num.toLocaleString();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'operating-profit': return <TrendingUp className="w-5 h-5" />;
      case 'operating-margin': return <PieChart className="w-5 h-5" />;
      case 'cash-flow': return <Wallet className="w-5 h-5" />;
      case 'accounts-receivable': return <CreditCard className="w-5 h-5" />;
      case 'debt-ratio': return <BarChart3 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4" />;
      case 'down': return <ArrowDownRight className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-400 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20';
      case 'critical': return 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
      default: return 'border-gray-400 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">재무 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            재무 성과 및 현금흐름 실시간 모니터링
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">갱신: {refreshTime.toLocaleTimeString('ko-KR')}</div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 주요 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              kpi.status === 'on-track'
                ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : kpi.status === 'warning'
                ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  kpi.status === 'on-track'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : kpi.status === 'warning'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {getKPIIcon(kpi.id)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{kpi.name}</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(kpi.status)}`}>
                {getTrendIcon(kpi.trend)}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {kpi.unit === '%' ? kpi.value.toFixed(1) : formatNumber(kpi.value)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">목표: {kpi.unit === '%' ? kpi.target.toFixed(1) : formatNumber(kpi.target)}</span>
              <span className={`font-medium ${
                kpi.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {kpi.variance >= 0 ? '+' : ''}{kpi.unit === '%' ? kpi.variance.toFixed(1) : formatNumber(Math.abs(kpi.variance))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 재무 실적 대 예산 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">재무 실적 대 예산</h3>
        <div className="space-y-3">
          {financialMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{metric.category}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">실적: {formatNumber(metric.actual)}</span>
                    <span className="text-gray-500 dark:text-gray-400">|</span>
                    <span className="text-gray-500 dark:text-gray-400">예산: {formatNumber(metric.budget)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.variancePercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.abs(metric.variancePercent) * 5, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-16 text-right ${
                    metric.variancePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.variancePercent >= 0 ? '+' : ''}{metric.variancePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 알림 */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            주의 사항 ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${getAlertTypeColor(alert.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">{alert.title}</h4>
                  {alert.actionRequired && (
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                      조치 필요
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  영향 KPI: {alert.affectedKPI}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 월별 현금흐름 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">최근 6개월 현금흐름</h3>
        <div className="grid grid-cols-6 gap-3">
          {[
            { month: '2025-10', inflow: 28.5, outflow: 26.2, net: 2.3 },
            { month: '2025-11', inflow: 31.2, outflow: 28.5, net: 2.7 },
            { month: '2025-12', inflow: 35.8, outflow: 32.1, net: 3.7 },
            { month: '2026-01', inflow: 29.4, outflow: 27.8, net: 1.6 },
            { month: '2026-02', inflow: 33.1, outflow: 29.5, net: 3.6 },
            { month: '2026-03', inflow: 36.5, outflow: 31.2, net: 5.3 }
          ].map((data, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{data.month}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">유입</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{data.inflow}억</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">유출</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{data.outflow}억</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">순유입</span>
                  <span className={`font-bold ${data.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {data.net >= 0 ? '+' : ''}{data.net}억
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialTower;
