// AgentLearningLogs.tsx - 에이전트 학습 로그 컴포넌트
import { useState, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  MessageSquare,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ReflectionLog {
  id: string;
  agent_run_id: string;
  agent_name: string;
  agent_type: string;
  reflection_type: 'outcome' | 'process' | 'strategy';
  original_goal: string;
  actual_outcome: string;
  insights: string;
  lessons_learned: string;
  suggested_improvements: string;
  created_at: string;
  applied?: boolean;
}

interface AgentMemory {
  id: string;
  memory_type: 'experience' | 'knowledge' | 'pattern';
  source_type: string;
  source_id: string;
  content: Record<string, any>;
  context: Record<string, any>;
  importance: number;
  access_count: number;
  created_at: string;
  last_accessed?: string;
}

interface KnowledgeUpdate {
  id: string;
  agent_name: string;
  update_type: 'concept_add' | 'relation_add' | 'property_update' | 'rule_learn';
  description: string;
  nodes_affected: number;
  confidence: number;
  created_at: string;
  verified: boolean;
}

const AgentLearningLogs: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'reflection' | 'memory' | 'knowledge'>('reflection');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  // 반성 로그 데이터
  const reflectionLogs: ReflectionLog[] = [
    {
      id: 'refl001',
      agent_run_id: 'run-025',
      agent_name: 'ForecastAgent',
      agent_type: '예측',
      reflection_type: 'outcome',
      original_goal: '90일 후 매출을 MAPE 10% 이하로 예측',
      actual_outcome: 'MAPE 12.3% 달성. 목표 미달 but 충분히 활용 가능한 수준',
      insights: '전통적인 ARIMA 모델보다 LSTM 기반 딥러닝 모델이 계절성 패턴을 더 잘 포착함. 특히 3-4월 성수기 예측 정확도가 25% 향상됨.',
      lessons_learned: '1) 계절성이 강한 데이터에는 딥러닝 모델이 우수\n2) 최소 2년 이상의 데이터가 필요함\n3) 외부 변수(경기 지표, 경쟁사 동향) 추가 필요',
      suggested_improvements: '경기 선행 지수를 외부 변수로 추가하여 모델 재학습. 목표 MAPE 8% 이하',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      applied: true
    },
    {
      id: 'refl002',
      agent_run_id: 'run-028',
      agent_name: 'RootCauseAgent',
      agent_type: '근본 원인 분석',
      reflection_type: 'process',
      original_goal: '치수 불량의 근본 원인을 3단계 깊이로 파악',
      actual_outcome: '5단계 깊이까지 분석 완료. 프레스 금형 마모 → 온도 제어 불안정 → 냉각수 온도 변동 → 냉각탑 성능 저하 → 냉각탑 필터 교체 주기 초과',
      insights: '단순히 금형 마모로만 보고 있었으나, 실제로는 냉각 시스템의 누적된 성능 저하가 근본 원인임. 금형 교체만으로는 재발 가능성 높음.',
      lessons_learned: '1) 근본 원인 분석은 최소 5단계 이상 권장\n2) 인접 공정 간의 상관관계 분석 필요\n3) 설비 간 종속성을 고려한 분석 필요',
      suggested_improvements: '냉각탑 필터 교체 주기를 3개월에서 2개월로 단축. 냉각수 온도 모니터링 강화',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      applied: false
    },
    {
      id: 'refl003',
      agent_run_id: 'run-031',
      agent_name: 'RecommendationAgent',
      agent_type: '추천',
      reflection_type: 'strategy',
      original_goal: '원가 절감 추천사항 5개 생성, 채택 목표 60%',
      actual_outcome: '8개 추천 생성, 채택률 75% (6/8). 목표 초과 달성',
      insights: '추천사항에 ROI 정보와 구현 난이도를 포함하면 채택률이 40%에서 75%로 크게 향상됨. 특히 단기(3개월 이내) 효과가 있는 추천이 선호됨.',
      lessons_learned: '1) 정량적 ROI 제공 필수\n2) 단기/장기 효과 구분\n3) 구현 난이도 정보 포함\n4) 유사 사례 참고 추가',
      suggested_improvements: '추천 템플릿을 개선하여 ROI, 구현 기간, 선행 조건, 유사 사례를 표준 포함. 모든 추천에 실행 가능성 점수 추가',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      applied: true
    },
    {
      id: 'refl004',
      agent_run_id: 'run-034',
      agent_name: 'CostIntelligenceAgent',
      agent_type: '원가 지능',
      reflection_type: 'outcome',
      original_goal: '4M2E 기반 원가 편차 탐지, 드라이버 상위 3개 식별',
      actual_outcome: '5개 편차 탐지, 드라이버 정확도 92%. 철강재, 알루미늄, 전자부품, 도료, 인건비 순',
      insights: '원가 드라이버 분석 시 원자재 가격 변동성보다 공급업체별 협상력 차이가 더 큰 영향을 미침. 단일 공급업체 의존도가 높은 품목에서 원가 편차 큼.',
      lessons_learned: '1) 시장 가격 변동성만큼 공급사 체력 중요\n2) 장기 계약 vs 단발 계약 비교 분석 필요\n3) 공급업체 다변화가 원가 안정화 핵심',
      suggested_improvements: '공급업체 리스크 지수를 원가 분석에 통합. 매 분기별 공급업체 협상력 평가',
      created_at: new Date(Date.now() - 432000000).toISOString(),
      applied: true
    },
    {
      id: 'refl005',
      agent_run_id: 'run-037',
      agent_name: 'KnowledgeUpdateAgent',
      agent_type: '지식 업데이트',
      reflection_type: 'process',
      original_goal: '새로운 공정 Knowledge Graph에 통합',
      actual_outcome: '신규 컨셉 12개, 관계 28개 추가. 검증 완료율 85%',
      insights: '자동 추출된 Knowledge 중 15%가 오류. 특히 하위 개념 간 관계에서 오류 많음. 도메인 전문가 검증 단계 필수.',
      lessons_learned: '1) 자동 추출 정확도 향상 필요\n2) 신뢰도 점수 기반 필터링 필요\n3) 전문가 검증 워크플로우 구축 필요',
      suggested_improvements: '신뢰도 0.8 이상만 Knowledge Graph에 통합. 전문가 검증 대기열 시스템 구축',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      applied: false
    }
  ];

  // 에이전트 메모리 데이터
  const agentMemories: AgentMemory[] = [
    {
      id: 'mem001',
      memory_type: 'experience',
      source_type: 'agent_run',
      source_id: 'run-025',
      content: {
        summary: 'LSTM 모델이 계절성 패턴 예측에 탁월',
        model_type: 'LSTM',
        accuracy_improvement: '25%',
        best_use_case: 'seasonal_forecasting'
      },
      context: {
        domain: 'forecasting',
        data_period: '2024-2025',
        target_kpi: 'revenue'
      },
      importance: 0.92,
      access_count: 45,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      last_accessed: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'mem002',
      memory_type: 'knowledge',
      source_type: 'root_cause_analysis',
      source_id: 'rc_001',
      content: {
        pattern: '냉각 시스템 성능 저하 → 치수 불량',
        causal_chain: ['냉각탑 필터', '냉각수 온도', '금형 온도', '치수 정밀도'],
        confidence: 0.94,
        verified_cases: 8
      },
      context: {
        process: 'press',
        quality_issue: 'dimensional_defect',
        time_period: '2025-Q1'
      },
      importance: 0.95,
      access_count: 67,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      last_accessed: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'mem003',
      memory_type: 'pattern',
      source_type: 'recommendation_analysis',
      source_id: 'rec_analysis_001',
      content: {
        pattern: 'ROI 정보 포함 시 추천 채택률 87% 향상',
        base_rate: 0.40,
        enhanced_rate: 0.75,
        improvement_factor: 1.87,
        sample_size: 156
      },
      context: {
        domain: 'recommendation',
        period: '2025-01 to 2025-03',
        recommendation_types: ['cost_reduction', 'quality_improvement']
      },
      importance: 0.88,
      access_count: 89,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      last_accessed: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'mem004',
      memory_type: 'experience',
      source_type: 'cost_analysis',
      source_id: 'cost_001',
      content: {
        insight: '공급업체 협상력이 시장 가격 변동성보다 중요',
        key_factors: ['single_supplier_risk', 'contract_terms', 'volume_commitment'],
        saving_potential: '15-25%',
        applicable_items: ['steel', 'aluminum', 'electronic_parts']
      },
      context: {
        domain: 'cost_management',
        analysis_period: '2025-Q1',
        supplier_count: 23
      },
      importance: 0.85,
      access_count: 34,
      created_at: new Date(Date.now() - 432000000).toISOString(),
      last_accessed: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'mem005',
      memory_type: 'knowledge',
      source_type: 'quality_analysis',
      source_id: 'qa_001',
      content: {
        rule: '용접 불량률과 습도 간 상관관계',
        threshold: 65,
        correlation: 0.78,
        action: '습도 65% 이상시 용접 공정 일시 중단 고려',
        confidence: 0.91
      },
      context: {
        process: 'welding',
        quality_metric: 'defect_rate',
        environmental_factors: ['humidity', 'temperature']
      },
      importance: 0.82,
      access_count: 56,
      created_at: new Date(Date.now() - 604800000).toISOString(),
      last_accessed: new Date(Date.now() - 10800000).toISOString()
    }
  ];

  // Knowledge 업데이트 데이터
  const knowledgeUpdates: KnowledgeUpdate[] = [
    {
      id: 'ku001',
      agent_name: 'KnowledgeUpdateAgent',
      update_type: 'concept_add',
      description: '냉각 시스템 성능 저하 컨셉 추가 및 관계 정의',
      nodes_affected: 8,
      confidence: 0.94,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      verified: true
    },
    {
      id: 'ku002',
      agent_name: 'KnowledgeUpdateAgent',
      update_type: 'relation_add',
      description: '공급업체 협상력 → 원가 안정성 인과관계 추가',
      nodes_affected: 5,
      confidence: 0.88,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      verified: true
    },
    {
      id: 'ku003',
      agent_name: 'QualityIntelligenceAgent',
      update_type: 'rule_learn',
      description: '습도-용접 불량률 규칙 학습 (임계값 65%)',
      nodes_affected: 3,
      confidence: 0.91,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      verified: true
    },
    {
      id: 'ku004',
      agent_name: 'EvaluationAgent',
      update_type: 'property_update',
      description: 'ForecastAgent 정확도 속성 업데이트 (MAPE 8.5%)',
      nodes_affected: 1,
      confidence: 0.97,
      created_at: new Date(Date.now() - 432000000).toISOString(),
      verified: true
    },
    {
      id: 'ku005',
      agent_name: 'MemoryCuratorAgent',
      update_type: 'concept_add',
      description: 'ROI 정보 포함 추천 템플릿 컨셉 추가',
      nodes_affected: 12,
      confidence: 0.92,
      created_at: new Date(Date.now() - 604800000).toISOString(),
      verified: false
    }
  ];

  // 필터링
  const filteredReflections = reflectionLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.original_goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.insights.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agent_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || log.reflection_type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredMemories = agentMemories.filter(mem => {
    const matchesSearch = searchQuery === '' ||
      JSON.stringify(mem.content).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || mem.memory_type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredKnowledge = knowledgeUpdates.filter(upd => {
    const matchesSearch = searchQuery === '' ||
      upd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upd.agent_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || upd.update_type === selectedType;
    return matchesSearch && matchesType;
  });

  // 통계
  const stats = {
    totalReflections: reflectionLogs.length,
    appliedReflections: reflectionLogs.filter(r => r.applied).length,
    totalMemories: agentMemories.length,
    avgImportance: agentMemories.reduce((sum, m) => sum + m.importance, 0) / agentMemories.length,
    totalKnowledgeUpdates: knowledgeUpdates.length,
    verifiedUpdates: knowledgeUpdates.filter(k => k.verified).length
  };

  const getReflectionTypeColor = (type: string) => {
    switch (type) {
      case 'outcome': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'process': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'strategy': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'experience': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'knowledge': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pattern': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'concept_add': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'relation_add': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'property_update': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rule_learn': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 학습 로그</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            에이전트의 반성, 메모리, 지식 업데이트 추적
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
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">반성</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalReflections}</div>
          <div className="text-sm text-purple-100">총 반성 로그</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Sparkles className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">메모리</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalMemories}</div>
          <div className="text-sm text-yellow-100">저장된 메모리</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">지식</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalKnowledgeUpdates}</div>
          <div className="text-sm text-blue-100">Knowledge 업데이트</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">적용</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.appliedReflections}</div>
          <div className="text-sm text-green-100">적용된 개선</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Award className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">중요도</span>
          </div>
          <div className="text-3xl font-bold mb-1">{(stats.avgImportance * 100).toFixed(0)}%</div>
          <div className="text-sm text-orange-100">평균 중요도</div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'reflection' as const, label: '반성 로그', icon: MessageSquare },
            { id: 'memory' as const, label: '에이전트 메모리', icon: Brain },
            { id: 'knowledge' as const, label: 'Knowledge 업데이트', icon: Sparkles },
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
          {/* 필터 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">전체 유형</option>
              {selectedTab === 'reflection' && (
                <>
                  <option value="outcome">결과 반성</option>
                  <option value="process">프로세스 반성</option>
                  <option value="strategy">전략 반성</option>
                </>
              )}
              {selectedTab === 'memory' && (
                <>
                  <option value="experience">경험</option>
                  <option value="knowledge">지식</option>
                  <option value="pattern">패턴</option>
                </>
              )}
              {selectedTab === 'knowledge' && (
                <>
                  <option value="concept_add">컨셉 추가</option>
                  <option value="relation_add">관계 추가</option>
                  <option value="property_update">속성 업데이트</option>
                  <option value="rule_learn">규칙 학습</option>
                </>
              )}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>

          {/* 반성 로그 탭 */}
          {selectedTab === 'reflection' && (
            <div className="space-y-4">
              {filteredReflections.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getReflectionTypeColor(log.reflection_type)}`}>
                            {log.reflection_type === 'outcome' ? '결과 반성' :
                             log.reflection_type === 'process' ? '프로세스 반성' : '전략 반성'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {log.agent_name} ({log.agent_type})
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(log.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{log.original_goal}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{log.actual_outcome}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.applied && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                            <CheckCircle className="w-3 h-3" />
                            적용됨
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedItem(expandedItem === log.id ? null : log.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {expandedItem === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedItem === log.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            인사이트
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{log.insights}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            학습 내용
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{log.lessons_learned}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          개선 제안
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{log.suggested_improvements}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 메모리 탭 */}
          {selectedTab === 'memory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMemoryTypeColor(mem.memory_type)}`}>
                        {mem.memory_type === 'experience' ? '경험' :
                         mem.memory_type === 'knowledge' ? '지식' : '패턴'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(mem.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>중요도: {(mem.importance * 100).toFixed(0)}%</span>
                      <span>|</span>
                      <span>조회: {mem.access_count}</span>
                    </div>
                  </div>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto mb-3">
                    {JSON.stringify(mem.content, null, 2)}
                  </pre>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    출처: {mem.source_type} / {mem.source_id}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge 업데이트 탭 */}
          {selectedTab === 'knowledge' && (
            <div className="space-y-3">
              {filteredKnowledge.map((upd) => (
                <div
                  key={upd.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className={`w-2 h-2 rounded-full ${upd.verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUpdateTypeColor(upd.update_type)}`}>
                        {upd.update_type === 'concept_add' ? '컨셉 추가' :
                         upd.update_type === 'relation_add' ? '관계 추가' :
                         upd.update_type === 'property_update' ? '속성 업데이트' : '규칙 학습'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{upd.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{upd.agent_name}</span>
                      <span>영향 노드: {upd.nodes_affected}개</span>
                      <span>신뢰도: {(upd.confidence * 100).toFixed(0)}%</span>
                      <span>{new Date(upd.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    upd.verified
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {upd.verified ? '검증 완료' : '검증 대기'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentLearningLogs;
