/**
 * AI Assistant Chat Component
 * AI 어시스턴트 채팅 컴포넌트
 *
 * Features:
 * - Natural language Q&A
 * - Text-to-SQL generation
 * - Vector-based semantic search
 * - Query history management
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
  SQLIcon
} from '@/components/icons/Icons';
import { generateSQL, findRelevantTables, getSchemaSummary, SQLGenerationResult } from '@/services/textToSqlService';
import {
  initializeVectorSearch,
  searchRelevantTables,
  findSimilarQuestions,
  saveQueryHistory,
  getQueryHistory,
  getVectorSearchStats,
  QueryHistory
} from '@/services/vectorSearchService';
import { getActiveLLM } from '@/services/llmService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sqlResult?: SQLGenerationResult;
  similarQuestions?: Array<{ question: string; score: number }>;
  relatedTables?: Array<{ table: string; koreanName: string; score: number }>;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [vectorSearchInitialized, setVectorSearchInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 벡터 검색 초기화
  useEffect(() => {
    initializeVectorSearch().then(() => {
      setVectorSearchInitialized(true);
    });
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // 유사 질문 검색
      const similarQuestions = findSimilarQuestions(question, 3);

      // 관련 테이블 검색
      const relevantTables = searchRelevantTables(question, { limit: 5 });

      // SQL 생성
      const sqlResult = await generateSQL(question);

      // LLM을 이용한 자연어 응답 생성
      const llmResponse = await generateNaturalLanguageResponse(question, sqlResult, relevantTables);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: llmResponse,
        timestamp: Date.now(),
        sqlResult: sqlResult.sql ? sqlResult : undefined,
        similarQuestions: similarQuestions.filter(q => q.score > 0.3),
        relatedTables: relevantTables.filter(t => t.score > 0.2).map(t => ({
          table: t.table.name,
          koreanName: t.table.koreanName,
          score: t.score
        }))
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 쿼리 히스토리 저장
      saveQueryHistory({
        id: `query-${Date.now()}`,
        question,
        sql: sqlResult.sql,
        result: null,
        timestamp: Date.now()
      });
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'system',
        content: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // LLM을 이용한 자연어 응답 생성
  const generateNaturalLanguageResponse = async (
    question: string,
    sqlResult: SQLGenerationResult,
    relevantTables: Array<{ table: any; score: number }>
  ): Promise<string> => {
    const activeLLM = getActiveLLM();

    if (!activeLLM) {
      // 기본 응답
      if (!sqlResult.sql) {
        return sqlResult.explanation || '죄송합니다. 질문을 이해하지 못했습니다.';
      }

      return `${sqlResult.explanation || 'SQL 쿼리가 생성되었습니다.'}\n\n` +
        `관련 테이블: ${relevantTables.map(t => t.table.koreanName).join(', ')}`;
    }

    try {
      const prompt = buildResponsePrompt(question, sqlResult, relevantTables);
      const response = await callLLM(prompt, activeLLM);
      return response;
    } catch (error) {
      return sqlResult.explanation || 'SQL 쿼리가 생성되었습니다.';
    }
  };

  // 응답 생성 프롬프트
  const buildResponsePrompt = (
    question: string,
    sqlResult: SQLGenerationResult,
    relevantTables: Array<{ table: any; score: number }>
  ): string => {
    const tableInfo = relevantTables
      .map(t => `- ${t.table.koreanName} (${t.table.name}): ${t.table.description}`)
      .join('\n');

    return `당신은 Claros MIS 시스템의 AI 어시스턴트입니다.
사용자의 질문에 친절하고 전문적으로 답변해주세요.

## 사용자 질문
${question}

## 생성된 SQL 쿼리
${sqlResult.sql || '없음'}

## SQL 설명
${sqlResult.explanation || '없음'}

## 관련 테이블
${tableInfo || '없음'}

## 답변 요구사항
1. 친절하고 전문적인 어조로 작성
2. SQL 쿼리가 있는 경우 설명 포함
3. 한글로 작성
4. 필요한 경우 추가 질문 제안

답변:`;
  };

  // LLM API 호출
  const callLLM = async (prompt: string, config: any): Promise<string> => {
    switch (config.provider) {
      case 'ollama':
        const ollamaRes = await fetch(`${config.endpoint || 'http://localhost:11434'}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model || 'llama2',
            prompt,
            stream: false
          })
        });
        const ollamaData = await ollamaRes.json();
        return ollamaData.response || '';

      case 'chatgpt':
        const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
          })
        });
        const gptData = await gptRes.json();
        return gptData.choices?.[0]?.message?.content || '';

      case 'gemini':
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );
        const geminiData = await geminiRes.json();
        return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      default:
        return 'LLM 설정이 올바르지 않습니다.';
    }
  };

  // SQL 실행
  const handleExecuteSQL = async (sql: string) => {
    // YH 데이터베이스에 직접 쿼리 실행
    const yhApiUrl = 'http://localhost:8000/api/yh/sql/execute/';

    if (onExecuteSQL) {
      try {
        const result = await onExecuteSQL(sql);
        alert(`SQL 실행 결과:\n${JSON.stringify(result, null, 2)}`);
      } catch (error) {
        alert(`SQL 실행 실패: ${error}`);
      }
    } else {
      // 직접 YH API 호출
      try {
        const response = await fetch(yhApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await response.json();

        if (data.success) {
          alert(`SQL 실행 결과:\n${data.rowCount}건 조회\n\n${JSON.stringify(data.data, null, 2).substring(0, 500)}...`);
        } else {
          alert(`SQL 실행 실패: ${data.error}`);
        }
      } catch (error) {
        alert(`SQL 실행 오류: ${error}`);
      }
    }
  };

  // 유사 질문 클릭
  const handleSimilarQuestionClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // 채팅 초기화
  const handleClearChat = () => {
    if (confirm('채팅 기록을 초기화하시겠습니까?')) {
      setMessages([]);
    }
  };

  // 쿼리 히스토리에서 질문 선택
  const handleHistoryClick = (question: string) => {
    setInput(question);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const activeLLM = getActiveLLM();
  const queryHistory = getQueryHistory();

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-lg ${className}`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainIcon size={28} />
            <div>
              <h1 className="text-xl font-bold">AI 어시스턴트</h1>
              <p className="text-sm opacity-90">자연어로 데이터를 조회하세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="쿼리 히스토리"
            >
              <HistoryIcon size={20} />
            </button>
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

        {/* LLM 상태 표시 */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-white/20 rounded">
            LLM: {activeLLM ? activeLLM.provider.toUpperCase() : '로컬'}
          </span>
          {vectorSearchInitialized && (
            <span className="px-2 py-0.5 bg-green-500/30 rounded flex items-center gap-1">
              <CheckIcon size={12} />
              Vector Search
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: '500px' }}>
        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BrainIcon size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">무엇을 도와드릴까요?</p>
                <p className="text-sm mt-2">
                  예: "사원 목록 조회", "월별 매출 현황", "부서별 급여 통계"
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.role === 'system'
                      ? 'bg-red-50 border border-red-200 text-red-600'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <BrainIcon size={16} className="text-indigo-600" />
                      <span className="text-sm font-semibold">AI 어시스턴트</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                  {/* SQL 결과 */}
                  {message.sqlResult && message.sqlResult.sql && (
                    <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <SQLIcon size={12} />
                          SQL Query
                        </span>
                        <button
                          onClick={() => handleExecuteSQL(message.sqlResult!.sql)}
                          className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          실행
                        </button>
                      </div>
                      <pre className="p-3 text-xs text-green-400 overflow-x-auto">
                        <code>{message.sqlResult.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* 관련 테이블 */}
                  {message.relatedTables && message.relatedTables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.relatedTables.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          {t.koreanName} ({Math.round(t.score * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 유사 질문 */}
                  {message.similarQuestions && message.similarQuestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">관련 질문:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.similarQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSimilarQuestionClick(q.question)}
                            className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                          >
                            {q.question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <SpinnerIcon />
                    <span className="text-sm text-gray-600">생각 중...</span>
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

        {/* 사이드바: 쿼리 히스토리 */}
        {showHistory && (
          <div className="w-64 border-l overflow-y-auto bg-gray-50">
            <div className="p-3 border-b bg-gray-100 sticky top-0">
              <h3 className="font-semibold text-gray-700">쿼리 히스토리</h3>
            </div>
            <div className="p-2 space-y-1">
              {queryHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">히스토리 없음</p>
              ) : (
                queryHistory.slice(0, 20).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleHistoryClick(h.question)}
                    className="w-full text-left p-2 text-sm bg-white rounded hover:bg-gray-100 transition-colors truncate"
                  >
                    {h.question}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* 사이드바: 설정 */}
        {showSettings && (
          <div className="w-72 border-l overflow-y-auto bg-gray-50">
            <div className="p-3 border-b bg-gray-100 sticky top-0">
              <h3 className="font-semibold text-gray-700">설정</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* LLM 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">LLM 설정</h4>
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm">
                    <span className="font-medium">공급자:</span>{' '}
                    {activeLLM ? activeLLM.provider.toUpperCase() : '로컬'}
                  </p>
                  {activeLLM && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">모델:</span> {activeLLM.model || '-'}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    설정을 변경하려면 설정 페이지로 이동하세요.
                  </p>
                </div>
              </div>

              {/* 벡터 검색 통계 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">벡터 검색</h4>
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm">
                    <span className="font-medium">상태:</span>{' '}
                    {vectorSearchInitialized ? (
                      <span className="text-green-600">활성</span>
                    ) : (
                      <span className="text-gray-400">비활성</span>
                    )}
                  </p>
                  {vectorSearchInitialized && (
                    <>
                      <p className="text-sm mt-1">
                        <span className="font-medium">인덱스:</span>{' '}
                        {getVectorSearchStats().index.totalDocuments}개 문서
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">히스토리:</span>{' '}
                        {getVectorSearchStats().queryHistorySize}개 쿼리
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 데이터베이스 스키마 요약 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">데이터베이스</h4>
                <div className="p-3 bg-white rounded border text-xs text-gray-600 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{getSchemaSummary()}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantChat;
