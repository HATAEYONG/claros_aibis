import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Activity,
  Settings,
  RefreshCw,
  Download,
  Maximize2,
  Bell
} from 'lucide-react';
import BusinessProcessSummary from '@/components/dashboard/BusinessProcessSummary';
import { CostBreakdown } from '@/components/cost';
import NotificationCenter from '@/components/common/NotificationCenter';
import { ActivityIcon, DollarIcon } from '@/components/icons/Icons';

interface DashboardWidget {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  size: 'small' | 'medium' | 'large' | 'full';
  category: 'overview' | 'process' | 'cost' | 'quality' | 'production';
  refreshable?: boolean;
  exportable?: boolean;
}

interface IntegratedDashboardProps {
  className?: string;
}

/**
 * 통합 대시보드 컴포넌트
 * 비즈니스 프로세스, 원가 분석, 생산, 품질 등을 통합 관리
 */
const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 대시보드 위젯 정의
  const widgets: DashboardWidget[] = [
    {
      id: 'business-process',
      title: '비즈니스 프로세스',
      icon: Activity,
      component: BusinessProcessSummary,
      size: 'large',
      category: 'process',
      refreshable: true,
      exportable: true
    },
    {
      id: 'cost-breakdown',
      title: '4M2E 원가 분석',
      icon: DollarIcon,
      component: CostBreakdown,
      size: 'medium',
      category: 'cost',
      refreshable: true,
      exportable: true
    }
  ];

  // 위젯 새로고침
  const handleRefresh = async (widgetId: string) => {
    setRefreshing(widgetId);
    // 실제 새로고침 로직은 각 위젯 내부에서 처리
    setTimeout(() => {
      setRefreshing(null);
    }, 1000);
  };

  // 위젯 내보내기
  const handleExport = (widgetId: string) => {
    // 실제 내보내기 로직 구현
    console.log('Exporting widget:', widgetId);
  };

  // 위젯 크기 클래스
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  // 위젯 렌더링
  const renderWidget = (widget: DashboardWidget) => {
    const Component = widget.component;
    const isRefreshing = refreshing === widget.id;

    return (
      <div key={widget.id} className={getSizeClass(widget.size)}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <widget.icon className="h-5 w-5" />
                {widget.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {widget.refreshable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRefresh(widget.id)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {widget.exportable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleExport(widget.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Component />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 대시보드 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통합 대시보드</h1>
          <p className="text-gray-500 mt-1">실시간 비즈니스 현황 모니터링</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <ActivityIcon className="h-4 w-4 mr-1" />
            라이브
          </Badge>
          <NotificationCenter />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 대시보드 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            프로세스
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            원가
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            분석
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 카드들 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">O2C 완료율</p>
                    <p className="text-2xl font-bold text-gray-900">78.5%</p>
                    <p className="text-xs text-green-600 mt-1">▲ 2.3%</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">P2P 완료율</p>
                    <p className="text-2xl font-bold text-gray-900">65.2%</p>
                    <p className="text-xs text-red-600 mt-1">▼ 1.8%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">원가 절감액</p>
                    <p className="text-2xl font-bold text-gray-900">₩125억</p>
                    <p className="text-xs text-green-600 mt-1">목표 달성</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">미해결 이슈</p>
                    <p className="text-2xl font-bold text-gray-900">8건</p>
                    <p className="text-xs text-yellow-600 mt-1">주의 필요</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Bell className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 위젯 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map(renderWidget)}
          </div>
        </TabsContent>

        {/* 프로세스 탭 */}
        <TabsContent value="process" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {widgets
              .filter(w => w.category === 'process')
              .map(renderWidget)}
          </div>
        </TabsContent>

        {/* 원가 탭 */}
        <TabsContent value="cost" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {widgets
              .filter(w => w.category === 'cost')
              .map(renderWidget)}
          </div>
        </TabsContent>

        {/* 분석 탭 */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>고급 분석 도구</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>인과 관계 분석</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Activity className="h-6 w-6" />
                  <span>시나리오 분석</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span>최적화 제안</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 자동 새로고침 상태 표시 */}
      {refreshing && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">데이터 새로고침 중...</span>
        </div>
      )}
    </div>
  );
};

export default IntegratedDashboard;
