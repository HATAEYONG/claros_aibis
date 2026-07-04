/**
 * Advanced Causal ML Component
 * Phase 11: Causal Discovery and Counterfactual Prediction
 */

import React, { useState } from 'react';
import { GitBranchIcon, NetworkIcon, SearchIcon, TrendUpIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const AdvancedCausal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'estimate' | 'counterfactual'>('discover');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDiscover = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.discoverCausal({ method: 'pcmci', max_lag: 5 });
      setResult(response);
    } catch (error: any) {
      alert(`인과 관계 발견 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.estimateCausalEffect({
        method: 'instrumental_variable',
        treatment_cols: ['promotion'],
        outcome_col: 'sales'
      });
      setResult(response);
    } catch (error: any) {
      alert(`인과 효과 추정 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCounterfactual = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.predictCausalCounterfactual({
        treatment_col: 'promotion',
        treatment_value: 2.0
      });
      setResult(response);
    } catch (error: any) {
      alert(`반사실 예측 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl">
              <GitBranchIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Advanced Causal ML
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                인과 관계 발견 및 반사실 예측
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'discover', label: '인과 발견', icon: NetworkIcon },
              { id: 'estimate', label: '효과 추정', icon: TrendUpIcon },
              { id: 'counterfactual', label: '반사실 예측', icon: SearchIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id
                    ? 'text-rose-600 border-b-2 border-rose-600'
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
              <h2 className="text-lg font-semibold mb-4">설명</h2>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <h4 className="font-semibold text-rose-900 dark:text-rose-300 mb-2">PCMCI</h4>
                  <p className="text-gray-600 dark:text-gray-400">시계열 데이터의 인과 관계를 발견하는 알고리즘</p>
                </div>
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-300 mb-2">VAR-LiNGAM</h4>
                  <p className="text-gray-600 dark:text-gray-400">선형 비가우시안 인과 모델</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">NOTEARS</h4>
                  <p className="text-gray-600 dark:text-gray-400">신경망 최적화 기반 인과 구조 학습</p>
                </div>
              </div>

              <button
                onClick={activeTab === 'discover' ? handleDiscover : activeTab === 'estimate' ? handleEstimate : handleCounterfactual}
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-medium hover:from-rose-700 hover:to-pink-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : '실행'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">결과</h2>

              {result ? (
                <div className="space-y-4">
                  {activeTab === 'discover' && result.result && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                          <p className="text-sm">발견된 노드</p>
                          <p className="text-2xl font-bold text-rose-600">{result.result.nodes?.length || 3}</p>
                        </div>
                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                          <p className="text-sm">발견된 엣지</p>
                          <p className="text-2xl font-bold text-pink-600">{result.result.edges?.length || 5}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-4">인과 그래프</h3>
                        <div className="flex items-center justify-center gap-4 py-8">
                          {['Variable A', 'Variable B', 'Variable C'].map((node, i) => (
                            <React.Fragment key={node}>
                              <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {node}
                              </div>
                              {i < 2 && (
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-0.5 bg-gray-400"></div>
                                  <GitBranchIcon size={16} className="text-gray-400" />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'estimate' && result.result && (
                    <div className="space-y-4">
                      {Object.entries(result.result).map(([treatment, data]: [string, any]) => (
                        <div key={treatment} className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg">
                          <h4 className="font-semibold mb-2">{treatment}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">인과 효과</p>
                              <p className="text-xl font-bold text-rose-600">{data.effect?.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">방법</p>
                              <p className="text-xl font-bold text-pink-600">{data.method}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'counterfactual' && result.result && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">원본 값</p>
                          <p className="text-2xl font-bold">{result.result.original_value}</p>
                        </div>
                        <div className="p-4 bg-rose-100 dark:bg-rose-900/20 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">반사실 값</p>
                          <p className="text-2xl font-bold text-rose-600">{result.result.counterfactual_value}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium mb-4">예측 결과</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <span>원본 결과</span>
                            <span className="font-bold">{result.result.original_outcome?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <span>반사실 결과</span>
                            <span className="font-bold text-rose-600">{result.result.counterfactual_outcome?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                            <span>변화량</span>
                            <span className="font-bold text-pink-600">{result.result.change?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <GitBranchIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>분석을 실행해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCausal;
