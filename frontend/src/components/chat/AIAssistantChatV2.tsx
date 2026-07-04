/**
 * Upgraded AI Assistant Chat Component
 * 업그레이드된 AI 어시스턴트 채팅 컴포넌트 (Phase 5)
 *
 * Features:
 * - Backend API integration for LLM calls
 * - Enhanced RAG capabilities
 * - Real-time document search
 * - SQL generation with explanation
 * - Conversation history
 * - Multiple LLM provider support
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BrainIcon,
  SendIcon,
  ClearIcon,
  HistoryIcon,
  SettingsIcon,
  CheckIcon,
  SQLIcon,
  SearchIcon,
  DocumentIcon,
  ApiIcon
} from '@/components/icons/Icons';
import {
  askAI,
  textToSQL,
  searchRelevantDocuments,
  getLLMConfig,
  getAvailableModels
} from '@/services/aiAssistantService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sqlQuery?: string;
  sqlExplanation?: string;
  sources?: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
  metadata?: {
    model: string;
    provider: string;
    tokensUsed: number;
    processingTime: number;
  };
}

interface AIAssistantChatProps {
  onExecuteSQL?: (sql: string) => Promise<any>;
  className?: string;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} width={20} height={20} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ onExecuteSQL, className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '안녕하세요! 업그레이드된 AI 어시스턴트입니다. 👋\n\n저는 다음과 같은 기능을 제공합니다:\n\n📊 **데이터 분석**: 생산, 품질, 재무 등의 데이터 분석\n🔍 **SQL 생성**: 자연어 질문으로 SQL 쿼리 생성\n📝 **문서 검색**: RAG를 통한 관련 문서 검색\n💡 **AI 조언**: 비즈니스 의사결 지원\n\n무엇이든 물어보세요!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const [llmConfig, setLlmConfig] = useState({
    provider: 'local',
    model: 'gpt-3.5-turbo'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // LLM 설정 로드
  useEffect(() => {
    loadLLMConfig();
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadLLMConfig = async () => {
    try {
      const config = await getLLMConfig();
      setLlmConfig(config);
    } catch (error) {
      console.error('LLM 설정 로드 실패:', error);
    }
  };

  // 채팅 입력 전송
  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // SQL 생성이 필요한지 확인
      const sqlKeywords = ['조회', '목록', '보여줘', '가져와', 'SELECT', '쿼리', 'SQL'];
      const needsSQL = sqlKeywords.some(keyword =>
        question.toUpperCase().includes(keyword.toUpperCase())
      );

      if (needsSQL) {
        // SQL 생성 모드
        const sqlResult = await textToSQL(question);

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: sqlResult.explanation || '요청하신 데이터를 조회하기 위한 SQL 쿼리입니다.',
          timestamp: Date.now(),
          sqlQuery: sqlResult.sql,
          sqlExplanation: sqlResult.explanation
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // 일반 AI 질문 답변 모드
        const aiResponse = await askAI(question, '', useRAG);

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: aiResponse.answer,
          timestamp: Date.now(),
          sources: aiResponse.sources,
          metadata: aiResponse.metadata
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI 응답 생성 실패:', error);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 키보드 입력 (Enter 전송, Shift+Enter 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 대화 초기화
  const handleClear = () => {
    if (confirm('대화 내용을 초기화하시겠습니까?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'system',
          content: '대화가 초기화되었습니다. 새로운 질문을 입력해 주세요.',
          timestamp: Date.now()
        }
      ]);
    }
  };

  // SQL 실행
  const handleExecuteSQL = async (sql: string) => {
    if (onExecuteSQL) {
      try {
        await onExecuteSQL(sql);
      } catch (error) {
        console.error('SQL 실행 실패:', error);
      }
    }
  };

  // SQL 복사
  const handleCopySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    alert('SQL이 클립보드에 복사되었습니다.');
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <BrainIcon size={24} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">AI 어시스턴트</h2>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            업그레이드됨
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="설정"
          >
            <SettingsIcon size={20} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="대화 기록"
          >
            <HistoryIcon size={20} />
          </button>
          <button
            onClick={handleClear}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            title="대화 초기화"
          >
            <ClearIcon size={20} />
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">AI 설정</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">RAG 검색 사용</label>
              <button
                onClick={() => setUseRAG(!useRAG)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  useRAG
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {useRAG ? '활성' : '비활성'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">LLM: {llmConfig.model}</span>
              <span className="text-xs text-gray-500">{llmConfig.provider}</span>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : message.role === 'system'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {/* 시스템 메시지 */}
              {message.role === 'system' && (
                <div className="prose prose-sm">
                  <div dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>
              )}

              {/* 사용자/어시스턴트 메시지 */}
              {message.role !== 'system' && (
                <>
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* SQL 쿼리 표시 */}
                  {message.sqlQuery && (
                    <div className="mt-3 p-3 bg-gray-900 text-green-400 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium flex items-center gap-1">
                          <SQLIcon size={14} />
                          생성된 SQL
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopySQL(message.sqlQuery!)}
                            className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                          >
                            복사
                          </button>
                          <button
                            onClick={() => handleExecuteSQL(message.sqlQuery!)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            실행
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        <code>{message.sqlQuery}</code>
                      </pre>
                    </div>
                  )}

                  {/* 출처 표시 */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <SearchIcon size={14} />
                        참고 문서
                      </p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-blue-600">{source.type}</span>
                              <span className="text-xs text-gray-500">{Math.round(source.confidence * 100)}%</span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1 truncate">{source.content}</p>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 메타데이터 */}
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      {message.metadata.model} • {message.metadata.processingTime}ms
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <SpinnerIcon className="text-blue-600" />
              <span className="text-sm text-gray-600">답변 생성 중...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 추천 질문 */}
      {!isLoading && messages.length > 1 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">추천 질문:</p>
          <div className="flex flex-wrap gap-2">
            {[
              '생산 현황을 알려줘',
              '품질 불량률이 높은 제품은?',
              '이번 달 매출 추이를 분석해줘',
              '재고가 부족한 품목은?'
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => setInput(question)}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon size={20} />}
          </button>
        </div>

        {/* 힌트 */}
        <div className="mt-2 text-xs text-gray-500">
          <p>💡 팁: 자연어로 질문하면 AI가 SQL을 생성하거나 데이터를 분석해 드려요!</p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChat;
