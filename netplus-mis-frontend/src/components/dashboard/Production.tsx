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
  ZapIcon,
  TargetIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface ProductionLine {
  id: number;
  name: string;
  code: string;
  location: string;
  capacity: number;
  is_active: boolean;
}

interface DailyProduction {
  id: number;
  production_line: number;
  production_line_name?: string;
  production_date: string;
  target_quantity: number;
  actual_quantity: number;
  defect_quantity: number;
  operating_hours: string;
  downtime_hours: string;
  efficiency: string;
}

interface WorkOrder {
  id: number;
  order_number: string;
  production_line: number;
  production_line_name?: string;
  product_name: string;
  product_code: string;
  target_quantity: number;
  actual_quantity: number;
  defect_quantity: number;
  status: string;
  status_display?: string;
  planned_start: string;
  planned_end: string;
}

interface Equipment {
  id: number;
  name: string;
  code: string;
  production_line: number;
  status: string;
  status_display?: string;
  last_maintenance: string;
  next_maintenance: string;
}

const Production: React.FC = () => {
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [dailyProductions, setDailyProductions] = useState<DailyProduction[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [workOrderDashboard, setWorkOrderDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [linesRes, dailyRes, workOrdersRes, equipmentRes, weeklyRes, dashboardRes] = await Promise.all([
          api.production.getLines(),
          api.production.getDailyProductions(),
          api.production.getWorkOrders('status=in_progress'),
          api.production.getEquipment(),
          api.production.getWeeklySummary(),
          api.production.getWorkOrderDashboard(),
        ]);

        setLines(Array.isArray(linesRes) ? linesRes : linesRes.results || []);
        setDailyProductions(Array.isArray(dailyRes) ? dailyRes : dailyRes.results || []);
        setWorkOrders(Array.isArray(workOrdersRes) ? workOrdersRes : workOrdersRes.results || []);
        setEquipment(Array.isArray(equipmentRes) ? equipmentRes : equipmentRes.results || []);
        setWeeklySummary(weeklyRes);
        setWorkOrderDashboard(dashboardRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 일일 생산 추이 차트 데이터 (최근 7일)
  const getDailyTrendData = () => {
    const last7Days = dailyProductions.slice(0, 35); // 5 lines * 7 days
    const dateMap = new Map<string, { target: number; actual: number }>();

    last7Days.forEach(dp => {
      const date = dp.production_date;
      const existing = dateMap.get(date) || { target: 0, actual: 0 };
      dateMap.set(date, {
        target: existing.target + dp.target_quantity,
        actual: existing.actual + dp.actual_quantity
      });
    });

    const sortedDates = Array.from(dateMap.keys()).sort().slice(-7);
    const targets = sortedDates.map(d => dateMap.get(d)?.target || 0);
    const actuals = sortedDates.map(d => dateMap.get(d)?.actual || 0);

    return {
      labels: sortedDates.map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          label: '계획',
          data: targets,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0
        },
        {
          label: '실적',
          data: actuals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 라인별 가동률 차트 데이터
  const getLineUtilizationData = () => {
    const lineEfficiency = new Map<number, { total: number; count: number; name: string }>();

    lines.forEach(line => {
      lineEfficiency.set(line.id, { total: 0, count: 0, name: line.name });
    });

    dailyProductions.slice(0, 35).forEach(dp => {
      const existing = lineEfficiency.get(dp.production_line);
      if (existing) {
        existing.total += parseFloat(dp.efficiency);
        existing.count += 1;
      }
    });

    const efficiencies = lines.map(line => {
      const data = lineEfficiency.get(line.id);
      return data && data.count > 0 ? data.total / data.count : 0;
    });

    return {
      labels: lines.map(l => l.name),
      datasets: [{
        label: '가동률 (%)',
        data: efficiencies.map(e => parseFloat(e.toFixed(1))),
        backgroundColor: efficiencies.map(e => e >= 90 ? '#10b981' : '#f59e0b'),
        borderColor: efficiencies.map(e => e >= 90 ? '#059669' : '#d97706'),
        borderWidth: 2
      }]
    };
  };

  // 제품별 생산 비중 (작업지시서 기준)
  const getProductMixData = () => {
    const productMap = new Map<string, number>();
    workOrders.forEach(wo => {
      const existing = productMap.get(wo.product_name) || 0;
      productMap.set(wo.product_name, existing + wo.actual_quantity);
    });

    const entries = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return {
      labels: entries.map(e => e[0]),
      datasets: [{
        data: entries.map(e => e[1]),
        backgroundColor: colors.slice(0, entries.length)
      }]
    };
  };

  // 라인별 오늘 실적 계산
  const getLineStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return lines.map(line => {
      const todayProduction = dailyProductions.find(
        dp => dp.production_line === line.id && dp.production_date === today
      );
      const recentProductions = dailyProductions
        .filter(dp => dp.production_line === line.id)
        .slice(0, 7);

      const avgEfficiency = recentProductions.length > 0
        ? recentProductions.reduce((sum, dp) => sum + parseFloat(dp.efficiency), 0) / recentProductions.length
        : 0;

      const avgDefectRate = recentProductions.length > 0
        ? recentProductions.reduce((sum, dp) => {
            return sum + (dp.actual_quantity > 0 ? (dp.defect_quantity / dp.actual_quantity) * 100 : 0);
          }, 0) / recentProductions.length
        : 0;

      const lineEquipment = equipment.filter(e => e.production_line === line.id);
      const runningEquipment = lineEquipment.filter(e => e.status === 'running').length;

      return {
        ...line,
        todayTarget: todayProduction?.target_quantity || 0,
        todayActual: todayProduction?.actual_quantity || 0,
        efficiency: avgEfficiency,
        defectRate: avgDefectRate,
        status: avgEfficiency >= 95 ? 'running' : avgEfficiency >= 90 ? 'warning' : 'stopped',
        runningEquipment,
        totalEquipment: lineEquipment.length
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'idle': return 'bg-gray-100 text-gray-700';
      case 'maintenance': return 'bg-blue-100 text-blue-700';
      case 'breakdown': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running': return '가동중';
      case 'idle': return '대기';
      case 'maintenance': return '정비중';
      case 'breakdown': return '고장';
      case 'warning': return '주의';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingState message="생산 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const lineStats = getLineStats();
  const totalTarget = weeklySummary?.total_target || 0;
  const totalActual = weeklySummary?.total_actual || 0;
  const avgEfficiency = weeklySummary?.average_efficiency || 0;
  const achievementRate = weeklySummary?.achievement_rate || 0;

  const runningEquipmentCount = equipment.filter(e => e.status === 'running').length;
  const totalEquipmentCount = equipment.length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;

  const avgDefectRate = dailyProductions.slice(0, 35).reduce((sum, dp) => {
    return sum + (dp.actual_quantity > 0 ? (dp.defect_quantity / dp.actual_quantity) * 100 : 0);
  }, 0) / Math.max(dailyProductions.slice(0, 35).length, 1);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FactoryIcon size={32} />
          <h1 className="text-3xl font-bold">생산 관리</h1>
        </div>
        <p className="text-green-100">실시간 생산 현황과 설비 상태를 모니터링합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="주간 생산량"
          value={totalActual.toLocaleString()}
          subtitle={`목표: ${totalTarget.toLocaleString()}개`}
          unit="개"
          changeRate={achievementRate}
          trend={achievementRate >= 95 ? "up" : "down"}
          color="green"
          icon={FactoryIcon}
        />
        <KPICard
          title="평균 가동률"
          value={`${avgEfficiency.toFixed(1)}%`}
          subtitle="목표: 90%"
          changeRate={avgEfficiency - 90}
          trend={avgEfficiency >= 90 ? "up" : "down"}
          color="blue"
          icon={ActivityIcon}
        />
        <KPICard
          title="불량률"
          value={`${avgDefectRate.toFixed(2)}%`}
          subtitle="목표: 2.0% 이하"
          changeRate={2.0 - avgDefectRate}
          trend={avgDefectRate <= 2.0 ? "up" : "down"}
          color="purple"
          icon={CheckIcon}
        />
        <KPICard
          title="가동 설비"
          value={`${runningEquipmentCount}/${totalEquipmentCount}`}
          subtitle={`정비중: ${maintenanceCount}대`}
          changeRate={(runningEquipmentCount / totalEquipmentCount) * 100}
          trend="up"
          color="yellow"
          icon={ZapIcon}
        />
      </div>

      {/* 라인 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedLine('all')}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedLine === 'all'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {lines.map((line) => (
            <button
              key={line.id}
              onClick={() => setSelectedLine(line.code)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedLine === line.code
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {line.name}
            </button>
          ))}
        </div>
      </div>

      {/* 일일 생산 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-green-600" size={24} />
            주간 생산 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">최근 7일 계획 vs 실적</p>
        </div>

        <ChartComponent
          type="line"
          data={getDailyTrendData()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">주간 계획</p>
            <p className="text-2xl font-bold text-gray-800">{totalTarget.toLocaleString()}개</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">주간 실적</p>
            <p className="text-2xl font-bold text-blue-600">{totalActual.toLocaleString()}개</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">달성률</p>
            <p className="text-2xl font-bold text-purple-600">{achievementRate.toFixed(1)}%</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">부족분</p>
            <p className="text-2xl font-bold text-yellow-600">{Math.max(0, totalTarget - totalActual).toLocaleString()}개</p>
          </div>
        </div>
      </div>

      {/* 라인별 현황 & 제품별 비중 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-blue-600" size={24} />
              라인별 가동률
            </h3>
            <p className="text-sm text-gray-500 mt-1">최근 7일 평균</p>
          </div>
          <ChartComponent
            type="bar"
            data={getLineUtilizationData()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } }
            }}
            height={280}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TargetIcon className="text-purple-600" size={24} />
              제품별 생산 비중
            </h3>
            <p className="text-sm text-gray-500 mt-1">진행 중 작업지시 기준</p>
          </div>
          <ChartComponent
            type="doughnut"
            data={getProductMixData()}
            options={{ plugins: { legend: { position: 'bottom' } } }}
            height={280}
          />
        </div>
      </div>

      {/* 라인별 실시간 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FactoryIcon size={20} />
            라인별 현황
          </h3>
          <p className="text-green-100 text-xs mt-1">최근 7일 평균 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">라인</th>
                <th className="py-3 px-4 text-center">위치</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">일일 용량</th>
                <th className="py-3 px-4 text-center">평균 가동률</th>
                <th className="py-3 px-4 text-center">평균 불량률</th>
                <th className="py-3 px-4 text-center">설비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineStats.map((line) => (
                <tr key={line.id} className="hover:bg-green-50">
                  <td className="py-3 px-4 font-bold">{line.name}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{line.location}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(line.status)}`}>
                      {getStatusLabel(line.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{line.capacity}개</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      line.efficiency >= 95 ? 'text-green-600' :
                      line.efficiency >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {line.efficiency.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`${
                      line.defectRate <= 1.5 ? 'text-green-600' :
                      line.defectRate <= 2.0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {line.defectRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {line.runningEquipment}/{line.totalEquipment}대
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 작업 지시 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-purple-600" size={24} />
            작업 지시 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            진행중 {workOrderDashboard?.in_progress || 0}건 /
            완료 {workOrderDashboard?.completed || 0}건 /
            평균 달성률 {workOrderDashboard?.average_achievement_rate || 0}%
          </p>
        </div>

        <div className="space-y-3">
          {workOrders.slice(0, 5).map((order, idx) => {
            const progress = order.target_quantity > 0
              ? ((order.actual_quantity / order.target_quantity) * 100).toFixed(1)
              : '0';
            return (
              <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{order.order_number}</h4>
                      <p className="text-sm text-gray-600">
                        {order.product_name} · 마감: {new Date(order.planned_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'in_progress' ? '진행중' :
                     order.status === 'completed' ? '완료' :
                     order.status === 'planned' ? '계획' : order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-bold">
                      {order.actual_quantity.toLocaleString()} / {order.target_quantity.toLocaleString()}
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

      {/* 설비 상태 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ZapIcon className="text-yellow-600" size={24} />
            설비 상태 모니터링
          </h3>
          <p className="text-sm text-gray-500 mt-1">가동 현황 및 정비 일정</p>
        </div>

        <div className="space-y-3">
          {equipment.slice(0, 6).map((equip) => {
            const nextMaintenance = new Date(equip.next_maintenance);
            const isMaintenanceSoon = nextMaintenance < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={equip.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-gray-800">{equip.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(equip.status)}`}>
                      {getStatusLabel(equip.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>코드: <span className="font-medium">{equip.code}</span></span>
                    <span>전회 정비: {equip.last_maintenance || '-'}</span>
                    <span className={isMaintenanceSoon ? 'text-red-600 font-bold' : ''}>
                      차기 정비: {equip.next_maintenance || '-'}
                      {isMaintenanceSoon && ' ⚠️'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 생산 인사이트 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">생산 인사이트</h3>
        <div className="space-y-3">
          {lineStats.filter(l => l.efficiency >= 95).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">우수 성과 라인</p>
                  <p className="text-sm text-gray-600">
                    {lineStats.filter(l => l.efficiency >= 95).map(l => l.name).join(', ')}이(가)
                    95% 이상의 가동률을 달성했습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {lineStats.filter(l => l.efficiency < 90).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">개선 필요 라인</p>
                  <p className="text-sm text-gray-600">
                    {lineStats.filter(l => l.efficiency < 90).map(l => `${l.name} (${l.efficiency.toFixed(1)}%)`).join(', ')}의
                    가동률이 목표(90%) 미만입니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {equipment.filter(e => {
            const next = new Date(e.next_maintenance);
            return next < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔧</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">정비 일정 주의</p>
                  <p className="text-sm text-gray-600">
                    {equipment.filter(e => {
                      const next = new Date(e.next_maintenance);
                      return next < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    }).map(e => e.name).join(', ')}의
                    차기 정비일이 7일 이내입니다.
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
