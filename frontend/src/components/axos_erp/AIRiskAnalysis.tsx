// AIRiskAnalysis.tsx - AXOS ERP V10.4 AI 리스크 분석 컴포넌트
import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  FileText,
  Target,
  RiskLevel,
  Warnings,
  Info
} from 'lucide-react';

interface RiskScore {
  id: number;
  object_type: string;
  object_id: string;
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: {
    top_reasons: string[];
  };
  features: Record<string, any>;
  created_at: string;
}

interface RiskRequest {
  object_type: string;
  object_id: string;
  features: Record<string, any>;
}

const AIRiskAnalysis: React.FC = () => {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [filteredScores, setFilteredScores] = useState<RiskScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedScore, setSelectedScore] = useState<RiskScore | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // 리스크 분석 요청 폼
  const [analysisForm, setAnalysisForm] = useState<RiskRequest>({
    object_type: '',
    object_id: '',
    features: {}
  });

  const objectTypes = ['production_order', 'quality_inspection', 'purchase_order', 'sales_order', 'work_order'];
  const riskLevels = ['HIGH', 'MEDIUM', 'LOW'];

  useEffect(() => {
    loadRiskScores();
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterScores();
  }, [riskScores, searchQuery, selectedLevel, selectedType]);

  const loadRiskScores = async () => {
    setIsLoading(true);
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8200/scores');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 데이터
      const demoScores: RiskScore[] = [
        {
          id: 1,
          object_type: 'production_order',
          object_id: 'PO-2024-001',
          score: 85,
          level: 'HIGH',
          explanation: {
            top_reasons: ['equipment downtime', 'quality hold']
          },
          features: {
            downtime: true,
            duration_min: 120,
            quality_hold: true
          },
          created_at: '2024-04-21T10:00:00'
        },
        {
          id: 2,
          object_type: 'quality_inspection',
          object_id: 'QI-2024-001',
          score: 45,
          level: 'MEDIUM',
          explanation: {
            top_reasons: ['long duration']
          },
          features: {
            duration_min: 75,
            downtime: false,
            quality_hold: false
          },
          created_at: '2024-04-21T11:00:00'
        },
        {
          id: 3,
          object_type: 'purchase_order',
          object_id: 'PUR-2024-001',
          score: 15,
          level: 'LOW',
          explanation: {
            top_reasons: ['normal flow']
          },
          features: {
            duration_min: 30,
            downtime: false,
            quality_hold: false
          },
          created_at: '2024-04-21T12:00:00'
        },
        {
          id: 4,
          object_type: 'work_order',
          object_id: 'WO-2024-001',
          score: 92,
          level: 'HIGH',
          explanation: {
            top_reasons: ['equipment downtime', 'quality hold', 'long duration']
          },
          features: {
            downtime: true,
            duration_min: 180,
            quality_hold: true
          },
          created_at: '2024-04-21T13:00:00'
        }
      ];
      setRiskScores(demoScores);
    } catch (error) {
      console.error('리스크 점수 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterScores = () => {
    let filtered = [...riskScores];

    if (searchQuery) {
      filtered = filtered.filter(score =>
        score.object_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        score.object_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(score => score.level === selectedLevel);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(score => score.object_type === selectedType);
    }

    setFilteredScores(filtered);
  };

  const handleAnalyze = async () => {
    try {
      // API 호출 시뮬레이션
      // 실제 구현에서는: const response = await fetch('http://localhost:8200/score/delay-risk', { method: 'POST', body: JSON.stringify(analysisForm) });
      await new Promise(resolve => setTimeout(resolve, 500));

      // 데모 응답
      const demoScore: RiskScore = {
        id: riskScores.length + 1,
        ...analysisForm,
        score: Math.floor(Math.random() * 100),
        level: 'MEDIUM',
        explanation: {
          top_reasons: ['normal flow']
        },
        created_at: new Date().toISOString()
      };

      // 점수에 따라 레벨 설정
      if (demoScore.score >= 70) {
        demoScore.level = 'HIGH';
        demoScore.explanation.top_reasons = ['equipment downtime', 'quality hold'];
      } else if (demoScore.score >= 40) {
        demoScore.level = 'MEDIUM';
        demoScore.explanation.top_reasons = ['long duration'];
      } else {
        demoScore.level = 'LOW';
        demoScore.explanation.top_reasons = ['normal flow'];
      }

      setRiskScores([demoScore, ...riskScores]);
      setShowAnalysisModal(false);
      setAnalysisForm({
        object_type: '',
        object_id: '',
        features: {}
      });
    } catch (error) {
      console.error('리스크 분석 실패:', error);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800 border-red-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[level as keyof typeof colors] || colors.LOW;
  };

  const getLevelIcon = (level: string) => {
    const icons = {
      HIGH: <AlertTriangle className="w-5 h-5 text-red-600" />,
      MEDIUM: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      LOW: <CheckCircle className="w-5 h-5 text-green-600" />
    };
    return icons[level as keyof typeof icons] || icons.LOW;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 리스크 분석</h1>
            <p className="text-sm text-gray-500">지연 리스크 점수화 및 분석</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            마지막 갱신: {refreshTime.toLocaleTimeString('ko-KR')}
          </span>
          <button
            onClick={loadRiskScores}
            disabled={isLoading}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Activity className="w-5 h-5" />
            리스크 분석
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 분석</p>
              <p className="text-2xl font-bold text-gray-900">{riskScores.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">고위험</p>
              <p className="text-2xl font-bold text-red-900">
                {riskScores.filter(s => s.level === 'HIGH').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">중위험</p>
              <p className="text-2xl font-bold text-yellow-900">
                {riskScores.filter(s => s.level === 'MEDIUM').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">저위험</p>
              <p className="text-2xl font-bold text-green-900">
                {riskScores.filter(s => s.level === 'LOW').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="객체 ID, 유형 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">전체 위험도</option>
          {riskLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">전체 유형</option>
          {objectTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* 리스크 점수 목록 */}
      <div className="space-y-3">
        {filteredScores.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>표시할 리스크 분석 결과가 없습니다.</p>
          </div>
        ) : (
          filteredScores.map((score) => (
            <div
              key={score.id}
              className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${getLevelColor(score.level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white rounded-lg">
                    {getLevelIcon(score.level)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{score.object_id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded bg-white/50`}>
                        {score.object_type}
                      </span>
                      <span className={`px-3 py-1 text-sm font-bold rounded ${getLevelColor(score.level)}`}>
                        {score.score}점
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">위험 요인:</span>
                      {score.explanation.top_reasons.map((reason, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-white/60 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(score.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedScore(score)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 리스크 분석 모달 */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">새 리스크 분석</h2>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">객체 유형</label>
                <select
                  value={analysisForm.object_type}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, object_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">유형 선택</option>
                  {objectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">객체 ID</label>
                <input
                  type="text"
                  value={analysisForm.object_id}
                  onChange={(e) => setAnalysisForm({ ...analysisForm, object_id: e.target.value })}
                  placeholder="예: PO-2024-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">특성 (Features)</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={analysisForm.features.downtime || false}
                      onChange={(e) => setAnalysisForm({
                        ...analysisForm,
                        features: { ...analysisForm.features, downtime: e.target.checked }
                      })}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm">설비 다운타임</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={analysisForm.features.quality_hold || false}
                      onChange={(e) => setAnalysisForm({
                        ...analysisForm,
                        features: { ...analysisForm.features, quality_hold: e.target.checked }
                      })}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm">품질 보류</span>
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">작업 시간 (분)</label>
                    <input
                      type="number"
                      value={analysisForm.features.duration_min || ''}
                      onChange={(e) => setAnalysisForm({
                        ...analysisForm,
                        features: { ...analysisForm.features, duration_min: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                분석
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">리스크 분석 상세</h2>
                <button
                  onClick={() => setSelectedScore(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">객체 ID</label>
                  <p className="text-gray-900 font-semibold">{selectedScore.object_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">객체 유형</label>
                  <p className="text-gray-900">{selectedScore.object_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">리스크 점수</label>
                  <p className={`text-3xl font-bold ${getScoreColor(selectedScore.score)}`}>
                    {selectedScore.score}점
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">위험도</label>
                  <span className={`px-3 py-1 text-lg font-bold rounded ${getLevelColor(selectedScore.level)}`}>
                    {selectedScore.level}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">위험 요인</label>
                <div className="flex flex-wrap gap-2">
                  {selectedScore.explanation.top_reasons.map((reason, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">분석 특성</label>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedScore.features, null, 2)}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">분석 시간</label>
                <p className="text-gray-900">{new Date(selectedScore.created_at).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRiskAnalysis;
