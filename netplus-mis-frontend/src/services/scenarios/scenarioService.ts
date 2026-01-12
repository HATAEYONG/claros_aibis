/**
 * 통합 시나리오 서비스
 * 6M 기반 시나리오 매칭, SQL 생성, 분석 실행을 통합 관리
 */

import {
  Scenario,
  SixMCategory,
  NLPResult,
  ScenarioIntent,
  ExtractedEntity,
  ScenarioResult,
  SIX_M_METADATA,
  SQLTemplate,
  Countermeasure
} from './types';

import { MAN_SCENARIOS, matchManScenario, extractManParams } from './manScenarios';
import { MACHINE_SCENARIOS, matchMachineScenario, extractMachineParams } from './machineScenarios';
import { MATERIAL_SCENARIOS, matchMaterialScenario, extractMaterialParams } from './materialScenarios';
import { METHOD_SCENARIOS, matchMethodScenario, extractMethodParams } from './methodScenarios';
import { MEASUREMENT_SCENARIOS, matchMeasurementScenario, extractMeasurementParams } from './measurementScenarios';
import { MOTHER_NATURE_SCENARIOS, matchMotherNatureScenario, extractMotherNatureParams } from './motherNatureScenarios';

import { executeSQL } from '../apiService';

// 모든 시나리오 통합
export const ALL_SCENARIOS: Scenario[] = [
  ...MAN_SCENARIOS,
  ...MACHINE_SCENARIOS,
  ...MATERIAL_SCENARIOS,
  ...METHOD_SCENARIOS,
  ...MEASUREMENT_SCENARIOS,
  ...MOTHER_NATURE_SCENARIOS
];

// 의도(Intent) 키워드 매핑
const INTENT_KEYWORDS: Record<ScenarioIntent, string[]> = {
  query: ['조회', '보여줘', '알려줘', '현황', '목록', '리스트', '몇', '얼마'],
  analyze: ['분석', '분석해', '파악', '확인', '살펴', '검토'],
  findCause: ['원인', '왜', '이유', '문제', '발생', '왜그래'],
  suggestAction: ['대책', '해결', '개선', '어떻게', '방안', '조치', '대응'],
  trace: ['추적', '이력', '흐름', 'LOT', '로트', '어디서', '경로'],
  compare: ['비교', '대비', '차이', '변화', 'vs'],
  predict: ['예측', '예상', '전망', '될까', '가능성'],
  report: ['리포트', '보고서', '요약', '종합']
};

// 자연어 처리 및 의도 파악
export function analyzeQuery(query: string): NLPResult {
  const lowerQuery = query.toLowerCase();

  // 1. 의도 파악
  let intent: ScenarioIntent = 'query';
  let maxScore = 0;

  for (const [intentType, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const score = keywords.filter(kw => lowerQuery.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      intent = intentType as ScenarioIntent;
    }
  }

  // 2. 엔티티 추출
  const entities: ExtractedEntity[] = [];

  // LOT 번호 추출
  const lotMatches = query.matchAll(/LOT[-\w]+/gi);
  for (const match of lotMatches) {
    entities.push({
      type: 'lotNo',
      value: match[0],
      originalText: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length]
    });
  }

  // 날짜 추출
  const dateMatches = query.matchAll(/(\d{4}[-/]\d{2}[-/]\d{2})/g);
  for (const match of dateMatches) {
    entities.push({
      type: 'date',
      value: match[1].replace(/\//g, '-'),
      originalText: match[0],
      position: [match.index || 0, (match.index || 0) + match[0].length]
    });
  }

  // 숫자 추출
  const numMatches = query.matchAll(/(\d+)(%|개|건|명)?/g);
  for (const match of numMatches) {
    if (!query.substring(Math.max(0, (match.index || 0) - 10), match.index).includes('LOT') &&
        !query.substring(Math.max(0, (match.index || 0) - 5), match.index).includes('-')) {
      entities.push({
        type: match[2] === '%' ? 'percentage' : 'number',
        value: parseInt(match[1]),
        originalText: match[0],
        position: [match.index || 0, (match.index || 0) + match[0].length]
      });
    }
  }

  // 3. 6M 카테고리 파악
  let category: SixMCategory | null = null;
  let confidence = 0;

  for (const [cat, meta] of Object.entries(SIX_M_METADATA)) {
    const keywordMatches = meta.keywords.filter(kw => lowerQuery.includes(kw.toLowerCase()));
    if (keywordMatches.length > confidence) {
      confidence = keywordMatches.length;
      category = cat as SixMCategory;
    }
  }

  // 4. 시나리오 매칭
  const matchedScenarios: string[] = [];

  for (const scenario of ALL_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        if (!matchedScenarios.includes(scenario.id)) {
          matchedScenarios.push(scenario.id);
        }
        break;
      }
    }
  }

  // 5. SQL 파라미터 추출
  const sqlParams: Record<string, any> = {
    ...extractManParams(query),
    ...extractMachineParams(query),
    ...extractMaterialParams(query),
    ...extractMethodParams(query),
    ...extractMeasurementParams(query),
    ...extractMotherNatureParams(query)
  };

  return {
    intent,
    entities,
    category,
    confidence: Math.min(confidence / 3, 1) * 100,
    matchedScenarios,
    sqlParams
  };
}

