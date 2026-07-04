/**
 * Mother Nature(환경) 시나리오 모듈
 * 환경, 온도, 습도, 청정도, ESG 관련 시나리오
 */

import { Scenario, SQLTemplate, CauseAnalysis, Countermeasure } from './types';

// Mother Nature 관련 SQL 템플릿
export const MOTHER_NATURE_SQL_TEMPLATES: SQLTemplate[] = [
  {
    id: 'environment-monitoring',
    name: '환경 모니터링 현황',
    description: '작업장 환경 조건(온도, 습도 등) 모니터링',
    sql: `
      SELECT
        em.zone_code,
        em.zone_name,
        em.measurement_time,
        em.temperature,
        em.humidity,
        em.dust_level,
        em.noise_level,
        em.illuminance,
        CASE
          WHEN em.temperature > em.temp_usl OR em.temperature < em.temp_lsl THEN '온도이상'
          WHEN em.humidity > em.hum_usl OR em.humidity < em.hum_lsl THEN '습도이상'
          WHEN em.dust_level > em.dust_limit THEN '분진이상'
          ELSE '정상'
        END AS status
      FROM ENV_MONITORING em
      WHERE 1=1
        {{#if zoneCode}} AND em.zone_code = '{{zoneCode}}' {{/if}}
        {{#if startDate}} AND em.measurement_time >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND em.measurement_time <= '{{endDate}}' {{/if}}
      ORDER BY em.measurement_time DESC
      LIMIT 100
    `,
    parameters: [
      { name: 'zoneCode', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'zone_name', displayName: '구역', type: 'string' },
        { dbColumn: 'measurement_time', displayName: '측정시간', type: 'date' },
        { dbColumn: 'temperature', displayName: '온도(℃)', type: 'number' },
        { dbColumn: 'humidity', displayName: '습도(%)', type: 'number' },
        { dbColumn: 'dust_level', displayName: '분진(㎍/㎥)', type: 'number' },
        { dbColumn: 'noise_level', displayName: '소음(dB)', type: 'number' },
        { dbColumn: 'status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'environment-abnormal',
    name: '환경 이상 이력',
    description: '환경 조건 이상 발생 이력 조회',
    sql: `
      SELECT
        ea.alert_id,
        ea.zone_code,
        z.zone_name,
        ea.alert_type,
        ea.measured_value,
        ea.limit_value,
        ea.alert_time,
        ea.resolved_time,
        TIMESTAMPDIFF(MINUTE, ea.alert_time, IFNULL(ea.resolved_time, NOW())) AS duration_min,
        ea.action_taken,
        ea.status
      FROM ENV_ALERT ea
      JOIN ENV_ZONE z ON ea.zone_code = z.zone_code
      WHERE 1=1
        {{#if alertType}} AND ea.alert_type = '{{alertType}}' {{/if}}
        {{#if startDate}} AND ea.alert_time >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND ea.alert_time <= '{{endDate}}' {{/if}}
      ORDER BY ea.alert_time DESC
      LIMIT 50
    `,
    parameters: [
      { name: 'alertType', type: 'string', required: false, extractPattern: '(온도|습도|분진|소음)' },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'zone_name', displayName: '구역', type: 'string' },
        { dbColumn: 'alert_type', displayName: '이상유형', type: 'string' },
        { dbColumn: 'measured_value', displayName: '측정값', type: 'number' },
        { dbColumn: 'limit_value', displayName: '기준값', type: 'number' },
        { dbColumn: 'alert_time', displayName: '발생시간', type: 'date' },
        { dbColumn: 'duration_min', displayName: '지속(분)', type: 'number' },
        { dbColumn: 'action_taken', displayName: '조치사항', type: 'string' },
        { dbColumn: 'status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'environment-defect-correlation',
    name: '환경-불량 상관분석',
    description: '환경 조건과 불량 발생의 상관관계 분석',
    sql: `
      SELECT
        DATE(em.measurement_time) AS date,
        em.zone_code,
        ROUND(AVG(em.temperature), 1) AS avg_temp,
        ROUND(AVG(em.humidity), 1) AS avg_humidity,
        COUNT(DISTINCT d.defect_id) AS defect_count,
        SUM(d.defect_qty) AS defect_qty,
        GROUP_CONCAT(DISTINCT d.defect_type) AS defect_types
      FROM ENV_MONITORING em
      LEFT JOIN PP_WORK_ORDER w ON em.zone_code = w.zone_code
        AND DATE(em.measurement_time) = DATE(w.start_date)
      LEFT JOIN QM_DEFECT d ON w.lot_no = d.lot_no
      WHERE 1=1
        {{#if startDate}} AND em.measurement_time >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND em.measurement_time <= '{{endDate}}' {{/if}}
      GROUP BY DATE(em.measurement_time), em.zone_code
      HAVING defect_count > 0
      ORDER BY defect_count DESC
    `,
    parameters: [
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'date', displayName: '일자', type: 'date' },
        { dbColumn: 'zone_code', displayName: '구역', type: 'string' },
        { dbColumn: 'avg_temp', displayName: '평균온도', type: 'number' },
        { dbColumn: 'avg_humidity', displayName: '평균습도', type: 'number' },
        { dbColumn: 'defect_count', displayName: '불량건수', type: 'number' },
        { dbColumn: 'defect_qty', displayName: '불량수량', type: 'number' },
        { dbColumn: 'defect_types', displayName: '불량유형', type: 'string' }
      ]
    }
  },
  {
    id: 'environment-energy',
    name: '에너지 사용 현황',
    description: '에너지(전력, 가스 등) 사용량 현황',
    sql: `
      SELECT
        eu.usage_date,
        eu.energy_type,
        eu.zone_code,
        z.zone_name,
        eu.usage_amount,
        eu.unit,
        eu.cost,
        ROUND(eu.usage_amount * 100.0 / eu.target_amount, 2) AS usage_rate,
        eu.target_amount,
        CASE
          WHEN eu.usage_amount > eu.target_amount THEN '초과'
          WHEN eu.usage_amount > eu.target_amount * 0.9 THEN '주의'
          ELSE '정상'
        END AS status
      FROM ENV_ENERGY_USAGE eu
      JOIN ENV_ZONE z ON eu.zone_code = z.zone_code
      WHERE 1=1
        {{#if energyType}} AND eu.energy_type = '{{energyType}}' {{/if}}
        {{#if startDate}} AND eu.usage_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND eu.usage_date <= '{{endDate}}' {{/if}}
      ORDER BY eu.usage_date DESC
    `,
    parameters: [
      { name: 'energyType', type: 'string', required: false, extractPattern: '(전력|가스|용수|압축공기)' },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'usage_date', displayName: '일자', type: 'date' },
        { dbColumn: 'energy_type', displayName: '에너지유형', type: 'string' },
        { dbColumn: 'zone_name', displayName: '구역', type: 'string' },
        { dbColumn: 'usage_amount', displayName: '사용량', type: 'number' },
        { dbColumn: 'unit', displayName: '단위', type: 'string' },
        { dbColumn: 'cost', displayName: '비용', type: 'currency' },
        { dbColumn: 'usage_rate', displayName: '사용률(%)', type: 'percentage' },
        { dbColumn: 'status', displayName: '상태', type: 'string' }
      ]
    }
  },
  {
    id: 'environment-waste',
    name: '폐기물 발생 현황',
    description: '폐기물 발생 및 처리 현황',
    sql: `
      SELECT
        wd.waste_date,
        wd.waste_type,
        wd.waste_category,
        wd.source_zone,
        wd.amount,
        wd.unit,
        wd.disposal_method,
        wd.disposal_company,
        wd.disposal_cost,
        wd.status
      FROM ENV_WASTE_DISPOSAL wd
      WHERE 1=1
        {{#if wasteType}} AND wd.waste_type = '{{wasteType}}' {{/if}}
        {{#if startDate}} AND wd.waste_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND wd.waste_date <= '{{endDate}}' {{/if}}
      ORDER BY wd.waste_date DESC
    `,
    parameters: [
      { name: 'wasteType', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'waste_date', displayName: '일자', type: 'date' },
        { dbColumn: 'waste_type', displayName: '폐기물유형', type: 'string' },
        { dbColumn: 'waste_category', displayName: '분류', type: 'string' },
        { dbColumn: 'source_zone', displayName: '발생구역', type: 'string' },
        { dbColumn: 'amount', displayName: '발생량', type: 'number' },
        { dbColumn: 'disposal_method', displayName: '처리방법', type: 'string' },
        { dbColumn: 'disposal_cost', displayName: '처리비용', type: 'currency' }
      ]
    }
  },
  {
    id: 'environment-safety',
    name: '안전 사고 현황',
    description: '안전 사고 발생 및 조치 현황',
    sql: `
      SELECT
        sa.accident_id,
        sa.accident_date,
        sa.accident_type,
        sa.severity,
        sa.location,
        sa.description,
        e.emp_name AS victim_name,
        sa.injury_type,
        sa.lost_days,
        sa.root_cause,
        sa.corrective_action,
        sa.status
      FROM ENV_SAFETY_ACCIDENT sa
      LEFT JOIN HR_EMPLOYEE e ON sa.victim_id = e.emp_id
      WHERE 1=1
        {{#if accidentType}} AND sa.accident_type = '{{accidentType}}' {{/if}}
        {{#if startDate}} AND sa.accident_date >= '{{startDate}}' {{/if}}
        {{#if endDate}} AND sa.accident_date <= '{{endDate}}' {{/if}}
      ORDER BY sa.accident_date DESC
    `,
    parameters: [
      { name: 'accidentType', type: 'string', required: false },
      { name: 'startDate', type: 'date', required: false },
      { name: 'endDate', type: 'date', required: false }
    ],
    resultMapping: {
      columns: [
        { dbColumn: 'accident_date', displayName: '발생일', type: 'date' },
        { dbColumn: 'accident_type', displayName: '사고유형', type: 'string' },
        { dbColumn: 'severity', displayName: '심각도', type: 'string' },
        { dbColumn: 'location', displayName: '발생장소', type: 'string' },
        { dbColumn: 'victim_name', displayName: '재해자', type: 'string' },
        { dbColumn: 'lost_days', displayName: '근로손실일', type: 'number' },
        { dbColumn: 'root_cause', displayName: '원인', type: 'string' },
        { dbColumn: 'status', displayName: '상태', type: 'string' }
      ]
    }
  }
];

