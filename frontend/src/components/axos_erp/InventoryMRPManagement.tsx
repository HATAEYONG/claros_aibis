import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Warehouse,
  Truck,
  ArrowUpDown,
  Filter,
  Download,
  Upload
} from 'lucide-react';

// 재고 인터페이스
interface Inventory {
  id: string;
  item_cd: string;
  item_nm: string;
  warehouse_cd: string;
  warehouse_nm: string;
  location: string;
  current_qty: number;
  available_qty: number;
  reserved_qty: number;
  on_order_qty: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  status: 'NORMAL' | 'LOW' | 'OVERSTOCK' | 'OUT_OF_STOCK';
  last_count_date: string;
}

// MRP 계획 인터페이스
interface MRPPlan {
  id: string;
  plan_no: string;
  plan_date: string;
  item_cd: string;
  item_nm: string;
  gross_requirement: number;
  scheduled_receipt: number;
  available_balance: number;
  planned_order_qty: number;
  planned_order_date: string;
  lead_time_days: number;
  lot_size_rule: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PLANNED' | 'RELEASED' | 'CANCELLED';
}

// 재고이동 인터페이스
interface InventoryTransaction {
  id: string;
  transaction_no: string;
  transaction_date: string;
  item_cd: string;
  item_nm: string;
  transaction_type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unit: string;
  warehouse_cd: string;
  warehouse_nm: string;
  reference_no: string;
  reference_type: string;
  cost: number;
  remarks: string;
}

