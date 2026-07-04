/**
 * Knowledge Graph Dashboard Component
 * Phase 8: Knowledge Graph
 *
 * Features:
 * - Neural Graph Forecaster (GCN, GAT, RGCN)
 * - Knowledge Graph Management (4M2E Ontology)
 * - Causal relationship discovery
 * - Graph features (Centrality, Path, Community)
 */

import React, { useState } from 'react';
import {
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  NetworkIcon,
  GitBranchIcon,
  ActivityIcon,
  TargetIcon
} from '@/components/icons/Icons';
import { kgForecastService } from '@/services/kgForecastService';
import { knowledgeGraphService } from '@/services/knowledgeGraphService';

const KnowledgeGraphDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'graph' | 'causal'>('forecast');
  const [loading, setLoading] = useState(false);

  const [forecastConfig, setForecastConfig] = useState({
    model_type: 'gcn' as 'gcn' | 'gat' | 'rgcn',
    horizon: 30,
    use_graph_features: true
  });

  const [graphConfig, setGraphConfig] = useState({
    ontology_type: '4m2e' as '4m2e' | '6m' | 'custom',
    include_causal: true,
    include_temporal: true
  });

  const [forecastResult, setForecastResult] = useState<any>(null);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const result = await kgForecastService.forecastWithGraph(forecastConfig);
      setForecastResult(result);
    } catch (error: any) {
      console.error('Graph forecast error:', error);
      alert(`그래프 예측 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl">
            <NetworkIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">지식 그래프 예측</h1>
            <p className="text-gray-600 dark:text-gray-400">GNN 기반 관계형 예측 및 인과 분석</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'forecast', label: 'GNN 예측', icon: ActivityIcon },
              { id: 'graph', label: '온톨로지 관리', icon: NetworkIcon },
              { id: 'causal', label: '인과 분석', icon: GitBranchIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-gray-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'forecast' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">그래프 신경망 예측</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">GNN 모델</label>
                    <select
                      value={forecastConfig.model_type}
                      onChange={(e) => setForecastConfig({ ...forecastConfig, model_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="gcn">Graph Convolutional Network</option>
                      <option value="gat">Graph Attention Network</option>
                      <option value="rgcn">Relational GCN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">예측 기간</label>
                    <input
                      type="number"
                      value={forecastConfig.horizon}
                      onChange={(e) => setForecastConfig({ ...forecastConfig, horizon: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={handleForecast}
                  disabled={loading}
                  className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400"
                >
                  {loading ? '예측 중...' : 'GNN 예측'}
                </button>

                {forecastResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">MAPE: <span className="font-bold">{forecastResult.mape?.toFixed(2)}%</span></p>
                    <p className="text-sm">그래프 이득: <span className="font-bold text-green-600">+{forecastResult.graph_gain?.toFixed(1)}%</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'graph' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">지식 온톨로지 관리</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">온톨로지 유형</label>
                    <select
                      value={graphConfig.ontology_type}
                      onChange={(e) => setGraphConfig({ ...graphConfig, ontology_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="4m2e">4M2E (제조)</option>
                      <option value="6m">6M (원인분석)</option>
                      <option value="custom">사용자 정의</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">4M2E 개념</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['Man', 'Machine', 'Material', 'Method', 'Money', 'Management', 'Environment', 'Energy'].map((concept) => (
                        <div key={concept} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-600" />
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">관계 유형</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div>• 인과 관계 (Causal)</div>
                      <div>• 상관 관계 (Correlation)</div>
                      <div>• 부분 관계 (Part-of)</div>
                      <div>• 의존 관계 (Depends-on)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'causal' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">인과 관계 발견</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  데이터에서 인과 관계를 자동으로 발견하고 시각화합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">PCMCI</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      시계열 인과 발견 알고리즘
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">VAR-LiNGAM</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      선형 비가우시안 인과 모델
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">NOTEARS</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      비순환 구조 학습
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphDashboard;
