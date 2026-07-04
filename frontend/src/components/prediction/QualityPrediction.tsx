import React, { useState, useEffect } from 'react';
import { CheckIcon, AlertIcon } from '@/components/icons/Icons';
import PredictionCard from './PredictionCard';
import PredictionChart from './PredictionChart';
import { PredictionResult, HistoricalDataPoint, TimeRange } from '@/types/prediction';
import predictionService from '@/services/predictionService';
import { useDataFreshness } from '@/utils/dataFreshness';
import DataFreshnessIndicator from '@/components/common/DataFreshnessIndicator';

// 샘플 데이터 (API 연동 전 데모용)
const SAMPLE_QUALITY_PREDICTIONS: PredictionResult[] = [
  {
    kpi_code: 'QLT_DEFECT_RATE',
    kpi_name: '불량률예측',
    predicted_value: 1.8,
    confidence: 0.90,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'XGBoost',
    feature_importance: { inspection_results: 0.45, process_params: 0.30, raw_material: 0.25 }
  },
  {
    kpi_code: 'QLT_CPK',
    kpi_name: 'Cpk예측',
    predicted_value: 1.42,
    confidence: 0.86,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'LinearRegression',
    feature_importance: { historical_cpk: 0.50, process_stability: 0.30, equipment_condition: 0.20 }
  },
  {
    kpi_code: 'QLT_DEFECT_TYPE',
    kpi_name: '불량유형예측',
    predicted_value: 5,
    confidence: 0.82,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'RandomForest',
    feature_importance: { defect_history: 0.60, process_stage: 0.25, material_lot: 0.15 }
  },
  {
    kpi_code: 'QLT_CLAIM',
    kpi_name: '클레임발생예측',
    predicted_value: 2,
    confidence: 0.84,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'LogisticRegression',
    feature_importance: { defect_rate: 0.50, customer_complaints: 0.30, shipment_volume: 0.20 }
  },
  {
    kpi_code: 'QLT_INSPECTION_TIME',
    kpi_name: '검사시간예측',
    predicted_value: 45,
    confidence: 0.88,
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1w',
    model_used: 'LSTM',
    feature_importance: { inspection_complexity: 0.45, inspector_skill: 0.30, queue_length: 0.25 }
  },
  {
    kpi_code: 'QLT_COST',
    kpi_name: '품질비용예측',
    predicted_value: 250,
    confidence: 0.79,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horizon: '1m',
    model_used: 'NeuralNetwork',
    feature_importance: { defect_cost: 0.40, inspection_cost: 0.35, rework_cost: 0.25 }
  }
];

const SAMPLE_QUALITY_ANOMALIES = [
  {
    id: 1,
    type: '불량률 급증',
    description: '라인 3에서 불량률이 기대치보다 높게 감지됨',
    severity: 'high',
    value: '3.2%',
    expected: '1.8%',
    detected_at: new Date().toISOString()
  },
  {
    id: 2,
    type: 'Cpk 저하',
    description: '공정 B의 공정 능력 지수가 1.0 미만으로 하락',
    severity: 'medium',
    value: '0.92',
    expected: '1.33',
    detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    type: '검사 시간 지연',
    description: '검사 대기 시간이 평균보다 50% 증가',
    severity: 'low',
    value: '68분',
    expected: '45분',
    detected_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

const generateQualityHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      defect_rate: 1.5 + Math.random() * 0.6 - 0.3,
      cpk: 1.35 + Math.random() * 0.2 - 0.1,
      inspection_time: 40 + Math.random() * 10 - 5
    });
  }
  return data;
};

const QualityPrediction: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1w');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [usingSampleData, setUsingSampleData] = useState(false);

  // 데이터 신선성 체크 (Stage 1 → 2 연결 확인)
  const { status: freshnessStatus, isFresh, isStale, refresh: refreshData } = useDataFreshness('quality_inspections', {
    enabled: true,
    max_age_hours: 4,
    warning_age_hours: 2,
    onStale: (status) => {
      console.warn('품질 데이터 부실:', status);
    },
  });

  // 데이터 파이프라인 Stage 2 → 3 → 4: 실제 예측 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Stage 4: ML 예측 API 호출 (Stage 2/3 데이터를 피처로 활용)
        const horizonMap: Record<TimeRange, string> = {
          '1d': '1d',
          '1w': '1w',
          '1m': '1m',
          '3m': '3m'
        };

        const response = await predictionService.quality.getPredictions({
          horizon: horizonMap[selectedTimeRange]
        });

        if (response?.predictions) {
          setPredictions(response.predictions);
        }

        if (response?.historical_data) {
          setHistoricalData(response.historical_data);
        }

        // 품질 이상 감지 API 호출
        try {
          const anomaliesResponse = await predictionService.quality.detectAnomalies();
          if (anomaliesResponse?.anomalies) {
            setAnomalies(anomaliesResponse.anomalies);
          }
        } catch (anomalyErr) {
          console.warn('이상 감지 조회 실패:', anomalyErr);
        }

      } catch (err) {
        console.warn('품질 예측 API 연동 실패, 샘플 데이터 사용:', err);
        // 샘플 데이터 사용 (백엔드 개발 전용 fallback)
        setPredictions(SAMPLE_QUALITY_PREDICTIONS);
        setHistoricalData(generateQualityHistoricalData());
        setAnomalies(SAMPLE_QUALITY_ANOMALIES);
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

  // Key quality predictions to display
  const keyPredictions = [
    { kpi_name: '불량률예측', icon: '🔍', color: '#EF4444', unit: '%' },
    { kpi_name: 'Cpk예측', icon: '📊', color: '#3B82F6', unit: '' },
    { kpi_name: '불량유형예측', icon: '🔬', color: '#F59E0B', unit: '' },
    { kpi_name: '클레임발생예측', icon: '📢', color: '#EC4899', unit: '건' },
    { kpi_name: '검사시간예측', icon: '⏱️', color: '#8B5CF6', unit: '분' },
    { kpi_name: '품질비용예측', icon: '💰', color: '#10B981', unit: '만원' },
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
      {/* 데이터 신선성 배너 (Stage 1 → 2 확인) */}
      {isStale && (
        <DataFreshnessIndicator
          status={freshnessStatus}
          position="banner"
          onRefresh={refreshData}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckIcon size={32} />
              <h1 className="text-3xl font-bold">품질 예측</h1>
              {usingSampleData && (
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full animate-pulse">
                  데모 데이터
                </span>
              )}
            </div>
            <p className="text-purple-100">AI 기반 불량률, Cpk, 품질 이상 등 품질 KPI 예측</p>
          </div>
          {/* 데이터 신선성 표시 (Stage 1 → Stage 2 연결) */}
          <DataFreshnessIndicator
            status={freshnessStatus}
            onRefresh={refreshData}
            compact={false}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertIcon size={24} className="text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800">품질 이상 감지 알림</h2>
              </div>
              {anomalies.length > 0 && (
                <span className="text-sm text-gray-500">
                  Stage 2 데이터 기반 ML 이상 감지
                </span>
              )}
            </div>
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>감지된 이상이 없습니다</p>
                <p className="text-sm">Stage 2 실시간 데이터 모니터링 중...</p>
              </div>
            )}
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
