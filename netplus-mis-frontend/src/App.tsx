import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import ToastContainer from '@/components/common/Toast';
import Dashboard from '@/components/dashboard/Dashboard';
import FinancialManagement from '@/components/dashboard/FinancialManagement';
import FinancialIndicators from '@/components/dashboard/FinancialIndicators';
import Productivity from '@/components/dashboard/Productivity';
import Sales from '@/components/dashboard/Sales';
import Development from '@/components/dashboard/Development';
import Production from '@/components/dashboard/Production';
import Quality from '@/components/dashboard/Quality';
import Purchase from '@/components/dashboard/Purchase';
import Manufacturing from '@/components/dashboard/Manufacturing';
import CostManagement from '@/components/dashboard/CostManagement';
import ManagerialAccounting from '@/components/dashboard/ManagerialAccounting';
import ESG from '@/components/dashboard/ESG';
import Reports from '@/components/dashboard/Reports';
import Ontology from '@/components/dashboard/Ontology';
import LotTrace from '@/components/dashboard/LotTrace';
import ScenarioAnalysis from '@/components/dashboard/ScenarioAnalysis';
import ExtendedScenarioAnalysis from '@/components/dashboard/ExtendedScenarioAnalysis';
import LLMSettings from '@/components/admin/LLMSettings';
import { sendMessage, getActiveLLM, LLMProvider } from '@/services/llmService';
import { generateSQL, getSchemaSummary, SQLGenerationResult } from '@/services/textToSqlService';
import { analyzeCausalRelation, isCausalAnalysisQuery, AnalysisResult, ONTOLOGY_CONCEPTS } from '@/services/causalAnalysisService';
import SQLResultViewer from '@/components/chat/SQLResultViewer';
import CausalAnalysisViewer from '@/components/chat/CausalAnalysisViewer';

