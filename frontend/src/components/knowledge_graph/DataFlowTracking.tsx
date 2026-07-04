// DataFlowTracking.tsx - 데이터 흐름 추적 컴포넌트
import { useState } from 'react';
import {
  ArrowRight,
  Database,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface DataFlowNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'destination';
  status: 'active' | 'inactive' | 'error';
  recordCount: number;
  lastUpdate: string;
}

interface DataFlowEdge {
  id: string;
  source: string;
  target: string;
  dataVolume: number;
  frequency: string;
  status: 'flowing' | 'blocked' | 'delayed';
}

const DataFlowTracking: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dataFlowNodes: DataFlowNode[] = [
    {
      id: 'erp',
      name: 'ERP 시스템',
      type: 'source',
      status: 'active',
      recordCount: 15420,
      lastUpdate: '2026-03-30 19:45'
    },
    {
      id: 'mes',
      name: 'MES 시스템',
      type: 'source',
      status: 'active',
      recordCount: 8930,
      lastUpdate: '2026-03-30 19:44'
    },
    {
      id: 'qms',
      name: 'QMS 시스템',
      type: 'source',
      status: 'active',
      recordCount: 3210,
      lastUpdate: '2026-03-30 19:43'
    },
    {
      id: 'dataHub',
      name: '데이터 허브',
      type: 'transform',
      status: 'active',
      recordCount: 27560,
      lastUpdate: '2026-03-30 19:45'
    },
    {
      id: 'analytics',
      name: '분석 계층',
      type: 'transform',
      status: 'active',
      recordCount: 27560,
      lastUpdate: '2026-03-30 19:45'
    },
    {
      id: 'agentOps',
      name: '에이전트 운영',
      type: 'destination',
      status: 'active',
      recordCount: 12450,
      lastUpdate: '2026-03-30 19:45'
    },
    {
      id: 'dashboard',
      name: '대시보드',
      type: 'destination',
      status: 'active',
      recordCount: 15110,
      lastUpdate: '2026-03-30 19:45'
    }
  ];

  const dataFlowEdges: DataFlowEdge[] = [
    {
      id: 'erp-hub',
      source: 'erp',
      target: 'dataHub',
      dataVolume: 8500,
      frequency: '실시간',
      status: 'flowing'
    },
    {
      id: 'mes-hub',
      source: 'mes',
      target: 'dataHub',
      dataVolume: 5200,
      frequency: '5분',
      status: 'flowing'
    },
    {
      id: 'qms-hub',
      source: 'qms',
      target: 'dataHub',
      dataVolume: 1800,
      frequency: '10분',
      status: 'flowing'
    },
    {
      id: 'hub-analytics',
      source: 'dataHub',
      target: 'analytics',
      dataVolume: 15500,
      frequency: '실시간',
      status: 'flowing'
    },
    {
      id: 'analytics-agent',
      source: 'analytics',
      target: 'agentOps',
      dataVolume: 7200,
      frequency: '실시간',
      status: 'flowing'
    },
    {
      id: 'analytics-dashboard',
      source: 'analytics',
      target: 'dashboard',
      dataVolume: 8300,
      frequency: '실시간',
      status: 'flowing'
    }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source':
        return <Database className="w-5 h-5" />;
      case 'transform':
        return <Settings className="w-5 h-5" />;
      case 'destination':
        return <FileText className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'flowing':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'error':
        return '에러';
      case 'flowing':
        return '정상 흐름';
      case 'blocked':
        return '차단됨';
      case 'delayed':
        return '지연';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'source':
        return '데이터 출처';
      case 'transform':
        return '변환 계층';
      case 'destination':
        return '데이터 목적지';
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">데이터 흐름 추적</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            4계층 데이터 아키텍처의 실시간 흐름 모니터링
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
        </div>
      </div>

      {/* 데이터 흐름 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 레코드 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dataFlowNodes.reduce((sum, node) => sum + node.recordCount, 0).toLocaleString()}
              </p>
            </div>
            <Database className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">활성 노드</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {dataFlowNodes.filter(n => n.status === 'active').length}/{dataFlowNodes.length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">일일 데이터량</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">2.4GB</p>
            </div>
            <ArrowRight className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">평균 지연시간</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1.2s</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 데이터 흐름 시각화 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">데이터 흐름 다이어그램</h3>
        <div className="space-y-4">
          {dataFlowEdges.map((edge) => {
            const sourceNode = dataFlowNodes.find(n => n.id === edge.source);
            const targetNode = dataFlowNodes.find(n => n.id === edge.target);
            return (
              <div key={edge.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getNodeIcon(sourceNode?.type || 'source')}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{sourceNode?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sourceNode?.recordCount.toLocaleString()} 레코드
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                  <ArrowRight className={`w-6 h-6 ${
                    edge.status === 'flowing' ? 'text-green-500' :
                    edge.status === 'blocked' ? 'text-red-500' :
                    'text-orange-500'
                  }`} />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {edge.dataVolume.toLocaleString()}건/{edge.frequency}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {getNodeIcon(targetNode?.type || 'destination')}
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{targetNode?.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {targetNode?.recordCount.toLocaleString()} 레코드
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(edge.status)}
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getStatusText(edge.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 노드 상세 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">노드 상세 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataFlowNodes.map((node) => (
            <div
              key={node.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                node.status === 'active'
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : node.status === 'error'
                  ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getNodeIcon(node.type)}
                <span className="font-bold text-gray-900 dark:text-white">{node.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">유형</span>
                  <span className="font-medium text-gray-900 dark:text-white">{getTypeText(node.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">상태</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(node.status)}
                    <span className="font-medium text-gray-900 dark:text-white">{getStatusText(node.status)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">레코드 수</span>
                  <span className="font-medium text-gray-900 dark:text-white">{node.recordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">마지막 업데이트</span>
                  <span className="font-medium text-gray-900 dark:text-white">{node.lastUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataFlowTracking;
