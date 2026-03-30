import React, { useState, useEffect } from 'react';
import {
  ActivityIcon,
  TrendUpIcon,
  TrendDownIcon,
  CheckIcon,
  AlertIcon,
  FactoryIcon,
  AwardIcon,
  TrendingUpIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  BarChartIcon,
  LeafIcon,
  FileTextIcon,
} from '@/components/icons/Icons';
import api from '@/services/api';

interface KPIData {
  code: string;
  kpi_code?: string;  // Backend may use snake_case
  name: string;
  kpi_name?: string;  // Backend may use snake_case
  value: number | null;
  target: number | null;
  unit: string;
  achievement_rate: number | null;
  status?: 'good' | 'warning' | 'info' | 'error';
  details?: Record<string, any>;
}

interface KPICategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  kpiCodes: string[];
  apiEndpoint: string;
}

const KPI_CATEGORIES: KPICategory[] = [
  {
    id: 'production',
    name: '생산 KPI',
    icon: FactoryIcon,
    kpiCodes: ['PROD_001', 'PROD_002', 'PROD_003', 'PROD_004', 'PROD_005', 'PROD_006', 'PROD_007', 'PROD_008', 'PROD_009', 'PROD_010'],
    apiEndpoint: '/api/production/kpi/all_kpis/'
  },
  {
    id: 'quality',
    name: '품질 KPI',
    icon: AwardIcon,
    kpiCodes: ['QUAL_001', 'QUAL_002', 'QUAL_003', 'QUAL_004', 'QUAL_005', 'QUAL_006', 'QUAL_007', 'QUAL_008', 'QUAL_009', 'QUAL_010'],
    apiEndpoint: '/api/quality/kpi/all_kpis/'
  },
  {
    id: 'sales',
    name: '영업 KPI',
    icon: TrendingUpIcon,
    kpiCodes: ['SALES_001', 'SALES_002', 'SALES_003', 'SALES_004', 'SALES_005', 'SALES_006', 'SALES_007', 'SALES_008', 'SALES_009', 'SALES_010'],
    apiEndpoint: '/api/sales/kpi/all_kpis/'
  },
  {
    id: 'purchase',
    name: '구매 KPI',
    icon: ShoppingCartIcon,
    kpiCodes: ['PURC_001', 'PURC_002', 'PURC_003', 'PURC_004', 'PURC_005', 'PURC_006', 'PURC_007', 'PURC_008', 'PURC_009', 'PURC_010'],
    apiEndpoint: '/api/purchase/kpi/all_kpis/'
  },
  {
    id: 'manufacturing',
    name: '제조 KPI',
    icon: BriefcaseIcon,
    kpiCodes: ['MFG_001', 'MFG_002', 'MFG_003', 'MFG_004', 'MFG_005', 'MFG_006', 'MFG_007', 'MFG_008', 'MFG_009', 'MFG_010'],
    apiEndpoint: '/api/manufacturing/kpi/all_kpis/'
  },
  {
    id: 'accounting',
    name: '관리회계 KPI',
    icon: BarChartIcon,
    kpiCodes: ['ACCT_001', 'ACCT_002', 'ACCT_003', 'ACCT_004', 'ACCT_005', 'ACCT_006', 'ACCT_007', 'ACCT_008', 'ACCT_009', 'ACCT_010'],
    apiEndpoint: '/api/accounting/kpi/all_kpis/'
  },
  {
    id: 'esg',
    name: 'ESG KPI',
    icon: LeafIcon,
    kpiCodes: ['ESG_001', 'ESG_002', 'ESG_003', 'ESG_004', 'ESG_005', 'ESG_006', 'ESG_007', 'ESG_008', 'ESG_009', 'ESG_010'],
    apiEndpoint: '/api/esg/kpi/all_kpis/'
  },
  {
    id: 'reports',
    name: '분석 리포트 KPI',
    icon: FileTextIcon,
    kpiCodes: ['RPT_001', 'RPT_002', 'RPT_003', 'RPT_004', 'RPT_005', 'RPT_006', 'RPT_007', 'RPT_008', 'RPT_009', 'RPT_010'],
    apiEndpoint: '/api/reports/kpi/all_kpis/'
  }
];

const KPIManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('production');
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState<Record<string, KPIData>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs(activeCategory);
  }, [activeCategory]);

  const fetchKPIs = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const categoryData = KPI_CATEGORIES.find(c => c.id === category);
      if (!categoryData) return;

      const response = await fetch(`http://localhost:8000${categoryData.apiEndpoint}`);
      const data = await response.json();

      if (data.kpis) {
        const kpiMap: Record<string, KPIData> = {};
        data.kpis.forEach((kpi: KPIData) => {
          const key = kpi.kpi_code || kpi.code;
          if (key) {
            kpiMap[key] = kpi;
          }
        });
        setKpiData(kpiMap);
      }
    } catch (err) {
      setError('KPI 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderKPICard = (kpiCode: string) => {
    const kpi = kpiData[kpiCode];
    const category = KPI_CATEGORIES.find(c => c.id === activeCategory);

    if (!kpi) {
      return (
        <div key={kpiCode} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">{kpiCode}</p>
              <p className="text-gray-400">로딩 중...</p>
            </div>
          </div>
        </div>
      );
    }

    const statusColor = kpi.status === 'good' ? 'text-green-600' :
                       kpi.status === 'warning' ? 'text-yellow-600' :
                       kpi.status === 'error' ? 'text-red-600' : 'text-blue-600';
    const bgColor = kpi.status === 'good' ? 'bg-green-50 border-green-500' :
                   kpi.status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                   kpi.status === 'error' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500';

    const displayValue = kpi.value !== null ? kpi.value.toLocaleString() : '-';
    const displayTarget = kpi.target !== null ? kpi.target.toLocaleString() : '-';
    const achievementRate = kpi.achievement_rate;

    return (
      <div key={kpiCode} className={`bg-white rounded-lg shadow p-4 border-l-4 ${bgColor}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">{kpi.kpi_code || kpi.code || kpiCode}</p>
            <h4 className="font-semibold text-gray-800">{kpi.kpi_name || kpi.name || 'KPI'}</h4>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${statusColor}`}>
              {displayValue}
              <span className="text-sm text-gray-500 ml-1">{kpi.unit}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              목표: <span className="font-medium text-gray-700">{displayTarget}</span>
            </span>
            {achievementRate !== null && (
              <span className={`font-medium ${achievementRate >= 100 ? 'text-green-600' : achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {achievementRate >= 100 ? <TrendUpIcon size={14} /> : achievementRate < 80 ? <TrendDownIcon size={14} /> : null}
                {achievementRate.toFixed(1)}%
              </span>
            )}
          </div>
          {kpi.status === 'good' && <CheckIcon size={16} className="text-green-500" />}
          {kpi.status === 'warning' && <AlertIcon size={16} className="text-yellow-500" />}
        </div>

        {kpi.details && Object.keys(kpi.details).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(kpi.details).map(([key, value]) => (
                <span key={key} className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                  {key}: {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeCategoryData = KPI_CATEGORIES.find(c => c.id === activeCategory);
  const ActiveIcon = activeCategoryData?.icon || ActivityIcon;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">KPI 통합 관리</h1>
        </div>
        <p className="text-indigo-100">전사 KPI를 한눈에 확인하고 관리하세요</p>
      </div>

      {/* 카테고리 탭 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 flex-wrap">
          {KPI_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CategoryIcon size={18} />
                <span>{category.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCategory === category.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {category.kpiCodes.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI 목록 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <ActiveIcon size={24} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">{activeCategoryData?.name}</h2>
          {loading && (
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              로딩 중...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCategoryData?.kpiCodes.map((kpiCode) => renderKPICard(kpiCode))}
        </div>
      </div>

      {/* KPI 요약 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">KPI 달성 현황 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">양호 (Good)</p>
            <p className="text-3xl font-bold text-green-600">
              {Object.values(kpiData).filter(k => k.status === 'good').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">주의 (Warning)</p>
            <p className="text-3xl font-bold text-yellow-600">
              {Object.values(kpiData).filter(k => k.status === 'warning').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">정보 (Info)</p>
            <p className="text-3xl font-bold text-blue-600">
              {Object.values(kpiData).filter(k => k.status === 'info').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">위험 (Error)</p>
            <p className="text-3xl font-bold text-red-600">
              {Object.values(kpiData).filter(k => k.status === 'error').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIManagement;
