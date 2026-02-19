import React, { useState, useEffect } from 'react';
import { CheckIcon, AlertIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import api from '@/services/api';

const QualityPrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1w');

  useEffect(() => {
    fetchQualityPredictions();
  }, [selectedTimeRange]);

  const fetchQualityPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.predictions.getQualityPredictions();
      setPredictions(response.predictions || []);
      setHistoricalData(response.historical_data || []);
    } catch (err) {
      setError('품질 예측 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1d', label: '1일' },
    { value: '1w', label: '1주' },
    { value: '1m', label: '1개월' },
    { value: '3m', label: '3개월' },
  ];

  // Key quality predictions to display
  const keyPredictions = [
    { kpi_name: '불량률예측', icon: '🔍', color: '#EF4444', unit: '%' },
    { kpi_name: 'Cpk예측', icon: '📊', color: '#3B82F6', unit: '' },
    { kpi_name: '불량유형예측', icon: '🔬', color: '#F59E0B', unit: '' },
    { kpi_name: '클레임발생예측', icon: '📢', color: '#EC4899', unit: '건' },
    { kpi_name: '검사시간예측', icon: '⏱️', color: '#8B5CF6', unit: '분' },
    { kpi_name: '품질비용예측', icon: '💰', color: '#10B981', unit: '만원' },
  ];

  // Mock quality anomalies
  const qualityAnomalies = [
    { id: 1, type: '치수 불량', severity: 'high', description: '라인 2에서 지름 치수 이상 detected', value: '2.5mm', expected: '2.0±0.1mm' },
    { id: 2, type: '외관 불량', severity: 'medium', description: '표면 스크래치 증가趋势', value: '3.2%', expected: '< 2.0%' },
    { id: 3, type: '공정 이상', severity: 'low', description: '온도 변동폭 증가', value: '±5°C', expected: '±2°C' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CheckIcon size={32} />
          <h1 className="text-3xl font-bold">품질 예측</h1>
        </div>
        <p className="text-purple-100">AI 기반 불량률, Cpk, 품질 이상 등 품질 KPI 예측</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">예측 기간:</span>
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTimeRange === range.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">예측 데이터를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Key Predictions Cards */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">주요 품질 예측</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keyPredictions.map((key) => {
                const prediction = predictions.find(p => p.kpi_name.includes(key.kpi_name.replace('예측', '')));
                return (
                  <div key={key.kpi_name} className="border-l-4 rounded-lg shadow-sm p-4" style={{ borderLeftColor: key.color }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{key.icon}</span>
                      <h3 className="font-semibold text-gray-800">{key.kpi_name}</h3>
                    </div>
                    {prediction ? (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-gray-800">
                          {prediction.predicted_value.toLocaleString('ko-KR', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 0
                          })}
                          <span className="text-sm text-gray-500 ml-1">{key.unit}</span>
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">신뢰도: </span>
                          <span className={`font-medium ${
                            prediction.confidence >= 0.8 ? 'text-green-600' :
                            prediction.confidence >= 0.5 ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {(prediction.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">데이터 없음</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Anomaly Alerts */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertIcon size={24} className="text-orange-500" />
              <h2 className="text-xl font-bold text-gray-800">품질 이상 감지 알림</h2>
            </div>
            <div className="space-y-3">
              {qualityAnomalies.map((anomaly) => (
                <div key={anomaly.id} className={`border-l-4 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{anomaly.type}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          anomaly.severity === 'high' ? 'bg-red-200' :
                          anomaly.severity === 'medium' ? 'bg-yellow-200' :
                          'bg-blue-200'
                        }`}>
                          심각도: {getSeverityLabel(anomaly.severity)}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{anomaly.description}</p>
                      <div className="mt-2 text-xs">
                        <span className="font-medium">현재값: </span>{anomaly.value}
                        <span className="mx-2">|</span>
                        <span className="font-medium">기대값: </span>{anomaly.expected}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defect Rate Chart */}
          {historicalData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">불량률 추이 및 예측</h2>
                <span className="text-sm text-gray-500">최근 {historicalData.length}일 데이터</span>
              </div>
              <PredictionChart
                historicalData={historicalData}
                predictedValue={predictions.find(p => p.kpi_name.includes('불량률'))?.predicted_value || historicalData[historicalData.length - 1]?.defect_rate || 0}
                targetDate={predictions.find(p => p.kpi_name.includes('불량률'))?.target_date || new Date().toISOString().split('T')[0]}
                confidence={predictions.find(p => p.kpi_name.includes('불량률'))?.confidence || 0.8}
                height={300}
                color="#EF4444"
              />
            </div>
          )}

          {/* Cpk & Inspection Time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cpk Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Cpk 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('Cpk'))?.predicted_value || historicalData[historicalData.length - 1]?.cpk || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('Cpk'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('Cpk'))?.confidence || 0.8}
                  height={250}
                  color="#3B82F6"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Cpk 해석:</span>
                    {' '}Cpk &ge; 1.33: 양호, 1.0 &le; Cpk &lt; 1.33: 보통, Cpk &lt; 1.0: 개선 필요
                  </p>
                </div>
              </div>
            )}

            {/* Inspection Time Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">검사 시간 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('검사시간'))?.predicted_value || historicalData[historicalData.length - 1]?.inspection_time || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('검사시간'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('검사시간'))?.confidence || 0.8}
                  height={250}
                  color="#8B5CF6"
                />
              </div>
            )}
          </div>

          {/* All Predictions Table */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">전체 예측 목록</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">KPI 코드</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">예측 항목</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">예측값</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">신뢰도</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">예측 기간</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">모델</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{prediction.kpi_code}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{prediction.kpi_name}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-gray-800">
                        {prediction.predicted_value.toLocaleString('ko-KR', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                          prediction.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-gray-600">{prediction.horizon}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-500">{prediction.model_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QualityPrediction;
