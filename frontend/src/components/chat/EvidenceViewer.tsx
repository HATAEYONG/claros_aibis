/**
 * Evidence Viewer Component
 * 증거 뷰어 컴포넌트
 */
import React, { useState } from 'react';
import { Evidence } from '@/services/agentChatService';

interface EvidenceViewerProps {
  evidences: Evidence[];
  className?: string;
}

const DocumentIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const DatabaseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string; open: boolean }> = ({
  className = '',
  open,
}) => (
  <svg
    className={`w-4 h-4 transition-transform ${className} ${open ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidences, className = '' }) => {
  const [expandedEvidences, setExpandedEvidences] = useState<Set<number>>(new Set());

  const toggleEvidence = (index: number) => {
    setExpandedEvidences((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 증거 유형별 아이콘 매핑
  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'data_source':
      case 'database':
        return <DatabaseIcon className="text-blue-500" />;
      case 'document':
        return <DocumentIcon className="text-green-500" />;
      case 'url':
      case 'link':
        return <LinkIcon className="text-purple-500" />;
      default:
        return <DocumentIcon className="text-gray-500" />;
    }
  };

  // 증거 유형별 한글명
  const getEvidenceTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      data_source: '데이터 소스',
      database: '데이터베이스',
      document: '문서',
      url: 'URL',
      link: '링크',
      agent_result: '에이전트 결과',
      model_output: '모델 출력',
      knowledge_graph: '지식 그래프',
    };
    return typeNames[type] || type;
  };

  if (evidences.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-500 text-center">증거 정보가 없습니다.</p>
      </div>
    );
  }

  // 소스별 그룹화
  const groupedBySource = evidences.reduce((acc, evidence, index) => {
    const source = evidence.source_agent || evidence.source || '기타';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push({ ...evidence, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<Evidence & { originalIndex: number }>>);

  return (
    <div className={`bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">증거 출처</h3>
          <span className="text-xs text-gray-500">{evidences.length}개 참조</span>
        </div>
      </div>

      {/* 증거 목록 (소스별 그룹) */}
      <div className="p-4 space-y-4">
        {Object.entries(groupedBySource).map(([source, sourceEvidences]) => (
          <div key={source} className="bg-white rounded-lg border overflow-hidden">
            {/* 소스 헤더 */}
            <div className="px-4 py-2 bg-gray-100 border-b">
              <span className="font-medium text-gray-700">{source}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({sourceEvidences.length}개)
              </span>
            </div>

            {/* 증거 목록 */}
            <div className="divide-y">
              {sourceEvidences.map((evidence) => {
                const isExpanded = expandedEvidences.has(evidence.originalIndex);

                return (
                  <div key={evidence.originalIndex} className="hover:bg-gray-50">
                    <button
                      onClick={() => toggleEvidence(evidence.originalIndex)}
                      className="w-full px-4 py-3 flex items-start gap-3 text-left"
                    >
                      {/* 아이콘 */}
                      <div className="flex-shrink-0 mt-0.5">{getEvidenceIcon(evidence.evidence_type)}</div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            {getEvidenceTypeName(evidence.evidence_type)}
                          </span>
                          {evidence.source_id && (
                            <span className="text-xs text-gray-400 truncate">
                              ID: {evidence.source_id}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                          {evidence.description || evidence.source}
                        </p>
                      </div>

                      {/* 펼침 아이콘 */}
                      <ChevronDownIcon open={isExpanded} />
                    </button>

                    {/* 상세 정보 */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-gray-50 border-t text-sm space-y-2">
                        {/* 설명 */}
                        {evidence.description && (
                          <div>
                            <span className="font-medium text-gray-600">설명:</span>
                            <p className="text-gray-800 mt-1">{evidence.description}</p>
                          </div>
                        )}

                        {/* 소스 정보 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium text-gray-600">소스:</span>
                            <p className="text-gray-800">{evidence.source}</p>
                          </div>
                          {evidence.source_id && (
                            <div>
                              <span className="font-medium text-gray-600">소스 ID:</span>
                              <p className="text-gray-800 font-mono text-xs">
                                {evidence.source_id}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 추가 데이터 */}
                        {evidence.data && Object.keys(evidence.data).length > 0 && (
                          <div>
                            <span className="font-medium text-gray-600">추가 정보:</span>
                            <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                              {JSON.stringify(evidence.data, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* 타임스탬프 */}
                        {evidence.timestamp && (
                          <div>
                            <span className="font-medium text-gray-600">생성 시각:</span>
                            <p className="text-gray-800">
                              {new Date(evidence.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="px-4 py-3 bg-gray-100 border-t">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="font-medium">증거 유형:</span>
          <div className="flex items-center gap-1">
            <DatabaseIcon />
            <span>데이터 소스</span>
          </div>
          <div className="flex items-center gap-1">
            <DocumentIcon />
            <span>문서</span>
          </div>
          <div className="flex items-center gap-1">
            <LinkIcon />
            <span>링크</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceViewer;
