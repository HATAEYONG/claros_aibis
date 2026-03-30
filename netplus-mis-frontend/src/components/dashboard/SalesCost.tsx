import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { DollarIcon, TrendUpIcon, UsersIcon, PackageIcon, ShoppingCartIcon } from '@/components/icons/Icons';

interface SalesCostData {
  id: number;
  product: string;
  costType: string;
  directCost: number;
  indirectCost: number;
  totalCost: number;
  unitCost: number;
  salesVolume: number;
  salesRevenue: number;
  profitMargin: number;
}

interface SalesCostTrend {
  month: string;
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

const SalesCost: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [salesCostData, setSalesCostData] = useState<SalesCostData[]>([]);
  const [trends, setTrends] = useState<SalesCostTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockData: SalesCostData[] = [
        { id: 1, product: '제품 A', costType: '직접 원가', directCost: 85000000, indirectCost: 42000000, totalCost: 127000000, unitCost: 8500, salesVolume: 15000, salesRevenue: 187500000, profitMargin: 32.2 },
        { id: 2, product: '제품 B', costType: '직접 원가', directCost: 62000000, indirectCost: 35000000, totalCost: 97000000, unitCost: 9700, salesVolume: 10000, salesRevenue: 135000000, profitMargin: 28.1 },
        { id: 3, product: '제품 A', costType: '간접 원가', directCost: 0, indirectCost: 42000000, totalCost: 42000000, unitCost: 0, salesVolume: 0, salesRevenue: 0, profitMargin: 0 },
        { id: 4, product: '제품 B', costType: '간접 원가', directCost: 0, indirectCost: 35000000, totalCost: 35000000, unitCost: 0, salesVolume: 0, salesRevenue: 0, profitMargin: 0 },
        { id: 5, product: '제품 C', costType: '직접 원가', directCost: 95000000, indirectCost: 45000000, totalCost: 140000000, unitCost: 9500, salesVolume: 14000, salesRevenue: 182000000, profitMargin: 23.1 },
        { id: 6, product: '제품 C', costType: '간접 원가', directCost: 0, indirectCost: 45000000, totalCost: 45000000, unitCost: 0, salesVolume: 0, salesRevenue: 0, profitMargin: 0 },
        { id: 7, product: '제품 D', costType: '직접 원가', directCost: 48000000, indirectCost: 25000000, totalCost: 73000000, unitCost: 7300, salesVolume: 10000, salesRevenue: 95000000, profitMargin: 23.2 },
        { id: 8, product: '제품 D', costType: '간접 원가', directCost: 0, indirectCost: 25000000, totalCost: 25000000, unitCost: 0, salesVolume: 0, salesRevenue: 0, profitMargin: 0 },
      ];

      const mockTrends: SalesCostTrend[] = [
        { month: '1월', revenue: 245000000, totalCost: 172000000, profit: 73000000, profitMargin: 29.8 },
        { month: '2월', revenue: 268000000, totalCost: 185000000, profit: 83000000, profitMargin: 31.0 },
        { month: '3월', revenue: 252000000, totalCost: 178000000, profit: 74000000, profitMargin: 29.4 },
        { month: '4월', revenue: 285000000, totalCost: 195000000, profit: 90000000, profitMargin: 31.6 },
        { month: '5월', revenue: 298000000, totalCost: 205000000, profit: 93000000, profitMargin: 31.2 },
        { month: '6월', revenue: 312000000, totalCost: 210000000, profit: 102000000, profitMargin: 32.7 },
      ];

