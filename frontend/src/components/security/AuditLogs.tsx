import React, { useState } from 'react';
import { HistoryIcon, SearchIcon, FilterIcon, DownloadIcon } from '@/components/icons/Icons';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
  status: 'success' | 'failed';
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2026-03-31 10:25:33',
      user: 'admin@example.com',
      action: 'user.update',
      resource: '사용자',
      details: '사용자 정보 수정 (ID: user123)',
      ip: '192.168.1.50',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2026-03-31 10:24:15',
      user: 'system',
      action: 'data.export',
      resource: '데이터',
      details: '생산 데이터 내보내기 실행',
      ip: 'localhost',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2026-03-31 10:23:42',
      user: 'user@example.com',
      action: 'report.generate',
      resource: '리포트',
      details: '월간 품질 리포트 생성',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '4',
      timestamp: '2026-03-31 10:22:18',
      user: 'unknown@example.com',
      action: 'login.attempt',
      resource: '인증',
      details: '로그인 시도 - 비밀번호 불일치',
      ip: '203.0.113.45',
      status: 'failed'
    },
    {
      id: '5',
      timestamp: '2026-03-31 10:21:05',
      user: 'admin@example.com',
      action: 'settings.update',
      resource: '설정',
      details: '시스템 설정 변경 (알림 Threshold)',
      ip: '192.168.1.50',
      status: 'success'
    },
    {
      id: '6',
      timestamp: '2026-03-31 10:20:33',
      user: 'manager@example.com',
      action: 'production.update',
      resource: '생산',
      details: '생산 계획 수정 (Plan-2026-03-001)',
      ip: '192.168.1.75',
      status: 'success'
    },
    {
      id: '7',
      timestamp: '2026-03-31 10:19:22',
      user: 'system',
      action: 'cache.clear',
      resource: '캐시',
      details: '데이터 캐시 자동 정리',
      ip: 'localhost',
      status: 'success'
    },
    {
      id: '8',
      timestamp: '2026-03-31 10:18:10',
      user: 'user@example.com',
      action: 'api.call',
      resource: 'API',
      details: '외부 API 호출 (ERP 동기화)',
      ip: '192.168.1.100',
      status: 'success'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const actions = ['all', ...Array.from(new Set(logs.map(l => l.action.split('.')[0])))];
  const actionLabels: Record<string, string> = {
    all: '전체',
    user: '사용자',
    data: '데이터',
    report: '리포트',
    login: '인증',
    settings: '설정',
    production: '생산',
    cache: '캐시',
    api: 'API'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = { success: '성공', failed: '실패' };
    return labels[status as keyof typeof labels] || status;
  };

  const getActionColor = (action: string) => {
    const actionType = action.split('.')[0];
    switch (actionType) {
      case 'user': return 'bg-blue-100 text-blue-700';
      case 'data': return 'bg-purple-100 text-purple-700';
      case 'report': return 'bg-green-100 text-green-700';
      case 'login': return 'bg-orange-100 text-orange-700';
      case 'settings': return 'bg-gray-100 text-gray-700';
      case 'production': return 'bg-yellow-100 text-yellow-700';
      case 'cache': return 'bg-pink-100 text-pink-700';
      case 'api': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.action.startsWith(selectedAction);
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const uniqueUsers = new Set(logs.map(l => l.user)).size;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">감사 로그</h2>
          <p className="text-gray-600 mt-1">시스템의 모든 활동을 추적하고 기록합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <DownloadIcon size={18} />
          내보내기
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 기록</p>
          <p className="text-2xl font-bold text-blue-700">{logs.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">성공</p>
          <p className="text-2xl font-bold text-green-700">{successCount}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600 text-sm font-medium">실패</p>
          <p className="text-2xl font-bold text-red-700">{failedCount}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-600 text-sm font-medium">활성 사용자</p>
          <p className="text-2xl font-bold text-purple-700">{uniqueUsers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="사용자, 작업, 리소스 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {actions.map(action => (
            <option key={action} value={action}>{actionLabels[action] || action}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">전체 상태</option>
          <option value="success">성공</option>
          <option value="failed">실패</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">시간</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">사용자</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">리소스</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상세</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{log.timestamp}</td>
                <td className="px-4 py-3 text-sm font-medium">{log.user}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{log.resource}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.ip}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                    {getStatusLabel(log.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <HistoryIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
