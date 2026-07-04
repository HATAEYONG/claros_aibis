import React, { useState, useEffect } from 'react';
import {
  ActivityIcon,
  SettingsIcon,
  PlayIcon,
  PauseIcon,
  BarChartIcon,
  TrendUpIcon,
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  UsersIcon,
  TruckIcon,
  PackageIcon,
  FileTextIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
  RefreshIcon,
  XIcon
} from '@/components/icons/Icons';

interface ProcessNode {
  id: string;
  name: string;
  nameEn: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'connector';
  status: 'completed' | 'in_progress' | 'pending' | 'warning' | 'error';
  position: { x: number; y: number };
  metrics: NodeMetrics;
  issues: NodeIssue[];
}

interface NodeMetrics {
  cycleTime: number;
  throughput: number;
  cost: number;
  quality: number;
  utilization: number;
}

interface NodeIssue {
  id: string;
  type: 'bottleneck' | 'quality' | 'cost' | 'delay';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface ProcessConnection {
  from: string;
  to: string;
  condition?: string;
  volume: number;
  avgTime: number;
}

interface ProcessFlow {
  id: string;
  name: string;
  nameEn: string;
  category: 'O2C' | 'P2P' | 'Production' | 'Quality' | 'Custom';
  nodes: ProcessNode[];
  connections: ProcessConnection[];
  overallMetrics: OverallMetrics;
}

interface OverallMetrics {
  totalCycleTime: number;
  totalCost: number;
  throughput: number;
  qualityRate: number;
  efficiency: number;
}

const ProcessFlowChart: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<string>('O2C');
  const [processFlows, setProcessFlows] = useState<ProcessFlow[]>([]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'metrics' | 'analysis'>('flow');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchProcessFlows();
  }, []);

  const fetchProcessFlows = async () => {
    // 모의 프로세스 플로우 데이터
    const mockFlows: ProcessFlow[] = [
      {
        id: 'O2C',
        name: 'Order to Cash',
        nameEn: 'O2C Process',
        category: 'O2C',
        nodes: [
          {
            id: 'start',
            name: '주문 접수',
            nameEn: 'Order Entry',
            type: 'start',
            status: 'completed',
            position: { x: 100, y: 150 },
            metrics: { cycleTime: 2, throughput: 245, cost: 5000, quality: 99.2, utilization: 75 },
            issues: []
          },
          {
            id: 'credit_check',
            name: '신용 확인',
            nameEn: 'Credit Check',
            type: 'decision',
            status: 'completed',
            position: { x: 250, y: 150 },
            metrics: { cycleTime: 1, throughput: 245, cost: 2000, quality: 99.5, utilization: 60 },
            issues: []
          },
          {
            id: 'production',
            name: '생산',
            nameEn: 'Production',
            type: 'process',
            status: 'in_progress',
            position: { x: 400, y: 100 },
            metrics: { cycleTime: 72, throughput: 189, cost: 45000000, quality: 98.2, utilization: 87 },
            issues: [
              { id: 'P1', type: 'bottleneck', severity: 'high', description: '설비 용량 부족' }
            ]
          },
          {
            id: 'delivery',
            name: '배송',
            nameEn: 'Delivery',
            type: 'process',
            status: 'in_progress',
            position: { x: 550, y: 150 },
            metrics: { cycleTime: 24, throughput: 156, cost: 12000000, quality: 98.5, utilization: 82 },
            issues: [
              { id: 'D1', type: 'delay', severity: 'medium', description: '일부 지역 배송 지연' }
            ]
          },
          {
            id: 'billing',
            name: '청구',
            nameEn: 'Billing',
            type: 'process',
            status: 'pending',
            position: { x: 700, y: 150 },
            metrics: { cycleTime: 4, throughput: 134, cost: 3000000, quality: 99.8, utilization: 70 },
            issues: []
          },
          {
            id: 'payment',
            name: '입금',
            nameEn: 'Payment Collection',
            type: 'end',
            status: 'pending',
            position: { x: 850, y: 150 },
            metrics: { cycleTime: 168, throughput: 98, cost: 5000000, quality: 94.5, utilization: 45 },
            issues: [
              { id: 'PAY1', type: 'delay', severity: 'medium', description: '장기 연체 증가' }
            ]
          }
        ],
        connections: [
          { from: 'start', to: 'credit_check', volume: 245, avgTime: 2 },
          { from: 'credit_check', to: 'production', volume: 245, avgTime: 1, condition: '승인' },
          { from: 'production', to: 'delivery', volume: 189, avgTime: 72 },
          { from: 'delivery', to: 'billing', volume: 156, avgTime: 24 },
          { from: 'billing', to: 'payment', volume: 134, avgTime: 4 }
        ],
        overallMetrics: {
          totalCycleTime: 271,
          totalCost: 65000000,
          throughput: 98,
          qualityRate: 98.5,
          efficiency: 75.5
        }
      },
      {
        id: 'P2P',
        name: 'Procure to Pay',
        nameEn: 'P2P Process',
        category: 'P2P',
        nodes: [
          {
            id: 'req_start',
            name: '구매 요청',
            nameEn: 'Requisition',
            type: 'start',
            status: 'completed',
            position: { x: 100, y: 150 },
            metrics: { cycleTime: 4, throughput: 189, cost: 5000, quality: 95.8, utilization: 70 },
            issues: []
          },
          {
            id: 'approval',
            name: '결재',
            nameEn: 'Approval',
            type: 'decision',
            status: 'completed',
            position: { x: 250, y: 150 },
            metrics: { cycleTime: 8, throughput: 189, cost: 3000, quality: 99.0, utilization: 65 },
            issues: []
          },
          {
            id: 'quotation',
            name: '견적',
            nameEn: 'Quotation',
            type: 'process',
            status: 'completed',
            position: { x: 400, y: 150 },
            metrics: { cycleTime: 24, throughput: 178, cost: 8000000, quality: 85.0, utilization: 75 },
            issues: []
          },
          {
            id: 'po_issue',
            name: '발주서 발행',
            nameEn: 'PO Issue',
            type: 'process',
            status: 'completed',
            position: { x: 550, y: 150 },
            metrics: { cycleTime: 8, throughput: 167, cost: 4000000, quality: 98.5, utilization: 68 },
            issues: []
          },
          {
            id: 'receiving',
            name: '입고',
            nameEn: 'Receiving',
            type: 'process',
            status: 'in_progress',
            position: { x: 700, y: 150 },
            metrics: { cycleTime: 48, throughput: 134, cost: 12000000, quality: 96.8, utilization: 85 },
            issues: [
              { id: 'R1', type: 'quality', severity: 'high', description: '품질 검사 불합격 증가' }
            ]
          },
          {
            id: 'invoice_pay',
            name: '송장/지급',
            nameEn: 'Invoice/Payment',
            type: 'end',
            status: 'pending',
            position: { x: 850, y: 150 },
            metrics: { cycleTime: 136, throughput: 89, cost: 8000000, quality: 94.5, utilization: 60 },
            issues: []
          }
        ],
        connections: [
          { from: 'req_start', to: 'approval', volume: 189, avgTime: 4 },
          { from: 'approval', to: 'quotation', volume: 189, avgTime: 8, condition: '승인' },
          { from: 'quotation', to: 'po_issue', volume: 178, avgTime: 24 },
          { from: 'po_issue', to: 'receiving', volume: 167, avgTime: 8 },
          { from: 'receiving', to: 'invoice_pay', volume: 134, avgTime: 48 }
        ],
        overallMetrics: {
          totalCycleTime: 228,
          totalCost: 32000000,
          throughput: 89,
          qualityRate: 95.2,
          efficiency: 70.5
        }
      },
      {
        id: 'PROD',
        name: '생산 프로세스',
        nameEn: 'Production Process',
        category: 'Production',
        nodes: [
          {
            id: 'plan_start',
            name: '생산 계획',
            nameEn: 'Production Planning',
            type: 'start',
            status: 'completed',
            position: { x: 100, y: 150 },
            metrics: { cycleTime: 8, throughput: 125, cost: 1000000, quality: 98.0, utilization: 80 },
            issues: []
          },
          {
            id: 'material_prep',
            name: '자재 준비',
            nameEn: 'Material Preparation',
            type: 'process',
            status: 'in_progress',
            position: { x: 250, y: 150 },
            metrics: { cycleTime: 16, throughput: 120, cost: 5000000, quality: 97.5, utilization: 75 },
            issues: [
              { id: 'M1', type: 'delay', severity: 'medium', description: '일부 자재 지연' }
            ]
          },
          {
            id: 'manufacturing',
            name: '제조',
            nameEn: 'Manufacturing',
            type: 'process',
            status: 'in_progress',
            position: { x: 400, y: 100 },
            metrics: { cycleTime: 48, throughput: 115, cost: 25000000, quality: 96.8, utilization: 87 },
            issues: [
              { id: 'MF1', type: 'bottleneck', severity: 'high', description: '설비 병목' }
            ]
          },
          {
            id: 'quality_check',
            name: '품질 검사',
            nameEn: 'Quality Check',
            type: 'decision',
            status: 'in_progress',
            position: { x: 550, y: 150 },
            metrics: { cycleTime: 8, throughput: 110, cost: 3000000, quality: 98.2, utilization: 70 },
            issues: []
          },
          {
            id: 'packaging',
            name: '포장',
            nameEn: 'Packaging',
            type: 'process',
            status: 'pending',
            position: { x: 700, y: 150 },
            metrics: { cycleTime: 4, throughput: 105, cost: 2000000, quality: 99.0, utilization: 65 },
            issues: []
          },
          {
            id: 'warehouse',
            name: '창고 입고',
            nameEn: 'Warehouse',
            type: 'end',
            status: 'pending',
            position: { x: 850, y: 150 },
            metrics: { cycleTime: 2, throughput: 100, cost: 1000000, quality: 99.5, utilization: 60 },
            issues: []
          }
        ],
        connections: [
          { from: 'plan_start', to: 'material_prep', volume: 125, avgTime: 8 },
          { from: 'material_prep', to: 'manufacturing', volume: 120, avgTime: 16 },
          { from: 'manufacturing', to: 'quality_check', volume: 115, avgTime: 48 },
          { from: 'quality_check', to: 'packaging', volume: 110, avgTime: 8, condition: '합격' },
          { from: 'packaging', to: 'warehouse', volume: 105, avgTime: 4 }
        ],
        overallMetrics: {
          totalCycleTime: 86,
          totalCost: 36000000,
          throughput: 100,
          qualityRate: 98.0,
          efficiency: 72.8
        }
      }
    ];

    setProcessFlows(mockFlows);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#10B981', border: '#059669', text: '#fff' };
      case 'in_progress': return { bg: '#3B82F6', border: '#2563EB', text: '#fff' };
      case 'pending': return { bg: '#9CA3AF', border: '#6B7280', text: '#fff' };
      case 'warning': return { bg: '#F59E0B', border: '#D97706', text: '#fff' };
      case 'error': return { bg: '#EF4444', border: '#DC2626', text: '#fff' };
      default: return { bg: '#E5E7EB', border: '#D1D5DB', text: '#374151' };
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'start': return '⭐';
      case 'end': return '🏁';
      case 'decision': return '💎';
      case 'connector': return '🔗';
      default: return '⚙️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const currentFlow = processFlows.find(f => f.id === selectedProcess);

  const renderFlowChart = () => {
    if (!currentFlow) return null;

    return (
      <div className="relative border border-gray-200 rounded-lg bg-gray-50" style={{ height: '500px', overflow: 'auto' }}>
        <svg style={{ width: '100%', height: '100%', minWidth: '1000px', minHeight: '500px' }}>
          {/* Connections */}
          {currentFlow.connections.map((conn, idx) => {
            const fromNode = currentFlow.nodes.find(n => n.id === conn.from);
            const toNode = currentFlow.nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const fromX = fromNode.position.x + 80;
            const fromY = fromNode.position.y + 30;
            const toX = toNode.position.x;
            const toY = toNode.position.y + 30;

            return (
              <g key={idx}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="#94A3B8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text x={(fromX + toX) / 2} y={(fromY + toY) / 2 - 10} textAnchor="middle" className="text-xs fill-gray-600">
                  {formatNumber(conn.volume)}건 ({conn.avgTime}h)
                </text>
                {conn.condition && (
                  <text x={(fromX + toX) / 2} y={(fromY + toY) / 2 + 15} textAnchor="middle" className="text-xs fill-blue-600">
                    {conn.condition}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
            </marker>
          </defs>

          {/* Nodes */}
          {currentFlow.nodes.map((node) => {
            const colors = getNodeColor(node.status);
            return (
              <g key={node.id} transform={`scale(${zoom})`}>
                <rect
                  x={node.position.x}
                  y={node.position.y}
                  width="160"
                  height="60"
                  rx="8"
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedNode(node)}
                />
                <text x={node.position.x + 80} y={node.position.y + 25} textAnchor="middle" className="text-sm fill-white font-semibold">
                  {getNodeTypeIcon(node.type)} {node.name}
                </text>
                <text x={node.position.x + 80} y={node.position.y + 45} textAnchor="middle" className="text-xs fill-white opacity-90">
                  {node.nameEn}
                </text>

                {/* Issue indicator */}
                {node.issues.length > 0 && (
                  <circle
                    cx={node.position.x + 150}
                    cy={node.position.y + 10}
                    r="8"
                    fill="#EF4444"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">프로세스 플로우 차트</h2>
          <p className="text-gray-600 mt-1">비즈니스 프로세스 시각화 및 분석</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ZoomOutIcon size={20} />
          </button>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ZoomInIcon size={20} />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <DownloadIcon size={20} />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshIcon size={20} />
          </button>
        </div>
      </div>

      {/* 프로세스 선택 */}
      <div className="flex gap-2 mb-6">
        {processFlows.map((flow) => (
          <button
            key={flow.id}
            onClick={() => setSelectedProcess(flow.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedProcess === flow.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {flow.name}
          </button>
        ))}
      </div>

      {/* 전체 메트릭 */}
      {currentFlow && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon size={18} className="text-blue-600" />
              <p className="text-sm text-blue-600">전체 주기 시간</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{currentFlow.overallMetrics.totalCycleTime}h</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarIcon size={18} className="text-green-600" />
              <p className="text-sm text-green-600">총 비용</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(currentFlow.overallMetrics.totalCost)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <ActivityIcon size={18} className="text-purple-600" />
              <p className="text-sm text-purple-600">처리량</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatNumber(currentFlow.overallMetrics.throughput)}건</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckIcon size={18} className="text-yellow-600" />
              <p className="text-sm text-yellow-600">품질율</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{currentFlow.overallMetrics.qualityRate}%</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendUpIcon size={18} className="text-indigo-600" />
              <p className="text-sm text-indigo-600">효율성</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{currentFlow.overallMetrics.efficiency}%</p>
          </div>
        </div>
      )}

      {/* 뷰 모드 전환 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('flow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'flow'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ActivityIcon size={16} />
          플로우 차트
        </button>
        <button
          onClick={() => setViewMode('metrics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'metrics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChartIcon size={16} />
          메트릭 분석
        </button>
        <button
          onClick={() => setViewMode('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'analysis'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <AlertTriangleIcon size={16} />
          이슈 분석
        </button>
      </div>

      {/* 플로우 차트 뷰 */}
      {viewMode === 'flow' && renderFlowChart()}

      {/* 메트릭 분석 뷰 */}
      {viewMode === 'metrics' && currentFlow && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentFlow.nodes.map((node) => {
            const colors = getNodeColor(node.status);
            return (
              <div key={node.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg`} style={{ backgroundColor: colors.bg }}>
                    <span className="text-xl">{getNodeTypeIcon(node.type)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{node.name}</h3>
                    <p className="text-xs text-gray-600">{node.nameEn}</p>
                  </div>
                  <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                    node.status === 'completed' ? 'bg-green-100 text-green-700' :
                    node.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {node.status === 'completed' ? '완료' :
                     node.status === 'in_progress' ? '진행중' :
                     node.status === 'warning' ? '경고' :
                     node.status === 'error' ? '오류' : '대기'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">주기 시간</p>
                    <p className="font-semibold">{node.metrics.cycleTime}h</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">처리량</p>
                    <p className="font-semibold">{formatNumber(node.metrics.throughput)}건</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">비용</p>
                    <p className="font-semibold">{formatCurrency(node.metrics.cost)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">품질</p>
                    <p className="font-semibold">{node.metrics.quality}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 이슈 분석 뷰 */}
      {viewMode === 'analysis' && currentFlow && (
        <div className="space-y-4">
          {currentFlow.nodes.filter(n => n.issues.length > 0).map((node) => (
            <div key={node.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangleIcon size={24} className="text-red-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">{node.name} 이슈</h3>
                  <p className="text-xs text-gray-600">{node.issues.length}개의 이슈 발생</p>
                </div>
              </div>
              <div className="space-y-2">
                {node.issues.map((issue) => (
                  <div key={issue.id} className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase">{issue.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        issue.severity === 'high' ? 'bg-red-200 text-red-800' :
                        issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음'}
                      </span>
                    </div>
                    <p className="text-sm">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {currentFlow.nodes.filter(n => n.issues.length > 0).length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckIcon size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">현재 이슈가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* 노드 상세 모달 */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getNodeTypeIcon(selectedNode.type)}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-600">{selectedNode.nameEn}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">주기 시간</p>
                  <p className="text-lg font-semibold">{selectedNode.metrics.cycleTime}h</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">처리량</p>
                  <p className="text-lg font-semibold">{formatNumber(selectedNode.metrics.throughput)}건</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">비용</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedNode.metrics.cost)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">품질율</p>
                  <p className="text-lg font-semibold">{selectedNode.metrics.quality}%</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">가동률</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${selectedNode.metrics.utilization}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{selectedNode.metrics.utilization}%</span>
                </div>
              </div>
            </div>

            {selectedNode.issues.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">이슈 ({selectedNode.issues.length})</p>
                <div className="space-y-2">
                  {selectedNode.issues.map((issue) => (
                    <div key={issue.id} className={`p-2 rounded text-xs ${getSeverityColor(issue.severity)}`}>
                      <span className="font-semibold">{issue.type}</span>: {issue.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessFlowChart;
