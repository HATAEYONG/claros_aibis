import React, { useState } from 'react';
import { WarningIcon, SearchIcon, FilterIcon, AlertTriangleIcon } from '@/components/icons/Icons';

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'intrusion' | 'malware' | 'data_breach' | 'unauthorized_access' | 'ddos' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  status: 'investigating' | 'resolved' | 'false_positive';
  affected: string;
  response?: string;
}

const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      timestamp: '2026-03-31 10:23:15',
      type: 'intrusion',
      severity: 'high',
      source: 'IDS/IPS',
      description: '의심스러운 로그인 패턴 감지 (단일 IP에서 다중 계정 시도)',
      status: 'investigating',
      affected: '3개 사용자 계정',
      response: '계정 일시 잠금, 보안팀에 알림'
    },
    {
      id: '2',
      timestamp: '2026-03-31 09:45:33',
      type: 'ddos',
      severity: 'critical',
      source: 'Network Monitor',
      description: 'DDoS 공격 시도 - 초당 10,000개 요청',
      status: 'resolved',
      affected: 'API 서버',
      response: 'Rate limiting 적용, IP 차단'
    },
    {
      id: '3',
      timestamp: '2026-03-31 08:30:12',
      type: 'unauthorized_access',
      severity: 'medium',
      source: 'Auth Log',
      description: '권한 없는 페이지 접근 시도',
      status: 'false_positive',
      affected: '관리자 페이지'
    },
    {
      id: '4',
      timestamp: '2026-03-31 07:15:44',
      type: 'data_breach',
      severity: 'high',
      source: 'DLP System',
      description: '대량 데이터 다운로드 시도 감지',
      status: 'investigating',
      affected: '생산 데이터 (1,500건)'
    },
    {
      id: '5',
      timestamp: '2026-03-31 06:00:00',
      type: 'malware',
      severity: 'low',
      source: 'Antivirus',
      description: '의심스러운 파일 업로드 탐지',
      status: 'resolved',
      affected: '파일 업로드 서비스',
      response: '파일 격리, 사용자에게 알림'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const types = ['all', 'intrusion', 'malware', 'data_breach', 'unauthorized_access', 'ddos', 'other'];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  const getTypeLabel = (type: string) => {
    const labels = {
      all: '전체',
      intrusion: '침입',
      malware: '악성코드',
      data_breach: '데이터 유출',
      unauthorized_access: '무단 접근',
      ddos: 'DDoS',
      other: '기타'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-400 text-gray-800';
      case 'low': return 'bg-blue-400 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels = { critical: '심각', high: '높음', medium: '중간', low: '낮음' };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'false_positive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = { investigating: '조사중', resolved: '해결됨', false_positive: '오탐' };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      intrusion: '🔓',
      malware: '🦠',
      data_breach: '📤',
      unauthorized_access: '🚫',
      ddos: '🌐',
      other: '⚠️'
    };
    return icons[type as keyof typeof icons] || '⚠️';
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleUpdateStatus = (id: string, status: 'investigating' | 'resolved' | 'false_positive') => {
    setEvents(events.map(e =>
      e.id === id ? { ...e, status } : e
    ));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">보안 이벤트</h2>
          <p className="text-gray-600 mt-1">보안 사고와 이벤트를 모니터링하고 대응합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <AlertTriangleIcon size={18} />
          긴급 신고
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600 text-sm font-medium">심각</p>
          <p className="text-2xl font-bold text-red-700">
            {events.filter(e => e.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium">높음</p>
          <p className="text-2xl font-bold text-orange-700">
            {events.filter(e => e.severity === 'high').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-600 text-sm font-medium">조사중</p>
          <p className="text-2xl font-bold text-yellow-700">
            {events.filter(e => e.status === 'investigating').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">해결됨</p>
          <p className="text-2xl font-bold text-green-700">
            {events.filter(e => e.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이벤트 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {types.map(type => (
            <option key={type} value={type}>{getTypeLabel(type)}</option>
          ))}
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {severities.map(severity => (
            <option key={severity} value={severity}>
              {severity === 'all' ? '전체 심각도' : getSeverityLabel(severity)}
            </option>
          ))}
        </select>
      </div>

      {/* Security Events List */}
      <div className="space-y-3">
        {filteredEvents.map(event => (
          <div
            key={event.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              event.severity === 'critical' ? 'border-red-300 bg-red-50' :
              event.severity === 'high' ? 'border-orange-300 bg-orange-50' :
              'bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{getTypeIcon(event.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {getSeverityLabel(event.severity)}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {getTypeLabel(event.type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{event.description}</h4>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>🕐 {event.timestamp}</span>
                    <span>📍 {event.source}</span>
                    <span>🎯 {event.affected}</span>
                  </div>
                  {event.response && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">대응:</span> {event.response}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  상세
                </button>
                {event.status === 'investigating' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(event.id, 'resolved')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      해결
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(event.id, 'false_positive')}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      오탐
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <WarningIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">보안 이벤트 상세</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">유형</span>
                <span className="font-medium">{getTypeLabel(selectedEvent.type)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">심각도</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedEvent.severity)}`}>
                  {getSeverityLabel(selectedEvent.severity)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">상태</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status)}`}>
                  {getStatusLabel(selectedEvent.status)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">발생 시간</span>
                <span className="font-medium">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">탐지_SOURCE</span>
                <span className="font-medium">{selectedEvent.source}</span>
              </div>
              <div className="py-2 border-b">
                <span className="text-gray-600 block mb-1">설명</span>
                <p className="text-gray-800">{selectedEvent.description}</p>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">영향 받는 자산</span>
                <span className="font-medium">{selectedEvent.affected}</span>
              </div>
              {selectedEvent.response && (
                <div className="py-2">
                  <span className="text-gray-600 block mb-1">대응 조치</span>
                  <p className="text-gray-800">{selectedEvent.response}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                닫기
              </button>
              {selectedEvent.status === 'investigating' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedEvent.id, 'resolved');
                    setSelectedEvent(null);
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

export default SecurityEvents;
