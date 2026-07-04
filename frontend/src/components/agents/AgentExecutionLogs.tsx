// AgentExecutionLogs.tsx - 에이전트 실행 로그 컴포넌트
import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Brain,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface ExecutionLog {
  id: string;
  runId: string;
  agentName: string;
  agentType: string;
  layer: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  startTime: string;
  endTime?: string;
  executionTime?: number;
  confidence?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  errorMessage?: string;
  triggeredBy: string;
  relatedEvent?: string;
}

const AgentExecutionLogs: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // 실행 로그 데이터
  const executionLogs: ExecutionLog[] = [
    {
      id: 'log1',
      runId: 'run-001',
      agentName: 'EventDetectionAgent',
      agentType: '이벤트 감지',
      layer: 'L2',
      status: 'completed',
      startTime: new Date(Date.now() - 60000).toISOString(),
      endTime: new Date(Date.now() - 55000).toISOString(),
      executionTime: 5000,
      confidence: 0.95,
      input: { query: '원자재 가격 급등 감지', timeframe: '24h', threshold: 0.15 },
      output: { eventsDetected: 3, severity: 'HIGH', affectedKPIs: ['원가율', '매출이익률'] },
      triggeredBy: 'KPIAgent',
      relatedEvent: 'kpi_deviation_001'
    },
    {
      id: 'log2',
      runId: 'run-002',
      agentName: 'KPIAgent',
      agentType: 'KPI 모니터링',
      layer: 'L2',
      status: 'completed',
      startTime: new Date(Date.now() - 120000).toISOString(),
      endTime: new Date(Date.now() - 110000).toISOString(),
      executionTime: 10000,
      confidence: 0.98,
      input: { kpiList: ['매출', '영업이익률', 'OEE'], period: 'current_month' },
      output: { kpisChecked: 3, alerts: 1, deviations: [{ kpi: 'OEE', variance: -2.5 }] },
      triggeredBy: 'Scheduled'
    },
    {
      id: 'log3',
      runId: 'run-003',
      agentName: 'CostIntelligenceAgent',
      agentType: '원가 지능',
      layer: 'L3',
      status: 'completed',
      startTime: new Date(Date.now() - 300000).toISOString(),
      endTime: new Date(Date.now() - 280000).toISOString(),
      executionTime: 20000,
      confidence: 0.92,
      input: { analysisType: 'variance', period: '90d', costElement: 'direct_material' },
      output: { variancesFound: 5, recommendations: 2, topDrivers: ['철강재', '알루미늄'] },
      triggeredBy: 'EventDetectionAgent'
    },
    {
      id: 'log4',
      runId: 'run-004',
      agentName: 'RecommendationAgent',
      agentType: '추천',
      layer: 'L5',
      status: 'completed',
      startTime: new Date(Date.now() - 480000).toISOString(),
      endTime: new Date(Date.now() - 465000).toISOString(),
      executionTime: 15000,
      confidence: 0.89,
      input: { context: '원가 절감', domain: 'purchasing' },
      output: { recommendations: 3, priority: 'HIGH', actions: ['공급자 협상', '대체 자재 검토'] },
      triggeredBy: 'ChiefOrchestratorAgent'
    },
    {
      id: 'log5',
      runId: 'run-005',
      agentName: 'ForecastAgent',
      agentType: '예측',
      layer: 'L4',
      status: 'running',
      startTime: new Date(Date.now() - 30000).toISOString(),
      executionTime: undefined,
      confidence: undefined,
      input: { target: '매출', horizon: '90d', model: 'lstm' },
      triggeredBy: 'User'
    },
    {
      id: 'log6',
      runId: 'run-006',
      agentName: 'QualityIntelligenceAgent',
      agentType: '품질 지능',
      layer: 'L3',
      status: 'failed',
      startTime: new Date(Date.now() - 600000).toISOString(),
      endTime: new Date(Date.now() - 550000).toISOString(),
      executionTime: 50000,
      input: { analysisType: 'defect_trend', period: '30d' },
      errorMessage: '품질 데이터를 찾을 수 없음: QM_INSPECTION_RESULT 테이블 접근 실패',
      triggeredBy: 'EventDetectionAgent'
    },
    {
      id: 'log7',
      runId: 'run-007',
      agentName: 'VarianceAgent',
      agentType: '편차 분석',
      layer: 'L4',
      status: 'completed',
      startTime: new Date(Date.now() - 900000).toISOString(),
      endTime: new Date(Date.now() - 885000).toISOString(),
      executionTime: 15000,
      confidence: 0.94,
      input: { budgetCategory: '매출원가', period: '2026-03' },
      output: { variance: 258000000, variancePercent: 2.5, topDrivers: ['철강재', '전자부품'] },
      triggeredBy: 'Scheduled'
    },
    {
      id: 'log8',
      runId: 'run-008',
      agentName: 'RootCauseAgent',
      agentType: '근본 원인 분석',
      layer: 'L4',
      status: 'completed',
      startTime: new Date(Date.now() - 1800000).toISOString(),
      endTime: new Date(Date.now() - 1770000).toISOString(),
      executionTime: 30000,
      confidence: 0.88,
      input: { issue: '치수 불량 증가', depth: 3 },
      output: { rootCauses: ['프레스 금형 마모', '온도 제어 불안정'], confidence: 0.88 },
      triggeredBy: 'QualityIntelligenceAgent'
    },
    {
      id: 'log9',
      runId: 'run-009',
      agentName: 'ApprovalAdvisorAgent',
      agentType: '승인 자문',
      layer: 'L5',
      status: 'completed',
      startTime: new Date(Date.now() - 2700000).toISOString(),
      endTime: new Date(Date.now() - 2685000).toISOString(),
      executionTime: 15000,
      confidence: 0.96,
      input: { requestId: 'CAPA001', amount: 50000000 },
      output: { recommendation: 'approve', riskLevel: 'LOW', rationale: 'CAPA 이력 충분' },
      triggeredBy: 'ApprovalRequest'
    },
    {
      id: 'log10',
      runId: 'run-010',
      agentName: 'EvaluationAgent',
      agentType: '평가',
      layer: 'L6',
      status: 'completed',
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() - 86250000).toISOString(),
      executionTime: 15000,
      confidence: 0.97,
      input: { agentType: 'ForecastAgent', period: '30d' },
      output: { accuracy: 92.3, precision: 89.5, recall: 87.2 },
      triggeredBy: 'Scheduled'
    }
  ];

  // 필터링된 로그
  const filteredLogs = executionLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.runId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayer = selectedLayer === 'all' || log.layer === selectedLayer;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesLayer && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'running':
        return <Activity className="w-5 h-5 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'cancelled':
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getLayerBadge = (layer: string) => {
    switch (layer) {
      case 'L1': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'L2': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'L3': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'L4': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'L5': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'L6': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // 통계 카드
  const stats = {
    total: executionLogs.length,
    completed: executionLogs.filter(l => l.status === 'completed').length,
    running: executionLogs.filter(l => l.status === 'running').length,
    failed: executionLogs.filter(l => l.status === 'failed').length,
    avgExecutionTime: executionLogs.filter(l => l.executionTime).reduce((sum, l) => sum + (l.executionTime || 0), 0) / executionLogs.filter(l => l.executionTime).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 실행 로그</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            모든 에이전트 실행 이력을 상세 조회 및 분석
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">마지막 갱신</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {refreshTime.toLocaleTimeString('ko-KR')}
            </div>
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">전체 실행</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">완료</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">실행 중</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.running}</div>
            </div>
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">실패</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">평균 시간</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.avgExecutionTime / 1000).toFixed(1)}s
              </div>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="에이전트, 실행 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 레이어</option>
          <option value="L1">L1: 오케스트레이션</option>
          <option value="L2">L2: 모니터링</option>
          <option value="L3">L3: 도메인 지능</option>
          <option value="L4">L4: 분석</option>
          <option value="L5">L5: 의사결정</option>
          <option value="L6">L6: 학습</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 상태</option>
          <option value="completed">완료</option>
          <option value="running">실행 중</option>
          <option value="failed">실패</option>
          <option value="cancelled">취소</option>
        </select>
        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="today">오늘</option>
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="all">전체</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>

      {/* 실행 로그 리스트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">실행 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">에이전트</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">시작 시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">실행 시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">신뢰도</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">트리거</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status === 'completed' ? '완료' : log.status === 'running' ? '실행 중' : log.status === 'failed' ? '실패' : '취소'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{log.runId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLayerBadge(log.layer)}`}>{log.layer}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{log.agentName}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.agentType}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.startTime).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.executionTime ? `${(log.executionTime / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.confidence !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-16">
                            <div
                              className={`h-2 rounded-full ${
                                log.confidence >= 0.9 ? 'bg-green-500' : log.confidence >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${log.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">{(log.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.triggeredBy}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {expandedLog === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-gray-900/30">
                        <div className="space-y-4">
                          {/* 입력 */}
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">입력 데이터</div>
                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(log.input, null, 2)}
                            </pre>
                          </div>

                          {/* 출력 */}
                          {log.output && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">출력 데이터</div>
                              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* 에러 메시지 */}
                          {log.errorMessage && (
                            <div>
                              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                에러 메시지
                              </div>
                              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-600 dark:text-red-400">
                                {log.errorMessage}
                              </div>
                            </div>
                          )}

                          {/* 관련 이벤트 */}
                          {log.relatedEvent && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">관련 이벤트:</span>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                {log.relatedEvent}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 실행 중인 작업 알림 */}
      {stats.running > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
            <div className="flex-1">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                현재 {stats.running}개의 에이전트가 실행 중입니다
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                실시간 진행 상황을 확인하세요
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentExecutionLogs;
