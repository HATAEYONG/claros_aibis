import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  FileTextIcon,
  PackageIcon,
  TruckIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  BarChartIcon,
  TrendUpIcon,
  DollarIcon,
  UsersIcon,
  FactoryIcon,
  ActivityIcon,
  SettingsIcon,
  XIcon
} from '@/components/icons/Icons';
import { fetchP2PStages, fetchP2POrders, ProcessStage, ProcessOrder } from '@/services/businessProcessService';
import ProcessAIAnalytics from '@/components/dashboard/ProcessAIAnalytics';

type P2PStage = ProcessStage;
type P2POrder = ProcessOrder & { actualDate?: string };

interface P2PIssue {
  id: string;
  type: 'delay' | 'quality' | 'cost' | 'supplier';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedOrders: number;
}

interface P2PKPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

const P2PView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [p2pStages, setP2pStages] = useState<P2PStage[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(null);
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'metrics' | 'ai'>('kanban');

  useEffect(() => {
    fetchP2PData(selectedPeriod);
  }, [selectedPeriod]);

  const fetchP2PData = async (period: string) => {
    // API 호출
    const periodTypeMap: Record<string, string> = {
      'today': 'daily',
      'week': 'weekly',
      'month': 'monthly',
      'quarter': 'quarterly'
    };

    const stagesResult = await fetchP2PStages(periodTypeMap[period] || 'monthly');
    const ordersResult = await fetchP2POrders();

    let stages: P2PStage[] = [];
    let orderList: P2POrder[] = [];

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

    setP2pStages(stages);
    setOrders(orderList);
  };

  const getMockStages = (): P2PStage[] => {
    return [
      {
        id: 'requisition',
        name: '구매 요청',
        nameEn: 'Requisition',
        icon: FileTextIcon,
        status: 'completed',
        order: 1,
        duration: 4,
        estimatedDuration: 8,
        volume: 189,
        value: 450000000,
        issues: [],
        kpis: [
          { name: '요청 처리 시간', value: 4, target: 8, unit: '시간', trend: 'down' },
          { name: '요청 승인율', value: 95.8, target: 95, unit: '%', trend: 'up' },
          { name: '자동 승인율', value: 72, target: 70, unit: '%', trend: 'up' }
        ]
      },
      {
        id: 'quotation',
        name: '견적',
        nameEn: 'Quotation',
        icon: FileTextIcon,
        status: 'completed',
        order: 2,
        duration: 24,
        estimatedDuration: 48,
        volume: 178,
        value: 435000000,
        issues: [
          {
            id: 'QUOT-001',
            type: 'delay',
            severity: 'medium',
            description: '일부 공급업체 견적 지연',
            affectedOrders: 8
          }
        ],
        kpis: [
          { name: '견적 응답 시간', value: 24, target: 48, unit: '시간', trend: 'down' },
          { name: '견적 경쟁률', value: 3.2, target: 3, unit: '개사', trend: 'up' },
          { name: '목표가 달성율', value: 85, target: 80, unit: '%', trend: 'up' }
        ]
      },
      {
        id: 'po_creation',
        name: '발주',
        nameEn: 'Purchase Order',
        icon: ShoppingCartIcon,
        status: 'completed',
        order: 3,
        duration: 8,
        estimatedDuration: 16,
        volume: 167,
        value: 420000000,
        issues: [],
        kpis: [
          { name: 'PO 발행 시간', value: 8, target: 16, unit: '시간', trend: 'down' },
          { name: 'PO 정확률', value: 98.5, target: 98, unit: '%', trend: 'up' },
          { name: '전자 PO 율', value: 92, target: 90, unit: '%', trend: 'up' }
        ]
      },
      {
        id: 'receiving',
        name: '입고',
        nameEn: 'Receiving',
        icon: PackageIcon,
        status: 'in_progress',
        order: 4,
        duration: 48,
        estimatedDuration: 72,
        volume: 134,
        value: 355000000,
        issues: [
          {
            id: 'REC-001',
            type: 'quality',
            severity: 'high',
            description: '품질 검사 불합격 증가',
            affectedOrders: 15
          },
          {
            id: 'REC-002',
            type: 'delay',
            severity: 'medium',
            description: '일부 자재 입고 지연',
            affectedOrders: 12
          }
        ],
        kpis: [
          { name: '입고 리드타임', value: 48, target: 72, unit: '시간', trend: 'down' },
          { name: '입고 정확률', value: 96.8, target: 98, unit: '%', trend: 'down' },
          { name: '검사 처리 시간', value: 4, target: 8, unit: '시간', trend: 'down' }
        ]
      },
      {
        id: 'invoice',
        name: '송장',
        nameEn: 'Invoice Processing',
        icon: FileTextIcon,
        status: 'in_progress',
        order: 5,
        duration: 16,
        estimatedDuration: 24,
        volume: 112,
        value: 298000000,
        issues: [],
        kpis: [
          { name: '송장 처리 시간', value: 16, target: 24, unit: '시간', trend: 'down' },
          { name: '3-way 매칭율', value: 94.5, target: 95, unit: '%', trend: 'up' },
          { name: '자동 승인율', value: 78, target: 75, unit: '%', trend: 'up' }
        ]
      },
      {
        id: 'payment',
        name: '지급',
        nameEn: 'Payment',
        icon: DollarIcon,
        status: 'pending',
        order: 6,
        duration: 0,
        estimatedDuration: 120,
        volume: 89,
        value: 237000000,
        issues: [
          {
            id: 'PAY-001',
            type: 'delay',
            severity: 'medium',
            description: '약속 지급일 미준수',
            affectedOrders: 18
          }
        ],
        kpis: [
          { name: '평균 지급 기간', value: 45, target: 30, unit: '일', trend: 'up' },
          { name: '현금 할인 활용률', value: 15, target: 20, unit: '%', trend: 'down' },
          { name: '자동 이체율', value: 82, target: 85, unit: '%', trend: 'up' }
        ]
      }
    ];
  };

  const getMockOrders = (): P2POrder[] => {
    return [
      {
        id: 'PO-2024-00456',
        supplier: '삼성SDI',
        material: '리튬이온 배터리 셀',
        quantity: 5000,
        amount: 125000000,
        stage: 'receiving',
        status: 'in_progress',
        orderDate: '2024-03-20',
        promisedDate: '2024-04-01'
      },
      {
        id: 'PO-2024-00457',
        supplier: 'LG화학',
        material: '폴리머 원료',
        quantity: 10000,
        amount: 68000000,
        stage: 'invoice',
        status: 'in_progress',
        orderDate: '2024-03-22',
        promisedDate: '2024-03-30'
      },
      {
        id: 'PO-2024-00458',
        supplier: 'SK네트웍스',
        material: '전자부품-005',
        quantity: 3000,
        amount: 45000000,
        stage: 'receiving',
        status: 'delayed',
        orderDate: '2024-03-25',
        promisedDate: '2024-03-28'
      },
      {
        id: 'PO-2024-00459',
        supplier: '포스코',
        material: '강재-특수강',
        quantity: 2500,
        amount: 89000000,
        stage: 'payment',
        status: 'pending',
        orderDate: '2024-03-15',
        promisedDate: '2024-03-25'
      },
      {
        id: 'PO-2024-00460',
        supplier: '현대제철',
        material: '열연코일',
        quantity: 5000,
        amount: 92000000,
        stage: 'po_creation',
        status: 'completed',
        orderDate: '2024-03-28',
        promisedDate: '2024-04-05'
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

  const totalCycleTime = p2pStages.reduce((sum, stage) => sum + stage.duration, 0);
  const totalEstimatedTime = p2pStages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
  const totalValue = p2pStages.reduce((sum, stage) => sum + stage.value, 0);
  const totalIssues = p2pStages.reduce((sum, stage) => sum + stage.issues.length, 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Procure to Pay (P2P)</h2>
          <p className="text-gray-600 mt-1">구매 요청부터 지급까지 전체 프로세스 관리</p>
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
          <p className="text-xs text-gray-600">{p2pStages[0]?.volume || 0}건 발주</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <ActivityIcon size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-600">진행율</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {Math.round((p2pStages.filter(s => s.status === 'completed').length / p2pStages.length) * 100)}%
          </p>
          <p className="text-xs text-gray-600">{p2pStages.filter(s => s.status === 'completed').length}/{p2pStages.length} 단계 완료</p>
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
          {p2pStages.map((stage) => {
            const StageIcon = stage.icon;
            const stageOrders = orders.filter(o => o.stage === stage.id);

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
                            <span className="text-xs font-semibold">{issue.type === 'delay' ? '지연' : issue.type === 'quality' ? '품질' : issue.type === 'supplier' ? '공급업체' : '비용'}</span>
                          </div>
                          <p className="text-xs">{issue.description}</p>
                          <p className="text-xs mt-1">영향 발주: {issue.affectedOrders}건</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 발주 카드 */}
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
                          <p className="text-sm font-medium text-gray-800">{order.material}</p>
                          <p className="text-xs text-gray-600">{order.supplier}</p>
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
            const currentStage = p2pStages.find(s => s.id === order.stage);
            const currentStageIndex = p2pStages.findIndex(s => s.id === order.stage);

            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.id}</h3>
                    <p className="text-sm text-gray-600">{order.material}</p>
                    <p className="text-xs text-gray-500">{order.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(order.amount)}</p>
                    <p className="text-xs text-gray-600">수량: {order.quantity.toLocaleString()}</p>
                  </div>
                </div>

                {/* 진행 바 */}
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {p2pStages.map((stage, idx) => {
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
                      style={{ width: `${(currentStageIndex / (p2pStages.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 날짜 정보 */}
                <div className="mt-4 flex justify-between text-xs text-gray-600">
                  <span>발주: {order.orderDate}</span>
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
          {p2pStages.map((stage) => {
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
                      <div className="ml-4 text-right">
                        <p className="text-lg font-semibold text-gray-800">{kpi.value}{kpi.unit}</p>
                        <p className="text-xs text-gray-600">목표: {kpi.target}{kpi.unit}</p>
                      </div>
                      <div className="ml-2">
                        {kpi.trend === 'up' && <TrendUpIcon size={18} className="text-green-600" />}
                        {kpi.trend === 'down' && <TrendUpIcon size={18} className="text-blue-600 rotate-180" />}
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
        <ProcessAIAnalytics processType="p2p" />
      )}

      {/* 발주 상세 모달 */}
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
                <p className="text-sm text-gray-600">공급업체</p>
                <p className="text-lg font-semibold">{selectedOrder.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">자재</p>
                <p className="text-lg font-semibold">{selectedOrder.material}</p>
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
                  <p className="text-sm text-gray-600">발주일</p>
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

export default P2PView;
