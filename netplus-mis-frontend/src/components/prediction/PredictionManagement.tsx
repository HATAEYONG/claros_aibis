import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrainIcon, TrendUpIcon, ActivityIcon, CheckIcon, PackageIcon, DollarIcon, SettingsIcon, UserIcon, ShoppingCartIcon, TruckIcon, UsersIcon, FileIcon, ZapIcon, AlertIcon, PlayIcon, PauseIcon, RefreshIcon, SaveIcon, PlusIcon } from '@/components/icons/Icons';
import FinancePrediction from './FinancePrediction';
import ProductionPrediction from './ProductionPrediction';
import QualityPrediction from './QualityPrediction';
import InventoryPrediction from './InventoryPrediction';
import ChartComponent from '@/components/common/ChartComponent';
import { PredictionCategory, PredictionCategoryInfo } from '@/types/prediction';

// 예측 결과 타입
interface PredictionResult {
  id: string;
  name: string;
  currentValue: number;
  predictedValue: number;
  unit: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  changeRate: number;
  status: 'normal' | 'warning' | 'critical';
  horizon: '1주' | '2주' | '1개월' | '3개월';
  upperBound: number;
  lowerBound: number;
  actualValue?: number; // 실적 값
  lastUpdated?: string; // 마지막 업데이트 시간
}

// 시뮬레이션 파라미터 타입
interface SimulationParams {
  horizon: '1주' | '2주' | '1개월' | '3개월';
  confidence: number;
  sensitivity: 'low' | 'medium' | 'high';
  scenarios: boolean;
}

// 사용자 정의 시나리오 타입
interface CustomScenario {
  id: string;
  name: string;
  description: string;
  params: {
    [key: string]: number; // 각 파라미터 조정값
  };
  createdAt: string;
}

// 모델 성능 메트릭 타입
interface ModelPerformance {
  modelName: string;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'retraining' | 'deprecated';
}

// 과거 데이터 타입
interface HistoricalData {
  period: string;
  value: number;
  actual?: number; // 실적 값
}

