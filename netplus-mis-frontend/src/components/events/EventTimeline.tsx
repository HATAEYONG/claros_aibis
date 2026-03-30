/**
 * 이벤트 타임라인 컴포넌트
 * 시간대별 이벤트 발생 현황을 시각화
 */
import React, { useState, useEffect } from 'react';
import { getEvents, getEventClusters } from '../../services/eventService';
import { Event, EventSeverity, EventStatus } from '../../services/eventService';

interface EventTimelineProps {
  hours?: number;
  minSeverity?: EventSeverity;
  onEventClick?: (event: Event) => void;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ hours = 24, minSeverity, onEventClick }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<EventSeverity | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [hours, minSeverity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, clustersData] = await Promise.all([
        getEvents({ hours: `${hours}h` }),
        getEventClusters(hours, 2),
      ]);

      let filteredEvents = eventsData.results || [];

      // 심각도 필터
      if (minSeverity) {
        const severityOrder = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const minIndex = severityOrder.indexOf(minSeverity);
        filteredEvents = filteredEvents.filter((e: Event) =>
          severityOrder.indexOf(e.severity) >= minIndex
        );
      }

      // 선택된 심각도 필터
      if (selectedSeverity !== 'all') {
        filteredEvents = filteredEvents.filter((e: Event) => e.severity === selectedSeverity);
      }

      setEvents(filteredEvents);
      setClusters(clustersData.clusters || []);
    } catch (error) {
      console.error('Failed to load timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시간별로 그룹화
  const getEventsByHour = () => {
    const hourGroups: Record<string, Event[]> = {};

    events.forEach((event) => {
      const hour = new Date(event.event_time).getHours();
      const dateKey = new Date(event.event_time).toLocaleDateString();
      const key = `${dateKey} ${hour}:00`;

      if (!hourGroups[key]) {
        hourGroups[key] = [];
      }
      hourGroups[key].push(event);
    });

    return hourGroups;
  };

  const hourGroups = getEventsByHour();
  const sortedHours = Object.keys(hourGroups).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  const getSeverityColor = (severity: EventSeverity): string => {
    const colors = {
      INFO: 'bg-blue-500',
      LOW: 'bg-green-500',
      MEDIUM: 'bg-yellow-500',
      HIGH: 'bg-orange-500',
      CRITICAL: 'bg-red-500',
    };
    return colors[severity];
  };

  const getSeverityPriority = (severity: EventSeverity): number => {
    const priorities = { INFO: 1, LOW: 2, MEDIUM: 3, HIGH: 4, CRITICAL: 5 };
    return priorities[severity];
  };

  return (
    <div className="event-timeline">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">이벤트 타임라인</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            최근 {hours}시간 이벤트 현황
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as EventSeverity | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">전체 심각도</option>
            <option value={EventSeverity.INFO}>정보</option>
            <option value={EventSeverity.LOW}>낮음</option>
            <option value={EventSeverity.MEDIUM}>보통</option>
            <option value={EventSeverity.HIGH}>높음</option>
            <option value={EventSeverity.CRITICAL}>긴급</option>
          </select>
        </div>
      </div>

      {/* 이벤트 클러스터 */}
      {clusters.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            이벤트 클러스터 (2건 이상 발생)
          </h4>
          <div className="flex flex-wrap gap-2">
            {clusters.map((cluster, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-full text-red-700 dark:text-red-300 text-sm"
              >
                <span>{cluster.domain || '전체'}</span>
                <span>{cluster.event_count}건</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 타임라인 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : sortedHours.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          이벤트가 없습니다.
        </div>
      ) : (
        <div className="relative">
          {/* 타임라인 라인 */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

          <div className="space-y-6 ml-12">
            {sortedHours.map((hour) => {
              const hourEvents = hourGroups[hour];
              const latestEvent = hourEvents.sort((a, b) =>
                getSeverityPriority(a.severity) - getSeverityPriority(b.severity)
              )[0];

              return (
                <TimelineItem
                  key={hour}
                  hour={hour}
                  events={hourEvents}
                  latestEvent={latestEvent}
                  onEventClick={onEventClick}
                  getSeverityColor={getSeverityColor}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 심각도별 집계 */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          심각도별 집계
        </h4>
        <SeveritySummary events={events} />
      </div>
    </div>
  );
};

// 타임라인 아이템 컴포넌트
interface TimelineItemProps {
  hour: string;
  events: Event[];
  latestEvent: Event;
  onEventClick?: (event: Event) => void;
  getSeverityColor: (severity: EventSeverity) => string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  hour,
  events,
  latestEvent,
  onEventClick,
  getSeverityColor,
}) => {
  const date = new Date(hour);
  const timeLabel = date.toLocaleDateString() === new Date().toLocaleDateString()
    ? `오늘 ${date.getHours()}:00`
    : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;

  return (
    <div className="relative">
      {/* 타임라인 점 */}
      <div className="absolute -left-10 w-4 h-4 rounded-full bg-gray-400 border-2 border-white"></div>

      {/* 시간 라벨 */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{timeLabel}</div>

      {/* 이벤트 카드 */}
      <div className="space-y-2">
        {events.slice(0, 5).map((event) => (
          <TimelineEventCard
            key={event.event_id}
            event={event}
            onClick={() => onEventClick?.(event)}
            getSeverityColor={getSeverityColor}
          />
        ))}
        {events.length > 5 && (
          <div className="text-sm text-gray-500 text-center">
            외 {events.length - 5}건 더 있음
          </div>
        )}
      </div>
    </div>
  );
};

// 타임라인 이벤트 카드
const TimelineEventCard: React.FC<{
  event: Event;
  onClick: () => void;
  getSeverityColor: (severity: EventSeverity) => string;
}> = ({ event, onClick, getSeverityColor }) => {
  return (
    <div
      onClick={onClick}
      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`}></div>
        <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
        <span className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(event.severity)} text-white`}>
          {event.severity}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {event.event_type}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {event.scope_name || event.scope_id}
        {event.deviation_pct !== null && (
          <> ({event.deviation_pct > 0 ? '+' : ''}{event.deviation_pct}%)</>
        )}
      </div>
    </div>
  );
};

// 심각도 요약 컴포넌트
const SeveritySummary: React.FC<{ events: Event[] }> = ({ events }) => {
  const severityCounts = events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = events.length;

  return (
    <div className="grid grid-cols-5 gap-4">
      {['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((severity) => (
        <div key={severity} className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {severity === 'INFO' && '정보'}
            {severity === 'LOW' && '낮음'}
            {severity === 'MEDIUM' && '보통'}
            {severity === 'HIGH' && '높음'}
            {severity === 'CRITICAL' && '긴급'}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {severityCounts[severity] || 0}
          </div>
          <div className="text-xs text-gray-500">
            ({total > 0 ? ((severityCounts[severity] || 0) / total * 100).toFixed(0) : '0'}%)
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventTimeline;
