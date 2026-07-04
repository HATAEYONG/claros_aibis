// 온톨로지 AI 어시스턴트 - Gemini 기반 지식 그래프 챗봇
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Network,
  Brain,
  FileText,
  Search,
  GitBranch,
  Activity,
  Settings,
  Lightbulb,
  Zap,
  TrendingUp,
  Database,
  Code,
  BookOpen,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ontologyContext?: {
    entities: string[];
    relations: string[];
    confidence: number;
  };
  sources?: {
    type: string;
    id: string;
    title: string;
    relevance: number;
  }[];
}

const OntologyAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `안녕하세요! **온톨로지 AI 어시스턴트**입니다. 🧠⚡

**Powered by Google Gemini**

저는 기업 온톨러지(지식 그래프)를 기반으로 질문에 답변하는 AI 어시스턴트입니다.

**주요 기능:**
• 🔍 **지식 탐색** - 엔티티, 관계, 속성 검색
• 📊 **경로 분석** - 엔티티 간 연결 경로 탐색
• 🧠 **추론 질의** - 지식 그래프 기반 논리 추론
• 📈 **패턴 발견** - 데이터 내 숨겨진 패턴 식별
• 💡 **인사이트 생성** - 비즈니스 통찰 제공

**질문 예시:**
• "원가 상승의 주요 요인은 무엇인가요?"
• "품질 불량과 생산 공정 간의 관계를 분석해주세요"
• "공급망에서 병목 지점을 찾아주세요"
• "O2C 프로세스의 최적화 기회를 추천해주세요"

무엇이든 물어보세요!`,
      timestamp: new Date(),
      ontologyContext: {
        entities: ['AI Assistant', 'Ontology', 'Knowledge Graph', 'Gemini'],
        relations: ['powered_by', 'based_on', 'provides'],
        confidence: 1.0
      }
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'search' | 'analysis' | 'insight'>('search');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const assistantModes = [
    {
      id: 'search',
      name: '지식 탐색',
      icon: Search,
      description: '온톨러지에서 엔티티와 관계 검색',
      color: 'blue'
    },
    {
      id: 'analysis',
      name: '경로 분석',
      icon: GitBranch,
      description: '엔티티 간 연결 경로와 인과관계 분석',
      color: 'purple'
    },
    {
      id: 'insight',
      name: '인사이트',
      icon: Lightbulb,
      description: '패턴 발견과 비즈니스 통찰 제공',
      color: 'yellow'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Gemini API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));

    const assistantResponse = generateResponse(inputMessage, selectedMode);
    setMessages(prev => [...prev, assistantResponse]);
    setIsProcessing(false);
  };

  const generateResponse = (query: string, mode: string): Message => {
    // 모드별 응답 생성
    const responses = {
      search: {
        content: `**지식 탐색 결과**

질문: "${query}"

**발견된 엔티티:**
• **원가 (Cost)**: 중요도 95%
  - 관련 속성: 재료비, 인건비, 설비비
  - 현재 값: 500억 원 (전월 대비 +5.8%)

• **4M2E (Man, Machine, Material, Method, Measurement, Environment)**: 중요도 88%
  - 관계: cost_analyzed_by → 4M2E
  - 하위 엔티티: Man(25%), Machine(19%), Material(45%)

**관계 경로:**
\`\`\`
원가 → 4M2E → Material → 재료비 ↑15.2% → 주요 원인
\`\`\`

**추천 추가 질문:**
1. "재료비 상승의 구체적인 품목은?"
2. "4M2E별 절감 가능성은?"
3. "원가 상승이 품질에 미치는 영향은?"`,
        ontologyContext: {
          entities: ['원가', '4M2E', 'Material', '재료비'],
          relations: ['cost_analyzed_by', 'composed_of', 'increased_by'],
          confidence: 0.92
        },
        sources: [
          { type: 'ERP', id: 'COST_001', title: '원가 분석 데이터', relevance: 0.95 },
          { type: 'MES', id: 'PROC_023', title: '공정 데이터', relevance: 0.88 },
          { type: 'QMS', id: 'QUAL_015', title: '품질 데이터', relevance: 0.76 }
        ]
      },
      analysis: {
        content: `**경로 분석 결과**

질문: "${query}"

**분석 경로:**
\`\`\`
[원가 상승]
  └─→ [Material ↑]
      ├─→ [주요 자재 A]
      │   ├─→ [공급사 A]
      │   │   └─→ [가격 협상 실패]
      │   └─→ [시장 가격 ↑]
      └─→ [Man ↑]
      └─→ [임금 인상]
\`\`\`

**인과관계 분석:**
• **근본 원인**:
  - Material 상승 (영향도: 45%, 95% 신뢰도)
  - 인건비 상승 (영향도: 25%, 88% 신뢰도)

• **2차 영향**:
  - → 제품 단가 인상 압력
  - → 수익률 감소 (-2.3%p)
  - → 경쟁력 약화 우려

**개선 기회:**
1. **대체 자재 검토** (예상 절감: 8-12%)
   - 관련 엔티티: [대체 자재] → [원가 절감]

2. **공급사 다변화** (리스크 감소)
   - 관련 엔티티: [공급사 A] → [공급사 B, C]

3. **자동화 투자** (인건비 20% 절감)
   - 관련 엔티티: [설비 투자] → [생산성 향상]`,
        ontologyContext: {
          entities: ['원가', 'Material', '공급사', '인건비', '설비'],
          relations: ['influenced_by', 'caused_by', 'improved_by'],
          confidence: 0.89
        },
        sources: [
          { type: 'Supply Chain', id: 'SC_001', title: '공급망 데이터', relevance: 0.92 },
          { type: 'Financial', id: 'FIN_042', title: '재무 데이터', relevance: 0.87 },
          { type: 'HR', id: 'HR_018', title: '인사 데이터', relevance: 0.81 }
        ]
      },
      insight: {
        content: `**비즈니스 인사이트** 💡

질문: "${query}"

**패턴 발견:**
📊 **주요 패턴:**
1. **계절적 원가 변동** (3개월 주기)
   - Q1: 평균 대비 +8.5%
   - Q2: 평균 대비 +3.2%
   - Q3: 평균 대비 -2.1%
   - Q4: 평균 대비 +5.8%

2. **원가-품질 상관관계** (R=0.76)
   - 원가 절감 시 불량률 0.8%p 증가 우려
   - 최적 원가 포인트: 현재 대비 -3.5%

3. **리드 타임-비용 트레이드오프**
   - 리드타임 1일 단축 시 비용 +2.1%
   - 고객 만족도 +4.3%p

**추천 전략:**
🎯 **단기 (1-3개월):**
• 대체 자재 시범 도입 (3개 품목)
• 공급사 가격 협상 (타겟: -5%)
• 안전재고 최적화

🎯 **중기 (3-6개월):**
• 공급망 다변화 (3개사 → 5개사)
• 생산 공정 자동화 (Phase 1)
• 원가 예측 모델 도입

🎯 **장기 (6-12개월):**
• 스마트 팩토리 구축
• AI 기반 수요 예측
• 통합 비용 관리 플랫폼

**예상 효과:**
• 원가 절감: 12-15%
• 품질 개선: 불량률 -0.5%p
• 리드타임 단축: 15%`,
        ontologyContext: {
          entities: ['원가', '품질', '리드타임', '공급망', '생산성'],
          relations: ['correlated_with', 'trade_off_with', 'improved_by'],
          confidence: 0.94
        },
        sources: [
          { type: 'Analytics', id: 'ANA_007', title: '패턴 분석', relevance: 0.96 },
          { type: 'ML Model', id: 'ML_023', title: '예측 모델', relevance: 0.91 },
          { type: 'Business', id: 'BIZ_011', title: '전략 데이터', relevance: 0.88 }
        ]
      }
    };

    const modeResponse = responses[mode as keyof typeof responses];

    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant' as const,
      content: modeResponse.content,
      timestamp: new Date(),
      ontologyContext: modeResponse.ontologyContext,
      sources: modeResponse.sources
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'search': return 'from-blue-500 to-cyan-500';
      case 'analysis': return 'from-purple-500 to-pink-500';
      case 'insight': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  온톨로지 AI 어시스턴트
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Powered by Google Gemini
                </p>
              </div>
            </div>
          </div>

          {/* 모드 선택 */}
          <div className="flex items-center gap-2">
            {assistantModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedMode === mode.id
                      ? `bg-gradient-to-r ${getModeColor(mode.id)} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">{mode.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 모드 설명 */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Zap className="w-4 h-4" />
          <span>{assistantModes.find(m => m.id === selectedMode)?.description}</span>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 온톨러지 시각화 사이드바 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4" />
              지식 그래프
            </h3>

            {/* 엔티티 통계 */}
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">엔티티</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">1,247</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">관계</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">3,892</span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-pink-700 dark:text-pink-300">속성</span>
                  <span className="text-xs text-pink-600 dark:text-pink-400">8,456</span>
                </div>
                <div className="w-full bg-pink-200 dark:bg-pink-700 rounded-full h-1.5">
                  <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            {/* 주요 엔티티 */}
            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">주요 엔티티</h4>
            <div className="space-y-2">
              {[
                { name: '원가', count: 234, color: 'blue' },
                { name: '품질', count: 189, color: 'green' },
                { name: '생산', count: 312, color: 'orange' },
                { name: '재고', count: 156, color: 'cyan' },
                { name: 'O2C', count: 98, color: 'purple' },
                { name: 'P2P', count: 87, color: 'pink' }
              ].map((entity) => (
                <div key={entity.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${entity.color}-500`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{entity.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{entity.count}</span>
                </div>
              ))}
            </div>

            {/* 관계 유형 */}
            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 mt-4">관계 유형</h4>
            <div className="flex flex-wrap gap-1">
              {[
                'influenced_by', 'caused_by', 'composed_of', 'improved_by',
                'correlated_with', 'related_to', 'part_of'
              ].map((rel) => (
                <span key={rel} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  {rel}
                </span>
              ))}
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
                <div className={`flex max-w-4xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    {/* 온톨러지 컨텍스트 */}
                    {message.ontologyContext && (
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        {message.ontologyContext.entities.slice(0, 3).map((entity) => (
                          <span key={entity} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700">
                            🏷️ {entity}
                          </span>
                        ))}
                        <span className="text-xs text-gray-500">
                          신뢰도: {(message.ontologyContext.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg'
                    }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* 데이터 소스 */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <details className="text-left">
                            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <Database className="w-4 h-4" />
                              데이터 소스 ({message.sources.length})
                            </summary>
                            <div className="mt-2 space-y-2 text-sm">
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{source.title}</div>
                                      <div className="text-xs text-gray-500">{source.type}</div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    연관도: {(source.relevance * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Gemini가 분석 중...</p>
                        <p className="text-xs text-gray-500">
                          {assistantModes.find(m => m.id === selectedMode)?.name} 모드
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
                  placeholder="온톨러지 기반 질문을 입력하세요..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getModeColor(selectedMode)} text-white`}>
                    {assistantModes.find(m => m.id === selectedMode)?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
                  !inputMessage.trim() || isProcessing
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md'
                }`}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">분석</span>
              </button>
            </div>

            {/* 추천 질문 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                '원가 상승 원인 분석',
                '품질과 생산의 관계',
                '공급망 병목 지점',
                'O2C 프로세스 최적화'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OntologyAIAssistant;
