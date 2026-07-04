// ConversationContext.tsx - 대화 컨텍스트 컴포넌트
import { useState } from 'react';
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  Tag,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  Download,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
  messageCount: number;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  summary: string;
  participants: {
    user: string;
    agents: string[];
  };
}

interface ContextWindow {
  maxSize: number;
  currentSize: number;
  messages: number;
  tokens: number;
}

const ConversationContext: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: '원가 상승 원인 분석',
      createdAt: '2026-03-30 19:30:00',
      lastModified: '2026-03-30 19:45:20',
      messageCount: 12,
      status: 'active',
      tags: ['원가', '4M2E', '분석'],
      summary: '최근 원가 상승의 주요 원인을 4M2E 방법론으로 분석. 재료비 +15.2%가 가장 큰 요인임을 확인.',
      participants: {
        user: '김분석',
        agents: ['CostIntelligenceAgent', 'RootCauseAgent', 'RecommendationAgent']
      }
    },
    {
      id: '2',
      title: '품질 불량 원인 규명',
      createdAt: '2026-03-30 18:15:00',
      lastModified: '2026-03-30 18:42:33',
      messageCount: 8,
      status: 'active',
      tags: ['품질', '불량', '원인'],
      summary: '치수 불량의 원인을 규명하기 위한 인과 관계 분석 수행.',
      participants: {
        user: '이품질',
        agents: ['QualityIntelligenceAgent', 'RootCauseAgent']
      }
    },
    {
      id: '3',
      title: '생산 계획 최적화',
      createdAt: '2026-03-30 14:20:00',
      lastModified: '2026-03-30 14:55:10',
      messageCount: 15,
      status: 'active',
      tags: ['생산', '계획', '최적화'],
      summary: '다음 달 생산 계획을 위한 수요 예측 및 자원 할당 최적화.',
      participants: {
        user: '박생산',
        agents: ['ForecastAgent', 'ProductionIntelligenceAgent']
      }
    },
    {
      id: '4',
      title: '설비 점검 일정 관리',
      createdAt: '2026-03-29 10:30:00',
      lastModified: '2026-03-29 11:20:45',
      messageCount: 6,
      status: 'archived',
      tags: ['설비', '점검', '유지보수'],
      summary: '설비 정기 점검 일정 수립 및 우선순위 결정.',
      participants: {
        user: '최설비',
        agents: ['ProductionIntelligenceAgent']
      }
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const contextWindow: ContextWindow = {
    maxSize: 128000,
    currentSize: 45680,
    messages: 156,
    tokens: 12450
  };

  const allTags = Array.from(new Set(conversations.flatMap(c => c.tags)));

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => conv.tags.includes(tag));
    return matchesSearch && matchesStatus && matchesTags;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">활성</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">보관</span>;
      case 'deleted':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">삭제됨</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">대화 컨텍스트</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            대화 기록 관리 및 컨텍스트 윈도우 모니터링
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          새 대화
        </button>
      </div>

      {/* 컨텍스트 윈도우 상태 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          컨텍스트 윈도우 상태
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">최대 크기</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {(contextWindow.maxSize / 1000).toFixed(0)}K 토큰
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">현재 사용</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {(contextWindow.currentSize / 1000).toFixed(1)}K 토큰
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(contextWindow.currentSize / contextWindow.maxSize) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">메시지 수</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{contextWindow.messages}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">토큰 수</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{contextWindow.tokens.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="대화 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="archived">보관</option>
            </select>
          </div>
        </div>
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  {tag}
                  <span className="text-xs">✕</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                모두 지우기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 대화 목록 */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">대화 목록 ({filteredConversations.length})</h3>
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
                selectedConversation?.id === conv.id
                  ? 'border-blue-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">{conv.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{conv.summary}</p>
                </div>
                {getStatusBadge(conv.status)}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {conv.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}
                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {conv.messageCount} 메시지
                  </div>
                  <div className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {conv.participants.agents.length} 에이전트
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {conv.participants.user}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {conv.lastModified}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 인기 태그 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              인기 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 빠른 작업 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">빠른 작업</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <Download className="w-4 h-4" />
                대화 내보내기
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <Edit className="w-4 h-4" />
                요약 편집
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <Trash2 className="w-4 h-4" />
                오래된 대화 정리
              </button>
            </div>
          </div>

          {/* 컨텍스트 관리 팁 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-blue-900 dark:text-blue-100">컨텍스트 관리 팁</h3>
            </div>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 대화가 길어지면 새 대화를 시작하세요</li>
              <li>• 중요한 정보는 태그로 표시하세요</li>
              <li>• 완료된 대화는 보관 처리하세요</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 대화 상세 보기 */}
      {selectedConversation && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">대화 상세 정보</h3>
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">제목</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{selectedConversation.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">상태</span>
              <div className="mt-1">{getStatusBadge(selectedConversation.status)}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">생성일</span>
              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.createdAt}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">마지막 수정</span>
              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.lastModified}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">참여자</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{selectedConversation.participants.user}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bot className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedConversation.participants.agents.length} 에이전트
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">메시지 수</span>
              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.messageCount}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">요약</span>
              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.summary}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">태그</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedConversation.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationContext;
