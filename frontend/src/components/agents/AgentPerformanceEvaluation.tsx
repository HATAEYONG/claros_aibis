// AgentPerformanceEvaluation.tsx - 에이전트 성능 평가 컴포넌트
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Brain,
  AlertCircle
} from 'lucide-react';

interface AgentPerformance {
  id: string;
  name: string;
  nameKo: string;
  layer: string;
  domain: string;

  // 성능 메트릭
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgExecutionTime: number;
  avgConfidence: number;

  // 기간별 추세
  last7Days: { successRate: number; executions: number };
  last30Days: { successRate: number; executions: number };
  last90Days: { successRate: number; executions: number };

  // 품질 메트릭
  precision?: number;
  recall?: number;
  f1Score?: number;

  // 비즈니스 영향
  recommendationsGenerated: number;
  recommendationsAdopted: number;
  adoptionRate: number;

  // 리소스 사용
  avgTokenUsage: number;
  avgCostPerExecution: number;

  // 최근 평가
  lastEvaluatedAt: string;
  overallScore: number;
  rank: number;
}

const AgentPerformanceEvaluation: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'executions' | 'successRate'>('score');

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // 에이전트 성능 데이터
  const agentPerformances: AgentPerformance[] = [
    {
      id: 'toolRouterAgent',
      name: 'ToolRouterAgent',
      nameKo: '도구 라우터',
      layer: 'L1',
      domain: 'orchestration',
      totalExecutions: 312,
      successCount: 309,
      failureCount: 3,
      successRate: 99.0,
      avgExecutionTime: 320,
      avgConfidence: 0.98,
      last7Days: { successRate: 99.5, executions: 45 },
      last30Days: { successRate: 99.2, executions: 156 },
      last90Days: { successRate: 99.0, executions: 312 },
      recommendationsGenerated: 0,
      recommendationsAdopted: 0,
      adoptionRate: 0,
      avgTokenUsage: 150,
      avgCostPerExecution: 0.001,
      lastEvaluatedAt: new Date(Date.now() - 3600000).toISOString(),
      overallScore: 98.5,
      rank: 1
    },
    {
      id: 'kpiAgent',
      name: 'KPIAgent',
      nameKo: 'KPI 모니터링',
      layer: 'L2',
      domain: 'monitoring',
      totalExecutions: 456,
      successCount: 446,
      failureCount: 10,
      successRate: 97.8,
      avgExecutionTime: 680,
      avgConfidence: 0.96,
      last7Days: { successRate: 98.5, executions: 67 },
      last30Days: { successRate: 98.0, executions: 234 },
      last90Days: { successRate: 97.8, executions: 456 },
      precision: 0.95,
      recall: 0.93,
      f1Score: 0.94,
      recommendationsGenerated: 23,
      recommendationsAdopted: 19,
      adoptionRate: 82.6,
      avgTokenUsage: 800,
      avgCostPerExecution: 0.008,
      lastEvaluatedAt: new Date(Date.now() - 7200000).toISOString(),
      overallScore: 96.8,
      rank: 2
    },
    {
      id: 'chiefOrchestrator',
      name: 'ChiefOrchestratorAgent',
      nameKo: '최족 오케스트레이터',
      layer: 'L1',
      domain: 'orchestration',
      totalExecutions: 156,
      successCount: 154,
      failureCount: 2,
      successRate: 98.7,
      avgExecutionTime: 1250,
      avgConfidence: 0.94,
      last7Days: { successRate: 100, executions: 21 },
      last30Days: { successRate: 99.0, executions: 78 },
      last90Days: { successRate: 98.7, executions: 156 },
      recommendationsGenerated: 45,
      recommendationsAdopted: 38,
      adoptionRate: 84.4,
      avgTokenUsage: 2000,
      avgCostPerExecution: 0.02,
      lastEvaluatedAt: new Date(Date.now() - 10800000).toISOString(),
      overallScore: 96.2,
      rank: 3
    },
    {
      id: 'productionIntelligence',
      name: 'ProductionIntelligenceAgent',
      nameKo: '생산 지능',
      layer: 'L3',
      domain: 'production',
      totalExecutions: 234,
      successCount: 227,
      failureCount: 7,
      successRate: 97.1,
      avgExecutionTime: 980,
      avgConfidence: 0.92,
      last7Days: { successRate: 97.5, executions: 34 },
      last30Days: { successRate: 97.2, executions: 112 },
      last90Days: { successRate: 97.1, executions: 234 },
      precision: 0.91,
      recall: 0.89,
      f1Score: 0.90,
      recommendationsGenerated: 67,
      recommendationsAdopted: 52,
      adoptionRate: 77.6,
      avgTokenUsage: 1500,
      avgCostPerExecution: 0.015,
      lastEvaluatedAt: new Date(Date.now() - 14400000).toISOString(),
      overallScore: 94.5,
      rank: 4
    },
    {
      id: 'processMonitoringAgent',
      name: 'ProcessMonitoringAgent',
      nameKo: '프로세스 모니터링',
      layer: 'L2',
      domain: 'monitoring',
      totalExecutions: 567,
      successCount: 557,
      failureCount: 10,
      successRate: 98.2,
      avgExecutionTime: 540,
      avgConfidence: 0.95,
      last7Days: { successRate: 98.8, executions: 89 },
      last30Days: { successRate: 98.5, executions: 234 },
      last90Days: { successRate: 98.2, executions: 567 },
      recommendationsGenerated: 34,
      recommendationsAdopted: 28,
      adoptionRate: 82.4,
      avgTokenUsage: 600,
      avgCostPerExecution: 0.006,
      lastEvaluatedAt: new Date(Date.now() - 18000000).toISOString(),
      overallScore: 94.1,
      rank: 5
    },
    {
      id: 'recommendationAgent',
      name: 'RecommendationAgent',
      nameKo: '추천',
      layer: 'L5',
      domain: 'decision',
      totalExecutions: 456,
      successCount: 426,
      failureCount: 30,
      successRate: 93.4,
      avgExecutionTime: 1450,
      avgConfidence: 0.89,
      last7Days: { successRate: 94.2, executions: 67 },
      last30Days: { successRate: 93.8, executions: 178 },
      last90Days: { successRate: 93.4, executions: 456 },
      precision: 0.87,
      recall: 0.85,
      f1Score: 0.86,
      recommendationsGenerated: 234,
      recommendationsAdopted: 178,
      adoptionRate: 76.1,
      avgTokenUsage: 1800,
      avgCostPerExecution: 0.018,
      lastEvaluatedAt: new Date(Date.now() - 21600000).toISOString(),
      overallScore: 91.2,
      rank: 6
    },
    {
      id: 'qualityIntelligence',
      name: 'QualityIntelligenceAgent',
      nameKo: '품질 지능',
      layer: 'L3',
      domain: 'quality',
      totalExecutions: 187,
      successCount: 179,
      failureCount: 8,
      successRate: 95.7,
      avgExecutionTime: 870,
      avgConfidence: 0.91,
      last7Days: { successRate: 96.5, executions: 28 },
      last30Days: { successRate: 96.0, executions: 89 },
      last90Days: { successRate: 95.7, executions: 187 },
      precision: 0.88,
      recall: 0.86,
      f1Score: 0.87,
      recommendationsGenerated: 89,
      recommendationsAdopted: 68,
      adoptionRate: 76.4,
      avgTokenUsage: 1200,
      avgCostPerExecution: 0.012,
      lastEvaluatedAt: new Date(Date.now() - 25200000).toISOString(),
      overallScore: 90.8,
      rank: 7
    },
    {
      id: 'eventDetectionAgent',
      name: 'EventDetectionAgent',
      nameKo: '이벤트 감지',
      layer: 'L2',
      domain: 'monitoring',
      totalExecutions: 789,
      successCount: 763,
      failureCount: 26,
      successRate: 96.7,
      avgExecutionTime: 380,
      avgConfidence: 0.93,
      last7Days: { successRate: 97.2, executions: 123 },
      last30Days: { successRate: 97.0, executions: 345 },
      last90Days: { successRate: 96.7, executions: 789 },
      precision: 0.92,
      recall: 0.88,
      f1Score: 0.90,
      recommendationsGenerated: 0,
      recommendationsAdopted: 0,
      adoptionRate: 0,
      avgTokenUsage: 500,
      avgCostPerExecution: 0.005,
      lastEvaluatedAt: new Date(Date.now() - 28800000).toISOString(),
      overallScore: 90.5,
      rank: 8
    },
    {
      id: 'purchasingIntelligence',
      name: 'PurchasingIntelligenceAgent',
      nameKo: '구매 지능',
      layer: 'L3',
      domain: 'purchasing',
      totalExecutions: 98,
      successCount: 92,
      failureCount: 6,
      successRate: 93.9,
      avgExecutionTime: 1120,
      avgConfidence: 0.90,
      last7Days: { successRate: 94.5, executions: 15 },
      last30Days: { successRate: 94.0, executions: 45 },
      last90Days: { successRate: 93.9, executions: 98 },
      recommendationsGenerated: 45,
      recommendationsAdopted: 34,
      adoptionRate: 75.6,
      avgTokenUsage: 1400,
      avgCostPerExecution: 0.014,
      lastEvaluatedAt: new Date(Date.now() - 32400000).toISOString(),
      overallScore: 88.2,
      rank: 9
    },
    {
      id: 'scenarioAgent',
      name: 'ScenarioAgent',
      nameKo: '시나리오 분석',
      layer: 'L4',
      domain: 'analysis',
      totalExecutions: 89,
      successCount: 79,
      failureCount: 10,
      successRate: 88.8,
      avgExecutionTime: 3200,
      avgConfidence: 0.85,
      last7Days: { successRate: 90.0, executions: 12 },
      last30Days: { successRate: 89.5, executions: 34 },
      last90Days: { successRate: 88.8, executions: 89 },
      precision: 0.82,
      recall: 0.78,
      f1Score: 0.80,
      recommendationsGenerated: 56,
      recommendationsAdopted: 38,
      adoptionRate: 67.9,
      avgTokenUsage: 3500,
      avgCostPerExecution: 0.035,
      lastEvaluatedAt: new Date(Date.now() - 36000000).toISOString(),
      overallScore: 82.5,
      rank: 10
    }
  ];

  // 정렬 및 필터링
  const filteredPerformances = agentPerformances
    .filter(agent => selectedLayer === 'all' || agent.layer === selectedLayer)
    .sort((a, b) => {
      if (sortBy === 'score') return b.overallScore - a.overallScore;
      if (sortBy === 'executions') return b.totalExecutions - a.totalExecutions;
      return b.successRate - a.successRate;
    });

  // 통계
  const stats = {
    avgSuccessRate: agentPerformances.reduce((sum, a) => sum + a.successRate, 0) / agentPerformances.length,
    avgExecutionTime: agentPerformances.reduce((sum, a) => sum + a.avgExecutionTime, 0) / agentPerformances.length,
    totalExecutions: agentPerformances.reduce((sum, a) => sum + a.totalExecutions, 0),
    avgAdoptionRate: agentPerformances.filter(a => a.adoptionRate > 0).reduce((sum, a) => sum + a.adoptionRate, 0) / agentPerformances.filter(a => a.adoptionRate > 0).length,
    totalRecommendations: agentPerformances.reduce((sum, a) => sum + a.recommendationsGenerated, 0),
    totalAdopted: agentPerformances.reduce((sum, a) => sum + a.recommendationsAdopted, 0)
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600 dark:text-green-400';
    if (score >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 85) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
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

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 성능 평가</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            모든 에이전트의 성능 지표와 추이를 분석
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">마지막 평가</div>
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

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">평균</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.avgSuccessRate.toFixed(1)}%</div>
          <div className="text-sm text-blue-100">성공률</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">총</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalExecutions.toLocaleString()}</div>
          <div className="text-sm text-green-100">실행 횟수</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Award className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">채택</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.avgAdoptionRate.toFixed(1)}%</div>
          <div className="text-sm text-purple-100">추천 채택률</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">평균</span>
          </div>
          <div className="text-3xl font-bold mb-1">{(stats.avgExecutionTime / 1000).toFixed(1)}s</div>
          <div className="text-sm text-orange-100">실행 시간</div>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
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
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="score">종합 점수</option>
            <option value="executions">실행 횟수</option>
            <option value="successRate">성공률</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 성과 리더보드 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          성과 리더보드
        </h3>
        <div className="space-y-3">
          {filteredPerformances.slice(0, 10).map((agent, index) => (
            <div key={agent.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              {/* 순위 */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-400' :
                'bg-gray-300'
              }`}>
                {agent.rank}
              </div>

              {/* 에이전트 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLayerBadge(agent.layer)}`}>
                    {agent.layer}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{agent.nameKo}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{agent.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>총 {agent.totalExecutions}회 실행</span>
                  <span>추천 {agent.recommendationsGenerated}건 / 채택 {agent.recommendationsAdopted}건</span>
                </div>
              </div>

              {/* 성공률 */}
              <div className="text-center w-24">
                <div className={`text-lg font-bold ${getScoreColor(agent.successRate)}`}>
                  {agent.successRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">성공률</div>
              </div>

              {/* 추세 */}
              <div className="text-center w-32">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">7일</span>
                  <span className={`font-medium ${agent.last7Days.successRate >= agent.successRate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {agent.last7Days.successRate >= agent.successRate ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {agent.last7Days.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">30일</span>
                  <span className="font-medium text-gray-900 dark:text-white">{agent.last30Days.successRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* 종합 점수 */}
              <div className="text-center w-20">
                <div className={`px-3 py-1 rounded-lg text-lg font-bold ${getScoreBadge(agent.overallScore)}`}>
                  {agent.overallScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 성과 표 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          상세 성과 분석
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">에이전트</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">실행</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">성공률</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">평균 시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">정밀도</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">재현율</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">F1 점수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">채택률</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">종합 점수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPerformances.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      agent.rank === 1 ? 'bg-yellow-500' :
                      agent.rank === 2 ? 'bg-gray-400' :
                      agent.rank === 3 ? 'bg-orange-400' :
                      'bg-gray-300'
                    }`}>
                      {agent.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLayerBadge(agent.layer)}`}>{agent.layer}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{agent.nameKo}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{agent.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {agent.totalExecutions}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-bold ${getScoreColor(agent.successRate)}`}>
                      {agent.successRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {(agent.avgExecutionTime / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {agent.precision ? `${(agent.precision * 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {agent.recall ? `${(agent.recall * 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {agent.f1Score ? (
                      <div className={`text-sm font-bold ${getScoreColor(agent.f1Score * 100)}`}>
                        {(agent.f1Score * 100).toFixed(0)}%
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {agent.adoptionRate > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-16">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${agent.adoptionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{agent.adoptionRate.toFixed(0)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreBadge(agent.overallScore)}`}>
                      {agent.overallScore.toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 개선 필요 에이전트 알림 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <div className="flex-1">
            <div className="font-medium text-yellow-900 dark:text-yellow-100">
              성능 개선이 필요한 에이전트
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              ScenarioAgent, KnowledgeUpdateAgent 등 2개 에이전트가 성능 목표(90점) 미달입니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformanceEvaluation;
