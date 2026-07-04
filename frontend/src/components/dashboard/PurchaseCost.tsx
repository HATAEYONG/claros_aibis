import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { DollarIcon, ShoppingCartIcon, TrendUpIcon, PackageIcon } from '@/components/icons/Icons';

interface PurchaseCostData {
  id: number;
  supplier: string;
  material: string;
  purchasePrice: number;
  quantity: number;
  totalCost: number;
  unit: string;
  category: string;
}

interface PriceTrend {
  month: string;
  averagePrice: number;
  totalCost: number;
}

const PurchaseCost: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [purchaseData, setPurchaseData] = useState<PurchaseCostData[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulated API data
      const mockPurchaseData: PurchaseCostData[] = [
        { id: 1, supplier: 'A사', material: '원자재 A-1', purchasePrice: 15000, quantity: 500, totalCost: 7500000, unit: 'kg', category: '원자재' },
        { id: 2, supplier: 'B사', material: '원자재 A-2', purchasePrice: 22000, quantity: 300, totalCost: 6600000, unit: 'kg', category: '원자재' },
        { id: 3, supplier: 'C사', material: '부품 B-1', purchasePrice: 5500, quantity: 1000, totalCost: 5500000, unit: '개', category: '부품' },
        { id: 4, supplier: 'A사', material: '부품 B-2', purchasePrice: 8200, quantity: 800, totalCost: 6560000, unit: '개', category: '부품' },
        { id: 5, supplier: 'D사', material: '소모품 C-1', purchasePrice: 1200, quantity: 2000, totalCost: 2400000, unit: '개', category: '소모품' },
        { id: 6, supplier: 'E사', material: '소모품 C-2', purchasePrice: 950, quantity: 2500, totalCost: 2375000, unit: '개', category: '소모품' },
        { id: 7, supplier: 'B사', material: '포장재 D-1', purchasePrice: 350, quantity: 5000, totalCost: 1750000, unit: 'm', category: '포장재' },
        { id: 8, supplier: 'F사', material: '포장재 D-2', purchasePrice: 420, quantity: 4500, totalCost: 1890000, unit: 'm', category: '포장재' },
      ];

      const mockPriceTrends: PriceTrend[] = [
        { month: '1월', averagePrice: 16800, totalCost: 52000000 },
        { month: '2월', averagePrice: 17200, totalCost: 54000000 },
        { month: '3월', averagePrice: 16500, totalCost: 51000000 },
        { month: '4월', averagePrice: 18000, totalCost: 55000000 },
        { month: '5월', averagePrice: 17500, totalCost: 53000000 },
        { month: '6월', averagePrice: 18200, totalCost: 56000000 },
      ];

      setPurchaseData(mockPurchaseData);
      setPriceTrends(mockPriceTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase cost data');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', '원자재', '부품', '소모품', '포장재'];

  const filteredData = selectedCategory === 'all'
    ? purchaseData
    : purchaseData.filter(d => d.category === selectedCategory);

  const totalPurchaseCost = filteredData.reduce((sum, d) => sum + d.totalCost, 0);
  const averagePrice = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.purchasePrice, 0) / filteredData.length
    : 0;

  const supplierCosts = purchaseData.reduce((acc, item) => {
    acc[item.supplier] = (acc[item.supplier] || 0) + item.totalCost;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <LoadingState message="구매 원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCartIcon size={32} />
          <h1 className="text-3xl font-bold">구매 원가 분석</h1>
        </div>
        <p className="text-orange-100">자재별 구매 단가와 총비용을 분석합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 구매액"
          value={`${(totalPurchaseCost / 100000000).toFixed(1)}억`}
          subtitle={`${filteredData.length}개 품목`}
          changeRate={0}
          trend="up"
          color="orange"
          icon={DollarIcon}
        />
        <KPICard
          title="평균 단가"
          value={`${averagePrice.toLocaleString()}원`}
          subtitle="품목당 평균"
          changeRate={0}
          trend="stable"
          color="blue"
          icon={PackageIcon}
        />
        <KPICard
          title="공급업체"
          value={`${Object.keys(supplierCosts).length}개사`}
          subtitle="총 공급업체"
          changeRate={0}
          trend="up"
          color="green"
          icon={TrendUpIcon}
        />
        <KPICard
          title="구매 품목"
          value={`${filteredData.length}개`}
          subtitle="전체 품목"
          changeRate={0}
          trend="up"
          color="purple"
          icon={ShoppingCartIcon}
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' && '전체'}
              {category === '원자재' && '원자재'}
              {category === '부품' && '부품'}
              {category === '소모품' && '소모품'}
              {category === '포장재' && '포장재'}
            </button>
          ))}
        </div>
      </div>

      {/* 단가 추이 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">월별 구매 단가 추이</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="line"
            data={{
              labels: priceTrends.map(t => t.month),
              datasets: [{
                label: '평균 단가 (원)',
                data: priceTrends.map(t => t.averagePrice),
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4
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

      {/* 구매 원가 상세 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">구매 원가 상세</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">공급업체</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">자재명</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">단가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">수량</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">총비용</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">카테고리</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.supplier}</td>
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.material}</td>
                  <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.purchasePrice.toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.quantity.toLocaleString()} {item.unit}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                    {(item.totalCost / 10000).toFixed(1)}만원
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded text-xs">
                      {item.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 공급업체별 비용 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">공급업체별 구매액</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="bar"
            data={{
              labels: Object.keys(supplierCosts),
              datasets: [{
                label: '구매액 (만원)',
                data: Object.values(supplierCosts).map(v => v / 10000),
                backgroundColor: [
                  '#f97316', '#fb923c', '#fdba74', '#fcd34d',
                  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'
                ]
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
  );
};

export default PurchaseCost;
