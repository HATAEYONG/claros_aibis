/**
 * Neural Architecture Search Component
 * Phase 11: Automated Neural Network Architecture Design
 */

import React, { useState } from 'react';
import { BrainIcon, SettingsIcon, PlayIcon, ZapIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const NeuralArchitectureSearch: React.FC = () => {
  const [searching, setSearching] = useState(false);
  const [searchConfig, setSearchConfig] = useState({
    search_space: 'full' as 'minimal' | 'medium' | 'full',
    max_epochs: 50,
    population_size: 20,
    mutation_rate: 0.1,
    crossover_rate: 0.7
  });
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const result = await nextGenAIService.searchNAS(searchConfig);
      setSearchResult(result);
    } catch (error: any) {
      console.error('NAS search error:', error);
      alert(`NAS 검색 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
              <BrainIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Neural Architecture Search
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                자동화된 신경망 아키텍처 설계
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SettingsIcon size={20} className="text-green-600" />
                NAS 설정
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Space
                  </label>
                  <select
                    value={searchConfig.search_space}
                    onChange={(e) => setSearchConfig({ ...searchConfig, search_space: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="medium">Medium</option>
                    <option value="full">Full</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Epochs: {searchConfig.max_epochs}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={searchConfig.max_epochs}
                    onChange={(e) => setSearchConfig({ ...searchConfig, max_epochs: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Population Size: {searchConfig.population_size}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={searchConfig.population_size}
                    onChange={(e) => setSearchConfig({ ...searchConfig, population_size: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <ZapIcon size={20} />
                      아키텍처 검색 시작
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-300">Evolutionary NAS</h4>
                  <p className="text-gray-600 dark:text-gray-400">유전 알고리즘 기반 최적 아키텍처 탐색</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300">DARTS</h4>
                  <p className="text-gray-600 dark:text-gray-400">미분 가능한 아키텍처 검색</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300">ProxyNAS</h4>
                  <p className="text-gray-600 dark:text-gray-400">프록시 기반 빠른 평가</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">검색 결과</h2>

              {searchResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">검색 상태</p>
                      <p className="text-2xl font-bold text-green-600">{searchResult.result?.status}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">최고 점수</p>
                      <p className="text-2xl font-bold text-blue-600">{searchResult.result?.best_score?.toFixed(4)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">반복 횟수</p>
                      <p className="text-2xl font-bold text-purple-600">{searchResult.result?.search_iterations}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">레이어 수</p>
                      <p className="text-2xl font-bold text-orange-600">{searchResult.result?.best_architecture?.layers || 4}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">최적 아키텍처</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Layer Type</span>
                        <span className="font-mono font-bold text-green-600">{searchResult.result?.best_architecture?.layer_type || 'lstm'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Hidden Dim</span>
                        <span className="font-mono font-bold text-blue-600">{searchResult.result?.best_architecture?.hidden_dim || 128}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Activation</span>
                        <span className="font-mono font-bold text-purple-600">{searchResult.result?.best_architecture?.activation || 'gelu'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Dropout</span>
                        <span className="font-mono font-bold text-orange-600">{searchResult.result?.best_architecture?.dropout || 0.2}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">아키텍처 시각화</h3>
                    <div className="flex items-center justify-center gap-2 py-8">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <React.Fragment key={i}>
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                            LSTM
                          </div>
                          {i < 3 && <div className="text-2xl text-gray-400">→</div>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Input → Hidden Layers → Output
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BrainIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>아키텍처 검색을 시작해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralArchitectureSearch;
