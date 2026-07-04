import React, { useState, useEffect } from 'react';
import {
  TrendUpIcon,
  TrendDownIcon,
  ActivityIcon,
  DollarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BarChartIcon,
  PieChartIcon,
  FilterIcon,
  DownloadIcon,
  SettingsIcon
} from '@/components/icons/Icons';
import { fetchCostDriverAnalysis } from '@/services/costService';

interface CostDriver {
  id: string;
  name: string;
  dimension: 'MAN' | 'MACHINE' | 'MATERIAL' | 'METHOD' | 'ENVIRO';
  category: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  description: string;
  optimizationPotential: number;
  actions: DriverAction[];
}

interface DriverAction {
  id: string;
  action: string;
  estimatedSavings: number;
  implementationTime: string;
  priority: 'high' | 'medium' | 'low';
  status: 'proposed' | 'in_progress' | 'completed';
}

interface DriverHierarchy {
  dimension: string;
  drivers: CostDriver[];
  subDrivers?: DriverHierarchy[];
}

const CostDriverAnalysis: React.FC = () => {
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [costDrivers, setCostDrivers] = useState<CostDriver[]>([]);
  const [driverTree, setDriverTree] = useState<DriverHierarchy[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'impact'>('tree');

  const dimensions = [
    { id: 'ALL', name: '전체', nameEn: 'All', color: '#6B7280' },
    { id: 'MAN', name: '사람(Man)', nameEn: 'Manpower', color: '#3B82F6' },
    { id: 'MACHINE', name: '설비(Machine)', nameEn: 'Equipment', color: '#EF4444' },
    { id: 'MATERIAL', name: '자재(Material)', nameEn: 'Material', color: '#F59E0B' },
    { id: 'METHOD', name: '방법(Method)', nameEn: 'Process', color: '#10B981' },
    { id: 'ENVIRO', name: '환경(Environ)', nameEn: 'Environment', color: '#8B5CF6' }
  ];

  useEffect(() => {
    fetchCostDrivers(selectedDimension, selectedPeriod);
  }, [selectedDimension, selectedPeriod]);

  const fetchCostDrivers = async (dimension: string, period: string) => {
    // API 호출
    const result = await fetchCostDriverAnalysis(dimension, period);

    let drivers: CostDriver[] = [];

    if (result.data && result.data.drivers) {
      drivers = result.data.drivers;
    } else {
      // API 호출 실패 시 모의 데이터 사용
      drivers = getMockDrivers();
    }

    // 필터링
    const filteredDrivers = dimension === 'ALL'
      ? drivers
      : drivers.filter(d => d.dimension === dimension);

    setCostDrivers(filteredDrivers);

    // 드라이버 트리 구성
    buildDriverTree(filteredDrivers);
  };

  const getMockDrivers = (): CostDriver[] => {
    return [
      {
        id: 'MAN-001',
        name: '생산직원 급여',
        dimension: 'MAN',
        category: '직접 인건비',
        currentValue: 35000000,
        previousValue: 33300000,
        changePercentage: 5.2,
        impact: 'high',
        trend: 'up',
        description: '생산 직원들의 기본급 및 수당',
        optimizationPotential: 15,
        actions: [
          {
            id: 'ACT-001',
            action: '자동화 도입으로 작업 효율화',
            estimatedSavings: 5250000,
            implementationTime: '3개월',
            priority: 'high',
            status: 'proposed'
          },
          {
            id: 'ACT-002',
            action: '교차 교육으로 다기능화',
            estimatedSavings: 3500000,
            implementationTime: '2개월',
            priority: 'medium',
            status: 'in_progress'
          }
        ]
      },
      {
        id: 'MAN-002',
        name: '간접 인건비',
        dimension: 'MAN',
        category: '경비',
        currentValue: 10000000,
        previousValue: 9800000,
        changePercentage: 2.0,
        impact: 'medium',
        trend: 'up',
        description: '관리 및 지원 직원 급여',
        optimizationPotential: 8,
        actions: [
          {
            id: 'ACT-003',
            action: '업무 프로세스 자동화',
            estimatedSavings: 800000,
            implementationTime: '4개월',
            priority: 'medium',
            status: 'proposed'
          }
        ]
      },
      {
        id: 'MACHINE-001',
        name: '설비 교체비',
        dimension: 'MACHINE',
        category: '유지보수',
        currentValue: 15000000,
        previousValue: 18000000,
        changePercentage: -16.7,
        impact: 'high',
        trend: 'down',
        description: '노후 설비 교체 및升级 비용',
        optimizationPotential: 20,
        actions: [
          {
            id: 'ACT-004',
            action: '예지 보전 시스템 도입',
            estimatedSavings: 3000000,
            implementationTime: '2개월',
            priority: 'high',
            status: 'proposed'
          }
        ]
      },
      {
        id: 'MACHINE-002',
        name: '에너지 비용',
        dimension: 'MACHINE',
        category: '운영비',
        currentValue: 12000000,
        previousValue: 11500000,
        changePercentage: 4.3,
        impact: 'medium',
        trend: 'up',
        description: '설비 가동 에너지 비용',
        optimizationPotential: 12,
        actions: [
          {
            id: 'ACT-005',
            action: '에너지 효율 개선 프로젝트',
            estimatedSavings: 1440000,
            implementationTime: '6개월',
            priority: 'medium',
            status: 'proposed'
          }
        ]
      },
      {
        id: 'MATERIAL-001',
        name: '원자재 구매비',
        dimension: 'MATERIAL',
        category: '직접 자재비',
        currentValue: 25000000,
        previousValue: 24000000,
        changePercentage: 4.2,
        impact: 'high',
        trend: 'up',
        description: '주요 원자재 구매 비용',
        optimizationPotential: 10,
        actions: [
          {
            id: 'ACT-006',
            action: '다중 공급업체 전략',
            estimatedSavings: 2500000,
            implementationTime: '3개월',
            priority: 'high',
            status: 'in_progress'
          }
        ]
      },
      {
        id: 'METHOD-001',
        name: '공정 최적화',
        dimension: 'METHOD',
        category: '프로세스',
        currentValue: 8000000,
        previousValue: 8500000,
        changePercentage: -5.9,
        impact: 'medium',
        trend: 'down',
        description: '생산 공정 개선 비용',
        optimizationPotential: 18,
        actions: [
          {
            id: 'ACT-007',
            action: 'Lean 생산 방법론 도입',
            estimatedSavings: 1440000,
            implementationTime: '4개월',
            priority: 'high',
            status: 'proposed'
          }
        ]
      },
      {
        id: 'ENVIRO-001',
        name: '환경 규제 비용',
        dimension: 'ENVIRO',
        category: '환경',
        currentValue: 3500000,
        previousValue: 3200000,
        changePercentage: 9.4,
        impact: 'low',
        trend: 'up',
        description: '환경 규제 준수 비용',
        optimizationPotential: 5,
        actions: [
          {
            id: 'ACT-008',
            action: '친환경 공정 전환',
            estimatedSavings: 175000,
            implementationTime: '12개월',
            priority: 'low',
            status: 'proposed'
          }
        ]
      }
    ];
  };

  const buildDriverTree = (drivers: CostDriver[]) => {
    const tree: DriverHierarchy[] = [];

    // 차원별로 그룹화
    const dimensionGroups = drivers.reduce((acc, driver) => {
      if (!acc[driver.dimension]) {
        acc[driver.dimension] = [];
      }
      acc[driver.dimension].push(driver);
      return acc;
    }, {} as Record<string, CostDriver[]>);

    // 트리 구조 생성
    Object.keys(dimensionGroups).forEach(dimensionId => {
      const dimension = dimensions.find(d => d.id === dimensionId);
      if (dimension) {
        tree.push({
          dimension: dimensionId,
          drivers: dimensionGroups[dimensionId]
        });
      }
    });

    setDriverTree(tree);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon size={16} className="text-green-600" />;
      case 'in_progress': return <ActivityIcon size={16} className="text-blue-600" />;
      default: return <AlertTriangleIcon size={16} className="text-gray-400" />;
    }
  };

  const totalOptimizationPotential = costDrivers.reduce((sum, driver) => {
    return sum + (driver.currentValue * driver.optimizationPotential / 100);
  }, 0);

  const highImpactDrivers = costDrivers.filter(d => d.impact === 'high');
  const actionableDrivers = costDrivers.filter(d => d.actions.some(a => a.status === 'proposed'));

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">4M2E 코스 드라이버 분석</h2>
          <p className="text-gray-600 mt-1">비용 드라이버 식별 및 최적화 기회 분석</p>
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
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FilterIcon size={20} />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <DownloadIcon size={20} />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* 차원 필터 */}
      <div className="flex gap-2 mb-6">
        {dimensions.map((dimension) => (
          <button
            key={dimension.id}
            onClick={() => setSelectedDimension(dimension.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedDimension === dimension.id
                ? 'text-white shadow-md'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
            style={selectedDimension === dimension.id ? { backgroundColor: dimension.color } : {}}
          >
            {dimension.name}
          </button>
        ))}
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ActivityIcon size={20} className="text-blue-600" />
            <p className="text-sm text-blue-600">전체 드라이버</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{costDrivers.length}</p>
          <p className="text-xs text-gray-600">개 항목</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangleIcon size={20} className="text-red-600" />
            <p className="text-sm text-red-600">높은 영향도</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{highImpactDrivers.length}</p>
          <p className="text-xs text-gray-600">개 항목</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendUpIcon size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-600">최적화 가능액</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalOptimizationPotential)}</p>
          <p className="text-xs text-gray-600">잠적 절감 효과</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarIcon size={20} className="text-green-600" />
            <p className="text-sm text-green-600">실행 가능</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{actionableDrivers.length}</p>
          <p className="text-xs text-gray-600">개 개선안</p>
        </div>
      </div>

      {/* 뷰 모드 전환 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('tree')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'tree'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChartIcon size={16} />
          트리 뷰
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ActivityIcon size={16} />
          리스트 뷰
        </button>
        <button
          onClick={() => setViewMode('impact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'impact'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <PieChartIcon size={16} />
          영향도 분석
        </button>
      </div>

      {/* 트리 뷰 */}
      {viewMode === 'tree' && (
        <div className="space-y-4">
          {driverTree.map((node, index) => {
            const dimension = dimensions.find(d => d.id === node.dimension);
            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: dimension?.color }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dimension?.id === 'MAN' ? '👥' :
                      dimension?.id === 'MACHINE' ? '🏭️' :
                      dimension?.id === 'MATERIAL' ? '📦' :
                      dimension?.id === 'METHOD' ? '⚙️' : '🌍'}</span>
                    <div>
                      <p className="font-semibold text-white">{dimension?.name}</p>
                      <p className="text-xs text-white opacity-90">{node.drivers.length}개 드라이버</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(node.drivers.reduce((sum, d) => sum + d.currentValue, 0))}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {node.drivers.map((driver) => (
                    <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{driver.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(driver.impact)}`}>
                              {driver.impact === 'high' ? '높음' : driver.impact === 'medium' ? '중간' : '낮음'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{driver.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">현재: {formatCurrency(driver.currentValue)}</span>
                            <span className={`flex items-center gap-1 ${
                              driver.trend === 'up' ? 'text-red-600' :
                              driver.trend === 'down' ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {driver.trend === 'up' ? <TrendUpIcon size={14} /> :
                               driver.trend === 'down' ? <TrendDownIcon size={14} /> : null}
                              {driver.changePercentage > 0 ? '+' : ''}{driver.changePercentage}%
                            </span>
                            <span className="text-blue-600">최적화: {driver.optimizationPotential}%</span>
                          </div>
                        </div>
                      </div>

                      {/* 개선안 */}
                      {driver.actions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm font-semibold text-gray-700 mb-2">개선안 ({driver.actions.length})</p>
                          <div className="space-y-2">
                            {driver.actions.map((action) => (
                              <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                {getStatusIcon(action.status)}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{action.action}</p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                    <span>예상 절감: {formatCurrency(action.estimatedSavings)}</span>
                                    <span>구현 기간: {action.implementationTime}</span>
                                    <span className={`px-2 py-0.5 rounded border ${getPriorityColor(action.priority)}`}>
                                      {action.priority === 'high' ? '높음' : action.priority === 'medium' ? '중간' : '낮음'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">드라이버</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">차원</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">현재 금액</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">변화</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">영향도</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">최적화 가능</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">개선안</th>
              </tr>
            </thead>
            <tbody>
              {costDrivers.map((driver) => {
                const dimension = dimensions.find(d => d.id === driver.dimension);
                return (
                  <tr key={driver.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{driver.name}</p>
                        <p className="text-xs text-gray-600">{driver.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <span>{dimension?.id === 'MAN' ? '👥' :
                          dimension?.id === 'MACHINE' ? '🏭️' :
                          dimension?.id === 'MATERIAL' ? '📦' :
                          dimension?.id === 'METHOD' ? '⚙️' : '🌍'}</span>
                        <span className="text-sm">{dimension?.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {formatCurrency(driver.currentValue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-sm ${
                        driver.trend === 'up' ? 'text-red-600' :
                        driver.trend === 'down' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {driver.trend === 'up' ? <TrendUpIcon size={14} /> :
                         driver.trend === 'down' ? <TrendDownIcon size={14} /> : null}
                        {driver.changePercentage > 0 ? '+' : ''}{driver.changePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(driver.impact)}`}>
                        {driver.impact === 'high' ? '높음' : driver.impact === 'medium' ? '중간' : '낮음'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${driver.optimizationPotential}%` }}
                          />
                        </div>
                        <span className="text-sm">{driver.optimizationPotential}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-blue-600">{driver.actions.length}개</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 영향도 분석 뷰 */}
      {viewMode === 'impact' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {costDrivers.map((driver) => {
            const dimension = dimensions.find(d => d.id === driver.dimension);
            const impactSize = driver.impact === 'high' ? 'lg' : driver.impact === 'medium' ? 'md' : 'sm';
            const impactColor = driver.impact === 'high' ? 'bg-red-500' :
                               driver.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dimension?.id === 'MAN' ? '👥' :
                      dimension?.id === 'MACHINE' ? '🏭️' :
                      dimension?.id === 'MATERIAL' ? '📦' :
                      dimension?.id === 'METHOD' ? '⚙️' : '🌍'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{driver.name}</p>
                      <p className="text-xs text-gray-600">{dimension?.name}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${impactColor}`} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">현재 코스트</span>
                    <span className="font-semibold">{formatCurrency(driver.currentValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">최적화 가능</span>
                    <span className="font-semibold text-blue-600">{driver.optimizationPotential}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">예상 절감액</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(driver.currentValue * driver.optimizationPotential / 100)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-2">영향도 버블:</p>
                  <div
                    className={`rounded-full ${impactColor} bg-opacity-20 flex items-center justify-center text-white font-semibold`}
                    style={{
                      width: driver.impact === 'high' ? '120px' :
                             driver.impact === 'medium' ? '90px' : '60px',
                      height: driver.impact === 'high' ? '120px' :
                              driver.impact === 'medium' ? '90px' : '60px',
                      backgroundColor: impactColor
                    }}
                  >
                    {driver.impact === 'high' ? '높음' :
                     driver.impact === 'medium' ? '중간' : '낮음'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CostDriverAnalysis;
