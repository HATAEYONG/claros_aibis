/**
 * Digital Twin Component
 * Phase 11: Virtual System Simulation and What-If Analysis
 */

import React, { useState } from 'react';
import { CopyIcon, PlayIcon, SyncIcon, SearchIcon } from '@/components/icons/Icons';
import { nextGenAIService } from '@/services/nextGenAIService';

const DigitalTwin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'sync' | 'simulate' | 'status'>('create');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const config = {
    twin_id: 'production_line_1',
    system_type: 'production',
    horizon: 30
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.createDigitalTwin(config);
      setResult(response);
    } catch (error: any) {
      alert(`디지털 트윈 생성 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.syncDigitalTwin({ twin_id: config.twin_id });
      setResult(response);
    } catch (error: any) {
      alert(`동기화 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await nextGenAIService.simulateDigitalTwin({
        twin_id: config.twin_id,
        scenario_id: 'scenario_001',
        name: '생산량 증가 시나리오',
        description: '생산량을 20% 증가시킨 시뮬레이션',
        parameters: { scale_factor: 1.2 },
        horizon: config.horizon
      });
      setResult(response);
    } catch (error: any) {
      alert(`시뮬레이션 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl">
              <CopyIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Digital Twin
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                가상 시스템 시뮬레이션 및 What-If 분석
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'create', label: '트윈 생성', icon: CopyIcon },
              { id: 'sync', label: '동기화', icon: SyncIcon },
              { id: 'simulate', label: '시뮬레이션', icon: PlayIcon },
              { id: 'status', label: '상태', icon: SearchIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium ${
                  activeTab === tab.id
                    ? 'text-violet-600 border-b-2 border-violet-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">트윈 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    트윈 ID
                  </label>
                  <input
                    type="text"
                    value={config.twin_id}
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시스템 타입
                  </label>
                  <select
                    value={config.system_type}
                    onChange={(e) => {}}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="production">생산 라인</option>
                    <option value="quality">품질 시스템</option>
                    <option value="inventory">재고 관리</option>
                  </select>
                </div>
                <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">시뮬레이션 기간</p>
                  <p className="text-2xl font-bold text-violet-600">{config.horizon}일</p>
                </div>
              </div>

              <button
                onClick={activeTab === 'create' ? handleCreate : activeTab === 'sync' ? handleSync : activeTab === 'simulate' ? handleSimulate : () => {}}
                disabled={loading || activeTab === 'status'}
                className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : activeTab === 'create' ? '디지털 트윈 생성' : activeTab === 'sync' ? '실시간 동기화' : '시뮬레이션 실행'}
              </button>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-3">시나리오 라이브러리</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30">
                  <p className="font-medium">생산량 증가</p>
                  <p className="text-gray-500 text-xs">생산량 20% 증가 시뮬레이션</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30">
                  <p className="font-medium">설비 고장</p>
                  <p className="text-gray-500 text-xs">설비 고장 영향 분석</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30">
                  <p className="font-medium">품질 개선</p>
                  <p className="text-gray-500 text-xs">불량률 50% 감축 시뮬레이션</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">시뮬레이션 결과</h2>

              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">트윈 ID</p>
                      <p className="text-lg font-bold text-violet-600">{result.result?.twin_id}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                      <p className="text-lg font-bold text-purple-600">{result.result?.sync_status || 'success'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">예측 비교</h3>
                    <div className="h-48 flex items-end justify-between gap-1">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="flex-1 flex gap-1 items-end justify-center">
                          <div
                            className="w-3 bg-blue-500 rounded-t"
                            style={{ height: `${30 + Math.random() * 50}%` }}
                          />
                          <div
                            className="w-3 bg-violet-500 rounded-t opacity-70"
                            style={{ height: `${30 + Math.random() * 50}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-4 justify-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">실제 시스템</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-violet-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">디지털 트윈</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">일치율</p>
                      <p className="text-2xl font-bold text-green-600">94.2%</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">드리프트</p>
                      <p className="text-2xl font-bold text-blue-600">5.8%</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">마지막 동기화</p>
                      <p className="text-lg font-bold text-purple-600">2분 전</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-4">What-If 분석</h3>
                    <div className="space-y-3">
                      {[
                        { scenario: '생산량 +20%', impact: '+15%', kpi: '생산성' },
                        { scenario: '불량률 -50%', impact: '+8%', kpi: '품질' },
                        { scenario: '설비 가동률 +10%', impact: '+12%', kpi: '효율' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div>
                            <p className="font-medium">{item.scenario}</p>
                            <p className="text-sm text-gray-500">{item.kpi} 영향</p>
                          </div>
                          <span className="text-lg font-bold text-green-600">{item.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CopyIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>작업을 실행해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
