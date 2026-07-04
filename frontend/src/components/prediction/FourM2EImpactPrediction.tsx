/**
 * 4M2E 영향도 예측 컴포넌트
 * 각 요소가 결과에 미치는 영향도 예측 및 분석
 */

import React, { useState } from 'react';
import {
  ZapIcon, TrendUpIcon, RefreshIcon, BarChartIcon,
  AlertIcon, CheckIcon, ActivityIcon
} from '@/components/icons/Icons';

interface ImpactData {
  factor: string;
  impactScore: number;
  predictedImpact: number;
  change: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const FourM2EImpactPrediction: React.FC = () => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData[]>([
    { factor: 'Man (인력)', impactScore: 85, predictedImpact: 88, change: 3.5, riskLevel: 'low' },
    { factor: 'Machine (설비)', impactScore: 92, predictedImpact: 95, change: 3.3, riskLevel: 'low' },
    { factor: 'Material (자재)', impactScore: 78, predictedImpact: 82, change: 5.1, riskLevel: 'medium' },
    { factor: 'Method (공법)', impactScore: 88, predictedImpact: 90, change: 2.3, riskLevel: 'low' },
    { factor: 'Environment (환경)', impactScore: 65, predictedImpact: 75, change: 15.4, riskLevel: 'high' },
    { factor: 'Energy (에너지)', impactScore: 72, predictedImpact: 78, change: 8.3, riskLevel: 'medium' }
  ]);

  const handlePredict = async () => {
    setIsPredicting(true);
    await new Promise(r => setTimeout(r, 2000));
    setImpactData(prev => prev.map(d => ({
      ...d,
      predictedImpact: Math.min(100, d.impactScore + Math.random() * 10),
      change: Math.random() * 20
    })));
    setIsPredicting(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <ZapIcon size={28} />
            4M2E 영향도 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">각 요소의 영향도 변화 예측</p>
        </div>
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isPredicting ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {isPredicting ? <RefreshIcon size={18} className="animate-spin" /> : <ZapIcon size={18} />}
          {isPredicting ? '분석 중...' : '영향도 예측'}
        </button>
      </div>

      {/* 영향도 순위표 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">영향도 순위</h3>
          <div className="space-y-4">
            {impactData.sort((a, b) => b.predictedImpact - a.predictedImpact).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.factor}</span>
                    <span className={`text-lg font-bold ${
                      item.predictedImpact >= 80 ? 'text-red-600' :
                      item.predictedImpact >= 60 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.predictedImpact.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${item.predictedImpact}%` }}
                    />
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${getRiskColor(item.riskLevel)}`}>
                  {item.riskLevel === 'high' ? '높음' : item.riskLevel === 'medium' ? '중간' : '낮음'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourM2EImpactPrediction;
