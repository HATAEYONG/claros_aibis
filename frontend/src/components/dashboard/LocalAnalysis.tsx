import React, { useState, useEffect } from 'react';

interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

interface CardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

interface SalesData {
  period: string;
  statistics: {
    total_records: number;
    total_target: number;
    total_actual: number;
    avg_actual: number;
    avg_achievement_rate: number;
    total_new_customers: number;
    overall_achievement_rate: number;
    sales_change_rate: number;
  };
  insights: string[];
}

interface QualityData {
  statistics: {
    total_inspections: number;
    total_sampled: number;
    total_defects: number;
    avg_defect_rate: number;
    pass_rate: number;
  };
  insights: string[];
}

interface ProductionData {
  statistics: {
    total_produced: number;
    total_target: number;
    avg_efficiency: number;
    defect_rate: number;
    overall_achievement_rate: number;
  };
  insights: string[];
}

interface ComprehensiveData {
  analysis_date: string;
  period_days: number;
  period_months: number;
  sales: SalesData;
  quality: QualityData;
  production: ProductionData;
  summary: {
    overall_status: string;
    key_metrics: {
      total_sales: number;
      sales_achievement_rate: number;
      total_produced: number;
      quality_pass_rate: number;
      production_efficiency: number;
    };
    recommendations: string[];
  };
}

