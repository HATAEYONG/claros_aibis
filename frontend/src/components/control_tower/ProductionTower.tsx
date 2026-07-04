// ProductionTower.tsx - 생산 컨트롤 타워 컴포넌트
import { useState } from 'react';
import {
  Factory,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  Users,
  Settings,
  Wrench,
  BarChart3,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface ProductionKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  variance: number;
  status: 'on-track' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface ProductionLine {
  id: string;
  name: string;
  utilization: number;
  status: 'operating' | 'stopped' | 'maintenance';
  output: number;
  target: number;
  defects: number;
}

interface EquipmentStatus {
  name: string;
  status: 'running' | 'stopped' | 'maintenance';
  uptime: number;
  efficiency: number;
}

const ProductionTower: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const kpis: ProductionKPI[] = [
    {
      id: 'production-volume',
      name: '생산량',
      value: 125420,
      target: 120000,
      variance: 5420,
      status: 'on-track',
      trend: 'up',
      unit: '개'
    },
    {
      id: 'utilization-rate',
      name: '가동율',
      value: 87.3,
      target: 85.0,
      variance: 2.3,
      status: 'on-track',
      trend: 'stable',
      unit: '%'
    },
    {
      id: 'defect-rate',
      name: '불불률',
      value: 2.1,
      target: 2.5,
      variance: -0.4,
      status: 'on-track',
      trend: 'down',
      unit: '%'
    },
    {
      id: 'oee',
      name: 'OEE',
      value: 84.5,
      target: 82.0,
      variance: 2.5,
      status: 'on-track',
      trend: 'up',
      unit: '%'
    },
    {
      id: 'downtime',
      name: '비가동 시간',
      value: 12.5,
      target: 15.0,
      variance: -2.5,
      status: 'on-track',
      trend: 'down',
      unit: '시간'
    },
    {
      id: 'productivity',
      name: '생산성',
      value: 115.2,
      target: 110.0,
      variance: 5.2,
      status: 'on-track',
      trend: 'up',
      unit: '지수'
    }
  ];

  const productionLines: ProductionLine[] = [
    { id: 'L1', name: '라인 1 (차체)', utilization: 92.5, status: 'operating', output: 42500, target: 40000, defects: 850 },
    { id: 'L2', name: '라인 2 (도장)', utilization: 88.3, status: 'operating', output: 38200, target: 38000, defects: 720 },
    { id: 'L3', name: '라인 3 (조립)', utilization: 85.1, status: 'operating', output: 29400, target: 28000, defects: 580 },
    { id: 'L4', name: '라인 4 (용접)', utilization: 78.5, status: 'maintenance', output: 0, target: 14000, defects: 0 },
    { id: 'L5', name: '라인 5 (도장)', utilization: 91.2, status: 'operating', output: 15320, target: 15000, defects: 260 }
  ];

  const equipmentStatus: EquipmentStatus[] = [
    { name: '프레스 #1', status: 'running', uptime: 98.5, efficiency: 94.2 },
    { name: '프레스 #2', status: 'running', uptime: 96.8, efficiency: 93.5 },
    { name: '로봇 #1', status: 'running', uptime: 99.2, efficiency: 91.8 },
    { name: '컨베이어 #1', status: 'maintenance', uptime: 85.3, efficiency: 0 },
    { name: '용접기 #1', status: 'running', uptime: 97.1, efficiency: 89.5 }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'production-volume': return <Package className="w-5 h-5" />;
      case 'utilization-rate': return <Activity className="w-5 h-5" />;
      case 'defect-rate': return <AlertTriangle className="w-5 h-5" />;
      case 'oee': return <BarChart3 className="w-5 h-5" />;
      case 'downtime': return <Clock className="w-5 h-5" />;
      case 'productivity': return <TrendingUp className="w-5 h-5" />;
      default: return <Factory className="w-5 h-5" />;
    }
  };

  const getLineStatusColor = (status: string) => {
    switch (status) {
      case 'operating': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getEquipmentStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Zap className="w-4 h-4 text-green-500" />;
      case 'stopped': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">생산 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            생산 성과 및 설비 운영 실시간 모니터링
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">갱신: {refreshTime.toLocaleTimeString('ko-KR')}</div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 주요 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              kpi.status === 'on-track'
                ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : kpi.status === 'warning'
                ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  kpi.status === 'on-track'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  {getKPIIcon(kpi.id)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{kpi.name}</span>
              </div>
              <div className={`flex items-center gap-1 ${
                kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {kpi.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                {kpi.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {kpi.unit === '%' || kpi.unit === '지수' ? kpi.value.toFixed(1) : kpi.value.toLocaleString()}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{kpi.unit}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">목표: {kpi.unit === '%' || kpi.unit === '지수' ? kpi.target.toFixed(1) : kpi.target.toLocaleString()}</span>
              <span className={`font-medium ${
                kpi.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {kpi.variance >= 0 ? '+' : ''}{kpi.unit === '%' || kpi.unit === '지수' ? kpi.variance.toFixed(1) : kpi.variance.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 생산 라인 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">생산 라인 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {productionLines.map((line) => (
            <div
              key={line.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                line.status === 'operating'
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : line.status === 'maintenance'
                  ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900 dark:text-white">{line.name}</span>
                <div className={`w-3 h-3 rounded-full ${getLineStatusColor(line.status)}`} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">가동율</span>
                  <span className="font-medium text-gray-900 dark:text-white">{line.utilization.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">생산량</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {line.output.toLocaleString()} / {line.target.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">불불</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{line.defects}건</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 설비 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">주요 설비 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">설비명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">가동률</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">효율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {equipmentStatus.map((eq, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{eq.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getEquipmentStatusIcon(eq.status)}
                      <span className="text-sm text-gray-900 dark:text-white capitalize">{eq.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${eq.uptime}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white w-12 text-right">{eq.uptime}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            eq.efficiency >= 90 ? 'bg-green-500' :
                            eq.efficiency >= 80 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${eq.efficiency}%` }}
                        />
                      </div>
                      <span className={`text-sm w-12 text-right ${
                        eq.efficiency >= 90 ? 'text-green-600 dark:text-green-400' :
                        eq.efficiency >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {eq.efficiency}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생산 계획 대 실적 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">주간 생산 계획 대 실적</h3>
        <div className="grid grid-cols-7 gap-3">
          {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {(Math.random() * 10000 + 15000).toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">목표: 18,000</div>
              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className={`h-1 rounded-full ${
                    Math.random() > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionTower;
