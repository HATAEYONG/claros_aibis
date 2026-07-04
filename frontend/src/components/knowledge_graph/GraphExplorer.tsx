// GraphExplorer.tsx - 지식 그래프 탐색 컴포넌트
import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Network,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Settings,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  MousePointer,
  GitBranch
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'concept' | 'relationship';
  category: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  weight: number;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const GraphExplorer: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['entities', 'concepts', 'relationships']));
  const [zoomLevel, setZoomLevel] = useState(1);

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
  const mockGraphData: GraphData = {
    nodes: [
      // 엔티티 노드
      { id: 'product_a', label: '제품 A', type: 'entity', category: 'product', properties: { category: '완제품', cost: 15000 } },
      { id: 'product_b', label: '제품 B', type: 'entity', category: 'product', properties: { category: '완제품', cost: 12000 } },
      { id: 'material_x', label: '자재 X', type: 'entity', category: 'material', properties: { unit: 'kg', cost: 5000 } },
      { id: 'material_y', label: '자재 Y', type: 'entity', category: 'material', properties: { unit: 'kg', cost: 3000 } },
      { id: 'supplier_s1', label: '공급자 S1', type: 'entity', category: 'supplier', properties: { rating: 4.5 } },
      { id: 'line_1', label: '라인 1', type: 'entity', category: 'production_line', properties: { capacity: 1000 } },
      { id: 'process_assembly', label: '조립 공정', type: 'entity', category: 'process', properties: { cycle_time: 30 } },

      // 컨셉트 노드
      { id: 'quality', label: '품질', type: 'concept', category: 'quality', properties: { target: 99.5 } },
      { id: 'cost', label: '원가', type: 'concept', category: 'cost', properties: { target: 75 } },
      { id: 'delivery', label: '납기', type: 'concept', category: 'delivery', properties: { target: 100 } },

      // 관계 노드
      { id: 'uses_material_x', label: '자재 X 사용', type: 'relationship', category: 'uses', properties: { quantity: 2 } },
      { id: 'uses_material_y', label: '자재 Y 사용', type: 'relationship', category: 'uses', properties: { quantity: 1 } },
      { id: 'supplied_by_s1', label: 'S1 공급', type: 'relationship', category: 'supplied_by', properties: { lead_time: 3 } },
      { id: 'produced_on_line1', label: '라인1 생산', type: 'relationship', category: 'produced_on', properties: { rate: 50 } },
      { id: 'impacts_quality', label: '품질 영향', type: 'relationship', category: 'impacts', properties: { weight: 0.8 } },
      { id: 'impacts_cost', label: '원가 영향', type: 'relationship', category: 'impacts', properties: { weight: 0.9 } },
    ],
    edges: [
      { id: 'e1', source: 'product_a', target: 'uses_material_x', relationshipType: 'requires', weight: 1, properties: {} },
      { id: 'e2', source: 'product_a', target: 'uses_material_y', relationshipType: 'requires', weight: 1, properties: {} },
      { id: 'e3', source: 'uses_material_x', target: 'material_x', relationshipType: 'connects_to', weight: 1, properties: {} },
      { id: 'e4', source: 'uses_material_y', target: 'material_y', relationshipType: 'connects_to', weight: 1, properties: {} },
      { id: 'e5', source: 'material_x', target: 'supplied_by_s1', relationshipType: 'supplied_via', weight: 1, properties: {} },
      { id: 'e6', source: 'supplied_by_s1', target: 'supplier_s1', relationshipType: 'connects_to', weight: 1, properties: {} },
      { id: 'e7', source: 'product_a', target: 'produced_on_line1', relationshipType: 'produced_via', weight: 1, properties: {} },
      { id: 'e8', source: 'produced_on_line1', target: 'line_1', relationshipType: 'connects_to', weight: 1, properties: {} },
      { id: 'e9', source: 'material_x', target: 'impacts_cost', relationshipType: 'influences', weight: 0.9, properties: {} },
      { id: 'e10', source: 'impacts_cost', target: 'cost', relationshipType: 'connects_to', weight: 1, properties: {} },
      { id: 'e11', source: 'line_1', target: 'impacts_quality', relationshipType: 'influences', weight: 0.8, properties: {} },
      { id: 'e12', source: 'impacts_quality', target: 'quality', relationshipType: 'connects_to', weight: 1, properties: {} },
    ]
  };

  const categoryLabels: Record<string, string> = {
    product: '제품',
    material: '자재',
    supplier: '공급자',
    production_line: '생산라인',
    process: '공정',
    quality: '품질',
    cost: '원가',
    delivery: '납기',
    uses: '사용',
    supplied_by: '공급',
    produced_on: '생산',
    impacts: '영향'
  };

  const typeLabels: Record<string, string> = {
    entity: '엔티티',
    concept: '컨셉트',
    relationship: '관계'
  };

  const categoryGroups = {
    entities: mockGraphData.nodes.filter(n => n.type === 'entity'),
    concepts: mockGraphData.nodes.filter(n => n.type === 'concept'),
    relationships: mockGraphData.nodes.filter(n => n.type === 'relationship')
  };

  const filteredNodes = mockGraphData.nodes.filter(node => {
    const matchesSearch = searchQuery === '' ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory || node.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedNodes = selectedNode
    ? mockGraphData.edges
        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
        .map(e => e.source === selectedNode.id ? e.target : e.source)
    : [];

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'entity') {
      return 'bg-blue-500';
    } else if (node.type === 'concept') {
      return 'bg-purple-500';
    } else {
      return 'bg-green-500';
    }
  };

  const getNodeBgColor = (node: GraphNode) => {
    if (node.type === 'entity') {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
    } else if (node.type === 'concept') {
      return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700';
    } else {
      return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">지식 그래프 탐색</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            온톨로지 기반 지식 그래프를 탐색하고 분석
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
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">엔티티</span>
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
            {categoryGroups.entities.length}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">컨셉트</span>
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">
            {categoryGroups.concepts.length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800 dark:text-green-300">관계</span>
            <GitBranch className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
            {categoryGroups.relationships.length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-300">엣지</span>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {mockGraphData.edges.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 그래프 시각화 영역 */}
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">그래프 뷰</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="확대">
                  <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="축소">
                  <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="전체화면">
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="내보내기">
                  <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* 그래프 캔버스 (간단한 시각화) */}
          <div className="p-6">
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg h-96 flex items-center justify-center">
              {/* 그래프 시각화 영역 - 실제로는 vis.js, d3.js 등 라이브러리 사용 */}
              <div className="text-center">
                <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  그래프 시각화 영역
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  노드: {mockGraphData.nodes.length}개 | 엣지: {mockGraphData.edges.length}개
                </p>
                {selectedNode && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      선택된 노드: {selectedNode.label}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      연결된 노드: {connectedNodes.length}개
                    </p>
                  </div>
                )}
              </div>

              {/* 간단한 노드 표시 */}
              <div className="absolute inset-0 pointer-events-none">
                {mockGraphData.nodes.slice(0, 8).map((node, index) => {
                  const x = 100 + (index % 3) * 200;
                  const y = 80 + Math.floor(index / 3) * 120;
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = connectedNodes.includes(node.id);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto
                        px-3 py-2 rounded-lg border-2 transition
                        ${isSelected ? 'ring-2 ring-blue-500 scale-110' : ''}
                        ${isConnected ? 'ring-2 ring-green-500' : ''}
                        ${getNodeBgColor(node)}`}
                      style={{ left: x, top: y }}
                    >
                      <div className={`w-3 h-3 rounded-full ${getNodeColor(node)} mb-1`}></div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {node.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 노드 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">노드 목록</h2>
          </div>

          {/* 검색 및 필터 */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="노드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">전체 카테고리</option>
              <option value="entity">엔티티</option>
              <option value="concept">컨셉트</option>
              <option value="relationship">관계</option>
              <option value="product">제품</option>
              <option value="material">자재</option>
              <option value="supplier">공급자</option>
            </select>
          </div>

          {/* 노드 목록 (카테고리별 그룹핑) */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {Object.entries(categoryGroups).map(([category, nodes]) => {
              const filteredCategoryNodes = nodes.filter(node =>
                filteredNodes.some(n => n.id === node.id)
              );

              if (filteredCategoryNodes.length === 0) return null;

              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {typeLabels[category] || category}
                    </span>
                    <span className="text-sm text-gray-500 mr-2">({filteredCategoryNodes.length})</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      {filteredCategoryNodes.map(node => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-lg border cursor-pointer transition
                            ${selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''}
                            ${getNodeBgColor(node)} hover:shadow-md`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getNodeColor(node)}`}></div>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {node.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{categoryLabels[node.category] || node.category}</span>
                            {node.properties.cost && (
                              <span>• ₩{node.properties.cost.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 선택된 노드 상세 정보 */}
      {selectedNode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">노드 상세 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ID:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-mono text-sm">{selectedNode.id}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">유형:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{typeLabels[selectedNode.type]}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">카테고리:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{categoryLabels[selectedNode.category] || selectedNode.category}</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">속성:</span>
              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
          </div>

          {/* 연결된 노드 */}
          {connectedNodes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                연결된 노드 ({connectedNodes.length}개)
              </h3>
              <div className="flex flex-wrap gap-2">
                {connectedNodes.map(nodeId => {
                  const node = mockGraphData.nodes.find(n => n.id === nodeId);
                  return node ? (
                    <span
                      key={nodeId}
                      onClick={() => setSelectedNode(node)}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${getNodeBgColor(node)}`}
                    >
                      {node.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphExplorer;
