// ProductionPlanManagement.tsx - SAP ERD 기반 생산계획 관리
import { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  BarChart3,
  Filter,
  Download,
  Upload,
  FileText,
  Settings,
  Play,
  Pause,
  AlertCircle,
  Factory,
  Users,
  Package,
  Clock,
  Zap
} from 'lucide-react';

interface ProductionPlan {
  plan_id: string;
  plan_year: number;
  plan_rev: number;
  plan_mon: number;
  fac_cd: string;
  product_id: number;
  product_cd: string;
  product_nm: string;
  plan_qty: number;
  cust_cd: string;
  cust_nm: string;
  delivery_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  created_at: string;
}

interface ProductionResult {
  result_id: string;
  work_order_id: string;
  plan_id: string;
  production_qty: number;
  defective_qty: number;
  good_qty: number;
  actual_labor_hours: number;
  actual_machine_hours: number;
  completion_date: string;
  created_at: string;
}

interface MaterialRequirement {
  mrp_id: string;
  plan_id: string;
  material_id: string;
  material_nm: string;
  required_qty: number;
  available_qty: number;
  planned_date: string;
  status: 'PENDING' | 'ALLOCATED' | 'SHORTAGE';
  priority: number;
}

const ProductionPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ProductionPlan[]>([]);
  const [results, setResults] = useState<ProductionResult[]>([]);
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 생산계획 폼
  const [planForm, setPlanForm] = useState({
    plan_year: new Date().getFullYear(),
    plan_mon: new Date().getMonth() + 1,
    fac_cd: '',
    product_id: 0,
    cust_cd: '',
    plan_qty: 0,
    delivery_date: ''
  });

  const statusTypes = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const factories = ['F001', 'F002', 'F003'];

  useEffect(() => {
    loadProductionPlans();
    loadMaterialRequirements();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    filterPlans();
  }, [plans, searchQuery, selectedStatus]);

  const loadProductionPlans = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoPlans: ProductionPlan[] = [
        {
          plan_id: 'PLAN-2024-001',
          plan_year: 2024,
          plan_rev: 1,
          plan_mon: 4,
          fac_cd: 'F001',
          product_id: 1001,
          product_cd: 'P1001',
          product_nm: '유한산업제품A',
          plan_qty: 5000,
          cust_cd: 'C001',
          cust_nm: '한국고객',
          delivery_date: '2024-04-30',
          status: 'IN_PROGRESS',
          progress: 65,
          created_at: '2024-04-21T09:00:00'
        },
        {
          plan_id: 'PLAN-2024-002',
          plan_year: 2024,
          plan_rev: 1,
          plan_mon: 4,
          fac_cd: 'F001',
          product_id: 1002,
          product_cd: 'P1002',
          product_nm: '유한산업제품B',
          plan_qty: 3000,
          cust_cd: 'C002',
          cust_nm: '해외고객',
          delivery_date: '2024-05-15',
          status: 'PENDING',
          progress: 0,
          created_at: '2024-04-21T10:00:00'
        },
        {
          plan_id: 'PLAN-2024-003',
          plan_year: 2024,
          plan_rev: 2,
          plan_mon: 3,
          fac_cd: 'F002',
          product_id: 1003,
          product_cd: 'P1003',
          product_nm: '특수제품C',
          plan_qty: 1000,
          cust_cd: 'C003',
          cust_nm: '국내고객',
          delivery_date: '2024-04-20',
          status: 'COMPLETED',
          progress: 100,
          created_at: '2024-03-01T10:00:00'
        }
      ];
      setPlans(demoPlans);
    } catch (error) {
      console.error('생산계획 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterialRequirements = async () => {
    try {
      // 데모 데이터
      const demoRequirements: MaterialRequirement[] = [
        {
          mrp_id: 'MRP-001',
          plan_id: 'PLAN-2024-001',
          material_id: 'M2001',
          material_nm: '원자재A',
          required_qty: 500,
          available_qty: 300,
          planned_date: '2024-04-25',
          status: 'SHORTAGE',
          priority: 1
        },
        {
          mrp_id: 'MRP-002',
          plan_id: 'PLAN-2024-001',
          material_id: 'M2002',
          material_nm: '부자재B',
          required_qty: 200,
          available_qty: 250,
          planned_date: '2024-04-25',
          status: 'ALLOCATED',
          priority: 2
        }
      ];
      setRequirements(demoRequirements);
    } catch (error) {
      console.error('자재요구사항 로드 실패:', error);
    }
  };

  const filterPlans = () => {
    let filtered = plans.filter(plan =>
      plan.plan_year === selectedYear && plan.plan_mon === selectedMonth
    );

    if (searchQuery) {
      filtered = filtered.filter(plan =>
        plan.product_nm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.cust_nm.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(plan => plan.status === selectedStatus);
    }

    setFilteredPlans(filtered);
  };

  const handleCreatePlan = async () => {
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      const newPlan: ProductionPlan = {
        plan_id: `PLAN-${selectedYear}-${plans.length + 1}`,
        ...planForm,
        status: 'PENDING',
        progress: 0,
        created_at: new Date().toISOString()
      };

      setPlans([newPlan, ...plans]);
      setShowPlanModal(false);
      setPlanForm({
        ...planForm,
        plan_year: new Date().getFullYear(),
        plan_mon: new Date().getMonth() + 1,
        delivery_date: ''
      });
    } catch (error) {
      console.error('계획 생성 실패:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-gray-600" />,
      IN_PROGRESS: <Play className="w-5 h-5 text-blue-600" />,
      COMPLETED: <CheckCircle className="w-5 h-5 text-green-600" />,
      CANCELLED: <XCircle className="w-5 h-5 text-red-600" />
    };
    return icons[status as keyof typeof icons] || icons.PENDING;
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-600 bg-red-50';
    if (priority === 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Factory className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">생산계획 관리</h1>
            <p className="text-sm text-gray-500">SAP ERD SDY100 연간제품생산계획</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadProductionPlans}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            새 계획
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">년도</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[2023, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}월</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            {statusTypes.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="제품명, 고객사 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">총 계획</p>
              <p className="text-2xl font-bold text-blue-900">{filteredPlans.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">진행중</p>
              <p className="text-2xl font-bold text-green-900">
                {filteredPlans.filter(p => p.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">자재 부족</p>
              <p className="text-2xl font-bold text-yellow-900">
                {requirements.filter(r => r.status === 'SHORTAGE').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">평균 진척률</p>
              <p className="text-2xl font-bold text-purple-900">
                {filteredPlans.length > 0
                  ? Math.round(filteredPlans.reduce((sum, p) => sum + p.progress, 0) / filteredPlans.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* 자재 요구사항 카드 */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-orange-900">자재 요구사항 (MRP)</h3>
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="space-y-2">
          {requirements.map((req) => (
            <div key={req.mrp_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${getPriorityColor(req.priority)}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{req.material_nm}</p>
                  <p className="text-sm text-gray-500">
                    요구: {req.required_qty} / 가용: {req.available_qty}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  req.status === 'SHORTAGE' ? 'bg-red-100 text-red-800' :
                  req.status === 'ALLOCATED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {req.status === 'SHORTAGE' ? '부족' : req.status === 'ALLOCATED' ? '할당' : '대기'}
                </span>
                <span className="text-xs text-gray-500">{req.planned_date}</span>
              </div>
            </div>
          ))}
          {requirements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">요구사항이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 생산계획 목록 */}
      <div className="space-y-3">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Factory className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 계획이 없습니다.</p>
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div
              key={plan.plan_id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getStatusColor(plan.status)}`}>
                    {getStatusIcon(plan.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{plan.product_nm}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {plan.product_cd}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">고객</p>
                        <p className="font-medium">{plan.cust_nm}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">계획 수량</p>
                        <p className="font-medium">{plan.plan_qty.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">납기일</p>
                        <p className="font-medium">{plan.delivery_date}</p>
                      </div>
                    </div>
                    {/* 진행률 바 */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>진척률</span>
                        <span className="font-medium">{plan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* 편집 기능 */}}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 새 계획 모달 */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 생산계획 생성</h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">년도</label>
                  <select
                    value={planForm.plan_year}
                    onChange={(e) => setPlanForm({ ...planForm, plan_year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2023, 2024, 2025].map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
                  <select
                    value={planForm.plan_mon}
                    onChange={(e) => setPlanForm({ ...planForm, plan_mon: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}월</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공장</label>
                  <select
                    value={planForm.fac_cd}
                    onChange={(e) => setPlanForm({ ...planForm, fac_cd: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">공장 선택</option>
                    {factories.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획 수량</label>
                  <input
                    type="number"
                    value={planForm.plan_qty}
                    onChange={(e) => setPlanForm({ ...planForm, plan_qty: parseInt(e.target.value) || 0 })}
                    placeholder="수량 입력"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">납기 예정일</label>
                  <input
                    type="date"
                    value={planForm.delivery_date}
                    onChange={(e) => setPlanForm({ ...planForm, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPlanManagement;
