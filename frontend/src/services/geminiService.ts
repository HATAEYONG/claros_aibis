// Gemini API Service for Ontology Chatbot
// 온톨로지 데이터를 기반으로 Gemini API와 통신하는 서비스

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 온톨로지 컨텍스트 데이터
const ONTOLOGY_CONTEXT = `
당신은 Claros MIS-AI 대시보드의 온톨로지 분석 전문가입니다.
유한산업의 SAP ERP 시스템과 연동된 6M → 4M2E → 원가 → 재무 → ESG 온톨로지 흐름을 이해하고 설명합니다.

## 온톨로지 계층 구조

### Level 1: 6M 변경관리
6M은 제조 현장의 핵심 변경 요소입니다:
- Man (인력): 작업자, 인사정보 - 테이블: HRA100(인사마스터), CAG100(근태관리), QMM200_YH(6M변경신청)
- Machine (설비): 설비, 장비 - 테이블: FMA100(설비마스터), FMB100(설비가동현황), FMC100(설비보전이력)
- Material (자재): 원자재, 부자재 - 테이블: DMA100(품목마스터), DMA200(BOM마스터), DBB100(재고현황)
- Method (공법): 공정, 작업방법 - 테이블: PPC100(공정마스터), PPC200(라우팅정보), PPM100(생산지시)
- Measurement (측정): 검사, 측정 - 테이블: QMM100(수입검사), QMM110(공정검사), QMM120(출하검사)
- Mother Nature (자연환경): 환경 요인 - 테이블: GAW990_Yuhan(환경비용), QMM650(환경규제), FMP500(에너지사용)

### Level 2: 4M2E 제조관리
4M2E는 제조 원가에 직접 영향을 미치는 요소입니다:
- Man (인력): 작업자 배치, 생산성 - 테이블: PPC140_YH(작업자배치), PPW100(작업실적), CAE100(급여정보)
- Machine (설비): 설비 효율, 감가상각 - 테이블: CAG700(설비감가상각), CAG750(설비보험료), FMD100(설비고장이력)
- Material (자재): 재료비, 원가 - 테이블: COS220_YH(재료비집계), COS400_YH(원가계산), DBD100(불출현황)
- Method (공법): 공정 효율 - 테이블: COS310_YH(노무비집계), COS410_YH(경비집계), PPC300(공정능력)
- Environment (환경): 환경설비투자 - 테이블: GAW900(환경설비투자), ENV200(배출량관리), ENV300(환경인증)
- Energy (에너지): 에너지 비용 - 테이블: FMP500(에너지사용현황), FMP510(전력사용량), FMP520(가스사용량)

### Level 3: 원가관리 (COST)
제조원가의 구성요소:
- 재료비 (Material Cost): COS220_YH, COS221(직접재료비), COS222(간접재료비) - 약 32.8%
- 노무비 (Labor Cost): COS310_YH, COS311(직접노무비), COS312(간접노무비) - 약 25.5%
- 제조경비 (Overhead): COS410_YH, COS411(감가상각), COS412(수선비), COS413(전력비) - 약 18.3%
- 외주가공비: COS510_YH, DPO200(외주발주), DPO210(외주입고) - 약 12.4%
- 배부비용: COS600_YH(배부기준), COS610(부문별배부), COS620(제품별배부)

### Level 4: 재무관리 (FINANCE)
재무제표 및 관리회계:
- 손익계산서: GAL100(전표마스터), GAL200(계정별원장), GAR100(손익계산서)
- 재무상태표: GAR200(재무상태표), GAF100(고정자산대장), GAD100(채권관리), GAP100(채무관리)
- 현금흐름표: GAR300(현금흐름표), GAT100(자금현황), GAT200(자금계획)
- 관리회계: GAW100(예산관리), GAW200(예실대비), GAW300(손익분석), GAW400(KPI관리)

### Level 5: ESG 경영
- 환경(E): GAW990_Yuhan(환경비용), FMP500(에너지사용), ENV200(탄소배출), ENV400(재활용) - 점수 82점
- 사회(S): HRA100(인사), QME200(교육), SAF100(안전관리), QMM600(협력사관리) - 점수 78점
- 지배구조(G): QMM630(협력사평가), QMM640(성과평가), AUD100(내부감사), COM100(준법관리) - 점수 85점
- 종합 ESG 점수: 81.7점

## 주요 관계
- 6M 변경 → 4M2E 영향 분석 → 원가 집계 → 재무제표 반영 → ESG 지표 영향
- 품목마스터(DMA100)가 대부분의 원가/생산 테이블과 연결됨
- 인사마스터(HRA100)가 근태, 급여, 작업실적과 연결됨
- 설비마스터(FMA100)가 가동현황, 보전이력, 감가상각과 연결됨

답변 시 다음 사항을 준수하세요:
1. 관련 ERP 테이블명과 용도를 함께 설명
2. 온톨로지 레벨 간의 데이터 흐름을 설명
3. 구체적인 숫자나 비율을 활용
4. 한국어로 답변
5. 간결하고 명확하게 답변
`;

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
  error?: {
    message: string;
  };
}

export interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

// Gemini API 호출 함수
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '⚠️ Gemini API 키가 설정되지 않았습니다. 환경변수 VITE_GEMINI_API_KEY를 설정해주세요.';
  }

  try {
    // 대화 이력 구성
    const historyText = conversationHistory
      .slice(-6) // 최근 6개 메시지만 사용
      .map(msg => `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.text}`)
      .join('\n');

    const prompt = `${ONTOLOGY_CONTEXT}

## 이전 대화 내역
${historyText}

## 현재 질문
사용자: ${userMessage}

위 질문에 대해 온톨로지 전문가로서 답변해주세요:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return `⚠️ API 오류가 발생했습니다: ${errorData.error?.message || response.statusText}`;
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      return `⚠️ 오류: ${data.error.message}`;
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return '죄송합니다. 답변을 생성할 수 없습니다. 다시 질문해주세요.';
    }

    return answer;
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    return '⚠️ 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}

// 온톨로지 관련 질문인지 확인
export function isOntologyRelatedQuestion(message: string): boolean {
  const ontologyKeywords = [
    '6m', '4m2e', 'esg', '온톨로지', '원가', '재무', '비용',
    'man', 'machine', 'material', 'method', 'measurement', 'mother nature',
    '인력', '설비', '자재', '공법', '측정', '환경', '에너지',
    '재료비', '노무비', '경비', '외주', '배부',
    '손익', '재무상태', '현금흐름', '예산',
    '테이블', 'erp', 'erd', '관계', '데이터',
    '흐름', '분석', '지표', '점수'
  ];

  const lowerMessage = message.toLowerCase();
  return ontologyKeywords.some(keyword => lowerMessage.includes(keyword));
}

// 빠른 응답 (API 호출 없이)
export function getQuickResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  // 인사
  if (lowerMessage.includes('안녕') || lowerMessage.includes('hello')) {
    return '안녕하세요! Claros MIS-AI 온톨로지 어시스턴트입니다. 6M, 4M2E, 원가, 재무, ESG에 관한 질문을 해주세요.';
  }

  // 도움말
  if (lowerMessage.includes('도움') || lowerMessage.includes('help') || lowerMessage === '?') {
    return `저는 다음과 같은 질문에 답변할 수 있습니다:

📊 **온톨로지 구조**
- "6M이 뭐야?" / "4M2E 설명해줘"
- "온톨로지 레벨 구조 알려줘"

💰 **원가 관련**
- "재료비는 어떻게 집계되나요?"
- "원가 비율을 알려줘"

📈 **재무/ESG**
- "ESG 점수는 어떻게 되나요?"
- "재무제표와 연결된 테이블은?"

🔗 **데이터 관계**
- "DMA100 테이블의 용도는?"
- "인사마스터와 연결된 테이블은?"`;
  }

  return null;
}

export default {
  sendMessageToGemini,
  isOntologyRelatedQuestion,
  getQuickResponse,
};
