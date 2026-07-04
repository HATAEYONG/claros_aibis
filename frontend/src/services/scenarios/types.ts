/**
 * 6M 시나리오 모듈 공통 타입 정의
 * Man, Machine, Material, Method, Measurement, Mother Nature
 */

// 6M 카테고리 타입
export type SixMCategory = 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'motherNature';

// 시나리오 우선순위
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// 시나리오 상태
export type ScenarioStatus = 'active' | 'resolved' | 'pending' | 'monitoring';

// 기본 시나리오 인터페이스
export interface Scenario {
  id: string;
  category: SixMCategory;
  title: string;
  description: string;
  keywords: string[];  // 자연어 매칭용 키워드
  sqlTemplates: SQLTemplate[];  // Text-to-SQL 템플릿
  causeAnalysis: CauseAnalysis;  // 원인 분석
  countermeasures: Countermeasure[];  // 대책
  relatedScenarios: string[];  // 연관 시나리오 ID
}

// SQL 템플릿
export interface SQLTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  parameters: SQLParameter[];
  resultMapping: ResultMapping;
}

export interface SQLParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'dateRange';
  required: boolean;
  defaultValue?: any;
  extractPattern?: string;  // 자연어에서 추출하는 정규식
}

export interface ResultMapping {
  columns: ColumnMapping[];
  aggregations?: AggregationMapping[];
}

export interface ColumnMapping {
  dbColumn: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'percentage' | 'currency';
  format?: string;
}

export interface AggregationMapping {
  type: 'sum' | 'avg' | 'count' | 'min' | 'max';
  column: string;
  displayName: string;
}

// 원인 분석 (5 Why 기반)
export interface CauseAnalysis {
  primaryCauses: Cause[];
  secondaryCauses: Cause[];
  rootCauses: Cause[];
  whyChain: WhyChainNode[];
}

export interface Cause {
  id: string;
  category: SixMCategory;
  description: string;
  probability: number;  // 0-100
  evidence?: string[];
  sqlQuery?: string;  // 원인 확인용 SQL
}

export interface WhyChainNode {
  level: number;  // Why 1, 2, 3, 4, 5
  question: string;
  answer: string;
  nextNodes?: WhyChainNode[];
}

// 대책
export interface Countermeasure {
  id: string;
  category: SixMCategory;
  type: 'immediate' | 'shortTerm' | 'longTerm' | 'preventive';
  title: string;
  description: string;
  priority: Priority;
  estimatedEffect: string;
  responsible?: string;
  deadline?: string;
  kpi?: KPI[];
}

export interface KPI {
  name: string;
  target: number;
  unit: string;
  currentValue?: number;
}

// 자연어 처리 결과
export interface NLPResult {
  intent: ScenarioIntent;
  entities: ExtractedEntity[];
  category: SixMCategory | null;
  confidence: number;
  matchedScenarios: string[];
  sqlParams: Record<string, any>;
}

export type ScenarioIntent =
  | 'query'           // 조회
  | 'analyze'         // 분석
  | 'findCause'       // 원인 찾기
  | 'suggestAction'   // 대책 제안
  | 'trace'           // 추적
  | 'compare'         // 비교
  | 'predict'         // 예측
  | 'report';         // 리포트

export interface ExtractedEntity {
  type: 'date' | 'dateRange' | 'lotNo' | 'productCode' | 'workerName' |
        'equipmentCode' | 'defectType' | 'processCode' | 'number' | 'percentage';
  value: any;
  originalText: string;
  position: [number, number];
}

// 시나리오 실행 결과
export interface ScenarioResult {
  scenario: Scenario;
  sqlResults: SQLExecutionResult[];
  analysis: AnalysisOutput;
  recommendations: Countermeasure[];
  relatedData: any;
}

export interface SQLExecutionResult {
  templateId: string;
  sql: string;
  data: any[];
  rowCount: number;
  executionTime: number;
  error?: string;
}

export interface AnalysisOutput {
  summary: string;
  insights: string[];
  charts?: ChartData[];
  causeBreakdown?: CauseBreakdown;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  data: any;
  options?: any;
}

export interface CauseBreakdown {
  byCategory: Record<SixMCategory, number>;
  byPriority: Record<Priority, number>;
  timeline?: TimelineEntry[];
}

export interface TimelineEntry {
  timestamp: string;
  event: string;
  category: SixMCategory;
  impact: 'positive' | 'negative' | 'neutral';
}

// 6M 카테고리 메타데이터
export const SIX_M_METADATA: Record<SixMCategory, {
  name: string;
  nameKo: string;
  description: string;
  color: string;
  icon: string;
  keywords: string[];
}> = {
  man: {
    name: 'Man',
    nameKo: '인적요인',
    description: '작업자, 교육, 숙련도, 실수 관련',
    color: '#3B82F6',  // blue
    icon: 'user',
    keywords: ['작업자', '사원', '직원', '교육', '숙련', '실수', '휴먼에러', '인력', '작업', '담당자']
  },
  machine: {
    name: 'Machine',
    nameKo: '설비',
    description: '설비, 장비, 고장, 정비 관련',
    color: '#10B981',  // green
    icon: 'settings',
    keywords: ['설비', '기계', '장비', '고장', '정비', '가동', '다운타임', '보전', 'PM', '설비효율']
  },
  material: {
    name: 'Material',
    nameKo: '자재',
    description: '원자재, 부품, 공급업체, 입고 관련',
    color: '#F59E0B',  // amber
    icon: 'package',
    keywords: ['자재', '원자재', '부품', '소재', '공급', '입고', '재고', '불량자재', 'LOT', '협력사']
  },
  method: {
    name: 'Method',
    nameKo: '방법',
    description: '공정, 작업표준, 절차 관련',
    color: '#8B5CF6',  // violet
    icon: 'list',
    keywords: ['공정', '방법', '절차', '표준', '작업지시', 'SOP', '매뉴얼', '프로세스', '작업방법']
  },
  measurement: {
    name: 'Measurement',
    nameKo: '측정',
    description: '검사, 측정, 품질 관련',
    color: '#EF4444',  // red
    icon: 'check',
    keywords: ['측정', '검사', '품질', '불량', '합격', '불합격', 'QC', '검수', '수입검사', '출하검사']
  },
  motherNature: {
    name: 'Mother Nature',
    nameKo: '환경',
    description: '환경, 온도, 습도, 청정도 관련',
    color: '#06B6D4',  // cyan
    icon: 'leaf',
    keywords: ['환경', '온도', '습도', '조명', '청정', '분진', '오염', '클린룸', 'ESG', '에너지']
  }
};
