import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  DollarIcon,
  TrendUpIcon,
  TrendDownIcon,
  UserIcon,
  TargetIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface MonthlySales {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  target_amount: string;
  actual_amount: string;
  achievement_rate: string;
  new_customers: number;
  contract_rate: string;
  pipeline_value: string;
}

interface ProductSales {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  product_code: string;
  product_name: string;
  sales_amount: string;
  sales_quantity: number;
  share_rate: string;
}

interface CustomerTier {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  tier: string;
  customer_count: number;
  sales_amount: string;
  share_rate: string;
}

interface SalesPipeline {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  stage: string;
  stage_display: string;
  opportunity_count: number;
  total_value: string;
  conversion_rate: string;
}

interface SalesTeam {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  salesperson_name: string;
  target_amount: string;
  actual_amount: string;
  deal_count: number;
  conversion_rate: string;
}

interface TopCustomer {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  customer_code: string;
  customer_name: string;
  revenue: string;
  growth_rate: string;
  status: string;
  status_display: string;
}

const Sales: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthlySales[]>([]);
  const [productData, setProductData] = useState<ProductSales[]>([]);
  const [tierData, setTierData] = useState<CustomerTier[]>([]);
  const [pipelineData, setPipelineData] = useState<SalesPipeline[]>([]);
  const [teamData, setTeamData] = useState<SalesTeam[]>([]);
  const [customerData, setCustomerData] = useState<TopCustomer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [monthlyRes, productRes, tierRes, pipelineRes, teamRes, customerRes] = await Promise.all([
          api.sales.getMonthly('fiscal_year=2024'),
          api.sales.getProducts('fiscal_year=2024&fiscal_month=12'),
          api.sales.getCustomerTiers('fiscal_year=2024&fiscal_month=12'),
          api.sales.getPipeline('fiscal_year=2024&fiscal_month=12'),
          api.sales.getTeam('fiscal_year=2024&fiscal_month=12'),
          api.sales.getCustomers('fiscal_year=2024&fiscal_month=12'),
        ]);

        setMonthlyData(Array.isArray(monthlyRes) ? monthlyRes : monthlyRes.results || []);
        setProductData(Array.isArray(productRes) ? productRes : productRes.results || []);
        setTierData(Array.isArray(tierRes) ? tierRes : tierRes.results || []);
        setPipelineData(Array.isArray(pipelineRes) ? pipelineRes : pipelineRes.results || []);
        setTeamData(Array.isArray(teamRes) ? teamRes : teamRes.results || []);
        setCustomerData(Array.isArray(customerRes) ? customerRes : customerRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // KPI 계산
  const getKPISummary = () => {
    if (monthlyData.length === 0) return { totalSales: 0, avgAchievement: 0, totalNewCustomers: 0, avgContractRate: 0 };

    const latestMonth = monthlyData.sort((a, b) => b.fiscal_month - a.fiscal_month)[0];
    const totalSales = parseFloat(latestMonth.actual_amount);
    const avgAchievement = parseFloat(latestMonth.achievement_rate);
    const totalNewCustomers = latestMonth.new_customers;
    const avgContractRate = parseFloat(latestMonth.contract_rate);

    return { totalSales, avgAchievement, totalNewCustomers, avgContractRate };
  };

  // 월별 매출 추이 차트
  const getMonthlySalesChartData = () => {
    const sortedData = [...monthlyData].sort((a, b) => a.fiscal_month - b.fiscal_month);
    return {
      labels: sortedData.map(d => `${d.fiscal_month}월`),
      datasets: [
        {
          label: '목표',
          data: sortedData.map(d => parseFloat(d.target_amount)),
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: '실적',
          data: sortedData.map(d => parseFloat(d.actual_amount)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 제품별 매출 차트
  const getProductChartData = () => {
    return {
      labels: productData.map(p => p.product_name),
      datasets: [{
        label: '매출액 (억원)',
        data: productData.map(p => parseFloat(p.sales_amount)),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
        borderWidth: 0
      }]
    };
  };

  // 고객 등급별 차트
  const getTierChartData = () => {
    return {
      labels: tierData.map(t => t.tier),
      datasets: [{
        label: '매출 비중 (%)',
        data: tierData.map(t => parseFloat(t.share_rate)),
        backgroundColor: ['#fbbf24', '#a78bfa', '#94a3b8', '#fb923c', '#60a5fa']
      }]
    };
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'lead': 'bg-blue-100 border-blue-500',
      'contact': 'bg-purple-100 border-purple-500',
      'proposal': 'bg-yellow-100 border-yellow-500',
      'negotiation': 'bg-orange-100 border-orange-500',
      'closing': 'bg-green-100 border-green-500'
    };
    return colors[stage] || 'bg-gray-100 border-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'hot': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingState message="영업 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const kpiSummary = getKPISummary();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <DollarIcon size={32} />
          <h1 className="text-3xl font-bold">영업 관리</h1>
        </div>
        <p className="text-green-100">매출 현황과 영업 성과를 분석합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="월 매출"
          value={`${kpiSummary.totalSales.toFixed(0)}`}
          subtitle="12월 기준"
          unit="억원"
          changeRate={kpiSummary.avgAchievement - 100}
          trend={kpiSummary.avgAchievement >= 100 ? "up" : "down"}
          color="green"
          icon={DollarIcon}
        />
        <KPICard
          title="목표 달성률"
          value={`${kpiSummary.avgAchievement.toFixed(1)}%`}
          subtitle="목표: 100%"
          changeRate={kpiSummary.avgAchievement - 100}
          trend={kpiSummary.avgAchievement >= 100 ? "up" : "down"}
          color="blue"
          icon={TargetIcon}
        />
        <KPICard
          title="신규 거래처"
          value={`${kpiSummary.totalNewCustomers}`}
          subtitle="12월 신규"
          unit="개"
          changeRate={0}
          trend="up"
          color="purple"
          icon={UserIcon}
        />
        <KPICard
          title="계약 성사율"
          value={`${kpiSummary.avgContractRate.toFixed(1)}%`}
          subtitle="목표: 30%"
          changeRate={kpiSummary.avgContractRate - 30}
          trend={kpiSummary.avgContractRate >= 30 ? "up" : "down"}
          color="yellow"
          icon={TrendUpIcon}
        />
      </div>

      {/* 매출 추이 차트 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-blue-600" size={24} />
            월별 매출 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">2024년 월별 목표 vs 실적 (억원)</p>
        </div>

        <ChartComponent
          type="line"
          data={getMonthlySalesChartData()}
          options={{
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: { beginAtZero: false }
            }
          }}
          height={300}
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 제품별 매출 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800">제품별 매출</h3>
            <p className="text-sm text-gray-500 mt-1">12월 기준</p>
          </div>
          <ChartComponent
            type="doughnut"
            data={getProductChartData()}
            options={{
              plugins: {
                legend: { position: 'right' }
              }
            }}
            height={280}
          />
        </div>

        {/* 고객 등급별 매출 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800">고객 등급별 매출</h3>
            <p className="text-sm text-gray-500 mt-1">12월 기준</p>
          </div>
          <ChartComponent
            type="pie"
            data={getTierChartData()}
            options={{
              plugins: {
                legend: { position: 'right' }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 영업 파이프라인 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-purple-600" size={24} />
            영업 파이프라인
          </h3>
          <p className="text-sm text-gray-500 mt-1">단계별 기회 현황</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {pipelineData.map((stage) => (
            <div
              key={stage.id}
              className={`flex-1 min-w-[150px] p-4 rounded-lg border-l-4 ${getStageColor(stage.stage)}`}
            >
              <h4 className="font-bold text-gray-800">{stage.stage_display || stage.stage}</h4>
              <p className="text-2xl font-bold text-gray-700 mt-2">{stage.opportunity_count}건</p>
              <p className="text-sm text-gray-600">{parseFloat(stage.total_value).toFixed(0)}억원</p>
              <p className="text-xs text-gray-500 mt-1">전환율: {parseFloat(stage.conversion_rate).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* 영업팀 성과 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <UserIcon size={20} />
            영업팀 성과
          </h3>
          <p className="text-green-100 text-xs mt-1">12월 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">영업사원</th>
                <th className="py-3 px-4 text-center">목표</th>
                <th className="py-3 px-4 text-center">실적</th>
                <th className="py-3 px-4 text-center">달성률</th>
                <th className="py-3 px-4 text-center">계약 건수</th>
                <th className="py-3 px-4 text-center">성사율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamData.map((member) => {
                const achievementRate = (parseFloat(member.actual_amount) / parseFloat(member.target_amount)) * 100;
                return (
                  <tr key={member.id} className="hover:bg-green-50">
                    <td className="py-3 px-4 font-medium">{member.salesperson_name}</td>
                    <td className="py-3 px-4 text-center">{parseFloat(member.target_amount).toFixed(0)}억</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{parseFloat(member.actual_amount).toFixed(0)}억</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${achievementRate >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {achievementRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{member.deal_count}건</td>
                    <td className="py-3 px-4 text-center">{parseFloat(member.conversion_rate).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주요 거래처 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <DollarIcon size={20} />
            주요 거래처
          </h3>
          <p className="text-blue-100 text-xs mt-1">12월 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">거래처</th>
                <th className="py-3 px-4 text-center">매출액</th>
                <th className="py-3 px-4 text-center">성장률</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerData.slice(0, 8).map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{customer.customer_name}</p>
                    <p className="text-xs text-gray-500">{customer.customer_code}</p>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{parseFloat(customer.revenue).toFixed(0)}억</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`flex items-center justify-center gap-1 ${parseFloat(customer.growth_rate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(customer.growth_rate) >= 0 ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
                      {Math.abs(parseFloat(customer.growth_rate)).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(customer.status)}`}>
                      {customer.status_display || customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 영업 인사이트 */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">영업 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">매출 현황</p>
                <p className="text-sm text-gray-600">
                  12월 매출 {kpiSummary.totalSales.toFixed(0)}억원, 목표 달성률 {kpiSummary.avgAchievement.toFixed(1)}%
                  {kpiSummary.avgAchievement >= 100 ? '로 목표를 달성했습니다.' : '로 목표 달성이 필요합니다.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">신규 거래처</p>
                <p className="text-sm text-gray-600">
                  12월 {kpiSummary.totalNewCustomers}개 신규 거래처 확보,
                  계약 성사율 {kpiSummary.avgContractRate.toFixed(1)}%입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">파이프라인</p>
                <p className="text-sm text-gray-600">
                  총 {pipelineData.reduce((sum, p) => sum + p.opportunity_count, 0)}건의 영업 기회가 진행 중이며,
                  예상 금액은 {pipelineData.reduce((sum, p) => sum + parseFloat(p.total_value), 0).toFixed(0)}억원입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
