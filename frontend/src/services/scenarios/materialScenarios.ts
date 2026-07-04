/**
 * Material(자재) 시나리오 모듈
 * 원자재, 부품, 공급업체, 입고, 재고 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Material 관련 SQL 템플릿
export const MATERIAL_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'material-defect-by-supplier',
    name: '공급업체별 불량 현황',
    description: '공급업체별 자재 불량 현황 분석',
    sql: `
      SELECT
        s.supplier_code,
        s.supplier_name,
        s.supplier_type,
        COUNT(DISTINCT m.lot_no) AS lot_count,
        SUM(m.receive_qty) AS total_qty,
        SUM(CASE WHEN iq.result = 'FAIL' THEN iq.defect_qty ELSE 0 END) AS defect_qty,
        ROUND(SUM(CASE WHEN iq.result = 'FAIL' THEN iq.defect_qty ELSE 0 END) * 100.0 /
              NULLIF(SUM(m.receive_qty), 0), 2) AS defect_rate
      FROM MM_SUPPLIER s
      JOIN MM_MATERIAL m ON s.supplier_code = m.supplier_code
      LEFT JOIN QM_INCOMING_INSP iq ON m.lot_no = iq.lot_no
      WHERE 1=1
        {{#if startDate}} AND m.receive_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND m.receive_date <= '{{endDate}}' {{/if}}
      GROUP BY s.supplier_code, s.supplier_name, s.supplier_type
      ORDER BY defect_rate DESC
      LIMIT 20
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'supplier_code', displayName: '업체코드', type: 'string' },
        { dbColumn: 'supplier_name', displayName: '업체명', type: 'string' },
        { dbColumn: 'supplier_type', displayName: '업체유형', type: 'string' },
        { dbColumn: 'lot_count', displayName: 'LOT수', type: 'number' },
        { dbColumn: 'total_qty', displayName: '입고수량', type: 'number' },
        { dbColumn: 'defect_qty', displayName: '불량수량', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' }
      ],
      aggregations: [
        { type: 'sum', column: 'defect_qty', displayName: '총 불량수량' },
        { type: 'avg', column: 'defect_rate', displayName: '평균 불량률' }
      ]
    }
  },
  {
    id: 'material-incoming-inspection',
    name: '수입검사 현황',
    description: '자재 수입검사 결과 현황 조회',
    sql: `
      SELECT
        iq.insp_id,
        m.mat_code,
        m.mat_name,
        m.lot_no,
        s.supplier_name,
        iq.insp_date,
        iq.insp_type,
        iq.result,
        iq.sample_qty,
        iq.defect_qty,
        iq.defect_type,
        iq.inspector,
        iq.remarks
      FROM QM_INCOMING_INSP iq
      JOIN MM_MATERIAL m ON iq.lot_no = m.lot_no
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      WHERE 1=1
        {{#if startDate}} AND iq.insp_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND iq.insp_date <= '{{endDate}}' {{/if}}
        {{#if result}} AND iq.result = '{{result}}' {{/if}}
      ORDER BY iq.insp_date DESC
      LIMIT 50
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false },
      { name: 'result', type: 'string', required: false, extractPattern: '(PASS|FAIL|합격|불합격)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'mat_name', displayName: '자재명', type: 'string' },
        { dbColumn: 'lot_no', displayName: 'LOT번호', type: 'string' },
        { dbColumn: 'supplier_name', displayName: '공급업체', type: 'string' },
        { dbColumn: 'insp_date', displayName: '검사일', type: 'date' },
        { dbColumn: 'result', displayName: '결과', type: 'string' },
        { dbColumn: 'defect_qty', displayName: '불량수', type: 'number' },
        { dbColumn: 'defect_type', displayName: '불량유형', type: 'string' }
      ]
    }
  },
  {
    id: 'material-lot-trace',
    name: '자재 LOT 추적',
    description: '제품 LOT에서 사용된 자재 LOT 추적',
    sql: `
      SELECT
        bom.prod_lot_no,
        bom.mat_lot_no,
        m.mat_code,
        m.mat_name,
        m.specification,
        s.supplier_name,
        m.receive_date,
        bom.used_qty,
        iq.result AS insp_result,
        iq.defect_type
      FROM MM_BOM_USAGE bom
      JOIN MM_MATERIAL m ON bom.mat_lot_no = m.lot_no
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      LEFT JOIN QM_INCOMING_INSP iq ON m.lot_no = iq.lot_no
      WHERE bom.prod_lot_no LIKE '%{{lotNo}}%'
      ORDER BY m.receive_date
    `,
    parameters: [
      { name: 'lotNo', type: 'string', required: true, extractPattern: '(LOT[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'prod_lot_no', displayName: '제품LOT', type: 'string' },
        { dbColumn: 'mat_lot_no', displayName: '자재LOT', type: 'string' },
        { dbColumn: 'mat_name', displayName: '자재명', type: 'string' },
        { dbColumn: 'supplier_name', displayName: '공급업체', type: 'string' },
        { dbColumn: 'receive_date', displayName: '입고일', type: 'date' },
        { dbColumn: 'used_qty', displayName: '사용량', type: 'number' },
        { dbColumn: 'insp_result', displayName: '검사결과', type: 'string' }
      ]
    }
  },
  {
    id: 'material-inventory-status',
    name: '재고 현황',
    description: '자재별 재고 현황 및 부족 예상 품목',
    sql: `
      SELECT
        m.mat_code,
        m.mat_name,
        m.specification,
        m.unit,
        inv.current_qty,
        inv.safety_stock,
        inv.reorder_point,
        CASE
          WHEN inv.current_qty <= inv.safety_stock THEN '부족'
          WHEN inv.current_qty <= inv.reorder_point THEN '발주필요'
          ELSE '정상'
        END AS stock_status,
        inv.last_in_date,
        inv.last_out_date
      FROM MM_INVENTORY inv
      JOIN MM_MATERIAL m ON inv.mat_code = m.mat_code
      WHERE 1=1
        {{#if status}} AND (
          CASE
            WHEN inv.current_qty <= inv.safety_stock THEN '부족'
            WHEN inv.current_qty <= inv.reorder_point THEN '발주필요'
            ELSE '정상'
          END
        ) = '{{status}}' {{/if}}
      ORDER BY inv.current_qty / NULLIF(inv.safety_stock, 0) ASC
    `,
    parameters: [
      { name: 'status', type: 'string', required: false, extractPattern: '(부족|발주필요|정상)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'mat_code', displayName: '자재코드', type: 'string' },
        { dbColumn: 'mat_name', displayName: '자재명', type: 'string' },
        { dbColumn: 'specification', displayName: '규격', type: 'string' },
        { dbColumn: 'current_qty', displayName: '현재재고', type: 'number' },
        { dbColumn: 'safety_stock', displayName: '안전재고', type: 'number' },
        { dbColumn: 'stock_status', displayName: '상태', type: 'string' },
        { dbColumn: 'last_in_date', displayName: '최근입고', type: 'date' }
      ]
    }
  },
  {
    id: 'material-defect-by-type',
    name: '자재 불량 유형별 분석',
    description: '자재별 불량 유형 및 원인 분석',
    sql: `
      SELECT
        m.mat_code,
        m.mat_name,
        iq.defect_type,
        COUNT(*) AS occurrence_count,
        SUM(iq.defect_qty) AS total_defect_qty,
        GROUP_CONCAT(DISTINCT s.supplier_name) AS suppliers
      FROM QM_INCOMING_INSP iq
      JOIN MM_MATERIAL m ON iq.lot_no = m.lot_no
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      WHERE iq.result = 'FAIL'
        {{#if startDate}} AND iq.insp_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND iq.insp_date <= '{{endDate}}' {{/if}}
        {{#if matCode}} AND m.mat_code = '{{matCode}}' {{/if}}
      GROUP BY m.mat_code, m.mat_name, iq.defect_type
      ORDER BY occurrence_count DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false },
      { name: 'matCode', type: 'string', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'mat_code', displayName: '자재코드', type: 'string' },
        { dbColumn: 'mat_name', displayName: '자재명', type: 'string' },
        { dbColumn: 'defect_type', displayName: '불량유형', type: 'string' },
        { dbColumn: 'occurrence_count', displayName: '발생건수', type: 'number' },
        { dbColumn: 'total_defect_qty', displayName: '불량수량', type: 'number' },
        { dbColumn: 'suppliers', displayName: '관련업체', type: 'string' }
      ]
    }
  },
  {
    id: 'material-supplier-performance',
    name: '공급업체 성과 평가',
    description: '공급업체 품질, 납기, 가격 종합 평가',
    sql: `
      SELECT
        s.supplier_code,
        s.supplier_name,
        s.supplier_grade,
        COUNT(DISTINCT po.po_no) AS order_count,
        SUM(po.order_qty) AS total_order_qty,
        ROUND(SUM(CASE WHEN po.delivery_date <= po.due_date THEN 1 ELSE 0 END) * 100.0 /
              NULLIF(COUNT(*), 0), 2) AS on_time_rate,
        ROUND(SUM(CASE WHEN iq.result = 'PASS' THEN 1 ELSE 0 END) * 100.0 /
              NULLIF(COUNT(iq.insp_id), 0), 2) AS quality_rate,
        s.last_eval_date,
        s.next_eval_date
      FROM MM_SUPPLIER s
      LEFT JOIN MM_PURCHASE_ORDER po ON s.supplier_code = po.supplier_code
      LEFT JOIN MM_MATERIAL m ON po.mat_code = m.mat_code AND s.supplier_code = m.supplier_code
      LEFT JOIN QM_INCOMING_INSP iq ON m.lot_no = iq.lot_no
      WHERE s.status = 'ACTIVE'
        {{#if startDate}} AND po.order_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND po.order_date <= '{{endDate}}' {{/if}}
      GROUP BY s.supplier_code, s.supplier_name, s.supplier_grade, s.last_eval_date, s.next_eval_date
      ORDER BY quality_rate DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'supplier_name', displayName: '업체명', type: 'string' },
        { dbColumn: 'supplier_grade', displayName: '등급', type: 'string' },
        { dbColumn: 'order_count', displayName: '발주건수', type: 'number' },
        { dbColumn: 'on_time_rate', displayName: '납기준수율(%)', type: 'percentage' },
        { dbColumn: 'quality_rate', displayName: '품질합격률(%)', type: 'percentage' },
        { dbColumn: 'next_eval_date', displayName: '차기평가일', type: 'date' }
      ]
    }
  }
];

// Material 관련 원인 분석 템플릿
export const MATERIAL_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'material-c1',
      category: 'material',
      description: '원자재 품질 불량',
      probability: 35,
      evidence: ['수입검사 불합격', '이물질 혼입', '규격 미달'],
      sqlQuery: `SELECT * FROM QM_INCOMING_INSP WHERE result = 'FAIL'`
    },
    {
      id: 'material-c2',
      category: 'material',
      description: '자재 보관 조건 부적합',
      probability: 20,
      evidence: ['온습도 관리 미흡', '유효기간 초과', '오염'],
      sqlQuery: `SELECT * FROM MM_MATERIAL WHERE expiry_date < CURDATE()`
    },
    {
      id: 'material-c3',
      category: 'material',
      description: '공급업체 품질 관리 미흡',
      probability: 25,
      evidence: ['반복 불량', '품질 인증 미비', '공정 능력 부족'],
      sqlQuery: `SELECT supplier_code, COUNT(*) FROM QM_INCOMING_INSP WHERE result = 'FAIL' GROUP BY supplier_code`
    },
    {
      id: 'material-c4',
      category: 'material',
      description: '자재 혼입/오사용',
      probability: 15,
      evidence: ['유사 자재 혼동', '라벨 오류', '식별 미흡'],
      sqlQuery: `SELECT * FROM QM_DEFECT WHERE cause LIKE '%혼입%' OR cause LIKE '%오사용%'`
    },
    {
      id: 'material-c5',
      category: 'material',
      description: 'LOT 추적성 부재',
      probability: 5,
      evidence: ['LOT 미표기', '이력 관리 부재'],
      sqlQuery: `SELECT * FROM MM_MATERIAL WHERE lot_no IS NULL OR lot_no = ''`
    }
  ],
  secondaryCauses: [
    {
      id: 'material-c1-1',
      category: 'material',
      description: '수입검사 미흡',
      probability: 40
    },
    {
      id: 'material-c2-1',
      category: 'motherNature',
      description: '창고 환경 미비',
      probability: 30
    },
    {
      id: 'material-c3-1',
      category: 'material',
      description: '공급업체 선정 기준 미흡',
      probability: 30
    }
  ],
  rootCauses: [
    {
      id: 'material-root-1',
      category: 'material',
      description: '공급망 품질 관리 체계 미비',
      probability: 60
    },
    {
      id: 'material-root-2',
      category: 'material',
      description: '자재 관리 시스템 부재',
      probability: 40
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 자재로 인한 불량이 발생했는가?',
      answer: '불량 자재가 투입되었다',
      nextNodes: [
        {
          level: 2,
          question: '왜 불량 자재가 투입되었는가?',
          answer: '수입검사에서 불량을 검출하지 못했다',
          nextNodes: [
            {
              level: 3,
              question: '왜 불량을 검출하지 못했는가?',
              answer: '검사 항목이 충분하지 않거나 샘플링이 부족했다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 검사가 충분하지 않았는가?',
                  answer: '검사 기준이 공급업체 공정 능력을 반영하지 않았다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 공정 능력을 반영하지 않았는가?',
                      answer: '공급업체 품질 평가 및 관리 체계가 없다'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Material 관련 대책
export const MATERIAL_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'material-cm1',
    category: 'material',
    type: 'immediate',
    title: '불량 자재 격리 및 반품',
    description: '불량 발생 자재 즉시 격리, 사용 중지 및 공급업체 반품 처리',
    priority: 'critical',
    estimatedEffect: '추가 불량 방지',
    responsible: '품질관리팀',
    kpi: [{ name: '격리 조치시간', target: 2, unit: '시간' }]
  },
  {
    id: 'material-cm2',
    category: 'material',
    type: 'immediate',
    title: '동일 LOT 전수 검사',
    description: '불량 발생 자재와 동일 LOT의 전수 검사 실시',
    priority: 'high',
    estimatedEffect: '잠재 불량 검출',
    responsible: '품질관리팀',
    kpi: [{ name: '검사 완료율', target: 100, unit: '%' }]
  },
  {
    id: 'material-cm3',
    category: 'material',
    type: 'shortTerm',
    title: '수입검사 기준 강화',
    description: '해당 자재/공급업체에 대한 수입검사 기준 및 샘플링 강화',
    priority: 'high',
    estimatedEffect: '불량 유입 방지',
    responsible: '품질관리팀',
    deadline: '1주',
    kpi: [{ name: '수입검사 합격률', target: 99, unit: '%' }]
  },
  {
    id: 'material-cm4',
    category: 'material',
    type: 'shortTerm',
    title: '공급업체 시정조치 요구',
    description: '공급업체에 원인 분석 및 시정조치 보고서 요청',
    priority: 'high',
    estimatedEffect: '재발 방지',
    responsible: '구매팀',
    deadline: '2주',
    kpi: [{ name: '시정조치 완료율', target: 100, unit: '%' }]
  },
  {
    id: 'material-cm5',
    category: 'material',
    type: 'longTerm',
    title: '공급업체 품질 감사',
    description: '주요 공급업체 현장 품질 감사 실시 및 개선 지도',
    priority: 'medium',
    estimatedEffect: '공급업체 품질 역량 향상',
    responsible: '품질관리팀',
    deadline: '1개월',
    kpi: [{ name: '감사 점수', target: 80, unit: '점' }]
  },
  {
    id: 'material-cm6',
    category: 'material',
    type: 'longTerm',
    title: '공급업체 다변화',
    description: '불량 다발 업체 대체 공급업체 발굴 및 등록',
    priority: 'medium',
    estimatedEffect: '공급 리스크 분산',
    responsible: '구매팀',
    deadline: '3개월',
    kpi: [{ name: '대체업체 확보', target: 2, unit: '개사' }]
  },
  {
    id: 'material-cm7',
    category: 'material',
    type: 'preventive',
    title: '자재 LOT 추적 시스템 구축',
    description: '원자재부터 완제품까지 LOT 추적성 확보',
    priority: 'high',
    estimatedEffect: '신속한 원인 추적',
    responsible: '생산관리팀',
    kpi: [{ name: 'LOT 추적률', target: 100, unit: '%' }]
  },
  {
    id: 'material-cm8',
    category: 'material',
    type: 'preventive',
    title: '자재 보관 환경 관리',
    description: '온습도 관리, 선입선출, 유효기간 관리 철저',
    priority: 'low',
    estimatedEffect: '보관 중 품질 유지',
    responsible: '자재팀',
    kpi: [{ name: '보관 부적합', target: 0, unit: '건' }]
  }
];

// Material 시나리오 정의
export const MATERIAL_SCENARIOS: Scenario[] = [
  {
    id: 'material-scenario-1',
    category: 'material',
    title: '공급업체별 품질 분석',
    description: '공급업체별 자재 불량 현황 및 품질 평가',
    keywords: ['공급업체', '협력사', '업체별', '거래처', '벤더', '입고불량', '자재 불량'],
    sqlTemplates: [MATERIAL_SQL_TEMPLATES[0], MATERIAL_SQL_TEMPLATES[5]],
    causeAnalysis: MATERIAL_CAUSE_ANALYSIS,
    countermeasures: MATERIAL_COUNTERMEASURES.filter(c => ['material-cm4', 'material-cm5', 'material-cm6'].includes(c.id)),
    relatedScenarios: ['material-scenario-2']
  },
  {
    id: 'material-scenario-2',
    category: 'material',
    title: '수입검사 현황 분석',
    description: '자재 수입검사 결과 및 불량 현황',
    keywords: ['수입검사', '입고검사', 'IQC', '자재검사', '검수'],
    sqlTemplates: [MATERIAL_SQL_TEMPLATES[1], MATERIAL_SQL_TEMPLATES[4]],
    causeAnalysis: MATERIAL_CAUSE_ANALYSIS,
    countermeasures: MATERIAL_COUNTERMEASURES.filter(c => ['material-cm2', 'material-cm3'].includes(c.id)),
    relatedScenarios: ['material-scenario-1', 'measurement-scenario-2']
  },
  {
    id: 'material-scenario-3',
    category: 'material',
    title: '자재 LOT 추적',
    description: '제품 LOT에서 사용된 자재 LOT 추적',
    keywords: ['자재 추적', '원자재 추적', '자재 LOT', '어떤 자재', '재료 추적'],
    sqlTemplates: [MATERIAL_SQL_TEMPLATES[2]],
    causeAnalysis: MATERIAL_CAUSE_ANALYSIS,
    countermeasures: MATERIAL_COUNTERMEASURES.filter(c => ['material-cm1', 'material-cm7'].includes(c.id)),
    relatedScenarios: ['man-scenario-4', 'machine-scenario-5']
  },
  {
    id: 'material-scenario-4',
    category: 'material',
    title: '재고 현황 분석',
    description: '자재 재고 현황 및 부족 예상 품목',
    keywords: ['재고', '재고현황', '부족', '안전재고', '발주', '자재 수량'],
    sqlTemplates: [MATERIAL_SQL_TEMPLATES[3]],
    causeAnalysis: MATERIAL_CAUSE_ANALYSIS,
    countermeasures: MATERIAL_COUNTERMEASURES.filter(c => ['material-cm6', 'material-cm8'].includes(c.id)),
    relatedScenarios: []
  },
  {
    id: 'material-scenario-5',
    category: 'material',
    title: '자재 불량 유형 분석',
    description: '자재별 불량 유형 및 원인 분석',
    keywords: ['자재 불량', '원자재 불량', '부품 불량', '자재 문제'],
    sqlTemplates: [MATERIAL_SQL_TEMPLATES[4]],
    causeAnalysis: MATERIAL_CAUSE_ANALYSIS,
    countermeasures: MATERIAL_COUNTERMEASURES.filter(c => ['material-cm1', 'material-cm3', 'material-cm4'].includes(c.id)),
    relatedScenarios: ['material-scenario-1', 'material-scenario-2']
  }
];

// Material 카테고리 매칭 함수
export function matchMaterialScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of MATERIAL_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Material 관련 SQL 파라미터 추출
export function extractMaterialParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // LOT 번호 추출
  const lotMatch = query.match(/LOT[-\w]+/i);
  if (lotMatch) {
    params.lotNo = lotMatch[0];
  }

  // 날짜 추출
  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  // 검사 결과 추출
  const resultMatch = query.match(/(PASS|FAIL|합격|불합격)/i);
  if (resultMatch) {
    params.result = resultMatch[1].toUpperCase() === '합격' ? 'PASS' :
                    resultMatch[1].toUpperCase() === '불합격' ? 'FAIL' :
                    resultMatch[1].toUpperCase();
  }

  // 재고 상태 추출
  const statusMatch = query.match(/(부족|발주필요|정상)/);
  if (statusMatch) {
    params.status = statusMatch[1];
  }

  return params;
}
