import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  SettingsIcon,
  TrendUpIcon,
  FactoryIcon,
  UserIcon,
  ZapIcon,
  CheckIcon,
  ActivityIcon,
  TargetIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface WorkshopStatus {
  id: number;
  workshop_id: string;
  workshop_name: string;
  status: string;
  status_display: string;
  current_product: string;
  current_process: string;
  operator_count: number;
  target_output: number;
  actual_output: number;
  efficiency: string;
  wip_quantity: number;
}

interface ProcessStatus {
  id: number;
  process_code: string;
  process_name: string;
  status: string;
  current_product: string;
  cycle_time: number;
  standard_cycle_time: number;
  efficiency: string;
  bottleneck: boolean;
}

interface CycleTimeAnalysis {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  process_name: string;
  standard_time: string;
  actual_time: string;
  variance: string;
  variance_rate: string;
}

interface WorkStandard {
  id: number;
  standard_id: string;
  title: string;
  process: string;
  process_code: string;
  version: string;
  status: string;
  status_display: string;
  standard_time: string;
  effective_date: string;
  last_updated: string;
}

interface WIPTracking {
  id: number;
  lot_number: string;
  product_name: string;
  current_process: string;
  quantity: number;
  process_progress: number;
  started_at: string;
  estimated_completion: string;
}

interface ManpowerAllocation {
  id: number;
  workshop: string;
  shift: string;
  shift_display: string;
  allocated_workers: number;
  present_workers: number;
  absent_workers: number;
  overtime_workers: number;
  attendance_rate: string;
}

interface QualityCheck {
  id: number;
  process: string;
  check_type: string;
  check_point: string;
  pass_rate: string;
  defect_count: number;
  inspected_count: number;
}

