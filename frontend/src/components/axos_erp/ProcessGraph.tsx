// ProcessGraph.tsx - AXOS ERP V10.4 프로세스 그래프 컴포넌트
import { useState, useEffect, useRef } from 'react';
import {
  Network,
  Search,
  RefreshCw,
  Plus,
  Eye,
  XCircle,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Upload,
  GitBranch,
  Circle,
  Square,
  Box,
  Layers,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'product' | 'material' | 'equipment' | 'process' | 'quality' | 'order';
  status?: 'active' | 'inactive' | 'error' | 'warning';
  metadata?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'flow' | 'dependency' | 'constraint';
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const ProcessGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeForm, setNewNodeForm] = useState({
    id: '',
    label: '',
    type: 'process' as GraphNode['type'],
    metadata: {}
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeTypes: GraphNode['type'][] = ['product', 'material', 'equipment', 'process', 'quality', 'order'];

  useEffect(() => {
    loadGraphData();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGraphData = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8500/graph');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoGraphData: GraphData = {
        nodes: [
          {
            id: 'P1001',
            label: '제품 A',
            type: 'product',
            status: 'active',
            metadata: { quantity: 1000, warehouse: 'W1' }
          },
          {
            id: 'M2001',
            label: '원자재 X',
            type: 'material',
            status: 'warning',
            metadata: { quantity: 50, min_stock: 100 }
          },
          {
            id: 'E3001',
            label: '설비 #1',
            type: 'equipment',
            status: 'active',
            metadata: { status: 'running', efficiency: 95 }
          },
          {
            id: 'PROC001',
            label: '조립 공정',
            type: 'process',
            status: 'active',
            metadata: { cycle_time: 30, capacity: 100 }
          },
          {
            id: 'Q001',
            label: '품질 검사',
            type: 'quality',
            status: 'active',
            metadata: { pass_rate: 98.5 }
          },
          {
            id: 'O001',
            label: '수주 #001',
            type: 'order',
            status: 'active',
            metadata: { customer: 'ABC Corp', amount: 50000 }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'O001',
            target: 'P1001',
            label: '생산요청',
            type: 'flow'
          },
          {
            id: 'e2',
            source: 'M2001',
            target: 'PROC001',
            label: '투입',
            type: 'flow'
          },
          {
            id: 'e3',
            source: 'E3001',
            target: 'PROC001',
            label: '가공',
            type: 'dependency'
          },
          {
            id: 'e4',
            source: 'PROC001',
            target: 'Q001',
            label: '검사',
            type: 'flow'
          },
          {
            id: 'e5',
            source: 'Q001',
            target: 'P1001',
            label: '완료',
            type: 'flow'
          }
        ]
      };
      setGraphData(demoGraphData);
    } catch (error) {
      console.error('그래프 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNode = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: await fetch('http://localhost:8500/graph/update', { method: 'POST', body: JSON.stringify({ nodes: [newNodeForm], edges: [] }) });
      await new Promise(resolve => setTimeout(resolve, 500));

      const newNode: GraphNode = {
        ...newNodeForm,
        status: 'active'
      };

      setGraphData({
        ...graphData,
        nodes: [...graphData.nodes, newNode]
      });

      setShowAddNodeModal(false);
      setNewNodeForm({
        id: '',
        label: '',
        type: 'process',
        metadata: {}
      });
    } catch (error) {
      console.error('노드 추가 실패:', error);
    }
  };

  const handleAddEdge = async (sourceId: string, targetId: string) => {
    try {
      // API 호출 시뮬레이션
      const newEdge: GraphEdge = {
        id: `e${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: 'flow'
      };

      setGraphData({
        ...graphData,
        edges: [...graphData.edges, newEdge]
      });
    } catch (error) {
      console.error('엣지 추가 실패:', error);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (confirm('이 노드를 삭제하시겠습니까?')) {
      setGraphData({
        nodes: graphData.nodes.filter(n => n.id !== nodeId),
        edges: graphData.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      });
    }
  };

  const getNodeColor = (node: GraphNode) => {
    const statusColors = {
      active: 'bg-green-100 border-green-500 text-green-800',
      inactive: 'bg-gray-100 border-gray-500 text-gray-800',
      error: 'bg-red-100 border-red-500 text-red-800',
      warning: 'bg-yellow-100 border-yellow-500 text-yellow-800'
    };
    return statusColors[node.status || 'active'];
  };

  const getNodeIcon = (type: GraphNode['type']) => {
    const icons = {
      product: <Box className="w-4 h-4" />,
      material: <Layers className="w-4 h-4" />,
      equipment: <Zap className="w-4 h-4" />,
      process: <Settings className="w-4 h-4" />,
      quality: <CheckCircle className="w-4 h-4" />,
      order: <Circle className="w-4 h-4" />
    };
    return icons[type];
  };

  const getEdgeColor = (type?: string) => {
    return type === 'dependency' ? '#f59e0b' : '#3b82f6';
  };

  const filteredNodes = graphData.nodes.filter(node => {
    if (nodeFilter !== 'all' && node.type !== nodeFilter) return false;
    if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase()) && !node.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredEdges = graphData.edges.filter(edge => {
    const sourceExists = filteredNodes.find(n => n.id === edge.source);
    const targetExists = filteredNodes.find(n => n.id === edge.target);
    return sourceExists && targetExists;
  });

  // 간단한 레이아웃 계산 (원형 레이아웃)
  const calculateLayout = () => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    return filteredNodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / filteredNodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  };

  const layoutNodes = calculateLayout();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Network className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">프로세스 그래프</h1>
            <p className="text-sm text-gray-500">OCPM 그래프 관리 및 시각화</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadGraphData}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddNodeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            <Plus className="w-5 h-5" />
            노드 추가
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 노드</p>
              <p className="text-2xl font-bold text-gray-900">{graphData.nodes.length}</p>
            </div>
            <Circle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-600">전체 엣지</p>
              <p className="text-2xl font-bold text-cyan-900">{graphData.edges.length}</p>
            </div>
            <GitBranch className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">활성 노드</p>
              <p className="text-2xl font-bold text-green-900">
                {graphData.nodes.filter(n => n.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">경고 노드</p>
              <p className="text-2xl font-bold text-yellow-900">
                {graphData.nodes.filter(n => n.status === 'warning').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* 컨트롤 및 필터 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="노드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <select
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="all">전체 유형</option>
          {nodeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-l-lg"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="px-3 py-2 text-sm font-medium">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-gray-100 rounded-r-lg"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 그래프 캔버스 */}
      <div
        ref={canvasRef}
        className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
        style={{ height: '500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 엣지 렌더링 */}
            {filteredEdges.map((edge) => {
              const sourceNode = layoutNodes.find(n => n.id === edge.source);
              const targetNode = layoutNodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={getEdgeColor(edge.type)}
                    strokeWidth={2}
                    onClick={() => setSelectedEdge(edge)}
                    className="cursor-pointer hover:stroke-width-3"
                  />
                  {edge.label && (
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2}
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 노드 렌더링 */}
            {layoutNodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <circle
                  r={30}
                  className={`fill-white stroke-2 ${node.status === 'active' ? 'stroke-green-500' : node.status === 'warning' ? 'stroke-yellow-500' : 'stroke-gray-400'}`}
                />
                <foreignObject x={-25} y={-25} width={50} height={50}>
                  <div className="w-full h-full flex items-center justify-center">
                    {getNodeIcon(node.type)}
                  </div>
                </foreignObject>
                <text
                  y={45}
                  textAnchor="middle"
                  className="text-sm font-medium"
                >
                  {node.label}
                </text>
                <text
                  y={60}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* 노드 추가 모달 */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">노드 추가</h2>
                <button
                  onClick={() => setShowAddNodeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">노드 ID</label>
                <input
                  type="text"
                  value={newNodeForm.id}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, id: e.target.value })}
                  placeholder="예: NODE-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">레이블</label>
                <input
                  type="text"
                  value={newNodeForm.label}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, label: e.target.value })}
                  placeholder="노드 이름"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                <select
                  value={newNodeForm.type}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, type: e.target.value as GraphNode['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {nodeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddNode}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 노드 상세 모달 */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">노드 상세</h2>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getNodeColor(selectedNode)}`}>
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedNode.label}</p>
                  <p className="text-sm text-gray-500">{selectedNode.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">유형</p>
                  <p className="font-medium">{selectedNode.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">상태</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getNodeColor(selectedNode)}`}>
                    {selectedNode.status || 'active'}
                  </span>
                </div>
              </div>
              {selectedNode.metadata && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">메타데이터</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedNode.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  handleDeleteNode(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                삭제
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessGraph;
