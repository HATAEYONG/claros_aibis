import React, { useState, useMemo } from 'react';
import {
  DollarIcon,
  TrendUpIcon,
  TrendDownIcon,
  AlertIcon,
  BarChartIcon,
  SettingsIcon,
  CheckIcon,
  ActivityIcon
} from '@/components/icons/Icons';

interface StandardCost {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  standardCost: number;
  actualCost: number;
  variance: number;
  varianceRate: number;
  materialCost: {
    standard: number;
    actual: number;
    variance: number;
  };
  laborCost: {
    standard: number;
    actual: number;
    variance: number;
  };
  overheadCost: {
    standard: number;
    actual: number;
    variance: number;
  };
  unit: string;
  period: string;
}

interface VarianceDetail {
  id: string;
  itemName: string;
  varianceType: 'material' | 'labor' | 'overhead';
  varianceName: string;
  standard: number;
  actual: number;
  variance: number;
  reason: string;
  responsible: string;
  actionPlan: string;
  status: 'open' | 'in-progress' | 'resolved';
}

const StandardCost: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'variance' | 'settings' | 'report'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-01');

  // 표준 원가 데이터
  const [standardCosts, setStandardCosts] = useState<StandardCost[]>([
    {
      id: 'sc-1',
      itemCode: 'P-1001',
      itemName: '제품 A-정밀부품',
      category: '완제품',
      standardCost: 150000,
      actualCost: 158500,
      variance: -8500,
      varianceRate: -5.67,
      materialCost: { standard: 80000, actual: 84000, variance: -4000 },
      laborCost: { standard: 45000, actual: 47500, variance: -2500 },
      overheadCost: { standard: 25000, actual: 27000, variance: -2000 },
      unit: '개',
      period: '2026-01'
    },
    {
      id: 'sc-2',
      itemCode: 'P-1002',
      itemName: '제품 B-일반부품',
      category: '완제품',
      standardCost: 95000,
      actualCost: 93000,
      variance: 2000,
      varianceRate: 2.11,
      materialCost: { standard: 50000, actual: 48500, variance: 1500 },
      laborCost: { standard: 30000, actual: 29500, variance: 500 },
      overheadCost: { standard: 15000, actual: 15000, variance: 0 },
      unit: '개',
      period: '2026-01'
    },
    {
      id: 'sc-3',
      itemCode: 'P-1003',
      itemName: '제품 C-고급부품',
      category: '완제품',
      standardCost: 220000,
      actualCost: 235000,
      variance: -15000,
      varianceRate: -6.82,
      materialCost: { standard: 120000, actual: 130000, variance: -10000 },
      laborCost: { standard: 65000, actual: 68000, variance: -3000 },
      overheadCost: { standard: 35000, actual: 37000, variance: -2000 },
      unit: '개',
      period: '2026-01'
    },
    {
      id: 'sc-4',
      itemCode: 'M-2001',
      itemName: '원자재-강판',
      category: '원자재',
      standardCost: 15000,
      actualCost: 14500,
      variance: 500,
      varianceRate: 3.33,
      materialCost: { standard: 15000, actual: 14500, variance: 500 },
      laborCost: { standard: 0, actual: 0, variance: 0 },
      overheadCost: { standard: 0, actual: 0, variance: 0 },
      unit: 'kg',
      period: '2026-01'
    },
    {
      id: 'sc-5',
      itemCode: 'M-2002',
      itemName: '원자재-알루미늄',
      category: '원자재',
      standardCost: 25000,
      actualCost: 28000,
      variance: -3000,
      varianceRate: -12.0,
      materialCost: { standard: 25000, actual: 28000, variance: -3000 },
      laborCost: { standard: 0, actual: 0, variance: 0 },
      overheadCost: { standard: 0, actual: 0, variance: 0 },
      unit: 'kg',
      period: '2026-01'
    },
    {
      id: 'sc-6',
      itemCode: 'W-3001',
      itemName: '가공-열처리',
      category: '가공',
      standardCost: 5000,
      actualCost: 5200,
      variance: -200,
      varianceRate: -4.0,
      materialCost: { standard: 1000, actual: 1100, variance: -100 },
      laborCost: { standard: 3000, actual: 3100, variance: -100 },
      overheadCost: { standard: 1000, actual: 1000, variance: 0 },
      unit: '건',
      period: '2026-01'
    }
  ]);

  // 차이 상세 데이터
  const [varianceDetails, setVarianceDetails] = useState<VarianceDetail[]>([
    {
      id: 'vd-1',
      itemName: '제품 A-정밀부품',
      varianceType: 'material',
      varianceName: '재료비 가격 차이',
      standard: 80000,
      actual: 84000,
      variance: -4000,
      reason: '원자재 가격 상승 (강판 +5%)',
      responsible: '구매팀',
      actionPlan: '대체 공급처 검토, 계약 단가 재협상',
      status: 'in-progress'
    },
    {
      id: 'vd-2',
      itemName: '제품 A-정밀부품',
      varianceType: 'labor',
      varianceName: '직접 노무비율 차이',
      standard: 45000,
      actual: 47500,
      variance: -2500,
      reason: '야간 작업 증가로 할증료 발생',
      responsible: '생산팀',
      actionPlan: '생산 일정 최적화, 야간 작업 감축',
      status: 'open'
    },
    {
      id: 'vd-3',
      itemName: '제품 C-고급부품',
      varianceType: 'material',
      varianceName: '재료비 수량 차이',
      standard: 120000,
      actual: 130000,
      variance: -10000,
      reason: '불량률 증가로 재료 소비 증가',
      responsible: '품질팀',
      actionPlan: '공정 개선, 불량 원인 파악',
      status: 'in-progress'
    },
    {
      id: 'vd-4',
      itemName: '제품 C-고급부품',
      varianceType: 'overhead',
      varianceName: '제조간접비 배부률 차이',
      standard: 35000,
      actual: 37000,
      variance: -2000,
      reason: '설비 가동률 저하로 배부额 증가',
      responsible: '생산팀',
      actionPlan: '설비 효율화, 가동률 개선',
      status: 'open'
    },
    {
      id: 'vd-5',
      itemName: '원자재-알루미늄',
      varianceType: 'material',
      varianceName: '재료비 가격 차이',
      standard: 25000,
      actual: 28000,
      variance: -3000,
      reason: '알루미늄 국제가격 상승',
      responsible: '구매팀',
      actionPlan: '선물 매매 고려, 재고 최적화',
      status: 'resolved'
    }
  ]);

  // 집계 데이터
  const summary = useMemo(() => {
    const totalStandard = standardCosts.reduce((sum, item) => sum + item.standardCost, 0);
    const totalActual = standardCosts.reduce((sum, item) => sum + item.actualCost, 0);
    const totalVariance = standardCosts.reduce((sum, item) => sum + item.variance, 0);
    const favorableCount = standardCosts.filter(item => item.variance > 0).length;
    const unfavorableCount = standardCosts.filter(item => item.variance < 0).length;

    const materialVariance = standardCosts.reduce((sum, item) => sum + item.materialCost.variance, 0);
    const laborVariance = standardCosts.reduce((sum, item) => sum + item.laborCost.variance, 0);
    const overheadVariance = standardCosts.reduce((sum, item) => sum + item.overheadCost.variance, 0);

    return {
      totalStandard,
      totalActual,
      totalVariance,
      varianceRate: (totalVariance / totalStandard * 100),
      favorableCount,
      unfavorableCount,
      materialVariance,
      laborVariance,
      overheadVariance,
      totalItems: standardCosts.length
    };
  }, [standardCosts]);

  const formatCurrency = (value: number): string => {
    if (value >= 10000) {
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

  const getVarianceIcon = (value: number) => {
    if (value > 0) return <TrendUpIcon size={16} className="text-green-600" />;
    if (value < 0) return <TrendDownIcon size={16} className="text-red-600" />;
    return null;
  };

  // 탭 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* KPI 카드 - 그라데이션 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-blue-100">표준 원가 합계</span>
                  <DollarIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{formatCurrency(summary.totalStandard)}</div>
                <div className="text-xs text-blue-100 mt-1">{summary.totalItems}개 품목</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-purple-100">실제 원가 합계</span>
                  <BarChartIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{formatCurrency(summary.totalActual)}</div>
                <div className={`text-xs mt-1 ${summary.totalVariance < 0 ? 'text-red-200' : 'text-green-200'}`}>
                  {summary.varianceRate.toFixed(2)}% 차이
                </div>
              </div>

              <div className={`p-5 rounded-xl shadow-md ${summary.totalVariance >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm ${summary.totalVariance >= 0 ? 'text-green-100' : 'text-red-100'}`}>총 차이액</span>
                  {getVarianceIcon(summary.totalVariance)}
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(Math.abs(summary.totalVariance))}
                </div>
                <div className={`text-xs mt-1 ${summary.totalVariance >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                  유리: {summary.favorableCount} / 불리: {summary.unfavorableCount}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-orange-100">차이 비율</span>
                  <ActivityIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {Math.abs(summary.varianceRate).toFixed(2)}%
                </div>
                <div className="text-xs text-orange-100 mt-1">
                  {summary.totalVariance < 0 ? '불리 차이' : '유리 차이'}
                </div>
              </div>
            </div>

            {/* 원가 요소별 차이 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">원가 요소별 차이 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${getVarianceBackground(summary.materialVariance)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">재료비 차이</span>
                    {getVarianceIcon(summary.materialVariance)}
                  </div>
                  <div className={`text-xl font-bold ${getVarianceClass(summary.materialVariance)}`}>
                    {formatCurrency(Math.abs(summary.materialVariance))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    표준: {formatCurrency(standardCosts.reduce((s, i) => s + i.materialCost.standard, 0))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getVarianceBackground(summary.laborVariance)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">노무비 차이</span>
                    {getVarianceIcon(summary.laborVariance)}
                  </div>
                  <div className={`text-xl font-bold ${getVarianceClass(summary.laborVariance)}`}>
                    {formatCurrency(Math.abs(summary.laborVariance))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    표준: {formatCurrency(standardCosts.reduce((s, i) => s + i.laborCost.standard, 0))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${getVarianceBackground(summary.overheadVariance)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">간접비 차이</span>
                    {getVarianceIcon(summary.overheadVariance)}
                  </div>
                  <div className={`text-xl font-bold ${getVarianceClass(summary.overheadVariance)}`}>
                    {formatCurrency(Math.abs(summary.overheadVariance))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    표준: {formatCurrency(standardCosts.reduce((s, i) => s + i.overheadCost.standard, 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* 품목별 표준 원가 현황 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">품목별 표준 원가 현황</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">품목코드</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">품목명</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">표준원가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">실제원가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">차이액</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">차이율</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">구성</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {standardCosts.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.itemCode}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">{item.itemName}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">{formatNumber(item.standardCost)}원</td>
                        <td className="px-4 py-3 text-right text-gray-800">{formatNumber(item.actualCost)}원</td>
                        <td className={`px-4 py-3 text-right font-semibold ${getVarianceClass(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${getVarianceClass(item.varianceRate)}`}>
                          {item.varianceRate > 0 ? '+' : ''}{item.varianceRate.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <div className="w-12 bg-blue-500 rounded h-2" style={{ width: `${(item.materialCost.standard / item.standardCost) * 100}%` }}></div>
                            <div className="w-12 bg-green-500 rounded h-2" style={{ width: `${(item.laborCost.standard / item.standardCost) * 100}%` }}></div>
                            <div className="w-12 bg-purple-500 rounded h-2" style={{ width: `${(item.overheadCost.standard / item.standardCost) * 100}%` }}></div>
                          </div>
                          <div className="flex gap-1 justify-center text-xs text-gray-500 mt-1">
                            <span>재료</span>
                            <span>노무</span>
                            <span>간접</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 차이 원인별 분류 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">주요 차이 원인</h3>
              <div className="space-y-3">
                {varianceDetails.slice(0, 5).map(detail => {
                  const statusColors = {
                    'open': 'bg-red-100 text-red-700',
                    'in-progress': 'bg-yellow-100 text-yellow-700',
                    'resolved': 'bg-green-100 text-green-700'
                  };
                  const statusLabels = {
                    'open': '미조치',
                    'in-progress': '진행중',
                    'resolved': '완료'
                  };
                  return (
                    <div key={detail.id} className={`p-4 rounded-lg border ${getVarianceBackground(detail.variance)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{detail.itemName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[detail.status]}`}>
                              {statusLabels[detail.status]}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{detail.varianceName}</div>
                          <div className="text-xs text-gray-500 mt-1">{detail.reason}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-lg font-bold ${getVarianceClass(detail.variance)}`}>
                            {detail.variance > 0 ? '+' : ''}{formatNumber(detail.variance)}원
                          </div>
                          <div className="text-xs text-gray-500">
                            {detail.responsible}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'items':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">품목별 표준 원가 상세</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 신규 품목 등록
                </button>
              </div>

              {/* 필터 */}
              <div className="flex gap-4 mb-4">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">전체 카테고리</option>
                  <option value="완제품">완제품</option>
                  <option value="원자재">원자재</option>
                  <option value="가공">가공</option>
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="2026-01">2026년 1월</option>
                  <option value="2025-12">2025년 12월</option>
                  <option value="2025-11">2025년 11월</option>
                </select>
              </div>

              <div className="space-y-4">
                {standardCosts.map(item => (
                  <div key={item.id} className={`border rounded-lg overflow-hidden ${getVarianceBackground(item.variance)}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{item.itemName}</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.itemCode}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{item.category}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">단위: {item.unit} | 기준: {item.period}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">{formatNumber(item.actualCost)}원</div>
                          <div className={`text-sm font-semibold ${getVarianceClass(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{formatNumber(item.variance)}원 ({item.varianceRate > 0 ? '+' : ''}{item.varianceRate.toFixed(2)}%)
                          </div>
                        </div>
                      </div>

                      {/* 원가 구성 비교 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">재료비</div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatNumber(item.materialCost.standard)}원</span>
                            <span className={`text-sm font-semibold ${getVarianceClass(item.materialCost.variance)}`}>
                              {item.materialCost.variance > 0 ? '+' : ''}{formatNumber(item.materialCost.variance)}원
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.materialCost.variance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.materialCost.variance / item.materialCost.standard * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-xs text-green-600 mb-1">노무비</div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatNumber(item.laborCost.standard)}원</span>
                            <span className={`text-sm font-semibold ${getVarianceClass(item.laborCost.variance)}`}>
                              {item.laborCost.variance > 0 ? '+' : ''}{formatNumber(item.laborCost.variance)}원
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.laborCost.variance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.laborCost.variance / (item.laborCost.standard || 1) * 100)}%` }}>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-xs text-purple-600 mb-1">간접비</div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatNumber(item.overheadCost.standard)}원</span>
                            <span className={`text-sm font-semibold ${getVarianceClass(item.overheadCost.variance)}`}>
                              {item.overheadCost.variance > 0 ? '+' : ''}{formatNumber(item.overheadCost.variance)}원
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${item.overheadCost.variance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(item.overheadCost.variance / (item.overheadCost.standard || 1) * 100)}%` }}>
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

      case 'variance':
        return (
          <div className="space-y-6">
            {/* 차이 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-red-700 mb-1">불리 차이</div>
                <div className="text-2xl font-bold text-red-800">
                  {formatCurrency(Math.abs(summary.totalVariance < 0 ? summary.totalVariance : 0))}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {summary.unfavorableCount}개 품목
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 mb-1">유리 차이</div>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(summary.totalVariance > 0 ? summary.totalVariance : 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {summary.favorableCount}개 품목
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-700 mb-1">차이 건수</div>
                <div className="text-2xl font-bold text-gray-800">
                  {varianceDetails.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  조치 필요: {varianceDetails.filter(v => v.status !== 'resolved').length}
                </div>
              </div>
            </div>

            {/* 차이 상세 목록 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">차이 상세 및 조치 현황</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 차이 등록
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">품목</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">차이 유형</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">표준</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">실제</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">차이</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">원인</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">담당</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {varianceDetails.map(detail => {
                      const statusColors = {
                        'open': 'bg-red-100 text-red-700',
                        'in-progress': 'bg-yellow-100 text-yellow-700',
                        'resolved': 'bg-green-100 text-green-700'
                      };
                      const statusLabels = {
                        'open': '미조치',
                        'in-progress': '진행중',
                        'resolved': '완료'
                      };
                      return (
                        <tr key={detail.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{detail.itemName}</td>
                          <td className="px-4 py-3 text-gray-600">{detail.varianceName}</td>
                          <td className="px-4 py-3 text-right text-gray-800">{formatNumber(detail.standard)}원</td>
                          <td className="px-4 py-3 text-right text-gray-800">{formatNumber(detail.actual)}원</td>
                          <td className={`px-4 py-3 text-right font-semibold ${getVarianceClass(detail.variance)}`}>
                            {detail.variance > 0 ? '+' : ''}{formatNumber(detail.variance)}원
                          </td>
                          <td className="px-4 py-3 text-gray-600">{detail.reason}</td>
                          <td className="px-4 py-3 text-gray-600">{detail.responsible}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[detail.status]}`}>
                              {statusLabels[detail.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 조치 계획 상세 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">조치 계획 및 추적</h3>
              <div className="space-y-4">
                {varianceDetails.filter(v => v.status !== 'resolved').map(detail => (
                  <div key={detail.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{detail.itemName}</h4>
                        <p className="text-sm text-gray-600">{detail.varianceName}</p>
                      </div>
                      <div className={`text-lg font-bold ${getVarianceClass(detail.variance)}`}>
                        {detail.variance > 0 ? '+' : ''}{formatNumber(detail.variance)}원
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">원인: </span>
                        <span className="text-gray-800">{detail.reason}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">담당: </span>
                        <span className="text-gray-800">{detail.responsible}</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-700 mb-1">조치 계획</div>
                      <div className="text-sm text-blue-800">{detail.actionPlan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">표준 원가 설정</h3>

              {/* 설정 카테고리 */}
              <div className="space-y-6">
                {/* 재료비 표준 설정 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    재료비 표준 설정
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">표준 재료 단가</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="원/kg" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">표준 소비량</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="kg/개" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">허용 불량률</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="%" />
                    </div>
                  </div>
                </div>

                {/* 노무비 표준 설정 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    노무비 표준 설정
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">표준 시간당 임금</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="원/시간" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">표준 작업 시간</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="분/개" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">표준 능률</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="%" />
                    </div>
                  </div>
                </div>

                {/* 간접비 표준 설정 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    간접비 표준 설정
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">배부 기준</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option>기계 시간</option>
                        <option>직접 노무비</option>
                        <option>생산량</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">표준 배부율</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="%" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">예상 가동률</label>
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="%" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  저장
                </button>
              </div>
            </div>

            {/* 차이 기준 설정 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">차이 분석 기준 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">유리/불리 차이 기준</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="5" />
                  <div className="text-xs text-gray-500 mt-1">차이율(%) 이상일 때 상세 분석</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">조치 대상 기준</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="10" />
                  <div className="text-xs text-gray-500 mt-1">차이액(만원) 이상일 때 조치</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">표준 원가 보고서</h3>

              {/* 보고서 종류 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">월간 차이 분석 보고서</div>
                      <div className="text-xs text-gray-500">월별 표준/실제 원가 비교</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarIcon size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">품목별 원가 보고서</div>
                      <div className="text-xs text-gray-500">품목별 상세 원가 분석</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <AlertIcon size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">차이 원인 보고서</div>
                      <div className="text-xs text-gray-500">차이 원인 및 조치 현황</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 보고서 생성 버튼 */}
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  PDF 다운로드
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Excel 다운로드
                </button>
              </div>
            </div>

            {/* 월간 추이 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">월간 차이 추이</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">차트 영역 (Chart.js로 구현 가능)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 - 그라데이션 배경 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <SettingsIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">표준 원가 관리</h1>
            <p className="text-purple-100">Standard Cost Management | 표준 원가 설정 및 차이 분석</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '개요', icon: BarChartIcon, color: 'from-purple-500 to-purple-600' },
            { id: 'items', label: '품목별 원가', icon: DollarIcon, color: 'from-blue-500 to-blue-600' },
            { id: 'variance', label: '차이 분석', icon: AlertIcon, color: 'from-red-500 to-red-600' },
            { id: 'settings', label: '설정', icon: SettingsIcon, color: 'from-gray-500 to-gray-600' },
            { id: 'report', label: '보고서', icon: BarChartIcon, color: 'from-green-500 to-green-600' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default StandardCost;
