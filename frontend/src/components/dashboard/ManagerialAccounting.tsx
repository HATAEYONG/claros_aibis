import ChartComponent from '@/components/common/ChartComponent';
import ErrorState from '@/components/common/ErrorState';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import {
  ActivityIcon,
  CheckIcon,
  DollarIcon,
  TargetIcon,
  TrendUpIcon
} from '@/components/icons/Icons';
import api from '@/services/api';
import React, { useEffect, useState } from 'react';

interface BudgetActual {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  category: string;
  budget: string;
  actual: string;
  variance: string;
  variance_rate: string;
}

interface DepartmentProfitability {
  id: number;
  department: string;
  fiscal_year: number;
  fiscal_month: number;
  revenue: string;
  cost: string;
  profit: string;
  margin: string;
}

interface KPIPerformance {
  id: number;
  kpi_name: string;
  fiscal_year: number;
  fiscal_month: number;
  target: string;
  actual: string;
  achievement_rate: string;
  status: string;
  status_display: string;
  unit: string;
}

interface InvestmentROI {
  id: number;
  project_name: string;
  investment_amount: string;
  expected_return: string;
  actual_return: string;
  roi: string;
  status: string;
  status_display: string;
}

interface BudgetAllocation {
  id: number;
  department: string;
  fiscal_year: number;
  allocated_budget: string;
  used_budget: string;
  remaining_budget: string;
  usage_rate: string;
}

