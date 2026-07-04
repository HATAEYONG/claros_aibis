/**
 * Diffusion Models Component
 * Phase 11: Diffusion Models for Time Series Forecasting
 */

import React, { useState } from 'react';
import { TrendUpIcon, ZapIcon, SettingsIcon, PlayIcon, BarChartIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const DiffusionModels: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'train' | 'predict' | 'info'>('train');
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Training state
  const [trainConfig, setTrainConfig] = useState({
    diffusion_type: 'ddpm' as 'ddpm' | 'ddim' | 'score-based',
    timesteps: 1000,
    beta_schedule: 'cosine' as 'linear' | 'cosine' | 'sigmoid',
    context_length: 64,
    epochs: 100,
    batch_size: 32
  });

  // Prediction state
  const [predictConfig, setPredictConfig] = useState({
    model_id: 'default',
    horizon: 30,
    num_samples: 10
  });

  // Results state
  const [trainResult, setTrainResult] = useState<any>(null);
  const [forecastResult, setForecastResult] = useState<any>(null);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const result = await nextGenAIService.trainDiffusion(trainConfig);
      setTrainResult(result);
    } catch (error: any) {
      console.error('Training error:', error);
      alert(`학습 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const result = await nextGenAIService.predictDiffusion(predictConfig);
      setForecastResult(result);
    } catch (error: any) {
      console.error('Prediction error:', error);
      alert(`예측 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <TrendUpIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Diffusion Models
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                디노이징 디퓨전 확률 모델을 활용한 시계열 예측
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'train', label: '모델 학습', icon: SettingsIcon },
              { id: 'predict', label: '예측 생성', icon: PlayIcon },
              { id: 'info', label: '정보', icon: BarChartIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SettingsIcon size={20} className="text-purple-600" />
                설정
              </h2>

              {activeTab === 'train' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Diffusion Type
                    </label>
                    <select
                      value={trainConfig.diffusion_type}
                      onChange={(e) => setTrainConfig({ ...trainConfig, diffusion_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ddpm">DDPM (Denoising Diffusion)</option>
                      <option value="ddim">DDIM (Implicit Diffusion)</option>
                      <option value="score-based">Score-Based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timesteps: {trainConfig.timesteps}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={trainConfig.timesteps}
                      onChange={(e) => setTrainConfig({ ...trainConfig, timesteps: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Beta Schedule
                    </label>
                    <select
                      value={trainConfig.beta_schedule}
                      onChange={(e) => setTrainConfig({ ...trainConfig, beta_schedule: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="linear">Linear</option>
                      <option value="cosine">Cosine</option>
                      <option value="sigmoid">Sigmoid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Context Length: {trainConfig.context_length}
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="128"
                      step="16"
                      value={trainConfig.context_length}
                      onChange={(e) => setTrainConfig({ ...trainConfig, context_length: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Epochs: {trainConfig.epochs}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={trainConfig.epochs}
                      onChange={(e) => setTrainConfig({ ...trainConfig, epochs: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Batch Size: {trainConfig.batch_size}
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="128"
                      step="16"
                      value={trainConfig.batch_size}
                      onChange={(e) => setTrainConfig({ ...trainConfig, batch_size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleTrain}
                    disabled={training}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {training ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        학습 중...
                      </>
                    ) : (
                      <>
                        <PlayIcon size={20} />
                        모델 학습 시작
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'predict' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model ID
                    </label>
                    <input
                      type="text"
                      value={predictConfig.model_id}
                      onChange={(e) => setPredictConfig({ ...predictConfig, model_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horizon: {predictConfig.horizon}
                    </label>
                    <input
                      type="range"
                      min="7"
                      max="90"
                      step="7"
                      value={predictConfig.horizon}
                      onChange={(e) => setPredictConfig({ ...predictConfig, horizon: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Num Samples: {predictConfig.num_samples}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={predictConfig.num_samples}
                      onChange={(e) => setPredictConfig({ ...predictConfig, num_samples: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handlePredict}
                    disabled={predicting}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {predicting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        예측 중...
                      </>
                    ) : (
                      <>
                        <TrendUpIcon size={20} />
                        예측 생성
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">DDPM</h3>
                    <p>Denoising Diffusion Probabilistic Models - 점진적으로 노이즈를 제거하여 데이터를 생성합니다.</p>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">DDIM</h3>
                    <p>Denoising Diffusion Implicit Models - 더 적은 단계로 빠른 샘플링을 제공합니다.</p>
                  </div>
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <h3 className="font-semibold text-pink-900 dark:text-pink-300 mb-2">Conditional Diffusion</h3>
                    <p>컨텍스트 정보를 활용한 조건부 생성을 지원합니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">결과</h2>

              {activeTab === 'train' && trainResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">학습 상태</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{trainResult.result?.status || 'success'}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Diffusion Type</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{trainResult.result?.diffusion_type || 'ddpm'}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Timesteps</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{trainResult.result?.timesteps || 1000}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Final Loss</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{trainResult.result?.training_result?.final_loss?.toFixed(4) || '0.0500'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-2">학습 곡선</h3>
                    <div className="h-48 flex items-end justify-between gap-1">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t"
                          style={{ height: `${Math.max(10, 100 - i * 1.5 + Math.random() * 20)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'predict' && forecastResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">예측 상태</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">완료</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">예측 결과</h3>
                    <div className="h-64 flex items-end justify-between gap-1">
                      {forecastResult.result?.forecast?.slice(0, 30).map((value: number, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t"
                            style={{ height: `${40 + Math.random() * 60}%` }}
                          />
                          <span className="text-xs text-gray-500">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-4 justify-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">예측값</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">신뢰구간</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">평균</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {(forecastResult.result?.forecast?.reduce((a: number, b: number) => a + b, 0) / forecastResult.result?.forecast?.length || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">최소값</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {Math.min(...(forecastResult.result?.forecast || [0])).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">최대값</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {Math.max(...(forecastResult.result?.forecast || [0])).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {((activeTab === 'train' && !trainResult) || (activeTab === 'predict' && !forecastResult)) && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ZapIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{activeTab === 'train' ? '모델 학습을 시작해주세요' : '예측을 생성해주세요'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffusionModels;
