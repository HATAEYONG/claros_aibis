/**
 * Root Cause Analysis Viewer Component
 * 원인-결과-대책 분석 결과를 로트 추적 스타일로 시각화
 */

import React, { useState } from 'react';
import {
  RootCauseAnalysisResult,
  OntologyElement,
  CausalRelation,
  Countermeasure,
  LotTraceInfo
} from '@/services/ontologyAnalysisService';

interface RootCauseAnalysisViewerProps {
  result: RootCauseAnalysisResult;
}

// 아이콘 컴포넌트들
const AlertTriangleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ArrowRightIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CheckCircleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PackageIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const UsersIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const RootCauseViewer: React.FC<RootCauseAnalysisViewerProps> = ({ result }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['causal', 'countermeasures']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Man': 'bg-blue-100 text-blue-700 border-blue-300',
      'Machine': 'bg-purple-100 text-purple-700 border-purple-300',
      'Material': 'bg-green-100 text-green-700 border-green-300',
      'Method': 'bg-orange-100 text-orange-700 border-orange-300',
      'Measurement': 'bg-cyan-100 text-cyan-700 border-cyan-300',
      'Environment': 'bg-teal-100 text-teal-700 border-teal-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: string): JSX.Element => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      high: '긴급',
      medium: '보통',
      low: '낮음'
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* 헤더: 감지된 문제 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangleIcon size={20} />
          <span className="font-bold">문제 분석 결과</span>
        </div>
        <div className="text-lg font-semibold">{result.detectedIssue}</div>
        <div className="text-sm text-red-100 mt-1">"{result.query}"에 대한 온톨로지 기반 분석</div>
      </div>

      {/* 영향받는 6M 요소 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('elements')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-semibold text-gray-700">영향받는 6M 요소</span>
          <ChevronDownIcon
            size={18}
            className={`text-gray-400 transition-transform ${expandedSections.includes('elements') ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.includes('elements') && (
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {result.affectedElements.map((elem: OntologyElement) => (
                <div
                  key={elem.id}
                  className={`px-3 py-2 rounded-lg border ${getCategoryColor(elem.category)}`}
                >
                  <div className="text-xs font-medium">{elem.category}</div>
                  <div className="font-semibold">{elem.name}</div>
                  <div className="text-xs mt-1 opacity-80">{elem.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 인과관계 체인 (Fishbone 스타일) */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('causal')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-semibold text-gray-700">인과관계 분석 (원인 → 결과)</span>
          <ChevronDownIcon
            size={18}
            className={`text-gray-400 transition-transform ${expandedSections.includes('causal') ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.includes('causal') && (
          <div className="p-4">
            {/* 근본 원인 */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-600 mb-2">근본 원인 (Root Causes)</div>
              <div className="space-y-2">
                {result.rootCauses.slice(0, 5).map((cause: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm text-gray-700">{cause}</span>
                    <span className="text-xs text-gray-400">({Math.round((5 - idx) * 20)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 인과관계 흐름 */}
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-600 mb-3">인과관계 흐름</div>
              <div className="space-y-3">
                {result.causalChain.slice(0, 4).map((relation: CausalRelation, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                      <span className="text-yellow-800">{relation.cause}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-8 h-1 rounded ${getStrengthColor(relation.strength)}`} />
                      <ArrowRightIcon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span className="text-red-800">{relation.effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 예상 결과 */}
            <div className="border-t pt-4 mt-4">
              <div className="text-sm font-semibold text-gray-600 mb-2">예상 영향 (Effects)</div>
              <div className="flex flex-wrap gap-2">
                {result.effects.map((effect: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 대책 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('countermeasures')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-semibold text-gray-700">대책 (Countermeasures)</span>
          <ChevronDownIcon
            size={18}
            className={`text-gray-400 transition-transform ${expandedSections.includes('countermeasures') ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.includes('countermeasures') && (
          <div className="p-4 space-y-3">
            {result.countermeasures.map((cm: Countermeasure) => (
              <div key={cm.id} className="border rounded-lg p-3 bg-green-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-green-600" />
                    <span className="font-semibold text-gray-800">{cm.action}</span>
                  </div>
                  {getPriorityBadge(cm.priority)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">대상 문제:</span> {cm.issue}
                  </div>
                  <div>
                    <span className="font-medium">유형:</span>{' '}
                    <span className={`px-1.5 py-0.5 rounded ${
                      cm.category === '예방' ? 'bg-blue-100 text-blue-700' :
                      cm.category === '시정' ? 'bg-orange-100 text-orange-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>{cm.category}</span>
                  </div>
                  <div>
                    <span className="font-medium">담당:</span> {cm.responsible}
                  </div>
                  <div>
                    <span className="font-medium">목표기한:</span> {cm.timeline}
                  </div>
                </div>
                <div className="mt-2 text-xs bg-white rounded p-2 border border-green-200">
                  <span className="font-medium text-green-700">기대효과:</span> {cm.expectedEffect}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 로트 추적 정보 (있는 경우) */}
      {result.lotTraceInfo && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('lot')}
            className="w-full px-4 py-3 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100"
          >
            <div className="flex items-center gap-2">
              <PackageIcon size={18} className="text-indigo-600" />
              <span className="font-semibold text-indigo-700">로트 추적 정보</span>
              <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                {result.lotTraceInfo.lotNo}
              </span>
            </div>
            <ChevronDownIcon
              size={18}
              className={`text-indigo-400 transition-transform ${expandedSections.includes('lot') ? 'rotate-180' : ''}`}
            />
          </button>
          {expandedSections.includes('lot') && (
            <div className="p-4 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">제품</div>
                  <div className="font-medium">{result.lotTraceInfo.product}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">생산일</div>
                  <div className="font-medium">{result.lotTraceInfo.productionDate}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">생산라인</div>
                  <div className="font-medium">{result.lotTraceInfo.line}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">작업조</div>
                  <div className="font-medium">{result.lotTraceInfo.shift}</div>
                </div>
              </div>

              {/* 자재 이력 */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <PackageIcon size={14} />
                  투입 자재
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left">자재코드</th>
                        <th className="px-2 py-1 text-left">자재명</th>
                        <th className="px-2 py-1 text-left">로트번호</th>
                        <th className="px-2 py-1 text-left">공급업체</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.lotTraceInfo.materials.map((mat, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1 font-mono">{mat.materialCode}</td>
                          <td className="px-2 py-1">{mat.materialName}</td>
                          <td className="px-2 py-1 font-mono text-blue-600">{mat.lotNo}</td>
                          <td className="px-2 py-1">{mat.supplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 설비 정보 */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <SettingsIcon size={14} />
                  사용 설비
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left">설비코드</th>
                        <th className="px-2 py-1 text-left">설비명</th>
                        <th className="px-2 py-1 text-left">최근보전</th>
                        <th className="px-2 py-1 text-left">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.lotTraceInfo.equipment.map((eq, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1 font-mono">{eq.equipCode}</td>
                          <td className="px-2 py-1">{eq.equipName}</td>
                          <td className="px-2 py-1">{eq.lastMaintenance}</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                              {eq.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 작업자 정보 */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <UsersIcon size={14} />
                  작업자
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.lotTraceInfo.workers.map((worker, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      <div className="font-medium text-blue-800">{worker.empName}</div>
                      <div className="text-xs text-blue-600">{worker.position} ({worker.empId})</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {worker.certification.map((cert, cidx) => (
                          <span key={cidx} className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 품질검사 기록 */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-2">품질검사 기록</div>
                <div className="space-y-2">
                  {result.lotTraceInfo.qualityRecords.map((record, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded border ${
                        record.result === 'pass'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          record.result === 'pass'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.result === 'pass' ? '합격' : '불합격'}
                        </span>
                        <span className="text-sm font-medium">{record.inspType}</span>
                        {record.defectType && (
                          <span className="text-xs text-red-600">({record.defectType})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.inspDate} | {record.inspector}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 분석 출처 */}
      <div className="text-xs text-gray-400 text-center">
        분석 방식: {result.provider === 'local' ? '온톨로지 지식베이스' : result.provider?.toUpperCase()} |
        6M 기반 원인-결과 분석
      </div>
    </div>
  );
};

export default RootCauseViewer;
