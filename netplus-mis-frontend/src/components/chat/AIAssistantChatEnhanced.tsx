/**
 * Enhanced AI Assistant Chat Component
 * 에이전트 오케스트레이션 기반 AI 어시스턴트 채팅 컴포넌트
 *
 * Features:
 * - Natural language Q&A with agent orchestration
 * - Agent execution trace visualization
 * - Evidence-based responses
 * - Multiple agent support
 * - Query history management
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  BrainIcon,
  SendIcon,
  ClearIcon,
  SettingsIcon,
  CheckIcon,
  SparklesIcon,
  InfoIcon,
  WarningIcon,
} from '@/components/icons/Icons';
import AgentTraceViewer from './AgentTraceViewer';
import EvidenceViewer from './EvidenceViewer';
import {
  sendAgentChat,
  getAgentRegistry,
  createUserMessage,
  createAssistantMessage,
  createErrorMessage,
  ChatMessage,
  AgentInfo,
  getConfidenceLevel,
  getStatusColor,
  getPriorityColor,
  ChatResponse,
} from '@/services/agentChatService';

interface AIAssistantChatEnhancedProps {
  onExecuteSQL?: (sql: string) => Promise<any>;
  className?: string;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} width={20} height={20} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const AgentIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const AIAssistantChatEnhanced: React.FC<AIAssistantChatEnhancedProps> = ({ onExecuteSQL, className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useAgents, setUseAgents] = useState(true);
  const [agentRegistry, setAgentRegistry] = useState<AgentInfo[]>([]);
  const [showAgentTrace, setShowAgentTrace] = useState<Set<number>>(new Set());
  const [showEvidence, setShowEvidence] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 에이전트 레지스트리 로드
  useEffect(() => {
    loadAgentRegistry();
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAgentRegistry = async () => {
    try {
      const registry = await getAgentRegistry();
      setAgentRegistry(registry.agents);
    } catch (error) {
      console.error('Failed to load agent registry:', error);
    }
  };

  // 채팅 입력 전송
  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage = createUserMessage(question);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendAgentChat({
        message: question,
        context: {},
        user: 'user',
        useAgents,
      });

      const assistantMessage = createAssistantMessage(response);
      setMessages((prev) => [...prev, assistantMessage]);

      // 추적/증거 자동 표시 (성공적인 응답인 경우)
      if (response.status === 'success' && response.agent_trace.length > 0) {
        setShowAgentTrace((prev) => new Set(prev).add(assistantMessage.id));
      }
      if (response.status === 'success' && response.evidence.length > 0) {
        setShowEvidence((prev) => new Set(prev).add(assistantMessage.id));
      }
    } catch (error) {
      const errorMessage = createErrorMessage(
        error instanceof Error ? error.message : '알 수 없는 오류'
      );
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 관련 질문 클릭
  const handleRelatedQueryClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  // 채팅 초기화
  const handleClearChat = () => {
    if (confirm('채팅 기록을 초기화하시겠습니까?')) {
      setMessages([]);
      setShowAgentTrace(new Set());
      setShowEvidence(new Set());
    }
  };

  // 추적 표시 토글
  const toggleAgentTrace = (messageId: number) => {
    setShowAgentTrace((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // 증거 표시 토글
  const toggleEvidence = (messageId: number) => {
    setShowEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-lg ${className}`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainIcon size={28} />
            <div>
              <h1 className="text-xl font-bold">AI Copilot (Enhanced)</h1>
              <p className="text-sm opacity-90">에이전트 기반 지능형 어시스턴트</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="설정"
            >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="채팅 초기화"
            >
              <ClearIcon size={20} />
            </button>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-white/20 rounded flex items-center gap-1">
            <AgentIcon />
            {agentRegistry.length}개 에이전트
          </span>
          {useAgents && (
            <span className="px-2 py-0.5 bg-green-500/30 rounded flex items-center gap-1">
              <CheckIcon size={12} />
              Agent Orchestration
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: '600px' }}>
        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BrainIcon size={64} className="mb-4 opacity-30" />
                <SparklesIcon size={48} className="mb-4 opacity-30 text-purple-400" />
                <p className="text-lg font-medium">무엇을 도와드릴까요?</p>
                <p className="text-sm mt-2 text-center">
                  에이전트가 질문을 분석하고 최적의 답변을 제공합니다.
                  <br />
                  예: "이번 달 재무 현황", "품질 불량 원인 분석", "생산 라인 KPI"
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.role === 'system'
                      ? 'bg-red-50 border border-red-200 text-red-600'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {/* 어시스턴트 헤더 */}
                  {message.role === 'assistant' && (
                    <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BrainIcon size={16} className="text-indigo-600" />
                        <span className="text-sm font-semibold">AI Copilot</span>
                        {message.status && (
                          <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(message.status)}`}>
                            {message.status === 'success' && '성공'}
                            {message.status === 'partial' && '부분'}
                            {message.status === 'error' && '오류'}
                            {message.status === 'no_results' && '결과 없음'}
                          </span>
                        )}
                        {message.confidence !== undefined && (
                          <span className={`text-xs ${getConfidenceLevel(message.confidence).color}`}>
                            {Math.round(message.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {message.agentTrace && message.agentTrace.length > 0 && (
                          <button
                            onClick={() => toggleAgentTrace(parseInt(message.id.split('-')[1]))}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              showAgentTrace.has(parseInt(message.id.split('-')[1]))
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            <AgentIcon className="inline w-3 h-3 mr-1" />
                            추적
                          </button>
                        )}
                        {message.evidence && message.evidence.length > 0 && (
                          <button
                            onClick={() => toggleEvidence(parseInt(message.id.split('-')[1]))}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              showEvidence.has(parseInt(message.id.split('-')[1]))
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            <InfoIcon className="inline w-3 h-3 mr-1" />
                            증거
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 메시지 내용 */}
                  <div className="p-4">
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                    {/* 경고 메시지 */}
                    {message.warnings && message.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {message.warnings.map((warning, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded"
                          >
                            <WarningIcon size={12} className="flex-shrink-0 mt-0.5" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 추천사항 */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-600">추천 사항:</p>
                        {message.recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded border ${getPriorityColor(rec.priority)}`}
                          >
                            <div className="font-medium">{rec.title || rec.type}</div>
                            <div className="mt-1">{rec.description}</div>
                            {rec.expected_impact && (
                              <div className="mt-1 text-xs opacity-75">
                                기대 효과: {rec.expected_impact}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 관련 질문 */}
                    {message.relatedQueries && message.relatedQueries.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">관련 질문:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.relatedQueries.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleRelatedQueryClick(query)}
                              className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 타임스탬프 */}
                    <div className="mt-2 text-xs opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>

                  {/* 에이전트 추적 뷰어 */}
                  {showAgentTrace.has(parseInt(message.id.split('-')[1])) && message.agentTrace && (
                    <div className="border-t">
                      <AgentTraceViewer traces={message.agentTrace} />
                    </div>
                  )}

                  {/* 증거 뷰어 */}
                  {showEvidence.has(parseInt(message.id.split('-')[1])) && message.evidence && (
                    <div className="border-t">
                      <EvidenceViewer evidences={message.evidence} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <SpinnerIcon />
                    <span className="text-sm text-gray-600">에이전트가 분석 중...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="질문을 입력하세요... (Shift+Enter: 줄바꿈)"
                className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end"
              >
                <SendIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* 사이드바: 설정 */}
        {showSettings && (
          <div className="w-72 border-l overflow-y-auto bg-gray-50">
            <div className="p-3 border-b bg-gray-100 sticky top-0">
              <h3 className="font-semibold text-gray-700">설정</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* 에이전트 오케스트레이션 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">AI 모드</h4>
                <div className="p-3 bg-white rounded border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAgents}
                      onChange={(e) => setUseAgents(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">에이전트 오케스트레이션</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    {useAgents
                      ? '복수의 에이전트가 협력하여 답변을 생성합니다.'
                      : '기존 규칙 기반 방식으로 동작합니다.'}
                  </p>
                </div>
              </div>

              {/* 에이전트 레지스트리 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  등록된 에이전트 ({agentRegistry.length})
                </h4>
                <div className="p-3 bg-white rounded border max-h-64 overflow-y-auto">
                  {agentRegistry.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">에이전트 없음</p>
                  ) : (
                    <div className="space-y-2">
                      {agentRegistry.map((agent) => (
                        <div key={agent.name} className="text-xs">
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-gray-500">
                            {agent.domain} / {agent.layer}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantChatEnhanced;
