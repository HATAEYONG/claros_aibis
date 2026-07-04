// PathAnalysis.tsx - 경로 분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  GitBranch,
  Filter,
  ArrowRight,
  ChevronRight,
  Play,
  Download,
  Info,
  Zap,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
  category: string;
}

interface Path {
  id: string;
  source: string;
  target: string;
  nodes: string[];
  edges: Array<{ source: string; target: string; relationship: string }>;
  length: number;
  weight: number;
  pathType: 'shortest' | 'all' | 'influence';
}

interface PathAnalysisResult {
  paths: Path[];
  sourceNode: Node;
  targetNode: Node;
  analysisType: string;
}

const PathAnalysis: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [sourceNode, setSourceNode] = useState<string>('');
  const [targetNode, setTargetNode] = useState<string>('');
  const [selectedPathType, setSelectedPathType] = useState<'shortest' | 'all' | 'influence'>('shortest');
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [analysisResult, setAnalysisResult] = useState<PathAnalysisResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

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

  // Mock 노드 데이터
  const mockNodes: Node[] = [
    { id: 'product_a', label: '제품 A', type: 'entity', category: 'product' },
    { id: 'material_x', label: '자재 X', type: 'entity', category: 'material' },
    { id: 'material_y', label: '자재 Y', type: 'entity', category: 'material' },
    { id: 'supplier_s1', label: '공급자 S1', type: 'entity', category: 'supplier' },
    { id: 'supplier_s2', label: '공급자 S2', type: 'entity', category: 'supplier' },
    { id: 'line_1', label: '라인 1', type: 'entity', category: 'production_line' },
    { id: 'process_cutting', label: '절단 공정', type: 'entity', category: 'process' },
    { id: 'process_assembly', label: '조립 공정', type: 'entity', category: 'process' },
    { id: 'quality', label: '품질', type: 'concept', category: 'kpi' },
    { id: 'cost', label: '원가', type: 'concept', category: 'kpi' },
    { id: 'delivery', label: '납기', type: 'concept', category: 'kpi' },
  ];

  // Mock 경로 데이터
  const mockPaths: Record<string, Path[]> = {
    'product_a-quality': [
      {
        id: 'path1',
        source: 'product_a',
        target: 'quality',
        nodes: ['product_a', 'process_assembly', 'line_1', 'quality'],
        edges: [
          { source: 'product_a', target: 'process_assembly', relationship: 'produced_by' },
          { source: 'process_assembly', target: 'line_1', relationship: 'performed_on' },
          { source: 'line_1', target: 'quality', relationship: 'impacts' }
        ],
        length: 3,
        weight: 0.85,
        pathType: 'shortest'
      },
      {
        id: 'path2',
        source: 'product_a',
        target: 'quality',
        nodes: ['product_a', 'material_x', 'supplier_s1', 'quality'],
        edges: [
          { source: 'product_a', target: 'material_x', relationship: 'contains' },
          { source: 'material_x', target: 'supplier_s1', relationship: 'supplied_by' },
          { source: 'supplier_s1', target: 'quality', relationship: 'impacts' }
        ],
        length: 3,
        weight: 0.65,
        pathType: 'all'
      }
    ],
    'product_a-cost': [
      {
        id: 'path3',
        source: 'product_a',
        target: 'cost',
        nodes: ['product_a', 'material_x', 'cost'],
        edges: [
          { source: 'product_a', target: 'material_x', relationship: 'contains' },
          { source: 'material_x', target: 'cost', relationship: 'contributes_to' }
        ],
        length: 2,
        weight: 0.92,
        pathType: 'influence'
      },
      {
        id: 'path4',
        source: 'product_a',
        target: 'cost',
        nodes: ['product_a', 'material_y', 'cost'],
        edges: [
          { source: 'product_a', target: 'material_y', relationship: 'contains' },
          { source: 'material_y', target: 'cost', relationship: 'contributes_to' }
        ],
        length: 2,
        weight: 0.78,
        pathType: 'influence'
      }
    ]
  };

  const handleAnalyze = async () => {
    if (!sourceNode || !targetNode) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const key = `${sourceNode}-${targetNode}`;
    const paths = mockPaths[key] || [];

    setAnalysisResult({
      paths,
      sourceNode: mockNodes.find(n => n.id === sourceNode)!,
      targetNode: mockNodes.find(n => n.id === targetNode)!,
      analysisType: selectedPathType
    });

    setIsLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    product: '제품',
    material: '자재',
    supplier: '공급자',
    production_line: '생산라인',
    process: '공정',
    kpi: 'KPI'
  };

  const pathTypeLabels: Record<string, string> = {
    shortest: '최단 경로',
    all: '전체 경로',
    influence: '영향도 경로'
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 0.8) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (weight >= 0.6) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    if (weight >= 0.4) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20';
  };

  const getWeightLabel = (weight: number) => {
    if (weight >= 0.8) return '높음';
    if (weight >= 0.6) return '중간';
    if (weight >= 0.4) return '보통';
    return '낮음';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">경로 분석</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            노드 간 경로를 분석하고 연관성을 탐색
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

      {/* 경로 분석 컨트롤 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">경로 분석 설정</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 시작 노드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시작 노드
            </label>
            <select
              value={sourceNode}
              onChange={(e) => setSourceNode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">선택하세요</option>
              {mockNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({categoryLabels[node.category] || node.category})
                </option>
              ))}
            </select>
          </div>

          {/* 목표 노드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              목표 노드
            </label>
            <select
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">선택하세요</option>
              {mockNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.label} ({categoryLabels[node.category] || node.category})
                </option>
              ))}
            </select>
          </div>

          {/* 경로 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              경로 유형
            </label>
            <select
              value={selectedPathType}
              onChange={(e) => setSelectedPathType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="shortest">최단 경로</option>
              <option value="all">전체 경로</option>
              <option value="influence">영향도 경로</option>
            </select>
          </div>

          {/* 최대 깊이 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              최대 깊이: {maxDepth}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* 분석 버튼 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={!sourceNode || !targetNode || isLoading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            경로 분석
          </button>

          {analysisResult && (
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 분석 결과 */}
      {analysisResult && (
        <>
          {/* 결과 요약 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">분석 결과</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWeightColor(analysisResult.paths.length > 0 ? analysisResult.paths[0].weight : 0)}`}>
                {analysisResult.paths.length}개 경로 발견
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <ArrowRight className="w-4 h-4 inline mr-1" />
                {analysisResult.sourceNode.label}
              </span>
              <span>→</span>
              <span>{analysisResult.targetNode.label}</span>
              <span>•</span>
              <span>분석 유형: {pathTypeLabels[analysisResult.analysisType]}</span>
            </div>
          </div>

          {/* 경로 목록 */}
          <div className="space-y-4">
            {analysisResult.paths.map((path, index) => (
              <div
                key={path.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition cursor-pointer
                  ${selectedPath === path.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => setSelectedPath(path.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        경로 {index + 1}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {pathTypeLabels[path.pathType]}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        길이: {path.length}홉
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getWeightColor(path.weight)}`}>
                      영향도: {getWeightLabel(path.weight)} ({(path.weight * 100).toFixed(0)}%)
                    </div>
                  </div>

                  {/* 경로 시각화 */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {path.nodes.map((nodeId, nodeIndex) => {
                      const node = mockNodes.find(n => n.id === nodeId);
                      if (!node) return null;

                      return (
                        <div key={nodeId} className="flex items-center">
                          <div className={`px-3 py-2 rounded-lg border ${
                            node.type === 'entity'
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                          }`}>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {node.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {categoryLabels[node.category] || node.category}
                            </div>
                          </div>
                          {nodeIndex < path.nodes.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 관계 상세 */}
                  {selectedPath === path.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">관계 상세</h4>
                      <div className="space-y-2">
                        {path.edges.map((edge, edgeIndex) => (
                          <div key={edgeIndex} className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                              {mockNodes.find(n => n.id === edge.source)?.label}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
                              {edge.relationship}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                              {mockNodes.find(n => n.id === edge.target)?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 빈 상태 */}
      {!analysisResult && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            경로 분석을 시작하세요
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            시작 노드와 목표 노드를 선택한 후 분석 버튼을 클릭하세요.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>노드 간 최단 경로</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span>영향도 분석</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-500" />
              <span>전체 경로 탐색</span>
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

export default PathAnalysis;
