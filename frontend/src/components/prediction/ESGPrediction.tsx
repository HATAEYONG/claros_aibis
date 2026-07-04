/**
 * ESG 예측 컴포넌트
 * Environmental, Social, Governance 지표 예측
 */

import React, { useState } from 'react';
import {
  AlertIcon, TrendUpIcon, RefreshIcon, LeafIcon,
  UsersIcon, ScaleIcon, ActivityIcon
} from '@/components/icons/Icons';

interface ESGMetric {
  category: 'E' | 'S' | 'G';
  name: string;
  currentScore: number;
  predictedScore: number;
  trend: 'up' | 'down' | 'stable';
}

const ESGPrediction: React.FC = () => {
  const [isPredicting, setIsPredicting] = useState(false);

  const [esgMetrics, setEsgMetrics] = useState<ESGMetric[]>([
    { category: 'E', name: '탄소 배출량', currentScore: 72, predictedScore: 68, trend: 'down' },
    { category: 'E', name: '에너지 효율', currentScore: 65, predictedScore: 70, trend: 'up' },
    { category: 'E', name: '재활용률', currentScore: 58, predictedScore: 62, trend: 'up' },
    { category: 'S', name: '직원 만족도', currentScore: 75, predictedScore: 77, trend: 'up' },
    { category: 'S', name: '다양성 포용', currentScore: 68, predictedScore: 70, trend: 'up' },
    { category: 'S', name: '안전 보건', currentScore: 82, predictedScore: 83, trend: 'stable' },
    { category: 'G', name: '지배 구조', currentScore: 78, predictedScore: 80, trend: 'up' },
    { category: 'G', name: '윤리 경영', currentScore: 85, predictedScore: 86, trend: 'stable' },
    { category: 'G', name: '투명성', currentScore: 70, predictedScore: 73, trend: 'up' }
  ]);

  const handlePredict = async () => {
    setIsPredicting(true);
    await new Promise(r => setTimeout(r, 2000));
    setEsgMetrics(prev => prev.map(m => ({
      ...m,
      predictedScore: Math.min(100, Math.max(0, m.currentScore + (Math.random() - 0.4) * 10))
    })));
    setIsPredicting(false);
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'E': return { name: 'Environmental', color: 'from-green-500 to-emerald-500', icon: '🌱' };
      case 'S': return { name: 'Social', color: 'from-blue-500 to-cyan-500', icon: '👥' };
      case 'G': return { name: 'Governance', color: 'from-purple-500 to-pink-500', icon: '⚖️' };
    }
  };

  const getCategoryScore = (category: string) => {
    const metrics = esgMetrics.filter(m => m.category === category);
    const avg = metrics.reduce((sum, m) => sum + m.predictedScore, 0) / metrics.length;
    return avg.toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <AlertIcon size={28} />
            ESG 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">환경·사회·지배구조 지표 예측</p>
        </div>
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isPredicting ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
          }`}
        >
          {isPredicting ? <RefreshIcon size={18} className="animate-spin" /> : <TrendUpIcon size={18} />}
          {isPredicting ? '예측 중...' : 'ESG 예측'}
        </button>
      </div>

      {/* ESG 종합 점수 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['E', 'S', 'G'].map(category => {
          const info = getCategoryInfo(category);
          const score = getCategoryScore(category);
          return (
            <div key={category} className={`p-6 rounded-xl bg-gradient-to-br ${info.color} text-white`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{info.icon}</span>
                <span className="text-4xl font-bold">{score}</span>
              </div>
              <div className="font-bold text-lg">{info.name}</div>
              <div className="text-sm opacity-90">예측 종합 점수</div>
            </div>
          );
        })}
      </div>

      {/* 상세 지표 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">상세 지표 예측</h3>
          <div className="space-y-3">
            {esgMetrics.map((metric, idx) => {
              const info = getCategoryInfo(metric.category);
              const change = metric.predictedScore - metric.currentScore;

              return (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`w-10 h-10 flex items-center justify-center bg-gradient-to-br ${info.color} rounded-lg text-white text-lg`}>
                    {metric.category}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{metric.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{metric.currentScore}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-bold text-blue-600">{metric.predictedScore.toFixed(0)}</span>
                        <span className={`text-sm font-medium ${
                          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${info.color} h-2 rounded-full transition-all`}
                        style={{ width: `${metric.predictedScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESGPrediction;
