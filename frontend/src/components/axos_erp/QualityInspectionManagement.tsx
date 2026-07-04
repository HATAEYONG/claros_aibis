import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Calendar,
  User,
  Package,
  FileText,
  BarChart3
} from 'lucide-react';

// 검사 결과 인터페이스
interface InspectionResult {
  id: string;
  inspection_no: string;
  inspection_date: string;
  item_cd: string;
  item_nm: string;
  lot_no: string;
  inspection_type: 'INCOMING' | 'PROCESS' | 'FINAL' | 'OUTGOING';
  inspector_id: string;
  inspector_nm: string;
  sample_size: number;
  defect_count: number;
  pass_rate: number;
  status: 'PASS' | 'FAIL' | 'HOLD' | 'RETEST';
  remarks: string;
}

// 불량 유형 인터페이스
interface DefectType {
  id: string;
  defect_cd: string;
  defect_nm: string;
  category: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string;
  occurrence_count: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

// 검사 기준 인터페이스
interface InspectionStandard {
  id: string;
  item_cd: string;
  item_nm: string;
  test_item: string;
  specification: string;
  upper_limit: number | null;
  lower_limit: number | null;
  unit: string;
}

const QualityInspectionManagement: React.FC = () => {
  const [inspections, setInspections] = useState<InspectionResult[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [standards, setStandards] = useState<InspectionStandard[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<InspectionResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspection' | 'defect' | 'standard'>('inspection');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalInspections: 0,
    passRate: 0,
    defectRate: 0,
    criticalDefects: 0,
    monthlyTrend: [] as { month: string; rate: number }[]
  });

  // 데모 데이터 생성
  useEffect(() => {
    const demoInspections: InspectionResult[] = [
      {
        id: 'INS001',
        inspection_no: 'QC-2024-001',
        inspection_date: '2024-01-15',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        lot_no: 'LOT-2024-001',
        inspection_type: 'FINAL',
        inspector_id: 'INS001',
        inspector_nm: '김검사',
        sample_size: 100,
        defect_count: 2,
        pass_rate: 98.0,
        status: 'PASS',
        remarks: '정상 검사 완료'
      },
      {
        id: 'INS002',
        inspection_no: 'QC-2024-002',
        inspection_date: '2024-01-15',
        item_cd: 'RM-001',
        item_nm: '원자재-AL',
        lot_no: 'LOT-2024-002',
        inspection_type: 'INCOMING',
        inspector_id: 'INS002',
        inspector_nm: '이검사',
        sample_size: 50,
        defect_count: 8,
        pass_rate: 84.0,
        status: 'FAIL',
        remarks: '크기 불량 발생'
      },
      {
        id: 'INS003',
        inspection_no: 'QC-2024-003',
        inspection_date: '2024-01-14',
        item_cd: 'SA-001',
        item_nm: '반조립-1',
        lot_no: 'LOT-2024-003',
        inspection_type: 'PROCESS',
        inspector_id: 'INS001',
        inspector_nm: '김검사',
        sample_size: 75,
        defect_count: 3,
        pass_rate: 96.0,
        status: 'PASS',
        remarks: '표면 흠집 3건 발생'
      },
      {
        id: 'INS004',
        inspection_no: 'QC-2024-004',
        inspection_date: '2024-01-14',
        item_cd: 'FP-002',
        item_nm: '완제품-B',
        lot_no: 'LOT-2024-004',
        inspection_type: 'FINAL',
        inspector_id: 'INS003',
        inspector_nm: '박검사',
        sample_size: 100,
        defect_count: 0,
        pass_rate: 100.0,
        status: 'PASS',
        remarks: '무결점'
      },
      {
        id: 'INS005',
        inspection_no: 'QC-2024-005',
        inspection_date: '2024-01-13',
        item_cd: 'RM-002',
        item_nm: '원자재-ST',
        lot_no: 'LOT-2024-005',
        inspection_type: 'INCOMING',
        inspector_id: 'INS002',
        inspector_nm: '이검사',
        sample_size: 50,
        defect_count: 5,
        pass_rate: 90.0,
        status: 'HOLD',
        remarks: '재검사 필요'
      }
    ];

    const demoDefectTypes: DefectType[] = [
      {
        id: 'DFT001',
        defect_cd: 'CRACK',
        defect_nm: '균열',
        category: 'CRITICAL',
        description: '제품 표면 또는 내부 균열',
        occurrence_count: 5,
        trend: 'UP'
      },
      {
        id: 'DFT002',
        defect_cd: 'SCRATCH',
        defect_nm: '흠집',
        category: 'MINOR',
        description: '표면 미세 흠집',
        occurrence_count: 15,
        trend: 'DOWN'
      },
      {
        id: 'DFT003',
        defect_cd: 'SIZE_ERR',
        defect_nm: '치수 오차',
        category: 'MAJOR',
        description: '규격 치수 초과 오차',
        occurrence_count: 8,
        trend: 'STABLE'
      },
      {
        id: 'DFT004',
        defect_cd: 'COLOR_DIFF',
        defect_nm: '색상 차이',
        category: 'MINOR',
        description: '표준 색상과의 차이',
        occurrence_count: 3,
        trend: 'DOWN'
      }
    ];

    const demoStandards: InspectionStandard[] = [
      {
        id: 'STD001',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        test_item: '외관 검사',
        specification: '흠집 없음',
        upper_limit: null,
        lower_limit: null,
        unit: 'PASS/FAIL'
      },
      {
        id: 'STD002',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        test_item: '치료 검사',
        specification: '100 ± 0.5mm',
        upper_limit: 100.5,
        lower_limit: 99.5,
        unit: 'mm'
      },
      {
        id: 'STD003',
        item_cd: 'RM-001',
        item_nm: '원자재-AL',
        test_item: '강도 시험',
        specification: '≥ 250 N/mm²',
        upper_limit: null,
        lower_limit: 250,
        unit: 'N/mm²'
      }
    ];

    setInspections(demoInspections);
    setDefectTypes(demoDefectTypes);
    setStandards(demoStandards);

    // 통계 계산
    const passCount = demoInspections.filter(i => i.status === 'PASS').length;
    const totalCount = demoInspections.reduce((sum, i) => sum + i.sample_size, 0);
    const totalDefects = demoInspections.reduce((sum, i) => sum + i.defect_count, 0);

    setStats({
      totalInspections: demoInspections.length,
      passRate: (passCount / demoInspections.length) * 100,
      defectRate: (totalDefects / totalCount) * 100,
      criticalDefects: demoDefectTypes.filter(d => d.category === 'CRITICAL').length,
      monthlyTrend: [
        { month: '10월', rate: 95.5 },
        { month: '11월', rate: 96.2 },
        { month: '12월', rate: 97.1 },
        { month: '1월', rate: 97.8 }
      ]
    });
  }, []);

  // 필터링된 검사 데이터
  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch =
      inspection.item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.item_cd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspection_no.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || inspection.status === filterStatus;
    const matchesType = filterType === 'ALL' || inspection.inspection_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // 상태 뱃지 스타일
  const getStatusBadge = (status: string) => {
    const styles = {
      PASS: 'bg-green-100 text-green-800',
      FAIL: 'bg-red-100 text-red-800',
      HOLD: 'bg-yellow-100 text-yellow-800',
      RETEST: 'bg-orange-100 text-orange-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // 검사 유형 뱃지 스타일
  const getTypeBadge = (type: string) => {
    const styles = {
      INCOMING: 'bg-blue-100 text-blue-800',
      PROCESS: 'bg-purple-100 text-purple-800',
      FINAL: 'bg-green-100 text-green-800',
      OUTGOING: 'bg-orange-100 text-orange-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">품질검사/불량 관리</h1>
        <p className="text-gray-600">검사 결과, 불량 유형 및 품질 기준 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 검사 건수</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInspections}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">합격률</p>
              <p className="text-2xl font-bold text-green-600">{stats.passRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">불량률</p>
              <p className="text-2xl font-bold text-red-600">{stats.defectRate.toFixed(2)}%</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">중대 불량</p>
              <p className="text-2xl font-bold text-orange-600">{stats.criticalDefects}</p>
            </div>
            <XCircle className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* 월간 추이 차트 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">월간 합격률 추이</h2>
        <div className="flex items-end justify-between h-40 gap-4">
          {stats.monthlyTrend.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                style={{ height: `${(data.rate - 94) * 8}%` }}
              />
              <div className="mt-2 text-sm text-gray-600">{data.month}</div>
              <div className="text-xs font-semibold text-gray-900">{data.rate.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 작업 바 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('inspection')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inspection'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              검사 결과
            </button>
            <button
              onClick={() => setActiveTab('defect')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'defect'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              불량 유형
            </button>
            <button
              onClick={() => setActiveTab('standard')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'standard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              검사 기준
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
                  placeholder={activeTab === 'inspection' ? '품목/검사번호 검색...' : '검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'inspection' && (
                <>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 상태</option>
                    <option value="PASS">합격</option>
                    <option value="FAIL">불합격</option>
                    <option value="HOLD">보류</option>
                    <option value="RETEST">재검사</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 유형</option>
                    <option value="INCOMING">수입검사</option>
                    <option value="PROCESS">공정검사</option>
                    <option value="FINAL">최종검사</option>
                    <option value="OUTGOING">출하검사</option>
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
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'inspection' ? '검사 등록' :
                 activeTab === 'defect' ? '불량 등록' : '기준 등록'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 검사 결과 탭 */}
      {activeTab === 'inspection' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">검사번호</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">검사일자</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">검사유형</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">검사수/불량</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">합격률</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">상태</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{inspection.inspection_no}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {inspection.inspection_date}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{inspection.item_nm}</div>
                        <div className="text-sm text-gray-500">{inspection.item_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(inspection.inspection_type)}`}>
                        {inspection.inspection_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {inspection.sample_size} / <span className="text-red-600">{inspection.defect_count}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              inspection.pass_rate >= 95 ? 'bg-green-600' :
                              inspection.pass_rate >= 85 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${inspection.pass_rate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{inspection.pass_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(inspection.status)}`}>
                        {inspection.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedInspection(inspection);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 불량 유형 탭 */}
      {activeTab === 'defect' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defectTypes.map((defect) => (
              <div key={defect.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{defect.defect_nm}</h3>
                    <p className="text-sm text-gray-500">{defect.defect_cd}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    defect.category === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    defect.category === 'MAJOR' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {defect.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{defect.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{defect.occurrence_count}</span>
                    <span className="text-sm text-gray-500">건</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    defect.trend === 'UP' ? 'text-red-600' :
                    defect.trend === 'DOWN' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {defect.trend === 'UP' ? <TrendingUp className="w-4 h-4" /> :
                     defect.trend === 'DOWN' ? <TrendingDown className="w-4 h-4" /> :
                     <div className="w-4 h-4" />}
                    {defect.trend === 'UP' ? '증가' :
                     defect.trend === 'DOWN' ? '감소' : '안정'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검사 기준 탭 */}
      {activeTab === 'standard' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">시험항목</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">규격</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">상한</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">하한</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">단위</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {standards.map((standard) => (
                  <tr key={standard.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{standard.item_nm}</div>
                        <div className="text-sm text-gray-500">{standard.item_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{standard.test_item}</td>
                    <td className="py-3 px-4 text-gray-700">{standard.specification}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {standard.upper_limit !== null ? standard.upper_limit : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {standard.lower_limit !== null ? standard.lower_limit : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{standard.unit}</td>
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

      {/* 검사 상세 모달 */}
      {showDetailModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">검사 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">검사번호</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.inspection_no}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">검사일자</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.inspection_date}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">품목</label>
                  <p className="font-semibold text-gray-900">
                    {selectedInspection.item_nm} ({selectedInspection.item_cd})
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">LOT 번호</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.lot_no}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">검사유형</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.inspection_type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">검사원</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.inspector_nm}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">검사수량</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.sample_size}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">불량수</label>
                  <p className="font-semibold text-red-600">{selectedInspection.defect_count}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">합격률</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.pass_rate.toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">상태</label>
                  <p className="font-semibold">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedInspection.status)}`}>
                      {selectedInspection.status}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">비고</label>
                  <p className="font-semibold text-gray-900">{selectedInspection.remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검사 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {activeTab === 'inspection' ? '검사 결과 등록' :
                 activeTab === 'defect' ? '불량 유형 등록' : '검사 기준 등록'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                {activeTab === 'inspection' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">품목 코드</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LOT 번호</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">검사유형</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="INCOMING">수입검사</option>
                          <option value="PROCESS">공정검사</option>
                          <option value="FINAL">최종검사</option>
                          <option value="OUTGOING">출하검사</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">검사일자</label>
                        <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">검사수량</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">불량수</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                      <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                    </div>
                  </>
                )}
                {activeTab === 'defect' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">불량 코드</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">불량명</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="CRITICAL">중대(Critical)</option>
                        <option value="MAJOR">주요(Major)</option>
                        <option value="MINOR">경미(Minor)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                      <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                    </div>
                  </>
                )}
                {activeTab === 'standard' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">품목 코드</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시험항목</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상한</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">하한</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  </>
                )}
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
    </div>
  );
};

export default QualityInspectionManagement;
