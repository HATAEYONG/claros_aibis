/**
 * LLM Integration Dashboard Component
 * Phase 4: LLM Integration & Model Optimization
 *
 * Features:
 * - LLM Forecaster (TimeGPT, Chronos, GPT-4T)
 * - Model Optimizer (Quantization, Pruning, Distillation)
 * - Automatic prompt generation
 * - External context integration
 */

import React, { useState } from 'react';
import {
  SettingsIcon,
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  BrainIcon,
  CpuIcon,
  ActivityIcon
} from '@/components/icons/Icons';
import { llmForecastService } from '@/services/llmForecastService';
import { modelOptimizationService } from '@/services/modelOptimizationService';

const LLMIntegrationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'optimize' | 'prompt'>('forecast');
  const [loading, setLoading] = useState(false);

  // LLM Forecast config
  const [forecastConfig, setForecastConfig] = useState({
    model: 'timegpt' as 'timegpt' | 'chronos' | 'gpt4t',
    horizon: 30,
    context_length: 64,
    use_external_context: true,
    finetune: false
  });

  // Optimization config
  const [optimizeConfig, setOptimizeConfig] = useState({
    model_id: '',
    optimization_type: 'quantization' as 'quantization' | 'pruning' | 'distillation',
    quantization_type: 'int8' as 'int8' | 'uint8' | 'fp16',
    pruning_ratio: 0.3,
    distillation_teacher: ''
  });

  // Results
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const result = await llmForecastService.forecastWithLLM(forecastConfig);
      setForecastResult(result);
    } catch (error: any) {
      console.error('LLM forecast error:', error);
      alert(`LLM 예측 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const result = await modelOptimizationService.optimizeModel(optimizeConfig);
      setOptimizeResult(result);
    } catch (error: any) {
      console.error('Optimization error:', error);
      alert(`모델 최적화 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl">
            <BrainIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LLM 통합 & 모델 최적화</h1>
            <p className="text-gray-600 dark:text-gray-400">대규모 언어모델 기반 예측 및 모델 최적화</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'forecast', label: 'LLM 예측', icon: ActivityIcon },
              { id: 'optimize', label: '모델 최적화', icon: CpuIcon },
              { id: 'prompt', label: '프롬프트 관리', icon: BarChartIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-600'
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
                <h3 className="text-lg font-semibold mb-4">LLM 기반 시계열 예측</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">LLM 모델</label>
                    <select
                      value={forecastConfig.model}
                      onChange={(e) => setForecastConfig({ ...forecastConfig, model: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="timegpt">TimeGPT</option>
                      <option value="chronos">Chronos (Amazon)</option>
                      <option value="gpt4t">GPT-4 Turbo</option>
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
                  className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400"
                >
                  {loading ? '예측 중...' : 'LLM 예측 실행'}
                </button>

                {forecastResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">MAPE: <span className="font-bold">{forecastResult.mape?.toFixed(2)}%</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'optimize' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">모델 최적화</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">최적화 유형</label>
                    <select
                      value={optimizeConfig.optimization_type}
                      onChange={(e) => setOptimizeConfig({ ...optimizeConfig, optimization_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="quantization">양자화 (Quantization)</option>
                      <option value="pruning">프루닝 (Pruning)</option>
                      <option value="distillation">증류 (Distillation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">양자화 타입</label>
                    <select
                      value={optimizeConfig.quantization_type}
                      onChange={(e) => setOptimizeConfig({ ...optimizeConfig, quantization_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="int8">INT8 (50% 크기 감소)</option>
                      <option value="uint8">UINT8</option>
                      <option value="fp16">FP16</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleOptimize}
                  disabled={loading}
                  className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400"
                >
                  {loading ? '최적화 중...' : '모델 최적화'}
                </button>

                {optimizeResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">크기 감소: <span className="font-bold">{optimizeResult.size_reduction?.toFixed(1)}%</span></p>
                    <p className="text-sm">속도 향상: <span className="font-bold">{optimizeResult.speed_improvement?.toFixed(1)}x</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prompt' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">자동 프롬프트 생성</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  LLM을 위한 최적의 프롬프트를 자동으로 생성하고 관리합니다.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm">프롬프트 템플릿 관리 기능이 준비 중입니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMIntegrationDashboard;