// 고도화된 공통 예측 컴포넌트
const EnhancedPrediction: React.FC<{
  categoryId: PredictionCategory;
  title: string;
  icon: string;
  color: string;
}> = ({ categoryId, title, icon, color }) => {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [params, setParams] = useState<SimulationParams>({
    horizon: '1개월',
    confidence: 80,
    sensitivity: 'medium',
    scenarios: true
  });

  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalData[]>>({});

  // 실시간 업데이트 관련
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30초
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 예측 vs 실적 비교
  const [showActualComparison, setShowActualComparison] = useState(false);

  // 사용자 정의 시나리오
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);
  const [scenarioParams, setScenarioParams] = useState<Record<string, number>>({});
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  // 모델 성능 모니터링
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([
    {
      modelName: 'LSTM_TimeSeries',
      mape: 3.2,
      rmse: 125.5,
      mae: 98.3,
      accuracy: 96.8,
      lastTrained: '2024-02-28',
      status: 'active'
    },
    {
      modelName: 'RandomForest_Reg',
      mape: 4.1,
      rmse: 145.2,
      mae: 112.7,
      accuracy: 95.9,
      lastTrained: '2024-02-25',
      status: 'active'
    },
    {
      modelName: 'XGBoost_Predictor',
      mape: 3.8,
      rmse: 138.9,
      mae: 105.4,
      accuracy: 96.2,
      lastTrained: '2024-02-27',
      status: 'active'
    }
  ]);

  // 실시간 업데이트 타이머
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 카테고리별 예측 항목 설정
  const getCategoryPredictions = (): PredictionResult[] => {
    const baseValue = Math.random() * 1000 + 500;

    switch (categoryId) {
      case 'sales':
        return [
          { id: 's1', name: '월 매출액', currentValue: baseValue * 10, predictedValue: baseValue * 10.5, unit: '백만원', confidence: 88, trend: 'up', changeRate: 5.2, status: 'normal', horizon: '1개월', upperBound: baseValue * 11.5, lowerBound: baseValue * 9.5 },
          { id: 's2', name: '주문량', currentValue: baseValue * 2, predictedValue: baseValue * 2.1, unit: '건', confidence: 82, trend: 'up', changeRate: 5.0, status: 'normal', horizon: '1개월', upperBound: baseValue * 2.3, lowerBound: baseValue * 1.9 },
          { id: 's3', name: '신규 고객', currentValue: baseValue * 0.5, predictedValue: baseValue * 0.55, unit: '명', confidence: 75, trend: 'up', changeRate: 10.0, status: 'normal', horizon: '1개월', upperBound: baseValue * 0.65, lowerBound: baseValue * 0.45 },
          { id: 's4', name: '객단가', currentValue: baseValue * 0.3, predictedValue: baseValue * 0.29, unit: '만원', confidence: 92, trend: 'down', changeRate: -3.3, status: 'warning', horizon: '1개월', upperBound: baseValue * 0.32, lowerBound: baseValue * 0.26 },
        ];

      case 'equipment':
        return [
          { id: 'e1', name: 'OEE', currentValue: 78, predictedValue: 80, unit: '%', confidence: 85, trend: 'up', changeRate: 2.6, status: 'normal', horizon: '1주', upperBound: 82, lowerBound: 78 },
          { id: 'e2', name: '가동률', currentValue: 85, predictedValue: 84, unit: '%', confidence: 90, trend: 'down', changeRate: -1.2, status: 'normal', horizon: '1주', upperBound: 86, lowerBound: 82 },
          { id: 'e3', name: '고장 위험 설비', currentValue: 2, predictedValue: 3, unit: '대', confidence: 72, trend: 'up', changeRate: 50.0, status: 'warning', horizon: '1주', upperBound: 4, lowerBound: 1 },
          { id: 'e4', name: '예방 보전 효과', currentValue: 95, predictedValue: 96, unit: '%', confidence: 88, trend: 'up', changeRate: 1.1, status: 'normal', horizon: '2주', upperBound: 98, lowerBound: 94 },
        ];

      case 'customer':
        return [
          { id: 'c1', name: '이탈률', currentValue: 5.2, predictedValue: 5.8, unit: '%', confidence: 78, trend: 'up', changeRate: 11.5, status: 'warning', horizon: '1개월', upperBound: 6.5, lowerBound: 5.0 },
          { id: 'c2', name: '재구매율', currentValue: 42, predictedValue: 44, unit: '%', confidence: 85, trend: 'up', changeRate: 4.8, status: 'normal', horizon: '1개월', upperBound: 47, lowerBound: 41 },
          { id: 'c3', name: '고객 만족도', currentValue: 4.2, predictedValue: 4.3, unit: '점', confidence: 80, trend: 'up', changeRate: 2.4, status: 'normal', horizon: '2주', upperBound: 4.5, lowerBound: 4.1 },
          { id: 'c4', name: 'CLV', currentValue: 150, predictedValue: 158, unit: '만원', confidence: 75, trend: 'up', changeRate: 5.3, status: 'normal', horizon: '3개월', upperBound: 170, lowerBound: 145 },
        ];

      case 'cost':
        return [
          { id: 'co1', name: '재료비', currentValue: 450, predictedValue: 465, unit: '백만원', confidence: 82, trend: 'up', changeRate: 3.3, status: 'warning', horizon: '1개월', upperBound: 480, lowerBound: 450 },
          { id: 'co2', name: '인건비', currentValue: 280, predictedValue: 285, unit: '백만원', confidence: 90, trend: 'up', changeRate: 1.8, status: 'normal', horizon: '1개월', upperBound: 290, lowerBound: 280 },
          { id: 'co3', name: '제조 경비', currentValue: 120, predictedValue: 118, unit: '백만원', confidence: 88, trend: 'down', changeRate: -1.7, status: 'normal', horizon: '1개월', upperBound: 125, lowerBound: 115 },
          { id: 'co4', name: '원가 차이', currentValue: -8, predictedValue: -5, unit: '%', confidence: 72, trend: 'up', changeRate: 37.5, status: 'warning', horizon: '1개월', upperBound: 0, lowerBound: -10 },
        ];

      case 'purchase':
        return [
          { id: 'p1', name: '자재 소요량', currentValue: 1200, predictedValue: 1250, unit: 'kg', confidence: 86, trend: 'up', changeRate: 4.2, status: 'normal', horizon: '2주', upperBound: 1300, lowerBound: 1200 },
          { id: 'p2', name: '구매 단가', currentValue: 5000, predictedValue: 5150, unit: '원/kg', confidence: 79, trend: 'up', changeRate: 3.0, status: 'warning', horizon: '1개월', upperBound: 5300, lowerBound: 5000 },
          { id: 'p3', name: '납기 준수율', currentValue: 94, predictedValue: 95, unit: '%', confidence: 88, trend: 'up', changeRate: 1.1, status: 'normal', horizon: '1개월', upperBound: 97, lowerBound: 93 },
          { id: 'p4', name: '발주 시기', currentValue: 7, predictedValue: 6, unit: '일 전', confidence: 75, trend: 'up', changeRate: 14.3, status: 'normal', horizon: '1주', upperBound: 8, lowerBound: 5 },
        ];

      case 'logistics':
        return [
          { id: 'l1', name: '배송 시간', currentValue: 2.8, predictedValue: 2.6, unit: '일', confidence: 84, trend: 'up', changeRate: -7.1, status: 'normal', horizon: '1주', upperBound: 3.0, lowerBound: 2.4 },
          { id: 'l2', name: '운송 비용', currentValue: 85, predictedValue: 82, unit: '백만원', confidence: 80, trend: 'down', changeRate: -3.5, status: 'normal', horizon: '1개월', upperBound: 88, lowerBound: 78 },
          { id: 'l3', name: '배송 완료율', currentValue: 96, predictedValue: 97, unit: '%', confidence: 90, trend: 'up', changeRate: 1.0, status: 'normal', horizon: '1개월', upperBound: 98, lowerBound: 96 },
          { id: 'l4', name: '창고 효율', currentValue: 72, predictedValue: 75, unit: '%', confidence: 78, trend: 'up', changeRate: 4.2, status: 'normal', horizon: '2주', upperBound: 78, lowerBound: 72 },
        ];

      case 'hr':
        return [
          { id: 'h1', name: '인력 수요', currentValue: 1250, predictedValue: 1280, unit: '명', confidence: 85, trend: 'up', changeRate: 2.4, status: 'normal', horizon: '1개월', upperBound: 1300, lowerBound: 1260 },
          { id: 'h2', name: '퇴사율', currentValue: 3.2, predictedValue: 3.5, unit: '%', confidence: 76, trend: 'up', changeRate: 9.4, status: 'warning', horizon: '1개월', upperBound: 4.0, lowerBound: 3.0 },
          { id: 'h3', name: '채용 기간', currentValue: 28, predictedValue: 25, unit: '일', confidence: 72, trend: 'up', changeRate: -10.7, status: 'normal', horizon: '1개월', upperBound: 30, lowerBound: 22 },
          { id: 'h4', name: '교육 효과', currentValue: 78, predictedValue: 82, unit: '%', confidence: 80, trend: 'up', changeRate: 5.1, status: 'normal', horizon: '2주', upperBound: 85, lowerBound: 79 },
        ];

      case 'etc':
        return [
          { id: 'et1', name: '안전 사고', currentValue: 2, predictedValue: 1, unit: '건', confidence: 68, trend: 'up', changeRate: -50.0, status: 'normal', horizon: '1개월', upperBound: 2, lowerBound: 0 },
          { id: 'et2', name: 'ESG 점수', currentValue: 75, predictedValue: 78, unit: '점', confidence: 82, trend: 'up', changeRate: 4.0, status: 'normal', horizon: '3개월', upperBound: 80, lowerBound: 76 },
          { id: 'et3', name: '탄소 배출', currentValue: 850, predictedValue: 820, unit: '톤', confidence: 78, trend: 'up', changeRate: -3.5, status: 'normal', horizon: '1개월', upperBound: 860, lowerBound: 780 },
          { id: 'et4', name: '에너지 사용', currentValue: 1200, predictedValue: 1180, unit: 'MWh', confidence: 85, trend: 'up', changeRate: -1.7, status: 'normal', horizon: '1개월', upperBound: 1220, lowerBound: 1140 },
        ];

      default:
        return [
          { id: 'd1', name: '예측 항목 1', currentValue: baseValue, predictedValue: baseValue * 1.05, unit: '단위', confidence: 88, trend: 'up', changeRate: 5.0, status: 'normal', horizon: '1개월', upperBound: baseValue * 1.1, lowerBound: baseValue * 1.0 },
          { id: 'd2', name: '예측 항목 2', currentValue: baseValue * 0.8, predictedValue: baseValue * 0.82, unit: '단위', confidence: 82, trend: 'up', changeRate: 2.5, status: 'normal', horizon: '1개월', upperBound: baseValue * 0.85, lowerBound: baseValue * 0.79 },
          { id: 'd3', name: '예측 항목 3', currentValue: baseValue * 1.2, predictedValue: baseValue * 1.18, unit: '단위', confidence: 75, trend: 'down', changeRate: -1.7, status: 'warning', horizon: '1개월', upperBound: baseValue * 1.25, lowerBound: baseValue * 1.15 },
          { id: 'd4', name: '예측 항목 4', currentValue: baseValue * 0.6, predictedValue: baseValue * 0.63, unit: '단위', confidence: 90, trend: 'up', changeRate: 5.0, status: 'normal', horizon: '2주', upperBound: baseValue * 0.65, lowerBound: baseValue * 0.61 },
        ];
    }
  };

  // 시뮬레이션 실행
  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      const base = getCategoryPredictions();
      const sensitivityMultiplier = params.sensitivity === 'low' ? 0.5 : params.sensitivity === 'high' ? 1.5 : 1;
      const confidenceMultiplier = (params.confidence - 50) / 100;

      const simulated = base.map(p => {
        const variance = (Math.random() - 0.5) * 0.2 * sensitivityMultiplier;
        const predictedValue = p.predictedValue * (1 + variance * confidenceMultiplier);
        const confidence = Math.max(50, Math.min(99, p.confidence + (Math.random() - 0.5) * 10 * sensitivityMultiplier));

        return {
          ...p,
          predictedValue,
          confidence,
          upperBound: predictedValue * (1 + (1 - confidence / 100) * 0.15),
          lowerBound: predictedValue * (1 - (1 - confidence / 100) * 0.15),
          horizon: params.horizon
        };
      });

      setPredictions(simulated);
      setSimulating(false);
    }, 1000);
  };

  // 과거 데이터 생성
  const generateHistoricalData = (prediction: PredictionResult): HistoricalData[] => {
    const periods: string[] = [];
    const now = new Date();

    // 기간에 따라 라벨 생성
    if (params.horizon === '1주' || params.horizon === '2주') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        periods.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        periods.push(`${date.getMonth() + 1}월`);
      }
    }

    // 과거 데이터 생성 (현재값을 기준으로 변동)
    const baseValue = prediction.currentValue;
    const trend = prediction.trend === 'up' ? 0.02 : prediction.trend === 'down' ? -0.02 : 0;
    const volatility = 0.05;

    return periods.map((period, idx) => {
      const trendEffect = baseValue * trend * (11 - idx);
      const randomEffect = baseValue * (Math.random() - 0.5) * volatility;
      const value = Math.max(0, baseValue + trendEffect + randomEffect);

      return { period, value: Math.round(value * 100) / 100 };
    });
  };

  // 차트 데이터 생성
  const getTrendChartData = () => {
    if (predictions.length === 0) return { labels: [], datasets: [] };

    const firstPrediction = predictions[0];
    const histDataArray = historicalData[firstPrediction.id] || generateHistoricalData(firstPrediction);

    // 라벨: 과거 12개월 + 현재 + 예측 기간
    const labels = [
      ...histDataArray.map(h => h.period),
      '현재',
      ...getFuturePeriods()
    ];

    // 과거 데이터 값
    const pastValues = histDataArray.map(h => h.value);

    // 현재 값
    const currentData = [firstPrediction.currentValue];

    // 예측 데이터
    const predictionData = Array(getFuturePeriods().length).fill(firstPrediction.predictedValue);

    // 상한/하한
    const upperBoundData = [firstPrediction.currentValue, ...Array(getFuturePeriods().length).fill(firstPrediction.upperBound)];
    const lowerBoundData = [firstPrediction.currentValue, ...Array(getFuturePeriods().length).fill(firstPrediction.lowerBound)];

    // 전체 데이터셋 결합
    const fullHistorical = [...pastValues, firstPrediction.currentValue, ...predictionData];
    const fullUpper = [...pastValues, ...upperBoundData];
    const fullLower = [...pastValues, ...lowerBoundData];

    return {
      labels,
      datasets: [
        {
          label: '상한',
          data: fullUpper,
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: '하한',
          data: fullLower,
          borderColor: 'rgba(34, 197, 94, 0.5)',
          borderDash: [5, 5],
          fill: '-1', // 상한까지 채우기
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: '실제/예측',
          data: fullHistorical,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: fullHistorical.map((_, idx) =>
            idx < pastValues.length ? '#3b82f6' : '#8b5cf6'
          )
        }
      ]
    };
  };

  // 미래 기간 라벨 생성
  const getFuturePeriods = (): string[] => {
    const count = params.horizon === '1주' ? 1 : params.horizon === '2주' ? 2 : params.horizon === '1개월' ? 4 : 12;
    const periods: string[] = [];
    const now = new Date();

    if (params.horizon === '1주' || params.horizon === '2주') {
      for (let i = 1; i <= count; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + (i * 7));
        periods.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
    } else {
      for (let i = 1; i <= count; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() + (params.horizon === '1개월' ? i : i * 3));
        periods.push(`${date.getMonth() + 1}월`);
      }
    }

    return periods;
  };

  // 시나리오 비교 차트 데이터
  const getScenarioChartData = () => {
    if (predictions.length === 0) return { labels: [], datasets: [] };

    const labels = predictions.slice(0, 4).map(p => p.name);
    const optimistic = predictions.slice(0, 4).map(p => p.upperBound);
    const base = predictions.slice(0, 4).map(p => p.predictedValue);
    const pessimistic = predictions.slice(0, 4).map(p => p.lowerBound);

    return {
      labels,
      datasets: [
        {
          label: '낙관',
          data: optimistic,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: '#22c55e',
          borderWidth: 1
        },
        {
          label: '기본',
          data: base,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        {
          label: '비관',
          data: pessimistic,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#ef4444',
          borderWidth: 1
        }
      ]
    };
  };

  // 신뢰도 비교 차트 데이터
  const getConfidenceChartData = () => {
    if (predictions.length === 0) return { labels: [], datasets: [] };

    const labels = predictions.map(p => p.name);
    const confidence = predictions.map(p => p.confidence);

    return {
      labels,
      datasets: [{
        label: '신뢰도',
        data: confidence,
        backgroundColor: confidence.map(c =>
          c >= 80 ? 'rgba(34, 197, 94, 0.8)' :
          c >= 70 ? 'rgba(234, 179, 8, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: confidence.map(c =>
          c >= 80 ? '#22c55e' :
          c >= 70 ? '#eab308' :
          '#ef4444'
        ),
        borderWidth: 1
      }]
    };
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const preds = getCategoryPredictions();
      setPredictions(preds);

      // 각 예측 항목에 대해 과거 데이터 생성
      const histData: Record<string, HistoricalData[]> = {};
      preds.forEach(p => {
        histData[p.id] = generateHistoricalData(p);
      });
      setHistoricalData(histData);

      setLoading(false);
    }, 500);
  }, [categoryId, params.horizon]);

  useEffect(() => {
    if (!loading) {
      runSimulation();
    }
  }, [params.horizon, params.sensitivity, params.confidence]);

  // 실시간 자동 업데이트
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        // 예측값 업데이트 (실제로는 API 호출)
        setPredictions(prev => prev.map(p => {
          const variance = (Math.random() - 0.5) * 0.02;
          const newValue = p.predictedValue * (1 + variance);
          return {
            ...p,
            predictedValue: newValue,
            lastUpdated: new Date().toISOString()
          };
        }));
        setLastUpdate(new Date());
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // 예측 vs 실적 데이터 생성
  const getPredictionVsActualData = () => {
    if (predictions.length === 0) return { labels: [], datasets: [] };

    const labels = predictions.slice(0, 6).map(p => p.name);
    const predicted = predictions.slice(0, 6).map(p => p.predictedValue);
    const actual = predictions.slice(0, 6).map(p => {
      // 실적은 예측과 약간 차이가 있도록 생성
      const variance = (Math.random() - 0.5) * 0.1;
      return p.predictedValue * (1 + variance);
    });
    const accuracy = predictions.slice(0, 6).map(p => {
      const actualVal = p.predictedValue * (1 + (Math.random() - 0.5) * 0.1);
      return ((1 - Math.abs(actualVal - p.predictedValue) / p.predictedValue) * 100);
    });

    return {
      labels,
      datasets: [
        {
          label: '예측',
          data: predicted,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        {
          label: '실적',
          data: actual,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: '#22c55e',
          borderWidth: 1
        }
      ],
      accuracy
    };
  };

  // 사용자 정의 시나리오 저장
  const saveCustomScenario = () => {
    const newScenario: CustomScenario = {
      id: `custom-${Date.now()}`,
      name: `시나리오 ${customScenarios.length + 1}`,
      description: '사용자 정의 시나리오',
      params: scenarioParams,
      createdAt: new Date().toISOString()
    };
    setCustomScenarios([...customScenarios, newScenario]);
    setShowScenarioModal(false);
    setScenarioParams({});
  };

  // 시나리오 적용
  const applyScenario = (scenarioId: string) => {
    const scenario = customScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      // 시나리오 파라미터 적용 로직
      console.log('Applying scenario:', scenario);
    }
  };

  const getColorClasses = () => {
    const colorMap: Record<string, { bg: string; text: string; gradient: string; border: string; bgLight: string }> = {
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', gradient: 'from-emerald-600 to-teal-600', border: 'border-emerald-500', bgLight: 'bg-emerald-50' },
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', gradient: 'from-blue-600 to-indigo-600', border: 'border-blue-500', bgLight: 'bg-blue-50' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', gradient: 'from-purple-600 to-pink-600', border: 'border-purple-500', bgLight: 'bg-purple-50' },
      amber: { bg: 'bg-amber-600', text: 'text-amber-600', gradient: 'from-amber-600 to-orange-600', border: 'border-amber-500', bgLight: 'bg-amber-50' },
      green: { bg: 'bg-green-600', text: 'text-green-600', gradient: 'from-green-600 to-emerald-600', border: 'border-green-500', bgLight: 'bg-green-50' },
      red: { bg: 'bg-red-600', text: 'text-red-600', gradient: 'from-red-600 to-rose-600', border: 'border-red-500', bgLight: 'bg-red-50' },
      cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', gradient: 'from-cyan-600 to-blue-600', border: 'border-cyan-500', bgLight: 'bg-cyan-50' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', gradient: 'from-indigo-600 to-purple-600', border: 'border-indigo-500', bgLight: 'bg-indigo-50' },
      yellow: { bg: 'bg-yellow-600', text: 'text-yellow-600', gradient: 'from-yellow-600 to-amber-600', border: 'border-yellow-500', bgLight: 'bg-yellow-50' },
      pink: { bg: 'bg-pink-600', text: 'text-pink-600', gradient: 'from-pink-600 to-rose-600', border: 'border-pink-500', bgLight: 'bg-pink-50' },
      orange: { bg: 'bg-orange-600', text: 'text-orange-600', gradient: 'from-orange-600 to-red-600', border: 'border-orange-500', bgLight: 'bg-orange-50' },
      gray: { bg: 'bg-gray-600', text: 'text-gray-600', gradient: 'from-gray-600 to-gray-700', border: 'border-gray-500', bgLight: 'bg-gray-50' },
    };
    return colorMap[color] || colorMap.gray;
  };

  const colors = getColorClasses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">AI 예측 모델을 로딩 중...</div>
      </div>
    );
  }

  // 시나리오 분석 데이터
  const scenarios = params.scenarios ? [
    { name: '낙관', values: predictions.map(p => ({ ...p, predictedValue: p.upperBound, confidence: Math.max(50, p.confidence - 10) })) },
    { name: '기본', values: predictions },
    { name: '비관', values: predictions.map(p => ({ ...p, predictedValue: p.lowerBound, confidence: Math.max(50, p.confidence - 10) })) }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} rounded-xl shadow-lg p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="opacity-90 mt-1">AI 기반 예측 및 시뮬레이션</p>
            </div>
          </div>
          <div className={`px-4 py-2 bg-white/20 rounded-lg`}>
            <p className="text-sm">모델 정확도</p>
            <p className="text-2xl font-bold">{(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(1)}%</p>
          </div>
          <div className={`px-4 py-2 bg-white/20 rounded-lg text-center`}>
            <p className="text-xs">마지막 업데이트</p>
            <p className="text-sm">{lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              autoRefresh ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {autoRefresh ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            <span className="text-sm">{autoRefresh ? '자동 업데이트 중' : '자동 업데이트'}</span>
          </button>
          <button
            onClick={() => {
              setPredictions(getCategoryPredictions());
              setLastUpdate(new Date());
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshIcon size={16} />
            <span className="text-sm">새로고침</span>
          </button>
          <button
            onClick={() => setShowActualComparison(!showActualComparison)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showActualComparison ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <ActivityIcon size={16} />
            <span className="text-sm">예측 vs 실적</span>
          </button>
        </div>
      </div>

      {/* 시뮬레이션 컨트롤 패널 */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ZapIcon className="text-yellow-600" size={20} />
          시뮬레이션 파라미터
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">예측 기간</label>
            <select
              value={params.horizon}
              onChange={(e) => setParams({ ...params, horizon: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1주">1주</option>
              <option value="2주">2주</option>
              <option value="1개월">1개월</option>
              <option value="3개월">3개월</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">신뢰구간: {params.confidence}%</label>
            <input
              type="range"
              min="50"
              max="99"
              value={params.confidence}
              onChange={(e) => setParams({ ...params, confidence: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">민감도</label>
            <select
              value={params.sensitivity}
              onChange={(e) => setParams({ ...params, sensitivity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={simulating}
              className={`w-full px-4 py-2 ${colors.bg} text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2`}
            >
              {simulating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  시뮬레이션 중...
                </>
              ) : (
                <>
                  <ZapIcon size={16} />
                  시뮬레이션 실행
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 예측 결과 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictions.map((prediction) => (
          <div key={prediction.id} className={`bg-white rounded-xl shadow p-5 border-l-4 hover:shadow-lg transition-shadow ${
            prediction.status === 'critical' ? 'border-red-500' :
            prediction.status === 'warning' ? 'border-yellow-500' : 'border-green-500'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700">{prediction.name}</h3>
                <p className="text-xs text-gray-500">현재: {prediction.currentValue.toLocaleString()} {prediction.unit}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                prediction.confidence >= 80 ? 'bg-green-100 text-green-700' :
                prediction.confidence >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {prediction.confidence}%
              </span>
            </div>

            <div className="mb-3">
              <p className="text-2xl font-bold text-gray-800">
                {prediction.predictedValue.toLocaleString()} <span className="text-sm text-gray-500">{prediction.unit}</span>
              </p>
              <div className="flex items-center gap-1 text-sm mt-1">
                {prediction.trend === 'up' ? (
                  <TrendUpIcon className="text-green-600" size={14} />
                ) : prediction.trend === 'down' ? (
                  <TrendUpIcon className="text-red-600 rotate-180" size={14} />
                ) : (
                  <ActivityIcon className="text-gray-600" size={14} />
                )}
                <span className={prediction.changeRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {prediction.changeRate >= 0 ? '+' : ''}{prediction.changeRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 신뢰구간 바 */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>하한: {prediction.lowerBound.toLocaleString()}</span>
                <span>상한: {prediction.upperBound.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 relative">
                <div
                  className={`h-2 rounded-full ${colors.bg}`}
                  style={{
                    left: `${Math.max(0, (prediction.lowerBound / (prediction.upperBound * 1.2)) * 100)}%`,
                    width: `${Math.min(100, ((prediction.upperBound - prediction.lowerBound) / (prediction.upperBound * 1.2)) * 100)}%`,
                    position: 'absolute',
                  }}
                ></div>
                <div
                  className="w-0.5 h-3 bg-gray-800 absolute top-0.5"
                  style={{ left: `${(prediction.predictedValue / (prediction.upperBound * 1.2)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{prediction.horizon} 후 예측</span>
              <span className={`text-xs font-bold ${
                prediction.status === 'critical' ? 'text-red-600' :
                prediction.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {prediction.status === 'critical' ? '심각' :
                 prediction.status === 'warning' ? '주의' : '정상'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 시나리오 분석 */}
      {params.scenarios && scenarios.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ActivityIcon className={colors.text} size={20} />
            시나리오 분석 (What-If)
          </h3>
          <div className="space-y-4">
            {predictions.slice(0, 3).map((prediction, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">{prediction.name}</h4>
                <div className="space-y-2">
                  {scenarios.map((scenario) => {
                    const value = scenario.values.find(v => v.id === prediction.id);
                    if (!value) return null;
                    return (
                      <div key={scenario.name} className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          scenario.name === '낙관' ? 'bg-green-100 text-green-700' :
                          scenario.name === '비관' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {scenario.name}
                        </span>
                        <span className="font-bold text-gray-800">
                          {value.predictedValue.toLocaleString()} {value.unit}
                        </span>
                        <span className="text-sm text-gray-500">
                          (신뢰도: {value.confidence}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 예측 추이 차트 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendUpIcon className={colors.text} size={20} />
          예측 추이
        </h3>
        <div className="h-80">
          <ChartComponent
            type="line"
            data={getTrendChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 15
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context: any) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        label += context.parsed.y.toLocaleString();
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              },
              interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
              }
            }}
          />
        </div>
      </div>

      {/* 시나리오 비교 & 신뢰도 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시나리오 비교 차트 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ActivityIcon className={colors.text} size={20} />
            시나리오 분석
          </h3>
          <div className="h-64">
            <ChartComponent
              type="bar"
              data={getScenarioChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 15
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 신뢰도 차트 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckIcon className={colors.text} size={20} />
            예측 신뢰도
          </h3>
          <div className="h-64">
            <ChartComponent
              type="bar"
              data={getConfidenceChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    min: 50,
                    max: 100,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                  y: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 예측 상태 분포 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertIcon className={colors.text} size={20} />
          예측 상태 분포
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 파이 차트 */}
          <div className="h-64">
            <ChartComponent
              type="doughnut"
              data={{
                labels: ['정상', '주의', '심각'],
                datasets: [{
                  data: [
                    predictions.filter(p => p.status === 'normal').length,
                    predictions.filter(p => p.status === 'warning').length,
                    predictions.filter(p => p.status === 'critical').length
                  ],
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                  ],
                  borderColor: [
                    '#22c55e',
                    '#eab308',
                    '#ef4444'
                  ],
                  borderWidth: 2
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        size: 14
                      }
                    }
                  }
                }
              }}
            />
          </div>
          {/* 상태 설명 */}
          <div className="space-y-3">
            {predictions.filter(p => p.status === 'normal').length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">정상</p>
                    <p className="text-sm text-gray-600">
                      {predictions.filter(p => p.status === 'normal').length}개 항목이 정상 범위 내에 있습니다.
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {((predictions.filter(p => p.status === 'normal').length / predictions.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            {predictions.filter(p => p.status === 'warning').length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">주의</p>
                    <p className="text-sm text-gray-600">
                      {predictions.filter(p => p.status === 'warning').length}개 항목이 주의가 필요합니다.
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {((predictions.filter(p => p.status === 'warning').length / predictions.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            {predictions.filter(p => p.status === 'critical').length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">심각</p>
                    <p className="text-sm text-gray-600">
                      {predictions.filter(p => p.status === 'critical').length}개 항목이 심각한 상태입니다.
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {((predictions.filter(p => p.status === 'critical').length / predictions.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 예측 항목</p>
                  <p className="text-2xl font-bold text-gray-800">{predictions.length}개</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">평균 신뢰도</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예측 vs 실적 비교 */}
      {showActualComparison && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className={colors.text} size={20} />
              예측 vs 실적 비교
            </h3>
            <button
              onClick={() => setShowActualComparison(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64">
                <ChartComponent
                  type="bar"
                  data={{
                    labels: predictions.slice(0, 6).map(p => p.name),
                    datasets: [
                      {
                        label: '예측',
                        data: predictions.slice(0, 6).map(p => p.predictedValue),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: '#3b82f6',
                        borderWidth: 1
                      },
                      {
                        label: '실적',
                        data: predictions.slice(0, 6).map(p => {
                          const variance = (Math.random() - 0.5) * 0.1;
                          return p.predictedValue * (1 + variance);
                        }),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: '#22c55e',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                      y: { beginAtZero: true },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-3">
              {predictions.slice(0, 4).map((p, idx) => {
                const actualVal = p.predictedValue * (1 + (Math.random() - 0.5) * 0.1);
                const accuracy = (1 - Math.abs(actualVal - p.predictedValue) / p.predictedValue) * 100;
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <span className={`text-xs font-bold ${
                        accuracy >= 95 ? 'text-green-600' : accuracy >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        정확도: {accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-600">예측: {p.predictedValue.toLocaleString()} {p.unit}</div>
                      <div className="text-gray-600">실적: {actualVal.toLocaleString()} {p.unit}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${
                          accuracy >= 95 ? 'bg-green-500' : accuracy >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 사용자 정의 시나리오 관리 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className={colors.text} size={20} />
            사용자 정의 시나리오
          </h3>
          <button
            onClick={() => setShowScenarioModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <PlusIcon size={16} />
            새 시나리오
          </button>
        </div>
        {customScenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {customScenarios.map((scenario) => (
              <div key={scenario.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{scenario.name}</h4>
                  <button
                    onClick={() => applyScenario(scenario.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                  >
                    적용
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{scenario.description}</p>
                <div className="text-xs text-gray-600">
                  생성: {new Date(scenario.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            저장된 시나리오가 없습니다. 새 시나리오를 만들어보세요.
          </div>
        )}
      </div>

      {/* 모델 성능 모니터링 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BrainIcon className={colors.text} size={20} />
          모델 성능 모니터링
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">모델명</th>
                <th className="py-3 px-4 text-right">MAPE</th>
                <th className="py-3 px-4 text-right">RMSE</th>
                <th className="py-3 px-4 text-right">정확도</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">마지막 학습</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {modelPerformance.map((model, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{model.modelName}</td>
                  <td className="py-3 px-4 text-right">{model.mape.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">{model.rmse.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-bold ${
                      model.accuracy >= 95 ? 'text-green-600' : model.accuracy >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {model.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.status === 'active' ? 'bg-green-100 text-green-700' :
                      model.status === 'retraining' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {model.status === 'active' ? '활성' : model.status === 'retraining' ? '재학습중' : '사용안함'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{model.lastTrained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div className={`${colors.bgLight} border-l-4 ${colors.border} rounded-xl p-6`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BrainIcon className={colors.text} size={20} />
          AI 인사이트
        </h3>
        <div className="space-y-3">
          {predictions.some(p => p.status === 'critical') && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertIcon className="text-red-600" size={20} />
                <div>
                  <p className="font-bold text-gray-800">긴급 알림</p>
                  <p className="text-sm text-gray-600">
                    {predictions.filter(p => p.status === 'critical').length}개 항목에서 심각한 수준의 변화가 예측됩니다.
                    즉시 대응 계획을 수립하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {predictions.some(p => p.status === 'warning') && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ZapIcon className="text-yellow-600" size={20} />
                <div>
                  <p className="font-bold text-gray-800">주의 사항</p>
                  <p className="text-sm text-gray-600">
                    {predictions.filter(p => p.status === 'warning').length}개 항목에서 주의가 필요한 변화가 예측됩니다.
                    모니터링을 강화하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckIcon className="text-green-600" size={20} />
              <div>
                <p className="font-bold text-gray-800">안정적 예측</p>
                <p className="text-sm text-gray-600">
                  대부분의 항목이 정상 범위 내에서 예측됩니다. 현재 추세가 지속될 것으로 보입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PredictionManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PredictionCategory>('finance');

  const categories: PredictionCategoryInfo[] = [
    {
      id: 'production',
      name: '생산 예측',
      description: '생산량, 불량률, OEE, 설비고장 등 생산 KPI 예측',
      icon: '⚙️',
      color: 'blue',
      kpiCodes: ['PROD_001', 'PROD_002', 'PROD_003', 'PROD_004'],
      apiEndpoint: '/api/predictions/production/'
    },
    {
      id: 'quality',
      name: '품질 예측',
      description: '불량률, Cpk, 품질 이상, 클레임 등 품질 KPI 예측',
      icon: '✅',
      color: 'purple',
      kpiCodes: ['QUAL_001', 'QUAL_002', 'QUAL_003', 'QUAL_004'],
      apiEndpoint: '/api/predictions/quality/'
    },
    {
      id: 'sales',
      name: '영업 예측',
      description: '매출, 주문량, 고객 확보율, 시장 점유율 등 영업 KPI 예측',
      icon: '💼',
      color: 'green',
      kpiCodes: ['SALES_001', 'SALES_002', 'SALES_003', 'SALES_004'],
      apiEndpoint: '/api/predictions/sales/'
    },
    {
      id: 'inventory',
      name: '재고 예측',
      description: '재고 소진일수, 부족/과잉, 회전율 등 재고 KPI 예측',
      icon: '📦',
      color: 'amber',
      kpiCodes: ['INV_001', 'INV_002', 'INV_003', 'INV_004'],
      apiEndpoint: '/api/predictions/inventory/'
    },
    {
      id: 'equipment',
      name: '설비 예측',
      description: '설비 고장, 수명, OEE, 가용률 등 설비 KPI 예측',
      icon: '🔧',
      color: 'red',
      kpiCodes: ['EQ_001', 'EQ_002', 'EQ_003', 'EQ_004'],
      apiEndpoint: '/api/predictions/equipment/'
    },
    {
      id: 'customer',
      name: '고객 예측',
      description: '고객 이탈, 재구매율, CLV, 신규 고객 확보 등 고객 KPI 예측',
      icon: '👤',
      color: 'cyan',
      kpiCodes: ['CUST_001', 'CUST_002', 'CUST_003', 'CUST_004'],
      apiEndpoint: '/api/predictions/customer/'
    },
    {
      id: 'cost',
      name: '원가 예측',
      description: '재료비, 인건비, 제조비, 원가 차이 등 원가 KPI 예측',
      icon: '💰',
      color: 'yellow',
      kpiCodes: ['COST_001', 'COST_002', 'COST_003', 'COST_004'],
      apiEndpoint: '/api/predictions/cost/'
    },
    {
      id: 'finance',
      name: '재무 예측',
      description: '매출액, 영업이익, 순이익, 현금흐름 등 재무 KPI 예측',
      icon: '💵',
      color: 'emerald',
      kpiCodes: ['FIN_001', 'FIN_002', 'FIN_003', 'FIN_004'],
      apiEndpoint: '/api/predictions/finance/'
    },
    {
      id: 'purchase',
      name: '구매 예측',
      description: '자재 소요량, 발주 시기, 구매 단가, 납기 준수율 등 구매 KPI 예측',
      icon: '🛒',
      color: 'indigo',
      kpiCodes: ['PUR_001', 'PUR_002', 'PUR_003', 'PUR_004'],
      apiEndpoint: '/api/predictions/purchase/'
    },
    {
      id: 'logistics',
      name: '물류 예측',
      description: '배송 시간, 운송 비용, 배송 완료율, 창고 효율 등 물류 KPI 예측',
      icon: '🚚',
      color: 'pink',
      kpiCodes: ['LOG_001', 'LOG_002', 'LOG_003', 'LOG_004'],
      apiEndpoint: '/api/predictions/logistics/'
    },
    {
      id: 'hr',
      name: '인사 예측',
      description: '인력 수요, 퇴사율, 채용 기간, 교육 효과 등 인사 KPI 예측',
      icon: '👥',
      color: 'orange',
      kpiCodes: ['HR_001', 'HR_002', 'HR_003', 'HR_004'],
      apiEndpoint: '/api/predictions/hr/'
    },
    {
      id: 'etc',
      name: '기타 예측',
      description: 'ESG, 안전, 기타 KPI 예측',
      icon: '📋',
      color: 'gray',
      kpiCodes: ['ETC_001', 'ETC_002', 'ETC_003', 'ETC_004'],
      apiEndpoint: '/api/predictions/etc/'
    },
  ];

  const getCategoryIcon = (categoryId: PredictionCategory) => {
    switch (categoryId) {
      case 'production': return ActivityIcon;
      case 'quality': return CheckIcon;
      case 'inventory': return PackageIcon;
      case 'sales': return TrendUpIcon;
      case 'equipment': return SettingsIcon;
      case 'customer': return UserIcon;
      case 'cost': return DollarIcon;
      case 'finance': return TrendUpIcon;
      case 'purchase': return ShoppingCartIcon;
      case 'logistics': return TruckIcon;
      case 'hr': return UsersIcon;
      case 'etc': return FileIcon;
      default: return BrainIcon;
    }
  };

  const getCategoryColorClasses = (categoryId: PredictionCategory) => {
    switch (categoryId) {
      case 'production':
        return { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', gradient: 'from-blue-600 to-indigo-600' };
      case 'quality':
        return { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', gradient: 'from-purple-600 to-pink-600' };
      case 'sales':
        return { bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', gradient: 'from-green-600 to-emerald-600' };
      case 'inventory':
        return { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', gradient: 'from-amber-600 to-orange-600' };
      case 'equipment':
        return { bg: 'bg-red-600', bgLight: 'bg-red-50', text: 'text-red-600', border: 'border-red-500', gradient: 'from-red-600 to-rose-600' };
      case 'customer':
        return { bg: 'bg-cyan-600', bgLight: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-500', gradient: 'from-cyan-600 to-blue-600' };
      case 'cost':
        return { bg: 'bg-yellow-600', bgLight: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500', gradient: 'from-yellow-600 to-amber-600' };
      case 'finance':
        return { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', gradient: 'from-emerald-600 to-teal-600' };
      case 'purchase':
        return { bg: 'bg-indigo-600', bgLight: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', gradient: 'from-indigo-600 to-purple-600' };
      case 'logistics':
        return { bg: 'bg-pink-600', bgLight: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-500', gradient: 'from-pink-600 to-rose-600' };
      case 'hr':
        return { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', gradient: 'from-orange-600 to-red-600' };
      case 'etc':
        return { bg: 'bg-gray-600', bgLight: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-700' };
      default:
        return { bg: 'bg-gray-600', bgLight: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-700' };
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'production': return <ProductionPrediction />;
      case 'quality': return <QualityPrediction />;
      case 'inventory': return <InventoryPrediction />;
      case 'finance': return <FinancePrediction />;
      default:
        const category = categories.find(c => c.id === activeCategory);
        return <EnhancedPrediction categoryId={activeCategory} title={category?.name || '예측'} icon={category?.icon || '📊'} color={category?.color || 'gray'} />;
    }
  };

  const activeCategoryData = categories.find(c => c.id === activeCategory);
  const ActiveIcon = getCategoryIcon(activeCategory);
  const colorClasses = getCategoryColorClasses(activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorClasses.gradient} rounded-xl shadow-lg p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <BrainIcon size={32} />
          <h1 className="text-3xl font-bold">AI 예측 관리</h1>
        </div>
        <p className="opacity-90">AI 기반 비즈니스 KPI 예측 및 인사이트 - 12개 도메인</p>
      </div>

      {/* Category Tabs - 12개 도메인 그리드 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.id);
            const categoryColorClasses = getCategoryColorClasses(category.id);
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  isActive
                    ? `${categoryColorClasses.bg} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={category.description}
              >
                <CategoryIcon size={20} />
                <span className="text-xs font-medium text-center">{category.name.replace(' 예측', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Description */}
      {activeCategoryData && (
        <div className={`${colorClasses.bgLight} border-l-4 ${colorClasses.border} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <ActiveIcon size={20} className={colorClasses.text} />
            <h3 className={`font-semibold ${colorClasses.text}`}>{activeCategoryData.name}</h3>
          </div>
          <p className="text-sm text-gray-600">{activeCategoryData.description}</p>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default PredictionManagement;
