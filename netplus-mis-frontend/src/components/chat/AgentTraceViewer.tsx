/**
 * Agent Trace Viewer Component
 * 에이전트 실행 추적 뷰어 컴포넌트
 */
import React, { useState } from 'react';
import {
  AgentTraceEntry,
  AGENT_LAYER_COLORS,
  AGENT_LAYER_NAMES,
  getConfidenceLevel,
} from '@/services/agentChatService';

interface AgentTraceViewerProps {
  traces: AgentTraceEntry[];
  className?: string;
}

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

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({ traces, className = '' }) => {
  const [expandedTraces, setExpandedTraces] = useState<Set<number>>(new Set());

  const toggleTrace = (sequence: number) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(sequence)) {
        next.delete(sequence);
      } else {
        next.add(sequence);
      }
      return next;
    });
  };

  const totalExecutionTime = traces.reduce((sum, t) => sum + t.execution_time_ms, 0);

  if (traces.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-500 text-center">에이전트 실행 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">에이전트 실행 추적</h3>
          <span className="text-xs text-gray-500">
            총 {traces.length}개 에이전트 · {totalExecutionTime}ms
          </span>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="p-4">
        <div className="space-y-2">
          {traces.map((trace, index) => {
            const isExpanded = expandedTraces.has(trace.sequence);
            const confidenceLevel = getConfidenceLevel(trace.confidence);
            const layerName = AGENT_LAYER_NAMES[trace.agent_layer] || trace.agent_layer;
            const layerColor = AGENT_LAYER_COLORS[trace.agent_layer] || 'bg-gray-500';

            return (
              <div key={trace.sequence} className="bg-white rounded-lg border overflow-hidden">
                {/* 요약 */}
                <button
                  onClick={() => toggleTrace(trace.sequence)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {/* 순서 표시 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600">{trace.sequence}</span>
                  </div>

                  {/* 타임라인 라인 */}
                  {index > 0 && <div className="absolute left-8 top-0 w-0.5 h-4 bg-gray-300 -mt-4" />}

                  {/* 에이전트 정보 */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{trace.agent_name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full text-white ${layerColor}`}>
                        {layerName}
                      </span>
                      <span className="text-xs text-gray-500">{trace.agent_domain}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {trace.status === 'success' ? (
                          <CheckCircleIcon className="text-green-500" />
                        ) : (
                          <XCircleIcon className="text-red-500" />
                        )}
                        {trace.status === 'success' ? '성공' : '실패'}
                      </span>
                      <span className={`flex items-center gap-1 ${confidenceLevel.color}`}>
                        신뢰도 {Math.round(trace.confidence * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon />
                        {trace.execution_time_ms}ms
                      </span>
                    </div>
                  </div>

                  {/* 펼침 아이콘 */}
                  <ChevronDownIcon open={isExpanded} />
                </button>

                {/* 상세 정보 */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
                    {/* 결과 요약 */}
                    <div>
                      <span className="text-xs font-medium text-gray-600">결과:</span>
                      <p className="text-sm text-gray-800 mt-1">{trace.result_summary}</p>
                    </div>

                    {/* 시간 정보 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-600">시작 시각:</span>
                        <p className="text-gray-800">
                          {new Date(trace.started_at).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">종료 시각:</span>
                        <p className="text-gray-800">
                          {new Date(trace.completed_at).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    {/* 증거 수 */}
                    {trace.evidence_count > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">증거:</span>
                        <span className="text-sm text-gray-800 ml-2">
                          {trace.evidence_count}개 참조
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 전체 실행 시간 바 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>전체 실행 시간</span>
            <span>{totalExecutionTime}ms</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            {traces.map((trace) => {
              const width = (trace.execution_time_ms / totalExecutionTime) * 100;
              const layerColor = AGENT_LAYER_COLORS[trace.agent_layer] || 'bg-gray-500';
              return (
                <div
                  key={trace.sequence}
                  className={`h-full ${layerColor}`}
                  style={{ width: `${width}%` }}
                  title={`${trace.agent_name}: ${trace.execution_time_ms}ms`}
                />
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            {traces.map((trace) => {
              const layerColor = AGENT_LAYER_COLORS[trace.agent_layer] || 'bg-gray-500';
              return (
                <div key={trace.sequence} className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded ${layerColor}`} />
                  <span className="text-gray-600">{trace.agent_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTraceViewer;
