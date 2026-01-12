/**
 * LLM Service - 다중 LLM 모델 지원
 * 우선순위: 1. 오픈소스 (Ollama) 2. ChatGPT 3. Gemini
 */

// LLM 모델 타입 정의
export type LLMProvider = 'ollama' | 'chatgpt' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface LLMSettings {
  ollama: LLMConfig;
  chatgpt: LLMConfig;
  gemini: LLMConfig;
}

// 온톨로지 컨텍스트 (공통)
const ONTOLOGY_CONTEXT = `
당신은 유한산업 MIS-AI 시스템의 온톨로지 전문가입니다.

## 핵심 개념
1. **6M**: 제조 품질 관리의 6가지 핵심 요소
   - Man (인력): 작업자 역량, 교육, 숙련도
   - Machine (설비): 설비 상태, 가동률, 유지보수
   - Material (자재): 원자재 품질, 입고 검사
   - Method (방법): 작업 표준, 공정 절차
   - Measurement (측정): 검사, 계측, 품질 데이터
   - Mother Nature (환경): 온도, 습도, 작업 환경

2. **4M2E**: 제조 현장 관리 체계
   - 4M: Man, Machine, Material, Method
   - 2E: Environment (환경), Energy (에너지)

3. **원가 구조**: 재료비, 노무비, 경비로 구성
   - 재료비: 직접재료비 + 간접재료비
   - 노무비: 직접노무비 + 간접노무비
   - 경비: 제조경비 + 판관비

4. **ESG 경영**: 환경(E), 사회(S), 지배구조(G)
   - 탄소배출량, 에너지효율, 폐기물 관리
   - 산업안전, 고용다양성, 지역사회 기여
   - 이사회 독립성, 윤리경영, 컴플라이언스

5. **DMA100**: 분석 지표 100개 기준
   - 생산성, 품질, 원가, 납기, ESG 관련 지표

## 온톨로지 흐름
6M → 4M2E → 원가분석 → 재무분석 → ESG 평가

답변은 간결하고 명확하게, 한국어로 해주세요.
`;

// 기본 설정
const DEFAULT_SETTINGS: LLMSettings = {
  ollama: {
    provider: 'ollama',
    enabled: false,
    priority: 1,
    endpoint: 'http://localhost:11434',
    model: 'llama2'
  },
  chatgpt: {
    provider: 'chatgpt',
    enabled: false,
    priority: 2,
    apiKey: '',
    model: 'gpt-3.5-turbo'
  },
  gemini: {
    provider: 'gemini',
    enabled: true,
    priority: 3,
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash'
  }
};

// 설정 저장/로드
const STORAGE_KEY = 'llm_settings';

export function getLLMSettings(): LLMSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 환경변수 API 키 우선 적용
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        parsed.gemini.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        parsed.chatgpt.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load LLM settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveLLMSettings(settings: LLMSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save LLM settings:', e);
  }
}

// 활성화된 LLM 중 우선순위가 가장 높은 것 반환
export function getActiveLLM(): LLMConfig | null {
  const settings = getLLMSettings();
  const providers: LLMConfig[] = [settings.ollama, settings.chatgpt, settings.gemini];

  const enabled = providers
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  return enabled.length > 0 ? enabled[0] : null;
}

// Ollama API 호출
async function callOllama(message: string, config: LLMConfig): Promise<string> {
  const endpoint = config.endpoint || 'http://localhost:11434';
  const model = config.model || 'llama2';

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `${ONTOLOGY_CONTEXT}\n\n사용자 질문: ${message}\n\n답변:`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Ollama API error:', error);
    throw error;
  }
}

// ChatGPT API 호출
async function callChatGPT(message: string, config: LLMConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('ChatGPT API 키가 설정되지 않았습니다.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: ONTOLOGY_CONTEXT },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `ChatGPT API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('ChatGPT API error:', error);
    throw error;
  }
}

// Gemini API 호출
async function callGemini(message: string, config: LLMConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
  }

  const model = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${ONTOLOGY_CONTEXT}\n\n사용자 질문: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// 빠른 응답 (인사말 등)
export function getQuickResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  if (['안녕', '안녕하세요', 'hi', 'hello'].some(g => lowerMessage.includes(g))) {
    return '안녕하세요! 유한산업 MIS-AI 시스템입니다. 온톨로지, 6M, 4M2E, 원가분석, ESG 등에 대해 질문해 주세요.';
  }

  if (['도움', 'help', '뭘 할 수 있어'].some(h => lowerMessage.includes(h))) {
    return '저는 다음과 같은 질문에 답변할 수 있습니다:\n• 6M/4M2E 개념 및 구성요소\n• 원가 구조 및 분석\n• ESG 경영 지표\n• DMA100 분석 지표\n• 온톨로지 흐름 및 관계';
  }

  return null;
}

// 메인 메시지 전송 함수
export async function sendMessage(message: string): Promise<{ response: string; provider: LLMProvider | 'quick' }> {
  // 빠른 응답 체크
  const quickResponse = getQuickResponse(message);
  if (quickResponse) {
    return { response: quickResponse, provider: 'quick' };
  }

  // 활성 LLM 가져오기
  const activeLLM = getActiveLLM();

  if (!activeLLM) {
    return {
      response: 'LLM이 활성화되지 않았습니다. 관리자 설정에서 LLM을 활성화해주세요.',
      provider: 'quick'
    };
  }

  try {
    let response: string;

    switch (activeLLM.provider) {
      case 'ollama':
        response = await callOllama(message, activeLLM);
        break;
      case 'chatgpt':
        response = await callChatGPT(message, activeLLM);
        break;
      case 'gemini':
        response = await callGemini(message, activeLLM);
        break;
      default:
        throw new Error('알 수 없는 LLM 제공자입니다.');
    }

    return { response, provider: activeLLM.provider };
  } catch (error) {
    console.error(`${activeLLM.provider} API error:`, error);

    // 폴백: 다음 우선순위 LLM 시도
    const settings = getLLMSettings();
    const providers: LLMConfig[] = [settings.ollama, settings.chatgpt, settings.gemini];
    const fallbacks = providers
      .filter(p => p.enabled && p.provider !== activeLLM.provider)
      .sort((a, b) => a.priority - b.priority);

    for (const fallback of fallbacks) {
      try {
        let response: string;
        switch (fallback.provider) {
          case 'ollama':
            response = await callOllama(message, fallback);
            break;
          case 'chatgpt':
            response = await callChatGPT(message, fallback);
            break;
          case 'gemini':
            response = await callGemini(message, fallback);
            break;
          default:
            continue;
        }
        return { response, provider: fallback.provider };
      } catch (e) {
        console.error(`Fallback ${fallback.provider} also failed:`, e);
        continue;
      }
    }

    // 모든 LLM 실패
    return {
      response: `죄송합니다. 현재 AI 서비스에 연결할 수 없습니다. (${error instanceof Error ? error.message : '알 수 없는 오류'})`,
      provider: 'quick'
    };
  }
}

// Ollama 연결 테스트
export async function testOllamaConnection(endpoint: string): Promise<{ success: boolean; models?: string[]; error?: string }> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    return { success: true, models };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '연결 실패'
    };
  }
}

// ChatGPT API 키 테스트
export async function testChatGPTKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API 키 검증 실패'
    };
  }
}

// Gemini API 키 테스트
export async function testGeminiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API 키 검증 실패'
    };
  }
}
