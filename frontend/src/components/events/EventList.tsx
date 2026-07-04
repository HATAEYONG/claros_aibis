// EventList.tsx - 이벤트 목록 컴포넌트
import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Bell,
  ChevronDown,
  Eye,
  AlertOctagon
} from 'lucide-react';

interface Event {
  event_id: string;
  event_type: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  scope_name: string;
  scope_id: string;
  observed_value: number | null;
  threshold_value: number | null;
  deviation_pct: number | null;
  event_time: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  metadata: Record<string, any>;
}

const EventList: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

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
      scope_id: 'all',
      observed_value: 77.5,
      threshold_value: 75.0,
      deviation_pct: 3.33,
      event_time: new Date(Date.now() - 1800000).toISOString(),
      metadata: { domain: 'cost', kpi_id: 'cost_ratio' }
    },
    {
      event_id: 'evt002',
      event_type: 'DEFECT_CLUSTER',
      title: '치수 불량 급증',
      description: '치수 불량이 지난 24시간 동안 8건 발생했습니다.',
      severity: 'critical',
      status: 'acknowledged',
      scope_name: '라인 A',
      scope_id: 'line_a',
      observed_value: 8,
      threshold_value: 5,
      deviation_pct: 60.0,
      event_time: new Date(Date.now() - 3600000).toISOString(),
      acknowledged_at: new Date(Date.now() - 3500000).toISOString(),
      acknowledged_by: '김품질',
      metadata: { domain: 'quality', defect_type: 'dimensional' }
    },
    {
      event_id: 'evt003',
      event_type: 'OUTPUT_SHORTFALL',
      title: '생산 실적 미달',
      description: '금일 생산 실적이 목표의 85%에 그쳤습니다.',
      severity: 'medium',
      status: 'in_progress',
      scope_name: '라인 B',
      scope_id: 'line_b',
      observed_value: 850,
      threshold_value: 1000,
      deviation_pct: -15.0,
      event_time: new Date(Date.now() - 7200000).toISOString(),
      metadata: { domain: 'production', line_id: 'line_b' }
    },
    {
      event_id: 'evt004',
      event_type: 'SUPPLIER_RISK_ALERT',
      title: '공급자 납기 지연',
      description: '공급자 A社가 납기일을 3일 초과했습니다.',
      severity: 'high',
      status: 'open',
      scope_name: '자재 C',
      scope_id: 'material_c',
      observed_value: 3,
      threshold_value: 0,
      deviation_pct: null,
      event_time: new Date(Date.now() - 10800000).toISOString(),
      metadata: { domain: 'purchase', supplier_id: 'supplier_a' }
    },
    {
      event_id: 'evt005',
      event_type: 'CAPA_OVERDUE',
      title: 'CAPA 기한 초과',
      description: 'CAPA-2024-001의 기한이 2일 경과되었습니다.',
      severity: 'high',
      status: 'resolved',
      scope_name: 'CAPA-2024-001',
      scope_id: 'capa_2024_001',
      observed_value: 2,
      threshold_value: 0,
      deviation_pct: null,
      event_time: new Date(Date.now() - 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 3600000).toISOString(),
      resolution_note: '대체 자재 도입으로 해결 완료',
      metadata: { domain: 'quality', capa_id: 'CAPA-2024-001' }
    },
    {
      event_id: 'evt006',
      event_type: 'CASHFLOW_STRESS',
      title: '현금흐름 압박 경고',
      description: '예상 현금흐름이 목표의 80% 수준입니다.',
      severity: 'medium',
      status: 'open',
      scope_name: '전체',
      scope_id: 'all',
      observed_value: 80,
      threshold_value: 90,
      deviation_pct: -11.11,
      event_time: new Date(Date.now() - 14400000).toISOString(),
      metadata: { domain: 'finance', metric: 'cashflow_ratio' }
    },
    {
      event_id: 'evt007',
      event_type: 'OVERTIME_SURGE',
      title: '잔업 과다 발생',
      description: '조립 공정에서 주당 평균 12시간의 잔업이 발생했습니다.',
      severity: 'medium',
      status: 'acknowledged',
      scope_name: '조립 공정',
      scope_id: 'assembly',
      observed_value: 12,
      threshold_value: 8,
      deviation_pct: 50.0,
      event_time: new Date(Date.now() - 18000000).toISOString(),
      acknowledged_at: new Date(Date.now() - 17000000).toISOString(),
      acknowledged_by: '이생산',
      metadata: { domain: 'hr', process: 'assembly' }
    }
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

  const severityLabels: Record<string, string> = {
    critical: '긴급',
    high: '높음',
    medium: '보통',
    low: '낮음',
    info: '정보'
  };

  const statusLabels: Record<string, string> = {
    open: '발생',
    acknowledged: '확인',
    in_progress: '처리중',
    resolved: '해결',
    dismissed: '무시'
  };

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    const matchesType = selectedType === 'all' || event.event_type === selectedType;
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      high: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      info: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      acknowledged: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      resolved: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      dismissed: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      critical: AlertOctagon,
      high: AlertTriangle,
      medium: AlertCircle,
      low: Info,
      info: Bell
    };
    return icons[severity as keyof typeof icons] || Info;
  };

  const handleAcknowledge = (eventId: string) => {
    console.log('Acknowledging event:', eventId);
    // API 호출 로직
  };

  const handleResolve = (eventId: string) => {
    console.log('Resolving event:', eventId);
    // API 호출 로직
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">이벤트 목록</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            시스템 이벤트를 모니터링하고 관리
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="이벤트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* 심각도 필터 */}
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

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 상태</option>
            <option value="open">발생</option>
            <option value="acknowledged">확인</option>
            <option value="in_progress">처리중</option>
            <option value="resolved">해결</option>
            <option value="dismissed">무시</option>
          </select>

          {/* 유형 필터 */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 유형</option>
            {Object.entries(eventTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-5 gap-4">
        {['critical', 'high', 'medium', 'low', 'info'].map(severity => {
          const count = mockEvents.filter(e => e.severity === severity).length;
          return (
            <div key={severity} className={`p-4 rounded-lg border ${getSeverityColor(severity)}`}>
              <div className="text-sm font-medium opacity-80">{severityLabels[severity]}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* 이벤트 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              이벤트 목록 ({filteredEvents.length}건)
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              마지막 업데이트: {refreshTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              표시할 이벤트가 없습니다.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const SeverityIcon = getSeverityIcon(event.severity);
              return (
                <div key={event.event_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-start gap-4">
                    {/* 심각도 아이콘 */}
                    <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>

                    {/* 이벤트 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* 제목과 배지 */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {event.title}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(event.severity)}`}>
                              {severityLabels[event.severity]}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(event.status)}`}>
                              {statusLabels[event.status]}
                            </span>
                          </div>

                          {/* 설명 */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {event.description}
                          </p>

                          {/* 상세 정보 */}
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                            <span>{eventTypeLabels[event.event_type] || event.event_type}</span>
                            <span>•</span>
                            <span>{event.scope_name}</span>
                            {event.observed_value !== null && (
                              <>
                                <span>•</span>
                                <span>관측: {event.observed_value}</span>
                              </>
                            )}
                            {event.threshold_value !== null && (
                              <>
                                <span>•</span>
                                <span>목표: {event.threshold_value}</span>
                              </>
                            )}
                            {event.deviation_pct !== null && (
                              <span className={event.deviation_pct > 0 ? 'text-red-600' : 'text-green-600'}>
                                ({event.deviation_pct > 0 ? '+' : ''}{event.deviation_pct.toFixed(1)}%)
                              </span>
                            )}
                          </div>

                          {/* 시간 정보 */}
                          <div className="text-xs text-gray-400 mt-1">
                            발생: {new Date(event.event_time).toLocaleString()}
                            {event.acknowledged_at && (
                              <> | 확인: {new Date(event.acknowledged_at).toLocaleString()} ({event.acknowledged_by})</>
                            )}
                            {event.resolved_at && (
                              <> | 해결: {new Date(event.resolved_at).toLocaleString()}</>
                            )}
                          </div>

                          {/* 해결 내용 */}
                          {event.resolution_note && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                              <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">해결 내용:</div>
                              <div className="text-sm text-green-700 dark:text-green-400">{event.resolution_note}</div>
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedEvent(expandedEvent === event.event_id ? null : event.event_id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          {event.status === 'open' && (
                            <button
                              onClick={() => handleAcknowledge(event.event_id)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                            >
                              확인
                            </button>
                          )}
                          {event.status === 'acknowledged' && (
                            <button
                              onClick={() => handleResolve(event.event_id)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"
                            >
                              해결
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 확장 상세 정보 */}
                      {expandedEvent === event.event_id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">이벤트 ID:</span>
                              <span className="ml-2 text-gray-900 dark:text-white font-mono">{event.event_id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">범위 ID:</span>
                              <span className="ml-2 text-gray-900 dark:text-white font-mono">{event.scope_id}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-gray-500 dark:text-gray-400">메타데이터:</span>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EventList;
