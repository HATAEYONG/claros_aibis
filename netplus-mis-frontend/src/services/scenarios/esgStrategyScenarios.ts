/**
 * ESG 전략 시나리오 모듈
 * ESG Strategy Scenarios - 환경, 사회, 거버넌스 전략 분석
 */

// ESG용 SQL 템플릿 인터페이스
export interface ESGSQLTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  requiredParams: string[];
  optionalParams: string[];
}

// ESG용 대책 인터페이스
export interface ESGCountermeasure {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'shortTerm' | 'longTerm' | 'preventive';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: string;
  expectedBenefit: string;
  responsibleRole: string;
  targetMetric: string;
  targetValue: number;
}

// ESG용 원인 분석 인터페이스
export interface ESGCause {
  category: string;
  description: string;
  probability: number;
  evidence: string[];
}

export interface ESGCauseAnalysis {
  rootCause: string;
  primaryCauses: ESGCause[];
  fiveWhyChain: { level: number; question: string; answer: string }[];
  contributingFactors: string[];
}

// ESG 카테고리 타입
export type ESGCategory = 'environment' | 'social' | 'governance' | 'sustainability' | 'compliance' | 'reporting';

// ESG 카테고리 메타데이터
export const ESG_METADATA: Record<ESGCategory, {
  name: string;
  nameKo: string;
  description: string;
  color: string;
  keywords: string[];
}> = {
  environment: {
    name: 'Environment',
    nameKo: '환경',
    description: '탄소배출, 에너지, 폐기물, 용수 관리 및 환경 영향',
    color: '#4CAF50',
    keywords: ['환경', '탄소', '배출', '에너지', '폐기물', '용수', '기후', '친환경']
  },
  social: {
    name: 'Social',
    nameKo: '사회',
    description: '임직원, 협력사, 지역사회 관계 및 사회적 책임',
    color: '#2196F3',
    keywords: ['사회', '안전', '보건', '인권', '다양성', '협력사', '지역사회', '고용']
  },
  governance: {
    name: 'Governance',
    nameKo: '지배구조',
    description: '이사회, 윤리경영, 리스크 관리, 투명성',
    color: '#9C27B0',
    keywords: ['거버넌스', '지배구조', '이사회', '윤리', '투명성', '내부통제', '리스크']
  },
  sustainability: {
    name: 'Sustainability',
    nameKo: '지속가능성',
    description: '지속가능경영 전략 및 목표 관리',
    color: '#00BCD4',
    keywords: ['지속가능', 'SDGs', 'RE100', '넷제로', '순환경제', '친환경제품']
  },
  compliance: {
    name: 'Compliance',
    nameKo: '컴플라이언스',
    description: 'ESG 규제 준수 및 인증 관리',
    color: '#FF9800',
    keywords: ['컴플라이언스', '규제', '인증', 'ISO', '법규', '기준', '표준']
  },
  reporting: {
    name: 'Reporting',
    nameKo: '공시',
    description: 'ESG 공시, 보고서, 등급 관리',
    color: '#795548',
    keywords: ['공시', '보고서', '등급', '평가', 'GRI', 'SASB', 'TCFD', 'CDP']
  }
};

