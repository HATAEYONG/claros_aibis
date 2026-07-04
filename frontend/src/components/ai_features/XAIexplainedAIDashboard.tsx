/**
 * XAI (Explainable AI) Dashboard Component
 * Phase 3: XAI (Explainable AI)
 *
 * Features:
 * - SHAP Explainer (Global & Local explanations)
 * - Attention Visualizer
 * - XAI Report Generator
 * - Variable Importance Analysis
 * - Summary plots, waterfall plots, dependence plots
 */

import React, { useState } from 'react';
import {
  SettingsIcon,
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  EyeIcon,
  FileIcon,
  ActivityIcon,
  TrendUpIcon
} from '@/components/icons/Icons';
import xaiService from '@/services/xaiService';

const XAIexplainedAIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shap' | 'attention' | 'report' | 'importance'>('shap');
  const [loading, setLoading] = useState(false);

  // SHAP configuration
  const [shapConfig, setShapConfig] = useState({
    model_id: '',
    explanation_type: 'global' as 'global' | 'local',
    plot_type: 'summary' as 'summary' | 'waterfall' | 'dependence' | 'force',
    background_size: 100
  });

  // Attention config
  const [attentionConfig, setAttentionConfig] = useState({
    model_id: '',
    layer_index: -1,
    head_index: 0
  });

  // Results state
  const [shapResult, setShapResult] = useState<any>(null);
  const [attentionResult, setAttentionResult] = useState<any>(null);
  const [importanceResult, setImportanceResult] = useState<any>(null);

  const handleGenerateSHAP = async () => {
    setLoading(true);
    try {
      const result = await xaiService.generateSHAP(shapConfig);
      setShapResult(result);
    } catch (error: any) {
      console.error('SHAP generation error:', error);
      alert(`SHAP 생성 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizeAttention = async () => {
    setLoading(true);
    try {
      const result = await xaiService.visualizeAttention(attentionConfig);
      setAttentionResult(result);
    } catch (error: any) {
      console.error('Attention visualization error:', error);
      alert(`Attention 시각화 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await xaiService.generateXAIReport({
        model_id: shapConfig.model_id,
        include_shap: true,
        include_attention: true,
        include_importance: true
      });
      alert(`리포트 생성 완료: ${result.report_url}`);
    } catch (error: any) {
      console.error('Report generation error:', error);
      alert(`리포트 생성 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateImportance = async () => {
    setLoading(true);
    try {
      const result = await xaiService.calculateVariableImportance({
        model_id: shapConfig.model_id,
        method: 'permutation'
      });
      setImportanceResult(result);
    } catch (error: any) {
      console.error('Importance calculation error:', error);
      alert(`중요도 계산 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl">
              <EyeIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                XAI (Explainable AI)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI 모델 설명 가능성 및 투명성 확보
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">설명 가능 모델</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                </div>
                <EyeIcon size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SHAP 분석</p>
                  <p className="text-2xl font-bold text-green-600">
                    {shapResult ? '완료' : '-'}
                  </p>
                </div>
                <BarChartIcon size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">주요 변수</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {importanceResult?.num_variables || '-'}
                  </p>
                </div>
                <ActivityIcon size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">생성 리포트</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                </div>
                <FileIcon size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'shap', label: 'SHAP 분석', icon: BarChartIcon },
              { id: 'attention', label: 'Attention 시각화', icon: EyeIcon },
              { id: 'importance', label: '변수 중요도', icon: ActivityIcon },
              { id: 'report', label: 'XAI 리포트', icon: FileIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* SHAP Tab */}
            {activeTab === 'shap' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SHAP (SHapley Additive exPlanations)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      모델 ID
                    </label>
                    <input
                      type="text"
                      value={shapConfig.model_id}
                      onChange={(e) => setShapConfig({ ...shapConfig, model_id: e.target.value })}
                      placeholder="model_id"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      설명 유형
                    </label>
                    <select
                      value={shapConfig.explanation_type}
                      onChange={(e) => setShapConfig({ ...shapConfig, explanation_type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="global">Global (전체 데이터)</option>
                      <option value="local">Local (개별 예측)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      플롯 유형
                    </label>
                    <select
                      value={shapConfig.plot_type}
                      onChange={(e) => setShapConfig({ ...shapConfig, plot_type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="summary">Summary Plot</option>
                      <option value="waterfall">Waterfall Plot</option>
                      <option value="dependence">Dependence Plot</option>
                      <option value="force">Force Plot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Background Size
                    </label>
                    <input
                      type="number"
                      value={shapConfig.background_size}
                      onChange={(e) => setShapConfig({ ...shapConfig, background_size: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateSHAP}
                  disabled={loading || !shapConfig.model_id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <BarChartIcon size={20} />
                  {loading ? '생성 중...' : 'SHAP 생성'}
                </button>

                {shapResult && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">SHAP 결과</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">상위 변수:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{shapResult.top_features?.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">평균 절대 SHAP 값:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{shapResult.mean_abs_shap?.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attention Tab */}
            {activeTab === 'attention' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attention 가중치 시각화</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      모델 ID
                    </label>
                    <input
                      type="text"
                      value={attentionConfig.model_id}
                      onChange={(e) => setAttentionConfig({ ...attentionConfig, model_id: e.target.value })}
                      placeholder="model_id"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      레이어 인덱스
                    </label>
                    <input
                      type="number"
                      value={attentionConfig.layer_index}
                      onChange={(e) => setAttentionConfig({ ...attentionConfig, layer_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      헤드 인덱스
                    </label>
                    <input
                      type="number"
                      value={attentionConfig.head_index}
                      onChange={(e) => setAttentionConfig({ ...attentionConfig, head_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleVisualizeAttention}
                  disabled={loading || !attentionConfig.model_id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <EyeIcon size={20} />
                  {loading ? '시각화 중...' : 'Attention 시각화'}
                </button>

                {attentionResult && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Attention 결과</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Attention 맵이 생성되었습니다. 최대 attention 가중치: <span className="font-bold text-gray-900 dark:text-white">{attentionResult.max_attention?.toFixed(4)}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Importance Tab */}
            {activeTab === 'importance' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">변수 중요도 분석</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  순열 특성 중요도(Permutation Feature Importance)를 계산합니다.
                </p>
                <button
                  onClick={handleCalculateImportance}
                  disabled={loading || !shapConfig.model_id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <ActivityIcon size={20} />
                  {loading ? '계산 중...' : '중요도 계산'}
                </button>

                {importanceResult && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">변수 중요도 순위</h4>
                    <div className="space-y-2">
                      {importanceResult.importances?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-green-600 text-white rounded-full text-sm font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.feature}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${item.importance * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                              {item.importance.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Tab */}
            {activeTab === 'report' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">XAI 리포트 생성</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  모델의 설명 가능성에 대한 종합 리포트를 생성합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-gray-900 dark:text-white">SHAP 분석 포함</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-gray-900 dark:text-white">Attention 시각화 포함</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-gray-900 dark:text-white">변수 중요도 포함</span>
                  </label>
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={loading || !shapConfig.model_id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <FileIcon size={20} />
                  {loading ? '생성 중...' : '리포트 생성'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ZapIcon size={24} className="text-green-600" />
            XAI 기능
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">SHAP Explainer</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Global/Local 예측 설명</li>
                <li>• Summary, Waterfall, Dependence 플롯</li>
                <li>• 특성 기여도 분석</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attention 시각화</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Transformer attention 가중치</li>
                <li>• 레이어/헤드별 시각화</li>
                <li>• 의사결정 프로세 투명화</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">변수 중요도</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 순열 특성 중요도 계산</li>
                <li>• 순위별 변수 영향력</li>
                <li>• 모델 해석 용이성</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">XAI 리포트</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 종합 설명 리포트</li>
                <li>• 자동 문서화</li>
                <li>• 규정 준수 지원</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XAIexplainedAIDashboard;
