/**
 * Integrated AI Dashboard Component
 * Phase 10: Integrated AI System (Production-Ready)
 *
 * Features:
 * - AI Orchestrator (Unified prediction interface)
 * - Model Router (Auto, Performance, Round-robin)
 * - Meta-Learning (MAML, Few-shot, Transfer learning)
 * - Production Deployment (Canary, Blue-Green, Rolling)
 * - Observability & AI Governance
 */

import React, { useState } from 'react';
import {
  SettingsIcon,
  PlayIcon,
  BarChartIcon,
  ZapIcon,
  LayersIcon,
  MonitorIcon,
  SecurityIcon,
  GitBranchIcon
} from '@/components/icons/Icons';
import { integratedAIService } from '@/services/integratedAIService';

const IntegratedAIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'meta' | 'deploy' | 'observe'>('orchestrator');
  const [loading, setLoading] = useState(false);

  const [orchestratorConfig, setOrchestratorConfig] = useState({
    model_router: 'auto' as 'auto' | 'performance' | 'round_robin',
    auto_optimization: true,
    fallback_enabled: true
  });

  const [metaConfig, setMetaConfig] = useState({
    learning_type: 'maml' as 'maml' | 'few_shot' | 'transfer',
    num_shots: 5,
    source_domain: '',
    target_domain: ''
  });

  const [deployConfig, setDeployConfig] = useState({
    strategy: 'canary' as 'canary' | 'blue_green' | 'rolling',
    rollout_percentage: 10,
    auto_rollback: true
  });

  const [predictResult, setPredictResult] = useState<any>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await integratedAIService.predictWithOrchestrator(orchestratorConfig);
      setPredictResult(result);
    } catch (error: any) {
      console.error('Orchestrator prediction error:', error);
      alert(`예측 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl">
            <LayersIcon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">통합 AI 시스템</h1>
            <p className="text-gray-600 dark:text-gray-400">프로덕션급 AI 운영 및 관리</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'orchestrator', label: 'AI 오케스트레이터', icon: LayersIcon },
              { id: 'meta', label: '메타러닝', icon: ZapIcon },
              { id: 'deploy', label: '프로덕션 배포', icon: GitBranchIcon },
              { id: 'observe', label: '관찰 가능성', icon: MonitorIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'orchestrator' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">AI 오케스트레이터</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">모델 라우터</label>
                    <select
                      value={orchestratorConfig.model_router}
                      onChange={(e) => setOrchestratorConfig({ ...orchestratorConfig, model_router: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="auto">Auto (자동 선택)</option>
                      <option value="performance">Performance (최적 성능)</option>
                      <option value="round_robin">Round Robin</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orchestratorConfig.auto_optimization}
                      onChange={(e) => setOrchestratorConfig({ ...orchestratorConfig, auto_optimization: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                    <span className="text-gray-900 dark:text-white">자동 최적화</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orchestratorConfig.fallback_enabled}
                      onChange={(e) => setOrchestratorConfig({ ...orchestratorConfig, fallback_enabled: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                    <span className="text-gray-900 dark:text-white">폴백 모델 사용</span>
                  </label>
                </div>
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                >
                  {loading ? '예측 중...' : '오케스트레이터 예측'}
                </button>

                {predictResult && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm">선택 모델: <span className="font-bold">{predictResult.selected_model}</span></p>
                    <p className="text-sm">MAPE: <span className="font-bold">{predictResult.mape?.toFixed(2)}%</span></p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'meta' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">메타러닝</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">학습 유형</label>
                    <select
                      value={metaConfig.learning_type}
                      onChange={(e) => setMetaConfig({ ...metaConfig, learning_type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="maml">MAML (Model-Agnostic Meta-Learning)</option>
                      <option value="few_shot">Few-shot Learning</option>
                      <option value="transfer">Transfer Learning</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">샷 수 (Few-shot)</label>
                    <input
                      type="number"
                      value={metaConfig.num_shots}
                      onChange={(e) => setMetaConfig({ ...metaConfig, num_shots: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">소스 도메인</label>
                    <input
                      type="text"
                      value={metaConfig.source_domain}
                      onChange={(e) => setMetaConfig({ ...metaConfig, source_domain: e.target.value })}
                      placeholder="domain_A"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">타겟 도메인</label>
                    <input
                      type="text"
                      value={metaConfig.target_domain}
                      onChange={(e) => setMetaConfig({ ...metaConfig, target_domain: e.target.value })}
                      placeholder="domain_B"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">MAML</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      5-10개의 예제로 빠르게 학습
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Transfer Learning</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      도메인 간 지식 이전
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Model Zoo</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      사전 학습된 모델 저장소
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">프로덕션 배포 전략</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">배포 전략</label>
                    <select
                      value={deployConfig.strategy}
                      onChange={(e) => setDeployConfig({ ...deployConfig, strategy: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="canary">Canary (점진적 롤아웃)</option>
                      <option value="blue_green">Blue-Green (무중단 배포)</option>
                      <option value="rolling">Rolling Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">롤아웃 비율 (%)</label>
                    <input
                      type="number"
                      value={deployConfig.rollout_percentage}
                      onChange={(e) => setDeployConfig({ ...deployConfig, rollout_percentage: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deployConfig.auto_rollback}
                      onChange={(e) => setDeployConfig({ ...deployConfig, auto_rollback: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded"
                    />
                    <span className="text-gray-900 dark:text-white">자동 롤백 (오류 발생 시)</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Canary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      일부 트래픽부터 점진적 증가
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Blue-Green</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      두 환경 간 즉시 전환
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Rolling</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      인스턴스별 순차적 업데이트
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'observe' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">관찰 가능성 & 거버넌스</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MonitorIcon size={18} />
                      시스템 모니터링
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 메트릭 수집 (Prometheus)</li>
                      <li>• 로그 집계 (ELK Stack)</li>
                      <li>• 분산 추적 (Jaeger)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <SecurityIcon size={18} />
                      AI 거버넌스
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 규정 준수 체크 (GDPR, AI Act)</li>
                      <li>• 모델 감사 및 문서화</li>
                      <li>• 편향 감지 및 완화</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">알림 관리</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Slack/PagerDuty 연동</li>
                      <li>• 사용자 지정 알림 규칙</li>
                      <li>• 이상 징후 자동 감지</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">대시보드</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 실시간 성능 대시보드</li>
                      <li>• 리소스 사용량 모니터링</li>
                      <li>• 비즈니스 KPI 추적</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedAIDashboard;
