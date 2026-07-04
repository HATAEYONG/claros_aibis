/**
 * 코스 분해 예측 컴포넌트
 * 4M2E 요소별 원가 분해 및 예측
 */

import React, { useState } from 'react';
import {
  BarChart3Icon, TrendUpIcon, RefreshIcon,
  DollarIcon, ActivityIcon, TargetIcon
} from '@/components/icons/Icons';

interface CostBreakdown {
  category: string;
  currentCost: number;
  predictedCost: number;
  changePercent: number;
  proportion: number;
}

const CostBreakdownPrediction: React.FC = () => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('3m');

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([
    { category: 'Man (인건비)', currentCost: 45000000, predictedCost: 46800000, changePercent: 4.0, proportion: 35 },
    { category: 'Machine (설비비)', currentCost: 32000000, predictedCost: 31500000, changePercent: -1.6, proportion: 25 },
    { category: 'Material (자재비)', currentCost: 28000000, predictedCost: 29400000, changePercent: 5.0, proportion: 22 },
    { category: 'Method (경비)', currentCost: 15000000, predictedCost: 15600000, changePercent: 4.0, proportion: 12 },
    { category: 'Environment (환경비)', currentCost: 5000000, predictedCost: 4800000, changePercent: -4.0, proportion: 4 },
    { category: 'Energy (에너지비)', currentCost: 3000000, predictedCost: 3150000, changePercent: 5.0, proportion: 2 }
  ]);

  const handlePredict = async () => {
    setIsPredicting(true);
    await new Promise(r => setTimeout(r, 2000));
    setCostBreakdown(prev => prev.map(c => ({
      ...c,
      predictedCost: c.currentCost * (1 + (Math.random() - 0.45) * 0.1),
      changePercent: (Math.random() - 0.45) * 10
    })));
    setIsPredicting(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
  };

  const totalCurrentCost = costBreakdown.reduce((sum, c) => sum + c.currentCost, 0);
  const totalPredictedCost = costBreakdown.reduce((sum, c) => sum + c.predictedCost, 0);
  const totalChange = ((totalPredictedCost - totalCurrentCost) / totalCurrentCost) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <BarChart3Icon size={28} />
            코스 분해 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">4M2E 요소별 원가 예측</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="1m">1개월</option>
            <option value="3m">3개월</option>
            <option value="6m">6개월</option>
            <option value="1y">1년</option>
          </select>
          <button
            onClick={handlePredict}
            disabled={isPredicting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isPredicting ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            }`}
          >
            {isPredicting ? <RefreshIcon size={18} className="animate-spin" /> : <TrendUpIcon size={18} />}
            {isPredicting ? '예측 중...' : '원가 예측'}
          </button>
        </div>
      </div>

      {/* 총 원가 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-xl text-white">
          <div className="text-sm opacity-90 mb-1">현재 총 원가</div>
          <div className="text-2xl font-bold">{formatCurrency(totalCurrentCost)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-xl text-white">
          <div className="text-sm opacity-90 mb-1">예측 총 원가</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPredictedCost)}</div>
        </div>
        <div className={`p-6 rounded-xl text-white ${totalChange > 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-teal-500'}`}>
          <div className="text-sm opacity-90 mb-1">변화율</div>
          <div className="text-2xl font-bold">{totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)}%</div>
        </div>
      </div>

      {/* 상세 원가 분해 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">요소별 원가 분해</h3>
          <div className="space-y-4">
            {costBreakdown.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{formatCurrency(item.currentCost)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-blue-600">{formatCurrency(item.predictedCost)}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      item.changePercent > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                      style={{ width: `${item.proportion}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{item.proportion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdownPrediction;