const Metric: React.FC<MetricProps> = ({ label, value, change, unit = '' }) => {
  const changeClass = change === undefined ? '' : change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  const changeIcon = change === undefined ? '' : change > 0 ? '↑' : change < 0 ? '↓' : '→';

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <div className="text-right">
        <span className="font-semibold text-gray-800">{value}{unit}</span>
        {change !== undefined && (
          <span className={`ml-2 text-sm ${changeClass}`}>
            {changeIcon}{Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

const Card: React.FC<CardProps> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

type TabType = 'comprehensive' | 'sales' | 'quality' | 'production';

const LocalAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComprehensiveData | null>(null);
  const [days, setDays] = useState(90);
  const [activeTab, setActiveTab] = useState<TabType>('comprehensive');

  const API_BASE = 'http://localhost:8000/api/local-analysis';

  useEffect(() => {
    if (activeTab === 'comprehensive') {
      loadComprehensiveData();
    } else if (activeTab === 'sales') {
      loadSalesData();
    } else if (activeTab === 'quality') {
      loadQualityData();
    } else if (activeTab === 'production') {
      loadProductionData();
    }
  }, [days, activeTab]);

  const loadComprehensiveData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/comprehensive/?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '분석 실패');
      }
    } catch (err) {
      console.warn('Comprehensive analysis API 연동 실패, 샘플 데이터 사용:', err);
      // 시연용 샘플 데이터
      setData({
        analysis_date: new Date().toISOString().split('T')[0],
        period_days: days,
        period_months: Math.floor(days / 30),
        sales: {
          period: `최근 ${Math.floor(days / 30)}개월`,
          statistics: {
            total_records: 65234,
            total_target: 70000,
            total_actual: 67845,
            avg_actual: 45000000,
            avg_achievement_rate: 96.9,
            total_new_customers: 127,
            overall_achievement_rate: 96.9,
            sales_change_rate: 8.5
          },
          insights: [
            '전체 매출이 목표 대비 96.9% 달성',
            '신규 고객 수가 전월 대비 12% 증가',
            '주요 고객군의 재주문율이 85% 수준으로 안정적'
          ]
        },
        quality: {
          statistics: {
            total_inspections: 125678,
            total_sampled: 125678,
            total_defects: 2234,
            avg_defect_rate: 1.78,
            pass_rate: 98.22
          },
          insights: [
            '전체 검사 합격률 98.22% 달성',
            '불급 불량 유형: 크기(42%), 외관(28%), 기능(18%)',
            'Cpk 지수 1.42로 공정 능력 안정화'
          ]
        },
        production: {
          statistics: {
            total_produced: 223450,
            total_target: 230000,
            avg_efficiency: 92.5,
            defect_rate: 1.8,
            overall_achievement_rate: 97.1
          },
          insights: [
            '평균 가동률 92.5%로 양호한 수준',
            '불속률 1.8%로 목표치 2.0% 이하 유지',
            '라인별 효율 편차 줄이기 필요'
          ]
        },
        summary: {
          overall_status: '양호',
          key_metrics: {
            total_sales: 52500000000,
            sales_achievement_rate: 96.9,
            total_produced: 223450,
            quality_pass_rate: 98.22,
            production_efficiency: 92.5
          },
          recommendations: [
            '라인 3의 생산 효율 개선 필요 (현재 89%)',
            '외관 불량 감소를 위해 금형 공정 최적화',
            '신규 고객 유치를 위해 CRM 시스템 강화'
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sales/?months=${Math.floor(days / 30)}`);
      const result = await response.json();

      if (result.success) {
        setData({ sales: result.data } as any);
      } else {
        setError(result.error || '분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const loadQualityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/quality/?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setData({ quality: result.data } as any);
      } else {
        setError(result.error || '분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const loadProductionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/production/?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setData({ production: result.data } as any);
      } else {
        setError(result.error || '분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => {
    if (activeTab === 'comprehensive') {
      loadComprehensiveData();
    } else if (activeTab === 'sales') {
      loadSalesData();
    } else if (activeTab === 'quality') {
      loadQualityData();
    } else if (activeTab === 'production') {
      loadProductionData();
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '만';
    if (num >= 1000) return (num / 1000).toFixed(1) + '천';
    return num.toLocaleString();
  };

  const formatPercent = (num: number): string => num.toFixed(1) + '%';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold">❌ 오류 발생</p>
        <p className="text-sm mt-2">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          다시 시도
        </button>
      </div>
    );
  }

  // Render content based on active tab
  const renderTabContent = () => {
    // During loading, don't render content to avoid data structure mismatches
    if (loading) {
      return null;
    }

    if (activeTab === 'sales' && (data as any).sales) {
      const salesData = (data as any).sales;
      return (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="총 실적" icon="💰">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(salesData.statistics.total_actual)}</p>
              <p className="text-sm text-gray-500 mt-1">목표: {formatNumber(salesData.statistics.total_target)}</p>
            </Card>
            <Card title="달성률" icon="🎯">
              <p className="text-3xl font-bold text-green-600">{formatPercent(salesData.statistics.overall_achievement_rate)}</p>
              <p className="text-sm text-gray-500 mt-1">평균: {formatPercent(salesData.statistics.avg_achievement_rate)}</p>
            </Card>
            <Card title="전월 대비" icon="📊">
              <p className={`text-3xl font-bold ${salesData.statistics.sales_change_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(salesData.statistics.sales_change_rate)}
              </p>
              <p className="text-sm text-gray-500 mt-1">증감율</p>
            </Card>
            <Card title="신규 고객" icon="👥">
              <p className="text-3xl font-bold text-purple-600">{salesData.statistics.total_new_customers}명</p>
              <p className="text-sm text-gray-500 mt-1">{salesData.statistics.total_records}개월</p>
            </Card>
          </div>

          {/* Insights */}
          <Card title="💡 인사이트" icon="💡">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesData.insights.map((insight: string, idx: number) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Trend Table */}
          <Card title="📅 월별 추세" icon="📅">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">년도</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">월</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">목표</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">실적</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">달성률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">신규 고객</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">계약률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">파이프라인</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.monthly_data.map((month: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{month.year}</td>
                      <td className="px-4 py-3">{month.month}월</td>
                      <td className="px-4 py-3 text-right">{formatNumber(month.target_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(month.actual_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          month.achievement_rate >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {formatPercent(month.achievement_rate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{month.new_customers}명</td>
                      <td className="px-4 py-3 text-right">{formatPercent(month.contract_rate)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(month.pipeline_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      );
    }

    if (activeTab === 'quality' && (data as any).quality) {
      const qualityData = (data as any).quality;
      return (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card title="검사 횟수" icon="🔍">
              <p className="text-3xl font-bold text-blue-600">{qualityData.statistics.total_inspections}회</p>
              <p className="text-sm text-gray-500 mt-1">{qualityData.period}</p>
            </Card>
            <Card title="검사 수량" icon="📦">
              <p className="text-3xl font-bold text-purple-600">{formatNumber(qualityData.statistics.total_sampled)}</p>
            </Card>
            <Card title="불량 수" icon="⚠️">
              <p className="text-3xl font-bold text-orange-600">{qualityData.statistics.total_defects}개</p>
            </Card>
            <Card title="평균 불량률" icon="📊">
              <p className="text-3xl font-bold text-red-600">{formatPercent(qualityData.statistics.avg_defect_rate)}</p>
            </Card>
            <Card title="합격률" icon="✅">
              <p className="text-3xl font-bold text-green-600">{formatPercent(qualityData.statistics.pass_rate)}</p>
            </Card>
          </div>

          {/* Insights */}
          <Card title="💡 인사이트" icon="💡">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityData.insights.map((insight: string, idx: number) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* Product Quality Ranking */}
          <Card title="🏭 제품별 불량률 TOP 10" icon="🏭">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">순위</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">제품명</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">검사 횟수</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">검사 수량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량 수</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량률</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData?.product_quality && qualityData.product_quality.length > 0 ? (
                    qualityData.product_quality.map((product: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{product.product_name}</td>
                        <td className="px-4 py-3 text-right">{product.inspection_count}회</td>
                        <td className="px-4 py-3 text-right">{formatNumber(product.total_sampled)}</td>
                        <td className="px-4 py-3 text-right">{product.total_defects}개</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.avg_defect_rate > 1 ? 'bg-red-100 text-red-700' : product.avg_defect_rate > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {formatPercent(product.avg_defect_rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.avg_defect_rate > 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {product.avg_defect_rate > 1 ? '개선필요' : '양호'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        제품 품질 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daily Trend */}
          <Card title="📅 일별 불량률 추세" icon="📅">
            <div className="h-64 overflow-x-auto">
              <div className="flex items-end gap-1 min-w-max">
                {qualityData.daily_trend.slice(0, 30).reverse().map((day: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="w-6 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{
                        height: `${Math.min(day.avg_defect_rate * 30, 200)}px`,
                        minHeight: '4px'
                      }}
                      title={`${day.date}: ${day.avg_defect_rate.toFixed(2)}%`}
                    />
                    <span className="text-xs text-gray-500">
                      {day.date.substring(5).replace('-', '/')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div> 높음 ({'>'}1%)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div> 보통 (0.5-1%)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div> 양호 ({'<'}0.5%)
                </span>
              </div>
            </div>
          </Card>
        </>
      );
    }

    if (activeTab === 'production' && (data as any).production) {
      const productionData = (data as any).production;
      return (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card title="생산량" icon="📦">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(productionData.statistics.total_produced)}</p>
              <p className="text-sm text-gray-500 mt-1">목표: {formatNumber(productionData.statistics.total_target)}</p>
            </Card>
            <Card title="달성률" icon="🎯">
              <p className="text-3xl font-bold text-green-600">{formatPercent(productionData.statistics.overall_achievement_rate)}</p>
            </Card>
            <Card title="평균 효율" icon="⚡">
              <p className="text-3xl font-bold text-purple-600">{formatPercent(productionData.statistics.avg_efficiency)}</p>
            </Card>
            <Card title="불량률" icon="⚠️">
              <p className="text-3xl font-bold text-orange-600">{formatPercent(productionData.statistics.defect_rate)}</p>
            </Card>
            <Card title="불량 수" icon="❌">
              <p className="text-3xl font-bold text-red-600">{formatNumber(productionData.statistics.total_defective)}개</p>
            </Card>
          </div>

          {/* Insights */}
          <Card title="💡 인사이트" icon="💡">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productionData.insights.map((insight: string, idx: number) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-gray-700">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* Line Performance */}
          <Card title="🏭 라인별 생산 현황" icon="🏭">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">순위</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">라인명</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">생산량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">평균 효율</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">달성률</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">등급</th>
                  </tr>
                </thead>
                <tbody>
                  {productionData.line_performance.map((line: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{line.line_name}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(line.total_produced)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          line.avg_efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          line.avg_efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {formatPercent(line.avg_efficiency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPercent(line.avg_achievement_rate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          line.avg_efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          line.avg_efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {line.avg_efficiency >= 95 ? '우수' : line.avg_efficiency >= 90 ? '양호' : '개선'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daily Trend */}
          <Card title="📅 일별 생산 추세 (최근 30일)" icon="📅">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">날짜</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">생산량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">불량률</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">효율</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {productionData.daily_trend.slice(0, 30).map((day: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{day.date}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNumber(day.actual_quantity)}</td>
                      <td className="px-4 py-3 text-right">{day.defect_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs ${
                          (day.defect_quantity / day.actual_quantity * 100) > 2 ? 'text-red-600' :
                          (day.defect_quantity / day.actual_quantity * 100) > 1 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {((day.defect_quantity / day.actual_quantity) * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatPercent(day.efficiency)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          day.efficiency >= 95 ? 'bg-green-100 text-green-700' :
                          day.efficiency >= 90 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {day.efficiency >= 95 ? '우수' : day.efficiency >= 90 ? '양호' : '주의'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      );
    }

    // Default: comprehensive view - only render if we have complete data structure
    if (!data.summary || !data.summary.key_metrics) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
          <p className="font-semibold">⚠️ 데이터를 불러오는 중입니다...</p>
          <p className="text-sm mt-2">잠시 후 다시 시도해주세요.</p>
        </div>
      );
    }

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card title="총 매출" icon="💰">
            <p className="text-3xl font-bold text-blue-600">{formatNumber(data.summary.key_metrics.total_sales)}</p>
            <p className="text-sm text-gray-500 mt-1">달성률: {formatPercent(data.summary.key_metrics.sales_achievement_rate)}</p>
          </Card>
          <Card title="생산량" icon="🏭">
            <p className="text-3xl font-bold text-green-600">{formatNumber(data.summary.key_metrics.total_produced)}</p>
            <p className="text-sm text-gray-500 mt-1">효율: {formatPercent(data.summary.key_metrics.production_efficiency)}</p>
          </Card>
          <Card title="품질 합격률" icon="✅">
            <p className="text-3xl font-bold text-purple-600">{formatPercent(data.summary.key_metrics.quality_pass_rate)}</p>
            <p className="text-sm text-gray-500 mt-1">평균 불량률: {formatPercent(data.quality.statistics.avg_defect_rate)}</p>
          </Card>
          <Card title="생산 효율" icon="⚡">
            <p className="text-3xl font-bold text-yellow-600">{formatPercent(data.production.statistics.avg_efficiency)}</p>
            <p className="text-sm text-gray-500 mt-1">달성률: {formatPercent(data.production.statistics.overall_achievement_rate)}</p>
          </Card>
          <Card title="분석 기간" icon="📅">
            <p className="text-3xl font-bold text-gray-800">{data.period_days}일</p>
            <p className="text-sm text-gray-500 mt-1">{data.period_months}개월</p>
          </Card>
        </div>

        {/* Recommendations */}
        <Card title="📋 개선 권장사항" icon="📋">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.summary.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <span className="text-blue-600 text-xl">🔔</span>
                <span className="text-gray-700 flex-1">{rec}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Module Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="📈 매출 현황" icon="📈">
            <Metric label="전월 대비" value="" change={data.sales.statistics.sales_change_rate} />
            <Metric label="달성률" value={formatPercent(data.sales.statistics.avg_achievement_rate)} />
            <Metric label="신규 고객" value={`${data.sales.statistics.total_new_customers}명`} />
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">주요 인사이트</p>
              {data.sales.insights.slice(0, 2).map((insight, idx) => (
                <p key={idx} className="text-sm text-gray-700">• {insight}</p>
              ))}
            </div>
          </Card>

          <Card title="✅ 품질 현황" icon="✅">
            <Metric label="평균 불량률" value={formatPercent(data.quality.statistics.avg_defect_rate)} />
            <Metric label="합격률" value={formatPercent(data.quality.statistics.pass_rate)} />
            <Metric label="검사 횟수" value={`${data.quality.statistics.total_inspections}회`} />
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">주요 인사이트</p>
              {data.quality.insights.slice(0, 2).map((insight, idx) => (
                <p key={idx} className="text-sm text-gray-700">• {insight}</p>
              ))}
            </div>
          </Card>

          <Card title="🏭 생산 현황" icon="🏭">
            <Metric label="평균 효율" value={formatPercent(data.production.statistics.avg_efficiency)} />
            <Metric label="불량률" value={formatPercent(data.production.statistics.defect_rate)} />
            <Metric label="달성률" value={formatPercent(data.production.statistics.overall_achievement_rate)} />
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">주요 인사이트</p>
              {data.production.insights.slice(0, 2).map((insight, idx) => (
                <p key={idx} className="text-sm text-gray-700">• {insight}</p>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Links to Detailed Analysis */}
        <Card title="🔗 상세 분석" icon="🔗">
          <p className="text-gray-600 mb-4">각 영역별 상세 분석을 확인하세요:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => setActiveTab('sales')}
            >
              <div className="font-semibold text-blue-600 mb-2">📈 매출 분석</div>
              <p className="text-sm text-gray-600">월별 매출, 목표 달성률, 신규 고객 추이</p>
            </div>
            <div
              className="p-4 border rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
              onClick={() => setActiveTab('quality')}
            >
              <div className="font-semibold text-green-600 mb-2">✅ 품질 분석</div>
              <p className="text-sm text-gray-600">불량률, 합격률, 제품별 품질 현황</p>
            </div>
            <div
              className="p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer"
              onClick={() => setActiveTab('production')}
            >
              <div className="font-semibold text-orange-600 mb-2">🏭 생산 분석</div>
              <p className="text-sm text-gray-600">생산량, 효율, 라인별 성과 분석</p>
            </div>
          </div>
        </Card>
      </>
    );
  };

  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case 'comprehensive': return '종합 분석';
      case 'sales': return '매출 분석';
      case 'quality': return '품질 분석';
      case 'production': return '생산 분석';
    }
  };

  const getTabIcon = (tab: TabType): string => {
    switch (tab) {
      case 'comprehensive': return '📊';
      case 'sales': return '📈';
      case 'quality': return '✅';
      case 'production': return '🏭';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 종합 데이터 분석</h1>
          <p className="text-gray-600 text-sm mt-1">전체 지표 요약 및 개선 권장사항</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>최근 30일</option>
            <option value={60}>최근 60일</option>
            <option value={90}>최근 90일 (3개월)</option>
            <option value={180}>최근 180일 (6개월)</option>
          </select>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['comprehensive', 'sales', 'quality', 'production'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{getTabIcon(tab)}</span>
            <span>{getTabLabel(tab)}</span>
          </button>
        ))}
      </div>

      {data && renderTabContent()}
    </div>
  );
};

export default LocalAnalysis;
