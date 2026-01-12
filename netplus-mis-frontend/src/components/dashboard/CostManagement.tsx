import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  PackageIcon,
  TrendUpIcon,
  TrendDownIcon,
  DollarIcon,
  TargetIcon,
  ActivityIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface MonthlyCost {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  total_cost: string;
  unit_cost: string;
  material_cost: string;
  labor_cost: string;
  overhead_cost: string;
  selling_admin_cost: string;
}

interface ProductCost {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  product_code: string;
  product_name: string;
  production_volume: number;
  material_cost: string;
  labor_cost: string;
  overhead_cost: string;
  total_cost: string;
  selling_price: string;
  margin: string;
  margin_rate: string;
}

interface CostReductionProject {
  id: number;
  project_id: string;
  title: string;
  category: string;
  target_saving: string;
  actual_saving: string;
  progress: string;
  status: string;
  responsible_person: string;
  due_date: string;
}

interface CostDriver {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  driver_name: string;
  impact_rate: string;
  change_rate: string;
  trend: string;
}

interface BreakEvenAnalysis {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  fixed_cost: string;
  variable_cost_ratio: string;
  break_even_point: string;
  actual_sales: string;
  margin_of_safety: string;
}

interface CostStructure {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  cost_type: string;
  amount: string;
  ratio: string;
}

