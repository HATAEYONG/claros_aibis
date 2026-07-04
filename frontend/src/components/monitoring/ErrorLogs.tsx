import React, { useState } from 'react';
import { ErrorIcon, SearchIcon, FilterIcon, DownloadIcon, AlertTriangleIcon } from '@/components/icons/Icons';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  service: string;
  message: string;
  stackTrace?: string;
  user?: string;
  ip?: string;
  resolved: boolean;
  count: number;
}

const ErrorLogs: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([
    {
      id: '1',
      timestamp: '2026-03-31 10:23:45',
      level: 'critical',
      service: 'API Gateway',
      message: 'Database connection timeout',
      stackTrace: 'Error: Connection timeout\n    at Database.connect (/app/db.js:45)\n    at APIHandler.process (/app/api.js:123)',
      user: 'system',
      resolved: false,
      count: 15
    },
    {
      id: '2',
      timestamp: '2026-03-31 10:22:12',
      level: 'error',
      service: 'AI Service',
      message: 'LLM API rate limit exceeded',
      stackTrace: undefined,
      user: 'user@example.com',
      ip: '192.168.1.100',
      resolved: false,
      count: 3
    },
    {
      id: '3',
      timestamp: '2026-03-31 10:20:33',
      level: 'warning',
      service: 'Cache Service',
      message: 'Cache miss rate above threshold (65%)',
      stackTrace: undefined,
      user: 'system',
      resolved: false,
      count: 1
    },
    {
      id: '4',
      timestamp: '2026-03-31 10:18:56',
      level: 'error',
      service: 'Production Service',
      message: 'Failed to update production record',
      stackTrace: 'Error: Duplicate key violation\n    at ProductionRepository.update (/app/repo/production.js:78)',
      user: 'admin@example.com',
      ip: '192.168.1.50',
      resolved: true,
      count: 1
    },
    {
      id: '5',
      timestamp: '2026-03-31 10:15:22',
      level: 'critical',
      service: 'Auth Service',
      message: 'Authentication service unavailable',
      stackTrace: 'Error: Service health check failed\n    at AuthService.check (/app/auth.js:234)',
      user: 'system',
      resolved: true,
      count: 23
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const levels = ['all', 'critical', 'error', 'warning'];
  const services = ['all', ...Array.from(new Set(logs.map(l => l.service)))];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'error': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLevelLabel = (level: string) => {
    const labels = { critical: '심각', error: '오류', warning: '경고' };
    return labels[level as keyof typeof labels] || level;
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangleIcon size={18} className="text-red-600" />;
      case 'error': return <ErrorIcon size={18} className="text-orange-600" />;
      case 'warning': return <AlertTriangleIcon size={18} className="text-yellow-600" />;
      default: return <ErrorIcon size={18} className="text-gray-600" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesService = selectedService === 'all' || log.service === selectedService;
    const matchesResolved = showResolved || !log.resolved;
    return matchesSearch && matchesLevel && matchesService && matchesResolved;
  });

  const handleMarkResolved = (id: string) => {
    setLogs(logs.map(l =>
      l.id === id ? { ...l, resolved: true } : l
    ));
  };

  const handleMarkUnresolved = (id: string) => {
    setLogs(logs.map(l =>
      l.id === id ? { ...l, resolved: false } : l
    ));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">에러 로그</h2>
          <p className="text-gray-600 mt-1">시스템 오류와 예외를 추적하고 관리합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <DownloadIcon size={18} />
          내보내기
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">심각</p>
              <p className="text-2xl font-bold text-red-700">
                {logs.filter(l => l.level === 'critical').length}
              </p>
            </div>
            <AlertTriangleIcon size={32} className="text-red-500" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">오류</p>
              <p className="text-2xl font-bold text-orange-700">
                {logs.filter(l => l.level === 'error').length}
              </p>
            </div>
            <ErrorIcon size={32} className="text-orange-500" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">경고</p>
              <p className="text-2xl font-bold text-yellow-700">
                {logs.filter(l => l.level === 'warning').length}
              </p>
            </div>
            <AlertTriangleIcon size={32} className="text-yellow-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">해결됨</p>
              <p className="text-2xl font-bold text-green-700">
                {logs.filter(l => l.resolved).length}
              </p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {levels.map(level => (
            <option key={level} value={level}>
              {level === 'all' ? '전체 레벨' : getLevelLabel(level)}
            </option>
          ))}
        </select>

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {services.map(service => (
            <option key={service} value={service}>
              {service === 'all' ? '전체 서비스' : service}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm">해결됨 표시</span>
        </label>
      </div>

      {/* Error Logs List */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              log.resolved ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                {getLevelIcon(log.level)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {getLevelLabel(log.level)}
                    </span>
                    <span className="font-semibold text-gray-800">{log.service}</span>
                    {log.resolved && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        해결됨
                      </span>
                    )}
                    {log.count > 1 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {log.count}회 발생
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800">{log.message}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>🕐 {log.timestamp}</span>
                    {log.user && <span>👤 {log.user}</span>}
                    {log.ip && <span>🌐 {log.ip}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLog(log)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  상세
                </button>
                {log.resolved ? (
                  <button
                    onClick={() => handleMarkUnresolved(log.id)}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    미해결
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkResolved(log.id)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    해결
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ErrorIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">에러 상세 정보</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">레벨</label>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getLevelColor(selectedLog.level)}`}>
                  {getLevelLabel(selectedLog.level)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">서비스</label>
                <p className="text-gray-800 mt-1">{selectedLog.service}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">메시지</label>
                <p className="text-gray-800 mt-1">{selectedLog.message}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">발생 시간</label>
                <p className="text-gray-800 mt-1">{selectedLog.timestamp}</p>
              </div>

              {selectedLog.user && (
                <div>
                  <label className="text-sm font-medium text-gray-700">사용자</label>
                  <p className="text-gray-800 mt-1">{selectedLog.user}</p>
                </div>
              )}

              {selectedLog.ip && (
                <div>
                  <label className="text-sm font-medium text-gray-700">IP 주소</label>
                  <p className="text-gray-800 mt-1">{selectedLog.ip}</p>
                </div>
              )}

              {selectedLog.stackTrace && (
                <div>
                  <label className="text-sm font-medium text-gray-700">스택 트레이스</label>
                  <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">상태</label>
                <p className="text-gray-800 mt-1">
                  {selectedLog.resolved ? '해결됨 ✅' : '미해결 ⚠️'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                닫기
              </button>
              {!selectedLog.resolved && (
                <button
                  onClick={() => {
                    handleMarkResolved(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  해결 표시
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogs;
