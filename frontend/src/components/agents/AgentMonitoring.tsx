// AgentMonitoring.tsx - 에이전트 모니터링 컴포넌트
import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart3,
  Settings,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  nameKo: string;
  layer: string;
  layerName: string;
  domain: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecution: string;
  lastStatus: 'success' | 'error' | 'running';
  description: string;
}

interface ExecutionLog {
  id: string;
  agentName: string;
  agentType: string;
  status: 'completed' | 'failed' | 'running';
  startTime: string;
  endTime?: string;
  executionTime?: number;
  confidence?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  errorMessage?: string;
}

interface LayerSummary {
  layer: string;
  layerName: string;
  agentCount: number;
  activeCount: number;
  totalExecutions: number;
  avgSuccessRate: number;
}

const AgentMonitoring: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'agents' | 'logs' | 'performance'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // 전체 에이전트 정보 (24개)
  const agents: AgentInfo[] = [
    // L1: 오케스트레이션 (4개)
    {
      id: 'chiefOrchestrator',
      name: 'ChiefOrchestratorAgent',
      nameKo: '최족 오케스트레이터',
      layer: 'L1',
      layerName: '오케스트레이션',
      domain: 'orchestration',
      version: '1.0.0',
      status: 'active',
      executionCount: 156,
      successRate: 98.7,
      avgExecutionTime: 1250,
      lastExecution: new Date(Date.now() - 300000).toISOString(),
      lastStatus: 'success',
      description: '전체 에이전트 워크플로우 조율'
    },
    {
      id: 'intentAgent',
      name: 'IntentAgent',
      nameKo: '의도 파악',
      layer: 'L1',
      layerName: '오케스트레이션',
      domain: 'orchestration',
      version: '1.0.0',
      status: 'active',
      executionCount: 243,
      successRate: 96.5,
      avgExecutionTime: 450,
      lastExecution: new Date(Date.now() - 180000).toISOString(),
      lastStatus: 'success',
      description: '사용자 의도 분석 및 에이전트 라우팅'
    },
    {
      id: 'plannerAgent',
      name: 'AnalysisPlannerAgent',
      nameKo: '분석 계획',
      layer: 'L1',
      layerName: '오케스트레이션',
      domain: 'orchestration',
      version: '1.0.0',
      status: 'active',
      executionCount: 189,
      successRate: 94.2,
      avgExecutionTime: 890,
      lastExecution: new Date(Date.now() - 600000).toISOString(),
      lastStatus: 'success',
      description: '복잡한 분석 태스크 계획'
    },
    {
      id: 'toolRouterAgent',
      name: 'ToolRouterAgent',
      nameKo: '도구 라우터',
      layer: 'L1',
      layerName: '오케스트레이션',
      domain: 'orchestration',
      version: '1.0.0',
      status: 'active',
      executionCount: 312,
      successRate: 99.1,
      avgExecutionTime: 320,
      lastExecution: new Date(Date.now() - 120000).toISOString(),
      lastStatus: 'success',
      description: '적절한 도구/API 선택 및 호출'
    },
    // L2: 모니터링 (4개)
    {
      id: 'kpiAgent',
      name: 'KPIAgent',
      nameKo: 'KPI 모니터링',
      layer: 'L2',
      layerName: '모니터링',
      domain: 'monitoring',
      version: '1.0.0',
      status: 'active',
      executionCount: 456,
      successRate: 97.8,
      avgExecutionTime: 680,
      lastExecution: new Date(Date.now() - 90000).toISOString(),
      lastStatus: 'success',
      description: 'KPI 실시간 모니터링 및 이탈 감지'
    },
    {
      id: 'riskAgent',
      name: 'RiskAgent',
      nameKo: '리스크 모니터링',
      layer: 'L2',
      layerName: '모니터링',
      domain: 'monitoring',
      version: '1.0.0',
      status: 'active',
      executionCount: 234,
      successRate: 95.3,
      avgExecutionTime: 920,
      lastExecution: new Date(Date.now() - 240000).toISOString(),
      lastStatus: 'success',
      description: '전사 리스크 실시간 감시'
    },
    {
      id: 'processMonitoringAgent',
      name: 'ProcessMonitoringAgent',
      nameKo: '프로세스 모니터링',
      layer: 'L2',
      layerName: '모니터링',
      domain: 'monitoring',
      version: '1.0.0',
      status: 'active',
      executionCount: 567,
      successRate: 98.2,
      avgExecutionTime: 540,
      lastExecution: new Date(Date.now() - 180000).toISOString(),
      lastStatus: 'success',
      description: '비즈니스 프로세스 상태 추적'
    },
    {
      id: 'eventDetectionAgent',
      name: 'EventDetectionAgent',
      nameKo: '이벤트 감지',
      layer: 'L2',
      layerName: '모니터링',
      domain: 'monitoring',
      version: '1.0.0',
      status: 'active',
      executionCount: 789,
      successRate: 96.7,
      avgExecutionTime: 380,
      lastExecution: new Date(Date.now() - 60000).toISOString(),
      lastStatus: 'success',
      description: '이상 징후 및 이벤트 자동 감지'
    },
    // L3: 도메인 지능 (5개)
    {
      id: 'costIntelligence',
      name: 'CostIntelligenceAgent',
      nameKo: '원가 지능',
      layer: 'L3',
      layerName: '도메인 지능',
      domain: 'cost',
      version: '1.0.0',
      status: 'active',
      executionCount: 145,
      successRate: 94.5,
      avgExecutionTime: 1580,
      lastExecution: new Date(Date.now() - 300000).toISOString(),
      lastStatus: 'success',
      description: '4M2E 기반 원가 편차 탐지 및 드라이버 분석'
    },
    {
      id: 'financeIntelligence',
      name: 'FinanceIntelligenceAgent',
      nameKo: '재무 지능',
      layer: 'L3',
      layerName: '도메인 지능',
      domain: 'financial',
      version: '1.0.0',
      status: 'active',
      executionCount: 123,
      successRate: 96.2,
      avgExecutionTime: 1340,
      lastExecution: new Date(Date.now() - 420000).toISOString(),
      lastStatus: 'success',
      description: '예산 실행률, 현금흐름, 재무 비율 분석'
    },
    {
      id: 'purchasingIntelligence',
      name: 'PurchasingIntelligenceAgent',
      nameKo: '구매 지능',
      layer: 'L3',
      layerName: '도메인 지능',
      domain: 'purchasing',
      version: '1.0.0',
      status: 'active',
      executionCount: 98,
      successRate: 93.8,
      avgExecutionTime: 1120,
      lastExecution: new Date(Date.now() - 540000).toISOString(),
      lastStatus: 'success',
      description: '공급자 위험 평가 및 구매 최적화'
    },
    {
      id: 'productionIntelligence',
      name: 'ProductionIntelligenceAgent',
      nameKo: '생산 지능',
      layer: 'L3',
      layerName: '도메인 지능',
      domain: 'production',
      version: '1.0.0',
      status: 'active',
      executionCount: 234,
      successRate: 97.1,
      avgExecutionTime: 980,
      lastExecution: new Date(Date.now() - 150000).toISOString(),
      lastStatus: 'success',
      description: '생산량, 가동율, OEE 분석'
    },
    {
      id: 'qualityIntelligence',
      name: 'QualityIntelligenceAgent',
      nameKo: '품질 지능',
      layer: 'L3',
      layerName: '도메인 지능',
      domain: 'quality',
      version: '1.0.0',
      status: 'active',
      executionCount: 187,
      successRate: 95.6,
      avgExecutionTime: 870,
      lastExecution: new Date(Date.now() - 270000).toISOString(),
      lastStatus: 'success',
      description: '불량률 분석 및 CAPA 추천'
    },
    // L4: 분석 (4개)
    {
      id: 'forecastAgent',
      name: 'ForecastAgent',
      nameKo: '예측',
      layer: 'L4',
      layerName: '분석',
      domain: 'analysis',
      version: '1.0.0',
      status: 'active',
      executionCount: 345,
      successRate: 92.3,
      avgExecutionTime: 2340,
      lastExecution: new Date(Date.now() - 3600000).toISOString(),
      lastStatus: 'success',
      description: '수요, 매출, 원가 등 예측'
    },
    {
      id: 'varianceAgent',
      name: 'VarianceAgent',
      nameKo: '편차 분석',
      layer: 'L4',
      layerName: '분석',
      domain: 'analysis',
      version: '1.0.0',
      status: 'active',
      executionCount: 267,
      successRate: 94.7,
      avgExecutionTime: 1890,
      lastExecution: new Date(Date.now() - 7200000).toISOString(),
      lastStatus: 'success',
      description: '예산 대비 실적 편차 분석'
    },
    {
      id: 'rootCauseAgent',
      name: 'RootCauseAgent',
      nameKo: '근본 원인 분석',
      layer: 'L4',
      layerName: '분석',
      domain: 'analysis',
      version: '1.0.0',
      status: 'active',
      executionCount: 123,
      successRate: 91.2,
      avgExecutionTime: 2650,
      lastExecution: new Date(Date.now() - 1800000).toISOString(),
      lastStatus: 'success',
      description: '이슈 근본 원인 탐색'
    },
    {
      id: 'scenarioAgent',
      name: 'ScenarioAgent',
      nameKo: '시나리오 분석',
      layer: 'L4',
      layerName: '분석',
      domain: 'analysis',
      version: '1.0.0',
      status: 'active',
      executionCount: 89,
      successRate: 89.5,
      avgExecutionTime: 3200,
      lastExecution: new Date(Date.now() - 86400000).toISOString(),
      lastStatus: 'success',
      description: 'What-if 시나리오 분석'
    },
    // L5: 의사결정 (3개)
    {
      id: 'recommendationAgent',
      name: 'RecommendationAgent',
      nameKo: '추천',
      layer: 'L5',
      layerName: '의사결정',
      domain: 'decision',
      version: '1.0.0',
      status: 'active',
      executionCount: 456,
      successRate: 93.4,
      avgExecutionTime: 1450,
      lastExecution: new Date(Date.now() - 480000).toISOString(),
      lastStatus: 'success',
      description: '데이터 기반 추천사항 생성'
    },
    {
      id: 'approvalAdvisorAgent',
      name: 'ApprovalAdvisorAgent',
      nameKo: '승인 자문',
      layer: 'L5',
      layerName: '의사결정',
      domain: 'decision',
      version: '1.0.0',
      status: 'active',
      executionCount: 234,
      successRate: 95.7,
      avgExecutionTime: 890,
      lastExecution: new Date(Date.now() - 960000).toISOString(),
      lastStatus: 'success',
      description: '승인 요청 자문 및 의사결정 지원'
    },
    {
      id: 'alertAgent',
      name: 'AlertAgent',
      nameKo: '알림',
      layer: 'L5',
      layerName: '의사결정',
      domain: 'decision',
      version: '1.0.0',
      status: 'active',
      executionCount: 678,
      successRate: 98.9,
      avgExecutionTime: 340,
      lastExecution: new Date(Date.now() - 300000).toISOString(),
      lastStatus: 'success',
      description: '실시간 알림 생성 및 전송'
    },
    // L6: 학습 (4개)
    {
      id: 'evaluationAgent',
      name: 'EvaluationAgent',
      nameKo: '평가',
      layer: 'L6',
      layerName: '학습',
      domain: 'learning',
      version: '1.0.0',
      status: 'active',
      executionCount: 45,
      successRate: 97.8,
      avgExecutionTime: 4560,
      lastExecution: new Date(Date.now() - 86400000).toISOString(),
      lastStatus: 'success',
      description: '에이전트 성능 평가 및 피드백'
    },
    {
      id: 'reflectionAgent',
      name: 'ReflectionAgent',
      nameKo: '반성',
      layer: 'L6',
      layerName: '학습',
      domain: 'learning',
      version: '1.0.0',
      status: 'active',
      executionCount: 67,
      successRate: 94.0,
      avgExecutionTime: 5230,
      lastExecution: new Date(Date.now() - 172800000).toISOString(),
      lastStatus: 'success',
      description: '실행 결과 반성 및 개선 학습'
    },
    {
      id: 'memoryCuratorAgent',
      name: 'MemoryCuratorAgent',
      nameKo: '메모리 큐레이터',
      layer: 'L6',
      layerName: '학습',
      domain: 'learning',
      version: '1.0.0',
      status: 'active',
      executionCount: 34,
      successRate: 91.2,
      avgExecutionTime: 3890,
      lastExecution: new Date(Date.now() - 259200000).toISOString(),
      lastStatus: 'success',
      description: '장기 패턴 저장 및 메모리 관리'
    },
    {
      id: 'knowledgeUpdateAgent',
      name: 'KnowledgeUpdateAgent',
      nameKo: '지식 업데이트',
      layer: 'L6',
      layerName: '학습',
      domain: 'learning',
      version: '1.0.0',
      status: 'active',
      executionCount: 23,
      successRate: 87.0,
      avgExecutionTime: 6780,
      lastExecution: new Date(Date.now() - 43200000).toISOString(),
      lastStatus: 'success',
      description: '지식 그래프 자동 업데이트'
    }
  ];

  // 레이어별 요약
  const layerSummaries: LayerSummary[] = [
    { layer: 'L1', layerName: '오케스트레이션', agentCount: 4, activeCount: 4, totalExecutions: 900, avgSuccessRate: 97.1 },
    { layer: 'L2', layerName: '모니터링', agentCount: 4, activeCount: 4, totalExecutions: 2046, avgSuccessRate: 97.0 },
    { layer: 'L3', layerName: '도메인 지능', agentCount: 5, activeCount: 5, totalExecutions: 787, avgSuccessRate: 95.4 },
    { layer: 'L4', layerName: '분석', agentCount: 4, activeCount: 4, totalExecutions: 824, avgSuccessRate: 91.9 },
    { layer: 'L5', layerName: '의사결정', agentCount: 3, activeCount: 3, totalExecutions: 1368, avgSuccessRate: 96.0 },
    { layer: 'L6', layerName: '학습', agentCount: 4, activeCount: 4, totalExecutions: 169, avgSuccessRate: 92.5 }
  ];

  // 실행 로그 (최신)
  const executionLogs: ExecutionLog[] = [
    {
      id: 'log1',
      agentName: 'EventDetectionAgent',
      agentType: '이벤트 감지',
      status: 'completed',
      startTime: new Date(Date.now() - 60000).toISOString(),
      endTime: new Date(Date.now() - 55000).toISOString(),
      executionTime: 5000,
      confidence: 0.95,
      input: { query: '원자재 가격 급등 감지', timeframe: '24h' },
      output: { eventsDetected: 3, severity: 'HIGH' }
    },
    {
      id: 'log2',
      agentName: 'KPIAgent',
      agentType: 'KPI 모니터링',
      status: 'completed',
      startTime: new Date(Date.now() - 120000).toISOString(),
      endTime: new Date(Date.now() - 110000).toISOString(),
      executionTime: 10000,
      confidence: 0.98,
      input: { kpiList: ['매출', '영업이익률', 'OEE'] },
      output: { kpisChecked: 3, alerts: 1 }
    },
    {
      id: 'log3',
      agentName: 'CostIntelligenceAgent',
      agentType: '원가 지능',
      status: 'completed',
      startTime: new Date(Date.now() - 300000).toISOString(),
      endTime: new Date(Date.now() - 280000).toISOString(),
      executionTime: 20000,
      confidence: 0.92,
      input: { analysisType: 'variance', period: '90d' },
      output: { variancesFound: 5, recommendations: 2 }
    },
    {
      id: 'log4',
      agentName: 'RecommendationAgent',
      agentType: '추천',
      status: 'completed',
      startTime: new Date(Date.now() - 480000).toISOString(),
      endTime: new Date(Date.now() - 465000).toISOString(),
      executionTime: 15000,
      confidence: 0.89,
      input: { context: '원가 절감' },
      output: { recommendations: 3, priority: 'HIGH' }
    },
    {
      id: 'log5',
      agentName: 'ForecastAgent',
      agentType: '예측',
      status: 'running',
      startTime: new Date(Date.now() - 30000).toISOString(),
      executionTime: undefined,
      confidence: undefined,
      input: { target: '매출', horizon: '90d' }
    },
    {
      id: 'log6',
      agentName: 'QualityIntelligenceAgent',
      agentType: '품질 지능',
      status: 'failed',
      startTime: new Date(Date.now() - 600000).toISOString(),
      endTime: new Date(Date.now() - 550000).toISOString(),
      executionTime: 50000,
      input: { analysisType: 'defect_trend' },
      errorMessage: '품질 데이터를 찾을 수 없음'
    }
  ];

  // 필터링된 에이전트
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchQuery === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.nameKo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayer = selectedLayer === 'all' || agent.layer === selectedLayer;
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    return matchesSearch && matchesLayer && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'inactive':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'inactive':
        return <Clock className="w-5 h-5" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'running':
        return <Activity className="w-5 h-5 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 전체 현황 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Brain className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전체</span>
          </div>
          <div className="text-3xl font-bold mb-1">24</div>
          <div className="text-sm text-blue-100">활성 에이전트</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">성공률</span>
          </div>
          <div className="text-3xl font-bold mb-1">95.2%</div>
          <div className="text-sm text-green-100">평균 성공률</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">실행</span>
          </div>
          <div className="text-3xl font-bold mb-1">6,094</div>
          <div className="text-sm text-purple-100">총 실행 횟수</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">속도</span>
          </div>
          <div className="text-3xl font-bold mb-1">1.8s</div>
          <div className="text-sm text-orange-100">평균 실행 시간</div>
        </div>
      </div>

      {/* 레이어별 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">레이어별 현황</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {layerSummaries.map((layer) => (
              <div
                key={layer.layer}
                className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{layer.layer}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    layer.avgSuccessRate >= 95
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : layer.avgSuccessRate >= 90
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {layer.avgSuccessRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{layer.layerName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {layer.agentCount}개 에이전트 • {layer.totalExecutions}회 실행
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 실행 로그 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">최근 실행 로그</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {executionLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border-l-4 ${
                  log.status === 'completed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : log.status === 'running'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-semibold text-gray-900 dark:text-white">{log.agentName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{log.agentType}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.startTime).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">상태: </span>
                    <span className={`font-medium ${
                      log.status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : log.status === 'running'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {log.status === 'completed' ? '완료' : log.status === 'running' ? '실행 중' : '실패'}
                    </span>
                  </div>
                  {log.executionTime && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">실행 시간: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{(log.executionTime / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                  {log.confidence && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">신뢰도: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{(log.confidence * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                {log.errorMessage && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    에러: {log.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="에이전트 검색..."
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
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="error">오류</option>
        </select>
      </div>

      {/* 에이전트 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    agent.layer === 'L1'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : agent.layer === 'L2'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : agent.layer === 'L3'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : agent.layer === 'L4'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : agent.layer === 'L5'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                  }`}>
                    {agent.layer}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{agent.version}</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{agent.nameKo}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{agent.name}</p>
              </div>
              <div className={`p-2 rounded-lg ${getStatusColor(agent.status)}`}>
                {getStatusIcon(agent.status)}
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{agent.description}</p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">실행</div>
                <div className="font-semibold text-gray-900 dark:text-white">{agent.executionCount}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">성공률</div>
                <div className={`font-semibold ${
                  agent.successRate >= 95
                    ? 'text-green-600 dark:text-green-400'
                    : agent.successRate >= 90
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {agent.successRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">평균 시간</div>
                <div className="font-semibold text-gray-900 dark:text-white">{(agent.avgExecutionTime / 1000).toFixed(1)}s</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              마지막 실행: {new Date(agent.lastExecution).toLocaleString('ko-KR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">전체 실행 로그</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">에이전트</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">상태</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">시작 시간</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">실행 시간</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">신뢰도</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">결과</th>
                </tr>
              </thead>
              <tbody>
                {executionLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{log.agentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.agentType}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status === 'completed' ? '완료' : log.status === 'running' ? '실행 중' : '실패'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.startTime).toLocaleString('ko-KR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {log.executionTime ? `${(log.executionTime / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {log.confidence ? `${(log.confidence * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {log.output ? (
                        <div className="text-gray-600 dark:text-gray-400">
                          {Object.entries(log.output).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              {key}: {typeof value === 'number' ? value : JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                      ) : log.errorMessage ? (
                        <div className="text-red-600 dark:text-red-400 text-xs">{log.errorMessage}</div>
                      ) : (
                        <div className="text-blue-600 dark:text-blue-400 text-xs">실행 중...</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">에이전트 성능 순위</h3>
        <div className="space-y-3">
          {agents
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 10)
            .map((agent, index) => (
              <div key={agent.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{agent.nameKo}</span>
                    <span className={`font-bold ${
                      agent.successRate >= 95
                        ? 'text-green-600 dark:text-green-400'
                        : agent.successRate >= 90
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {agent.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        agent.successRate >= 95
                          ? 'bg-green-500'
                          : agent.successRate >= 90
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${agent.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 모니터링</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            24개 AI 에이전트의 실시간 상태와 성능을 모니터링
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
              isLoading
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview' as const, label: '개요', icon: BarChart3 },
            { id: 'agents' as const, label: '에이전트', icon: Brain },
            { id: 'logs' as const, label: '실행 로그', icon: Activity },
            { id: 'performance' as const, label: '성능', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'agents' && renderAgents()}
          {selectedTab === 'logs' && renderLogs()}
          {selectedTab === 'performance' && renderPerformance()}
        </div>
      </div>

      {/* 실시간 상태 바 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium">실시간 감시 활성</div>
            <div className="text-sm text-green-100">모든 에이전트가 정상 작동 중입니다</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMonitoring;
