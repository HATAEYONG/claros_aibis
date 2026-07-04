/**
 * Multimodal Prediction Dashboard Component
 * Phase 6: Multimodal Prediction
 *
 * Features:
 * - Multimodal Forecaster (Numerical + Unstructured data)
 * - Modality Encoders (Text, Image, Audio, Video)
 * - Cross-Modal Learning
 * - Fusion methods (Attention, Concat, Weighted)
 */

import React, { useState } from 'react';
import {
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  FileIcon,
  MonitorIcon,
  ActivityIcon
} from '@/components/icons/Icons';
import { multimodalService } from '@/services/multimodalService';

const MultimodalPredictionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'encoders' | 'fusion'>('forecast');
  const [loading, setLoading] = useState(false);

  const [forecastConfig, setForecastConfig] = useState({
    model_id: '',
    horizon: 30,
    fusion_method: 'attention' as 'attention' | 'concat' | 'weighted',
    modalities: [] as string[]
  });

  const [encoderConfig, setEncoderConfig] = useState({
    text_encoder: 'bert' as 'bert' | 'roberta',
    image_encoder: 'resnet' as 'resnet' | 'vit',
    audio_encoder: 'whisper' as 'whisper' | 'wav2vec',
    video_encoder: 'resnet_temporal' as 'resnet_temporal' | 'video_transformer'
  });

  const [forecastResult, setForecastResult] = useState<any>(null);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const result = await multimodalService.forecastMultimodal(forecastConfig);
      setForecastResult(result);
    } catch (error: any) {
      console.error('Multimodal forecast error:', error);
      alert(`멀티모달 예측 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl">
            <FileIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">멀티모달 예측</h1>
            <p className="text-gray-600 dark:text-gray-400">텍스트, 이미지, 오디오, 비디오 통합 예측</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'forecast', label: '멀티모달 예측', icon: ActivityIcon },
              { id: 'encoders', label: '모달리티 인코더', icon: BarChartIcon },
              { id: 'fusion', label: '융합 방법', icon: ZapIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-600'
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
                <h3 className="text-lg font-semibold mb-4">멀티모달 예측 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">모델 ID</label>
                    <input
                      type="text"
                      value={forecastConfig.model_id}
                      onChange={(e) => setForecastConfig({ ...forecastConfig, model_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">융합 방법</label>
                    <select
                      value={forecastConfig.fusion_method}
                      onChange={(e) => setForecastConfig({ ...forecastConfig, fusion_method: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="attention">Attention Fusion</option>
                      <option value="concat">Concatenation</option>
                      <option value="weighted">Weighted Fusion</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm mb-2">사용할 모달리티</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'text', label: '텍스트', icon: FileIcon },
                      { key: 'image', label: '이미지', icon: FileIcon },
                      { key: 'audio', label: '오디오', icon: MonitorIcon },
                      { key: 'video', label: '비디오', icon: MonitorIcon }
                    ].map((modality) => (
                      <label key={modality.key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={forecastConfig.modalities.includes(modality.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForecastConfig({ ...forecastConfig, modalities: [...forecastConfig.modalities, modality.key] });
                            } else {
                              setForecastConfig({ ...forecastConfig, modalities: forecastConfig.modalities.filter(m => m !== modality.key) });
                            }
                          }}
                          className="w-4 h-4 text-pink-600 rounded"
                        />
                        <modality.icon size={16} />
                        <span className="text-sm">{modality.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleForecast}
                  disabled={loading || forecastConfig.modalities.length === 0}
                  className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400"
                >
                  {loading ? '예측 중...' : '멀티모달 예측'}
                </button>

                {forecastResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">MAPE: <span className="font-bold">{forecastResult.mape?.toFixed(2)}%</span></p>
                    <p className="text-sm">융합 이득: <span className="font-bold text-green-600">+{forecastResult.fusion_gain?.toFixed(1)}%</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'encoders' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">모달리티 인코더 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'text_encoder', label: '텍스트 인코더', options: ['bert', 'roberta'] },
                    { key: 'image_encoder', label: '이미지 인코더', options: ['resnet', 'vit'] },
                    { key: 'audio_encoder', label: '오디오 인코더', options: ['whisper', 'wav2vec'] },
                    { key: 'video_encoder', label: '비디오 인코더', options: ['resnet_temporal', 'video_transformer'] }
                  ].map((encoder) => (
                    <div key={encoder.key}>
                      <label className="block text-sm mb-1">{encoder.label}</label>
                      <select
                        value={encoderConfig[encoder.key as keyof typeof encoderConfig]}
                        onChange={(e) => setEncoderConfig({ ...encoderConfig, [encoder.key]: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      >
                        {encoder.options.map((opt) => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'fusion' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">융합 방법</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Attention Fusion</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      교차 모달리티 attention 메커니즘으로 가중치 자동 학습
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Concatenation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      모든 모달리티를 연결하여 단일 표현 생성
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Weighted Fusion</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      학습 가능한 가중치로 모달리티 결합
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

export default MultimodalPredictionDashboard;
