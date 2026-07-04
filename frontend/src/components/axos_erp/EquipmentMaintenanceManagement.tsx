import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Activity,
  Calendar,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  Download
} from 'lucide-react';

// 설비 인터페이스
interface Equipment {
  id: string;
  equip_cd: string;
  equip_nm: string;
  equip_type: 'PRODUCTION' | 'INSPECTION' | 'PACKAGING' | 'STORAGE';
  location: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'DOWN' | 'IDLE';
  capacity: number;
  oee_rate: number;
  last_maintenance: string;
  next_maintenance: string;
  manufacturer: string;
  model: string;
  install_date: string;
}

// 정비 이력 인터페이스
interface MaintenanceHistory {
  id: string;
  maintenance_no: string;
  equip_cd: string;
  equip_nm: string;
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'EMERGENCY';
  start_date: string;
  end_date: string;
  duration_hours: number;
  technician: string;
  description: string;
  cost: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  parts_used: string[];
}

// 설비 가용량 인터페이스
interface EquipmentAvailability {
  equip_cd: string;
  equip_nm: string;
  date: string;
  planned_availability: number;
  actual_availability: number;
  breakdown_hours: number;
  setup_hours: number;
  idle_hours: number;
}

const EquipmentMaintenanceManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([]);
  const [availability, setAvailability] = useState<EquipmentAvailability[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance' | 'availability'>('equipment');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalEquipment: 0,
    operationalCount: 0,
    maintenanceCount: 0,
    downCount: 0,
    avgOEE: 0,
    monthlyMaintenanceCost: 0
  });

  // 데모 데이터 생성
  useEffect(() => {
    const demoEquipment: Equipment[] = [
      {
        id: 'EQ001',
        equip_cd: 'M-001',
        equip_nm: 'CNC 가공기 #1',
        equip_type: 'PRODUCTION',
        location: '생산라인 A',
        status: 'OPERATIONAL',
        capacity: 100,
        oee_rate: 87.5,
        last_maintenance: '2024-01-10',
        next_maintenance: '2024-02-10',
        manufacturer: 'FANUC',
        model: 'Robodrill α-D21MiA',
        install_date: '2020-03-15'
      },
      {
        id: 'EQ002',
        equip_cd: 'M-002',
        equip_nm: '프레스 기계 #1',
        equip_type: 'PRODUCTION',
        location: '생산라인 B',
        status: 'MAINTENANCE',
        capacity: 150,
        oee_rate: 82.3,
        last_maintenance: '2024-01-12',
        next_maintenance: '2024-01-25',
        manufacturer: 'AIDA',
        model: 'NS1-200',
        install_date: '2019-07-20'
      },
      {
        id: 'EQ003',
        equip_cd: 'I-001',
        equip_nm: '비전 검사기',
        equip_type: 'INSPECTION',
        location: '검사실',
        status: 'DOWN',
        capacity: 80,
        oee_rate: 65.0,
        last_maintenance: '2024-01-08',
        next_maintenance: '2024-01-20',
        manufacturer: 'KEYENCE',
        model: 'CV-X500',
        install_date: '2021-05-10'
      },
      {
        id: 'EQ004',
        equip_cd: 'P-001',
        equip_nm: '자동 포장기',
        equip_type: 'PACKAGING',
        location: '포장실',
        status: 'OPERATIONAL',
        capacity: 120,
        oee_rate: 91.2,
        last_maintenance: '2024-01-05',
        next_maintenance: '2024-02-05',
        manufacturer: 'OMRON',
        model: 'ROBO-PACKER',
        install_date: '2022-01-15'
      }
    ];

    const demoMaintenanceHistory: MaintenanceHistory[] = [
      {
        id: 'MH001',
        maintenance_no: 'MT-2024-001',
        equip_cd: 'M-001',
        equip_nm: 'CNC 가공기 #1',
        maintenance_type: 'PREVENTIVE',
        start_date: '2024-01-10',
        end_date: '2024-01-10',
        duration_hours: 4,
        technician: '김기술',
        description: '정기 점검 및 정비 작업',
        cost: 500000,
        status: 'COMPLETED',
        parts_used: ['润滑油', '필터']
      },
      {
        id: 'MH002',
        maintenance_no: 'MT-2024-002',
        equip_cd: 'I-001',
        equip_nm: '비전 검사기',
        maintenance_type: 'CORRECTIVE',
        start_date: '2024-01-13',
        end_date: null,
        duration_hours: 0,
        technician: '이수리',
        description: '카메라 모듈 고장 수리',
        cost: 0,
        status: 'IN_PROGRESS',
        parts_used: []
      },
      {
        id: 'MH003',
        maintenance_no: 'MT-2024-003',
        equip_cd: 'M-002',
        equip_nm: '프레스 기계 #1',
        maintenance_type: 'PREVENTIVE',
        start_date: '2024-01-12',
        end_date: '2024-01-12',
        duration_hours: 6,
        technician: '박정비',
        description: '유압 시스템 점검',
        cost: 750000,
        status: 'COMPLETED',
        parts_used: ['유압 오일', '씰']
      },
      {
        id: 'MH004',
        maintenance_no: 'MT-2024-004',
        equip_cd: 'P-001',
        equip_nm: '자동 포장기',
        maintenance_type: 'PREDICTIVE',
        start_date: '2024-01-05',
        end_date: '2024-01-05',
        duration_hours: 2,
        technician: '최점검',
        description: '예지 보수 점검',
        cost: 300000,
        status: 'COMPLETED',
        parts_used: ['벨트']
      }
    ];

    const demoAvailability: EquipmentAvailability[] = [
      {
        equip_cd: 'M-001',
        equip_nm: 'CNC 가공기 #1',
        date: '2024-01-15',
        planned_availability: 90.0,
        actual_availability: 87.5,
        breakdown_hours: 0.5,
        setup_hours: 1.0,
        idle_hours: 1.0
      },
      {
        equip_cd: 'M-002',
        equip_nm: '프레스 기계 #1',
        date: '2024-01-15',
        planned_availability: 85.0,
        actual_availability: 82.3,
        breakdown_hours: 1.5,
        setup_hours: 0.5,
        idle_hours: 0.7
      },
      {
        equip_cd: 'I-001',
        equip_nm: '비전 검사기',
        date: '2024-01-15',
        planned_availability: 95.0,
        actual_availability: 65.0,
        breakdown_hours: 6.0,
        setup_hours: 0.5,
        idle_hours: 2.5
      }
    ];

    setEquipment(demoEquipment);
    setMaintenanceHistory(demoMaintenanceHistory);
    setAvailability(demoAvailability);

    // 통계 계산
    const operationalCount = demoEquipment.filter(e => e.status === 'OPERATIONAL').length;
    const maintenanceCount = demoEquipment.filter(e => e.status === 'MAINTENANCE').length;
    const downCount = demoEquipment.filter(e => e.status === 'DOWN').length;
    const avgOEE = demoEquipment.reduce((sum, e) => sum + e.oee_rate, 0) / demoEquipment.length;

    setStats({
      totalEquipment: demoEquipment.length,
      operationalCount,
      maintenanceCount,
      downCount,
      avgOEE,
      monthlyMaintenanceCost: demoMaintenanceHistory.reduce((sum, m) => sum + m.cost, 0)
    });
  }, []);

  // 필터링된 설비 데이터
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch =
      eq.equip_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.equip_cd.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || eq.status === filterStatus;
    const matchesType = filterType === 'ALL' || eq.equip_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // 필터링된 정비 이력
  const filteredMaintenance = maintenanceHistory.filter(mh =>
    mh.equip_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mh.equip_cd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mh.maintenance_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 상태 뱃지 스타일
  const getStatusBadge = (status: string) => {
    const styles = {
      OPERATIONAL: 'bg-green-100 text-green-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      DOWN: 'bg-red-100 text-red-800',
      IDLE: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const styles = {
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getMaintenanceTypeBadge = (type: string) => {
    const styles = {
      PREVENTIVE: 'bg-blue-100 text-blue-800',
      CORRECTIVE: 'bg-red-100 text-red-800',
      PREDICTIVE: 'bg-purple-100 text-purple-800',
      EMERGENCY: 'bg-orange-100 text-orange-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설비/정비 관리</h1>
        <p className="text-gray-600">설비 상태, 정비 이력 및 가용률 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 설비</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEquipment}</p>
            </div>
            <Settings className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">가동 중</p>
              <p className="text-2xl font-bold text-green-600">{stats.operationalCount}</p>
            </div>
            <Activity className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">정비 중</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenanceCount}</p>
            </div>
            <Wrench className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">고장</p>
              <p className="text-2xl font-bold text-red-600">{stats.downCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 OEE</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgOEE.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* 작업 바 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'equipment'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              설비 현황
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              정비 이력
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'availability'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              가용률 분석
            </button>
          </nav>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'equipment' ? '설비 검색...' :
                            activeTab === 'maintenance' ? '정비번호/설비 검색...' : '검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'equipment' && (
                <>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 상태</option>
                    <option value="OPERATIONAL">가동중</option>
                    <option value="MAINTENANCE">정비중</option>
                    <option value="DOWN">고장</option>
                    <option value="IDLE">대기</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 유형</option>
                    <option value="PRODUCTION">생산</option>
                    <option value="INSPECTION">검사</option>
                    <option value="PACKAGING">포장</option>
                    <option value="STORAGE">저장</option>
                  </select>
                </>
              )}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                필터
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                내보내기
              </button>
              <button
                onClick={() => activeTab === 'equipment' ? setShowCreateModal(true) : setShowMaintenanceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'equipment' ? '설비 등록' :
                 activeTab === 'maintenance' ? '정비 등록' : '보고서'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 설비 현황 탭 */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEquipment.map((eq) => (
              <div key={eq.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{eq.equip_nm}</h3>
                    <p className="text-sm text-gray-500">{eq.equip_cd} | {eq.model}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(eq.status)}`}>
                    {eq.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{eq.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{eq.equip_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">OEE: <span className="font-semibold">{eq.oee_rate.toFixed(1)}%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">용량: {eq.capacity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-3 h-3" />
                      마지막 정비
                    </div>
                    <p className="text-gray-900">{eq.last_maintenance}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="w-3 h-3" />
                      다음 정비
                    </div>
                    <p className="text-gray-900">{eq.next_maintenance}</p>
                  </div>
                </div>

                {/* OEE Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>OEE Rate</span>
                    <span>{eq.oee_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        eq.oee_rate >= 85 ? 'bg-green-600' :
                        eq.oee_rate >= 70 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${eq.oee_rate}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    <FileText className="w-4 h-4" />
                    이력
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
                    <Wrench className="w-4 h-4" />
                    정비
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 정비 이력 탭 */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">정비번호</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">설비</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">정비유형</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">기간</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">소요시간</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">기술자</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">비용</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">상태</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenance.map((mh) => (
                  <tr key={mh.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{mh.maintenance_no}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{mh.equip_nm}</div>
                        <div className="text-sm text-gray-500">{mh.equip_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceTypeBadge(mh.maintenance_type)}`}>
                        {mh.maintenance_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {mh.start_date} ~ {mh.end_date || '진행중'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">{mh.duration_hours}h</td>
                    <td className="py-3 px-4 text-gray-900">{mh.technician}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {mh.cost > 0 ? `${(mh.cost / 10000).toFixed(1)}만원` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(mh.status)}`}>
                        {mh.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 가용률 분석 탭 */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">설비별 가용률 현황</h2>
          <div className="space-y-4">
            {availability.map((av, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{av.equip_nm}</h3>
                    <p className="text-sm text-gray-500">{av.equip_cd} | {av.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">실제 가용률</div>
                    <div className={`text-lg font-bold ${
                      av.actual_availability >= 85 ? 'text-green-600' :
                      av.actual_availability >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {av.actual_availability.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* 가용률 비교 바 */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>계획 가용률</span>
                      <span>{av.planned_availability.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${av.planned_availability}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>실제 가용률</span>
                      <span>{av.actual_availability.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          av.actual_availability >= 85 ? 'bg-green-600' :
                          av.actual_availability >= 70 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${av.actual_availability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 비가동 시간 분석 */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">고장: {av.breakdown_hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">설정: {av.setup_hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">대기: {av.idle_hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 설비 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">신규 설비 등록</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설비 코드</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="M-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설비명</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="CNC 가공기 #1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설비 유형</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="PRODUCTION">생산</option>
                      <option value="INSPECTION">검사</option>
                      <option value="PACKAGING">포장</option>
                      <option value="STORAGE">저장</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="생산라인 A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="FANUC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">모델</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Robodrill α-D21MiA"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">용량</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설치일자</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 정비 등록 모달 */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">정비 작업 등록</h2>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설비</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">설비 선택</option>
                      <option value="M-001">CNC 가공기 #1 (M-001)</option>
                      <option value="M-002">프레스 기계 #1 (M-002)</option>
                      <option value="I-001">비전 검사기 (I-001)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">정비유형</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="PREVENTIVE">예방정비</option>
                      <option value="CORRECTIVE">고장수리</option>
                      <option value="PREDICTIVE">예지보수</option>
                      <option value="EMERGENCY">긴급정비</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일자</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기술자</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="김기술"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 내용</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="정비 작업 내용을 입력하세요..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentMaintenanceManagement;
