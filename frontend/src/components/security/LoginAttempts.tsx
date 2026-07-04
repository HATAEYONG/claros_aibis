import React, { useState } from 'react';
import { LoginIcon, SearchIcon, CalendarIcon, BlockIcon } from '@/components/icons/Icons';

interface LoginAttempt {
  id: string;
  timestamp: string;
  username: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

const LoginAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([
    {
      id: '1',
      timestamp: '2026-03-31 10:25:45',
      username: 'admin@example.com',
      ip: '192.168.1.50',
      location: '서울, 대한민국',
      device: 'Desktop',
      browser: 'Chrome 120',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2026-03-31 10:24:33',
      username: 'unknown@example.com',
      ip: '203.0.113.45',
      location: 'Unknown',
      device: 'Desktop',
      browser: 'Firefox 115',
      status: 'failed',
      failureReason: '비밀번호 불일치'
    },
    {
      id: '3',
      timestamp: '2026-03-31 10:23:12',
      username: 'user@example.com',
      ip: '192.168.1.100',
      location: '부산, 대한민국',
      device: 'Mobile',
      browser: 'Safari 17',
      status: 'success'
    },
    {
      id: '4',
      timestamp: '2026-03-31 10:22:05',
      username: 'attacker@evil.com',
      ip: '198.51.100.23',
      location: 'Moscow, Russia',
      device: 'Desktop',
      browser: 'Chrome 119',
      status: 'failed',
      failureReason: '계정 없음'
    },
    {
      id: '5',
      timestamp: '2026-03-31 10:20:18',
      username: 'manager@example.com',
      ip: '192.168.1.75',
      location: '서울, 대한민국',
      device: 'Tablet',
      browser: 'Chrome 120',
      status: 'success'
    },
    {
      id: '6',
      timestamp: '2026-03-31 10:18:42',
      username: 'admin@example.com',
      ip: '192.168.1.50',
      location: '서울, 대한민국',
      device: 'Desktop',
      browser: 'Chrome 120',
      status: 'failed',
      failureReason: '계정 잠김 (5회 실패)'
    },
    {
      id: '7',
      timestamp: '2026-03-31 10:15:30',
      username: 'user@example.com',
      ip: '192.168.1.100',
      location: '부산, 대한민국',
      device: 'Mobile',
      browser: 'Safari 17',
      status: 'success'
    },
    {
      id: '8',
      timestamp: '2026-03-31 10:10:15',
      username: 'hacker@badsite.com',
      ip: '203.0.113.67',
      location: 'Unknown',
      device: 'Desktop',
      browser: 'Bot',
      status: 'failed',
      failureReason: '비밀번호 불일치'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

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

  const getDeviceIcon = (device: string) => {
    const icons = { Desktop: '🖥️', Mobile: '📱', Tablet: '📱', Bot: '🤖' };
    return icons[device as keyof typeof icons] || '💻';
  };

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = attempt.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.ip.includes(searchTerm) ||
      attempt.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || attempt.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const successCount = attempts.filter(a => a.status === 'success').length;
  const failedCount = attempts.filter(a => a.status === 'failed').length;
  const successRate = ((successCount / attempts.length) * 100).toFixed(1);

  const uniqueIPs = new Set(attempts.map(a => a.ip)).size;
  const suspiciousIPs = new Set(
    attempts.filter(a => a.status === 'failed').map(a => a.ip)
  ).size;

  const handleBlockIP = (ip: string) => {
    if (confirm(`정말 ${ip}를 차단하시겠습니까?`)) {
      alert(`${ip}가 차단되었습니다.`);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    const labels = { '1h': '1시간', '24h': '24시간', '7d': '7일', '30d': '30일' };
    return labels[range as keyof typeof labels] || range;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">로그인 시도</h2>
          <p className="text-gray-600 mt-1">로그인 활동을 모니터링하고 의심스러운 활동을 탐지합니다</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 시도</p>
          <p className="text-2xl font-bold text-blue-700">{attempts.length}</p>
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
          <p className="text-purple-600 text-sm font-medium">성공률</p>
          <p className="text-2xl font-bold text-purple-700">{successRate}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium">의심 IP</p>
          <p className="text-2xl font-bold text-orange-700">{suspiciousIPs}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="사용자, IP, 위치 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">전체 상태</option>
          <option value="success">성공만</option>
          <option value="failed">실패만</option>
        </select>

        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="1h">최근 1시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          기간: {getTimeRangeLabel(timeRange)}
        </div>
      </div>

      {/* Login Attempts Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">시간</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">사용자</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">위치</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">디바이스</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">브라우저</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">상태</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttempts.map(attempt => (
              <tr key={attempt.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{attempt.timestamp}</td>
                <td className="px-4 py-3 text-sm font-medium">{attempt.username}</td>
                <td className="px-4 py-3 text-sm font-mono">{attempt.ip}</td>
                <td className="px-4 py-3 text-sm">{attempt.location}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="flex items-center gap-1">
                    <span>{getDeviceIcon(attempt.device)}</span>
                    {attempt.device}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{attempt.browser}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                    {getStatusLabel(attempt.status)}
                  </span>
                  {attempt.failureReason && (
                    <div className="text-xs text-red-600 mt-1">{attempt.failureReason}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {attempt.status === 'failed' && (
                    <button
                      onClick={() => handleBlockIP(attempt.ip)}
                      className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="IP 차단"
                    >
                      <BlockIcon size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAttempts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <LoginIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <LoginIcon size={18} />
          로그인 보안 팁
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 동일 IP에서 5회 이상 실패 시 계정이 일시 잠깁니다</li>
          <li>• 해외에서의 로그인 시도가 감지되면 알림을 발송합니다</li>
          <li>• 의심스러운 활동이 발견되면 즉시 비밀번호를 변경하세요</li>
          <li>• 2단계 인증을 활성화하여 계정 보안을 강화하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginAttempts;
