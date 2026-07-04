// QualityTower.tsx - 품질 컨트롤 타워 컴포넌트
import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Award,
  Target,
  Activity,
  ClipboardCheck,
  Bug,
  Wrench,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

interface QualityKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  variance: number;
  status: 'on-track' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface QualityIssue {
  id: string;
  type: 'major' | 'minor' | 'critical';
  category: string;
  description: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  status: 'open' | 'investigating' | 'resolved';
}

interface QualityMetric {
  phase: string;
  incoming: number;
  inProcess: number;
  final: number;
  target: number;
}

interface CAPA {
  id: string;
  title: string;
  severity: 'major' | 'minor';
  status: 'open' | 'in-progress' | 'completed';
  dueDate: string;
  owner: string;
}

const QualityTower: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const kpis: QualityKPI[] = [
    {
      id: 'first-pass-yield',
      name: '양품률',
      value: 97.8,
      target: 97.5,
      variance: 0.3,
      status: 'on-track',
      trend: 'up',
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
      id: 'customer-complaints',
      name: '고객 클레임',
      value: 12,
      target: 15,
      variance: -3,
      status: 'on-track',
      trend: 'down',
      unit: '건'
    },
    {
      id: 'scrap-rate',
      name: '스크랩률',
      value: 1.8,
      target: 2.0,
      variance: -0.2,
      status: 'on-track',
      trend: 'down',
      unit: '%'
    },
    {
      id: 'rework-rate',
      name: '재작업률',
      value: 3.2,
      target: 3.0,
      variance: 0.2,
      status: 'warning',
      trend: 'up',
      unit: '%'
    },
    {
      id: 'quality-audit',
      name: '품질 감사 합격률',
      value: 99.2,
      target: 98.0,
      variance: 1.2,
      status: 'on-track',
      trend: 'up',
      unit: '%'
    }
  ];

  const qualityIssues: QualityIssue[] = [
    {
      id: 'QI001',
      type: 'major',
      category: '차체',
      description: '치수 불량 발생',
      count: 8,
      trend: 'up',
      status: 'investigating'
    },
    {
      id: 'QI002',
      type: 'minor',
      category: '도장',
      description: '도장 색상 불량',
      count: 5,
      trend: 'stable',
      status: 'open'
    },
    {
      id: 'QI003',
      type: 'critical',
      category: '용접',
      description: '용접 불량으로 리콜 발생',
      count: 1,
      trend: 'up',
      status: 'investigating'
    }
  ];

  const qualityMetrics: QualityMetric[] = [
    { phase: '입고 검사', incoming: 98.5, inProcess: 0, final: 0, target: 98.0 },
    { phase: '공정 검사', incoming: 0, inProcess: 97.2, final: 0, target: 96.5 },
    { phase: '출하 검사', incoming: 0, inProcess: 0, final: 99.5, target: 99.0 },
    { phase: '종합', incoming: 98.5, inProcess: 97.2, final: 99.5, target: 97.5 }
  ];

  const capas: CAPA[] = [
    {
      id: 'CAPA001',
      title: '치수 불량 원인 규명',
      severity: 'major',
      status: 'in-progress',
      dueDate: '2026-04-05',
      owner: '이품질'
    },
    {
      id: 'CAPA002',
      title: '도장 색상 개선',
      severity: 'minor',
      status: 'open',
      dueDate: '2026-04-10',
      owner: '박생산'
    },
    {
      id: 'CAPA003',
      title: '용접기 매개변수 교체',
      severity: 'major',
      status: 'completed',
      dueDate: '2026-03-28',
      owner: '김설비'
    }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'first-pass-yield': return <Shield className="w-5 h-5" />;
      case 'defect-rate': return <AlertTriangle className="w-5 h-5" />;
      case 'customer-complaints': return <Bug className="w-5 h-5" />;
      case 'scrap-rate': return <TrendingDown className="w-5 h-5" />;
      case 'rework-rate': return <RefreshCw className="w-5 h-5" />;
      case 'quality-audit': return <ClipboardCheck className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'minor': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCAPAStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">품질 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            품질 지표 및 불량 관리 실시간 모니터링
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
              {kpi.value.toFixed(1)}<span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{kpi.unit}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">목표: {kpi.target.toFixed(1)}</span>
              <span className={`font-medium ${
                kpi.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {kpi.variance >= 0 ? '+' : ''}{kpi.variance.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 검사 단계별 품질 지표 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">검사 단계별 합격률</h3>
        <div className="grid grid-cols-4 gap-4">
          {qualityMetrics.map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{metric.phase}</div>
              <div className="space-y-1">
                {metric.incoming > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">입고: {metric.incoming}%</div>
                )}
                {metric.inProcess > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">공정: {metric.inProcess}%</div>
                )}
                {metric.final > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">출하: {metric.final}%</div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">목표</div>
                <div className={`text-lg font-bold ${
                  metric.final > 0 ? (metric.final >= metric.target ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') :
                  metric.inProcess > 0 ? (metric.inProcess >= metric.target ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') :
                  'text-gray-900 dark:text-white'
                }`}>
                  {metric.target}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 품질 이슈 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            품질 이슈 ({qualityIssues.length})
          </h3>
          <div className="space-y-3">
            {qualityIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border-l-4 ${
                  issue.type === 'critical'
                    ? 'border-red-500 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : issue.type === 'major'
                    ? 'border-orange-500 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                    : 'border-yellow-500 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{issue.category}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-gray-700">
                        {issue.type === 'critical' ? '중대' : issue.type === 'major' ? '주요' : '경'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    issue.trend === 'up' ? 'text-red-600 dark:text-red-400' :
                    issue.trend === 'down' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {issue.trend === 'up' ? '▲ 증가' : issue.trend === 'down' ? '▼ 감소' : '안정'} ({issue.count}건)
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  상태: {issue.status === 'investigating' ? '조사 중' : issue.status === 'open' ? '대기' : '완료'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CAPA 현황 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" />
            CAPA 현황
          </h3>
          <div className="space-y-3">
            {capas.map((capa) => (
              <div
                key={capa.id}
                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{capa.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      담당자: {capa.owner} | 마감일: {capa.dueDate}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getCAPAStatusColor(capa.status)}`}>
                    {capa.status === 'completed' ? '완료' : capa.status === 'in-progress' ? '진행 중' : '대기'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getIssueTypeColor(capa.severity)}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {capa.severity === 'major' ? '주요' : '경미'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityTower;
