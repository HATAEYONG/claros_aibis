import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import { ActivityIcon, DollarIcon, PackageIcon, TruckIcon } from '@/components/icons/Icons';
import businessProcessService from '@/services/businessProcessService';

interface ProcessStage {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  status: string;
  order: number;
  duration: number;
  estimatedDuration: number;
  volume: number;
  value: number;
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedOrders: number;
  }>;
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: string;
  }>;
}

interface ProcessData {
  period: string;
  stages: ProcessStage[];
  summary: {
    totalCycleTime: number;
    totalEstimatedTime: number;
    totalValue: number;
    totalIssues: number;
    completionRate: number;
  };
}

interface ProcessSummaryProps {
  className?: string;
}

const BusinessProcessSummary: React.FC<ProcessSummaryProps> = ({ className }) => {
  const [o2cData, setO2CData] = useState<ProcessData | null>(null);
  const [p2pData, setP2PData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProcessData();
  }, []);

  const fetchProcessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [o2cResponse, p2pResponse] = await Promise.all([
        businessProcessService.fetchO2CStages('monthly'),
        businessProcessService.fetchP2PStages('monthly')
      ]);

      // Extract data from API response
      if (o2cResponse.data) {
        setO2CData(o2cResponse.data as ProcessData);
      }
      if (p2pResponse.data) {
        setP2PData(p2pResponse.data as ProcessData);
      }

      // Set error if both responses failed
      if (!o2cResponse.data && !p2pResponse.data) {
        setError('비즈니스 프로세스 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Business process data fetch error:', err);
      setError('비즈니스 프로세스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'delayed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const renderStage = (stage: ProcessStage) => (
    <div key={stage.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ActivityIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{stage.name}</h4>
            <p className="text-xs text-muted-foreground">{stage.nameEn}</p>
          </div>
        </div>
        <Badge className={getStatusColor(stage.status)}>
          {getStatusText(stage.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">처리 시간</p>
          <p className="font-medium">{stage.duration} / {stage.estimatedDuration}시간</p>
          <Progress value={(stage.duration / stage.estimatedDuration) * 100} className="h-1 mt-1" />
        </div>
        <div>
          <p className="text-muted-foreground">처리 건수</p>
          <p className="font-medium">{stage.volume.toLocaleString()}건</p>
          <p className="text-xs text-muted-foreground">₩{stage.value.toLocaleString()}</p>
        </div>
      </div>

      {stage.kpis.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">주요 KPI</p>
          <div className="space-y-1">
            {stage.kpis.slice(0, 2).map((kpi, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{kpi.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {kpi.value.toFixed(1)} / {kpi.target} {kpi.unit}
                  </span>
                  {getTrendIcon(kpi.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            이슈 ({stage.issues.length})
          </p>
          <div className="space-y-1">
            {stage.issues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-2 text-xs p-2 bg-red-500/5 rounded">
                <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                <div className="flex-1">
                  <p className="font-medium">{issue.description}</p>
                  <p className="text-muted-foreground">영향 주문: {issue.affectedOrders}건</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSummary = (data: ProcessData) => {
    const summary = data.summary || {
      totalCycleTime: 0,
      totalEstimatedTime: 0,
      totalValue: 0,
      totalIssues: 0,
      completionRate: 0
    };

    return (
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">총 소요 시간</p>
                <p className="text-2xl font-bold">{summary.totalCycleTime}h</p>
                <p className="text-xs text-muted-foreground">목표: {summary.totalEstimatedTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">총 처리 금액</p>
                <p className="text-2xl font-bold">₩{(summary.totalValue / 100000000).toFixed(1)}억</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">완료율</p>
                <p className="text-2xl font-bold">{summary.completionRate.toFixed(1)}%</p>
                <Progress value={summary.completionRate} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          비즈니스 프로세스 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="o2c" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="o2c">O2C (Order to Cash)</TabsTrigger>
            <TabsTrigger value="p2p">P2P (Procure to Pay)</TabsTrigger>
          </TabsList>

          <TabsContent value="o2c" className="space-y-4 mt-4">
            {o2cData && (
              <>
                {renderSummary(o2cData)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {o2cData.stages.map(renderStage)}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="p2p" className="space-y-4 mt-4">
            {p2pData && (
              <>
                {renderSummary(p2pData)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {p2pData.stages.map(renderStage)}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BusinessProcessSummary;
