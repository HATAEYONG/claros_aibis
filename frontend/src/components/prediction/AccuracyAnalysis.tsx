// AccuracyAnalysis.tsx - 예측 정확도 분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Activity,
  Award,
  Zap,
  Eye
} from 'lucide-react';

interface ModelAccuracy {
  modelName: string;
  category: string;
  overallAccuracy: number;
  mae: number;
  rmse: number;
  mape: number;
  r2Score: number;
  lastTrained: string;
  trainingSamples: number;
  trend: 'improving' | 'stable' | 'degrading';
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AccuracyMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface TimeSeriesData {
  period: string;
  actual: number;
  predicted: number;
  error: number;
}

const AccuracyAnalysis: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1week' | '1month' | '3months' | '6months'>('1month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [modelAccuracies, setModelAccuracies] = useState<ModelAccuracy[]>([
    {
      modelName: 'LSTM_품질예측',
      category: '품질',
      overallAccuracy: 94.2,
      mae: 2.3,
      rmse: 3.1,
      mape: 5.8,
      r2Score: 0.94,
      lastTrained: '2026-03-28',
      trainingSamples: 15420,
      trend: 'improving',
      status: 'excellent'
    },
    {
      modelName: 'XGBoost_생산예측',
      category: '생산',
      overallAccuracy: 91.5,
      mae: 8.7,
      rmse: 12.4,
      mape: 7.2,
      r2Score: 0.92,
      lastTrained: '2026-03-27',
      trainingSamples: 12850,
      trend: 'stable',
      status: 'good'
    },
    {
      modelName: 'ARIMA_재고예측',
      category: '재고',
      overallAccuracy: 88.3,
      mae: 15.2,
      rmse: 21.8,
      mape: 9.5,
      r2Score: 0.88,
      lastTrained: '2026-03-26',
      trainingSamples: 9870,
      trend: 'stable',
      status: 'good'
    },
    {
      modelName: 'Prophet_재무예측',
      category: '재무',
      overallAccuracy: 89.7,
      mae: 12.8,
      rmse: 18.5,
      mape: 8.9,
      r2Score: 0.90,
      lastTrained: '2026-03-25',
      trainingSamples: 7650,
      trend: 'improving',
      status: 'good'
    },
    {
      modelName: 'RandomForest_수요예측',
      category: '수요',
      overallAccuracy: 82.1,
      mae: 22.5,
      rmse: 31.2,
      mape: 12.3,
      r2Score: 0.82,
      lastTrained: '2026-03-24',
      trainingSamples: 11200,
      trend: 'degrading',
      status: 'fair'
    }
  ]);

  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetric[]>([
    { name: '전체 정확도', value: 91.5, target: 95, unit: '%', trend: 'up', status: 'good' },
    { name: 'MAE', value: 8.4, target: 5, unit: '', trend: 'down', status: 'warning' },
    { name: 'RMSE', value: 12.1, target: 10, unit: '', trend: 'down', status: 'warning' },
    { name: 'MAPE', value: 7.2, target: 5, unit: '%', trend: 'stable', status: 'good' },
    { name: 'R² Score', value: 0.91, target: 0.95, unit: '', trend: 'up', status: 'good' }
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([
    { period: '2026-03-24', actual: 1000, predicted: 1020, error: 2.0 },
    { period: '2026-03-25', actual: 1050, predicted: 1035, error: -1.4 },
    { period: '2026-03-26', actual: 1020, predicted: 1040, error: 2.0 },
    { period: '2026-03-27', actual: 1080, predicted: 1060, error: -1.9 },
    { period: '2026-03-28', actual: 1100, predicted: 1090, error: -0.9 },
    { period: '2026-03-29', actual: 1070, predicted: 1085, error: 1.4 },
    { period: '2026-03-30', actual: 1120, predicted: 1110, error: -0.9 }
  ]);

  const categories = ['all', '품질', '생산', '재고', '재무', '수요'];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      case 'fair':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
      case 'poor':
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      excellent: '우수',
      good: '양호',
      fair: '보통',
      poor: '미흡',
      warning: '주의',
      critical: '심각'
    };
    return labels[status] || status;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'degrading':
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredModels = selectedCategory === 'all'
    ? modelAccuracies
    : modelAccuracies.filter(model => model.category === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">예측 정확도 분석</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            모델별 예측 정확도를 모니터링하고 성능을 개선합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="1week">최근 1주</option>
            <option value="1month">최근 1개월</option>
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* 정확도 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {accuracyMetrics.map((metric) => (
          <div key={metric.name} className={`p-4 rounded-xl border-2 ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.name}</span>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}{metric.unit}
              </span>
              <span className="text-xs text-gray-500 mb-1">/ 목표: {metric.target}{metric.unit}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  metric.status === 'good' ? 'bg-green-500' : metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 카테고리 필터 및 모델별 정확도 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카테고리 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">카테고리</h3>
          <div className="space-y-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? '전체' : category}
                {category !== 'all' && (
                  <span className="ml-2 text-sm opacity-70">
                    ({modelAccuracies.filter(m => m.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 모델별 정확도 테이블 */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">모델별 정확도</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">모델</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">정확도</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">MAE</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">RMSE</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">MAPE</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">R²</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => (
                  <tr key={model.modelName} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{model.modelName}</div>
                        <div className="text-xs text-gray-500">{model.lastTrained}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(model.trend)}
                        <span className={`font-semibold ${
                          model.overallAccuracy >= 90 ? 'text-green-600' :
                          model.overallAccuracy >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {model.overallAccuracy}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{model.mae}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{model.rmse}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{model.mape}%</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{model.r2Score}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(model.status)}`}>
                        {getStatusLabel(model.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 시계열 오차 추이 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">예측 오차 추이</h3>
          <Eye className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 flex items-end justify-around gap-4">
          {timeSeriesData.map((data, index) => (
            <div key={data.period} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-lg transition-all ${
                  Math.abs(data.error) <= 2 ? 'bg-green-500' :
                  Math.abs(data.error) <= 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  height: `${Math.abs(data.error) * 15}%`,
                  minHeight: '20px'
                }}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                <div>{data.period.slice(5)}</div>
                <div className={`font-semibold ${
                  data.error > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {data.error > 0 ? '+' : ''}{data.error}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">우수 (2% 이하)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">양호 (5% 이하)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">개선 필요 (5% 초과)</span>
          </div>
        </div>
      </div>

      {/* 성능 개선 추천 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">성능 개선 추천</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-700 dark:text-red-400">긴급</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              RandomForest_수요예측 모델의 정확도가 82.1%로 낮습니다. 재학습이 필요합니다.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">개선</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ARIMA_재고예측 모델의 MAE를 줄이기 위해 파라미터 튜닝을 권장합니다.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-green-700 dark:text-green-400">우수</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              LSTM_품질예측 모델이 94.2%의 우수한 성능을 보이고 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyAnalysis;
