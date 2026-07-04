/**
 * Causal Analysis Service (원인-결과-대책 분석 서비스)
 * 온톨로지 기반으로 문제의 원인을 추적하고 대책을 제시하는 서비스
 * 6M, 4M2E 프레임워크와 연계하여 제조 현장의 문제를 분석
 */

import { getActiveLLM } from './llmService';

// =====================================================
// 1. 온톨로지 기반 인과관계 지식 베이스
// =====================================================

export interface CausalRelation {
  id: string;
  category: '6M' | '4M2E' | 'Quality' | 'Cost' | 'Delivery' | 'Safety' | 'Environment';
  subcategory: string;
  problem: string;           // 현상/문제
  symptoms: string[];        // 증상들
  causes: CauseNode[];       // 원인들 (계층적)
  effects: string[];         // 영향/결과
  countermeasures: Countermeasure[];  // 대책들
  relatedLots?: string[];    // 관련 로트 추적 테이블
  relatedTables?: string[];  // 관련 DB 테이블
  keywords: string[];        // 검색 키워드
}

export interface CauseNode {
  id: string;
  description: string;
  level: 'direct' | 'root' | 'contributing';  // 직접원인, 근본원인, 기여원인
  mCategory?: 'Man' | 'Machine' | 'Material' | 'Method' | 'Measurement' | 'Mother Nature' | 'Environment' | 'Energy';
  subCauses?: CauseNode[];   // 하위 원인 (Why-Why 분석)
  probability?: number;      // 발생 확률 (0-1)
  checkPoints?: string[];    // 확인 포인트
}

export interface Countermeasure {
  id: string;
  type: 'immediate' | 'corrective' | 'preventive';  // 즉시대책, 시정조치, 예방조치
  description: string;
  priority: 'high' | 'medium' | 'low';
  responsibleDept?: string;  // 담당 부서
  estimatedTime?: string;    // 예상 소요 시간
  cost?: string;             // 예상 비용
  effectiveness?: number;    // 효과성 (0-100)
  relatedProcedure?: string; // 관련 절차서
}

export interface AnalysisResult {
  query: string;
  matchedProblems: ProblemMatch[];
  causalChain: CausalChainItem[];
  recommendedActions: Countermeasure[];
  lotTraceInfo?: LotTraceInfo;
  relatedOntology: OntologyReference[];
  analysisMethod: string;
}

export interface ProblemMatch {
  problem: CausalRelation;
  matchScore: number;
  matchedKeywords: string[];
}

export interface CausalChainItem {
  level: number;
  type: 'problem' | 'cause' | 'effect';
  description: string;
  mCategory?: string;
  children?: CausalChainItem[];
}

export interface LotTraceInfo {
  suggestedQuery: string;
  relevantTables: string[];
  traceDirection: 'forward' | 'backward' | 'both';
}

export interface OntologyReference {
  concept: string;
  definition: string;
  relatedConcepts: string[];
}

// =====================================================
// 2. 제조 현장 문제 온톨로지 지식 베이스
// =====================================================

