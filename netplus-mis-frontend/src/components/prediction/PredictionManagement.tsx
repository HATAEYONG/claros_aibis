import React, { useState } from 'react';
import { BrainIcon, TrendUpIcon, ActivityIcon, CheckIcon, PackageIcon } from '@/components/icons/Icons';
import FinancePrediction from './FinancePrediction';
import ProductionPrediction from './ProductionPrediction';
import QualityPrediction from './QualityPrediction';
import InventoryPrediction from './InventoryPrediction';
import { PredictionCategory, PredictionCategoryInfo } from '@/types/prediction';

const PredictionManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PredictionCategory>('finance');

  const categories: PredictionCategoryInfo[] = [
    {
      id: 'finance',
      name: '매출/재무 예측',
      description: '매출액, 영업이익, 순이익, 현금흐름 등 재무 KPI 예측',
      icon: '💰',
      color: 'emerald',
      kpiCodes: ['FIN_001', 'FIN_002', 'FIN_003', 'FIN_004'],
      apiEndpoint: '/api/predictions/finance/'
    },
    {
      id: 'production',
      name: '생산 예측',
      description: '생산량, 불량률, OEE, 설비고장 등 생산 KPI 예측',
      icon: '🏭',
      color: 'blue',
      kpiCodes: ['PROD_001', 'PROD_002', 'PROD_003', 'PROD_004'],
      apiEndpoint: '/api/predictions/production/'
    },
    {
      id: 'quality',
      name: '품질 예측',
      description: '불량률, Cpk, 품질 이상, 클레임 등 품질 KPI 예측',
      icon: '✅',
      color: 'purple',
      kpiCodes: ['QUAL_001', 'QUAL_002', 'QUAL_003', 'QUAL_004'],
      apiEndpoint: '/api/predictions/quality/'
    },
    {
      id: 'inventory',
      name: '재고 예측',
      description: '재고 소진일수, 부족/과잉, 회전율 등 재고 KPI 예측',
      icon: '📦',
      color: 'amber',
      kpiCodes: ['INV_001', 'INV_002', 'INV_003', 'INV_004'],
      apiEndpoint: '/api/predictions/inventory/'
    }
  ];

  const getCategoryIcon = (categoryId: PredictionCategory) => {
    switch (categoryId) {
      case 'finance':
        return TrendUpIcon;
      case 'production':
        return ActivityIcon;
      case 'quality':
        return CheckIcon;
      case 'inventory':
        return PackageIcon;
      default:
        return BrainIcon;
    }
  };

  const getCategoryColorClasses = (categoryId: PredictionCategory) => {
    switch (categoryId) {
      case 'finance':
        return {
          bg: 'bg-emerald-600',
          bgLight: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-500',
          gradient: 'from-emerald-600 to-teal-600'
        };
      case 'production':
        return {
          bg: 'bg-blue-600',
          bgLight: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-500',
          gradient: 'from-blue-600 to-indigo-600'
        };
      case 'quality':
        return {
          bg: 'bg-purple-600',
          bgLight: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-500',
          gradient: 'from-purple-600 to-pink-600'
        };
      case 'inventory':
        return {
          bg: 'bg-amber-600',
          bgLight: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-500',
          gradient: 'from-amber-600 to-orange-600'
        };
      default:
        return {
          bg: 'bg-gray-600',
          bgLight: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-500',
          gradient: 'from-gray-600 to-gray-700'
        };
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'finance':
        return <FinancePrediction />;
      case 'production':
        return <ProductionPrediction />;
      case 'quality':
        return <QualityPrediction />;
      case 'inventory':
        return <InventoryPrediction />;
      default:
        return <FinancePrediction />;
    }
  };

  const activeCategoryData = categories.find(c => c.id === activeCategory);
  const ActiveIcon = getCategoryIcon(activeCategory);
  const colorClasses = getCategoryColorClasses(activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorClasses.gradient} rounded-xl shadow-lg p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <BrainIcon size={32} />
          <h1 className="text-3xl font-bold">예측관리</h1>
        </div>
        <p className="opacity-90">AI 기반 비즈니스 KPI 예측 및 인사이트</p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.id);
            const categoryColorClasses = getCategoryColorClasses(category.id);
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? `${categoryColorClasses.bg} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Description */}
      {activeCategoryData && (
        <div className={`${colorClasses.bgLight} border-l-4 ${colorClasses.border} rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <ActiveIcon size={20} className={colorClasses.text} />
            <h3 className={`font-semibold ${colorClasses.text}`}>{activeCategoryData.name}</h3>
          </div>
          <p className="text-sm text-gray-600">{activeCategoryData.description}</p>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default PredictionManagement;