      setSalesCostData(mockData);
      setTrends(mockTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales cost data');
    } finally {
      setLoading(false);
    }
  };

  const directCosts = salesCostData.filter(d => d.costType === '직접 원가');
  const indirectCosts = salesCostData.filter(d => d.costType === '간접 원가');

  const totalRevenue = directCosts.reduce((sum, d) => sum + d.salesRevenue, 0);
  const totalDirectCost = directCosts.reduce((sum, d) => sum + d.directCost, 0);
  const totalIndirectCost = indirectCosts.reduce((sum, d) => sum + d.indirectCost, 0);
  const totalCost = totalDirectCost + totalIndirectCost;
  const totalProfit = totalRevenue - totalCost;
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  if (loading) {
    return <LoadingState message="견적 원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCartIcon size={32} />
          <h1 className="text-3xl font-bold">견적 원가 분석</h1>
        </div>
        <p className="text-green-100">제품별 직접/간접 원가와 수익성 분석</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 매출액"
          value={`${(totalRevenue / 100000000).toFixed(1)}억`}
          subtitle="월간 총매출"
          changeRate={0}
          trend="up"
          color="green"
          icon={DollarIcon}
        />
        <KPICard
          title="총 원가"
          value={`${(totalCost / 100000000).toFixed(1)}억`}
          subtitle="직접+간접"
          changeRate={0}
          trend="down"
          color="orange"
          icon={PackageIcon}
        />
        <KPICard
          title="영업이익"
          value={`${(totalProfit / 100000000).toFixed(1)}억`}
          subtitle="순이익"
          changeRate={0}
          trend="up"
          color="blue"
          icon={TrendUpIcon}
        />
        <KPICard
          title="평균 마진율"
          value={`${averageMargin.toFixed(1)}%`}
          subtitle="수익성"
          changeRate={0}
          trend="up"
          color="purple"
          icon={UsersIcon}
        />
      </div>

      {/* 원가 구성 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">직접 원가 vs 간접 원가</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="doughnut"
              data={{
                labels: ['직접 원가', '간접 원가'],
                datasets: [{
                  data: [totalDirectCost / 10000, totalIndirectCost / 10000],
                  backgroundColor: ['#10b981', '#f59e0b']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                      labels: { color: '#6b7280' }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">제품별 수익성</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="bar"
              data={{
                labels: [...new Set(directCosts.map(d => d.product))],
                datasets: [{
                  label: '매출액 (억)',
                  data: [...new Set(directCosts.map(d => d.product))].map(product => {
                    const items = directCosts.filter(d => d.product === product);
                    return (items[0]?.salesRevenue || 0) / 100000000;
                  }),
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#6b7280' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 월별 수익성 추이 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">월별 수익성 추이</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="line"
            data={{
              labels: trends.map(t => t.month),
              datasets: [
                {
                  label: '매출액 (억)',
                  data: trends.map(t => t.revenue / 100000000),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y'
                },
                {
                  label: '원가 (억)',
                  data: trends.map(t => t.totalCost / 100000000),
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y'
                },
                {
                  label: '마진율 (%)',
                  data: trends.map(t => t.profitMargin),
                  borderColor: '#8b5cf6',
                  backgroundColor: 'transparent',
                  yAxisID: 'y1'
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  ticks: { color: '#6b7280' }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  grid: { drawOnChartArea: false },
                  ticks: { color: '#6b7280' }
                },
                x: {
                  ticks: { color: '#6b7280' }
                }
              },
              plugins: {
                legend: {
                  labels: { color: '#6b7280' }
                }
              }
            }}
          />
        </div>
      </div>

      {/* 제품별 원가 상세 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">제품별 원가 분석</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">제품</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">직접 원가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">간접 원가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">총 원가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">단가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">매출액</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">마진율</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set(directCosts.map(d => d.product))].map((product) => {
                const items = salesCostData.filter(d => d.product === product);
                const direct = items.find(d => d.costType === '직접 원가');
                const indirect = items.find(d => d.costType === '간접 원가');
                const revenue = direct?.salesRevenue || 0;
                const margin = direct?.profitMargin || 0;

                return (
                  <tr key={product} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{product}</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {direct ? (direct.directCost / 10000).toFixed(0) + '만원' : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {indirect ? (indirect.indirectCost / 10000).toFixed(0) + '만원' : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200 font-medium">
                      {direct && indirect ? ((direct.directCost + indirect.indirectCost) / 10000).toFixed(0) + '만원' : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {direct ? direct.unitCost.toLocaleString() + '원' : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {(revenue / 10000).toFixed(0) + '만원'}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      margin >= 30 ? 'text-green-600' : margin >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {margin.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesCost;
