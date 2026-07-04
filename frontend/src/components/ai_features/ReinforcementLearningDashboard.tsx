/**
 * Reinforcement Learning Dashboard Component
 * Phase 9: Reinforcement Learning
 *
 * Features:
 * - RL Forecaster (DQN, PPO, A3C)
 * - Adaptive Learning
 * - Reward System
 * - Concept Drift Detection
 */

import React, { useState } from 'react';
import {
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  BrainIcon,
  TargetIcon,
  ActivityIcon,
  TrendUpIcon
} from '@/components/icons/Icons';
import { rlForecastService } from '@/services/rlForecastService';

const ReinforcementLearningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'train' | 'reward' | 'adaptive'>('train');
  const [loading, setLoading] = useState(false);

  const [trainConfig, setTrainConfig] = useState({
    algorithm: 'ppo' as 'dqn' | 'ppo' | 'a3c',
    num_episodes: 1000,
    learning_rate: 0.001,
    gamma: 0.99
  });

  const [rewardConfig, setRewardConfig] = useState({
    reward_type: 'mape_based' as 'mape_based' | 'custom' | 'multi_objective',
    penalty_factor: 1.0,
    reward_scale: 1.0
  });

  const [trainResult, setTrainResult] = useState<any>(null);

  const handleTrain = async () => {
    setLoading(true);
    try {
      const result = await rlForecastService.trainRL(trainConfig);
      setTrainResult(result);
    } catch (error: any) {
      console.error('RL training error:', error);
      alert(`RL 학습 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl">
            <BrainIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">강화학습 예측</h1>
            <p className="text-gray-600 dark:text-gray-400">적응형 학습 및 동적 환경 대응</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'train', label: 'RL 학습', icon: BrainIcon },
              { id: 'reward', label: '보상 시스템', icon: TargetIcon },
              { id: 'adaptive', label: '적응형 학습', icon: ActivityIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'train' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">강화학습 모델 학습</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">알고리즘</label>
                    <select
                      value={trainConfig.algorithm}
                      onChange={(e) => setTrainConfig({ ...trainConfig, algorithm: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="dqn">DQN (Deep Q-Network)</option>
                      <option value="ppo">PPO (Proximal Policy Optimization)</option>
                      <option value="a3c">A3C (Asynchronous Actor-Critic)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">학습 에피소드</label>
                    <input
                      type="number"
                      value={trainConfig.num_episodes}
                      onChange={(e) => setTrainConfig({ ...trainConfig, num_episodes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">학습률</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={trainConfig.learning_rate}
                      onChange={(e) => setTrainConfig({ ...trainConfig, learning_rate: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">할인 계수 (Gamma)</label>
                    <input
                      type="number"
                      step="0.01"
                      max="1"
                      value={trainConfig.gamma}
                      onChange={(e) => setTrainConfig({ ...trainConfig, gamma: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={handleTrain}
                  disabled={loading}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400"
                >
                  {loading ? '학습 중...' : 'RL 학습 시작'}
                </button>

                {trainResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">최종 보상: <span className="font-bold">{trainResult.final_reward?.toFixed(2)}</span></p>
                    <p className="text-sm">에피소드: <span className="font-bold">{trainResult.episodes}</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reward' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">보상 시스템 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">보상 유형</label>
                    <select
                      value={rewardConfig.reward_type}
                      onChange={(e) => setRewardConfig({ ...rewardConfig, reward_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="mape_based">MAPE 기반</option>
                      <option value="custom">사용자 정의</option>
                      <option value="multi_objective">다목적 최적화</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">페널티 계수</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rewardConfig.penalty_factor}
                      onChange={(e) => setRewardConfig({ ...rewardConfig, penalty_factor: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">보상 스케일</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rewardConfig.reward_scale}
                      onChange={(e) => setRewardConfig({ ...rewardConfig, reward_scale: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>보상 함수:</strong> R = (MAPE 기반 보상) - (페널티 × {rewardConfig.penalty_factor}) × {rewardConfig.reward_scale}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'adaptive' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">적응형 학습</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  데이터 패턴 변화에 자동으로 적응하는 온라인 학습 시스템입니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">개념 드리프트 감지</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      데이터 분포 변화를 실시간으로 감지하고 모델을 재학습합니다.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">온라인 학습</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      새로운 데이터가 수집될 때마다 모델을 업데이트합니다.
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

export default ReinforcementLearningDashboard;
