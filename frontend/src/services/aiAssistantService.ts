/**
 * AI Assistant Service
 * Phase 5 업그레이드된 AI 어시스턴트 서비스
 *
 * 백엔드 API를 통한 LLM 연동 및 RAG 기능 제공
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  answer: string;
  sources?: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
  sqlQuery?: string;
  metadata?: {
    model: string;
    provider: string;
    tokensUsed: number;
    processingTime: number;
  };
}

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * AI 질문에 대한 답변 생성 (RAG)
 */
export async function askAI(
  question: string,
  context?: string,
  useRAG: boolean = true
): Promise<AIResponse> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        question,
        context,
        use_rag: useRAG
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI API 호출 실패:', error);
    // 폴백: 기본 응답 반환
    return {
      answer: '죄송합니다. AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      metadata: {
        model: 'fallback',
        provider: 'local',
        tokensUsed: 0,
        processingTime: 0
      }
    };
  }
}

/**
 * Text to SQL 변환
 */
export async function textToSQL(
  question: string,
  schema?: string
): Promise<{ sql: string; explanation: string; tables: string[] }> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/sql/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        question,
        schema
      })
    });

    if (!response.ok) {
      throw new Error(`SQL API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SQL 생성 API 호출 실패:', error);
    throw error;
  }
}

/**
 * 관련 문서 검색 (RAG)
 */
export async function searchRelevantDocuments(
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; content: string; score: number }>> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        query,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('문서 검색 API 호출 실패:', error);
    return [];
  }
}

/**
 * LLM 설정 조회
 */
export async function getLLMConfig(): Promise<LLMConfig> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/config/`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`Config API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LLM 설정 조회 실패:', error);
    // 기본 설정 반환
    return {
      provider: 'local',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000
    };
  }
}

/**
 * LLM 설정 저장
 */
export async function saveLLMConfig(config: LLMConfig): Promise<void> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/config/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Config save error: ${response.status}`);
    }
  } catch (error) {
    console.error('LLM 설정 저장 실패:', error);
    throw error;
  }
}

/**
 * 지원 가능한 LLM 모델 목록 조회
 */
export async function getAvailableModels(): Promise<{
  provider: string;
  models: Array<{ id: string; name: string; description: string }>;
}[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/models/`);

    if (!response.ok) {
      throw new Error(`Models API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('모델 목록 조회 실패:', error);
    // 기본 모델 목록 반환
    return [
      {
        provider: 'OpenAI',
        models: [
          { id: 'gpt-4', name: 'GPT-4', description: '가장 강력한 모델' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '빠르고 경제적인 모델' }
        ]
      },
      {
        provider: 'Anthropic',
        models: [
          { id: 'claude-3-opus', name: 'Claude 3 Opus', description: '복잡한 작업에 최적화' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: '균형형 성능' }
        ]
      }
    ];
  }
}

/**
 * 대화 기록 저장
 */
export async function saveConversationHistory(
  conversationId: string,
  messages: ChatMessage[]
): Promise<void> {
  try {
    const token = localStorage.getItem('access_token');

    await fetch(`${API_BASE_URL}/api/ai/history/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages
      })
    });
  } catch (error) {
    console.error('대화 기록 저장 실패:', error);
  }
}

/**
 * 대화 기록 조회
 */
export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/api/ai/history/${conversationId}/`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('대화 기록 조회 실패:', error);
    return [];
  }
}

export default {
  askAI,
  textToSQL,
  searchRelevantDocuments,
  getLLMConfig,
  saveLLMConfig,
  getAvailableModels,
  saveConversationHistory,
  getConversationHistory
};
