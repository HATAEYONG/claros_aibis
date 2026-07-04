/**
 * Method(방법) 시나리오 모듈
 * 공정, 작업표준, 절차, SOP 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Method 관련 SQL 템플릿
export const METHOD_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'method-process-defect',
    name: '공정별 불량 현황',
    description: '공정별 불량 발생 현황 및 불량률 분석',
    sql: `
      SELECT
        w.process_code,
        w.process_name,
        COUNT(DISTINCT w.wo_no) AS work_count,
        SUM(w.qty_prod) AS total_production,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) AS defect_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS defect_rate,
        GROUP_CONCAT(DISTINCT d.defect_type) AS defect_types
      FROM PP_WORK_ORDER w
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      LEFT JOIN QM_DEFECT d ON w.lot_no = d.lot_no
      WHERE 1=1
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
      GROUP BY w.process_code, w.process_name
      ORDER BY defect_rate DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'process_code', displayName: '공정코드', type: 'string' },
        { dbColumn: 'process_name', displayName: '공정명', type: 'string' },
        { dbColumn: 'work_count', displayName: '작업건수', type: 'number' },
        { dbColumn: 'total_production', displayName: '생산량', type: 'number' },
        { dbColumn: 'defect_count', displayName: '불량건수', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' },
        { dbColumn: 'defect_types', displayName: '불량유형', type: 'string' }
      ],
      aggregations: [
        { type: 'sum', column: 'defect_count', displayName: '총 불량건수' },
        { type: 'avg', column: 'defect_rate', displayName: '평균 불량률' }
      ]
    }
  },
  {
    id: 'method-sop-compliance',
    name: 'SOP 준수 현황',
    description: '작업표준(SOP) 준수율 및 위반 현황',
    sql: `
      SELECT
        sop.sop_code,
        sop.sop_name,
        sop.process_code,
        sop.version,
        COUNT(sc.check_id) AS total_checks,
        SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) AS pass_count,
        ROUND(SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS compliance_rate,
        SUM(CASE WHEN sc.result = 'FAIL' THEN 1 ELSE 0 END) AS violation_count
      FROM PP_SOP sop
      LEFT JOIN PP_SOP_CHECK sc ON sop.sop_code = sc.sop_code
      WHERE sop.status = 'ACTIVE'
        {{#if startDate}} AND sc.check_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND sc.check_date <= '{{endDate}}' {{/if}}
      GROUP BY sop.sop_code, sop.sop_name, sop.process_code, sop.version
      ORDER BY compliance_rate ASC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'sop_code', displayName: 'SOP코드', type: 'string' },
        { dbColumn: 'sop_name', displayName: 'SOP명', type: 'string' },
        { dbColumn: 'process_code', displayName: '공정코드', type: 'string' },
        { dbColumn: 'version', displayName: '버전', type: 'string' },
        { dbColumn: 'total_checks', displayName: '점검건수', type: 'number' },
        { dbColumn: 'compliance_rate', displayName: '준수율(%)', type: 'percentage' },
        { dbColumn: 'violation_count', displayName: '위반건수', type: 'number' }
      ]
    }
  },
  {
    id: 'method-cycle-time',
    name: '공정 Cycle Time 분석',
    description: '공정별 Cycle Time 및 생산성 분석',
    sql: `
      SELECT
        w.process_code,
        w.process_name,
        COUNT(*) AS work_count,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date)), 0) AS avg_cycle_time,
        MIN(TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date)) AS min_cycle_time,
        MAX(TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date)) AS max_cycle_time,
        ROUND(STDDEV(TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date)), 2) AS cycle_time_std,
        SUM(w.qty_prod) AS total_production,
        ROUND(SUM(w.qty_prod) / NULLIF(SUM(TIMESTAMPDIFF(HOUR, w.start_date, w.end_date)), 0), 2) AS productivity
      FROM PP_WORK_ORDER w
      WHERE w.status = 'COMPLETED'
        AND w.end_date IS NOT NULL
        {{#if processCode}} AND w.process_code = '{{processCode}}' {{/if}}
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
      GROUP BY w.process_code, w.process_name
      ORDER BY avg_cycle_time DESC
    `,
    parameters: [
      { name: 'processCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'process_name', displayName: '공정명', type: 'string' },
        { dbColumn: 'work_count', displayName: '작업건수', type: 'number' },
        { dbColumn: 'avg_cycle_time', displayName: '평균CT(분)', type: 'number' },
        { dbColumn: 'min_cycle_time', displayName: '최소CT', type: 'number' },
        { dbColumn: 'max_cycle_time', displayName: '최대CT', type: 'number' },
        { dbColumn: 'productivity', displayName: '시간당생산', type: 'number' }
      ]
    }
  },
  {
    id: 'method-process-flow',
    name: 'LOT 공정 흐름',
    description: '특정 LOT의 공정 진행 흐름 추적',
    sql: `
      SELECT
        w.lot_no,
        w.process_seq,
        w.process_code,
        w.process_name,
        w.start_date,
        w.end_date,
        TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date) AS duration_min,
        w.qty_plan,
        w.qty_prod,
        w.worker_id,
        e.emp_name AS worker_name,
        w.equip_code,
        eq.equip_name,
        CASE WHEN q.result = 'FAIL' THEN 'Y' ELSE 'N' END AS has_defect,
        w.remarks
      FROM PP_WORK_ORDER w
      LEFT JOIN HR_EMPLOYEE e ON w.worker_id = e.emp_id
      LEFT JOIN PM_EQUIPMENT eq ON w.equip_code = eq.equip_code
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no AND w.process_code = q.process_code
      WHERE w.lot_no LIKE '%{{lotNo}}%'
      ORDER BY w.process_seq
    `,
    parameters: [
      { name: 'lotNo', type: 'string', required: true, extractPattern: '(LOT[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'process_seq', displayName: '순서', type: 'number' },
        { dbColumn: 'process_name', displayName: '공정', type: 'string' },
        { dbColumn: 'start_date', displayName: '시작', type: 'date' },
        { dbColumn: 'end_date', displayName: '종료', type: 'date' },
        { dbColumn: 'duration_min', displayName: '소요(분)', type: 'number' },
        { dbColumn: 'qty_prod', displayName: '생산량', type: 'number' },
        { dbColumn: 'worker_name', displayName: '작업자', type: 'string' },
        { dbColumn: 'equip_name', displayName: '설비', type: 'string' },
        { dbColumn: 'has_defect', displayName: '불량', type: 'string' }
      ]
    }
  },
  {
    id: 'method-bottleneck',
    name: '병목 공정 분석',
    description: '생산 라인 병목 공정 파악',
    sql: `
      SELECT
        w.process_code,
        w.process_name,
        COUNT(*) AS work_count,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, w.start_date, w.end_date)), 0) AS avg_cycle_time,
        SUM(CASE WHEN w.status = 'WAITING' THEN 1 ELSE 0 END) AS waiting_count,
        ROUND(AVG(w.qty_prod), 0) AS avg_batch_size,
        ROUND(SUM(w.qty_prod) / NULLIF(SUM(TIMESTAMPDIFF(HOUR, w.start_date, w.end_date)), 0), 2) AS throughput,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, w.plan_start_date, w.start_date)), 0) AS avg_wait_time
      FROM PP_WORK_ORDER w
      WHERE 1=1
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
      GROUP BY w.process_code, w.process_name
      ORDER BY avg_cycle_time DESC
      LIMIT 10
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'process_name', displayName: '공정명', type: 'string' },
        { dbColumn: 'work_count', displayName: '작업건수', type: 'number' },
        { dbColumn: 'avg_cycle_time', displayName: '평균CT(분)', type: 'number' },
        { dbColumn: 'waiting_count', displayName: '대기건수', type: 'number' },
        { dbColumn: 'throughput', displayName: '처리량/h', type: 'number' },
        { dbColumn: 'avg_wait_time', displayName: '평균대기(분)', type: 'number' }
      ]
    }
  },
  {
    id: 'method-change-history',
    name: '공정 변경 이력',
    description: '공정 조건 및 표준 변경 이력 조회',
    sql: `
      SELECT
        ch.change_id,
        ch.process_code,
        p.process_name,
        ch.change_type,
        ch.change_reason,
        ch.before_value,
        ch.after_value,
        ch.change_date,
        ch.changed_by,
        ch.approval_status,
        ch.approved_by
      FROM PP_PROCESS_CHANGE ch
      JOIN PP_PROCESS p ON ch.process_code = p.process_code
      WHERE 1=1
        {{#if processCode}} AND ch.process_code = '{{processCode}}' {{/if}}
        {{#if startDate}} AND ch.change_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND ch.change_date <= '{{endDate}}' {{/if}}
      ORDER BY ch.change_date DESC
      LIMIT 50
    `,
    parameters: [
      { name: 'processCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'process_name', displayName: '공정', type: 'string' },
        { dbColumn: 'change_type', displayName: '변경유형', type: 'string' },
        { dbColumn: 'change_reason', displayName: '변경사유', type: 'string' },
        { dbColumn: 'before_value', displayName: '변경전', type: 'string' },
        { dbColumn: 'after_value', displayName: '변경후', type: 'string' },
        { dbColumn: 'change_date', displayName: '변경일', type: 'date' },
        { dbColumn: 'approval_status', displayName: '승인상태', type: 'string' }
      ]
    }
  }
];

// Method 관련 원인 분석 템플릿
export const METHOD_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'method-c1',
      category: 'method',
      description: '작업표준 미준수',
      probability: 30,
      evidence: ['SOP 위반', '임의 작업', '절차 생략'],
      sqlQuery: `SELECT * FROM PP_SOP_CHECK WHERE result = 'FAIL'`
    },
    {
      id: 'method-c2',
      category: 'method',
      description: '공정 조건 부적합',
      probability: 25,
      evidence: ['파라미터 오설정', '조건 변경', '표준 미확립'],
      sqlQuery: `SELECT * FROM PP_PROCESS_CHANGE WHERE change_type = 'CONDITION'`
    },
    {
      id: 'method-c3',
      category: 'method',
      description: '작업 순서 오류',
      probability: 20,
      evidence: ['공정 순서 역전', '누락', '중복'],
      sqlQuery: `SELECT * FROM QM_DEFECT WHERE cause LIKE '%순서%'`
    },
    {
      id: 'method-c4',
      category: 'method',
      description: '작업 지시 불명확',
      probability: 15,
      evidence: ['지시서 누락', '모호한 지시', '변경 미전달'],
      sqlQuery: `SELECT * FROM PP_WORK_ORDER WHERE remarks LIKE '%불명확%'`
    },
    {
      id: 'method-c5',
      category: 'method',
      description: '공정 능력 부족',
      probability: 10,
      evidence: ['Cpk 미달', '변동 과다', '설계 마진 부족'],
      sqlQuery: `SELECT * FROM QM_PROCESS_CAPABILITY WHERE cpk < 1.33`
    }
  ],
  secondaryCauses: [
    {
      id: 'method-c1-1',
      category: 'man',
      description: '작업자 교육 미흡',
      probability: 40
    },
    {
      id: 'method-c2-1',
      category: 'method',
      description: '공정 표준화 미흡',
      probability: 35
    },
    {
      id: 'method-c3-1',
      category: 'method',
      description: '공정 설계 결함',
      probability: 25
    }
  ],
  rootCauses: [
    {
      id: 'method-root-1',
      category: 'method',
      description: '표준화 체계 미구축',
      probability: 55
    },
    {
      id: 'method-root-2',
      category: 'method',
      description: '변경 관리 시스템 부재',
      probability: 45
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 공정에서 불량이 발생했는가?',
      answer: '작업 표준과 다른 방법으로 작업했다',
      nextNodes: [
        {
          level: 2,
          question: '왜 표준과 다르게 작업했는가?',
          answer: '작업 표준이 현장 상황에 맞지 않았다',
          nextNodes: [
            {
              level: 3,
              question: '왜 현장 상황에 맞지 않았는가?',
              answer: '표준 제정 시 현장 의견이 반영되지 않았다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 현장 의견이 반영되지 않았는가?',
                  answer: '표준 작성 절차에 현장 참여가 없다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 현장 참여가 없는가?',
                      answer: '표준화 체계 및 절차가 구축되어 있지 않다'
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

// Method 관련 대책
export const METHOD_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'method-cm1',
    category: 'method',
    type: 'immediate',
    title: '작업 중단 및 표준 재확인',
    description: '불량 발생 공정 작업 중단, 작업 표준 재확인 후 작업 재개',
    priority: 'critical',
    estimatedEffect: '추가 불량 방지',
    responsible: '생산팀',
    kpi: [{ name: '재작업률', target: 0, unit: '%' }]
  },
  {
    id: 'method-cm2',
    category: 'method',
    type: 'immediate',
    title: '공정 조건 점검 및 재설정',
    description: '공정 조건(온도, 압력, 속도 등) 점검 및 표준 조건으로 재설정',
    priority: 'high',
    estimatedEffect: '공정 안정화',
    responsible: '생산기술팀',
    kpi: [{ name: '조건 일치율', target: 100, unit: '%' }]
  },
  {
    id: 'method-cm3',
    category: 'method',
    type: 'shortTerm',
    title: 'SOP 현행화',
    description: '현장 상황을 반영하여 작업 표준(SOP) 개정',
    priority: 'high',
    estimatedEffect: 'SOP 준수율 향상',
    responsible: '품질기술팀',
    deadline: '2주',
    kpi: [{ name: 'SOP 현행화율', target: 100, unit: '%' }]
  },
  {
    id: 'method-cm4',
    category: 'method',
    type: 'shortTerm',
    title: '공정 FMEA 실시',
    description: '불량 다발 공정에 대한 FMEA 분석 실시',
    priority: 'medium',
    estimatedEffect: '잠재 위험 발굴',
    responsible: '품질기술팀',
    deadline: '1개월',
    kpi: [{ name: 'RPN 감소', target: 50, unit: '%' }]
  },
  {
    id: 'method-cm5',
    category: 'method',
    type: 'longTerm',
    title: '공정 능력 향상',
    description: '공정 능력(Cpk) 분석 및 개선 활동',
    priority: 'high',
    estimatedEffect: 'Cpk 1.33 이상 달성',
    responsible: '생산기술팀',
    deadline: '3개월',
    kpi: [{ name: 'Cpk', target: 1.33, unit: '' }]
  },
  {
    id: 'method-cm6',
    category: 'method',
    type: 'longTerm',
    title: '변경 관리 시스템 구축',
    description: '공정, 설비, 자재 변경에 대한 체계적 관리 시스템 구축',
    priority: 'medium',
    estimatedEffect: '변경으로 인한 불량 방지',
    responsible: '품질관리팀',
    deadline: '6개월',
    kpi: [{ name: '변경 승인률', target: 100, unit: '%' }]
  },
  {
    id: 'method-cm7',
    category: 'method',
    type: 'preventive',
    title: '공정 순회 점검 강화',
    description: '공정 순회 점검 항목 및 빈도 강화',
    priority: 'medium',
    estimatedEffect: '이상 조기 발견',
    responsible: '품질관리팀',
    kpi: [{ name: '순회점검 실시율', target: 100, unit: '%' }]
  },
  {
    id: 'method-cm8',
    category: 'method',
    type: 'preventive',
    title: '공정 Fool-Proof 장치',
    description: '실수 방지를 위한 Poka-Yoke 장치 설치',
    priority: 'low',
    estimatedEffect: '휴먼에러 방지',
    responsible: '생산기술팀',
    kpi: [{ name: '적용 공정', target: 80, unit: '%' }]
  }
];

// Method 시나리오 정의
export const METHOD_SCENARIOS: Scenario[] = [
  {
    id: 'method-scenario-1',
    category: 'method',
    title: '공정별 불량 분석',
    description: '공정별 불량 현황 및 원인 분석',
    keywords: ['공정별', '공정 불량', '어느 공정', '공정 분석', '프로세스'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[0]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm1', 'method-cm2', 'method-cm5'].includes(c.id)),
    relatedScenarios: ['method-scenario-2', 'man-scenario-1']
  },
  {
    id: 'method-scenario-2',
    category: 'method',
    title: 'SOP 준수 현황',
    description: '작업표준(SOP) 준수율 및 위반 현황 분석',
    keywords: ['SOP', '표준', '작업표준', '절차', '준수', '위반', '매뉴얼'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[1]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm3', 'method-cm7'].includes(c.id)),
    relatedScenarios: ['method-scenario-1', 'man-scenario-2']
  },
  {
    id: 'method-scenario-3',
    category: 'method',
    title: 'Cycle Time 분석',
    description: '공정 Cycle Time 및 생산성 분석',
    keywords: ['사이클타임', 'CT', '생산성', '효율', '시간', '리드타임'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[2]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm5', 'method-cm4'].includes(c.id)),
    relatedScenarios: ['method-scenario-4']
  },
  {
    id: 'method-scenario-4',
    category: 'method',
    title: '병목 공정 분석',
    description: '생산 라인 병목 공정 파악 및 개선',
    keywords: ['병목', '보틀넥', '대기', '정체', '라인밸런싱'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[4]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm5', 'method-cm6'].includes(c.id)),
    relatedScenarios: ['method-scenario-3', 'machine-scenario-1']
  },
  {
    id: 'method-scenario-5',
    category: 'method',
    title: 'LOT 공정 흐름 추적',
    description: '특정 LOT의 공정 진행 흐름 추적',
    keywords: ['공정 흐름', '공정 추적', '작업 이력', '공정 이력'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[3]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm1', 'method-cm2'].includes(c.id)),
    relatedScenarios: ['man-scenario-4', 'machine-scenario-5']
  },
  {
    id: 'method-scenario-6',
    category: 'method',
    title: '공정 변경 이력',
    description: '공정 조건 및 표준 변경 이력 분석',
    keywords: ['변경', '변경 이력', '변경점', '4M 변경', '공정 변경'],
    sqlTemplates: [METHOD_SQL_TEMPLATES[5]],
    causeAnalysis: METHOD_CAUSE_ANALYSIS,
    countermeasures: METHOD_COUNTERMEASURES.filter(c => ['method-cm6'].includes(c.id)),
    relatedScenarios: ['method-scenario-1']
  }
];

// Method 카테고리 매칭 함수
export function matchMethodScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of METHOD_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Method 관련 SQL 파라미터 추출
export function extractMethodParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // LOT 번호 추출
  const lotMatch = query.match(/LOT[-\w]+/i);
  if (lotMatch) {
    params.lotNo = lotMatch[0];
  }

  // 공정 코드 추출
  const processMatch = query.match(/P[-\w]+/i);
  if (processMatch) {
    params.processCode = processMatch[0];
  }

  // 날짜 추출
  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  return params;
}
