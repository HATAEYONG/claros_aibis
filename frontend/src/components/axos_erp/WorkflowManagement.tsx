// WorkflowManagement.tsx - AXOS ERP V10.4 워크플로우 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  ListChecks,
  Search,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Calendar,
  Trash2,
  User,
  Settings,
  Play,
  Pause,
  FileText,
  Zap
} from 'lucide-react';

interface Task {
  id: number;
  task_type: string;
  title: string;
  owner_role: string;
  source_object_type: string;
  source_object_id: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  detail_json: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

interface TaskRequest {
  task_type: string;
  title: string;
  owner_role: string;
  source_object_type: string;
  source_object_id: string;
  detail_json: Record<string, any>;
}

const WorkflowManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 태스크 생성 폼
  const [createForm, setCreateForm] = useState<TaskRequest>({
    task_type: '',
    title: '',
    owner_role: '',
    source_object_type: '',
    source_object_id: '',
    detail_json: {}
  });

  const taskTypes = ['quality_inspection', 'production_approval', 'cost_review', 'delay_investigation', 'procurement_approval'];
  const statusTypes = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const ownerRoles = ['quality_manager', 'production_manager', 'cost_manager', 'procurement_manager', 'plant_manager'];

  useEffect(() => {
    loadTasks();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedType, selectedStatus]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8400/tasks');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoTasks: Task[] = [
        {
          id: 1,
          task_type: 'quality_inspection',
          title: '품질 검사 승인 요청: LOT-2024-001',
          owner_role: 'quality_manager',
          source_object_type: 'lot',
          source_object_id: 'LOT-2024-001',
          status: 'OPEN',
          detail_json: {
            inspection_type: '출하검사',
            quantity: 1000,
            inspector: '김质检',
            priority: 'HIGH'
          },
          created_at: '2024-04-21T10:00:00'
        },
        {
          id: 2,
          task_type: 'production_approval',
          title: '생산 계획 승인: PP-2024-04-001',
          owner_role: 'production_manager',
          source_object_type: 'production_plan',
          source_object_id: 'PP-2024-04-001',
          status: 'IN_PROGRESS',
          detail_json: {
            product_id: 'P1001',
            quantity: 5000,
            start_date: '2024-04-25',
            end_date: '2024-04-30'
          },
          created_at: '2024-04-21T11:00:00'
        },
        {
          id: 3,
          task_type: 'cost_review',
          title: '원가 검토 요청: P1001',
          owner_role: 'cost_manager',
          source_object_type: 'product',
          source_object_id: 'P1001',
          status: 'OPEN',
          detail_json: {
            current_cost: 150000,
            target_cost: 140000,
            variance: 10000
          },
          created_at: '2024-04-21T12:00:00'
        },
        {
          id: 4,
          task_type: 'delay_investigation',
          title: '지연 원인 조사: WO-001',
          owner_role: 'production_manager',
          source_object_type: 'work_order',
          source_object_id: 'WO-001',
          status: 'COMPLETED',
          detail_json: {
            delay_hours: 8,
            reason: '설비 고장',
            corrective_action: '예방 정비 계획 수립'
          },
          created_at: '2024-04-21T09:00:00',
          completed_at: '2024-04-21T13:00:00'
        }
      ];
      setTasks(demoTasks);
    } catch (error) {
      console.error('태스크 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.source_object_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.owner_role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(task => task.task_type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    setFilteredTasks(filtered);
  };

  const handleCreate = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: await fetch('http://localhost:8400/tasks', { method: 'POST', body: JSON.stringify(createForm) });
      await new Promise(resolve => setTimeout(resolve, 500));

      const newTask: Task = {
        id: tasks.length + 1,
        ...createForm,
        status: 'OPEN' as const,
        created_at: new Date().toISOString()
      };

      setTasks([newTask, ...tasks]);
      setShowCreateModal(false);
      setCreateForm({
        task_type: '',
        title: '',
        owner_role: '',
        source_object_type: '',
        source_object_id: '',
        detail_json: {}
      });
    } catch (error) {
      console.error('태스크 생성 실패:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: newStatus,
            completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : task.completed_at
          }
        : task
    ));
  };

  const handleDelete = async (taskId: number) => {
    if (confirm('이 태스크를 삭제하시겠습니까?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.OPEN;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      OPEN: <Clock className="w-5 h-5 text-blue-600" />,
      IN_PROGRESS: <Play className="w-5 h-5 text-yellow-600" />,
      COMPLETED: <CheckCircle className="w-5 h-5 text-green-600" />,
      CANCELLED: <XCircle className="w-5 h-5 text-red-600" />
    };
    return icons[status as keyof typeof icons] || icons.OPEN;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quality_inspection: '품질 검사',
      production_approval: '생산 승인',
      cost_review: '원가 검토',
      delay_investigation: '지연 조사',
      procurement_approval: '조달 승인'
    };
    return labels[type] || type;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      quality_manager: '품질 관리자',
      production_manager: '생산 관리자',
      cost_manager: '원가 관리자',
      procurement_manager: '조달 관리자',
      plant_manager: '공장 관리자'
    };
    return labels[role] || role;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ListChecks className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">워크플로우</h1>
            <p className="text-sm text-gray-500">태스크 관리 및 워크플로우 추적</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadTasks}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            태스크 생성
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 태스크</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">대기중</p>
              <p className="text-2xl font-bold text-blue-900">
                {tasks.filter(t => t.status === 'OPEN').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">진행중</p>
              <p className="text-2xl font-bold text-yellow-900">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">완료됨</p>
              <p className="text-2xl font-bold text-green-900">
                {tasks.filter(t => t.status === 'COMPLETED').length}
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
            placeholder="제목, 유형, 객체 ID, 담당자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">전체 유형</option>
          {taskTypes.map(type => (
            <option key={type} value={type}>{getTypeLabel(type)}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">전체 상태</option>
          {statusTypes.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* 태스크 목록 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ListChecks className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 태스크가 없습니다.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${
                task.status === 'COMPLETED' ? 'border-green-200 bg-green-50' :
                task.status === 'IN_PROGRESS' ? 'border-yellow-200' :
                task.status === 'CANCELLED' ? 'border-red-200 opacity-60' :
                'border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white rounded-lg">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <span>{getTypeLabel(task.task_type)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getRoleLabel(task.owner_role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{task.source_object_type}: {task.source_object_id}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      생성: {new Date(task.created_at).toLocaleString('ko-KR')}
                      {task.completed_at && (
                        <span className="ml-2">
                          완료: {new Date(task.completed_at).toLocaleString('ko-KR')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {task.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="시작"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="완료"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
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

      {/* 태스크 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 태스크 생성</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">태스크 유형</label>
                <select
                  value={createForm.task_type}
                  onChange={(e) => setCreateForm({ ...createForm, task_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">유형 선택</option>
                  {taskTypes.map(type => (
                    <option key={type} value={type}>{getTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="태스크 제목"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 역할</label>
                <select
                  value={createForm.owner_role}
                  onChange={(e) => setCreateForm({ ...createForm, owner_role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">역할 선택</option>
                  {ownerRoles.map(role => (
                    <option key={role} value={role}>{getRoleLabel(role)}</option>
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
                    placeholder="예: lot"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">객체 ID</label>
                  <input
                    type="text"
                    value={createForm.source_object_id}
                    onChange={(e) => setCreateForm({ ...createForm, source_object_id: e.target.value })}
                    placeholder="예: LOT-2024-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">태스크 상세</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">제목</label>
                <p className="text-gray-900 font-semibold text-lg">{selectedTask.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">태스크 유형</label>
                  <p className="text-gray-900">{getTypeLabel(selectedTask.task_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">상태</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">담당자</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {getRoleLabel(selectedTask.owner_role)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">소스 객체</label>
                  <p className="text-gray-900">
                    {selectedTask.source_object_type}: {selectedTask.source_object_id}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">상세 정보</label>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedTask.detail_json, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">생성 시간</label>
                  <p className="text-gray-900">{new Date(selectedTask.created_at).toLocaleString('ko-KR')}</p>
                </div>
                {selectedTask.completed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">완료 시간</label>
                    <p className="text-gray-900">{new Date(selectedTask.completed_at).toLocaleString('ko-KR')}</p>
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

export default WorkflowManagement;
