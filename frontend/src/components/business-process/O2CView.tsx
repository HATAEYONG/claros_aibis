import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  FactoryIcon,
  TruckIcon,
  DollarIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  BarChartIcon,
  TrendUpIcon,
  UsersIcon,
  PackageIcon,
  FileTextIcon,
  ActivityIcon,
  SettingsIcon,
  XIcon
} from '@/components/icons/Icons';
import { fetchO2CStages, fetchO2COrders, ProcessStage, ProcessOrder } from '@/services/businessProcessService';
import ProcessAIAnalytics from '@/components/dashboard/ProcessAIAnalytics';

type O2CStage = ProcessStage;
type O2COrder = ProcessOrder & { actualDate?: string };

interface O2CIssue {
  id: string;
  type: 'delay' | 'quality' | 'cost' | 'capacity';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedOrders: number;
}

interface O2CKPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

const O2CView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [o2cStages, setO2cStages] = useState<O2CStage[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<O2COrder | null>(null);
  const [orders, setOrders] = useState<O2COrder[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'metrics' | 'ai'>('kanban');

  useEffect(() => {
    fetchO2CData(selectedPeriod);
  }, [selectedPeriod]);

  const fetchO2CData = async (period: string) => {
    // API 호출
    const periodTypeMap: Record<string, string> = {
      'today': 'daily',
      'week': 'weekly',
      'month': 'monthly',
      'quarter': 'quarterly'
    };

    const stagesResult = await fetchO2CStages(periodTypeMap[period] || 'monthly');
    const ordersResult = await fetchO2COrders();

    let stages: O2CStage[] = [];
    let orderList: O2COrder[] = [];

    if (stagesResult.data && stagesResult.data.stages) {
      stages = stagesResult.data.stages;
    } else {
      stages = getMockStages();
    }

    if (ordersResult.data && ordersResult.data.orders) {
      orderList = ordersResult.data.orders;
    } else {
      orderList = getMockOrders();
    }

    setO2cStages(stages);
    setOrders(orderList);
  };

  const getMockStages = (): O2CStage[] => {
    return [
      {
        id: 'order_entry',
        name: '주문 접수',
        nameEn: 'Order Entry',
        icon: ShoppingCartIcon,
        status: 'completed',
        order: 1,
        duration: 2,
        estimatedDuration: 4,
        volume: 245,
        value: 1250000000,
        issues: [],
        kpis: [
          { name: '주문 처리 시간', value: 2, target: 4, unit: '시간', trend: 'down' },
          { name: '주문 정확률', value: 99.2, target: 99, unit: '%', trend: 'up' },
          { name: '일일 주문량', value: 245, target: 200, unit: '건', trend: 'up' }
        ]
      },
      {
        id: 'production',
        name: '생산',
        nameEn: 'Production',
        icon: FactoryIcon,
        status: 'in_progress',
        order: 2,
        duration: 72,
        estimatedDuration: 96,
        volume: 189,
        value: 980000000,
        issues: [
          {
            id: 'PROD-001',
            type: 'delay',
            severity: 'medium',
            description: '원자재 지연으로 인한 생산 지연',
            affectedOrders: 12
          },
          {
            id: 'PROD-002',
            type: 'capacity',
            severity: 'low',
            description: '설비 가동률 초과',
            affectedOrders: 8
          }
        ],
        kpis: [
          { name: '생산 리드타임', value: 72, target: 96, unit: '시간', trend: 'down' },
          { name: '설비 가동률', value: 87, target: 85, unit: '%', trend: 'up' },
          { name: '생산 불량률', value: 1.8, target: 2.5, unit: '%', trend: 'down' }
        ]
      },
      {
        id: 'delivery',
        name: '배송',
        nameEn: 'Delivery',
        icon: TruckIcon,
        status: 'in_progress',
        order: 3,
        duration: 24,
        estimatedDuration: 48,
        volume: 156,
        value: 820000000,
        issues: [
          {
            id: 'DEL-001',
            type: 'delay',
            severity: 'high',
            description: '특정 지역 배송 지연',
            affectedOrders: 23
          }
        ],
        kpis: [
          { name: '배송 시간', value: 24, target: 48, unit: '시간', trend: 'down' },
          { name: '배송 정확률', value: 98.5, target: 99, unit: '%', trend: 'up' },
          { name: '배송 완료율', value: 82, target: 90, unit: '%', trend: 'stable' }
        ]
      },
      {
        id: 'billing',
        name: '청구',
        nameEn: 'Billing',
        icon: FileTextIcon,
        status: 'pending',
        order: 4,
        duration: 0,
        estimatedDuration: 24,
        volume: 134,
        value: 710000000,
        issues: [],
        kpis: [
          { name: '청구 처리 시간', value: 4, target: 24, unit: '시간', trend: 'down' },
          { name: '청구 정확률', value: 99.8, target: 99.5, unit: '%', trend: 'up' },
          { name: '전자 청구율', value: 85, target: 90, unit: '%', trend: 'up' }
        ]
      },
      {
        id: 'payment',
        name: '입금',
        nameEn: 'Payment Collection',
        icon: DollarIcon,
        status: 'pending',
        order: 5,
        duration: 0,
        estimatedDuration: 168,
        volume: 98,
        value: 520000000,
        issues: [
          {
            id: 'PAY-001',
            type: 'delay',
            severity: 'medium',
            description: '장기 연체 고객 증가',
            affectedOrders: 15
          }
        ],
        kpis: [
          { name: '평� 수금 기간', value: 28, target: 30, unit: '일', trend: 'down' },
          { name: '회수율', value: 94.5, target: 95, unit: '%', trend: 'up' },
          { name: '연체율', value: 5.5, target: 5, unit: '%', trend: 'down' }
        ]
      }
    ];
  };

  const getMockOrders = (): O2COrder[] => {
    return [
      {
        id: 'ORD-2024-01567',
        customer: '한국전력',
        product: '전력케이블 Type-A',
        quantity: 5000,
        amount: 125000000,
        stage: 'production',
        status: 'in_progress',
        orderDate: '2024-03-25',
        promisedDate: '2024-04-05'
      },
      {
        id: 'ORD-2024-01568',
        customer: '삼성전자',
        product: '연성회로기판',
        quantity: 10000,
        amount: 280000000,
        stage: 'delivery',
        status: 'in_progress',
        orderDate: '2024-03-26',
        promisedDate: '2024-04-03'
      },
      {
        id: 'ORD-2024-01569',
        customer: '현대자동차',
        product: '자동차부품-001',
        quantity: 3000,
        amount: 95000000,
        stage: 'production',
        status: 'delayed',
        orderDate: '2024-03-27',
        promisedDate: '2024-04-02'
      },
      {
        id: 'ORD-2024-01570',
        customer: 'LG전자',
        product: '전자부품-003',
        quantity: 7500,
        amount: 185000000,
        stage: 'billing',
        status: 'pending',
        orderDate: '2024-03-28',
        promisedDate: '2024-04-04'
      },
      {
        id: 'ORD-2024-01571',
        customer: 'SK하이닉스',
        product: '반도체소재',
        quantity: 2000,
        amount: 340000000,
        stage: 'payment',
        status: 'pending',
        orderDate: '2024-03-20',
        promisedDate: '2024-04-01'
      }
    ];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-400';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'pending': return '대기';
      case 'delayed': return '지연';
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalCycleTime = o2cStages.reduce((sum, stage) => sum + stage.duration, 0);
  const totalEstimatedTime = o2cStages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
  const totalValue = o2cStages.reduce((sum, stage) => sum + stage.value, 0);
  const totalIssues = o2cStages.reduce((sum, stage) => sum + stage.issues.length, 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Order to Cash (O2C)</h2>
          <p className="text-gray-600 mt-1">주문부터 현금 수금까지 전체 프로세스 관리</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="quarter">이번 분기</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon size={20} className="text-blue-600" />
            <p className="text-sm text-blue-600">전체 주기 시간</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalCycleTime}시간</p>
          <p className="text-xs text-gray-600">목표: {totalEstimatedTime}시간</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarIcon size={20} className="text-green-600" />
            <p className="text-sm text-green-600">진행 중 금액</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-gray-600">{o2cStages[0]?.volume || 0}건 주문</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <ActivityIcon size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-600">진행율</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {Math.round((o2cStages.filter(s => s.status === 'completed').length / o2cStages.length) * 100)}%
          </p>
          <p className="text-xs text-gray-600">{o2cStages.filter(s => s.status === 'completed').length}/{o2cStages.length} 단계 완료</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangleIcon size={20} className="text-red-600" />
            <p className="text-sm text-red-600">이슈</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalIssues}</p>
          <p className="text-xs text-gray-600">개 건의 이슈 발생</p>
        </div>
      </div>

      {/* 뷰 모드 전환 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'kanban'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChartIcon size={16} />
          칸반 보드
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'timeline'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ClockIcon size={16} />
          타임라인
        </button>
        <button
          onClick={() => setViewMode('metrics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'metrics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <TrendUpIcon size={16} />
          지표 분석
        </button>
        <button
          onClick={() => setViewMode('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            viewMode === 'ai'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ActivityIcon size={16} />
          AI 분석
        </button>
      </div>

      {/* 칸반 보드 뷰 */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {o2cStages.map((stage) => {
            const StageIcon = stage.icon;
            const stageOrders = orders.filter(o => o.stage === stage.id || (stage.id === 'production' && o.stage === 'production'));

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 border border-gray-200 rounded-lg bg-gray-50">
                <div className={`p-4 border-b rounded-t-lg ${getStatusColor(stage.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StageIcon size={20} className="text-white" />
                      <div>
                        <p className="font-semibold text-white">{stage.name}</p>
                        <p className="text-xs text-white opacity-90">{stage.nameEn}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold">
                      {stageOrders.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-white">
                    <span>진행 시간: {stage.duration}시간</span>
                    <span>목표: {stage.estimatedDuration}시간</span>
                  </div>
                </div>

                <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                  {/* 이슈 알림 */}
                  {stage.issues.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {stage.issues.map((issue) => (
                        <div key={issue.id} className={`p-2 rounded border ${getSeverityColor(issue.severity)}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertTriangleIcon size={14} />
                            <span className="text-xs font-semibold">{issue.type === 'delay' ? '지연' : issue.type === 'capacity' ? '용량' : issue.type === 'quality' ? '품질' : '비용'}</span>
                          </div>
                          <p className="text-xs">{issue.description}</p>
                          <p className="text-xs mt-1">영향 주문: {issue.affectedOrders}건</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 주문 카드 */}
                  {stageOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3 bg-white rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                        order.status === 'delayed' ? 'border-red-500' :
                        order.status === 'in_progress' ? 'border-blue-500' :
                        'border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{order.product}</p>
                          <p className="text-xs text-gray-600">{order.customer}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'delayed' ? 'bg-red-100 text-red-700' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>수량: {order.quantity.toLocaleString()}</span>
                        <span className="font-semibold">{formatCurrency(order.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* KPI 요약 */}
                <div className="p-3 border-t bg-white">
                  <p className="text-xs font-semibold text-gray-700 mb-2">주요 KPI</p>
                  <div className="space-y-1">
                    {stage.kpis.slice(0, 2).map((kpi, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600">{kpi.name}</span>
                        <span className={kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-blue-600' : 'text-gray-600'}>
                          {kpi.value}{kpi.unit} / {kpi.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 타임라인 뷰 */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentStage = o2cStages.find(s => s.id === order.stage);
            const currentStageIndex = o2cStages.findIndex(s => s.id === order.stage);

            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.product}</p>
                    <p className="text-xs text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(order.amount)}</p>
                    <p className="text-xs text-gray-600">수량: {order.quantity.toLocaleString()}</p>
                  </div>
                </div>

                {/* 진행 바 */}
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {o2cStages.map((stage, idx) => {
                      const StageIcon = stage.icon;
                      const isCompleted = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const isPending = idx > currentStageIndex;

                      return (
                        <div key={stage.id} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500' :
                            isCurrent ? 'bg-blue-500' :
                            'bg-gray-200'
                          }`}>
                            <StageIcon size={18} className={isCompleted || isCurrent ? 'text-white' : 'text-gray-400'} />
                          </div>
                          <p className={`text-xs mt-1 ${
                            isCompleted ? 'text-green-600' :
                            isCurrent ? 'text-blue-600 font-semibold' :
                            'text-gray-400'
                          }`}>
                            {stage.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {/* 연결선 */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(currentStageIndex / (o2cStages.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 날짜 정보 */}
                <div className="mt-4 flex justify-between text-xs text-gray-600">
                  <span>주문: {order.orderDate}</span>
                  <span>약속: {order.promisedDate}</span>
                  {order.actualDate && <span>실제: {order.actualDate}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 지표 분석 뷰 */}
      {viewMode === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {o2cStages.map((stage) => {
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(stage.status)}`}>
                    <StageIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{stage.name}</h3>
                    <p className="text-sm text-gray-600">{stage.nameEn}</p>
                  </div>
                  <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                    stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                    stage.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusText(stage.status)}
                  </span>
                </div>

                {/* KPI 상세 */}
                <div className="space-y-3">
                  {stage.kpis.map((kpi, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{kpi.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (kpi.value / kpi.target) >= 1 ? 'bg-green-500' :
                                (kpi.value / kpi.target) >= 0.8 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <span className="text-sm font-medium">{kpi.value}/{kpi.target}{kpi.unit}</span>
                        <div className="ml-2">
                          {kpi.trend === 'up' && <TrendUpIcon size={18} className="text-green-600" />}
                          {kpi.trend === 'down' && <TrendUpIcon size={18} className="text-blue-600 rotate-180" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 처리량 */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">처리량</span>
                    <span className="font-semibold">{stage.volume}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">금액</span>
                    <span className="font-semibold">{formatCurrency(stage.value)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI 분석 뷰 */}
      {viewMode === 'ai' && (
        <ProcessAIAnalytics processType="o2c" />
      )}

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedOrder.id}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">고객사</p>
                <p className="text-lg font-semibold">{selectedOrder.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">제품</p>
                <p className="text-lg font-semibold">{selectedOrder.product}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">수량</p>
                  <p className="text-lg font-semibold">{selectedOrder.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">금액</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedOrder.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">주문일</p>
                  <p className="text-lg font-semibold">{selectedOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">약속일</p>
                  <p className="text-lg font-semibold">{selectedOrder.promisedDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">현재 상태</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedOrder.status === 'delayed' ? 'bg-red-100 text-red-700' :
                  selectedOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default O2CView;
