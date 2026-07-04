// EventCorrelationAnalysis.tsx - 이벤트 상관분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  Network,
  AlertTriangle,
  Link,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  GitBranch,
  Target,
  Clock
} from 'lucide-react';

interface EventCorrelation {
  correlation_id: string;
  primary_event: {
    id: string;
    type: string;
    title: string;
    severity: 'critical' | 'major' | 'minor';
    detected_at: string;
  };
  correlated_events: Array<{
    id: string;
    type: string;
    title: string;
    severity: 'critical' | 'major' | 'minor';
    detected_at: string;
  }>;
  correlation_type: 'causal' | 'temporal' | 'spatial' | 'semantic';
  confidence_score: number;
  time_lag_ms?: number;
  description: string;
  created_at: string;
  verified: boolean;
}

interface CorrelationPattern {
  id: string;
  pattern_name: string;
  description: string;
  event_types: string[];
  frequency: number;
  avg_confidence: number;
  last_seen: string;
}

const EventCorrelationAnalysis: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCorrelation, setExpandedCorrelation] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');

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

  // 상관관계 데이터
  const correlations: EventCorrelation[] = [
    {
      correlation_id: 'corr001',
      primary_event: {
        id: 'evt001',
        type: 'kpi_deviation',
        title: '원가율 KPI 2.5% 이탈',
        severity: 'major',
        detected_at: new Date(Date.now() - 3600000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt002',
          type: 'cost_variance_breach',
          title: '철강재 원가 5.9% 상승',
          severity: 'major',
          detected_at: new Date(Date.now() - 3300000).toISOString()
        },
        {
          id: 'evt003',
          type: 'supplier_risk',
          title: '한국스틸 공급 리스크 상승',
          severity: 'minor',
          detected_at: new Date(Date.now() - 3000000).toISOString()
        }
      ],
      correlation_type: 'causal',
      confidence_score: 0.92,
      time_lag_ms: 300000,
      description: '원자재 가격 상승이 원가율 KPI 이탈의 직접적인 원인으로 분석됨',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      verified: true
    },
    {
      correlation_id: 'corr002',
      primary_event: {
        id: 'evt004',
        type: 'quality_issue',
        title: '치수 불량 8건 발생',
        severity: 'major',
        detected_at: new Date(Date.now() - 7200000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt005',
          type: 'equipment_downtime',
          title: '프레스 #1 온도 이상',
          severity: 'major',
          detected_at: new Date(Date.now() - 7500000).toISOString()
        },
        {
          id: 'evt006',
          type: 'equipment_downtime',
          title: '냉각탑 성능 저하',
          severity: 'minor',
          detected_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      correlation_type: 'causal',
      confidence_score: 0.88,
      time_lag_ms: -300000,
      description: '냉각 시스템 성능 저하 → 온도 제어 불안정 → 치수 불량으로 이어지는 인과관계 확인',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      verified: true
    },
    {
      correlation_id: 'corr003',
      primary_event: {
        id: 'evt007',
        type: 'production_shortfall',
        title: '라인 4 생산량 14% 미달',
        severity: 'major',
        detected_at: new Date(Date.now() - 14400000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt008',
          type: 'equipment_downtime',
          title: '용접기 #1 정비 중',
          severity: 'major',
          detected_at: new Date(Date.now() - 17280000).toISOString()
        },
        {
          id: 'evt009',
          type: 'overtime_excess',
          title: '잔업 시간 20% 증가',
          severity: 'minor',
          detected_at: new Date(Date.now() - 18000000).toISOString()
        }
      ],
      correlation_type: 'causal',
      confidence_score: 0.95,
      time_lag_ms: -2880000,
      description: '용접기 정비가 생산 부족의 직접적 원인, 잔업 증가는 2차적 영향',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      verified: true
    },
    {
      correlation_id: 'corr004',
      primary_event: {
        id: 'evt010',
        type: 'customer_complaint_spike',
        title: '도장 색상 불량 클레임 3건 급증',
        severity: 'major',
        detected_at: new Date(Date.now() - 28800000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt011',
          type: 'quality_issue',
          title: '도장 색상 불량 5건 발생',
          severity: 'minor',
          detected_at: new Date(Date.now() - 30600000).toISOString()
        },
        {
          id: 'evt012',
          type: 'process_deviation',
          title: '도장 공정 온도 편차',
          severity: 'minor',
          detected_at: new Date(Date.now() - 32400000).toISOString()
        }
      ],
      correlation_type: 'temporal',
      confidence_score: 0.85,
      time_lag_ms: 1800000,
      description: '도장 불량 발생 후 평균 30분 만에 클레임 접수',
      created_at: new Date(Date.now() - 28800000).toISOString(),
      verified: false
    },
    {
      correlation_id: 'corr005',
      primary_event: {
        id: 'evt013',
        type: 'demand_spike',
        title: '제품 A 수요 45% 급증',
        severity: 'major',
        detected_at: new Date(Date.now() - 43200000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt014',
          type: 'inventory_shortage',
          title: '제품 A 재고 부족',
          severity: 'critical',
          detected_at: new Date(Date.now() - 39600000).toISOString()
        },
        {
          id: 'evt015',
          type: 'production_shortfall',
          title: '제품 A 생산 계획 미달',
          severity: 'major',
          detected_at: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      correlation_type: 'causal',
      confidence_score: 0.91,
      time_lag_ms: 3600000,
      description: '수요 급증이 재고 부족과 생산 부족을 순차적으로 유발',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      verified: true
    },
    {
      correlation_id: 'corr006',
      primary_event: {
        id: 'evt016',
        type: 'cashflow_constraint',
        title: '현금흐름 압박 경고',
        severity: 'critical',
        detected_at: new Date(Date.now() - 86400000).toISOString()
      },
      correlated_events: [
        {
          id: 'evt017',
          type: 'accounts_receivable_increase',
          title: '미수금 11.5% 증가',
          severity: 'major',
          detected_at: new Date(Date.now() - 90000000).toISOString()
        },
        {
          id: 'evt018',
          type: 'budget_overrun',
          title: '매출원가 예산 2.5% 초과',
          severity: 'minor',
          detected_at: new Date(Date.now() - 93600000).toISOString()
        }
      ],
      correlation_type: 'causal',
      confidence_score: 0.87,
      time_lag_ms: 3600000,
      description: '미수금 증가와 원가 초과가 복합적으로 현금흐름 압박을 유발',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      verified: true
    }
  ];

  // 상관 패턴 데이터
  const patterns: CorrelationPattern[] = [
    {
      id: 'pat001',
      pattern_name: '원자재 가격 → 원가율',
      description: '원자재 가격 상승이 2-4시간 내에 원가율 KPI 이탈을 유발',
      event_types: ['cost_variance_breach', 'kpi_deviation'],
      frequency: 23,
      avg_confidence: 0.91,
      last_seen: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'pat002',
      pattern_name: '냉각 시스템 → 치수 불량',
      description: '냉각탑 성능 저하가 24-48시간 내에 치수 불량으로 이어짐',
      event_types: ['equipment_downtime', 'quality_issue'],
      frequency: 8,
      avg_confidence: 0.88,
      last_seen: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'pat003',
      pattern_name: '수요 급증 → 재고 부족',
      description: '수요 급증 시 평균 6시간 후 재고 부족 발생',
      event_types: ['demand_spike', 'inventory_shortage'],
      frequency: 12,
      avg_confidence: 0.89,
      last_seen: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: 'pat004',
      pattern_name: '미수금 → 현금흐름',
      description: '미수금 증가와 현금흐름 압박의 강한 상관관계',
      event_types: ['accounts_receivable_increase', 'cashflow_constraint'],
      frequency: 15,
      avg_confidence: 0.85,
      last_seen: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  // 필터링
  const filteredCorrelations = correlations.filter(corr => {
    const matchesSearch = searchQuery === '' ||
      corr.primary_event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      corr.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || corr.correlation_type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || corr.primary_event.severity === selectedSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  });

  // 통계
  const stats = {
    totalCorrelations: correlations.length,
    verifiedCorrelations: correlations.filter(c => c.verified).length,
    avgConfidence: correlations.reduce((sum, c) => sum + c.confidence_score, 0) / correlations.length,
    causalCount: correlations.filter(c => c.correlation_type === 'causal').length,
    temporalCount: correlations.filter(c => c.correlation_type === 'temporal').length
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'minor': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCorrelationTypeColor = (type: string) => {
    switch (type) {
      case 'causal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'temporal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'spatial': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'semantic': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCorrelationTypeLabel = (type: string) => {
    switch (type) {
      case 'causal': return '인과';
      case 'temporal': return '시계열';
      case 'spatial': return '공간';
      case 'semantic': return '의미';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">이벤트 상관분석</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            이벤트 간 인과관계와 상관패턴을 분석하고 시각화
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
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Network className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전체</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalCorrelations}</div>
          <div className="text-sm text-purple-100">상관관계</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">검증</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.verifiedCorrelations}</div>
          <div className="text-sm text-green-100">검증됨</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <GitBranch className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">인과</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.causalCount}</div>
          <div className="text-sm text-blue-100">인과 관계</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">시간</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.temporalCount}</div>
          <div className="text-sm text-orange-100">시계열</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">신뢰도</span>
          </div>
          <div className="text-3xl font-bold mb-1">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          <div className="text-sm text-emerald-100">평균 신뢰도</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="상관관계 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 유형</option>
          <option value="causal">인과</option>
          <option value="temporal">시계열</option>
          <option value="spatial">공간</option>
          <option value="semantic">의미</option>
        </select>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 심각도</option>
          <option value="critical">긴급</option>
          <option value="major">주요</option>
          <option value="minor">경미</option>
        </select>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="24h">최근 24시간</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="all">전체</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상관관계 리스트 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-500" />
              상관관계 목록
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredCorrelations.map((corr) => (
              <div
                key={corr.correlation_id}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                onClick={() => setExpandedCorrelation(expandedCorrelation === corr.correlation_id ? null : corr.correlation_id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(corr.primary_event.severity)}`} />
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCorrelationTypeColor(corr.correlation_type)}`}>
                        {getCorrelationTypeLabel(corr.correlation_type)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        신뢰도: {(corr.confidence_score * 100).toFixed(0)}%
                      </span>
                      {corr.verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                          <Target className="w-3 h-3" />
                          검증됨
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{corr.primary_event.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{corr.description}</p>
                  </div>
                  {expandedCorrelation === corr.correlation_id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>

                {expandedCorrelation === corr.correlation_id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">연결된 이벤트</div>
                      <div className="space-y-2">
                        {corr.correlated_events.map((event, idx) => (
                          <div key={event.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(event.detected_at).toLocaleTimeString('ko-KR')}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white flex-1">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {corr.time_lag_ms !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        시간 차이: {corr.time_lag_ms > 0 ? `+${(corr.time_lag_ms / 60000).toFixed(0)}분` : `${(corr.time_lag_ms / 60000).toFixed(0)}분`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 상관 패턴 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              상관 패턴
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{pattern.pattern_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pattern.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{pattern.frequency}회</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">빈도</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {pattern.event_types.map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {type}
                    </span>
                  ))}
                  <span className="ml-auto text-gray-500 dark:text-gray-400">
                    신뢰도: {(pattern.avg_confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  마지막 관측: {new Date(pattern.last_seen).toLocaleString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 상관관계 그래프 시각화 (간단 버전) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-green-500" />
          이벤트 상관 네트워크
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {correlations.slice(0, 6).map((corr) => (
            <div key={corr.correlation_id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(corr.primary_event.severity)}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                  {corr.primary_event.title}
                </span>
              </div>
              <div className="space-y-1">
                {corr.correlated_events.map((event, idx) => (
                  <div key={event.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{event.title}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                신뢰도: {(corr.confidence_score * 100).toFixed(0)}% | {getCorrelationTypeLabel(corr.correlation_type)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventCorrelationAnalysis;
