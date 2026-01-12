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
  ActivityIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface WorkshopStatus {
  id: number;
  workshop_id: string;
  workshop_name: string;
  status: string;
  status_display: string;
  current_product: string;
  operator_count: number;
  target_output: number;
  actual_output: number;
  efficiency: string;
}

interface CycleTime {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  process_name: string;
  standard_time: string;
  actual_time: string;
  variance: string;
  variance_rate: string;
}

interface OEEMetric {
  id: number;
  equipment_id: string;
  equipment_name: string;
  availability: string;
  performance: string;
  quality: string;
  oee: string;
  target_oee: string;
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

interface WorkStandard {
  id: number;
  standard_id: string;
  title: string;
  process: string;
  version: string;
  status: string;
  status_display: string;
  standard_time: string;
  effective_date: string;
}

const Manufacturing: React.FC = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workshopData, setWorkshopData] = useState<WorkshopStatus[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<CycleTime[]>([]);
  const [oeeData, setOeeData] = useState<OEEMetric[]>([]);
  const [manpowerData, setManpowerData] = useState<ManpowerAllocation[]>([]);
  const [workStandardData, setWorkStandardData] = useState<WorkStandard[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [workshopRes, cycleRes, oeeRes, manpowerRes, standardRes] = await Promise.all([
          api.manufacturing.getWorkshopStatus(),
          api.manufacturing.getCycleTime('fiscal_year=2024&fiscal_month=12'),
          api.manufacturing.getOEEMetric('fiscal_year=2024&fiscal_month=12'),
          api.manufacturing.getManpowerAllocation(),
          api.manufacturing.getWorkStandard(),
        ]);

        setWorkshopData(Array.isArray(workshopRes) ? workshopRes : workshopRes.results || []);
        setCycleTimeData(Array.isArray(cycleRes) ? cycleRes : cycleRes.results || []);
        setOeeData(Array.isArray(oeeRes) ? oeeRes : oeeRes.results || []);
        setManpowerData(Array.isArray(manpowerRes) ? manpowerRes : manpowerRes.results || []);
        setWorkStandardData(Array.isArray(standardRes) ? standardRes : standardRes.results || []);
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
    if (workshopData.length === 0) return { avgEfficiency: 0, totalWorkers: 0, runningCount: 0 };

    const avgEfficiency = workshopData.reduce((sum, w) => sum + parseFloat(w.efficiency), 0) / workshopData.length;
    const totalWorkers = workshopData.reduce((sum, w) => sum + w.operator_count, 0);
    const runningCount = workshopData.filter(w => w.status === 'running').length;

    return { avgEfficiency, totalWorkers, runningCount };
  };

  const getOEESummary = () => {
    if (oeeData.length === 0) return { avgOee: 0, excellentCount: 0 };

    const avgOee = oeeData.reduce((sum, o) => sum + parseFloat(o.oee), 0) / oeeData.length;
    const excellentCount = oeeData.filter(o => parseFloat(o.oee) >= parseFloat(o.target_oee)).length;

    return { avgOee, excellentCount };
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'stopped':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getOEEStatusColor = (oee: number, target: number) => {
    if (oee >= target) return 'text-green-600';
    if (oee >= target * 0.9) return 'text-blue-600';
    if (oee >= target * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingState message="제조 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const kpiSummary = getKPISummary();
  const oeeSummary = getOEESummary();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={32} />
          <h1 className="text-3xl font-bold">제조 관리</h1>
        </div>
        <p className="text-indigo-100">작업장 현황과 생산 효율을 실시간으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="평균 효율"
          value={`${kpiSummary.avgEfficiency.toFixed(1)}%`}
          subtitle="목표: 85%"
          changeRate={kpiSummary.avgEfficiency - 85}
          trend={kpiSummary.avgEfficiency >= 85 ? "up" : "down"}
          color="green"
          icon={ZapIcon}
        />
        <KPICard
          title="평균 OEE"
          value={`${oeeSummary.avgOee.toFixed(1)}%`}
          subtitle="목표: 85%"
          changeRate={oeeSummary.avgOee - 85}
          trend={oeeSummary.avgOee >= 85 ? "up" : "down"}
          color="blue"
          icon={SettingsIcon}
        />
        <KPICard
          title="가동 작업장"
          value={`${kpiSummary.runningCount}/${workshopData.length}`}
          subtitle={`가동률: ${workshopData.length > 0 ? ((kpiSummary.runningCount / workshopData.length) * 100).toFixed(1) : 0}%`}
          changeRate={0}
          trend="up"
          color="purple"
          icon={FactoryIcon}
        />
        <KPICard
          title="투입 인력"
          value={`${kpiSummary.totalWorkers}`}
          subtitle="전체 작업장"
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
                ? 'bg-indigo-600 text-white shadow-md'
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
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {workshop.workshop_name}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업장별 효율 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FactoryIcon className="text-blue-600" size={24} />
              작업장별 효율
            </h3>
            <p className="text-sm text-gray-500 mt-1">현재 가동 중인 작업장</p>
          </div>

          <ChartComponent
            type="bar"
            data={getWorkshopEfficiencyChartData()}
            options={{
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true, max: 100 }
              }
            }}
            height={280}
          />
        </div>

        {/* 공정별 사이클 타임 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-purple-600" size={24} />
              공정별 사이클 타임
            </h3>
            <p className="text-sm text-gray-500 mt-1">표준 vs 실제 (단위: 초)</p>
          </div>

          <ChartComponent
            type="bar"
            data={getCycleTimeChartData()}
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

      {/* 작업장 현황 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FactoryIcon size={20} />
            작업장 현황
          </h3>
          <p className="text-indigo-100 text-xs mt-1">실시간 생산 현황</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">작업장</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">현재 제품</th>
                <th className="py-3 px-4 text-center">인력</th>
                <th className="py-3 px-4 text-center">목표</th>
                <th className="py-3 px-4 text-center">실적</th>
                <th className="py-3 px-4 text-center">효율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workshopData.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-indigo-50">
                  <td className="py-3 px-4 font-medium">{workshop.workshop_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(workshop.status)}`}>
                      {workshop.status_display}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{workshop.current_product}</td>
                  <td className="py-3 px-4 text-center">{workshop.operator_count}명</td>
                  <td className="py-3 px-4 text-center">{workshop.target_output}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{workshop.actual_output}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(workshop.efficiency) >= 90 ? 'text-green-600' :
                      parseFloat(workshop.efficiency) >= 80 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(workshop.efficiency).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 설비 OEE */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="text-yellow-600" size={24} />
            설비 종합 효율 (OEE)
          </h3>
          <p className="text-sm text-gray-500 mt-1">가동률 x 성능률 x 양품률</p>
        </div>

        <div className="space-y-3">
          {oeeData.slice(0, 5).map((equipment) => (
            <div key={equipment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{equipment.equipment_name}</h4>
                  <p className="text-sm text-gray-500">{equipment.equipment_id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getOEEStatusColor(parseFloat(equipment.oee), parseFloat(equipment.target_oee))}`}>
                    {parseFloat(equipment.oee).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">목표: {parseFloat(equipment.target_oee).toFixed(0)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">가동률</p>
                  <p className="text-lg font-bold text-blue-600">{parseFloat(equipment.availability).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">성능률</p>
                  <p className="text-lg font-bold text-purple-600">{parseFloat(equipment.performance).toFixed(1)}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">양품률</p>
                  <p className="text-lg font-bold text-green-600">{parseFloat(equipment.quality).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(equipment.oee) >= parseFloat(equipment.target_oee) ? 'bg-green-600' :
                      parseFloat(equipment.oee) >= parseFloat(equipment.target_oee) * 0.9 ? 'bg-blue-600' : 'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(equipment.oee), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인력 배치 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserIcon className="text-green-600" size={24} />
            인력 배치 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">작업장별 인력 현황</p>
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
                <tr key={item.id} className="hover:bg-green-50">
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

      {/* 작업 표준 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckIcon size={20} />
            작업 표준
          </h3>
          <p className="text-green-100 text-xs mt-1">공정별 표준 관리</p>
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
              {workStandardData.map((standard) => (
                <tr key={standard.id} className="hover:bg-green-50">
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
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">제조 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">효율 현황</p>
                <p className="text-sm text-gray-600">
                  전체 작업장 평균 효율 {kpiSummary.avgEfficiency.toFixed(1)}%로
                  {kpiSummary.avgEfficiency >= 85 ? ' 목표 달성 중입니다.' : ' 목표 대비 개선이 필요합니다.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">OEE 현황</p>
                <p className="text-sm text-gray-600">
                  {oeeData.length}개 설비 중 {oeeSummary.excellentCount}개가 목표 OEE를 달성했습니다.
                  평균 OEE는 {oeeSummary.avgOee.toFixed(1)}%입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">인력 현황</p>
                <p className="text-sm text-gray-600">
                  총 {kpiSummary.totalWorkers}명이 {workshopData.length}개 작업장에서 근무 중입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manufacturing;
