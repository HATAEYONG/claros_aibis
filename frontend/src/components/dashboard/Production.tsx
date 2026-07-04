import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  FactoryIcon,
  TrendUpIcon,
  CheckIcon,
  ActivityIcon,
  CalendarIcon,
  TargetIcon,
  DollarIcon,
  BarChartIcon,
  PackageIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface ProductionPlan {
  id: number;
  plan_number: string;
  plan_date: string;
  product_code: string;
  product_name: string;
  planned_quantity: number;
  planned_completion_date: string;
  priority: string;
  status: string;
}

interface WorkOrder {
  id: number;
  order_number: string;
  product_code: string;
  product_name: string;
  planned_quantity: number;
  actual_quantity: number;
  planned_start: string;
  planned_end: string;
  status: string;
  priority: string;
}

interface DemandForecast {
  id: number;
  product_code: string;
  product_name: string;
  month: string;
  forecast_quantity: number;
  actual_sales: number;
  variance_rate: string;
}

interface CapacityPlan {
  id: number;
  production_line: string;
  line_name: string;
  daily_capacity: number;
  planned_utilization: number;
  available_capacity: number;
  month: string;
}

interface MaterialRequirement {
  id: number;
  product_code: string;
  product_name: string;
  material_code: string;
  material_name: string;
  required_quantity: number;
  unit: string;
  required_date: string;
  status: string;
}

