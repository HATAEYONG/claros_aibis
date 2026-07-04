// PredictionVsActual.tsx - 예측 vs 실적 비교 컴포넌트
import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  ArrowRight,
  Award
} from 'lucide-react';

interface PredictionComparison {
  id: string;
  category: string;
  item: string;
  period: string;
  predicted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  unit: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CategorySummary {
  category: string;
  totalItems: number;
  avgVariance: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface TimeSeriesPoint {
  date: string;
  predicted: number;
  actual: number;
}

const PredictionVsActual: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [showChart, setShowChart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [comparisons, setComparisons] = useState<PredictionComparison[]>([
    {
      id: '1',
      category: '품질',
      item: '불량률 예측',
      period: '2026-03-30',
      predicted: 2.5,
      actual: 2.3,
      variance: -0.2,
      variancePercent: -8.0,
      unit: '%',
      status: 'excellent'
    },
    {
      id: '2',
      category: '생산',
      item: '생산량 예측',
      period: '2026-03-30',
      predicted: 5000,
      actual: 4850,
      variance: -150,
      variancePercent: -3.0,
      unit: '개',
      status: 'good'
    },
    {
      id: '3',
      category: '재고',
      item: '재고 수준 예측',
      period: '2026-03-30',
      predicted: 12000,
      actual: 11500,
      variance: -500,
      variancePercent: -4.2,
      unit: '개',
      status: 'good'
    },
    {
      id: '4',
      category: '재무',
      item: '매출액 예측',
      period: '2026-03-30',
      predicted: 550000000,
      actual: 523000000,
      variance: -27000000,
      variancePercent: -4.9,
      unit: '원',
      status: 'good'
    },
    {
      id: '5',
      category: '생산',
      item: '설비 가동률 예측',
      period: '2026-03-30',
      predicted: 85,
      actual: 78,
      variance: -7,
      variancePercent: -8.2,
      unit: '%',
      status: 'fair'
    },
    {
      id: '6',
      category: '품질',
      item: '수율 예측',
      period: '2026-03-30',
      predicted: 95,
      actual: 96.2,
      variance: 1.2,
      variancePercent: 1.3,
      unit: '%',
      status: 'excellent'
    },
    {
      id: '7',
      category: '재고',
      item: '회전율 예측',
      period: '2026-03-30',
      predicted: 4.5,
      actual: 3.8,
      variance: -0.7,
      variancePercent: -15.6,
      unit: '회',
      status: 'poor'
    },
    {
      id: '8',
      category: '재무',
      item: '영업이익 예측',
      period: '2026-03-30',
      predicted: 85000000,
      actual: 87200000,
      variance: 2200000,
      variancePercent: 2.6,
      unit: '원',
      status: 'excellent'
    }
  ]);

  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([
    {
      category: '품질',
      totalItems: 2,
      avgVariance: 3.5,
      excellent: 2,
      good: 0,
      fair: 0,
      poor: 0
    },
    {
      category: '생산',
      totalItems: 2,
      avgVariance: 5.6,
      excellent: 0,
      good: 1,
      fair: 1,
      poor: 0
    },
    {
      category: '재고',
      totalItems: 2,
      avgVariance: 9.9,
      excellent: 0,
      good: 1,
      fair: 0,
      poor: 1
    },
    {
      category: '재무',
      totalItems: 2,
      avgVariance: 3.8,
      excellent: 1,
      good: 1,
      fair: 0,
      poor: 0
    }
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([
    { date: '03-24', predicted: 4950, actual: 4800 },
    { date: '03-25', predicted: 5050, actual: 5100 },
    { date: '03-26', predicted: 5000, actual: 4950 },
    { date: '03-27', predicted: 5100, actual: 5000 },
    { date: '03-28', predicted: 5050, actual: 5200 },
    { date: '03-29', predicted: 5000, actual: 4900 },
    { date: '03-30', predicted: 5000, actual: 4850 }
  ]);

  const categories = ['all', '품질', '생산', '재고', '재무'];
  const periods = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'quarter', label: '분기' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400';
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400';
      case 'fair':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400';
      case 'poor':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      excellent: '우수',
      good: '양호',
      fair: '보통',
      poor: '미흡'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-5 h-5" />;
      case 'fair':
        return <AlertTriangle className="w-5 h-5" />;
      case 'poor':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만`;
    } else if (Number.isInteger(num)) {
      return num.toLocaleString();
    }
    return num.toFixed(1);
  };

  const filteredComparisons = selectedCategory === 'all'
    ? comparisons
    : comparisons.filter(c => c.category === selectedCategory);

  const overallAccuracy = filteredComparisons.length > 0
    ? (filteredComparisons.filter(c => c.status === 'excellent' || c.status === 'good').length / filteredComparisons.length) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">예측 vs 실적 비교</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            예측값과 실제값을 비교하여 모델 성능을 평가합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {showChart ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showChart ? '목록 보기' : '차트 보기'}
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
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

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">전체 정확도</p>
              <p className="text-3xl font-bold mt-1">{overallAccuracy.toFixed(1)}%</p>
            </div>
            <Target className="w-12 h-12 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">비교 항목</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredComparisons.length}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 편차</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {(filteredComparisons.reduce((sum, c) => sum + Math.abs(c.variancePercent), 0) / filteredComparisons.length).toFixed(1)}%
              </p>
            </div>
            <Activity className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">우수 비율</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredComparisons.filter(c => c.status === 'excellent').length}개
              </p>
            </div>
            <Award className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* 카테고리별 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categorySummaries.map((summary) => (
          <div
            key={summary.category}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 dark:text-white">{summary.category}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                summary.avgVariance <= 5 ? 'bg-green-100 text-green-700' :
                summary.avgVariance <= 10 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                평균 {summary.avgVariance}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">우수</span>
                <span className="font-semibold text-green-600">{summary.excellent}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">양호</span>
                <span className="font-semibold text-blue-600">{summary.good}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">보통</span>
                <span className="font-semibold text-yellow-600">{summary.fair}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">미흡</span>
                <span className="font-semibold text-red-600">{summary.poor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 뷰 */}
      {showChart && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">시계열 비교 (생산량)</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {timeSeriesData.map((point, index) => {
              const maxValue = Math.max(...timeSeriesData.map(p => Math.max(p.predicted, p.actual)));
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${(point.actual / maxValue) * 100}%`, minHeight: '20px' }}
                      title={`실제: ${point.actual}`}
                    />
                    <div
                      className="w-full bg-blue-300 dark:bg-blue-700 rounded-b transition-all hover:bg-blue-400 dark:hover:bg-blue-600"
                      style={{ height: `${(point.predicted / maxValue) * 100}%`, minHeight: '20px' }}
                      title={`예측: ${point.predicted}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{point.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">실제값</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">예측값</span>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 필터 및 상세 비교 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 카테고리 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">카테고리</h3>
          <div className="space-y-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category === 'all' ? '전체' : category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedCategory === category ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {category === 'all'
                      ? comparisons.length
                      : comparisons.filter(c => c.category === category).length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 비교 상세 테이블 */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">상세 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">카테고리</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">항목</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">예측</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">실제</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">편차</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredComparisons.map((comparison) => (
                  <tr key={comparison.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {comparison.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {comparison.item}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(comparison.predicted)}{comparison.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(comparison.actual)}{comparison.unit}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {comparison.variance > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          comparison.variance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {comparison.variance > 0 ? '+' : ''}{formatNumber(comparison.variance)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({comparison.variancePercent > 0 ? '+' : ''}{comparison.variancePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(comparison.status)}`}>
                        {getStatusIcon(comparison.status)}
                        {getStatusLabel(comparison.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 인사이트 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">분석 인사이트</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>품질 예측 모델이 가장 높은 정확도를 보이며, 불량률 예측 오차가 0.2%로 우수합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>재고 회전율 예측의 정확도가 낮습니다. 15.6%의 편차를 보이며 모델 재학습이 필요합니다.</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>영업이익 예측이 실제보다 2.6% 낮게 추정되어 보수적인 예측 경향을 보입니다.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionVsActual;
