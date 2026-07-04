/**
 * 확장 시나리오 분석 컴포넌트
 * 4M2E, 원가예측, 재무예측, ESG전략 통합 분석
 */

import React, { useState, useCallback } from 'react';
import {
  // 4M2E
  FOUR_M2E_METADATA,
  FOUR_M2E_SCENARIOS,
  matchFourM2EScenario,
  extractFourM2EParams,
  FourM2ECategory,
  Scenario,
  // 원가예측
  COST_METADATA,
  COST_SCENARIOS,
  matchCostScenario,
  extractCostParams,
  CostCategory,
  // 재무예측
  FINANCIAL_METADATA,
  FINANCIAL_SCENARIOS,
  matchFinancialScenario,
  extractFinancialParams,
  FinancialScenario,
  FinancialCategory,
  // ESG전략
  ESG_METADATA,
  ESG_SCENARIOS,
  matchESGScenario,
  extractESGParams,
  ESGScenario,
  ESGCategory
} from '../../services/scenarios';

// 분석 도메인 타입
type AnalysisDomain = '4M2E' | 'cost' | 'financial' | 'esg';

// 도메인 메타데이터
const DOMAIN_METADATA: Record<AnalysisDomain, {
  name: string;
  nameKo: string;
  description: string;
  icon: string;
  color: string;
}> = {
  '4M2E': {
    name: '4M2E',
    nameKo: '4M2E 분석',
    description: 'Man, Machine, Material, Method + Environment, Energy',
    icon: '🔧',
    color: '#4CAF50'
  },
  cost: {
    name: 'Cost Prediction',
    nameKo: '원가예측',
    description: '재료비, 노무비, 경비, 제조원가 분석',
    icon: '💰',
    color: '#FF9800'
  },
  financial: {
    name: 'Financial Prediction',
    nameKo: '재무예측',
    description: '매출, 수익, 현금흐름, 재무비율 분석',
    icon: '📊',
    color: '#2196F3'
  },
  esg: {
    name: 'ESG Strategy',
    nameKo: 'ESG 전략',
    description: '환경, 사회, 지배구조 전략 분석',
    icon: '🌿',
    color: '#9C27B0'
  }
};

// CostScenario 타입 정의 (costPredictionScenarios에서 사용)
interface CostScenario {
  id: string;
  title: string;
  description: string;
  category: CostCategory;
  keywords: string[];
  sqlTemplates: any[];
  causeAnalysis: any;
  countermeasures: any[];
  priority: number;
}

// 통합 시나리오 타입
type UnifiedScenario = Scenario | CostScenario | FinancialScenario | ESGScenario;

