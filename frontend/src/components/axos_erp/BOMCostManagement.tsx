import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  ChevronDown,
  Filter,
  Download,
  Upload
} from 'lucide-react';

// BOM 아이템 인터페이스
interface BOMItem {
  id: string;
  parent_item_cd: string;
  parent_item_nm: string;
  child_item_cd: string;
  child_item_nm: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  level: number;
  usage_type: 'PRODUCTION' | 'ASSEMBLY' | 'SUBASSEMBLY';
  valid_from: string;
  valid_to: string;
  status: 'ACTIVE' | 'PENDING' | 'OBSOLETE';
}

// 원가 집계 인터페이스
interface CostSummary {
  item_cd: string;
  item_nm: string;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  last_updated: string;
}

const BOMCostManagement: React.FC = () => {
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [costSummaries, setCostSummaries] = useState<CostSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<BOMItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'bom' | 'cost'>('bom');

  // 통계 카드 데이터
  const [stats, setStats] = useState({
    totalBomItems: 0,
    activeItems: 0,
    totalCost: 0,
    avgCostPerItem: 0
  });

  // 데모 데이터 생성
  useEffect(() => {
    const demoBOMItems: BOMItem[] = [
      {
        id: 'BOM001',
        parent_item_cd: 'FP-001',
        parent_item_nm: '완제품-A',
        child_item_cd: 'SA-001',
        child_item_nm: '반조립-1',
        quantity: 1,
        unit: 'EA',
        unit_cost: 45000,
        total_cost: 45000,
        level: 1,
        usage_type: 'PRODUCTION',
        valid_from: '2024-01-01',
        valid_to: '9999-12-31',
        status: 'ACTIVE'
      },
      {
        id: 'BOM002',
        parent_item_cd: 'FP-001',
        parent_item_nm: '완제품-A',
        child_item_cd: 'SA-002',
        child_item_nm: '반조립-2',
        quantity: 2,
        unit: 'EA',
        unit_cost: 32000,
        total_cost: 64000,
        level: 1,
        usage_type: 'PRODUCTION',
        valid_from: '2024-01-01',
        valid_to: '9999-12-31',
        status: 'ACTIVE'
      },
      {
        id: 'BOM003',
        parent_item_cd: 'SA-001',
        parent_item_nm: '반조립-1',
        child_item_cd: 'RM-001',
        child_item_nm: '원자재-AL',
        quantity: 5,
        unit: 'KG',
        unit_cost: 3500,
        total_cost: 17500,
        level: 2,
        usage_type: 'ASSEMBLY',
        valid_from: '2024-01-01',
        valid_to: '9999-12-31',
        status: 'ACTIVE'
      },
      {
        id: 'BOM004',
        parent_item_cd: 'SA-001',
        parent_item_nm: '반조립-1',
        child_item_cd: 'RM-002',
        child_item_nm: '원자재-ST',
        quantity: 3,
        unit: 'KG',
        unit_cost: 2800,
        total_cost: 8400,
        level: 2,
        usage_type: 'ASSEMBLY',
        valid_from: '2024-01-01',
        valid_to: '9999-12-31',
        status: 'ACTIVE'
      },
      {
        id: 'BOM005',
        parent_item_cd: 'SA-002',
        parent_item_nm: '반조립-2',
        child_item_cd: 'RM-003',
        child_item_nm: '원자재-CU',
        quantity: 4,
        unit: 'KG',
        unit_cost: 4200,
        total_cost: 16800,
        level: 2,
        usage_type: 'ASSEMBLY',
        valid_from: '2024-01-01',
        valid_to: '9999-12-31',
        status: 'ACTIVE'
      }
    ];

    const demoCostSummaries: CostSummary[] = [
      {
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        material_cost: 151700,
        labor_cost: 25000,
        overhead_cost: 12000,
        total_cost: 188700,
        last_updated: '2024-01-15'
      },
      {
        item_cd: 'FP-002',
        item_nm: '완제품-B',
        material_cost: 125000,
        labor_cost: 20000,
        overhead_cost: 10000,
        total_cost: 155000,
        last_updated: '2024-01-15'
      },
      {
        item_cd: 'SA-001',
        item_nm: '반조립-1',
        material_cost: 25900,
        labor_cost: 8000,
        overhead_cost: 4000,
        total_cost: 37900,
        last_updated: '2024-01-10'
      }
    ];

    setBomItems(demoBOMItems);
    setCostSummaries(demoCostSummaries);

    // 통계 계산
    const activeItems = demoBOMItems.filter(item => item.status === 'ACTIVE');
    const totalCost = activeItems.reduce((sum, item) => sum + item.total_cost, 0);

    setStats({
      totalBomItems: demoBOMItems.length,
      activeItems: activeItems.length,
      totalCost: totalCost,
      avgCostPerItem: activeItems.length > 0 ? totalCost / activeItems.length : 0
    });
  }, []);

  // 노드 확장/축소
  const toggleNode = (itemId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedNodes(newExpanded);
  };

  // 필터링된 BOM 아이템
  const filteredBOMItems = bomItems.filter(item =>
    item.parent_item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.child_item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.parent_item_cd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.child_item_cd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 필터링된 원가 요약
  const filteredCostSummaries = costSummaries.filter(summary =>
    summary.item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.item_cd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // BOM 트리 렌더링
  const renderBOMTree = () => {
    // 최상위 항목 찾기 (레벨 1)
    const rootItems = filteredBOMItems.filter(item => item.level === 1);

    return (
      <div className="space-y-2">
        {rootItems.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleNode(item.id)}
            >
              <div className="flex items-center gap-3">
                {expandedNodes.has(item.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {item.parent_item_nm} ({item.parent_item_cd})
                  </div>
                  <div className="text-sm text-gray-500">
                    Level {item.level} | {item.usage_type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {item.total_cost.toLocaleString()}원
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} {item.unit} × {item.unit_cost.toLocaleString()}원
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {expandedNodes.has(item.id) && (
              <div className="p-4 bg-white border-t">
                {renderBOMChildren(item.child_item_cd, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // BOM 자식 항목 렌더링 (재귀)
  const renderBOMChildren = (parentCd: string, currentLevel: number) => {
    const children = filteredBOMItems.filter(item => item.parent_item_cd === parentCd);

    if (children.length === 0) {
      return (
        <div className="text-gray-500 text-sm pl-8 py-2">
          하위 구성요소 없음
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {children.map(child => (
          <div key={child.id} className="pl-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">
                    {child.child_item_nm} ({child.child_item_cd})
                  </div>
                  <div className="text-sm text-gray-500">
                    Level {child.level} | {child.usage_type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {child.total_cost.toLocaleString()}원
                  </div>
                  <div className="text-sm text-gray-500">
                    {child.quantity} {child.unit} × {child.unit_cost.toLocaleString()}원
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  child.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  child.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {child.status}
                </span>
              </div>
            </div>
            {currentLevel < 3 && renderBOMChildren(child.child_item_cd, currentLevel + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BOM/원가 관리</h1>
        <p className="text-gray-600">제품 BOM 구조 및 원가 분석 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 BOM 항목</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBomItems}</p>
            </div>
            <Layers className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">활성 항목</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeItems}</p>
            </div>
            <Package className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 원가</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCost.toLocaleString()}원
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 단가</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.avgCostPerItem).toLocaleString()}원
              </p>
            </div>
            <FileText className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* 작업 바 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bom'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              BOM 구조
            </button>
            <button
              onClick={() => setActiveTab('cost')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cost'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              원가 분석
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
                  placeholder={activeTab === 'bom' ? '품목 코드/명 검색...' : '품목 검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                필터
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                가져오기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                내보내기
              </button>
              <button
                onClick={() => activeTab === 'bom' ? setShowCreateModal(true) : setShowCostModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'bom' ? 'BOM 추가' : '원가 계산'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOM 구조 탭 */}
      {activeTab === 'bom' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">BOM 트리 구조</h2>
          {renderBOMTree()}
        </div>
      )}

      {/* 원가 분석 탭 */}
      {activeTab === 'cost' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">품목별 원가 분석</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목 코드</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목명</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">재료비</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">노무비</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">간접비</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">총 원가</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredCostSummaries.map((summary) => (
                  <tr key={summary.item_cd} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{summary.item_cd}</td>
                    <td className="py-3 px-4 text-gray-700">{summary.item_nm}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {summary.material_cost.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {summary.labor_cost.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {summary.overhead_cost.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {summary.total_cost.toLocaleString()}원
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

      {/* BOM 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">신규 BOM 등록</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상위 품목 코드
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="FP-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      하위 품목 코드
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="RM-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      소요량
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      단위
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>EA</option>
                      <option>KG</option>
                      <option>L</option>
                      <option>M</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      단가 (원)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="10000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용 유형
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="PRODUCTION">생산</option>
                      <option value="ASSEMBLY">조립</option>
                      <option value="SUBASSEMBLY">하위조립</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="ACTIVE">활성</option>
                      <option value="PENDING">대기</option>
                      <option value="OBSOLETE">폐기</option>
                    </select>
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

      {/* 원가 계산 모달 */}
      {showCostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">원가 계산</h2>
              <button
                onClick={() => setShowCostModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대상 품목
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">품목 선택</option>
                    <option value="FP-001">완제품-A (FP-001)</option>
                    <option value="FP-002">완제품-B (FP-002)</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    선택된 품목의 BOM 구조를 기반으로 원가를 계산합니다.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 재료비: 하위 품목 단가 합계</li>
                    <li>• 노무비: 공정별 작업 시간 × 시간당 단가</li>
                    <li>• 간접비: 경비 배분율 적용</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCostModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    계산 실행
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

export default BOMCostManagement;