const ManagerialAccounting: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 데이터 상태
  const [budgetActualData, setBudgetActualData] = useState<BudgetActual[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentProfitability[]>([]);
  const [kpiData, setKPIData] = useState<KPIPerformance[]>([]);
  const [roiData, setROIData] = useState<InvestmentROI[]>([]);
  const [budgetAllocationData, setBudgetAllocationData] = useState<BudgetAllocation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [budgetRes, deptRes, kpiRes, roiRes, allocRes] = await Promise.all([
          api.accounting.getBudgetActual('fiscal_year=2024'),
          api.accounting.getDepartmentProfitability('fiscal_year=2024&fiscal_month=10'),
          api.accounting.getKPIPerformance('fiscal_year=2024&fiscal_month=10'),
          api.accounting.getInvestmentROI(),
          api.accounting.getBudgetAllocation('fiscal_year=2024'),
        ]);

        // API가 배열 또는 { results: [] } 형식으로 응답할 수 있음
        setBudgetActualData(Array.isArray(budgetRes) ? budgetRes : budgetRes.results || []);
        setDepartmentData(Array.isArray(deptRes) ? deptRes : deptRes.results || []);
        setKPIData(Array.isArray(kpiRes) ? kpiRes : kpiRes.results || []);
        setROIData(Array.isArray(roiRes) ? roiRes : roiRes.results || []);
        setBudgetAllocationData(Array.isArray(allocRes) ? allocRes : allocRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 예산 vs 실적 차트 데이터 생성
  const getBudgetVsActualChartData = () => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const budgetByMonth: number[] = [];
    const actualByMonth: number[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = budgetActualData.filter(d => d.fiscal_month === month);
      const totalBudget = monthData.reduce((sum, d) => sum + parseFloat(d.budget), 0);
      const totalActual = monthData.reduce((sum, d) => sum + parseFloat(d.actual), 0);
      budgetByMonth.push(totalBudget);
      actualByMonth.push(totalActual);
    }

    return {
      labels: months,
      datasets: [
        {
          label: '예산',
          data: budgetByMonth,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: '실적',
          data: actualByMonth,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 부문별 매출 차트 데이터
  const getDepartmentRevenueChartData = () => {
    const departments = [...new Set(departmentData.map(d => d.department))];
    const revenues = departments.map(dept => {
      const deptItem = departmentData.find(d => d.department === dept);
      return deptItem ? parseFloat(deptItem.revenue) : 0;
    });

    return {
      labels: departments,
      datasets: [{
        label: '매출 (억원)',
        data: revenues,
        backgroundColor: [
          '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'
        ],
        borderWidth: 0
      }]
    };
  };

  // ROI 차트 데이터
  const getROIChartData = () => {
    const projects = roiData.map(d => d.project_name);
    const investments = roiData.map(d => parseFloat(d.investment_amount));
    const rois = roiData.map(d => parseFloat(d.roi));

    return {
      labels: projects,
      datasets: [
        {
          label: '투자액 (억원)',
          data: investments,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          yAxisID: 'y'
        },
        {
          label: 'ROI (%)',
          data: rois,
          type: 'line' as const,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  };

  // KPI 요약 계산
  const getKPISummary = () => {
    if (kpiData.length === 0) return { avgAchievement: 0, excellentCount: 0, warningCount: 0 };

    const avgAchievement = kpiData.reduce((sum, k) => sum + parseFloat(k.achievement_rate), 0) / kpiData.length;
    const excellentCount = kpiData.filter(k => parseFloat(k.achievement_rate) >= 100).length;
    const warningCount = kpiData.filter(k => parseFloat(k.achievement_rate) < 90).length;

    return { avgAchievement, excellentCount, warningCount };
  };

  // 예산 요약 계산
  const getBudgetSummary = () => {
    const totalBudget = budgetAllocationData.reduce((sum, d) => sum + parseFloat(d.allocated_budget), 0);
    const totalUsed = budgetAllocationData.reduce((sum, d) => sum + parseFloat(d.used_budget), 0);
    const avgUsageRate = totalBudget > 0 ? (totalUsed / totalBudget * 100) : 0;

    return { totalBudget, totalUsed, avgUsageRate };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'on-track':
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'at-risk':
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'missed':
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved':
        return '달성';
      case 'on-track':
        return '진행중';
      case 'at-risk':
        return '위험';
      case 'missed':
        return '미달';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingState message="관리회계 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const kpiSummary = getKPISummary();
  const budgetSummary = getBudgetSummary();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">관리 회계</h1>
        </div>
        <p className="text-teal-100">예산 관리와 경영 성과를 분석합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="예산 달성률"
          value={`${budgetSummary.avgUsageRate.toFixed(1)}%`}
          subtitle="목표: 95%"
          changeRate={budgetSummary.avgUsageRate - 95}
          trend={budgetSummary.avgUsageRate >= 95 ? "up" : "down"}
          color="green"
          icon={TargetIcon}
        />
        <KPICard
          title="부문 수"
          value={`${departmentData.length}개`}
          subtitle="활성 부문"
          changeRate={0}
          trend="stable"
          color="blue"
          icon={DollarIcon}
        />
        <KPICard
          title="평균 ROI"
          value={`${roiData.length > 0 ? (roiData.reduce((sum, r) => sum + parseFloat(r.roi), 0) / roiData.length).toFixed(1) : 0}%`}
          subtitle={`${roiData.length}개 프로젝트`}
          changeRate={10.0}
          trend="up"
          color="purple"
          icon={TrendUpIcon}
        />
        <KPICard
          title="KPI 달성률"
          value={`${kpiSummary.avgAchievement.toFixed(1)}%`}
          subtitle={`${kpiData.length}개 지표 평균`}
          changeRate={kpiSummary.avgAchievement - 100}
          trend={kpiSummary.avgAchievement >= 100 ? "up" : "down"}
          color="yellow"
          icon={CheckIcon}
        />
      </div>

      {/* 부문 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['all', ...new Set(departmentData.map(d => d.department))].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedDepartment === dept
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept === 'all' ? '전체' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* 예산 vs 실적 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-green-600" size={24} />
            예산 vs 실적 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">월별 비교 (단위: 억원)</p>
        </div>

        <ChartComponent
          type="line"
          data={getBudgetVsActualChartData()}
          options={{
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">총 예산</p>
            <p className="text-2xl font-bold text-blue-600">{budgetSummary.totalBudget.toFixed(0)}억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">총 실적</p>
            <p className="text-2xl font-bold text-green-600">{budgetSummary.totalUsed.toFixed(0)}억</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">달성률</p>
            <p className="text-2xl font-bold text-purple-600">{budgetSummary.avgUsageRate.toFixed(1)}%</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">잔여</p>
            <p className="text-2xl font-bold text-yellow-600">{(budgetSummary.totalBudget - budgetSummary.totalUsed).toFixed(0)}억</p>
          </div>
        </div>
      </div>

      {/* 부문별 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 부문별 매출 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <DollarIcon className="text-blue-600" size={24} />
              부문별 매출
            </h3>
            <p className="text-sm text-gray-500 mt-1">10월 기준</p>
          </div>

          <ChartComponent
            type="bar"
            data={getDepartmentRevenueChartData()}
            options={{
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
            height={280}
          />
        </div>

        {/* 투자 수익률 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendUpIcon className="text-purple-600" size={24} />
              투자 수익률 (ROI)
            </h3>
            <p className="text-sm text-gray-500 mt-1">주요 투자 프로젝트</p>
          </div>

          <ChartComponent
            type="bar"
            data={getROIChartData()}
            options={{
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: '투자액 (억원)'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'ROI (%)'
                  },
                  grid: {
                    drawOnChartArea: false
                  }
                }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 부문별 손익 분석 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-teal-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ActivityIcon size={20} />
            부문별 손익 분석
          </h3>
          <p className="text-teal-100 text-xs mt-1">10월 실적 (단위: 억원)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">부문</th>
                <th className="py-3 px-4 text-right">매출</th>
                <th className="py-3 px-4 text-right">비용</th>
                <th className="py-3 px-4 text-right">이익</th>
                <th className="py-3 px-4 text-center">이익률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departmentData.map((dept, idx) => (
                <tr key={idx} className="hover:bg-teal-50">
                  <td className="py-3 px-4 font-medium">{dept.department}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(dept.revenue).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(dept.cost).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">{parseFloat(dept.profit).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(dept.margin) >= 20 ? 'text-green-600' :
                      parseFloat(dept.margin) >= 15 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(dept.margin).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI 성과 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-green-600" size={24} />
            KPI 성과 대시보드
          </h3>
          <p className="text-sm text-gray-500 mt-1">주요 경영 지표 달성 현황</p>
        </div>

        <div className="space-y-3">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-gray-800">{kpi.kpi_name}</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(kpi.status)}`}>
                  {getStatusLabel(kpi.status)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">목표</p>
                  <p className="text-lg font-bold text-gray-700">{parseFloat(kpi.target).toFixed(1)}{kpi.unit}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">실적</p>
                  <p className="text-lg font-bold text-blue-600">{parseFloat(kpi.actual).toFixed(1)}{kpi.unit}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">달성률</p>
                  <p className="text-lg font-bold text-green-600">{parseFloat(kpi.achievement_rate).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">차이</p>
                  <p className={`text-lg font-bold ${
                    parseFloat(kpi.actual) >= parseFloat(kpi.target) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(parseFloat(kpi.actual) - parseFloat(kpi.target)).toFixed(1)}{kpi.unit}
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    parseFloat(kpi.achievement_rate) >= 100 ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                  style={{ width: `${Math.min(parseFloat(kpi.achievement_rate), 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 예산 편성 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-blue-600" size={24} />
            예산 편성 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">부서별 집행 현황 (단위: 억원)</p>
        </div>

        <div className="space-y-3">
          {budgetAllocationData.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{item.department}</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-blue-600">{parseFloat(item.used_budget).toLocaleString()}</span>
                    <span className="text-gray-400"> / {parseFloat(item.allocated_budget).toLocaleString()}억</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">집행률</span>
                  <span className="font-bold">
                    {parseFloat(item.usage_rate).toFixed(1)}%
                    <span className={`ml-2 ${
                      parseFloat(item.usage_rate) <= 95 ? 'text-green-600' :
                      parseFloat(item.usage_rate) <= 100 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      (잔여: {parseFloat(item.remaining_budget).toFixed(0)}억)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      parseFloat(item.usage_rate) <= 95 ? 'bg-green-600' :
                      parseFloat(item.usage_rate) <= 100 ? 'bg-blue-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(item.usage_rate), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">총 예산</p>
            <p className="text-2xl font-bold text-blue-600">{budgetSummary.totalBudget.toFixed(0)}억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">총 집행</p>
            <p className="text-2xl font-bold text-green-600">{budgetSummary.totalUsed.toFixed(0)}억</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">평균 집행률</p>
            <p className="text-2xl font-bold text-purple-600">{budgetSummary.avgUsageRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 관리회계 인사이트 */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">관리회계 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">예산 달성 현황</p>
                <p className="text-sm text-gray-600">
                  전체 예산 {budgetSummary.totalBudget.toFixed(0)}억원 중 {budgetSummary.totalUsed.toFixed(0)}억원 집행 완료.
                  평균 집행률 {budgetSummary.avgUsageRate.toFixed(1)}%로 안정적으로 관리되고 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">KPI 성과 요약</p>
                <p className="text-sm text-gray-600">
                  {kpiData.length}개 KPI 중 {kpiSummary.excellentCount}개가 목표 달성.
                  평균 달성률 {kpiSummary.avgAchievement.toFixed(1)}%를 기록하고 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">투자 ROI 현황</p>
                <p className="text-sm text-gray-600">
                  {roiData.length}개 투자 프로젝트가 진행 중이며,
                  평균 ROI {roiData.length > 0 ? (roiData.reduce((sum, r) => sum + parseFloat(r.roi), 0) / roiData.length).toFixed(1) : 0}%를 달성하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerialAccounting;