export const CAUSAL_KNOWLEDGE_BASE: CausalRelation[] = [
  // ========== 품질 문제 ==========
  {
    id: 'Q001',
    category: 'Quality',
    subcategory: '치수불량',
    problem: '제품 치수 규격 이탈',
    symptoms: ['치수 측정값 규격 초과', '조립 불가', '고객 클레임'],
    causes: [
      {
        id: 'Q001-C1',
        description: '금형 마모',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'Q001-C1-1', description: '금형 수명 초과 사용', level: 'root', mCategory: 'Method' },
          { id: 'Q001-C1-2', description: '금형 점검 주기 미준수', level: 'contributing', mCategory: 'Man' }
        ],
        probability: 0.35,
        checkPoints: ['금형 타수 확인', '금형 마모도 측정']
      },
      {
        id: 'Q001-C2',
        description: '원자재 수축률 변동',
        level: 'direct',
        mCategory: 'Material',
        subCauses: [
          { id: 'Q001-C2-1', description: '원자재 로트 변경', level: 'root', mCategory: 'Material' },
          { id: 'Q001-C2-2', description: '입고검사 미흡', level: 'contributing', mCategory: 'Measurement' }
        ],
        probability: 0.25,
        checkPoints: ['원자재 성적서 확인', '수축률 테스트']
      },
      {
        id: 'Q001-C3',
        description: '성형 조건 변동',
        level: 'direct',
        mCategory: 'Method',
        subCauses: [
          { id: 'Q001-C3-1', description: '온도/압력 설정 오류', level: 'root', mCategory: 'Man' },
          { id: 'Q001-C3-2', description: '작업 표준서 미비', level: 'contributing', mCategory: 'Method' }
        ],
        probability: 0.3,
        checkPoints: ['성형 조건 기록 확인', '표준 조건 대비 비교']
      },
      {
        id: 'Q001-C4',
        description: '측정 오류',
        level: 'direct',
        mCategory: 'Measurement',
        subCauses: [
          { id: 'Q001-C4-1', description: '측정기 교정 불량', level: 'root', mCategory: 'Measurement' },
          { id: 'Q001-C4-2', description: '측정자 숙련도 부족', level: 'contributing', mCategory: 'Man' }
        ],
        probability: 0.1,
        checkPoints: ['측정기 교정 성적서 확인', '측정 재현성 테스트']
      }
    ],
    effects: ['고객 클레임 발생', '반품 처리', '생산 중단', '추가 검사 비용 발생'],
    countermeasures: [
      {
        id: 'Q001-A1',
        type: 'immediate',
        description: '해당 로트 전수검사 실시',
        priority: 'high',
        responsibleDept: '품질관리팀',
        estimatedTime: '4시간',
        effectiveness: 95
      },
      {
        id: 'Q001-A2',
        type: 'corrective',
        description: '금형 점검 및 보수/교체',
        priority: 'high',
        responsibleDept: '금형팀',
        estimatedTime: '1-2일',
        effectiveness: 85
      },
      {
        id: 'Q001-A3',
        type: 'corrective',
        description: '성형 조건 재설정 및 검증',
        priority: 'medium',
        responsibleDept: '생산기술팀',
        estimatedTime: '4시간',
        effectiveness: 80
      },
      {
        id: 'Q001-A4',
        type: 'preventive',
        description: '금형 관리 기준 강화 (타수 관리)',
        priority: 'medium',
        responsibleDept: '금형팀',
        estimatedTime: '1주',
        relatedProcedure: 'QP-M-001 금형관리절차서',
        effectiveness: 70
      },
      {
        id: 'Q001-A5',
        type: 'preventive',
        description: '원자재 입고검사 기준 강화',
        priority: 'medium',
        responsibleDept: '품질관리팀',
        estimatedTime: '2주',
        relatedProcedure: 'QP-I-002 수입검사절차서',
        effectiveness: 65
      }
    ],
    relatedLots: ['PP_PRODUCTION', 'QM_INSPECTION', 'MM_MATERIAL'],
    relatedTables: ['PP_PRODUCTION', 'QM_DEFECT', 'MM_INVENTORY'],
    keywords: ['치수', '규격', '이탈', '불량', '크기', '사이즈', '오차']
  },

  {
    id: 'Q002',
    category: 'Quality',
    subcategory: '외관불량',
    problem: '제품 외관 불량 (스크래치, 이물, 변색)',
    symptoms: ['표면 흠집', '이물 부착', '색상 불균일', '광택 저하'],
    causes: [
      {
        id: 'Q002-C1',
        description: '취급 부주의',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'Q002-C1-1', description: '작업자 교육 미흡', level: 'root', mCategory: 'Man' },
          { id: 'Q002-C1-2', description: '보호장갑 미착용', level: 'contributing', mCategory: 'Method' }
        ],
        probability: 0.4,
        checkPoints: ['작업 장갑 착용 확인', '취급 교육 이력']
      },
      {
        id: 'Q002-C2',
        description: '설비 오염',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'Q002-C2-1', description: '설비 청소 미흡', level: 'root', mCategory: 'Method' },
          { id: 'Q002-C2-2', description: '윤활유 누유', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.3,
        checkPoints: ['설비 청결 상태', '청소 점검표 확인']
      },
      {
        id: 'Q002-C3',
        description: '작업환경 오염',
        level: 'direct',
        mCategory: 'Environment',
        subCauses: [
          { id: 'Q002-C3-1', description: '청정도 관리 미흡', level: 'root', mCategory: 'Mother Nature' },
          { id: 'Q002-C3-2', description: '공조 시스템 불량', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.2,
        checkPoints: ['작업장 청정도 측정', '공조 필터 상태']
      }
    ],
    effects: ['출하 불가', '재작업 필요', '불량률 상승', '생산성 저하'],
    countermeasures: [
      {
        id: 'Q002-A1',
        type: 'immediate',
        description: '불량품 격리 및 선별',
        priority: 'high',
        responsibleDept: '생산팀',
        estimatedTime: '2시간',
        effectiveness: 90
      },
      {
        id: 'Q002-A2',
        type: 'corrective',
        description: '설비 청소 및 환경 정비',
        priority: 'high',
        responsibleDept: '생산팀',
        estimatedTime: '4시간',
        effectiveness: 85
      },
      {
        id: 'Q002-A3',
        type: 'preventive',
        description: '작업자 취급 교육 강화',
        priority: 'medium',
        responsibleDept: '생산팀',
        estimatedTime: '1일',
        relatedProcedure: 'WI-P-003 제품취급지침',
        effectiveness: 75
      },
      {
        id: 'Q002-A4',
        type: 'preventive',
        description: '5S 활동 강화',
        priority: 'medium',
        responsibleDept: '전 부서',
        estimatedTime: '지속적',
        effectiveness: 70
      }
    ],
    relatedTables: ['PP_PRODUCTION', 'QM_DEFECT', 'PM_MAINTENANCE'],
    keywords: ['외관', '스크래치', '흠집', '이물', '변색', '광택', '표면']
  },

  {
    id: 'Q003',
    category: 'Quality',
    subcategory: '기능불량',
    problem: '제품 기능 불량 (작동 불량, 성능 미달)',
    symptoms: ['작동 안됨', '성능 저하', '기능 테스트 실패', '내구성 불량'],
    causes: [
      {
        id: 'Q003-C1',
        description: '조립 불량',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'Q003-C1-1', description: '조립 순서 오류', level: 'root', mCategory: 'Method' },
          { id: 'Q003-C1-2', description: '체결 토크 미달', level: 'contributing', mCategory: 'Man' }
        ],
        probability: 0.35,
        checkPoints: ['조립 체크시트 확인', '토크 측정']
      },
      {
        id: 'Q003-C2',
        description: '부품 불량',
        level: 'direct',
        mCategory: 'Material',
        subCauses: [
          { id: 'Q003-C2-1', description: '협력사 품질 문제', level: 'root', mCategory: 'Material' },
          { id: 'Q003-C2-2', description: '수입검사 누락', level: 'contributing', mCategory: 'Measurement' }
        ],
        probability: 0.3,
        checkPoints: ['부품 LOT 추적', '수입검사 기록']
      },
      {
        id: 'Q003-C3',
        description: '설계 문제',
        level: 'root',
        mCategory: 'Method',
        probability: 0.15,
        checkPoints: ['설계 도면 검토', 'FMEA 분석']
      }
    ],
    effects: ['출하 정지', 'A/S 증가', '고객 신뢰도 하락', '리콜 위험'],
    countermeasures: [
      {
        id: 'Q003-A1',
        type: 'immediate',
        description: '출하 정지 및 전수 기능검사',
        priority: 'high',
        responsibleDept: '품질관리팀',
        estimatedTime: '8시간',
        effectiveness: 95
      },
      {
        id: 'Q003-A2',
        type: 'corrective',
        description: '불량 부품 LOT 추적 및 교체',
        priority: 'high',
        responsibleDept: '자재팀',
        estimatedTime: '1-2일',
        effectiveness: 90
      },
      {
        id: 'Q003-A3',
        type: 'preventive',
        description: '협력사 품질 감사 강화',
        priority: 'medium',
        responsibleDept: '구매팀',
        estimatedTime: '2주',
        relatedProcedure: 'QP-S-001 협력사관리절차서',
        effectiveness: 75
      }
    ],
    relatedLots: ['PP_PRODUCTION', 'MM_MATERIAL', 'MM_PURCHASE_ORDER'],
    relatedTables: ['PP_PRODUCTION', 'QM_DEFECT', 'MM_MATERIAL', 'MM_INVENTORY'],
    keywords: ['기능', '작동', '성능', '테스트', '불량', '고장', '동작']
  },

  // ========== 생산 문제 ==========
  {
    id: 'P001',
    category: 'Delivery',
    subcategory: '생산지연',
    problem: '생산 일정 지연',
    symptoms: ['계획 대비 실적 미달', '납기 지연', '재고 부족'],
    causes: [
      {
        id: 'P001-C1',
        description: '설비 고장',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'P001-C1-1', description: '예방보전 미흡', level: 'root', mCategory: 'Method' },
          { id: 'P001-C1-2', description: '노후 설비', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.35,
        checkPoints: ['설비 가동률', 'MTBF/MTTR 분석']
      },
      {
        id: 'P001-C2',
        description: '자재 부족',
        level: 'direct',
        mCategory: 'Material',
        subCauses: [
          { id: 'P001-C2-1', description: '수요 예측 오류', level: 'root', mCategory: 'Method' },
          { id: 'P001-C2-2', description: '공급업체 납기 지연', level: 'contributing', mCategory: 'Material' }
        ],
        probability: 0.3,
        checkPoints: ['재고 현황', '발주 현황', '입고 예정']
      },
      {
        id: 'P001-C3',
        description: '인력 부족',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'P001-C3-1', description: '결근/이직', level: 'root', mCategory: 'Man' },
          { id: 'P001-C3-2', description: '교육 훈련 부족', level: 'contributing', mCategory: 'Method' }
        ],
        probability: 0.2,
        checkPoints: ['근태 현황', '인력 배치표']
      },
      {
        id: 'P001-C4',
        description: '불량 발생 증가',
        level: 'direct',
        mCategory: 'Method',
        probability: 0.15,
        checkPoints: ['불량률 추이', '재작업 현황']
      }
    ],
    effects: ['고객 납기 지연', '긴급 운송비 발생', '신뢰도 하락', '패널티'],
    countermeasures: [
      {
        id: 'P001-A1',
        type: 'immediate',
        description: '잔업/특근 편성',
        priority: 'high',
        responsibleDept: '생산팀',
        estimatedTime: '즉시',
        effectiveness: 80
      },
      {
        id: 'P001-A2',
        type: 'immediate',
        description: '외주 생산 검토',
        priority: 'high',
        responsibleDept: '생산관리팀',
        estimatedTime: '1-2일',
        effectiveness: 75
      },
      {
        id: 'P001-A3',
        type: 'corrective',
        description: '설비 긴급 수리',
        priority: 'high',
        responsibleDept: '설비팀',
        estimatedTime: '4-8시간',
        effectiveness: 90
      },
      {
        id: 'P001-A4',
        type: 'preventive',
        description: 'TPM 활동 강화',
        priority: 'medium',
        responsibleDept: '설비팀',
        estimatedTime: '지속적',
        relatedProcedure: 'PM-001 예방보전절차서',
        effectiveness: 70
      }
    ],
    relatedTables: ['PP_WORK_ORDER', 'PP_PRODUCTION', 'PM_EQUIPMENT', 'PM_MAINTENANCE'],
    keywords: ['지연', '납기', '생산', '일정', '계획', '미달', '부족']
  },

  {
    id: 'P002',
    category: '6M',
    subcategory: '설비고장',
    problem: '설비 고장 및 정지',
    symptoms: ['설비 정지', '경보 발생', '이상음 발생', '성능 저하'],
    causes: [
      {
        id: 'P002-C1',
        description: '윤활 불량',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'P002-C1-1', description: '급유 주기 미준수', level: 'root', mCategory: 'Man' },
          { id: 'P002-C1-2', description: '윤활유 규격 오류', level: 'contributing', mCategory: 'Material' }
        ],
        probability: 0.25,
        checkPoints: ['윤활유 상태', '급유 기록']
      },
      {
        id: 'P002-C2',
        description: '마모/파손',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'P002-C2-1', description: '수명 초과 사용', level: 'root', mCategory: 'Method' },
          { id: 'P002-C2-2', description: '과부하 운전', level: 'contributing', mCategory: 'Man' }
        ],
        probability: 0.35,
        checkPoints: ['부품 수명 관리', '운전 조건 확인']
      },
      {
        id: 'P002-C3',
        description: '전기/전자 불량',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'P002-C3-1', description: '센서 고장', level: 'root', mCategory: 'Machine' },
          { id: 'P002-C3-2', description: '배선 불량', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.2,
        checkPoints: ['센서 작동 확인', '전기 점검']
      }
    ],
    effects: ['생산 중단', '납기 지연', '수리 비용 발생', '안전 위험'],
    countermeasures: [
      {
        id: 'P002-A1',
        type: 'immediate',
        description: '긴급 수리 및 부품 교체',
        priority: 'high',
        responsibleDept: '설비팀',
        estimatedTime: '2-8시간',
        effectiveness: 95
      },
      {
        id: 'P002-A2',
        type: 'corrective',
        description: '고장 원인 분석 (PM 분석)',
        priority: 'high',
        responsibleDept: '설비팀',
        estimatedTime: '1일',
        effectiveness: 85
      },
      {
        id: 'P002-A3',
        type: 'preventive',
        description: '예방보전 계획 수립/강화',
        priority: 'medium',
        responsibleDept: '설비팀',
        estimatedTime: '1주',
        relatedProcedure: 'PM-001 예방보전절차서',
        effectiveness: 80
      },
      {
        id: 'P002-A4',
        type: 'preventive',
        description: '자주보전 활동 (TPM)',
        priority: 'medium',
        responsibleDept: '생산팀',
        estimatedTime: '지속적',
        effectiveness: 70
      }
    ],
    relatedTables: ['PM_EQUIPMENT', 'PM_MAINTENANCE', 'PP_PRODUCTION'],
    keywords: ['설비', '고장', '정지', '수리', '보전', '기계', '장비', '다운']
  },

  // ========== 원가 문제 ==========
  {
    id: 'C001',
    category: 'Cost',
    subcategory: '원가상승',
    problem: '제조원가 상승',
    symptoms: ['단위원가 증가', '이익률 감소', '예산 초과'],
    causes: [
      {
        id: 'C001-C1',
        description: '원자재비 상승',
        level: 'direct',
        mCategory: 'Material',
        subCauses: [
          { id: 'C001-C1-1', description: '시장 가격 상승', level: 'root', mCategory: 'Mother Nature' },
          { id: 'C001-C1-2', description: '환율 변동', level: 'contributing', mCategory: 'Mother Nature' }
        ],
        probability: 0.3,
        checkPoints: ['원자재 가격 추이', '환율 변동']
      },
      {
        id: 'C001-C2',
        description: '불량률 증가',
        level: 'direct',
        mCategory: 'Method',
        subCauses: [
          { id: 'C001-C2-1', description: '품질 관리 미흡', level: 'root', mCategory: 'Method' },
          { id: 'C001-C2-2', description: '설비 노후화', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.25,
        checkPoints: ['불량률 추이', '재작업 비용']
      },
      {
        id: 'C001-C3',
        description: '생산성 저하',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'C001-C3-1', description: '숙련도 부족', level: 'root', mCategory: 'Man' },
          { id: 'C001-C3-2', description: '라인 밸런스 불균형', level: 'contributing', mCategory: 'Method' }
        ],
        probability: 0.25,
        checkPoints: ['시간당 생산량', 'UPH 추이']
      },
      {
        id: 'C001-C4',
        description: '에너지 비용 증가',
        level: 'direct',
        mCategory: 'Energy',
        probability: 0.2,
        checkPoints: ['전력 사용량', '에너지 효율']
      }
    ],
    effects: ['이익 감소', '경쟁력 약화', '가격 인상 필요'],
    countermeasures: [
      {
        id: 'C001-A1',
        type: 'immediate',
        description: '원가 분석 및 원인 파악',
        priority: 'high',
        responsibleDept: '원가팀',
        estimatedTime: '1주',
        effectiveness: 80
      },
      {
        id: 'C001-A2',
        type: 'corrective',
        description: 'VE/VA 활동 추진',
        priority: 'medium',
        responsibleDept: '기술팀',
        estimatedTime: '1-3개월',
        effectiveness: 75
      },
      {
        id: 'C001-A3',
        type: 'preventive',
        description: '공정 개선 활동',
        priority: 'medium',
        responsibleDept: '생산기술팀',
        estimatedTime: '지속적',
        effectiveness: 70
      },
      {
        id: 'C001-A4',
        type: 'preventive',
        description: '에너지 절감 활동',
        priority: 'low',
        responsibleDept: '설비팀',
        estimatedTime: '지속적',
        effectiveness: 60
      }
    ],
    relatedTables: ['CO_PRODUCT_COST', 'CO_COST_CENTER', 'PP_PRODUCTION'],
    keywords: ['원가', '비용', '가격', '상승', '증가', '이익', '손실']
  },

  // ========== 안전 문제 ==========
  {
    id: 'S001',
    category: 'Safety',
    subcategory: '안전사고',
    problem: '작업장 안전사고 발생',
    symptoms: ['부상 발생', '아차사고', '위험 상황'],
    causes: [
      {
        id: 'S001-C1',
        description: '안전수칙 미준수',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'S001-C1-1', description: '안전교육 미흡', level: 'root', mCategory: 'Method' },
          { id: 'S001-C1-2', description: '안전의식 부족', level: 'contributing', mCategory: 'Man' }
        ],
        probability: 0.4,
        checkPoints: ['안전교육 이력', '안전수칙 게시']
      },
      {
        id: 'S001-C2',
        description: '보호구 미착용',
        level: 'direct',
        mCategory: 'Man',
        probability: 0.3,
        checkPoints: ['보호구 착용 상태', '보호구 비치 현황']
      },
      {
        id: 'S001-C3',
        description: '설비 안전장치 불량',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'S001-C3-1', description: '안전장치 점검 미흡', level: 'root', mCategory: 'Method' },
          { id: 'S001-C3-2', description: '안전장치 고장', level: 'contributing', mCategory: 'Machine' }
        ],
        probability: 0.2,
        checkPoints: ['안전장치 작동 확인', '점검 기록']
      }
    ],
    effects: ['인명 피해', '산재 발생', '생산 중단', '법적 책임'],
    countermeasures: [
      {
        id: 'S001-A1',
        type: 'immediate',
        description: '응급 조치 및 사고 보고',
        priority: 'high',
        responsibleDept: '안전팀',
        estimatedTime: '즉시',
        effectiveness: 100
      },
      {
        id: 'S001-A2',
        type: 'corrective',
        description: '사고 원인 조사 및 재발 방지',
        priority: 'high',
        responsibleDept: '안전팀',
        estimatedTime: '1주',
        effectiveness: 90
      },
      {
        id: 'S001-A3',
        type: 'preventive',
        description: '안전교육 강화',
        priority: 'high',
        responsibleDept: '안전팀',
        estimatedTime: '지속적',
        relatedProcedure: 'SP-001 안전관리절차서',
        effectiveness: 80
      },
      {
        id: 'S001-A4',
        type: 'preventive',
        description: '위험성 평가 실시',
        priority: 'medium',
        responsibleDept: '안전팀',
        estimatedTime: '1개월',
        effectiveness: 75
      }
    ],
    keywords: ['안전', '사고', '부상', '위험', '재해', '보호']
  },

  // ========== 환경 문제 ==========
  {
    id: 'E001',
    category: 'Environment',
    subcategory: '환경오염',
    problem: '환경 오염 발생',
    symptoms: ['폐수 배출 초과', '대기 배출 초과', '폐기물 처리 문제'],
    causes: [
      {
        id: 'E001-C1',
        description: '환경설비 고장',
        level: 'direct',
        mCategory: 'Machine',
        subCauses: [
          { id: 'E001-C1-1', description: '노후화', level: 'root', mCategory: 'Machine' },
          { id: 'E001-C1-2', description: '점검 미흡', level: 'contributing', mCategory: 'Method' }
        ],
        probability: 0.35,
        checkPoints: ['환경설비 가동 상태', '처리 효율']
      },
      {
        id: 'E001-C2',
        description: '처리 용량 초과',
        level: 'direct',
        mCategory: 'Machine',
        probability: 0.3,
        checkPoints: ['처리량 대비 발생량', '설비 용량']
      },
      {
        id: 'E001-C3',
        description: '운영 미흡',
        level: 'direct',
        mCategory: 'Man',
        subCauses: [
          { id: 'E001-C3-1', description: '운영자 교육 부족', level: 'root', mCategory: 'Man' },
          { id: 'E001-C3-2', description: '모니터링 미흡', level: 'contributing', mCategory: 'Measurement' }
        ],
        probability: 0.35,
        checkPoints: ['운영 기록', '모니터링 데이터']
      }
    ],
    effects: ['환경 규제 위반', '과태료', '조업 정지', '기업 이미지 하락'],
    countermeasures: [
      {
        id: 'E001-A1',
        type: 'immediate',
        description: '긴급 조치 및 당국 보고',
        priority: 'high',
        responsibleDept: '환경팀',
        estimatedTime: '즉시',
        effectiveness: 100
      },
      {
        id: 'E001-A2',
        type: 'corrective',
        description: '환경설비 수리/보완',
        priority: 'high',
        responsibleDept: '환경팀',
        estimatedTime: '1-2주',
        effectiveness: 90
      },
      {
        id: 'E001-A3',
        type: 'preventive',
        description: '환경 모니터링 강화',
        priority: 'medium',
        responsibleDept: '환경팀',
        estimatedTime: '지속적',
        relatedProcedure: 'EP-001 환경관리절차서',
        effectiveness: 80
      }
    ],
    keywords: ['환경', '오염', '배출', '폐수', '대기', '폐기물', 'ESG']
  }
];