// 시나리오 매칭
export function findMatchingScenario(query: string): Scenario | null {
  // 각 카테고리 순서대로 매칭 시도
  return matchManScenario(query) ||
         matchMachineScenario(query) ||
         matchMaterialScenario(query) ||
         matchMethodScenario(query) ||
         matchMeasurementScenario(query) ||
         matchMotherNatureScenario(query);
}

// ID로 시나리오 찾기
export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

// 카테고리별 시나리오 목록
export function getScenariosByCategory(category: SixMCategory): Scenario[] {
  return ALL_SCENARIOS.filter(s => s.category === category);
}

// SQL 템플릿에 파라미터 적용
export function applyParamsToSQL(template: SQLTemplate, params: Record<string, any>): string {
  let sql = template.sql;

  // Handlebars 스타일 조건부 치환
  // {{#if param}}...{{/if}} 패턴 처리
  sql = sql.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, paramName, content) => {
    if (params[paramName] !== undefined && params[paramName] !== null && params[paramName] !== '') {
      return content.replace(/\{\{(\w+)\}\}/g, (_m: string, p: string) => params[p] || '');
    }
    return '';
  });

  // 단순 치환 {{param}}
  sql = sql.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
    return params[paramName] || '';
  });

  // 불필요한 공백 정리
  sql = sql.replace(/\s+/g, ' ').trim();

  return sql;
}

// 시나리오 실행
export async function executeScenario(
  scenario: Scenario,
  params: Record<string, any>
): Promise<ScenarioResult> {
  const sqlResults: any[] = [];

  // SQL 템플릿 실행
  for (const template of scenario.sqlTemplates) {
    try {
      const sql = applyParamsToSQL(template, params);
      const startTime = Date.now();
      const result = await executeSQL(sql);
      const endTime = Date.now();

      sqlResults.push({
        templateId: template.id,
        sql,
        data: result.data || [],
        rowCount: result.rowCount || 0,
        executionTime: endTime - startTime,
        error: result.error
      });
    } catch (error: any) {
      sqlResults.push({
        templateId: template.id,
        sql: applyParamsToSQL(template, params),
        data: [],
        rowCount: 0,
        executionTime: 0,
        error: error.message
      });
    }
  }

  // 분석 결과 생성
  const analysis = generateAnalysis(scenario, sqlResults);

  // 우선순위 대책 추출
  const recommendations = prioritizeCountermeasures(scenario.countermeasures, sqlResults);

  return {
    scenario,
    sqlResults,
    analysis,
    recommendations,
    relatedData: null
  };
}

// 분석 결과 생성
function generateAnalysis(scenario: Scenario, sqlResults: any[]) {
  const insights: string[] = [];

  // SQL 결과 기반 인사이트 생성
  for (const result of sqlResults) {
    if (result.data && result.data.length > 0) {
      insights.push(`${result.rowCount}건의 데이터가 조회되었습니다.`);

      // 불량률이 높은 항목 찾기
      const highDefectItems = result.data.filter((d: any) =>
        (d.defect_rate && d.defect_rate > 5) ||
        (d.defect_count && d.defect_count > 0)
      );

      if (highDefectItems.length > 0) {
        insights.push(`불량 관련 항목 ${highDefectItems.length}건이 발견되었습니다.`);
      }
    }
  }

  // 원인 분석 인사이트 추가
  if (scenario.causeAnalysis.primaryCauses.length > 0) {
    const topCause = scenario.causeAnalysis.primaryCauses[0];
    insights.push(`주요 추정 원인: ${topCause.description} (확률 ${topCause.probability}%)`);
  }

  return {
    summary: `${SIX_M_METADATA[scenario.category].nameKo} 관점의 ${scenario.title} 분석 결과입니다.`,
    insights,
    causeBreakdown: {
      byCategory: {
        man: scenario.category === 'man' ? 100 : 0,
        machine: scenario.category === 'machine' ? 100 : 0,
        material: scenario.category === 'material' ? 100 : 0,
        method: scenario.category === 'method' ? 100 : 0,
        measurement: scenario.category === 'measurement' ? 100 : 0,
        motherNature: scenario.category === 'motherNature' ? 100 : 0
      },
      byPriority: {
        critical: scenario.countermeasures.filter(c => c.priority === 'critical').length,
        high: scenario.countermeasures.filter(c => c.priority === 'high').length,
        medium: scenario.countermeasures.filter(c => c.priority === 'medium').length,
        low: scenario.countermeasures.filter(c => c.priority === 'low').length
      }
    }
  };
}

