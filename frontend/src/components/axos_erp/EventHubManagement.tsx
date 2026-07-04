// EventHubManagement.tsx - AXOS ERP V10.4 이벤트 허브 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  ChevronDown,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  BarChart3,
  Settings,
  Play,
  Pause,
  Download,
  Upload,
  FileText,
  Network
} from 'lucide-react';

interface EventData {
  id: number;
  topic: string;
  event_key: string;
  event_type: string;
  payload_json: Record<string, any>;
  created_at: string;
}

interface PublishRequest {
  topic: string;
  event_key: string;
  event_type: string;
  payload_json: Record<string, any>;
}

const EventHubManagement: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 새 이벤트 발행 폼 상태
  const [publishForm, setPublishForm] = useState<PublishRequest>({
    topic: '',
    event_key: '',
    event_type: '',
    payload_json: {}
  });

  // 주제 목록
  const topics = ['production', 'quality', 'inventory', 'sales', 'finance', 'procurement'];

  useEffect(() => {
    loadEvents();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedTopic]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8082/events');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoEvents: EventData[] = [
        {
          id: 1,
          topic: 'production',
          event_key: 'PROD-001',
          event_type: 'production_complete',
          payload_json: {
            product_id: 'P1001',
            quantity: 1000,
            work_order: 'WO-2024-001',
            completion_time: '2024-04-21T10:30:00',
            operator: '홍길동',
            line: 'A-LINE'
          },
          created_at: '2024-04-21T10:30:00'
        },
        {
          id: 2,
          topic: 'quality',
          event_key: 'QUAL-001',
          event_type: 'quality_check',
          payload_json: {
            product_id: 'P1001',
            inspection_type: '출하검사',
            result: 'PASS',
            inspector: '김质检',
            defects_found: 0,
            sample_size: 50
          },
          created_at: '2024-04-21T11:00:00'
        },
        {
          id: 3,
          topic: 'inventory',
          event_key: 'INV-001',
          event_type: 'stock_alert',
          payload_json: {
            material_id: 'M2001',
            current_stock: 50,
            min_stock: 100,
            warehouse: 'W1',
            urgency: 'HIGH'
          },
          created_at: '2024-04-21T11:15:00'
        }
      ];
      setEvents(demoEvents);
    } catch (error) {
      console.error('이벤트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.event_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(event => event.topic === selectedTopic);
    }

    setFilteredEvents(filtered);
  };

  const handlePublish = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: await fetch('http://localhost:8082/publish', { method: 'POST', body: JSON.stringify(publishForm) });
      await new Promise(resolve => setTimeout(resolve, 500));

      const newEvent: EventData = {
        id: events.length + 1,
        ...publishForm,
        created_at: new Date().toISOString()
      };

      setEvents([newEvent, ...events]);
      setShowPublishModal(false);
      setPublishForm({
        topic: '',
        event_key: '',
        event_type: '',
        payload_json: {}
      });
    } catch (error) {
      console.error('이벤트 발행 실패:', error);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (confirm('이 이벤트를 삭제하시겠습니까?')) {
      setEvents(events.filter(e => e.id !== eventId));
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('production')) return <Activity className="w-5 h-5" />;
    if (eventType.includes('quality')) return <CheckCircle className="w-5 h-5" />;
    if (eventType.includes('inventory')) return <Network className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  const getTopicColor = (topic: string) => {
    const colors: Record<string, string> = {
      production: 'bg-blue-100 text-blue-800',
      quality: 'bg-green-100 text-green-800',
      inventory: 'bg-purple-100 text-purple-800',
      sales: 'bg-yellow-100 text-yellow-800',
      finance: 'bg-red-100 text-red-800',
      procurement: 'bg-indigo-100 text-indigo-800'
    };
    return colors[topic] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Network className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">이벤트 허브</h1>
            <p className="text-sm text-gray-500">AXOS ERP V10.4 이벤트 발행 및 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            이벤트 발행
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">전체 이벤트</p>
              <p className="text-2xl font-bold text-blue-900">{events.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">생산 이벤트</p>
              <p className="text-2xl font-bold text-green-900">
                {events.filter(e => e.topic === 'production').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">품질 이벤트</p>
              <p className="text-2xl font-bold text-purple-900">
                {events.filter(e => e.topic === 'quality').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">재고 이벤트</p>
              <p className="text-2xl font-bold text-yellow-900">
                {events.filter(e => e.topic === 'inventory').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이벤트 키, 유형, 주제 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">전체 주제</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      </div>

      {/* 이벤트 목록 */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 이벤트가 없습니다.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{event.event_key}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTopicColor(event.topic)}`}>
                        {event.topic}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{event.event_type}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(event.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 이벤트 발행 모달 */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 이벤트 발행</h2>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주제 (Topic)</label>
                <select
                  value={publishForm.topic}
                  onChange={(e) => setPublishForm({ ...publishForm, topic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">주제 선택</option>
                  {topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이벤트 키 (Event Key)</label>
                <input
                  type="text"
                  value={publishForm.event_key}
                  onChange={(e) => setPublishForm({ ...publishForm, event_key: e.target.value })}
                  placeholder="예: PROD-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이벤트 유형 (Event Type)</label>
                <input
                  type="text"
                  value={publishForm.event_type}
                  onChange={(e) => setPublishForm({ ...publishForm, event_type: e.target.value })}
                  placeholder="예: production_complete"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">페이로드 (JSON)</label>
                <textarea
                  value={JSON.stringify(publishForm.payload_json, null, 2)}
                  onChange={(e) => {
                    try {
                      setPublishForm({ ...publishForm, payload_json: JSON.parse(e.target.value) });
                    } catch {
                      // 유효하지 않은 JSON은 무시
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                발행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">이벤트 상세</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">이벤트 키</label>
                  <p className="text-gray-900">{selectedEvent.event_key}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">주제</label>
                  <span className={`px-2 py-1 text-sm font-medium rounded ${getTopicColor(selectedEvent.topic)}`}>
                    {selectedEvent.topic}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">이벤트 유형</label>
                  <p className="text-gray-900">{selectedEvent.event_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">생성 시간</label>
                  <p className="text-gray-900">{new Date(selectedEvent.created_at).toLocaleString('ko-KR')}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">페이로드</label>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedEvent.payload_json, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventHubManagement;
