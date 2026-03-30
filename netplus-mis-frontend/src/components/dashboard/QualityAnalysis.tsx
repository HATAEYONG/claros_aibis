import React, { useState, useEffect } from 'react';

interface QualityData {
  period: string;
  statistics: {
    total_inspections: number;
    total_sampled: number;
    total_defects: number;
    avg_defect_rate: number;
    pass_count: number;
    fail_count: number;
    conditional_count: number;
    pass_rate: number;
    fail_rate: number;
  };
  product_quality: Array<{
    product_name: string;
    inspection_count: number;
    total_sampled: number;
    total_defects: number;
    avg_defect_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    inspection_count: number;
    avg_defect_rate: number;
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

const QualityAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QualityData | null>(null);
  const [days, setDays] = useState(90);

  const API_BASE = 'http://localhost:8000/api/local-analysis';

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/quality/?days=${days}`);
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
          <h1 className="text-2xl font-bold text-gray-800">✅ 품질 분석</h1>
          <p className="text-gray-600 text-sm mt-1">검사 현황, 불량률, 합격률 분석</p>
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
            <Card title="검사 횟수" icon="🔍">
              <p className="text-3xl font-bold text-blue-600">{data.statistics.total_inspections}회</p>
              <p className="text-sm text-gray-500 mt-1">{data.period}</p>
            </Card>
            <Card title="검사 수량" icon="📦">
              <p className="text-3xl font-bold text-purple-600">{formatNumber(data.statistics.total_sampled)}</p>
            </Card>
            <Card title="불량 수" icon="⚠️">
              <p className="text-3xl font-bold text-orange-600">{data.statistics.total_defects}개</p>
            </Card>
            <Card title="평균 불량률" icon="📊">
              <p className="text-3xl font-bold text-red-600">{formatPercent(data.statistics.avg_defect_rate)}</p>
            </Card>
            <Card title="합격률" icon="✅">
              <p className="text-3xl font-bold text-green-600">{formatPercent(data.statistics.pass_rate)}</p>
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

          {/* Product Quality Ranking */}
          <Card title="🏭 제품별 불량률 TOP 10" icon="🏭">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">순위</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">제품명</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">검사 횟수</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">검사 수량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량률</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {data.product_quality.map((product, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{product.product_name}</td>
                      <td className="px-4 py-3 text-right">{product.inspection_count}회</td>
                      <td className="px-4 py-3 text-right">{formatNumber(product.total_sampled)}</td>
                      <td className="px-4 py-3 text-right">{product.total_defects}개</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.avg_defect_rate > 1 ? 'bg-red-100 text-red-700' : product.avg_defect_rate > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {formatPercent(product.avg_defect_rate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.avg_defect_rate > 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {product.avg_defect_rate > 1 ? '개선필요' : '양호'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daily Trend */}
          <Card title="📅 일별 불량률 추세" icon="📅">
            <div className="h-64 overflow-x-auto">
              <div className="flex items-end gap-1 min-w-max">
                {data.daily_trend.slice(0, 30).reverse().map((day, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="w-6 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{
                        height: `${Math.min(day.avg_defect_rate * 30, 200)}px`,
                        minHeight: '4px'
                      }}
                      title={`${day.date}: ${day.avg_defect_rate.toFixed(2)}%`}
                    />
                    <span className="text-xs text-gray-500">
                      {day.date.substring(5).replace('-', '/')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div> 높음 (>1%)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div> 보통 (0.5-1%)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div> 양호 (<0.5%)
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default QualityAnalysis;