// =====================================================
// 3. 온톨로지 개념 정의 (6M, 4M2E)
// =====================================================

export const ONTOLOGY_CONCEPTS: OntologyReference[] = [
  // 6M
  { concept: 'Man (인적요인)', definition: '작업자의 숙련도, 교육, 실수, 태도 등 인적 요소', relatedConcepts: ['교육', '숙련도', '작업자', '인력'] },
  { concept: 'Machine (설비)', definition: '설비, 기계, 공구의 상태 및 성능', relatedConcepts: ['설비', '기계', '고장', '보전'] },
  { concept: 'Material (자재)', definition: '원자재, 부품의 품질 및 특성', relatedConcepts: ['원자재', '부품', '자재', '재료'] },
  { concept: 'Method (방법)', definition: '작업 방법, 절차, 표준의 적절성', relatedConcepts: ['작업표준', '절차', '방법', '프로세스'] },
  { concept: 'Measurement (측정)', definition: '측정 방법, 검사, 계측기의 정확성', relatedConcepts: ['측정', '검사', '계측', '품질검사'] },
  { concept: 'Mother Nature (환경)', definition: '온도, 습도, 청정도 등 작업 환경', relatedConcepts: ['환경', '온도', '습도', '작업환경'] },

  // 4M2E
  { concept: 'Environment (환경)', definition: '작업 환경 및 외부 환경 요인', relatedConcepts: ['환경', '온습도', '청정도'] },
  { concept: 'Energy (에너지)', definition: '전력, 연료 등 에너지 사용 및 효율', relatedConcepts: ['에너지', '전력', '연료', '효율'] }
];

