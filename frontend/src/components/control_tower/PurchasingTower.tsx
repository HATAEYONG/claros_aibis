// PurchasingTower.tsx - 구매 컨트롤 타워 컴포넌트
import { useState } from 'react';
import {
  ShoppingCart,
  Truck,
  Package,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Award
} from 'lucide-react';

interface PurchasingKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  variance: number;
  status: 'on-track' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface SupplierPerformance {
  id: string;
  name: string;
  onTimeDelivery: number;
  qualityScore: number;
  totalOrders: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface MaterialCost {
  category: string;
  currentCost: number;
  previousCost: number;
  variance: number;
  trend: 'up' | 'down' | 'stable';
}

interface PurchaseOrder {
  id: string;
  material: string;
  supplier: string;
  amount: number;
  status: 'pending' | 'approved' | 'in-transit' | 'delivered';
  urgency: 'low' | 'medium' | 'high';
}

const PurchasingTower: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const kpis: PurchasingKPI[] = [
    {
      id: 'total-purchase',
      name: '총 구매액',
      value: 8750000000,
      target: 9000000000,
      variance: -250000000,
      status: 'on-track',
      trend: 'down',
      unit: '원'
    },
    {
      id: 'cost-savings',
      name: '비용 절감',
      value: 320000000,
      target: 300000000,
      variance: 20000000,
      status: 'on-track',
      trend: 'up',
      unit: '원'
    },
    {
      id: 'on-time-delivery',
      name: '납기 준수율',
      value: 94.5,
      target: 95.0,
      variance: -0.5,
      status: 'warning',
      trend: 'stable',
      unit: '%'
    },
    {
      id: 'supplier-count',
      name: '활성 공급업체',
      value: 145,
      target: 150,
      variance: -5,
      status: 'warning',
      trend: 'down',
      unit: '개사'
    },
    {
      id: 'avg-lead-time',
      name: '평균 리드타임',
      value: 14.2,
      target: 12.0,
      variance: 2.2,
      status: 'warning',
      trend: 'up',
      unit: '일'
    },
    {
      id: 'inventory-turnover',
      name: '재고회전율',
      value: 8.5,
      target: 8.0,
      variance: 0.5,
      status: 'on-track',
      trend: 'up',
      unit: '회'
    }
  ];

  const suppliers: SupplierPerformance[] = [
    { id: 'S1', name: '한국스틸', onTimeDelivery: 98.5, qualityScore: 96.2, totalOrders: 245, status: 'excellent' },
    { id: 'S2', name: '삼성물산', onTimeDelivery: 94.2, qualityScore: 92.8, totalOrders: 189, status: 'good' },
    { id: 'S3', name: '동부제강', onTimeDelivery: 89.5, qualityScore: 88.5, totalOrders: 156, status: 'good' },
    { id: 'S4', name: '중부철강', onTimeDelivery: 82.3, qualityScore: 85.2, totalOrders: 98, status: 'warning' },
    { id: 'S5', name: '남화화학', onTimeDelivery: 95.8, qualityScore: 94.5, totalOrders: 124, status: 'excellent' }
  ];

  const materialCosts: MaterialCost[] = [
    { category: '철강재', currentCost: 125000, previousCost: 118000, variance: 5.9, trend: 'up' },
    { category: '알루미늄', currentCost: 89000, previousCost: 85000, variance: 4.7, trend: 'up' },
    { category: '플라스틱', currentCost: 45000, previousCost: 46000, variance: -2.2, trend: 'down' },
    { category: '고무', currentCost: 32000, previousCost: 31000, variance: 3.2, trend: 'up' },
    { category: '전자부품', currentCost: 280000, previousCost: 275000, variance: 1.8, trend: 'up' }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    { id: 'PO001', material: '철강재 (SS400)', supplier: '한국스틸', amount: 125000000, status: 'in-transit', urgency: 'high' },
    { id: 'PO002', material: '알루미늄 합금', supplier: '삼성물산', amount: 89000000, status: 'approved', urgency: 'medium' },
    { id: 'PO003', material: '플라스틱 펠릿', supplier: '동부화학', amount: 45000000, status: 'pending', urgency: 'low' },
    { id: 'PO004', material: '고무 원재', supplier: '남화고무', amount: 64000000, status: 'in-transit', urgency: 'high' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'total-purchase': return <ShoppingCart className="w-5 h-5" />;
      case 'cost-savings': return <TrendingDown className="w-5 h-5" />;
      case 'on-time-delivery': return <Award className="w-5 h-5" />;
      case 'supplier-count': return <Users className="w-5 h-5" />;
      case 'avg-lead-time': return <Clock className="w-5 h-5" />;
      case 'inventory-turnover': return <Package className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getSupplierStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in-transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">구매 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            구매 성과 및 공급업체 관리 실시간 모니터링
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">갱신: {refreshTime.toLocaleTimeString('ko-KR')}</div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 주요 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              kpi.status === 'on-track'
                ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : kpi.status === 'warning'
                ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  kpi.status === 'on-track'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  {getKPIIcon(kpi.id)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{kpi.name}</span>
              </div>
              <div className={`flex items-center gap-1 ${
                kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {kpi.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                {kpi.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {kpi.unit === '%' || kpi.unit === '회' || kpi.unit === '개사' ? kpi.value.toFixed(1) : (kpi.value / 10000).toFixed(0)}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                {kpi.unit === '원' ? '만원' : kpi.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">목표: {kpi.unit === '%' || kpi.unit === '회' || kpi.unit === '개사' ? kpi.target.toFixed(1) : (kpi.target / 10000).toFixed(0)}</span>
              <span className={`font-medium ${
                kpi.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {kpi.variance >= 0 ? '+' : ''}{kpi.unit === '%' || kpi.unit === '회' || kpi.unit === '개사' ? kpi.variance.toFixed(1) : (kpi.variance / 10000).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 자재비 변동 추이 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">주요 자재비 변동 추이</h3>
        <div className="space-y-3">
          {materialCosts.map((cost, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-32 text-sm font-medium text-gray-900 dark:text-white">{cost.category}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    현재: {cost.currentCost.toLocaleString()}원 / 전월: {cost.previousCost.toLocaleString()}원
                  </span>
                  <span className={`text-sm font-bold ${
                    cost.variance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {cost.variance >= 0 ? '+' : ''}{cost.variance.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        cost.trend === 'up' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.abs(cost.variance)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${
                    cost.trend === 'up' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {cost.trend === 'up' ? '▲' : '▼'} {cost.trend === 'up' ? '상승' : '하락'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 공급업체 성과 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">주요 공급업체 성과</h3>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getSupplierStatusColor(supplier.status)}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    주문 {supplier.totalOrders}건 | 품질 {supplier.qualityScore}점 | 납기 {supplier.onTimeDelivery}%
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded ${
                  supplier.status === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  supplier.status === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {supplier.status === 'excellent' ? '우수' : supplier.status === 'good' ? '양호' : '주의'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 진행 중 발주 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">진행 중 발주</h3>
          <div className="space-y-2">
            {purchaseOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{order.material}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${getUrgencyColor(order.urgency)}`}>
                      {order.urgency === 'high' ? '긴급' : order.urgency === 'medium' ? '보통' : '여유'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {order.supplier} | {(order.amount / 10000).toFixed(0)}만원
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status)}`}>
                  {order.status === 'in-transit' ? '운송중' :
                   order.status === 'approved' ? '승인완료' :
                   order.status === 'pending' ? '대기중' : '완료'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasingTower;
