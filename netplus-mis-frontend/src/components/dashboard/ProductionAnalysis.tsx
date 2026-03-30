import React, { useState, useEffect } from 'react';

interface ProductionData {
  period: string;
  statistics: {
    total_records: number;
    total_target: number;
    total_produced: number;
    total_defective: number;
    avg_efficiency: number;
    defect_rate: number;
    overall_achievement_rate: number;
  };
  line_performance: Array<{
    line_id: number;
    line_name: string;
    record_count: number;
    total_produced: number;
    avg_efficiency: number;
    avg_achievement_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    actual_quantity: number;
    defect_quantity: number;
    efficiency: number;
  }>;
  insights: string[];
}

const Metric: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit = '' }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="font-semibold text-gray-800">{value}{unit}</span>
  </div>
);

const Card: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const ProductionAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductionData | null>(null);
  const [days, setDays] = useState(90);

  const API_BASE = 'http://localhost:8000/api/local-analysis';

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/production/?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '만';
    if (num >= 1000) return (num / 1000).toFixed(1) + '천';
    return num.toLocaleString();
  };

  const formatPercent = (num: number): string => num.toFixed(1) + '%';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold">❌ 오류 발생</p>
        <p className="text-sm mt-2">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏭 생산 분석</h1>
          <p className="text-gray-600 text-sm mt-1">생산량, 효율, 불량률, 라인별 성과 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>최근 30일</option>
            <option value={60}>최근 60일</option>
            <option value={90}>최근 90일</option>
            <option value={180}>최근 180일</option>
          </select>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            🔄 새로고침
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card title="생산량" icon="📦">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(data.statistics.total_produced)}</p>
              <p className="text-sm text-gray-500 mt-1">목표: {formatNumber(data.statistics.total_target)}</p>
            </Card>
            <Card title="달성률" icon="🎯">
              <p className="text-3xl font-bold text-green-600">{formatPercent(data.statistics.overall_achievement_rate)}</p>
            </Card>
            <Card title="평균 효율" icon="⚡">
              <p className="text-3xl font-bold text-purple-600">{formatPercent(data.statistics.avg_efficiency)}</p>
            </Card>
            <Card title="불량률" icon="⚠️">
              <p className="text-3xl font-bold text-orange-600">{formatPercent(data.statistics.defect_rate)}</p>
            </Card>
            <Card title="불량 수" icon="❌">
              <p className="text-3xl font-bold text-red-600">{formatNumber(data.statistics.total_defective)}개</p>
            </Card>
          </div>

          {/* Insights */}
          <Card title="💡 인사이트" icon="💡">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* Line Performance */}
          <Card title="🏭 라인별 생산 현황" icon="🏭">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">순위</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">라인명</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">생산량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">평균 효율</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">달성률</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">등급</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_performance.map((line, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{line.line_name}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(line.total_produced)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          line.avg_efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          line.avg_efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {formatPercent(line.avg_efficiency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPercent(line.avg_achievement_rate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          line.avg_efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          line.avg_efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {line.avg_efficiency >= 95 ? '우수' : line.avg_efficiency >= 90 ? '양호' : '개선'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daily Trend */}
          <Card title="📅 일별 생산 추세 (최근 30일)" icon="📅">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">날짜</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">생산량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">효율</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily_trend.slice(0, 30).map((day, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{day.date}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(day.actual_quantity)}</td>
                      <td className="px-4 py-3 text-right">{day.defect_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs ${
                          (day.defect_quantity / day.actual_quantity * 100) > 2 ? 'text-red-600' :
                          (day.defect_quantity / day.actual_quantity * 100) > 1 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {((day.defect_quantity / day.actual_quantity) * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPercent(day.efficiency)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          day.efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          day.efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {day.efficiency >= 95 ? '우수' : day.efficiency >= 90 ? '양호' : '주의'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductionAnalysis;
