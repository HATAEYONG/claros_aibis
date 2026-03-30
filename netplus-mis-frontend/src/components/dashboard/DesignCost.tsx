import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { DollarIcon, ClockIcon, TrendUpIcon, UsersIcon } from '@/components/icons/Icons';

interface DesignCostData {
  id: number;
  projectName: string;
  projectCode: string;
  designType: string;
  designHours: number;
  hourlyCost: number;
  materialCost: number;
  softwareCost: number;
  totalCost: number;
  designer: string;
  status: 'planning' | 'in-progress' | 'completed' | 'review';
}

interface DesignTrend {
  month: string;
  totalHours: number;
  totalCost: number;
  projectCount: number;
  averageCost: number;
}

const DesignCost: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [designCosts, setDesignCosts] = useState<DesignCostData[]>([]);
  const [designTrends, setDesignTrends] = useState<DesignTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockDesignCosts: DesignCostData[] = [
        { id: 1, projectName: '새 모델 A 디자인', projectCode: 'D-2024-001', designType: '신규 설계', designHours: 320, hourlyCost: 45000, materialCost: 2500000, softwareCost: 1800000, totalCost: 18700000, designer: '김디자인', status: 'completed' },
        { id: 2, projectName: '모델 B 개량', projectCode: 'D-2024-002', designType: '설계 변경', designHours: 180, hourlyCost: 42000, materialCost: 1200000, softwareCost: 900000, totalCost: 9960000, designer: '이설계', status: 'in-progress' },
        { id: 3, projectName: '부품 C 최적화', projectCode: 'D-2024-003', designType: '최적화', designHours: 120, hourlyCost: 48000, materialCost: 800000, softwareCost: 600000, totalCost: 7160000, designer: '박엔지', status: 'review' },
        { id: 4, projectName: '제품 D 컨셉', projectCode: 'D-2024-004', designType: '컨셉 설계', designHours: 240, hourlyCost: 50000, materialCost: 3500000, softwareCost: 2200000, totalCost: 17500000, designer: '김디자인', status: 'planning' },
        { id: 5, projectName: '시스템 E 설계', projectCode: 'D-2024-005', designType: '시스템 설계', designHours: 400, hourlyCost: 55000, materialCost: 4500000, softwareCost: 3000000, totalCost: 29500000, designer: '최시스템', status: 'in-progress' },
        { id: 6, projectName: '인터페이스 F 개선', projectCode: 'D-2024-006', designType: '설계 변경', designHours: 90, hourlyCost: 40000, materialCost: 500000, softwareCost: 400000, totalCost: 4500000, designer: '이설계', status: 'completed' },
        { id: 7, projectName: '구조 G 해석', projectCode: 'D-2024-007', designType: '해석/시뮬레이션', designHours: 150, hourlyCost: 60000, materialCost: 2000000, softwareCost: 2500000, totalCost: 13500000, designer: '정해석', status: 'completed' },
        { id: 8, projectName: '제품 H 마감', projectCode: 'D-2024-008', designType: '신규 설계', designHours: 200, hourlyCost: 47000, materialCost: 2800000, softwareCost: 1900000, totalCost: 14200000, designer: '박엔지', status: 'review' },
      ];

      const mockTrends: DesignTrend[] = [
        { month: '1월', totalHours: 680, totalCost: 32000000, projectCount: 5, averageCost: 6400000 },
        { month: '2월', totalHours: 750, totalCost: 35000000, projectCount: 6, averageCost: 5833333 },
        { month: '3월', totalHours: 820, totalCost: 38000000, projectCount: 7, averageCost: 5428571 },
        { month: '4월', totalHours: 900, totalCost: 42000000, projectCount: 8, averageCost: 5250000 },
        { month: '5월', totalHours: 850, totalCost: 39500000, projectCount: 7, averageCost: 5642857 },
        { month: '6월', totalHours: 920, totalCost: 44000000, projectCount: 8, averageCost: 5500000 },
      ];

      setDesignCosts(mockDesignCosts);
      setDesignTrends(mockTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch design cost data');
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['all', 'planning', 'in-progress', 'review', 'completed'];
  const statusLabels = {
    'all': '전체',
    'planning': '기획',
    'in-progress': '진행중',
    'review': '검토',
    'completed': '완료'
  };

  const filteredData = selectedStatus === 'all'
    ? designCosts
    : designCosts.filter(d => d.status === selectedStatus);

  const totalDesignCost = filteredData.reduce((sum, d) => sum + d.totalCost, 0);
  const totalDesignHours = filteredData.reduce((sum, d) => sum + d.designHours, 0);
  const averageHourlyCost = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.hourlyCost, 0) / filteredData.length
    : 0;
  const activeProjects = filteredData.filter(d => d.status === 'in-progress' || d.status === 'review').length;

  const designTypeCosts = designCosts.reduce((acc, item) => {
    acc[item.designType] = (acc[item.designType] || 0) + item.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const designerStats = designCosts.reduce((acc, item) => {
    if (!acc[item.designer]) {
      acc[item.designer] = { hours: 0, cost: 0, projects: 0 };
    }
    acc[item.designer].hours += item.designHours;
    acc[item.designer].cost += item.totalCost;
    acc[item.designer].projects += 1;
    return acc;
  }, {} as Record<string, { hours: number; cost: number; projects: number }>);

  if (loading) {
    return <LoadingState message="설계 원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendUpIcon size={32} />
          <h1 className="text-3xl font-bold">설계 원가 분석</h1>
        </div>
        <p className="text-cyan-100">설계 작업비와 자재비, 소프트웨어 비용의 통합 관리</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 설계비"
          value={`${(totalDesignCost / 100000000).toFixed(1)}억`}
          subtitle={`${filteredData.length}개 프로젝트`}
          changeRate={0}
          trend="up"
          color="cyan"
          icon={DollarIcon}
        />
        <KPICard
          title="총 작업시간"
          value={`${(totalDesignHours).toFixed(0)}시간`}
          subtitle="설계 공수"
          changeRate={0}
          trend="stable"
          color="blue"
          icon={ClockIcon}
        />
        <KPICard
          title="평균 시간당 단가"
          value={`${averageHourlyCost.toLocaleString()}원`}
          subtitle="설계사당 평균"
          changeRate={0}
          trend="up"
          color="teal"
          icon={TrendUpIcon}
        />
        <KPICard
          title="진행 프로젝트"
          value={`${activeProjects}개`}
          subtitle="활성 프로젝트"
          changeRate={0}
          trend="up"
          color="purple"
          icon={UsersIcon}
        />
      </div>

      {/* 상태 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedStatus === status
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* 설계 유형별 비용 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">설계 유형별 비용</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="doughnut"
              data={{
                labels: Object.keys(designTypeCosts),
                datasets: [{
                  data: Object.values(designTypeCosts).map(v => v / 10000),
                  backgroundColor: ['#06b6d4', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6']
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">월별 설계비 추이</h3>
          <div style={{ height: '250px' }}>
            <ChartComponent
              type="line"
              data={{
                labels: designTrends.map(t => t.month),
                datasets: [
                  {
                    label: '설계비 (억)',
                    data: designTrends.map(t => t.totalCost / 100000000),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                  },
                  {
                    label: '프로젝트 수',
                    data: designTrends.map(t => t.projectCount),
                    borderColor: '#6366f1',
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
      </div>

      {/* 설계사별 성과 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">설계사별 성과</h3>
        <div style={{ height: '300px' }}>
          <ChartComponent
            type="bar"
            data={{
              labels: Object.keys(designerStats),
              datasets: [
                {
                  label: '작업시간 (시간)',
                  data: Object.values(designerStats).map(v => v.hours),
                  backgroundColor: '#06b6d4'
                },
                {
                  label: '프로젝트 수',
                  data: Object.values(designerStats).map(v => v.projects),
                  backgroundColor: '#6366f1'
                }
              ]
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

      {/* 설계 원가 상세 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">설계 원가 상세</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">프로젝트</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">프로젝트 코드</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">설계 유형</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">작업시간</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">시간당 단가</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">자재비</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">소프트웨어비</th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">총비용</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const statusColors = {
                  'planning': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  'review': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                };
                const color = statusColors[item.status];

                return (
                  <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{item.projectName}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.projectCode}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.designType}</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.designHours}시간</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{item.hourlyCost.toLocaleString()}원</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{(item.materialCost / 10000).toFixed(0)}만원</td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{(item.softwareCost / 10000).toFixed(0)}만원</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                      {(item.totalCost / 10000).toFixed(0)}만원
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 설계 원가 인사이트 */}
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">설계 원가 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">설계 효율화</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  평균 시간당 단가는 {averageHourlyCost.toLocaleString()}원입니다.
                  경력 설계사와 주니어 설계사의 적절한 배분으로 비용 효율을 개선할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">프로젝트 관리</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 {activeProjects}개 프로젝트가 진행 중입니다.
                  프로젝트 간 작업 부하를 균형있게 배분하여 설계 품질을 유지하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignCost;
