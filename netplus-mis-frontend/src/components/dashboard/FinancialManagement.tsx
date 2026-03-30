import React, { useState, useEffect } from 'react';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { ActivityIcon, TrendUpIcon, TrendDownIcon } from '@/components/icons/Icons';
import api from '@/services/api';
import dashboardDataService from '@/services/dashboardDataService';

interface FinancialStatement {
  id: number;
  statement_type: string;
  statement_type_display: string;
  fiscal_year: number;
  fiscal_month: number;
  revenue?: string;
  cost_of_sales?: string;
  gross_profit?: string;
  operating_expenses?: string;
  operating_income?: string;
  net_income?: string;
  total_assets?: string;
  current_assets?: string;
  non_current_assets?: string;
  total_liabilities?: string;
  total_equity?: string;
  operating_cashflow?: string;
  investing_cashflow?: string;
  financing_cashflow?: string;
  beginning_equity?: string;
  dividend_paid?: string;
  treasury_stock?: string;
  other_comprehensive_income?: string;
  ending_equity?: string;
}

const FinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow' | 'equity'>('income');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // ERP 매핑 서비스 사용 (재무/회계 대시보드)
        const financialRes = await dashboardDataService.dashboard.getFinancialDashboard({
          fiscal_year: '2024',
          fiscal_month: '12'
        });

        // ERP 매핑 데이터 변환 - 임시 처리
        // TODO: 실제 ERP DB 연결 후 데이터 구조 맵핑 필요
        const financialData = financialRes.results?.[0] || {};

        // 기존 API를 백업으로 사용
        const res = await api.financial.getStatements('fiscal_year=2024&fiscal_month=12');
        setStatements(Array.isArray(res) ? res : res.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentStatement = () => {
    // equity 탭의 경우 별도 타입이 없으므로 balance 타입 데이터를 사용
    const searchType = activeTab === 'equity' ? 'balance' : activeTab;
    return statements.find(s => s.statement_type === searchType);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'income': return { title: '손익계산서 (P/L)', desc: '매출 · 매출총이익 · 영업이익 · 순이익 요약' };
      case 'balance': return { title: '재무상태표 (B/S)', desc: '자산 · 부채 · 자본 구조' };
      case 'cashflow': return { title: '현금흐름표 (C/F)', desc: '영업 · 투자 · 재무 활동 현금흐름' };
      case 'equity': return { title: '자본변동표', desc: '기초자본 · 당기순이익 · 배당금 · 기말자본' };
    }
  };

  const getIncomeDetails = (statement: FinancialStatement) => [
    { label: '매출액', val: `${parseFloat(statement.revenue || '0').toFixed(1)}억`, type: 'header' },
    { label: '매출원가', val: `(${parseFloat(statement.cost_of_sales || '0').toFixed(1)}억)`, type: 'sub' },
    { label: '매출총이익', val: `${parseFloat(statement.gross_profit || '0').toFixed(1)}억`, type: 'total' },
    { label: '판매관리비', val: `(${parseFloat(statement.operating_expenses || '0').toFixed(1)}억)`, type: 'sub' },
    { label: '영업이익', val: `${parseFloat(statement.operating_income || '0').toFixed(1)}억`, type: 'header' },
    { label: '당기순이익', val: `${parseFloat(statement.net_income || '0').toFixed(1)}억`, type: 'total' }
  ];

  const getBalanceDetails = (statement: FinancialStatement) => [
    { label: '자산', val: `${parseFloat(statement.total_assets || '0').toFixed(1)}억`, type: 'header' },
    { label: '유동자산', val: `${parseFloat(statement.current_assets || '0').toFixed(1)}억`, type: 'sub' },
    { label: '비유동자산', val: `${parseFloat(statement.non_current_assets || '0').toFixed(1)}억`, type: 'sub' },
    { label: '부채', val: `${parseFloat(statement.total_liabilities || '0').toFixed(1)}억`, type: 'header' },
    { label: '자본', val: `${parseFloat(statement.total_equity || '0').toFixed(1)}억`, type: 'total' }
  ];

  const getCashflowDetails = (statement: FinancialStatement) => [
    { label: '영업활동 현금흐름', val: `${parseFloat(statement.operating_cashflow || '0').toFixed(1)}억`, type: 'header' },
    { label: '투자활동 현금흐름', val: `(${Math.abs(parseFloat(statement.investing_cashflow || '0')).toFixed(1)}억)`, type: 'header' },
    { label: '재무활동 현금흐름', val: `${parseFloat(statement.financing_cashflow || '0').toFixed(1)}억`, type: 'header' },
    {
      label: '현금 증감',
      val: `${(parseFloat(statement.operating_cashflow || '0') + parseFloat(statement.investing_cashflow || '0') + parseFloat(statement.financing_cashflow || '0')).toFixed(1)}억`,
      type: 'total'
    }
  ];

  const getEquityDetails = (statement: FinancialStatement) => [
    { label: '기초자본', val: `${parseFloat(statement.beginning_equity || '0').toFixed(1)}억`, type: 'header' },
    { label: '당기순이익', val: `+${parseFloat(statement.net_income || '0').toFixed(1)}억`, type: 'sub' },
    { label: '배당금 지급', val: `${parseFloat(statement.dividend_paid || '0').toFixed(1)}억`, type: 'sub' },
    { label: '자기주식', val: `${parseFloat(statement.treasury_stock || '0').toFixed(1)}억`, type: 'sub' },
    { label: '기타포괄손익', val: `+${parseFloat(statement.other_comprehensive_income || '0').toFixed(1)}억`, type: 'sub' },
    { label: '기말자본', val: `${parseFloat(statement.ending_equity || '0').toFixed(1)}억`, type: 'total' }
  ];

  const getChartData = (statement: FinancialStatement) => {
    if (activeTab === 'income') {
      return {
        labels: ['매출액', '매출원가', '판관비', '영업이익'],
        datasets: [{
          label: '금액 (억원)',
          data: [
            parseFloat(statement.revenue || '0'),
            parseFloat(statement.cost_of_sales || '0'),
            parseFloat(statement.operating_expenses || '0'),
            parseFloat(statement.operating_income || '0')
          ],
          backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      };
    } else if (activeTab === 'balance') {
      return {
        labels: ['총자산', '부채', '자본'],
        datasets: [{
          label: '금액 (억원)',
          data: [
            parseFloat(statement.total_assets || '0'),
            parseFloat(statement.total_liabilities || '0'),
            parseFloat(statement.total_equity || '0')
          ],
          backgroundColor: ['#8b5cf6', '#ec4899', '#06b6d4'],
          borderWidth: 0
        }]
      };
    } else if (activeTab === 'cashflow') {
      const data = [
        parseFloat(statement.operating_cashflow || '0'),
        parseFloat(statement.investing_cashflow || '0'),
        parseFloat(statement.financing_cashflow || '0')
      ];
      return {
        labels: ['영업활동', '투자활동', '재무활동'],
        datasets: [{
          label: '금액 (억원)',
          data: data,
          backgroundColor: data.map(v => v >= 0 ? '#10b981' : '#ef4444'),
          borderWidth: 0
        }]
      };
    } else {
      // equity
      const data = [
        parseFloat(statement.net_income || '0'),
        Math.abs(parseFloat(statement.dividend_paid || '0')),
        parseFloat(statement.other_comprehensive_income || '0')
      ];
      return {
        labels: ['당기순이익', '배당금', '기타포괄손익'],
        datasets: [{
          label: '금액 (억원)',
          data: data,
          backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
          borderWidth: 0
        }]
      };
    }
  };

  if (loading) {
    return <LoadingState message="재무 데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const currentStatement = getCurrentStatement();
  const tabInfo = getTabTitle();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">재무 관리</h1>
        </div>
        <p className="text-blue-100">손익계산서, 재무상태표, 현금흐름표, 자본변동표를 한눈에 확인하세요</p>
      </div>

      {/* 탭 버튼 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 flex-wrap">
          {(['income', 'balance', 'cashflow', 'equity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'income' ? '손익계산서' : tab === 'balance' ? '재무상태표' : tab === 'cashflow' ? '현금흐름표' : '자본변동표'}
            </button>
          ))}
        </div>
      </div>

      {currentStatement && (
        <>
          {/* 메인 컨텐츠 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 차트 */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800">{tabInfo.title}</h3>
                <p className="text-sm text-gray-500">{tabInfo.desc}</p>
              </div>
              <ChartComponent
                type={(activeTab === 'cashflow' || activeTab === 'equity') ? 'bar' : 'doughnut'}
                data={getChartData(currentStatement)}
                options={{
                  plugins: {
                    legend: { position: (activeTab === 'cashflow' || activeTab === 'equity') ? 'top' : 'right' }
                  }
                }}
                height={300}
              />
            </div>

            {/* 상세 내역 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">상세 내역</h3>
              <p className="text-sm text-gray-500 mb-4">2024년 12월 기준</p>

              <div className="space-y-2">
                {(activeTab === 'income' ? getIncomeDetails(currentStatement) :
                  activeTab === 'balance' ? getBalanceDetails(currentStatement) :
                  activeTab === 'cashflow' ? getCashflowDetails(currentStatement) :
                  getEquityDetails(currentStatement)
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      item.type === 'header' ? 'bg-blue-50 font-bold' :
                      item.type === 'total' ? 'bg-green-50 font-bold text-green-700' :
                      'bg-gray-50'
                    }`}
                  >
                    <span className={item.type === 'sub' ? 'pl-4 text-gray-600' : ''}>
                      {item.label}
                    </span>
                    <span>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 주요 지표 */}
          {activeTab !== 'equity' ? (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">주요 재무 지표</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">매출액</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(currentStatement.revenue || '0').toFixed(0)}억</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">영업이익</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(currentStatement.operating_income || '0').toFixed(1)}억</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">당기순이익</p>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(currentStatement.net_income || '0').toFixed(1)}억</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">총자산</p>
                <p className="text-2xl font-bold text-yellow-600">{parseFloat(currentStatement.total_assets || '0').toFixed(0)}억</p>
              </div>
            </div>
          </div>
          ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">자본 변동 요약</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">기초자본</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(currentStatement.beginning_equity || '0').toFixed(0)}억</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">당기순이익</p>
                <p className="text-2xl font-bold text-green-600">{parseFloat(currentStatement.net_income || '0').toFixed(0)}억</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">배당금 지급</p>
                <p className="text-2xl font-bold text-red-600">{parseFloat(currentStatement.dividend_paid || '0').toFixed(0)}억</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">기말자본</p>
                <p className="text-2xl font-bold text-purple-600">{parseFloat(currentStatement.ending_equity || '0').toFixed(0)}억</p>
              </div>
            </div>
          </div>
          )}

          {/* 이익률 분석 */}
          {activeTab !== 'equity' && activeTab !== 'balance' && activeTab !== 'cashflow' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">이익률 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">매출총이익률</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendUpIcon size={16} />
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {((parseFloat(currentStatement.gross_profit || '0') / parseFloat(currentStatement.revenue || '1')) * 100).toFixed(1)}%
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(parseFloat(currentStatement.gross_profit || '0') / parseFloat(currentStatement.revenue || '1')) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">영업이익률</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendUpIcon size={16} />
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {((parseFloat(currentStatement.operating_income || '0') / parseFloat(currentStatement.revenue || '1')) * 100).toFixed(1)}%
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(parseFloat(currentStatement.operating_income || '0') / parseFloat(currentStatement.revenue || '1')) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">순이익률</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendUpIcon size={16} />
                  </span>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {((parseFloat(currentStatement.net_income || '0') / parseFloat(currentStatement.revenue || '1')) * 100).toFixed(1)}%
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(parseFloat(currentStatement.net_income || '0') / parseFloat(currentStatement.revenue || '1')) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialManagement;
