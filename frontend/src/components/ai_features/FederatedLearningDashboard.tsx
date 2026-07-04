/**
 * Federated Learning Dashboard Component
 * Phase 7: Federated Learning
 *
 * Features:
 * - Federated Forecaster (FedAvg, FedBuff, FedProx)
 * - Secure Aggregation (Homomorphic encryption, Differential privacy)
 * - Privacy Accounting
 * - Collaborative training across locations
 */

import React, { useState } from 'react';
import {
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  SecurityIcon,
  UsersIcon,
  ActivityIcon
} from '@/components/icons/Icons';
import { federatedService } from '@/services/federatedService';

const FederatedLearningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'train' | 'secure' | 'privacy'>('train');
  const [loading, setLoading] = useState(false);

  const [trainConfig, setTrainConfig] = useState({
    model_id: '',
    aggregation_method: 'fedavg' as 'fedavg' | 'fedbuff' | 'fedprox',
    num_clients: 5,
    num_rounds: 100,
    local_epochs: 5
  });

  const [secureConfig, setSecureConfig] = useState({
    use_homomorphic_encryption: true,
    use_differential_privacy: true,
    epsilon: 1.0,
    delta: 1e-5
  });

  const [trainResult, setTrainResult] = useState<any>(null);

  const handleTrain = async () => {
    setLoading(true);
    try {
      const result = await federatedService.trainFederated(trainConfig);
      setTrainResult(result);
    } catch (error: any) {
      console.error('Federated training error:', error);
      alert(`연합 학습 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl">
            <SecurityIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">연합 학습 (Federated Learning)</h1>
            <p className="text-gray-600 dark:text-gray-400">개인정보 보존 협업 학습</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'train', label: '연합 학습', icon: UsersIcon },
              { id: 'secure', label: '보안 집계', icon: SecurityIcon },
              { id: 'privacy', label: '프라이버시', icon: SecurityIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'
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
                <h3 className="text-lg font-semibold mb-4">연합 학습 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">집계 방법</label>
                    <select
                      value={trainConfig.aggregation_method}
                      onChange={(e) => setTrainConfig({ ...trainConfig, aggregation_method: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="fedavg">FedAvg (평균 집계)</option>
                      <option value="fedbuff">FedBuff (버퍼링)</option>
                      <option value="fedprox">FedProx (근접 제약)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">클라이언트 수</label>
                    <input
                      type="number"
                      value={trainConfig.num_clients}
                      onChange={(e) => setTrainConfig({ ...trainConfig, num_clients: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">학습 라운드</label>
                    <input
                      type="number"
                      value={trainConfig.num_rounds}
                      onChange={(e) => setTrainConfig({ ...trainConfig, num_rounds: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">로컬 에포크</label>
                    <input
                      type="number"
                      value={trainConfig.local_epochs}
                      onChange={(e) => setTrainConfig({ ...trainConfig, local_epochs: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={handleTrain}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? '학습 중...' : '연합 학습 시작'}
                </button>

                {trainResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">최종 MAPE: <span className="font-bold">{trainResult.mape?.toFixed(2)}%</span></p>
                    <p className="text-sm">참여 클라이언트: <span className="font-bold">{trainResult.num_clients}</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'secure' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">보안 집계 설정</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secureConfig.use_homomorphic_encryption}
                      onChange={(e) => setSecureConfig({ ...secureConfig, use_homomorphic_encryption: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">동형 암호화</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">암호화된 상태에서 집계 수행</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secureConfig.use_differential_privacy}
                      onChange={(e) => setSecureConfig({ ...secureConfig, use_differential_privacy: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">차등 프라이버시</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">노이즈 추가로 개인정보 보호</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">프라이버시 예산 관리</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">Epsilon (ε)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={secureConfig.epsilon}
                      onChange={(e) => setSecureConfig({ ...secureConfig, epsilon: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">낮을수록 강력한 프라이버시 보호</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Delta (δ)</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={secureConfig.delta}
                      onChange={(e) => setSecureConfig({ ...secureConfig, delta: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">실패 확률 (일반적으로 1e-5)</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>현재 프라이버시 예산:</strong> (ε={secureConfig.epsilon}, δ={secureConfig.delta})
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    이 예산 내에서 개인 정보가 보호됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FederatedLearningDashboard;