const ExtendedScenarioAnalysis: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<AnalysisDomain>('4M2E');
  const [query, setQuery] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<UnifiedScenario | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // 도메인별 시나리오 가져오기
  const getScenariosByDomain = (domain: AnalysisDomain): UnifiedScenario[] => {
    switch (domain) {
      case '4M2E':
        return FOUR_M2E_SCENARIOS as UnifiedScenario[];
      case 'cost':
        return COST_SCENARIOS as unknown as UnifiedScenario[];
      case 'financial':
        return FINANCIAL_SCENARIOS as UnifiedScenario[];
      case 'esg':
        return ESG_SCENARIOS as UnifiedScenario[];
      default:
        return [];
    }
  };

  // 도메인별 메타데이터 가져오기
  const getCategoryMetadata = (domain: AnalysisDomain) => {
    switch (domain) {
      case '4M2E':
        return FOUR_M2E_METADATA;
      case 'cost':
        return COST_METADATA;
      case 'financial':
        return FINANCIAL_METADATA;
      case 'esg':
        return ESG_METADATA;
      default:
        return {};
    }
  };

  // 시나리오 매칭
  const matchScenario = useCallback((q: string, domain: AnalysisDomain): UnifiedScenario | null => {
    switch (domain) {
      case '4M2E':
        return matchFourM2EScenario(q);
      case 'cost':
        return matchCostScenario(q);
      case 'financial':
        return matchFinancialScenario(q);
      case 'esg':
        return matchESGScenario(q);
      default:
        return null;
    }
  }, []);

  // 파라미터 추출
  const extractParams = useCallback((q: string, domain: AnalysisDomain): Record<string, any> => {
    switch (domain) {
      case '4M2E':
        return extractFourM2EParams(q);
      case 'cost':
        return extractCostParams(q);
      case 'financial':
        return extractFinancialParams(q);
      case 'esg':
        return extractESGParams(q);
      default:
        return {};
    }
  }, []);

  // 분석 실행
  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 시나리오 매칭
      const matched = matchScenario(query, selectedDomain);
      setSelectedScenario(matched);

      if (matched) {
        // 파라미터 추출
        const params = extractParams(query, selectedDomain);

        // 분석 결과 생성 (실제로는 API 호출)
        const result = {
          scenario: matched,
          params,
          insights: [
            `${matched.title} 분석을 수행했습니다.`,
            `총 ${matched.sqlTemplates.length}개의 SQL 쿼리가 실행되었습니다.`,
            `${matched.countermeasures.length}개의 개선 대책이 도출되었습니다.`
          ],
          primaryCauses: matched.causeAnalysis.primaryCauses.slice(0, 3),
          recommendations: matched.countermeasures.slice(0, 3)
        };

        setAnalysisResult(result);
      } else {
        setAnalysisResult({
          error: true,
          message: '매칭되는 시나리오를 찾을 수 없습니다. 다른 키워드를 사용해 보세요.'
        });
      }
    } catch (error) {
      setAnalysisResult({
        error: true,
        message: '분석 중 오류가 발생했습니다.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 퀵 시나리오 선택
  const handleQuickSelect = (scenario: UnifiedScenario) => {
    setSelectedScenario(scenario);
    setQuery(scenario.keywords[0] + ' 분석해줘');
  };

  const scenarios = getScenariosByDomain(selectedDomain);
  const categoryMeta = getCategoryMetadata(selectedDomain);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">확장 시나리오 분석</h1>
        <p className="text-gray-600 mt-1">4M2E, 원가예측, 재무예측, ESG전략 자연어 분석</p>
      </div>

      {/* 도메인 선택 탭 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DOMAIN_METADATA) as AnalysisDomain[]).map((domain) => {
            const meta = DOMAIN_METADATA[domain];
            return (
              <button
                key={domain}
                onClick={() => {
                  setSelectedDomain(domain);
                  setSelectedScenario(null);
                  setAnalysisResult(null);
                }}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all ${
                  selectedDomain === domain
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedDomain === domain ? meta.color : undefined
                }}
              >
                <span className="text-xl">{meta.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{meta.nameKo}</div>
                  <div className="text-xs opacity-80">{meta.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 도메인 설명 */}
      <div
        className="rounded-lg p-4 mb-6 text-white"
        style={{ backgroundColor: DOMAIN_METADATA[selectedDomain].color }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{DOMAIN_METADATA[selectedDomain].icon}</span>
          <div>
            <h2 className="text-xl font-bold">{DOMAIN_METADATA[selectedDomain].nameKo}</h2>
            <p className="opacity-90">{DOMAIN_METADATA[selectedDomain].description}</p>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">카테고리</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryMeta).map(([key, meta]: [string, any]) => (
            <span
              key={key}
              className="px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: `${meta.color}20`,
                color: meta.color,
                border: `1px solid ${meta.color}`
              }}
            >
              {meta.nameKo}
            </span>
          ))}
        </div>
      </div>

      {/* 자연어 입력 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">자연어 질의</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder={`${DOMAIN_METADATA[selectedDomain].nameKo} 관련 질문을 입력하세요...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isAnalyzing ? '분석 중...' : '분석'}
          </button>
        </div>
      </div>

      {/* 퀵 시나리오 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">빠른 시나리오 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((scenario) => {
            const catMeta = (categoryMeta as any)[scenario.category];
            return (
              <button
                key={scenario.id}
                onClick={() => handleQuickSelect(scenario)}
                className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  selectedScenario?.id === scenario.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: catMeta?.color || '#888' }}
                  />
                  <span className="text-xs text-gray-500">{catMeta?.nameKo || scenario.category}</span>
                </div>
                <div className="font-medium text-gray-800">{scenario.title}</div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {scenario.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 분석 결과 */}
      {analysisResult && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {analysisResult.error ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600">{analysisResult.message}</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {analysisResult.scenario.title} 분석 결과
              </h3>

              {/* 인사이트 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">주요 발견사항</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {analysisResult.insights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 원인 분석 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">추정 원인 (5-Why 분석)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analysisResult.primaryCauses.map((cause: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border-l-4"
                      style={{ borderColor: DOMAIN_METADATA[selectedDomain].color }}
                    >
                      <div className="text-sm text-gray-500 mb-1">{cause.category}</div>
                      <div className="font-medium text-gray-800">{cause.description}</div>
                      <div className="text-sm text-gray-600 mt-2">
                        확률: <span className="font-medium">{cause.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 권장 대책 */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">권장 대책</h4>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority === 'critical' ? '긴급' :
                           rec.priority === 'high' ? '높음' :
                           rec.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.type === 'immediate' ? 'bg-red-50 text-red-600' :
                          rec.type === 'shortTerm' ? 'bg-blue-50 text-blue-600' :
                          rec.type === 'longTerm' ? 'bg-purple-50 text-purple-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {rec.type === 'immediate' ? '즉시' :
                           rec.type === 'shortTerm' ? '단기' :
                           rec.type === 'longTerm' ? '장기' : '예방'}
                        </span>
                      </div>
                      <div className="font-medium text-gray-800">{rec.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>담당: {rec.responsibleRole}</span>
                        <span>기대효과: {rec.expectedBenefit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtendedScenarioAnalysis;
