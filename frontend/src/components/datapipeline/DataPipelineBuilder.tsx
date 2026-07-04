/**
 * 데이터 파이프라인 빌더 컴포넌트
 * 데이터 처리 파이프라인을 시각적으로 구성하고 실행하는 UI
 */

import React, { useState } from 'react';
import { PlayIcon, PlusIcon, TrashIcon, SettingsIcon, BarChartIcon } from '@/components/icons/Icons';
import { dataPipelineService, PipelineBuilder } from '@/services/dataPipelineService';

const DataPipelineBuilder: React.FC = () => {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const stepTypes = [
    { id: 'validate', label: '데이터 검증', icon: '✓', color: 'blue' },
    { id: 'clean', label: '이상치 제거', icon: '🧹', color: 'green' },
    { id: 'impute', label: '누락값 처리', icon: '🔧', color: 'yellow' },
    { id: 'normalize', label: '정규화', icon: '📊', color: 'purple' },
    { id: 'encode', label: '인코딩', icon: '🔢', color: 'pink' },
    { id: 'extract', label: '특징 추출', icon: '⚡', color: 'orange' },
    { id: 'group', label: '그룹화', icon: '📦', color: 'cyan' },
    { id: 'rolling', label: '롤링 집계', icon: '🔄', color: 'indigo' },
    { id: 'difference', label: '차분', icon: '📉', color: 'rose' },
    { id: 'resample', label: '리샘플링', icon: '📅', color: 'teal' }
  ];

  const templates = [
    { id: 'ml-prep', name: 'ML 전처리', description: '머신러닝을 위한 데이터 전처리' },
    { id: 'ts-prep', name: '시계열 처리', description: '시계열 데이터 분석 준비' },
    { id: 'cleaning', name: '데이터 정제', description: '이상치 제거 및 누락값 처리' }
  ];

  const addStep = (type: string) => {
    const newStep = {
      id: `step-${Date.now()}`,
      type,
      name: `${stepTypes.find(s => s.id === type)?.label || type} ${pipeline.length + 1}`,
      params: getDefaultParams(type)
    };
    setPipeline([...pipeline, newStep]);
  };

  const getDefaultParams = (type: string) => {
    switch (type) {
      case 'validate':
        return { schema: [] };
      case 'clean':
        return { field: 'value', method: 'iqr', threshold: 1.5 };
      case 'impute':
        return { method: 'median' };
      case 'normalize':
        return { field: 'value', method: 'minmax' };
      case 'encode':
        return { field: 'category', method: 'onehot' };
      case 'extract':
        return { field: 'date', featureType: 'date' };
      case 'group':
        return { groupByField: 'category', aggregations: [] };
      case 'rolling':
        return { valueField: 'value', window: 7, method: 'avg' };
      case 'difference':
        return { field: 'value', periods: 1 };
      case 'resample':
        return { freq: 'D', method: 'mean' };
      default:
        return {};
    }
  };

  const removeStep = (index: number) => {
    setPipeline(pipeline.filter((_, i) => i !== index));
  };

  const loadTemplate = async (templateId: string) => {
    const template = dataPipelineService.getTemplate(
      templateId as 'ml-preprocessing' | 'timeseries-prep' | 'cleaning' | 'full'
    );
    setPipeline(template.steps.map((step, idx) => ({
      id: `step-${idx}`,
      ...step
    })));
  };

  const executePipeline = async () => {
    setLoading(true);
    try {
      // 샘플 데이터로 실행
      const sampleData = generateSampleData(100);
      const config = { steps: pipeline, options: { monitorPerformance: true } };
      const pipelineResult = await dataPipelineService.executePipeline(sampleData, config);
      setResult(pipelineResult);
    } catch (error: any) {
      alert(`파이프라인 실행 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (count: number) => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (count - i));
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() * 100 + 50 + Math.sin(i / 10) * 20,
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
      });
    }
    return data;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
              <SettingsIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                데이터 파이프라인 빌더
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                데이터 처리 파이프라인을 시각적으로 구성하고 실행
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 파이프라인 에디터 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 템플릿 선택 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">빠른 시작 (Templates)</h2>
              <div className="grid grid-cols-3 gap-4">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 파이프라인 단계 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">파이프라인 단계</h2>
                <span className="text-sm text-gray-500">{pipeline.length} 단계</span>
              </div>

              {pipeline.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <SettingsIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>파이프라인 단계를 추가해주세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipeline.map((step, index) => {
                    const stepType = stepTypes.find(s => s.id === step.type);
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedStep === index
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStep(index)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-${stepType?.color || 'gray'}-100 dark:bg-${stepType?.color || 'gray'}-900/30`}>
                          {stepType?.icon || '⚙️'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{step.name}</div>
                          <div className="text-sm text-gray-500">{stepType?.label || step.type}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(index);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 실행 버튼 */}
            <button
              onClick={executePipeline}
              disabled={pipeline.length === 0 || loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  실행 중...
                </>
              ) : (
                <>
                  <PlayIcon size={20} />
                  파이프라인 실행
                </>
              )}
            </button>
          </div>

          {/* 오른쪽: 단계 추가 및 설정 */}
          <div className="space-y-6">
            {/* 단계 추가 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">단계 추가</h2>
              <div className="grid grid-cols-2 gap-3">
                {stepTypes.map(stepType => (
                  <button
                    key={stepType.id}
                    onClick={() => addStep(stepType.id)}
                    className="p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-${stepType.color}-500 hover:bg-${stepType.color}-50 dark:hover:bg-${stepType.color}-900/20 transition-colors"
                  >
                    <div className="text-xl mb-1">{stepType.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{stepType.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 파이프라인 통계 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChartIcon size={20} className="text-blue-600" />
                파이프라인 정보
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span>총 단계</span>
                  <span className="font-bold text-blue-600">{pipeline.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>데이터 검증</span>
                  <span className="font-bold text-green-600">
                    {pipeline.some(s => s.type === 'validate') ? '✓' : '○'}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>데이터 정제</span>
                  <span className="font-bold text-purple-600">
                    {pipeline.some(s => s.type === 'clean' || s.type === 'impute') ? '✓' : '○'}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span>변환/인코딩</span>
                  <span className="font-bold text-orange-600">
                    {pipeline.some(s => s.type === 'normalize' || s.type === 'encode') ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 영역 */}
        {result && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">실행 결과</h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                <p className={`text-lg font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '성공' : '실패'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">처리 시간</p>
                <p className="text-lg font-bold text-purple-600">{result.metrics.processingTime}ms</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">완료 단계</p>
                <p className="text-lg font-bold text-green-600">{result.metrics.stepsCompleted}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">데이터 rows</p>
                <p className="text-lg font-bold text-orange-600">{result.metrics.outputRows}</p>
              </div>
            </div>

            {result.stepResults && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium mb-3">단계별 실행 시간</h3>
                <div className="space-y-2">
                  {result.stepResults.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="font-medium">{step.step}</span>
                      </div>
                      <div className="text-sm text-gray-500">{step.duration}ms</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {step.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPipelineBuilder;
