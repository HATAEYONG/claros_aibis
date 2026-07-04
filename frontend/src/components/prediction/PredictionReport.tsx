// PredictionReport.tsx - 예측 리포트 컴포넌트
import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Trash2,
  Edit,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Printer,
  FileSpreadsheet,
  Image
} from 'lucide-react';

interface PredictionReport {
  id: string;
  title: string;
  category: '품질' | '생산' | '재고' | '재무' | '종합';
  type: '일일' | '주간' | '월간' | '분기' | '특별';
  period: string;
  createdAt: string;
  createdBy: string;
  status: 'completed' | 'generating' | 'scheduled';
  summary: {
    totalPredictions: number;
    avgAccuracy: number;
    highRiskItems: number;
    recommendations: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  sections: string[];
}

const PredictionReport: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PredictionReport | null>(null);

  const [reports, setReports] = useState<PredictionReport[]>([
    {
      id: '1',
      title: '3월 월간 예측 리포트',
      category: '종합',
      type: '월간',
      period: '2026-03-01 ~ 2026-03-31',
      createdAt: '2026-03-30 09:00',
      createdBy: '시스템',
      status: 'completed',
      summary: {
        totalPredictions: 1520,
        avgAccuracy: 91.5,
        highRiskItems: 23,
        recommendations: 15
      }
    },
    {
      id: '2',
      title: '품질 예측 주간 리포트',
      category: '품질',
      type: '주간',
      period: '2026-03-24 ~ 2026-03-30',
      createdAt: '2026-03-30 08:00',
      createdBy: 'AI 분석가',
      status: 'completed',
      summary: {
        totalPredictions: 840,
        avgAccuracy: 94.2,
        highRiskItems: 5,
        recommendations: 8
      }
    },
    {
      id: '3',
      title: '생산 예측 일일 리포트',
      category: '생산',
      type: '일일',
      period: '2026-03-30',
      createdAt: '2026-03-30 07:00',
      createdBy: '시스템',
      status: 'completed',
      summary: {
        totalPredictions: 125,
        avgAccuracy: 91.8,
        highRiskItems: 3,
        recommendations: 4
      }
    },
    {
      id: '4',
      title: '재무 예측 분기 리포트',
      category: '재무',
      type: '분기',
      period: '2026-01-01 ~ 2026-03-31',
      createdAt: '2026-03-29 18:00',
      createdBy: '재무팀',
      status: 'completed',
      summary: {
        totalPredictions: 240,
        avgAccuracy: 89.7,
        highRiskItems: 12,
        recommendations: 10
      }
    },
    {
      id: '5',
      title: '재고 예측 주간 리포트',
      category: '재고',
      type: '주간',
      period: '2026-03-24 ~ 2026-03-30',
      createdAt: '2026-03-29 17:00',
      createdBy: '시스템',
      status: 'completed',
      summary: {
        totalPredictions: 450,
        avgAccuracy: 88.3,
        highRiskItems: 18,
        recommendations: 12
      }
    },
    {
      id: '6',
      title: '4월 월간 예측 리포트',
      category: '종합',
      type: '월간',
      period: '2026-04-01 ~ 2026-04-30',
      createdAt: '2026-03-30 10:00',
      createdBy: '시스템',
      status: 'generating',
      summary: {
        totalPredictions: 0,
        avgAccuracy: 0,
        highRiskItems: 0,
        recommendations: 0
      }
    }
  ]);

  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: '종합 예측 리포트',
      category: '종합',
      description: '전체 도메인의 예측 결과를 종합한 리포트',
      sections: ['요약', '도메인별 예측', '정확도 분석', '위험 항목', '개선 제안']
    },
    {
      id: '2',
      name: '품질 예측 리포트',
      category: '품질',
      description: '품질 관련 예측 결과 및 불량률 분석',
      sections: ['요약', '불량률 예측', '수율 분석', '원인 분석', '개선 방안']
    },
    {
      id: '3',
      name: '생산 예측 리포트',
      category: '생산',
      description: '생산량 및 설비 가동률 예측',
      sections: ['요약', '생산량 예측', '설비 가동률', '공정별 분석', '자원 계획']
    },
    {
      id: '4',
      name: '재고 예측 리포트',
      category: '재고',
      description: '재고 수준 및 회전율 예측',
      sections: ['요약', '재고 수준', '회전율', '부족 위험', '발주 제안']
    },
    {
      id: '5',
      name: '재무 예측 리포트',
      category: '재무',
      description: '매출, 이익 등 재무 지표 예측',
      sections: ['요약', '매출 예측', '이익 분석', '현금 흐름', '투자 제안']
    }
  ]);

  const categories = ['all', '품질', '생산', '재고', '재무', '종합'];
  const types = ['all', '일일', '주간', '월간', '분기', '특별'];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'image') => {
    const formatNames = {
      pdf: 'PDF',
      excel: 'Excel',
      image: '이미지'
    };
    alert(`${formatNames[format]} 형식으로 내보내기`);
  };

  const handlePreview = (report: PredictionReport) => {
    setSelectedReport(report);
    setShowPreview(true);
  };

  const filteredReports = reports.filter(report => {
    const categoryMatch = selectedCategory === 'all' || report.category === selectedCategory;
    const typeMatch = selectedType === 'all' || report.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'generating':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: '완료',
      generating: '생성 중',
      scheduled: '예약'
    };
    return labels[status] || status;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '품질': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      '생산': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      '재고': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      '재무': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      '종합': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">예측 리포트</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            예측 결과를 분석하고 리포트를 생성, 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isGenerating ? '생성 중...' : '리포트 생성'}
          </button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 리포트</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reports.length}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">완료된 리포트</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {reports.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">생성 중</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {reports.filter(r => r.status === 'generating').length}
              </p>
            </div>
            <RefreshCw className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 정확도</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {(reports.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.summary.avgAccuracy, 0) /
                  Math.max(reports.filter(r => r.status === 'completed').length, 1)).toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 필터 및 리포트 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">필터</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">카테고리</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'all' ? '전체' : cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">리포트 유형</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {types.map(type => (
                  <option key={type} value={type}>{type === 'all' ? '전체' : type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">리포트 서식</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF로 내보내기
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                Excel로 내보내기
              </button>
              <button
                onClick={() => handleExport('image')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                <Image className="w-4 h-4 text-blue-500" />
                이미지로 저장
              </button>
            </div>
          </div>
        </div>

        {/* 리포트 목록 */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">리포트 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">리포트명</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">카테고리</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">유형</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">기간</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">정확도</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">상태</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{report.title}</div>
                        <div className="text-xs text-gray-500">{report.createdAt} • {report.createdBy}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(report.category)}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{report.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{report.period}</td>
                    <td className="py-3 px-4 text-center">
                      {report.status === 'completed' ? (
                        <div className="flex items-center justify-center gap-1">
                          {report.summary.avgAccuracy >= 90 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className={`text-sm font-semibold ${
                            report.summary.avgAccuracy >= 90 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {report.summary.avgAccuracy}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePreview(report)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="미리보기"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="편집"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 리포트 서식 템플릿 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">리포트 템플릿</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            템플릿 추가
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{template.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.sections.slice(0, 3).map((section, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                    {section}
                  </span>
                ))}
                {template.sections.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                    +{template.sections.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.title}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* 요약 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">총 예측</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedReport.summary.totalPredictions}</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">정확도</div>
                    <div className="text-2xl font-bold text-green-600">{selectedReport.summary.avgAccuracy}%</div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">위험 항목</div>
                    <div className="text-2xl font-bold text-red-600">{selectedReport.summary.highRiskItems}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">개선 제안</div>
                    <div className="text-2xl font-bold text-yellow-600">{selectedReport.summary.recommendations}</div>
                  </div>
                </div>

                {/* 차트 영역 */}
                <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-gray-400" />
                </div>

                {/* 작업 버튼 */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF 다운로드
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <Printer className="w-4 h-4" />
                    인쇄
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                    공유
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionReport;
