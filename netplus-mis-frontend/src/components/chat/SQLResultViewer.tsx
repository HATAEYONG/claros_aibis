/**
 * SQL Result Viewer Component
 * SQL 쿼리 결과 및 관련 테이블 정보를 시각화
 */

import React, { useState } from 'react';
import { SQLGenerationResult, TableInfo } from '@/services/textToSqlService';

interface SQLResultViewerProps {
  result: SQLGenerationResult;
  onCopySQL?: () => void;
}

// 간단한 아이콘 컴포넌트
const CopyIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TableIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SQLResultViewer: React.FC<SQLResultViewerProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(result.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const getProviderBadge = () => {
    if (!result.provider) return null;

    const badges: Record<string, { bg: string; text: string; label: string }> = {
      local: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Local Template' },
      ollama: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ollama' },
      chatgpt: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ChatGPT' },
      gemini: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Gemini' }
    };

    const badge = badges[result.provider] || badges.local;
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* SQL 쿼리 섹션 */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">SQL Query</span>
            {getProviderBadge()}
          </div>
          <button
            onClick={handleCopySQL}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            title="SQL 복사"
          >
            {copied ? (
              <>
                <CheckIcon size={14} />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <CopyIcon size={14} />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-sm text-green-400 overflow-x-auto">
          <code>{result.sql}</code>
        </pre>
      </div>

      {/* 설명 섹션 */}
      {result.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>설명:</strong> {result.explanation}
          </p>
        </div>
      )}

      {/* 관련 테이블 섹션 */}
      {result.tables && result.tables.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TableIcon size={16} />
              관련 테이블 ({result.tables.length}개)
            </h4>
          </div>
          <div className="divide-y">
            {result.tables.map((table: TableInfo) => (
              <div key={table.name} className="bg-white">
                <button
                  onClick={() => toggleTable(table.name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                      {table.module}
                    </span>
                    <div className="text-left">
                      <span className="font-medium text-gray-800">{table.koreanName}</span>
                      <span className="text-xs text-gray-500 ml-2">({table.name})</span>
                    </div>
                  </div>
                  <ChevronDownIcon
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      expandedTables.includes(table.name) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedTables.includes(table.name) && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-3">{table.description}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-left text-gray-600">컬럼명</th>
                            <th className="px-2 py-1 text-left text-gray-600">타입</th>
                            <th className="px-2 py-1 text-left text-gray-600">설명</th>
                            <th className="px-2 py-1 text-center text-gray-600">키</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {table.columns.map(column => (
                            <tr key={column.name} className="border-t">
                              <td className="px-2 py-1 font-mono text-gray-800">{column.name}</td>
                              <td className="px-2 py-1 text-gray-600">{column.type}</td>
                              <td className="px-2 py-1 text-gray-600">{column.description}</td>
                              <td className="px-2 py-1 text-center">
                                {column.isPK && (
                                  <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">PK</span>
                                )}
                                {column.isFK && (
                                  <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] ml-1">FK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {table.sampleQueries && table.sampleQueries.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">샘플 질문:</p>
                        <div className="flex flex-wrap gap-1">
                          {table.sampleQueries.map((query, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded"
                            >
                              {query}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLResultViewer;
