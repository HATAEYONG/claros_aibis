import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  CheckIcon,
  TrendDownIcon,
  AlertIcon,
  TargetIcon,
  ActivityIcon,
  ZapIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface QualityInspection {
  id: number;
  inspection_number: string;
  inspection_type: string;
  inspection_type_display?: string;
  product_name: string;
  product_code: string;
  inspection_date: string;
  sample_size: number;
  defect_count: number;
  result: string;
  result_display?: string;
}

interface CustomerComplaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  product_name: string;
  complaint_date: string;
  description: string;
  severity: string;
  status: string;
  assigned_to: string;
}

interface ProcessCapability {
  id: number;
  product_name: string;
  product_code: string;
  process_name: string;
  usl: string;
  lsl: string;
  cpk: string;
  ppk: string;
}

const Quality: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [processCapabilities, setProcessCapabilities] = useState<ProcessCapability[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [defectAnalysis, setDefectAnalysis] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [inspRes, complaintsRes, cpkRes, statsRes, analysisRes] = await Promise.all([
          api.quality.getInspections(),
          api.quality.getComplaints(),
          api.quality.getProcessCapabilities(),
          api.quality.getInspectionStatistics(),
          api.quality.getDefectAnalysis(30),
        ]);

        setInspections(Array.isArray(inspRes) ? inspRes : inspRes.results || []);
        setComplaints(Array.isArray(complaintsRes) ? complaintsRes : complaintsRes.results || []);
        setProcessCapabilities(Array.isArray(cpkRes) ? cpkRes : cpkRes.results || []);
        setStatistics(statsRes);
        setDefectAnalysis(analysisRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 불량률 추이 차트 데이터 (월별 집계)
  const getDefectRateData = () => {
    const monthlyData = new Map<string, { samples: number; defects: number }>();

    inspections.forEach(insp => {
      const month = insp.inspection_date.substring(0, 7);
      const existing = monthlyData.get(month) || { samples: 0, defects: 0 };
      monthlyData.set(month, {
        samples: existing.samples + insp.sample_size,
        defects: existing.defects + insp.defect_count
      });
    });

    const sortedMonths = Array.from(monthlyData.keys()).sort().slice(-7);
    const rates = sortedMonths.map(m => {
      const data = monthlyData.get(m);
      return data && data.samples > 0 ? (data.defects / data.samples) * 100 : 0;
    });

    return {
      labels: sortedMonths.map(m => {
        const [, month] = m.split('-');
        return `${month}월`;
      }),
      datasets: [
        {
          label: '목표',
          data: sortedMonths.map(() => 2.0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: '실제 불량률',
          data: rates.map(r => parseFloat(r.toFixed(2))),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // 불량 유형별 분포
  const getDefectTypeData = () => {
    const defectByType = defectAnalysis?.defect_by_type || [];
    const labels = defectByType.map((d: any) => d.defect_type__name || '기타');
    const data = defectByType.map((d: any) => d.total || 0);
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#6b7280', '#10b981'];

    return {
      labels: labels.slice(0, 5),
      datasets: [{
        data: data.slice(0, 5),
        backgroundColor: colors.slice(0, Math.min(labels.length, 5))
      }]
    };
  };

  // 검사 유형별 통계
  const getInspectionStats = () => {
    const stats = new Map<string, { total: number; passed: number; failed: number }>();

    inspections.forEach(insp => {
      const type = insp.inspection_type;
      const existing = stats.get(type) || { total: 0, passed: 0, failed: 0 };
      stats.set(type, {
        total: existing.total + 1,
        passed: existing.passed + (insp.result === 'pass' ? 1 : 0),
        failed: existing.failed + (insp.result === 'fail' ? 1 : 0)
      });
    });

    const typeLabels: Record<string, string> = {
      'incoming': '수입검사',
      'in_process': '공정검사',
      'final': '최종검사',
      'outgoing': '출하검사'
    };

    return Array.from(stats.entries()).map(([type, data]) => ({
      type: typeLabels[type] || type,
      total: data.total,
      passed: data.passed,
      rejected: data.failed,
      rate: data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : '0'
    }));
  };

  // 공정별 불량률 차트
  const getProcessDefectData = () => {
    const processStats = new Map<string, { samples: number; defects: number }>();

    inspections.forEach(insp => {
      const process = insp.inspection_type;
      const existing = processStats.get(process) || { samples: 0, defects: 0 };
      processStats.set(process, {
        samples: existing.samples + insp.sample_size,
        defects: existing.defects + insp.defect_count
      });
    });

    const processLabels: Record<string, string> = {
      'incoming': '수입',
      'in_process': '공정',
      'final': '최종',
      'outgoing': '출하'
    };

    const processes = Array.from(processStats.entries());
    return {
      labels: processes.map(([p]) => processLabels[p] || p),
      datasets: [{
        label: '불량률 (%)',
        data: processes.map(([, data]) =>
          data.samples > 0 ? parseFloat(((data.defects / data.samples) * 100).toFixed(2)) : 0
        ),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 2
      }]
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-gray-100 text-gray-700';
      case 'investigating': return 'bg-yellow-100 text-yellow-700';
      case 'resolving': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return '접수';
      case 'investigating': return '조사중';
      case 'resolving': return '개선중';
      case 'resolved': return '완료';
      case 'closed': return '종료';
      default: return status;
    }
  };

  const getCpkStatus = (cpk: number) => {
    if (cpk >= 1.67) return 'excellent';
    if (cpk >= 1.33) return 'good';
    if (cpk >= 1.00) return 'warning';
    return 'critical';
  };

  const getCpkStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCpkStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '우수';
      case 'good': return '양호';
      case 'warning': return '주의';
      case 'critical': return '위험';
      default: return '-';
    }
  };

  if (loading) {
    return <LoadingState message="품질 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const defectRate = statistics?.average_defect_rate || 0;
  const passRate = statistics?.pass_rate || 0;
  const openComplaints = complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length;
  const avgCpk = processCapabilities.length > 0
    ? processCapabilities.reduce((sum, pc) => sum + parseFloat(pc.cpk), 0) / processCapabilities.length
    : 0;

  const inspectionStats = getInspectionStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CheckIcon size={32} />
          <h1 className="text-3xl font-bold">품질 관리</h1>
        </div>
        <p className="text-blue-100">품질 지표와 개선 활동을 통합 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="불량률"
          value={`${defectRate.toFixed(2)}%`}
          subtitle="목표: 2.0% 이하"
          changeRate={2.0 - defectRate}
          trend={defectRate <= 2.0 ? "up" : "down"}
          color="green"
          icon={CheckIcon}
        />
        <KPICard
          title="합격률"
          value={`${passRate.toFixed(1)}%`}
          subtitle="목표: 98%"
          changeRate={passRate - 98}
          trend={passRate >= 98 ? "up" : "down"}
          color="blue"
          icon={TargetIcon}
        />
        <KPICard
          title="미완료 클레임"
          value={openComplaints.toString()}
          subtitle={`전체: ${complaints.length}건`}
          unit="건"
          changeRate={-((openComplaints / Math.max(complaints.length, 1)) * 100)}
          trend={openComplaints <= 3 ? "up" : "down"}
          color="purple"
          icon={AlertIcon}
        />
        <KPICard
          title="평균 CPK"
          value={avgCpk.toFixed(2)}
          subtitle="목표: 1.33 이상"
          changeRate={avgCpk - 1.33}
          trend={avgCpk >= 1.33 ? "up" : "down"}
          color="yellow"
          icon={ActivityIcon}
        />
      </div>

      {/* 기간 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'week' && '주간'}
              {period === 'month' && '월간'}
              {period === 'quarter' && '분기'}
            </button>
          ))}
        </div>
      </div>

      {/* 불량률 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendDownIcon className="text-green-600" size={24} />
            불량률 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">월별 개선 현황 (단위: %)</p>
        </div>

        <ChartComponent
          type="line"
          data={getDefectRateData()}
          options={{
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, max: 3 } }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">현재 불량률</p>
            <p className="text-2xl font-bold text-green-600">{defectRate.toFixed(2)}%</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">목표 대비</p>
            <p className="text-2xl font-bold text-blue-600">
              {(defectRate - 2.0) > 0 ? '+' : ''}{(defectRate - 2.0).toFixed(2)}%p
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">총 검사 건수</p>
            <p className="text-2xl font-bold text-purple-600">{statistics?.total_inspections || 0}건</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">불합격 건수</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics?.failed || 0}건</p>
          </div>
        </div>
      </div>

      {/* 불량 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertIcon className="text-red-600" size={24} />
              불량 유형별 분포
            </h3>
            <p className="text-sm text-gray-500 mt-1">최근 30일 기준</p>
          </div>
          <ChartComponent
            type="doughnut"
            data={getDefectTypeData()}
            options={{ plugins: { legend: { position: 'bottom' } } }}
            height={280}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-purple-600" size={24} />
              검사 유형별 불량률
            </h3>
            <p className="text-sm text-gray-500 mt-1">전체 기간</p>
          </div>
          <ChartComponent
            type="bar"
            data={getProcessDefectData()}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 5 } }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 검사 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckIcon size={20} />
            검사 현황
          </h3>
          <p className="text-blue-100 text-xs mt-1">검사 유형별 통계</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">검사 유형</th>
                <th className="py-3 px-4 text-center">총 검사</th>
                <th className="py-3 px-4 text-center">합격</th>
                <th className="py-3 px-4 text-center">불합격</th>
                <th className="py-3 px-4 text-center">합격률</th>
                <th className="py-3 px-4 text-center">진행률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspectionStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="py-3 px-4 font-medium">{stat.type}</td>
                  <td className="py-3 px-4 text-center">{stat.total.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-bold text-green-600">{stat.passed.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-600">{stat.rejected.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      parseFloat(stat.rate) >= 99 ? 'text-green-600' :
                      parseFloat(stat.rate) >= 98 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {stat.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${stat.rate}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CPK/PPK 관리 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-yellow-600" size={24} />
            공정 능력 지수 (CPK/PPK)
          </h3>
          <p className="text-sm text-gray-500 mt-1">제품별 공정 능력 평가</p>
        </div>

        <div className="space-y-3">
          {processCapabilities.map((pc) => {
            const cpkValue = parseFloat(pc.cpk);
            const ppkValue = parseFloat(pc.ppk);
            const status = getCpkStatus(cpkValue);

            return (
              <div key={pc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{pc.product_name}</h4>
                    <p className="text-sm text-gray-600">공정: {pc.process_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cpkValue >= 1.67 ? 'bg-green-100 text-green-700' :
                    cpkValue >= 1.33 ? 'bg-blue-100 text-blue-700' :
                    cpkValue >= 1.00 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {getCpkStatusLabel(status)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Cpk</p>
                    <p className={`text-2xl font-bold ${getCpkStatusColor(status)}`}>
                      {cpkValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Ppk</p>
                    <p className={`text-2xl font-bold ${getCpkStatusColor(status)}`}>
                      {ppkValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center flex items-center justify-center">
                    <div>
                      {cpkValue >= 1.67 && <span className="text-2xl">✅</span>}
                      {cpkValue >= 1.33 && cpkValue < 1.67 && <span className="text-2xl">👍</span>}
                      {cpkValue >= 1.00 && cpkValue < 1.33 && <span className="text-2xl">⚠️</span>}
                      {cpkValue < 1.00 && <span className="text-2xl">🚨</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">CPK 평가 기준</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <span className="font-bold text-green-600">≥ 1.67</span>
              <p className="text-gray-600">우수</p>
            </div>
            <div className="text-center">
              <span className="font-bold text-blue-600">≥ 1.33</span>
              <p className="text-gray-600">양호</p>
            </div>
            <div className="text-center">
              <span className="font-bold text-yellow-600">≥ 1.00</span>
              <p className="text-gray-600">주의</p>
            </div>
            <div className="text-center">
              <span className="font-bold text-red-600">&lt; 1.00</span>
              <p className="text-gray-600">위험</p>
            </div>
          </div>
        </div>
      </div>

      {/* 고객 클레임 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertIcon className="text-red-600" size={24} />
            고객 클레임 현황
          </h3>
          <p className="text-sm text-gray-500 mt-1">최근 클레임 이력</p>
        </div>
        <div className="space-y-3">
          {complaints.slice(0, 5).map((complaint, idx) => (
            <div key={complaint.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{complaint.complaint_number}</h4>
                    <p className="text-sm text-gray-600">{complaint.customer_name} · {complaint.product_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(complaint.severity)}`}>
                    {getSeverityLabel(complaint.severity)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(complaint.status)}`}>
                    {getStatusLabel(complaint.status)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate max-w-md">{complaint.description}</span>
                <span className="text-gray-500">접수일: {complaint.complaint_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 품질 인사이트 */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">품질 인사이트</h3>
        <div className="space-y-3">
          {defectRate <= 2.0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">불량률 목표 달성</p>
                  <p className="text-sm text-gray-600">
                    현재 불량률 {defectRate.toFixed(2)}%로 목표(2.0%) 대비
                    {(2.0 - defectRate).toFixed(2)}%p 낮은 우수한 성과입니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {processCapabilities.filter(pc => parseFloat(pc.cpk) < 1.0).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">CPK 개선 필요 공정</p>
                  <p className="text-sm text-gray-600">
                    {processCapabilities.filter(pc => parseFloat(pc.cpk) < 1.0)
                      .map(pc => `${pc.product_name} (${pc.process_name})`).join(', ')}의
                    CPK가 1.00 미만입니다. 공정 개선이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {openComplaints > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">미완료 클레임</p>
                  <p className="text-sm text-gray-600">
                    {openComplaints}건의 고객 클레임이 처리 중입니다.
                    신속한 대응으로 고객 만족도를 높여주세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quality;
