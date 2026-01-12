/**
 * ScenarioAnalysis - 6M 시나리오 분석 대시보드
 * Text-to-SQL과 자연어 처리를 통한 6M 기반 분석
 */

import React, { useState } from 'react';
import {
  SearchIcon,
  UserIcon,
  SettingsIcon,
  PackageIcon,
  CheckIcon,
  AlertIcon
} from '@/components/icons/Icons';
import {
  processNaturalQuery,
  getAllScenarios,
  getSixMMetadata,
  getScenariosByCategory,
  SixMCategory,
  Scenario,
  ScenarioResult
} from '@/services/scenarios';

const ScenarioAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SixMCategory | 'all'>('all');
  const [analysisResult, setAnalysisResult] = useState<{
    scenario: Scenario | null;
    result: ScenarioResult | null;
    message: string;
  } | null>(null);

  const sixMMetadata = getSixMMetadata();
  const allScenarios = getAllScenarios();

  const categoryIcons: Record<SixMCategory, React.FC<any>> = {
    man: UserIcon,
    machine: SettingsIcon,
    material: PackageIcon,
    method: CheckIcon,
    measurement: AlertIcon,
    motherNature: AlertIcon
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await processNaturalQuery(query);
      setAnalysisResult({
        scenario: result.scenario,
        result: result.result,
        message: result.message
      });
    } catch (error: any) {
      setAnalysisResult({
        scenario: null,
        result: null,
        message: `오류 발생: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickScenario = async (scenario: Scenario) => {
    setQuery(scenario.keywords[0]);
    setIsLoading(true);
    try {
      const result = await processNaturalQuery(scenario.keywords[0]);
      setAnalysisResult({
        scenario: result.scenario,
        result: result.result,
        message: result.message
      });
    } catch (error: any) {
      setAnalysisResult({
        scenario: null,
        result: null,
        message: `오류 발생: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScenarios = selectedCategory === 'all'
    ? allScenarios
    : getScenariosByCategory(selectedCategory);

  return (
    <div className="space-y-6">
      {/* 검색 영역 */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <SearchIcon size={24} className="text-blue-600" />
          6M 시나리오 분석
        </h2>
        <p className="text-gray-600 mb-4">
          자연어로 질문하면 6M(Man, Machine, Material, Method, Measurement, Mother Nature) 관점에서 분석합니다.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="예: 작업자별 불량 분석, 설비 고장 원인, LOT-2024-001 추적"
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <SearchIcon size={20} />
                분석 시작
              </>
            )}
          </button>
        </div>

        {/* 빠른 질문 예시 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            '작업자별 불량 분석',
            '설비 고장 이력',
            '공급업체 품질 현황',
            '공정별 불량률',
            'SPC 분석',
            '환경 모니터링'
          ].map((example) => (
            <button
              key={example}
              onClick={() => { setQuery(example); handleSearch(); }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* 6M 카테고리 필터 */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({allScenarios.length})
          </button>
          {(Object.keys(sixMMetadata) as SixMCategory[]).map((category) => {
            const meta = sixMMetadata[category];
            const count = getScenariosByCategory(category).length;
            const Icon = categoryIcons[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory === category ? { backgroundColor: meta.color } : {}}
              >
                <Icon size={16} />
                {meta.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 분석 결과 */}
      {analysisResult && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">분석 결과</h3>

          {/* 시나리오 정보 */}
          {analysisResult.scenario && (
            <div className="mb-4 p-4 rounded-lg" style={{
              backgroundColor: `${sixMMetadata[analysisResult.scenario.category].color}15`
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-1 rounded text-xs text-white font-medium"
                  style={{ backgroundColor: sixMMetadata[analysisResult.scenario.category].color }}
                >
                  {sixMMetadata[analysisResult.scenario.category].name}
                </span>
                <h4 className="font-medium">{analysisResult.scenario.title}</h4>
              </div>
              <p className="text-sm text-gray-600">{analysisResult.scenario.description}</p>
            </div>
          )}

          {/* 메시지 출력 */}
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
              {analysisResult.message}
            </pre>
          </div>

          {/* SQL 결과 */}
          {analysisResult.result?.sqlResults && analysisResult.result.sqlResults.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">조회 결과</h4>
              {analysisResult.result.sqlResults.map((sqlResult, idx) => (
                <div key={idx} className="mb-4">
                  {sqlResult.data && sqlResult.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(sqlResult.data[0]).map((col) => (
                              <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sqlResult.data.slice(0, 10).map((row: any, rowIdx: number) => (
                            <tr key={rowIdx} className="hover:bg-gray-50">
                              {Object.values(row).map((val: any, colIdx) => (
                                <td key={colIdx} className="px-3 py-2">
                                  {val !== null && val !== undefined ? String(val) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sqlResult.data.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2">
                          ... 외 {sqlResult.data.length - 10}건 더 있음
                        </p>
                      )}
                    </div>
                  ) : sqlResult.error ? (
                    <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                      오류: {sqlResult.error}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">조회된 데이터가 없습니다.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 대책 목록 */}
          {analysisResult.result?.recommendations && analysisResult.result.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">권장 대책</h4>
              <div className="grid gap-3">
                {analysisResult.result.recommendations.slice(0, 5).map((cm) => (
                  <div
                    key={cm.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      cm.priority === 'critical' ? 'bg-red-50 border-red-500' :
                      cm.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                      cm.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-gray-50 border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{cm.title}</span>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          cm.priority === 'critical' ? 'bg-red-200 text-red-800' :
                          cm.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                          cm.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {cm.priority === 'critical' ? '긴급' :
                           cm.priority === 'high' ? '높음' :
                           cm.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                          {cm.type === 'immediate' ? '즉시' :
                           cm.type === 'shortTerm' ? '단기' :
                           cm.type === 'longTerm' ? '장기' : '예방'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{cm.description}</p>
                    {cm.estimatedEffect && (
                      <p className="text-sm text-green-600 mt-1">예상 효과: {cm.estimatedEffect}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 시나리오 목록 */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4">사용 가능한 시나리오 ({filteredScenarios.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((scenario) => {
            const meta = sixMMetadata[scenario.category];
            const Icon = categoryIcons[scenario.category];
            return (
              <div
                key={scenario.id}
                className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => handleQuickScenario(scenario)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <span className="text-xs text-gray-500">{meta.name}</span>
                    <h4 className="font-medium text-sm">{scenario.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6M 프레임워크 설명 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-4">6M 분석 프레임워크</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(Object.keys(sixMMetadata) as SixMCategory[]).map((category) => {
            const meta = sixMMetadata[category];
            const Icon = categoryIcons[category];
            return (
              <div
                key={category}
                className="bg-white p-4 rounded-lg shadow-sm text-center"
              >
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white mb-2"
                  style={{ backgroundColor: meta.color }}
                >
                  <Icon size={24} />
                </div>
                <h4 className="font-bold text-sm">{meta.name}</h4>
                <p className="text-xs text-gray-500">{meta.nameKo}</p>
                <p className="text-xs text-gray-600 mt-1">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis;
