import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  TrendUpIcon,
  FactoryIcon,
  ActivityIcon,
  TargetIcon,
  ZapIcon,
  UserIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface HourlyProduction {
  id: number;
  production_date: string;
  hour: number;
  line_id: string;
  line_name: string;
  target_output: number;
  actual_output: number;
  achievement_rate: string;
}

interface LineUtilization {
  id: number;
  line_id: string;
  line_name: string;
  planned_time: string;
  actual_time: string;
  downtime: string;
  utilization_rate: string;
  target_rate: string;
}

interface WorkerProductivity {
  id: number;
  worker_id: string;
  worker_name: string;
  department: string;
  work_hours: string;
  output_quantity: number;
  productivity: string;
  target_productivity: string;
  achievement_rate: string;
}

interface OEEComponent {
  id: number;
  line_id: string;
  line_name: string;
  availability: string;
  availability_target: string;
  performance: string;
  performance_target: string;
  quality_rate: string;
  quality_target: string;
  oee: string;
  oee_target: string;
}

interface DailySummary {
  id: number;
  production_date: string;
  total_target: number;
  total_actual: number;
  total_defects: number;
  overall_efficiency: string;
  defect_rate: string;
  active_lines: number;
  total_workers: number;
}

const Productivity: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hourlyData, setHourlyData] = useState<HourlyProduction[]>([]);
  const [lineUtilData, setLineUtilData] = useState<LineUtilization[]>([]);
  const [workerData, setWorkerData] = useState<WorkerProductivity[]>([]);
  const [oeeData, setOeeData] = useState<OEEComponent[]>([]);
  const [dailySummaryData, setDailySummaryData] = useState<DailySummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [hourlyRes, lineRes, workerRes, oeeRes, summaryRes] = await Promise.all([
          api.productivity.getHourlyProduction(),
          api.productivity.getLineUtilization('fiscal_year=2024&fiscal_month=12'),
          api.productivity.getWorkerProductivity('fiscal_year=2024&fiscal_month=12'),
          api.productivity.getOEEComponent('fiscal_year=2024&fiscal_month=12'),
          api.productivity.getDailySummary(),
        ]);

        setHourlyData(Array.isArray(hourlyRes) ? hourlyRes : hourlyRes.results || []);
        setLineUtilData(Array.isArray(lineRes) ? lineRes : lineRes.results || []);
        setWorkerData(Array.isArray(workerRes) ? workerRes : workerRes.results || []);
        setOeeData(Array.isArray(oeeRes) ? oeeRes : oeeRes.results || []);
        setDailySummaryData(Array.isArray(summaryRes) ? summaryRes : summaryRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // KPI 요약 계산
  const getKPISummary = () => {
    if (dailySummaryData.length === 0) return { avgEfficiency: 0, avgDefectRate: 0, totalWorkers: 0 };

    const latestSummary = dailySummaryData[0];
    const avgEfficiency = parseFloat(latestSummary.overall_efficiency);
    const avgDefectRate = parseFloat(latestSummary.defect_rate);
    const totalWorkers = latestSummary.total_workers;

    return { avgEfficiency, avgDefectRate, totalWorkers };
  };

  const getOEESummary = () => {
    if (oeeData.length === 0) return { avgOee: 0, avgAvailability: 0, avgPerformance: 0, avgQuality: 0 };

    const avgOee = oeeData.reduce((sum, o) => sum + parseFloat(o.oee), 0) / oeeData.length;
    const avgAvailability = oeeData.reduce((sum, o) => sum + parseFloat(o.availability), 0) / oeeData.length;
    const avgPerformance = oeeData.reduce((sum, o) => sum + parseFloat(o.performance), 0) / oeeData.length;
    const avgQuality = oeeData.reduce((sum, o) => sum + parseFloat(o.quality_rate), 0) / oeeData.length;

    return { avgOee, avgAvailability, avgPerformance, avgQuality };
  };

  // 시간당 생산량 차트 데이터
  const getHourlyChartData = () => {
    const hours = [...new Set(hourlyData.map(h => h.hour))].sort((a, b) => a - b);
    const targetByHour = hours.map(hour => {
      const items = hourlyData.filter(h => h.hour === hour);
      return items.reduce((sum, i) => sum + i.target_output, 0);
    });
    const actualByHour = hours.map(hour => {
      const items = hourlyData.filter(h => h.hour === hour);
      return items.reduce((sum, i) => sum + i.actual_output, 0);
    });

    return {
      labels: hours.map(h => `${h}시`),
      datasets: [
        {
          label: '목표',
          data: targetByHour,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0
        },
        {
          label: '실제',
          data: actualByHour,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 라인별 가동률 차트 데이터
  const getLineUtilChartData = () => {
    return {
      labels: lineUtilData.map(l => l.line_name),
      datasets: [{
        label: '가동률 (%)',
        data: lineUtilData.map(l => parseFloat(l.utilization_rate)),
        backgroundColor: lineUtilData.map(l =>
          parseFloat(l.utilization_rate) >= parseFloat(l.target_rate) ? '#10b981' : '#f59e0b'
        ),
        borderWidth: 0
      }]
    };
  };

  // 작업자 생산성 차트 데이터
  const getWorkerChartData = () => {
    const topWorkers = workerData.slice(0, 10);
    return {
      labels: topWorkers.map(w => w.worker_name),
      datasets: [{
        label: '생산성 (개/시간)',
        data: topWorkers.map(w => parseFloat(w.productivity)),
        backgroundColor: '#8b5cf6',
        borderWidth: 0
      }]
    };
  };

  if (loading) {
    return <LoadingState message="생산성 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const kpiSummary = getKPISummary();
  const oeeSummary = getOEESummary();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">생산성 분석</h1>
        </div>
        <p className="text-cyan-100">생산 효율과 작업자 생산성을 분석합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="종합 효율"
          value={`${kpiSummary.avgEfficiency.toFixed(1)}%`}
          subtitle="목표: 100%"
          changeRate={kpiSummary.avgEfficiency - 100}
          trend={kpiSummary.avgEfficiency >= 100 ? "up" : "down"}
          color="green"
          icon={TrendUpIcon}
        />
        <KPICard
          title="평균 OEE"
          value={`${oeeSummary.avgOee.toFixed(1)}%`}
          subtitle="목표: 85%"
          changeRate={oeeSummary.avgOee - 85}
          trend={oeeSummary.avgOee >= 85 ? "up" : "down"}
          color="blue"
          icon={ZapIcon}
        />
        <KPICard
          title="불량률"
          value={`${kpiSummary.avgDefectRate.toFixed(2)}%`}
          subtitle="목표: < 2%"
          changeRate={kpiSummary.avgDefectRate}
          trend={kpiSummary.avgDefectRate <= 2 ? "up" : "down"}
          color="yellow"
          icon={TargetIcon}
        />
        <KPICard
          title="투입 인력"
          value={`${kpiSummary.totalWorkers}`}
          subtitle="금일 기준"
          unit="명"
          changeRate={0}
          trend="stable"
          color="purple"
          icon={UserIcon}
        />
      </div>

      {/* 시간당 생산량 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-blue-600" size={24} />
            시간당 생산량
          </h3>
          <p className="text-sm text-gray-500 mt-1">금일 시간대별 생산 현황</p>
        </div>

        <ChartComponent
          type="line"
          data={getHourlyChartData()}
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

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 라인별 가동률 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FactoryIcon className="text-green-600" size={24} />
              라인별 가동률
            </h3>
            <p className="text-sm text-gray-500 mt-1">생산 라인 가동 현황</p>
          </div>

          <ChartComponent
            type="bar"
            data={getLineUtilChartData()}
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

        {/* 작업자 생산성 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <UserIcon className="text-purple-600" size={24} />
              작업자 생산성 TOP 10
            </h3>
            <p className="text-sm text-gray-500 mt-1">시간당 생산량 기준</p>
          </div>

          <ChartComponent
            type="bar"
            data={getWorkerChartData()}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { beginAtZero: true }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* OEE 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ZapIcon className="text-yellow-600" size={24} />
            라인별 OEE 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">설비종합효율 (가동률 x 성능률 x 양품률)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oeeData.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">{item.line_name}</h4>
                <span className={`text-2xl font-bold ${
                  parseFloat(item.oee) >= parseFloat(item.oee_target) ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {parseFloat(item.oee).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">가동률</span>
                  <span className={`font-medium ${
                    parseFloat(item.availability) >= parseFloat(item.availability_target) ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {parseFloat(item.availability).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">성능률</span>
                  <span className={`font-medium ${
                    parseFloat(item.performance) >= parseFloat(item.performance_target) ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {parseFloat(item.performance).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">양품률</span>
                  <span className={`font-medium ${
                    parseFloat(item.quality_rate) >= parseFloat(item.quality_target) ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {parseFloat(item.quality_rate).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(item.oee) >= parseFloat(item.oee_target) ? 'bg-green-600' : 'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min(parseFloat(item.oee), 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">목표: {parseFloat(item.oee_target).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 라인 가동 현황 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-cyan-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FactoryIcon size={20} />
            라인 가동 현황
          </h3>
          <p className="text-cyan-100 text-xs mt-1">12월 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">라인</th>
                <th className="py-3 px-4 text-center">계획시간</th>
                <th className="py-3 px-4 text-center">실제시간</th>
                <th className="py-3 px-4 text-center">가동중단</th>
                <th className="py-3 px-4 text-center">가동률</th>
                <th className="py-3 px-4 text-center">목표</th>
                <th className="py-3 px-4 text-center">달성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineUtilData.map((line) => (
                <tr key={line.id} className="hover:bg-cyan-50">
                  <td className="py-3 px-4 font-medium">{line.line_name}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(line.planned_time).toFixed(1)}h</td>
                  <td className="py-3 px-4 text-center">{parseFloat(line.actual_time).toFixed(1)}h</td>
                  <td className="py-3 px-4 text-center text-red-600">{parseFloat(line.downtime).toFixed(1)}h</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(line.utilization_rate) >= parseFloat(line.target_rate) ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(line.utilization_rate).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">{parseFloat(line.target_rate).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-center">
                    {parseFloat(line.utilization_rate) >= parseFloat(line.target_rate) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">달성</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">미달</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 작업자 생산성 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <UserIcon size={20} />
            작업자 생산성 현황
          </h3>
          <p className="text-purple-100 text-xs mt-1">12월 기준</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">사번</th>
                <th className="py-3 px-4 text-left">이름</th>
                <th className="py-3 px-4 text-center">부서</th>
                <th className="py-3 px-4 text-center">근무시간</th>
                <th className="py-3 px-4 text-center">생산량</th>
                <th className="py-3 px-4 text-center">생산성</th>
                <th className="py-3 px-4 text-center">달성률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workerData.slice(0, 10).map((worker) => (
                <tr key={worker.id} className="hover:bg-purple-50">
                  <td className="py-3 px-4 font-medium">{worker.worker_id}</td>
                  <td className="py-3 px-4">{worker.worker_name}</td>
                  <td className="py-3 px-4 text-center">{worker.department}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(worker.work_hours).toFixed(1)}h</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{worker.output_quantity}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(worker.productivity).toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(worker.achievement_rate) >= 100 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(worker.achievement_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생산성 인사이트 */}
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">생산성 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">종합 효율</p>
                <p className="text-sm text-gray-600">
                  금일 종합 효율 {kpiSummary.avgEfficiency.toFixed(1)}%로
                  {kpiSummary.avgEfficiency >= 100 ? ' 목표를 달성했습니다.' : ' 목표 대비 개선이 필요합니다.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">OEE 현황</p>
                <p className="text-sm text-gray-600">
                  평균 OEE {oeeSummary.avgOee.toFixed(1)}% (가동률 {oeeSummary.avgAvailability.toFixed(1)}%,
                  성능률 {oeeSummary.avgPerformance.toFixed(1)}%, 양품률 {oeeSummary.avgQuality.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">품질 현황</p>
                <p className="text-sm text-gray-600">
                  불량률 {kpiSummary.avgDefectRate.toFixed(2)}%로
                  {kpiSummary.avgDefectRate <= 2 ? ' 목표 범위 내입니다.' : ' 개선이 필요합니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Productivity;
