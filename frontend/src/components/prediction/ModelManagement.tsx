/**
 * 예측 모델 관리 컴포넌트
 * ML 모델의 학습, 배포, 성능 모니터링 및 버전 관리
 */

import React, { useState } from 'react';
import {
  BrainIcon, PlayIcon, PauseIcon, SettingsIcon, BarChartIcon,
  TrendUpIcon, AlertIcon, CheckIcon, RefreshIcon, PlusIcon,
  DownloadIcon, UploadIcon, TrashIcon, EditIcon, HistoryIcon
} from '@/components/icons/Icons';

// 모델 정보 타입
interface ModelInfo {
  id: string;
  name: string;
  type: 'LSTM' | 'RandomForest' | 'XGBoost' | 'LightGBM' | 'Prophet' | 'ARIMA' | 'Transformer';
  domain: 'production' | 'quality' | 'sales' | 'inventory' | 'finance' | 'equipment' | 'customer' | 'cost' | 'purchase' | 'logistics' | 'hr' | 'etc';
  version: string;
  status: 'training' | 'active' | 'deprecated' | 'failed';
  accuracy: number;
  mape: number;
  rmse: number;
  lastTrained: string;
  lastDeployed: string;
  trainingProgress: number;
  description: string;
}

// 모델 버전 정보
interface ModelVersion {
  version: string;
  deployedAt: string;
  accuracy: number;
  status: 'active' | 'rolled_back' | 'deprecated';
  changes: string;
}

// 학습 기록
interface TrainingHistory {
  id: string;
  modelId: string;
  startTime: string;
  endTime?: string;
  status: 'completed' | 'failed' | 'running';
  accuracy?: number;
  epochs?: number;
  loss?: number;
  errorMessage?: string;
  progress?: number;
}

const ModelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'models' | 'training' | 'versions' | 'metrics'>('models');
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [showTrainModal, setShowTrainModal] = useState(false);

  const [models, setModels] = useState<ModelInfo[]>([
    {
      id: 'm1',
      name: '생산량 예측 모델',
      type: 'LSTM',
      domain: 'production',
      version: '2.1.0',
      status: 'active',
      accuracy: 96.8,
      mape: 3.2,
      rmse: 125.5,
      lastTrained: '2024-03-15 14:30',
      lastDeployed: '2024-03-15 15:00',
      trainingProgress: 100,
      description: '시계열 LSTM 기반 생산량 예측'
    },
    {
      id: 'm2',
      name: '불량률 예측 모델',
      type: 'RandomForest',
      domain: 'quality',
      version: '1.8.5',
      status: 'active',
      accuracy: 94.2,
      mape: 5.8,
      rmse: 2.3,
      lastTrained: '2024-03-14 10:15',
      lastDeployed: '2024-03-14 11:00',
      trainingProgress: 100,
      description: '랜덤 포레스트 기반 불량률 예측'
    },
    {
      id: 'm3',
      name: '매출액 예측 모델',
      type: 'Prophet',
      domain: 'sales',
      version: '3.0.1',
      status: 'active',
      accuracy: 92.5,
      mape: 7.5,
      rmse: 450000,
      lastTrained: '2024-03-13 16:45',
      lastDeployed: '2024-03-13 17:30',
      trainingProgress: 100,
      description: 'Facebook Prophet 기반 매출액 예측'
    },
    {
      id: 'm4',
      name: '재고 수요 예측',
      type: 'XGBoost',
      domain: 'inventory',
      version: '1.5.2',
      status: 'training',
      accuracy: 0,
      mape: 0,
      rmse: 0,
      lastTrained: '2024-03-15 12:00',
      lastDeployed: '-',
      trainingProgress: 67,
      description: 'XGBoost 기반 재고 수요 예측'
    }
  ]);

  const [modelVersions, setModelVersions] = useState<Record<string, ModelVersion[]>>({
    'm1': [
      { version: '2.1.0', deployedAt: '2024-03-15 15:00', accuracy: 96.8, status: 'active', changes: '특성 엔지니어링 개선' },
      { version: '2.0.5', deployedAt: '2024-03-10 14:00', accuracy: 95.2, status: 'rolled_back', changes: '하이퍼파라미터 튜닝' }
    ]
  });

  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([
    { id: 't1', modelId: 'm4', startTime: '2024-03-15 12:00', status: 'running', progress: 67 },
    { id: 't2', modelId: 'm1', startTime: '2024-03-15 14:30', endTime: '2024-03-15 15:00', status: 'completed', accuracy: 96.8, epochs: 100, loss: 0.032 },
    { id: 't3', modelId: 'm2', startTime: '2024-03-14 10:15', endTime: '2024-03-14 10:45', status: 'completed', accuracy: 94.2, epochs: 200, loss: 0.045 }
  ]);

  const domainNames: Record<string, string> = {
    production: '생산',
    quality: '품질',
    sales: '영업',
    inventory: '재고',
    finance: '재무',
    equipment: '설비',
    customer: '고객',
    cost: '원가',
    purchase: '구매',
    logistics: '물류',
    hr: '인사',
    etc: '기타'
  };

  const typeColors: Record<string, string> = {
    LSTM: 'bg-purple-100 text-purple-700',
    RandomForest: 'bg-green-100 text-green-700',
    XGBoost: 'bg-orange-100 text-orange-700',
    LightGBM: 'bg-blue-100 text-blue-700',
    Prophet: 'bg-pink-100 text-pink-700',
    ARIMA: 'bg-indigo-100 text-indigo-700',
    Transformer: 'bg-rose-100 text-rose-700'
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-700', label: '활성' },
    training: { color: 'bg-yellow-100 text-yellow-700', label: '학습중' },
    deprecated: { color: 'bg-gray-100 text-gray-700', label: '사용안함' },
    failed: { color: 'bg-red-100 text-red-700', label: '실패' }
  };

  const deployModel = (modelId: string) => {
    setModels(models.map(m =>
      m.id === modelId ? { ...m, status: 'active' as const, lastDeployed: new Date().toISOString().slice(0, 16).replace('T', ' ') } : m
    ));
  };

  const deleteModel = (modelId: string) => {
    if (confirm('정말 이 모델을 삭제하시겠습니까?')) {
      setModels(models.filter(m => m.id !== modelId));
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <BrainIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                예측 모델 관리
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                ML 모델 학습, 배포, 성능 모니터링 및 버전 관리
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex gap-2 p-2">
            {[
              { id: 'models', label: '모델 목록', icon: '📋' },
              { id: 'training', label: '학습 관리', icon: '🎯' },
              { id: 'versions', label: '버전 관리', icon: '📚' },
              { id: 'metrics', label: '성능 지표', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">전체 모델</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{models.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <BrainIcon className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">활성 모델</p>
                    <p className="text-2xl font-bold text-green-600">{models.filter(m => m.status === 'active').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckIcon className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">학습 중</p>
                    <p className="text-2xl font-bold text-yellow-600">{models.filter(m => m.status === 'training').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <RefreshIcon className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">평균 정확도</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(models.filter(m => m.status === 'active').reduce((sum, m) => sum + m.accuracy, 0) / Math.max(1, models.filter(m => m.status === 'active').length)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <BarChartIcon className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Model List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">모델 목록</h2>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    <PlusIcon size={16} />
                    새 모델 학습
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">모델명</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">타입</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">도메인</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">버전</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">상태</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">정확도</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">MAPE</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">마지막 학습</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {models.map(model => (
                      <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{model.name}</p>
                            <p className="text-sm text-gray-500">{model.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[model.type]}`}>{model.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{domainNames[model.domain]}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{model.version}</td>
                        <td className="px-6 py-4 text-center">
                          {model.status === 'training' ? (
                            <div className="inline-flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs text-yellow-600">{model.trainingProgress}%</span>
                            </div>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[model.status].color}`}>{statusConfig[model.status].label}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                          {model.accuracy > 0 ? `${model.accuracy.toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                          {model.mape > 0 ? `${model.mape.toFixed(2)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">{model.lastTrained}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedModel(model)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="상세보기">
                              <BarChartIcon size={16} />
                            </button>
                            {model.status !== 'training' && (
                              <button onClick={() => deployModel(model.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="재배포">
                                <UploadIcon size={16} />
                              </button>
                            )}
                            <button onClick={() => deleteModel(model.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="삭제">
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">학습 관리</h2>
              <div className="space-y-4">
                {trainingHistory.map(history => (
                  <div key={history.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          history.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                          history.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {history.status === 'running' ? '학습중' : history.status === 'completed' ? '완료' : '실패'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {models.find(m => m.id === history.modelId)?.name || 'Unknown Model'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{history.startTime}</span>
                    </div>
                    {history.status === 'running' && history.progress !== undefined && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>학습 진행률</span>
                          <span>{history.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${history.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                    {history.status === 'completed' && history.accuracy !== undefined && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">정확도:</span>
                          <span className="ml-2 font-medium text-green-600">{history.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Epochs:</span>
                          <span className="ml-2 font-medium">{history.epochs}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Loss:</span>
                          <span className="ml-2 font-medium">{history.loss}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && selectedModel && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">버전 관리 - {selectedModel.name}</h2>
            <div className="space-y-3">
              {(modelVersions[selectedModel.id] || []).map((version, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">v{version.version}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          version.status === 'active' ? 'bg-green-100 text-green-700' :
                          version.status === 'rolled_back' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {version.status === 'active' ? '현재 버전' : version.status === 'rolled_back' ? '롤백됨' : '사용안함'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{version.changes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">정확도: {version.accuracy}%</p>
                      <p className="text-xs text-gray-500">{version.deployedAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">성능 지표</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">모델별 정확도</h3>
                <div className="space-y-2">
                  {models.filter(m => m.status === 'active').map(model => (
                    <div key={model.id} className="flex items-center gap-3">
                      <span className="w-32 text-sm truncate">{model.name}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <div
                          className={`h-4 rounded-full ${
                            model.accuracy >= 95 ? 'bg-green-500' : model.accuracy >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${model.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{model.accuracy.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">도메인별 분포</h3>
                <div className="space-y-2">
                  {Object.entries(domainNames).map(([key, name]) => {
                    const count = models.filter(m => m.domain === key).length;
                    const percentage = (count / models.length) * 100;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-32 text-sm">{name}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium w-12">{count}개</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelManagement;
