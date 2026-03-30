import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { DollarIcon, FactoryIcon, TrendUpIcon, AlertIcon } from '@/components/icons/Icons';

interface OutsourcingData {
  id: number;
  vendor: string;
  itemName: string;
  outsourcingType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  deliveryDate: string;
  status: 'pending' | 'in-production' | 'delivered' | 'accepted' | 'rejected';
  qualityRating?: number;
}

interface OutsourcingTrend {
  month: string;
  totalCost: number;
  vendorCount: number;
  averageCost: number;
  onTimeDeliveryRate: number;
}

const OutsourcingCost: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [outsourcingData, setOutsourcingData] = useState<OutsourcingData[]>([]);
  const [outsourcingTrends, setOutsourcingTrends] = useState<OutsourcingTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockOutsourcingData: OutsourcingData[] = [
        { id: 1, vendor: '한국외주A사', itemName: '부품 A-1 가공', outsourcingType: '가공', quantity: 5000, unitCost: 2500, totalCost: 12500000, deliveryDate: '2024-01-15', status: 'delivered', qualityRating: 4.5 },
        { id: 2, vendor: '한국외주A사', itemName: '부품 A-2 조립', outsourcingType: '조립', quantity: 3000, unitCost: 3500, totalCost: 10500000, deliveryDate: '2024-02-10', status: 'accepted', qualityRating: 4.8 },
        { id: 3, vendor: '부산외주B사', itemName: '부품 B-1 가공', outsourcingType: '가공', quantity: 4000, unitCost: 2200, totalCost: 8800000, deliveryDate: '2024-01-25', status: 'delivered', qualityRating: 4.2 },
        { id: 4, vendor: '부산외주B사', itemName: '부품 B-2 도금', outsourcingType: '표면처리', quantity: 3500, unitCost: 1800, totalCost: 6300000, deliveryDate: '2024-02-20', status: 'in-production', qualityRating: undefined },
        { id: 5, vendor: '대구외주C사', itemName: '부품 C-1 열처리', outsourcingType: '열처리', quantity: 2000, unitCost: 4500, totalCost: 9000000, deliveryDate: '2024-03-05', status: 'pending', qualityRating: undefined },
        { id: 6, vendor: '대구외주C사', itemName: '부품 C-2 용접', outsourcingType: '용접', quantity: 2500, unitCost: 3200, totalCost: 8000000, deliveryDate: '2024-01-30', status: 'delivered', qualityRating: 4.0 },
        { id: 7, vendor: '경기외주D사', itemName: '부품 D-1 기계가공', outsourcingType: '가공', quantity: 6000, unitCost: 2800, totalCost: 16800000, deliveryDate: '2024-02-28', status: 'accepted', qualityRating: 4.6 },
        { id: 8, vendor: '경기외주D사', itemName: '부품 D-2 조립', outsourcingType: '조립', quantity: 4500, unitCost: 4000, totalCost: 18000000, deliveryDate: '2024-03-10', status: 'in-production', qualityRating: undefined },
        { id: 9, vendor: '인천외주E사', itemName: '부품 E-1 사출', outsourcingType: '사출성형', quantity: 10000, unitCost: 800, totalCost: 8000000, deliveryDate: '2024-02-05', status: 'delivered', qualityRating: 4.3 },
        { id: 10, vendor: '인천외주E사', itemName: '부품 E-2 도장', outsourcingType: '도장', quantity: 8000, unitCost: 1200, totalCost: 9600000, deliveryDate: '2024-03-15', status: 'pending', qualityRating: undefined },
      ];

      const mockTrends: OutsourcingTrend[] = [
        { month: '1월', totalCost: 85000000, vendorCount: 8, averageCost: 10625000, onTimeDeliveryRate: 92.5 },
        { month: '2월', totalCost: 95000000, vendorCount: 10, averageCost: 9500000, onTimeDeliveryRate: 94.2 },
        { month: '3월', totalCost: 88000000, vendorCount: 9, averageCost: 9777778, onTimeDeliveryRate: 93.8 },
        { month: '4월', totalCost: 92000000, vendorCount: 10, averageCost: 9200000, onTimeDeliveryRate: 95.1 },
        { month: '5월', totalCost: 105000000, vendorCount: 11, averageCost: 9545455, onTimeDeliveryRate: 96.3 },
        { month: '6월', totalCost: 110000000, vendorCount: 11, averageCost: 10000000, onTimeDeliveryRate: 94.8 },
      ];

      setOutsourcingData(mockOutsourcingData);
      setOutsourcingTrends(mockTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch outsourcing cost data');
    } finally {
      setLoading(false);
    }
  };

  const types = ['all', '가공', '조립', '표면처리', '열처리', '용접', '사출성형', '도장'];
  const statuses = ['all', 'pending', 'in-production', 'delivered', 'accepted', 'rejected'];

  const statusLabels = {
    'all': '전체',
    'pending': '대기',
    'in-production': '생산중',
    'delivered': '납품',
    'accepted': '검수완료',
    'rejected': '반려'
  };

  const filteredData = outsourcingData.filter(d => {
    const typeMatch = selectedType === 'all' || d.outsourcingType === selectedType;
    const statusMatch = selectedStatus === 'all' || d.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const totalOutsourcingCost = filteredData.reduce((sum, d) => sum + d.totalCost, 0);
  const totalQuantity = filteredData.reduce((sum, d) => sum + d.quantity, 0);
  const averageUnitCost = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.unitCost, 0) / filteredData.length
    : 0;

  const activeVendors = new Set(filteredData.map(d => d.vendor)).size;
  const inProgressItems = filteredData.filter(d => d.status === 'in-production' || d.status === 'pending').length;
  const completedItems = filteredData.filter(d => d.status === 'accepted' || d.status === 'delivered').length;

  const vendorCosts = outsourcingData.reduce((acc, item) => {
    acc[item.vendor] = (acc[item.vendor] || 0) + item.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const typeCosts = outsourcingData.reduce((acc, item) => {
    acc[item.outsourcingType] = (acc[item.outsourcingType] || 0) + item.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const averageQualityRating = filteredData
    .filter(d => d.qualityRating !== undefined)
    .reduce((sum, d, _, arr) => sum + (d.qualityRating || 0) / arr.filter(x => x.qualityRating !== undefined).length, 0);

  if (loading) {
    return <LoadingState message="외주 원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FactoryIcon size={32} />
          <h1 className="text-3xl font-bold">외주 원가 분석</h1>
        </div>
        <p className="text-indigo-100">외주 협력사별 원가와 품질, 납기 관리</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 외주비"
          value={`${(totalOutsourcingCost / 100000000).toFixed(1)}억`}
          subtitle={`${filteredData.length}개 품목`}
          changeRate={0}
          trend="up"
          color="indigo"
          icon={DollarIcon}
        />
        <KPICard
          title="협력사"
          value={`${activeVendors}개사`}
          subtitle="총 협력사"
          changeRate={0}
          trend="up"
          color="blue"
          icon={FactoryIcon}
        />
        <KPICard
          title="평균 단가"
          value={`${averageUnitCost.toLocaleString()}원`}
          subtitle="품목당 평균"
          changeRate={0}
          trend="stable"
          color="purple"
          icon={TrendUpIcon}
        />
        <KPICard
          title="진행 품목"
          value={`${inProgressItems}개`}
          subtitle={`완료 ${completedItems}개`}
          changeRate={0}
          trend="up"
          color="teal"
          icon={AlertIcon}
        />
      </div>

      {/* 필터 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex gap-2 overflow-x-auto">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? '전체' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex gap-2 overflow-x-auto">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 외주 유형별 비용 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">외주 유형별 비용</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="doughnut"
              data={{
                labels: Object.keys(typeCosts),
                datasets: [{
                  data: Object.values(typeCosts).map(v => v / 10000),
                  backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b']
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">협력사별 외주액</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="bar"
              data={{
                labels: Object.keys(vendorCosts),
                datasets: [{
                  label: '외주액 (만원)',
                  data: Object.values(vendorCosts).map(v => v / 10000),
                  backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 월별 외주비 추이 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">월별 외주비 추이</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="line"
            data={{
              labels: outsourcingTrends.map(t => t.month),
              datasets: [
                {
                  label: '외주비 (억)',
                  data: outsourcingTrends.map(t => t.totalCost / 100000000),
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y'
                },
                {
                  label: '협력사 수',
                  data: outsourcingTrends.map(t => t.vendorCount),
                  borderColor: '#8b5cf6',
                  backgroundColor: 'transparent',
                  yAxisID: 'y1'
                },
                {
                  label: '납기 준수율 (%)',
                  data: outsourcingTrends.map(t => t.onTimeDeliveryRate),
                  borderColor: '#10b981',
                  backgroundColor: 'transparent',
                  borderDash: [5, 5],
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

      {/* 외주 원가 상세 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">외주 원가 상세</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">협력사</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">품목명</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">외주 유형</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">수량</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">단가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">총비용</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">납기일</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">상태</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">품질등급</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const statusColors = {
                  'pending': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                  'in-production': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  'delivered': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  'accepted': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                };
                const color = statusColors[item.status];

                const ratingColor = item.qualityRating && item.qualityRating >= 4.5
                  ? 'text-green-600'
                  : item.qualityRating && item.qualityRating >= 4.0
                  ? 'text-yellow-600'
                  : item.qualityRating
                  ? 'text-red-600'
                  : 'text-gray-400';

                return (
                  <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{item.vendor}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.itemName}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.outsourcingType}</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.quantity.toLocaleString()}개</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.unitCost.toLocaleString()}원</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                      {(item.totalCost / 10000).toFixed(0)}만원
                    </td>
                    <td className="py-3 px-4 text-center text-gray-800 dark:text-gray-200">{item.deliveryDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-center font-semibold ${ratingColor}`}>
                      {item.qualityRating ? item.qualityRating.toFixed(1) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 외주 원가 인사이트 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">외주 원가 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">협력사 관리</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 {activeVendors}개 협력사와 협력 중입니다.
                  평균 품질등급은 {averageQualityRating > 0 ? averageQualityRating.toFixed(1) : '-'}점으로
                  우수 협력사와의 장기 파트너십을 통해 비용을 절감할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">진행 현황</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 {inProgressItems}개 품목이 진행 중이며, {completedItems}개 품목이 완료되었습니다.
                  납기 관리와 품질 검수를 철저히 하여 외주 리스크를 최소화하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutsourcingCost;
