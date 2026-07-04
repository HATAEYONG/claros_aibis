import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { AlertIcon, CheckIcon, TrendDownIcon, DollarIcon } from '@/components/icons/Icons';

interface QualityCostData {
  id: number;
  costType: string;
  description: string;
  costAmount: number;
  defectRate: number;
  impactedProducts: number;
  category: 'prevention' | 'appraisal' | 'failure' | 'external';
}

interface QualityTrend {
  month: string;
  totalCost: number;
  defectRate: number;
  preventionCost: number;
  appraisalCost: number;
  failureCost: number;
}

const QualityCost: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [qualityCosts, setQualityCosts] = useState<QualityCostData[]>([]);
  const [qualityTrends, setQualityTrends] = useState<QualityTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockQualityCosts: QualityCostData[] = [
        { id: 1, costType: '예방 활동', description: '품질 교육', costAmount: 8500000, defectRate: 2.1, impactedProducts: 120, category: 'prevention' },
        { id: 2, costType: '예방 활동', description: '공정 관리', costAmount: 5200000, defectRate: 2.1, impactedProducts: 80, category: 'prevention' },
        { id: 3, costType: '평가 활동', description: '입고 검사', costAmount: 12300000, defectRate: 2.1, impactedProducts: 350, category: 'appraisal' },
        { id: 4, costType: '평가 활동', description: '공정 검사', costAmount: 15600000, defectRate: 2.1, impactedProducts: 420, category: 'appraisal' },
        { id: 5, costType: '내부 실패', description: '재작업 비용', costAmount: 32000000, defectRate: 2.1, impactedProducts: 180, category: 'failure' },
        { id: 6, costType: '내부 실패', description: '폐기 처분', costAmount: 8500000, defectRate: 2.1, impactedProducts: 45, category: 'failure' },
        { id: 7, costType: '외부 실패', description: '클레임 비용', costAmount: 15000000, defectRate: 2.1, impactedProducts: 25, category: 'external' },
        { id: 8, costType: '외부 실패', description: '반품 배송', costAmount: 8500000, defectRate: 2.1, impactedProducts: 18, category: 'external' },
      ];

      const mockTrends: QualityTrend[] = [
        { month: '1월', totalCost: 85000000, defectRate: 3.2, preventionCost: 12000000, appraisalCost: 25000000, failureCost: 48000000 },
        { month: '2월', totalCost: 92000000, defectRate: 3.5, preventionCost: 13000000, appraisalCost: 28000000, failureCost: 51000000 },
        { month: '3월', totalCost: 78000000, defectRate: 2.8, preventionCost: 14000000, appraisalCost: 26000000, failureCost: 38000000 },
        { month: '4월', totalCost: 88000000, defectRate: 3.0, preventionCost: 13500000, appraisalCost: 27000000, failureCost: 47500000 },
        { month: '5월', totalCost: 81000000, defectRate: 2.5, preventionCost: 14500000, appraisalCost: 26500000, failureCost: 40000000 },
        { month: '6월', totalCost: 76000000, defectRate: 2.3, preventionCost: 15000000, appraisalCost: 25500000, failureCost: 35500000 },
      ];

      setQualityCosts(mockQualityCosts);
      setQualityTrends(mockTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality cost data');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'prevention', 'appraisal', 'failure', 'external'];
  const categoryLabels = {
    'all': '전체',
    'prevention': '예방 비용',
    'appraisal': '평가 비용',
    'failure': '내부 실패 비용',
    'external': '외부 실패 비용'
  };

  const filteredData = selectedCategory === 'all'
    ? qualityCosts
    : qualityCosts.filter(d => d.category === selectedCategory);

  const totalQualityCost = filteredData.reduce((sum, d) => sum + d.costAmount, 0);
  const averageDefectRate = qualityCosts.length > 0
    ? qualityCosts.reduce((sum, d) => sum + d.defectRate, 0) / qualityCosts.length
    : 0;

  const categoryTotals = {
    prevention: qualityCosts.filter(d => d.category === 'prevention').reduce((sum, d) => sum + d.costAmount, 0),
    appraisal: qualityCosts.filter(d => d.category === 'appraisal').reduce((sum, d) => sum + d.costAmount, 0),
    failure: qualityCosts.filter(d => d.category === 'failure').reduce((sum, d) => sum + d.costAmount, 0),
    external: qualityCosts.filter(d => d.category === 'external').reduce((sum, d) => sum + d.costAmount, 0)
  };

  if (loading) {
    return <LoadingState message="품질 원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <AlertIcon size={32} />
          <h1 className="text-3xl font-bold">품질 원가 분석</h1>
        </div>
        <p className="text-red-100">예방, 평가, 실패 비용의 통합 분석으로 품질 경영 개선</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 품질 비용"
          value={`${(totalQualityCost / 100000000).toFixed(1)}억`}
          subtitle="월간 총액"
          changeRate={0}
          trend="down"
          color="red"
          icon={DollarIcon}
        />
        <KPICard
          title="불불률"
          value={`${averageDefectRate.toFixed(1)}%`}
          subtitle="평균 불량률"
          changeRate={0}
          trend="down"
          color="green"
          icon={TrendDownIcon}
        />
        <KPICard
          title="예방 비용"
          value={`${(categoryTotals.prevention / 10000).toFixed(0)}만원`}
          subtitle="전체의 ${((categoryTotals.prevention / totalQualityCost) * 100).toFixed(0)}%"
          changeRate={0}
          trend="up"
          color="blue"
          icon={CheckIcon}
        />
        <KPICard
          title="실패 비용"
          value={`${((categoryTotals.failure + categoryTotals.external) / 10000).toFixed(0)}만원`}
          subtitle="내부+외부 실패"
          changeRate={0}
          trend="down"
          color="orange"
          icon={AlertIcon}
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
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* 품질 비용 구성 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">품질 비용 구성</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="doughnut"
            data={{
              labels: ['예방 비용', '평가 비용', '내부 실패', '외부 실패'],
              datasets: [{
                data: [
                  categoryTotals.prevention / 10000,
                  categoryTotals.appraisal / 10000,
                  categoryTotals.failure / 10000,
                  categoryTotals.external / 10000
                ],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
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

      {/* 월별 추이 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">월별 품질 비용 추이</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="bar"
            data={{
              labels: qualityTrends.map(t => t.month),
              datasets: [
                {
                  label: '예방 비용',
                  data: qualityTrends.map(t => t.preventionCost / 10000),
                  backgroundColor: '#3b82f6'
                },
                {
                  label: '평가 비용',
                  data: qualityTrends.map(t => t.appraisalCost / 10000),
                  backgroundColor: '#10b981'
                },
                {
                  label: '실패 비용',
                  data: qualityTrends.map(t => t.failureCost / 10000),
                  backgroundColor: '#ef4444'
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true },
                y: { stacked: true }
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

      {/* 품질 원가 상세 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">품질 원가 상세</h3>
        <div className="space-y-3">
          {filteredData.map((item) => {
            const categoryColors = {
              'prevention': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              'appraisal': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              'failure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
              'external': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            };
            const color = categoryColors[item.category];

            return (
              <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.costType}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                    {item.category === 'prevention' && '예방'}
                    {item.category === 'appraisal' && '평가'}
                    {item.category === 'failure' && '내부 실패'}
                    {item.category === 'external' && '외부 실패'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">비용</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {(item.costAmount / 10000).toFixed(0)}만원
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">영향 제품</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{item.impactedProducts}개</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 품질 비용 인사이트 */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">품질 비용 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">코크스 품질비용 최적화</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 예방 비용 비율은 {((categoryTotals.prevention / totalQualityCost) * 100).toFixed(1)}%입니다.
                  업계적으로 예방 활동에 투자하여 실패 비용을 절감할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📉</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">불불률 개선 효과</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  최근 6개월간 불량률이 {averageDefectRate.toFixed(1)}%로 유지되고 있어,
                  안정적인 품질 수준을 보이고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityCost;