const CostManagement: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [projects, setProjects] = useState<CostReductionProject[]>([]);
  const [drivers, setDrivers] = useState<CostDriver[]>([]);
  const [breakEven, setBreakEven] = useState<BreakEvenAnalysis[]>([]);
  const [structure, setStructure] = useState<CostStructure[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [monthlyRes, productRes, projectRes, driverRes, breakEvenRes, structureRes] = await Promise.all([
          api.cost.getMonthly('fiscal_year=2024'),
          api.cost.getProducts('fiscal_year=2024&fiscal_month=12'),
          api.cost.getProjects(),
          api.cost.getDrivers('fiscal_year=2024&fiscal_month=12'),
          api.cost.getBreakEven('fiscal_year=2024'),
          api.cost.getStructure('fiscal_year=2024&fiscal_month=12'),
        ]);

        setMonthlyCosts(Array.isArray(monthlyRes) ? monthlyRes : monthlyRes.results || []);
        setProductCosts(Array.isArray(productRes) ? productRes : productRes.results || []);
        setProjects(Array.isArray(projectRes) ? projectRes : projectRes.results || []);
        setDrivers(Array.isArray(driverRes) ? driverRes : driverRes.results || []);
        setBreakEven(Array.isArray(breakEvenRes) ? breakEvenRes : breakEvenRes.results || []);
        setStructure(Array.isArray(structureRes) ? structureRes : structureRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 원가 구조 차트 데이터
  const getCostStructureData = () => {
    if (structure.length === 0) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    }

    const typeLabels: Record<string, string> = {
      'direct_material': '직접재료비',
      'direct_labor': '직접노무비',
      'manufacturing_overhead': '제조경비',
      'selling_admin': '판매관리비',
      'profit': '이익'
    };

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return {
      labels: structure.map(s => typeLabels[s.cost_type] || s.cost_type),
      datasets: [{
        data: structure.map(s => parseFloat(s.ratio || '0')),
        backgroundColor: colors.slice(0, structure.length)
      }]
    };
  };

  // 월별 원가 추이 차트
  const getMonthlyCostData = () => {
    if (monthlyCosts.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sorted = [...monthlyCosts].sort((a, b) => a.fiscal_month - b.fiscal_month);

    return {
      labels: sorted.map(m => `${m.fiscal_month}월`),
      datasets: [
        {
          label: '총원가 (억원)',
          data: sorted.map(m => parseFloat(m.total_cost || '0')),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '단위당 원가 (원)',
          data: sorted.map(m => parseFloat(m.unit_cost || '0')),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // 제품별 원가 비교 차트
  const getProductCostData = () => {
    if (productCosts.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: productCosts.map(p => p.product_name),
      datasets: [
        {
          label: '재료비',
          data: productCosts.map(p => parseFloat(p.material_cost || '0')),
          backgroundColor: '#3b82f6',
          stack: 'stack1'
        },
        {
          label: '노무비',
          data: productCosts.map(p => parseFloat(p.labor_cost || '0')),
          backgroundColor: '#8b5cf6',
          stack: 'stack1'
        },
        {
          label: '경비',
          data: productCosts.map(p => parseFloat(p.overhead_cost || '0')),
          backgroundColor: '#ec4899',
          stack: 'stack1'
        }
      ]
    };
  };

  // 손익분기점 차트 데이터
  const getBreakEvenChartData = () => {
    const latestBE = breakEven.length > 0
      ? breakEven.sort((a, b) => b.fiscal_month - a.fiscal_month)[0]
      : null;

    if (!latestBE) {
      return { labels: [], datasets: [] };
    }

    const bep = parseFloat(latestBE.break_even_point || '0');
    const fixed = parseFloat(latestBE.fixed_cost || '0');
    const varRatio = parseFloat(latestBE.variable_cost_ratio || '0') / 100;

    const maxSales = bep * 1.8;
    const steps = 7;
    const labels = [];
    const costData = [];
    const revenueData = [];

    for (let i = 0; i < steps; i++) {
      const sales = (maxSales / (steps - 1)) * i;
      labels.push(sales.toFixed(0));
      costData.push(fixed + sales * varRatio);
      revenueData.push(sales);
    }

    return {
      labels,
      datasets: [
        {
          label: '총비용',
          data: costData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0
        },
        {
          label: '매출',
          data: revenueData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0
        }
      ]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      case 'planned': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'delayed': return '지연';
      case 'planned': return '계획';
      default: return '-';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'material': return '재료비';
      case 'labor': return '노무비';
      case 'overhead': return '경비';
      default: return category;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendUpIcon size={12} className="text-red-600" />;
      case 'down': return <TrendDownIcon size={12} className="text-green-600" />;
      case 'stable': return <span className="text-blue-600">→</span>;
      default: return null;
    }
  };

  if (loading) {
    return <LoadingState message="원가 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const latestCost = monthlyCosts.length > 0
    ? monthlyCosts.sort((a, b) => b.fiscal_month - a.fiscal_month)[0]
    : null;

  const prevCost = monthlyCosts.length > 1
    ? monthlyCosts.sort((a, b) => b.fiscal_month - a.fiscal_month)[1]
    : null;

  const latestBE = breakEven.length > 0
    ? breakEven.sort((a, b) => b.fiscal_month - a.fiscal_month)[0]
    : null;

  const totalTargetSaving = projects.reduce((sum, p) => sum + parseFloat(p.target_saving || '0'), 0);
  const totalActualSaving = projects.reduce((sum, p) => sum + parseFloat(p.actual_saving || '0'), 0);
  const savingRate = totalTargetSaving > 0 ? (totalActualSaving / totalTargetSaving) * 100 : 0;

  const avgMarginRate = productCosts.length > 0
    ? productCosts.reduce((sum, p) => sum + parseFloat(p.margin_rate || '0'), 0) / productCosts.length
    : 0;

  const costChange = latestCost && prevCost
    ? ((parseFloat(latestCost.total_cost) - parseFloat(prevCost.total_cost)) / parseFloat(prevCost.total_cost)) * 100
    : 0;

  const unitCostChange = latestCost && prevCost
    ? ((parseFloat(latestCost.unit_cost) - parseFloat(prevCost.unit_cost)) / parseFloat(prevCost.unit_cost)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <DollarIcon size={32} />
          <h1 className="text-3xl font-bold">원가 관리</h1>
        </div>
        <p className="text-amber-100">원가 구조를 분석하고 절감 활동을 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 원가"
          value={latestCost ? `${parseFloat(latestCost.total_cost).toFixed(0)}억` : '-'}
          subtitle={prevCost ? `전월: ${parseFloat(prevCost.total_cost).toFixed(0)}억` : ''}
          changeRate={costChange}
          trend={costChange <= 0 ? "up" : "down"}
          color="blue"
          icon={DollarIcon}
        />
        <KPICard
          title="단위당 원가"
          value={latestCost ? `${parseFloat(latestCost.unit_cost).toLocaleString()}원` : '-'}
          subtitle={prevCost ? `전월: ${parseFloat(prevCost.unit_cost).toLocaleString()}원` : ''}
          changeRate={unitCostChange}
          trend={unitCostChange <= 0 ? "up" : "down"}
          color="green"
          icon={PackageIcon}
        />
        <KPICard
          title="원가 절감"
          value={`${totalActualSaving.toFixed(1)}억`}
          subtitle={`목표: ${totalTargetSaving.toFixed(1)}억`}
          changeRate={savingRate}
          trend="up"
          color="purple"
          icon={TargetIcon}
        />
        <KPICard
          title="평균 이익률"
          value={`${avgMarginRate.toFixed(1)}%`}
          subtitle="제품 평균"
          changeRate={0}
          trend="up"
          color="yellow"
          icon={ActivityIcon}
        />
      </div>

      {/* 제품 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedProduct('all')}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedProduct === 'all'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {productCosts.slice(0, 5).map((product) => (
            <button
              key={product.product_code}
              onClick={() => setSelectedProduct(product.product_code)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedProduct === product.product_code
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {product.product_name}
            </button>
          ))}
        </div>
      </div>

      {/* 원가 구조 & 월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 원가 구조 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <PackageIcon className="text-blue-600" size={24} />
              원가 구조 분석
            </h3>
            <p className="text-sm text-gray-500 mt-1">12월 기준 원가 구성</p>
          </div>

          <ChartComponent
            type="doughnut"
            data={getCostStructureData()}
            options={{ plugins: { legend: { position: 'bottom' } } }}
            height={280}
          />

          <div className="mt-4 space-y-2">
            {structure.slice(0, 3).map((s, idx) => {
              const typeLabels: Record<string, string> = {
                'direct_material': '직접재료비',
                'direct_labor': '직접노무비',
                'manufacturing_overhead': '제조경비',
                'selling_admin': '판매관리비',
                'profit': '이익'
              };
              const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600'];
              return (
                <div key={idx} className={`flex justify-between items-center p-2 rounded ${colors[idx] || 'bg-gray-50'}`}>
                  <span className="text-sm font-medium">{typeLabels[s.cost_type] || s.cost_type}</span>
                  <span className="text-lg font-bold">
                    {parseFloat(s.ratio).toFixed(0)}% ({parseFloat(s.amount).toFixed(1)}억)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 월별 원가 추이 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendDownIcon className="text-green-600" size={24} />
              월별 원가 추이
            </h3>
            <p className="text-sm text-gray-500 mt-1">총원가 & 단위당 원가</p>
          </div>

          <ChartComponent
            type="line"
            data={getMonthlyCostData()}
            options={{
              plugins: { legend: { position: 'top' } },
              scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '총원가 (억원)' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: '단위당 (원)' }, grid: { drawOnChartArea: false } }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 제품별 원가 비교 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ActivityIcon className="text-purple-600" size={24} />
            제품별 원가 비교
          </h3>
          <p className="text-sm text-gray-500 mt-1">재료비 · 노무비 · 경비 구성</p>
        </div>

        <ChartComponent
          type="bar"
          data={getProductCostData()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
          }}
          height={280}
        />
      </div>

      {/* 제품별 상세 원가 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-amber-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <PackageIcon size={20} />
            제품별 상세 원가
          </h3>
          <p className="text-amber-100 text-xs mt-1">12월 기준 (단위: 원)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">제품</th>
                <th className="py-3 px-4 text-center">생산량</th>
                <th className="py-3 px-4 text-right">재료비</th>
                <th className="py-3 px-4 text-right">노무비</th>
                <th className="py-3 px-4 text-right">경비</th>
                <th className="py-3 px-4 text-right">총원가</th>
                <th className="py-3 px-4 text-right">판매가</th>
                <th className="py-3 px-4 text-right">이익</th>
                <th className="py-3 px-4 text-center">이익률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productCosts.map((product) => (
                <tr key={product.id} className="hover:bg-amber-50">
                  <td className="py-3 px-4 font-medium">{product.product_name}</td>
                  <td className="py-3 px-4 text-center">{(product.production_volume ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(product.material_cost).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(product.labor_cost).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(product.overhead_cost).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">{parseFloat(product.total_cost).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{parseFloat(product.selling_price).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">{parseFloat(product.margin).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(product.margin_rate) >= 22 ? 'text-green-600' :
                      parseFloat(product.margin_rate) >= 20 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(product.margin_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 원가 절감 활동 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-green-600" size={24} />
            원가 절감 활동
          </h3>
          <p className="text-sm text-gray-500 mt-1">진행 중인 절감 프로젝트</p>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-gray-800">{project.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {project.project_id} · 담당: {project.responsible_person} · 마감: {project.due_date}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">절감 실적</span>
                  <span className="font-bold">
                    {parseFloat(project.actual_saving).toFixed(1)}억 / {parseFloat(project.target_saving).toFixed(1)}억
                    <span className={`ml-2 ${
                      parseFloat(project.actual_saving) >= parseFloat(project.target_saving) ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      ({parseFloat(project.progress).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      parseFloat(project.progress) >= 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(project.progress), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">목표 절감액</p>
            <p className="text-2xl font-bold text-blue-600">{totalTargetSaving.toFixed(1)}억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">실제 절감액</p>
            <p className="text-2xl font-bold text-green-600">{totalActualSaving.toFixed(1)}억</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">달성률</p>
            <p className="text-2xl font-bold text-purple-600">{savingRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 원가 동인 분석 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ActivityIcon className="text-orange-600" size={24} />
            원가 동인 분석
          </h3>
          <p className="text-sm text-gray-500 mt-1">주요 원가 영향 요인</p>
        </div>

        <div className="space-y-3">
          {drivers.map((driver) => (
            <div key={driver.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-2">{driver.driver_name}</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${parseFloat(driver.impact_rate)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">영향도: {parseFloat(driver.impact_rate).toFixed(1)}%</p>
                </div>
                <div className="ml-6 text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    {getTrendIcon(driver.trend)}
                    <span className={`text-lg font-bold ${
                      parseFloat(driver.change_rate) > 0 ? 'text-red-600' :
                      parseFloat(driver.change_rate) < 0 ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {parseFloat(driver.change_rate) > 0 ? '+' : ''}{parseFloat(driver.change_rate).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {driver.trend === 'up' && '증가 추세'}
                    {driver.trend === 'down' && '감소 추세'}
                    {driver.trend === 'stable' && '안정'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 손익분기점 분석 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-red-600" size={24} />
            손익분기점 분석
          </h3>
          <p className="text-sm text-gray-500 mt-1">생산량 기준 (단위: 억원)</p>
        </div>

        <ChartComponent
          type="line"
          data={getBreakEvenChartData()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }}
          height={280}
        />

        {latestBE && (
          <>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">손익분기점</p>
                <p className="text-2xl font-bold text-red-600">{parseFloat(latestBE.break_even_point).toFixed(0)}억</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">고정비</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(latestBE.fixed_cost).toFixed(0)}억</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">변동비율</p>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(latestBE.variable_cost_ratio).toFixed(0)}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">안전마진율</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(latestBE.margin_of_safety).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">분석 결과</p>
              <p className="text-sm text-gray-600">
                현재 매출 {parseFloat(latestBE.actual_sales).toFixed(0)}억원 기준으로
                손익분기점({parseFloat(latestBE.break_even_point).toFixed(0)}억) 대비
                {((parseFloat(latestBE.actual_sales) / parseFloat(latestBE.break_even_point) - 1) * 100).toFixed(0)}% 초과 달성하고 있으며,
                안전마진율 {parseFloat(latestBE.margin_of_safety).toFixed(1)}%로 양호한 수준입니다.
              </p>
            </div>
          </>
        )}
      </div>

      {/* 원가 인사이트 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">원가 인사이트</h3>
        <div className="space-y-3">
          {unitCostChange < 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📉</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">단위당 원가 개선</p>
                  <p className="text-sm text-gray-600">
                    단위당 원가가 전월 대비 {Math.abs(unitCostChange).toFixed(1)}% 감소하였습니다.
                    원가 절감 프로젝트 효과가 나타나고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {productCosts.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">
                    최고 수익성 제품: {productCosts.sort((a, b) => parseFloat(b.margin_rate) - parseFloat(a.margin_rate))[0]?.product_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    이익률 {parseFloat(productCosts.sort((a, b) => parseFloat(b.margin_rate) - parseFloat(a.margin_rate))[0]?.margin_rate || '0').toFixed(1)}%로
                    가장 높은 수익성을 보이고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {drivers.filter(d => d.trend === 'up' && parseFloat(d.change_rate) > 5).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">원가 상승 주의 요인</p>
                  <p className="text-sm text-gray-600">
                    {drivers.filter(d => d.trend === 'up' && parseFloat(d.change_rate) > 5).map(d => d.driver_name).join(', ')}
                    의 상승률이 5%를 초과하여 원가 압박 요인이 되고 있습니다.
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

export default CostManagement;
