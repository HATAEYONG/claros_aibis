import React, { useState, useEffect } from 'react';

interface SalesData {
  period: string;
  statistics: {
    total_records: number;
    total_target: number;
    total_actual: number;
    avg_actual: number;
    avg_achievement_rate: number;
    total_new_customers: number;
    overall_achievement_rate: number;
    sales_change_rate: number;
  };
  monthly_data: Array<{
    year: number;
    month: number;
    target_amount: number;
    actual_amount: number;
    achievement_rate: number;
    new_customers: number;
    contract_rate: number;
    pipeline_value: number;
  }>;
  insights: string[];
}

const Metric: React.FC<{ label: string; value: string | number; change?: number; unit?: string }> = ({ label, value, change, unit = '' }) => {
  const changeClass = change === undefined ? '' : change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  const changeIcon = change === undefined ? '' : change > 0 ? '↑' : change < 0 ? '↓' : '→';

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <div className="text-right">
        <span className="font-semibold text-gray-800">{value}{unit}</span>
        {change !== undefined && (
          <span className={`ml-2 text-sm ${changeClass}`}>
            {changeIcon}{Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const SalesAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SalesData | null>(null);
  const [months, setMonths] = useState(3);

  const API_BASE = 'http://localhost:8000/api/local-analysis';

  useEffect(() => {
    loadData();
  }, [months]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sales/?months=${months}`);
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
          <h1 className="text-2xl font-bold text-gray-800">📈 매출 분석</h1>
          <p className="text-gray-600 text-sm mt-1">월별 매출 현황 및 목표 달성률 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>최근 3개월</option>
            <option value={6}>최근 6개월</option>
            <option value={12}>최근 12개월</option>
          </select>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            🔄 새로고침
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="총 실적" icon="💰">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(data.statistics.total_actual)}</p>
              <p className="text-sm text-gray-500 mt-1">목표: {formatNumber(data.statistics.total_target)}</p>
            </Card>
            <Card title="달성률" icon="🎯">
              <p className="text-3xl font-bold text-green-600">{formatPercent(data.statistics.overall_achievement_rate)}</p>
              <p className="text-sm text-gray-500 mt-1">평균: {formatPercent(data.statistics.avg_achievement_rate)}</p>
            </Card>
            <Card title="전월 대비" icon="📊">
              <p className={`text-3xl font-bold ${data.statistics.sales_change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(data.statistics.sales_change_rate)}
              </p>
              <p className="text-sm text-gray-500 mt-1">증감율</p>
            </Card>
            <Card title="신규 고객" icon="👥">
              <p className="text-3xl font-bold text-purple-600">{data.statistics.total_new_customers}명</p>
              <p className="text-sm text-gray-500 mt-1">{data.statistics.total_records}개월</p>
            </Card>
          </div>

          {/* Insights */}
          <Card title="💡 인사이트" icon="💡">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Trend Table */}
          <Card title="📅 월별 추세" icon="📅">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">년도</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">월</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">목표</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">실적</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">달성률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">신규 고객</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">계약률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">파이프라인</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly_data.map((month, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{month.year}</td>
                      <td className="px-4 py-3">{month.month}월</td>
                      <td className="px-4 py-3 text-right">{formatNumber(month.target_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(month.actual_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          month.achievement_rate >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {formatPercent(month.achievement_rate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{month.new_customers}명</td>
                      <td className="px-4 py-3 text-right">{formatPercent(month.contract_rate)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(month.pipeline_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Chart Placeholder */}
          <Card title="📊 매출 추세 차트" icon="📊">
            <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">차트 영역 (향후 구현 예정)</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default SalesAnalysis;