// =====================================================
// 4. 문제 분석 및 원인 추적 로직
// =====================================================

/**
 * 사용자 질문에서 관련 문제 찾기
 */
export function findRelatedProblems(query: string): ProblemMatch[] {
  const normalizedQuery = query.toLowerCase();
  const matches: ProblemMatch[] = [];

  for (const problem of CAUSAL_KNOWLEDGE_BASE) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 키워드 매칭
    for (const keyword of problem.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 15;
        matchedKeywords.push(keyword);
      }
    }

    // 문제 설명 매칭
    if (normalizedQuery.includes(problem.problem.toLowerCase())) {
      score += 25;
      matchedKeywords.push(problem.problem);
    }

    // 증상 매칭
    for (const symptom of problem.symptoms) {
      if (normalizedQuery.includes(symptom.toLowerCase())) {
        score += 12;
        matchedKeywords.push(symptom);
      }
    }

    // 카테고리 매칭
    if (normalizedQuery.includes(problem.category.toLowerCase()) ||
        normalizedQuery.includes(problem.subcategory.toLowerCase())) {
      score += 10;
      matchedKeywords.push(problem.subcategory);
    }

    if (score > 0) {
      matches.push({ problem, matchScore: score, matchedKeywords });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 인과관계 체인 구축
 */
export function buildCausalChain(problem: CausalRelation): CausalChainItem[] {
  const chain: CausalChainItem[] = [];

  // 문제 (현상)
  chain.push({
    level: 0,
    type: 'problem',
    description: problem.problem
  });

  // 원인들 (계층적)
  for (const cause of problem.causes) {
    const causeItem: CausalChainItem = {
      level: 1,
      type: 'cause',
      description: cause.description,
      mCategory: cause.mCategory,
      children: []
    };

    // 하위 원인 추가
    if (cause.subCauses) {
      for (const subCause of cause.subCauses) {
        causeItem.children!.push({
          level: 2,
          type: 'cause',
          description: subCause.description,
          mCategory: subCause.mCategory
        });
      }
    }

    chain.push(causeItem);
  }

  // 영향/결과
  for (const effect of problem.effects) {
    chain.push({
      level: 1,
      type: 'effect',
      description: effect
    });
  }

  return chain;
}

/**
 * 대책 우선순위 정렬
 */
export function prioritizeCountermeasures(countermeasures: Countermeasure[]): Countermeasure[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const typeOrder = { immediate: 0, corrective: 1, preventive: 2 };

  return [...countermeasures].sort((a, b) => {
    // 우선순위 먼저
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 같은 우선순위면 유형으로
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * 로트 추적 정보 생성
 */
export function generateLotTraceInfo(problem: CausalRelation): LotTraceInfo {
  const tables = problem.relatedTables || [];

  let suggestedQuery = '';
  if (tables.includes('PP_PRODUCTION')) {
    suggestedQuery = `SELECT * FROM PP_PRODUCTION WHERE prod_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
  } else if (tables.includes('QM_DEFECT')) {
    suggestedQuery = `SELECT * FROM QM_DEFECT WHERE defect_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
  }

  return {
    suggestedQuery,
    relevantTables: tables,
    traceDirection: 'both'
  };
}

// =====================================================
// 5. 통합 분석 함수
// =====================================================

/**
 * 종합 원인-결과-대책 분석
 */
export async function analyzeCausalRelation(query: string): Promise<AnalysisResult> {
  // 1. 관련 문제 찾기
  const matchedProblems = findRelatedProblems(query);

  if (matchedProblems.length === 0) {
    return {
      query,
      matchedProblems: [],
      causalChain: [],
      recommendedActions: [],
      relatedOntology: [],
      analysisMethod: 'keyword-matching'
    };
  }

  // 2. 최상위 매칭 문제에 대한 인과관계 분석
  const topProblem = matchedProblems[0].problem;
  const causalChain = buildCausalChain(topProblem);

  // 3. 대책 우선순위 정렬
  const recommendedActions = prioritizeCountermeasures(topProblem.countermeasures);

  // 4. 로트 추적 정보
  const lotTraceInfo = generateLotTraceInfo(topProblem);

  // 5. 관련 온톨로지 개념
  const relatedOntology = findRelatedOntology(topProblem);

  // 6. LLM 사용 여부 확인 및 보강 (옵션)
  const activeLLM = getActiveLLM();
  let analysisMethod = 'knowledge-base';

  if (activeLLM) {
    // LLM을 통한 추가 분석 가능 (향후 확장)
    analysisMethod = `knowledge-base + ${activeLLM.provider}`;
  }

  return {
    query,
    matchedProblems,
    causalChain,
    recommendedActions,
    lotTraceInfo,
    relatedOntology,
    analysisMethod
  };
}

/**
 * 관련 온톨로지 개념 찾기
 */
function findRelatedOntology(problem: CausalRelation): OntologyReference[] {
  const related: OntologyReference[] = [];
  const mCategories = new Set<string>();

  // 원인들의 M 카테고리 수집
  for (const cause of problem.causes) {
    if (cause.mCategory) {
      mCategories.add(cause.mCategory);
    }
    if (cause.subCauses) {
      for (const sub of cause.subCauses) {
        if (sub.mCategory) {
          mCategories.add(sub.mCategory);
        }
      }
    }
  }

  // 매칭되는 온톨로지 개념 추가
  for (const concept of ONTOLOGY_CONCEPTS) {
    for (const mCat of mCategories) {
      if (concept.concept.includes(mCat)) {
        related.push(concept);
        break;
      }
    }
  }

  return related;
}

/**
 * 분석 질문인지 감지
 */
export function isCausalAnalysisQuery(message: string): boolean {
  const causalKeywords = [
    '원인', '왜', 'why', '이유', '분석',
    '대책', '해결', '조치', '방안', '개선',
    '불량', '고장', '문제', '이슈', '장애',
    '지연', '사고', '오류', '에러', '결함',
    '추적', '로트', '품질', '생산', '설비'
  ];

  const lowerMessage = message.toLowerCase();
  return causalKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * 분석 결과를 텍스트로 포맷팅
 */
export function formatAnalysisResult(result: AnalysisResult): string {
  if (result.matchedProblems.length === 0) {
    return `죄송합니다. "${result.query}"와 관련된 문제를 지식 베이스에서 찾을 수 없습니다.\n\n` +
           `다음 키워드로 질문해 보세요:\n` +
           `- 품질 관련: 치수불량, 외관불량, 기능불량\n` +
           `- 생산 관련: 생산지연, 설비고장\n` +
           `- 원가 관련: 원가상승\n` +
           `- 안전/환경: 안전사고, 환경오염`;
  }

  const top = result.matchedProblems[0].problem;
  let text = '';

  // 문제 요약
  text += `🔍 **분석 대상: ${top.problem}**\n`;
  text += `📁 분류: ${top.category} > ${top.subcategory}\n\n`;

  // 증상
  text += `⚠️ **증상:**\n`;
  top.symptoms.forEach(s => text += `• ${s}\n`);
  text += '\n';

  // 원인 분석 (Fishbone)
  text += `🎯 **원인 분석 (6M 관점):**\n`;
  for (const cause of top.causes) {
    const prob = cause.probability ? ` (${(cause.probability * 100).toFixed(0)}%)` : '';
    text += `\n**${cause.mCategory || 'Unknown'}** - ${cause.description}${prob}\n`;

    if (cause.subCauses) {
      cause.subCauses.forEach(sub => {
        text += `  └ ${sub.description} (${sub.level === 'root' ? '근본원인' : '기여원인'})\n`;
      });
    }

    if (cause.checkPoints) {
      text += `  📋 확인: ${cause.checkPoints.join(', ')}\n`;
    }
  }
  text += '\n';

  // 영향
  text += `💥 **영향/결과:**\n`;
  top.effects.forEach(e => text += `• ${e}\n`);
  text += '\n';

  // 대책
  text += `✅ **권장 대책:**\n`;
  const sortedActions = result.recommendedActions;

  const typeLabels = { immediate: '🚨 즉시대책', corrective: '🔧 시정조치', preventive: '🛡️ 예방조치' };
  const priorityLabels = { high: '🔴', medium: '🟡', low: '🟢' };

  sortedActions.forEach((action, idx) => {
    text += `\n${idx + 1}. ${typeLabels[action.type]} ${priorityLabels[action.priority]}\n`;
    text += `   ${action.description}\n`;
    if (action.responsibleDept) text += `   담당: ${action.responsibleDept}`;
    if (action.estimatedTime) text += ` | 소요: ${action.estimatedTime}`;
    if (action.effectiveness) text += ` | 효과: ${action.effectiveness}%`;
    text += '\n';
  });

  // 로트 추적 정보
  if (result.lotTraceInfo && result.lotTraceInfo.relevantTables.length > 0) {
    text += `\n📊 **로트 추적 관련 테이블:**\n`;
    text += result.lotTraceInfo.relevantTables.join(', ') + '\n';
  }

  text += `\n---\n📌 분석 방법: ${result.analysisMethod}`;

  return text;
}

// =====================================================
// 6. 실제 DB 연동 함수
// =====================================================

import * as api from './apiService';

/**
 * 실제 DB에서 로트 추적 데이터 조회
 */
export async function traceLotFromDB(lotNo: string): Promise<api.LotTraceResult | null> {
  try {
    const result = await api.traceLot(lotNo);
    return result;
  } catch (error) {
    console.error('Lot trace from DB failed:', error);
    return null;
  }
}

/**
 * 실제 DB에서 6M 원인 분석 데이터 조회
 */
export async function getCausalDataFromDB(
  lotNo?: string,
  startDate?: string,
  endDate?: string
): Promise<api.CausalAnalysisResult | null> {
  try {
    const result = await api.getCausalAnalysis(lotNo, startDate, endDate);
    return result;
  } catch (error) {
    console.error('Causal analysis from DB failed:', error);
    return null;
  }
}

/**
 * 로트 번호 감지
 */
export function extractLotNumber(message: string): string | null {
  // 로트 번호 패턴: LOT-YYYY-MMDD-XXX 또는 다양한 패턴
  const patterns = [
    /LOT[-_]?\d{4}[-_]?\d{4}[-_]?\d{3}/gi,
    /L\d{8,12}/gi,
    /[A-Z]{2,3}\d{6,10}/gi
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * 로트 추적 질문인지 감지
 */
export function isLotTraceQuery(message: string): boolean {
  const lotKeywords = ['로트', 'lot', '추적', 'trace', '이력'];
  const lowerMessage = message.toLowerCase();
  return lotKeywords.some(keyword => lowerMessage.includes(keyword)) ||
         extractLotNumber(message) !== null;
}

/**
 * 종합 분석 (지식베이스 + DB 데이터)
 */
export async function analyzeWithDBData(query: string): Promise<AnalysisResult & { dbData?: api.LotTraceResult | api.CausalAnalysisResult }> {
  // 1. 기본 지식베이스 분석
  const baseResult = await analyzeCausalRelation(query);

  // 2. 로트 번호가 있으면 DB에서 실제 데이터 조회
  const lotNo = extractLotNumber(query);
  let dbData: api.LotTraceResult | api.CausalAnalysisResult | undefined;

  if (lotNo) {
    const lotData = await traceLotFromDB(lotNo);
    if (lotData) {
      dbData = lotData;
      baseResult.analysisMethod = `${baseResult.analysisMethod} + DB`;

      // 로트 추적 정보 업데이트
      if (baseResult.lotTraceInfo) {
        baseResult.lotTraceInfo.suggestedQuery =
          `SELECT * FROM PP_PRODUCTION WHERE lot_no = '${lotNo}'`;
      }
    }
  }

  return { ...baseResult, dbData };
}
