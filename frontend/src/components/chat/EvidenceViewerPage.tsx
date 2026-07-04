// EvidenceViewerPage.tsx - 증거 뷰어 페이지 컴포넌트
import { useState, useEffect } from 'react';
import {
  FileText,
  Database,
  Link,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Tag,
  User,
  Building,
  BarChart3
} from 'lucide-react';

interface Evidence {
  id: string;
  type: 'database' | 'document' | 'url' | 'agent_result' | 'model_output' | 'knowledge_graph';
  title: string;
  description: string;
  source: string;
  sourceId?: string;
  sourceAgent?: string;
  timestamp: string;
  confidence: number;
  data?: Record<string, any>;
  status: 'verified' | 'pending' | 'rejected';
}

interface EvidenceSource {
  name: string;
  count: number;
  type: string;
}

const EvidenceViewerPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const [evidences, setEvidences] = useState<Evidence[]>([
    {
      id: '1',
      type: 'database',
      title: 'ERP 생산 데이터 조회',
      description: 'MES 시스템의 생산 실적 데이터를 조회하여 일별 생산량 5,000개를 확인함',
      source: 'ERP_DB',
      sourceId: 'PROD_20260330',
      sourceAgent: 'DataAgent',
      timestamp: '2026-03-30T10:30:00',
      confidence: 0.95,
      status: 'verified',
      data: { table: 'production', rows: 5000, period: '2026-03-01 ~ 2026-03-30' }
    },
    {
      id: '2',
      type: 'document',
      title: '품질 검사 보고서 Q1',
      description: '2026년 1분기 품질 검사 결과 보고서. 불량률 2.3% 기록',
      source: 'QMS_Docs',
      sourceId: 'QC_RPT_Q1_2026',
      sourceAgent: 'DocAgent',
      timestamp: '2026-03-30T09:15:00',
      confidence: 0.98,
      status: 'verified',
      data: { documentType: 'report', quarter: 'Q1', defectRate: 2.3 }
    },
    {
      id: '3',
      type: 'url',
      title: '공급망 관련 외부 뉴스',
      description: '원자재 가격 상승 관련 산업 뉴스 기사 참조',
      source: 'IndustryNews',
      sourceId: 'NEWS_20260328',
      sourceAgent: 'WebAgent',
      timestamp: '2026-03-30T08:45:00',
      confidence: 0.75,
      status: 'pending',
      data: { url: 'https://news.example.com/12345', category: 'materials' }
    },
    {
      id: '4',
      type: 'agent_result',
      title: '수요 예측 모델 결과',
      description: 'XGBoost 모델의 4월 수요 예측 결과. 예상 수요 12,500개',
      source: 'PredictionModel',
      sourceId: 'DEMAND_PRED_APR',
      sourceAgent: 'PredictionAgent',
      timestamp: '2026-03-30T07:00:00',
      confidence: 0.89,
      status: 'verified',
      data: { model: 'XGBoost', prediction: 12500, accuracy: 91.5 }
    },
    {
      id: '5',
      type: 'knowledge_graph',
      title: '4M2E 원인 분석 결과',
      description: '지식 그래프 분석 결과: Material 요인이 88점으로 영향도가 가장 높음',
      source: 'KnowledgeGraph',
      sourceId: '4M2E_ANALYSIS_001',
      sourceAgent: 'OntologyAgent',
      timestamp: '2026-03-30T06:30:00',
      confidence: 0.92,
      status: 'verified',
      data: { topFactor: 'Material', impactScore: 88, correlations: 5 }
    },
    {
      id: '6',
      type: 'model_output',
      title: 'LLM 응답 생성 로그',
      description: 'GPT-4 모델의 원인 분석 응답 생성 로그. 토큰 1,245개 사용',
      source: 'LLM_Service',
      sourceId: 'LLM_LOG_12345',
      sourceAgent: 'ChatAgent',
      timestamp: '2026-03-30T05:15:00',
      confidence: 0.85,
      status: 'verified',
      data: { model: 'gpt-4', tokens: 1245, responseTime: 2.3 }
    },
    {
      id: '7',
      type: 'database',
      title: '재고 현황 조회',
      description: '현재 재고 수준: 완제품 12,500개, 원자재 45,000개',
      source: 'INV_DB',
      sourceId: 'INV_20260330',
      sourceAgent: 'InventoryAgent',
      timestamp: '2026-03-29T23:59:00',
      confidence: 0.99,
      status: 'verified',
      data: { finishedGoods: 12500, rawMaterials: 45000, location: 'Warehouse_A' }
    },
    {
      id: '8',
      type: 'document',
      title: '설비 정비 이력',
      description: '설비 #3 정비 이력서. 최근 정비일: 2026-03-25',
      source: 'FM_Docs',
      sourceId: 'FM_HIST_EQ3',
      sourceAgent: 'FacilityAgent',
      timestamp: '2026-03-29T18:30:00',
      confidence: 0.97,
      status: 'verified',
      data: { equipment: 'EQ-003', lastMaintenance: '2026-03-25', nextMaintenance: '2026-04-25' }
    }
  ]);

  const evidenceTypes = [
    { id: 'all', label: '전체', icon: Search },
    { id: 'database', label: '데이터베이스', icon: Database },
    { id: 'document', label: '문서', icon: FileText },
    { id: 'url', label: 'URL', icon: Link },
    { id: 'agent_result', label: '에이전트 결과', icon: CheckCircle },
    { id: 'model_output', label: '모델 출력', icon: BarChart3 },
    { id: 'knowledge_graph', label: '지식 그래프', icon: Tag }
  ];

  const sources: EvidenceSource[] = [
    { name: 'ERP_DB', count: 2, type: 'database' },
    { name: 'QMS_Docs', count: 1, type: 'document' },
    { name: 'IndustryNews', count: 1, type: 'url' },
    { name: 'PredictionModel', count: 1, type: 'agent_result' },
    { name: 'KnowledgeGraph', count: 1, type: 'knowledge_graph' },
    { name: 'INV_DB', count: 1, type: 'database' },
    { name: 'FM_Docs', count: 1, type: 'document' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleExport = () => {
    alert('증거 데이터를 내보내기');
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-5 h-5 text-blue-500" />;
      case 'document': return <FileText className="w-5 h-5 text-green-500" />;
      case 'url': return <Link className="w-5 h-5 text-purple-500" />;
      case 'agent_result': return <CheckCircle className="w-5 h-5 text-orange-500" />;
      case 'model_output': return <BarChart3 className="w-5 h-5 text-pink-500" />;
      case 'knowledge_graph': return <Tag className="w-5 h-5 text-cyan-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      verified: '검증됨',
      pending: '검증 중',
      rejected: '거부됨'
    };
    return labels[status] || status;
  };

  const filteredEvidences = evidences.filter(evidence => {
    const typeMatch = selectedType === 'all' || evidence.type === selectedType;
    const sourceMatch = selectedSource === 'all' || evidence.source === selectedSource;
    const searchMatch = searchQuery === '' ||
      evidence.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evidence.description.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && sourceMatch && searchMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">증거 뷰어</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI 에이전트의 응답에 활용된 데이터 출처와 증거를 확인합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 증거</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{evidences.length}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">검증됨</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {evidences.filter(e => e.status === 'verified').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 신뢰도</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {(evidences.reduce((sum, e) => sum + e.confidence, 0) / evidences.length * 100).toFixed(0)}%
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">데이터 소스</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{sources.length}</p>
            </div>
            <Database className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* 검색 */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="증거 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* 유형 필터 */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {evidenceTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          {/* 소스 필터 */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체 소스</option>
            {sources.map(source => (
              <option key={source.name} value={source.name}>{source.name} ({source.count})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 증거 목록 */}
      <div className="space-y-4">
        {filteredEvidences.map((evidence) => {
          const isExpanded = expandedItems.has(evidence.id);
          return (
            <div key={evidence.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* 헤더 */}
              <div
                onClick={() => toggleExpand(evidence.id)}
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                {/* 유형 아이콘 */}
                <div className="flex-shrink-0">{getTypeIcon(evidence.type)}</div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{evidence.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(evidence.status)}`}>
                      {getStatusLabel(evidence.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{evidence.description}</p>
                </div>

                {/* 정보 */}
                <div className="hidden md:block text-right text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Database className="w-4 h-4" />
                    {evidence.source}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(evidence.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>

                {/* 신뢰도 */}
                <div className="hidden lg:block text-center min-w-16">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(evidence.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">신뢰도</div>
                </div>

                {/* 펼침 아이콘 */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* 상세 정보 */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 기본 정보 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">기본 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">증거 ID</span>
                          <span className="font-mono text-gray-900 dark:text-white">{evidence.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">소스 ID</span>
                          <span className="font-mono text-gray-900 dark:text-white">{evidence.sourceId || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">에이전트</span>
                          <span className="text-gray-900 dark:text-white">{evidence.sourceAgent || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">생성 시각</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(evidence.timestamp).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 데이터 */}
                    {evidence.data && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">상세 데이터</h4>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-xs text-gray-700 dark:text-gray-300">
                            {JSON.stringify(evidence.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 작업 버튼 */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                      원본 데이터 보기
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {filteredEvidences.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default EvidenceViewerPage;