const Manufacturing: React.FC = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workshopData, setWorkshopData] = useState<WorkshopStatus[]>([]);
  const [processStatus, setProcessStatus] = useState<ProcessStatus[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeAnalysis[]>([]);
  const [manpowerData, setManpowerData] = useState<ManpowerAllocation[]>([]);
  const [workStandardData, setWorkStandardData] = useState<WorkStandard[]>([]);
  const [wipTracking, setWipTracking] = useState<WIPTracking[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [workshopRes, cycleRes, manpowerRes, standardRes] = await Promise.all([
          api.manufacturing.getWorkshopStatus(),
          api.manufacturing.getCycleTime('fiscal_year=2024&fiscal_month=2'),
          api.manufacturing.getManpowerAllocation(),
          api.manufacturing.getWorkStandard(),
        ]);

        setWorkshopData(Array.isArray(workshopRes) ? workshopRes : workshopRes.results || []);
        setCycleTimeData(Array.isArray(cycleRes) ? cycleRes : cycleRes.results || []);
        setManpowerData(Array.isArray(manpowerRes) ? manpowerRes : manpowerRes.results || []);
        setWorkStandardData(Array.isArray(standardRes) ? standardRes : standardRes.results || []);

        // Mock process status data
        setProcessStatus([
          { id: 1, process_code: 'P01', process_name: '프레스', status: 'running', current_product: '제품A', cycle_time: 45, standard_cycle_time: 42, efficiency: '93.3', bottleneck: false },
          { id: 2, process_code: 'P02', process_name: '용접', status: 'running', current_product: '제품A', cycle_time: 68, standard_cycle_time: 65, efficiency: '95.6', bottleneck: true },
          { id: 3, process_code: 'P03', process_name: '도장', status: 'running', current_product: '제품B', cycle_time: 35, standard_cycle_time: 35, efficiency: '100.0', bottleneck: false },
          { id: 4, process_code: 'P04', process_name: '조립', status: 'idle', current_product: '', cycle_time: 0, standard_cycle_time: 55, efficiency: '0', bottleneck: false },
          { id: 5, process_code: 'P05', process_name: '검사', status: 'running', current_product: '제품A', cycle_time: 22, standard_cycle_time: 20, efficiency: '90.9', bottleneck: false },
          { id: 6, process_code: 'P06', process_name: '포장', status: 'maintenance', current_product: '', cycle_time: 0, standard_cycle_time: 18, efficiency: '0', bottleneck: false },
        ]);

        // Mock WIP tracking data
        setWipTracking([
          { id: 1, lot_number: 'LOT-2024-0224-001', product_name: '제품A', current_process: '용접', quantity: 500, process_progress: 60, started_at: '2024-02-24 08:00', estimated_completion: '2024-02-24 14:00' },
          { id: 2, lot_number: 'LOT-2024-0224-002', product_name: '제품B', current_process: '프레스', quantity: 300, process_progress: 40, started_at: '2024-02-24 09:00', estimated_completion: '2024-02-24 15:00' },
          { id: 3, lot_number: 'LOT-2024-0224-003', product_name: '제품C', current_process: '도장', quantity: 200, process_progress: 80, started_at: '2024-02-24 07:00', estimated_completion: '2024-02-24 12:00' },
        ]);

        // Mock quality check data
        setQualityChecks([
          { id: 1, process: '프레스', check_type: '치수검사', check_point: '외경', pass_rate: '98.5', defect_count: 15, inspected_count: 1000 },
          { id: 2, process: '용접', check_type: '비파괴검사', check_point: '용접상태', pass_rate: '97.2', defect_count: 28, inspected_count: 1000 },
          { id: 3, process: '도장', check_type: '외관검사', check_point: '도장면', pass_rate: '99.1', defect_count: 9, inspected_count: 1000 },
          { id: 4, process: '조립', check_type: '기능검사', check_point: '작동성', pass_rate: '99.5', defect_count: 5, inspected_count: 1000 },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 작업장별 효율 차트 데이터
  const getWorkshopEfficiencyChartData = () => {
    return {
      labels: workshopData.map(w => w.workshop_name),
      datasets: [{
        label: '효율 (%)',
        data: workshopData.map(w => parseFloat(w.efficiency)),
        backgroundColor: workshopData.map(w =>
          parseFloat(w.efficiency) >= 90 ? '#10b981' :
          parseFloat(w.efficiency) >= 80 ? '#3b82f6' : '#f59e0b'
        ),
        borderWidth: 0
      }]
    };
  };

  // 공정별 사이클 타임 차트 데이터
  const getCycleTimeChartData = () => {
    const uniqueProcesses = [...new Set(cycleTimeData.map(c => c.process_name))];
    return {
      labels: uniqueProcesses,
      datasets: [
        {
          label: '표준 시간 (초)',
          data: uniqueProcesses.map(p => {
            const item = cycleTimeData.find(c => c.process_name === p);
            return item ? parseFloat(item.standard_time) : 0;
          }),
          backgroundColor: 'rgba(148, 163, 184, 0.5)',
          borderColor: '#94a3b8',
          borderWidth: 2
        },
        {
          label: '실제 시간 (초)',
          data: uniqueProcesses.map(p => {
            const item = cycleTimeData.find(c => c.process_name === p);
            return item ? parseFloat(item.actual_time) : 0;
          }),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2
        }
      ]
    };
  };

  // WIP 추이 차트
  const getWipTrendChart = () => {
    return {
      labels: ['프레스', '용접', '도장', '조립', '검사', '포장'],
      datasets: [{
        label: 'WIP 수량',
        data: [120, 85, 95, 60, 45, 30],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
        borderWidth: 0
      }]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'stopped':
      case 'idle':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-blue-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingState message="공정 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const avgEfficiency = workshopData.length > 0
    ? workshopData.reduce((sum, w) => sum + parseFloat(w.efficiency), 0) / workshopData.length
    : 0;
  const runningCount = workshopData.filter(w => w.status === 'running').length;
  const totalWIP = workshopData.reduce((sum, w) => sum + (w.wip_quantity || 0), 0);
  const totalManpower = manpowerData.reduce((sum, m) => sum + m.present_workers, 0);
  const bottleneckCount = processStatus.filter(p => p.bottleneck).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FactoryIcon size={32} />
          <h1 className="text-3xl font-bold">제조관리</h1>
        </div>
        <p className="text-teal-100">공정 실시간 현황과 작업장 운영을 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="공정 효율"
          value={`${avgEfficiency.toFixed(1)}%`}
          subtitle="전체 작업장 평균"
          changeRate={avgEfficiency - 85}
          trend={avgEfficiency >= 85 ? "up" : "down"}
          color="green"
          icon={ZapIcon}
        />
        <KPICard
          title="가동 작업장"
          value={`${runningCount}/${workshopData.length}`}
          subtitle={`가동률: ${workshopData.length > 0 ? ((runningCount / workshopData.length) * 100).toFixed(1) : 0}%`}
          changeRate={0}
          trend="up"
          color="blue"
          icon={FactoryIcon}
        />
        <KPICard
          title="WIP 재고"
          value={totalWIP.toLocaleString()}
          subtitle="공정중 재고"
          unit="개"
          changeRate={0}
          trend="stable"
          color="purple"
          icon={ActivityIcon}
        />
        <KPICard
          title="투입 인력"
          value={totalManpower.toString()}
          subtitle="현 근무자"
          unit="명"
          changeRate={0}
          trend="stable"
          color="yellow"
          icon={UserIcon}
        />
      </div>

      {/* 작업장 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedWorkshop('all')}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedWorkshop === 'all'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {workshopData.map((workshop) => (
            <button
              key={workshop.workshop_id}
              onClick={() => setSelectedWorkshop(workshop.workshop_id)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedWorkshop === workshop.workshop_id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {workshop.workshop_name}
            </button>
          ))}
        </div>
      </div>

      {/* 공정 실시간 현황 & WIP 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 공정 실시간 현황 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ZapIcon className="text-green-600" size={24} />
              공정 실시간 현황
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              병목: {bottleneckCount}개 공정
            </p>
          </div>

          <div className="space-y-3">
            {processStatus.map((process) => (
              <div key={process.id} className={`border rounded-lg p-4 ${process.bottleneck ? 'border-red-300 bg-red-50' : 'hover:shadow-md'} transition-shadow`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                      process.status === 'running' ? 'bg-green-600' :
                      process.status === 'idle' ? 'bg-gray-400' :
                      'bg-yellow-600'
                    }`}>
                      {process.process_code.slice(-1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        {process.process_name}
                        {process.bottleneck && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">병목</span>}
                      </h4>
                      <p className="text-sm text-gray-600">{process.current_product || '대기중'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(process.status)}`}>
                    {process.status === 'running' ? '가동중' :
                     process.status === 'idle' ? '대기' :
                     process.status === 'maintenance' ? '정비' : process.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 rounded p-2">
                    <span className="text-gray-600">표준: </span>
                    <span className="font-medium">{process.standard_cycle_time}초</span>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <span className="text-gray-600">실제: </span>
                    <span className={`font-bold ${getEfficiencyColor(parseFloat(process.efficiency))}`}>
                      {process.cycle_time}초
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">공정 효율</span>
                    <span className={`font-bold ${getEfficiencyColor(parseFloat(process.efficiency))}`}>
                      {process.efficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        parseFloat(process.efficiency) >= 90 ? 'bg-green-600' :
                        parseFloat(process.efficiency) >= 80 ? 'bg-blue-600' :
                        'bg-yellow-600'
                      }`}
                      style={{ width: `${Math.min(parseFloat(process.efficiency), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIP 추이 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-purple-600" size={24} />
              WIP 추이
            </h3>
            <p className="text-sm text-gray-500 mt-1">공정별 재공품 수량</p>
          </div>

          <ChartComponent
            type="bar"
            data={getWipTrendChart()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
            height={200}
          />

          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm">진행 중 LOT</h4>
            {wipTracking.map((wip) => (
              <div key={wip.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-800">{wip.lot_number}</span>
                    <span className="text-sm text-gray-600 ml-2">· {wip.product_name}</span>
                  </div>
                  <span className="text-sm text-purple-600 font-medium">{wip.current_process}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${wip.process_progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{wip.process_progress}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>시작: {wip.started_at}</span>
                  <span>예정: {wip.estimated_completion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 작업장 현황 & 사이클타임 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업장별 효율 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FactoryIcon className="text-blue-600" size={24} />
              작업장별 효율
            </h3>
            <p className="text-sm text-gray-500 mt-1">실시간 가동 현황</p>
          </div>

          <ChartComponent
            type="bar"
            data={getWorkshopEfficiencyChartData()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } }
            }}
            height={250}
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3 text-left">작업장</th>
                  <th className="py-2 px-3 text-center">상태</th>
                  <th className="py-2 px-3 text-center">현재공정</th>
                  <th className="py-2 px-3 text-center">인력</th>
                  <th className="py-2 px-3 text-center">생산</th>
                  <th className="py-2 px-3 text-center">WIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workshopData.slice(0, 5).map((workshop) => (
                  <tr key={workshop.id} className="hover:bg-blue-50">
                    <td className="py-2 px-3 font-medium">{workshop.workshop_name}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(workshop.status)}`}>
                        {workshop.status_display}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">{workshop.current_process || '-'}</td>
                    <td className="py-2 px-3 text-center">{workshop.operator_count}명</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${getEfficiencyColor(parseFloat(workshop.efficiency))}`}>
                        {parseFloat(workshop.efficiency).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">{workshop.wip_quantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 공정별 사이클 타임 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TargetIcon className="text-orange-600" size={24} />
              공정별 사이클 타임
            </h3>
            <p className="text-sm text-gray-500 mt-1">표준 vs 실제 (단위: 초)</p>
          </div>

          <ChartComponent
            type="bar"
            data={getCycleTimeChartData()}
            options={{
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }}
            height={250}
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3 text-left">공정</th>
                  <th className="py-2 px-3 text-center">표준</th>
                  <th className="py-2 px-3 text-center">실제</th>
                  <th className="py-2 px-3 text-center">편차</th>
                  <th className="py-2 px-3 text-center">편차율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cycleTimeData.slice(0, 6).map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-orange-50">
                    <td className="py-2 px-3 font-medium">{cycle.process_name}</td>
                    <td className="py-2 px-3 text-center">{parseFloat(cycle.standard_time).toFixed(1)}s</td>
                    <td className="py-2 px-3 text-center font-bold">{parseFloat(cycle.actual_time).toFixed(1)}s</td>
                    <td className={`py-2 px-3 text-center font-bold ${
                      parseFloat(cycle.variance) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {parseFloat(cycle.variance) > 0 ? '+' : ''}{parseFloat(cycle.variance).toFixed(1)}s
                    </td>
                    <td className={`py-2 px-3 text-center font-bold ${
                      Math.abs(parseFloat(cycle.variance_rate)) > 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {parseFloat(cycle.variance_rate) > 0 ? '+' : ''}{parseFloat(cycle.variance_rate).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 인력 배치 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-teal-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <UserIcon size={20} />
            인력 배치 현황
          </h3>
          <p className="text-teal-100 text-xs mt-1">작업장별 인력 현황</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">작업장</th>
                <th className="py-3 px-4 text-center">근무조</th>
                <th className="py-3 px-4 text-center">배치</th>
                <th className="py-3 px-4 text-center">출근</th>
                <th className="py-3 px-4 text-center">결근</th>
                <th className="py-3 px-4 text-center">초과근무</th>
                <th className="py-3 px-4 text-center">출근률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manpowerData.map((item) => (
                <tr key={item.id} className="hover:bg-teal-50">
                  <td className="py-3 px-4 font-medium">{item.workshop}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.shift === 'day' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {item.shift_display}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{item.allocated_workers}명</td>
                  <td className="py-3 px-4 text-center text-green-600 font-medium">{item.present_workers}명</td>
                  <td className="py-3 px-4 text-center text-red-600">{item.absent_workers}명</td>
                  <td className="py-3 px-4 text-center text-blue-600">{item.overtime_workers}명</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(item.attendance_rate) >= 95 ? 'text-green-600' :
                      parseFloat(item.attendance_rate) >= 90 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(item.attendance_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 공정별 품질 검사 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-green-600" size={24} />
            공정별 품질 검사
          </h3>
          <p className="text-sm text-gray-500 mt-1">실시간 합격률 모니터링</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {qualityChecks.map((check) => (
            <div key={check.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800">{check.process}</h4>
                <span className={`text-2xl font-bold ${
                  parseFloat(check.pass_rate) >= 99 ? 'text-green-600' :
                  parseFloat(check.pass_rate) >= 97 ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {parseFloat(check.pass_rate).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{check.check_type} - {check.check_point}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">검사: {check.inspected_count.toLocaleString()}</span>
                <span className="text-red-600">불량: {check.defect_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 작업 표준 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <SettingsIcon size={20} />
            작업 표준
          </h3>
          <p className="text-purple-100 text-xs mt-1">공정별 표준 관리</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">표준 번호</th>
                <th className="py-3 px-4 text-left">제목</th>
                <th className="py-3 px-4 text-center">공정</th>
                <th className="py-3 px-4 text-center">버전</th>
                <th className="py-3 px-4 text-center">표준 시간</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">적용일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workStandardData.slice(0, 6).map((standard) => (
                <tr key={standard.id} className="hover:bg-purple-50">
                  <td className="py-3 px-4 font-medium">{standard.standard_id}</td>
                  <td className="py-3 px-4">{standard.title}</td>
                  <td className="py-3 px-4 text-center">{standard.process}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      v{standard.version}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{parseFloat(standard.standard_time).toFixed(1)}초</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      standard.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {standard.status_display}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{standard.effective_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 제조 인사이트 */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">제조 인사이트</h3>
        <div className="space-y-3">
          {bottleneckCount > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">병목 공정 관리</p>
                  <p className="text-sm text-gray-600">
                    {processStatus.filter(p => p.bottleneck).map(p => p.process_name).join(', ')}이(가)
                    병목 공정으로 식별되었습니다. 용량 증대나 공정 최적화를 검토하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {avgEfficiency < 85 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">효율 개선 필요</p>
                  <p className="text-sm text-gray-600">
                    전체 평균 효율 {avgEfficiency.toFixed(1)}%로 목표(85%) 미달입니다.
                    사이클 타임 분석을 통해 개선 기회를 찾아보세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {totalWIP > 400 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">WIP 수준 관리</p>
                  <p className="text-sm text-gray-600">
                    현재 총 WIP {totalWIP}개로 높은 수준입니다.
                    리드타임 단축을 위해 WIP 감축을 고려하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {qualityChecks.filter(q => parseFloat(q.pass_rate) < 98).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">품질 검사 강화</p>
                  <p className="text-sm text-gray-600">
                    {qualityChecks.filter(q => parseFloat(q.pass_rate) < 98).map(q => q.process).join(', ')}의
                    합격률이 98% 미달입니다. 검사 기준 강화가 필요합니다.
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

export default Manufacturing;