// 대책 우선순위 지정
function prioritizeCountermeasures(
  countermeasures: Countermeasure[],
  sqlResults: any[]
): Countermeasure[] {
  // 우선순위에 따라 정렬
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...countermeasures].sort((a, b) => {
    const orderA = priorityOrder[a.priority];
    const orderB = priorityOrder[b.priority];
    if (orderA !== orderB) return orderA - orderB;

    // 같은 우선순위면 타입으로 정렬 (즉시 > 단기 > 장기 > 예방)
    const typeOrder = { immediate: 0, shortTerm: 1, longTerm: 2, preventive: 3 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

// 자연어 질의 처리 (메인 함수)
export async function processNaturalQuery(query: string): Promise<{
  nlpResult: NLPResult;
  scenario: Scenario | null;
  result: ScenarioResult | null;
  message: string;
}> {
  // 1. 자연어 분석
  const nlpResult = analyzeQuery(query);

  // 2. 시나리오 매칭
  let scenario: Scenario | null = null;

  if (nlpResult.matchedScenarios.length > 0) {
    scenario = getScenarioById(nlpResult.matchedScenarios[0]) || null;
  } else {
    scenario = findMatchingScenario(query);
  }

  // 3. 시나리오가 없으면 일반 응답
  if (!scenario) {
    return {
      nlpResult,
      scenario: null,
      result: null,
      message: generateFallbackMessage(nlpResult, query)
    };
  }

  // 4. 시나리오 실행
  const result = await executeScenario(scenario, nlpResult.sqlParams);

  // 5. 결과 메시지 생성
  const message = generateResultMessage(scenario, result);

  return {
    nlpResult,
    scenario,
    result,
    message
  };
}

// 폴백 메시지 생성
function generateFallbackMessage(nlpResult: NLPResult, query: string): string {
  let message = '질문을 이해했습니다.\n\n';

  if (nlpResult.category) {
    const meta = SIX_M_METADATA[nlpResult.category];
    message += `**${meta.name} (${meta.nameKo})** 관련 질문으로 파악됩니다.\n`;
    message += `${meta.description}\n\n`;

    const relatedScenarios = getScenariosByCategory(nlpResult.category);
    if (relatedScenarios.length > 0) {
      message += '**관련 시나리오:**\n';
      for (const s of relatedScenarios.slice(0, 3)) {
        message += `- ${s.title}: ${s.description}\n`;
      }
    }
  } else {
    message += '구체적인 질문을 해주시면 더 정확한 분석이 가능합니다.\n\n';
    message += '**사용 가능한 질문 예시:**\n';
    message += '- "작업자별 불량 현황 분석해줘"\n';
    message += '- "설비 고장 이력 보여줘"\n';
    message += '- "LOT-2024-001 자재 추적해줘"\n';
    message += '- "공정별 불량률 분석"\n';
  }

  return message;
}

// 결과 메시지 생성
function generateResultMessage(scenario: Scenario, result: ScenarioResult): string {
  const meta = SIX_M_METADATA[scenario.category];
  let message = `## ${meta.name} (${meta.nameKo}) - ${scenario.title}\n\n`;

  message += `${result.analysis.summary}\n\n`;

  // 인사이트
  if (result.analysis.insights.length > 0) {
    message += '### 주요 발견사항\n';
    for (const insight of result.analysis.insights) {
      message += `- ${insight}\n`;
    }
    message += '\n';
  }

  // 원인 분석
  if (scenario.causeAnalysis.primaryCauses.length > 0) {
    message += '### 추정 원인 (5-Why 분석)\n';
    for (const cause of scenario.causeAnalysis.primaryCauses.slice(0, 3)) {
      message += `- **${cause.description}** (${cause.probability}%)\n`;
    }
    message += '\n';
  }

  // 권장 대책
  if (result.recommendations.length > 0) {
    message += '### 권장 대책\n';
    for (const cm of result.recommendations.slice(0, 3)) {
      const typeLabel = {
        immediate: '즉시',
        shortTerm: '단기',
        longTerm: '장기',
        preventive: '예방'
      }[cm.type];
      message += `- **[${typeLabel}] ${cm.title}**\n`;
      message += `  ${cm.description}\n`;
    }
  }

  return message;
}

// 6M 카테고리 메타데이터 접근
export function getSixMMetadata() {
  return SIX_M_METADATA;
}

// 전체 시나리오 목록 반환
export function getAllScenarios() {
  return ALL_SCENARIOS;
}
