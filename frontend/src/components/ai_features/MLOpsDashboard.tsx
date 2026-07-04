/**
 * MLOps Dashboard Component
 * Phase 2: MLOps (Machine Learning Operations)
 *
 * Features:
 * - MLflow-based Model Registry
 * - A/B Testing Framework
 * - Real-time Model Monitoring
 * - CI/CD Pipeline Automation
 * - Model Lifecycle Management
 */

import React, { useState, useEffect } from 'react';
import {
  SettingsIcon,
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  ActivityIcon,
  CheckIcon,
  AlertIcon,
  GitBranchIcon,
  LayersIcon,
  HistoryIcon
} from '@/components/icons/Icons';

// Types
interface ModelVersion {
  id: string;
  name: string;
  version: string;
  stage: 'development' | 'staging' | 'production' | 'archived';
  metrics: {
    mape?: number;
    rmse?: number;
    mae?: number;
  };
  created_at: string;
}

interface ABTest {
  id: string;
  name: string;
  model_a: string;
  model_b: string;
  status: 'running' | 'completed' | 'paused';
  metrics: {
    traffic_split?: number;
    conversion_rate?: number;
    error_rate?: number;
  };
  started_at: string;
}

const MLOpsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registry' | 'abtest' | 'monitoring' | 'pipeline'>('registry');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);

  // New model registration form
  const [newModel, setNewModel] = useState({
    name: '',
    version: '1.0.0',
    stage: 'development' as const
  });

  // AB Test configuration
  const [abTestConfig, setAbTestConfig] = useState({
    name: '',
    model_a: '',
    model_b: '',
    traffic_split: 50
  });

  useEffect(() => {
    loadModels();
    loadABTests();
  }, []);

  const loadModels = async () => {
    // Mock data - would fetch from backend
    setModels([
      {
        id: '1',
        name: 'demand_forecast_model',
        version: '1.2.0',
        stage: 'production',
        metrics: { mape: 0.085, rmse: 125.4, mae: 98.2 },
        created_at: '2024-03-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'demand_forecast_model',
        version: '1.3.0',
        stage: 'staging',
        metrics: { mape: 0.082, rmse: 120.1, mae: 95.5 },
        created_at: '2024-04-01T14:20:00Z'
      },
      {
        id: '3',
        name: 'quality_predictor',
        version: '2.0.0',
        stage: 'development',
        metrics: { mape: 0.045, rmse: 0.12, mae: 0.08 },
        created_at: '2024-04-20T09:15:00Z'
      }
    ]);
  };

  const loadABTests = async () => {
    // Mock data - would fetch from backend
    setAbTests([
      {
        id: '1',
        name: 'Model v1.2 vs v1.3 Test',
        model_a: 'demand_forecast_model-v1.2.0',
        model_b: 'demand_forecast_model-v1.3.0',
        status: 'running',
        metrics: { traffic_split: 50, conversion_rate: 0.85, error_rate: 0.02 },
        started_at: '2024-04-10T08:00:00Z'
      }
    ]);
  };

  const handleRegisterModel = async () => {
    setLoading(true);
    try {
      // Would call API to register model
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadModels();
      setNewModel({ name: '', version: '1.0.0', stage: 'development' });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteModel = async (modelId: string, newStage: string) => {
    setLoading(true);
    try {
      // Would call API to promote model
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadModels();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateABTest = async () => {
    setLoading(true);
    try {
      // Would call API to create A/B test
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadABTests();
      setAbTestConfig({ name: '', model_a: '', model_b: '', traffic_split: 50 });
    } finally {
      setLoading(false);
    }
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'production': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'staging': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'development': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl">
              <LayersIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                MLOps (Machine Learning Operations)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                ML 모델 수명주기 관리 및 운영 자동화
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">전체 모델</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{models.length}</p>
                </div>
                <LayersIcon size={24} className="text-orange-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">프로덕션</p>
                  <p className="text-2xl font-bold text-green-600">
                    {models.filter(m => m.stage === 'production').length}
                  </p>
                </div>
                <CheckIcon size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A/B 테스트</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{abTests.length}</p>
                </div>
                <GitBranchIcon size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">평균 MAPE</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(models.reduce((acc, m) => acc + (m.metrics.mape || 0), 0) / models.length * 100).toFixed(1)}%
                  </p>
                </div>
                <ActivityIcon size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'registry', label: '모델 레지스트리', icon: LayersIcon },
              { id: 'abtest', label: 'A/B 테스트', icon: GitBranchIcon },
              { id: 'monitoring', label: '모델 모니터링', icon: ActivityIcon },
              { id: 'pipeline', label: 'CI/CD 파이프라인', icon: SettingsIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Model Registry Tab */}
            {activeTab === 'registry' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">모델 버전 관리</h3>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                    <LayersIcon size={18} />
                    새 모델 등록
                  </button>
                </div>

                {/* New Model Form */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">새 모델 등록</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="모델 이름"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="버전 (예: 1.0.0)"
                      value={newModel.version}
                      onChange={(e) => setNewModel({ ...newModel, version: e.target.value })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <select
                      value={newModel.stage}
                      onChange={(e) => setNewModel({ ...newModel, stage: e.target.value as any })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      onClick={handleRegisterModel}
                      disabled={loading || !newModel.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      등록
                    </button>
                  </div>
                </div>

                {/* Models Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">모델</th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">버전</th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">스테이지</th>
                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">MAPE</th>
                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">RMSE</th>
                        <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{model.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{model.version}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageBadgeColor(model.stage)}`}>
                              {model.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {model.metrics.mape ? `${(model.metrics.mape * 100).toFixed(2)}%` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {model.metrics.rmse?.toFixed(2) || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              {model.stage !== 'production' && (
                                <button
                                  onClick={() => handlePromoteModel(model.id, 'production')}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  프로덕션
                                </button>
                              )}
                              <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                                상세
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* A/B Testing Tab */}
            {activeTab === 'abtest' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">A/B 테스트 관리</h3>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                    <GitBranchIcon size={18} />
                    새 테스트 생성
                  </button>
                </div>

                {/* New Test Form */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">새 A/B 테스트</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="테스트 이름"
                      value={abTestConfig.name}
                      onChange={(e) => setAbTestConfig({ ...abTestConfig, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <select
                      value={abTestConfig.model_a}
                      onChange={(e) => setAbTestConfig({ ...abTestConfig, model_a: e.target.value })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">모델 A 선택</option>
                      {models.map(m => (
                        <option key={`${m.id}-a`} value={`${m.name}-v${m.version}`}>
                          {m.name} v{m.version}
                        </option>
                      ))}
                    </select>
                    <select
                      value={abTestConfig.model_b}
                      onChange={(e) => setAbTestConfig({ ...abTestConfig, model_b: e.target.value })}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">모델 B 선택</option>
                      {models.map(m => (
                        <option key={`${m.id}-b`} value={`${m.name}-v${m.version}`}>
                          {m.name} v{m.version}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateABTest}
                      disabled={loading || !abTestConfig.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      생성
                    </button>
                  </div>
                </div>

                {/* Tests List */}
                <div className="space-y-4">
                  {abTests.map((test) => (
                    <div key={test.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{test.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {test.model_a} vs {test.model_b}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(test.status)}`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">트래픽 분할:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{test.metrics.traffic_split}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">전환율:</span>
                          <span className="ml-2 font-medium text-green-600">{(test.metrics.conversion_rate! * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">오류율:</span>
                          <span className="ml-2 font-medium text-red-600">{(test.metrics.error_rate! * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">실시간 모델 모니터링</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">모델 성능 메트릭</h4>
                    <div className="space-y-3">
                      {[
                        { label: '예측 지연시간', value: '45ms', status: 'good' },
                        { label: '요청 처리량', value: '1,245 req/min', status: 'good' },
                        { label: '오류율', value: '0.02%', status: 'good' },
                        { label: '모델 드리프트', value: '0.008', status: 'warning' }
                      ].map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{metric.value}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">시스템 리소스</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'CPU 사용률', value: '45%', bar: 45 },
                        { label: '메모리 사용량', value: '2.1GB / 8GB', bar: 26 },
                        { label: 'GPU 사용률', value: '78%', bar: 78 }
                      ].map((resource, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{resource.label}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{resource.value}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${resource.bar}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Tab */}
            {activeTab === 'pipeline' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CI/CD 파이프라인</h3>
                <div className="space-y-4">
                  {[
                    { name: '모델 학습 파이프라인', status: 'success', lastRun: '2시간 전', duration: '45분' },
                    { name: '모델 검증 파이프라인', status: 'success', lastRun: '2시간 전', duration: '10분' },
                    { name: '모델 배포 파이프라인', status: 'running', lastRun: '실행 중', duration: '-' },
                    { name: '데이터 전처리 파이프라인', status: 'success', lastRun: '1시간 전', duration: '15분' }
                  ].map((pipeline, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          pipeline.status === 'success' ? 'bg-green-500' :
                          pipeline.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          'bg-red-500'
                        }`} />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{pipeline.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            마지막 실행: {pipeline.lastRun} ({pipeline.duration})
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                        로그 보기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ZapIcon size={24} className="text-orange-600" />
            MLOps 기능
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">모델 레지스트리</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• MLflow 기반 버전 관리</li>
                <li>• Development → Staging → Production 승격</li>
                <li>• 모델 메타데이터 및 아티팩트 관리</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">A/B 테스트</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 트래픽 분할 및 비교</li>
                <li>• 실시간 성능 모니터링</li>
                <li>• 자동 승자 선택</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">모델 모니터링</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Prometheus 기반 메트릭 수집</li>
                <li>• 드리프트 감지 및 알림</li>
                <li>• 리소스 사용량 추적</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">CI/CD 자동화</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 자동 학습 파이프라인</li>
                <li>• Canary/Blue-Green 배포</li>
                <li>• 자동 롤백 기능</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLOpsDashboard;
