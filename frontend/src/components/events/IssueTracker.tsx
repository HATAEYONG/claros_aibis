// IssueTracker.tsx - 이슈 추적 컴포넌트
import { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit,
  Filter,
  Flag,
  Link2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'quality' | 'production' | 'safety' | 'delivery' | 'cost' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'deferred';
  severity: 'critical' | 'major' | 'minor';
  related_event_id?: string;
  related_alert_id?: string;
  related_recommendation_id?: string;
  assigned_to?: string;
  reported_by: string;
  created_at: string;
  updated_at?: string;
  due_date?: string;
  resolved_at?: string;
  resolution?: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  tags: string[];
  comments: Array<{
    id: string;
    author: string;
    content: string;
    created_at: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

const IssueTracker: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'list' | 'kanban'>('list');

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

  // 이슈 데이터
  const issues: Issue[] = [
    {
      id: 'ISS001',
      title: '차체 치수 불량 지속 발생',
      description: '프레스 공정에서 치수 불량이 평균 2건/일 대비 8건/일로 4배 증가함. 냉각 시스템 문제로 추정됨.',
      type: 'quality',
      priority: 'critical',
      status: 'in_progress',
      severity: 'major',
      related_event_id: 'evt004',
      related_alert_id: 'alt002',
      related_recommendation_id: 'rec002',
      assigned_to: '김품질',
      reported_by: 'EventDetectionAgent',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 600000).toISOString(),
      due_date: new Date(Date.now() + 86400000).toISOString(),
      root_cause: '냉각탑 필터 교체 주기 초과로 냉각수 온도 상승 → 금형 온도 제어 불안정 → 치수 불량',
      corrective_action: '냉각탑 필터 즉시 교체, 온도 모니터링 강화',
      preventive_action: '필터 교체 주기를 3개월에서 2개월로 단축, 온도 알림 임계값 설정',
      tags: ['치수불량', '냉각', '프레스'],
      comments: [
        { id: 'c1', author: '김품질', content: '냉각탑 점검 완료. 필터 교체 필요함.', created_at: new Date(Date.now() - 3000000).toISOString() },
        { id: 'c2', author: '이설비', content: '필터 교체 일정 확정: 오늘 14시', created_at: new Date(Date.now() - 2400000).toISOString() }
      ],
      attachments: []
    },
    {
      id: 'ISS002',
      title: '용접기 #1 정비 지연',
      description: '예정된 예방 정비가 자재 부족으로 지연되고 있어 생산에 차질 발생.',
      type: 'production',
      priority: 'high',
      status: 'open',
      severity: 'major',
      related_event_id: 'evt008',
      assigned_to: '김설비',
      reported_by: 'ProcessMonitoringAgent',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      due_date: new Date(Date.now() - 3600000).toISOString(),
      root_cause: '자재 발주 지연 (공급업체 물량 부족)',
      corrective_action: '대체 공급업체 섭팅, 자재 긴급 발주',
      preventive_action: '안전재 확보, 다변화 공급망 구축',
      tags: ['설비', '정비', '자재'],
      comments: [
        { id: 'c3', author: '박구매', content: '대체 공급업체 3곳 문의 완료. 가장 빠른 납품 3일 소요.', created_at: new Date(Date.now() - 10800000).toISOString() }
      ],
      attachments: []
    },
    {
      id: 'ISS003',
      title: '철강재 원가 상승 대응',
      description: '철강재 시장 가격이 전월 대비 5.9% 상승하여 원가 압박 발생.',
      type: 'cost',
      priority: 'high',
      status: 'in_progress',
      severity: 'minor',
      related_event_id: 'evt002',
      related_recommendation_id: 'rec001',
      assigned_to: '박구매',
      reported_by: 'CostIntelligenceAgent',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      due_date: new Date(Date.now() + 172800000).toISOString(),
      root_cause: '중국 철강재 수출 규제, 내수 수요 증가',
      corrective_action: '2차 공급업체 계약, 재고 확보',
      preventive_action: '선물 계약 확대, 가격 변동 헷지 포함',
      tags: ['원가', '자재', '철강'],
      comments: [],
      attachments: []
    },
    {
      id: 'ISS004',
      title: '도장 색상 불량 클레임',
      description: '고객사로부터 도장 색상 불량 관련 클레임 3건 접수.',
      type: 'quality',
      priority: 'critical',
      status: 'open',
      severity: 'major',
      related_event_id: 'evt010',
      related_alert_id: 'alt004',
      assigned_to: '김품질',
      reported_by: 'CustomerService',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      due_date: new Date(Date.now() + 43200000).toISOString(),
      root_cause: '도장 공정 온도 편차, 도료 배합 비율 오류',
      corrective_action: '원인 파악 및 공정 조건 최적화',
      preventive_action: '실시간 온도 모니터링, 도료 배합 자동화',
      tags: ['도장', '색상', '클레임'],
      comments: [
        { id: 'c4', author: '김품질', content: '원인 조사 중. 도료 배합 비율 확인 필요.', created_at: new Date(Date.now() - 259200000 + 3600000).toISOString() },
        { id: 'c5', author: '김영업', content: '고객사 배상 완료. 재발 방지 대책 요청.', created_at: new Date(Date.now() - 86400000).toISOString() }
      ],
      attachments: []
    },
    {
      id: 'ISS005',
      title: '제품 A 재고 부족',
      description: '수요 급증으로 재고가 2주분 부족, 일부 고객사에 납기 지연 발생.',
      type: 'delivery',
      priority: 'high',
      status: 'resolved',
      severity: 'critical',
      related_event_id: 'evt013',
      assigned_to: '박생산',
      reported_by: 'DemandAgent',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      due_date: new Date(Date.now() - 259200000).toISOString(),
      resolved_at: new Date(Date.now() - 86400000).toISOString(),
      resolution: '비상 가동으로 재고 확보, 추가 3교차 운영으로 납기 완료',
      root_cause: '수요 예측 오차, 안전재 부족',
      corrective_action: '비상 가동, 재고 긴급 확보',
      preventive_action: '수요 예측 모델 개선, 안전재 기준 상향',
      tags: ['재고', '납기', '수요'],
      comments: [
        { id: 'c6', author: '박생산', content: '비상 가동 시작. 2교차 추가.', created_at: new Date(Date.now() - 43200000 + 1800000).toISOString() },
        { id: 'c7', author: '박생산', content: '모든 주문 납기 완료.', created_at: new Date(Date.now() - 86400000).toISOString() }
      ],
      attachments: []
    },
    {
      id: 'ISS006',
      title: '미수금 회수 지연',
      description: 'A사 미수금 1.2억원이 약속된 날짜로부터 30일 경과仍未 회수.',
      type: 'financial',
      priority: 'medium',
      status: 'open',
      severity: 'minor',
      assigned_to: '이재무',
      reported_by: 'FinanceAgent',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      due_date: new Date(Date.now() + 259200000).toISOString(),
      root_cause: 'A사 자금난, 연락 two절',
      corrective_action: '독촉 전화, 법적 조치 검토',
      preventive_action: '신용 사전 평가 강화, 외상 보험 가입',
      tags: ['미수금', '회수', 'A사'],
      comments: [
        { id: 'c8', author: '이재무', content: '변호사 2회 시도. 연결 불가.', created_at: new Date(Date.now() - 518400000).toISOString() },
        { id: 'c9', author: '이재무', content: '법무팀과 상의 중.', created_at: new Date(Date.now() - 86400000).toISOString() }
      ],
      attachments: []
    },
    {
      id: 'ISS007',
      title: '환경 규정 준수 보고서',
      description: '분기별 환경 규정 준수 보고서 제출 기한 7일 남음.',
      type: 'other',
      priority: 'medium',
      status: 'resolved',
      severity: 'minor',
      related_alert_id: 'alt006',
      assigned_to: '이관리',
      reported_by: 'ComplianceAgent',
      created_at: new Date(Date.now() - 216000000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      due_date: new Date(Date.now() + 604800000).toISOString(),
      resolved_at: new Date(Date.now() - 86400000).toISOString(),
      resolution: '보고서 작성 완료 및 제출',
      corrective_action: '보고서 작성, 관련 부서 협조',
      preventive_action: '보고서 템플릿 구축, 정기 진행 상태 확인',
      tags: ['규정', '보고서', 'ESG'],
      comments: [
        { id: 'c10', author: '이관리', content: '데이터 수집 완료. 초안 작성 중.', created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: 'c11', author: '이관리', content: '최종 승인 완료. 제출 완료.', created_at: new Date(Date.now() - 86400000).toISOString() }
      ],
      attachments: [
        { id: 'att1', name: '환경규정준수보고서_2026Q1.pdf', type: 'pdf', url: '/documents/env_report_2026q1.pdf' }
      ]
    },
    {
      id: 'ISS008',
      title: '용접 불량으로 인한 리콜 리스크',
      description: '용접 불량이 발생하여 리콜 가능성이 있음. 품질 검토 후 결정 필요.',
      type: 'safety',
      priority: 'critical',
      status: 'deferred',
      severity: 'critical',
      related_event_id: 'evt003',
      related_alert_id: 'alt003',
      assigned_to: '김품질',
      reported_by: 'QualityAgent',
      created_at: new Date(Date.now() - 1209600000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      root_cause: '용접기 매개변수 오류 (일시적)',
      corrective_action: '품질 검토 결과 리콜 불필요 판명. 정비 완료.',
      preventive_action: '용접기 정비 주기 단축, 매개변수 모니터링',
      tags: ['용접', '불량', '리콜'],
      comments: [
        { id: 'c12', author: '김품질', content: '영향 범위 분석 결과: 불량 1건, 리콜 불필요.', created_at: new Date(Date.now() - 1209600000 + 86400000).toISOString() }
      ],
      attachments: []
    }
  ];

  // 필터링
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || issue.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || issue.priority === selectedPriority;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // 통계
  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
    critical: issues.filter(i => i.priority === 'critical').length,
    overdue: issues.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== 'resolved').length
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'deferred': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return '열림';
      case 'in_progress': return '진행 중';
      case 'resolved': return '해결됨';
      case 'closed': return '닫힘';
      case 'deferred': return '보류';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quality': return '품질';
      case 'production': return '생산';
      case 'safety': return '안전';
      case 'delivery': return '납기';
      case 'cost': return '원가';
      case 'financial': return '재무';
      case 'other': return '기타';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">이슈 추적</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            발생한 이슈를 추적하고 관리
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Plus className="w-4 h-4" />
            새 이슈
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">전체</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm text-purple-100">총 이슈</div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">열림</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.open}</div>
          <div className="text-sm text-gray-100">열림 상태</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">진행</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.inProgress}</div>
          <div className="text-sm text-blue-100">진행 중</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">해결</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.resolved}</div>
          <div className="text-sm text-green-100">해결됨</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Flag className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">긴급</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.critical}</div>
          <div className="text-sm text-red-100">긴급 이슈</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">지연</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.overdue}</div>
          <div className="text-sm text-orange-100">기한 초과</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이슈 검색..."
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
          <option value="quality">품질</option>
          <option value="production">생산</option>
          <option value="safety">안전</option>
          <option value="delivery">납기</option>
          <option value="cost">원가</option>
          <option value="financial">재무</option>
          <option value="other">기타</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 상태</option>
          <option value="open">열림</option>
          <option value="in_progress">진행 중</option>
          <option value="resolved">해결됨</option>
          <option value="closed">닫힘</option>
          <option value="deferred">보류</option>
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
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>

      {/* 이슈 리스트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">이슈 목록</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedView('list')}
              className={`px-3 py-1 rounded text-sm ${selectedView === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              목록
            </button>
            <button
              onClick={() => setSelectedView('kanban')}
              className={`px-3 py-1 rounded text-sm ${selectedView === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              칸반
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-lg border-l-4 ${
                issue.priority === 'critical'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : issue.priority === 'high'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : issue.priority === 'medium'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-green-500 bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{issue.id}</span>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`} />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(issue.priority)}`}>
                      {issue.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {getTypeLabel(issue.type)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{issue.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {issue.related_event_id && (
                    <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      이벤트
                    </span>
                  )}
                  {issue.related_alert_id && (
                    <span className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      알림
                    </span>
                  )}
                  {issue.related_recommendation_id && (
                    <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      추천
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                    className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded"
                  >
                    {expandedIssue === issue.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  담당자: {issue.assigned_to || '미지정'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  생성: {new Date(issue.created_at).toLocaleString('ko-KR')}
                </span>
                {issue.due_date && (
                  <span className={new Date(issue.due_date) < new Date() && issue.status !== 'resolved' ? 'text-red-500' : ''}>
                    마감: {new Date(issue.due_date).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>

              {/* 태그 */}
              {issue.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {issue.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 상세 정보 (확장) */}
              {expandedIssue === issue.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* 근본 원인 & 대책 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">근본 원인</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{issue.root_cause || '분석 중'}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">대책</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{issue.corrective_action || '검토 중'}</p>
                    </div>
                  </div>

                  {/* 예방 조치 */}
                  {issue.preventive_action && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">예방 조치</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{issue.preventive_action}</p>
                    </div>
                  )}

                  {/* 해결 정보 */}
                  {issue.resolution && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">해결 방안</h5>
                      <p className="text-sm text-green-800 dark:text-green-300">{issue.resolution}</p>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        해결일: {issue.resolved_at ? new Date(issue.resolved_at).toLocaleString('ko-KR') : '-'}
                      </div>
                    </div>
                  )}

                  {/* 첨부파일 */}
                  {issue.attachments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">첨부파일</h5>
                      <div className="space-y-1">
                        {issue.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>{att.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 코멘트 */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">코멘트 ({issue.comments.length})</h5>
                    <div className="space-y-2">
                      {issue.comments.slice(-3).map((comment) => (
                        <div key={comment.id} className="p-2 bg-white dark:bg-gray-800 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{comment.author}</span>
                            <span className="text-gray-500 dark:text-gray-400">{new Date(comment.created_at).toLocaleString('ko-KR')}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 기한 초과 알림 */}
      {stats.overdue > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <div className="flex-1">
              <div className="font-medium text-orange-900 dark:text-orange-100">
                {stats.overdue}건의 이슈가 기한을 초과했습니다
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                즉시 조치가 필요합니다
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTracker;