// 챗 메시지 타입
interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  provider?: LLMProvider | 'quick' | 'sql' | 'analysis';
  sqlResult?: SQLGenerationResult;
  analysisResult?: AnalysisResult;
}
import {
  MenuIcon,
  XIcon,
  BarChartIcon,
  ActivityIcon,
  DollarIcon,
  ZapIcon,
  FactoryIcon,
  CheckIcon,
  ShoppingCartIcon,
  SettingsIcon,
  PackageIcon,
  AlertIcon,
  FileIcon,
  BotIcon,
  UserIcon,
  SendIcon,
  TrendUpIcon,
  NetworkIcon,
  GitBranchIcon,
  SearchIcon
} from '@/components/icons/Icons';

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { type: 'bot', text: '안녕하세요! NetPlus MIS-AI 어시스턴트입니다.\n\n💡 **주요 기능:**\n• 🔍 원인-결과-대책: "치수불량 원인 분석", "설비 고장 대책" 등 6M 기반 분석\n• 📦 로트추적: "LOT-XXX 추적" 문제 로트의 자재/설비/작업자 추적\n• 📊 Text-to-SQL: "매출 현황 조회" 등 자연어로 SQL 생성\n• 🧠 온톨로지: 6M, 4M2E 개념 및 관계 설명\n\n위의 빠른 질문 버튼을 눌러보세요!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const menuItems = [
    { id: 'dashboard', icon: BarChartIcon, label: '통합 대시보드' },
    { id: 'financialManagement', icon: ActivityIcon, label: '재무 관리' },
    { id: 'financialIndicators', icon: BarChartIcon, label: '재무 지표' },
    { id: 'productivity', icon: TrendUpIcon, label: '생산성 분석' },
    { id: 'sales', icon: DollarIcon, label: '영업 관리' },
    { id: 'development', icon: ZapIcon, label: '개발 관리' },
    { id: 'production', icon: FactoryIcon, label: '생산 관리' },
    { id: 'quality', icon: CheckIcon, label: '품질 관리' },
    { id: 'purchase', icon: ShoppingCartIcon, label: '구매/자재' },
    { id: 'manufacturing', icon: SettingsIcon, label: '제조 관리' },
    { id: 'costManagement', icon: PackageIcon, label: '원가 관리' },
    { id: 'managerialAccounting', icon: SettingsIcon, label: '관리 회계' },
    { id: 'esg', icon: AlertIcon, label: 'ESG/4M2E 전략' },
    { id: 'ontology', icon: NetworkIcon, label: '온톨로지 분석' },
    { id: 'scenarioAnalysis', icon: SearchIcon, label: '6M 시나리오 분석' },
    { id: 'extendedScenarioAnalysis', icon: TrendUpIcon, label: '확장 시나리오 분석' },
    { id: 'lotTrace', icon: GitBranchIcon, label: 'LOT 추적' },
    { id: 'reports', icon: FileIcon, label: '분석 리포트' },
    { id: 'llmSettings', icon: BotIcon, label: 'LLM 설정 (관리자)' },
  ];

  // SQL 관련 질문인지 감지
  const isSQLQuery = (message: string): boolean => {
    const sqlKeywords = [
      'sql', 'select', '쿼리', '조회', '데이터', '테이블',
      '사원', '급여', '재고', '생산', '품질', '매출', '원가', '설비',
      '부서', '발주', '수주', '검사', '불량', '예산', '전표',
      '몇 명', '몇명', '합계', '총', '목록', '현황', '리스트',
      '월별', '일별', '연도별', '추이', '통계'
    ];
    const lowerMessage = message.toLowerCase();
    return sqlKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 테이블 스키마 질문인지 감지
  const isSchemaQuery = (message: string): boolean => {
    const schemaKeywords = ['스키마', '테이블 목록', '어떤 테이블', '테이블 알려', 'db 구조', '데이터베이스 구조'];
    const lowerMessage = message.toLowerCase();
    return schemaKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 온톨로지 개요 질문인지 감지
  const isOntologyOverviewQuery = (message: string): boolean => {
    const overviewKeywords = ['6m 뭐', '6m이 뭐', '4m2e 뭐', '온톨로지 뭐', '온톨로지가 뭐', '6m 알려', '4m 알려'];
    const lowerMessage = message.toLowerCase();
    return overviewKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // 사용자 메시지 추가
    const newUserMessage: ChatMessage = { type: 'user', text: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);

    setIsLoading(true);
    try {
      // 1. 스키마 조회 질문인 경우
      if (isSchemaQuery(userMessage)) {
        const schemaSummary = getSchemaSummary();
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: schemaSummary,
          provider: 'sql'
        }]);
        return;
      }

      // 2. 온톨로지 개요 질문인 경우
      if (isOntologyOverviewQuery(userMessage)) {
        let overview = '## 6M / 4M2E 온톨로지 개념\n\n';
        overview += '### 6M (제조 품질 관점)\n';
        for (const concept of ONTOLOGY_CONCEPTS) {
          overview += `**${concept.concept}**\n`;
          overview += `${concept.definition}\n`;
          overview += `관련: ${concept.relatedConcepts.join(', ')}\n\n`;
        }
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: overview,
          provider: 'analysis'
        }]);
        return;
      }

      // 3. 원인-결과-대책 분석 질문인 경우 (로트 추적 스타일)
      if (isCausalAnalysisQuery(userMessage)) {
        const analysisResult = await analyzeCausalRelation(userMessage);
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: '', // CausalAnalysisViewer가 표시
          provider: 'analysis',
          analysisResult
        }]);
        return;
      }

      // 4. SQL 쿼리 생성 질문인 경우
      if (isSQLQuery(userMessage)) {
        const sqlResult = await generateSQL(userMessage);

        if (sqlResult.sql) {
          // SQL 생성 성공 - SQLResultViewer 컴포넌트로 표시
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: '', // SQLResultViewer가 표시되므로 텍스트는 비움
            provider: 'sql',
            sqlResult
          }]);
        } else {
          // SQL 생성 실패 - 일반 LLM 응답으로 폴백
          const { response, provider } = await sendMessage(userMessage);
          setChatMessages(prev => [...prev, { type: 'bot', text: response, provider }]);
        }
        return;
      }

      // 5. 일반 온톨로지/LLM 질문
      const { response, provider } = await sendMessage(userMessage);
      setChatMessages(prev => [...prev, { type: 'bot', text: response, provider }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 빠른 질문 버튼 클릭
  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

const renderContent = () => {
  if (activeMenu === 'dashboard') {
    return <Dashboard />;
  }
  if (activeMenu === 'financialManagement') {
    return <FinancialManagement />;
  }
  if (activeMenu === 'financialIndicators') {
    return <FinancialIndicators />;
  }
  if (activeMenu === 'productivity') {
    return <Productivity />;
  }
  if (activeMenu === 'sales') {
    return <Sales />;
  }
  if (activeMenu === 'development') {
    return <Development />;
  }
  if (activeMenu === 'production') {
    return <Production />;
  }
  if (activeMenu === 'quality') {
    return <Quality />;
  }
  if (activeMenu === 'purchase') {
    return <Purchase />;
  }
  if (activeMenu === 'manufacturing') {
    return <Manufacturing />;
  }
  if (activeMenu === 'costManagement') {
    return <CostManagement />;
  }
  if (activeMenu === 'managerialAccounting') {
    return <ManagerialAccounting />;
  }
  if (activeMenu === 'esg') {
    return <ESG />;
  }
  if (activeMenu === 'ontology') {
    return <Ontology />;
  }
  if (activeMenu === 'scenarioAnalysis') {
    return <ScenarioAnalysis />;
  }
  if (activeMenu === 'extendedScenarioAnalysis') {
    return <ExtendedScenarioAnalysis />;
  }
  if (activeMenu === 'lotTrace') {
    return <LotTrace />;
  }
  if (activeMenu === 'reports') {
    return <Reports />;
  }
  if (activeMenu === 'llmSettings') {
    return <LLMSettings />;
  }
  return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {menuItems.find(m => m.id === activeMenu)?.label}
        </h2>
        <p className="text-gray-600">이 기능은 곧 추가될 예정입니다.</p>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="flex h-screen bg-gray-100">
              {/* Sidebar */}
              <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-blue-900 text-white transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col`}>
                <div className="p-4 flex-shrink-0">
                  <h1 className="text-xl font-bold mb-4">NetPlus MIS-AI</h1>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <nav className="space-y-1">
                    {menuItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                          activeMenu === item.id
                            ? 'bg-blue-700'
                            : 'hover:bg-blue-800'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    {sidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                  </button>
                  <h2 className="text-lg font-bold text-gray-800">
                    {menuItems.find(m => m.id === activeMenu)?.label}
                  </h2>
                  <div className="w-10"></div>
                </header>

                <div className="p-6">
                  {renderContent()}
                </div>
              </main>

              {/* AI Chat Button */}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="fixed top-6 left-60 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-[9999] transition-all duration-200"
                title="AI 어시스턴트"
              >
                <BotIcon size={24} />
              </button>

              {/* AI Chat Panel */}
              {chatOpen && (
                <div className="fixed bottom-24 right-6 w-[420px] bg-white rounded-xl shadow-2xl z-50 flex flex-col" style={{ height: '520px' }}>
                  {/* 헤더 */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <BotIcon size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">온톨로지 AI 어시스턴트</h3>
                        <span className="text-xs text-blue-100">
                          {(() => {
                            const activeLLM = getActiveLLM();
                            if (!activeLLM) return 'LLM 미설정';
                            const names: Record<LLMProvider, string> = {
                              ollama: 'Ollama (오픈소스)',
                              chatgpt: 'ChatGPT',
                              gemini: 'Gemini'
                            };
                            return `Powered by ${names[activeLLM.provider]}`;
                          })()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
                      <XIcon size={20} />
                    </button>
                  </div>

                  {/* 빠른 질문 버튼 */}
                  <div className="px-3 py-2 border-b bg-gray-50 flex gap-2 overflow-x-auto">
                    <button
                      onClick={() => handleQuickQuestion('치수불량 원인 분석해줘')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 whitespace-nowrap"
                    >
                      🔍 불량원인분석
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('LOT-2024-1226-001 로트 추적해줘')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 whitespace-nowrap"
                    >
                      📦 로트추적
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('설비 고장 대책 알려줘')}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 whitespace-nowrap"
                    >
                      🔧 설비대책
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('6M이 뭐야?')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 whitespace-nowrap"
                    >
                      🧠 6M이란?
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('매출 현황 조회')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 whitespace-nowrap"
                    >
                      💰 매출조회
                    </button>
                  </div>

                  {/* 메시지 영역 */}
                  <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'bot' && (
                          <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <BotIcon size={14} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[90%] p-3 rounded-lg text-sm ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : msg.analysisResult || msg.sqlResult
                              ? 'bg-transparent p-0'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}>
                          {msg.analysisResult ? (
                            <CausalAnalysisViewer result={msg.analysisResult} />
                          ) : msg.sqlResult ? (
                            <SQLResultViewer result={msg.sqlResult} />
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          )}
                        </div>
                        {msg.type === 'user' && (
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                            <UserIcon size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                          <BotIcon size={14} className="text-white" />
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 입력 영역 */}
                  <div className="p-3 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder="온톨로지에 대해 질문하세요..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <SendIcon size={20} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                      원인분석, 로트추적, SQL생성, 6M/4M2E 질문에 답변합니다
                    </p>
                  </div>
                </div>
              )}
            </div>
            <ToastContainer />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