// Mother Nature 관련 원인 분석 템플릿
export const MOTHER_NATURE_CAUSE_ANALYSIS: CauseAnalysis = {
  primaryCauses: [
    {
      id: 'env-c1',
      category: 'motherNature',
      description: '온습도 조건 부적합',
      probability: 35,
      evidence: ['온도 범위 이탈', '습도 관리 미흡', '계절 변화'],
      sqlQuery: `SELECT * FROM ENV_ALERT WHERE alert_type IN ('온도', '습도')`
    },
    {
      id: 'env-c2',
      category: 'motherNature',
      description: '청정도 불량',
      probability: 25,
      evidence: ['분진 과다', '오염', '이물질'],
      sqlQuery: `SELECT * FROM ENV_MONITORING WHERE dust_level > dust_limit`
    },
    {
      id: 'env-c3',
      category: 'motherNature',
      description: '조명/조도 부족',
      probability: 15,
      evidence: ['조도 부족', '그림자', '눈부심'],
      sqlQuery: `SELECT * FROM ENV_MONITORING WHERE illuminance < 300`
    },
    {
      id: 'env-c4',
      category: 'motherNature',
      description: '진동/소음',
      probability: 15,
      evidence: ['과도한 진동', '소음', '외부 충격'],
      sqlQuery: `SELECT * FROM ENV_MONITORING WHERE noise_level > 85`
    },
    {
      id: 'env-c5',
      category: 'motherNature',
      description: '계절/날씨 변화',
      probability: 10,
      evidence: ['장마철', '극한 기온', '습도 변화'],
      sqlQuery: `SELECT * FROM ENV_MONITORING WHERE temperature > 35 OR temperature < 5`
    }
  ],
  secondaryCauses: [
    {
      id: 'env-c1-1',
      category: 'machine',
      description: '공조 설비 고장',
      probability: 40
    },
    {
      id: 'env-c2-1',
      category: 'method',
      description: '청소/정리정돈 미흡',
      probability: 35
    },
    {
      id: 'env-c3-1',
      category: 'motherNature',
      description: '시설 노후화',
      probability: 25
    }
  ],
  rootCauses: [
    {
      id: 'env-root-1',
      category: 'motherNature',
      description: '환경 관리 체계 미흡',
      probability: 55
    },
    {
      id: 'env-root-2',
      category: 'motherNature',
      description: '시설 투자 부족',
      probability: 45
    }
  ],
  whyChain: [
    {
      level: 1,
      question: '왜 환경으로 인한 불량이 발생했는가?',
      answer: '작업장 온도가 규격을 벗어났다',
      nextNodes: [
        {
          level: 2,
          question: '왜 온도가 규격을 벗어났는가?',
          answer: '에어컨이 고장났다',
          nextNodes: [
            {
              level: 3,
              question: '왜 에어컨이 고장났는가?',
              answer: '예방정비가 실시되지 않았다',
              nextNodes: [
                {
                  level: 4,
                  question: '왜 예방정비가 실시되지 않았는가?',
                  answer: '공조설비 관리 계획이 없다',
                  nextNodes: [
                    {
                      level: 5,
                      question: '왜 관리 계획이 없는가?',
                      answer: '환경 설비 관리 체계가 구축되어 있지 않다'
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

// Mother Nature 관련 대책
export const MOTHER_NATURE_COUNTERMEASURES: Countermeasure[] = [
  {
    id: 'env-cm1',
    category: 'motherNature',
    type: 'immediate',
    title: '환경 조건 긴급 조정',
    description: '온습도 등 환경 조건 즉시 조정 및 안정화',
    priority: 'critical',
    estimatedEffect: '작업 환경 정상화',
    responsible: '시설관리팀',
    kpi: [{ name: '환경조건 달성', target: 100, unit: '%' }]
  },
  {
    id: 'env-cm2',
    category: 'motherNature',
    type: 'immediate',
    title: '임시 환경 개선 조치',
    description: '휴대용 냉난방기, 제습기, 공기청정기 등 임시 조치',
    priority: 'high',
    estimatedEffect: '응급 환경 개선',
    responsible: '생산팀',
    kpi: [{ name: '조치 완료시간', target: 2, unit: '시간' }]
  },
  {
    id: 'env-cm3',
    category: 'motherNature',
    type: 'shortTerm',
    title: '환경 모니터링 강화',
    description: '환경 센서 추가 설치 및 모니터링 주기 단축',
    priority: 'high',
    estimatedEffect: '이상 조기 감지',
    responsible: '시설관리팀',
    deadline: '1주',
    kpi: [{ name: '모니터링 구역', target: 100, unit: '%' }]
  },
  {
    id: 'env-cm4',
    category: 'motherNature',
    type: 'shortTerm',
    title: '공조설비 점검/정비',
    description: '에어컨, 환기팬, 집진기 등 공조설비 점검 및 정비',
    priority: 'high',
    estimatedEffect: '환경 안정화',
    responsible: '시설관리팀',
    deadline: '2주',
    kpi: [{ name: '설비 가동률', target: 98, unit: '%' }]
  },
  {
    id: 'env-cm5',
    category: 'motherNature',
    type: 'longTerm',
    title: '환경 관리 시스템 구축',
    description: '실시간 환경 모니터링 및 자동 제어 시스템 구축',
    priority: 'high',
    estimatedEffect: '환경 자동 관리',
    responsible: '스마트팩토리팀',
    deadline: '3개월',
    kpi: [{ name: '자동제어 구역', target: 80, unit: '%' }]
  },
  {
    id: 'env-cm6',
    category: 'motherNature',
    type: 'longTerm',
    title: '클린룸 등급 향상',
    description: '청정도 등급 향상을 위한 시설 개선',
    priority: 'medium',
    estimatedEffect: '청정도 향상',
    responsible: '시설관리팀',
    deadline: '6개월',
    kpi: [{ name: '클린룸 등급', target: 7, unit: 'Class' }]
  },
  {
    id: 'env-cm7',
    category: 'motherNature',
    type: 'preventive',
    title: '에너지 절감 활동',
    description: '에너지 사용량 모니터링 및 절감 활동 전개',
    priority: 'medium',
    estimatedEffect: 'ESG 목표 달성',
    responsible: '환경안전팀',
    kpi: [{ name: '에너지 절감률', target: 10, unit: '%' }]
  },
  {
    id: 'env-cm8',
    category: 'motherNature',
    type: 'preventive',
    title: '안전 순찰 강화',
    description: '안전 위험 요소 발굴 및 개선을 위한 순찰 강화',
    priority: 'high',
    estimatedEffect: '안전사고 예방',
    responsible: '안전환경팀',
    kpi: [{ name: '무재해 일수', target: 365, unit: '일' }]
  }
];

// Mother Nature 시나리오 정의
export const MOTHER_NATURE_SCENARIOS: Scenario[] = [
  {
    id: 'env-scenario-1',
    category: 'motherNature',
    title: '환경 모니터링',
    description: '작업장 환경 조건(온도, 습도 등) 모니터링',
    keywords: ['환경', '온도', '습도', '분진', '조도', '작업환경', '청정'],
    sqlTemplates: [MOTHER_NATURE_SQL_TEMPLATES[0]],
    causeAnalysis: MOTHER_NATURE_CAUSE_ANALYSIS,
    countermeasures: MOTHER_NATURE_COUNTERMEASURES.filter(c => ['env-cm1', 'env-cm3'].includes(c.id)),
    relatedScenarios: ['env-scenario-2']
  },
  {
    id: 'env-scenario-2',
    category: 'motherNature',
    title: '환경 이상 분석',
    description: '환경 조건 이상 발생 이력 및 원인 분석',
    keywords: ['환경이상', '온도이상', '습도이상', '환경문제', '환경 불량'],
    sqlTemplates: [MOTHER_NATURE_SQL_TEMPLATES[1], MOTHER_NATURE_SQL_TEMPLATES[2]],
    causeAnalysis: MOTHER_NATURE_CAUSE_ANALYSIS,
    countermeasures: MOTHER_NATURE_COUNTERMEASURES.filter(c => ['env-cm1', 'env-cm4', 'env-cm5'].includes(c.id)),
    relatedScenarios: ['env-scenario-1', 'measurement-scenario-1']
  },
  {
    id: 'env-scenario-3',
    category: 'motherNature',
    title: '에너지 사용 분석',
    description: '에너지(전력, 가스 등) 사용량 및 비용 분석',
    keywords: ['에너지', '전력', '가스', '용수', '유틸리티', '에너지비용', 'ESG'],
    sqlTemplates: [MOTHER_NATURE_SQL_TEMPLATES[3]],
    causeAnalysis: MOTHER_NATURE_CAUSE_ANALYSIS,
    countermeasures: MOTHER_NATURE_COUNTERMEASURES.filter(c => ['env-cm7'].includes(c.id)),
    relatedScenarios: []
  },
  {
    id: 'env-scenario-4',
    category: 'motherNature',
    title: '폐기물 관리',
    description: '폐기물 발생 및 처리 현황 분석',
    keywords: ['폐기물', '환경', '처리', '폐수', '배출', '재활용'],
    sqlTemplates: [MOTHER_NATURE_SQL_TEMPLATES[4]],
    causeAnalysis: MOTHER_NATURE_CAUSE_ANALYSIS,
    countermeasures: MOTHER_NATURE_COUNTERMEASURES.filter(c => ['env-cm7'].includes(c.id)),
    relatedScenarios: []
  },
  {
    id: 'env-scenario-5',
    category: 'motherNature',
    title: '안전 사고 분석',
    description: '안전 사고 발생 현황 및 예방 대책',
    keywords: ['안전', '사고', '재해', '안전사고', '위험', '재해예방'],
    sqlTemplates: [MOTHER_NATURE_SQL_TEMPLATES[5]],
    causeAnalysis: MOTHER_NATURE_CAUSE_ANALYSIS,
    countermeasures: MOTHER_NATURE_COUNTERMEASURES.filter(c => ['env-cm8'].includes(c.id)),
    relatedScenarios: ['man-scenario-1']
  }
];

// Mother Nature 카테고리 매칭 함수
export function matchMotherNatureScenario(query: string): Scenario | null {
  const lowerQuery = query.toLowerCase();

  for (const scenario of MOTHER_NATURE_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

// Mother Nature 관련 SQL 파라미터 추출
export function extractMotherNatureParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  // 날짜 추출
  const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/g);
  if (dateMatch && dateMatch.length >= 2) {
    params.startDate = dateMatch[0];
    params.endDate = dateMatch[1];
  }

  // 이상 유형 추출
  const alertMatch = query.match(/(온도|습도|분진|소음)/);
  if (alertMatch) {
    params.alertType = alertMatch[1];
  }

  // 에너지 유형 추출
  const energyMatch = query.match(/(전력|가스|용수|압축공기)/);
  if (energyMatch) {
    params.energyType = energyMatch[1];
  }

  return params;
}
