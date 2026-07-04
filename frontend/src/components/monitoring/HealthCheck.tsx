import React, { useState, useEffect } from 'react';
import { FavoriteIcon, RefreshIcon, CheckIcon, ErrorIcon, AlertIcon } from '@/components/icons/Icons';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
  uptime: number;
  description: string;
}

const HealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthStatus[]>([
    {
      service: '데이터베이스',
      status: 'healthy',
      responseTime: 12,
      lastCheck: new Date().toLocaleString(),
      uptime: 99.95,
      description: 'PostgreSQL 연결 정상'
    },
    {
      service: '캐시 서버',
      status: 'healthy',
      responseTime: 2,
      lastCheck: new Date().toLocaleString(),
      uptime: 99.99,
      description: 'Redis 연결 정상'
    },
    {
      service: 'API 서버',
      status: 'healthy',
      responseTime: 45,
      lastCheck: new Date().toLocaleString(),
      uptime: 99.90,
      description: '백엔드 API 서비스 정상'
    },
    {
      service: '디스크 공간',
      status: 'degraded',
      responseTime: 0,
      lastCheck: new Date().toLocaleString(),
      uptime: 100,
      description: '사용량 89.5% - 주의 필요'
    },
    {
      service: '메모리',
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date().toLocaleString(),
      uptime: 100,
      description: '사용량 62.3%'
    }
  ]);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(() => {
        // Simulate health check
        setHealthData(prev => prev.map(item => ({
          ...item,
          lastCheck: new Date().toLocaleString(),
          responseTime: item.service === '데이터베이스' ? Math.floor(Math.random() * 20) + 5 :
                        item.service === '캐시 서버' ? Math.floor(Math.random() * 5) + 1 :
                        item.service === 'API 서버' ? Math.floor(Math.random() * 50) + 20 : 0
        })));
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckIcon size={24} className="text-green-600" />;
      case 'degraded': return <AlertIcon size={24} className="text-yellow-600" />;
      case 'down': return <ErrorIcon size={24} className="text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'down': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return '정상';
      case 'degraded': return '주의';
      case 'down': return '다운';
      default: return status;
    }
  };

  const getOverallStatus = () => {
    const hasDown = healthData.some(h => h.status === 'down');
    const hasDegraded = healthData.some(h => h.status === 'degraded');

    if (hasDown) return { status: 'down', label: '서비스 장애', color: 'bg-red-600' };
    if (hasDegraded) return { status: 'degraded', label: '부분적 이상', color: 'bg-yellow-600' };
    return { status: 'healthy', label: '모든 시스템 정상', color: 'bg-green-600' };
  };

  const overallStatus = getOverallStatus();

  const handleRefresh = () => {
    // Simulate refresh
    setHealthData(prev => prev.map(item => ({
      ...item,
      lastCheck: new Date().toLocaleString()
    })));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">시스템 헬스 체크</h2>
          <p className="text-gray-600 mt-1">시스템 구성 요소의 상태를 실시간으로 모니터링합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={3000}>3초</option>
            <option value={5000}>5초</option>
            <option value={10000}>10초</option>
            <option value={30000}>30초</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshIcon size={18} className={autoRefresh ? 'animate-spin' : ''} />
            자동 새로고침
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshIcon size={18} />
            지금 확인
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`${overallStatus.color} text-white rounded-lg p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <FavoriteIcon size={32} />
          <div>
            <h3 className="text-xl font-bold">{overallStatus.label}</h3>
            <p className="text-sm opacity-90">마지막 확인: {healthData[0]?.lastCheck}</p>
          </div>
        </div>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthData.map((item, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getStatusColor(item.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(item.status)}
                  <h4 className="text-lg font-semibold">{item.service}</h4>
                </div>
                <p className="text-sm opacity-75">{item.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">상태:</span>
                <span>{getStatusLabel(item.status)}</span>
              </div>
              {item.responseTime > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium">응답 시간:</span>
                  <span>{item.responseTime}ms</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">가동 시간:</span>
                <span>{item.uptime}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">마지막 확인:</span>
                <span className="text-xs">{item.lastCheck}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">정상</p>
              <p className="text-2xl font-bold text-green-700">
                {healthData.filter(h => h.status === 'healthy').length}
              </p>
            </div>
            <CheckIcon size={32} className="text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">주의</p>
              <p className="text-2xl font-bold text-yellow-700">
                {healthData.filter(h => h.status === 'degraded').length}
              </p>
            </div>
            <AlertIcon size={32} className="text-yellow-500" />
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">다운</p>
              <p className="text-2xl font-bold text-red-700">
                {healthData.filter(h => h.status === 'down').length}
              </p>
            </div>
            <ErrorIcon size={32} className="text-red-500" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">평균 가동률</p>
              <p className="text-2xl font-bold text-blue-700">
                {(healthData.reduce((sum, h) => sum + h.uptime, 0) / healthData.length).toFixed(2)}%
              </p>
            </div>
            <FavoriteIcon size={32} className="text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;
