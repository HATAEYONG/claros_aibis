/**
 * 4M2E 시나리오 모듈
 * Man, Machine, Material, Method + Environment, Energy
 * 제조 환경과 에너지 관점의 통합 분석
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// 4M2E 카테고리 타입
export type FourM2ECategory = 'man4m' | 'machine4m' | 'material4m' | 'method4m' | 'environment' | 'energy';

// 4M2E 메타데이터
export const FOUR_M2E_METADATA: Record<FourM2ECategory, {
  name: string;
  nameKo: string;
  description: string;
  color: string;
  keywords: string[];
}> = {
  man4m: {
    name: 'Man',
    nameKo: '인력',
    description: '작업자 역량, 안전, 복지',
    color: '#3B82F6',
    keywords: ['인력', '작업자', '안전', '역량', '복지', '인적자원']
  },
  machine4m: {
    name: 'Machine',
    nameKo: '설비',
    description: '설비 효율, 자동화, 스마트화',
    color: '#10B981',
    keywords: ['설비', '자동화', '스마트', '효율', 'IoT', 'AI설비']
  },
  material4m: {
    name: 'Material',
    nameKo: '자재',
    description: '친환경 자재, 재활용, 순환경제',
    color: '#F59E0B',
    keywords: ['자재', '친환경', '재활용', '순환', '그린소재']
  },
  method4m: {
    name: 'Method',
    nameKo: '방법',
    description: '친환경 공정, 청정생산',
    color: '#8B5CF6',
    keywords: ['공정', '청정생산', '친환경공정', '저탄소']
  },
  environment: {
    name: 'Environment',
    nameKo: '환경',
    description: '환경 영향, 탄소발자국, 폐기물',
    color: '#06B6D4',
    keywords: ['환경', '탄소', '배출', '폐기물', '오염', 'ESG환경']
  },
  energy: {
    name: 'Energy',
    nameKo: '에너지',
    description: '에너지 효율, 신재생, 절감',
    color: '#EF4444',
    keywords: ['에너지', '전력', '신재생', '절감', '효율', '태양광']
  }
};

// 4M2E SQL 템플릿
export const FOUR_M2E_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: '4m2e-energy-usage',
    name: '에너지 사용 현황',
    description: '구역/설비별 에너지 사용량 및 효율 분석',
    sql: `
      SELECT
        eu.zone_code,
        z.zone_name,
        eu.energy_type,
        SUM(eu.usage_amount) AS total_usage,
        eu.unit,
        SUM(eu.cost) AS total_cost,
        ROUND(SUM(eu.usage_amount) / SUM(eu.target_amount) * 100, 2) AS usage_rate,
        ROUND(SUM(eu.usage_amount) / NULLIF(SUM(p.production_qty), 0), 4) AS energy_per_unit
      FROM ENV_ENERGY_USAGE eu
      JOIN ENV_ZONE z ON eu.zone_code = z.zone_code
      LEFT JOIN PP_PRODUCTION p ON eu.zone_code = p.zone_code AND eu.usage_date = p.prod_date
      WHERE 1=1
        {{#if energyType}} AND eu.energy_type = '{{energyType}}' {{/if}}
        {{#if startDate}} AND eu.usage_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND eu.usage_date <= '{{endDate}}' {{/if}}
      GROUP BY eu.zone_code, z.zone_name, eu.energy_type, eu.unit
      ORDER BY total_usage DESC
    `,
    parameters: [
      { name: 'energyType', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'zone_name', displayName: '구역', type: 'string' },
        { dbColumn: 'energy_type', displayName: '에너지', type: 'string' },
        { dbColumn: 'total_usage', displayName: '사용량', type: 'number' },
        { dbColumn: 'total_cost', displayName: '비용', type: 'currency' },
        { dbColumn: 'usage_rate', displayName: '사용률(%)', type: 'percentage' },
        { dbColumn: 'energy_per_unit', displayName: '단위당에너지', type: 'number' }
      ]
    }
  },
  {
    id: '4m2e-carbon-footprint',
    name: '탄소 발자국 분석',
    description: '제품/공정별 탄소 배출량 분석',
    sql: `
      SELECT
        cf.product_code,
        pr.product_name,
        cf.process_code,
        SUM(cf.co2_emission) AS total_co2,
        SUM(cf.scope1_emission) AS scope1,
        SUM(cf.scope2_emission) AS scope2,
        SUM(cf.scope3_emission) AS scope3,
        ROUND(SUM(cf.co2_emission) / NULLIF(SUM(p.production_qty), 0), 4) AS co2_per_unit,
        cf.measurement_date
      FROM ESG_CARBON_FOOTPRINT cf
      LEFT JOIN MM_PRODUCT pr ON cf.product_code = pr.product_code
      LEFT JOIN PP_PRODUCTION p ON cf.product_code = p.product_code AND cf.measurement_date = p.prod_date
      WHERE 1=1
        {{#if productCode}} AND cf.product_code = '{{productCode}}' {{/if}}
        {{#if startDate}} AND cf.measurement_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND cf.measurement_date <= '{{endDate}}' {{/if}}
      GROUP BY cf.product_code, pr.product_name, cf.process_code, cf.measurement_date
      ORDER BY total_co2 DESC
    `,
    parameters: [
      { name: 'productCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'product_name', displayName: '제품명', type: 'string' },
        { dbColumn: 'process_code', displayName: '공정', type: 'string' },
        { dbColumn: 'total_co2', displayName: '총CO2(kg)', type: 'number' },
        { dbColumn: 'scope1', displayName: 'Scope1', type: 'number' },
        { dbColumn: 'scope2', displayName: 'Scope2', type: 'number' },
        { dbColumn: 'scope3', displayName: 'Scope3', type: 'number' },
        { dbColumn: 'co2_per_unit', displayName: '단위당CO2', type: 'number' }
      ]
    }
  },
  {
    id: '4m2e-waste-analysis',
    name: '폐기물 분석',
    description: '폐기물 발생/재활용 현황 분석',
    sql: `
      SELECT
        wd.waste_type,
        wd.waste_category,
        SUM(wd.amount) AS total_amount,
        SUM(CASE WHEN wd.disposal_method = 'RECYCLE' THEN wd.amount ELSE 0 END) AS recycled_amount,
        ROUND(SUM(CASE WHEN wd.disposal_method = 'RECYCLE' THEN wd.amount ELSE 0 END) * 100.0 / NULLIF(SUM(wd.amount), 0), 2) AS recycle_rate,
        SUM(wd.disposal_cost) AS total_cost,
        COUNT(DISTINCT wd.source_zone) AS source_count
      FROM ENV_WASTE_DISPOSAL wd
      WHERE 1=1
        {{#if wasteCategory}} AND wd.waste_category = '{{wasteCategory}}' {{/if}}
        {{#if startDate}} AND wd.waste_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND wd.waste_date <= '{{endDate}}' {{/if}}
      GROUP BY wd.waste_type, wd.waste_category
      ORDER BY total_amount DESC
    `,
    parameters: [
      { name: 'wasteCategory', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'waste_type', displayName: '폐기물유형', type: 'string' },
        { dbColumn: 'waste_category', displayName: '분류', type: 'string' },
        { dbColumn: 'total_amount', displayName: '발생량', type: 'number' },
        { dbColumn: 'recycled_amount', displayName: '재활용량', type: 'number' },
        { dbColumn: 'recycle_rate', displayName: '재활용률(%)', type: 'percentage' },
        { dbColumn: 'total_cost', displayName: '처리비용', type: 'currency' }
      ]
    }
  },
  {
    id: '4m2e-green-material',
    name: '친환경 자재 현황',
    description: '친환경 인증 자재 사용 현황',
    sql: `
      SELECT
        m.mat_code,
        m.mat_name,
        m.eco_grade,
        m.eco_certification,
        SUM(mu.used_qty) AS total_usage,
        s.supplier_name,
        s.eco_certified,
        ROUND(SUM(mu.used_qty) * 100.0 / (
          SELECT SUM(used_qty) FROM MM_BOM_USAGE WHERE usage_date BETWEEN '{{startDate}}' AND '{{endDate}}'
        ), 2) AS usage_share
      FROM MM_MATERIAL m
      LEFT JOIN MM_BOM_USAGE mu ON m.mat_code = mu.mat_code
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      WHERE m.eco_grade IS NOT NULL
        {{#if startDate}} AND mu.usage_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND mu.usage_date <= '{{endDate}}' {{/if}}
      GROUP BY m.mat_code, m.mat_name, m.eco_grade, m.eco_certification, s.supplier_name, s.eco_certified
      ORDER BY total_usage DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'mat_name', displayName: '자재명', type: 'string' },
        { dbColumn: 'eco_grade', displayName: '친환경등급', type: 'string' },
        { dbColumn: 'eco_certification', displayName: '인증', type: 'string' },
        { dbColumn: 'total_usage', displayName: '사용량', type: 'number' },
        { dbColumn: 'supplier_name', displayName: '공급업체', type: 'string' },
        { dbColumn: 'usage_share', displayName: '사용비율(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: '4m2e-automation-status',
    name: '자동화/스마트화 현황',
    description: '설비 자동화 및 스마트화 수준 분석',
    sql: `
      SELECT
        eq.equip_type,
        COUNT(*) AS total_count,
        SUM(CASE WHEN eq.automation_level >= 3 THEN 1 ELSE 0 END) AS auto_count,
        ROUND(SUM(CASE WHEN eq.automation_level >= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS auto_rate,
        SUM(CASE WHEN eq.iot_connected = 'Y' THEN 1 ELSE 0 END) AS iot_count,
        ROUND(SUM(CASE WHEN eq.iot_connected = 'Y' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS iot_rate,
        ROUND(AVG(eq.oee), 2) AS avg_oee
      FROM PM_EQUIPMENT eq
      WHERE eq.status = 'ACTIVE'
      GROUP BY eq.equip_type
      ORDER BY auto_rate DESC
    `,
    parameters: [],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_type', displayName: '설비유형', type: 'string' },
        { dbColumn: 'total_count', displayName: '총설비수', type: 'number' },
        { dbColumn: 'auto_count', displayName: '자동화설비', type: 'number' },
        { dbColumn: 'auto_rate', displayName: '자동화율(%)', type: 'percentage' },
        { dbColumn: 'iot_count', displayName: 'IoT연결', type: 'number' },
        { dbColumn: 'iot_rate', displayName: 'IoT율(%)', type: 'percentage' },
        { dbColumn: 'avg_oee', displayName: '평균OEE', type: 'percentage' }
      ]
    }
  },
  {
    id: '4m2e-worker-safety',
    name: '작업자 안전/복지',
    description: '작업자 안전 및 복지 현황 분석',
    sql: `
      SELECT
        d.dept_code,
        d.dept_name,
        COUNT(DISTINCT e.emp_id) AS worker_count,
        SUM(CASE WHEN sa.severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_accidents,
        SUM(CASE WHEN sa.severity = 'MINOR' THEN 1 ELSE 0 END) AS minor_accidents,
        SUM(sa.lost_days) AS total_lost_days,
        ROUND(AVG(ws.satisfaction_score), 2) AS avg_satisfaction,
        SUM(t.training_hours) AS safety_training_hours
      FROM HR_DEPARTMENT d
      LEFT JOIN HR_EMPLOYEE e ON d.dept_code = e.dept_code
      LEFT JOIN ENV_SAFETY_ACCIDENT sa ON e.emp_id = sa.victim_id
      LEFT JOIN HR_WELFARE_SURVEY ws ON e.emp_id = ws.emp_id
      LEFT JOIN HR_TRAINING t ON e.emp_id = t.emp_id AND t.training_type = 'SAFETY'
      WHERE e.status = 'ACTIVE'
      GROUP BY d.dept_code, d.dept_name
      ORDER BY total_lost_days DESC
    `,
    parameters: [],
    resultMapping: {
      columns: [
        { dbColumn: 'dept_name', displayName: '부서', type: 'string' },
        { dbColumn: 'worker_count', displayName: '인원', type: 'number' },
        { dbColumn: 'critical_accidents', displayName: '중대사고', type: 'number' },
        { dbColumn: 'minor_accidents', displayName: '경미사고', type: 'number' },
        { dbColumn: 'total_lost_days', displayName: '근로손실일', type: 'number' },
        { dbColumn: 'avg_satisfaction', displayName: '만족도', type: 'number' },
        { dbColumn: 'safety_training_hours', displayName: '안전교육(h)', type: 'number' }
      ]
    }
  }
];

// 4M2E 원인 분석
export const FOUR_M2E_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: '4m2e-c1',
      category: 'motherNature',
      description: '에너지 효율 저하',
      probability: 30,
      evidence: ['노후 설비', '비효율 운전', '대기 전력']
    },
    {
      id: '4m2e-c2',
      category: 'motherNature',
      description: '탄소 배출 증가',
      probability: 25,
      evidence: ['화석연료 사용', '공정 효율 저하', '폐기물 증가']
    },
    {
      id: '4m2e-c3',
      category: 'material',
      description: '비친환경 자재 사용',
      probability: 20,
      evidence: ['친환경 대체재 미적용', '재활용 불가 소재']
    },
    {
      id: '4m2e-c4',
      category: 'machine',
      description: '자동화 수준 미흡',
      probability: 15,
      evidence: ['수동 공정', 'IoT 미연결', '데이터 수집 미흡']
    },
    {
      id: '4m2e-c5',
      category: 'man',
      description: '안전/환경 인식 부족',
      probability: 10,
      evidence: ['교육 미흡', '안전 위반', '환경 규정 미준수']
    }
  ],
  secondaryCauses: [
    { id: '4m2e-c1-1', category: 'machine', description: '설비 투자 부족', probability: 40 },
    { id: '4m2e-c2-1', category: 'method', description: 'ESG 전략 부재', probability: 35 }
  ],
  rootCauses: [
    { id: '4m2e-root-1', category: 'method', description: '지속가능경영 체계 미흡', probability: 60 }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 환경 성과가 저조한가?',
      answer: '에너지 효율이 낮고 탄소 배출이 많다',
      nextNodes: [{
        level: 2,
        question: '왜 에너지 효율이 낮은가?',
        answer: '노후 설비와 비효율적 운영',
        nextNodes: [{
          level: 3,
          question: '왜 개선하지 않는가?',
          answer: '투자 우선순위와 ESG 전략 부재',
          nextNodes: [{
            level: 4,
            question: '왜 ESG 전략이 없는가?',
            answer: '지속가능경영 체계가 구축되지 않음'
          }]
        }]
      }]
    }
  ]
};

// 4M2E 대책
export const FOUR_M2E_COUNTERMEASURES: Countermeasure[] = [
  {
    id: '4m2e-cm1',
    category: 'motherNature',
    type: 'immediate',
    title: '에너지 낭비 요소 제거',
    description: '대기 전력 차단, 불필요 조명 소등, 압축공기 누설 수리',
    priority: 'high',
    estimatedEffect: '에너지 10% 절감',
    responsible: '시설관리팀',
    kpi: [{ name: '에너지절감률', target: 10, unit: '%' }]
  },
  {
    id: '4m2e-cm2',
    category: 'machine',
    type: 'shortTerm',
    title: '고효율 설비 도입',
    description: 'IE3/IE4 모터, 인버터, LED 조명 등 고효율 설비 교체',
    priority: 'high',
    estimatedEffect: '에너지 20% 절감',
    responsible: '설비팀',
    deadline: '3개월',
    kpi: [{ name: '고효율설비 비율', target: 50, unit: '%' }]
  },
  {
    id: '4m2e-cm3',
    category: 'motherNature',
    type: 'longTerm',
    title: '신재생에너지 도입',
    description: '태양광, ESS 등 신재생에너지 시스템 구축',
    priority: 'medium',
    estimatedEffect: '탄소 배출 30% 감소',
    responsible: '시설팀',
    deadline: '1년',
    kpi: [{ name: '신재생에너지 비율', target: 20, unit: '%' }]
  },
  {
    id: '4m2e-cm4',
    category: 'material',
    type: 'shortTerm',
    title: '친환경 자재 전환',
    description: '재활용 가능, 친환경 인증 자재로 전환',
    priority: 'medium',
    estimatedEffect: '환경 영향 감소',
    responsible: '구매팀',
    deadline: '6개월',
    kpi: [{ name: '친환경자재 비율', target: 30, unit: '%' }]
  },
  {
    id: '4m2e-cm5',
    category: 'machine',
    type: 'longTerm',
    title: '스마트팩토리 구축',
    description: 'IoT, AI 기반 에너지 모니터링 및 최적화 시스템',
    priority: 'high',
    estimatedEffect: '에너지 효율 30% 향상',
    responsible: '스마트팩토리팀',
    deadline: '1년',
    kpi: [{ name: 'IoT 연결률', target: 80, unit: '%' }]
  },
  {
    id: '4m2e-cm6',
    category: 'man',
    type: 'preventive',
    title: 'ESG 교육 강화',
    description: '전 직원 대상 환경, 안전, 에너지 절감 교육',
    priority: 'medium',
    estimatedEffect: '환경 의식 향상',
    responsible: '인사팀',
    kpi: [{ name: '교육이수율', target: 100, unit: '%' }]
  }
];

// 4M2E 시나리오 정의
export const FOUR_M2E_SCENARIOS: Scenario[] = [
  {
    id: '4m2e-scenario-1',
    category: 'motherNature',
    title: '에너지 사용 분석',
    description: '구역/설비별 에너지 사용량 및 효율 분석',
    keywords: ['에너지', '전력', '가스', '에너지효율', '에너지절감', '4M2E에너지'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[0]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm1', '4m2e-cm2', '4m2e-cm3'].includes(c.id)),
    relatedScenarios: ['4m2e-scenario-2']
  },
  {
    id: '4m2e-scenario-2',
    category: 'motherNature',
    title: '탄소 발자국 분석',
    description: '제품/공정별 탄소 배출량 분석',
    keywords: ['탄소', 'CO2', '배출', '탄소발자국', '온실가스', 'Scope'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[1]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm3', '4m2e-cm4'].includes(c.id)),
    relatedScenarios: ['4m2e-scenario-1', '4m2e-scenario-3']
  },
  {
    id: '4m2e-scenario-3',
    category: 'motherNature',
    title: '폐기물/재활용 분석',
    description: '폐기물 발생 및 재활용 현황 분석',
    keywords: ['폐기물', '재활용', '순환경제', '자원순환', '재활용률'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[2]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm4'].includes(c.id)),
    relatedScenarios: ['4m2e-scenario-4']
  },
  {
    id: '4m2e-scenario-4',
    category: 'material',
    title: '친환경 자재 분석',
    description: '친환경 인증 자재 사용 현황 분석',
    keywords: ['친환경', '그린', '에코', '친환경자재', '녹색구매'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[3]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm4'].includes(c.id)),
    relatedScenarios: ['4m2e-scenario-3']
  },
  {
    id: '4m2e-scenario-5',
    category: 'machine',
    title: '자동화/스마트화 분석',
    description: '설비 자동화 및 스마트화 수준 분석',
    keywords: ['자동화', '스마트팩토리', 'IoT', 'AI', '디지털전환', '4차산업'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[4]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm5'].includes(c.id)),
    relatedScenarios: ['4m2e-scenario-1']
  },
  {
    id: '4m2e-scenario-6',
    category: 'man',
    title: '작업자 안전/복지 분석',
    description: '작업자 안전 및 복지 현황 분석',
    keywords: ['안전', '복지', '산재', '무재해', '근로환경', 'S(사회)'],
    sqlTemplates: [FOUR_M2E_SQL_TEMPLATES[5]],
    causeAnalysis: FOUR_M2E_CAUSE_ANALYSIS,
    countermeasures: FOUR_M2E_COUNTERMEASURES.filter(c => ['4m2e-cm6'].includes(c.id)),
    relatedScenarios: []
  }
];

// 4M2E 시나리오 매칭
export function matchFourM2EScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of FOUR_M2E_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// 4M2E 파라미터 추출
export function extractFourM2EParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  const energyMatch = query.match(/(전력|가스|용수|압축공기|스팀)/);
  if (energyMatch) {
    params.energyType = energyMatch[1];
  }

  return params;
}
