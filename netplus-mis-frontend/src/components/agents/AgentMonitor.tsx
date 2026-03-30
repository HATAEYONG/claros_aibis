/**
 * 에이전트 모니터링 컴포넌트
 * 에이전트 실행 상태 및 성능 모니터링
 */
import React, { useState, useEffect } from 'react';
import { getAgentRegistry, getAgentStats, getAgentRunLogs } from '../../services/agentService';

interface AgentMonitorProps {
  refreshInterval?: number;
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ refreshInterval = 30000 }) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, selectedLayer, selectedAgent]);

  const loadData = async () => {
    try {
      const [registryData, statsData] = await Promise.all([
        getAgentRegistry(),
        getAgentStats(),
      ]);

      setAgents(registryData.agents);
      setStats(statsData);

      // 필터링된 로그 로드
      let logsParams: any = { limit: 50 };
      if (selectedAgent) {
        logsParams.agent_name = selectedAgent;
      }
      const logsData = await getAgentRunLogs(logsParams);
      setLogs(logsData.results || []);
    } catch (error) {
      console.error('Failed to load agent data:', error);
    }
  };

  const getLayerColor = (layer: string): string => {
    const colors = {
      orchestration: 'bg-purple-100 text-purple-800',
      monitoring: 'bg-blue-100 text-blue-800',
      intelligence: 'bg-cyan-100 text-cyan-800',
      analysis: 'bg-green-100 text-green-800',
      decision: 'bg-yellow-100 text-yellow-800',
      learning: 'bg-pink-100 text-pink-800',
    };
    return colors[layer as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLayerName = (layer: string): string => {
    const names = {
      orchestration: '오케스트레이션',
      monitoring: '모니터링',
      intelligence: '인텔리전스',
      analysis: '분석',
      decision: '의사결정',
      learning: '학습',
    };
    return names[layer as keyof typeof names] || layer;
  };

  const filteredAgents = selectedLayer === 'all'
    ? agents
    : agents.filter((agent) => agent.layer === selectedLayer);

  const filteredLogs = selectedAgent
    ? logs.filter((log) => log.agent_name === selectedAgent)
    : logs;

  return (
    <div className="agent-monitor">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">에이전트 모니터</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            에이전트 실행 상태 및 성능 모니터링
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            새로고침
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">자동 갱신</span>
          </label>
        </div>
      </div>

      {/* 통계 요약 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="전체 실행"
            value={stats.total_runs.toLocaleString()}
            color="blue"
          />
          <StatCard
            title="성공률"
            value={`${stats.success_rate.toFixed(1)}%`}
            color="green"
          />
          <StatCard
            title="평균 실행시간"
            value={`${stats.avg_execution_time_ms?.toFixed(0) || 0}ms`}
            color="purple"
          />
          <StatCard
            title="활성 에이전트"
            value={agents.length}
            color="cyan"
          />
        </div>
      )}

      {/* 레이어 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedLayer('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedLayer === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          전체 ({agents.length})
        </button>
        {['orchestration', 'monitoring', 'intelligence', 'analysis', 'decision', 'learning'].map((layer) => (
          <button
            key={layer}
            onClick={() => setSelectedLayer(layer)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedLayer === layer
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {getLayerName(layer)} ({agents.filter((a: any) => a.layer === layer).length})
          </button>
        ))}
      </div>

      {/* 두 개의 컬럼: 에이전트 목록 & 실행 로그 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 에이전트 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            에이전트 목록
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                표시할 에이전트가 없습니다.
              </div>
            ) : (
              filteredAgents.map((agent: any) => (
                <AgentCard
                  key={agent.name}
                  agent={agent}
                  selected={selectedAgent === agent.name}
                  onSelect={() => setSelectedAgent(agent.name)}
                  getLayerColor={getLayerColor}
                />
              ))
            )}
          </div>
        </div>

        {/* 실행 로그 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            실행 로그
            {selectedAgent && ` (${selectedAgent})`}
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                실행 로그가 없습니다.
              </div>
            ) : (
              filteredLogs.map((log: any) => (
                <LogCard key={log.request_id} log={log} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 레이어별 통계 */}
      {stats?.layer_stats && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            레이어별 통계
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.layer_stats).map(([layer, data]: [string, any]) => (
              <div key={layer} className="text-center p-3">
                <div className={`px-2 py-1 text-xs font-medium rounded ${getLayerColor(layer)} mb-2`}>
                  {getLayerName(layer)}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  성공률 {data.success_rate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 서브 컴포넌트
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
}> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} p-4 rounded-lg`}>
      <div className="text-sm opacity-75">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
};

const AgentCard: React.FC<{
  agent: any;
  selected: boolean;
  onSelect: () => void;
  getLayerColor: (layer: string) => string;
}> = ({ agent, selected, onSelect, getLayerColor }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-3 border rounded-lg cursor-pointer transition ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
        <span className={`px-2 py-1 text-xs rounded ${getLayerColor(agent.layer)}`}>
          {agent.layer}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        도메인: {agent.domain}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        버전: {agent.version} | {agent.description}
      </div>
    </div>
  );
};

const LogCard: React.FC<{ log: any }> = ({ log }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-green-600',
      failed: 'text-red-600',
      running: 'text-yellow-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (confidence >= 0.4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{log.agent_name}</div>
        <span className={`text-xs ${getStatusColor(log.status)}`}>
          {log.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>{new Date(log.created_at).toLocaleString()}</span>
        <span>•</span>
        <span>{log.execution_time_ms}ms</span>
        {log.confidence && (
          <>
            <span>•</span>
            <span className={`px-1 py-0.5 rounded ${getConfidenceBadge(log.confidence)}`}>
              {log.confidence.toFixed(2)}
            </span>
          </>
        )}
      </div>
      {log.has_evidence && (
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ 근거 있음
        </div>
      )}
    </div>
  );
};

export default AgentMonitor;