const InventoryMRPManagement: React.FC = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [mrpPlans, setMrpPlans] = useState<MRPPlan[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMrpModal, setShowMrpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'mrp' | 'transaction'>('inventory');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
    pendingOrders: 0,
    turnoverRate: 0
  });

  // 데모 데이터 생성
  useEffect(() => {
    const demoInventory: Inventory[] = [
      {
        id: 'INV001',
        item_cd: 'RM-001',
        item_nm: '원자재-AL',
        warehouse_cd: 'WH-001',
        warehouse_nm: '제1창고',
        location: 'A-01-01',
        current_qty: 2500,
        available_qty: 1800,
        reserved_qty: 700,
        on_order_qty: 500,
        unit: 'KG',
        unit_cost: 3500,
        total_value: 8750000,
        min_stock: 1000,
        max_stock: 5000,
        reorder_point: 1500,
        status: 'NORMAL',
        last_count_date: '2024-01-10'
      },
      {
        id: 'INV002',
        item_cd: 'RM-002',
        item_nm: '원자재-ST',
        warehouse_cd: 'WH-001',
        warehouse_nm: '제1창고',
        location: 'A-01-02',
        current_qty: 400,
        available_qty: 200,
        reserved_qty: 200,
        on_order_qty: 0,
        unit: 'KG',
        unit_cost: 2800,
        total_value: 1120000,
        min_stock: 500,
        max_stock: 2000,
        reorder_point: 800,
        status: 'LOW',
        last_count_date: '2024-01-12'
      },
      {
        id: 'INV003',
        item_cd: 'RM-003',
        item_nm: '원자재-CU',
        warehouse_cd: 'WH-002',
        warehouse_nm: '제2창고',
        location: 'B-02-01',
        current_qty: 0,
        available_qty: 0,
        reserved_qty: 0,
        on_order_qty: 300,
        unit: 'KG',
        unit_cost: 4200,
        total_value: 0,
        min_stock: 300,
        max_stock: 1500,
        reorder_point: 500,
        status: 'OUT_OF_STOCK',
        last_count_date: '2024-01-08'
      },
      {
        id: 'INV004',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        warehouse_cd: 'WH-003',
        warehouse_nm: '제품창고',
        location: 'C-01-01',
        current_qty: 850,
        available_qty: 600,
        reserved_qty: 250,
        on_order_qty: 0,
        unit: 'EA',
        unit_cost: 188700,
        total_value: 160395000,
        min_stock: 100,
        max_stock: 1000,
        reorder_point: 200,
        status: 'NORMAL',
        last_count_date: '2024-01-14'
      },
      {
        id: 'INV005',
        item_cd: 'SA-001',
        item_nm: '반조립-1',
        warehouse_cd: 'WH-002',
        warehouse_nm: '제2창고',
        location: 'B-03-01',
        current_qty: 450,
        available_qty: 450,
        reserved_qty: 0,
        on_order_qty: 0,
        unit: 'EA',
        unit_cost: 37900,
        total_value: 17055000,
        min_stock: 100,
        max_stock: 500,
        reorder_point: 150,
        status: 'OVERSTOCK',
        last_count_date: '2024-01-11'
      }
    ];

    const demoMRPPlans: MRPPlan[] = [
      {
        id: 'MRP001',
        plan_no: 'MRP-2024-001',
        plan_date: '2024-01-15',
        item_cd: 'RM-003',
        item_nm: '원자재-CU',
        gross_requirement: 500,
        scheduled_receipt: 300,
        available_balance: -200,
        planned_order_qty: 500,
        planned_order_date: '2024-01-20',
        lead_time_days: 5,
        lot_size_rule: 'FOQ',
        priority: 'HIGH',
        status: 'PLANNED'
      },
      {
        id: 'MRP002',
        plan_no: 'MRP-2024-002',
        plan_date: '2024-01-15',
        item_cd: 'RM-002',
        item_nm: '원자재-ST',
        gross_requirement: 1000,
        scheduled_receipt: 0,
        available_balance: -600,
        planned_order_qty: 1000,
        planned_order_date: '2024-01-18',
        lead_time_days: 3,
        lot_size_rule: 'LFL',
        priority: 'HIGH',
        status: 'PLANNED'
      },
      {
        id: 'MRP003',
        plan_no: 'MRP-2024-003',
        plan_date: '2024-01-15',
        item_cd: 'RM-001',
        item_nm: '원자재-AL',
        gross_requirement: 2000,
        scheduled_receipt: 500,
        available_balance: 300,
        planned_order_qty: 0,
        planned_order_date: '',
        lead_time_days: 4,
        lot_size_rule: 'FOQ',
        priority: 'LOW',
        status: 'PLANNED'
      }
    ];

    const demoTransactions: InventoryTransaction[] = [
      {
        id: 'TXN001',
        transaction_no: 'TXN-2024-001',
        transaction_date: '2024-01-15',
        item_cd: 'RM-001',
        item_nm: '원자재-AL',
        transaction_type: 'RECEIPT',
        quantity: 500,
        unit: 'KG',
        warehouse_cd: 'WH-001',
        warehouse_nm: '제1창고',
        reference_no: 'PO-2024-001',
        reference_type: '구매오더',
        cost: 1750000,
        remarks: '정상 입고'
      },
      {
        id: 'TXN002',
        transaction_no: 'TXN-2024-002',
        transaction_date: '2024-01-14',
        item_cd: 'FP-001',
        item_nm: '완제품-A',
        transaction_type: 'ISSUE',
        quantity: 250,
        unit: 'EA',
        warehouse_cd: 'WH-003',
        warehouse_nm: '제품창고',
        reference_no: 'SO-2024-001',
        reference_type: '판매오더',
        cost: 47175000,
        remarks: '출하'
      },
      {
        id: 'TXN003',
        transaction_no: 'TXN-2024-003',
        transaction_date: '2024-01-13',
        item_cd: 'RM-002',
        item_nm: '원자재-ST',
        transaction_type: 'TRANSFER',
        quantity: 100,
        unit: 'KG',
        warehouse_cd: 'WH-001',
        warehouse_nm: '제1창고',
        reference_no: 'TF-2024-001',
        reference_type: '창고이동',
        cost: 280000,
        remarks: '제1창고 → 제2창고'
      }
    ];

    setInventory(demoInventory);
    setMrpPlans(demoMRPPlans);
    setTransactions(demoTransactions);

    // 통계 계산
    const lowStockItems = demoInventory.filter(i => i.status === 'LOW' || i.status === 'OUT_OF_STOCK').length;
    const totalValue = demoInventory.reduce((sum, i) => sum + i.total_value, 0);

    setStats({
      totalItems: demoInventory.length,
      lowStockItems,
      totalInventoryValue: totalValue,
      pendingOrders: demoMRPPlans.filter(m => m.status === 'PLANNED').length,
      turnoverRate: 4.2
    });
  }, []);

  // 필터링된 재고 데이터
  const filteredInventory = inventory.filter(inv => {
    const matchesSearch =
      inv.item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.item_cd.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchesWarehouse = filterWarehouse === 'ALL' || inv.warehouse_cd === filterWarehouse;

    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  // 필터링된 MRP 계획
  const filteredMrpPlans = mrpPlans.filter(mrp =>
    mrp.item_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mrp.item_cd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mrp.plan_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 상태 뱃지 스타일
  const getStatusBadge = (status: string) => {
    const styles = {
      NORMAL: 'bg-green-100 text-green-800',
      LOW: 'bg-yellow-100 text-yellow-800',
      OVERSTOCK: 'bg-blue-100 text-blue-800',
      OUT_OF_STOCK: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionTypeBadge = (type: string) => {
    const styles = {
      RECEIPT: 'bg-green-100 text-green-800',
      ISSUE: 'bg-red-100 text-red-800',
      TRANSFER: 'bg-blue-100 text-blue-800',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
      RETURN: 'bg-purple-100 text-purple-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800'
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">재고/MRP 관리</h1>
        <p className="text-gray-600">재고 현황, 자재소요계획(MRP) 및 재고이동 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 품목</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">저재고</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 평가액</p>
              <p className="text-xl font-bold text-gray-900">
                {(stats.totalInventoryValue / 100000000).toFixed(2)}억원
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">MRP 계획</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pendingOrders}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">회전률</p>
              <p className="text-2xl font-bold text-orange-600">{stats.turnoverRate.toFixed(1)}</p>
            </div>
            <ArrowUpDown className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* 작업 바 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              재고 현황
            </button>
            <button
              onClick={() => setActiveTab('mrp')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mrp'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              MRP 계획
            </button>
            <button
              onClick={() => setActiveTab('transaction')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transaction'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              재고이동
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
                  placeholder={activeTab === 'inventory' ? '품목 검색...' :
                            activeTab === 'mrp' ? '계획/품목 검색...' : '이동번호/품목 검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'inventory' && (
                <>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 상태</option>
                    <option value="NORMAL">정상</option>
                    <option value="LOW">저재고</option>
                    <option value="OVERSTOCK">과잉재고</option>
                    <option value="OUT_OF_STOCK">품절</option>
                  </select>
                  <select
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">전체 창고</option>
                    <option value="WH-001">제1창고</option>
                    <option value="WH-002">제2창고</option>
                    <option value="WH-003">제품창고</option>
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
                <Upload className="w-4 h-4" />
                가져오기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                내보내기
              </button>
              <button
                onClick={() => activeTab === 'inventory' ? setShowCreateModal(true) : setShowMrpModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'inventory' ? '입고 등록' :
                 activeTab === 'mrp' ? 'MRP 실행' : '이동 등록'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 재고 현황 탭 */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">창고/위치</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">현재고</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">가용재고</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">발주중</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">총 평가액</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">상태</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{inv.item_nm}</div>
                        <div className="text-sm text-gray-500">{inv.item_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{inv.warehouse_nm}</span>
                        </div>
                        <div className="text-sm text-gray-500">{inv.location}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {inv.current_qty.toLocaleString()} {inv.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {inv.available_qty.toLocaleString()} {inv.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {inv.on_order_qty > 0 ? `${inv.on_order_qty.toLocaleString()} ${inv.unit}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {(inv.total_value / 10000).toFixed(0).toLocaleString()}만원
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>
                        {inv.status === 'NORMAL' ? '정상' :
                         inv.status === 'LOW' ? '저재고' :
                         inv.status === 'OVERSTOCK' ? '과잉' : '품절'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Truck className="w-4 h-4" />
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

      {/* MRP 계획 탭 */}
      {activeTab === 'mrp' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">계획번호</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">총소요</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">확정입고</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">잔량</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">계획오더</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">납기일</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">우선순위</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredMrpPlans.map((mrp) => (
                  <tr key={mrp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{mrp.plan_no}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{mrp.item_nm}</div>
                        <div className="text-sm text-gray-500">{mrp.item_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {mrp.gross_requirement.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {mrp.scheduled_receipt.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${mrp.available_balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {mrp.available_balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {mrp.planned_order_qty > 0 ? mrp.planned_order_qty.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {mrp.planned_order_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(mrp.priority)}`}>
                        {mrp.priority === 'HIGH' ? '높음' : mrp.priority === 'MEDIUM' ? '중간' : '낮음'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mrp.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                        mrp.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mrp.status === 'PLANNED' ? '계획' : mrp.status === 'RELEASED' ? '확정' : '취소'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 재고이동 탭 */}
      {activeTab === 'transaction' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">이동번호</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">일자</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">품목</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">유형</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">수량</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">창고</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">참조번호</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">비용</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">비고</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{txn.transaction_no}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {txn.transaction_date}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{txn.item_nm}</div>
                        <div className="text-sm text-gray-500">{txn.item_cd}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeBadge(txn.transaction_type)}`}>
                        {txn.transaction_type === 'RECEIPT' ? '입고' :
                         txn.transaction_type === 'ISSUE' ? '출고' :
                         txn.transaction_type === 'TRANSFER' ? '이동' :
                         txn.transaction_type === 'ADJUSTMENT' ? '조정' : '반품'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        txn.transaction_type === 'RECEIPT' || txn.transaction_type === 'RETURN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.transaction_type === 'RECEIPT' || txn.transaction_type === 'RETURN' ? '+' : '-'}
                        {txn.quantity.toLocaleString()} {txn.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-gray-400" />
                        {txn.warehouse_nm}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{txn.reference_no}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {(txn.cost / 10000).toFixed(0).toLocaleString()}만원
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{txn.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 입고 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">입고 등록</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">품목 코드</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="RM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">창고</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">창고 선택</option>
                      <option value="WH-001">제1창고</option>
                      <option value="WH-002">제2창고</option>
                      <option value="WH-003">제품창고</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입고수량</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>EA</option>
                      <option>KG</option>
                      <option>L</option>
                      <option>M</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">참조번호</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="PO-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="입고 비고를 입력하세요..."
                  />
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

      {/* MRP 실행 모달 */}
      {showMrpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">MRP 실행</h2>
              <button
                onClick={() => setShowMrpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획 기간</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="1W">1주일</option>
                    <option value="2W">2주일</option>
                    <option value="1M">1개월</option>
                    <option value="3M">3개월</option>
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">MRP 실행 옵션:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 재고 현황 기반 소요량 계산</li>
                    <li>• 리드타임 반납 발주일 계산</li>
                    <li>• 로트 사이즈 규칙 적용</li>
                    <li>• 우선순위별 정렬</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMrpModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    실행
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

export default InventoryMRPManagement;
