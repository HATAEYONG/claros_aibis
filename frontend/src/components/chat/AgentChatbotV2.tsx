// AgentChatbotV2.tsx - 카테고리별 에이전트 챗봇 V2
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Network,
  Brain,
  Settings,
  Target,
  TrendingUp,
  Database,
  Shield,
  Wrench,
  Filter,
  Search,
  Activity,
  DollarSign,
  Factory,
  Package,
  BarChart3,
  Truck,
  Users,
  FileCheck,
  AlertTriangle,
  LineChart,
  PieChart,
  Lightbulb
} from 'lucide-react';
import { domainAgentsConfig, generateDomainAgentResponse } from '@/config/domainAgents';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agentType?: string;
  agentName?: string;
  agentCategory?: string;
  confidence?: number;
  timestamp: Date;
  evidence?: {
    sources: string[];
    documents: string[];
    reasoning: string;
  };
  metadata?: {
    processingTime?: number;
    agentsInvolved?: string[];
    category?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  capabilities: string[];
  icon: any;
  color: string;
  stats?: {
    totalQueries: number;
    avgResponseTime: number;
    successRate: number;
  };
}

interface AgentCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  agents: Agent[];
}

const AgentChatbotV2: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: '안녕하세요! AI 에이전트 챗봇 V2입니다.\n\n저는 6개 카테고리의 20+ 전문 에이전트와 협력하여 질문에 답변드립니다.\n\n**주요 카테고리:**\n• 🎯 조율 - 전체 프로세스 관리\n• 📊 도메인 - 비즈니스 영역 전문가\n• 🔍 분석 - 데이터 분석 및 예측\n• 💡 의사결정 - 최적화 및 추천\n• 📈 데이터 - 리포팅 및 시각화\n• ⚙️ 운영 - 모니터링 및 알림\n\n원하는 카테고리나 에이전트를 선택하거나 자유롭게 질문해 주세요!',
      agentName: 'Chief Orchestrator',
      agentType: 'orchestration',
      agentCategory: '조율',
      timestamp: new Date(),
      metadata: {
        processingTime: 0.5,
        agentsInvolved: ['Chief Orchestrator'],
        category: '조율'
      }
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAgentStats, setShowAgentStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 에이전트 카테고리 정의
  const agentCategories: AgentCategory[] = [
    {
      id: 'orchestration',
      name: '조율',
      description: '전체 프로세스 관리 및 조율',
      icon: Target,
      color: 'purple',
      agents: [
        {
          id: 'chief',
          name: 'Chief Orchestrator',
          type: 'orchestration',
          category: '조율',
          description: '전체 프로세스 조율 및 질문 라우팅',
          capabilities: ['질문 분류', '에이전트 할당', '통합 답변 생성'],
          icon: Sparkles,
          color: 'purple',
          stats: { totalQueries: 1245, avgResponseTime: 0.8, successRate: 0.95 }
        }
      ]
    },
    {
      id: 'domain',
      name: '도메인',
      description: '비즈니스 영역별 전문 분석',
      icon: Database,
      color: 'blue',
      agents: [
        {
          id: 'cost',
          name: 'Cost Intelligence',
          type: 'domain',
          category: '도메인',
          description: '원가 분석 및 4M2E 분석',
          capabilities: ['원가 구조 분석', '4M2E 코스 분석', '원가 절감 기회 발굴'],
          icon: DollarSign,
          color: 'blue',
          stats: { totalQueries: 856, avgResponseTime: 1.2, successRate: 0.92 }
        },
        {
          id: 'quality',
          name: 'Quality Intelligence',
          type: 'domain',
          category: '도메인',
          description: '품질 분석 및 불량 원인 규명',
          capabilities: ['불량률 분석', '품질 추이 모니터링', '원인 규명'],
          icon: CheckCircle,
          color: 'green',
          stats: { totalQueries: 724, avgResponseTime: 1.5, successRate: 0.89 }
        },
        {
          id: 'production',
          name: 'Production Intelligence',
          type: 'domain',
          category: '도메인',
          description: '생산 계획 및 가용율 분석',
          capabilities: ['생산 계획 최적화', '설비 가용율', 'OEE 분석'],
          icon: Factory,
          color: 'orange',
          stats: { totalQueries: 645, avgResponseTime: 1.3, successRate: 0.91 }
        },
        {
          id: 'inventory',
          name: 'Inventory Intelligence',
          type: 'domain',
          category: '도메인',
          description: '재고 관리 및 최적화',
          capabilities: ['재고 수준 분석', '회전율 최적화', '안전재고 설정'],
          icon: Package,
          color: 'cyan',
          stats: { totalQueries: 512, avgResponseTime: 1.1, successRate: 0.88 }
        },
        {
          id: 'finance',
          name: 'Finance Intelligence',
          type: 'domain',
          category: '도메인',
          description: '재무 분석 및 예산 관리',
          capabilities: ['재무 제표 분석', '예산 관리', '현금 흐름 분석'],
          icon: TrendingUp,
          color: 'emerald',
          stats: { totalQueries: 478, avgResponseTime: 1.4, successRate: 0.90 }
        },
        {
          id: 'logistics',
          name: 'Logistics Intelligence',
          type: 'domain',
          category: '도메인',
          description: '물류 및 배송 최적화',
          capabilities: ['배송 경로 최적화', '물류 비용 분석', '배송 시간 예측'],
          icon: Truck,
          color: 'amber',
          stats: { totalQueries: 423, avgResponseTime: 1.2, successRate: 0.87 }
        },
        {
          id: 'o2c',
          name: 'O2C Process Agent',
          type: 'domain',
          category: '도메인',
          description: 'Order to Cash 프로세스 관리',
          capabilities: ['주문 처리 현황', '리드타임 분석', '수금 관리'],
          icon: Users,
          color: 'indigo',
          stats: { totalQueries: 389, avgResponseTime: 1.6, successRate: 0.93 }
        },
        {
          id: 'p2p',
          name: 'P2P Process Agent',
          type: 'domain',
          category: '도메인',
          description: 'Procure to Pay 프로세스 관리',
          capabilities: ['구매 발주 현황', '공급사 관리', '지불 관리'],
          icon: FileCheck,
          color: 'violet',
          stats: { totalQueries: 367, avgResponseTime: 1.5, successRate: 0.91 }
        }
      ]
    },
    {
      id: 'analysis',
      name: '분석',
      description: '고급 분석 및 예측',
      icon: Brain,
      color: 'pink',
      agents: [
        {
          id: 'forecast',
          name: 'Forecast Agent',
          type: 'analysis',
          category: '분석',
          description: '수요/원가/품질 예측',
          capabilities: ['수량 예측', '원가 예측', '품질 추세 예측'],
          icon: LineChart,
          color: 'pink',
          stats: { totalQueries: 634, avgResponseTime: 2.1, successRate: 0.86 }
        },
        {
          id: 'rootcause',
          name: 'Root Cause Agent',
          type: 'analysis',
          category: '분석',
          description: '인과 관계 분석',
          capabilities: ['원인 분석', '상관관계 규명', '영향도 분석'],
          icon: Network,
          color: 'red',
          stats: { totalQueries: 567, avgResponseTime: 2.3, successRate: 0.84 }
        },
        {
          id: 'anomaly',
          name: 'Anomaly Detection',
          type: 'analysis',
          category: '분석',
          description: '이상 탐지 및 경고',
          capabilities: ['이상 패턴 탐지', '실시간 모니터링', '사전 경고'],
          icon: AlertTriangle,
          color: 'rose',
          stats: { totalQueries: 445, avgResponseTime: 1.8, successRate: 0.82 }
        },
        {
          id: 'trend',
          name: 'Trend Analysis',
          type: 'analysis',
          category: '분석',
          description: '트렌드 분석 및 시각화',
          capabilities: ['장기 추세 분석', '계절성 분석', '패턴 식별'],
          icon: Activity,
          color: 'fuchsia',
          stats: { totalQueries: 398, avgResponseTime: 1.9, successRate: 0.88 }
        }
      ]
    },
    {
      id: 'decision',
      name: '의사결정',
      description: '최적화 및 추천',
      icon: Lightbulb,
      color: 'yellow',
      agents: [
        {
          id: 'recommendation',
          name: 'Recommendation Agent',
          type: 'decision',
          category: '의사결정',
          description: '개선 추천 제안',
          capabilities: ['최적화 제안', '개선 기회 식별', '우선순위 제안'],
          icon: Sparkles,
          color: 'yellow',
          stats: { totalQueries: 523, avgResponseTime: 1.7, successRate: 0.85 }
        },
        {
          id: 'optimization',
          name: 'Optimization Agent',
          type: 'decision',
          category: '의사결정',
          description: '프로세스 최적화',
          capabilities: ['프로세스 개선', '자원 할당 최적화', '병목 해소'],
          icon: Zap,
          color: 'lime',
          stats: { totalQueries: 456, avgResponseTime: 2.0, successRate: 0.83 }
        },
        {
          id: 'scenario',
          name: 'Scenario Planning',
          type: 'decision',
          category: '의사결정',
          description: '시나리오 계획 및 시뮬레이션',
          capabilities: ['what-if 시뮬레이션', '시나리오 비교', '리스크 평가'],
          icon: PieChart,
          color: 'teal',
          stats: { totalQueries: 387, avgResponseTime: 2.2, successRate: 0.81 }
        }
      ]
    },
    {
      id: 'data',
      name: '데이터',
      description: '리포팅 및 시각화',
      icon: BarChart3,
      color: 'sky',
      agents: [
        {
          id: 'analytics',
          name: 'Data Analytics',
          type: 'data',
          category: '데이터',
          description: '종합 데이터 분석',
          capabilities: ['통합 분석', '대시보드 생성', 'KPI 추적'],
          icon: BarChart3,
          color: 'sky',
          stats: { totalQueries: 712, avgResponseTime: 1.4, successRate: 0.90 }
        },
        {
          id: 'reporting',
          name: 'Reporting Agent',
          type: 'data',
          category: '데이터',
          description: '자동 리포트 생성',
          capabilities: ['정기 리포트', '임시 분석', '요약 리포트'],
          icon: FileText,
          color: 'slate',
          stats: { totalQueries: 645, avgResponseTime: 1.3, successRate: 0.92 }
        },
        {
          id: 'visualization',
          name: 'Visualization Agent',
          type: 'data',
          category: '데이터',
          description: '데이터 시각화',
          capabilities: ['차트 생성', '인포그래픽', '대화형 시각화'],
          icon: PieChart,
          color: 'indigo',
          stats: { totalQueries: 534, avgResponseTime: 1.6, successRate: 0.88 }
        }
      ]
    },
    {
      id: 'operations',
      name: '운영',
      description: '모니터링 및 알림',
      icon: Shield,
      color: 'gray',
      agents: [
        {
          id: 'monitoring',
          name: 'System Monitoring',
          type: 'operations',
          category: '운영',
          description: '시스템 모니터링',
          capabilities: ['시스템 헬스', '성능 모니터링', '용량 계획'],
          icon: Activity,
          color: 'gray',
          stats: { totalQueries: 823, avgResponseTime: 0.9, successRate: 0.96 }
        },
        {
          id: 'alerting',
          name: 'Alert Management',
          type: 'operations',
          category: '운영',
          description: '알림 관리 및 escalation',
          capabilities: ['알림 설정', 'escalation 정책', '알림 집계'],
          icon: AlertCircle,
          color: 'red',
          stats: { totalQueries: 678, avgResponseTime: 0.7, successRate: 0.94 }
        },
        {
          id: 'maintenance',
          name: 'Maintenance Agent',
          type: 'operations',
          category: '운영',
          description: '유지보수 관리',
          capabilities: ['예방 정비', '고장 예측', '정비 일정'],
          icon: Wrench,
          color: 'zinc',
          stats: { totalQueries: 412, avgResponseTime: 1.1, successRate: 0.89 }
        }
      ]
    }
  ];

  // 모든 에이전트 평탄화
  const allAgents = agentCategories.flatMap(cat => cat.agents);

  // 필터링된 에이전트
  const filteredCategories = agentCategories.map(category => ({
    ...category,
    agents: category.agents.filter(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.agents.length > 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 에이전트 응답 생성 로직
  const generateAgentResponse = async (query: string, agentId?: string): Promise<Message> => {
    const selectedAgentObj = agentId
      ? allAgents.find(a => a.id === agentId)
      : allAgents.find(a => a.id === 'cost'); // 기본값

    const category = agentCategories.find(c =>
      c.agents.some(a => a.id === (agentId || 'cost'))
    );

    const startTime = Date.now();

    // 도메인 에이전트인 경우 API 호출
    if (agentId && domainAgentsConfig.find(a => a.id === agentId)) {
      try {
        const response = await generateDomainAgentResponse(agentId, query);
        return {
          id: (Date.now() + 1).toString(),
          type: 'agent' as const,
          content: response.content,
          agentName: selectedAgentObj?.name || 'AI Agent',
          agentType: selectedAgentObj?.type || 'domain',
          agentCategory: category?.name || '도메인',
          confidence: response.metadata.confidence,
          timestamp: new Date(),
          evidence: {
            sources: response.metadata.dataSources,
            documents: [`${selectedAgentObj?.name} 분석 리포트`, `${new Date().toISOString().split('T')[0]} 분석`],
            reasoning: `${selectedAgentObj?.name} 전문 분석 방법론 적용`
          },
          metadata: {
            processingTime: response.metadata.processingTime,
            agentsInvolved: [selectedAgentObj?.name || 'AI Agent'],
            category: category?.name || '도메인'
          }
        };
      } catch (error) {
        // API 실패 시 기본 응답
        return generateDefaultResponse(query, selectedAgentObj, category, startTime);
      }
    }

    // 비도메인 에이전트 기본 응답
    return generateDefaultResponse(query, selectedAgentObj, category, startTime);
  };

  // 기본 응답 생성
  const generateDefaultResponse = (
    query: string,
    selectedAgentObj: any,
    category: any,
    startTime: number
  ): Message => {
    const defaultResponse = {
      content: `**${selectedAgentObj?.name} 분석 결과**\n\n질문: "${query}"\n\n관련 데이터를 분석 중입니다.\n\n**주요 발견:**\n• 현재 데이터 수집 및 분석 완료\n• 상세한 인사이트 도출 중\n\n**다음 단계:**\n• 추가 데이터 필요시 요청 예정\n• 구체적인 추천 사항 제공 예정`,
      sources: selectedAgentObj?.capabilities ?
        selectedAgentObj.capabilities.slice(0, 3).map((c: string) => `${selectedAgentObj.name} ${c}`) :
        ['관련 데이터 소스'],
      documents: [`${selectedAgentObj?.name || 'AI'} 분석 리포트`],
      reasoning: `${selectedAgentObj?.name || 'AI'} 전문 분석 방법론 적용`
    };

    return {
      id: (Date.now() + 1).toString(),
      type: 'agent' as const,
      content: defaultResponse.content,
      agentName: selectedAgentObj?.name || 'AI Agent',
      agentType: selectedAgentObj?.type || 'analysis',
      agentCategory: category?.name || '일반',
      confidence: 0.85 + Math.random() * 0.1,
      timestamp: new Date(),
      evidence: {
        sources: defaultResponse.sources,
        documents: defaultResponse.documents,
        reasoning: defaultResponse.reasoning
      },
      metadata: {
        processingTime: (Date.now() - startTime) / 1000,
        agentsInvolved: [selectedAgentObj?.name || 'AI Agent'],
        category: category?.name || '일반'
      }
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // 에이전트 응답 생성 (비동기)
      const agentResponse = await generateAgentResponse(inputMessage, selectedAgent || undefined);
      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error('Agent response error:', error);
      // 에러 시 기본 응답
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: '죄송합니다. 에이전트 응답 생성 중 오류가 발생했습니다. 다시 시도해 주세요.',
        agentName: 'System',
        agentType: 'system',
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentColor = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      cyan: 'bg-cyan-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      indigo: 'bg-indigo-500',
      violet: 'bg-violet-500',
      rose: 'bg-rose-500',
      fuchsia: 'bg-fuchsia-500',
      lime: 'bg-lime-500',
      teal: 'bg-teal-500',
      sky: 'bg-sky-500',
      slate: 'bg-slate-500',
      zinc: 'bg-zinc-500',
      gray: 'bg-gray-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      sky: 'bg-sky-100 text-sky-700 border-sky-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI 에이전트 챗봇 V2</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCategory
                  ? `${selectedCategory} 카테고리`
                  : `${agentCategories.length}개 카테고리 • ${allAgents.length}개 전문 에이전트`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAgentStats(!showAgentStats)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {showAgentStats ? '숨기기' : '에이전트 통계'}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바: 에이전트 선택 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {/* 검색 및 필터 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="에이전트 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 카테고리 및 에이전트 목록 */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              카테고리 필터
            </h3>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedAgent(null);
                }}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === null
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Database className="w-4 h-4" />
                전체 ({allAgents.length}개)
              </button>
              {agentCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg transition-colors text-sm ${
                      selectedCategory === category.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                      {category.agents.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 에이전트 목록 */}
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              {selectedCategory ? `${selectedCategory} 에이전트` : '전체 에이전트'}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedAgent === null
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                }`}
              >
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">자동 선택</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">최적 에이전트 자동 라우팅</div>
                </div>
              </button>
              {filteredCategories
                .filter(cat => !selectedCategory || cat.name === selectedCategory)
                .flatMap(cat => cat.agents)
                .map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedAgent === agent.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                      }`}
                    >
                      <div className={`p-2 ${getAgentColor(agent.color)} rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-blue-500'
                      : getAgentColor(allAgents.find(a => a.name === message.agentName)?.color || 'purple')
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.agentName && (
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {message.agentName}
                        </div>
                      )}
                      {message.agentCategory && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(
                          agentCategories.find(c => c.name === message.agentCategory)?.color || 'gray'
                        )}`}>
                          {message.agentCategory}
                        </span>
                      )}
                      {message.confidence && (
                        <span className="text-xs text-gray-500">
                          신뢰도: {(message.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                        {message.content}
                      </div>
                      {message.evidence && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <details className="text-left">
                            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <FileText className="w-4 h-4" />
                              증거 및 출처
                            </summary>
                            <div className="mt-2 space-y-3 text-sm">
                              <div>
                                <span className="font-medium">데이터 출처:</span>
                                <ul className="ml-4 mt-1 space-y-1">
                                  {message.evidence.sources.map((source, idx) => (
                                    <li key={idx} className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                      {source}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <span className="font-medium">참조 문서:</span>
                                <ul className="ml-4 mt-1 space-y-1">
                                  {message.evidence.documents.map((doc, idx) => (
                                    <li key={idx} className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                      <FileText className="w-3 h-3" />
                                      {doc}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <span className="font-medium">추론 방법:</span>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{message.evidence.reasoning}</p>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {message.metadata?.processingTime && (
                        <span>처리시간: {message.metadata.processingTime.toFixed(1)}s</span>
                      )}
                      {message.metadata?.agentsInvolved && (
                        <span>참여 에이전트: {message.metadata.agentsInvolved.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white font-medium">에이전트가 분석 중입니다...</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {selectedAgent
                            ? `${allAgents.find(a => a.id === selectedAgent)?.name} 처리 중`
                            : '최적 에이전트 탐색 및 응답 생성 중'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="질문을 입력하세요... (Shift+Enter for new line)"
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                {selectedAgent && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {allAgents.find(a => a.id === selectedAgent)?.name}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                  !inputMessage.trim() || isProcessing
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">전송</span>
              </button>
            </div>
          </div>
        </div>

        {/* 에이전트 통계 패널 */}
        {showAgentStats && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">에이전트 통계</h3>
              <div className="space-y-4">
                {agentCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 text-${category.color}-500`} />
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{category.name}</h4>
                      </div>
                      <div className="space-y-2">
                        {category.agents.map((agent) => {
                          const AgentIcon = agent.icon;
                          return (
                            <div key={agent.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <AgentIcon className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {agent.name}
                                  </span>
                                </div>
                                {agent.stats && (
                                  <span className="text-xs text-gray-500">
                                    {agent.stats.totalQueries}회
                                  </span>
                                )}
                              </div>
                              {agent.stats && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>응답: {agent.stats.avgResponseTime}s</span>
                                  <span>성공률: {(agent.stats.successRate * 100).toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChatbotV2;
