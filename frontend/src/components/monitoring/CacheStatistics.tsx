import React, { useState } from 'react';
import { StorageIcon, RefreshIcon, TrashIcon, DownloadIcon } from '@/components/icons/Icons';

interface CacheStats {
  name: string;
  type: 'redis' | 'memcached' | 'memory';
  hitRate: number;
  missRate: number;
  keys: number;
  memory: number;
  memoryUnit: string;
  eviction: number;
  connections: number;
  uptime: string;
}

const CacheStatistics: React.FC = () => {
  const [stats, setStats] = useState<CacheStats[]>([
    {
      name: '세션 캐시',
      type: 'redis',
      hitRate: 94.5,
      missRate: 5.5,
      keys: 15234,
      memory: 245.6,
      memoryUnit: 'MB',
      eviction: 123,
      connections: 45,
      uptime: '15d 8h 32m'
    },
    {
      name: '데이터 캐시',
      type: 'redis',
      hitRate: 91.2,
      missRate: 8.8,
      keys: 45678,
      memory: 512.3,
      memoryUnit: 'MB',
      eviction: 456,
      connections: 67,
      uptime: '15d 8h 32m'
    },
    {
      name: 'API 캐시',
      type: 'memcached',
      hitRate: 88.7,
      missRate: 11.3,
      keys: 8765,
      memory: 128.9,
      memoryUnit: 'MB',
      eviction: 89,
      connections: 23,
      uptime: '12d 4h 15m'
    },
    {
      name: '로컬 캐시',
      type: 'memory',
      hitRate: 96.8,
      missRate: 3.2,
      keys: 2341,
      memory: 45.2,
      memoryUnit: 'MB',
      eviction: 12,
      connections: 0,
      uptime: '2h 15m'
    }
  ]);

  const [selectedCache, setSelectedCache] = useState<CacheStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'redis': return 'bg-red-100 text-red-700';
      case 'memcached': return 'bg-blue-100 text-blue-700';
      case 'memory': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = { redis: 'Redis', memcached: 'Memcached', memory: 'Memory' };
    return labels[type as keyof typeof labels] || type;
  };

  const getHitRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalKeys = stats.reduce((sum, s) => sum + s.keys, 0);
  const totalMemory = stats.reduce((sum, s) =>
    sum + (s.memoryUnit === 'MB' ? s.memory : s.memory / 1024), 0
  );
  const avgHitRate = stats.reduce((sum, s) => sum + s.hitRate, 0) / stats.length;

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Refreshing cache statistics...');
  };

  const handleClearCache = (name: string) => {
    if (confirm(`정말 ${name}를 비우시겠습니까?`)) {
      alert(`${name}가 비워졌습니다.`);
    }
  };

  const handleFlushAll = () => {
    if (confirm('정말 모든 캐시를 비우시겠습니까?')) {
      alert('모든 캐시가 비워졌습니다.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">캐시 통계</h2>
          <p className="text-gray-600 mt-1">캐시 성능과 사용량을 모니터링합니다</p>
        </div>
        <div className="flex gap-2">
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
            새로고침
          </button>
          <button
            onClick={handleFlushAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <TrashIcon size={18} />
            전체 비우기
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 키 수</p>
          <p className="text-2xl font-bold text-blue-700">{totalKeys.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">평균 적중률</p>
          <p className={`text-2xl font-bold ${getHitRateColor(avgHitRate)}`}>
            {avgHitRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-600 text-sm font-medium">총 메모리</p>
          <p className="text-2xl font-bold text-purple-700">{totalMemory.toFixed(1)} MB</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium">총 연결 수</p>
          <p className="text-2xl font-bold text-orange-700">
            {stats.reduce((sum, s) => sum + s.connections, 0)}
          </p>
        </div>
      </div>

      {/* Cache Statistics Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">캐시 이름</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">유형</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">키 수</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">적중률</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">미스률</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">메모리</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">추방</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">연결</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">가동 시간</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
              <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StorageIcon size={18} className="text-gray-600" />
                    <span className="font-medium">{stat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(stat.type)}`}>
                    {getTypeLabel(stat.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{stat.keys.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${getHitRateColor(stat.hitRate)}`}>
                    {stat.hitRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-red-600">{stat.missRate.toFixed(1)}%</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {stat.memory.toFixed(1)} {stat.memoryUnit}
                </td>
                <td className="px-4 py-3 text-right text-orange-600">
                  {stat.eviction.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {stat.connections > 0 ? stat.connections : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{stat.uptime}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedCache(stat)}
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-1"
                  >
                    상세
                  </button>
                  <button
                    onClick={() => handleClearCache(stat.name)}
                    className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    비우기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Tips */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <StorageIcon size={18} />
          캐시 최적화 팁
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 적중률이 90% 미만인 경우 캐시 전략을 재검토하세요</li>
          <li>• 추방이 발생하면 캐시 크기를 늘리거나 만료 정책을 조정하세요</li>
          <li>• 메모리 사용량이 80%를 초과하면 캐시 정리를 고려하세요</li>
          <li>• 세션 캐시는 24시간 이상 만료되지 않도록 설정하세요</li>
        </ul>
      </div>

      {/* Cache Detail Modal */}
      {selectedCache && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedCache.name} 상세 정보</h3>
              <button
                onClick={() => setSelectedCache(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">유형</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedCache.type)}`}>
                  {getTypeLabel(selectedCache.type)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">적중률</span>
                <span className={`font-semibold ${getHitRateColor(selectedCache.hitRate)}`}>
                  {selectedCache.hitRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">키 수</span>
                <span className="font-semibold">{selectedCache.keys.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">메모리 사용</span>
                <span className="font-semibold">
                  {selectedCache.memory.toFixed(2)} {selectedCache.memoryUnit}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">추방 수</span>
                <span className="font-semibold text-orange-600">
                  {selectedCache.eviction.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">연결 수</span>
                <span className="font-semibold">
                  {selectedCache.connections > 0 ? selectedCache.connections : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">가동 시간</span>
                <span className="font-semibold">{selectedCache.uptime}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedCache(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleClearCache(selectedCache.name);
                  setSelectedCache(null);
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                캐시 비우기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatistics;
