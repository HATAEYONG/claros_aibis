import React, { useState, useEffect } from 'react';
import { ActivityIcon, TrendUpIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import predictionService from '@/services/predictionService';
import { useDataFreshness } from '@/utils/dataFreshness';
import DataFreshnessIndicator from '@/components/common/DataFreshnessIndicator';

// 샘플 데이터 (API 연동 전 데모용)
const SAMPLE_FINANCE_PREDICTIONS: PredictionResult[] = [
  {
    kpi_code: 'FIN_REVENUE',
    kpi_name: '매출액예측',
    predicted_value: 5250000000,
    confidence: 0.91,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'Prophet',
    feature_importance: { historical_revenue: 0.50, orders_pending: 0.30, seasonality: 0.20 }
  },
  {
    kpi_code: 'FIN_OPERATING_PROFIT',
    kpi_name: '영업이익예측',
    predicted_value: 680000000,
    confidence: 0.88,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'XGBoost',
    feature_importance: { revenue: 0.45, cogs: 0.30, operating_expenses: 0.25 }
  },
  {
    kpi_code: 'FIN_NET_INCOME',
    kpi_name: '당기순이익예측',
    predicted_value: 520000000,
    confidence: 0.85,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'LSTM',
    feature_importance: { operating_profit: 0.60, tax_rate: 0.25, non_operating: 0.15 }
  },
  {
    kpi_code: 'FIN_CASH_FLOW',
    kpi_name: '현금흐름예측',
    predicted_value: 380000000,
    confidence: 0.83,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'ARIMA',
    feature_importance: { operating_cash: 0.50, investing_cash: 0.25, financing_cash: 0.25 }
  },
  {
    kpi_code: 'FIN_ROE',
    kpi_name: 'ROE예측',
    predicted_value: 14.5,
    confidence: 0.79,
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '3m',
    model_used: 'LinearRegression',
    feature_importance: { net_income: 0.55, equity: 0.35, industry_avg: 0.10 }
  },
  {
    kpi_code: 'FIN_ROA',
    kpi_name: 'ROA예측',
    predicted_value: 8.2,
    confidence: 0.82,
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '3m',
    model_used: 'LinearRegression',
    feature_importance: { net_income: 0.60, assets: 0.30, industry_avg: 0.10 }
  }
];

const generateFinanceHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 90);

  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: 4800000000 + Math.random() * 800000000 - 400000000,
      operating_profit: 580000000 + Math.random() * 150000000 - 75000000,
      net_income: 450000000 + Math.random() * 120000000 - 60000000,
      cash_flow: 320000000 + Math.random() * 100000000 - 50000000
    });
  }
  return data;
};

const FinancePrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1m');
  const [usingSampleData, setUsingSampleData] = useState(false);

  // 데이터 신선성 체크 (Stage 1 → 2 연결 확인)
  const { status: freshnessStatus, isStale, refresh: refreshData } = useDataFreshness('journal_entries', {
    enabled: true,
    max_age_hours: 72,
    warning_age_hours: 48,
  });

  // 데이터 파이프라인 Stage 2 → 3 → 4: 실제 예측 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const horizonMap: Record<TimeRange, string> = {
          '1d': '1d',
          '1w': '1w',
          '1m': '1m',
          '3m': '3m',
          '1y': '1y'
        };

        // Stage 4: ML 예측 API (Stage 2/3 데이터 활용)
        const response = await predictionService.finance.getPredictions({
          horizon: horizonMap[selectedTimeRange]
        });

        if (response?.predictions) {
          setPredictions(response.predictions);
        }

        if (response?.historical_data) {
          setHistoricalData(response.historical_data);
        }

      } catch (err) {
        console.warn('재무 예측 API 연동 실패, 샘플 데이터 사용:', err);
        // 샘플 데이터 사용 (백엔드 개발 전용 fallback)
        setPredictions(SAMPLE_FINANCE_PREDICTIONS);
        setHistoricalData(generateFinanceHistoricalData());
        setUsingSampleData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      {/* 데이터 신선성 배너 (Stage 1 → 2 확인) */}
      {isStale && (
        <DataFreshnessIndicator
          status={freshnessStatus}
          position="banner"
          onRefresh={refreshData}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ActivityIcon size={32} />
              <h1 className="text-3xl font-bold">매출/재무 예측</h1>
              {usingSampleData && (
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full animate-pulse">
                  데모 데이터
                </span>
              )}
            </div>
            <p className="text-emerald-100">AI 기반 매출액, 영업이익, 순이익 등 재무 KPI 예측</p>
          </div>
          {/* 데이터 신선성 표시 (Stage 1 → Stage 2 연결) */}
          <DataFreshnessIndicator
            status={freshnessStatus}
            onRefresh={refreshData}
          />
        </div>
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
