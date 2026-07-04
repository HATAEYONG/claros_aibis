/**
 * 강화학습 기반 예측 컴포넌트
 * RL 알고리즘을 활용한 적응형 예측 시스템
 *
 * 주요 기능:
 * - RL 알고리즘 학습 (DQN, PPO, A3C)
 * - 적응형 학습 관리
 * - 개념 드리프트 탐지
 * - 성능 모니터링
 * - 모델 선택 및 앙상블 가중치 최적화
 */

import React, { useState, useEffect } from 'react';
import {
  BrainIcon, PlayIcon, PauseIcon, SettingsIcon, BarChartIcon,
  TrendUpIcon, AlertIcon, CheckIcon, RefreshIcon, PlusIcon,
  DownloadIcon, UploadIcon, TrashIcon, EditIcon, ActivityIcon,
  ZapIcon, TargetIcon, AwardIcon
} from '@/components/icons/Icons';

// 타입 정의
interface RLConfig {
  rl_algorithm: 'dqn' | 'ppo' | 'a3c';
  state_dim: number;
  action_dim: number;
  learning_rate: number;
  gamma: number;
  buffer_size: number;
  episodes: number;
}

interface TrainingHistory {
  id: string;
  algorithm: string;
  episodes: number;
  finalReward: number;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  mape?: number;
  mae?: number;
  rmse?: number;
}

interface DriftDetection {
  timestamp: string;
  detected: boolean;
  method: string;
  confidence: number;
  prediction: number;
  actual: number;
  error: number;
}

interface PerformanceMetrics {
  mape: number;
  mae: number;
  rmse: number;
  samples: number;
  should_retrain: boolean;
  retrain_reason?: string;
}

interface EnsembleWeights {
  model: string;
  weight: number;
  performance: number;
}

