import React, { useState } from 'react';
import { SpeedIcon, TrendUpIcon, TrendDownIcon, ActivityIcon } from '@/components/icons/Icons';

interface MetricData {
  name: string;
  current: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold?: {
    warning: number;
    critical: number;
  };
}

const PerformanceMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      name: 'CPU 사용률',
      current: 62.3,
      previous: 58.7,
      unit: '%',
      trend: 'up',
      threshold: { warning: 70, critical: 85 }
    },
    {
      name: '메모리 사용률',
      current: 65.8,
      previous: 64.2,
      unit: '%',
      trend: 'up',
      threshold: { warning: 75, critical: 90 }
    },
    {
      name: '디스크 I/O',
      current: 234,
      previous: 189,
      unit: 'MB/s',
      trend: 'up',
      threshold: { warning: 400, critical: 600 }
    },
    {
      name: '네트워크 사용량',
      current: 125.6,
      previous: 132.4,
      unit: 'Mbps',
      trend: 'down',
      threshold: { warning: 500, critical: 800 }
    },
    {
      name: '응답 시간 (P50)',
      current: 45,
      previous: 48,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 100, critical: 200 }
    },
    {
      name: '응답 시간 (P95)',
      current: 156,
      previous: 162,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 300, critical: 500 }
    },
    {
      name: '응답 시간 (P99)',
      current: 289,
      previous: 295,
      unit: 'ms',
      trend: 'down',
      threshold: { warning: 500, critical: 1000 }
    },
    {
      name: '처리량',
      current: 1234,
      previous: 1198,
      unit: 'req/s',
      trend: 'up',
      threshold: { warning: 800, critical: 500 }
    }
  ]);

  const getStatus = (metric: MetricData) => {
    if (!metric.threshold) return 'normal';
    if (metric.current >= metric.threshold.critical) return 'critical';
    if (metric.current >= metric.threshold.warning) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      default: return '🟢';
    }
  };

  const getTrendIcon = (trend: string, isGood: boolean) => {
    if (trend === 'stable') return null;
    const Icon = trend === 'up' ? TrendUpIcon : TrendDownIcon;
    return <Icon size={16} className={isGood ? 'text-green-600' : 'text-red-600'} />;
  };

  const calculateChange = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const isTrendGood = (metric: MetricData) => {
    const change = parseFloat(calculateChange(metric.current, metric.previous));
    // For metrics where lower is better (response times), negative change is good
    if (metric.name.includes('응답 시간')) {
      return change < 0;
    }
    // For metrics where higher is better (throughput), positive change is good
    if (metric.name.includes('처리량')) {
      return change > 0;
    }
    // For usage metrics, lower change or stable is good
    return change <= 5;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">성능 메트릭</h2>
          <p className="text-gray-600 mt-1">시스템 성능 지표를 실시간으로 모니터링합니다</p>
        </div>
        <div className="flex gap-2">
          {(['1h', '6h', '24h', '7d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7일' : range === '1h' ? '1시간' : range === '6h' ? '6시간' : '24시간'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">정상</p>
              <p className="text-2xl font-bold text-green-700">
                {metrics.filter(m => getStatus(m) === 'normal').length}
              </p>
            </div>
            <span className="text-3xl">🟢</span>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">주의</p>
              <p className="text-2xl font-bold text-yellow-700">
                {metrics.filter(m => getStatus(m) === 'warning').length}
              </p>
            </div>
            <span className="text-3xl">🟡</span>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">심각</p>
              <p className="text-2xl font-bold text-red-700">
                {metrics.filter(m => getStatus(m) === 'critical').length}
              </p>
            </div>
            <span className="text-3xl">🔴</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">기간</p>
              <p className="text-2xl font-bold text-blue-700">
                {timeRange === '7d' ? '7일' : timeRange === '1h' ? '1시간' : timeRange === '6h' ? '6시간' : '24시간'}
              </p>
            </div>
            <ActivityIcon size={32} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const status = getStatus(metric);
          const change = calculateChange(metric.current, metric.previous);
          const trendGood = isTrendGood(metric);

          return (
            <div
              key={index}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getStatusColor(status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getStatusIcon(status)}</span>
                  <h3 className="font-semibold text-gray-800">{metric.name}</h3>
                </div>
                <SpeedIcon size={20} className="text-gray-600" />
              </div>

              <div className="mb-3">
                <p className="text-3xl font-bold text-gray-800">
                  {metric.current.toLocaleString()}
                  <span className="text-lg text-gray-600 ml-1">{metric.unit}</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend, trendGood)}
                  <span className={trendGood ? 'text-green-600' : 'text-red-600'}>
                    {metric.trend === 'up' ? '+' : ''}{change}%
                  </span>
                  <span className="text-gray-600">vs 이전</span>
                </div>

                {metric.threshold && (
                  <div className="text-xs text-gray-600">
                    <div>경고: {metric.threshold.warning}{metric.unit}</div>
                    <div>심각: {metric.threshold.critical}{metric.unit}</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {metric.threshold && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        status === 'critical' ? 'bg-red-500' :
                        status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((metric.current / metric.threshold.critical) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <ActivityIcon size={18} />
          성능 최적화 팁
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• CPU 사용률이 70% 이상인 경우 서버 증설을 고려하세요</li>
          <li>• 메모리 사용률이 지속적으로 80% 이상이면 메모리 누수를 확인하세요</li>
          <li>• P95 응답 시간이 300ms를 초과하면 쿼리 최적화를 검토하세요</li>
          <li>• 처리량이 급감하는 경우 장애 발생을 확인하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
