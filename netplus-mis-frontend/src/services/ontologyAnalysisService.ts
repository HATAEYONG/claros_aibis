/**
 * Ontology-based Root Cause Analysis Service
 * 온톨로지 기반 원인-결과-대책 분석 서비스 (로트 추적 스타일)
 */

import { getActiveLLM, LLMProvider } from './llmService';

// =====================================================
// 1. 온톨로지 지식 베이스 정의
// =====================================================

// 6M 요소 정의
export interface OntologyElement {
  id: string;
  name: string;
  category: string;
  description: string;
  relatedElements: string[];
  possibleIssues: string[];
  kpis: string[];
}

// 원인-결과 관계 정의
export interface CausalRelation {
  cause: string;
  effect: string;
  strength: 'high' | 'medium' | 'low';
  description: string;
}

// 대책 정의
export interface Countermeasure {
  id: string;
  issue: string;
  action: string;
  category: '예방' | '시정' | '개선';
  priority: 'high' | 'medium' | 'low';
  responsible: string;
  timeline: string;
  expectedEffect: string;
}

// 분석 결과 타입
export interface RootCauseAnalysisResult {
  query: string;
  detectedIssue: string;
  affectedElements: OntologyElement[];
  causalChain: CausalRelation[];
  rootCauses: string[];
  effects: string[];
  countermeasures: Countermeasure[];
  lotTraceInfo?: LotTraceInfo;
  provider?: LLMProvider | 'local';
}

// 로트 추적 정보
export interface LotTraceInfo {
  lotNo: string;
  product: string;
  productionDate: string;
  line: string;
  shift: string;
  materials: MaterialInfo[];
  equipment: EquipmentInfo[];
  workers: WorkerInfo[];
  qualityRecords: QualityRecord[];
}

interface MaterialInfo {
  materialCode: string;
  materialName: string;
  lotNo: string;
  supplier: string;
  receivedDate: string;
}

interface EquipmentInfo {
  equipCode: string;
  equipName: string;
  lastMaintenance: string;
  status: string;
}

interface WorkerInfo {
  empId: string;
  empName: string;
  position: string;
  certification: string[];
}

interface QualityRecord {
  inspType: string;
  inspDate: string;
  result: 'pass' | 'fail';
  defectType?: string;
  inspector: string;
}

// =====================================================
// 2. 6M 온톨로지 지식 베이스
// =====================================================

