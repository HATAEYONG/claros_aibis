import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  ActivityIcon,
  TrendUpIcon,
  TargetIcon,
  AlertIcon,
  CheckIcon,
  DollarIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface ExecutiveSummary {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  revenue: string;
  revenue_growth: string;
  operating_profit: string;
  operating_margin: string;
  net_profit: string;
  net_margin: string;
  production_volume: number;
  quality_rate: string;
  employee_count: number;
}

interface KeyMetric {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  metric_name: string;
  category: string;
  current_value: string;
  target_value: string;
  previous_value: string;
  change_rate: string;
  trend: string;
  trend_display: string;
  status: string;
  status_display: string;
  unit: string;
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  expected_benefit: string;
  required_investment: string;
}

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<ExecutiveSummary[]>([]);
  const [keyMetricData, setKeyMetricData] = useState<KeyMetric[]>([]);
  const [recommendationData, setRecommendationData] = useState<Recommendation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, metricRes, recommendRes] = await Promise.all([
          api.reports.getExecutiveSummary('fiscal_year=2024'),
          api.reports.getKeyMetric('fiscal_year=2024&fiscal_month=12'),
          api.reports.getRecommendation(),
        ]);

        setSummaryData(Array.isArray(summaryRes) ? summaryRes : summaryRes.results || []);
        setKeyMetricData(Array.isArray(metricRes) ? metricRes : metricRes.results || []);
        setRecommendationData(Array.isArray(recommendRes) ? recommendRes : recommendRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 최신 요약 데이터 가져오기
  const getLatestSummary = () => {
    if (summaryData.length === 0) return null;
    return summaryData.sort((a, b) => b.fiscal_month - a.fiscal_month)[0];
  };

  // 매출 추이 차트 데이터
  const getRevenueChartData = () => {
    const sortedData = [...summaryData].sort((a, b) => a.fiscal_month - b.fiscal_month);
    return {
      labels: sortedData.map(s => `${s.fiscal_month}월`),
      datasets: [
        {
          label: '매출액 (억원)',
          data: sortedData.map(s => parseFloat(s.revenue)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          fill: true
        },
        {
          label: '영업이익률 (%)',
          data: sortedData.map(s => parseFloat(s.operating_margin)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  };

  // 카테고리별 지표 그룹화
  const getMetricsByCategory = () => {
    const categories: Record<string, KeyMetric[]> = {};
    keyMetricData.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = [];
      }
      categories[metric.category].push(metric);
    });
    return categories;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  if (loading) {
    return <LoadingState message="분석 리포트를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const latestSummary = getLatestSummary();
  const metricsByCategory = getMetricsByCategory();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">분석 리포트</h1>
        </div>
        <p className="text-gray-300">경영 성과와 핵심 지표를 종합 분석합니다</p>
      </div>

      {/* KPI 카드 */}
      {latestSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="매출액"
            value={`${parseFloat(latestSummary.revenue).toFixed(0)}`}
            subtitle={`${latestSummary.fiscal_month}월 기준`}
            unit="억원"
            changeRate={parseFloat(latestSummary.revenue_growth)}
            trend={parseFloat(latestSummary.revenue_growth) >= 0 ? "up" : "down"}
            color="blue"
            icon={DollarIcon}
          />
          <KPICard
            title="영업이익"
            value={`${parseFloat(latestSummary.operating_profit).toFixed(1)}`}
            subtitle={`이익률: ${parseFloat(latestSummary.operating_margin).toFixed(1)}%`}
            unit="억원"
            changeRate={parseFloat(latestSummary.operating_margin)}
            trend="up"
            color="green"
            icon={TrendUpIcon}
          />
          <KPICard
            title="품질률"
            value={`${parseFloat(latestSummary.quality_rate).toFixed(1)}%`}
            subtitle="목표: 99%"
            changeRate={parseFloat(latestSummary.quality_rate) - 99}
            trend={parseFloat(latestSummary.quality_rate) >= 99 ? "up" : "down"}
            color="purple"
            icon={CheckIcon}
          />
          <KPICard
            title="직원 수"
            value={`${latestSummary.employee_count}`}
            subtitle="현재 인원"
            unit="명"
            changeRate={0}
            trend="stable"
            color="yellow"
            icon={TargetIcon}
          />
        </div>
      )}

      {/* 기간 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {['month', 'quarter', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'month' ? '월간' : period === 'quarter' ? '분기' : '연간'}
            </button>
          ))}
        </div>
      </div>

      {/* 매출 및 이익 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-blue-600" size={24} />
            매출 및 영업이익률 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">2024년 월별 현황</p>
        </div>

        <ChartComponent
          type="line"
          data={getRevenueChartData()}
          options={{
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: '매출액 (억원)' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: '영업이익률 (%)' },
                grid: { drawOnChartArea: false }
              }
            }
          }}
          height={300}
        />
      </div>

      {/* 핵심 지표 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-purple-600" size={24} />
            핵심 지표 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">12월 기준 주요 KPI</p>
        </div>

        <div className="space-y-6">
          {Object.entries(metricsByCategory).map(([category, metrics]) => (
            <div key={category}>
              <h4 className="font-bold text-gray-700 mb-3 capitalize">{category} 지표</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-800">{metric.metric_name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(metric.status)}`}>
                        {metric.status_display}
                      </span>
                    </div>

                    <div className="flex items-end justify-between mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {parseFloat(metric.current_value).toFixed(1)}{metric.unit}
                      </span>
                      <span className="text-sm text-gray-500">
                        목표: {parseFloat(metric.target_value).toFixed(1)}{metric.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)} {metric.trend_display}
                      </span>
                      <span className={`font-medium ${
                        parseFloat(metric.change_rate) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(metric.change_rate) >= 0 ? '+' : ''}{parseFloat(metric.change_rate).toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          metric.status === 'good' ? 'bg-green-600' :
                          metric.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min((parseFloat(metric.current_value) / parseFloat(metric.target_value)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 월별 요약 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gray-800 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ActivityIcon size={20} />
            월별 경영 요약
          </h3>
          <p className="text-gray-300 text-xs mt-1">2024년 실적</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-center">월</th>
                <th className="py-3 px-4 text-center">매출액</th>
                <th className="py-3 px-4 text-center">매출성장률</th>
                <th className="py-3 px-4 text-center">영업이익</th>
                <th className="py-3 px-4 text-center">이익률</th>
                <th className="py-3 px-4 text-center">생산량</th>
                <th className="py-3 px-4 text-center">품질률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...summaryData].sort((a, b) => b.fiscal_month - a.fiscal_month).map((summary) => (
                <tr key={summary.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-center font-medium">{summary.fiscal_month}월</td>
                  <td className="py-3 px-4 text-center">{parseFloat(summary.revenue).toFixed(0)}억</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${parseFloat(summary.revenue_growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(summary.revenue_growth) >= 0 ? '+' : ''}{parseFloat(summary.revenue_growth).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{parseFloat(summary.operating_profit).toFixed(1)}억</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{parseFloat(summary.operating_margin).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-center">{summary.production_volume.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${parseFloat(summary.quality_rate) >= 99 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {parseFloat(summary.quality_rate).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 개선 권고사항 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertIcon className="text-yellow-600" size={24} />
            개선 권고사항
          </h3>
          <p className="text-sm text-gray-500 mt-1">AI 기반 분석 결과</p>
        </div>

        <div className="space-y-4">
          {recommendationData.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                    {rec.priority_display}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {rec.category_display}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  rec.status === 'completed' ? 'bg-green-100 text-green-700' :
                  rec.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {rec.status_display}
                </span>
              </div>

              <h4 className="font-bold text-gray-800 mb-1">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  기대효과: {parseFloat(rec.expected_benefit).toFixed(0)}억원
                </span>
                <span className="text-blue-600">
                  투자비용: {parseFloat(rec.required_investment).toFixed(0)}억원
                </span>
                <span className="text-purple-600">
                  ROI: {((parseFloat(rec.expected_benefit) / parseFloat(rec.required_investment)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 리포트 인사이트 */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">리포트 인사이트</h3>
        <div className="space-y-3">
          {latestSummary && (
            <>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-bold text-gray-800 mb-1">경영 성과</p>
                    <p className="text-sm text-gray-600">
                      {latestSummary.fiscal_month}월 매출 {parseFloat(latestSummary.revenue).toFixed(0)}억원,
                      영업이익률 {parseFloat(latestSummary.operating_margin).toFixed(1)}%를 달성했습니다.
                      {parseFloat(latestSummary.revenue_growth) >= 0
                        ? ` 전월 대비 ${parseFloat(latestSummary.revenue_growth).toFixed(1)}% 성장했습니다.`
                        : ` 전월 대비 ${Math.abs(parseFloat(latestSummary.revenue_growth)).toFixed(1)}% 감소했습니다.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏭</span>
                  <div>
                    <p className="font-bold text-gray-800 mb-1">생산 현황</p>
                    <p className="text-sm text-gray-600">
                      생산량 {latestSummary.production_volume.toLocaleString()}개,
                      품질률 {parseFloat(latestSummary.quality_rate).toFixed(2)}%를 기록했습니다.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">개선 과제</p>
                <p className="text-sm text-gray-600">
                  {recommendationData.filter(r => r.priority === 'high').length}건의 높은 우선순위 개선 과제가 있습니다.
                  총 기대효과 {recommendationData.reduce((sum, r) => sum + parseFloat(r.expected_benefit), 0).toFixed(0)}억원입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
