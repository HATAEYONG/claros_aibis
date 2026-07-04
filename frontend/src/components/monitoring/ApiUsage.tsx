import React, { useState } from 'react';
import { ApiIcon, CalendarIcon, FilterIcon, DownloadIcon } from '@/components/icons/Icons';

interface ApiUsageData {
  endpoint: string;
  method: string;
  requests: number;
  successRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errors: number;
}

const ApiUsage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState<'requests' | 'responseTime' | 'errors'>('requests');

  const [apiData, setApiData] = useState<ApiUsageData[]>([
    {
      endpoint: '/api/dashboard/data',
      method: 'GET',
      requests: 15234,
      successRate: 99.8,
      avgResponseTime: 45,
      p95ResponseTime: 120,
      p99ResponseTime: 180,
      errors: 30
    },
    {
      endpoint: '/api/production/status',
      method: 'GET',
      requests: 12456,
      successRate: 99.5,
      avgResponseTime: 52,
      p95ResponseTime: 140,
      p99ResponseTime: 210,
      errors: 62
    },
    {
      endpoint: '/api/quality/checks',
      method: 'GET',
      requests: 8765,
      successRate: 99.9,
      avgResponseTime: 38,
      p95ResponseTime: 95,
      p99ResponseTime: 145,
      errors: 9
    },
    {
      endpoint: '/api/reports/generate',
      method: 'POST',
      requests: 2341,
      successRate: 98.2,
      avgResponseTime: 1240,
      p95ResponseTime: 2500,
      p99ResponseTime: 3500,
      errors: 42
    },
    {
      endpoint: '/api/auth/login',
      method: 'POST',
      requests: 5678,
      successRate: 99.1,
      avgResponseTime: 85,
      p95ResponseTime: 180,
      p99ResponseTime: 280,
      errors: 51
    },
    {
      endpoint: '/api/inventory/items',
      method: 'GET',
      requests: 9876,
      successRate: 99.7,
      avgResponseTime: 42,
      p95ResponseTime: 110,
      p99ResponseTime: 165,
      errors: 30
    },
    {
      endpoint: '/api/orders/create',
      method: 'POST',
      requests: 3456,
      successRate: 99.3,
      avgResponseTime: 156,
      p95ResponseTime: 320,
      p99ResponseTime: 450,
      errors: 24
    },
    {
      endpoint: '/api/agents/execute',
      method: 'POST',
      requests: 1234,
      successRate: 97.8,
      avgResponseTime: 3240,
      p95ResponseTime: 6500,
      p99ResponseTime: 9200,
      errors: 27
    }
  ]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PUT': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99) return 'text-green-600';
    if (rate >= 98) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPeriodLabel = (period: string) => {
    const labels = { hour: '시간', day: '일', week: '주', month: '월' };
    return labels[period as keyof typeof labels] || period;
  };

  const sortedData = [...apiData].sort((a, b) => {
    switch (sortBy) {
      case 'requests': return b.requests - a.requests;
      case 'responseTime': return b.p95ResponseTime - a.p95ResponseTime;
      case 'errors': return b.errors - a.errors;
      default: return 0;
    }
  });

  const totalRequests = apiData.reduce((sum, item) => sum + item.requests, 0);
  const avgSuccessRate = apiData.reduce((sum, item) => sum + item.successRate, 0) / apiData.length;
  const totalErrors = apiData.reduce((sum, item) => sum + item.errors, 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">API 사용 현황</h2>
          <p className="text-gray-600 mt-1">API 호출 통계와 성능 지표를 모니터링합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <DownloadIcon size={18} />
          내보내기
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="hour">최근 1시간</option>
            <option value="day">최근 24시간</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FilterIcon size={18} className="text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="requests">요청 수순</option>
            <option value="responseTime">응답 시간순</option>
            <option value="errors">오류 수순</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          기간: {getPeriodLabel(selectedPeriod)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 요청 수</p>
          <p className="text-2xl font-bold text-blue-700">{totalRequests.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">평균 성공률</p>
          <p className={`text-2xl font-bold ${getSuccessRateColor(avgSuccessRate)}`}>
            {avgSuccessRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-600 text-sm font-medium">평균 응답 시간</p>
          <p className="text-2xl font-bold text-yellow-700">
            {Math.round(apiData.reduce((sum, item) => sum + item.avgResponseTime, 0) / apiData.length)}ms
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600 text-sm font-medium">총 오류 수</p>
          <p className="text-2xl font-bold text-red-700">{totalErrors.toLocaleString()}</p>
        </div>
      </div>

      {/* API Usage Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">엔드포인트</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">메서드</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">요청 수</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">성공률</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">평균 응답</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">P95 응답</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">P99 응답</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">오류</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.endpoint}</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(item.method)}`}>
                    {item.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{item.requests.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${getSuccessRateColor(item.successRate)}`}>
                    {item.successRate.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={getResponseTimeColor(item.avgResponseTime)}>
                    {item.avgResponseTime}ms
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={getResponseTimeColor(item.p95ResponseTime)}>
                    {item.p95ResponseTime}ms
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={getResponseTimeColor(item.p99ResponseTime)}>
                    {item.p99ResponseTime}ms
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={item.errors > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {item.errors.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>&lt; 100ms (빠름)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>100-500ms (보통)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>&gt; 500ms (느림)</span>
        </div>
      </div>
    </div>
  );
};

export default ApiUsage;
