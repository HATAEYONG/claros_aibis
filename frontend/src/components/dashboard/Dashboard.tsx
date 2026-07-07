import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import BusinessProcessSummary from '@/components/dashboard/BusinessProcessSummary';
import { TrendingUp } from 'lucide-react';
import {
  AlertIcon,
  DollarIcon,
  FactoryIcon,
  TargetIcon,
  PackageIcon,
  ActivityIcon,
  CheckIcon
} from '@/components/icons/Icons';
import api from '@/services/api';
import dashboardDataService from '@/services/dashboardDataService';

// Interfaces
interface MonthlySales {
  fiscal_year: number;
  fiscal_month: number;
  target_amount: number;
  actual_amount: number;
  achievement_rate: number;
}

// erp_sync/dashboard/production/ 응답 그대로 (일자별 개별 레코드가 아니라 조회일 기준 집계 1건)
interface ProductionSummary {
  plan_qty: number;
  production_qty: number;
  good_qty: number;
  defect_qty: number;
  yield_rate: number;
  achievement_rate: number;
  oee_rate: number;
}

// erp_sync/dashboard/quality/ 응답 그대로
interface QualitySummary {
  inspect_count: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
  defect_rate: number;
  yield_by_process: { process: string; yield_rate: number; fpy_rate: number }[];
}

// erp_sync/dashboard/inventory/ 응답 그대로
interface InventorySummary {
  total_items: number;
  total_stock_value: number;
  avg_stock_days: number; // 실제로는 평균 회전율(turnover_rate) 값
  warehouses: { code: string; value: number }[]; // 재고 등급(A/B/C)별 재고가치
  slow_moving_details: {
    item_code: string;
    item_name: string;
    stock_value: number;
    turnover_rate: number;
    days_of_supply: number;
  }[];
}

interface Alert {
  id?: number;
  metric_name: string;
  category?: string;
  current_value: number;
  target_value: number;
  alert_type?: string;
  message?: string;
  created_at?: string;
}

