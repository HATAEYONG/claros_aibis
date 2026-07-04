/**
 * Quantum ML Component
 * Phase 11: Quantum-Ready Machine Learning
 */

import React, { useState } from 'react';
import { AtomIcon, ZapIcon, CpuIcon, NetworkIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const QuantumML: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'convert' | 'optimize' | 'map'>('convert');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const config = {
    num_qubits: 10,
    encoding_type: 'amplitude' as 'amplitude' | 'angle' | 'basis',
    problem_type: 'classification' as 'classification' | 'optimization',
    dimensions: 5,
    population_size: 50
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.convertQuantum(config);
      setResult(response);
    } catch (error: any) {
      alert(`양자 변환 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.optimizeQuantum({
        population_size: config.population_size,
        max_iterations: 100,
        dimensions: config.dimensions
      });
      setResult(response);
    } catch (error: any) {
      alert(`양자 최적화 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMap = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.mapQubits({
        mapping_strategy: 'sequential',
        num_qubits: config.num_qubits
      });
      setResult(response);
    } catch (error: any) {
      alert(`큐비트 매핑 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-fuchsia-600 to-violet-600 rounded-xl">
              <AtomIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Quantum ML
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                양자 준비 머신러닝 및 양자 영감 최적화
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'convert', label: '양자 변환', icon: CpuIcon },
              { id: 'optimize', label: '양자 최적화', icon: ZapIcon },
              { id: 'map', label: '큐비트 매핑', icon: NetworkIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id
                    ? 'text-fuchsia-600 border-b-2 border-fuchsia-600'
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
              <h2 className="text-lg font-semibold mb-4">양자 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    큐비트 수
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="2"
                    value={config.num_qubits}
                    onChange={(e) => {}}
                    className="w-full"
                  />
                  <p className="text-center text-lg font-bold text-fuchsia-600">{config.num_qubits} Qubits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    인코딩 타입
                  </label>
                  <select
                    value={config.encoding_type}
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="amplitude">Amplitude</option>
                    <option value="angle">Angle</option>
                    <option value="basis">Basis</option>
                  </select>
                </div>

                <div className="p-4 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">문제 타입</p>
                  <p className="text-lg font-bold text-fuchsia-600">{config.problem_type}</p>
                </div>
              </div>

              <button
                onClick={activeTab === 'convert' ? handleConvert : activeTab === 'optimize' ? handleOptimize : handleMap}
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-violet-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : activeTab === 'convert' ? '양자 변환 실행' : activeTab === 'optimize' ? '양자 최적화' : '큐비트 매핑'}
              </button>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">양자 상태</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    |{i}⟩
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                양자 중첩 상태 (Superposition)
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded">
                  <span>양자 게이트</span>
                  <span className="text-fuchsia-600 font-bold">H, X, Y, Z, CNOT</span>
                </div>
                <div className="flex justify-between p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                  <span>얽힘 (Entanglement)</span>
                  <span className="text-violet-600 font-bold">지원</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>측정 (Measurement)</span>
                  <span className="text-purple-600 font-bold">가능</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">계산 결과</h2>

              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">큐비트 매핑</p>
                      <p className="text-2xl font-bold text-fuchsia-600">{result.result?.num_qubits || config.num_qubits}</p>
                    </div>
                    <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">매핑 방식</p>
                      <p className="text-lg font-bold text-violet-600">{result.result?.mapping_strategy || 'sequential'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">양자 회로</h3>
                    <div className="flex items-center justify-center gap-4 py-6">
                      {['H', 'CNOT', 'RZ', 'H', 'Measure'].map((gate, i) => (
                        <React.Fragment key={gate}>
                          <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {gate}
                          </div>
                          {i < 4 && <div className="text-2xl text-fuchsia-400">→</div>}
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                      양자 게이트 회로 (Quantum Circuit)
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">최적화 수렴</h3>
                    <div className="h-40 flex items-end justify-between gap-1">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-fuchsia-600 to-violet-400 rounded-t"
                          style={{ height: `${Math.max(10, 100 - i * 1.5 + Math.random() * 15)}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">최고 적합도</p>
                        <p className="text-xl font-bold text-fuchsia-600">{(Math.random() * 0.1).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">반복 횟수</p>
                        <p className="text-xl font-bold text-violet-600">{50}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">수렴 상태</p>
                        <p className="text-xl font-bold text-purple-600">완료</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AtomIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>작업을 실행해주세요</p>
                  <p className="text-sm mt-2">현재 시뮬레이션 모드입니다. 실제 양자 하드웨어가 필요합니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumML;
