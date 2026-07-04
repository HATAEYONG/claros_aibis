// VectorSearch.tsx - 벡터 검색 컴포넌트
import { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react';

interface SearchResult {
  id: string;
  documentTitle: string;
  chunkText: string;
  similarity: number;
  category: string;
  metadata: {
    chunkIndex: number;
    vectorDimension: number;
    indexType: string;
  };
}

interface SearchMetric {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
}

const VectorSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState('hnsw');
  const [topK, setTopK] = useState(5);

  const metrics: SearchMetric[] = [
    { label: '총 검색 횟수', value: '24,521', change: '+12.5%', positive: true },
    { label: '평균 검색 시간', value: '125ms', change: '-8.3%', positive: true },
    { label: '평균 유사도 점수', value: '0.87', change: '+2.1%', positive: true },
    { label: '인덱스 건수', value: '156,847', change: '+5.2%', positive: true }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResults: SearchResult[] = [
      {
        id: '1',
        documentTitle: '품질 매뉴얼 2026.pdf',
        chunkText: '품질 관리 시스템은 조직의 품질 목표를 달성하기 위한 프로세스와 절차를 포함합니다. ISO 9001 표준에 따른 품질 경영 시스템을 구축하고 유지해야 합니다...',
        similarity: 0.95,
        category: '품질',
        metadata: { chunkIndex: 12, vectorDimension: 1536, indexType: 'HNSW' }
      },
      {
        id: '2',
        documentTitle: '설비 운영 가이드.docx',
        chunkText: '정기 점검은 매주 수행해야 하며, 점검 결과는 반드시 기록해야 합니다. 설비 고장 시 즉시 보고하고 조치를 취해야 합니다...',
        similarity: 0.88,
        category: '설비',
        metadata: { chunkIndex: 8, vectorDimension: 1536, indexType: 'HNSW' }
      },
      {
        id: '3',
        documentTitle: '원가 분석 보고서.xlsx',
        chunkText: '4M2E 원가 분석 방법론은 Man, Machine, Material, Method, Measurement, Environment의 6가지 요소를 분석하여 원가 변동 요인을 파악합니다...',
        similarity: 0.82,
        category: '원가',
        metadata: { chunkIndex: 5, vectorDimension: 1536, indexType: 'HNSW' }
      },
      {
        id: '4',
        documentTitle: '생산 공정 표준.txt',
        chunkText: '생산 공정의 표준화는 품질 일관성을 보장하고 생산성을 향상시킵니다. 각 공정별로 표준 작업 지침서를 작성해야 합니다...',
        similarity: 0.79,
        category: '생산',
        metadata: { chunkIndex: 3, vectorDimension: 1536, indexType: 'HNSW' }
      },
      {
        id: '5',
        documentTitle: '안전 교육 자료.pptx',
        chunkText: '작업장 안전은 모든 직원의 책임입니다. 개인 보호 장비 착용은 필수이며, 안전 수칙을 준수해야 합니다...',
        similarity: 0.75,
        category: '안전',
        metadata: { chunkIndex: 15, vectorDimension: 1536, indexType: 'HNSW' }
      }
    ];

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (similarity >= 0.8) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    if (similarity >= 0.7) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">벡터 검색</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            시맨틱 검색을 통한 관련 문서 청크 빠른 찾기
          </p>
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isSearching || !searchQuery.trim()
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 검색 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</p>
                <div className={`flex items-center gap-1 mt-1 text-sm ${
                  metric.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {metric.positive ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          검색 설정
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              인덱스 유형
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="hnsw">HNSW (Hierarchical Navigable Small World)</option>
              <option value="ivf">IVF (Inverted File)</option>
              <option value="flat">FLAT (Brute Force)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top-K 결과 수
            </label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              최소 유사도 임계값
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              defaultValue="0.7"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 검색 입력창 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="자연어 검색어를 입력하세요... (예: 품질 관리 절차, 설비 점검 방법)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">검색 결과 ({searchResults.length}건)</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map((result, idx) => (
              <div key={result.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">{result.documentTitle}</h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                        {result.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {result.chunkText}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>청크 #{result.metadata.chunkIndex}</span>
                      <span>•</span>
                      <span>차원: {result.metadata.vectorDimension}</span>
                      <span>•</span>
                      <span>인덱스: {result.metadata.indexType}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-2 rounded-lg font-bold text-lg ${getSimilarityColor(result.similarity)}`}>
                    {(result.similarity * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {searchResults.length === 0 && searchQuery && !isSearching && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">검색 결과 없음</h3>
          <p className="text-gray-500 dark:text-gray-400">
            다른 검색어를 시도하거나 검색 설정을 조정해 보세요.
          </p>
        </div>
      )}

      {/* 초기 상태 */}
      {searchResults.length === 0 && !searchQuery && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">벡터 검색 시작하기</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            자연어 검색어를 입력하여 관련 문서 내용을 찾아보세요.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['품질 관리 절차', '설비 점검 방법', '원가 분석 방법론', '안전 수칙'].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(example)}
                className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorSearch;
