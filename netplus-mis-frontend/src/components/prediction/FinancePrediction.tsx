import React, { useState, useEffect } from 'react';
import { ActivityIcon, TrendUpIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import api from '@/services/api';

const FinancePrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1m');

  // 더미 데이터
  const DUMMY_PREDICTIONS: PredictionResult[] = [
    { kpi_code: 'FIN_001', kpi_name: '매출액예측', predicted_value: 15600000000, confidence: 0.92, horizon: '1개월', model_used: 'LSTM', target_date: '2026-03-22' },
    { kpi_code: 'FIN_002', kpi_name: '영업이익예측', predicted_value: 1250000000, confidence: 0.88, horizon: '1개월', model_used: 'LSTM', target_date: '2026-03-22' },
    { kpi_code: 'FIN_003', kpi_name: '당기순이익예측', predicted_value: 980000000, confidence: 0.85, horizon: '1개월', model_used: 'Random Forest', target_date: '2026-03-22' },
    { kpi_code: 'FIN_004', kpi_name: '현금흐름예측', predicted_value: 2100000000, confidence: 0.90, horizon: '1개월', model_used: 'XGBoost', target_date: '2026-03-22' },
    { kpi_code: 'FIN_005', kpi_name: 'ROE예측', predicted_value: 12.5, confidence: 0.82, horizon: '1개월', model_used: 'Linear Regression', target_date: '2026-03-22' },
    { kpi_code: 'FIN_006', kpi_name: 'ROA예측', predicted_value: 8.2, confidence: 0.80, horizon: '1개월', model_used: 'Linear Regression', target_date: '2026-03-22' },
  ];

  const DUMMY_HISTORICAL_DATA: HistoricalDataPoint[] = [
    { date: '2026-01-22', revenue: 14200000000, operating_profit: 1120000000 },
    { date: '2026-02-05', revenue: 14500000000, operating_profit: 1150000000 },
    { date: '2026-02-12', revenue: 14800000000, operating_profit: 1180000000 },
    { date: '2026-02-19', revenue: 15000000000, operating_profit: 1200000000 },
    { date: '2026-02-22', revenue: 15200000000, operating_profit: 1230000000 },
  ];

  useEffect(() => {
    setLoading(true);
    // 더미 데이터로 설정
    setTimeout(() => {
      setPredictions(DUMMY_PREDICTIONS);
      setHistoricalData(DUMMY_HISTORICAL_DATA);
      setLoading(false);
    }, 500);
  }, [selectedTimeRange]);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1d', label: '1일' },
    { value: '1w', label: '1주' },
    { value: '1m', label: '1개월' },
    { value: '3m', label: '3개월' },
    { value: '1y', label: '1년' },
  ];

  // Key financial predictions to display
  const keyPredictions = [
    { kpi_name: '매출액예측', icon: '💰', color: '#10B981' },
    { kpi_name: '영업이익예측', icon: '📈', color: '#3B82F6' },
    { kpi_name: '당기순이익예측', icon: '💎', color: '#8B5CF6' },
    { kpi_name: '현금흐름예측', icon: '💵', color: '#F59E0B' },
    { kpi_name: 'ROE예측', icon: '🎯', color: '#EF4444' },
    { kpi_name: 'ROA예측', icon: '🎯', color: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">매출/재무 예측</h1>
        </div>
        <p className="text-emerald-100">AI 기반 매출액, 영업이익, 순이익 등 재무 KPI 예측</p>
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
                    ? 'bg-emerald-600 text-white shadow-md'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">주요 재무 예측</h2>
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
                          {prediction.predicted_value.toLocaleString('ko-KR')}
                          <span className="text-sm text-gray-500 ml-1">
                            {prediction.kpi_code.includes('RATE') || prediction.kpi_code.includes('RO') ? '%' : '원'}
                          </span>
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

          {/* Revenue Prediction Chart */}
          {historicalData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">매출액 추이 및 예측</h2>
                <span className="text-sm text-gray-500">최근 {historicalData.length}일 데이터</span>
              </div>
              <PredictionChart
                historicalData={historicalData}
                predictedValue={predictions.find(p => p.kpi_name.includes('매출액'))?.predicted_value || historicalData[historicalData.length - 1]?.revenue || 0}
                targetDate={predictions.find(p => p.kpi_name.includes('매출액'))?.target_date || new Date().toISOString().split('T')[0]}
                confidence={predictions.find(p => p.kpi_name.includes('매출액'))?.confidence || 0.8}
                height={300}
                color="#10B981"
              />
            </div>
          )}

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

export default FinancePrediction;
