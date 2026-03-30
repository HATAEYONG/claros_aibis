import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  CheckIcon,
  TrendUpIcon,
  ZapIcon,
  ActivityIcon,
  TargetIcon,
  AlertIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface FourM2EMetric {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  category: string;
  metric_name: string;
  target_value: string;
  actual_value: string;
  unit: string;
  status: string;
}

interface EnergyConsumption {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  energy_source: string;
  consumption: string;
  cost: string;
}

const FourM2EStrategy: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fourM2E, setFourM2E] = useState<FourM2EMetric[]>([]);
  const [energy, setEnergy] = useState<EnergyConsumption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fourM2ERes, energyRes] = await Promise.all([
          api.esg.get4M2E('fiscal_year=2024&fiscal_month=12'),
          api.esg.getEnergy('fiscal_year=2024&fiscal_month=12'),
        ]);

        setFourM2E(Array.isArray(fourM2ERes) ? fourM2ERes : fourM2ERes.results || []);
        setEnergy(Array.isArray(energyRes) ? energyRes : energyRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 4M2E 카테고리별 그룹화
  const getFourM2EGrouped = () => {
    const categoryLabels: Record<string, string> = {
      'man': 'Man (인력)',
      'machine': 'Machine (설비)',
      'material': 'Material (자재)',
      'method': 'Method (방법)',
      'environment': 'Environment (환경)',
      'energy': 'Energy (에너지)'
    };

    const categoryColors: Record<string, string> = {
      'man': '#3b82f6',
      'machine': '#8b5cf6',
      'material': '#10b981',
      'method': '#f59e0b',
      'environment': '#14b8a6',
      'energy': '#ef4444'
    };

    const categoryDescriptions: Record<string, string> = {
      'man': '작업자 숙련도, 교육, 건강 관리',
      'machine': '설비 가동률, 보전, 자동화',
      'material': '자재 품질, 재고, 원가',
      'method': '표준 작업, 프로세스 최적화',
      'environment': '작업 환경, 온도, 습도, 조명',
      'energy': '전력, 가스, 증기, 신재생 에너지'
    };

    const grouped: Record<string, FourM2EMetric[]> = {};
    fourM2E.forEach(m => {
      const cat = m.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });

    return Object.entries(grouped).map(([key, metrics]) => ({
      category: categoryLabels[key] || key,
      categoryKey: key,
      description: categoryDescriptions[key] || '',
      color: categoryColors[key] || '#6b7280',
      metrics
    }));
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

  // 카테고리별 달성률 계산
  const getCategoryAchievement = (metrics: FourM2EMetric[]) => {
    if (metrics.length === 0) return 0;
    const achieved = metrics.filter(m => parseFloat(m.actual_value) >= parseFloat(m.target_value)).length;
    return (achieved / metrics.length) * 100;
  };

  if (loading) {
    return <LoadingState message="4M2E 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const fourM2EGrouped = getFourM2EGrouped();

  // KPI 계산
  const totalMetrics = fourM2E.length;
  const achievedMetrics = fourM2E.filter(m => parseFloat(m.actual_value) >= parseFloat(m.target_value)).length;
  const overallAchievement = totalMetrics > 0 ? (achievedMetrics / totalMetrics * 100) : 0;

  const excellentCount = fourM2E.filter(m => m.status === 'excellent').length;
  const criticalCount = fourM2E.filter(m => m.status === 'critical').length;

  const totalEnergy = energy.reduce((sum, e) => sum + parseFloat(e.consumption || '0'), 0);
  const totalEnergyCost = energy.reduce((sum, e) => sum + parseFloat(e.cost || '0'), 0);

  // 필터링된 데이터
  const filteredData = selectedCategory === 'all'
    ? fourM2EGrouped
    : fourM2EGrouped.filter(g => g.categoryKey === selectedCategory);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">4M2E 전략</h1>
        </div>
        <p className="text-indigo-100">생산 6대 요소(Man, Machine, Material, Method, Environment, Energy)를 통합 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="전체 지표"
          value={`${totalMetrics}개`}
          subtitle={`달성: ${achievedMetrics}개`}
          changeRate={0}
          trend="up"
          color="indigo"
          icon={ActivityIcon}
        />
        <KPICard
          title="종합 달성률"
          value={`${overallAchievement.toFixed(1)}%`}
          subtitle="목표 대비"
          changeRate={0}
          trend={overallAchievement >= 80 ? 'up' : overallAchievement >= 60 ? 'neutral' : 'down'}
          color={overallAchievement >= 80 ? 'green' : overallAchievement >= 60 ? 'yellow' : 'red'}
          icon={TargetIcon}
        />
        <KPICard
          title="우수 지표"
          value={`${excellentCount}개`}
          subtitle="전체 중"
          changeRate={0}
          trend="up"
          color="green"
          icon={CheckIcon}
        />
        <KPICard
          title="개선 필요"
          value={`${criticalCount}개`}
          subtitle="미흡 상태"
          changeRate={0}
          trend={criticalCount > 0 ? 'down' : 'neutral'}
          color={criticalCount > 0 ? 'red' : 'gray'}
          icon={AlertIcon}
        />
      </div>

      {/* 카테고리 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {['man', 'machine', 'material', 'method', 'environment', 'energy'].map((cat) => {
            const group = fourM2EGrouped.find(g => g.categoryKey === cat);
            const label = group?.category.split(' ')[0] || cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 카테고리별 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fourM2EGrouped.map((group, idx) => {
          const achievement = getCategoryAchievement(group.metrics);
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCategory(group.categoryKey)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: group.color }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{group.category}</h4>
                  <p className="text-xs text-gray-500">{group.description}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">지표 {group.metrics.length}개</span>
                <span className={`text-sm font-bold ${
                  achievement >= 80 ? 'text-green-600' : achievement >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {achievement.toFixed(0)}% 달성
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${achievement}%`,
                    backgroundColor: group.color
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4M2E 상세 관리 */}
      <div className="space-y-4">
        {filteredData.map((group, idx) => {
          const globalIdx = fourM2EGrouped.findIndex(g => g.categoryKey === group.categoryKey);
          return (
            <div key={idx} className="bg-white rounded-xl shadow p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: group.color }}
                  >
                    {globalIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{group.category}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.metrics.map((metric, mIdx) => (
                  <div key={mIdx} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm font-medium text-gray-700 flex-1">{metric.metric_name}</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(metric.status)}`}>
                        {getStatusLabel(metric.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs text-gray-500">목표: {parseFloat(metric.target_value).toFixed(1)}{metric.unit}</p>
                        <p className="text-2xl font-bold" style={{ color: group.color }}>
                          {parseFloat(metric.actual_value).toFixed(1)}{metric.unit}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        parseFloat(metric.actual_value) >= parseFloat(metric.target_value)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {parseFloat(metric.actual_value) >= parseFloat(metric.target_value) ? '달성' : '미달'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((parseFloat(metric.actual_value) / parseFloat(metric.target_value)) * 100, 100)}%`,
                          backgroundColor: group.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 에너지 소비 분석 (Energy 카테고리 관련) */}
      {energy.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ZapIcon className="text-yellow-600" size={24} />
              에너지 소비 분석
            </h3>
            <p className="text-sm text-gray-500 mt-1">에너지원별 소비량 (단위: MWh)</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {energy.map((e, idx) => {
              const sourceLabels: Record<string, string> = {
                'electricity': '전기', 'gas': '가스', 'oil': '유류', 'steam': '증기', 'solar': '태양광'
              };
              const colors = [
                { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-600' },
                { bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-600' },
                { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-600' },
                { bg: 'bg-pink-50', text: 'text-pink-600', bar: 'bg-pink-600' },
                { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-600' }
              ];
              const color = colors[idx] || colors[0];
              const percentage = totalEnergy > 0 ? (parseFloat(e.consumption) / totalEnergy * 100) : 0;
              return (
                <div key={idx} className={`rounded-lg p-3 text-center ${color.bg}`}>
                  <p className="text-xs text-gray-600 mb-1">{sourceLabels[e.energy_source] || e.energy_source}</p>
                  <p className={`text-xl font-bold ${color.text}`}>
                    {parseFloat(e.consumption).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">MWh</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${color.bar}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">총 에너지 소비</p>
              <p className="text-2xl font-bold text-yellow-600">{totalEnergy.toFixed(0)} MWh</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">총 에너지 비용</p>
              <p className="text-2xl font-bold text-orange-600">{totalEnergyCost.toFixed(0)}만원</p>
            </div>
          </div>
        </div>
      )}

      {/* 4M2E 인사이트 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">4M2E 관리 인사이트</h3>
        <div className="space-y-3">
          {overallAchievement >= 80 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">4M2E 종합 목표 달성</p>
                  <p className="text-sm text-gray-600">
                    전체 지표 달성률이 {overallAchievement.toFixed(1)}%로 우수한 수준입니다.
                    현재 프로세스가 안정적으로 운영되고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {criticalCount > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">개선이 필요한 지표</p>
                  <p className="text-sm text-gray-600">
                    {criticalCount}개 지표가 미흡 상태입니다.
                    해당 카테고리의 원인을 분석하고 즉시 개선 대책을 수립하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {fourM2EGrouped.some(g => getCategoryAchievement(g.metrics) < 60) && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">저성과 카테고리 발견</p>
                  <p className="text-sm text-gray-600">
                    {fourM2EGrouped
                      .filter(g => getCategoryAchievement(g.metrics) < 60)
                      .map(g => g.category.split(' ')[0])
                      .join(', ')} 카테고리의 달성률이 60% 미만입니다.
                    </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">4M2E 최적화 제안</p>
                <p className="text-sm text-gray-600">
                  6대 요소의 균형 있는 관리가 중요합니다. 한 요소의 성과가 다른 요소에 미치는
                  영향을 분석하고 통합적인 개선 활동을 추진하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourM2EStrategy;
