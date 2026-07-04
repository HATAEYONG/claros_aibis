// FourM2EImpact.tsx - 4M2E 영향도 분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Network,
  Eye,
  Filter
} from 'lucide-react';

interface CategoryImpact {
  category: string;
  categoryName: string;
  impactScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  monthlyData: {
    month: string;
    value: number;
    cost: number;
  }[];
  topDrivers: {
    driverName: string;
    impact: number;
    trend: string;
  }[];
  risks: {
    level: string;
    description: string;
  }[];
}

interface Correlation {
  source: string;
  target: string;
  correlation: number;
  impact: number;
}

const FourM2EImpact: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  // 4M2E 카테고리별 영향도 데이터
  const categoryImpacts: CategoryImpact[] = [
    {
      category: 'man',
      categoryName: '인건비',
      impactScore: 78,
      trend: 'increasing',
      monthlyData: [
        { month: '2026-01', value: 82.5, cost: 12500000 },
        { month: '2026-02', value: 84.2, cost: 12800000 },
        { month: '2026-03', value: 85.8, cost: 13100000 },
      ],
      topDrivers: [
        { driverName: '임금 인상', impact: 8.5, trend: '상승' },
        { driverName: '야간 수당', impact: 6.2, trend: '상승' },
        { driverName: '인건 부족', impact: 5.8, trend: '안정' },
      ],
      risks: [
        { level: 'medium', description: '임금 상승 압력 지속' },
        { level: 'low', description: '기술직 인력 부족' },
      ]
    },
    {
      category: 'machine',
      categoryName: '기계비',
      impactScore: 72,
      trend: 'stable',
      monthlyData: [
        { month: '2026-01', value: 68.5, cost: 8500000 },
        { month: '2026-02', value: 67.8, cost: 8400000 },
        { month: '2026-03', value: 69.2, cost: 8600000 },
      ],
      topDrivers: [
        { driverName: '설비 노후화', impact: 7.2, trend: '상승' },
        { driverName: '에너지 효율', impact: 5.5, trend: '하락' },
        { driverName: '정비 비용', impact: 4.8, trend: '안정' },
      ],
      risks: [
        { level: 'medium', description: '설비 교체 필요' },
        { level: 'low', description: '에너지 비용 상승' },
      ]
    },
    {
      category: 'material',
      categoryName: '재료비',
      impactScore: 88,
      trend: 'increasing',
      monthlyData: [
        { month: '2026-01', value: 75.3, cost: 15200000 },
        { month: '2026-02', value: 82.1, cost: 16800000 },
        { month: '2026-03', value: 86.5, cost: 17800000 },
      ],
      topDrivers: [
        { driverName: '원자재 가격', impact: 15.2, trend: '급등' },
        { driverName: '소비율', impact: 8.3, trend: '상승' },
        { driverName: '불비율', impact: 6.1, trend: '하락' },
      ],
      risks: [
        { level: 'high', description: '원자재 가격 급등' },
        { level: 'medium', description: '공급망 불안정' },
      ]
    },
    {
      category: 'method',
      categoryName: '방법비',
      impactScore: 65,
      trend: 'decreasing',
      monthlyData: [
        { month: '2026-01', value: 62.5, cost: 4200000 },
        { month: '2026-02', value: 61.8, cost: 4100000 },
        { month: '2026-03', value: 60.2, cost: 4000000 },
      ],
      topDrivers: [
        { driverName: '공정 최적화', impact: 4.2, trend: '개선' },
        { driverName: '표준화', impact: 3.5, trend: '개선' },
        { driverName: '자동화', impact: 2.8, trend: '개선' },
      ],
      risks: [
        { level: 'low', description: '공정 개선 여지' },
      ]
    },
    {
      category: 'measurement',
      categoryName: '측정비',
      impactScore: 58,
      trend: 'stable',
      monthlyData: [
        { month: '2026-01', value: 55.8, cost: 2800000 },
        { month: '2026-02', value: 56.2, cost: 2850000 },
        { month: '2026-03', value: 57.0, cost: 2900000 },
      ],
      topDrivers: [
        { driverName: '검사 비율', impact: 3.2, trend: '안정' },
        { driverName: '측정 장비', impact: 2.1, trend: '안정' },
        { driverName: '품질 비용', impact: 1.8, trend: '안정' },
      ],
      risks: [
        { level: 'low', description: '측정 정확도' },
      ]
    },
    {
      category: 'environment',
      categoryName: '환경비',
      impactScore: 62,
      trend: 'increasing',
      monthlyData: [
        { month: '2026-01', value: 58.5, cost: 5200000 },
        { month: '2026-02', value: 60.2, cost: 5400000 },
        { month: '2026-03', value: 62.8, cost: 5700000 },
      ],
      topDrivers: [
        { driverName: '환경 규제', impact: 6.5, trend: '상승' },
        { driverName: '에너지 비용', impact: 4.2, trend: '상승' },
        { driverName: '폐기 처리', impact: 3.1, trend: '안정' },
      ],
      risks: [
        { level: 'medium', description: '환경 규제 강화' },
        { level: 'low', description: '에너지 효율' },
      ]
    }
  ];

  // 카테고리간 상관관계
  const correlations: Correlation[] = [
    { source: 'material', target: 'man', correlation: 0.78, impact: 'high' },
    { source: 'machine', target: 'method', correlation: 0.65, impact: 'medium' },
    { source: 'measurement', target: 'quality', correlation: 0.82, impact: 'high' },
    { source: 'environment', target: 'material', correlation: 0.45, impact: 'low' },
    { source: 'man', target: 'method', correlation: 0.35, impact: 'low' },
  ];

  const filteredCategories = selectedCategory === 'all'
    ? categoryImpacts
    : categoryImpacts.filter(c => c.category === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">4M2E 영향도 분석</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            6가지 원가 요인(Man, Machine, Material, Method, Measurement, Environment)의 영향도 분석
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

      {/* 필터 */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">전체 카테고리</option>
          <option value="man">Man (인건비)</option>
          <option value="machine">Machine (기계비)</option>
          <option value="material">Material (재료비)</option>
          <option value="method">Method (방법비)</option>
          <option value="measurement">Measurement (측정비)</option>
          <option value="environment">Environment (환경비)</option>
        </select>
      </div>

      {/* 영향도 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categoryImpacts.map((category) => (
          <div
            key={category.category}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
              category.impactScore >= 80
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                : category.impactScore >= 70
                ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                : category.impactScore >= 60
                ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                : 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{category.categoryName}</span>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                category.trend === 'increasing'
                  ? 'text-red-600 dark:text-red-400'
                  : category.trend === 'decreasing'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {category.trend === 'increasing' && <TrendingUp className="w-4 h-4" />}
                {category.trend === 'decreasing' && <TrendingDown className="w-4 h-4" />}
                {category.trend === 'stable' && <Activity className="w-4 h-4" />}
                {category.trend === 'increasing' ? '상승' : category.trend === 'decreasing' ? '하락' : '안정'}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{category.impactScore}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">영향도 점수</div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">월별 원가</div>
              <div className="space-y-1">
                {category.monthlyData.slice(-3).map((data) => (
                  <div key={data.month} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{data.month}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(data.cost / 10000).toFixed(1)}천 원
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주요 드라이버 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">주요 원가 드라이버</h3>
          <div className="space-y-4">
            {categoryImpacts.map((category) => (
              <div key={category.category}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{category.categoryName}</h4>
                <div className="space-y-2">
                  {category.topDrivers.map((driver, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{driver.driverName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{driver.trend}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{driver.impact}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">영향</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 리스크 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">리스크 요약</h3>
          <div className="space-y-3">
            {categoryImpacts.map((category) => (
              <div key={category.category}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{category.categoryName}</h4>
                <div className="space-y-2">
                  {category.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded ${
                        risk.level === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : risk.level === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm flex-1">{risk.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리간 상관관계 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">카테고리간 상관관계</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {correlations.map((corr, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {categoryImpacts.find(c => c.category === corr.source)?.categoryName || corr.source}
                </span>
                <div className="flex items-center gap-1">
                  <Network className="w-4 h-4 text-gray-400" />
                  <div className={`text-sm font-bold ${
                    corr.correlation >= 0.7
                      ? 'text-red-600 dark:text-red-400'
                      : corr.correlation >= 0.5
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {corr.correlation.toFixed(2)}
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {categoryImpacts.find(c => c.category === corr.target)?.categoryName || corr.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FourM2EImpact;
