import React, { useState, useMemo } from 'react';
import {
  DollarIcon,
  TrendUpIcon,
  TrendDownIcon,
  AlertIcon,
  BarChartIcon,
  ActivityIcon,
  PieChartIcon,
  SettingsIcon,
  FilterIcon,
  CheckIcon
} from '@/components/icons/Icons';

interface VarianceData {
  id: string;
  category: string;
  itemName: string;
  standardCost: number;
  actualCost: number;
  variance: number;
  varianceRate: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'improving' | 'worsening' | 'stable';
  materialVariance: {
    priceVariance: number;
    quantityVariance: number;
    mixVariance: number;
  };
  laborVariance: {
    rateVariance: number;
    efficiencyVariance: number;
    yieldVariance: number;
  };
  overheadVariance: {
    spendingVariance: number;
    efficiencyVariance: number;
    volumeVariance: number;
  };
}

interface RootCause {
  id: string;
  varianceId: string;
  category: string;
  rootCause: string;
  contributingFactor: string;
  impactAmount: number;
  responsible: string;
  correctiveAction: string;
  status: 'identified' | 'analyzing' | 'resolved';
}

const CostVarianceAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'material' | 'labor' | 'overhead' | 'rootcause' | 'action'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-01');

  // 차이 데이터
  const [varianceData, setVarianceData] = useState<VarianceData[]>([
    {
      id: 'vd-1',
      category: '재료비',
      itemName: '강판 재료비',
      standardCost: 80000000,
      actualCost: 84000000,
      variance: -4000000,
      varianceRate: -5.0,
      impact: 'high',
      trend: 'worsening',
      materialVariance: {
        priceVariance: -2500000,
        quantityVariance: -1200000,
        mixVariance: -300000
      },
      laborVariance: {
        rateVariance: 0,
        efficiencyVariance: 0,
        yieldVariance: 0
      },
      overheadVariance: {
        spendingVariance: 0,
        efficiencyVariance: 0,
        volumeVariance: 0
      }
    },
    {
      id: 'vd-2',
      category: '재료비',
      itemName: '알루미늄 재료비',
      standardCost: 60000000,
      actualCost: 66000000,
      variance: -6000000,
      varianceRate: -10.0,
      impact: 'high',
      trend: 'worsening',
      materialVariance: {
        priceVariance: -4500000,
        quantityVariance: -1000000,
        mixVariance: -500000
      },
      laborVariance: {
        rateVariance: 0,
        efficiencyVariance: 0,
        yieldVariance: 0
      },
      overheadVariance: {
        spendingVariance: 0,
        efficiencyVariance: 0,
        volumeVariance: 0
      }
    },
    {
      id: 'vd-3',
      category: '노무비',
      itemName: '조립 직접 노무비',
      standardCost: 45000000,
      actualCost: 47500000,
      variance: -2500000,
      varianceRate: -5.56,
      impact: 'medium',
      trend: 'stable',
      materialVariance: {
        priceVariance: 0,
        quantityVariance: 0,
        mixVariance: 0
      },
      laborVariance: {
        rateVariance: -800000,
        efficiencyVariance: -1200000,
        yieldVariance: -500000
      },
      overheadVariance: {
        spendingVariance: 0,
        efficiencyVariance: 0,
        volumeVariance: 0
      }
    },
    {
      id: 'vd-4',
      category: '노무비',
      itemName: 'CNC 가공 노무비',
      standardCost: 35000000,
      actualCost: 34500000,
      variance: 500000,
      varianceRate: 1.43,
      impact: 'low',
      trend: 'improving',
      materialVariance: {
        priceVariance: 0,
        quantityVariance: 0,
        mixVariance: 0
      },
      laborVariance: {
        rateVariance: 200000,
        efficiencyVariance: 300000,
        yieldVariance: 0
      },
      overheadVariance: {
        spendingVariance: 0,
        efficiencyVariance: 0,
        volumeVariance: 0
      }
    },
    {
      id: 'vd-5',
      category: '간접비',
      itemName: '설비 운영 간접비',
      standardCost: 25000000,
      actualCost: 27000000,
      variance: -2000000,
      varianceRate: -8.0,
      impact: 'medium',
      trend: 'worsening',
      materialVariance: {
        priceVariance: 0,
        quantityVariance: 0,
        mixVariance: 0
      },
      laborVariance: {
        rateVariance: 0,
        efficiencyVariance: 0,
        yieldVariance: 0
      },
      overheadVariance: {
        spendingVariance: -1200000,
        efficiencyVariance: -500000,
        volumeVariance: -300000
      }
    },
    {
      id: 'vd-6',
      category: '간접비',
      itemName: '품질 검사 간접비',
      standardCost: 15000000,
      actualCost: 14800000,
      variance: 200000,
      varianceRate: 1.33,
      impact: 'low',
      trend: 'improving',
      materialVariance: {
        priceVariance: 0,
        quantityVariance: 0,
        mixVariance: 0
      },
      laborVariance: {
        rateVariance: 0,
        efficiencyVariance: 0,
        yieldVariance: 0
      },
      overheadVariance: {
        spendingVariance: 150000,
        efficiencyVariance: 50000,
        volumeVariance: 0
      }
    }
  ]);

  // 원인 데이터
  const [rootCauses, setRootCauses] = useState<RootCause[]>([
    {
      id: 'rc-1',
      varianceId: 'vd-1',
      category: '재료비',
      rootCause: '원자재 가격 상승',
      contributingFactor: '국제 강판 가격 5% 인상',
      impactAmount: -2500000,
      responsible: '구매팀',
      correctiveAction: '대체 공급처 확보, 선물 계약 체결',
      status: 'analyzing'
    },
    {
      id: 'rc-2',
      varianceId: 'vd-2',
      category: '재료비',
      rootCause: '알루미늄 소비량 증가',
      contributingFactor: '불량률 증가로 재투입 증가',
      impactAmount: -1000000,
      responsible: '생산팀',
      correctiveAction: '공정 개선, 불량 원인 분석',
      status: 'identified'
    },
    {
      id: 'rc-3',
      varianceId: 'vd-3',
      category: '노무비',
      rootCause: '야간 작업 증가',
      contributingFactor: '납기 맞추기 위한 야간 작업 비중 증가',
      impactAmount: -800000,
      responsible: '생산팀',
      correctiveAction: '생산 계획 최적화',
      status: 'analyzing'
    },
    {
      id: 'rc-4',
      varianceId: 'vd-5',
      category: '간접비',
      rootCause: '설비 가동률 저하',
      contributingFactor: '노후 설비로 인한 고장 증가',
      impactAmount: -1200000,
      responsible: '설비팀',
      correctiveAction: '설비 교체 계획 수립',
      status: 'identified'
    }
  ]);

  // 집계 데이터
  const summary = useMemo(() => {
    const totalStandard = varianceData.reduce((sum, item) => sum + item.standardCost, 0);
    const totalActual = varianceData.reduce((sum, item) => sum + item.actualCost, 0);
    const totalVariance = varianceData.reduce((sum, item) => sum + item.variance, 0);

    const materialVariance = varianceData
      .filter(v => v.category === '재료비')
      .reduce((sum, v) => sum + v.variance, 0);

    const laborVariance = varianceData
      .filter(v => v.category === '노무비')
      .reduce((sum, v) => sum + v.variance, 0);

    const overheadVariance = varianceData
      .filter(v => v.category === '간접비')
      .reduce((sum, v) => sum + v.variance, 0);

    const highImpact = varianceData.filter(v => v.impact === 'high').length;
    const mediumImpact = varianceData.filter(v => v.impact === 'medium').length;
    const lowImpact = varianceData.filter(v => v.impact === 'low').length;

    return {
      totalStandard,
      totalActual,
      totalVariance,
      varianceRate: (totalVariance / totalStandard * 100),
      materialVariance,
      laborVariance,
      overheadVariance,
      highImpact,
      mediumImpact,
      lowImpact,
      totalItems: varianceData.length
    };
  }, [varianceData]);

  const formatCurrency = (value: number): string => {
    if (Math.abs(value) >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`;
    } else if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(0)}만원`;
    }
    return `${value.toLocaleString()}원`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  const getVarianceClass = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVarianceBackground = (value: number): string => {
    if (value > 0) return 'bg-green-50 border-green-200';
    if (value < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getImpactLabel = (impact: string): string => {
    switch (impact) {
      case 'high': return '높음';
      case 'medium': return '중간';
      case 'low': return '낮음';
      default: return impact;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendUpIcon size={16} className="text-green-600" />;
      case 'worsening': return <TrendDownIcon size={16} className="text-red-600" />;
      case 'stable': return <ActivityIcon size={16} className="text-gray-600" />;
      default: return null;
    }
  };

  // 탭 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">총 차이액</span>
                  <AlertIcon size={18} className="text-orange-600" />
                </div>
                <div className={`text-2xl font-bold ${getVarianceClass(summary.totalVariance)}`}>
                  {formatCurrency(Math.abs(summary.totalVariance))}
                </div>
                <div className={`text-xs mt-1 ${getVarianceClass(summary.totalVariance)}`}>
                  {summary.varianceRate.toFixed(2)}% {summary.totalVariance < 0 ? '불리' : '유리'}
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">재료비 차이</span>
                  <DollarIcon size={18} className="text-blue-600" />
                </div>
                <div className={`text-2xl font-bold ${getVarianceClass(summary.materialVariance)}`}>
                  {formatCurrency(Math.abs(summary.materialVariance))}
                </div>
                <div className="text-xs text-gray-500 mt-1">전체 차이의 {((summary.materialVariance / summary.totalVariance) * 100).toFixed(1)}%</div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">노무비 차이</span>
                  <ActivityIcon size={18} className="text-green-600" />
                </div>
                <div className={`text-2xl font-bold ${getVarianceClass(summary.laborVariance)}`}>
                  {formatCurrency(Math.abs(summary.laborVariance))}
                </div>
                <div className="text-xs text-gray-500 mt-1">전체 차이의 {((summary.laborVariance / summary.totalVariance) * 100).toFixed(1)}%</div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">간접비 차이</span>
                  <PieChartIcon size={18} className="text-purple-600" />
                </div>
                <div className={`text-2xl font-bold ${getVarianceClass(summary.overheadVariance)}`}>
                  {formatCurrency(Math.abs(summary.overheadVariance))}
                </div>
                <div className="text-xs text-gray-500 mt-1">전체 차이의 {((summary.overheadVariance / summary.totalVariance) * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* 영향도별 분포 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">영향도별 분포</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">높은 영향</span>
                    <span className="text-lg font-bold text-red-800">{summary.highImpact}</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(summary.highImpact / summary.totalItems) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-700">중간 영향</span>
                    <span className="text-lg font-bold text-yellow-800">{summary.mediumImpact}</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(summary.mediumImpact / summary.totalItems) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">낮은 영향</span>
                    <span className="text-lg font-bold text-green-800">{summary.lowImpact}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(summary.lowImpact / summary.totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 차이 항목별 상세 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">차이 항목별 분석</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">카테고리</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">항목명</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">표준원가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">실제원가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">차이액</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">차이율</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">영향도</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">추세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {varianceData.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.category === '재료비' ? 'bg-blue-100 text-blue-700' :
                            item.category === '노무비' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.itemName}</td>
                        <td className="px-4 py-3 text-right text-gray-800">{formatNumber(item.standardCost)}원</td>
                        <td className="px-4 py-3 text-right text-gray-800">{formatNumber(item.actualCost)}원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getVarianceClass(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${getVarianceClass(item.varianceRate)}`}>
                          {item.varianceRate > 0 ? '+' : ''}{item.varianceRate.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(item.impact)}`}>
                            {getImpactLabel(item.impact)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getTrendIcon(item.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'material':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">재료비 차이 상세 분석</h3>

              {/* 재료비 차이 유형별 집계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">가격 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '재료비')
                      .reduce((sum, v) => sum + v.materialVariance.priceVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 단가 vs 실제 단가</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">수량 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '재료비')
                      .reduce((sum, v) => sum + v.materialVariance.quantityVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 소비량 vs 실제 소비량</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">혼합 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '재료비')
                      .reduce((sum, v) => sum + v.materialVariance.mixVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">재료 배합비 변동</div>
                </div>
              </div>

              {/* 재료비 차이 상세 */}
              <div className="space-y-4">
                {varianceData.filter(v => v.category === '재료비').map(item => (
                  <div key={item.id} className={`border rounded-lg overflow-hidden ${getVarianceBackground(item.variance)}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{item.itemName}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(item.impact)}`}>
                            {getImpactLabel(item.impact)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend)}
                          <div className={`text-lg font-bold ${getVarianceClass(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-gray-600 mb-1">가격 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.materialVariance.priceVariance)}`}>
                            {item.materialVariance.priceVariance > 0 ? '+' : ''}{formatNumber(item.materialVariance.priceVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.materialVariance.priceVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.materialVariance.priceVariance / item.variance * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-gray-600 mb-1">수량 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.materialVariance.quantityVariance)}`}>
                            {item.materialVariance.quantityVariance > 0 ? '+' : ''}{formatNumber(item.materialVariance.quantityVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.materialVariance.quantityVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.materialVariance.quantityVariance / item.variance * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-gray-600 mb-1">혼합 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.materialVariance.mixVariance)}`}>
                            {item.materialVariance.mixVariance > 0 ? '+' : ''}{formatNumber(item.materialVariance.mixVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.materialVariance.mixVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.materialVariance.mixVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'labor':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">노무비 차이 상세 분석</h3>

              {/* 노무비 차이 유형별 집계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">임금율 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '노무비')
                      .reduce((sum, v) => sum + v.laborVariance.rateVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 시간당 임금 vs 실제</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">능률 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '노무비')
                      .reduce((sum, v) => sum + v.laborVariance.efficiencyVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 작업 시간 vs 실제</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">수율 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '노무비')
                      .reduce((sum, v) => sum + v.laborVariance.yieldVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">실제 산출량 vs 표준</div>
                </div>
              </div>

              {/* 노무비 차이 상세 */}
              <div className="space-y-4">
                {varianceData.filter(v => v.category === '노무비').map(item => (
                  <div key={item.id} className={`border rounded-lg overflow-hidden ${getVarianceBackground(item.variance)}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{item.itemName}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(item.impact)}`}>
                            {getImpactLabel(item.impact)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend)}
                          <div className={`text-lg font-bold ${getVarianceClass(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-green-600 mb-1">임금율 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.laborVariance.rateVariance)}`}>
                            {item.laborVariance.rateVariance > 0 ? '+' : ''}{formatNumber(item.laborVariance.rateVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.laborVariance.rateVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.laborVariance.rateVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-blue-600 mb-1">능률 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.laborVariance.efficiencyVariance)}`}>
                            {item.laborVariance.efficiencyVariance > 0 ? '+' : ''}{formatNumber(item.laborVariance.efficiencyVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.laborVariance.efficiencyVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.laborVariance.efficiencyVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-purple-600 mb-1">수율 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.laborVariance.yieldVariance)}`}>
                            {item.laborVariance.yieldVariance > 0 ? '+' : ''}{formatNumber(item.laborVariance.yieldVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.laborVariance.yieldVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.laborVariance.yieldVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'overhead':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">간접비 차이 상세 분석</h3>

              {/* 간접비 차이 유형별 집계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">예산 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '간접비')
                      .reduce((sum, v) => sum + v.overheadVariance.spendingVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">예산액 vs 실제액</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">능률 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '간접비')
                      .reduce((sum, v) => sum + v.overheadVariance.efficiencyVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 배부 시간 vs 실제</div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">활동량 차이</h4>
                  <div className="text-xl font-bold text-gray-800">
                    {formatCurrency(Math.abs(varianceData
                      .filter(v => v.category === '간접비')
                      .reduce((sum, v) => sum + v.overheadVariance.volumeVariance, 0)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">표준 가동량 vs 실제</div>
                </div>
              </div>

              {/* 간접비 차이 상세 */}
              <div className="space-y-4">
                {varianceData.filter(v => v.category === '간접비').map(item => (
                  <div key={item.id} className={`border rounded-lg overflow-hidden ${getVarianceBackground(item.variance)}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{item.itemName}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(item.impact)}`}>
                            {getImpactLabel(item.impact)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend)}
                          <div className={`text-lg font-bold ${getVarianceClass(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-orange-600 mb-1">예산 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.overheadVariance.spendingVariance)}`}>
                            {item.overheadVariance.spendingVariance > 0 ? '+' : ''}{formatNumber(item.overheadVariance.spendingVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.overheadVariance.spendingVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.overheadVariance.spendingVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-blue-600 mb-1">능률 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.overheadVariance.efficiencyVariance)}`}>
                            {item.overheadVariance.efficiencyVariance > 0 ? '+' : ''}{formatNumber(item.overheadVariance.efficiencyVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.overheadVariance.efficiencyVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.overheadVariance.efficiencyVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded">
                          <div className="text-xs text-purple-600 mb-1">활동량 차이</div>
                          <div className={`font-semibold ${getVarianceClass(item.overheadVariance.volumeVariance)}`}>
                            {item.overheadVariance.volumeVariance > 0 ? '+' : ''}{formatNumber(item.overheadVariance.volumeVariance)}원
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.overheadVariance.volumeVariance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.overheadVariance.volumeVariance / (item.variance || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'rootcause':
        return (
          <div className="space-y-6">
            {/* 근본 원인 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertIcon size={18} className="text-red-600" />
                  <h3 className="font-semibold text-gray-800">원인 식별 현황</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">식별 완료</span>
                    <span className="font-semibold text-blue-600">
                      {rootCauses.filter(r => r.status === 'identified').length}건
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">분석 중</span>
                    <span className="font-semibold text-yellow-600">
                      {rootCauses.filter(r => r.status === 'analyzing').length}건
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">해결 완료</span>
                    <span className="font-semibold text-green-600">
                      {rootCauses.filter(r => r.status === 'resolved').length}건
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <DollarIcon size={18} className="text-orange-600" />
                  <h3 className="font-semibold text-gray-800">영향액 합계</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 영향액</span>
                    <span className={`font-semibold ${getVarianceClass(rootCauses.reduce((sum, r) => sum + r.impactAmount, 0))}`}>
                      {formatCurrency(Math.abs(rootCauses.reduce((sum, r) => sum + r.impactAmount, 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">재료비 원인</span>
                    <span className="text-sm text-gray-800">
                      {rootCauses.filter(r => r.category === '재료비').length}건
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">노무비 원인</span>
                    <span className="text-sm text-gray-800">
                      {rootCauses.filter(r => r.category === '노무비').length}건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 근본 원인 분석 상세 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">근본 원인 분석 결과</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 원인 등록
                </button>
              </div>

              <div className="space-y-4">
                {rootCauses.map(cause => {
                  const statusColors = {
                    'identified': 'bg-blue-100 text-blue-700',
                    'analyzing': 'bg-yellow-100 text-yellow-700',
                    'resolved': 'bg-green-100 text-green-700'
                  };
                  const statusLabels = {
                    'identified': '식별',
                    'analyzing': '분석중',
                    'resolved': '해결'
                  };
                  return (
                    <div key={cause.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              cause.category === '재료비' ? 'bg-blue-100 text-blue-700' :
                              cause.category === '노무비' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {cause.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${statusColors[cause.status]}`}>
                              {statusLabels[cause.status]}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800">{cause.rootCause}</h4>
                          <p className="text-sm text-gray-600 mt-1">{cause.contributingFactor}</p>
                        </div>
                        <div className={`text-lg font-bold ${getVarianceClass(cause.impactAmount)}`}>
                          {cause.impactAmount > 0 ? '+' : ''}{formatNumber(cause.impactAmount)}원
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-gray-600">담당 부서: </span>
                          <span className="text-gray-800 font-medium">{cause.responsible}</span>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <span className="text-blue-700">대책: </span>
                          <span className="text-blue-800">{cause.correctiveAction}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-6">
            {/* 개선 활동 요약 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">원가 절감 개선 활동</h3>

              {/* 우선순위별 개선 과제 */}
              <div className="space-y-4">
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h4 className="font-semibold text-red-800">긴급 과제 (High Impact)</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">알루미늄 가격 상승 대응</span>
                        <span className="text-sm font-semibold text-red-600">-450만원</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>담당: 구매팀</span>
                        <span>목표: 3월</span>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">진행중</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">설비 가동률 개선</span>
                        <span className="text-sm font-semibold text-red-600">-120만원</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>담당: 설비팀</span>
                        <span>목표: 4월</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">식별</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <h4 className="font-semibold text-yellow-800">일반 과제 (Medium Impact)</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">야간 작업 최적화</span>
                        <span className="text-sm font-semibold text-yellow-600">-80만원</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>담당: 생산팀</span>
                        <span>목표: 2월</span>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">진행중</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">불량률 감축</span>
                        <span className="text-sm font-semibold text-yellow-600">-100만원</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>담당: 품질팀</span>
                        <span>목표: 2월</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">식별</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="font-semibold text-green-800">달성 과제 (Resolved)</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">CNC 가공 능률 개선</span>
                        <span className="text-sm font-semibold text-green-600">+50만원</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>담당: 생산팀</span>
                        <span>완료: 1월</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">완료</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 개선 활동 추적 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">월간 개선 추이</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">개선 활동 추이 차트 영역</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertIcon size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">원가 차이 분석</h1>
            <p className="text-sm text-gray-600">Cost Variance Analysis | 표준/실제 원가 차이 분석</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: '개요', icon: BarChartIcon },
            { id: 'material', label: '재료비 차이', icon: DollarIcon },
            { id: 'labor', label: '노무비 차이', icon: ActivityIcon },
            { id: 'overhead', label: '간접비 차이', icon: PieChartIcon },
            { id: 'rootcause', label: '근본 원인', icon: FilterIcon },
            { id: 'action', label: '개선 활동', icon: CheckIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      {renderContent()}
    </div>
  );
};

export default CostVarianceAnalysis;