export const ONTOLOGY_6M: OntologyElement[] = [
  // Man (인력)
  {
    id: 'man_skill',
    name: '작업자 숙련도',
    category: 'Man',
    description: '작업자의 기술 수준과 경험',
    relatedElements: ['man_training', 'method_sop', 'quality_defect'],
    possibleIssues: ['숙련도 부족', '신입 작업자 투입', '교육 미이수'],
    kpis: ['숙련도 점수', '교육 이수율', '자격증 보유율']
  },
  {
    id: 'man_training',
    name: '교육훈련',
    category: 'Man',
    description: '작업자 교육 및 훈련 현황',
    relatedElements: ['man_skill', 'method_sop', 'quality_process'],
    possibleIssues: ['교육 미실시', '교육 효과 미흡', '재교육 필요'],
    kpis: ['교육 이수율', '교육 만족도', '자격 취득률']
  },
  {
    id: 'man_fatigue',
    name: '작업자 피로도',
    category: 'Man',
    description: '작업자의 피로 및 컨디션',
    relatedElements: ['man_skill', 'quality_defect', 'environment_work'],
    possibleIssues: ['과로', '야간작업', '연속작업', '휴식 부족'],
    kpis: ['연장근무시간', '휴가 사용률', '결근율']
  },

  // Machine (설비)
  {
    id: 'machine_condition',
    name: '설비 상태',
    category: 'Machine',
    description: '설비의 현재 가동 상태',
    relatedElements: ['machine_maintenance', 'quality_defect', 'production_output'],
    possibleIssues: ['설비 노후화', '정밀도 저하', '이상 진동', '누유'],
    kpis: ['가동률', 'OEE', 'MTBF', 'MTTR']
  },
  {
    id: 'machine_maintenance',
    name: '설비 보전',
    category: 'Machine',
    description: '설비 예방보전 및 수리 현황',
    relatedElements: ['machine_condition', 'machine_spare', 'production_downtime'],
    possibleIssues: ['보전 지연', '예방보전 미실시', '부품 교체 지연'],
    kpis: ['예방보전율', '고장정지시간', '보전비용']
  },
  {
    id: 'machine_spare',
    name: '예비부품',
    category: 'Machine',
    description: '설비 예비부품 보유 현황',
    relatedElements: ['machine_maintenance', 'material_inventory'],
    possibleIssues: ['예비부품 부족', '호환부품 없음', '조달 지연'],
    kpis: ['예비부품 보유율', '조달 리드타임']
  },

  // Material (자재)
  {
    id: 'material_quality',
    name: '자재 품질',
    category: 'Material',
    description: '원자재 및 부품의 품질 상태',
    relatedElements: ['material_supplier', 'quality_incoming', 'quality_defect'],
    possibleIssues: ['자재 불량', '규격 미달', '이물질 혼입', '변질'],
    kpis: ['입고검사 합격률', '자재 불량률', '공급업체 품질등급']
  },
  {
    id: 'material_inventory',
    name: '재고 관리',
    category: 'Material',
    description: '자재 재고 수준 및 관리',
    relatedElements: ['material_quality', 'production_schedule'],
    possibleIssues: ['재고 부족', '과잉재고', '재고 불일치', '유효기간 만료'],
    kpis: ['재고 회전율', '안전재고 유지율', '재고 정확도']
  },
  {
    id: 'material_supplier',
    name: '공급업체',
    category: 'Material',
    description: '자재 공급업체 관리',
    relatedElements: ['material_quality', 'material_inventory'],
    possibleIssues: ['납기 지연', '공급 중단', '품질 불안정'],
    kpis: ['납기 준수율', '공급업체 평가점수']
  },

  // Method (방법)
  {
    id: 'method_sop',
    name: '작업표준',
    category: 'Method',
    description: '표준작업절차서(SOP) 및 작업 지침',
    relatedElements: ['man_skill', 'quality_process', 'method_change'],
    possibleIssues: ['SOP 미준수', 'SOP 미비', '표준시간 초과', '작업순서 오류'],
    kpis: ['SOP 준수율', '표준시간 달성률']
  },
  {
    id: 'method_process',
    name: '공정 조건',
    category: 'Method',
    description: '온도, 압력, 속도 등 공정 파라미터',
    relatedElements: ['machine_condition', 'quality_defect', 'method_sop'],
    possibleIssues: ['공정조건 이탈', '조건 설정 오류', '조건 변동'],
    kpis: ['공정능력지수(Cp, Cpk)', '조건 이탈률']
  },
  {
    id: 'method_change',
    name: '변경 관리',
    category: 'Method',
    description: '공정, 설비, 자재 등의 변경 관리',
    relatedElements: ['method_sop', 'quality_process', 'production_schedule'],
    possibleIssues: ['미승인 변경', '변경 미통보', '변경 이력 누락'],
    kpis: ['변경관리 준수율', '변경 승인 리드타임']
  },

  // Measurement (측정)
  {
    id: 'measurement_equipment',
    name: '측정 장비',
    category: 'Measurement',
    description: '측정 및 검사 장비 상태',
    relatedElements: ['measurement_calibration', 'quality_inspection'],
    possibleIssues: ['측정기 오차', '교정 만료', '측정기 고장'],
    kpis: ['측정기 교정율', '측정 정밀도']
  },
  {
    id: 'measurement_calibration',
    name: '교정 관리',
    category: 'Measurement',
    description: '측정 장비 교정 현황',
    relatedElements: ['measurement_equipment', 'quality_data'],
    possibleIssues: ['교정 미실시', '교정 주기 초과', '교정 기준 부적합'],
    kpis: ['교정 완료율', '교정 주기 준수율']
  },
  {
    id: 'measurement_method',
    name: '측정 방법',
    category: 'Measurement',
    description: '측정 절차 및 방법',
    relatedElements: ['measurement_equipment', 'quality_inspection', 'man_skill'],
    possibleIssues: ['측정방법 오류', '샘플링 부적합', '측정 누락'],
    kpis: ['측정 정확도', '재현성(R&R)']
  },

  // Environment (환경) - 4M2E
  {
    id: 'environment_work',
    name: '작업 환경',
    category: 'Environment',
    description: '온습도, 조명, 청결도 등 작업 환경',
    relatedElements: ['man_fatigue', 'quality_defect', 'material_quality'],
    possibleIssues: ['온습도 이탈', '조명 부족', '청결도 미달', '분진 발생'],
    kpis: ['환경조건 준수율', '5S 점수']
  },
  {
    id: 'environment_safety',
    name: '안전 환경',
    category: 'Environment',
    description: '안전 관련 환경 및 설비',
    relatedElements: ['man_fatigue', 'machine_condition'],
    possibleIssues: ['안전장치 미작동', '보호구 미착용', '위험구역 표시 누락'],
    kpis: ['무재해 일수', '안전교육 이수율']
  }
];

