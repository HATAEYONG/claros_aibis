// AgentTrace.tsx - 에이전트 추적 컴포넌트
import { useState } from 'react';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Zap,
  Settings,
  Brain,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface AgentExecution {
  id: string;
  timestamp: string;
  agentType: string;
  agentName: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  input: string;
  output: string;
  confidence?: number;
  error?: string;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  avgConfidence: number;
}

const AgentTrace: React.FC = () => {
  const [executions, setExecutions] = useState<AgentExecution[]>([
    {
      id: '1',
      timestamp: '2026-03-30 19:45:12',
      agentType: 'orchestration',
      agentName: 'IntentAgent',
      status: 'success',
      duration: 120,
      input: '사용자 질문: 최근 원가 상승 원인은 무엇인가?',
      output: '의도 파악: 원가 상승 요인 분석 요청',
      confidence: 0.95
    },
    {
      id: '2',
      timestamp: '2026-03-30 19:45:13',
      agentType: 'domain',
      agentName: 'CostIntelligenceAgent',
      status: 'success',
      duration: 1450,
      input: '원가 상승 요인 분석',
      output: '주요 원인: 재료비 +15.2%, 인건비 +8.5%, 에너지비 +6.2%',
      confidence: 0.89
    },
    {
      id: '3',
      timestamp: '2026-03-30 19:45:15',
      agentType: 'analysis',
      agentName: 'RootCauseAgent',
      status: 'success',
      duration: 890,
      input: '원가 상승 근본 원인 분석',
      output: '근본 원인: 원자재 가격 급등 (지수 +18.5%)',
      confidence: 0.87
    },
    {
      id: '4',
      timestamp: '2026-03-30 19:45:16',
      agentType: 'decision',
      agentName: 'RecommendationAgent',
      status: 'success',
      duration: 560,
      input: '원가 상승 대책 수립',
      output: '추천: 장기 계약 체결, 대체 자재 검토, 생산 효율화',
      confidence: 0.85
    },
    {
      id: '5',
      timestamp: '2026-03-30 19:45:17',
      agentType: 'orchestration',
      agentName: 'ChiefOrchestrator',
      status: 'success',
      duration: 80,
      input: '최종 응답 생성',
      output: '종합 응답 생성 완료',
      confidence: 0.92
    },
    {
      id: '6',
      timestamp: '2026-03-30 19:42:33',
      agentType: 'domain',
      agentName: 'QualityIntelligenceAgent',
      status: 'failed',
      duration: 2100,
      input: '품질 불량 원인 분석',
      output: '',
      error: '데이터 연결 시간 초과'
    },
    {
      id: '7',
      timestamp: '2026-03-30 19:40:15',
      agentType: 'analysis',
      agentName: 'ForecastAgent',
      status: 'success',
      duration: 1680,
      input: '다음 달 원가 예측',
      output: '예측: 원가 +3.2% (신뢰구간 95%)',
      confidence: 0.81
    }
  ]);

  const [selectedExecution, setSelectedExecution] = useState<AgentExecution | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'running'>('all');
  const [filterAgent, setFilterAgent] = useState('all');

  const metrics: ExecutionMetrics = {
    totalExecutions: executions.length,
    successRate: (executions.filter(e => e.status === 'success').length / executions.length) * 100,
    avgDuration: executions.reduce((sum, e) => sum + e.duration, 0) / executions.length,
    avgConfidence: executions.filter(e => e.confidence).reduce((sum, e) => sum + (e.confidence || 0), 0) / executions.filter(e => e.confidence).length
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'orchestration':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'domain':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'analysis':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decision':
        return <Brain className="w-5 h-5 text-orange-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">성공</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">실패</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">실행 중</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const getAgentTypeLabel = (agentType: string) => {
    switch (agentType) {
      case 'orchestration':
        return '오케스트레이션';
      case 'domain':
        return '도메인 지능';
      case 'analysis':
        return '분석';
      case 'decision':
        return '의사결정';
      default:
        return agentType;
    }
  };

  const filteredExecutions = executions.filter(exec => {
    const matchesStatus = filterStatus === 'all' || exec.status === filterStatus;
    const matchesAgent = filterAgent === 'all' || exec.agentType === filterAgent;
    return matchesStatus && matchesAgent;
  });

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 추적</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            에이전트 실행 로그 및 성능 모니터링
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5" />
          새로고침
        </button>
      </div>

      {/* 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 실행 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalExecutions}</p>
            </div>
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">성공률</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{metrics.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">평균 실행 시간</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.avgDuration.toFixed(0)}ms</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">평균 신뢰도</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{(metrics.avgConfidence * 100).toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">필터</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 상태</option>
            <option value="success">성공만</option>
            <option value="failed">실패만</option>
            <option value="running">실행 중만</option>
          </select>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 에이전트</option>
            <option value="orchestration">오케스트레이션</option>
            <option value="domain">도메인 지능</option>
            <option value="analysis">분석</option>
            <option value="decision">의사결정</option>
          </select>
        </div>
      </div>

      {/* 실행 로그 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">에이전트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">실행 시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">신뢰도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredExecutions.map((exec) => (
                <tr
                  key={exec.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer ${
                    selectedExecution?.id === exec.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedExecution(exec)}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{exec.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getAgentIcon(exec.agentType)}
                      <span className="font-medium text-gray-900 dark:text-white">{exec.agentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{getAgentTypeLabel(exec.agentType)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exec.status)}
                      {getStatusBadge(exec.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{exec.duration}ms</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {exec.confidence ? `${(exec.confidence * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedExecution(exec); }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="상세 보기"
                      >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 보기 */}
      {selectedExecution && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">실행 상세 정보</h3>
            <button
              onClick={() => setSelectedExecution(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">에이전트</span>
              <div className="flex items-center gap-2 mt-1">
                {getAgentIcon(selectedExecution.agentType)}
                <span className="font-bold text-gray-900 dark:text-white">{selectedExecution.agentName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">({getAgentTypeLabel(selectedExecution.agentType)})</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">실행 시간</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{selectedExecution.duration}ms</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">상태</span>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(selectedExecution.status)}
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedExecution.status === 'success' ? '성공' : selectedExecution.status === 'failed' ? '실패' : '실행 중'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">신뢰도</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">
                {selectedExecution.confidence ? `${(selectedExecution.confidence * 100).toFixed(1)}%` : '-'}
              </p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">입력</span>
              <pre className="mt-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {selectedExecution.input}
              </pre>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">출력</span>
              <pre className="mt-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {selectedExecution.output || selectedExecution.error || '없음'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTrace;