const ReinforcementLearning: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'training' | 'adaptive' | 'drift' | 'ensemble'>('training');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // RL 설정
  const [config, setConfig] = useState<RLConfig>({
    rl_algorithm: 'dqn',
    state_dim: 64,
    action_dim: 10,
    learning_rate: 0.001,
    gamma: 0.99,
    buffer_size: 10000,
    episodes: 100
  });

  // 학습 이력
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([
    {
      id: 'rl1',
      algorithm: 'DQN',
      episodes: 100,
      finalReward: 0.85,
      status: 'completed',
      startTime: '2024-03-15 10:30',
      endTime: '2024-03-15 12:45',
      mape: 4.2,
      mae: 125.5,
      rmse: 180.3
    },
    {
      id: 'rl2',
      algorithm: 'PPO',
      episodes: 150,
      finalReward: 0.92,
      status: 'completed',
      startTime: '2024-03-14 14:00',
      endTime: '2024-03-14 17:30',
      mape: 3.8,
      mae: 110.2,
      rmse: 155.8
    }
  ]);

  // 드리프트 탐지 이력
  const [driftHistory, setDriftHistory] = useState<DriftDetection[]>([
    {
      timestamp: '2024-03-15 15:30',
      detected: false,
      method: 'DDM',
      confidence: 0.95,
      prediction: 1000,
      actual: 1015,
      error: 0.015
    },
    {
      timestamp: '2024-03-15 14:00',
      detected: true,
      method: 'ADWIN',
      confidence: 0.88,
      prediction: 980,
      actual: 1050,
      error: 0.071
    }
  ]);

  // 성능 메트릭
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    mape: 3.5,
    mae: 105.8,
    rmse: 145.2,
    samples: 1000,
    should_retrain: false
  });

  // 앙상블 가중치
  const [ensembleWeights, setEnsembleWeights] = useState<EnsembleWeights[]>([
    { model: 'LSTM', weight: 0.35, performance: 0.92 },
    { model: 'TFT', weight: 0.30, performance: 0.88 },
    { model: 'Prophet', weight: 0.20, performance: 0.85 },
    { model: 'XGBoost', weight: 0.15, performance: 0.82 }
  ]);

  // 알고리즘 정보
  const algorithms = [
    {
      id: 'dqn',
      name: 'DQN',
      fullName: 'Deep Q-Network',
      description: '딥 Q-러닝을 활용한 가치 기반 강화학습',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ppo',
      name: 'PPO',
      fullName: 'Proximal Policy Optimization',
      description: '근접 정책 최적화를 통한 안정적인 학습',
      icon: '🚀',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'a3c',
      name: 'A3C',
      fullName: 'Asynchronous Advantage Actor-Critic',
      description: '비동기식 액터-크리틱 알고리즘',
      icon: '⚡',
      color: 'from-orange-500 to-red-500'
    }
  ];

  // 학습 시작
  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    // 진행률 시뮬레이션
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);

          // 학습 완료 후 이력 추가
          const newHistory: TrainingHistory = {
            id: `rl${Date.now()}`,
            algorithm: config.rl_algorithm.toUpperCase(),
            episodes: config.episodes,
            finalReward: 0.85 + Math.random() * 0.1,
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            mape: 3 + Math.random() * 2,
            mae: 100 + Math.random() * 50,
            rmse: 140 + Math.random() * 40
          };
          setTrainingHistory(prev => [newHistory, ...prev]);

          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  // 설정 변경 핸들러
  const handleConfigChange = (key: keyof RLConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // 알고리즘 선택 렌더링
  const renderAlgorithmSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {algorithms.map(algo => (
        <button
          key={algo.id}
          onClick={() => handleConfigChange('rl_algorithm', algo.id)}
          className={`p-4 rounded-xl border-2 transition-all ${
            config.rl_algorithm === algo.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">{algo.icon}</div>
          <div className="font-bold text-gray-800 dark:text-gray-200">{algo.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{algo.fullName}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{algo.description}</div>
        </button>
      ))}
    </div>
  );

  // 학습 탭 렌더링
  const renderTrainingTab = () => (
    <div className="space-y-6">
      {/* 알고리즘 선택 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <BrainIcon size={20} />
          RL 알고리즘 선택
        </h3>
        {renderAlgorithmSelector()}
      </div>

      {/* 하이퍼파라미터 설정 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <SettingsIcon size={20} />
          하이퍼파라미터 설정
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State Dimension
            </label>
            <input
              type="number"
              value={config.state_dim}
              onChange={(e) => handleConfigChange('state_dim', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action Dimension
            </label>
            <input
              type="number"
              value={config.action_dim}
              onChange={(e) => handleConfigChange('action_dim', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Learning Rate
            </label>
            <input
              type="number"
              step="0.0001"
              value={config.learning_rate}
              onChange={(e) => handleConfigChange('learning_rate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gamma (Discount Factor)
            </label>
            <input
              type="number"
              step="0.01"
              value={config.gamma}
              onChange={(e) => handleConfigChange('gamma', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buffer Size
            </label>
            <input
              type="number"
              value={config.buffer_size}
              onChange={(e) => handleConfigChange('buffer_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Episodes
            </label>
            <input
              type="number"
              value={config.episodes}
              onChange={(e) => handleConfigChange('episodes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* 학습 진행 상황 */}
      {isTraining && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 dark:text-gray-200">학습 진행 중</h4>
            <span className="text-2xl font-bold text-blue-600">{trainingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Episode {Math.floor(trainingProgress / 100 * config.episodes)} / {config.episodes}
          </p>
        </div>
      )}

      {/* 학습 시작 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={startTraining}
          disabled={isTraining}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            isTraining
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
          }`}
        >
          {isTraining ? (
            <>
              <RefreshIcon size={20} className="animate-spin" />
              학습 중...
            </>
          ) : (
            <>
              <PlayIcon size={20} />
              학습 시작
            </>
          )}
        </button>
      </div>

      {/* 학습 이력 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">학습 이력</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-3">알고리즘</th>
                <th className="text-left p-3">Episodes</th>
                <th className="text-left p-3">Final Reward</th>
                <th className="text-left p-3">MAPE</th>
                <th className="text-left p-3">MAE</th>
                <th className="text-left p-3">RMSE</th>
                <th className="text-left p-3">상태</th>
                <th className="text-left p-3">학습 시간</th>
              </tr>
            </thead>
            <tbody>
              {trainingHistory.map(history => (
                <tr key={history.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium">{history.algorithm}</td>
                  <td className="p-3">{history.episodes}</td>
                  <td className="p-3">
                    <span className="text-green-600 font-medium">{history.finalReward.toFixed(3)}</span>
                  </td>
                  <td className="p-3">{history.mape?.toFixed(2)}%</td>
                  <td className="p-3">{history.mae?.toFixed(2)}</td>
                  <td className="p-3">{history.rmse?.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      history.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {history.status === 'completed' ? '완료' : '진행중'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{history.startTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 적응형 학습 탭 렌더링
  const renderAdaptiveTab = () => (
    <div className="space-y-6">
      {/* 성능 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">MAPE</span>
            <TargetIcon size={20} />
          </div>
          <div className="text-3xl font-bold">{performance.mape.toFixed(2)}%</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">MAE</span>
            <ActivityIcon size={20} />
          </div>
          <div className="text-3xl font-bold">{performance.mae.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">RMSE</span>
            <ZapIcon size={20} />
          </div>
          <div className="text-3xl font-bold">{performance.rmse.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Samples</span>
            <AwardIcon size={20} />
          </div>
          <div className="text-3xl font-bold">{performance.samples}</div>
        </div>
      </div>

      {/* 재학습 필요 여부 */}
      {performance.should_retrain && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl flex items-center gap-3">
          <AlertIcon size={24} className="text-yellow-600" />
          <div>
            <div className="font-bold text-yellow-800 dark:text-yellow-200">재학습 권장</div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">{performance.retrain_reason}</div>
          </div>
          <button className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            재학습 시작
          </button>
        </div>
      )}

      {/* 적응형 학습 설정 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">적응형 학습 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              윈도우 크기
            </label>
            <input
              type="number"
              defaultValue={100}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              적응 임계값
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue={0.1}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // 드리프트 탐지 탭 렌더링
  const renderDriftTab = () => (
    <div className="space-y-6">
      {/* 드리프트 탐지 설정 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">드리프트 탐지 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              탐지 방법
            </label>
            <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <option value="ddm">DDM (Drift Detection Method)</option>
              <option value="eddm">EDDM (Early DDM)</option>
              <option value="adwin">ADWIN (Adaptive Windowing)</option>
              <option value="page_hinkley">Page-Hinkley Test</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              경고 레벨
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue={0.95}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              드리프트 레벨
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue={0.9}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* 드리프트 탐지 이력 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">탐지 이력</h3>
        <div className="space-y-3">
          {driftHistory.map((drift, idx) => (
            <div key={idx} className={`p-4 rounded-xl border-2 ${
              drift.detected
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-green-300 bg-green-50 dark:bg-green-900/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {drift.detected ? (
                    <AlertIcon size={20} className="text-red-600" />
                  ) : (
                    <CheckIcon size={20} className="text-green-600" />
                  )}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {drift.detected ? '드리프트 탐지됨' : '정상'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{drift.timestamp}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">방법:</span>
                  <span className="ml-2 font-medium">{drift.method}</span>
                </div>
                <div>
                  <span className="text-gray-600">신뢰도:</span>
                  <span className="ml-2 font-medium">{(drift.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">예측:</span>
                  <span className="ml-2 font-medium">{drift.prediction}</span>
                </div>
                <div>
                  <span className="text-gray-600">실제:</span>
                  <span className="ml-2 font-medium">{drift.actual}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 앙상블 탭 렌더링
  const renderEnsembleTab = () => (
    <div className="space-y-6">
      {/* 앙상블 가중치 시각화 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">앙상블 모델 가중치</h3>
        <div className="space-y-4">
          {ensembleWeights.map((item, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800 dark:text-gray-200">{item.model}</span>
                <span className="text-sm text-gray-600">성능: {item.performance.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                  style={{ width: `${item.weight * 100}%` }}
                />
              </div>
              <div className="text-right text-sm text-gray-600 mt-1">
                {item.weight >= 0.1 ? `${(item.weight * 100).toFixed(1)}%` : '< 10%'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 자동 가중치 업데이트 설정 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">자동 가중치 업데이트</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              학습률
            </label>
            <input
              type="number"
              step="0.001"
              defaultValue={0.01}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              업데이트 주기
            </label>
            <input
              type="number"
              defaultValue={10}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <button className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600">
          가중치 업데이트
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <BrainIcon size={28} />
            강화학습 기반 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RL 알고리즘을 활용한 적응형 예측 시스템
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="새로고침"
        >
          <RefreshIcon size={20} />
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'training'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
          }`}
        >
          🎯 RL 학습
        </button>
        <button
          onClick={() => setActiveTab('adaptive')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'adaptive'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
          }`}
        >
          🔄 적응형 학습
        </button>
        <button
          onClick={() => setActiveTab('drift')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'drift'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
          }`}
        >
          ⚠️ 드리프트 탐지
        </button>
        <button
          onClick={() => setActiveTab('ensemble')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'ensemble'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
          }`}
        >
          🤝 앙상블
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          {activeTab === 'training' && renderTrainingTab()}
          {activeTab === 'adaptive' && renderAdaptiveTab()}
          {activeTab === 'drift' && renderDriftTab()}
          {activeTab === 'ensemble' && renderEnsembleTab()}
        </div>
      </div>
    </div>
  );
};

export default ReinforcementLearning;