// =====================================================
// 3. 품질 문제 유형별 원인-결과 관계
// =====================================================

export const QUALITY_ISSUES: Record<string, {
  symptoms: string[];
  possibleCauses: { element: string; cause: string; probability: number }[];
  effects: string[];
  countermeasures: Countermeasure[];
}> = {
  '치수불량': {
    symptoms: ['규격 초과', '규격 미달', '공차 이탈'],
    possibleCauses: [
      { element: 'machine_condition', cause: '설비 정밀도 저하', probability: 0.35 },
      { element: 'method_process', cause: '공정조건 부적합', probability: 0.25 },
      { element: 'material_quality', cause: '자재 규격 불량', probability: 0.20 },
      { element: 'man_skill', cause: '작업자 숙련도 부족', probability: 0.10 },
      { element: 'measurement_equipment', cause: '측정기 오차', probability: 0.10 }
    ],
    effects: ['고객 클레임', '재작업 발생', '납기 지연', '원가 상승'],
    countermeasures: [
      {
        id: 'CM001',
        issue: '설비 정밀도 저하',
        action: '설비 정밀도 점검 및 조정',
        category: '시정',
        priority: 'high',
        responsible: '설비팀',
        timeline: '즉시',
        expectedEffect: '치수 불량률 50% 감소'
      },
      {
        id: 'CM002',
        issue: '공정조건 부적합',
        action: '공정 파라미터 최적화 및 관리도 강화',
        category: '개선',
        priority: 'high',
        responsible: '생산기술팀',
        timeline: '1주일',
        expectedEffect: '공정능력지수 Cpk 1.33 이상 달성'
      }
    ]
  },
  '외관불량': {
    symptoms: ['스크래치', '오염', '변색', '찍힘'],
    possibleCauses: [
      { element: 'man_skill', cause: '취급 부주의', probability: 0.30 },
      { element: 'method_sop', cause: '작업표준 미준수', probability: 0.25 },
      { element: 'environment_work', cause: '작업환경 청결도 미달', probability: 0.20 },
      { element: 'material_quality', cause: '자재 표면 불량', probability: 0.15 },
      { element: 'machine_condition', cause: '설비 청결도 미달', probability: 0.10 }
    ],
    effects: ['외관 검사 불합격', '재작업/폐기', '고객 신뢰도 저하'],
    countermeasures: [
      {
        id: 'CM003',
        issue: '취급 부주의',
        action: '취급 주의사항 재교육 및 보호장갑 착용 의무화',
        category: '예방',
        priority: 'medium',
        responsible: '생산팀',
        timeline: '3일',
        expectedEffect: '취급 불량 70% 감소'
      },
      {
        id: 'CM004',
        issue: '작업환경 청결도 미달',
        action: '청소 주기 강화 및 5S 활동 활성화',
        category: '개선',
        priority: 'medium',
        responsible: '생산팀',
        timeline: '1주일',
        expectedEffect: '환경 기인 불량 60% 감소'
      }
    ]
  },
  '기능불량': {
    symptoms: ['동작 불량', '성능 미달', '내구성 부족'],
    possibleCauses: [
      { element: 'material_quality', cause: '부품 품질 불량', probability: 0.30 },
      { element: 'method_process', cause: '조립 공정 오류', probability: 0.25 },
      { element: 'machine_condition', cause: '설비 이상', probability: 0.20 },
      { element: 'method_sop', cause: '작업순서 오류', probability: 0.15 },
      { element: 'man_skill', cause: '조립 숙련도 부족', probability: 0.10 }
    ],
    effects: ['출하 정지', '리콜 위험', '브랜드 이미지 손상'],
    countermeasures: [
      {
        id: 'CM005',
        issue: '부품 품질 불량',
        action: '입고검사 강화 및 공급업체 품질감사',
        category: '예방',
        priority: 'high',
        responsible: '품질팀/구매팀',
        timeline: '2주일',
        expectedEffect: '부품 기인 불량 80% 감소'
      }
    ]
  },
  '생산성저하': {
    symptoms: ['생산량 미달', '사이클타임 증가', '가동률 저하'],
    possibleCauses: [
      { element: 'machine_condition', cause: '설비 고장/정지', probability: 0.30 },
      { element: 'machine_maintenance', cause: '예방보전 미흡', probability: 0.20 },
      { element: 'man_fatigue', cause: '작업자 피로', probability: 0.15 },
      { element: 'material_inventory', cause: '자재 부족', probability: 0.15 },
      { element: 'method_sop', cause: '비효율적 작업방법', probability: 0.20 }
    ],
    effects: ['납기 지연', '매출 손실', '고객 불만'],
    countermeasures: [
      {
        id: 'CM006',
        issue: '설비 고장/정지',
        action: 'TPM 활동 강화 및 예방보전 주기 단축',
        category: '예방',
        priority: 'high',
        responsible: '설비팀',
        timeline: '1개월',
        expectedEffect: '설비 가동률 95% 이상'
      }
    ]
  },
  '원가상승': {
    symptoms: ['재료비 증가', '인건비 증가', '경비 증가'],
    possibleCauses: [
      { element: 'material_quality', cause: '불량으로 인한 재작업', probability: 0.25 },
      { element: 'material_inventory', cause: '재고 과다', probability: 0.20 },
      { element: 'machine_condition', cause: '설비 효율 저하', probability: 0.20 },
      { element: 'method_process', cause: '공정 비효율', probability: 0.20 },
      { element: 'man_fatigue', cause: '연장근무 증가', probability: 0.15 }
    ],
    effects: ['수익성 악화', '가격 경쟁력 저하'],
    countermeasures: [
      {
        id: 'CM007',
        issue: '불량으로 인한 재작업',
        action: '품질 개선 활동 및 불량률 목표 관리',
        category: '개선',
        priority: 'high',
        responsible: '품질팀/생산팀',
        timeline: '3개월',
        expectedEffect: '재작업 비용 40% 절감'
      }
    ]
  }
};

