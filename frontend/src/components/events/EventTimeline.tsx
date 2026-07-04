// EventTimeline.tsx - 이벤트 타임라인 컴포넌트
import { useState, useEffect } from 'react';
import {
  Clock,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';

interface Event {
  event_id: string;
  event_type: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  scope_name: string;
  observed_value: number | null;
  threshold_value: number | null;
  deviation_pct: number | null;
  event_time: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface Cluster {
  domain: string;
  event_count: number;
  highest_severity: string;
}

const EventTimeline: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [hoursRange, setHoursRange] = useState<number>(24);
  const [viewMode, setViewMode] = useState<'timeline' | 'cluster' | 'chart'>('timeline');

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // Mock 데이터
  const mockEvents: Event[] = [
    {
      event_id: 'evt001',
      event_type: 'KPI_DEVIATION',
      title: '원가율 KPI 이탈',
      description: '원가율이 목표 75%를 초과하여 77.5%로 상승했습니다.',
      severity: 'high',
      status: 'open',
      scope_name: '전체 제품',
      observed_value: 77.5,
      threshold_value: 75.0,
      deviation_pct: 3.33,
      event_time: new Date(Date.now() - 1800000).toISOString()
    },
    {
      event_id: 'evt002',
      event_type: 'DEFECT_CLUSTER',
      title: '치수 불량 급증',
      description: '치수 불량이 지난 24시간 동안 8건 발생했습니다.',
      severity: 'critical',
      status: 'acknowledged',
      scope_name: '라인 A',
      observed_value: 8,
      threshold_value: 5,
      deviation_pct: 60.0,
      event_time: new Date(Date.now() - 3600000).toISOString(),
      acknowledged_at: new Date(Date.now() - 3500000).toISOString()
    },
    {
      event_id: 'evt003',
      event_type: 'OUTPUT_SHORTFALL',
      title: '생산 실적 미달',
      description: '금일 생산 실적이 목표의 85%에 그쳤습니다.',
      severity: 'medium',
      status: 'in_progress',
      scope_name: '라인 B',
      observed_value: 850,
      threshold_value: 1000,
      deviation_pct: -15.0,
      event_time: new Date(Date.now() - 7200000).toISOString()
    },
    {
      event_id: 'evt004',
      event_type: 'SUPPLIER_RISK_ALERT',
      title: '공급자 납기 지연',
      description: '공급자 A社가 납기일을 3일 초과했습니다.',
      severity: 'high',
      status: 'open',
      scope_name: '자재 C',
      observed_value: 3,
      threshold_value: 0,
      deviation_pct: null,
      event_time: new Date(Date.now() - 10800000).toISOString()
    },
    {
      event_id: 'evt005',
      event_type: 'CAPA_OVERDUE',
      title: 'CAPA 기한 초과',
      description: 'CAPA-2024-001의 기한이 2일 경과되었습니다.',
      severity: 'high',
      status: 'resolved',
      scope_name: 'CAPA-2024-001',
      observed_value: 2,
      threshold_value: 0,
      deviation_pct: null,
      event_time: new Date(Date.now() - 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      event_id: 'evt006',
      event_type: 'CASHFLOW_STRESS',
      title: '현금흐름 압박 경고',
      description: '예상 현금흐름이 목표의 80% 수준입니다.',
      severity: 'medium',
      status: 'open',
      scope_name: '전체',
      observed_value: 80,
      threshold_value: 90,
      deviation_pct: -11.11,
      event_time: new Date(Date.now() - 14400000).toISOString()
    },
    {
      event_id: 'evt007',
      event_type: 'OVERTIME_SURGE',
      title: '잔업 과다 발생',
      description: '조립 공정에서 주당 평균 12시간의 잔업이 발생했습니다.',
      severity: 'medium',
      status: 'acknowledged',
      scope_name: '조립 공정',
      observed_value: 12,
      threshold_value: 8,
      deviation_pct: 50.0,
      event_time: new Date(Date.now() - 18000000).toISOString(),
      acknowledged_at: new Date(Date.now() - 17000000).toISOString()
    },
    {
      event_id: 'evt008',
      event_type: 'DEFECT_CLUSTER',
      title: '용접 불량 발생',
      description: '용접 불량이 3건 연속 발생했습니다.',
      severity: 'high',
      status: 'open',
      scope_name: '라인 C',
      observed_value: 3,
      threshold_value: 2,
      deviation_pct: 50.0,
      event_time: new Date(Date.now() - 21600000).toISOString()
    }
  ];

  const mockClusters: Cluster[] = [
    { domain: 'quality', event_count: 3, highest_severity: 'critical' },
    { domain: 'production', event_count: 2, highest_severity: 'high' },
    { domain: 'purchase', event_count: 1, highest_severity: 'high' }
  ];

  const eventTypeLabels: Record<string, string> = {
    KPI_DEVIATION: 'KPI 이탈',
    DEFECT_CLUSTER: '불량 군집',
    OUTPUT_SHORTFALL: '생산 미달',
    SUPPLIER_RISK_ALERT: '공급자 위험',
    CAPA_OVERDUE: 'CAPA 지연',
    CASHFLOW_STRESS: '현금흐름 압박',
    OVERTIME_SURGE: '잔업 과다',
    BUDGET_OVERRUN: '예산 초과',
    MATERIAL_PRICE_SPIKE: '자재 단가 급등',
    CAPACITY_OVERLOAD: '설비 과부하'
  };

  const domainLabels: Record<string, string> = {
    quality: '품질',
    production: '생산',
    purchase: '구매',
    cost: '원가',
    finance: '재무',
    hr: '인사'
  };

  // 시간 범위 필터링
  const filteredEvents = mockEvents.filter(event => {
    const eventTime = new Date(event.event_time);
    const cutoffTime = new Date(Date.now() - hoursRange * 60 * 60 * 1000);
    const matchesTime = eventTime >= cutoffTime;
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return matchesTime && matchesSeverity;
  });

  // 시간별 그룹화
  const getEventsByHour = () => {
    const hourGroups: Record<string, Event[]> = {};
    filteredEvents.forEach(event => {
      const date = new Date(event.event_time);
      const hour = date.getHours();
      const dateKey = date.toLocaleDateString();
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

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      info: 'bg-blue-500'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getSeverityBgColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
      high: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
      medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
      low: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      critical: AlertOctagon,
      high: AlertTriangle,
      medium: AlertCircle,
      low: Info,
      info: Clock
    };
    return icons[severity as keyof typeof icons] || Clock;
  };

  const getSeverityPriority = (severity: string): number => {
    const priorities = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    return priorities[severity as keyof typeof priorities] || 0;
  };

  // 시간대별 통계
  const getHourlyStats = () => {
    const stats: Record<string, { count: number; severity: string }> = {};
    const now = new Date();

    for (let i = hoursRange; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = `${time.getHours()}:00`;
      stats[key] = { count: 0, severity: 'info' };
    }

    filteredEvents.forEach(event => {
      const time = new Date(event.event_time);
      const key = `${time.getHours()}:00`;
      if (stats[key]) {
        stats[key].count++;
        if (getSeverityPriority(event.severity) > getSeverityPriority(stats[key].severity)) {
          stats[key].severity = event.severity;
        }
      }
    });

    return stats;
  };

  const hourlyStats = getHourlyStats();

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">이벤트 타임라인</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            최근 {hoursRange}시간 동안 발생한 이벤트 현황
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 뷰 모드 선택 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'timeline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              타임라인
            </button>
            <button
              onClick={() => setViewMode('cluster')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'cluster'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              클러스터
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              차트
            </button>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <select
              value={hoursRange}
              onChange={(e) => setHoursRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={6}>최근 6시간</option>
              <option value={12}>최근 12시간</option>
              <option value={24}>최근 24시간</option>
              <option value={48}>최근 48시간</option>
              <option value={72}>최근 72시간</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">전체 심각도</option>
              <option value="critical">긴급</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
              <option value="info">정보</option>
            </select>
          </div>
        </div>
      </div>

      {/* 심각도별 통계 */}
      <div className="grid grid-cols-5 gap-4">
        {['critical', 'high', 'medium', 'low', 'info'].map(severity => {
          const count = filteredEvents.filter(e => e.severity === severity).length;
          const label = {
            critical: '긴급',
            high: '높음',
            medium: '보통',
            low: '낮음',
            info: '정보'
          }[severity];
          return (
            <div key={severity} className={`p-4 rounded-lg border ${getSeverityBgColor(severity)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></div>
              </div>
              <div className="text-2xl font-bold mt-2">{count}</div>
              <div className="text-xs opacity-70">
                {filteredEvents.length > 0 ? `${((count / filteredEvents.length) * 100).toFixed(0)}%` : '0%'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 타임라인 뷰 */}
      {viewMode === 'timeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            타임라인
          </h2>

          {sortedHours.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              표시할 이벤트가 없습니다.
            </div>
          ) : (
            <div className="relative">
              {/* 타임라인 라인 */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

              <div className="space-y-6 ml-12">
                {sortedHours.map((hour) => {
                  const hourEvents = hourGroups[hour];
                  const latestEvent = hourEvents.sort((a, b) =>
                    getSeverityPriority(b.severity) - getSeverityPriority(a.severity)
                  )[0];

                  const date = new Date(hour);
                  const timeLabel = date.toLocaleDateString() === new Date().toLocaleDateString()
                    ? `오늘 ${date.getHours()}:00`
                    : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;

                  const SeverityIcon = getSeverityIcon(latestEvent.severity);

                  return (
                    <div key={hour} className="relative">
                      {/* 타임라인 점 */}
                      <div className={`absolute -left-10 w-4 h-4 rounded-full border-2 border-white ${getSeverityColor(latestEvent.severity)}`}></div>

                      {/* 시간 라벨 */}
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {timeLabel}
                        <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBgColor(latestEvent.severity)}`}>
                          {hourEvents.length}건
                        </span>
                      </div>

                      {/* 이벤트 카드 */}
                      <div className="space-y-2">
                        {hourEvents.slice(0, 5).map((event) => {
                          const EventSeverityIcon = getSeverityIcon(event.severity);
                          return (
                            <div
                              key={event.event_id}
                              className={`p-4 border rounded-lg ${getSeverityBgColor(event.severity)} hover:shadow-md transition`}
                            >
                              <div className="flex items-start gap-3">
                                <EventSeverityIcon className={`w-5 h-5 ${getSeverityColor(event.severity).replace('bg-', 'text-')} mt-0.5`} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {event.title}
                                    </h4>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(event.severity)} text-white`}>
                                      {event.severity.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                    <span>{eventTypeLabels[event.event_type] || event.event_type}</span>
                                    <span>•</span>
                                    <span>{event.scope_name}</span>
                                    {event.deviation_pct !== null && (
                                      <>
                                        <span>•</span>
                                        <span className={event.deviation_pct > 0 ? 'text-red-600' : 'text-green-600'}>
                                          {event.deviation_pct > 0 ? '+' : ''}{event.deviation_pct.toFixed(1)}%
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(event.event_time).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {hourEvents.length > 5 && (
                          <div className="text-sm text-gray-500 text-center p-2">
                            +{hourEvents.length - 5}건 더 있음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 클러스터 뷰 */}
      {viewMode === 'cluster' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            도메인별 이벤트 클러스터
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockClusters.map((cluster, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityBgColor(cluster.highest_severity)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {domainLabels[cluster.domain] || cluster.domain}
                  </h3>
                  <Zap className={`w-5 h-5 ${getSeverityColor(cluster.highest_severity).replace('bg-', 'text-')}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {cluster.event_count}
                  <span className="text-sm font-normal text-gray-500 ml-1">건</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(cluster.highest_severity)} text-white`}>
                    최고: {cluster.highest_severity.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 도메인별 이벤트 목록 */}
          <div className="mt-6 space-y-4">
            {mockClusters.map((cluster, index) => {
              const domainEvents = filteredEvents.filter(e =>
                e.event_type.includes('DEFECT') && cluster.domain === 'quality' ||
                e.event_type.includes('OUTPUT') && cluster.domain === 'production' ||
                e.event_type.includes('SUPPLIER') && cluster.domain === 'purchase'
              );

              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {domainLabels[cluster.domain] || cluster.domain} ({domainEvents.length}건)
                  </h4>
                  <div className="space-y-2">
                    {domainEvents.slice(0, 3).map(event => {
                      const EventSeverityIcon = getSeverityIcon(event.severity);
                      return (
                        <div key={event.event_id} className="flex items-center gap-3 text-sm">
                          <EventSeverityIcon className={`w-4 h-4 ${getSeverityColor(event.severity).replace('bg-', 'text-')}`} />
                          <span className="flex-1 text-gray-700 dark:text-gray-300">{event.title}</span>
                          <span className="text-gray-500">{new Date(event.event_time).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                    {domainEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{domainEvents.length - 3}건 더 있음
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 차트 뷰 */}
      {viewMode === 'chart' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            시간대별 이벤트 추이
          </h2>

          <div className="space-y-2">
            {Object.entries(hourlyStats).map(([time, stats]) => (
              <div key={time} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                  {time}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className="h-6 rounded transition-all"
                    style={{
                      width: `${stats.count * 10}%`,
                      maxWidth: '100%',
                      minWidth: stats.count > 0 ? '20px' : '0px',
                      backgroundColor: stats.count > 0 ? getSeverityColor(stats.severity).replace('bg-', '#') : '#e5e7eb'
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {stats.count}
                  </span>
                  {stats.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBgColor(stats.severity)}`}>
                      {stats.severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 마지막 업데이트 정보 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        마지막 업데이트: {refreshTime.toLocaleString()}
      </div>
    </div>
  );
};

export default EventTimeline;
