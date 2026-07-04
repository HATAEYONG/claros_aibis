/**
 * Edge AI Component
 * Phase 11: Edge Optimization and TinyML Deployment
 */

import React, { useState } from 'react';
import { CpuIcon, ZapIcon, DownloadIcon, MemoryIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const EdgeAI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'optimize' | 'compile' | 'quantize' | 'deploy'>('optimize');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const config = {
    target_device: 'microcontroller' as 'microcontroller' | 'mobile' | 'iot',
    max_memory_kb: 256,
    max_flash_kb: 512,
    quantization_type: 'int8' as 'int8' | 'uint8' | 'float16',
    target_framework: 'tflite' as 'tflite' | 'onnx' | 'c'
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.optimizeEdge({
        target_device: config.target_device,
        max_memory_kb: config.max_memory_kb,
        max_flash_kb: config.max_flash_kb,
        model_config: { layers: [{ type: 'lstm', units: 64 }, { type: 'dense', units: 32 }] }
      });
      setResult(response);
    } catch (error: any) {
      alert(`최적화 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.compileEdge({
        target_framework: config.target_framework,
        model_config: { layers: [{ type: 'lstm', units: 64 }] }
      });
      setResult(response);
    } catch (error: any) {
      alert(`컴파일 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantize = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.quantizeModel({
        quantization_type: config.quantization_type,
        model_config: { layers: [{ type: 'lstm', units: 64 }] }
      });
      setResult(response);
    } catch (error: any) {
      alert(`양자화 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.deployEdge({
        device_type: 'arduino',
        device_id: 'device_001',
        model_config: { layers: [{ type: 'lstm', units: 64 }] }
      });
      setResult(response);
    } catch (error: any) {
      alert(`배포 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl">
              <CpuIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edge AI & TinyML
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                엣지 디바이스 모델 최적화 및 배포
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'optimize', label: '최적화', icon: ZapIcon },
              { id: 'compile', label: '컴파일', icon: CpuIcon },
              { id: 'quantize', label: '양자화', icon: MemoryIcon },
              { id: 'deploy', label: '배포', icon: DownloadIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id
                    ? 'text-amber-600 border-b-2 border-amber-600'
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
              <h2 className="text-lg font-semibold mb-4">장치 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    타겟 디바이스
                  </label>
                  <select
                    value={config.target_device}
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="microcontroller">Microcontroller</option>
                    <option value="mobile">Mobile</option>
                    <option value="iot">IoT Device</option>
                  </select>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">최대 메모리</p>
                  <p className="text-2xl font-bold text-amber-600">{config.max_memory_kb} KB</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">최대 플래시</p>
                  <p className="text-2xl font-bold text-orange-600">{config.max_flash_kb} KB</p>
                </div>
              </div>

              <button
                onClick={activeTab === 'optimize' ? handleOptimize : activeTab === 'compile' ? handleCompile : activeTab === 'quantize' ? handleQuantize : handleDeploy}
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : activeTab === 'optimize' ? '모델 최적화' : activeTab === 'compile' ? '엣지용 컴파일' : activeTab === 'quantize' ? '모델 양자화' : '디바이스 배포'}
              </button>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">지원 디바이스</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span>Arduino</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span>ESP32</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span>Raspberry Pi</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span>STM32</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">{activeTab === 'optimize' ? '최적화 결과' : activeTab === 'compile' ? '컴파일 결과' : activeTab === 'quantize' ? '양자화 결과' : '배포 결과'}</h2>

              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                      <p className="text-2xl font-bold text-green-600">Success</p>
                    </div>
                    {result.result?.estimated_size_kb && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">모델 크기</p>
                        <p className="text-2xl font-bold text-blue-600">{result.result.estimated_size_kb} KB</p>
                      </div>
                    )}
                    {result.result?.size_bytes && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">사이즈</p>
                        <p className="text-2xl font-bold text-purple-600">{(result.result.size_bytes / 1024).toFixed(1)} KB</p>
                      </div>
                    )}
                    {result.result?.meets_constraints !== undefined && (
                      <div className={`p-4 rounded-lg ${result.result.meets_constraints ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className="text-sm text-gray-600 dark:text-gray-400">제약 조건</p>
                        <p className="text-2xl font-bold">{result.result.meets_constraints ? '충족' : '미충족'}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">메모리 사용량</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Flash</span>
                          <span>{result.result?.estimated_size_kb || 120} / {config.max_flash_kb} KB</span>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-amber-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>RAM</span>
                          <span>{result.result?.estimated_memory_kb || 80} / {config.max_memory_kb} KB</span>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '31%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">최적화 단계</h3>
                    <div className="space-y-2">
                      {['양자화 (INT8)', '레이어 융합', '연산 최적화', '압축', '엣지용 컴파일'].map((step, i) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${i < 3 ? 'bg-green-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            {i < 3 ? '✓' : i + 1}
                          </div>
                          <span className={i < 3 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CpuIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>작업을 실행해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdgeAI;
