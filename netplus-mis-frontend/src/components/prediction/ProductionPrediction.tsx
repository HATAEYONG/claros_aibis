import React, { useState, useEffect } from 'react';
import { FactoryIcon, ActivityIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import api from '@/services/api';

const ProductionPrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1w');

  useEffect(() => {
    fetchProductionPredictions();
  }, [selectedTimeRange]);

  const fetchProductionPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.predictions.getProductionPredictions();
      setPredictions(response.predictions || []);
      setHistoricalData(response.historical_data || []);
    } catch (err) {
      setError('생산 예측 데이터를 불러오는데 실패했습니다.');
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

  // Key production predictions to display
  const keyPredictions = [
    { kpi_name: '일일생산량예측', icon: '📦', color: '#3B82F6', unit: '개' },
    { kpi_name: '생산달성률예측', icon: '🎯', color: '#10B981', unit: '%' },
    { kpi_name: '불량률예측', icon: '⚠️', color: '#EF4444', unit: '%' },
    { kpi_name: 'OEE예측', icon: '⚙️', color: '#8B5CF6', unit: '%' },
    { kpi_name: '설비고장예측', icon: '🔧', color: '#F59E0B', unit: '확률' },
    { kpi_name: 'Cycle Time예측', icon: '⏱️', color: '#EC4899', unit: '초' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FactoryIcon size={32} />
          <h1 className="text-3xl font-bold">생산 예측</h1>
        </div>
        <p className="text-blue-100">AI 기반 생산량, 불량률, OEE, 설비 고장 등 생산 KPI 예측</p>
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
                    ? 'bg-blue-600 text-white shadow-md'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">주요 생산 예측</h2>
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

          {/* Production Quantity Chart */}
          {historicalData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">일일 생산량 추이 및 예측</h2>
                <span className="text-sm text-gray-500">최근 {historicalData.length}일 데이터</span>
              </div>
              <PredictionChart
                historicalData={historicalData}
                predictedValue={predictions.find(p => p.kpi_name.includes('일일생산량'))?.predicted_value || historicalData[historicalData.length - 1]?.production_quantity || 0}
                targetDate={predictions.find(p => p.kpi_name.includes('일일생산량'))?.target_date || new Date().toISOString().split('T')[0]}
                confidence={predictions.find(p => p.kpi_name.includes('일일생산량'))?.confidence || 0.8}
                height={300}
                color="#3B82F6"
              />
            </div>
          )}

          {/* Defect Rate & OEE Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defect Rate Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">불량률 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('불량률'))?.predicted_value || historicalData[historicalData.length - 1]?.defect_rate || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('불량률'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('불량률'))?.confidence || 0.8}
                  height={250}
                  color="#EF4444"
                />
              </div>
            )}

            {/* OEE Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">OEE 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('OEE'))?.predicted_value || historicalData[historicalData.length - 1]?.oee || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('OEE'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('OEE'))?.confidence || 0.8}
                  height={250}
                  color="#8B5CF6"
                />
              </div>
            )}
          </div>

          {/* Equipment Failure Probability */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">설비 고장 확률 예측</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Assembly'].map((line, idx) => {
                const failureProb = Math.random() * 30; // Mock data
                return (
                  <div key={line} className={`border-l-4 rounded-lg shadow-sm p-4 ${
                    failureProb > 20 ? 'border-red-500 bg-red-50' :
                    failureProb > 10 ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <h3 className="font-semibold text-gray-800 mb-2">{line}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-800">
                        {failureProb.toFixed(1)}%
                      </span>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        failureProb > 20 ? 'bg-red-200 text-red-800' :
                        failureProb > 10 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {failureProb > 20 ? '높음' : failureProb > 10 ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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

export default ProductionPrediction;
