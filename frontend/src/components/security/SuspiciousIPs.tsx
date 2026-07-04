import React, { useState } from 'react';
import { BlockIcon, SearchIcon, FilterIcon, PlusIcon } from '@/components/icons/Icons';

interface SuspiciousIP {
  id: string;
  ip: string;
  attempts: number;
  lastSeen: string;
  status: 'blocked' | 'monitored' | 'whitelisted';
  reason: string;
  location: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

const SuspiciousIPs: React.FC = () => {
  const [ips, setIps] = useState<SuspiciousIP[]>([
    {
      id: '1',
      ip: '203.0.113.45',
      attempts: 156,
      lastSeen: '2026-03-31 10:25:45',
      status: 'blocked',
      reason: 'Brute force attack - Multiple failed login attempts',
      location: 'Unknown',
      threatLevel: 'critical'
    },
    {
      id: '2',
      ip: '198.51.100.23',
      attempts: 89,
      lastSeen: '2026-03-31 10:22:12',
      status: 'blocked',
      reason: 'SQL injection attempt detected',
      location: 'Moscow, Russia',
      threatLevel: 'high'
    },
    {
      id: '3',
      ip: '192.0.2.67',
      attempts: 45,
      lastSeen: '2026-03-31 10:18:33',
      status: 'monitored',
      reason: 'Unusual access patterns detected',
      location: 'Beijing, China',
      threatLevel: 'medium'
    },
    {
      id: '4',
      ip: '198.18.0.12',
      attempts: 23,
      lastSeen: '2026-03-31 10:15:20',
      status: 'monitored',
      reason: 'Multiple login failures',
      location: 'Unknown',
      threatLevel: 'medium'
    },
    {
      id: '5',
      ip: '203.0.113.89',
      attempts: 12,
      lastSeen: '2026-03-31 10:10:05',
      status: 'blocked',
      reason: 'Malicious bot traffic',
      location: 'Unknown',
      threatLevel: 'high'
    },
    {
      id: '6',
      ip: '192.168.1.50',
      attempts: 3,
      lastSeen: '2026-03-31 09:55:18',
      status: 'whitelisted',
      reason: 'Internal network - False positive',
      location: 'Seoul, Korea',
      threatLevel: 'low'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const statuses = ['all', 'blocked', 'monitored', 'whitelisted'];
  const threats = ['all', 'critical', 'high', 'medium', 'low'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'bg-red-100 text-red-700';
      case 'monitored': return 'bg-yellow-100 text-yellow-700';
      case 'whitelisted': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = { blocked: '차단됨', monitored: '모니터링', whitelisted: '허용됨' };
    return labels[status as keyof typeof labels] || status;
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-400 text-gray-800';
      case 'low': return 'bg-blue-400 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getThreatLabel = (threat: string) => {
    const labels = { critical: '심각', high: '높음', medium: '중간', low: '낮음' };
    return labels[threat as keyof typeof labels] || threat;
  };

  const filteredIPs = ips.filter(ip => {
    const matchesSearch = ip.ip.includes(searchTerm) ||
      ip.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ip.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ip.status === selectedStatus;
    const matchesThreat = selectedThreat === 'all' || ip.threatLevel === selectedThreat;
    return matchesSearch && matchesStatus && matchesThreat;
  });

  const handleBlockIP = (id: string) => {
    setIps(ips.map(ip =>
      ip.id === id ? { ...ip, status: 'blocked' } : ip
    ));
  };

  const handleUnblockIP = (id: string) => {
    setIps(ips.map(ip =>
      ip.id === id ? { ...ip, status: 'monitored' } : ip
    ));
  };

  const handleWhitelistIP = (id: string) => {
    setIps(ips.map(ip =>
      ip.id === id ? { ...ip, status: 'whitelisted', threatLevel: 'low' } : ip
    ));
  };

  const totalBlocked = ips.filter(ip => ip.status === 'blocked').length;
  const totalMonitored = ips.filter(ip => ip.status === 'monitored').length;
  const criticalThreats = ips.filter(ip => ip.threatLevel === 'critical').length;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">의심 IP 관리</h2>
          <p className="text-gray-600 mt-1">의심스러운 IP를 차단하고 모니터링합니다</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon size={18} />
          IP 추가
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600 text-sm font-medium">차단됨</p>
          <p className="text-2xl font-bold text-red-700">{totalBlocked}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-600 text-sm font-medium">모니터링</p>
          <p className="text-2xl font-bold text-yellow-700">{totalMonitored}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium">심각 위협</p>
          <p className="text-2xl font-bold text-orange-700">{criticalThreats}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 관리 IP</p>
          <p className="text-2xl font-bold text-blue-700">{ips.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="IP, 위치, 이유 검색..."
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
          {statuses.map(status => (
            <option key={status} value={status}>
              {status === 'all' ? '전체 상태' : getStatusLabel(status)}
            </option>
          ))}
        </select>

        <select
          value={selectedThreat}
          onChange={(e) => setSelectedThreat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {threats.map(threat => (
            <option key={threat} value={threat}>
              {threat === 'all' ? '전체 위협도' : getThreatLabel(threat)}
            </option>
          ))}
        </select>
      </div>

      {/* Suspicious IPs Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP 주소</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">시도 횟수</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">마지막 확인</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">위협도</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">위치</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">이유</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredIPs.map(ip => (
              <tr key={ip.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{ip.ip}</code>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{ip.attempts}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ip.lastSeen}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ip.status)}`}>
                    {getStatusLabel(ip.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatColor(ip.threatLevel)}`}>
                    {getThreatLabel(ip.threatLevel)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{ip.location}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{ip.reason}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {ip.status !== 'blocked' && (
                      <button
                        onClick={() => handleBlockIP(ip.id)}
                        className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="차단"
                      >
                        <BlockIcon size={16} />
                      </button>
                    )}
                    {ip.status === 'blocked' && (
                      <button
                        onClick={() => handleUnblockIP(ip.id)}
                        className="p-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        title="차단 해제"
                      >
                        🔓
                      </button>
                    )}
                    {ip.status !== 'whitelisted' && (
                      <button
                        onClick={() => handleWhitelistIP(ip.id)}
                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="허용 목록"
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredIPs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BlockIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">의심 IP 추가</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert('IP가 추가되었습니다.');
              setShowAddModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP 주소</label>
                <input
                  type="text"
                  placeholder="xxx.xxx.xxx.xxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위협도</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                  <option value="critical">심각</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이유</label>
                <textarea
                  placeholder="차단/모니터링 사유"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspiciousIPs;