// ESG SQL 템플릿
export const ESG_SQL_TEMPLATES: ESGSQLTemplate[] = [
  {
    id: 'esg-carbon-emission',
    name: '탄소배출 현황',
    description: 'Scope 1, 2, 3 탄소배출량 분석',
    sql: `
      SELECT
        DATE_FORMAT(ce.report_date, '%Y-%m') as period,
        ce.scope,
        ce.emission_source,
        SUM(ce.emission_amount) as total_emission,
        SUM(ce.emission_amount_co2e) as total_co2e,
        AVG(ce.emission_intensity) as avg_intensity,
        ce.calculation_method,
        ce.verification_status
      FROM carbon_emissions ce
      WHERE ce.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      {{#if scope}}AND ce.scope = '{{scope}}'{{/if}}
      {{#if facility}}AND ce.facility_id = '{{facility}}'{{/if}}
      GROUP BY DATE_FORMAT(ce.report_date, '%Y-%m'), ce.scope, ce.emission_source
      ORDER BY period DESC, ce.scope
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['scope', 'facility']
  },
  {
    id: 'esg-energy-usage',
    name: '에너지 사용 현황',
    description: '에너지 사용량 및 재생에너지 비중 분석',
    sql: `
      SELECT
        DATE_FORMAT(eu.usage_date, '%Y-%m') as period,
        eu.energy_type,
        SUM(eu.usage_amount) as total_usage,
        SUM(eu.usage_cost) as total_cost,
        SUM(CASE WHEN eu.is_renewable = 1 THEN eu.usage_amount ELSE 0 END) as renewable_usage,
        SUM(CASE WHEN eu.is_renewable = 1 THEN eu.usage_amount ELSE 0 END) /
          NULLIF(SUM(eu.usage_amount), 0) * 100 as renewable_ratio,
        AVG(eu.energy_intensity) as avg_intensity
      FROM energy_usage eu
      WHERE eu.usage_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      {{#if energyType}}AND eu.energy_type = '{{energyType}}'{{/if}}
      {{#if facility}}AND eu.facility_id = '{{facility}}'{{/if}}
      GROUP BY DATE_FORMAT(eu.usage_date, '%Y-%m'), eu.energy_type
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['energyType', 'facility']
  },
  {
    id: 'esg-safety-health',
    name: '안전보건 현황',
    description: '산업재해, 안전사고, 건강관리 현황',
    sql: `
      SELECT
        DATE_FORMAT(sh.report_date, '%Y-%m') as period,
        sh.incident_type,
        COUNT(*) as incident_count,
        SUM(sh.lost_days) as total_lost_days,
        sh.ltifr as lost_time_injury_frequency,
        sh.trifr as total_recordable_injury_frequency,
        COUNT(DISTINCT sh.affected_employee_id) as affected_employees,
        SUM(sh.incident_cost) as total_cost
      FROM safety_health_records sh
      WHERE sh.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      {{#if incidentType}}AND sh.incident_type = '{{incidentType}}'{{/if}}
      {{#if severity}}AND sh.severity = '{{severity}}'{{/if}}
      GROUP BY DATE_FORMAT(sh.report_date, '%Y-%m'), sh.incident_type
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['incidentType', 'severity']
  },
  {
    id: 'esg-supply-chain',
    name: '공급망 ESG 평가',
    description: '협력사 ESG 평가 및 리스크 분석',
    sql: `
      SELECT
        sp.supplier_id,
        sp.supplier_name,
        sp.supplier_tier,
        se.esg_score,
        se.environment_score,
        se.social_score,
        se.governance_score,
        se.risk_level,
        se.certification_status,
        se.audit_date,
        se.improvement_required
      FROM suppliers sp
      JOIN supplier_esg_evaluations se ON sp.supplier_id = se.supplier_id
      WHERE se.evaluation_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      {{#if riskLevel}}AND se.risk_level = '{{riskLevel}}'{{/if}}
      {{#if tier}}AND sp.supplier_tier = {{tier}}{{/if}}
      ORDER BY se.esg_score ASC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['riskLevel', 'tier']
  },
  {
    id: 'esg-governance-metrics',
    name: '거버넌스 지표',
    description: '이사회 구성, 윤리경영, 내부통제 현황',
    sql: `
      SELECT
        DATE_FORMAT(gm.report_date, '%Y') as year,
        gm.board_size,
        gm.independent_directors,
        gm.independent_ratio,
        gm.female_directors,
        gm.female_ratio,
        gm.board_meetings,
        gm.attendance_rate,
        gm.ethics_training_rate,
        gm.whistleblower_cases,
        gm.policy_violations,
        gm.internal_audit_findings
      FROM governance_metrics gm
      WHERE gm.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodYears}} YEAR)
      ORDER BY year DESC
    `,
    requiredParams: ['periodYears'],
    optionalParams: []
  },
  {
    id: 'esg-rating-tracking',
    name: 'ESG 등급 추적',
    description: 'ESG 평가기관별 등급 및 점수 추이',
    sql: `
      SELECT
        er.rating_agency,
        er.rating_year,
        er.overall_rating,
        er.overall_score,
        er.environment_rating,
        er.environment_score,
        er.social_rating,
        er.social_score,
        er.governance_rating,
        er.governance_score,
        er.industry_percentile,
        er.peer_comparison,
        er.key_strengths,
        er.improvement_areas
      FROM esg_ratings er
      WHERE er.rating_year >= YEAR(DATE_SUB(CURRENT_DATE, INTERVAL {{periodYears}} YEAR))
      {{#if ratingAgency}}AND er.rating_agency = '{{ratingAgency}}'{{/if}}
      ORDER BY er.rating_year DESC, er.rating_agency
    `,
    requiredParams: ['periodYears'],
    optionalParams: ['ratingAgency']
  }
];

// ESG 원인 분석
export const ESG_CAUSE_ANALYSIS: ESGCauseAnalysis = {
  rootCause: 'ESG 성과 미흡',
  primaryCauses: [
    {
      category: 'environment',
      description: '환경 관리 체계 미흡',
      probability: 30,
      evidence: ['탄소배출 증가', '에너지 효율 저하', '폐기물 관리 부실']
    },
    {
      category: 'social',
      description: '사회적 책임 이행 부족',
      probability: 25,
      evidence: ['안전사고 증가', '협력사 관리 미흡', '인권 리스크']
    },
    {
      category: 'governance',
      description: '거버넌스 체계 취약',
      probability: 25,
      evidence: ['내부통제 미흡', '윤리경영 사각지대', '이사회 다양성 부족']
    },
    {
      category: 'reporting',
      description: '공시 및 커뮤니케이션 부족',
      probability: 20,
      evidence: ['정보 공개 미흡', '이해관계자 소통 부족', '평가 대응 미흡']
    }
  ],
  fiveWhyChain: [
    { level: 1, question: '왜 ESG 등급이 낮은가?', answer: 'E/S/G 각 영역의 성과 지표가 미흡' },
    { level: 2, question: '왜 성과 지표가 미흡한가?', answer: '체계적인 ESG 전략 및 실행 계획 부재' },
    { level: 3, question: '왜 전략이 부재한가?', answer: '경영진의 ESG 중요성 인식 부족' },
    { level: 4, question: '왜 인식이 부족한가?', answer: 'ESG가 사업 가치에 미치는 영향 분석 미흡' },
    { level: 5, question: '왜 영향 분석이 미흡한가?', answer: 'ESG 데이터 수집/분석 인프라 부족' }
  ],
  contributingFactors: [
    '규제 환경 변화',
    '이해관계자 요구 증가',
    '기술 변화',
    '시장 경쟁',
    '자원 제약',
    '조직 역량 부족'
  ]
};

// ESG 개선 대책
export const ESG_COUNTERMEASURES: ESGCountermeasure[] = [
  {
    id: 'esg-cm-001',
    title: '탄소중립 로드맵 수립',
    description: 'Scope 1, 2, 3 감축 목표 및 실행 계획 수립',
    type: 'longTerm',
    priority: 'critical',
    estimatedCost: '전략 수립 및 투자 비용',
    expectedBenefit: '탄소배출 감소, 규제 대응, 기업 가치 제고',
    responsibleRole: 'ESG팀',
    targetMetric: 'carbon_reduction',
    targetValue: 30
  },
  {
    id: 'esg-cm-002',
    title: '재생에너지 전환',
    description: 'RE100 가입 및 재생에너지 사용 확대',
    type: 'longTerm',
    priority: 'high',
    estimatedCost: '에너지 전환 투자 비용',
    expectedBenefit: '재생에너지 100% 달성',
    responsibleRole: '시설팀/ESG팀',
    targetMetric: 'renewable_ratio',
    targetValue: 100
  },
  {
    id: 'esg-cm-003',
    title: '안전보건 경영시스템 강화',
    description: 'ISO 45001 인증 및 안전문화 정착',
    type: 'shortTerm',
    priority: 'critical',
    estimatedCost: '시스템 구축/인증 비용',
    expectedBenefit: '무재해 달성, 안전사고 제로화',
    responsibleRole: '안전보건팀',
    targetMetric: 'ltifr',
    targetValue: 0
  },
  {
    id: 'esg-cm-004',
    title: '공급망 ESG 관리',
    description: '협력사 ESG 평가 및 지원 프로그램 운영',
    type: 'shortTerm',
    priority: 'high',
    estimatedCost: '평가 및 지원 비용',
    expectedBenefit: '공급망 리스크 감소',
    responsibleRole: '구매팀/ESG팀',
    targetMetric: 'supplier_esg_score',
    targetValue: 70
  },
  {
    id: 'esg-cm-005',
    title: '이사회 다양성 확대',
    description: '사외이사, 여성이사 비율 확대',
    type: 'longTerm',
    priority: 'medium',
    estimatedCost: '이사 보수',
    expectedBenefit: '거버넌스 점수 향상',
    responsibleRole: '경영지원팀',
    targetMetric: 'board_diversity',
    targetValue: 30
  },
  {
    id: 'esg-cm-006',
    title: 'ESG 공시 체계 고도화',
    description: 'GRI, SASB, TCFD 기준 공시 체계 구축',
    type: 'immediate',
    priority: 'high',
    estimatedCost: '시스템 구축 비용',
    expectedBenefit: '공시 품질 향상, ESG 등급 개선',
    responsibleRole: 'ESG팀',
    targetMetric: 'disclosure_score',
    targetValue: 90
  }
];

// ESG 시나리오 인터페이스
export interface ESGScenario {
  id: string;
  title: string;
  description: string;
  category: ESGCategory;
  keywords: string[];
  sqlTemplates: ESGSQLTemplate[];
  causeAnalysis: ESGCauseAnalysis;
  countermeasures: ESGCountermeasure[];
  priority: number;
}

// ESG 시나리오 목록
export const ESG_SCENARIOS: ESGScenario[] = [
  {
    id: 'esg-carbon-management',
    title: '탄소배출 관리',
    description: 'Scope 1, 2, 3 탄소배출 현황 분석 및 감축 전략',
    category: 'environment',
    keywords: ['탄소', '배출', '탄소배출', 'CO2', '온실가스', 'GHG', '스코프', '넷제로'],
    sqlTemplates: [ESG_SQL_TEMPLATES[0]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-001'].includes(c.id)
    ),
    priority: 1
  },
  {
    id: 'esg-energy-management',
    title: '에너지 관리',
    description: '에너지 사용량 분석 및 재생에너지 전환 전략',
    category: 'environment',
    keywords: ['에너지', '전력', '재생에너지', 'RE100', '신재생', '태양광', '효율'],
    sqlTemplates: [ESG_SQL_TEMPLATES[1]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-002'].includes(c.id)
    ),
    priority: 2
  },
  {
    id: 'esg-safety-management',
    title: '안전보건 관리',
    description: '산업재해 및 안전사고 분석, 예방 대책',
    category: 'social',
    keywords: ['안전', '보건', '재해', '사고', '산재', 'LTIFR', '무재해'],
    sqlTemplates: [ESG_SQL_TEMPLATES[2]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-003'].includes(c.id)
    ),
    priority: 3
  },
  {
    id: 'esg-supply-chain',
    title: '공급망 ESG 관리',
    description: '협력사 ESG 평가 및 리스크 관리',
    category: 'social',
    keywords: ['공급망', '협력사', '공급업체', 'SCM', '협력업체', '벤더'],
    sqlTemplates: [ESG_SQL_TEMPLATES[3]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-004'].includes(c.id)
    ),
    priority: 4
  },
  {
    id: 'esg-governance-analysis',
    title: '거버넌스 분석',
    description: '이사회 구성, 윤리경영, 내부통제 분석',
    category: 'governance',
    keywords: ['거버넌스', '지배구조', '이사회', '윤리', '내부통제', '감사'],
    sqlTemplates: [ESG_SQL_TEMPLATES[4]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-005'].includes(c.id)
    ),
    priority: 5
  },
  {
    id: 'esg-rating-management',
    title: 'ESG 등급 관리',
    description: 'ESG 평가 등급 추이 분석 및 개선 전략',
    category: 'reporting',
    keywords: ['ESG등급', '평가', '등급', 'MSCI', 'KCGS', 'CDP', '지속가능경영'],
    sqlTemplates: [ESG_SQL_TEMPLATES[5]],
    causeAnalysis: ESG_CAUSE_ANALYSIS,
    countermeasures: ESG_COUNTERMEASURES.filter(c =>
      ['esg-cm-006'].includes(c.id)
    ),
    priority: 6
  }
];

// ESG 시나리오 매칭 함수
export function matchESGScenario(query: string): ESGScenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of ESG_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// ESG 파라미터 추출 함수
export function extractESGParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // 기간 추출 (개월)
  const monthMatch = query.match(/(\d+)\s*(개월|달|월)/);
  if (monthMatch) {
    params.periodMonths = parseInt(monthMatch[1]);
  } else {
    params.periodMonths = 12; // 기본 12개월
  }

  // 기간 추출 (년)
  const yearMatch = query.match(/(\d+)\s*(년|연)/);
  if (yearMatch) {
    params.periodYears = parseInt(yearMatch[1]);
  } else {
    params.periodYears = 3; // 기본 3년
  }

  // Scope 추출
  if (query.includes('스코프1') || query.includes('Scope 1') || query.includes('직접배출')) {
    params.scope = 'Scope 1';
  } else if (query.includes('스코프2') || query.includes('Scope 2') || query.includes('간접배출')) {
    params.scope = 'Scope 2';
  } else if (query.includes('스코프3') || query.includes('Scope 3') || query.includes('밸류체인')) {
    params.scope = 'Scope 3';
  }

  // 리스크 레벨 추출
  if (query.includes('고위험') || query.includes('high risk')) {
    params.riskLevel = 'high';
  } else if (query.includes('중위험') || query.includes('medium risk')) {
    params.riskLevel = 'medium';
  } else if (query.includes('저위험') || query.includes('low risk')) {
    params.riskLevel = 'low';
  }

  // 평가기관 추출
  if (query.includes('MSCI')) {
    params.ratingAgency = 'MSCI';
  } else if (query.includes('KCGS') || query.includes('한국기업지배구조원')) {
    params.ratingAgency = 'KCGS';
  } else if (query.includes('CDP')) {
    params.ratingAgency = 'CDP';
  } else if (query.includes('S&P') || query.includes('DJSI')) {
    params.ratingAgency = 'S&P Global';
  }

  return params;
}

// 카테고리별 시나리오 조회
export function getESGScenariosByCategory(category: ESGCategory): ESGScenario[] {
  return ESG_SCENARIOS.filter(s => s.category === category);
}

// ID로 시나리오 조회
export function getESGScenarioById(id: string): ESGScenario | undefined {
  return ESG_SCENARIOS.find(s => s.id === id);
}
