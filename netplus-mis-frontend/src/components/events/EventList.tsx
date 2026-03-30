/**
 * 이벤트 목록 컴포넌트
 * 시스템에서 발생한 이벤트를 목록으로 표시
 */
import React, { useState, useEffect } from 'react';
import { getEvents, acknowledgeEvent, resolveEvent, dismissEvent } from '../../services/eventService';
import { Event, EventSeverity, EventStatus } from '../../services/eventService';

interface EventListProps {
  filters?: {
    event_type?: string;
    severity?: EventSeverity;
    status?: EventStatus;
    domain?: string;
  };
  onEventClick?: (event: Event) => void;
}

const EventList: React.FC<EventListProps> = ({ filters, onEventClick }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadEvents();
  }, [filters, page]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await getEvents({
        ...filters,
        limit: 20,
        offset: (page - 1) * 20,
      });
      setEvents(result.results);
      setCount(result.count);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (eventId: string) => {
    try {
      await acknowledgeEvent(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
    }
  };

  const handleResolve = async (eventId: string, note: string) => {
    try {
      await resolveEvent(eventId, note);
      loadEvents();
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      await dismissEvent(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to dismiss event:', error);
    }
  };

  const getSeverityBadgeClass = (severity: EventSeverity): string => {
    const classes = {
      INFO: 'bg-blue-100 text-blue-800',
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return classes[severity];
  };

  const getStatusBadgeClass = (status: EventStatus): string => {
    const classes = {
      open: 'bg-gray-100 text-gray-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-500',
    };
    return classes[status];
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      KPI_DEVIATION: 'KPI 편차',
      COST_VARIANCE_BREACH: '원가 차이 초과',
      MATERIAL_PRICE_SPIKE: '자재 단가 급등',
      SUPPLIER_RISK_ALERT: '공급자 위험',
      OUTPUT_SHORTFALL: '생산 실적 미달',
      CAPACITY_OVERLOAD: '설비 과부하',
      DEFECT_CLUSTER: '불량 군집',
      CAPA_OVERDUE: 'CAPA 지연',
      CASHFLOW_STRESS: '현금흐름 압박',
      BUDGET_OVERRUN: '예산 초과',
      ABNORMAL_JOURNAL: '전표 이상',
      OVERTIME_SURGE: '잔업 과다',
      SOP_NONCOMPLIANCE: 'SOP 미준수',
      APPROVAL_BYPASS: '승인 우회',
    };
    return labels[eventType] || eventType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="event-list">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          이벤트 목록
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          총 {count}건
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            표시할 이벤트가 없습니다.
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              onEventClick={onEventClick}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
              getSeverityBadgeClass={getSeverityBadgeClass}
              getStatusBadgeClass={getStatusBadgeClass}
              getEventTypeLabel={getEventTypeLabel}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {count > 20 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-4 py-2">{page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= count}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 이벤트 카드 컴포넌트
interface EventCardProps {
  event: Event;
  onEventClick?: (event: Event) => void;
  onAcknowledge: (eventId: string) => void;
  onResolve: (eventId: string, note: string) => void;
  onDismiss: (eventId: string) => void;
  getSeverityBadgeClass: (severity: EventSeverity) => string;
  getStatusBadgeClass: (status: EventStatus) => string;
  getEventTypeLabel: (eventType: string) => string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onEventClick,
  onAcknowledge,
  onResolve,
  onDismiss,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getEventTypeLabel,
}) => {
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [resolveNote, setResolveNote] = useState('');

  const handleResolve = () => {
    if (resolveNote.trim()) {
      onResolve(event.event_id, resolveNote);
      setShowResolveInput(false);
      setResolveNote('');
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={() => onEventClick?.(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 헤더: 타이틀, 유형, 심각도, 상태 */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadgeClass(event.severity)}`}
            >
              {event.severity}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(event.status)}`}
            >
              {event.status === 'open' && '발생'}
              {event.status === 'acknowledged' && '확인'}
              {event.status === 'in_progress' && '처리중'}
              {event.status === 'resolved' && '해결'}
              {event.status === 'dismissed' && '무시'}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {getEventTypeLabel(event.event_type)}
            </span>
          </div>

          {/* 제목 및 설명 */}
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {event.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {event.description}
          </p>

          {/* 범위 및 수치 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            {event.scope_name && (
              <span>범위: {event.scope_name}</span>
            )}
            {event.observed_value !== null && event.threshold_value !== null && (
              <>
                <span>관측: {event.observed_value}</span>
                <span>목표: {event.threshold_value}</span>
                {event.deviation_pct !== null && (
                  <span className={event.deviation_pct >= 0 ? 'text-red-600' : 'text-green-600'}>
                    ({event.deviation_pct > 0 ? '+' : ''}{event.deviation_pct}%)
                  </span>
                )}
              </>
            )}
          </div>

          {/* 시간 정보 */}
          <div className="text-xs text-gray-500">
            발생: {new Date(event.event_time).toLocaleString()}
            {event.acknowledged_at && (
              <> | 확인: {new Date(event.acknowledged_at).toLocaleString()}</>
            )}
            {event.resolved_at && (
              <> | 해결: {new Date(event.resolved_at).toLocaleString()}</>
            )}
          </div>

          {/* 근거/해결 정보 */}
          {event.resolution_note && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
              <div className="font-medium text-green-800 dark:text-green-300">해결 내용:</div>
              <div className="text-green-700 dark:text-green-400 mt-1">{event.resolution_note}</div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 ml-4">
          {event.status === 'open' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(event.event_id);
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              확인
            </button>
          )}
          {event.status === 'acknowledged' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResolveInput(!showResolveInput);
              }}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              해결
            </button>
          )}
          {showResolveInput && (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="해결 내용을 입력하세요"
                className="w-full text-xs border border-gray-300 rounded p-2"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolve();
                  }}
                  disabled={!resolveNote.trim()}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  확인
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowResolveInput(false);
                    setResolveNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          {(event.status === 'open' || event.status === 'acknowledged') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(event.event_id);
              }}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              무시
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventList;
