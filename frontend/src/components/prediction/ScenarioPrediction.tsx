/**
 * 시나리오 예측 컴포넌트
 * 다양한 시나리오에 따른 예측 결과 시뮬레이션
 */

import React, { useState } from 'react';
import {
  SearchIcon, TrendUpIcon, RefreshIcon, BarChartIcon,
  PlayIcon, CheckIcon
} from '@/components/icons/Icons';

interface Scenario {
  id: string;
  name: string;
  description: string;
  predictedGrowth: number;
  confidence: number;
}

const ScenarioPrediction: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('optimistic');
  const [isSimulating, setIsSimulating] = useState(false);

  const scenarios = [
    { id: 'optimistic', name: '낙관적 시나리오', description: '시장 호환, 매출 증가', icon: '📈' },
    { id: 'realistic', name: '현실적 시나리오', description: '현재 추세 유지', icon: '📊' },
    { id: 'pessimistic', name: '비관적 시나리오', description: '시장 위축, 매출 감소', icon: '📉' }
  ];

  const [predictions, setPredictions] = useState<Record<string, Scenario>>({
    optimistic: { id: 'optimistic', name: '낙관적', description: '+15% 성장 예상', predictedGrowth: 15.2, confidence: 75 },
    realistic: { id: 'realistic', name: '현실적', description: '+5% 성장 예상', predictedGrowth: 5.3, confidence: 85 },
    pessimistic: { id: 'pessimistic', name: '비관적', description: '-8% 감소 예상', predictedGrowth: -8.1, confidence: 70 }
  });

  const handleSimulate = async () => {
    setIsSimulating(true);
    await new Promise(r => setTimeout(r, 2000));
    setPredictions(prev => ({
      optimistic: { ...prev.optimistic, predictedGrowth: 12 + Math.random() * 8 },
      realistic: { ...prev.realistic, predictedGrowth: 3 + Math.random() * 5 },
      pessimistic: { ...prev.pessimistic, predictedGrowth: -12 + Math.random() * 8 }
    }));
    setIsSimulating(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <SearchIcon size={28} />
            시나리오 예측
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">다양한 시나리오 시뮬레이션</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isSimulating ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
          }`}
        >
          {isSimulating ? <RefreshIcon size={18} className="animate-spin" /> : <PlayIcon size={18} />}
          {isSimulating ? '시뮬레이션 중...' : '시뮬레이션 실행'}
        </button>
      </div>

      {/* 시나리오 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => setSelectedScenario(scenario.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedScenario === scenario.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-3xl mb-2">{scenario.icon}</div>
            <div className="font-bold text-gray-800 dark:text-gray-200">{scenario.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</div>
          </button>
        ))}
      </div>

      {/* 예측 결과 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">시나리오별 예측 결과</h3>
          <div className="space-y-4">
            {Object.values(predictions).map(pred => (
              <div key={pred.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{pred.name}</span>
                  <span className={`text-xl font-bold ${
                    pred.predictedGrowth > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {pred.predictedGrowth > 0 ? '+' : ''}{pred.predictedGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{pred.description}</span>
                  <span>신뢰도: {pred.confidence}%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pred.predictedGrowth > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.abs(pred.predictedGrowth) * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPrediction;