const Production: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [capacityPlans, setCapacityPlans] = useState<CapacityPlan[]>([]);
  const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirement[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [plansRes, ordersRes, demandRes, capacityRes, materialRes] = await Promise.all([
          api.production.getWorkOrders('status=planned'),
          api.production.getWorkOrders('status=in_progress&limit=20'),
          // Mock data for planning-specific endpoints
          Promise.resolve({ results: [] }),
          Promise.resolve({ results: [] }),
          Promise.resolve({ results: [] }),
        ]);

        // Transform work orders to production plans
        const plans = Array.isArray(plansRes) ? plansRes : plansRes.results || [];
        const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes.results || [];

        setProductionPlans(plans.map((p: any) => ({
          id: p.id || 0,
          plan_number: p.order_number || '',
          plan_date: p.planned_start || '',
          product_code: p.product_code || '',
          product_name: p.product_name || '',
          planned_quantity: p.target_quantity || 0,
          planned_completion_date: p.planned_end || '',
          priority: p.priority || 'medium',
          status: p.status || ''
        })));

        setWorkOrders(orders.map((o: any) => ({
          id: o.id,
          order_number: o.order_number || '',
          product_code: o.product_code || '',
          product_name: o.product_name || '',
          planned_quantity: o.target_quantity || 0,
          actual_quantity: o.actual_quantity || 0,
          planned_start: o.planned_start || '',
          planned_end: o.planned_end || '',
          status: o.status || '',
          priority: o.priority || 'medium'
        })));

        // Mock demand forecast data
        setDemandForecasts([
          { id: 1, product_code: 'P001', product_name: '제품A', month: '2024-01', forecast_quantity: 5000, actual_sales: 4800, variance_rate: '-4.0' },
          { id: 2, product_code: 'P001', product_name: '제품A', month: '2024-02', forecast_quantity: 5200, actual_sales: 5100, variance_rate: '-1.9' },
          { id: 3, product_code: 'P002', product_name: '제품B', month: '2024-01', forecast_quantity: 3000, actual_sales: 3200, variance_rate: '+6.7' },
          { id: 4, product_code: 'P002', product_name: '제품B', month: '2024-02', forecast_quantity: 3100, actual_sales: 3050, variance_rate: '-1.6' },
          { id: 5, product_code: 'P003', product_name: '제품C', month: '2024-01', forecast_quantity: 2000, actual_sales: 1950, variance_rate: '-2.5' },
          { id: 6, product_code: 'P003', product_name: '제품C', month: '2024-02', forecast_quantity: 2100, actual_sales: 2150, variance_rate: '+2.4' },
        ]);

        // Mock capacity plan data
        setCapacityPlans([
          { id: 1, production_line: 'LINE01', line_name: '라인1', daily_capacity: 1200, planned_utilization: 85, available_capacity: 180, month: '2024-02' },
          { id: 2, production_line: 'LINE02', line_name: '라인2', daily_capacity: 1000, planned_utilization: 92, available_capacity: 80, month: '2024-02' },
          { id: 3, production_line: 'LINE03', line_name: '라인3', daily_capacity: 800, planned_utilization: 78, available_capacity: 176, month: '2024-02' },
          { id: 4, production_line: 'LINE04', line_name: '라인4', daily_capacity: 900, planned_utilization: 88, available_capacity: 108, month: '2024-02' },
        ]);

        // Mock material requirements
        setMaterialRequirements([
          { id: 1, product_code: 'P001', product_name: '제품A', material_code: 'M001', material_name: '원자재A', required_quantity: 5000, unit: 'kg', required_date: '2024-02-25', status: 'pending' },
          { id: 2, product_code: 'P001', product_name: '제품A', material_code: 'M002', material_name: '부자재B', required_quantity: 10000, unit: 'ea', required_date: '2024-02-25', status: 'pending' },
          { id: 3, product_code: 'P002', product_name: '제품B', material_code: 'M003', material_name: '원자재C', required_quantity: 3000, unit: 'kg', required_date: '2024-02-26', status: 'ordered' },
          { id: 4, product_code: 'P003', product_name: '제품C', material_code: 'M004', material_name: '부자재D', required_quantity: 4000, unit: 'ea', required_date: '2024-02-27', status: 'pending' },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 수요 예측 vs 실적 차트
  const getDemandForecastChart = () => {
    const products = [...new Set(demandForecasts.map(d => d.product_name))];
    const months = [...new Set(demandForecasts.map(d => d.month))].sort();

    return {
      labels: months.map(m => {
        const date = new Date(m);
        return `${date.getMonth() + 1}월`;
      }),
      datasets: products.map((product, idx) => {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];
        const productData = demandForecasts.filter(d => d.product_name === product);
        return {
          label: `${product} (예측)`,
          data: months.map(m => {
            const item = productData.find(d => d.month === m);
            return item ? item.forecast_quantity : 0;
          }),
          borderColor: colors[idx % colors.length],
          backgroundColor: `${colors[idx % colors.length]}20`,
          fill: false,
          tension: 0.4,
          borderDash: [5, 5]
        };
      })
    };
  };

  // 생산 계획 달성률 차트
  const getPlanAchievementChart = () => {
    return {
      labels: workOrders.slice(0, 6).map(o => o.product_name),
      datasets: [
        {
          label: '계획',
          data: workOrders.slice(0, 6).map(o => o.planned_quantity),
          backgroundColor: 'rgba(148, 163, 184, 0.5)',
          borderColor: '#94a3b8',
          borderWidth: 1
        },
        {
          label: '실적',
          data: workOrders.slice(0, 6).map(o => o.actual_quantity),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 1
        }
      ]
    };
  };

  // 용량 계획 차트
  const getCapacityPlanChart = () => {
    return {
      labels: capacityPlans.map(c => c.line_name),
      datasets: [
        {
          label: '계획 가동 (%)',
          data: capacityPlans.map(c => c.planned_utilization),
          backgroundColor: capacityPlans.map(c =>
            c.planned_utilization > 90 ? '#f87171' :
            c.planned_utilization > 80 ? '#fbbf24' : '#34d399'
          ),
          borderWidth: 0
        }
      ]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'planned': return 'bg-yellow-100 text-yellow-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'planned': return '계획';
      case 'delayed': return '지연';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingState message="생산 계획 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const totalPlanned = productionPlans.reduce((sum, p) => sum + p.planned_quantity, 0);
  const totalActual = workOrders.reduce((sum, o) => sum + o.actual_quantity, 0);
  const totalTarget = workOrders.reduce((sum, o) => sum + o.planned_quantity, 0);
  const avgAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const pendingPlans = productionPlans.filter(p => p.status === 'planned').length;
  const inProgressOrders = workOrders.filter(o => o.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon size={32} />
          <h1 className="text-3xl font-bold">생산관리</h1>
        </div>
        <p className="text-blue-100">생산 계획 수립 및 작업 지시 관리</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="생산 계획량"
          value={totalPlanned.toLocaleString()}
          subtitle="이번 달"
          unit="개"
          changeRate={0}
          trend="stable"
          color="blue"
          icon={TargetIcon}
        />
        <KPICard
          title="진행중 지시"
          value={inProgressOrders.toString()}
          subtitle={`대기: ${pendingPlans}건`}
          unit="건"
          changeRate={0}
          trend="up"
          color="green"
          icon={ActivityIcon}
        />
        <KPICard
          title="평균 달성률"
          value={`${avgAchievement.toFixed(1)}%`}
          subtitle="목표: 95%"
          changeRate={avgAchievement - 95}
          trend={avgAchievement >= 95 ? "up" : "down"}
          color="purple"
          icon={TrendUpIcon}
        />
        <KPICard
          title="잔여 용량"
          value={capacityPlans.reduce((sum, c) => sum + c.available_capacity, 0).toLocaleString()}
          subtitle="일일 기준"
          unit="개"
          changeRate={0}
          trend="stable"
          color="yellow"
          icon={FactoryIcon}
        />
      </div>

      {/* 기간 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['week', 'month', 'quarter'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'week' && '주간'}
              {period === 'month' && '월간'}
              {period === 'quarter' && '분기'}
            </button>
          ))}
        </div>
      </div>

      {/* 수요 예측 vs 실적 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChartIcon className="text-blue-600" size={24} />
            수요 예측 vs 실적
          </h3>
          <p className="text-sm text-gray-500 mt-1">월별 판매 예측 정확도</p>
        </div>

        <ChartComponent
          type="line"
          data={getDemandForecastChart()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">평균 예측 편차</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.abs(demandForecasts.reduce((sum, d) => sum + parseFloat(d.variance_rate), 0) / demandForecasts.length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">적중률</p>
            <p className="text-2xl font-bold text-green-600">
              {demandForecasts.filter(d => Math.abs(parseFloat(d.variance_rate)) <= 5).length}/{demandForecasts.length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">총 수요</p>
            <p className="text-2xl font-bold text-purple-600">
              {demandForecasts.reduce((sum, d) => sum + d.forecast_quantity, 0).toLocaleString()}개
            </p>
          </div>
        </div>
      </div>

      {/* 용량 계획 & 계획 달성률 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FactoryIcon className="text-green-600" size={24} />
              라인별 용량 계획
            </h3>
            <p className="text-sm text-gray-500 mt-1">일일 생산 용량 활용 계획</p>
          </div>

          <ChartComponent
            type="bar"
            data={getCapacityPlanChart()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } }
            }}
            height={280}
          />

          <div className="mt-4 space-y-2">
            {capacityPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span className="font-medium">{plan.line_name}</span>
                <div className="flex items-center gap-4">
                  <span>용량: {plan.daily_capacity}개</span>
                  <span className={`font-bold ${
                    plan.planned_utilization > 90 ? 'text-red-600' :
                    plan.planned_utilization > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>{plan.planned_utilization}%</span>
                  <span className="text-blue-600">잔여: {plan.available_capacity}개</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TargetIcon className="text-purple-600" size={24} />
              계획 vs 실적
            </h3>
            <p className="text-sm text-gray-500 mt-1">작업지시별 달성 현황</p>
          </div>

          <ChartComponent
            type="bar"
            data={getPlanAchievementChart()}
            options={{
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 생산 계획 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CalendarIcon size={20} />
            생산 계획 현황
          </h3>
          <p className="text-blue-100 text-xs mt-1">계획된 작업 지시</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">계획번호</th>
                <th className="py-3 px-4 text-left">제품</th>
                <th className="py-3 px-4 text-center">계획수량</th>
                <th className="py-3 px-4 text-center">계획시작</th>
                <th className="py-3 px-4 text-center">계획완료</th>
                <th className="py-3 px-4 text-center">우선순위</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productionPlans.slice(0, 8).map((plan) => (
                <tr key={plan.id} className="hover:bg-blue-50">
                  <td className="py-3 px-4 font-medium">{plan.plan_number}</td>
                  <td className="py-3 px-4">
                    <div>{plan.product_name}</div>
                    <div className="text-xs text-gray-500">{plan.product_code}</div>
                  </td>
                  <td className="py-3 px-4 text-center">{plan.planned_quantity.toLocaleString()}개</td>
                  <td className="py-3 px-4 text-center">{plan.plan_date}</td>
                  <td className="py-3 px-4 text-center">{plan.planned_completion_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(plan.priority)}`}>
                      {plan.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(plan.status)}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 작업 지시 진행 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-green-600" size={24} />
            작업 지시 진행 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            진행중 {workOrders.filter(o => o.status === 'in_progress').length}건
          </p>
        </div>

        <div className="space-y-3">
          {workOrders.slice(0, 6).map((order) => {
            const progress = order.planned_quantity > 0
              ? ((order.actual_quantity / order.planned_quantity) * 100).toFixed(1)
              : '0';
            return (
              <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                      {order.order_number.slice(-2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{order.order_number}</h4>
                      <p className="text-sm text-gray-600">{order.product_name} · 마감: {order.planned_end}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-bold">
                      {order.actual_quantity.toLocaleString()} / {order.planned_quantity.toLocaleString()}
                      <span className="ml-2 text-blue-600">({progress}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        parseFloat(progress) >= 80 ? 'bg-green-600' :
                        parseFloat(progress) >= 60 ? 'bg-blue-600' :
                        parseFloat(progress) >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, parseFloat(progress))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 자재 소요 계획 (MRP) */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <PackageIcon size={20} />
            자재 소요 계획
          </h3>
          <p className="text-green-100 text-xs mt-1">생산 계획에 따른 자재 수급 계획</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">제품</th>
                <th className="py-3 px-4 text-left">소요 자재</th>
                <th className="py-3 px-4 text-center">소요량</th>
                <th className="py-3 px-4 text-center">단위</th>
                <th className="py-3 px-4 text-center">소요일</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materialRequirements.map((req) => (
                <tr key={req.id} className="hover:bg-green-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{req.product_name}</div>
                    <div className="text-xs text-gray-500">{req.product_code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{req.material_name}</div>
                    <div className="text-xs text-gray-500">{req.material_code}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{req.required_quantity.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">{req.unit}</td>
                  <td className="py-3 px-4 text-center">{req.required_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      req.status === 'ordered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {req.status === 'ordered' ? '발주완료' : '미발주'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생산 계획 인사이트 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">생산 계획 인사이트</h3>
        <div className="space-y-3">
          {avgAchievement < 95 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">달성률 개선 필요</p>
                  <p className="text-sm text-gray-600">
                    현재 달성률 {avgAchievement.toFixed(1)}%로 목표(95%) 미달입니다.
                    생산 계획 수정 또는 용량 증대를 검토하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {capacityPlans.filter(c => c.planned_utilization > 90).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">용량 부족 경고</p>
                  <p className="text-sm text-gray-600">
                    {capacityPlans.filter(c => c.planned_utilization > 90).map(c => c.line_name).join(', ')}의
                    계획 가동률이 90%를 초과합니다. 추가 용량 확보나 생산 일정 조정이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {materialRequirements.filter(m => m.status === 'pending').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">자재 발주 대기</p>
                  <p className="text-sm text-gray-600">
                    {materialRequirements.filter(m => m.status === 'pending').length}건의 자재 발주가
                    대기 중입니다. 납기 준수를 위해 발주 처리가 필요합니다.
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

export default Production;
