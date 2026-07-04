/**
 * 코스 드라이버 예측 컴포넌트
 * 원가 동인별 예측 및 영향도 분석
 */

import React, { useState } from 'react';
import {
  ActivityIcon, TrendUpIcon, RefreshIcon, ZapIcon,
  AlertIcon, TargetIcon, BarChartIcon
} from '@/components/icons/Icons';

interface CostDriver {
  name: string;
  dimension: 'MAN' | 'MACHINE' | 'MATERIAL' | 'METHOD' | 'ENVIRO';
  currentImpact: number;
  predictedImpact: number;
  change: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const CostDriverPrediction: React.FC = () => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<string>('all');

  const [costDrivers, setCostDrivers] = useState<CostDriver[]>([
    { name: '생산량 증가', dimension: 'MAN', currentImpact: 75, predictedImpact: 78, change: 4.0, riskLevel: 'low' },
    { name: '노동비 상승', dimension: 'MAN', currentImpact: 85, predictedImpact: 88, change: 3.5, riskLevel: 'medium' },
    { name: '설비 가동률', dimension: 'MACHINE', currentImpact: 70, predictedImpact: 75, change: 7.1, riskLevel: 'low' },
    { name: '설비 노후화', dimension: 'MACHINE', currentImpact: 60, predictedImpact: 65, change: 8.3, riskLevel: 'medium' },
    { name: '원자재 가격', dimension: 'MATERIAL', currentImpact: 90, predictedImpact: 95, change: 5.6, riskLevel: 'high' },
    { name: '공급망 불안', dimension: 'MATERIAL', currentImpact: 55, predictedImpact: 62, change: 12.7, riskLevel: 'high' },
    { name: '공정 최적화', dimension: 'METHOD', currentImpact: 65, predictedImpact: 70, change: 7.7, riskLevel: 'low' },
    { name: '자동화 도입', dimension: 'METHOD', currentImpact: 50, predictedImpact: 58, change: 16.0, riskLevel: 'low' },
    { name: '에너지 비용', dimension: 'ENVIRO', currentImpact: 45, predictedImpact: 50, change: 11.1, riskLevel: 'medium' },
    { name: '환경 규제', dimension: 'ENVIRO', currentImpact: 40, predictedImpact: 45, change: 12.5, riskLevel: 'medium' }
  ]);

  const handlePredict = async () => {
    setIsPredicting(true);
    await new Promise(r => setTimeout(r, 2000));
    setCostDrivers(prev => prev.map(d => ({
      ...d,
      predictedImpact: Math.min(100, d.currentImpact + (Math.random() - 0.3) * 15),
      change: (Math.random() - 0.3) * 20
    })));
    setIsPredicting(false);
  };

  const dimensions = [
    { id: 'all', name: '전체', color: 'from-gray-500 to-gray-600' },
    { id: 'MAN', name: 'Man (인력)', color: 'from-blue-500 to-cyan-500' },
    { id: 'MACHINE', name: 'Machine (설비)', color: 'from-purple-500 to-pink-500' },
    { id: 'MATERIAL', name: 'Material (자재)', color: 'from-green-500 to-emerald-500' },
    { id: 'METHOD', name: 'Method (공법)', color: 'from-orange-500 to-red-500' },
    { id: 'ENVIRO', name: 'Environment (환경)', color: 'from-teal-500 to-cyan-500' }
  ];

  const filteredDrivers = selectedDimension === 'all'
    ? costDrivers
    : costDrivers.filter(d => d.dimension === selectedDimension);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low': return '낮음';
      case 'medium': return '중간';
      case 'high': return '높음';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <ActivityIcon size={28} />
            코스 드라이버 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">원가 동인별 영향도 예측</p>
        </div>
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isPredicting ? 'bg-gray-400' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
          }`}
        >
          {isPredicting ? <RefreshIcon size={18} className="animate-spin" /> : <ZapIcon size={18} />}
          {isPredicting ? '예측 중...' : '영향도 예측'}
        </button>
      </div>

      {/* 차원 필터 */}
      <div className="flex flex-wrap gap-2">
        {dimensions.map(dim => (
          <button
            key={dim.id}
            onClick={() => setSelectedDimension(dim.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedDimension === dim.id
                ? 'bg-gradient-to-r text-white ' + dim.color
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {dim.name}
          </button>
        ))}
      </div>

      {/* 코스 드라이버 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
            원가 동인 영향도 ({filteredDrivers.length}개)
          </h3>
          <div className="space-y-3">
            {filteredDrivers
              .sort((a, b) => b.predictedImpact - a.predictedImpact)
              .map((driver, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-gradient-to-br ${
                      dimensions.find(d => d.id === driver.dimension)?.color || 'from-gray-500 to-gray-600'
                    } rounded-lg text-white font-bold`}>
                      {driver.dimension.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{driver.name}</div>
                      <div className="text-sm text-gray-500">{dimensions.find(d => d.id === driver.dimension)?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">현재 → 예측</div>
                      <div className="font-bold">
                        <span className="text-gray-800">{driver.currentImpact}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="text-blue-600">{driver.predictedImpact.toFixed(0)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${getRiskColor(driver.riskLevel)}`}>
                      {getRiskLabel(driver.riskLevel)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    driver.change > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {driver.change > 0 ? '▲' : '▼'} {Math.abs(driver.change).toFixed(1)}%
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all"
                      style={{ width: `${driver.predictedImpact}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 위험 요약 */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertIcon size={24} className="text-red-600" />
          <span className="font-bold text-red-800 dark:text-red-200">높은 위험 동인</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {costDrivers.filter(d => d.riskLevel === 'high').slice(0, 3).map((driver, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <div className="font-medium text-gray-800 dark:text-gray-200">{driver.name}</div>
              <div className="text-sm text-red-600">영향도: {driver.predictedImpact.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CostDriverPrediction;
