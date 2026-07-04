/**
 * Man(인적요인) 시나리오 모듈
 * 작업자, 교육, 숙련도, 휴먼에러 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Man 관련 SQL 템플릿
export const MAN_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'man-defect-by-worker',
    name: '작업자별 불량 현황',
    description: '작업자별 불량 발생 현황 및 불량률 조회',
    sql: `
      SELECT
        e.emp_id AS worker_id,
        e.emp_name AS worker_name,
        d.dept_name AS department,
        COUNT(DISTINCT w.wo_no) AS work_count,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) AS defect_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS defect_rate
      FROM HR_EMPLOYEE e
      LEFT JOIN HR_DEPARTMENT d ON e.dept_code = d.dept_code
      LEFT JOIN PP_WORK_ORDER w ON e.emp_id = w.worker_id
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      WHERE 1=1
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
        {{#if deptCode}} AND e.dept_code = '{{deptCode}}' {{/if}}
      GROUP BY e.emp_id, e.emp_name, d.dept_name
      ORDER BY defect_rate DESC
      LIMIT 20
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false, extractPattern: '(\\d{4}-\\d{2}-\\d{2})부터' },
      { name: 'endDate', type: 'date', required: false, extractPattern: '(\\d{4}-\\d{2}-\\d{2})까지' },
      { name: 'deptCode', type: 'string', required: false, extractPattern: '(\\w+)부서' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'worker_id', displayName: '사번', type: 'string' },
        { dbColumn: 'worker_name', displayName: '작업자명', type: 'string' },
        { dbColumn: 'department', displayName: '부서', type: 'string' },
        { dbColumn: 'work_count', displayName: '작업건수', type: 'number' },
        { dbColumn: 'defect_count', displayName: '불량건수', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' }
      ],
      aggregations: [
        { type: 'sum', column: 'defect_count', displayName: '총 불량건수' },
        { type: 'avg', column: 'defect_rate', displayName: '평균 불량률' }
      ]
    }
  },
  {
    id: 'man-skill-level',
    name: '작업자 숙련도 현황',
    description: '작업자별 숙련도 및 경력 현황 조회',
    sql: `
      SELECT
        e.emp_id,
        e.emp_name,
        e.skill_level,
        e.hire_date,
        DATEDIFF(CURDATE(), e.hire_date) / 365 AS experience_years,
        d.dept_name,
        COUNT(t.training_id) AS training_count,
        MAX(t.training_date) AS last_training
      FROM HR_EMPLOYEE e
      LEFT JOIN HR_DEPARTMENT d ON e.dept_code = d.dept_code
      LEFT JOIN HR_TRAINING t ON e.emp_id = t.emp_id
      WHERE e.status = 'ACTIVE'
        {{#if skillLevel}} AND e.skill_level = '{{skillLevel}}' {{/if}}
      GROUP BY e.emp_id, e.emp_name, e.skill_level, e.hire_date, d.dept_name
      ORDER BY experience_years DESC
    `,
    parameters: [
      { name: 'skillLevel', type: 'string', required: false, extractPattern: '(초급|중급|고급|전문가)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'emp_id', displayName: '사번', type: 'string' },
        { dbColumn: 'emp_name', displayName: '성명', type: 'string' },
        { dbColumn: 'skill_level', displayName: '숙련도', type: 'string' },
        { dbColumn: 'experience_years', displayName: '경력(년)', type: 'number', format: '0.0' },
        { dbColumn: 'dept_name', displayName: '부서', type: 'string' },
        { dbColumn: 'training_count', displayName: '교육이수', type: 'number' },
        { dbColumn: 'last_training', displayName: '최근교육일', type: 'date' }
      ]
    }
  },
  {
    id: 'man-work-history',
    name: '작업자 작업이력',
    description: '특정 LOT의 관련 작업자 이력 조회',
    sql: `
      SELECT
        w.wo_no,
        w.lot_no,
        e.emp_id,
        e.emp_name,
        w.process_code,
        w.process_name,
        w.start_date,
        w.end_date,
        w.qty_plan,
        w.qty_prod,
        CASE WHEN q.result = 'FAIL' THEN 'Y' ELSE 'N' END AS has_defect
      FROM PP_WORK_ORDER w
      JOIN HR_EMPLOYEE e ON w.worker_id = e.emp_id
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      WHERE w.lot_no LIKE '%{{lotNo}}%'
      ORDER BY w.start_date DESC
    `,
    parameters: [
      { name: 'lotNo', type: 'string', required: true, extractPattern: '(LOT[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'wo_no', displayName: '작업지시번호', type: 'string' },
        { dbColumn: 'lot_no', displayName: 'LOT번호', type: 'string' },
        { dbColumn: 'emp_name', displayName: '작업자', type: 'string' },
        { dbColumn: 'process_name', displayName: '공정', type: 'string' },
        { dbColumn: 'start_date', displayName: '시작일', type: 'date' },
        { dbColumn: 'qty_prod', displayName: '생산량', type: 'number' },
        { dbColumn: 'has_defect', displayName: '불량여부', type: 'string' }
      ]
    }
  },
  {
    id: 'man-training-status',
    name: '교육 이수 현황',
    description: '작업자 교육 이수 현황 및 미이수자 조회',
    sql: `
      SELECT
        e.emp_id,
        e.emp_name,
        d.dept_name,
        t.training_type,
        t.training_name,
        t.training_date,
        t.result,
        t.score,
        t.next_due_date,
        CASE
          WHEN t.next_due_date < CURDATE() THEN '재교육필요'
          WHEN t.next_due_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN '곧만료'
          ELSE '유효'
        END AS training_status
      FROM HR_EMPLOYEE e
      LEFT JOIN HR_DEPARTMENT d ON e.dept_code = d.dept_code
      LEFT JOIN HR_TRAINING t ON e.emp_id = t.emp_id
      WHERE e.status = 'ACTIVE'
        {{#if trainingType}} AND t.training_type = '{{trainingType}}' {{/if}}
      ORDER BY t.next_due_date ASC
    `,
    parameters: [
      { name: 'trainingType', type: 'string', required: false, extractPattern: '(안전|품질|공정|장비)교육' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'emp_name', displayName: '성명', type: 'string' },
        { dbColumn: 'dept_name', displayName: '부서', type: 'string' },
        { dbColumn: 'training_type', displayName: '교육유형', type: 'string' },
        { dbColumn: 'training_name', displayName: '교육명', type: 'string' },
        { dbColumn: 'training_date', displayName: '이수일', type: 'date' },
        { dbColumn: 'score', displayName: '점수', type: 'number' },
        { dbColumn: 'training_status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'man-shift-analysis',
    name: '교대근무 분석',
    description: '교대별 생산성 및 불량률 분석',
    sql: `
      SELECT
        w.shift_code AS shift,
        COUNT(DISTINCT w.worker_id) AS worker_count,
        COUNT(DISTINCT w.wo_no) AS work_count,
        SUM(w.qty_prod) AS total_production,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) AS defect_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS defect_rate,
        ROUND(SUM(w.qty_prod) / COUNT(DISTINCT w.worker_id), 0) AS productivity_per_worker
      FROM PP_WORK_ORDER w
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      WHERE 1=1
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
      GROUP BY w.shift_code
      ORDER BY defect_rate ASC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'shift', displayName: '교대', type: 'string' },
        { dbColumn: 'worker_count', displayName: '작업자수', type: 'number' },
        { dbColumn: 'work_count', displayName: '작업건수', type: 'number' },
        { dbColumn: 'total_production', displayName: '총생산량', type: 'number' },
        { dbColumn: 'defect_count', displayName: '불량건수', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' },
        { dbColumn: 'productivity_per_worker', displayName: '인당생산성', type: 'number' }
      ]
    }
  }
];

// Man 관련 원인 분석 템플릿
export const MAN_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'man-c1',
      category: 'man',
      description: '작업자 숙련도 부족',
      probability: 35,
      evidence: ['신규 작업자 배치', '복잡 공정 투입', '교육 미이수'],
      sqlQuery: `SELECT COUNT(*) FROM HR_EMPLOYEE WHERE skill_level = '초급' AND dept_code = ?`
    },
    {
      id: 'man-c2',
      category: 'man',
      description: '작업 피로도 증가',
      probability: 25,
      evidence: ['초과근무 증가', '야간작업', '연속작업'],
      sqlQuery: `SELECT worker_id, COUNT(*) as overtime_days FROM PP_WORK_ORDER WHERE HOUR(end_date) > 22 GROUP BY worker_id`
    },
    {
      id: 'man-c3',
      category: 'man',
      description: '교육/훈련 미흡',
      probability: 20,
      evidence: ['교육 미이수', '재교육 필요', '신규 공정 교육 부재'],
      sqlQuery: `SELECT emp_id FROM HR_TRAINING WHERE next_due_date < CURDATE()`
    },
    {
      id: 'man-c4',
      category: 'man',
      description: '작업 표준 미준수',
      probability: 15,
      evidence: ['작업절차 무시', '임의 작업', 'SOP 미숙지'],
      sqlQuery: `SELECT * FROM QM_DEFECT WHERE cause LIKE '%표준%' OR cause LIKE '%절차%'`
    },
    {
      id: 'man-c5',
      category: 'man',
      description: '의사소통 오류',
      probability: 5,
      evidence: ['인수인계 미흡', '정보 전달 오류', '언어 장벽'],
      sqlQuery: `SELECT * FROM PP_WORK_ORDER WHERE remarks LIKE '%인수인계%'`
    }
  ],
  secondaryCauses: [
    {
      id: 'man-c1-1',
      category: 'man',
      description: '신규 채용 인력 증가',
      probability: 40
    },
    {
      id: 'man-c1-2',
      category: 'man',
      description: '숙련자 퇴직/이동',
      probability: 30
    },
    {
      id: 'man-c2-1',
      category: 'man',
      description: '인력 부족',
      probability: 50
    },
    {
      id: 'man-c3-1',
      category: 'man',
      description: '교육 예산 축소',
      probability: 25
    }
  ],
  rootCauses: [
    {
      id: 'man-root-1',
      category: 'man',
      description: '인력 운영 체계 미흡',
      probability: 60
    },
    {
      id: 'man-root-2',
      category: 'man',
      description: '교육 시스템 부재',
      probability: 40
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 불량이 발생했는가?',
      answer: '작업자가 작업 표준을 따르지 않았다',
      nextNodes: [
        {
          level: 2,
          question: '왜 작업 표준을 따르지 않았는가?',
          answer: '작업 표준에 대한 숙지가 부족했다',
          nextNodes: [
            {
              level: 3,
              question: '왜 숙지가 부족했는가?',
              answer: '교육을 받지 못했다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 교육을 받지 못했는가?',
                  answer: '교육 일정이 없었고, OJT도 부족했다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 교육 일정이 없었는가?',
                      answer: '체계적인 교육 시스템이 구축되어 있지 않다'
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

// Man 관련 대책
export const MAN_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'man-cm1',
    category: 'man',
    type: 'immediate',
    title: '불량 다발 작업자 교체 배치',
    description: '불량률이 높은 작업자를 단순 공정으로 교체 배치하고, 숙련자 투입',
    priority: 'critical',
    estimatedEffect: '불량률 30% 감소 예상',
    responsible: '생산관리팀장',
    kpi: [{ name: '불량률', target: 2.0, unit: '%' }]
  },
  {
    id: 'man-cm2',
    category: 'man',
    type: 'immediate',
    title: '긴급 OJT 실시',
    description: '불량 발생 공정에 대한 현장 교육 즉시 실시',
    priority: 'high',
    estimatedEffect: '작업 숙련도 향상',
    responsible: '공정기술팀',
    kpi: [{ name: '교육이수율', target: 100, unit: '%' }]
  },
  {
    id: 'man-cm3',
    category: 'man',
    type: 'shortTerm',
    title: '숙련도별 작업 배치 기준 수립',
    description: '작업자 숙련도에 따른 배치 기준을 수립하고, 난이도별 공정 분류',
    priority: 'high',
    estimatedEffect: '적정 인력 배치로 불량 감소',
    responsible: '인사팀, 생산팀',
    deadline: '2주 이내',
    kpi: [{ name: '숙련도 매칭률', target: 90, unit: '%' }]
  },
  {
    id: 'man-cm4',
    category: 'man',
    type: 'shortTerm',
    title: '교대 인수인계 체크리스트 적용',
    description: '교대 시 필수 인수인계 항목 체크리스트 작성 및 적용',
    priority: 'medium',
    estimatedEffect: '인수인계 오류 방지',
    responsible: '생산관리팀',
    deadline: '1주 이내',
    kpi: [{ name: '체크리스트 준수율', target: 100, unit: '%' }]
  },
  {
    id: 'man-cm5',
    category: 'man',
    type: 'longTerm',
    title: '다기능 작업자 양성 프로그램',
    description: '다양한 공정을 수행할 수 있는 다기능 작업자 양성',
    priority: 'medium',
    estimatedEffect: '인력 유연성 향상',
    responsible: '인사팀, 교육팀',
    deadline: '6개월',
    kpi: [{ name: '다기능공 비율', target: 30, unit: '%' }]
  },
  {
    id: 'man-cm6',
    category: 'man',
    type: 'longTerm',
    title: '체계적 교육 시스템 구축',
    description: '직무별, 숙련도별 교육 과정 수립 및 LMS 시스템 도입',
    priority: 'medium',
    estimatedEffect: '교육 체계화',
    responsible: '인사팀',
    deadline: '1년',
    kpi: [{ name: '교육 이수율', target: 95, unit: '%' }]
  },
  {
    id: 'man-cm7',
    category: 'man',
    type: 'preventive',
    title: '피로도 관리 시스템',
    description: '초과근무 제한, 휴식시간 확보, 작업 순환 배치',
    priority: 'medium',
    estimatedEffect: '휴먼에러 감소',
    responsible: '안전환경팀',
    kpi: [{ name: '초과근무 비율', target: 10, unit: '%' }]
  },
  {
    id: 'man-cm8',
    category: 'man',
    type: 'preventive',
    title: '작업자 동기부여 프로그램',
    description: '무결점 포상, 개선 제안 활동, 품질 서클 운영',
    priority: 'low',
    estimatedEffect: '품질 의식 향상',
    responsible: '인사팀',
    kpi: [{ name: '제안건수', target: 10, unit: '건/월' }]
  }
];

// Man 시나리오 정의
export const MAN_SCENARIOS: Scenario[] = [
  {
    id: 'man-scenario-1',
    category: 'man',
    title: '작업자 불량 분석',
    description: '작업자별 불량 현황을 분석하고 원인을 파악',
    keywords: ['작업자 불량', '작업자별', '누가', '담당자', '사람', '휴먼에러', '실수', '작업자 분석'],
    sqlTemplates: [MAN_SQL_TEMPLATES[0], MAN_SQL_TEMPLATES[1]],
    causeAnalysis: MAN_CAUSE_ANALYSIS,
    countermeasures: MAN_COUNTERMEASURES.filter(c => ['man-cm1', 'man-cm2', 'man-cm3'].includes(c.id)),
    relatedScenarios: ['man-scenario-2', 'method-scenario-1']
  },
  {
    id: 'man-scenario-2',
    category: 'man',
    title: '교육/숙련도 분석',
    description: '작업자 교육 현황 및 숙련도 분석',
    keywords: ['교육', '훈련', '숙련도', '스킬', '역량', '자격', '인증', '교육이수'],
    sqlTemplates: [MAN_SQL_TEMPLATES[1], MAN_SQL_TEMPLATES[3]],
    causeAnalysis: MAN_CAUSE_ANALYSIS,
    countermeasures: MAN_COUNTERMEASURES.filter(c => ['man-cm5', 'man-cm6'].includes(c.id)),
    relatedScenarios: ['man-scenario-1']
  },
  {
    id: 'man-scenario-3',
    category: 'man',
    title: '교대근무 분석',
    description: '교대별 생산성 및 품질 차이 분석',
    keywords: ['교대', '주간', '야간', '조', '1조', '2조', '3조', '근무조', '시프트'],
    sqlTemplates: [MAN_SQL_TEMPLATES[4]],
    causeAnalysis: MAN_CAUSE_ANALYSIS,
    countermeasures: MAN_COUNTERMEASURES.filter(c => ['man-cm4', 'man-cm7'].includes(c.id)),
    relatedScenarios: ['man-scenario-1']
  },
  {
    id: 'man-scenario-4',
    category: 'man',
    title: 'LOT 작업자 추적',
    description: '특정 LOT의 작업자 이력 추적',
    keywords: ['LOT', '로트', '작업자 추적', '누가 작업', '담당 작업자'],
    sqlTemplates: [MAN_SQL_TEMPLATES[2]],
    causeAnalysis: MAN_CAUSE_ANALYSIS,
    countermeasures: MAN_COUNTERMEASURES.filter(c => ['man-cm1', 'man-cm4'].includes(c.id)),
    relatedScenarios: ['material-scenario-3', 'machine-scenario-3']
  }
];

// Man 카테고리 매칭 함수
export function matchManScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of MAN_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Man 관련 SQL 파라미터 추출
export function extractManParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // LOT 번호 추출
  const lotMatch = query.match(/LOT[-\w]+/i);
  if (lotMatch) {
    params.lotNo = lotMatch[0];
  }

  // 날짜 범위 추출
  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  // 숙련도 추출
  const skillMatch = query.match(/(초급|중급|고급|전문가)/);
  if (skillMatch) {
    params.skillLevel = skillMatch[1];
  }

  // 교육유형 추출
  const trainingMatch = query.match(/(안전|품질|공정|장비)교육/);
  if (trainingMatch) {
    params.trainingType = trainingMatch[1];
  }

  return params;
}
