import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  CheckIcon,
  TrendUpIcon,
  TrendDownIcon,
  ZapIcon,
  ActivityIcon,
  TargetIcon,
  UserIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface ESGScore {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  environment_score: string;
  social_score: string;
  governance_score: string;
  total_score: string;
}

interface CarbonEmission {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  target_emission: string;
  actual_emission: string;
  reduction_rate: string;
}

interface EnergyConsumption {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  energy_source: string;
  consumption: string;
  cost: string;
}

interface EnvironmentalProject {
  id: number;
  project_id: string;
  title: string;
  category: string;
  impact: string;
  investment: string;
  saving: string;
  progress: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface SocialActivity {
  id: number;
  fiscal_year: number;
  activity_name: string;
  participants: number;
  hours: number;
  budget: string;
}

interface GovernanceMetric {
  id: number;
  fiscal_year: number;
  metric_name: string;
  actual_value: string;
  benchmark: string;
  status: string;
}

const ESG: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scores, setScores] = useState<ESGScore[]>([]);
  const [carbon, setCarbon] = useState<CarbonEmission[]>([]);
  const [energy, setEnergy] = useState<EnergyConsumption[]>([]);
  const [projects, setProjects] = useState<EnvironmentalProject[]>([]);
  const [social, setSocial] = useState<SocialActivity[]>([]);
  const [governance, setGovernance] = useState<GovernanceMetric[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scoresRes, carbonRes, energyRes, projectsRes, socialRes, govRes] = await Promise.all([
          api.esg.getScores('fiscal_year=2024'),
          api.esg.getCarbon('fiscal_year=2024'),
          api.esg.getEnergy('fiscal_year=2024&fiscal_month=12'),
          api.esg.getProjects(),
          api.esg.getSocial('fiscal_year=2024'),
          api.esg.getGovernance('fiscal_year=2024'),
        ]);

        setScores(Array.isArray(scoresRes) ? scoresRes : scoresRes.results || []);
        setCarbon(Array.isArray(carbonRes) ? carbonRes : carbonRes.results || []);
        setEnergy(Array.isArray(energyRes) ? energyRes : energyRes.results || []);
        setProjects(Array.isArray(projectsRes) ? projectsRes : projectsRes.results || []);
        setSocial(Array.isArray(socialRes) ? socialRes : socialRes.results || []);
        setGovernance(Array.isArray(govRes) ? govRes : govRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ESG 점수 차트
  const getESGScoreData = () => {
    const latest = scores.length > 0 ? scores.sort((a, b) => b.fiscal_month - a.fiscal_month)[0] : null;
    if (!latest) return { labels: [], datasets: [] };

    return {
      labels: ['환경(E)', '사회(S)', '지배구조(G)'],
      datasets: [{
        label: 'ESG 점수',
        data: [
          parseFloat(latest.environment_score || '0'),
          parseFloat(latest.social_score || '0'),
          parseFloat(latest.governance_score || '0')
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  };

  // 탄소 배출량 차트
  const getCarbonEmissionData = () => {
    if (carbon.length === 0) return { labels: [], datasets: [] };

    const sorted = [...carbon].sort((a, b) => a.fiscal_month - b.fiscal_month);

    return {
      labels: sorted.map(c => `${c.fiscal_month}월`),
      datasets: [
        {
          label: '목표',
          data: sorted.map(c => parseFloat(c.target_emission || '0')),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: '실제 배출량',
          data: sorted.map(c => parseFloat(c.actual_emission || '0')),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 에너지 소비 차트
  const getEnergyData = () => {
    if (energy.length === 0) return { labels: [], datasets: [] };

    const sourceLabels: Record<string, string> = {
      'electricity': '전기',
      'gas': '가스',
      'oil': '유류',
      'steam': '증기',
      'solar': '태양광'
    };

    return {
      labels: energy.map(e => sourceLabels[e.energy_source] || e.energy_source),
      datasets: [{
        label: '에너지 소비 (MWh)',
        data: energy.map(e => parseFloat(e.consumption || '0')),
        backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'],
        borderWidth: 0
      }]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700';
      case 'good': return 'bg-blue-100 text-blue-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '우수';
      case 'good': return '양호';
      case 'warning': return '주의';
      case 'critical': return '미흡';
      default: return '-';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      case 'planned': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProjectStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'delayed': return '지연';
      case 'planned': return '계획';
      default: return '-';
    }
  };

  if (loading) {
    return <LoadingState message="ESG 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const latestScore = scores.length > 0 ? scores.sort((a, b) => b.fiscal_month - a.fiscal_month)[0] : null;
  const latestCarbon = carbon.length > 0 ? carbon.sort((a, b) => b.fiscal_month - a.fiscal_month)[0] : null;
  const firstCarbon = carbon.length > 0 ? carbon.sort((a, b) => a.fiscal_month - b.fiscal_month)[0] : null;

  const totalInvestment = projects.reduce((sum, p) => sum + parseFloat(p.investment || '0'), 0);
  const totalSaving = projects.reduce((sum, p) => sum + parseFloat(p.saving || '0'), 0);
  const avgROI = totalInvestment > 0 ? (totalSaving / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CheckIcon size={32} />
          <h1 className="text-3xl font-bold">ESG 전략</h1>
        </div>
        <p className="text-green-100">환경·사회·지배구조를 통합 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="ESG 종합 점수"
          value={latestScore ? parseFloat(latestScore.total_score).toFixed(1) : '-'}
          subtitle="목표: 80점"
          unit="점"
          changeRate={0}
          trend="up"
          color="green"
          icon={CheckIcon}
        />
        <KPICard
          title="탄소 배출량"
          value={latestCarbon ? parseFloat(latestCarbon.actual_emission).toFixed(0) : '-'}
          subtitle={`목표: ${latestCarbon ? parseFloat(latestCarbon.target_emission).toFixed(0) : '-'}톤`}
          unit="톤"
          changeRate={latestCarbon ? -parseFloat(latestCarbon.reduction_rate) : 0}
          trend="up"
          color="blue"
          icon={TrendDownIcon}
        />
        <KPICard
          title="총 투자액"
          value={`${totalInvestment.toFixed(1)}억`}
          subtitle={`절감액: ${totalSaving.toFixed(1)}억`}
          changeRate={0}
          trend="up"
          color="purple"
          icon={ActivityIcon}
        />
        <KPICard
          title="평균 ROI"
          value={`${avgROI.toFixed(1)}%`}
          subtitle="환경 프로젝트"
          changeRate={0}
          trend="up"
          color="yellow"
          icon={ZapIcon}
        />
      </div>

      {/* 카테고리 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'esg', 'carbon', 'energy'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' && '전체'}
              {cat === 'esg' && 'ESG'}
              {cat === 'carbon' && '탄소관리'}
              {cat === 'energy' && '에너지'}
            </button>
          ))}
        </div>
      </div>

      {/* ESG 점수 & 탄소 배출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESG 종합 점수 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CheckIcon className="text-green-600" size={24} />
              ESG 종합 점수
            </h3>
            <p className="text-sm text-gray-500 mt-1">환경·사회·지배구조 평가</p>
          </div>

          <ChartComponent
            type="bar"
            data={getESGScoreData()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: false, min: 60, max: 100 } }
            }}
            height={280}
          />

          {latestScore && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">환경(E)</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(latestScore.environment_score).toFixed(0)}점</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">사회(S)</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(latestScore.social_score).toFixed(0)}점</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">지배구조(G)</p>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(latestScore.governance_score).toFixed(0)}점</p>
              </div>
            </div>
          )}
        </div>

        {/* 탄소 배출량 추이 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendDownIcon className="text-blue-600" size={24} />
              월별 탄소 배출량
            </h3>
            <p className="text-sm text-gray-500 mt-1">CO2 배출 추이 (단위: 톤)</p>
          </div>

          <ChartComponent
            type="line"
            data={getCarbonEmissionData()}
            options={{
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: false } }
            }}
            height={280}
          />

          {latestCarbon && firstCarbon && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">최신 배출량</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(latestCarbon.actual_emission).toFixed(0)}톤</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">연간 감축</p>
                <p className="text-2xl font-bold text-green-600">
                  {(parseFloat(firstCarbon.actual_emission) - parseFloat(latestCarbon.actual_emission)).toFixed(0)}톤
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에너지 소비 분석 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ZapIcon className="text-yellow-600" size={24} />
            에너지 소비 분석
          </h3>
          <p className="text-sm text-gray-500 mt-1">에너지원별 소비량 (단위: MWh)</p>
        </div>

        <ChartComponent
          type="bar"
          data={getEnergyData()}
          options={{
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-5 gap-3">
          {energy.map((e, idx) => {
            const sourceLabels: Record<string, string> = {
              'electricity': '전기', 'gas': '가스', 'oil': '유류', 'steam': '증기', 'solar': '태양광'
            };
            const colors = ['bg-blue-50 text-blue-600', 'bg-yellow-50 text-yellow-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-green-50 text-green-600'];
            return (
              <div key={idx} className={`rounded-lg p-2 text-center ${colors[idx]?.split(' ')[0] || 'bg-gray-50'}`}>
                <p className="text-xs text-gray-600 mb-1">{sourceLabels[e.energy_source] || e.energy_source}</p>
                <p className={`text-lg font-bold ${colors[idx]?.split(' ')[1] || 'text-gray-600'}`}>
                  {parseFloat(e.consumption).toFixed(0)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 환경 개선 활동 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-green-600" size={24} />
            환경 개선 활동
          </h3>
          <p className="text-sm text-gray-500 mt-1">진행 중인 환경 프로젝트</p>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-gray-800">{project.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getProjectStatusColor(project.status)}`}>
                      {getProjectStatusLabel(project.status)}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {project.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{project.project_id} · {project.impact}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">투자액</p>
                  <p className="text-lg font-bold text-blue-600">{parseFloat(project.investment).toFixed(1)}억</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">절감액</p>
                  <p className="text-lg font-bold text-green-600">{parseFloat(project.saving).toFixed(1)}억</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">ROI</p>
                  <p className="text-lg font-bold text-purple-600">
                    {parseFloat(project.investment) > 0
                      ? ((parseFloat(project.saving) / parseFloat(project.investment)) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 mb-1">진척도</p>
                  <p className="text-lg font-bold text-yellow-600">{parseFloat(project.progress).toFixed(0)}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${parseFloat(project.progress) >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(parseFloat(project.progress), 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">총 투자</p>
            <p className="text-2xl font-bold text-blue-600">{totalInvestment.toFixed(1)}억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">예상 절감</p>
            <p className="text-2xl font-bold text-green-600">{totalSaving.toFixed(1)}억</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">평균 ROI</p>
            <p className="text-2xl font-bold text-purple-600">{avgROI.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 사회적 책임 활동 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <UserIcon size={20} />
            사회적 책임 활동
          </h3>
          <p className="text-blue-100 text-xs mt-1">2024년 활동 실적</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">활동</th>
                <th className="py-3 px-4 text-center">참여 인원</th>
                <th className="py-3 px-4 text-center">활동 시간</th>
                <th className="py-3 px-4 text-right">예산</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {social.map((activity) => (
                <tr key={activity.id} className="hover:bg-blue-50">
                  <td className="py-3 px-4 font-medium">{activity.activity_name}</td>
                  <td className="py-3 px-4 text-center">{(activity.participants ?? 0).toLocaleString()}명</td>
                  <td className="py-3 px-4 text-center">
                    {activity.hours > 0 ? `${(activity.hours ?? 0).toLocaleString()}시간` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">{parseFloat(activity.budget).toFixed(0)}백만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 지배구조 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-purple-600" size={24} />
            지배구조 평가
          </h3>
          <p className="text-sm text-gray-500 mt-1">거버넌스 주요 지표</p>
        </div>

        <div className="space-y-3">
          {governance.map((metric) => (
            <div key={metric.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800">{metric.metric_name}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(metric.status)}`}>
                  {getStatusLabel(metric.status)}
                </span>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm text-gray-600">벤치마크: {parseFloat(metric.benchmark).toFixed(0)}%</p>
                  <p className="text-2xl font-bold text-purple-600">{parseFloat(metric.actual_value).toFixed(0)}%</p>
                </div>
                <p className={`text-lg font-bold ${
                  parseFloat(metric.actual_value) >= parseFloat(metric.benchmark) ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {parseFloat(metric.actual_value) >= parseFloat(metric.benchmark)
                    ? `+${(parseFloat(metric.actual_value) - parseFloat(metric.benchmark)).toFixed(0)}%p`
                    : `${(parseFloat(metric.actual_value) - parseFloat(metric.benchmark)).toFixed(0)}%p`}
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(parseFloat(metric.actual_value), 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ESG 인사이트 */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">ESG 인사이트</h3>
        <div className="space-y-3">
          {latestScore && parseFloat(latestScore.total_score) >= 80 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">ESG 목표 달성</p>
                  <p className="text-sm text-gray-600">
                    ESG 종합 점수 {parseFloat(latestScore.total_score).toFixed(1)}점으로 목표(80점)를 달성했습니다.
                    지배구조({parseFloat(latestScore.governance_score).toFixed(0)}점)와
                    환경({parseFloat(latestScore.environment_score).toFixed(0)}점) 부문이 우수합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {latestCarbon && firstCarbon && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📉</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">탄소 배출량 감축 성공</p>
                  <p className="text-sm text-gray-600">
                    탄소 배출량이 {parseFloat(firstCarbon.actual_emission).toFixed(0)}톤에서
                    {parseFloat(latestCarbon.actual_emission).toFixed(0)}톤으로
                    {parseFloat(latestCarbon.reduction_rate).toFixed(1)}% 감소했습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {projects.filter(p => p.status === 'in-progress').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">
                    환경 프로젝트 {projects.filter(p => p.status === 'in-progress').length}건 진행 중
                  </p>
                  <p className="text-sm text-gray-600">
                    현재 {projects.filter(p => p.status === 'in-progress').map(p => p.title).join(', ')} 프로젝트가 진행 중입니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESG;
