// AlertManagement.tsx - AXOS ERP V10.4 알림 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  Calendar,
  Trash2,
  CheckSquare,
  Square,
  Zap
} from 'lucide-react';

interface Alert {
  id: number;
  alert_type: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source_object_type: string;
  source_object_id: string;
  dedup_key: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  detail_json: Record<string, any>;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface AlertRequest {
  alert_type: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source_object_type: string;
  source_object_id: string;
  dedup_key: string;
  detail_json: Record<string, any>;
}

const AlertManagementComponent: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 알림 생성 폼
  const [createForm, setCreateForm] = useState<AlertRequest>({
    alert_type: '',
    title: '',
    severity: 'MEDIUM',
    source_object_type: '',
    source_object_id: '',
    dedup_key: '',
    detail_json: {}
  });

  const alertTypes = ['quality_issue', 'delay_alert', 'stock_alert', 'equipment_failure', 'cost_variance'];
  const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statusTypes = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchQuery, selectedSeverity, selectedStatus]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8300/alerts');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoAlerts: Alert[] = [
        {
          id: 1,
          alert_type: 'quality_issue',
          title: '품질 문제 발생: 제품 P1001',
          severity: 'HIGH',
          source_object_type: 'product',
          source_object_id: 'P1001',
          dedup_key: 'QUAL-P1001',
          status: 'OPEN',
          detail_json: {
            defect_type: '치수불량',
            affected_quantity: 50,
            inspector: '김质检'
          },
          created_at: '2024-04-21T10:00:00'
        },
        {
          id: 2,
          alert_type: 'delay_alert',
          title: '생산 지연 경고: 작업지시 WO-001',
          severity: 'MEDIUM',
          source_object_type: 'work_order',
          source_object_id: 'WO-001',
          dedup_key: 'DELAY-WO-001',
          status: 'OPEN',
          detail_json: {
            delay_hours: 4,
            reason: '설비 고장',
            expected_completion: '2024-04-21T18:00:00'
          },
          created_at: '2024-04-21T11:00:00'
        },
        {
          id: 3,
          alert_type: 'stock_alert',
          title: '재고 부족 경고: 자재 M2001',
          severity: 'CRITICAL',
          source_object_type: 'material',
          source_object_id: 'M2001',
          dedup_key: 'STOCK-M2001',
          status: 'OPEN',
          detail_json: {
            current_stock: 10,
            min_stock: 100,
            warehouse: 'W1'
          },
          created_at: '2024-04-21T12:00:00'
        }
      ];
      setAlerts(demoAlerts);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (searchQuery) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.source_object_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === selectedStatus);
    }

    setFilteredAlerts(filtered);
  };

  const handleCreate = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: await fetch('http://localhost:8300/alerts', { method: 'POST', body: JSON.stringify(createForm) });
      await new Promise(resolve => setTimeout(resolve, 500));

      const newAlert: Alert = {
        id: alerts.length + 1,
        ...createForm,
        status: 'OPEN',
        created_at: new Date().toISOString()
      };

      setAlerts([newAlert, ...alerts]);
      setShowCreateModal(false);
      setCreateForm({
        alert_type: '',
        title: '',
        severity: 'MEDIUM',
        source_object_type: '',
        source_object_id: '',
        dedup_key: '',
        detail_json: {}
      });
    } catch (error) {
      console.error('알림 생성 실패:', error);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, status: 'ACKNOWLEDGED' as const, acknowledged_at: new Date().toISOString() }
        : alert
    ));
  };

  const handleResolve = async (alertId: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, status: 'RESOLVED' as const, resolved_at: new Date().toISOString() }
        : alert
    ));
  };

  const handleDelete = async (alertId: number) => {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
      setAlerts(alerts.filter(a => a.id !== alertId));
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[severity as keyof typeof colors] || colors.LOW;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      CRITICAL: <AlertTriangle className="w-5 h-5 text-red-600" />,
      HIGH: <AlertCircle className="w-5 h-5 text-orange-600" />,
      MEDIUM: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      LOW: <Info className="w-5 h-5 text-blue-600" />
    };
    return icons[severity as keyof typeof icons] || icons.LOW;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-800',
      ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.OPEN;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Bell className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">알림 관리</h1>
            <p className="text-sm text-gray-500">알림 생성 및 관리 (중복 제거 지원)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadAlerts}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <Plus className="w-5 h-5" />
            알림 생성
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 알림</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">미확인</p>
              <p className="text-2xl font-bold text-red-900">
                {alerts.filter(a => a.status === 'OPEN').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">확인중</p>
              <p className="text-2xl font-bold text-yellow-900">
                {alerts.filter(a => a.status === 'ACKNOWLEDGED').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">해결됨</p>
              <p className="text-2xl font-bold text-green-900">
                {alerts.filter(a => a.status === 'RESOLVED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="제목, 유형, 객체 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="all">전체 심각도</option>
          {severityLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="all">전체 상태</option>
          {statusTypes.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* 알림 목록 */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 알림이 없습니다.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${getSeverityColor(alert.severity)} ${
                alert.status === 'RESOLVED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white rounded-lg">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <span>{alert.alert_type}</span>
                      <span>•</span>
                      <span>{alert.source_object_type}: {alert.source_object_id}</span>
                    </div>
                    {alert.dedup_key && (
                      <p className="text-xs text-gray-500">중복 키: {alert.dedup_key}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(alert.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {alert.status === 'OPEN' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="확인"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="해결"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
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

      {/* 알림 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 알림 생성</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">알림 유형</label>
                <select
                  value={createForm.alert_type}
                  onChange={(e) => setCreateForm({ ...createForm, alert_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">유형 선택</option>
                  {alertTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="알림 제목"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
                <select
                  value={createForm.severity}
                  onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {severityLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">객체 유형</label>
                  <input
                    type="text"
                    value={createForm.source_object_type}
                    onChange={(e) => setCreateForm({ ...createForm, source_object_type: e.target.value })}
                    placeholder="예: product"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">객체 ID</label>
                  <input
                    type="text"
                    value={createForm.source_object_id}
                    onChange={(e) => setCreateForm({ ...createForm, source_object_id: e.target.value })}
                    placeholder="예: P1001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">중복 키 (선택)</label>
                <input
                  type="text"
                  value={createForm.dedup_key}
                  onChange={(e) => setCreateForm({ ...createForm, dedup_key: e.target.value })}
                  placeholder="같은 키의 열린 알림이 있으면 생성되지 않습니다"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 정보 (JSON)</label>
                <textarea
                  value={JSON.stringify(createForm.detail_json, null, 2)}
                  onChange={(e) => {
                    try {
                      setCreateForm({ ...createForm, detail_json: JSON.parse(e.target.value) });
                    } catch {
                      // 유효하지 않은 JSON은 무시
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">알림 상세</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">제목</label>
                  <p className="text-gray-900 font-semibold">{selectedAlert.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">알림 유형</label>
                  <p className="text-gray-900">{selectedAlert.alert_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">심각도</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">상태</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedAlert.status)}`}>
                    {selectedAlert.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">객체 유형</label>
                  <p className="text-gray-900">{selectedAlert.source_object_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">객체 ID</label>
                  <p className="text-gray-900">{selectedAlert.source_object_id}</p>
                </div>
              </div>
              {selectedAlert.dedup_key && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">중복 키</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedAlert.dedup_key}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">상세 정보</label>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedAlert.detail_json, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">생성 시간</label>
                  <p className="text-gray-900">{new Date(selectedAlert.created_at).toLocaleString('ko-KR')}</p>
                </div>
                {selectedAlert.acknowledged_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">확인 시간</label>
                    <p className="text-gray-900">{new Date(selectedAlert.acknowledged_at).toLocaleString('ko-KR')}</p>
                  </div>
                )}
                {selectedAlert.resolved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">해결 시간</label>
                    <p className="text-gray-900">{new Date(selectedAlert.resolved_at).toLocaleString('ko-KR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagementComponent;
