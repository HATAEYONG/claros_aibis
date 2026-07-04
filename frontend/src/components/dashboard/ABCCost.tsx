import React, { useState, useMemo } from 'react';
import {
  DollarIcon,
  TrendUpIcon,
  ActivityIcon,
  SettingsIcon,
  BarChartIcon,
  PieChartIcon
} from '@/components/icons/Icons';

interface CostPool {
  id: string;
  name: string;
  totalCost: number;
  costDriver: string;
  driverQuantity: number;
  costPerDriver: number;
}

interface CostObject {
  id: string;
  name: string;
  productLine: string;
  directCost: number;
  indirectCosts: {
    poolId: string;
    poolName: string;
    cost: number;
  }[];
  totalCost: number;
  unitCost: number;
  productionVolume: number;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  costPoolId: string;
  costPoolName: string;
  resourceCost: number;
  timePercentage: number;
}

const ABCCost: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pools' | 'objects' | 'activities' | 'analysis'>('overview');

  // 코스트 풀 (Cost Pool) 데이터
  const [costPools, setCostPools] = useState<CostPool[]>([
    {
      id: 'cp-1',
      name: '설비 가동',
      totalCost: 120000000,
      costDriver: '기계시간',
      driverQuantity: 10000,
      costPerDriver: 12000
    },
    {
      id: 'cp-2',
      name: '품질 검사',
      totalCost: 45000000,
      costDriver: '검사건수',
      driverQuantity: 5000,
      costPerDriver: 9000
    },
    {
      id: 'cp-3',
      name: '자재 운반',
      totalCost: 35000000,
      costDriver: '운반횟수',
      driverQuantity: 8000,
      costPerDriver: 4375
    },
    {
      id: 'cp-4',
      name: '생산 준비',
      totalCost: 28000000,
      costDriver: '셋업횟수',
      driverQuantity: 2000,
      costPerDriver: 14000
    },
    {
      id: 'cp-5',
      name: '설비 유지보수',
      totalCost: 32000000,
      costDriver: '보수시간',
      driverQuantity: 1500,
      costPerDriver: 21333
    }
  ]);

  // 코스트 오브젝트 (Cost Object) 데이터
  const [costObjects, setCostObjects] = useState<CostObject[]>([
    {
      id: 'co-1',
      name: '제품 A',
      productLine: '정밀부품',
      directCost: 85000000,
      indirectCosts: [
        { poolId: 'cp-1', poolName: '설비 가동', cost: 48000000 },
        { poolId: 'cp-2', poolName: '품질 검사', cost: 18000000 },
        { poolId: 'cp-3', poolName: '자재 운반', cost: 8750000 },
        { poolId: 'cp-4', poolName: '생산 준비', cost: 8400000 },
        { poolId: 'cp-5', poolName: '설비 유지보수', cost: 6400000 }
      ],
      totalCost: 174150000,
      unitCost: 174150,
      productionVolume: 1000
    },
    {
      id: 'co-2',
      name: '제품 B',
      productLine: '일반부품',
      directCost: 52000000,
      indirectCosts: [
        { poolId: 'cp-1', poolName: '설비 가동', cost: 36000000 },
        { poolId: 'cp-2', poolName: '품질 검사', cost: 13500000 },
        { poolId: 'cp-3', poolName: '자재 운반', cost: 13125000 },
        { poolId: 'cp-4', poolName: '생산 준비', cost: 11200000 },
        { poolId: 'cp-5', poolName: '설비 유지보수', cost: 12800000 }
      ],
      totalCost: 138625000,
      unitCost: 138625,
      productionVolume: 1000
    },
    {
      id: 'co-3',
      name: '제품 C',
      productLine: '고급부품',
      directCost: 125000000,
      indirectCosts: [
        { poolId: 'cp-1', poolName: '설비 가동', cost: 36000000 },
        { poolId: 'cp-2', poolName: '품질 검사', cost: 13500000 },
        { poolId: 'cp-3', poolName: '자재 운반', cost: 13125000 },
        { poolId: 'cp-4', poolName: '생산 준비', cost: 8400000 },
        { poolId: 'cp-5', poolName: '설비 유지보수', cost: 12800000 }
      ],
      totalCost: 208625000,
      unitCost: 208625,
      productionVolume: 1000
    }
  ]);

  // 활동 (Activity) 데이터
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      name: 'CNC 가공',
      description: 'CNC 선반을 이용한 정밀 가공',
      costPoolId: 'cp-1',
      costPoolName: '설비 가동',
      resourceCost: 85000000,
      timePercentage: 70
    },
    {
      id: 'act-2',
      name: '조립 작업',
      description: '부품 조립 및 체결',
      costPoolId: 'cp-1',
      costPoolName: '설비 가동',
      resourceCost: 35000000,
      timePercentage: 30
    },
    {
      id: 'act-3',
      name: '입고 검사',
      description: '자재 입구시 품질 검사',
      costPoolId: 'cp-2',
      costPoolName: '품질 검사',
      resourceCost: 25000000,
      timePercentage: 55
    },
    {
      id: 'act-4',
      name: '공정 검사',
      description: '생산 공정별 품질 검사',
      costPoolId: 'cp-2',
      costPoolName: '품질 검사',
      resourceCost: 20000000,
      timePercentage: 45
    },
    {
      id: 'act-5',
      name: '창고 운반',
      description: '창고 내 자재 이동',
      costPoolId: 'cp-3',
      costPoolName: '자재 운반',
      resourceCost: 20000000,
      timePercentage: 60
    },
    {
      id: 'act-6',
      name: '라인 운반',
      description: '생산 라인 간 자재 운반',
      costPoolId: 'cp-3',
      costPoolName: '자재 운반',
      resourceCost: 15000000,
      timePercentage: 40
    }
  ]);

  // 집계 데이터
  const summary = useMemo(() => {
    const totalPoolCost = costPools.reduce((sum, pool) => sum + pool.totalCost, 0);
    const totalObjectCost = costObjects.reduce((sum, obj) => sum + obj.totalCost, 0);
    const avgUnitCost = costObjects.reduce((sum, obj) => sum + obj.unitCost, 0) / costObjects.length;
    const totalActivityCost = activities.reduce((sum, act) => sum + act.resourceCost, 0);

    return {
      totalPoolCost,
      totalObjectCost,
      avgUnitCost,
      totalActivityCost,
      poolCount: costPools.length,
      objectCount: costObjects.length,
      activityCount: activities.length
    };
  }, [costPools, costObjects, activities]);

  const formatCurrency = (value: number): string => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만원`;
    }
    return `${value.toLocaleString()}원`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // 탭 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* KPI 카드 - 그라데이션 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-blue-100">총 코스트 풀</span>
                  <BarChartIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{formatCurrency(summary.totalPoolCost)}</div>
                <div className="text-xs text-blue-100 mt-1">{summary.poolCount}개 풀</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-green-100">코스트 오브젝트</span>
                  <DollarIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{formatCurrency(summary.totalObjectCost)}</div>
                <div className="text-xs text-green-100 mt-1">{summary.objectCount}개 제품</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-purple-100">평균 단위 원가</span>
                  <TrendUpIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{formatNumber(Math.round(summary.avgUnitCost))}원</div>
                <div className="text-xs text-purple-100 mt-1">단당 평균</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl shadow-md text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-orange-100">활동 수</span>
                  <ActivityIcon size={18} className="text-white/80" />
                </div>
                <div className="text-3xl font-bold">{summary.activityCount}개</div>
                <div className="text-xs text-orange-100 mt-1">{formatCurrency(summary.totalActivityCost)}</div>
              </div>
            </div>

            {/* ABC 개요 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ABC 원가계산 개요</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">기본 개념</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span><strong>코스트 풀:</strong> 유사한 활동들의 비용 집합</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span><strong>코스트 드라이버:</strong> 활동과 비용을 연결하는 기준</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span><strong>코스트 오브젝트:</strong> 비용이 배부되는 대상(제품/서비스)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span><strong>활동(Activity):</strong> 자원을 소비하는 업무 단위</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">ABC 계산 절차</h4>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                      <span>활동 식별 및 코스트 풀 설정</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                      <span>코스트 드라이버 선정 및 배부율 계산</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">3</span>
                      <span>코스트 오브젝트에 비용 배부</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">4</span>
                      <span>단위당 원가 및 수익성 분석</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* 코스트 풀 요약 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">코스트 풀 요약</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">코스트 풀</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">총비용</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">코스트 드라이버</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">배부율</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">비중</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costPools.map(pool => {
                      const percentage = (pool.totalCost / summary.totalPoolCost * 100).toFixed(1);
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      const colorIndex = costPools.indexOf(pool);
                      return (
                        <tr key={pool.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 ${colors[colorIndex % colors.length]} rounded-full mr-2`}></div>
                              <span className="font-medium text-gray-800">{pool.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(pool.totalCost)}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{pool.costDriver}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatNumber(pool.costPerDriver)}원</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${colors[colorIndex % colors.length]}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 제품별 원가 구조 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">제품별 ABC 원가 구조</h3>
              <div className="space-y-4">
                {costObjects.map(obj => {
                  const directRatio = (obj.directCost / obj.totalCost * 100).toFixed(1);
                  const indirectRatio = (100 - parseFloat(directRatio)).toFixed(1);
                  return (
                    <div key={obj.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{obj.name}</h4>
                          <p className="text-sm text-gray-500">{obj.productLine} | 생산량: {formatNumber(obj.productionVolume)}개</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">{formatCurrency(obj.totalCost)}</div>
                          <div className="text-sm text-gray-500">단위당: {formatNumber(obj.unitCost)}원</div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-blue-500 flex items-center justify-center text-xs text-white"
                          style={{ width: `${directRatio}%` }}
                        >
                          {directRatio}%
                        </div>
                        <div
                          className="bg-green-500 flex items-center justify-center text-xs text-white"
                          style={{ width: `${indirectRatio}%` }}
                        >
                          {indirectRatio}%
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>직접비용: {formatCurrency(obj.directCost)}</span>
                        <span>간접비용(ABC): {formatCurrency(obj.totalCost - obj.directCost)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'pools':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">코스트 풀 상세</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 코스트 풀 추가
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {costPools.map(pool => (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{pool.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{pool.id}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">총비용</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(pool.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">코스트 드라이버</span>
                        <span className="text-gray-800">{pool.costDriver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">드라이버 수량</span>
                        <span className="text-gray-800">{formatNumber(pool.driverQuantity)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">배부율</span>
                        <span className="font-bold text-blue-600">{formatNumber(pool.costPerDriver)}원</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'objects':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">코스트 오브젝트(제품)별 원가 배부</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 제품 추가
                </button>
              </div>
              <div className="space-y-6">
                {costObjects.map(obj => (
                  <div key={obj.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{obj.name}</h4>
                        <p className="text-sm text-gray-500">{obj.productLine} | 생산량: {formatNumber(obj.productionVolume)}개</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{formatCurrency(obj.totalCost)}</div>
                        <div className="text-sm text-gray-500">단위당: {formatNumber(obj.unitCost)}원</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-700">직접비용</div>
                          <div className="text-xl font-bold text-blue-800">{formatCurrency(obj.directCost)}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-700">ABC 배부 간접비</div>
                          <div className="text-xl font-bold text-green-800">{formatCurrency(obj.totalCost - obj.directCost)}</div>
                        </div>
                      </div>
                      <h5 className="font-semibold text-gray-700 mb-3">코스트 풀별 배부 내역</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">코스트 풀</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">배부액</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">비중</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {obj.indirectCosts.map((cost, idx) => {
                              const ratio = (cost.cost / (obj.totalCost - obj.directCost) * 100).toFixed(1);
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-800">{cost.poolName}</td>
                                  <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(cost.cost)}</td>
                                  <td className="px-3 py-2 text-right text-gray-600">{ratio}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">활동(Activity) 상세</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  + 활동 추가
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map(activity => {
                  const colors = {
                    '설비 가동': 'blue',
                    '품질 검사': 'green',
                    '자재 운반': 'purple',
                    '생산 준비': 'orange',
                    '설비 유지보수': 'pink'
                  };
                  const colorKey = activity.costPoolName as keyof typeof colors;
                  const color = colors[colorKey] || 'gray';
                  return (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                        <span className={`text-xs bg-${color}-100 text-${color}-700 px-2 py-1 rounded-full`}>{activity.costPoolName}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">자원비용</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(activity.resourceCost)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">시간배분</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full bg-${color}-500`}
                                style={{ width: `${activity.timePercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-800">{activity.timePercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 활동별 코스트 풀 집계 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">코스트 풀별 활동 집계</h3>
              <div className="space-y-4">
                {costPools.map(pool => {
                  const poolActivities = activities.filter(a => a.costPoolId === pool.id);
                  const activityCost = poolActivities.reduce((sum, a) => sum + a.resourceCost, 0);
                  const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                  const colorIndex = costPools.indexOf(pool);
                  const color = colors[colorIndex % colors.length];
                  return (
                    <div key={pool.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 bg-${color}-500 rounded-full mr-3`}></div>
                          <h4 className="font-semibold text-gray-800">{pool.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">활동 비용</div>
                          <div className="text-lg font-bold text-gray-800">{formatCurrency(activityCost)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {poolActivities.map(activity => (
                          <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-800 text-sm">{activity.name}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-600">{activity.timePercentage}%</span>
                              <span className="text-sm font-semibold text-gray-800">{formatCurrency(activity.resourceCost)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            {/* 수익성 분석 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">제품별 수익성 분석</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">제품</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">단위 원가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">판매가</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">마진율</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">등급</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costObjects.map(obj => {
                      const sellingPrice = obj.unitCost * 1.35; // 35% 마진 가정
                      const margin = ((sellingPrice - obj.unitCost) / sellingPrice * 100);
                      const marginClass = margin >= 30 ? 'text-green-600' : margin >= 20 ? 'text-blue-600' : 'text-orange-600';
                      const grade = margin >= 30 ? 'A' : margin >= 20 ? 'B' : 'C';
                      const gradeClass = margin >= 30 ? 'bg-green-100 text-green-700' : margin >= 20 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';
                      return (
                        <tr key={obj.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{obj.name}</div>
                            <div className="text-xs text-gray-500">{obj.productLine}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800">{formatNumber(Math.round(obj.unitCost))}원</td>
                          <td className="px-4 py-3 text-right text-gray-800">{formatNumber(Math.round(sellingPrice))}원</td>
                          <td className="px-4 py-3 text-right font-semibold {marginClass}">{margin.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold {gradeClass}`}>{grade}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 원가 구성 비교 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">원가 구성 비교</h3>
              <div className="space-y-4">
                {costPools.map(pool => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  const colorIndex = costPools.indexOf(pool);
                  const color = colors[colorIndex % colors.length];
                  return (
                    <div key={pool.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 {color} rounded-full mr-2`}></div>
                          <span className="text-sm font-medium text-gray-700">{pool.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{formatCurrency(pool.totalCost)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        {costObjects.map(obj => {
                          const cost = obj.indirectCosts.find(c => c.poolId === pool.id)?.cost || 0;
                          const percentage = (cost / pool.totalCost * 100).toFixed(1);
                          const objColors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400'];
                          const objColorIndex = costObjects.indexOf(obj);
                          if (cost === 0) return null;
                          return (
                            <div
                              key={obj.id}
                              className={`h-full {objColors[objColorIndex % objColors.length]} float-left`}
                              style={{ width: `${percentage}%` }}
                              title={`${obj.name}: {formatCurrency(cost)} ({percentage}%)`}
                            ></div>
                          );
                        })}
                      </div>
                      <div className="flex gap-4 mt-1">
                        {costObjects.map(obj => {
                          const cost = obj.indirectCosts.find(c => c.poolId === pool.id)?.cost || 0;
                          const percentage = (cost / pool.totalCost * 100).toFixed(1);
                          if (cost === 0) return null;
                          return (
                            <span key={obj.id} className="text-xs text-gray-600">
                              {obj.name}: {percentage}%
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 개선 제안 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ABC 원가 개선 제안</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <ActivityIcon size={18} className="text-blue-600" />
                    <h4 className="font-semibold text-blue-800">활동 중심 개선</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• 설비 가동 비중이 높은 제품C의 공정 최적화</li>
                    <li>• 품질 검사 활동의 자동화 검토</li>
                    <li>• 자재 운반 경로 개선으로 운반횟수 감축</li>
                  </ul>
                </div>
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendUpIcon size={18} className="text-green-600" />
                    <h4 className="font-semibold text-green-800">수익성 개선</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• 고부가가치 제품 위주의 생산 비중 확대</li>
                    <li>• 저마진 제품의 가격 재검토</li>
                    <li>• 간접비 비중이 낮은 제품군 개발</li>
                  </ul>
                </div>
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <SettingsIcon size={18} className="text-purple-600" />
                    <h4 className="font-semibold text-purple-800">코스트 드라이버 최적화</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• 셋업 횟수 감축을 위한 공군 다양화</li>
                    <li>• 보수 시간 단축을 위한 예방정비 강화</li>
                    <li>• 드라이버 수량에 따른 차등 배부 검토</li>
                  </ul>
                </div>
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarIcon size={18} className="text-orange-600" />
                    <h4 className="font-semibold text-orange-800">비용 절감 기회</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-orange-700">
                    <li>• 코스트 풀별 상위 20% 활동 집중 관리</li>
                    <li>• 비가치 활동 제거 및 축소</li>
                    <li>• 활동 기준 예산 편성 도입</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 - 그라데이션 배경 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <ActivityIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ABC 원가 분석</h1>
            <p className="text-blue-100">Activity-Based Costing | 활동기준원가계산</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '개요', icon: BarChartIcon, color: 'from-blue-500 to-blue-600' },
            { id: 'pools', label: '코스트 풀', icon: PieChartIcon, color: 'from-purple-500 to-purple-600' },
            { id: 'objects', label: '코스트 오브젝트', icon: DollarIcon, color: 'from-green-500 to-green-600' },
            { id: 'activities', label: '활동', icon: ActivityIcon, color: 'from-orange-500 to-orange-600' },
            { id: 'analysis', label: '분석', icon: TrendUpIcon, color: 'from-pink-500 to-pink-600' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ABCCost;
