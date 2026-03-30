import React, { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
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

interface DailyProduction {
  production_date: string;
  planned_quantity: number;
  actual_quantity: number;
  achievement_rate: number;
}

interface QualityInspection {
  inspection_date: string;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

interface ProcessCapability {
  process_name: string;
  yield_rate: number;
  fpy_rate: number;
}

interface InventoryTurnover {
  material_code: string;
  material_name: string;
  turnover_rate: number;
}

interface InventoryItem {
  material_code: string;
  material_name: string;
  current_stock: number;
  stock_value: number;
  days_of_supply: number;
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
  const [dailyProduction, setDailyProduction] = useState<DailyProduction[]>([]);
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([]);
  const [processCapabilities, setProcessCapabilities] = useState<ProcessCapability[]>([]);
  const [turnover, setTurnover] = useState<InventoryTurnover[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kpiPerformance, setKpiPerformance] = useState<KPIPerformance[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ERP 매핑 데이터 서비스를 사용하여 경영진단 요약 데이터 조회
      const executiveSummaryRes = await dashboardDataService.dashboard.getExecutiveSummary({
        period_type: 'monthly',
        period_value: '2024-12'
      });

      // 각 세부 대시보드 데이터도 병렬 조회
      const salesRes = await dashboardDataService.dashboard.getSalesDashboard({
        date: new Date().toISOString().split('T')[0]
      });
      const productionRes = await dashboardDataService.dashboard.getProductionDashboard({
        date: new Date().toISOString().split('T')[0]
      });
      const qualityRes = await dashboardDataService.dashboard.getQualityDashboard({
        date: new Date().toISOString().split('T')[0]
      });
      const inventoryRes = await dashboardDataService.dashboard.getInventoryDashboard({
        asof_date: new Date().toISOString().split('T')[0]
      });

      // 경영진단 요약 데이터 설정
      if (executiveSummaryRes.results && executiveSummaryRes.results.length > 0) {
        const summary = executiveSummaryRes.results[0];
        // 기존 Interface에 맞춰어 데이터 변환
        setMonthlySales([{
          fiscal_year: 2024,
          fiscal_month: 12,
          target_amount: summary.total_sales * 0.9,  // 목표는 실적의 90%로 설정
          actual_amount: summary.total_sales,
          achievement_rate: 104.0
        }]);
      }

      // 기존 데이터 설정 (임시)
      setDailyProduction([]);
      setQualityInspections([]);
      setProcessCapabilities([]);
      setTurnover([]);
      setInventory([]);
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
    const latestRate = Number(latest.achievement_rate) || 0;
    const previousRate = previous ? (Number(previous.achievement_rate) || 0) : 0;
    const change = previousRate > 0
      ? ((latestRate - previousRate) / previousRate * 100)
      : 0;
    return {
      achievement: latestRate,
      target: Number(latest.target_amount) || 0,
      actual: Number(latest.actual_amount) || 0,
      change: Math.round(change * 10) / 10
    };
  };

  const getProductionKPI = () => {
    if (dailyProduction.length === 0) {
      return { achievement: 0, planned: 0, actual: 0, change: 0 };
    }
    const recent = dailyProduction.slice(-7);
    const totalPlanned = recent.reduce((sum, p) => sum + (p.planned_quantity ?? 0), 0);
    const totalActual = recent.reduce((sum, p) => sum + (p.actual_quantity ?? 0), 0);
    const achievement = totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0;

    // Compare with previous period
    const prev = dailyProduction.slice(-14, -7);
    const prevPlanned = prev.reduce((sum, p) => sum + (p.planned_quantity ?? 0), 0);
    const prevActual = prev.reduce((sum, p) => sum + (p.actual_quantity ?? 0), 0);
    const prevAchievement = prevPlanned > 0 ? (prevActual / prevPlanned * 100) : 0;
    const change = prevAchievement > 0 ? ((achievement - prevAchievement) / prevAchievement * 100) : 0;

    return {
      achievement: Math.round(achievement * 10) / 10,
      planned: totalPlanned,
      actual: totalActual,
      change: Math.round(change * 10) / 10
    };
  };

  const getQualityKPI = () => {
    if (qualityInspections.length === 0) {
      return { passRate: 0, target: 95, change: 0 };
    }
    const recent = qualityInspections.slice(-30);
    const totalPass = recent.reduce((sum, i) => sum + (i.pass_count ?? 0), 0);
    const totalFail = recent.reduce((sum, i) => sum + (i.fail_count ?? 0), 0);
    const total = totalPass + totalFail;
    const passRate = total > 0 ? (totalPass / total * 100) : 0;

    // Previous period
    const prev = qualityInspections.slice(-60, -30);
    const prevPass = prev.reduce((sum, i) => sum + (i.pass_count ?? 0), 0);
    const prevFail = prev.reduce((sum, i) => sum + (i.fail_count ?? 0), 0);
    const prevTotal = prevPass + prevFail;
    const prevRate = prevTotal > 0 ? (prevPass / prevTotal * 100) : 0;
    const change = prevRate > 0 ? ((passRate - prevRate) / prevRate * 100) : 0;

    return {
      passRate: Math.round(passRate * 10) / 10,
      target: 95,
      change: Math.round(change * 10) / 10
    };
  };

  const getTurnoverKPI = () => {
    if (turnover.length === 0) {
      return { avgTurnover: 0, target: 8, change: 0 };
    }
    const avgTurnover = turnover.reduce((sum, t) => sum + (t.turnover_rate ?? 0), 0) / turnover.length;
    return {
      avgTurnover: Math.round(avgTurnover * 10) / 10,
      target: 8,
      change: 0.8 // Static change for now
    };
  };

  // Get worst inventory (slow-moving)
  const getWorstInventory = () => {
    const sorted = [...inventory]
      .filter(item => item.days_of_supply > 30)
      .sort((a, b) => b.days_of_supply - a.days_of_supply)
      .slice(0, 5);

    return sorted.map((item, idx) => {
      let theme = 'blue';
      if (item.days_of_supply > 90) theme = 'red';
      else if (item.days_of_supply > 60) theme = 'orange';
      else if (item.days_of_supply > 45) theme = 'yellow';

      return {
        code: item.material_code,
        day: `${item.days_of_supply}일`,
        pct: `${Math.round(item.stock_value / inventory.reduce((s, i) => s + (i.stock_value ?? 0), 1) * 100)}%`,
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

  // Get inventory chart data
  const getInventoryChartData = () => {
    // Group inventory by type (假设有type字段，如果没有用material_code前缀分类)
    const grouped = inventory.reduce((acc, item) => {
      const type = item.material_code?.startsWith('RM') ? '원자재'
        : item.material_code?.startsWith('WIP') ? '재공품'
        : '완제품';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item.stock_value ?? 0);
      return acc;
    }, {} as Record<string, number[]>);

    // Mock 3-month trend if not enough data
    const labels = ['8월', '9월', '10월'];
    const colors = {
      '원자재': { border: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
      '재공품': { border: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
      '완제품': { border: '#d8b4fe', bg: 'rgba(216,180,254,0.1)' }
    };

    const datasets = Object.entries(colors).map(([type, color]) => {
      const values = grouped[type] || [];
      const sum = values.reduce((s, v) => s + v, 0) / 100000000;
      // Create mock trend
      const data = [
        Math.round((sum * 0.95) * 10) / 10,
        Math.round((sum * 0.98) * 10) / 10,
        Math.round(sum * 10) / 10
      ];
      return {
        label: type,
        data,
        borderColor: color.border,
        backgroundColor: color.bg,
        fill: true,
        tension: 0.3
      };
    });

    return { labels, datasets };
  };

  // Get quality by process chart data
  const getQualityChartData = () => {
    if (processCapabilities.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: '수율', data: [], backgroundColor: '#4ade80' },
          { label: 'FPY', data: [], backgroundColor: '#22c55e' }
        ]
      };
    }

    const processes = processCapabilities.slice(0, 5);
    const labels = processes.map(p => p.process_name);
    const yields = processes.map(p => p.yield_rate ?? 0);
    const fpy = processes.map(p => p.fpy_rate ?? 0);

    return {
      labels,
      datasets: [
        { label: '수율', data: yields, backgroundColor: '#4ade80' },
        { label: 'FPY', data: fpy, backgroundColor: '#22c55e' }
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
