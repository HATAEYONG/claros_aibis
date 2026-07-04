/**
 * Measurement(측정) 시나리오 모듈
 * 검사, 측정, 품질 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Measurement 관련 SQL 템플릿
export const MEASUREMENT_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'measurement-defect-summary',
    name: '불량 현황 요약',
    description: '불량 유형별 현황 요약',
    sql: `
      SELECT
        d.defect_type,
        COUNT(*) AS occurrence_count,
        SUM(d.defect_qty) AS total_qty,
        ROUND(SUM(d.defect_qty) * 100.0 / (SELECT SUM(qty_prod) FROM PP_WORK_ORDER WHERE start_date BETWEEN '{{startDate}}' AND '{{endDate}}'), 2) AS defect_rate,
        GROUP_CONCAT(DISTINCT d.cause) AS causes
      FROM QM_DEFECT d
      WHERE 1=1
        {{#if startDate}} AND d.defect_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND d.defect_date <= '{{endDate}}' {{/if}}
        {{#if defectType}} AND d.defect_type LIKE '%{{defectType}}%' {{/if}}
      GROUP BY d.defect_type
      ORDER BY occurrence_count DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false },
      { name: 'defectType', type: 'string', required: false, extractPattern: '(치수|외관|기능|조립|도장)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'defect_type', displayName: '불량유형', type: 'string' },
        { dbColumn: 'occurrence_count', displayName: '발생건수', type: 'number' },
        { dbColumn: 'total_qty', displayName: '불량수량', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' },
        { dbColumn: 'causes', displayName: '원인', type: 'string' }
      ],
      aggregations: [
        { type: 'sum', column: 'total_qty', displayName: '총 불량수량' }
      ]
    }
  },
  {
    id: 'measurement-inspection-result',
    name: '검사 결과 현황',
    description: '공정검사, 출하검사 결과 현황',
    sql: `
      SELECT
        q.insp_type,
        q.process_code,
        COUNT(*) AS total_count,
        SUM(CASE WHEN q.result = 'PASS' THEN 1 ELSE 0 END) AS pass_count,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) AS fail_count,
        ROUND(SUM(CASE WHEN q.result = 'PASS' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS pass_rate
      FROM QM_INSPECTION q
      WHERE 1=1
        {{#if startDate}} AND q.insp_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND q.insp_date <= '{{endDate}}' {{/if}}
        {{#if inspType}} AND q.insp_type = '{{inspType}}' {{/if}}
      GROUP BY q.insp_type, q.process_code
      ORDER BY pass_rate ASC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false },
      { name: 'inspType', type: 'string', required: false, extractPattern: '(IQC|공정검사|FQC|OQC|출하검사)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'insp_type', displayName: '검사유형', type: 'string' },
        { dbColumn: 'process_code', displayName: '공정코드', type: 'string' },
        { dbColumn: 'total_count', displayName: '검사건수', type: 'number' },
        { dbColumn: 'pass_count', displayName: '합격건수', type: 'number' },
        { dbColumn: 'fail_count', displayName: '불합격건수', type: 'number' },
        { dbColumn: 'pass_rate', displayName: '합격률(%)', type: 'percentage' }
      ]
    }
  },
  {
    id: 'measurement-spc-data',
    name: 'SPC 관리도 데이터',
    description: '품질 특성치 SPC 데이터 조회',
    sql: `
      SELECT
        s.measurement_date,
        s.lot_no,
        s.item_code,
        s.item_name,
        s.measured_value,
        s.usl,
        s.lsl,
        s.target_value,
        CASE
          WHEN s.measured_value > s.usl THEN 'USL초과'
          WHEN s.measured_value < s.lsl THEN 'LSL미달'
          ELSE '정상'
        END AS spec_status,
        s.inspector
      FROM QM_SPC_DATA s
      WHERE 1=1
        {{#if itemCode}} AND s.item_code = '{{itemCode}}' {{/if}}
        {{#if startDate}} AND s.measurement_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND s.measurement_date <= '{{endDate}}' {{/if}}
      ORDER BY s.measurement_date DESC
      LIMIT 100
    `,
    parameters: [
      { name: 'itemCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'measurement_date', displayName: '측정일시', type: 'date' },
        { dbColumn: 'lot_no', displayName: 'LOT번호', type: 'string' },
        { dbColumn: 'item_name', displayName: '측정항목', type: 'string' },
        { dbColumn: 'measured_value', displayName: '측정값', type: 'number' },
        { dbColumn: 'usl', displayName: 'USL', type: 'number' },
        { dbColumn: 'lsl', displayName: 'LSL', type: 'number' },
        { dbColumn: 'spec_status', displayName: '규격상태', type: 'string' }
      ]
    }
  },
  {
    id: 'measurement-calibration',
    name: '계측기 교정 현황',
    description: '계측기 교정 상태 및 만료 예정 조회',
    sql: `
      SELECT
        g.gauge_code,
        g.gauge_name,
        g.gauge_type,
        g.location,
        g.calibration_date,
        g.next_calibration,
        g.calibration_cycle,
        DATEDIFF(g.next_calibration, CURDATE()) AS days_until,
        CASE
          WHEN g.next_calibration < CURDATE() THEN '만료'
          WHEN g.next_calibration < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN '곧만료'
          ELSE '유효'
        END AS calibration_status,
        g.status
      FROM QM_GAUGE g
      WHERE g.status = 'ACTIVE'
      ORDER BY g.next_calibration ASC
    `,
    parameters: [],
    resultMapping: {
      columns: [
        { dbColumn: 'gauge_code', displayName: '계측기코드', type: 'string' },
        { dbColumn: 'gauge_name', displayName: '계측기명', type: 'string' },
        { dbColumn: 'gauge_type', displayName: '유형', type: 'string' },
        { dbColumn: 'location', displayName: '위치', type: 'string' },
        { dbColumn: 'calibration_date', displayName: '교정일', type: 'date' },
        { dbColumn: 'next_calibration', displayName: '차기교정일', type: 'date' },
        { dbColumn: 'days_until', displayName: 'D-Day', type: 'number' },
        { dbColumn: 'calibration_status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'measurement-cpk-analysis',
    name: '공정능력 분석',
    description: '품질 특성별 공정능력(Cpk) 분석',
    sql: `
      SELECT
        pc.item_code,
        pc.item_name,
        pc.process_code,
        pc.sample_count,
        pc.avg_value,
        pc.std_dev,
        pc.usl,
        pc.lsl,
        pc.cp,
        pc.cpk,
        pc.analysis_date,
        CASE
          WHEN pc.cpk >= 1.67 THEN 'A (우수)'
          WHEN pc.cpk >= 1.33 THEN 'B (양호)'
          WHEN pc.cpk >= 1.00 THEN 'C (보통)'
          ELSE 'D (개선필요)'
        END AS grade
      FROM QM_PROCESS_CAPABILITY pc
      WHERE 1=1
        {{#if processCode}} AND pc.process_code = '{{processCode}}' {{/if}}
      ORDER BY pc.cpk ASC
    `,
    parameters: [
      { name: 'processCode', type: 'string', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'item_name', displayName: '측정항목', type: 'string' },
        { dbColumn: 'process_code', displayName: '공정', type: 'string' },
        { dbColumn: 'sample_count', displayName: '샘플수', type: 'number' },
        { dbColumn: 'avg_value', displayName: '평균', type: 'number' },
        { dbColumn: 'std_dev', displayName: '표준편차', type: 'number' },
        { dbColumn: 'cp', displayName: 'Cp', type: 'number' },
        { dbColumn: 'cpk', displayName: 'Cpk', type: 'number' },
        { dbColumn: 'grade', displayName: '등급', type: 'string' }
      ]
    }
  },
  {
    id: 'measurement-lot-quality',
    name: 'LOT 품질 이력',
    description: '특정 LOT의 품질 검사 이력 추적',
    sql: `
      SELECT
        q.insp_id,
        q.lot_no,
        q.insp_type,
        q.process_code,
        q.insp_date,
        q.result,
        q.inspector,
        d.defect_type,
        d.defect_qty,
        d.cause,
        d.action
      FROM QM_INSPECTION q
      LEFT JOIN QM_DEFECT d ON q.lot_no = d.lot_no AND q.process_code = d.process_code
      WHERE q.lot_no LIKE '%{{lotNo}}%'
      ORDER BY q.insp_date
    `,
    parameters: [
      { name: 'lotNo', type: 'string', required: true, extractPattern: '(LOT[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'lot_no', displayName: 'LOT번호', type: 'string' },
        { dbColumn: 'insp_type', displayName: '검사유형', type: 'string' },
        { dbColumn: 'process_code', displayName: '공정', type: 'string' },
        { dbColumn: 'insp_date', displayName: '검사일', type: 'date' },
        { dbColumn: 'result', displayName: '결과', type: 'string' },
        { dbColumn: 'defect_type', displayName: '불량유형', type: 'string' },
        { dbColumn: 'defect_qty', displayName: '불량수', type: 'number' },
        { dbColumn: 'cause', displayName: '원인', type: 'string' }
      ]
    }
  }
];

// Measurement 관련 원인 분석 템플릿
export const MEASUREMENT_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'measurement-c1',
      category: 'measurement',
      description: '측정 오류',
      probability: 25,
      evidence: ['측정방법 오류', '측정자 오류', '데이터 기록 오류'],
      sqlQuery: `SELECT * FROM QM_INSPECTION WHERE remarks LIKE '%오류%'`
    },
    {
      id: 'measurement-c2',
      category: 'measurement',
      description: '계측기 문제',
      probability: 30,
      evidence: ['교정 만료', '계측기 고장', '정밀도 저하'],
      sqlQuery: `SELECT * FROM QM_GAUGE WHERE next_calibration < CURDATE()`
    },
    {
      id: 'measurement-c3',
      category: 'measurement',
      description: '검사 기준 부적합',
      probability: 20,
      evidence: ['규격 변경', '기준 모호', '판정 기준 불명확'],
      sqlQuery: `SELECT * FROM QM_INSPECTION_STD WHERE status = 'OUTDATED'`
    },
    {
      id: 'measurement-c4',
      category: 'measurement',
      description: '샘플링 미흡',
      probability: 15,
      evidence: ['샘플 수 부족', '대표성 부족', '샘플링 위치 오류'],
      sqlQuery: `SELECT lot_no, COUNT(*) FROM QM_INSPECTION GROUP BY lot_no HAVING COUNT(*) < 3`
    },
    {
      id: 'measurement-c5',
      category: 'measurement',
      description: '검사 누락',
      probability: 10,
      evidence: ['검사 생략', '항목 누락', '공정 스킵'],
      sqlQuery: `SELECT * FROM PP_WORK_ORDER WHERE lot_no NOT IN (SELECT DISTINCT lot_no FROM QM_INSPECTION)`
    }
  ],
  secondaryCauses: [
    {
      id: 'measurement-c1-1',
      category: 'man',
      description: '검사자 숙련도 부족',
      probability: 35
    },
    {
      id: 'measurement-c2-1',
      category: 'measurement',
      description: '계측기 관리 미흡',
      probability: 40
    },
    {
      id: 'measurement-c3-1',
      category: 'method',
      description: '검사 표준 미확립',
      probability: 25
    }
  ],
  rootCauses: [
    {
      id: 'measurement-root-1',
      category: 'measurement',
      description: '품질 관리 시스템 미흡',
      probability: 55
    },
    {
      id: 'measurement-root-2',
      category: 'measurement',
      description: '측정시스템 분석(MSA) 미실시',
      probability: 45
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 불량을 검출하지 못했는가?',
      answer: '검사에서 불량품을 합격 판정했다',
      nextNodes: [
        {
          level: 2,
          question: '왜 합격 판정했는가?',
          answer: '측정값이 정확하지 않았다',
          nextNodes: [
            {
              level: 3,
              question: '왜 측정값이 부정확했는가?',
              answer: '계측기 교정이 되어있지 않았다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 교정이 되어있지 않았는가?',
                  answer: '교정 일정 관리가 안되고 있다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 교정 일정 관리가 안되는가?',
                      answer: '계측기 관리 시스템이 없다'
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

// Measurement 관련 대책
export const MEASUREMENT_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'measurement-cm1',
    category: 'measurement',
    type: 'immediate',
    title: '계측기 긴급 교정',
    description: '관련 계측기 즉시 교정 또는 대체 계측기 사용',
    priority: 'critical',
    estimatedEffect: '측정 정확도 확보',
    responsible: '품질관리팀',
    kpi: [{ name: '교정 완료율', target: 100, unit: '%' }]
  },
  {
    id: 'measurement-cm2',
    category: 'measurement',
    type: 'immediate',
    title: '재검사 실시',
    description: '불량 의심 LOT 전수 재검사 실시',
    priority: 'high',
    estimatedEffect: '잠재 불량 검출',
    responsible: '품질관리팀',
    kpi: [{ name: '재검사 완료율', target: 100, unit: '%' }]
  },
  {
    id: 'measurement-cm3',
    category: 'measurement',
    type: 'shortTerm',
    title: '검사 기준 재정립',
    description: '검사 항목, 기준, 방법 재검토 및 표준화',
    priority: 'high',
    estimatedEffect: '검사 정확도 향상',
    responsible: '품질기술팀',
    deadline: '2주',
    kpi: [{ name: '검사기준 현행화', target: 100, unit: '%' }]
  },
  {
    id: 'measurement-cm4',
    category: 'measurement',
    type: 'shortTerm',
    title: '검사자 재교육',
    description: '검사 방법, 판정 기준에 대한 검사자 재교육 실시',
    priority: 'medium',
    estimatedEffect: '검사 오류 감소',
    responsible: '품질관리팀',
    deadline: '1주',
    kpi: [{ name: '교육 이수율', target: 100, unit: '%' }]
  },
  {
    id: 'measurement-cm5',
    category: 'measurement',
    type: 'longTerm',
    title: 'MSA(측정시스템분석) 실시',
    description: '주요 품질 특성에 대한 MSA 분석 및 개선',
    priority: 'high',
    estimatedEffect: '측정 신뢰성 확보',
    responsible: '품질기술팀',
    deadline: '1개월',
    kpi: [{ name: 'GR&R', target: 10, unit: '%' }]
  },
  {
    id: 'measurement-cm6',
    category: 'measurement',
    type: 'longTerm',
    title: '자동 검사 시스템 도입',
    description: '비전 검사, 자동 측정 시스템 도입으로 검사 자동화',
    priority: 'medium',
    estimatedEffect: '검사 효율/정확도 향상',
    responsible: '스마트팩토리팀',
    deadline: '6개월',
    kpi: [{ name: '자동검사 비율', target: 50, unit: '%' }]
  },
  {
    id: 'measurement-cm7',
    category: 'measurement',
    type: 'preventive',
    title: '계측기 관리 시스템',
    description: '계측기 등록, 교정 일정, 이력 관리 시스템 구축',
    priority: 'high',
    estimatedEffect: '교정 누락 방지',
    responsible: '품질관리팀',
    kpi: [{ name: '교정 준수율', target: 100, unit: '%' }]
  },
  {
    id: 'measurement-cm8',
    category: 'measurement',
    type: 'preventive',
    title: 'SPC 관리 강화',
    description: '주요 품질 특성 SPC 관리 및 이상 조기 감지',
    priority: 'medium',
    estimatedEffect: '공정 이상 조기 발견',
    responsible: '품질관리팀',
    kpi: [{ name: 'Cpk 관리 항목', target: 30, unit: '개' }]
  }
];

// Measurement 시나리오 정의
export const MEASUREMENT_SCENARIOS: Scenario[] = [
  {
    id: 'measurement-scenario-1',
    category: 'measurement',
    title: '불량 현황 분석',
    description: '불량 유형별 현황 및 추이 분석',
    keywords: ['불량', '불량률', '불량현황', '품질', '불량 분석', '결함'],
    sqlTemplates: [MEASUREMENT_SQL_TEMPLATES[0]],
    causeAnalysis: MEASUREMENT_CAUSE_ANALYSIS,
    countermeasures: MEASUREMENT_COUNTERMEASURES.filter(c => ['measurement-cm2', 'measurement-cm3'].includes(c.id)),
    relatedScenarios: ['measurement-scenario-2', 'method-scenario-1']
  },
  {
    id: 'measurement-scenario-2',
    category: 'measurement',
    title: '검사 결과 분석',
    description: '공정검사, 출하검사 결과 현황 분석',
    keywords: ['검사', '검사결과', '합격률', '불합격', 'QC', '출하검사', '공정검사'],
    sqlTemplates: [MEASUREMENT_SQL_TEMPLATES[1]],
    causeAnalysis: MEASUREMENT_CAUSE_ANALYSIS,
    countermeasures: MEASUREMENT_COUNTERMEASURES.filter(c => ['measurement-cm3', 'measurement-cm4'].includes(c.id)),
    relatedScenarios: ['measurement-scenario-1', 'material-scenario-2']
  },
  {
    id: 'measurement-scenario-3',
    category: 'measurement',
    title: 'SPC 분석',
    description: 'SPC 관리도 데이터 및 공정 능력 분석',
    keywords: ['SPC', '관리도', '공정능력', 'Cpk', 'Cp', '측정값', '규격'],
    sqlTemplates: [MEASUREMENT_SQL_TEMPLATES[2], MEASUREMENT_SQL_TEMPLATES[4]],
    causeAnalysis: MEASUREMENT_CAUSE_ANALYSIS,
    countermeasures: MEASUREMENT_COUNTERMEASURES.filter(c => ['measurement-cm5', 'measurement-cm8'].includes(c.id)),
    relatedScenarios: ['method-scenario-3']
  },
  {
    id: 'measurement-scenario-4',
    category: 'measurement',
    title: '계측기 관리',
    description: '계측기 교정 현황 및 관리',
    keywords: ['계측기', '교정', '캘리브레이션', '측정기', '게이지'],
    sqlTemplates: [MEASUREMENT_SQL_TEMPLATES[3]],
    causeAnalysis: MEASUREMENT_CAUSE_ANALYSIS,
    countermeasures: MEASUREMENT_COUNTERMEASURES.filter(c => ['measurement-cm1', 'measurement-cm7'].includes(c.id)),
    relatedScenarios: ['measurement-scenario-3']
  },
  {
    id: 'measurement-scenario-5',
    category: 'measurement',
    title: 'LOT 품질 이력',
    description: '특정 LOT의 품질 검사 이력 추적',
    keywords: ['LOT 검사', '로트 품질', '품질 이력', '검사 이력'],
    sqlTemplates: [MEASUREMENT_SQL_TEMPLATES[5]],
    causeAnalysis: MEASUREMENT_CAUSE_ANALYSIS,
    countermeasures: MEASUREMENT_COUNTERMEASURES.filter(c => ['measurement-cm2', 'measurement-cm3'].includes(c.id)),
    relatedScenarios: ['man-scenario-4', 'machine-scenario-5', 'material-scenario-3']
  }
];

// Measurement 카테고리 매칭 함수
export function matchMeasurementScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of MEASUREMENT_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Measurement 관련 SQL 파라미터 추출
export function extractMeasurementParams(query: string): Record<string, any> {
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

  // 불량 유형 추출
  const defectMatch = query.match(/(치수|외관|기능|조립|도장)/);
  if (defectMatch) {
    params.defectType = defectMatch[1];
  }

  // 검사 유형 추출
  const inspMatch = query.match(/(IQC|공정검사|FQC|OQC|출하검사)/);
  if (inspMatch) {
    params.inspType = inspMatch[1];
  }

  return params;
}
