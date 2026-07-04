import React, { useState, useEffect } from 'react';
import { SyncIcon, RefreshIcon, ClockIcon, CheckIcon, ErrorIcon } from '@/components/icons/Icons';

interface SyncLog {
  id: string;
  system: string;
  type: 'full' | 'incremental';
  status: 'success' | 'failed' | 'in_progress' | 'pending';
  startTime: string;
  endTime?: string;
  recordCount: number;
  errorMessage?: string;
}

const SyncStatus: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      id: '1',
      system: 'SAP ERP',
      type: 'incremental',
      status: 'success',
      startTime: '2026-03-31 10:30:00',
      endTime: '2026-03-31 10:30:45',
      recordCount: 1523
    },
    {
      id: '2',
      system: 'Salesforce CRM',
      type: 'incremental',
      status: 'in_progress',
      startTime: '2026-03-31 10:25:00',
      recordCount: 0
    },
    {
      id: '3',
      system: 'MES 시스템',
      type: 'full',
      status: 'failed',
      startTime: '2026-03-31 09:00:00',
      endTime: '2026-03-31 09:05:23',
      recordCount: 0,
      errorMessage: 'Connection timeout'
    },
    {
      id: '4',
      system: 'SAP ERP',
      type: 'full',
      status: 'success',
      startTime: '2026-03-31 06:00:00',
      endTime: '2026-03-31 06:15:32',
      recordCount: 45678
    }
  ]);

  const [autoRefresh, setAutoRefresh] = useState(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon size={20} className="text-green-600" />;
      case 'failed': return <ErrorIcon size={20} className="text-red-600" />;
      case 'in_progress': return <SyncIcon size={20} className="text-blue-600 animate-spin" />;
      case 'pending': return <ClockIcon size={20} className="text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return '성공';
      case 'failed': return '실패';
      case 'in_progress': return '진행중';
      case 'pending': return '대기중';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'full' ? '전체 동기화' : '증분 동기화';
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (diff < 60) return `${diff}초`;
    return `${Math.floor(diff / 60)}분 ${diff % 60}초`;
  };

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Refreshing sync status...');
  };

  const handleSyncNow = (system: string) => {
    // Simulate sync trigger
    console.log(`Triggering sync for ${system}...`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">데이터 동기화 현황</h2>
          <p className="text-gray-600 mt-1">외부 시스템과의 데이터 동기화 상태를 모니터링합니다</p>
        </div>
        <div className="flex gap-3">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">성공</p>
              <p className="text-2xl font-bold text-green-700">
                {syncLogs.filter(l => l.status === 'success').length}
              </p>
            </div>
            <CheckIcon size={32} className="text-green-500" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">진행중</p>
              <p className="text-2xl font-bold text-blue-700">
                {syncLogs.filter(l => l.status === 'in_progress').length}
              </p>
            </div>
            <SyncIcon size={32} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">실패</p>
              <p className="text-2xl font-bold text-red-700">
                {syncLogs.filter(l => l.status === 'failed').length}
              </p>
            </div>
            <ErrorIcon size={32} className="text-red-500" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">총 레코드</p>
              <p className="text-2xl font-bold text-gray-700">
                {syncLogs.reduce((sum, log) => sum + log.recordCount, 0).toLocaleString()}
              </p>
            </div>
            <ClockIcon size={32} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">시스템</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">유형</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">상태</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">시작 시간</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">소요 시간</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">레코드 수</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {syncLogs.map(log => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-800">{log.system}</div>
                  {log.errorMessage && (
                    <div className="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">{getTypeLabel(log.type)}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{log.startTime}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {calculateDuration(log.startTime, log.endTime)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {log.recordCount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleSyncNow(log.system)}
                    disabled={log.status === 'in_progress'}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    지금 동기화
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncStatus;
