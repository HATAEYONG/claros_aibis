import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  ZapIcon,
  TrendUpIcon,
  TargetIcon,
  ActivityIcon,
  CheckIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface RDProject {
  id: number;
  project_id: string;
  title: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  progress: string;
  budget: string;
  spent: string;
  team_lead: string;
  team_size: number;
  start_date: string;
  target_date: string;
  budget_usage_rate: number;
}

interface InnovationMetric {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  category: string;
  category_display: string;
  metric_name: string;
  target_value: string;
  actual_value: string;
  achievement_rate: string;
  unit: string;
}

interface Patent {
  id: number;
  application_number: string;
  registration_number: string;
  title: string;
  ip_type: string;
  ip_type_display: string;
  status: string;
  status_display: string;
  inventor: string;
  applicant: string;
  application_date: string;
}

interface RDBudget {
  id: number;
  fiscal_year: number;
  category: string;
  allocated_budget: string;
  spent_budget: string;
  remaining_budget: string;
  execution_rate: string;
}

const Development: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'projects' | 'innovation' | 'patents'>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectData, setProjectData] = useState<RDProject[]>([]);
  const [innovationData, setInnovationData] = useState<InnovationMetric[]>([]);
  const [patentData, setPatentData] = useState<Patent[]>([]);
  const [budgetData, setBudgetData] = useState<RDBudget[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, innovationRes, patentRes, budgetRes] = await Promise.all([
          api.development.getRDProject(),
          api.development.getInnovationMetric('fiscal_year=2024&fiscal_month=12'),
          api.development.getPatent(),
          api.development.getRDBudget('fiscal_year=2024'),
        ]);

        setProjectData(Array.isArray(projectRes) ? projectRes : projectRes.results || []);
        setInnovationData(Array.isArray(innovationRes) ? innovationRes : innovationRes.results || []);
        setPatentData(Array.isArray(patentRes) ? patentRes : patentRes.results || []);
        setBudgetData(Array.isArray(budgetRes) ? budgetRes : budgetRes.results || []);
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
    const totalProjects = projectData.length;
    const avgProgress = projectData.length > 0
      ? projectData.reduce((sum, p) => sum + parseFloat(p.progress), 0) / projectData.length
      : 0;
    const totalBudget = budgetData.reduce((sum, b) => sum + parseFloat(b.allocated_budget), 0);
    const totalSpent = budgetData.reduce((sum, b) => sum + parseFloat(b.spent_budget), 0);
    const executionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalProjects, avgProgress, totalBudget, executionRate };
  };

  // 프로젝트 상태별 분포 차트
  const getProjectStatusChartData = () => {
    const statusCounts: Record<string, number> = {};
    projectData.forEach(p => {
      statusCounts[p.status_display] = (statusCounts[p.status_display] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: '프로젝트 수',
        data: Object.values(statusCounts),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280'],
        borderWidth: 0
      }]
    };
  };

  // R&D 예산 차트
  const getBudgetChartData = () => {
    return {
      labels: budgetData.map(b => b.category),
      datasets: [
        {
          label: '배정 예산',
          data: budgetData.map(b => parseFloat(b.allocated_budget)),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: '#3b82f6',
          borderWidth: 2
        },
        {
          label: '집행 예산',
          data: budgetData.map(b => parseFloat(b.spent_budget)),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2
        }
      ]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-700';
      case 'development': return 'bg-blue-100 text-blue-700';
      case 'testing': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'research': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 30) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (loading) {
    return <LoadingState message="개발 관리 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const kpiSummary = getKPISummary();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ZapIcon size={32} />
          <h1 className="text-3xl font-bold">개발 관리</h1>
        </div>
        <p className="text-purple-100">R&D 프로젝트와 혁신 활동을 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="진행 프로젝트"
          value={`${kpiSummary.totalProjects}`}
          subtitle="전체 R&D 프로젝트"
          unit="개"
          changeRate={0}
          trend="stable"
          color="purple"
          icon={ActivityIcon}
        />
        <KPICard
          title="평균 진행률"
          value={`${kpiSummary.avgProgress.toFixed(1)}%`}
          subtitle="프로젝트 평균"
          changeRate={kpiSummary.avgProgress - 50}
          trend={kpiSummary.avgProgress >= 50 ? "up" : "down"}
          color="blue"
          icon={TargetIcon}
        />
        <KPICard
          title="R&D 예산"
          value={`${kpiSummary.totalBudget.toFixed(0)}`}
          subtitle="2024년 배정"
          unit="억원"
          changeRate={0}
          trend="stable"
          color="green"
          icon={TrendUpIcon}
        />
        <KPICard
          title="예산 집행률"
          value={`${kpiSummary.executionRate.toFixed(1)}%`}
          subtitle="목표: 80%"
          changeRate={kpiSummary.executionRate - 80}
          trend={kpiSummary.executionRate >= 80 ? "up" : "down"}
          color="yellow"
          icon={CheckIcon}
        />
      </div>

      {/* 뷰 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('projects')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedView === 'projects'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            프로젝트
          </button>
          <button
            onClick={() => setSelectedView('innovation')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedView === 'innovation'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            혁신 지표
          </button>
          <button
            onClick={() => setSelectedView('patents')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedView === 'patents'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            지식재산
          </button>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로젝트 상태별 분포 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-purple-600" size={24} />
              프로젝트 상태별 분포
            </h3>
            <p className="text-sm text-gray-500 mt-1">R&D 프로젝트 현황</p>
          </div>

          <ChartComponent
            type="doughnut"
            data={getProjectStatusChartData()}
            options={{
              plugins: {
                legend: { position: 'right' }
              }
            }}
            height={280}
          />
        </div>

        {/* R&D 예산 현황 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendUpIcon className="text-green-600" size={24} />
              R&D 예산 현황
            </h3>
            <p className="text-sm text-gray-500 mt-1">카테고리별 예산 (억원)</p>
          </div>

          <ChartComponent
            type="bar"
            data={getBudgetChartData()}
            options={{
              plugins: {
                legend: { position: 'top' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {selectedView === 'projects' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <ActivityIcon size={20} />
              R&D 프로젝트 현황
            </h3>
            <p className="text-purple-100 text-xs mt-1">진행 중인 프로젝트</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4 text-left">프로젝트</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">책임자</th>
                  <th className="py-3 px-4 text-center">팀원</th>
                  <th className="py-3 px-4 text-center">진행률</th>
                  <th className="py-3 px-4 text-center">예산</th>
                  <th className="py-3 px-4 text-center">마감일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectData.map((project) => (
                  <tr key={project.id} className="hover:bg-purple-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-gray-500">{project.project_id}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                        {project.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{project.team_lead}</td>
                    <td className="py-3 px-4 text-center">{project.team_size}명</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(parseFloat(project.progress))}`}
                            style={{ width: `${parseFloat(project.progress)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{parseFloat(project.progress).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <p className="font-medium">{parseFloat(project.spent).toFixed(1)}억</p>
                      <p className="text-xs text-gray-500">/ {parseFloat(project.budget).toFixed(1)}억</p>
                    </td>
                    <td className="py-3 px-4 text-center">{project.target_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 혁신 지표 */}
      {selectedView === 'innovation' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ZapIcon className="text-yellow-600" size={24} />
              혁신 지표 현황
            </h3>
            <p className="text-sm text-gray-500 mt-1">12월 기준</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {innovationData.map((metric) => (
              <div key={metric.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500">{metric.category_display}</p>
                    <h4 className="font-bold text-gray-800">{metric.metric_name}</h4>
                  </div>
                  <span className={`text-2xl font-bold ${
                    parseFloat(metric.achievement_rate) >= 100 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {parseFloat(metric.achievement_rate).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">목표: {parseFloat(metric.target_value).toFixed(1)}{metric.unit}</span>
                  <span className="font-medium text-blue-600">실적: {parseFloat(metric.actual_value).toFixed(1)}{metric.unit}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(metric.achievement_rate) >= 100 ? 'bg-green-600' : 'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(metric.achievement_rate), 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 지식재산 */}
      {selectedView === 'patents' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <CheckIcon size={20} />
              지식재산 현황
            </h3>
            <p className="text-blue-100 text-xs mt-1">특허 및 지식재산권</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4 text-left">출원번호</th>
                  <th className="py-3 px-4 text-left">제목</th>
                  <th className="py-3 px-4 text-center">유형</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">발명자</th>
                  <th className="py-3 px-4 text-center">출원일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patentData.map((patent) => (
                  <tr key={patent.id} className="hover:bg-blue-50">
                    <td className="py-3 px-4 font-medium">{patent.application_number}</td>
                    <td className="py-3 px-4">{patent.title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {patent.ip_type_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        patent.status === 'registered' ? 'bg-green-100 text-green-700' :
                        patent.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {patent.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{patent.inventor}</td>
                    <td className="py-3 px-4 text-center">{patent.application_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* R&D 예산 현황 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <TrendUpIcon size={20} />
            R&D 예산 집행 현황
          </h3>
          <p className="text-green-100 text-xs mt-1">2024년 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">카테고리</th>
                <th className="py-3 px-4 text-center">배정 예산</th>
                <th className="py-3 px-4 text-center">집행 예산</th>
                <th className="py-3 px-4 text-center">잔여 예산</th>
                <th className="py-3 px-4 text-center">집행률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {budgetData.map((budget) => (
                <tr key={budget.id} className="hover:bg-green-50">
                  <td className="py-3 px-4 font-medium">{budget.category}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(budget.allocated_budget).toFixed(1)}억</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{parseFloat(budget.spent_budget).toFixed(1)}억</td>
                  <td className="py-3 px-4 text-center text-gray-500">{parseFloat(budget.remaining_budget).toFixed(1)}억</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(budget.execution_rate) >= 80 ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${parseFloat(budget.execution_rate)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{parseFloat(budget.execution_rate).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 개발 인사이트 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">개발 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">프로젝트 현황</p>
                <p className="text-sm text-gray-600">
                  총 {kpiSummary.totalProjects}개 R&D 프로젝트가 진행 중이며,
                  평균 진행률은 {kpiSummary.avgProgress.toFixed(1)}%입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">예산 집행</p>
                <p className="text-sm text-gray-600">
                  총 {kpiSummary.totalBudget.toFixed(0)}억원 중 {kpiSummary.executionRate.toFixed(1)}%가 집행되었습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">지식재산</p>
                <p className="text-sm text-gray-600">
                  총 {patentData.length}건의 지식재산권이 관리되고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Development;
