/**
 * 4M2E 예측 컴포넌트
 * Man(인력), Machine(설비), Material(자재), Method(공법),
 * Environment(환경), Energy(에너지) 기반 예측
 */

import React, { useState, useEffect } from 'react';
import {
  TargetIcon, TrendUpIcon, AlertIcon, CheckIcon, RefreshIcon,
  FactoryIcon, UsersIcon, CpuIcon, PackageIcon, SettingsIcon,
  ActivityIcon, ZapIcon, BarChartIcon
} from '@/components/icons/Icons';

interface FactorPrediction {
  factor: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface PredictionModel {
  id: string;
  name: string;
  type: 'LSTM' | 'RandomForest' | 'XGBoost' | 'Prophet';
  accuracy: number;
  lastTrained: string;
}

const FourM2EPrediction: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isPredicting, setIsPredicting] = useState(false);

  // 4M2E 요소별 예측 데이터
  const [factorPredictions, setFactorPredictions] = useState<FactorPrediction[]>([
    {
      factor: 'Man (인력)',
      currentValue: 85,
      predictedValue: 87,
      changePercent: 2.35,
      trend: 'up',
      confidence: 92
    },
    {
      factor: 'Machine (설비)',
      currentValue: 78,
      predictedValue: 82,
      changePercent: 5.13,
      trend: 'up',
      confidence: 88
    },
    {
      factor: 'Material (자재)',
      currentValue: 92,
      predictedValue: 90,
      changePercent: -2.17,
      trend: 'down',
      confidence: 95
    },
    {
      factor: 'Method (공법)',
      currentValue: 88,
      predictedValue: 89,
      changePercent: 1.14,
      trend: 'up',
      confidence: 90
    },
    {
      factor: 'Environment (환경)',
      currentValue: 75,
      predictedValue: 76,
      changePercent: 1.33,
      trend: 'stable',
      confidence: 85
    },
    {
      factor: 'Energy (에너지)',
      currentValue: 80,
      predictedValue: 83,
      changePercent: 3.75,
      trend: 'up',
      confidence: 87
    }
  ]);

  // 예측 모델
  const [models] = useState<PredictionModel[]>([
    { id: 'm1', name: '4M2E 통합 모델', type: 'LSTM', accuracy: 94.2, lastTrained: '2024-03-15' },
    { id: 'm2', name: '요소별 앙상블', type: 'XGBoost', accuracy: 91.8, lastTrained: '2024-03-14' },
    { id: 'm3', name: '시계열 Prophet', type: 'Prophet', accuracy: 89.5, lastTrained: '2024-03-13' }
  ]);

  const handlePrediction = async () => {
    setIsPredicting(true);
    // 예측 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFactorPredictions(prev => prev.map(p => ({
      ...p,
      predictedValue: p.currentValue * (1 + (Math.random() - 0.4) * 0.1),
      changePercent: (Math.random() - 0.4) * 10
    })));
    setIsPredicting(false);
  };

  const getFactorIcon = (factor: string) => {
    if (factor.includes('Man')) return UsersIcon;
    if (factor.includes('Machine')) return CpuIcon;
    if (factor.includes('Material')) return PackageIcon;
    if (factor.includes('Method')) return SettingsIcon;
    if (factor.includes('Environment')) return ActivityIcon;
    if (factor.includes('Energy')) return ZapIcon;
    return TargetIcon;
  };

  const getFactorColor = (factor: string) => {
    if (factor.includes('Man')) return 'from-blue-500 to-cyan-500';
    if (factor.includes('Machine')) return 'from-purple-500 to-pink-500';
    if (factor.includes('Material')) return 'from-green-500 to-emerald-500';
    if (factor.includes('Method')) return 'from-orange-500 to-red-500';
    if (factor.includes('Environment')) return 'from-teal-500 to-cyan-500';
    if (factor.includes('Energy')) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <TargetIcon size={28} />
            4M2E 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            6대 요소(Man, Machine, Material, Method, Environment, Energy) 기반 예측
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
            <option value="1y">최근 1년</option>
          </select>
          <button
            onClick={handlePrediction}
            disabled={isPredicting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              isPredicting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
            }`}
          >
            {isPredicting ? (
              <>
                <RefreshIcon size={18} className="animate-spin" />
                예측 중...
              </>
            ) : (
              <>
                <TrendUpIcon size={18} />
                예측 실행
              </>
            )}
          </button>
        </div>
      </div>

      {/* 예측 모델 정보 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">활성 예측 모델</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map(model => (
            <div key={model.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <div className="font-medium text-gray-800 dark:text-gray-200">{model.name}</div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-600">{model.type}</span>
                <span className="text-green-600 font-medium">{model.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4M2E 요소별 예측 카드 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">요소별 예측 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {factorPredictions.map((prediction, idx) => {
            const FactorIcon = getFactorIcon(prediction.factor);
            const factorColor = getFactorColor(prediction.factor);

            return (
              <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${factorColor}`}>
                      <FactorIcon size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{prediction.factor}</span>
                  </div>
                  <span className="text-sm text-gray-500">{prediction.confidence}% 신뢰도</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">현재 값</span>
                    <span className="font-bold text-gray-800">{prediction.currentValue.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">예측 값</span>
                    <span className="font-bold text-blue-600">{prediction.predictedValue.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">변화율</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      prediction.changePercent > 0 ? 'text-red-600' :
                      prediction.changePercent < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {prediction.changePercent > 0 ? '▲' : prediction.changePercent < 0 ? '▼' : '─'}
                      {Math.abs(prediction.changePercent).toFixed(2)}%
                    </span>
                  </div>

                  {/* 진행률 바 */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${factorColor} h-2 rounded-full transition-all`}
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 종합 예측 분석 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">종합 예측 인사이트</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">상승 요인</h4>
            <div className="space-y-2">
              {factorPredictions.filter(p => p.changePercent > 0).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-sm">{p.factor}</span>
                  <span className="text-sm font-medium text-red-600">+{p.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">하락 요인</h4>
            <div className="space-y-2">
              {factorPredictions.filter(p => p.changePercent < 0).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm">{p.factor}</span>
                  <span className="text-sm font-medium text-green-600">{p.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourM2EPrediction;
