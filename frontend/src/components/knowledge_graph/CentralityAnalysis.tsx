// CentralityAnalysis.tsx - 중심성 분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Activity,
  Filter,
  TrendingUp,
  Network,
  Zap,
  Target,
  Circle,
  Download,
  BarChart3,
  Info,
  Star,
  Award,
  Shield
} from 'lucide-react';

interface NodeCentrality {
  nodeId: string;
  label: string;
  category: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  eigenvectorCentrality: number;
  pageRank: number;
}

interface CentralityStats {
  mean: number;
  median: number;
  stdDev: number;
  max: number;
  min: number;
}

const CentralityAnalysis: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<'degree' | 'betweenness' | 'closeness' | 'eigenvector' | 'pageRank'>('degree');
  const [sortBy, setSortBy] = useState<'centrality' | 'name'>('centrality');
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'network'>('table');

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
  const mockCentralityData: NodeCentrality[] = [
    {
      nodeId: 'material_x',
      label: '자재 X',
      category: 'material',
      degreeCentrality: 0.85,
      betweennessCentrality: 0.72,
      closenessCentrality: 0.68,
      eigenvectorCentrality: 0.78,
      pageRank: 0.82
    },
    {
      nodeId: 'supplier_s1',
      label: '공급자 S1',
      category: 'supplier',
      degreeCentrality: 0.65,
      betweennessCentrality: 0.58,
      closenessCentrality: 0.55,
      eigenvectorCentrality: 0.62,
      pageRank: 0.68
    },
    {
      nodeId: 'product_a',
      label: '제품 A',
      category: 'product',
      degreeCentrality: 0.75,
      betweennessCentrality: 0.48,
      closenessCentrality: 0.52,
      eigenvectorCentrality: 0.70,
      pageRank: 0.75
    },
    {
      nodeId: 'line_1',
      label: '라인 1',
      category: 'production_line',
      degreeCentrality: 0.58,
      betweennessCentrality: 0.85,
      closenessCentrality: 0.62,
      eigenvectorCentrality: 0.55,
      pageRank: 0.60
    },
    {
      nodeId: 'quality',
      label: '품질',
      category: 'kpi',
      degreeCentrality: 0.90,
      betweennessCentrality: 0.65,
      closenessCentrality: 0.78,
      eigenvectorCentrality: 0.88,
      pageRank: 0.92
    },
    {
      nodeId: 'cost',
      label: '원가',
      category: 'kpi',
      degreeCentrality: 0.88,
      betweennessCentrality: 0.70,
      closenessCentrality: 0.75,
      eigenvectorCentrality: 0.85,
      pageRank: 0.90
    },
    {
      nodeId: 'process_assembly',
      label: '조립 공정',
      category: 'process',
      degreeCentrality: 0.52,
      betweennessCentrality: 0.45,
      closenessCentrality: 0.48,
      eigenvectorCentrality: 0.50,
      pageRank: 0.55
    },
    {
      nodeId: 'material_y',
      label: '자재 Y',
      category: 'material',
      degreeCentrality: 0.48,
      betweennessCentrality: 0.38,
      closenessCentrality: 0.42,
      eigenvectorCentrality: 0.45,
      pageRank: 0.48
    },
    {
      nodeId: 'delivery',
      label: '납기',
      category: 'kpi',
      degreeCentrality: 0.72,
      betweennessCentrality: 0.55,
      closenessCentrality: 0.58,
      eigenvectorCentrality: 0.68,
      pageRank: 0.70
    },
    {
      nodeId: 'supplier_s2',
      label: '공급자 S2',
      category: 'supplier',
      degreeCentrality: 0.42,
      betweennessCentrality: 0.32,
      closenessCentrality: 0.38,
      eigenvectorCentrality: 0.40,
      pageRank: 0.42
    }
  ];

  const categoryLabels: Record<string, string> = {
    product: '제품',
    material: '자재',
    supplier: '공급자',
    production_line: '생산라인',
    process: '공정',
    kpi: 'KPI'
  };

  const metricLabels: Record<string, string> = {
    degree: '연결 중심성',
    betweenness: '매개 중심성',
    closeness: '근접 중심성',
    eigenvector: '고유벡터 중심성',
    pageRank: 'PageRank'
  };

  const metricDescriptions: Record<string, string> = {
    degree: '노드가 가진 연결의 수를 측정합니다. 직접적인 영향력을 나타냅니다.',
    betweenness: '노드가 다른 노드들 간의 최단 경로에 얼마나 자주 등장하는지 측정합니다. 정보 흐름의 통제 능력을 나타냅니다.',
    closeness: '노드가 그래프의 다른 모든 노드들에게 얼마나 가까운지 측정합니다. 정보 전달 효율성을 나타냅니다.',
    eigenvector: '노드가 중요한 다른 노드들과 얼마나 많이 연결되어 있는지 측정합니다. 영향력의 질을 나타냅니다.',
    pageRank: '노드의 중요성을 평가하는 Google의 알고리즘입니다. 연결된 노드의 중요성까지 고려합니다.'
  };

  const getMetricValue = (node: NodeCentrality) => {
    switch (selectedMetric) {
      case 'degree': return node.degreeCentrality;
      case 'betweenness': return node.betweennessCentrality;
      case 'closeness': return node.closenessCentrality;
      case 'eigenvector': return node.eigenvectorCentrality;
      case 'pageRank': return node.pageRank;
      default: return node.degreeCentrality;
    }
  };

  const filteredData = mockCentralityData.filter(node => {
    const matchesSearch = searchQuery === '' ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'centrality') {
      return getMetricValue(b) - getMetricValue(a);
    } else {
      return a.label.localeCompare(b.label);
    }
  });

  const getCentralityLevel = (value: number) => {
    if (value >= 0.8) return { label: '매우 높음', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
    if (value >= 0.6) return { label: '높음', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' };
    if (value >= 0.4) return { label: '보통', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' };
    return { label: '낮음', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };

  const getTopNodes = () => {
    return sortedData.slice(0, 5);
  };

  const getCentralityStats = (metric: string): CentralityStats => {
    const values = mockCentralityData.map(node => {
      switch (metric) {
        case 'degree': return node.degreeCentrality;
        case 'betweenness': return node.betweennessCentrality;
        case 'closeness': return node.closenessCentrality;
        case 'eigenvector': return node.eigenvectorCentrality;
        case 'pageRank': return node.pageRank;
        default: return node.degreeCentrality;
      }
    });

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      max: Math.max(...values),
      min: Math.min(...values)
    };
  };

  const stats = getCentralityStats(selectedMetric);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">중심성 분석</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            그래프 노드의 중심성 지표를 분석하고 중요한 노드를 식별
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
          <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 검색 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="노드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* 필터 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">전체 카테고리</option>
            <option value="product">제품</option>
            <option value="material">자재</option>
            <option value="supplier">공급자</option>
            <option value="production_line">생산라인</option>
            <option value="process">공정</option>
            <option value="kpi">KPI</option>
          </select>

          {/* 중심성 지표 */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <option value="degree">연결 중심성</option>
            <option value="betweenness">매개 중심성</option>
            <option value="closeness">근접 중심성</option>
            <option value="eigenvector">고유벡터 중심성</option>
            <option value="pageRank">PageRank</option>
          </select>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <option value="centrality">중심성 순</option>
            <option value="name">이름 순</option>
          </select>

          {/* 뷰 모드 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              테이블
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              차트
            </button>
            <button
              onClick={() => setViewMode('network')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'network'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Network className="w-4 h-4 inline mr-2" />
              네트워크
            </button>
          </div>
        </div>
      </div>

      {/* 중심성 지표 설명 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">{metricLabels[selectedMetric]}</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{metricDescriptions[selectedMetric]}</p>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">평균</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.mean.toFixed(3)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">중앙값</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.median.toFixed(3)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">표준편차</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.stdDev.toFixed(3)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">최대값</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.max.toFixed(3)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">최소값</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.min.toFixed(3)}</div>
        </div>
      </div>

      {/* TOP 5 노드 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            TOP 5 노드 ({metricLabels[selectedMetric]})
          </h2>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {getTopNodes().map((node, index) => {
            const value = getMetricValue(node);
            const level = getCentralityLevel(value);
            return (
              <div
                key={node.nodeId}
                className={`p-4 rounded-lg border-2 transition ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
                  index === 1 ? 'border-gray-300 bg-gray-50 dark:bg-gray-700' :
                  index === 2 ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' :
                  'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  {index === 0 && <Star className="w-5 h-5 text-yellow-500" />}
                </div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">{node.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {categoryLabels[node.category]}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {value.toFixed(3)}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${level.color}`}>
                  {level.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 테이블 뷰 */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">순위</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">노드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">카테고리</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{metricLabels[selectedMetric]}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">수준</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">연결 중심성</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">매개 중심성</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">근접 중심성</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">고유벡터</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PageRank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((node, index) => {
                  const value = getMetricValue(node);
                  const level = getCentralityLevel(value);
                  return (
                    <tr key={node.nodeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-500' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {node.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {categoryLabels[node.category]}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                        {value.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${level.color}`}>
                          {level.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{node.degreeCentrality.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{node.betweennessCentrality.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{node.closenessCentrality.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{node.eigenvectorCentrality.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{node.pageRank.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 차트 뷰 */}
      {viewMode === 'chart' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {metricLabels[selectedMetric]} 분포
          </h2>

          <div className="space-y-3">
            {sortedData.map((node, index) => {
              const value = getMetricValue(node);
              const level = getCentralityLevel(value);
              return (
                <div key={node.nodeId} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                    <span className="ml-2">{node.label}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-6 rounded transition-all"
                      style={{
                        width: `${value * 100}%`,
                        backgroundColor: value >= 0.8 ? '#ef4444' : value >= 0.6 ? '#f97316' : value >= 0.4 ? '#eab308' : '#22c55e'
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                      {value.toFixed(3)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${level.color}`}>
                      {level.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 네트워크 뷰 */}
      {viewMode === 'network' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            네트워크 시각화
          </h2>

          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                노드 크기가 {metricLabels[selectedMetric]}에 비례합니다
              </p>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span>매우 높음 (≥0.8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>높음 (≥0.6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>보통 (≥0.4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>낮음 (&lt;0.4)</span>
                </div>
              </div>
            </div>

            {/* 간단한 노드 시각화 */}
            <div className="absolute inset-0 pointer-events-none">
              {sortedData.slice(0, 8).map((node, index) => {
                const value = getMetricValue(node);
                const size = 40 + value * 60;
                const angle = (index / 8) * 2 * Math.PI;
                const radius = 120;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                const color = value >= 0.8 ? 'bg-red-500' : value >= 0.6 ? 'bg-orange-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-green-500';

                return (
                  <div
                    key={node.nodeId}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 shadow-lg"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color
                    }}
                  >
                    <div className="text-xs font-medium text-white text-center leading-tight">
                      {node.label}
                    </div>
                  </div>
                );
              })}
            </div>
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

export default CentralityAnalysis;
