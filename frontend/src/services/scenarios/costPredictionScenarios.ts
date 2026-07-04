/**
 * 원가예측 시나리오 모듈
 * 제조원가, 재료비, 노무비, 경비 예측 및 분석
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// 원가 카테고리 타입
export type CostCategory = 'material_cost' | 'labor_cost' | 'overhead' | 'manufacturing' | 'variance' | 'prediction';

// 원가 메타데이터
export const COST_METADATA: Record<CostCategory, {
  name: string;
  nameKo: string;
  description: string;
  color: string;
  keywords: string[];
}> = {
  material_cost: {
    name: 'Material Cost',
    nameKo: '재료비',
    description: '직접재료비, 간접재료비 분석',
    color: '#F59E0B',
    keywords: ['재료비', '원재료', '자재비', '직접재료', '간접재료']
  },
  labor_cost: {
    name: 'Labor Cost',
    nameKo: '노무비',
    description: '직접노무비, 간접노무비 분석',
    color: '#3B82F6',
    keywords: ['노무비', '인건비', '급여', '직접노무', '간접노무']
  },
  overhead: {
    name: 'Overhead',
    nameKo: '경비',
    description: '제조경비, 간접비 분석',
    color: '#10B981',
    keywords: ['경비', '간접비', '제조경비', '고정비', '변동비']
  },
  manufacturing: {
    name: 'Manufacturing Cost',
    nameKo: '제조원가',
    description: '총제조원가, 제품별 원가 분석',
    color: '#8B5CF6',
    keywords: ['제조원가', '총원가', '제품원가', '단위원가', '원가구조']
  },
  variance: {
    name: 'Variance',
    nameKo: '원가차이',
    description: '예산 대비 실적 차이 분석',
    color: '#EF4444',
    keywords: ['원가차이', '예산차이', '실적차이', '차이분석', '예실']
  },
  prediction: {
    name: 'Prediction',
    nameKo: '원가예측',
    description: '미래 원가 예측 및 시뮬레이션',
    color: '#06B6D4',
    keywords: ['원가예측', '예측', '시뮬레이션', '전망', '추정']
  }
};

// 원가 SQL 템플릿
export const COST_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'cost-material-analysis',
    name: '재료비 분석',
    description: '제품/기간별 재료비 현황 분석',
    sql: `
      SELECT
        mc.product_code,
        p.product_name,
        SUM(mc.direct_material) AS direct_material,
        SUM(mc.indirect_material) AS indirect_material,
        SUM(mc.direct_material + mc.indirect_material) AS total_material,
        ROUND(SUM(mc.direct_material + mc.indirect_material) / NULLIF(SUM(mc.prod_qty), 0), 2) AS unit_material_cost,
        SUM(mc.prod_qty) AS total_qty,
        ROUND(SUM(mc.direct_material + mc.indirect_material) * 100.0 / SUM(mc.total_cost), 2) AS material_ratio
      FROM AC_MANUFACTURING_COST mc
      LEFT JOIN MM_PRODUCT p ON mc.product_code = p.product_code
      WHERE 1=1
        {{#if productCode}} AND mc.product_code = '{{productCode}}' {{/if}}
        {{#if startDate}} AND mc.cost_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND mc.cost_date <= '{{endDate}}' {{/if}}
      GROUP BY mc.product_code, p.product_name
      ORDER BY total_material DESC
    `,
    parameters: [
      { name: 'productCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'product_name', displayName: '제품명', type: 'string' },
        { dbColumn: 'direct_material', displayName: '직접재료비', type: 'currency' },
        { dbColumn: 'indirect_material', displayName: '간접재료비', type: 'currency' },
        { dbColumn: 'total_material', displayName: '총재료비', type: 'currency' },
        { dbColumn: 'unit_material_cost', displayName: '단위재료비', type: 'currency' },
        { dbColumn: 'material_ratio', displayName: '재료비비율(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: 'cost-labor-analysis',
    name: '노무비 분석',
    description: '부서/제품별 노무비 현황 분석',
    sql: `
      SELECT
        mc.dept_code,
        d.dept_name,
        mc.product_code,
        p.product_name,
        SUM(mc.direct_labor) AS direct_labor,
        SUM(mc.indirect_labor) AS indirect_labor,
        SUM(mc.direct_labor + mc.indirect_labor) AS total_labor,
        ROUND(SUM(mc.direct_labor + mc.indirect_labor) / NULLIF(SUM(mc.work_hours), 0), 2) AS labor_per_hour,
        SUM(mc.work_hours) AS total_hours,
        ROUND(SUM(mc.direct_labor + mc.indirect_labor) * 100.0 / SUM(mc.total_cost), 2) AS labor_ratio
      FROM AC_MANUFACTURING_COST mc
      LEFT JOIN HR_DEPARTMENT d ON mc.dept_code = d.dept_code
      LEFT JOIN MM_PRODUCT p ON mc.product_code = p.product_code
      WHERE 1=1
        {{#if deptCode}} AND mc.dept_code = '{{deptCode}}' {{/if}}
        {{#if startDate}} AND mc.cost_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND mc.cost_date <= '{{endDate}}' {{/if}}
      GROUP BY mc.dept_code, d.dept_name, mc.product_code, p.product_name
      ORDER BY total_labor DESC
    `,
    parameters: [
      { name: 'deptCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'dept_name', displayName: '부서', type: 'string' },
        { dbColumn: 'product_name', displayName: '제품', type: 'string' },
        { dbColumn: 'direct_labor', displayName: '직접노무비', type: 'currency' },
        { dbColumn: 'indirect_labor', displayName: '간접노무비', type: 'currency' },
        { dbColumn: 'total_labor', displayName: '총노무비', type: 'currency' },
        { dbColumn: 'labor_per_hour', displayName: '시간당노무비', type: 'currency' },
        { dbColumn: 'labor_ratio', displayName: '노무비비율(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: 'cost-overhead-analysis',
    name: '경비 분석',
    description: '제조경비 항목별 분석',
    sql: `
      SELECT
        oh.expense_type,
        oh.expense_category,
        SUM(oh.fixed_cost) AS fixed_cost,
        SUM(oh.variable_cost) AS variable_cost,
        SUM(oh.fixed_cost + oh.variable_cost) AS total_overhead,
        ROUND(SUM(oh.fixed_cost + oh.variable_cost) * 100.0 / (
          SELECT SUM(fixed_cost + variable_cost) FROM AC_OVERHEAD WHERE cost_month BETWEEN '{{startDate}}' AND '{{endDate}}'
        ), 2) AS overhead_ratio,
        ROUND(AVG(oh.fixed_cost + oh.variable_cost), 0) AS avg_monthly
      FROM AC_OVERHEAD oh
      WHERE 1=1
        {{#if expenseType}} AND oh.expense_type = '{{expenseType}}' {{/if}}
        {{#if startDate}} AND oh.cost_month >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND oh.cost_month <= '{{endDate}}' {{/if}}
      GROUP BY oh.expense_type, oh.expense_category
      ORDER BY total_overhead DESC
    `,
    parameters: [
      { name: 'expenseType', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'expense_type', displayName: '경비유형', type: 'string' },
        { dbColumn: 'expense_category', displayName: '분류', type: 'string' },
        { dbColumn: 'fixed_cost', displayName: '고정비', type: 'currency' },
        { dbColumn: 'variable_cost', displayName: '변동비', type: 'currency' },
        { dbColumn: 'total_overhead', displayName: '총경비', type: 'currency' },
        { dbColumn: 'overhead_ratio', displayName: '비율(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: 'cost-manufacturing-total',
    name: '제조원가 종합',
    description: '제품별 총제조원가 분석',
    sql: `
      SELECT
        mc.product_code,
        p.product_name,
        p.product_type,
        SUM(mc.direct_material + mc.indirect_material) AS material_cost,
        SUM(mc.direct_labor + mc.indirect_labor) AS labor_cost,
        SUM(mc.overhead) AS overhead_cost,
        SUM(mc.total_cost) AS total_cost,
        SUM(mc.prod_qty) AS total_qty,
        ROUND(SUM(mc.total_cost) / NULLIF(SUM(mc.prod_qty), 0), 2) AS unit_cost,
        ROUND(SUM(mc.direct_material + mc.indirect_material) * 100.0 / SUM(mc.total_cost), 2) AS material_pct,
        ROUND(SUM(mc.direct_labor + mc.indirect_labor) * 100.0 / SUM(mc.total_cost), 2) AS labor_pct,
        ROUND(SUM(mc.overhead) * 100.0 / SUM(mc.total_cost), 2) AS overhead_pct
      FROM AC_MANUFACTURING_COST mc
      LEFT JOIN MM_PRODUCT p ON mc.product_code = p.product_code
      WHERE 1=1
        {{#if productType}} AND p.product_type = '{{productType}}' {{/if}}
        {{#if startDate}} AND mc.cost_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND mc.cost_date <= '{{endDate}}' {{/if}}
      GROUP BY mc.product_code, p.product_name, p.product_type
      ORDER BY total_cost DESC
    `,
    parameters: [
      { name: 'productType', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'product_name', displayName: '제품명', type: 'string' },
        { dbColumn: 'material_cost', displayName: '재료비', type: 'currency' },
        { dbColumn: 'labor_cost', displayName: '노무비', type: 'currency' },
        { dbColumn: 'overhead_cost', displayName: '경비', type: 'currency' },
        { dbColumn: 'total_cost', displayName: '총원가', type: 'currency' },
        { dbColumn: 'unit_cost', displayName: '단위원가', type: 'currency' },
        { dbColumn: 'material_pct', displayName: '재료비율(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: 'cost-variance-analysis',
    name: '원가차이 분석',
    description: '예산 대비 실적 차이 분석',
    sql: `
      SELECT
        cv.product_code,
        p.product_name,
        cv.cost_type,
        cv.budget_amount,
        cv.actual_amount,
        cv.actual_amount - cv.budget_amount AS variance,
        ROUND((cv.actual_amount - cv.budget_amount) * 100.0 / NULLIF(cv.budget_amount, 0), 2) AS variance_pct,
        CASE
          WHEN cv.actual_amount > cv.budget_amount * 1.1 THEN '초과'
          WHEN cv.actual_amount < cv.budget_amount * 0.9 THEN '절감'
          ELSE '정상'
        END AS status
      FROM AC_COST_VARIANCE cv
      LEFT JOIN MM_PRODUCT p ON cv.product_code = p.product_code
      WHERE 1=1
        {{#if productCode}} AND cv.product_code = '{{productCode}}' {{/if}}
        {{#if costType}} AND cv.cost_type = '{{costType}}' {{/if}}
        {{#if period}} AND cv.period = '{{period}}' {{/if}}
      ORDER BY ABS(variance) DESC
    `,
    parameters: [
      { name: 'productCode', type: 'string', required: false },
      { name: 'costType', type: 'string', required: false },
      { name: 'period', type: 'string', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'product_name', displayName: '제품명', type: 'string' },
        { dbColumn: 'cost_type', displayName: '원가유형', type: 'string' },
        { dbColumn: 'budget_amount', displayName: '예산', type: 'currency' },
        { dbColumn: 'actual_amount', displayName: '실적', type: 'currency' },
        { dbColumn: 'variance', displayName: '차이', type: 'currency' },
        { dbColumn: 'variance_pct', displayName: '차이율(%)', type: 'percentage' },
        { dbColumn: 'status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'cost-trend-prediction',
    name: '원가 추이 및 예측',
    description: '월별 원가 추이 및 예측',
    sql: `
      SELECT
        DATE_FORMAT(mc.cost_date, '%Y-%m') AS month,
        SUM(mc.direct_material + mc.indirect_material) AS material_cost,
        SUM(mc.direct_labor + mc.indirect_labor) AS labor_cost,
        SUM(mc.overhead) AS overhead_cost,
        SUM(mc.total_cost) AS total_cost,
        SUM(mc.prod_qty) AS total_qty,
        ROUND(SUM(mc.total_cost) / NULLIF(SUM(mc.prod_qty), 0), 2) AS unit_cost,
        ROUND(AVG(SUM(mc.total_cost)) OVER (ORDER BY DATE_FORMAT(mc.cost_date, '%Y-%m') ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 0) AS ma3_cost
      FROM AC_MANUFACTURING_COST mc
      WHERE 1=1
        {{#if startDate}} AND mc.cost_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND mc.cost_date <= '{{endDate}}' {{/if}}
      GROUP BY DATE_FORMAT(mc.cost_date, '%Y-%m')
      ORDER BY month
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'month', displayName: '월', type: 'string' },
        { dbColumn: 'material_cost', displayName: '재료비', type: 'currency' },
        { dbColumn: 'labor_cost', displayName: '노무비', type: 'currency' },
        { dbColumn: 'overhead_cost', displayName: '경비', type: 'currency' },
        { dbColumn: 'total_cost', displayName: '총원가', type: 'currency' },
        { dbColumn: 'unit_cost', displayName: '단위원가', type: 'currency' },
        { dbColumn: 'ma3_cost', displayName: '3개월이동평균', type: 'currency' }
      ]
    }
  }
];

// 원가 원인 분석
export const COST_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'cost-c1',
      category: 'material',
      description: '재료비 상승',
      probability: 35,
      evidence: ['원자재 가격 상승', '환율 변동', '공급업체 가격 인상']
    },
    {
      id: 'cost-c2',
      category: 'man',
      description: '노무비 증가',
      probability: 25,
      evidence: ['임금 인상', '초과근무 증가', '생산성 저하']
    },
    {
      id: 'cost-c3',
      category: 'machine',
      description: '설비 관련 비용 증가',
      probability: 20,
      evidence: ['유지보수비 증가', '에너지비용 상승', '설비 노후화']
    },
    {
      id: 'cost-c4',
      category: 'method',
      description: '공정 비효율',
      probability: 15,
      evidence: ['불량률 증가', '재작업', '로스 증가']
    },
    {
      id: 'cost-c5',
      category: 'measurement',
      description: '원가 산정 오류',
      probability: 5,
      evidence: ['배부 기준 오류', '원가 집계 누락']
    }
  ],
  secondaryCauses: [
    { id: 'cost-c1-1', category: 'material', description: '공급망 불안정', probability: 40 },
    { id: 'cost-c2-1', category: 'man', description: '인력 운영 비효율', probability: 30 }
  ],
  rootCauses: [
    { id: 'cost-root-1', category: 'method', description: '원가 관리 체계 미흡', probability: 60 }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 원가가 예산을 초과하는가?',
      answer: '재료비와 노무비가 예상보다 높다',
      nextNodes: [{
        level: 2,
        question: '왜 재료비가 높은가?',
        answer: '원자재 가격 상승과 불량 손실',
        nextNodes: [{
          level: 3,
          question: '왜 대응하지 못했는가?',
          answer: '가격 변동 예측과 대응 체계 부재',
          nextNodes: [{
            level: 4,
            question: '왜 예측 체계가 없는가?',
            answer: '원가 관리 시스템이 체계적이지 않음'
          }]
        }]
      }]
    }
  ]
};

// 원가 대책
export const COST_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'cost-cm1',
    category: 'material',
    type: 'immediate',
    title: '긴급 원자재 가격 협상',
    description: '주요 원자재 공급업체와 긴급 가격 협상 및 대체 업체 탐색',
    priority: 'critical',
    estimatedEffect: '재료비 5% 절감',
    responsible: '구매팀',
    kpi: [{ name: '재료비절감률', target: 5, unit: '%' }]
  },
  {
    id: 'cost-cm2',
    category: 'method',
    type: 'shortTerm',
    title: '불량/로스 감소 활동',
    description: '불량률 감소 및 공정 로스 최소화 활동 전개',
    priority: 'high',
    estimatedEffect: '재료비 3% 절감',
    responsible: '품질팀',
    deadline: '1개월',
    kpi: [{ name: '불량률', target: 1, unit: '%' }]
  },
  {
    id: 'cost-cm3',
    category: 'man',
    type: 'shortTerm',
    title: '생산성 향상 활동',
    description: '작업 효율화 및 생산성 향상 활동',
    priority: 'high',
    estimatedEffect: '노무비 5% 절감',
    responsible: '생산팀',
    deadline: '2개월',
    kpi: [{ name: '인당생산성', target: 10, unit: '%향상' }]
  },
  {
    id: 'cost-cm4',
    category: 'machine',
    type: 'longTerm',
    title: '에너지 절감 투자',
    description: '에너지 효율 향상을 위한 설비 투자',
    priority: 'medium',
    estimatedEffect: '에너지비 15% 절감',
    responsible: '시설팀',
    deadline: '6개월',
    kpi: [{ name: '에너지절감률', target: 15, unit: '%' }]
  },
  {
    id: 'cost-cm5',
    category: 'method',
    type: 'longTerm',
    title: '원가 관리 시스템 구축',
    description: '실시간 원가 모니터링 및 예측 시스템 구축',
    priority: 'high',
    estimatedEffect: '원가 가시성 확보',
    responsible: '경영지원팀',
    deadline: '1년',
    kpi: [{ name: '원가정확도', target: 95, unit: '%' }]
  },
  {
    id: 'cost-cm6',
    category: 'method',
    type: 'preventive',
    title: 'VE/VA 활동',
    description: '가치공학/가치분석을 통한 원가 혁신',
    priority: 'medium',
    estimatedEffect: '설계원가 10% 절감',
    responsible: '개발팀',
    kpi: [{ name: 'VE절감액', target: 1000000000, unit: '원' }]
  }
];

// 원가 시나리오 정의
export const COST_SCENARIOS: Scenario[] = [
  {
    id: 'cost-scenario-1',
    category: 'material',
    title: '재료비 분석',
    description: '제품/기간별 재료비 현황 분석',
    keywords: ['재료비', '원재료', '자재비', '직접재료', '재료원가'],
    sqlTemplates: [COST_SQL_TEMPLATES[0]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm1', 'cost-cm2'].includes(c.id)),
    relatedScenarios: ['cost-scenario-4']
  },
  {
    id: 'cost-scenario-2',
    category: 'man',
    title: '노무비 분석',
    description: '부서/제품별 노무비 현황 분석',
    keywords: ['노무비', '인건비', '급여', '노동비', '임금'],
    sqlTemplates: [COST_SQL_TEMPLATES[1]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm3'].includes(c.id)),
    relatedScenarios: ['cost-scenario-4']
  },
  {
    id: 'cost-scenario-3',
    category: 'machine',
    title: '경비 분석',
    description: '제조경비 항목별 분석',
    keywords: ['경비', '간접비', '제조경비', '고정비', '변동비'],
    sqlTemplates: [COST_SQL_TEMPLATES[2]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm4'].includes(c.id)),
    relatedScenarios: ['cost-scenario-4']
  },
  {
    id: 'cost-scenario-4',
    category: 'method',
    title: '제조원가 종합분석',
    description: '제품별 총제조원가 분석',
    keywords: ['제조원가', '총원가', '제품원가', '단위원가', '원가구조'],
    sqlTemplates: [COST_SQL_TEMPLATES[3]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm5', 'cost-cm6'].includes(c.id)),
    relatedScenarios: ['cost-scenario-1', 'cost-scenario-2', 'cost-scenario-3']
  },
  {
    id: 'cost-scenario-5',
    category: 'measurement',
    title: '원가차이 분석',
    description: '예산 대비 실적 차이 분석',
    keywords: ['원가차이', '예산차이', '실적차이', '차이분석', '예실분석'],
    sqlTemplates: [COST_SQL_TEMPLATES[4]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm1', 'cost-cm2', 'cost-cm3'].includes(c.id)),
    relatedScenarios: ['cost-scenario-6']
  },
  {
    id: 'cost-scenario-6',
    category: 'method',
    title: '원가 추이 및 예측',
    description: '월별 원가 추이 및 예측 분석',
    keywords: ['원가예측', '원가추이', '원가전망', '원가추정', '원가시뮬레이션'],
    sqlTemplates: [COST_SQL_TEMPLATES[5]],
    causeAnalysis: COST_CAUSE_ANALYSIS,
    countermeasures: COST_COUNTERMEASURES.filter(c => ['cost-cm5'].includes(c.id)),
    relatedScenarios: ['cost-scenario-4', 'cost-scenario-5']
  }
];

// 원가 시나리오 매칭
export function matchCostScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of COST_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// 원가 파라미터 추출
export function extractCostParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  const productMatch = query.match(/P[-\w]+/i);
  if (productMatch) {
    params.productCode = productMatch[0];
  }

  const costTypeMatch = query.match(/(재료비|노무비|경비|총원가)/);
  if (costTypeMatch) {
    params.costType = costTypeMatch[1];
  }

  return params;
}
