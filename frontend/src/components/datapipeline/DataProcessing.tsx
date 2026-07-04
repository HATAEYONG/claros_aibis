/**
 * 데이터 처리 컴포넌트
 * 데이터 전처리, 변환, 정제 및 시각화 UI
 */

import React, { useState } from 'react';
import {
  PlusIcon, TrashIcon, PlayIcon, SaveIcon,
  DownloadIcon, UploadIcon, SettingsIcon, BarChartIcon,
  FilterIcon, TrendUpIcon, AlertIcon, CheckIcon
} from '@/components/icons/Icons';

// 데이터 처리 단계 타입
interface ProcessingStep {
  id: string;
  type: 'load' | 'clean' | 'transform' | 'validate' | 'export';
  name: string;
  description: string;
  config: any;
  enabled: boolean;
}

// 데이터 소스 타입
interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'excel' | 'database' | 'api' | 'file';
  size: number;
  rows: number;
  columns: number;
  lastModified: string;
}

// 처리 통계 타입
interface ProcessingStats {
  totalRows: number;
  processedRows: number;
  errorRows: number;
  duplicateRows: number;
  missingValues: number;
  processingTime: number;
}

const DataProcessing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sources' | 'history'>('pipeline');
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: '1',
      type: 'load',
      name: '데이터 로드',
      description: 'CSV, Excel, DB에서 데이터 가져오기',
      config: { source: '', format: 'csv' },
      enabled: true
    },
    {
      id: '2',
      type: 'clean',
      name: '데이터 정제',
      description: '중복 제거, 누락값 처리, 이상치 탐지',
      config: { removeDuplicates: true, handleMissing: 'mean', outlierMethod: 'iqr' },
      enabled: true
    },
    {
      id: '3',
      type: 'transform',
      name: '데이터 변환',
      description: '타입 변환, 정규화, 인코딩',
      config: { normalization: 'minmax', encoding: 'label' },
      enabled: true
    },
    {
      id: '4',
      type: 'validate',
      name: '데이터 검증',
      description: '데이터 품질 검사 및 규칙 확인',
      config: { rules: [] },
      enabled: true
    },
    {
      id: '5',
      type: 'export',
      name: '데이터 내보내기',
      description: '처리된 데이터를 다양한 형식으로 저장',
      config: { format: 'csv', destination: 'local' },
      enabled: true
    }
  ]);

  const [dataSources, setDataSources] = useState<DataSource[]>([
    { id: '1', name: 'sales_data.csv', type: 'csv', size: 2560000, rows: 50000, columns: 15, lastModified: '2024-03-15' },
    { id: '2', name: 'inventory.xlsx', type: 'excel', size: 1024000, rows: 12000, columns: 8, lastModified: '2024-03-14' },
    { id: '3', name: 'production_db', type: 'database', size: 51200000, rows: 250000, columns: 20, lastModified: '2024-03-13' }
  ]);

  const [stats, setStats] = useState<ProcessingStats>({
    totalRows: 0,
    processedRows: 0,
    errorRows: 0,
    duplicateRows: 0,
    missingValues: 0,
    processingTime: 0
  });

  const [processing, setProcessing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const stepTypes = [
    { type: 'load', label: '데이터 로드', icon: '📥', color: 'blue' },
    { type: 'clean', label: '데이터 정제', icon: '🧹', color: 'green' },
    { type: 'transform', label: '데이터 변환', icon: '🔄', color: 'purple' },
    { type: 'validate', label: '데이터 검증', icon: '✓', color: 'yellow' },
    { type: 'export', label: '데이터 내보내기', icon: '📤', color: 'pink' }
  ];

  const processingHistory = [
    { id: '1', name: '매출 데이터 전처리', date: '2024-03-15 14:30', status: 'completed', duration: '2.3s', rows: 50000 },
    { id: '2', name: '재고 데이터 정제', date: '2024-03-15 13:45', status: 'completed', duration: '1.8s', rows: 12000 },
    { id: '3', name: '생산 데이터 변환', date: '2024-03-15 12:20', status: 'failed', duration: '-', rows: 0 },
    { id: '4', name: '품질 데이터 검증', date: '2024-03-15 11:15', status: 'completed', duration: '3.1s', rows: 35000 }
  ];

  const executePipeline = async () => {
    setProcessing(true);
    // 시뮬레이션
    setTimeout(() => {
      setStats({
        totalRows: 312000,
        processedRows: 308000,
        errorRows: 4000,
        duplicateRows: 2500,
        missingValues: 8500,
        processingTime: 3.2
      });
      setProcessing(false);
    }, 2000);
  };

  const addStep = (type: string) => {
    const newStep: ProcessingStep = {
      id: `step-${Date.now()}`,
      type: type as any,
      name: `${stepTypes.find(s => s.type === type)?.label || type} 단계`,
      description: '새로운 처리 단계',
      config: {},
      enabled: true
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const toggleStep = (id: string) => {
    setSteps(steps.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <BarChartIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                데이터 처리
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                데이터 전처리, 변환, 정제 및 내보내기
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex gap-2 p-2">
            {[
              { id: 'pipeline', label: '파이프라인', icon: '⚙️' },
              { id: 'sources', label: '데이터 소스', icon: '📊' },
              { id: 'history', label: '처리 기록', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline Builder */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Pipeline */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">현재 파이프라인</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={executePipeline}
                      disabled={processing || steps.every(s => !s.enabled)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <PlayIcon size={16} />
                          파이프라인 실행
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {steps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FilterIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p>처리 단계를 추가해주세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const stepType = stepTypes.find(s => s.type === step.type);
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${
                            !step.enabled ? 'opacity-50' : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                            {stepType?.icon || '⚙️'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{step.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                stepType?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                stepType?.color === 'green' ? 'bg-green-100 text-green-700' :
                                stepType?.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                stepType?.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-pink-100 text-pink-700'
                              }`}>
                                {stepType?.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStep(step.id)}
                              className={`p-2 rounded-lg ${step.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                              title={step.enabled ? '비활성화' : '활성화'}
                            >
                              <CheckIcon size={16} />
                            </button>
                            <button
                              onClick={() => removeStep(step.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="제거"
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Processing Statistics */}
              {stats.totalRows > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">처리 통계</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">총 행</p>
                      <p className="text-xl font-bold text-blue-600">{formatNumber(stats.totalRows)}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">처리 완료</p>
                      <p className="text-xl font-bold text-green-600">{formatNumber(stats.processedRows)}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">오류</p>
                      <p className="text-xl font-bold text-red-600">{formatNumber(stats.errorRows)}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">중복</p>
                      <p className="text-xl font-bold text-yellow-600">{formatNumber(stats.duplicateRows)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">누락값</p>
                      <p className="text-xl font-bold text-purple-600">{formatNumber(stats.missingValues)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">처리 시간</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.processingTime}s</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Step Panel */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">단계 추가</h2>
                <div className="space-y-2">
                  {stepTypes.map(stepType => (
                    <button
                      key={stepType.type}
                      onClick={() => addStep(stepType.type)}
                      className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{stepType.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{stepType.label}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
                <div className="space-y-2">
                  <button className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left flex items-center gap-3">
                    <UploadIcon size={20} />
                    <span className="text-gray-900 dark:text-white">데이터 가져오기</span>
                  </button>
                  <button className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left flex items-center gap-3">
                    <DownloadIcon size={20} />
                    <span className="text-gray-900 dark:text-white">결과 내보내기</span>
                  </button>
                  <button className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left flex items-center gap-3">
                    <SaveIcon size={20} />
                    <span className="text-gray-900 dark:text-white">파이프라인 저장</span>
                  </button>
                  <button className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left flex items-center gap-3">
                    <SettingsIcon size={20} />
                    <span className="text-gray-900 dark:text-white">설정 관리</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">데이터 소스</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <PlusIcon size={16} />
                새 소스 추가
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">이름</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">타입</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">크기</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">행</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">열</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">수정일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dataSources.map(source => (
                    <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{source.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          source.type === 'csv' ? 'bg-green-100 text-green-700' :
                          source.type === 'excel' ? 'bg-blue-100 text-blue-700' :
                          source.type === 'database' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {source.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatFileSize(source.size)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatNumber(source.rows)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{source.columns}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{source.lastModified}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-purple-600 hover:text-purple-800 text-sm">관리</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">처리 기록</h2>
            <div className="space-y-3">
              {processingHistory.map(record => (
                <div key={record.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{record.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.status === 'completed' ? 'bg-green-100 text-green-700' :
                      record.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {record.status === 'completed' ? '완료' : record.status === 'failed' ? '실패' : '진행중'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="text-xs">처리일시</p>
                      <p>{record.date}</p>
                    </div>
                    <div>
                      <p className="text-xs">소요 시간</p>
                      <p>{record.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs">처리 행</p>
                      <p>{formatNumber(record.rows)}행</p>
                    </div>
                    <div className="flex items-end justify-end">
                      <button className="text-purple-600 hover:text-purple-800 text-sm">상세보기</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataProcessing;
