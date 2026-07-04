import React, { useState, useEffect } from 'react';
import { PackageIcon, AlertIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import predictionService from '@/services/predictionService';
import { useDataFreshness } from '@/utils/dataFreshness';
import DataFreshnessIndicator from '@/components/common/DataFreshnessIndicator';

// 샘플 데이터 (API 연동 전 데모용)
const SAMPLE_INVENTORY_PREDICTIONS: PredictionResult[] = [
  {
    kpi_code: 'INV_DEPLETION_DAYS',
    kpi_name: '재고소진일수예측',
    predicted_value: 15.5,
    confidence: 0.87,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'LSTM',
    feature_importance: { current_stock: 0.45, daily_usage: 0.35, lead_time: 0.20 }
  },
  {
    kpi_code: 'INV_SHORTAGE',
    kpi_name: '재고부족예측',
    predicted_value: 3,
    confidence: 0.92,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'RandomForest',
    feature_importance: { current_stock: 0.50, historical_shortage: 0.30, seasonality: 0.20 }
  },
  {
    kpi_code: 'INV_EXCESS',
    kpi_name: '과잉재고예측',
    predicted_value: 8,
    confidence: 0.78,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'XGBoost',
    feature_importance: { turnover_rate: 0.40, storage_cost: 0.35, demand_forecast: 0.25 }
  },
  {
    kpi_code: 'INV_TURNOVER_RATE',
    kpi_name: '재고회전율예측',
    predicted_value: 8.2,
    confidence: 0.85,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'LinearRegression',
    feature_importance: { cogs: 0.45, avg_inventory: 0.40, period: 0.15 }
  },
  {
    kpi_code: 'INV_INBOUND',
    kpi_name: '입고예측',
    predicted_value: 12500,
    confidence: 0.88,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'LSTM',
    feature_importance: { po_pending: 0.50, supplier_leadtime: 0.30, historical_inbound: 0.20 }
  },
  {
    kpi_code: 'INV_OUTBOUND',
    kpi_name: '출고예측',
    predicted_value: 11800,
    confidence: 0.90,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'LSTM',
    feature_importance: { sales_orders: 0.55, historical_outbound: 0.30, seasonality: 0.15 }
  }
];

const generateSampleHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      stock_level: 45000 + Math.random() * 5000 - 2500,
      turnover_rate: 7.5 + Math.random() * 1.5 - 0.75,
      depletion_days: 12 + Math.random() * 6 - 3,
      inbound_quantity: 1500 + Math.random() * 500 - 250,
      outbound_quantity: 1600 + Math.random() * 400 - 200
    });
  }
  return data;
};

const InventoryPrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1w');
  const [usingSampleData, setUsingSampleData] = useState(false);

  // 데이터 신선성 체크 (Stage 1 → 2 연결 확인)
  const { status: freshnessStatus, isStale, refresh: refreshData } = useDataFreshness('inventory_items', {
    enabled: true,
    max_age_hours: 8,
    warning_age_hours: 4,
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
          '3m': '3m'
        };

        // Stage 4: ML 예측 API (Stage 2/3 데이터 활용)
        const response = await predictionService.inventory.getPredictions({
          horizon: horizonMap[selectedTimeRange]
        });

        if (response?.predictions) {
          setPredictions(response.predictions);
        }

        if (response?.historical_data) {
          setHistoricalData(response.historical_data);
        }

      } catch (err) {
        console.warn('재고 예측 API 연동 실패, 샘플 데이터 사용:', err);
        // 샘플 데이터 사용 (백엔드 개발 전용 fallback)
        setPredictions(SAMPLE_INVENTORY_PREDICTIONS);
        setHistoricalData(generateSampleHistoricalData());
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
  ];

  // Key inventory predictions to display
  const keyPredictions = [
    { kpi_name: '재고소진일수예측', icon: '⏳', color: '#F59E0B', unit: '일' },
    { kpi_name: '재고부족예측', icon: '⚠️', color: '#EF4444', unit: '건' },
    { kpi_name: '과잉재고예측', icon: '📦', color: '#8B5CF6', unit: '건' },
    { kpi_name: '재고회전율예측', icon: '🔄', color: '#3B82F6', unit: '회/년' },
    { kpi_name: '입고예측', icon: '📥', color: '#10B981', unit: '개' },
    { kpi_name: '출고예측', icon: '📤', color: '#EC4899', unit: '개' },
  ];

  // Mock inventory alerts
  const inventoryAlerts = [
    { id: 1, type: '재고 부족', item: '원자재 A-001', severity: 'high', current: 150, safety: 500, message: '3일 내 소진 예상' },
    { id: 2, type: '과잉 재고', item: '완제품 Z-999', severity: 'medium', current: 5000, optimal: 2000, message: '회전율 저하' },
    { id: 3, type: '창고 공간 부족', item: '창고 #1', severity: 'medium', current: 85, capacity: 100, message: '85% 사용률' },
    { id: 4, type: '안전재고 도달', item: '부품 B-123', severity: 'low', current: 550, safety: 500, message: '안전재고 수준' },
  ];

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '긴급';
      case 'medium': return '주의';
      case 'low': return '안내';
      default: return '-';
    }
  };

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
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PackageIcon size={32} />
              <h1 className="text-3xl font-bold">재고 예측</h1>
              {usingSampleData && (
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full animate-pulse">
                  데모 데이터
                </span>
              )}
            </div>
            <p className="text-amber-100">AI 기반 재고 소진일수, 부족/과잉, 회전율 등 재고 KPI 예측</p>
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
                    ? 'bg-amber-600 text-white shadow-md'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">주요 재고 예측</h2>
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

          {/* Inventory Alerts */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertIcon size={24} className="text-orange-500" />
              <h2 className="text-xl font-bold text-gray-800">재고 알림</h2>
            </div>
            <div className="space-y-3">
              {inventoryAlerts.map((alert) => (
                <div key={alert.id} className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{alert.type}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">품목:</span> {alert.item}
                      </p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">
                        현재: <span className="font-semibold text-gray-800">{alert.current.toLocaleString()}</span>
                      </p>
                      {alert.safety && (
                        <p className="text-sm text-gray-500">
                          안전재고: <span className="font-semibold">{alert.safety.toLocaleString()}</span>
                        </p>
                      )}
                      {alert.optimal && (
                        <p className="text-sm text-gray-500">
                          최적: <span className="font-semibold">{alert.optimal.toLocaleString()}</span>
                        </p>
                      )}
                      {alert.capacity && (
                        <p className="text-sm text-gray-500">
                          용량: <span className="font-semibold">{alert.capacity}%</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Level Chart */}
          {historicalData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">재고 수준 추이 및 예측</h2>
                <span className="text-sm text-gray-500">최근 {historicalData.length}일 데이터</span>
              </div>
              <PredictionChart
                historicalData={historicalData}
                predictedValue={predictions.find(p => p.kpi_name.includes('재고'))?.predicted_value || historicalData[historicalData.length - 1]?.stock_level || 0}
                targetDate={predictions.find(p => p.kpi_name.includes('재고'))?.target_date || new Date().toISOString().split('T')[0]}
                confidence={predictions.find(p => p.kpi_name.includes('재고'))?.confidence || 0.8}
                height={300}
                color="#F59E0B"
              />
            </div>
          )}

          {/* Turnover Rate & Depletion Days Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Turnover Rate Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">재고 회전율 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('회전율'))?.predicted_value || historicalData[historicalData.length - 1]?.turnover_rate || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('회전율'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('회전율'))?.confidence || 0.8}
                  height={250}
                  color="#3B82F6"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">회전율 해석:</span>
                    {' '}높을수록 효율적, 업종 평균과 비교 필요
                  </p>
                </div>
              </div>
            )}

            {/* Depletion Days Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">재고 소진일수 예측</h2>
                <PredictionChart
                  historicalData={historicalData}
                  predictedValue={predictions.find(p => p.kpi_name.includes('소진일수'))?.predicted_value || historicalData[historicalData.length - 1]?.depletion_days || 0}
                  targetDate={predictions.find(p => p.kpi_name.includes('소진일수'))?.target_date || new Date().toISOString().split('T')[0]}
                  confidence={predictions.find(p => p.kpi_name.includes('소진일수'))?.confidence || 0.8}
                  height={250}
                  color="#8B5CF6"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">소진일수:</span>
                    {' '}현재 재고가 소진될 때까지의 예상 일수
                  </p>
                </div>
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

export default InventoryPrediction;
