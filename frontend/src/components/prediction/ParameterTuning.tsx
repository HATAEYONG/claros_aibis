// ParameterTuning.tsx - 파라미터 튜닝 컴포넌트
import { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  RefreshCw,
  Save,
  Play,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

interface ModelParameter {
  id: string;
  name: string;
  category: 'algorithm' | 'hyperparameter' | 'feature' | 'training';
  currentValue: number | string | boolean;
  dataType: 'number' | 'string' | 'boolean' | 'select';
  options?: string[];
  minValue?: number;
  maxValue?: number;
  defaultValue: number | string | boolean;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface TuningHistory {
  id: string;
  timestamp: string;
  parameters: Record<string, any>;
  accuracy: number;
  status: 'completed' | 'in_progress' | 'failed';
}

interface ValidationScore {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

const ParameterTuning: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('lstm');
  const [isTuning, setIsTuning] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationScore, setValidationScore] = useState<ValidationScore>({
    mae: 12.5,
    rmse: 18.3,
    mape: 8.7,
    r2: 0.92
  });

  const [tuningHistory, setTuningHistory] = useState<TuningHistory[]>([
    {
      id: '1',
      timestamp: '2026-03-30 14:30',
      parameters: { learning_rate: 0.001, epochs: 100, batch_size: 32 },
      accuracy: 92.5,
      status: 'completed'
    },
    {
      id: '2',
      timestamp: '2026-03-30 15:45',
      parameters: { learning_rate: 0.0005, epochs: 150, batch_size: 64 },
      accuracy: 93.2,
      status: 'completed'
    }
  ]);

  const [parameters, setParameters] = useState<ModelParameter[]>([
    // 알고리즘 파라미터
    {
      id: 'learning_rate',
      name: '학습률 (Learning Rate)',
      category: 'algorithm',
      currentValue: 0.001,
      dataType: 'number',
      minValue: 0.0001,
      maxValue: 0.01,
      defaultValue: 0.001,
      description: '모델 학습 시 가중치 업데이트 비율',
      impact: 'high'
    },
    {
      id: 'optimizer',
      name: '옵티마이저 (Optimizer)',
      category: 'algorithm',
      currentValue: 'adam',
      dataType: 'select',
      options: ['adam', 'sgd', 'rmsprop', 'adagrad'],
      defaultValue: 'adam',
      description: '경사 하강법 알고리즘',
      impact: 'high'
    },
    // 하이퍼파라미터
    {
      id: 'epochs',
      name: '에포크 (Epochs)',
      category: 'hyperparameter',
      currentValue: 100,
      dataType: 'number',
      minValue: 10,
      maxValue: 500,
      defaultValue: 100,
      description: '전체 데이터셋 학습 횟수',
      impact: 'high'
    },
    {
      id: 'batch_size',
      name: '배치 크기 (Batch Size)',
      category: 'hyperparameter',
      currentValue: 32,
      dataType: 'select',
      options: ['16', '32', '64', '128'],
      defaultValue: '32',
      description: '한 번 학습에 사용하는 데이터 샘플 수',
      impact: 'medium'
    },
    {
      id: 'hidden_layers',
      name: '은닉층 수 (Hidden Layers)',
      category: 'hyperparameter',
      currentValue: 3,
      dataType: 'number',
      minValue: 1,
      maxValue: 10,
      defaultValue: 3,
      description: '신경망의 은닉층 개수',
      impact: 'high'
    },
    {
      id: 'dropout',
      name: '드롭아웃 (Dropout)',
      category: 'hyperparameter',
      currentValue: 0.2,
      dataType: 'number',
      minValue: 0,
      maxValue: 0.5,
      defaultValue: 0.2,
      description: '과적합 방지를 위한 드롭아웃 비율',
      impact: 'medium'
    },
    // 피처 관련
    {
      id: 'feature_selection',
      name: '피처 선택 (Feature Selection)',
      category: 'feature',
      currentValue: 'auto',
      dataType: 'select',
      options: ['auto', 'manual', 'all'],
      defaultValue: 'auto',
      description: '모델 학습에 사용할 피처 선택 방식',
      impact: 'high'
    },
    {
      id: 'normalization',
      name: '정규화 (Normalization)',
      category: 'feature',
      currentValue: true,
      dataType: 'boolean',
      defaultValue: true,
      description: '데이터 정규화 적 여부',
      impact: 'medium'
    },
    // 학습 관련
    {
      id: 'early_stopping',
      name: '조기 종료 (Early Stopping)',
      category: 'training',
      currentValue: true,
      dataType: 'boolean',
      defaultValue: true,
      description: '성능 향상 없을 시 조기 종료',
      impact: 'medium'
    },
    {
      id: 'validation_split',
      name: '검증 분할 (Validation Split)',
      category: 'training',
      currentValue: 0.2,
      dataType: 'number',
      minValue: 0.1,
      maxValue: 0.4,
      defaultValue: 0.2,
      description: '검증 데이터셋 비율',
      impact: 'low'
    }
  ]);

  const models = [
    { id: 'lstm', name: 'LSTM 시계열', accuracy: 92.5 },
    { id: 'arima', name: 'ARIMA', accuracy: 88.3 },
    { id: 'prophet', name: 'Prophet', accuracy: 90.1 },
    { id: 'xgboost', name: 'XGBoost', accuracy: 91.7 },
    { id: 'randomforest', name: 'Random Forest', accuracy: 89.4 }
  ];

  const handleParameterChange = (paramId: string, value: any) => {
    setParameters(prev =>
      prev.map(param =>
        param.id === paramId ? { ...param, currentValue: value } : param
      )
    );
  };

  const handleReset = () => {
    setParameters(prev =>
      prev.map(param => ({ ...param, currentValue: param.defaultValue }))
    );
  };

  const handleTuning = async () => {
    setIsTuning(true);
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsTuning(false);
    setValidationScore({
      mae: 10.2,
      rmse: 15.8,
      mape: 7.5,
      r2: 0.94
    });
  };

  const handleSave = () => {
    const newHistory: TuningHistory = {
      id: String(tuningHistory.length + 1),
      timestamp: new Date().toLocaleString('ko-KR'),
      parameters: parameters.reduce((acc, param) => {
        acc[param.id] = param.currentValue;
        return acc;
      }, {} as Record<string, any>),
      accuracy: validationScore.r2 * 100,
      status: 'completed'
    };
    setTuningHistory([newHistory, ...tuningHistory]);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      algorithm: '알고리즘',
      hyperparameter: '하이퍼파라미터',
      feature: '피처',
      training: '학습'
    };
    return labels[category] || category;
  };

  const renderParameterInput = (param: ModelParameter) => {
    switch (param.dataType) {
      case 'number':
        return (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={param.minValue}
              max={param.maxValue}
              step={typeof param.currentValue === 'number' && param.currentValue < 1 ? 0.0001 : 1}
              value={param.currentValue as number}
              onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="number"
              min={param.minValue}
              max={param.maxValue}
              step={typeof param.currentValue === 'number' && param.currentValue < 1 ? 0.0001 : 1}
              value={param.currentValue as number}
              onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        );
      case 'select':
        return (
          <select
            value={param.currentValue as string}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {param.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={param.currentValue as boolean}
              onChange={(e) => handleParameterChange(param.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {param.currentValue ? '사용' : '사용 안함'}
            </span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">파라미터 튜닝</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI 모델의 파라미터를 최적화하여 예측 정확도를 향상시킵니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Undo className="w-4 h-4" />
            초기화
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            저장
          </button>
          <button
            onClick={handleTuning}
            disabled={isTuning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isTuning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Play className={`w-4 h-4 ${isTuning ? 'animate-pulse' : ''}`} />
            {isTuning ? '튜닝 중...' : '튜닝 시작'}
          </button>
        </div>
      </div>

      {/* 모델 선택 및 검증 점수 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 모델 선택 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">모델 선택</h3>
          <div className="space-y-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedModel === model.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-5 h-5 ${
                    selectedModel === model.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  {model.accuracy}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 검증 점수 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">검증 점수</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">MAE</div>
              <div className="text-2xl font-bold text-blue-600">{validationScore.mae}</div>
              <div className="text-xs text-gray-500">평균 절대 오차</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">RMSE</div>
              <div className="text-2xl font-bold text-green-600">{validationScore.rmse}</div>
              <div className="text-xs text-gray-500">제곱근 평균 제곱 오차</div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">MAPE</div>
              <div className="text-2xl font-bold text-yellow-600">{validationScore.mape}%</div>
              <div className="text-xs text-gray-500">평균 절대 백분율 오차</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">R²</div>
              <div className="text-2xl font-bold text-purple-600">{validationScore.r2}</div>
              <div className="text-xs text-gray-500">결정 계수</div>
            </div>
          </div>
        </div>
      </div>

      {/* 파라미터 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">파라미터 설정</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? '기본 모드' : '고급 모드'}
          </button>
        </div>

        <div className="space-y-6">
          {['algorithm', 'hyperparameter', 'feature', 'training'].map(category => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                {getCategoryLabel(category)}
              </h4>
              <div className="space-y-4">
                {parameters
                  .filter(param => param.category === category)
                  .map(param => (
                    <div key={param.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{param.name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getImpactColor(param.impact)}`}>
                              {param.impact === 'high' ? '높음' : param.impact === 'medium' ? '중간' : '낮음'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{param.description}</p>
                        </div>
                        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                      {renderParameterInput(param)}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 튜닝 기록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">튜닝 기록</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">시간</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">파라미터</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">정확도</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">상태</th>
              </tr>
            </thead>
            <tbody>
              {tuningHistory.map((history) => (
                <tr key={history.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{history.timestamp}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(history.parameters).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {history.accuracy > 90 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${
                        history.accuracy > 90 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {history.accuracy}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {history.status === 'completed' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        완료
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParameterTuning;
