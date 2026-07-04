import React, { useState } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import KPICard from '@/components/common/KPICard';
import {
  AlertIcon,
  DollarIcon,
  FactoryIcon,
  TargetIcon,
  PackageIcon,
  TrendUpIcon,
  TrendDownIcon,
  ActivityIcon,
  UserIcon,
  ZapIcon,
  BarChartIcon,
  PieChartIcon,
  LineChartIcon,
  CheckIcon,
  XIcon,
} from '@/components/icons/Icons';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedReport, setSelectedReport] = useState<string>('comprehensive');

  // 종합 성과 지표
  const comprehensiveMetricsData = {
    labels: ['4월', '5월', '6월', '7월', '8월', '9월', '10월'],
    datasets: [
      {
        label: '매출액 (억원)',
        data: [2850, 2920, 2880, 2950, 2910, 2980, 3250],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4
      },
      {
        label: '영업이익률 (%)',
        data: [9.5, 9.8, 10.1, 9.9, 10.2, 10.3, 10.5],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4
      }
    ]
  };

  // 부문별 성과 비교
  const departmentComparisonData = {
    labels: ['제조', '영업', 'R&D', '품질', '구매'],
    datasets: [
      {
        label: '목표 달성률 (%)',
        data: [105, 95, 108, 102, 98],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: '전월 대비 증감 (%)',
        data: [3.5, -2.1, 5.2, 1.8, -1.5],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  // 핵심 지표 레이더 차트
  const radarMetricsData = {
    labels: ['수익성', '성장성', '안정성', '효율성', '품질', '혁신'],
    datasets: [{
      label: '현재',
      data: [88, 85, 92, 86, 94, 82],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      borderWidth: 2
    },
    {
      label: '목표',
      data: [85, 80, 90, 85, 90, 80],
      backgroundColor: 'rgba(148, 163, 184, 0.2)',
      borderColor: '#94a3b8',
      borderWidth: 2,
      borderDash: [5, 5]
    }]
  };

  // 주요 지표 요약
  const keyMetrics = [
    { category: '재무', metric: '매출액', value: '3,250억', target: '3,300억', achievement: 98.5, trend: 'up', change: 9.1 },
    { category: '재무', metric: '영업이익', value: '341억', target: '330억', achievement: 103.3, trend: 'up', change: 11.2 },
    { category: '재무', metric: 'ROE', value: '12.5%', target: '12.0%', achievement: 104.2, trend: 'up', change: 4.2 },
    { category: '생산', metric: '생산량', value: '2,350개', target: '2,400개', achievement: 97.9, trend: 'up', change: 8.3 },
    { category: '생산', metric: '가동률', value: '92.8%', target: '90%', achievement: 103.1, trend: 'up', change: 3.1 },
    { category: '품질', metric: '불량률', value: '1.5%', target: '2.0%', achievement: 133.3, trend: 'up', change: -25.0 },
    { category: '품질', metric: '고객만족도', value: '88.2점', target: '85점', achievement: 103.8, trend: 'up', change: 3.8 },
    { category: '구매', metric: '재고회전율', value: '7.8회', target: '8.0회', achievement: 97.5, trend: 'down', change: -2.5 },
    { category: 'R&D', metric: '특허출원', value: '15건', target: '12건', achievement: 125.0, trend: 'up', change: 25.0 },
    { category: 'ESG', metric: 'ESG 점수', value: '81.7점', target: '80점', achievement: 102.1, trend: 'up', change: 2.1 },
    { category: 'ESG', metric: '탄소배출', value: '1,020톤', target: '1,200톤', achievement: 117.6, trend: 'up', change: -15.0 },
    { category: '인사', metric: '이직률', value: '6.5%', target: '8.0%', achievement: 123.1, trend: 'up', change: -18.8 }
  ];

  // 리스크 & 기회
  const risks = [
    { 
      id: 'R-001',
      type: 'risk',
      category: '재무',
      title: '원자재 가격 상승',
      severity: 'high',
      probability: 'high',
      impact: '원가 5-7% 증가 예상',
      mitigation: '대체 자재 도입, 장기 계약 협상'
    },
    { 
      id: 'R-002',
      type: 'risk',
      category: '생산',
      title: '숙련 인력 부족',
      severity: 'medium',
      probability: 'medium',
      impact: '생산성 3-5% 감소 우려',
      mitigation: '기술 교육 강화, 자동화 투자'
    },
    { 
      id: 'O-001',
      type: 'opportunity',
      category: '영업',
      title: '신규 시장 진출',
      severity: 'high',
      probability: 'medium',
      impact: '매출 15-20% 증가 기대',
      action: '해외 시장 조사, 파트너십 구축'
    },
    { 
      id: 'O-002',
      type: 'opportunity',
      category: 'R&D',
      title: '신기술 개발 성공',
      severity: 'high',
      probability: 'high',
      impact: '시장 점유율 10% 확대',
      action: '특허 출원, 양산 체계 구축'
    }
  ];

  // 월별 주요 이슈
  const monthlyIssues = [
    { month: '10월', category: '재무', issue: '매출 목표 달성률 98.5%', status: 'good' },
    { month: '10월', category: '생산', issue: '3공장 효율 92.1% 우수 성과', status: 'excellent' },
    { month: '10월', category: '품질', issue: 'CPK 제품 E 개선 필요', status: 'warning' },
    { month: '10월', category: '구매', issue: '재고회전율 목표 미달', status: 'warning' },
    { month: '10월', category: 'R&D', issue: '특허 출원 목표 초과 달성', status: 'excellent' },
    { month: '10월', category: 'ESG', issue: '탄소배출 15% 감축 성공', status: 'excellent' }
  ];

  // 개선 권고사항
  const recommendations = [
    {
      priority: 'high',
      area: '품질',
      title: '제품 E CPK 긴급 개선',
      description: 'CPK 0.95로 1.00 미만, 공정 능력 개선 시급',
      expectedImpact: '불량률 0.3%p 감소',
      timeline: '1개월'
    },
    {
      priority: 'high',
      area: '구매',
      title: '재고 최적화 추진',
      description: '재고회전율 7.8회로 목표 미달, 재고 관리 강화',
      expectedImpact: '재고자산 50억 감소',
      timeline: '2개월'
    },
    {
      priority: 'medium',
      area: '생산',
      title: 'CNC #2 OEE 개선',
      description: 'OEE 67.2%로 낮음, 예방정비 강화 필요',
      expectedImpact: '생산성 8% 향상',
      timeline: '1개월'
    },
    {
      priority: 'medium',
      area: '영업',
      title: '영업 부문 이익률 개선',
      description: '예산 대비 -5.6% 미달, 비용 관리 필요',
      expectedImpact: '이익 10억 증가',
      timeline: '2개월'
    },
    {
      priority: 'low',
      area: 'ESG',
      title: '사회(S) 점수 향상',
      description: 'ESG 중 사회 부문 78점으로 상대적 낮음',
      expectedImpact: 'ESG 종합 점수 2점 상승',
      timeline: '3개월'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent':
        return '우수';
      case 'good':
        return '양호';
      case 'warning':
        return '주의';
      case 'critical':
        return '긴급';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-700 to-gray-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">분석 리포트</h1>
        </div>
        <p className="text-slate-200">경영 성과를 종합 분석하고 인사이트를 제공합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="종합 달성률"
          value="104.3%"
          subtitle="12개 지표 평균"
          changeRate={4.3}
          trend="up"
          color="green"
          icon={TargetIcon}
        />
        <KPICard
          title="전월 대비 성장"
          value="9.1%"
          subtitle="매출액 기준"
          changeRate={9.1}
          trend="up"
          color="blue"
          icon={TrendUpIcon}
        />
        <KPICard
          title="리스크"
          value="2"
          subtitle="높음: 1, 보통: 1"
          unit="건"
          changeRate={0}
          trend="up"
          color="red"
          icon={AlertIcon}
        />
        <KPICard
          title="개선 과제"
          value="5"
          subtitle="높음: 2, 보통: 2"
          unit="건"
          changeRate={0}
          trend="up"
          color="yellow"
          icon={CheckIcon}
        />
      </div>

      {/* 리포트 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['comprehensive', 'financial', 'operational', 'quality', 'esg'].map((report) => (
            <button
              key={report}
              onClick={() => setSelectedReport(report)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedReport === report
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {report === 'comprehensive' && '종합'}
              {report === 'financial' && '재무'}
              {report === 'operational' && '운영'}
              {report === 'quality' && '품질'}
              {report === 'esg' && 'ESG'}
            </button>
          ))}
        </div>
      </div>

      {/* 종합 성과 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendUpIcon className="text-blue-600" size={24} />
            종합 성과 추이
          </h3>
          <p className="text-sm text-gray-500 mt-1">매출액 & 영업이익률</p>
        </div>

        <ChartComponent
          type="line"
          data={comprehensiveMetricsData}
          options={{
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: '매출액 (억원)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: '영업이익률 (%)'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }}
          height={280}
        />

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">10월 매출</p>
            <p className="text-2xl font-bold text-blue-600">3,250억</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">영업이익률</p>
            <p className="text-2xl font-bold text-green-600">10.5%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">전월 대비</p>
            <p className="text-2xl font-bold text-purple-600">+9.1%</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-1">누적 매출</p>
            <p className="text-2xl font-bold text-yellow-600">20,590억</p>
          </div>
        </div>
      </div>

      {/* 부문별 & 핵심지표 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 부문별 성과 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TargetIcon className="text-purple-600" size={24} />
              부문별 성과 비교
            </h3>
            <p className="text-sm text-gray-500 mt-1">목표 달성률 & 증감률</p>
          </div>

          <ChartComponent
            type="bar"
            data={departmentComparisonData}
            options={{
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  min: -10
                }
              }
            }}
            height={280}
          />
        </div>

        {/* 핵심지표 레이더 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-blue-600" size={24} />
              핵심 지표 레이더
            </h3>
            <p className="text-sm text-gray-500 mt-1">6대 경영 요소</p>
          </div>

          <ChartComponent
            type="radar"
            data={radarMetricsData}
            options={{
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
            height={280}
          />
        </div>
      </div>

      {/* 주요 지표 요약 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-slate-700 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckIcon size={20} />
            주요 지표 요약
          </h3>
          <p className="text-slate-200 text-xs mt-1">12개 핵심 지표 성과</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">분류</th>
                <th className="py-3 px-4 text-left">지표</th>
                <th className="py-3 px-4 text-center">실적</th>
                <th className="py-3 px-4 text-center">목표</th>
                <th className="py-3 px-4 text-center">달성률</th>
                <th className="py-3 px-4 text-center">추세</th>
                <th className="py-3 px-4 text-center">전월 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keyMetrics.map((metric, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      metric.category === '재무' ? 'bg-blue-100 text-blue-700' :
                      metric.category === '생산' ? 'bg-green-100 text-green-700' :
                      metric.category === '품질' ? 'bg-purple-100 text-purple-700' :
                      metric.category === '구매' ? 'bg-orange-100 text-orange-700' :
                      metric.category === 'R&D' ? 'bg-pink-100 text-pink-700' :
                      metric.category === 'ESG' ? 'bg-teal-100 text-teal-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {metric.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{metric.metric}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{metric.value}</td>
                  <td className="py-3 px-4 text-center">{metric.target}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      metric.achievement >= 100 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {metric.achievement.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {metric.trend === 'up' ? (
                      <TrendUpIcon className="text-green-600 inline" size={16} />
                    ) : (
                      <TrendDownIcon className="text-red-600 inline" size={16} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 리스크 & 기회 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertIcon className="text-red-600" size={24} />
            리스크 & 기회 분석
          </h3>
          <p className="text-sm text-gray-500 mt-1">주요 위험 요인과 기회 요인</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 리스크 */}
          <div>
            <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
              <AlertIcon size={16} />
              리스크 (Risks)
            </h4>
            <div className="space-y-3">
              {risks.filter(r => r.type === 'risk').map((risk, idx) => (
                <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-gray-800">{risk.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityColor(risk.severity)}`}>
                      심각도: {getSeverityLabel(risk.severity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">영향:</span> {risk.impact}
                  </p>
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">대응:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 기회 */}
          <div>
            <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
              <TrendUpIcon size={16} />
              기회 (Opportunities)
            </h4>
            <div className="space-y-3">
              {risks.filter(r => r.type === 'opportunity').map((opp, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-gray-800">{opp.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityColor(opp.severity)}`}>
                      중요도: {getSeverityLabel(opp.severity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">기대효과:</span> {opp.impact}
                  </p>
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">실행방안:</span> {opp.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 월별 주요 이슈 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CheckIcon className="text-blue-600" size={24} />
            10월 주요 이슈
          </h3>
          <p className="text-sm text-gray-500 mt-1">부문별 핵심 성과</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlyIssues.map((issue, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  issue.category === '재무' ? 'bg-blue-100 text-blue-700' :
                  issue.category === '생산' ? 'bg-green-100 text-green-700' :
                  issue.category === '품질' ? 'bg-purple-100 text-purple-700' :
                  issue.category === '구매' ? 'bg-orange-100 text-orange-700' :
                  issue.category === 'R&D' ? 'bg-pink-100 text-pink-700' :
                  'bg-teal-100 text-teal-700'
                }`}>
                  {issue.category}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                  {getStatusLabel(issue.status)}
                </span>
              </div>
              <p className="text-sm text-gray-800">{issue.issue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 개선 권고사항 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TargetIcon className="text-yellow-600" size={24} />
            개선 권고사항
          </h3>
          <p className="text-sm text-gray-500 mt-1">우선순위별 실행 과제</p>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {rec.area}
                  </span>
                  <h4 className="font-bold text-gray-800">{rec.title}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">소요기간</p>
                  <p className="text-sm font-bold text-blue-600">{rec.timeline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">현황:</span> {rec.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">
                    <span className="font-medium">기대효과:</span> {rec.expectedImpact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 종합 인사이트 */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 AI 종합 인사이트</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">전반적 우수 성과 달성</p>
                <p className="text-sm text-gray-600">
                  12개 핵심 지표 중 10개가 목표를 달성하여 종합 달성률 104.3%를 기록했습니다. 
                  특히 품질(133.3%), R&D(125.0%), ESG(117.6%) 부문에서 탁월한 성과를 보였습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">매출 성장세 지속</p>
                <p className="text-sm text-gray-600">
                  10월 매출 3,250억원으로 전월 대비 9.1% 성장하며 7개월 연속 상승세를 이어가고 있습니다. 
                  영업이익률도 10.5%로 목표(10.0%)를 초과 달성했습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">주요 개선 과제 5건</p>
                <p className="text-sm text-gray-600">
                  제품 E CPK 개선(높음), 재고 최적화(높음), CNC #2 OEE 개선(보통), 
                  영업 이익률 개선(보통), ESG 사회 점수 향상(낮음) 등 5개 과제에 대한 조속한 대응이 필요합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">리스크 관리 강화 필요</p>
                <p className="text-sm text-gray-600">
                  원자재 가격 상승(높음)과 숙련 인력 부족(보통) 2건의 주요 리스크가 식별되었습니다. 
                  동시에 신규 시장 진출과 신기술 개발 성공 등 2건의 기회 요인도 포착되어 전략적 대응이 요구됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-bold text-gray-800 mb-1">향후 전망 및 방향</p>
                <p className="text-sm text-gray-600">
                  현재의 성장세를 유지하면서 식별된 개선 과제를 체계적으로 해결하고 
                  리스크를 최소화한다면 연간 목표 초과 달성이 충분히 가능할 것으로 전망됩니다. 
                  특히 품질과 효율성 개선에 집중하면서 신사업 기회를 적극 활용하는 것이 핵심입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;