// =====================================================
// 4. 원인-결과 분석 함수
// =====================================================

/**
 * 자연어 질문에서 문제 유형 감지
 */
export function detectIssueType(question: string): string[] {
  const lowerQ = question.toLowerCase();
  const detectedIssues: string[] = [];

  const issueKeywords: Record<string, string[]> = {
    '치수불량': ['치수', '규격', '공차', '크기', '길이', '두께', '폭'],
    '외관불량': ['외관', '스크래치', '찍힘', '오염', '변색', '표면'],
    '기능불량': ['기능', '동작', '성능', '고장', '작동', '내구성'],
    '생산성저하': ['생산성', '가동률', '생산량', '사이클타임', 'oee', '효율'],
    '원가상승': ['원가', '비용', '단가', '재료비', '인건비', '경비']
  };

  for (const [issue, keywords] of Object.entries(issueKeywords)) {
    if (keywords.some(kw => lowerQ.includes(kw))) {
      detectedIssues.push(issue);
    }
  }

  // 일반적인 문제 키워드
  if (lowerQ.includes('불량') || lowerQ.includes('문제') || lowerQ.includes('이상')) {
    if (detectedIssues.length === 0) {
      detectedIssues.push('치수불량'); // 기본값
    }
  }

  return detectedIssues;
}

