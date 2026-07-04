// ForecastingManagement.tsx - AXOS ERP V10.4 포캐스팅 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Calendar,
  Filter,
  Download,
  FileText,
  Target,
  PieChart,
  Calculator,
  Activity,
  Plus,
  XCircle,
  Zap
} from 'lucide-react';

interface ForecastRecord {
  id: number;
  revenue: number;
  cost: number;
  delay_penalty: number;
  rework_cost: number;
  forecast_margin: number;
  risk_level: 'HIGH' | 'NORMAL';
  recommendation: string;
  created_at: string;
}

interface ForecastRequest {
  revenue: number;
  cost: number;
  delay_penalty: number;
  rework_cost: number;
}

const ForecastingManagement: React.FC = () => {
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [filteredForecasts, setFilteredForecasts] = useState<ForecastRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<ForecastRecord | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 포캐스트 요청 폼
  const [forecastForm, setForecastForm] = useState<ForecastRequest>({
    revenue: 0,
    cost: 0,
    delay_penalty: 0,
    rework_cost: 0
  });

  const riskLevels = ['HIGH', 'NORMAL'];

  useEffect(() => {
    loadForecasts();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterForecasts();
  }, [forecasts, searchQuery, selectedRisk]);

  const loadForecasts = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8250/forecasts');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoForecasts: ForecastRecord[] = [
        {
          id: 1,
          revenue: 1000000,
          cost: 600000,
          delay_penalty: 50000,
          rework_cost: 30000,
          forecast_margin: 320000,
          risk_level: 'NORMAL',
          recommendation: 'Within target',
          created_at: '2024-04-21T10:00:00'
        },
        {
          id: 2,
          revenue: 800000,
          cost: 900000,
          delay_penalty: 100000,
          rework_cost: 50000,
          forecast_margin: -250000,
          risk_level: 'HIGH',
          recommendation: 'Adjust production / procurement',
          created_at: '2024-04-21T11:00:00'
        },
        {
          id: 3,
          revenue: 1500000,
          cost: 800000,
          delay_penalty: 0,
          rework_cost: 0,
          forecast_margin: 700000,
          risk_level: 'NORMAL',
          recommendation: 'Within target',
          created_at: '2024-04-21T12:00:00'
        }
      ];
      setForecasts(demoForecasts);
    } catch (error) {
      console.error('포캐스트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterForecasts = () => {
    let filtered = [...forecasts];

    if (searchQuery) {
      filtered = filtered.filter(forecast =>
        forecast.recommendation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(forecast => forecast.risk_level === selectedRisk);
    }

    setFilteredForecasts(filtered);
  };

  const handleForecast = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8250/forecast/margin', { method: 'POST', body: JSON.stringify(forecastForm) });
      await new Promise(resolve => setTimeout(resolve, 500));

      const margin = forecastForm.revenue - forecastForm.cost - forecastForm.delay_penalty - forecastForm.rework_cost;

      const demoForecast: ForecastRecord = {
        id: forecasts.length + 1,
        ...forecastForm,
        forecast_margin: margin,
        risk_level: margin < 0 ? 'HIGH' : 'NORMAL',
        recommendation: margin < 0 ? 'Adjust production / procurement' : 'Within target',
        created_at: new Date().toISOString()
      };

      setForecasts([demoForecast, ...forecasts]);
      setShowForecastModal(false);
      setForecastForm({
        revenue: 0,
        cost: 0,
        delay_penalty: 0,
        rework_cost: 0
      });
    } catch (error) {
      console.error('포캐스트 실패:', error);
    }
  };

  const getRiskColor = (level: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800 border-red-300',
      NORMAL: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[level as keyof typeof colors] || colors.NORMAL;
  };

  const getRiskIcon = (level: string) => {
    const icons = {
      HIGH: <AlertTriangle className="w-5 h-5 text-red-600" />,
      NORMAL: <CheckCircle className="w-5 h-5 text-green-600" />
    };
    return icons[level as keyof typeof icons] || icons.NORMAL;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">포캐스팅</h1>
            <p className="text-sm text-gray-500">마진 예측 및 리스크 분석</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadForecasts}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForecastModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            새 예측
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">평균 수익</p>
              <p className="text-lg font-bold text-blue-900">
                {forecasts.length > 0 ? formatCurrency(forecasts.reduce((sum, f) => sum + f.revenue, 0) / forecasts.length) : '-'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">평균 비용</p>
              <p className="text-lg font-bold text-purple-900">
                {forecasts.length > 0 ? formatCurrency(forecasts.reduce((sum, f) => sum + f.cost, 0) / forecasts.length) : '-'}
              </p>
            </div>
            <Calculator className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">평균 마진</p>
              <p className="text-lg font-bold text-green-900">
                {forecasts.length > 0 ? formatCurrency(forecasts.reduce((sum, f) => sum + f.forecast_margin, 0) / forecasts.length) : '-'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">고위험 예측</p>
              <p className="text-2xl font-bold text-red-900">
                {forecasts.filter(f => f.risk_level === 'HIGH').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="권장사항 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">전체 리스크</option>
          {riskLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* 포캐스트 목록 */}
      <div className="space-y-3">
        {filteredForecasts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 예측 결과가 없습니다.</p>
          </div>
        ) : (
          filteredForecasts.map((forecast) => (
            <div
              key={forecast.id}
              className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${getRiskColor(forecast.risk_level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white rounded-lg">
                    {getRiskIcon(forecast.risk_level)}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">수익</p>
                        <p className="font-semibold text-blue-900">{formatCurrency(forecast.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">비용</p>
                        <p className="font-semibold text-purple-900">{formatCurrency(forecast.cost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">예상 마진</p>
                        <p className={`font-bold ${forecast.forecast_margin >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          {formatCurrency(forecast.forecast_margin)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">리스크 수준</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded bg-white/50 ${forecast.risk_level === 'HIGH' ? 'text-red-800' : 'text-green-800'}`}>
                          {forecast.risk_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">권장사항:</span>
                      <span className="text-sm text-gray-700">{forecast.recommendation}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(forecast.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedForecast(forecast)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 포캐스트 모달 */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 마진 예측</h2>
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수익 (원)</label>
                <input
                  type="number"
                  value={forecastForm.revenue}
                  onChange={(e) => setForecastForm({ ...forecastForm, revenue: parseFloat(e.target.value) || 0 })}
                  placeholder="1000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비용 (원)</label>
                <input
                  type="number"
                  value={forecastForm.cost}
                  onChange={(e) => setForecastForm({ ...forecastForm, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="600000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지연 벌금 (원)</label>
                <input
                  type="number"
                  value={forecastForm.delay_penalty}
                  onChange={(e) => setForecastForm({ ...forecastForm, delay_penalty: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재작업 비용 (원)</label>
                <input
                  type="number"
                  value={forecastForm.rework_cost}
                  onChange={(e) => setForecastForm({ ...forecastForm, rework_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {/* 미리보기 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">예상 마진</h3>
                <p className={`text-2xl font-bold ${(forecastForm.revenue - forecastForm.cost - forecastForm.delay_penalty - forecastForm.rework_cost) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(forecastForm.revenue - forecastForm.cost - forecastForm.delay_penalty - forecastForm.rework_cost)}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForecastModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleForecast}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                예측
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedForecast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">예측 상세</h2>
                <button
                  onClick={() => setSelectedForecast(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">수익</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedForecast.revenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">비용</p>
                  <p className="text-xl font-bold text-purple-900">{formatCurrency(selectedForecast.cost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">지연 벌금</p>
                  <p className="text-xl font-bold text-orange-900">{formatCurrency(selectedForecast.delay_penalty)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">재작업 비용</p>
                  <p className="text-xl font-bold text-red-900">{formatCurrency(selectedForecast.rework_cost)}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">예상 마진</p>
                <p className={`text-3xl font-bold ${selectedForecast.forecast_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedForecast.forecast_margin)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">리스크 수준</p>
                <span className={`px-3 py-1 text-lg font-bold rounded ${getRiskColor(selectedForecast.risk_level)}`}>
                  {selectedForecast.risk_level}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">권장사항</p>
                <p className="text-gray-900 font-medium">{selectedForecast.recommendation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">예측 시간</p>
                <p className="text-gray-900">{new Date(selectedForecast.created_at).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingManagement;
