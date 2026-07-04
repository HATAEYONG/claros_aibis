// SalesTower.tsx - 영업 컨트롤 타워 컴포넌트
import { useState } from 'react';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package
} from 'lucide-react';

interface SalesKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  variance: number;
  status: 'on-track' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface SalesRegion {
  region: string;
  sales: number;
  target: number;
  achievement: number;
  growth: number;
}

interface TopProduct {
  rank: number;
  name: string;
  sales: number;
  growth: number;
  margin: number;
}

const SalesTower: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const kpis: SalesKPI[] = [
    {
      id: 'total-sales',
      name: '총 매출',
      value: 15420000000,
      target: 15000000000,
      variance: 420000000,
      status: 'on-track',
      trend: 'up',
      unit: '원'
    },
    {
      id: 'order-volume',
      name: '주문량',
      value: 3245,
      target: 3000,
      variance: 245,
      status: 'on-track',
      trend: 'up',
      unit: '건'
    },
    {
      id: 'new-customers',
      name: '신규 고객',
      value: 156,
      target: 150,
      variance: 6,
      status: 'on-track',
      trend: 'up',
      unit: '명'
    },
    {
      id: 'retention-rate',
      name: '고객 유지율',
      value: 87.5,
      target: 85.0,
      variance: 2.5,
      status: 'on-track',
      trend: 'stable',
      unit: '%'
    },
    {
      id: 'avg-order-value',
      name: '평균 주문 금액',
      value: 4750000,
      target: 5000000,
      variance: -250000,
      status: 'warning',
      trend: 'down',
      unit: '원'
    },
    {
      id: 'sales-cycle',
      name: '영업 사이클',
      value: 28,
      target: 25,
      variance: 3,
      status: 'warning',
      trend: 'up',
      unit: '일'
    }
  ];

  const regions: SalesRegion[] = [
    { region: '수도권', sales: 5200000000, target: 5000000000, achievement: 104.0, growth: 8.5 },
    { region: '경상권', sales: 3800000000, target: 4000000000, achievement: 95.0, growth: 4.2 },
    { region: '호남권', sales: 3100000000, target: 3000000000, achievement: 103.3, growth: 6.8 },
    { region: '영남권', sales: 2100000000, target: 2000000000, achievement: 105.0, growth: 9.2 },
    { region: '충청권', sales: 1220000000, target: 1000000000, achievement: 122.0, growth: 15.5 }
  ];

  const topProducts: TopProduct[] = [
    { rank: 1, name: '프리미엄 제품 A', sales: 3200000000, growth: 18.5, margin: 32.5 },
    { rank: 2, name: '스탠다드 제품 B', sales: 2450000000, growth: 12.3, margin: 28.7 },
    { rank: 3, name: '이코노미 제품 C', sales: 1980000000, growth: 25.8, margin: 24.2 },
    { rank: 4, name: '신제품 D', sales: 1200000000, growth: 45.2, margin: 35.8 },
    { rank: 5, name: '베스트셀러 E', sales: 980000000, growth: 8.9, margin: 30.1 }
  ];

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '억원';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(0) + '만원';
    }
    return num.toLocaleString();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const getKPIIcon = (id: string) => {
    switch (id) {
      case 'total-sales': return <DollarSign className="w-5 h-5" />;
      case 'order-volume': return <ShoppingCart className="w-5 h-5" />;
      case 'new-customers': return <Users className="w-5 h-5" />;
      case 'retention-rate': return <Award className="w-5 h-5" />;
      case 'avg-order-value': return <Target className="w-5 h-5" />;
      case 'sales-cycle': return <TrendingUp className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">영업 컨트롤 타워</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            영업 성과 및 고객 관리 실시간 모니터링
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
              {kpi.unit === '%' || kpi.unit === '일' ? kpi.value.toFixed(1) : formatNumber(kpi.value)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">목표: {kpi.unit === '%' || kpi.unit === '일' ? kpi.target.toFixed(1) : formatNumber(kpi.target)}</span>
              <span className={`font-medium ${
                kpi.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {kpi.variance >= 0 ? '+' : ''}{kpi.unit === '%' || kpi.unit === '일' ? kpi.variance.toFixed(1) : formatNumber(Math.abs(kpi.variance))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 지역별 매출 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">지역별 매출 현황</h3>
        <div className="space-y-3">
          {regions.map((region, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="w-24 text-sm font-medium text-gray-900 dark:text-white">{region.region}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    매출: {formatNumber(region.sales)} (목표: {formatNumber(region.target)})
                  </span>
                  <span className={`text-sm font-bold ${
                    region.achievement >= 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {region.achievement.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        region.achievement >= 100 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(region.achievement, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${region.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ({region.growth >= 0 ? '+' : ''}{region.growth}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 제품 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">인기 제품 Top 5</h3>
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div
                key={product.rank}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  product.rank === 1 ? 'bg-yellow-500 text-white' :
                  product.rank === 2 ? 'bg-gray-400 text-white' :
                  product.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-gray-300 text-gray-700'
                }`}>
                  {product.rank}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    마진: {product.margin}% | 성장: {product.growth}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">{formatNumber(product.sales)}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+{product.growth}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영업 활동 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">영업 활동 요약</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">진행 중 견적</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">245건</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">제안 완료</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">128건</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">견적 대기</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">56건</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">고객 미팅</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">89건</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTower;