/**
 * 6M 요소 매칭
 */
export function findRelatedElements(question: string): OntologyElement[] {
  const lowerQ = question.toLowerCase();
  const matched: OntologyElement[] = [];

  for (const element of ONTOLOGY_6M) {
    // 요소명 매칭
    if (lowerQ.includes(element.name.toLowerCase())) {
      matched.push(element);
      continue;
    }

    // 카테고리 매칭
    const categoryKeywords: Record<string, string[]> = {
      'Man': ['작업자', '인력', '숙련', '교육', '피로'],
      'Machine': ['설비', '기계', '장비', '보전', '정비'],
      'Material': ['자재', '원자재', '부품', '재고', '공급업체'],
      'Method': ['방법', '공정', '작업표준', 'sop', '조건'],
      'Measurement': ['측정', '검사', '교정', '계측'],
      'Environment': ['환경', '온도', '습도', '청결', '안전']
    };

    const keywords = categoryKeywords[element.category] || [];
    if (keywords.some(kw => lowerQ.includes(kw))) {
      if (!matched.find(m => m.id === element.id)) {
        matched.push(element);
      }
    }

    // 문제 키워드 매칭
    for (const issue of element.possibleIssues) {
      if (lowerQ.includes(issue.toLowerCase())) {
        if (!matched.find(m => m.id === element.id)) {
          matched.push(element);
          break;
        }
      }
    }
  }

  return matched;
}

/**
 * 인과관계 체인 구축
 */
export function buildCausalChain(issue: string, elements: OntologyElement[]): CausalRelation[] {
  const chain: CausalRelation[] = [];
  const issueData = QUALITY_ISSUES[issue];

  if (!issueData) return chain;

  // 원인 -> 증상 관계
  for (const cause of issueData.possibleCauses) {
    const element = ONTOLOGY_6M.find(e => e.id === cause.element);
    if (element) {
      chain.push({
        cause: cause.cause,
        effect: issueData.symptoms[0],
        strength: cause.probability > 0.25 ? 'high' : cause.probability > 0.15 ? 'medium' : 'low',
        description: `${element.category}(${element.name})의 "${cause.cause}" 문제가 "${issueData.symptoms[0]}" 증상을 유발`
      });
    }
  }

  // 증상 -> 결과 관계
  for (const effect of issueData.effects) {
    chain.push({
      cause: issueData.symptoms[0],
      effect: effect,
      strength: 'high',
      description: `"${issueData.symptoms[0]}"가 지속되면 "${effect}"로 이어짐`
    });
  }

  return chain;
}

/**
 * 샘플 로트 추적 정보 생성
 */
function generateSampleLotTrace(question: string): LotTraceInfo | undefined {
  const lowerQ = question.toLowerCase();

  // 로트번호 패턴 검색
  const lotMatch = question.match(/lot[:\s]?([A-Z0-9-]+)/i) ||
                   question.match(/로트[:\s]?([A-Z0-9-]+)/i);

  if (!lotMatch && !lowerQ.includes('로트') && !lowerQ.includes('lot')) {
    return undefined;
  }

  // 샘플 데이터
  return {
    lotNo: lotMatch?.[1] || 'LOT-2024-1226-001',
    product: '제품A (PROD-001)',
    productionDate: '2024-12-26',
    line: 'Line-02',
    shift: '주간 (08:00-17:00)',
    materials: [
      {
        materialCode: 'MAT-001',
        materialName: '원자재A',
        lotNo: 'MAT-LOT-2024-1220-001',
        supplier: '(주)공급업체A',
        receivedDate: '2024-12-20'
      },
      {
        materialCode: 'MAT-002',
        materialName: '부품B',
        lotNo: 'MAT-LOT-2024-1218-003',
        supplier: '(주)공급업체B',
        receivedDate: '2024-12-18'
      }
    ],
    equipment: [
      {
        equipCode: 'EQ-L02-001',
        equipName: 'CNC 가공기 #1',
        lastMaintenance: '2024-12-15',
        status: '정상 가동'
      },
      {
        equipCode: 'EQ-L02-002',
        equipName: '조립 장비 #3',
        lastMaintenance: '2024-12-10',
        status: '정상 가동'
      }
    ],
    workers: [
      {
        empId: 'EMP001',
        empName: '김생산',
        position: '반장',
        certification: ['품질관리기사', 'CNC조작자격']
      },
      {
        empId: 'EMP002',
        empName: '이작업',
        position: '사원',
        certification: ['조립기능사']
      }
    ],
    qualityRecords: [
      {
        inspType: '공정검사',
        inspDate: '2024-12-26 10:30',
        result: 'pass',
        inspector: '박검사'
      },
      {
        inspType: '최종검사',
        inspDate: '2024-12-26 16:00',
        result: 'fail',
        defectType: '치수불량',
        inspector: '최품질'
      }
    ]
  };
}

