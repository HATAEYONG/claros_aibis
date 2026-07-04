import React, { useState, useEffect } from 'react';
import {
  PieChartIcon,
  BarChartIcon,
  TrendUpIcon,
  ActivityIcon,
  DollarIcon,
  FactoryIcon,
  UsersIcon,
  SettingsIcon
} from '@/components/icons/Icons';
import { fetchCostBreakdown4M2E } from '@/services/costService';

interface CostDimension {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

interface CostBreakdownItem {
  dimension: string;
  category: string;
  amount: number;
  percentage: number;
  details: CostBreakdownDetail[];
}

interface CostBreakdownDetail {
  item: string;
  amount: number;
  description: string;
  driver: string;
}

const CostBreakdown: React.FC = () => {
  const [selectedDimension, setSelectedDimension] = useState<string>('MAN');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [costData, setCostData] = useState<CostBreakdownItem[]>([]);
  const [dimensions, setDimensions] = useState<CostDimension[]>([
    {
      id: 'MAN',
      name: '사람(Man)',
      nameEn: 'Manpower',
      icon: '👥',
      color: '#3B82F6',
      value: 125000000,
      percentage: 35,
      trend: 'up',
      changePercentage: 5.2
    },
    {
      id: 'MACHINE',
      name: '설비(Machine)',
      nameEn: 'Equipment',
      icon: '🏭️',
      color: '#EF4444',
      value: 98000000,
      percentage: 27,
      trend: 'down',
      changePercentage: -2.1
    },
    {
      id: 'MATERIAL',
      name: '자재(Material)',
      nameEn: 'Material',
      icon: '📦',
      color: '#F59E0B',
      value: 78000000,
      percentage: 22,
      trend: 'up',
      changePercentage: 3.8
    },
    {
      id: 'METHOD',
      name: '방법(Method)',
      nameEn: 'Process',
      icon: '⚙️',
      color: '#10B981',
      value: 52000000,
      percentage: 14,
      trend: 'stable',
      changePercentage: 0.5
    },
    {
      id: 'ENVIRO',
      name: '환경(Environ)',
      nameEn: 'Environment',
      icon: '🌍',
      color: '#8B5CF6',
      value: 7000000,
      percentage: 2,
      trend: 'down',
      changePercentage: -1.2
    }
  ]);

  // 코스 데이터 조회 - 기본 데이터 로딩
  useEffect(() => {
    fetchCostBreakdown();
  }, [selectedDimension, selectedPeriod]);

  // 선택된 차원이 변경될 때 상세 코스 데이터 로딩
  useEffect(() => {
    loadMockData();
  }, [selectedDimension]);

  const fetchCostBreakdown = async () => {
    // API 호출
    const result = await fetchCostBreakdown4M2E(selectedPeriod, '2024-12');

    if (result.data) {
      // API 데이터로 차원 설정
      if (result.data.dimensions) {
        setDimensions(result.data.dimensions);
      }
    }
    // 상세 코스 데이터는 별도의 useEffect에서 loadMockData 호출
  };

  const loadMockData = () => {
    // 실제 API 호출 (또는 모의 데이터)
    const mockData: CostBreakdownItem[] = [
      {
        dimension: selectedDimension,
        category: '직접 인건비',
        amount: 45000000,
        percentage: 36,
        details: [
          { item: '생산직원 급여', amount: 35000000, description: '정규직', driver: 'MAN' },
          { item: '간접 인건비', amount: 10000000, description: '관리/지원', driver: 'MAN' }
        ]
      },
      {
        dimension: selectedDimension,
        category: '경비',
        amount: 32000000,
        percentage: 26,
        details: [
          { item: '교육비', amount: 15000000, description: '기술 교육', driver: 'MAN' },
          { item: '복리후생비', amount: 10000000, description: '복지/의료', driver: 'MAN' },
          { item: '기타 경비', amount: 7000000, description: '식대/교통', driver: 'MAN' }
        ]
      },
      {
        dimension: selectedDimension,
        category: '감가상각비',
        amount: 28000000,
        percentage: 22,
        details: [
          { item: '감가상각', amount: 20000000, description: '감가상각', driver: 'MAN' },
          { item: '퇴직급', amount: 8000000, description: '퇴직급', driver: 'MAN' }
        ]
      },
      {
        dimension: selectedDimension,
        category: '기타',
        amount: 20000000,
        percentage: 16,
        details: [
          { item: '복리후생비', amount: 10000000, description: '복리후생비', driver: 'MAN' },
          { item: '기타', amount: 10000000, description: '기타', driver: 'MAN' }
        ]
      }
    ];

    setCostData(mockData);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDimensionDetails = (dimensionId: string) => {
    const dimension = dimensions.find(d => d.id === dimensionId);
    return dimension;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">4M2E 코스 분석</h2>
          <p className="text-gray-600 mt-1">Man, Machine, Material, Method, Environment 차원별 코스 분석</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="month">월간</option>
            <option value="quarter">분기</option>
            <option value="year">연간</option>
          </select>
        </div>
      </div>

      {/* 4M2E 차원 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {dimensions.map((dimension) => (
          <div
            key={dimension.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedDimension === dimension.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:shadow-md'
            }`}
            onClick={() => setSelectedDimension(dimension.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">{dimension.icon}</span>
              <div>
                <p className="font-bold text-gray-800">{dimension.name}</p>
                <p className="text-xs text-gray-500">{dimension.nameEn}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">코스트</span>
                <span className={`font-semibold ${
                  dimension.trend === 'up' ? 'text-green-600' :
                  dimension.trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {formatCurrency(dimension.value)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    dimension.trend === 'up' ? 'bg-green-500' :
                    dimension.trend === 'down' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${dimension.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">비중: {dimension.percentage}%</span>
                <span className={dimension.trend === 'up' ? 'text-green-600' : dimension.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                  {dimension.trend === 'up' ? '↑' : dimension.trend === 'down' ? '↓' : '→'} {Math.abs(dimension.changePercentage)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 코스 분석 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {getDimensionDetails(selectedDimension)?.name} 상세 코스 분석
            </h3>
            <p className="text-sm text-gray-600">
              {getDimensionDetails(selectedDimension)?.nameEn} Dimension Details
            </p>
          </div>
        </div>

        {/* 코스 브레크다운 차트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 파이 차트 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">비율 분석</h4>
            <div className="space-y-3">
              {costData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <span className="text-xs text-gray-500">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 트렌드 차트 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">월별 추이</h4>
            <div className="h-48 flex items-end justify-between gap-1">
              {['1월', '2월', '3월', '4월', '5월', '6월'].map((month, idx) => {
                const values = [85, 82, 90, 88, 92, 87];
                const value = values[idx];
                const height = ((value - 75) / 25) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${Math.min(Math.max(height, 0), 100)}%` }}
                    />
                    <span className="text-xs text-gray-600">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 상세 내역 테이블 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">코스트 항계</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">비율</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상세</th>
              </tr>
            </thead>
            <tbody>
              {costData.map((item, index) => (
                <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{item.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span>{item.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <button
                      onClick={() => {/* 상세 보기 */}}
                      className="text-blue-600 hover:underline"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 코스 드라이버 분석 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <ActivityIcon size={18} />
            주요 코스 드라이버
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">상위 드라이버</p>
              <p className="text-sm font-semibold text-gray-800">생산직원 급여</p>
              <p className="text-xs text-gray-600">{formatCurrency(35000000)} (28%)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">개선 필요</p>
              <p className="text-sm font-semibold text-gray-800">기계 교체비</p>
              <p className="text-xs text-gray-600">{formatCurrency(15000000)} (12%)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">감가비</p>
              <p className="text-sm font-semibold text-gray-800">감가상각</p>
              <p className="text-xs text-gray-600">{formatCurrency(20000000)} (16%)</p>
            </div>
          </div>
        </div>

        {/* 최적화 제안 */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
            <TrendUpIcon size={18} />
            {getDimensionDetails(selectedDimension)?.name} 최적화 제안
          </h4>
          <ul className="text-sm text-green-700 space-y-2">
            <li>• 자동화 도입으로 인건비 15% 절감 가능</li>
            <li>• 근무시간 탄력 배치로 생산성 20% 향상 기대</li>
            <li>• 예지 보전 유지보수 관리로 불량 비용 12% 절감</li>
            <li>• 에너지 효율화로 설비 가동률 개선</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;
