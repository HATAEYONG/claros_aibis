// EventDashboard.tsx - 이벤트 대시보드 컴포넌트
import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  Eye,
  Calendar,
  BarChart3,
  AlertCircle,
  Zap,
  Shield,
  Target,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Event {
  id: string;
  eventType: string;
  eventTypeName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  severityName: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved';
  statusName: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, any>;
  detectedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  relatedEvents?: string[];
  confidence?: number;
}

interface EventStatistics {
  totalEvents: number;
  severityDistribution: {
    severity: string;
    count: number;
    percentage: number;
  }[];
  typeDistribution: {
    eventType: string;
    count: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
  }[];
  trendData: {
    date: string;
    count: number;
    critical: number;
  }[];
}

const EventDashboard: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'timeline' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // 데모 이벤트 데이터
  const events: Event[] = [
    {
      id: 'evt1',
      eventType: 'cost_variance_breach',
      eventTypeName: '원가 차이 초과',
      severity: 'HIGH',
      severityName: '높음',
      status: 'open',
      statusName: '열림',
      title: '원자재 가격 급등',
      description: '주요 원자재 가격이 전월 대비 15% 상승하여 원가 압박 우려',
      sourceType: 'CostIntelligenceAgent',
      sourceId: 'cost_analysis_001',
      metadata: {
        material: '강판',
        previousPrice: 850000,
        currentPrice: 977500,
        varianceRate: 15,
        impactAmount: 127500
      },
      detectedAt: new Date(Date.now() - 1800000).toISOString(),
      confidence: 0.92,
      relatedEvents: ['evt2', 'evt3']
    },
    {
      id: 'evt2',
      eventType: 'quality_issue',
      eventTypeName: '품질 이슈',
      severity: 'MEDIUM',
      severityName: '중간',
      status: 'in_progress',
      statusName: '진행 중',
      title: '공급자 품질 이슈',
      description: 'A사 부품 불량률이 2% 목표 초과하여 2.5% 발생',
      sourceType: 'QualityIntelligenceAgent',
      sourceId: 'quality_check_001',
      metadata: {
        supplier: 'A사',
        partNumber: 'P-2024-001',
        defectRate: 2.5,
        targetRate: 2.0,
        affectedQuantity: 500
      },
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
      acknowledgedBy: '김품질',
      confidence: 0.88
    },
    {
      id: 'evt3',
      eventType: 'equipment_downtime',
      eventTypeName: '설비 다운타임',
      severity: 'MEDIUM',
      severityName: '중간',
      status: 'open',
      statusName: '열림',
      title: '설비 가동율 저하',
      description: '3호기 정비로 인한 가동율 일시적 저하 (82% → 75%)',
      sourceType: 'ProductionIntelligenceAgent',
      sourceId: 'equipment_003',
      metadata: {
        equipment: '3호기',
        previousRate: 82,
        currentRate: 75,
        downtimeReason: '정비',
        estimatedRecovery: new Date(Date.now() + 3600000).toISOString()
      },
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      confidence: 0.95
    },
    {
      id: 'evt4',
      eventType: 'supplier_risk',
      eventTypeName: '공급자 위험',
      severity: 'HIGH',
      severityName: '높음',
      status: 'open',
      statusName: '열림',
      title: '신제품 출산 지연',
      description: '예정보다 1주 지연되어 4월 중순 출산 예정',
      sourceType: 'PurchasingIntelligenceAgent',
      sourceId: 'supplier_007',
      metadata: {
        supplier: '개발 파트너사',
        plannedDate: '2026-03-25',
        expectedDate: '2026-04-15',
        delayReason: '기술적 문제',
        impact: '영업 일정'
      },
      detectedAt: new Date(Date.now() - 86400000).toISOString(),
      confidence: 0.85
    },
    {
      id: 'evt5',
      eventType: 'budget_overrun',
      eventTypeName: '예산 초과',
      severity: 'LOW',
      severityName: '낮음',
      status: 'resolved',
      statusName: '해결됨',
      title: '기술직 채용난',
      description: '자동화 설비 운영 인력 2명 미충족',
      sourceType: 'FinanceIntelligenceAgent',
      sourceId: 'hr_001',
      metadata: {
        department: '생산기술',
        required: 2,
        current: 0,
        impact: '운영 효율'
      },
      detectedAt: new Date(Date.now() - 172800000).toISOString(),
      resolvedAt: new Date(Date.now() - 86400000).toISOString(),
      confidence: 0.78
    },
    {
      id: 'evt6',
      eventType: 'kpi_deviation',
      eventTypeName: 'KPI 이탈',
      severity: 'INFO',
      severityName: '정보',
      status: 'open',
      statusName: '열림',
      title: '매출 목표 달성',
      description: '3월 매출 목표 150억원 대비 152.3억원으로 101.5% 달성',
      sourceType: 'KPIAgent',
      sourceId: 'kpi_revenue_001',
      metadata: {
        kpiName: '매출',
        target: 150,
        actual: 152.3,
        achievementRate: 101.5,
        trend: '상승'
      },
      detectedAt: new Date(Date.now() - 600000).toISOString(),
      confidence: 0.98
    },
    {
      id: 'evt7',
      eventType: 'inventory_shortage',
      eventTypeName: '재고 부족',
      severity: 'MEDIUM',
      severityName: '중간',
      status: 'acknowledged',
      statusName: '확인됨',
      title: '부품 재고 부족',
      description: 'P-2024-089 부품 재고가 안전재고 500개 미만으로 부족',
      sourceType: 'PurchasingIntelligenceAgent',
      sourceId: 'inventory_089',
      metadata: {
        partNumber: 'P-2024-089',
        currentStock: 420,
        safetyStock: 500,
        urgency: '높음',
        leadTime: 7
      },
      detectedAt: new Date(Date.now() - 1800000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 900000).toISOString(),
      acknowledgedBy: '이구매',
      confidence: 0.91
    },
    {
      id: 'evt8',
      eventType: 'production_shortfall',
      eventTypeName: '생산량 미달',
      severity: 'LOW',
      severityName: '낮음',
      status: 'resolved',
      statusName: '해결됨',
      title: '일일 생산량 회복',
      description: '어제 생산량이 목표 미달했으나 오늘 정상화',
      sourceType: 'ProductionIntelligenceAgent',
      sourceId: 'production_001',
      metadata: {
        targetQuantity: 1000,
        actualQuantity: 950,
        varianceRate: -5,
        reason: '설비 일시적 고장',
        recovered: true
      },
      detectedAt: new Date(Date.now() - 43200000).toISOString(),
      resolvedAt: new Date(Date.now() - 21600000).toISOString(),
      confidence: 0.94
    }
  ];

  // 이벤트 통계
  const statistics: EventStatistics = {
    totalEvents: 156,
    severityDistribution: [
      { severity: 'CRITICAL', count: 8, percentage: 5.1 },
      { severity: 'HIGH', count: 24, percentage: 15.4 },
      { severity: 'MEDIUM', count: 58, percentage: 37.2 },
      { severity: 'LOW', count: 42, percentage: 26.9 },
      { severity: 'INFO', count: 24, percentage: 15.4 }
    ],
    typeDistribution: [
      { eventType: 'kpi_deviation', count: 45 },
      { eventType: 'cost_variance_breach', count: 28 },
      { eventType: 'quality_issue', count: 22 },
      { eventType: 'supplier_risk', count: 18 },
      { eventType: 'equipment_downtime', count: 15 },
      { eventType: 'inventory_shortage', count: 12 },
      { eventType: 'budget_overrun', count: 10 },
      { eventType: 'production_shortfall', count: 6 }
    ],
    statusDistribution: [
      { status: 'open', count: 42 },
      { status: 'acknowledged', count: 18 },
      { status: 'in_progress', count: 24 },
      { status: 'resolved', count: 72 }
    ],
    trendData: [
      { date: '03-24', count: 18, critical: 2 },
      { date: '03-25', count: 24, critical: 3 },
      { date: '03-26', count: 32, critical: 1 },
      { date: '03-27', count: 28, critical: 4 },
      { date: '03-28', count: 22, critical: 2 },
      { date: '03-29', count: 16, critical: 1 },
      { date: '03-30', count: 16, critical: 0 }
    ]
  };

  // 필터링된 이벤트
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventTypeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-blue-500 text-white';
      case 'INFO':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HIGH':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'LOW':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'INFO':
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'acknowledged':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'resolved':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5" />;
      case 'acknowledged':
        return <Eye className="w-5 h-5" />;
      case 'in_progress':
        return <Activity className="w-5 h-5 animate-pulse" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전체</span>
          </div>
          <div className="text-3xl font-bold mb-1">{statistics.totalEvents}</div>
          <div className="text-sm text-blue-100">총 이벤트</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">긴급</span>
          </div>
          <div className="text-3xl font-bold mb-1">{statistics.severityDistribution[0].count}</div>
          <div className="text-sm text-red-100">CRITICAL</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">높음</span>
          </div>
          <div className="text-3xl font-bold mb-1">{statistics.severityDistribution[1].count}</div>
          <div className="text-sm text-orange-100">HIGH</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">진행</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {statistics.statusDistribution.find(s => s.status === 'in_progress')?.count || 0}
          </div>
          <div className="text-sm text-yellow-100">처리 중</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">해결</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {statistics.statusDistribution.find(s => s.status === 'resolved')?.count || 0}
          </div>
          <div className="text-sm text-green-100">해결됨</div>
        </div>
      </div>

      {/* 심각도 분포 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">심각도별 분포</h3>
        <div className="space-y-3">
          {statistics.severityDistribution.map((item) => (
            <div key={item.severity} className="flex items-center gap-3">
              <div className={`w-24 text-sm font-medium ${getSeverityColor(item.severity)}`}>
                {item.severity}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                <div
                  className={`h-6 rounded-full ${
                    item.severity === 'CRITICAL'
                      ? 'bg-red-500'
                      : item.severity === 'HIGH'
                      ? 'bg-orange-500'
                      : item.severity === 'MEDIUM'
                      ? 'bg-yellow-500'
                      : item.severity === 'LOW'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm font-medium text-gray-900 dark:text-white">
                {item.count}건
              </div>
              <div className="w-16 text-right text-sm text-gray-500 dark:text-gray-400">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이벤트 유형별 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">이벤트 유형별 현황</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statistics.typeDistribution.slice(0, 8).map((item) => {
            const event = events.find(e => e.eventType === item.eventType);
            return (
              <div
                key={item.eventType}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="text-lg font-bold text-gray-900 dark:text-white">{item.count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {event?.eventTypeName || item.eventType}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추세 그래프 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">최근 7일 이벤트 추이</h3>
        <div className="h-48 flex items-end gap-2">
          {statistics.trendData.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end h-32">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${(day.count / 40) * 100}%` }}
                  title={`전체: ${day.count}`}
                />
                {day.critical > 0 && (
                  <div
                    className="w-1/3 bg-red-500 rounded-t"
                    style={{ height: `${(day.count / 40) * 100}%` }}
                    title={`긴급: ${day.critical}`}
                  />
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{day.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이벤트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 심각도</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
          <option value="INFO">INFO</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 상태</option>
          <option value="open">열림</option>
          <option value="acknowledged">확인됨</option>
          <option value="in_progress">진행 중</option>
          <option value="resolved">해결됨</option>
        </select>
      </div>

      {/* 이벤트 리스트 */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 ${getSeverityBgColor(event.severity)} hover:shadow-md transition-all cursor-pointer`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{event.eventTypeName}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(event.detectedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(event.status)}`}>
                  {getStatusIcon(event.status)}
                  {event.statusName}
                </div>
              </div>

              {/* 메타데이터 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">출처:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">{event.sourceType}</span>
                </div>
                {event.confidence && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">신뢰도:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
                      {(event.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {event.acknowledgedBy && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">담당자:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">{event.acknowledgedBy}</span>
                  </div>
                )}
                {event.relatedEvents && event.relatedEvents.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">연관:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">{event.relatedEvents.length}건</span>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              {event.status === 'open' && (
                <div className="flex items-center gap-2 mt-3">
                  <button className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
                    확인
                  </button>
                  <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    처리 시작
                  </button>
                </div>
              )}
              {event.status === 'acknowledged' && (
                <div className="flex items-center gap-2 mt-3">
                  <button className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                    해결
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">이벤트 타임라인</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className="space-y-6">
            {events
              .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
              .map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(event.severity)}`}>
                    {getStatusIcon(event.status)}
                  </div>
                  <div className={`flex-1 p-4 rounded-lg border-l-4 ${getSeverityBgColor(event.severity)} hover:shadow-md transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.detectedAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.statusName}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                    {event.metadata && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="inline-block mr-3">
                            {key}: {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      {/* 상태별 분포 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">상태별 분포</h3>
        <div className="grid grid-cols-4 gap-4">
          {statistics.statusDistribution.map((item) => (
            <div key={item.status} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.status.replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이벤트 유형별 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">이벤트 유형별 상세</h3>
        <div className="space-y-3">
          {statistics.typeDistribution.map((item) => {
            const event = events.find(e => e.eventType === item.eventType);
            return (
              <div key={item.eventType} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {event?.eventTypeName || item.eventType}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.eventType}</div>
                </div>
                <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-blue-500"
                    style={{ width: `${(item.count / statistics.typeDistribution[0].count) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-bold text-gray-900 dark:text-white">{item.count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">이벤트 대시보드</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            실시간 이벤트 감시 및 관리
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">마지막 갱신</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {refreshTime.toLocaleTimeString('ko-KR')}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview' as const, label: '개요', icon: BarChart3 },
            { id: 'events' as const, label: '이벤트', icon: AlertTriangle },
            { id: 'timeline' as const, label: '타임라인', icon: Calendar },
            { id: 'analytics' as const, label: '분석', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'events' && renderEvents()}
          {selectedTab === 'timeline' && renderTimeline()}
          {selectedTab === 'analytics' && renderAnalytics()}
        </div>
      </div>

      {/* 실시간 상태 바 */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium">실시간 이벤트 감시 활성화</div>
            <div className="text-sm text-blue-100">20개 에이전트가 24시간 이벤트를 감시 중</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'open' || e.status === 'acknowledged' || e.status === 'in_progress').length}
            </div>
            <div className="text-xs text-blue-100">열린 이벤트</div>
          </div>
        </div>
      </div>

      {/* 이벤트 상세 모달 (선택적) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">이벤트 상세</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">제목</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{selectedEvent.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">설명</div>
                <div className="text-gray-700 dark:text-gray-300">{selectedEvent.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">심각도</div>
                  <div className={`inline-block px-3 py-1 rounded text-sm font-bold ${getSeverityColor(selectedEvent.severity)}`}>
                    {selectedEvent.severityName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">상태</div>
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.statusName}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">메타데이터</div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;
