import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  ShoppingCartIcon,
  TrendUpIcon,
  PackageIcon,
  CheckIcon,
  DollarIcon,
  ActivityIcon
} from '@/components/icons/Icons';
import api from '@/services/api';
import dashboardDataService from '@/services/dashboardDataService';

interface MonthlyPurchase {
  id: number;
  fiscal_year: number;
  fiscal_month: number;
  purchase_amount: string;
  previous_month_change: string;
  order_count: number;
  pending_orders: number;
}

interface Inventory {
  id: number;
  item_code: string;
  item_name: string;
  category: string;
  current_stock: number;
  safety_stock: number;
  stock_value: string;
  turnover_rate: string;
  status: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  item_name: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  order_date: string;
  delivery_date: string;
  status: string;
  is_urgent: boolean;
}

interface Supplier {
  id: number;
  supplier_code: string;
  supplier_name: string;
  quality_score: string;
  delivery_score: string;
  price_score: string;
  service_score: string;
  total_score: string;
  grade: string;
  trend: string;
  purchase_share: string;
}

interface InventoryTurnover {
  id: number;
  fiscal_month: number;
  category: string;
  turnover_rate: string;
  days_in_inventory: number;
}

const Purchase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyPurchases, setMonthlyPurchases] = useState<MonthlyPurchase[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [turnover, setTurnover] = useState<InventoryTurnover[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // ERP 매핑 서비스 사용 (구매/자재 관리 대시보드)
        const procurementRes = await dashboardDataService.dashboard.getProcurementDashboard({
          date: new Date().toISOString().split('T')[0]
        });

        // ERP 매핑 데이터 변환 - 임시 처리
        // TODO: 실제 ERP DB 연결 후 데이터 구조 맵핑 필요
        const procurementData = procurementRes.results?.[0] || {};

        // 기존 API를 백업으로 사용
        const [monthlyRes, invRes, ordersRes, suppliersRes, turnoverRes] = await Promise.all([
          api.purchase.getMonthly('fiscal_year=2024'),
          api.purchase.getInventory(),
          api.purchase.getOrders(),
          api.purchase.getSuppliers(),
          api.purchase.getTurnover('fiscal_year=2024'),
        ]);

        setMonthlyPurchases(Array.isArray(monthlyRes) ? monthlyRes : monthlyRes.results || []);
        setInventory(Array.isArray(invRes) ? invRes : invRes.results || []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.results || []);
        setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : suppliersRes.results || []);
        setTurnover(Array.isArray(turnoverRes) ? turnoverRes : turnoverRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 월별 구매액 차트 데이터
  const getPurchaseAmountData = () => {
    if (monthlyPurchases.length === 0) {
      return { labels: [], datasets: [] };
    }
    const sorted = [...monthlyPurchases].sort((a, b) => a.fiscal_month - b.fiscal_month);
    return {
      labels: sorted.map(m => `${m.fiscal_month}월`),
      datasets: [
        {
          label: '구매액 (억원)',
          data: sorted.map(m => parseFloat(m.purchase_amount || '0')),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: '전월 대비 (%)',
          data: sorted.map(m => parseFloat(m.previous_month_change || '0')),
          type: 'line' as const,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  };

  // 재고 회전율 차트 데이터
  const getTurnoverData = () => {
    if (turnover.length === 0) {
      return { labels: [], datasets: [{ label: '회전율 (회)', data: [], backgroundColor: [], borderWidth: 0 }] };
    }
    const latestMonth = Math.max(...turnover.map(t => t.fiscal_month));
    const latestTurnover = turnover.filter(t => t.fiscal_month === latestMonth);

    const categoryLabels: Record<string, string> = {
      'raw': '원자재',
      'parts': '부자재',
      'finished': '완제품',
      'semi': '반제품',
      'consumable': '소모품'
    };

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return {
      labels: latestTurnover.map(t => categoryLabels[t.category] || t.category),
      datasets: [{
        label: '회전율 (회)',
        data: latestTurnover.map(t => parseFloat(t.turnover_rate)),
        backgroundColor: colors.slice(0, latestTurnover.length),
        borderWidth: 0
      }]
    };
  };

  // 공급업체별 구매 비중 차트
  const getSupplierShareData = () => {
    if (suppliers.length === 0) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    }
    const topSuppliers = [...suppliers].sort((a, b) =>
      parseFloat(b.purchase_share || '0') - parseFloat(a.purchase_share || '0')
    ).slice(0, 5);

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];

    return {
      labels: topSuppliers.map(s => s.supplier_name || ''),
      datasets: [{
        data: topSuppliers.map(s => parseFloat(s.purchase_share || '0')),
        backgroundColor: colors
      }]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-700';
      case 'in-transit': return 'bg-yellow-100 text-yellow-700';
      case 'received': return 'bg-green-100 text-green-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ordered': return '발주완료';
      case 'in-transit': return '운송중';
      case 'received': return '입고완료';
      case 'delayed': return '지연';
      default: return status;
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'adequate': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'high': return 'text-blue-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'adequate': return '적정';
      case 'low': return '부족';
      case 'high': return '과다';
      case 'critical': return '긴급';
      default: return '-';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-700';
      case 'B': return 'bg-blue-100 text-blue-700';
      case 'C': return 'bg-yellow-100 text-yellow-700';
      case 'D': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingState message="구매 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const latestPurchase = monthlyPurchases.length > 0
    ? monthlyPurchases.sort((a, b) => b.fiscal_month - a.fiscal_month)[0]
    : null;

  const totalPurchase = monthlyPurchases.reduce((sum, m) => sum + parseFloat(m.purchase_amount), 0);
  const avgPurchase = monthlyPurchases.length > 0 ? totalPurchase / monthlyPurchases.length : 0;

  const totalInventoryValue = inventory.reduce((sum, inv) => sum + parseFloat(inv.stock_value), 0);
  const pendingOrders = orders.filter(o => o.status !== 'received').length;
  const urgentOrders = orders.filter(o => o.is_urgent).length;

  const lowStockItems = inventory.filter(inv => inv.status === 'low' || inv.status === 'critical');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCartIcon size={32} />
          <h1 className="text-3xl font-bold">구매/자재 관리</h1>
        </div>
        <p className="text-orange-100">구매 발주와 재고를 효율적으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="월간 구매액"
          value={latestPurchase ? `${parseFloat(latestPurchase.purchase_amount).toFixed(0)}억` : '-'}
          subtitle={`평균: ${avgPurchase.toFixed(0)}억`}
          changeRate={latestPurchase ? parseFloat(latestPurchase.previous_month_change) : 0}
          trend={latestPurchase && parseFloat(latestPurchase.previous_month_change) >= 0 ? "up" : "down"}
          color="blue"
          icon={DollarIcon}
        />
        <KPICard
          title="재고 자산"
          value={`${totalInventoryValue.toFixed(0)}억`}
          subtitle={`${inventory.length}개 품목`}
          changeRate={0}
          trend="up"
          color="green"
          icon={PackageIcon}
        />
        <KPICard
          title="입고 대기"
          value={pendingOrders.toString()}
          subtitle={urgentOrders > 0 ? `긴급: ${urgentOrders}건` : '긴급 없음'}
          unit="건"
          changeRate={0}
          trend="up"
          color="purple"
          icon={ActivityIcon}
        />
        <KPICard
          title="발주 건수"
          value={orders.length.toString()}
          subtitle={`운송중: ${orders.filter(o => o.status === 'in-transit').length}건`}
          unit="건"
          changeRate={0}
          trend="up"
          color="yellow"
          icon={ShoppingCartIcon}
        />
      </div>

      {/* 카테고리 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'A', 'B', 'C'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' && '전체'}
              {category === 'A' && 'A등급 (고가)'}
              {category === 'B' && 'B등급 (중간)'}
              {category === 'C' && 'C등급 (저가)'}
            </button>
          ))}
        </div>
      </div>

      {/* 구매액 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-blue-600" size={24} />
            월별 구매액 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">구매 금액 및 증감률 (단위: 억원)</p>
        </div>

        <ChartComponent
          type="bar"
          data={getPurchaseAmountData()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: '구매액 (억원)' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: '증감률 (%)' },
                grid: { drawOnChartArea: false }
              }
            }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">이번 달</p>
            <p className="text-2xl font-bold text-blue-600">
              {latestPurchase ? `${parseFloat(latestPurchase.purchase_amount).toFixed(0)}억` : '-'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">평균</p>
            <p className="text-2xl font-bold text-purple-600">{avgPurchase.toFixed(0)}억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">최고</p>
            <p className="text-2xl font-bold text-green-600">
              {monthlyPurchases.length > 0
                ? Math.max(...monthlyPurchases.map(m => parseFloat(m.purchase_amount || '0'))).toFixed(0)
                : 0}억
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">연간 누적</p>
            <p className="text-2xl font-bold text-yellow-600">{totalPurchase.toFixed(0)}억</p>
          </div>
        </div>
      </div>

      {/* 재고 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-purple-600" size={24} />
              품목별 재고 회전율
            </h3>
            <p className="text-sm text-gray-500 mt-1">최신 월 기준</p>
          </div>
          <ChartComponent
            type="bar"
            data={getTurnoverData()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
            height={280}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <PackageIcon className="text-orange-600" size={24} />
              공급업체별 구매 비중
            </h3>
            <p className="text-sm text-gray-500 mt-1">구매 점유율</p>
          </div>
          <ChartComponent
            type="doughnut"
            data={getSupplierShareData()}
            options={{ plugins: { legend: { position: 'bottom' } } }}
            height={280}
          />
        </div>
      </div>

      {/* 발주 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-orange-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ShoppingCartIcon size={20} />
            발주 현황
          </h3>
          <p className="text-orange-100 text-xs mt-1">진행 중인 구매 오더</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">PO 번호</th>
                <th className="py-3 px-4 text-left">공급사</th>
                <th className="py-3 px-4 text-left">품목</th>
                <th className="py-3 px-4 text-center">수량</th>
                <th className="py-3 px-4 text-right">금액</th>
                <th className="py-3 px-4 text-center">발주일</th>
                <th className="py-3 px-4 text-center">납기</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className={`hover:bg-orange-50 ${order.is_urgent ? 'bg-red-50' : ''}`}>
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {order.is_urgent && <span className="text-red-600">🔥</span>}
                      {order.po_number}
                    </div>
                  </td>
                  <td className="py-3 px-4">{order.supplier_name}</td>
                  <td className="py-3 px-4">{order.item_name}</td>
                  <td className="py-3 px-4 text-center">{(order.quantity ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {(parseFloat(order.total_amount) / 10000).toFixed(0)}만
                  </td>
                  <td className="py-3 px-4 text-center">{order.order_date}</td>
                  <td className="py-3 px-4 text-center">{order.delivery_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 재고 현황 (ABC 분석) */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PackageIcon className="text-green-600" size={24} />
            재고 현황 (ABC 분석)
          </h3>
          <p className="text-sm text-gray-500 mt-1">중요도 기반 재고 관리</p>
        </div>

        <div className="space-y-3">
          {inventory
            .filter(inv => selectedCategory === 'all' || inv.category === selectedCategory)
            .slice(0, 6)
            .map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white ${
                      item.category === 'A' ? 'bg-red-600' :
                      item.category === 'B' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {item.category}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.item_code} - {item.item_name}</h4>
                      <p className="text-sm text-gray-600">재고가치: {parseFloat(item.stock_value).toFixed(1)}억원</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getStockStatusColor(item.status)}`}>
                      {getStockStatusLabel(item.status)}
                    </p>
                    <p className="text-xs text-gray-500">회전율: {parseFloat(item.turnover_rate).toFixed(1)}회</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">현재 재고</p>
                    <p className="text-lg font-bold text-blue-600">{(item.current_stock ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">안전 재고</p>
                    <p className="text-lg font-bold text-yellow-600">{(item.safety_stock ?? 0).toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    (item.current_stock ?? 0) >= (item.safety_stock ?? 1) ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">재고율</p>
                    <p className={`text-lg font-bold ${
                      (item.current_stock ?? 0) >= (item.safety_stock ?? 1) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.safety_stock ? (((item.current_stock ?? 0) / item.safety_stock) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">ABC 분류 기준</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-bold text-red-600">A등급</span>
              <p className="text-gray-600">고가/중요 품목 집중관리</p>
            </div>
            <div>
              <span className="font-bold text-blue-600">B등급</span>
              <p className="text-gray-600">중간 가치 정기 점검</p>
            </div>
            <div>
              <span className="font-bold text-green-600">C등급</span>
              <p className="text-gray-600">저가 품목 간편 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 공급업체 평가 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckIcon size={20} />
            공급업체 평가
          </h3>
          <p className="text-purple-100 text-xs mt-1">품질, 납기, 가격, 서비스 종합 평가</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">공급업체</th>
                <th className="py-3 px-4 text-center">품질</th>
                <th className="py-3 px-4 text-center">납기</th>
                <th className="py-3 px-4 text-center">가격</th>
                <th className="py-3 px-4 text-center">서비스</th>
                <th className="py-3 px-4 text-center">종합점수</th>
                <th className="py-3 px-4 text-center">등급</th>
                <th className="py-3 px-4 text-center">추세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-purple-50">
                  <td className="py-3 px-4 font-medium">{supplier.supplier_name}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.quality_score).toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.delivery_score).toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.price_score).toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.service_score).toFixed(0)}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">
                    {parseFloat(supplier.total_score).toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(supplier.grade)}`}>
                      {supplier.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {supplier.trend === 'up' && <span className="text-green-600">↗️ 상승</span>}
                    {supplier.trend === 'stable' && <span className="text-blue-600">→ 유지</span>}
                    {supplier.trend === 'down' && <span className="text-red-600">↘️ 하락</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 구매 인사이트 */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">구매 인사이트</h3>
        <div className="space-y-3">
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">재고 부족 품목 주의</p>
                  <p className="text-sm text-gray-600">
                    {lowStockItems.map(i => i.item_name).join(', ')}의 재고가 안전재고 미만입니다.
                    긴급 발주 검토가 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {suppliers.filter(s => s.trend === 'down').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">공급업체 평가 하락</p>
                  <p className="text-sm text-gray-600">
                    {suppliers.filter(s => s.trend === 'down').map(s => s.supplier_name).join(', ')}의
                    평가가 하락 추세입니다. 개선 요청 및 대체 업체 물색이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {urgentOrders > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">긴급 발주 현황</p>
                  <p className="text-sm text-gray-600">
                    현재 {urgentOrders}건의 긴급 발주가 진행 중입니다.
                    납기 준수 여부를 면밀히 모니터링하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchase;
