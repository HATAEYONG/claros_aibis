// AgentRecommendationManagement.tsx - 에이전트 추천 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Star,
  TrendingUp,
  Eye,
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Brain,
  Target,
  Award
} from 'lucide-react';

interface Recommendation {
  id: string;
  agentRunId: string;
  agentName: string;
  agentType: string;
  title: string;
  description: string;
  recommendationType: 'cost_reduction' | 'quality_improvement' | 'process_optimization' | 'risk_mitigation' | 'revenue_increase';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact_estimate: string;
  confidence_score: number;
  evidence_refs: Array<{ type: string; id: string; description: string }>;
  status: 'pending' | 'approved' | 'rejected' | 'implemented' | 'expired';
  created_at: string;
  expires_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  implementation_progress?: number;
  business_impact?: {
    cost_savings?: number;
    revenue_increase?: number;
    efficiency_gain?: number;
    risk_reduction?: number;
  };
}

const AgentRecommendationManagement: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

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

  const handleApprove = async (id: string) => {
    // 승인 처리 로직
    console.log('Approving recommendation:', id);
  };

  const handleReject = async (id: string) => {
    // 거부 처리 로직
    console.log('Rejecting recommendation:', id);
  };

  // 추천 데이터
  const recommendations: Recommendation[] = [
    {
      id: 'rec001',
      agentRunId: 'run-003',
      agentName: 'CostIntelligenceAgent',
      agentType: '원가 지능',
      title: '철강재 공급업체 다변화를 통한 원가 절감',
      description: '현재 단일 공급업체 의존도가 80% 이상으로, 위험 노출도가 높습니다. 2차 공급업체를 추가하여 경쟁 입찰을 유도하고 연간 5% 이상의 원가 절감 효과를 기대할 수 있습니다.',
      recommendationType: 'cost_reduction',
      priority: 'high',
      impact_estimate: '연간 2.5억원 비용 절감, 리스크 30% 감소',
      confidence_score: 0.92,
      evidence_refs: [
        { type: 'kpi_deviation', id: 'kpi_001', description: '원가율 KPI 2.5% 이탈' },
        { type: 'supplier_analysis', id: 'supp_001', description: '한국스틸 의존도 82%' },
        { type: 'market_data', id: 'mkt_001', description: '철강재 시장 가격 상승 추세' }
      ],
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      business_impact: {
        cost_savings: 250000000,
        risk_reduction: 30
      }
    },
    {
      id: 'rec002',
      agentRunId: 'run-004',
      agentName: 'RecommendationAgent',
      agentType: '추천',
      title: '프레스 금형 마모 예방 정비 주기 단축',
      description: '최근 치수 불량이 증가하는 패턴을 분석한 결과, 프레스 금형 마모가 주요 원인으로 파악되었습니다. 예방 정비 주기를 500 사이클에서 400 사이클로 단축하면 불량률을 15% 감소할 수 있습니다.',
      recommendationType: 'quality_improvement',
      priority: 'critical',
      impact_estimate: '불량률 15% 감소, 연간 1.2억원 품질 비용 절감',
      confidence_score: 0.88,
      evidence_refs: [
        { type: 'quality_issue', id: 'qi_001', description: '치수 불량 8건 발생' },
        { type: 'root_cause', id: 'rc_001', description: '금형 마모가 원인으로 확인' },
        { type: 'equipment_data', id: 'eq_001', description: '프레스 #1, #2 500사이클 운행' }
      ],
      status: 'approved',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      approved_by: '김설비',
      approved_at: new Date(Date.now() - 3600000).toISOString(),
      implementation_progress: 60
    },
    {
      id: 'rec003',
      agentRunId: 'run-007',
      agentName: 'ProductionIntelligenceAgent',
      agentType: '생산 지능',
      title: '라인 4 가동율 개선을 위한 용접기 추가 설치',
      description: '라인 4의 용접 공정이 병목으로 파악되었습니다. 용접기 1대를 추가하여 라인 밸런스를 맞추면 전체 라인 가동율을 78%에서 88%로 향상할 수 있습니다.',
      recommendationType: 'process_optimization',
      priority: 'high',
      impact_estimate: '가동율 10%p 향상, 연간 8,000개 생산량 증가',
      confidence_score: 0.91,
      evidence_refs: [
        { type: 'production_data', id: 'prod_001', description: '라인 4 가동율 78.5%' },
        { type: 'bottleneck_analysis', id: 'ba_001', description: '용접 공장 Takt time 45초' },
        { type: 'oee_data', id: 'oee_001', description: 'OEE 72.3%, 목표 85%' }
      ],
      status: 'pending',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      business_impact: {
        efficiency_gain: 10,
        cost_savings: 150000000
      }
    },
    {
      id: 'rec004',
      agentRunId: 'run-009',
      agentName: 'PurchasingIntelligenceAgent',
      agentType: '구매 지능',
      title: '알루미늄 재고 보유량 최적화',
      description: '현재 알루미늄 재고가 45일 분량으로 과도하게 보유되고 있습니다. 재고 회전율을 고려하여 적정 재고량을 30일로 조정하면 연간 1.8억원의 보관 비용을 절감할 수 있습니다.',
      recommendationType: 'cost_reduction',
      priority: 'medium',
      impact_estimate: '연간 1.8억원 보관 비용 절감',
      confidence_score: 0.85,
      evidence_refs: [
        { type: 'inventory_data', id: 'inv_001', description: '알루미늄 재고 45일' },
        { type: 'turnover_rate', id: 'tr_001', description: '재고회전율 8.5회/년' }
      ],
      status: 'approved',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      approved_by: '박자재',
      approved_at: new Date(Date.now() - 43200000).toISOString(),
      implementation_progress: 30
    },
    {
      id: 'rec005',
      agentRunId: 'run-012',
      agentName: 'QualityIntelligenceAgent',
      agentType: '품질 지능',
      title: '용접기 매개변수 자동 제어 시스템 도입',
      description: '현재 수동 설정되는 용접기 매개변수를 AI 기반 자동 제어로 전환하면 용접 불량을 20% 이상 감소할 수 있습니다. 초기 투자비용은 5천만원 수준이지만, 연간 2억원 이상의 품질 비용 절감 효과가 있습니다.',
      recommendationType: 'quality_improvement',
      priority: 'high',
      impact_estimate: '용접 불량 20% 감소, 연간 2억원 품질 비용 절감',
      confidence_score: 0.87,
      evidence_refs: [
        { type: 'quality_data', id: 'qd_001', description: '용접 불량률 2.1%' },
        { type: 'pilot_test', id: 'pt_001', description: '파일럿 테스트 결과 불량 18% 감소' },
        { type: 'cost_analysis', id: 'ca_001', description: 'ROI 400%, 회수기간 1.5년' }
      ],
      status: 'pending',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      expires_at: new Date(Date.now() + 1209600000).toISOString(),
      business_impact: {
        cost_savings: 200000000,
        efficiency_gain: 20
      }
    },
    {
      id: 'rec006',
      agentRunId: 'run-015',
      agentName: 'ScenarioAgent',
      agentType: '시나리오 분석',
      title: '전기 요금 인감에 대비한 생산 일정 조정',
      description: '내년 2분기부터 전기 요금이 15% 인상될 예정입니다. 주간 생산 일정을 재조정하여 야간 전기 요금 저렴한 시간대를 활용하면 연간 3천만원의 에너지 비용을 절감할 수 있습니다.',
      recommendationType: 'cost_reduction',
      priority: 'medium',
      impact_estimate: '연간 3천만원 에너지 비용 절감',
      confidence_score: 0.82,
      evidence_refs: [
        { type: 'market_forecast', id: 'mf_001', description: '전기 요금 15% 인상 예고' },
        { type: 'energy_data', id: 'ed_001', description: '현재 에너지 비용 분석' }
      ],
      status: 'rejected',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      rejection_reason: '야간 작업 인력 부족으로 현재로서는 실행 어려움'
    },
    {
      id: 'rec007',
      agentRunId: 'run-018',
      agentName: 'VarianceAgent',
      agentType: '편차 분석',
      title: '판관비 2차 절감 방안 수립',
      description: '본예산 대비 판관비가 4.0% 초과 실행되고 있습니다. 특히 출장비와 교육비에서 편차가 큽니다. 출장 정책을 강화하고 온라인 교육을 확대하면 연간 8천만원 절감 가능합니다.',
      recommendationType: 'cost_reduction',
      priority: 'medium',
      impact_estimate: '연간 8천만원 판관비 절감',
      confidence_score: 0.79,
      evidence_refs: [
        { type: 'budget_variance', id: 'bv_001', description: '판관비 4.0% 초과' },
        { type: 'expense_breakdown', id: 'eb_001', description: '출장비 15%, 교육비 12% 증가' }
      ],
      status: 'implemented',
      created_at: new Date(Date.now() - 432000000).toISOString(),
      approved_by: '이재무',
      approved_at: new Date(Date.now() - 432000000 - 86400000).toISOString(),
      implementation_progress: 100,
      business_impact: {
        cost_savings: 80000000
      }
    },
    {
      id: 'rec008',
      agentRunId: 'run-020',
      agentName: 'RootCauseAgent',
      agentType: '근본 원인 분석',
      title: '도장 색상 불량 원인 규명 및 개선',
      description: '도장 색상 불량이 5건 발생했으며, 원인 분석 결과 도료 배합 비율 오류와 분무기 노즐 마모가 복합 원인으로 파악되었습니다. 배합 비율 자동화 시스템과 노즐 교체 주기 설정을 통해 재발 방지가 필요합니다.',
      recommendationType: 'quality_improvement',
      priority: 'high',
      impact_estimate: '도장 불량 80% 감소, 재작업 비용 5천만원 절감',
      confidence_score: 0.94,
      evidence_refs: [
        { type: 'quality_issue', id: 'qi_002', description: '도장 색상 불량 5건' },
        { type: 'root_cause', id: 'rc_002', description: '배합 비율 오류, 노즐 마모' },
        { type: 'rework_cost', id: 'rw_001', description: '재작업 비용 5천만원/년' }
      ],
      status: 'approved',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      approved_by: '김품질',
      approved_at: new Date(Date.now() - 604800000 - 43200000).toISOString(),
      implementation_progress: 85
    }
  ];

  // 필터링된 추천
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = searchQuery === '' ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || rec.priority === selectedPriority;
    const matchesType = selectedType === 'all' || rec.recommendationType === selectedType;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // 통계
  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(r => r.status === 'pending').length,
    approved: recommendations.filter(r => r.status === 'approved').length,
    implemented: recommendations.filter(r => r.status === 'implemented').length,
    rejected: recommendations.filter(r => r.status === 'rejected').length,
    avgConfidence: recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length,
    totalPotentialSavings: recommendations.filter(r => r.business_impact?.cost_savings).reduce((sum, r) => sum + (r.business_impact?.cost_savings || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'implemented': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expired': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cost_reduction': return '원가 절감';
      case 'quality_improvement': return '품질 개선';
      case 'process_optimization': return '프로세스 최적화';
      case 'risk_mitigation': return '리스크 완화';
      case 'revenue_increase': return '매출 증대';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">에이전트 추천 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI 에이전트가 생성한 추천사항을 관리하고 추적
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
            <Lightbulb className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전체</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm text-purple-100">총 추천</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">대기</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.pending}</div>
          <div className="text-sm text-yellow-100">승인 대기</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">완료</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.implemented}</div>
          <div className="text-sm text-green-100">구현 완료</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">신뢰도</span>
          </div>
          <div className="text-3xl font-bold mb-1">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          <div className="text-sm text-blue-100">평균 신뢰도</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Award className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">잠재</span>
          </div>
          <div className="text-3xl font-bold mb-1">{(stats.totalPotentialSavings / 100000000).toFixed(1)}억</div>
          <div className="text-sm text-emerald-100">잠재 절감액</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="추천 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 상태</option>
          <option value="pending">승인 대기</option>
          <option value="approved">승인 완료</option>
          <option value="implemented">구현 완료</option>
          <option value="rejected">거부</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 우선순위</option>
          <option value="critical">긴급</option>
          <option value="high">높음</option>
          <option value="medium">보통</option>
          <option value="low">낮음</option>
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 유형</option>
          <option value="cost_reduction">원가 절감</option>
          <option value="quality_improvement">품질 개선</option>
          <option value="process_optimization">프로세스 최적화</option>
          <option value="risk_mitigation">리스크 완화</option>
          <option value="revenue_increase">매출 증대</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>

      {/* 추천 리스트 */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* 우선순위 표시 */}
                <div className={`w-3 h-full min-h-[100px] rounded-full ${getPriorityColor(rec.priority)}`} />

                {/* 내용 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)} text-white`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {getTypeLabel(rec.recommendationType)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {rec.agentName} ({rec.agentType})
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{rec.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                    </div>

                    {/* 상태 및 신뢰도 */}
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(rec.status)}`}>
                        {rec.status === 'pending' ? '승인 대기' :
                         rec.status === 'approved' ? '승인 완료' :
                         rec.status === 'implemented' ? '구현 완료' :
                         rec.status === 'rejected' ? '거부' : '만료'}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {(rec.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 영향도 추정 */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">영향도 추정:</span>
                      <span className="text-gray-900 dark:text-white">{rec.impact_estimate}</span>
                    </div>
                  </div>

                  {/* 메타데이터 및 액션 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>생성: {new Date(rec.created_at).toLocaleString('ko-KR')}</span>
                      {rec.approved_by && <span>승인자: {rec.approved_by}</span>}
                      {rec.implementation_progress !== undefined && (
                        <span>진행률: {rec.implementation_progress}%</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      >
                        {expandedRec === rec.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedRec === rec.id ? '접기' : '상세'}
                      </button>

                      {rec.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(rec.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                            거부
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 (확장) */}
            {expandedRec === rec.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/30">
                <div className="grid grid-cols-2 gap-6">
                  {/* 증거 참조 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      증거 참조
                    </h4>
                    <div className="space-y-2">
                      {rec.evidence_refs.map((ref, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {ref.type}
                          </span>
                          <span className="font-mono text-gray-500 dark:text-gray-400">{ref.id}</span>
                          <span className="text-gray-600 dark:text-gray-400">{ref.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 비즈니스 영향 */}
                  {rec.business_impact && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        비즈니스 영향
                      </h4>
                      <div className="space-y-2">
                        {rec.business_impact.cost_savings && (
                          <div className="flex justify-between text-xs p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400">비용 절감</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {(rec.business_impact.cost_savings / 10000).toFixed(0)}만원
                            </span>
                          </div>
                        )}
                        {rec.business_impact.efficiency_gain && (
                          <div className="flex justify-between text-xs p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400">효율 향상</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {rec.business_impact.efficiency_gain}%
                            </span>
                          </div>
                        )}
                        {rec.business_impact.risk_reduction && (
                          <div className="flex justify-between text-xs p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400">리스크 감소</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              {rec.business_impact.risk_reduction}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 거부 사유 */}
                {rec.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">거부 사유</div>
                    <div className="text-sm text-red-700 dark:text-red-300">{rec.rejection_reason}</div>
                  </div>
                )}

                {/* 진행률 바 */}
                {rec.implementation_progress !== undefined && rec.implementation_progress < 100 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">구현 진행률</span>
                      <span className="font-medium text-gray-900 dark:text-white">{rec.implementation_progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${rec.implementation_progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 승인 대기 알림 */}
      {stats.pending > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <div className="font-medium text-yellow-900 dark:text-yellow-100">
                {stats.pending}건의 추천이 승인을 기다리고 있습니다
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                즉시 검토 후 승인 또는 거부 처리가 필요합니다
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentRecommendationManagement;