// =====================================================
// 5. 메인 분석 함수
// =====================================================

/**
 * 온톨로지 기반 원인-결과-대책 분석
 */
export async function analyzeRootCause(question: string): Promise<RootCauseAnalysisResult> {
  // 1. 문제 유형 감지
  const detectedIssues = detectIssueType(question);
  const primaryIssue = detectedIssues[0] || '치수불량';

  // 2. 관련 6M 요소 찾기
  const affectedElements = findRelatedElements(question);

  // 3. 인과관계 체인 구축
  const causalChain = buildCausalChain(primaryIssue, affectedElements);

  // 4. 문제 데이터 조회
  const issueData = QUALITY_ISSUES[primaryIssue];

  // 5. 로트 추적 정보
  const lotTraceInfo = generateSampleLotTrace(question);

  // 6. LLM이 활성화되어 있으면 LLM 분석 추가
  const activeLLM = getActiveLLM();
  let provider: LLMProvider | 'local' = 'local';

  if (activeLLM) {
    try {
      // LLM을 통한 추가 분석 (향후 구현)
      provider = activeLLM.provider;
    } catch (error) {
      console.error('LLM analysis error:', error);
    }
  }

  return {
    query: question,
    detectedIssue: primaryIssue,
    affectedElements: affectedElements.length > 0 ? affectedElements : ONTOLOGY_6M.slice(0, 3),
    causalChain,
    rootCauses: issueData?.possibleCauses.map(c => c.cause) || [],
    effects: issueData?.effects || [],
    countermeasures: issueData?.countermeasures || [],
    lotTraceInfo,
    provider
  };
}

/**
 * 분석 질문인지 감지
 */
export function isAnalysisQuery(message: string): boolean {
  const analysisKeywords = [
    '원인', '왜', '이유', '분석', '추적', '로트',
    '불량', '문제', '이상', '대책', '개선', '해결',
    '6m', '4m', '어떻게', '뭐가', '무엇이',
    '치수', '외관', '기능', '생산성', '원가'
  ];
  const lowerMessage = message.toLowerCase();
  return analysisKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * 온톨로지 개요 반환
 */
export function getOntologyOverview(): string {
  let overview = '## 6M 온톨로지 지식 베이스\n\n';

  const categories = ['Man', 'Machine', 'Material', 'Method', 'Measurement', 'Environment'];

  for (const category of categories) {
    const elements = ONTOLOGY_6M.filter(e => e.category === category);
    overview += `### ${category} (${getCategoryKorean(category)})\n`;
    for (const elem of elements) {
      overview += `- **${elem.name}**: ${elem.description}\n`;
    }
    overview += '\n';
  }

  overview += '## 분석 가능한 품질 문제\n';
  for (const issue of Object.keys(QUALITY_ISSUES)) {
    overview += `- ${issue}\n`;
  }

  return overview;
}

function getCategoryKorean(category: string): string {
  const map: Record<string, string> = {
    'Man': '인력',
    'Machine': '설비',
    'Material': '자재',
    'Method': '방법',
    'Measurement': '측정',
    'Environment': '환경'
  };
  return map[category] || category;
}
