/**
 * Multi-Agent System Component
 * Phase 11: Distributed Intelligent Agents for Collaborative Forecasting
 */

import React, { useState } from 'react';
import { UsersIcon, BotIcon, PlayIcon, BarChartIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const MultiAgentSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'train' | 'predict' | 'status'>('create');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const config = {
    num_agents: 5,
    aggregation_method: 'weighted_average' as 'weighted_average' | 'voting' | 'stacking',
    epochs: 50,
    horizon: 30
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.createMultiAgent(config);
      setResult(response);
    } catch (error: any) {
      alert(`멀티 에이전트 시스템 생성 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.trainMultiAgent({ system_id: 'default', epochs: config.epochs });
      setResult(response);
    } catch (error: any) {
      alert(`학습 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.predictMultiAgent({ system_id: 'default', horizon: config.horizon });
      setResult(response);
    } catch (error: any) {
      alert(`예측 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
              <UsersIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Multi-Agent System
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                분산 지능 에이전트 협업 예측
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'create', label: '시스템 생성', icon: BotIcon },
              { id: 'train', label: '에이전트 학습', icon: PlayIcon },
              { id: 'predict', label: '협업 예측', icon: BarChartIcon },
              { id: 'status', label: '상태', icon: UsersIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">구성</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">에이전트 수</p>
                  <p className="text-2xl font-bold text-blue-600">{config.num_agents}</p>
                </div>
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">집계 방법</p>
                  <p className="text-lg font-bold text-cyan-600">{config.aggregation_method}</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">학습 에포크</p>
                  <p className="text-2xl font-bold text-indigo-600">{config.epochs}</p>
                </div>
                <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">예측 기간</p>
                  <p className="text-2xl font-bold text-sky-600">{config.horizon}일</p>
                </div>
              </div>

              <button
                onClick={activeTab === 'create' ? handleCreate : activeTab === 'train' ? handleTrain : activeTab === 'predict' ? handlePredict : () => {}}
                disabled={loading || activeTab === 'status'}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : activeTab === 'create' ? '시스템 생성' : activeTab === 'train' ? '학습 시작' : activeTab === 'predict' ? '예측 실행' : '상태 확인'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">에이전트 현황</h2>

              <div className="grid grid-cols-5 gap-4 mb-6">
                {['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5'].map((agent, i) => (
                  <div key={agent} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <BotIcon size={24} className="text-white" />
                    </div>
                    <p className="text-sm font-medium">{agent}</p>
                    <p className="text-xs text-gray-500">{['LSTM', 'GRU', 'Transformer', 'ARIMA', 'Linear'][i]}</p>
                    <div className="mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium mb-4">협업 프로세스</h3>
                <div className="flex items-center justify-between">
                  {['데이터 입력', '개별 예측', '집계', '최종 결과'].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm">{step}</p>
                      </div>
                      {i < 3 && <div className="flex-1 h-0.5 bg-blue-300 mx-2"></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {result && result.result && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium mb-2 text-green-900 dark:text-green-300">결과</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                      <p className="font-bold text-green-600">{result.result.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">에이전트 수</p>
                      <p className="font-bold">{result.result.num_agents}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentSystem;
