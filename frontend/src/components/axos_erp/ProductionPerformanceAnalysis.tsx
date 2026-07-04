import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Users,
  Award,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Filter,
  Download,
  Factory,
  Zap
} from 'lucide-react';

// 생산실적 인터페이스
interface ProductionPerformance {
  id: string;
  production_date: string;
  shift: 'DAY' | 'NIGHT' | 'MIXED';
  fac_cd: string;
  fac_nm: string;
  line_cd: string;
  line_nm: string;
  item_cd: string;
  item_nm: string;
  plan_qty: number;
  actual_qty: number;
  defect_qty: number;
  good_qty: number;
  achievement_rate: number;
  defect_rate: number;
  downtime_minutes: number;
  operator_count: number;
  work_hours: number;
}

// 설비 가동률 인터페이스
interface EquipmentPerformance {
  equip_cd: string;
  equip_nm: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  target_oee: number;
}

// 작업자 성과 인터페이스
interface WorkerPerformance {
  worker_id: string;
  worker_nm: string;
  team_cd: string;
  team_nm: string;
  production_qty: number;
  defect_qty: number;
  quality_rate: number;
  efficiency: number;
  work_hours: number;
  rank: number;
}

const ProductionPerformanceAnalysis: React.FC = () => {
  const [performances, setPerformances] = useState<ProductionPerformance[]>([]);
  const [equipmentPerformance, setEquipmentPerformance] = useState<EquipmentPerformance[]>([]);
  const [workerPerformance, setWorkerPerformance] = useState<WorkerPerformance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'worker'>('overview');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalPlanQty: 0,
    totalActualQty: 0,
    totalAchievementRate: 0,
    avgDefectRate: 0,
    totalOEE: 0,
    bestLine: { nm: '', rate: 0 },
    topWorker: { nm: '', qty: 0 }
  });

  // 데모 데이터 생성
  useEffect(() => {
    const demoPerformances: ProductionPerformance[] = [
      {
        id: 'PP001',
        production_date: '2024-01-15',
        shift: 'DAY',
        fac_cd: 'FAC001',
        fac_nm: '제1공장',
        line_cd: 'LINE01',
        line_nm: '라인 A',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        plan_qty: 1000,
        actual_qty: 950,
        defect_qty: 15,
        good_qty: 935,
        achievement_rate: 95.0,
        defect_rate: 1.58,
        downtime_minutes: 30,
        operator_count: 5,
        work_hours: 8
      },
      {
        id: 'PP002',
        production_date: '2024-01-15',
        shift: 'DAY',
        fac_cd: 'FAC001',
        fac_nm: '제1공장',
        line_cd: 'LINE02',
        line_nm: '라인 B',
        item_cd: 'FP-002',
        item_nm: '완제품-B',
        plan_qty: 800,
        actual_qty: 820,
        defect_qty: 8,
        good_qty: 812,
        achievement_rate: 102.5,
        defect_rate: 0.98,
        downtime_minutes: 15,
        operator_count: 4,
        work_hours: 8
      },
      {
        id: 'PP003',
        production_date: '2024-01-15',
        shift: 'NIGHT',
        fac_cd: 'FAC002',
        fac_nm: '제2공장',
        line_cd: 'LINE03',
        line_nm: '라인 C',
        item_cd: 'SA-001',
        item_nm: '반조립-1',
        plan_qty: 600,
        actual_qty: 550,
        defect_qty: 25,
        good_qty: 525,
        achievement_rate: 91.7,
        defect_rate: 4.55,
        downtime_minutes: 60,
        operator_count: 3,
        work_hours: 8
      },
      {
        id: 'PP004',
        production_date: '2024-01-14',
        shift: 'DAY',
        fac_cd: 'FAC001',
        fac_nm: '제1공장',
        line_cd: 'LINE01',
        line_nm: '라인 A',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        plan_qty: 1000,
        actual_qty: 980,
        defect_qty: 10,
        good_qty: 970,
        achievement_rate: 98.0,
        defect_rate: 1.02,
        downtime_minutes: 20,
        operator_count: 5,
        work_hours: 8
      }
    ];

    const demoEquipmentPerformance: EquipmentPerformance[] = [
      {
        equip_cd: 'M-001',
        equip_nm: 'CNC 가공기 #1',
        availability: 92.5,
        performance: 88.0,
        quality: 95.5,
        oee: 77.8,
        target_oee: 80.0
      },
      {
        equip_cd: 'M-002',
        equip_nm: '프레스 기계 #1',
        availability: 95.0,
        performance: 92.5,
        quality: 97.0,
        oee: 85.1,
        target_oee: 85.0
      },
      {
        equip_cd: 'I-001',
        equip_nm: '비전 검사기',
        availability: 88.0,
        performance: 85.5,
        quality: 99.5,
        oee: 74.9,
        target_oee: 85.0
      },
      {
        equip_cd: 'P-001',
        equip_nm: '자동 포장기',
        availability: 97.5,
        performance: 94.0,
        quality: 98.5,
        oee: 90.4,
        target_oee: 90.0
      }
    ];

    const demoWorkerPerformance: WorkerPerformance[] = [
      {
        worker_id: 'W001',
        worker_nm: '김철수',
        team_cd: 'TEAM01',
        team_nm: '생산1팀',
        production_qty: 1200,
        defect_qty: 5,
        quality_rate: 99.58,
        efficiency: 105.5,
        work_hours: 8,
        rank: 1
      },
      {
        worker_id: 'W002',
        worker_nm: '이영희',
        team_cd: 'TEAM01',
        team_nm: '생산1팀',
        production_qty: 1150,
        defect_qty: 8,
        quality_rate: 99.30,
        efficiency: 102.3,
        work_hours: 8,
        rank: 2
      },
      {
        worker_id: 'W003',
        worker_nm: '박민수',
        team_cd: 'TEAM02',
        team_nm: '생산2팀',
        production_qty: 1100,
        defect_qty: 12,
        quality_rate: 98.91,
        efficiency: 98.5,
        work_hours: 8,
        rank: 3
      },
      {
        worker_id: 'W004',
        worker_nm: '최수진',
        team_cd: 'TEAM02',
        team_nm: '생산2팀',
        production_qty: 1080,
        defect_qty: 10,
        quality_rate: 99.07,
        efficiency: 97.2,
        work_hours: 8,
        rank: 4
      }
    ];

    setPerformances(demoPerformances);
    setEquipmentPerformance(demoEquipmentPerformance);
    setWorkerPerformance(demoWorkerPerformance);

    // 통계 계산
    const totalPlanQty = demoPerformances.reduce((sum, p) => sum + p.plan_qty, 0);
    const totalActualQty = demoPerformances.reduce((sum, p) => sum + p.actual_qty, 0);
    const avgDefectRate = demoPerformances.reduce((sum, p) => sum + p.defect_rate, 0) / demoPerformances.length;
    const avgOEE = demoEquipmentPerformance.reduce((sum, e) => sum + e.oee, 0) / demoEquipmentPerformance.length;

    const bestLine = demoPerformances.reduce((best, p) =>
      p.achievement_rate > best.rate ? { nm: p.line_nm, rate: p.achievement_rate } : best,
      { nm: '', rate: 0 }
    );

    const topWorker = demoWorkerPerformance[0];

    setStats({
      totalPlanQty,
      totalActualQty,
      totalAchievementRate: (totalActualQty / totalPlanQty) * 100,
      avgDefectRate,
      totalOEE: avgOEE,
      bestLine,
      topWorker: { nm: topWorker.worker_nm, qty: topWorker.production_qty }
    });
  }, []);

  // 필터링된 생산실적
  const filteredPerformances = performances.filter(p =>
    p.item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.line_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fac_nm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 시간대별 뱃지
  const getShiftBadge = (shift: string) => {
    const styles = {
      DAY: 'bg-yellow-100 text-yellow-800',
      NIGHT: 'bg-indigo-100 text-indigo-800',
      MIXED: 'bg-gray-100 text-gray-800'
    };
    return styles[shift as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">생산실적/성과 분석</h1>
        <p className="text-gray-600">생산 실적, 설비 OEE 및 작업자 성과 분석</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">계획 대비</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAchievementRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalActualQty.toLocaleString()} / {stats.totalPlanQty.toLocaleString()}
              </p>
            </div>
            <Target className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 불량률</p>
              <p className="text-2xl font-bold text-red-600">{stats.avgDefectRate.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">목표: 1.5% 이하</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 OEE</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalOEE.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">목표: 85% 이상</p>
            </div>
            <Activity className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">최우수 라인</p>
              <p className="text-lg font-bold text-purple-600">{stats.bestLine.nm}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.bestLine.rate.toFixed(1)}% 달성</p>
            </div>
            <Award className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">최우수 작업자</p>
              <p className="text-lg font-bold text-orange-600">{stats.topWorker.nm}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.topWorker.qty.toLocaleString()} 개 생산</p>
            </div>
            <Users className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* 작업 바 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              생산 실적
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'equipment'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              설비 OEE
            </button>
            <button
              onClick={() => setActiveTab('worker')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'worker'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              작업자 성과
            </button>
          </nav>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'overview' ? '라인/품목 검색...' :
                            activeTab === 'equipment' ? '설비 검색...' : '작업자 검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                필터
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 생산 실적 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 생산 실적 테이블 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">일자</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">시간대</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">공장/라인</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">계획</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">실적</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">양품</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">달성률</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">불량률</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">가동시간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformances.map((perf) => (
                    <tr key={perf.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {perf.production_date}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftBadge(perf.shift)}`}>
                          {perf.shift === 'DAY' ? '주간' : perf.shift === 'NIGHT' ? '야간' : '혼합'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{perf.fac_nm}</span>
                          </div>
                          <div className="text-sm text-gray-500">{perf.line_nm}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{perf.item_nm}</div>
                          <div className="text-sm text-gray-500">{perf.item_cd}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {perf.plan_qty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {perf.actual_qty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {perf.good_qty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                perf.achievement_rate >= 100 ? 'bg-green-600' :
                                perf.achievement_rate >= 90 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(perf.achievement_rate, 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            perf.achievement_rate >= 100 ? 'text-green-600' :
                            perf.achievement_rate >= 90 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {perf.achievement_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${
                          perf.defect_rate <= 1.5 ? 'text-green-600' :
                          perf.defect_rate <= 3.0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {perf.defect_rate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {perf.work_hours}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 일별 추이 차트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">일별 생산 추이</h2>
            <div className="flex items-end justify-between h-64 gap-4">
              {[
                { date: '1/11', plan: 1000, actual: 920 },
                { date: '1/12', plan: 1000, actual: 980 },
                { date: '1/13', plan: 1000, actual: 950 },
                { date: '1/14', plan: 1000, actual: 1020 },
                { date: '1/15', plan: 1000, actual: 970 }
              ].map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1">
                    <div
                      className="w-full bg-blue-400 rounded-t"
                      style={{ height: `${(data.plan / 1000) * 100}px` }}
                      title={`계획: ${data.plan}`}
                    />
                    <div
                      className="w-full bg-green-600 rounded-b"
                      style={{ height: `${(data.actual / 1000) * 100}px` }}
                      title={`실적: ${data.actual}`}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">{data.date}</div>
                  <div className="text-xs font-semibold text-gray-900">{((data.actual / data.plan) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 설비 OEE 탭 */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {equipmentPerformance.map((eq) => (
              <div key={eq.equip_cd} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{eq.equip_nm}</h3>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">OEE</div>
                    <div className={`text-lg font-bold ${
                      eq.oee >= eq.target_oee ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {eq.oee.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* OEE 구성 요소 */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">가동율 (A)</span>
                      <span className="font-semibold text-gray-900">{eq.availability.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${eq.availability}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">성능율 (P)</span>
                      <span className="font-semibold text-gray-900">{eq.performance.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${eq.performance}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">양품율 (Q)</span>
                      <span className="font-semibold text-gray-900">{eq.quality.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${eq.quality}%` }} />
                    </div>
                  </div>
                </div>

                {/* OEE 계산식 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">OEE = A × P × Q</div>
                  <div className="text-xs text-gray-400">
                    목표: {eq.target_oee}% | 차이: {(eq.oee - eq.target_oee).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 작업자 성과 탭 */}
      {activeTab === 'worker' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">순위</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">작업자</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">팀</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">생산수량</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">불량수</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">양품률</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">효율</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">근무시간</th>
                </tr>
              </thead>
              <tbody>
                {workerPerformance.map((worker) => (
                  <tr key={worker.worker_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        worker.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        worker.rank === 2 ? 'bg-gray-200 text-gray-700' :
                        worker.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {worker.rank}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{worker.worker_nm}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{worker.team_nm}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {worker.production_qty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {worker.defect_qty}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        worker.quality_rate >= 99 ? 'text-green-600' :
                        worker.quality_rate >= 98 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {worker.quality_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              worker.efficiency >= 100 ? 'bg-green-600' :
                              worker.efficiency >= 95 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(worker.efficiency, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{worker.efficiency.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {worker.work_hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPerformanceAnalysis;
