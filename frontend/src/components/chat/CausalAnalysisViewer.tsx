/**
 * Causal Analysis Viewer Component
 * 원인-결과-대책 분석 결과를 시각화하는 컴포넌트
 */

import React, { useState } from 'react';
import {
  AnalysisResult,
  CausalRelation,
  CauseNode,
  Countermeasure
} from '@/services/causalAnalysisService';

interface CausalAnalysisViewerProps {
  result: AnalysisResult;
}

// 아이콘 컴포넌트
const AlertIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SearchIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TargetIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CheckCircleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ZapIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CausalAnalysisViewer: React.FC<CausalAnalysisViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'causes' | 'actions' | 'trace'>('causes');
  const [expandedCauses, setExpandedCauses] = useState<string[]>([]);

  if (result.matchedProblems.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertIcon size={20} />
          <span className="font-medium">관련 문제를 찾을 수 없습니다</span>
        </div>
        <p className="mt-2 text-sm text-yellow-600">
          다음 키워드로 다시 질문해 보세요: 치수불량, 외관불량, 설비고장, 생산지연, 원가상승 등
        </p>
      </div>
    );
  }

  const topMatch = result.matchedProblems[0];
  const problem = topMatch.problem;

  const toggleCause = (causeId: string) => {
    setExpandedCauses(prev =>
      prev.includes(causeId)
        ? prev.filter(id => id !== causeId)
        : [...prev, causeId]
    );
  };

  // M 카테고리 색상
  const mCategoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'Man': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Machine': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Material': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'Method': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Measurement': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'Mother Nature': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Environment': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Energy': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  };

  const getCategoryColor = (category?: string) => {
    return category ? mCategoryColors[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
      : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  // 대책 유형 라벨
  const actionTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
    immediate: { label: '즉시대책', color: 'bg-red-100 text-red-700', icon: '🚨' },
    corrective: { label: '시정조치', color: 'bg-orange-100 text-orange-700', icon: '🔧' },
    preventive: { label: '예방조치', color: 'bg-green-100 text-green-700', icon: '🛡️' }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div className="space-y-4">
      {/* 헤더 - 문제 요약 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertIcon size={20} />
          <span className="font-bold">{problem.problem}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-0.5 bg-white/20 rounded">{problem.category}</span>
          <span className="px-2 py-0.5 bg-white/20 rounded">{problem.subcategory}</span>
        </div>
      </div>

      {/* 증상 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <AlertIcon size={16} />
          증상
        </h4>
        <div className="flex flex-wrap gap-2">
          {problem.symptoms.map((symptom, idx) => (
            <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              {symptom}
            </span>
          ))}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('causes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'causes'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎯 원인 분석
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'actions'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ 대책 ({problem.countermeasures.length})
        </button>
        <button
          onClick={() => setActiveTab('trace')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'trace'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 로트 추적
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[200px]">
        {/* 원인 분석 탭 */}
        {activeTab === 'causes' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              6M 관점에서 분석한 원인입니다. 각 원인을 클릭하면 상세 정보를 볼 수 있습니다.
            </p>

            {problem.causes.map((cause) => {
              const colors = getCategoryColor(cause.mCategory);
              const isExpanded = expandedCauses.includes(cause.id);

              return (
                <div
                  key={cause.id}
                  className={`border rounded-lg overflow-hidden ${colors.border}`}
                >
                  <button
                    onClick={() => toggleCause(cause.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.text} ${colors.bg} border ${colors.border}`}>
                        {cause.mCategory || 'Unknown'}
                      </span>
                      <span className="font-medium text-gray-800">{cause.description}</span>
                      {cause.probability && (
                        <span className="text-xs text-gray-500">
                          ({(cause.probability * 100).toFixed(0)}% 가능성)
                        </span>
                      )}
                    </div>
                    <ChevronDownIcon
                      size={18}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-3 bg-white border-t">
                      {/* 하위 원인 */}
                      {cause.subCauses && cause.subCauses.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-500 mb-2">근본원인 분석 (Why-Why)</h5>
                          <div className="space-y-2 ml-4">
                            {cause.subCauses.map((sub, idx) => (
                              <div key={sub.id} className="flex items-start gap-2">
                                <span className="text-gray-400">└</span>
                                <div>
                                  <span className="text-sm text-gray-700">{sub.description}</span>
                                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                    sub.level === 'root' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {sub.level === 'root' ? '근본원인' : '기여원인'}
                                  </span>
                                  {sub.mCategory && (
                                    <span className="ml-1 text-xs text-gray-400">({sub.mCategory})</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 확인 포인트 */}
                      {cause.checkPoints && cause.checkPoints.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 mb-2">확인 포인트</h5>
                          <div className="flex flex-wrap gap-2">
                            {cause.checkPoints.map((point, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                📋 {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 영향/결과 */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <ZapIcon size={16} />
                영향/결과
              </h4>
              <div className="flex flex-wrap gap-2">
                {problem.effects.map((effect, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 대책 탭 */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            {result.recommendedActions.map((action, idx) => {
              const typeInfo = actionTypeLabels[action.type];
              return (
                <div key={action.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${priorityColors[action.priority]}`} title={`우선순위: ${action.priority}`} />
                    </div>
                    {action.effectiveness && (
                      <span className="text-xs text-gray-500">
                        효과: {action.effectiveness}%
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-gray-800 mb-2">{action.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {action.responsibleDept && (
                      <span>👤 {action.responsibleDept}</span>
                    )}
                    {action.estimatedTime && (
                      <span>⏱️ {action.estimatedTime}</span>
                    )}
                    {action.relatedProcedure && (
                      <span>📄 {action.relatedProcedure}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 로트 추적 탭 */}
        {activeTab === 'trace' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <SearchIcon size={16} />
                로트 추적 관련 테이블
              </h4>

              {result.lotTraceInfo && result.lotTraceInfo.relevantTables.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {result.lotTraceInfo.relevantTables.map((table, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded font-mono">
                        {table}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-blue-700">
                    <strong>추적 방향:</strong>{' '}
                    {result.lotTraceInfo.traceDirection === 'forward' ? '정방향 (원인→결과)' :
                     result.lotTraceInfo.traceDirection === 'backward' ? '역방향 (결과→원인)' : '양방향'}
                  </div>

                  {result.lotTraceInfo.suggestedQuery && (
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 mb-1">추천 조회 쿼리:</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                        {result.lotTraceInfo.suggestedQuery}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">관련 테이블 정보가 없습니다.</p>
              )}
            </div>

            {/* 관련 온톨로지 개념 */}
            {result.relatedOntology && result.relatedOntology.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">관련 온톨로지 개념</h4>
                <div className="space-y-2">
                  {result.relatedOntology.map((onto, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-purple-100">
                      <div className="font-medium text-purple-700 text-sm">{onto.concept}</div>
                      <div className="text-xs text-gray-600">{onto.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 분석 정보 */}
      <div className="text-xs text-gray-400 text-right">
        분석 방법: {result.analysisMethod} | 매칭 점수: {topMatch.matchScore}
      </div>
    </div>
  );
};

export default CausalAnalysisViewer;
