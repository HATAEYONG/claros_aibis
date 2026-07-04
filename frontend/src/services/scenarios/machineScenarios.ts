/**
 * Machine(설비) 시나리오 모듈
 * 설비, 장비, 고장, 정비, 가동률 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Machine 관련 SQL 템플릿
export const MACHINE_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'machine-status',
    name: '설비 가동 현황',
    description: '설비별 가동 상태 및 효율 조회',
    sql: `
      SELECT
        eq.equip_code,
        eq.equip_name,
        eq.equip_type,
        eq.status,
        eq.location,
        eq.install_date,
        DATEDIFF(CURDATE(), eq.last_maint_date) AS days_since_maint,
        eq.operating_hours,
        eq.planned_hours,
        ROUND(eq.operating_hours * 100.0 / NULLIF(eq.planned_hours, 0), 2) AS oee
      FROM PM_EQUIPMENT eq
      WHERE eq.status != 'DISPOSED'
        {{#if equipType}} AND eq.equip_type = '{{equipType}}' {{/if}}
        {{#if location}} AND eq.location LIKE '%{{location}}%' {{/if}}
      ORDER BY oee ASC
    `,
    parameters: [
      { name: 'equipType', type: 'string', required: false, extractPattern: '(CNC|프레스|사출|조립|검사)' },
      { name: 'location', type: 'string', required: false, extractPattern: '(\\d+)공장' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_code', displayName: '설비코드', type: 'string' },
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'equip_type', displayName: '설비유형', type: 'string' },
        { dbColumn: 'status', displayName: '상태', type: 'string' },
        { dbColumn: 'days_since_maint', displayName: '정비후경과(일)', type: 'number' },
        { dbColumn: 'operating_hours', displayName: '가동시간', type: 'number' },
        { dbColumn: 'oee', displayName: 'OEE(%)', type: 'percentage' }
      ],
      aggregations: [
        { type: 'avg', column: 'oee', displayName: '평균 OEE' }
      ]
    }
  },
  {
    id: 'machine-failure-history',
    name: '설비 고장 이력',
    description: '설비별 고장 이력 및 다운타임 조회',
    sql: `
      SELECT
        eq.equip_code,
        eq.equip_name,
        m.maint_id,
        m.maint_type,
        m.failure_type,
        m.failure_cause,
        m.maint_date,
        m.downtime_hours,
        m.repair_cost,
        m.technician,
        m.remarks
      FROM PM_EQUIPMENT eq
      JOIN PM_MAINTENANCE m ON eq.equip_code = m.equip_code
      WHERE m.maint_type IN ('BREAKDOWN', 'CORRECTIVE')
        {{#if startDate}} AND m.maint_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND m.maint_date <= '{{endDate}}' {{/if}}
        {{#if equipCode}} AND eq.equip_code = '{{equipCode}}' {{/if}}
      ORDER BY m.maint_date DESC
      LIMIT 50
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false },
      { name: 'equipCode', type: 'string', required: false, extractPattern: '(EQ[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'maint_type', displayName: '정비유형', type: 'string' },
        { dbColumn: 'failure_type', displayName: '고장유형', type: 'string' },
        { dbColumn: 'failure_cause', displayName: '고장원인', type: 'string' },
        { dbColumn: 'maint_date', displayName: '발생일', type: 'date' },
        { dbColumn: 'downtime_hours', displayName: '다운타임(h)', type: 'number' },
        { dbColumn: 'repair_cost', displayName: '수리비용', type: 'currency' }
      ],
      aggregations: [
        { type: 'sum', column: 'downtime_hours', displayName: '총 다운타임' },
        { type: 'sum', column: 'repair_cost', displayName: '총 수리비용' }
      ]
    }
  },
  {
    id: 'machine-defect-correlation',
    name: '설비-불량 상관분석',
    description: '설비별 불량 발생 현황 분석',
    sql: `
      SELECT
        eq.equip_code,
        eq.equip_name,
        COUNT(DISTINCT w.lot_no) AS lot_count,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) AS defect_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS defect_rate,
        GROUP_CONCAT(DISTINCT d.defect_type) AS defect_types
      FROM PM_EQUIPMENT eq
      JOIN PP_WORK_ORDER w ON eq.equip_code = w.equip_code
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      LEFT JOIN QM_DEFECT d ON w.lot_no = d.lot_no
      WHERE 1=1
        {{#if startDate}} AND w.start_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND w.start_date <= '{{endDate}}' {{/if}}
      GROUP BY eq.equip_code, eq.equip_name
      HAVING defect_count > 0
      ORDER BY defect_rate DESC
      LIMIT 20
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_code', displayName: '설비코드', type: 'string' },
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'lot_count', displayName: 'LOT수', type: 'number' },
        { dbColumn: 'defect_count', displayName: '불량건수', type: 'number' },
        { dbColumn: 'defect_rate', displayName: '불량률(%)', type: 'percentage' },
        { dbColumn: 'defect_types', displayName: '불량유형', type: 'string' }
      ]
    }
  },
  {
    id: 'machine-maintenance-schedule',
    name: '설비 정비 일정',
    description: '예정된 정비 일정 및 예방정비 현황',
    sql: `
      SELECT
        eq.equip_code,
        eq.equip_name,
        eq.equip_type,
        ms.schedule_id,
        ms.maint_type,
        ms.scheduled_date,
        ms.estimated_hours,
        ms.priority,
        ms.status,
        DATEDIFF(ms.scheduled_date, CURDATE()) AS days_until
      FROM PM_EQUIPMENT eq
      JOIN PM_MAINT_SCHEDULE ms ON eq.equip_code = ms.equip_code
      WHERE ms.status != 'COMPLETED'
        {{#if days}} AND ms.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL {{days}} DAY) {{/if}}
      ORDER BY ms.scheduled_date ASC
    `,
    parameters: [
      { name: 'days', type: 'number', required: false, defaultValue: 30 }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'maint_type', displayName: '정비유형', type: 'string' },
        { dbColumn: 'scheduled_date', displayName: '예정일', type: 'date' },
        { dbColumn: 'estimated_hours', displayName: '예상시간(h)', type: 'number' },
        { dbColumn: 'priority', displayName: '우선순위', type: 'string' },
        { dbColumn: 'days_until', displayName: 'D-Day', type: 'number' }
      ]
    }
  },
  {
    id: 'machine-lot-trace',
    name: 'LOT별 사용 설비',
    description: '특정 LOT의 설비 사용 이력 추적',
    sql: `
      SELECT
        w.lot_no,
        w.process_code,
        w.process_name,
        eq.equip_code,
        eq.equip_name,
        eq.status AS equip_status,
        w.start_date,
        w.end_date,
        w.qty_prod,
        CASE WHEN q.result = 'FAIL' THEN 'Y' ELSE 'N' END AS has_defect,
        m.last_maint_date,
        m.downtime_hours AS recent_downtime
      FROM PP_WORK_ORDER w
      JOIN PM_EQUIPMENT eq ON w.equip_code = eq.equip_code
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      LEFT JOIN (
        SELECT equip_code, MAX(maint_date) AS last_maint_date, SUM(downtime_hours) AS downtime_hours
        FROM PM_MAINTENANCE
        WHERE maint_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY equip_code
      ) m ON eq.equip_code = m.equip_code
      WHERE w.lot_no LIKE '%{{lotNo}}%'
      ORDER BY w.start_date
    `,
    parameters: [
      { name: 'lotNo', type: 'string', required: true, extractPattern: '(LOT[-\\w]+)' }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'lot_no', displayName: 'LOT번호', type: 'string' },
        { dbColumn: 'process_name', displayName: '공정', type: 'string' },
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'equip_status', displayName: '설비상태', type: 'string' },
        { dbColumn: 'start_date', displayName: '작업일', type: 'date' },
        { dbColumn: 'qty_prod', displayName: '생산량', type: 'number' },
        { dbColumn: 'has_defect', displayName: '불량여부', type: 'string' }
      ]
    }
  },
  {
    id: 'machine-mtbf-mttr',
    name: '설비 신뢰성 지표',
    description: 'MTBF, MTTR 등 설비 신뢰성 지표 분석',
    sql: `
      SELECT
        eq.equip_code,
        eq.equip_name,
        eq.equip_type,
        COUNT(m.maint_id) AS failure_count,
        SUM(m.downtime_hours) AS total_downtime,
        ROUND(eq.operating_hours / NULLIF(COUNT(m.maint_id), 0), 2) AS mtbf,
        ROUND(SUM(m.downtime_hours) / NULLIF(COUNT(m.maint_id), 0), 2) AS mttr,
        ROUND((eq.operating_hours - SUM(IFNULL(m.downtime_hours, 0))) * 100.0 / eq.operating_hours, 2) AS availability
      FROM PM_EQUIPMENT eq
      LEFT JOIN PM_MAINTENANCE m ON eq.equip_code = m.equip_code
        AND m.maint_type = 'BREAKDOWN'
        {{#if startDate}} AND m.maint_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND m.maint_date <= '{{endDate}}' {{/if}}
      WHERE eq.status != 'DISPOSED'
      GROUP BY eq.equip_code, eq.equip_name, eq.equip_type, eq.operating_hours
      ORDER BY mtbf ASC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'equip_name', displayName: '설비명', type: 'string' },
        { dbColumn: 'equip_type', displayName: '유형', type: 'string' },
        { dbColumn: 'failure_count', displayName: '고장횟수', type: 'number' },
        { dbColumn: 'total_downtime', displayName: '다운타임(h)', type: 'number' },
        { dbColumn: 'mtbf', displayName: 'MTBF(h)', type: 'number' },
        { dbColumn: 'mttr', displayName: 'MTTR(h)', type: 'number' },
        { dbColumn: 'availability', displayName: '가용률(%)', type: 'percentage' }
      ]
    }
  }
];

// Machine 관련 원인 분석 템플릿
export const MACHINE_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'machine-c1',
      category: 'machine',
      description: '설비 노후화',
      probability: 30,
      evidence: ['사용연수 초과', '부품 마모', '정밀도 저하'],
      sqlQuery: `SELECT * FROM PM_EQUIPMENT WHERE DATEDIFF(CURDATE(), install_date) > 365 * 10`
    },
    {
      id: 'machine-c2',
      category: 'machine',
      description: '예방정비 미흡',
      probability: 25,
      evidence: ['정비 주기 초과', 'PM 미실시', '점검 누락'],
      sqlQuery: `SELECT * FROM PM_EQUIPMENT WHERE DATEDIFF(CURDATE(), last_maint_date) > 90`
    },
    {
      id: 'machine-c3',
      category: 'machine',
      description: '설비 세팅 오류',
      probability: 20,
      evidence: ['파라미터 오설정', '금형 오장착', '조건 변경'],
      sqlQuery: `SELECT * FROM QM_DEFECT WHERE cause LIKE '%설정%' OR cause LIKE '%세팅%'`
    },
    {
      id: 'machine-c4',
      category: 'machine',
      description: '과부하 운전',
      probability: 15,
      evidence: ['연속 운전', '과속 운전', '과적 운전'],
      sqlQuery: `SELECT * FROM PM_EQUIPMENT WHERE operating_hours > planned_hours * 1.2`
    },
    {
      id: 'machine-c5',
      category: 'machine',
      description: '부품 고장',
      probability: 10,
      evidence: ['소모품 마모', '부품 파손', '누유/누기'],
      sqlQuery: `SELECT * FROM PM_MAINTENANCE WHERE failure_type LIKE '%부품%'`
    }
  ],
  secondaryCauses: [
    {
      id: 'machine-c1-1',
      category: 'machine',
      description: '설비 투자 부족',
      probability: 40
    },
    {
      id: 'machine-c2-1',
      category: 'machine',
      description: '정비 인력 부족',
      probability: 35
    },
    {
      id: 'machine-c3-1',
      category: 'man',
      description: '작업자 숙련도 부족',
      probability: 25
    }
  ],
  rootCauses: [
    {
      id: 'machine-root-1',
      category: 'machine',
      description: 'TPM 체계 미구축',
      probability: 50
    },
    {
      id: 'machine-root-2',
      category: 'machine',
      description: '설비 관리 체계 부재',
      probability: 50
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 설비에서 불량이 발생했는가?',
      answer: '설비 정밀도가 떨어졌다',
      nextNodes: [
        {
          level: 2,
          question: '왜 정밀도가 떨어졌는가?',
          answer: '정기 정비가 제때 이루어지지 않았다',
          nextNodes: [
            {
              level: 3,
              question: '왜 정비가 제때 이루어지지 않았는가?',
              answer: '정비 일정이 생산 일정에 밀렸다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 생산 일정에 밀렸는가?',
                  answer: '정비의 중요성 인식 부족과 대체 설비가 없다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 대체 설비가 없는가?',
                      answer: 'TPM 체계와 설비 투자 계획이 없다'
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

// Machine 관련 대책
export const MACHINE_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'machine-cm1',
    category: 'machine',
    type: 'immediate',
    title: '긴급 설비 점검 및 정비',
    description: '불량 발생 설비 즉시 가동 중단 후 정밀 점검 및 정비 실시',
    priority: 'critical',
    estimatedEffect: '설비 기인 불량 제거',
    responsible: '보전팀',
    kpi: [{ name: '다운타임', target: 4, unit: '시간' }]
  },
  {
    id: 'machine-cm2',
    category: 'machine',
    type: 'immediate',
    title: '설비 파라미터 재설정',
    description: '표준 작업 조건으로 설비 파라미터 재설정 및 검증',
    priority: 'high',
    estimatedEffect: '세팅 오류 방지',
    responsible: '생산기술팀',
    kpi: [{ name: '세팅 불량률', target: 0.5, unit: '%' }]
  },
  {
    id: 'machine-cm3',
    category: 'machine',
    type: 'shortTerm',
    title: '예방정비(PM) 강화',
    description: 'PM 주기 준수 및 점검 항목 보완',
    priority: 'high',
    estimatedEffect: '돌발 고장 50% 감소',
    responsible: '보전팀',
    deadline: '2주',
    kpi: [{ name: 'PM 준수율', target: 95, unit: '%' }]
  },
  {
    id: 'machine-cm4',
    category: 'machine',
    type: 'shortTerm',
    title: '설비 조건 모니터링 시스템',
    description: '주요 설비 상태 실시간 모니터링 시스템 구축',
    priority: 'medium',
    estimatedEffect: '이상 조기 감지',
    responsible: '스마트팩토리팀',
    deadline: '1개월',
    kpi: [{ name: '모니터링 설비', target: 80, unit: '%' }]
  },
  {
    id: 'machine-cm5',
    category: 'machine',
    type: 'longTerm',
    title: 'TPM 체계 구축',
    description: '전사적 생산보전 활동 체계 구축 및 자주보전 활동 전개',
    priority: 'high',
    estimatedEffect: 'OEE 85% 달성',
    responsible: '생산관리팀',
    deadline: '6개월',
    kpi: [{ name: 'OEE', target: 85, unit: '%' }]
  },
  {
    id: 'machine-cm6',
    category: 'machine',
    type: 'longTerm',
    title: '노후 설비 교체/업그레이드',
    description: '사용연수 초과 및 고장 다발 설비 교체 또는 오버홀',
    priority: 'medium',
    estimatedEffect: '설비 신뢰성 향상',
    responsible: '기술팀',
    deadline: '1년',
    kpi: [{ name: 'MTBF', target: 500, unit: '시간' }]
  },
  {
    id: 'machine-cm7',
    category: 'machine',
    type: 'preventive',
    title: '설비 일상점검 체크리스트',
    description: '작업자 일상점검 체크리스트 작성 및 시행',
    priority: 'medium',
    estimatedEffect: '이상 조기 발견',
    responsible: '생산팀',
    kpi: [{ name: '점검 실시율', target: 100, unit: '%' }]
  },
  {
    id: 'machine-cm8',
    category: 'machine',
    type: 'preventive',
    title: '예비 부품 관리',
    description: '핵심 부품 예비품 확보 및 적정 재고 유지',
    priority: 'low',
    estimatedEffect: '복구 시간 단축',
    responsible: '자재팀',
    kpi: [{ name: 'MTTR', target: 2, unit: '시간' }]
  }
];

// Machine 시나리오 정의
export const MACHINE_SCENARIOS: Scenario[] = [
  {
    id: 'machine-scenario-1',
    category: 'machine',
    title: '설비 가동률 분석',
    description: '설비 가동 현황 및 OEE 분석',
    keywords: ['설비', '가동률', 'OEE', '가동', '효율', '설비효율', '종합효율'],
    sqlTemplates: [MACHINE_SQL_TEMPLATES[0], MACHINE_SQL_TEMPLATES[5]],
    causeAnalysis: MACHINE_CAUSE_ANALYSIS,
    countermeasures: MACHINE_COUNTERMEASURES.filter(c => ['machine-cm3', 'machine-cm5'].includes(c.id)),
    relatedScenarios: ['machine-scenario-2']
  },
  {
    id: 'machine-scenario-2',
    category: 'machine',
    title: '설비 고장 분석',
    description: '설비 고장 이력 및 원인 분석',
    keywords: ['고장', '다운타임', '장애', 'breakdown', '정지', '멈춤', '설비 문제'],
    sqlTemplates: [MACHINE_SQL_TEMPLATES[1], MACHINE_SQL_TEMPLATES[5]],
    causeAnalysis: MACHINE_CAUSE_ANALYSIS,
    countermeasures: MACHINE_COUNTERMEASURES.filter(c => ['machine-cm1', 'machine-cm3', 'machine-cm6'].includes(c.id)),
    relatedScenarios: ['machine-scenario-1', 'machine-scenario-3']
  },
  {
    id: 'machine-scenario-3',
    category: 'machine',
    title: '설비-불량 연관 분석',
    description: '설비와 불량 발생의 상관관계 분석',
    keywords: ['설비 불량', '기계 불량', '설비별 불량', '설비 원인', '장비 문제'],
    sqlTemplates: [MACHINE_SQL_TEMPLATES[2]],
    causeAnalysis: MACHINE_CAUSE_ANALYSIS,
    countermeasures: MACHINE_COUNTERMEASURES.filter(c => ['machine-cm1', 'machine-cm2', 'machine-cm4'].includes(c.id)),
    relatedScenarios: ['measurement-scenario-1']
  },
  {
    id: 'machine-scenario-4',
    category: 'machine',
    title: '정비 일정 관리',
    description: '설비 정비 일정 및 예방정비 현황',
    keywords: ['정비', 'PM', '예방정비', '정비일정', '점검', '보전'],
    sqlTemplates: [MACHINE_SQL_TEMPLATES[3]],
    causeAnalysis: MACHINE_CAUSE_ANALYSIS,
    countermeasures: MACHINE_COUNTERMEASURES.filter(c => ['machine-cm3', 'machine-cm7'].includes(c.id)),
    relatedScenarios: ['machine-scenario-1']
  },
  {
    id: 'machine-scenario-5',
    category: 'machine',
    title: 'LOT 설비 추적',
    description: '특정 LOT의 설비 사용 이력 추적',
    keywords: ['LOT 설비', '로트 설비', '어느 설비', '사용 설비'],
    sqlTemplates: [MACHINE_SQL_TEMPLATES[4]],
    causeAnalysis: MACHINE_CAUSE_ANALYSIS,
    countermeasures: MACHINE_COUNTERMEASURES.filter(c => ['machine-cm1', 'machine-cm2'].includes(c.id)),
    relatedScenarios: ['man-scenario-4', 'material-scenario-3']
  }
];

// Machine 카테고리 매칭 함수
export function matchMachineScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of MACHINE_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Machine 관련 SQL 파라미터 추출
export function extractMachineParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // 설비 코드 추출
  const equipMatch = query.match(/EQ[-\w]+/i);
  if (equipMatch) {
    params.equipCode = equipMatch[0];
  }

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

  // 설비 유형 추출
  const typeMatch = query.match(/(CNC|프레스|사출|조립|검사)/);
  if (typeMatch) {
    params.equipType = typeMatch[1];
  }

  // 일수 추출
  const daysMatch = query.match(/(\d+)일/);
  if (daysMatch) {
    params.days = parseInt(daysMatch[1]);
  }

  return params;
}
