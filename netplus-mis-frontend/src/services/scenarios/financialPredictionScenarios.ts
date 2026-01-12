/**
 * 재무예측 시나리오 모듈
 * Financial Prediction Scenarios - 매출, 수익, 현금흐름, 재무비율 분석
 */

// 재무예측용 SQL 템플릿 인터페이스
export interface FinancialSQLTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  requiredParams: string[];
  optionalParams: string[];
}

// 재무예측용 대책 인터페이스
export interface FinancialCountermeasure {
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

// 재무예측용 원인 분석 인터페이스
export interface FinancialCause {
  category: string;
  description: string;
  probability: number;
  evidence: string[];
}

export interface FinancialCauseAnalysis {
  rootCause: string;
  primaryCauses: FinancialCause[];
  fiveWhyChain: { level: number; question: string; answer: string }[];
  contributingFactors: string[];
}

// 재무 카테고리 타입
export type FinancialCategory = 'revenue' | 'profit' | 'cashFlow' | 'ratio' | 'investment' | 'risk';

// 재무 카테고리 메타데이터
export const FINANCIAL_METADATA: Record<FinancialCategory, {
  name: string;
  nameKo: string;
  description: string;
  color: string;
  keywords: string[];
}> = {
  revenue: {
    name: 'Revenue',
    nameKo: '매출',
    description: '매출액 분석 및 예측, 매출 성장률, 매출 구성 분석',
    color: '#2196F3',
    keywords: ['매출', '매출액', '수주', '판매', '수익', '영업수익', '매출성장']
  },
  profit: {
    name: 'Profit',
    nameKo: '수익성',
    description: '영업이익, 순이익, 마진율 분석 및 예측',
    color: '#4CAF50',
    keywords: ['이익', '수익', '순이익', '영업이익', '마진', '이익률', '수익성']
  },
  cashFlow: {
    name: 'Cash Flow',
    nameKo: '현금흐름',
    description: '현금흐름 분석, 운전자본 관리, 자금 예측',
    color: '#9C27B0',
    keywords: ['현금', '현금흐름', 'CF', '자금', '운전자본', '유동성', '캐시플로우']
  },
  ratio: {
    name: 'Financial Ratio',
    nameKo: '재무비율',
    description: '재무건전성 지표, 수익성/안정성/활동성/성장성 비율 분석',
    color: '#FF9800',
    keywords: ['비율', '재무비율', '지표', 'ROE', 'ROA', '부채비율', '유동비율']
  },
  investment: {
    name: 'Investment',
    nameKo: '투자',
    description: '투자 수익률, CAPEX/OPEX 분석, 투자 효율성',
    color: '#00BCD4',
    keywords: ['투자', '투자수익', 'ROI', 'CAPEX', 'OPEX', '설비투자', '투자효율']
  },
  risk: {
    name: 'Financial Risk',
    nameKo: '재무리스크',
    description: '재무 리스크 분석, 신용 리스크, 유동성 리스크',
    color: '#F44336',
    keywords: ['리스크', '위험', '신용', '부도', '연체', '재무위험', '리스크관리']
  }
};

// 재무예측 SQL 템플릿
export const FINANCIAL_SQL_TEMPLATES: FinancialSQLTemplate[] = [
  {
    id: 'fin-revenue-analysis',
    name: '매출 분석',
    description: '기간별/제품별/거래처별 매출 분석',
    sql: `
      SELECT
        DATE_FORMAT(ord.order_date, '%Y-%m') as period,
        p.product_name,
        c.customer_name,
        SUM(od.quantity * od.unit_price) as revenue,
        SUM(od.quantity) as quantity,
        COUNT(DISTINCT ord.order_id) as order_count,
        AVG(od.unit_price) as avg_unit_price,
        LAG(SUM(od.quantity * od.unit_price)) OVER (ORDER BY DATE_FORMAT(ord.order_date, '%Y-%m')) as prev_revenue,
        (SUM(od.quantity * od.unit_price) - LAG(SUM(od.quantity * od.unit_price)) OVER (ORDER BY DATE_FORMAT(ord.order_date, '%Y-%m'))) /
          NULLIF(LAG(SUM(od.quantity * od.unit_price)) OVER (ORDER BY DATE_FORMAT(ord.order_date, '%Y-%m')), 0) * 100 as growth_rate
      FROM orders ord
      JOIN order_details od ON ord.order_id = od.order_id
      JOIN products p ON od.product_id = p.product_id
      JOIN customers c ON ord.customer_id = c.customer_id
      WHERE ord.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      {{#if productId}}AND p.product_id = '{{productId}}'{{/if}}
      {{#if customerId}}AND c.customer_id = '{{customerId}}'{{/if}}
      GROUP BY DATE_FORMAT(ord.order_date, '%Y-%m'), p.product_name, c.customer_name
      ORDER BY period DESC, revenue DESC
    `,
    requiredParams: [],
    optionalParams: ['productId', 'customerId', 'startDate', 'endDate']
  },
  {
    id: 'fin-profit-analysis',
    name: '수익성 분석',
    description: '영업이익, 순이익, 마진율 분석',
    sql: `
      SELECT
        DATE_FORMAT(fs.fiscal_date, '%Y-%m') as period,
        fs.revenue,
        fs.cost_of_goods_sold as cogs,
        fs.revenue - fs.cost_of_goods_sold as gross_profit,
        (fs.revenue - fs.cost_of_goods_sold) / NULLIF(fs.revenue, 0) * 100 as gross_margin,
        fs.operating_expenses,
        fs.revenue - fs.cost_of_goods_sold - fs.operating_expenses as operating_income,
        (fs.revenue - fs.cost_of_goods_sold - fs.operating_expenses) / NULLIF(fs.revenue, 0) * 100 as operating_margin,
        fs.net_income,
        fs.net_income / NULLIF(fs.revenue, 0) * 100 as net_margin,
        fs.ebitda,
        fs.ebitda / NULLIF(fs.revenue, 0) * 100 as ebitda_margin
      FROM financial_statements fs
      WHERE fs.fiscal_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['department', 'businessUnit']
  },
  {
    id: 'fin-cashflow-analysis',
    name: '현금흐름 분석',
    description: '영업/투자/재무활동 현금흐름 분석',
    sql: `
      SELECT
        DATE_FORMAT(cf.report_date, '%Y-%m') as period,
        cf.operating_cash_flow,
        cf.investing_cash_flow,
        cf.financing_cash_flow,
        cf.operating_cash_flow + cf.investing_cash_flow + cf.financing_cash_flow as net_cash_flow,
        cf.beginning_cash,
        cf.ending_cash,
        cf.free_cash_flow,
        cf.working_capital_change,
        cf.accounts_receivable_change,
        cf.accounts_payable_change,
        cf.inventory_change
      FROM cash_flow_statements cf
      WHERE cf.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: []
  },
  {
    id: 'fin-ratio-analysis',
    name: '재무비율 분석',
    description: '수익성/안정성/활동성/성장성 비율 분석',
    sql: `
      SELECT
        DATE_FORMAT(fr.report_date, '%Y-%m') as period,
        -- 수익성 비율
        fr.roe as return_on_equity,
        fr.roa as return_on_assets,
        fr.ros as return_on_sales,
        fr.gross_margin,
        fr.operating_margin,
        fr.net_margin,
        -- 안정성 비율
        fr.current_ratio,
        fr.quick_ratio,
        fr.debt_ratio,
        fr.debt_to_equity,
        fr.interest_coverage,
        -- 활동성 비율
        fr.inventory_turnover,
        fr.receivables_turnover,
        fr.payables_turnover,
        fr.asset_turnover,
        -- 성장성 비율
        fr.revenue_growth,
        fr.profit_growth,
        fr.asset_growth
      FROM financial_ratios fr
      WHERE fr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['ratioType']
  },
  {
    id: 'fin-investment-analysis',
    name: '투자 분석',
    description: 'CAPEX/OPEX 및 투자 수익률 분석',
    sql: `
      SELECT
        DATE_FORMAT(inv.invest_date, '%Y-%m') as period,
        inv.investment_type,
        inv.investment_category,
        SUM(inv.investment_amount) as total_investment,
        SUM(inv.expected_return) as expected_return,
        SUM(inv.actual_return) as actual_return,
        AVG(inv.roi_percent) as avg_roi,
        AVG(inv.payback_period_months) as avg_payback_period,
        SUM(CASE WHEN inv.investment_type = 'CAPEX' THEN inv.investment_amount ELSE 0 END) as capex,
        SUM(CASE WHEN inv.investment_type = 'OPEX' THEN inv.investment_amount ELSE 0 END) as opex
      FROM investments inv
      WHERE inv.invest_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{periodMonths}} MONTH)
      {{#if investmentType}}AND inv.investment_type = '{{investmentType}}'{{/if}}
      {{#if category}}AND inv.investment_category = '{{category}}'{{/if}}
      GROUP BY DATE_FORMAT(inv.invest_date, '%Y-%m'), inv.investment_type, inv.investment_category
      ORDER BY period DESC
    `,
    requiredParams: ['periodMonths'],
    optionalParams: ['investmentType', 'category']
  },
  {
    id: 'fin-forecast',
    name: '재무 예측',
    description: '매출/이익 예측 및 시나리오 분석',
    sql: `
      SELECT
        ff.forecast_period,
        ff.scenario_type,
        ff.revenue_forecast,
        ff.revenue_growth_rate,
        ff.gross_profit_forecast,
        ff.operating_income_forecast,
        ff.net_income_forecast,
        ff.cash_flow_forecast,
        ff.confidence_level,
        ff.assumptions,
        ff.risk_factors,
        ff.created_at
      FROM financial_forecasts ff
      WHERE ff.forecast_period >= DATE_FORMAT(CURRENT_DATE, '%Y-%m')
      {{#if scenarioType}}AND ff.scenario_type = '{{scenarioType}}'{{/if}}
      ORDER BY ff.forecast_period ASC, ff.scenario_type
    `,
    requiredParams: [],
    optionalParams: ['scenarioType', 'forecastHorizon']
  }
];

// 재무 원인 분석
export const FINANCIAL_CAUSE_ANALYSIS: FinancialCauseAnalysis = {
  rootCause: '재무 성과 저하',
  primaryCauses: [
    {
      category: 'revenue',
      description: '매출 성장 둔화 또는 감소',
      probability: 35,
      evidence: ['매출 성장률 하락', '주요 거래처 이탈', '시장 점유율 감소']
    },
    {
      category: 'profit',
      description: '수익성 악화',
      probability: 25,
      evidence: ['원가율 상승', '판관비 증가', '마진 압박']
    },
    {
      category: 'cashFlow',
      description: '현금흐름 악화',
      probability: 20,
      evidence: ['운전자본 증가', '매출채권 회수 지연', '재고자산 증가']
    },
    {
      category: 'risk',
      description: '재무 리스크 증가',
      probability: 20,
      evidence: ['부채비율 상승', '유동성 악화', '신용등급 하락']
    }
  ],
  fiveWhyChain: [
    { level: 1, question: '왜 재무 성과가 저하되었는가?', answer: '매출 감소와 비용 증가가 동시 발생' },
    { level: 2, question: '왜 매출이 감소했는가?', answer: '주요 시장 경쟁 심화 및 고객 이탈' },
    { level: 3, question: '왜 경쟁이 심화되었는가?', answer: '신규 경쟁자 진입 및 가격 경쟁' },
    { level: 4, question: '왜 가격 경쟁에 취약한가?', answer: '원가 구조의 비효율성' },
    { level: 5, question: '왜 원가 구조가 비효율적인가?', answer: '생산성 향상 및 원가 절감 투자 미흡' }
  ],
  contributingFactors: [
    '시장 환경 변화',
    '원자재 가격 변동',
    '환율 변동',
    '인건비 상승',
    '경쟁 심화',
    '고객 니즈 변화'
  ]
};

// 재무 개선 대책
export const FINANCIAL_COUNTERMEASURES: FinancialCountermeasure[] = [
  {
    id: 'fin-cm-001',
    title: '매출 다각화',
    description: '신규 시장 개척 및 제품 포트폴리오 다각화',
    type: 'shortTerm',
    priority: 'high',
    estimatedCost: '투자 규모에 따라 상이',
    expectedBenefit: '매출 성장률 개선 및 리스크 분산',
    responsibleRole: '영업/마케팅팀',
    targetMetric: 'revenue_growth',
    targetValue: 10
  },
  {
    id: 'fin-cm-002',
    title: '원가 구조 개선',
    description: '원가 절감 활동 및 생산성 향상 프로그램 시행',
    type: 'shortTerm',
    priority: 'high',
    estimatedCost: '개선 활동 비용',
    expectedBenefit: '영업이익률 개선',
    responsibleRole: '생산/구매팀',
    targetMetric: 'operating_margin',
    targetValue: 15
  },
  {
    id: 'fin-cm-003',
    title: '운전자본 효율화',
    description: '재고 최적화, 매출채권 회수 강화, 매입채무 관리',
    type: 'immediate',
    priority: 'critical',
    estimatedCost: '관리 시스템 비용',
    expectedBenefit: '현금 전환 주기 단축',
    responsibleRole: '재무/물류팀',
    targetMetric: 'cash_conversion_cycle',
    targetValue: -10
  },
  {
    id: 'fin-cm-004',
    title: '투자 효율성 제고',
    description: 'ROI 기반 투자 의사결정 체계 강화',
    type: 'longTerm',
    priority: 'medium',
    estimatedCost: '분석 시스템 구축 비용',
    expectedBenefit: '투자 수익률 개선',
    responsibleRole: '전략기획팀',
    targetMetric: 'roi',
    targetValue: 15
  },
  {
    id: 'fin-cm-005',
    title: '재무 구조 안정화',
    description: '부채비율 관리 및 유동성 확보',
    type: 'shortTerm',
    priority: 'high',
    estimatedCost: '금융 비용',
    expectedBenefit: '재무 안정성 강화',
    responsibleRole: '재무팀',
    targetMetric: 'debt_to_equity',
    targetValue: 100
  },
  {
    id: 'fin-cm-006',
    title: '예산 관리 강화',
    description: '예산 편성/집행/모니터링 체계 고도화',
    type: 'preventive',
    priority: 'medium',
    estimatedCost: '시스템 구축 비용',
    expectedBenefit: '비용 통제력 강화',
    responsibleRole: '경영지원팀',
    targetMetric: 'budget_variance',
    targetValue: 5
  }
];

// 재무예측 시나리오 인터페이스
export interface FinancialScenario {
  id: string;
  title: string;
  description: string;
  category: FinancialCategory;
  keywords: string[];
  sqlTemplates: FinancialSQLTemplate[];
  causeAnalysis: FinancialCauseAnalysis;
  countermeasures: FinancialCountermeasure[];
  priority: number;
}

// 재무예측 시나리오 목록
export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: 'financial-revenue-analysis',
    title: '매출 분석 및 예측',
    description: '매출 추세 분석, 성장률 예측, 매출 구성 분석',
    category: 'revenue',
    keywords: ['매출', '매출액', '매출분석', '매출예측', '매출성장', '수주', '판매현황'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[0], FINANCIAL_SQL_TEMPLATES[5]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-001'].includes(c.id)
    ),
    priority: 1
  },
  {
    id: 'financial-profit-analysis',
    title: '수익성 분석',
    description: '영업이익, 순이익, 마진율 분석 및 개선 방안',
    category: 'profit',
    keywords: ['이익', '수익', '마진', '영업이익', '순이익', '수익성', '이익률'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[1]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-002', 'fin-cm-006'].includes(c.id)
    ),
    priority: 2
  },
  {
    id: 'financial-cashflow-analysis',
    title: '현금흐름 분석',
    description: '현금흐름 분석, 운전자본 관리, 자금 예측',
    category: 'cashFlow',
    keywords: ['현금', '현금흐름', '자금', '운전자본', '유동성', 'CF', '캐시플로우'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[2]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-003'].includes(c.id)
    ),
    priority: 3
  },
  {
    id: 'financial-ratio-analysis',
    title: '재무비율 분석',
    description: '수익성/안정성/활동성/성장성 비율 종합 분석',
    category: 'ratio',
    keywords: ['재무비율', '비율분석', 'ROE', 'ROA', '부채비율', '유동비율', '회전율'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[3]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-005'].includes(c.id)
    ),
    priority: 4
  },
  {
    id: 'financial-investment-analysis',
    title: '투자 수익률 분석',
    description: 'CAPEX/OPEX 분석, 투자 효율성 평가',
    category: 'investment',
    keywords: ['투자', 'ROI', '투자수익', 'CAPEX', 'OPEX', '설비투자', '투자효율'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[4]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-004'].includes(c.id)
    ),
    priority: 5
  },
  {
    id: 'financial-risk-analysis',
    title: '재무 리스크 분석',
    description: '재무 리스크 요인 분석 및 대응 방안',
    category: 'risk',
    keywords: ['리스크', '위험', '재무위험', '신용리스크', '유동성리스크', '재무건전성'],
    sqlTemplates: [FINANCIAL_SQL_TEMPLATES[3], FINANCIAL_SQL_TEMPLATES[2]],
    causeAnalysis: FINANCIAL_CAUSE_ANALYSIS,
    countermeasures: FINANCIAL_COUNTERMEASURES.filter(c =>
      ['fin-cm-003', 'fin-cm-005'].includes(c.id)
    ),
    priority: 6
  }
];

// 재무 시나리오 매칭 함수
export function matchFinancialScenario(query: string): FinancialScenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of FINANCIAL_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// 재무 파라미터 추출 함수
export function extractFinancialParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // 기간 추출 (개월)
  const monthMatch = query.match(/(\d+)\s*(개월|달|월)/);
  if (monthMatch) {
    params.periodMonths = parseInt(monthMatch[1]);
  } else {
    params.periodMonths = 12; // 기본 12개월
  }

  // 시나리오 타입 추출
  if (query.includes('낙관') || query.includes('optimistic')) {
    params.scenarioType = 'optimistic';
  } else if (query.includes('비관') || query.includes('pessimistic')) {
    params.scenarioType = 'pessimistic';
  } else if (query.includes('기본') || query.includes('base')) {
    params.scenarioType = 'base';
  }

  // 투자 타입 추출
  if (query.includes('CAPEX') || query.includes('설비투자')) {
    params.investmentType = 'CAPEX';
  } else if (query.includes('OPEX') || query.includes('운영비')) {
    params.investmentType = 'OPEX';
  }

  // 비율 타입 추출
  if (query.includes('수익성')) {
    params.ratioType = 'profitability';
  } else if (query.includes('안정성')) {
    params.ratioType = 'stability';
  } else if (query.includes('활동성')) {
    params.ratioType = 'activity';
  } else if (query.includes('성장성')) {
    params.ratioType = 'growth';
  }

  return params;
}

// 카테고리별 시나리오 조회
export function getFinancialScenariosByCategory(category: FinancialCategory): FinancialScenario[] {
  return FINANCIAL_SCENARIOS.filter(s => s.category === category);
}

// ID로 시나리오 조회
export function getFinancialScenarioById(id: string): FinancialScenario | undefined {
  return FINANCIAL_SCENARIOS.find(s => s.id === id);
}