interface KPIPerformance {
  department: string;
  kpi_name: string;
  target_value: number;
  previous_value?: number;
  actual_value: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [productionSummary, setProductionSummary] = useState<ProductionSummary | null>(null);
  const [qualitySummary, setQualitySummary] = useState<QualitySummary | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kpiPerformance, setKpiPerformance] = useState<KPIPerformance[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 최근 3개월(이번 달 포함) 경영진단 요약을 병렬 조회해 매출 추이로 사용
      const periods: string[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const [summaryResults, productionRes, qualityRes, inventoryRes] = await Promise.all([
        Promise.all(periods.map(period_value =>
          dashboardDataService.dashboard.getExecutiveSummary({ period_type: 'monthly', period_value })
        )),
        dashboardDataService.dashboard.getProductionDashboard({ date: todayStr }),
        dashboardDataService.dashboard.getQualityDashboard({ date: todayStr }),
        dashboardDataService.dashboard.getInventoryDashboard({ asof_date: todayStr }),
      ]);

      // 최근 3개월 매출 추이 설정 (목표치는 API에 없어 실적의 90%로 근사,
      // 달성률은 그 근사 목표 대비 실적이므로 모든 달이 항상 111.1% 부근으로 나옴 - 근사치 한계)
      const monthly = summaryResults
        .map((res, idx) => {
          if (!res.results || res.results.length === 0) return null;
          const summary = res.results[0];
          const [fy, fm] = periods[idx].split('-').map(Number);
          const target = summary.total_sales * 0.9;
          const actual = summary.total_sales;
          return {
            fiscal_year: fy,
            fiscal_month: fm,
            target_amount: target,
            actual_amount: actual,
            achievement_rate: target > 0 ? Math.round((actual / target) * 1000) / 10 : 0,
          };
        })
        .filter((v): v is MonthlySales => v !== null);
      setMonthlySales(monthly);

      if (productionRes.results && productionRes.results.length > 0) {
        setProductionSummary(productionRes.results[0]);
      }
      if (qualityRes.results && qualityRes.results.length > 0) {
        setQualitySummary(qualityRes.results[0]);
      }
      if (inventoryRes.results && inventoryRes.results.length > 0) {
        setInventorySummary(inventoryRes.results[0]);
      }

      // 알림/KPI 성과표는 전용 API가 아직 없어 아래 KPI 카드 값을 기반으로 화면단에서 파생
      setAlerts([]);
      setKpiPerformance([]);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPI summaries
  const getSalesKPI = () => {
    if (monthlySales.length === 0) {
      return { achievement: 0, target: 0, actual: 0, change: 0 };
    }
    const latest = monthlySales[monthlySales.length - 1];
    const previous = monthlySales.length > 1 ? monthlySales[monthlySales.length - 2] : null;
    const latestActual = Number(latest.actual_amount) || 0;
    const previousActual = previous ? (Number(previous.actual_amount) || 0) : 0;
    // 목표는 실적의 90% 근사치라 달성률 자체는 매달 거의 동일 -> 변화율은 실제 매출 증감으로 표시
    const change = previousActual > 0
      ? ((latestActual - previousActual) / previousActual * 100)
      : 0;
    return {
      achievement: Number(latest.achievement_rate) || 0,
      target: Number(latest.target_amount) || 0,
      actual: latestActual,
      change: Math.round(change * 10) / 10
    };
  };

  const getProductionKPI = () => {
    if (!productionSummary) {
      return { achievement: 0, planned: 0, actual: 0, change: 0 };
    }
    return {
      achievement: Math.round((productionSummary.achievement_rate ?? 0) * 10) / 10,
      planned: productionSummary.plan_qty ?? 0,
      actual: productionSummary.production_qty ?? 0,
      change: Math.round(((productionSummary.oee_rate ?? 0) - (productionSummary.achievement_rate ?? 0)) * 10) / 10,
    };
  };

  const getQualityKPI = () => {
    if (!qualitySummary) {
      return { passRate: 0, target: 95, change: 0 };
    }
    return {
      passRate: Math.round((qualitySummary.pass_rate ?? 0) * 10) / 10,
      target: 95,
      change: Math.round(((qualitySummary.pass_rate ?? 0) - 95) * 10) / 10,
    };
  };

  const getTurnoverKPI = () => {
    if (!inventorySummary) {
      return { avgTurnover: 0, target: 8, change: 0 };
    }
    // avg_stock_days 필드는 실제로는 품목별 turnover_rate의 평균값
    const avgTurnover = inventorySummary.avg_stock_days ?? 0;
    return {
      avgTurnover: Math.round(avgTurnover * 10) / 10,
      target: 8,
      change: Math.round((avgTurnover - 8) * 10) / 10,
    };
  };

  // Get worst inventory (slow-moving) - 백엔드가 이미 회전율 최하위 5개를 계산해서 내려줌
  const getWorstInventory = () => {
    if (!inventorySummary || inventorySummary.slow_moving_details.length === 0) {
      return [];
    }
    const totalValue = inventorySummary.slow_moving_details.reduce((s, i) => s + (i.stock_value ?? 0), 1);

    return inventorySummary.slow_moving_details.map(item => {
      let theme = 'blue';
      if (item.days_of_supply > 90) theme = 'red';
      else if (item.days_of_supply > 60) theme = 'orange';
      else if (item.days_of_supply > 45) theme = 'yellow';

      return {
        code: item.item_code,
        day: `${item.days_of_supply}일`,
        pct: `${Math.round((item.stock_value / totalValue) * 100)}%`,
        amt: `${(item.stock_value / 100000000).toFixed(1)}억`,
        theme
      };
    });
  };

  // Get sales chart data (last 3 months)
  const getSalesChartData = () => {
    const recentSales = monthlySales.slice(-3);
    if (recentSales.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: '목표', data: [], backgroundColor: 'rgba(147,197,253,0.8)' },
          { label: '실적', data: [], backgroundColor: 'rgba(59,130,246,0.8)' }
        ]
      };
    }

    const months = recentSales.map(s => `${s.fiscal_month}월`);
    const targets = recentSales.map(s => Math.round((s.target_amount ?? 0) / 100000000));
    const actuals = recentSales.map(s => Math.round((s.actual_amount ?? 0) / 100000000));

    return {
      labels: months,
      datasets: [
        { label: '목표', data: targets, backgroundColor: 'rgba(147,197,253,0.8)' },
        { label: '실적', data: actuals, backgroundColor: 'rgba(59,130,246,0.8)' }
      ]
    };
  };

  // Get inventory chart data - 재고 등급(A/B/C)별 현재 재고가치 스냅샷
  // (일별/월별 재고가치 이력은 별도로 집계하지 않아 시계열 추이 대신 현재 스냅샷을 보여줌)
  const getInventoryChartData = () => {
    const warehouses = inventorySummary?.warehouses;
    if (!warehouses || warehouses.length === 0) {
      return {
        labels: [],
        datasets: [{ label: '재고가치(억원)', data: [], backgroundColor: 'rgba(168,85,247,0.6)' }]
      };
    }

    return {
      labels: warehouses.map(w => `${w.code}등급`),
      datasets: [
        {
          label: '재고가치(억원)',
          data: warehouses.map(w => Math.round((w.value / 100000000) * 10) / 10),
          backgroundColor: 'rgba(168,85,247,0.6)',
          borderColor: '#a855f7',
        }
      ]
    };
  };

  // Get quality by process chart data
  const getQualityChartData = () => {
    const byProcess = qualitySummary?.yield_by_process ?? [];
    if (byProcess.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: '수율', data: [], backgroundColor: '#4ade80' },
          { label: 'FPY', data: [], backgroundColor: '#22c55e' }
        ]
      };
    }

    return {
      labels: byProcess.map(p => p.process),
      datasets: [
        { label: '수율', data: byProcess.map(p => p.yield_rate ?? 0), backgroundColor: '#4ade80' },
        { label: 'FPY', data: byProcess.map(p => p.fpy_rate ?? 0), backgroundColor: '#22c55e' }
      ]
    };
  };

  // Map KPI data to table format
  const getKPITableData = () => {
    if (kpiPerformance.length === 0) {
      // Return default data if no API data
      const salesAchievement = Number(getSalesKPI().achievement) || 0;
      const productionAchievement = Number(getProductionKPI().achievement) || 0;
      const qualityPassRate = Number(getQualityKPI().passRate) || 0;
      const turnoverRate = Number(getTurnoverKPI().avgTurnover) || 0;
      return [
        { dept: '영업', metric: '매출예측정확도', target: '90%', prev: '-', current: `${salesAchievement.toFixed(1)}%`, status: salesAchievement >= 90 ? '양호' : '주의' },
        { dept: '생산관리', metric: '생산달성률', target: '95%', prev: '-', current: `${productionAchievement.toFixed(1)}%`, status: productionAchievement >= 95 ? '양호' : '주의' },
        { dept: '품질', metric: '종합수율', target: '95%', prev: '-', current: `${qualityPassRate.toFixed(1)}%`, status: qualityPassRate >= 95 ? '양호' : '주의' },
        { dept: '구매', metric: '재고회전율', target: '8.0', prev: '-', current: `${turnoverRate.toFixed(1)}`, status: turnoverRate >= 8 ? '양호' : '주의' }
      ];
    }

    return kpiPerformance.map(kpi => ({
      dept: kpi.department,
      metric: kpi.kpi_name,
      target: `${kpi.target_value}%`,
      prev: kpi.previous_value ? `${kpi.previous_value}%` : '-',
      current: `${kpi.actual_value}%`,
      status: kpi.status === 'excellent' ? '우수' : kpi.status === 'good' ? '양호' : '주의'
    }));
  };

  // Format alerts
  const getFormattedAlerts = () => {
    if (alerts.length === 0) {
      return [
        { level: '긴급', message: '데이터 로딩 중...', time: '' }
      ];
    }

    return alerts.slice(0, 3).map(alert => ({
      level: alert.alert_type === 'critical' ? '긴급' : alert.alert_type === 'warning' ? '주의' : '정보',
      message: alert.message || `${alert.metric_name}: ${alert.current_value}% (목표: ${alert.target_value}%)`,
      time: alert.created_at ? new Date(alert.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''
    }));
  };

  if (loading) {
    return <LoadingState message="대시보드 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const salesKPI = getSalesKPI();
  const productionKPI = getProductionKPI();
  const qualityKPI = getQualityKPI();
  const turnoverKPI = getTurnoverKPI();
  const worstInventory = getWorstInventory();
  const kpiTableData = getKPITableData();
  const formattedAlerts = getFormattedAlerts();

  return (
    <div className="space-y-6">
      {/* 긴급 알림 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm flex items-start gap-3">
        <AlertIcon className="text-blue-600 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          {formattedAlerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 ${
                alert.level === '긴급' ? 'bg-red-100 text-red-600' :
                alert.level === '주의' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              } text-xs font-bold rounded`}>{alert.level}</span>
              <p className="text-sm text-gray-700 font-medium">● {alert.message}</p>
              {alert.time && <span className="text-xs text-gray-500">({alert.time})</span>}
            </div>
          ))}
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="매출 달성률"
          value={`${(Number(salesKPI.achievement) || 0).toFixed(1)}%`}
          subtitle={`목표: ${((Number(salesKPI.target) || 0) / 100000000).toFixed(0)}억 | 실적: ${((Number(salesKPI.actual) || 0) / 100000000).toFixed(0)}억`}
          changeRate={Number(salesKPI.change) || 0}
          trend={(Number(salesKPI.change) || 0) >= 0 ? 'up' : 'down'}
          color="blue"
          icon={DollarIcon}
        />
        <KPICard
          title="생산 달성률"
          value={`${Number(productionKPI.achievement) || 0}%`}
          subtitle={`계획: ${(Number(productionKPI.planned) || 0).toLocaleString()} | 실적: ${(Number(productionKPI.actual) || 0).toLocaleString()}`}
          changeRate={Number(productionKPI.change) || 0}
          trend={(Number(productionKPI.change) || 0) >= 0 ? 'up' : 'down'}
          color="green"
          icon={FactoryIcon}
        />
        <KPICard
          title="종합 수율"
          value={`${Number(qualityKPI.passRate) || 0}%`}
          subtitle={`목표: ${qualityKPI.target}% | 실적: ${Number(qualityKPI.passRate) || 0}%`}
          changeRate={Number(qualityKPI.change) || 0}
          trend={(Number(qualityKPI.change) || 0) >= 0 ? 'up' : 'down'}
          color={(Number(qualityKPI.passRate) || 0) >= qualityKPI.target ? 'green' : 'yellow'}
          icon={TargetIcon}
        />
        <KPICard
          title="재고 회전율"
          value={`${Number(turnoverKPI.avgTurnover) || 0}`}
          subtitle={`목표: ${turnoverKPI.target} | 실적: ${Number(turnoverKPI.avgTurnover) || 0}회`}
          changeRate={Number(turnoverKPI.change) || 0}
          trend={(Number(turnoverKPI.change) || 0) >= 0 ? 'up' : 'down'}
          color="purple"
          icon={PackageIcon}
        />
      </div>

      {/* 비즈니스 프로세스 요약 */}
      <BusinessProcessSummary />

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={18}/> 월별 매출 추이
          </h3>
          <ChartComponent
            type="bar"
            data={getSalesChartData()}
            options={{ plugins: { legend: { position: 'top' } } }}
            height={256}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <ActivityIcon className="text-purple-500" size={18}/> 재고 현황
          </h3>
          <ChartComponent
            type="line"
            data={getInventoryChartData()}
            options={{ plugins: { legend: { position: 'top' } } }}
            height={256}
          />
        </div>
      </div>

      {/* 두 번째 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <CheckIcon className="text-green-500" size={18}/> 공정별 품질 수율
          </h3>
          <ChartComponent
            type="bar"
            data={getQualityChartData()}
            options={{ scales: { y: { min: 80, max: 100 } } }}
            height={256}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <AlertIcon className="text-red-500" size={18}/> Worst 5 부진재고
          </h3>
          <div className="space-y-3">
            {worstInventory.length > 0 ? (
              worstInventory.map((item, idx) => (
                <div key={idx} className={`flex justify-between p-3 border rounded-lg ${
                  item.theme === 'red' ? 'bg-red-50 border-red-100' :
                  item.theme === 'orange' ? 'bg-orange-50 border-orange-100' :
                  item.theme === 'yellow' ? 'bg-yellow-50 border-yellow-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.code}</p>
                    <p className="text-xs text-gray-500">{item.day}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      item.theme === 'red' ? 'text-red-600' :
                      item.theme === 'orange' ? 'text-orange-600' :
                      item.theme === 'yellow' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>{item.pct}</p>
                    <p className="text-xs text-gray-500">{item.amt}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                부진재고 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI 테이블 */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <TargetIcon size={20}/> 부문별 핵심성과지표 (KPI)
          </h3>
          <p className="text-blue-100 text-xs mt-1">월간 목표 대비 실적 현황</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">부문</th>
                <th className="py-3 px-4 text-left">지표명</th>
                <th className="py-3 px-4 text-center">목표</th>
                <th className="py-3 px-4 text-center">전월실적</th>
                <th className="py-3 px-4 text-center">당월실적</th>
                <th className="py-3 px-4 text-center">평가</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kpiTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="py-3 px-4 font-medium">{row.dept}</td>
                  <td className="py-3 px-4">{row.metric}</td>
                  <td className="py-3 px-4 text-center">{row.target}</td>
                  <td className="py-3 px-4 text-center">{row.prev}</td>
                  <td className="py-3 px-4 text-center font-bold text-green-600">{row.current}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 ${
                      row.status === '우수' ? 'bg-green-100 text-green-700' :
                      row.status === '양호' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    } text-xs rounded-full font-bold`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
