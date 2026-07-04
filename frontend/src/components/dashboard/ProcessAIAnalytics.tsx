import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Activity,
  Clock,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import { ActivityIcon, DollarIcon } from '@/components/icons/Icons';

interface PredictionData {
  lead_time: {
    current_avg: number;
    target: number;
    trend: string;
    predicted_next_period: number;
  };
  completion_rate: {
    current: number;
    target: number;
    gap: number;
    predicted_next_period: number;
  };
  issues: {
    recent_count: number;
    trend: string;
    predicted_next_period: number;
  };
  bottlenecks: Array<{
    stage_id: string;
    stage_name: string;
    delay_ratio: number;
    current_duration: number;
    estimated_duration: number;
  }>;
}

interface Recommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
  actions: string[];
  expected_impact: string;
}

interface AIAnalyticsResponse {
  predictions: PredictionData;
  recommendations: Recommendation[];
  order_volume?: {
    recent: number;
    predicted: number;
    growth_rate: number;
  };
  confidence_level: number;
  generated_at: string;
}

interface ProcessAIAnalyticsProps {
  processType: 'o2c' | 'p2p';
  className?: string;
}

/**
 * 프로세스 AI 분석 컴포넌트
 * 머신러닝 기반 예측 및 최적화 제안
 */
const ProcessAIAnalytics: React.FC<ProcessAIAnalyticsProps> = ({ processType, className }) => {
  const [data, setData] = useState<AIAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'recommendations' | 'optimization'>('predictions');

  useEffect(() => {
    fetchAnalytics();
  }, [processType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = processType === 'o2c'
        ? '/api/business-process/ai/o2c/predictions/'
        : '/api/business-process/ai/p2p/predictions/';

      const response = await fetch(endpoint);
      const jsonData = await response.json();

      if (jsonData.predictions) {
        setData(jsonData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('AI Analytics fetch error:', err);
      setError('AI 분석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'down' || trend === 'concerning') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '중간';
      default: return '낮음';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">AI 분석 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{error || '데이터를 불러올 수 없습니다.'}</p>
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                재시도
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            AI 기반 프로세스 분석
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              신뢰도: {(data.confidence_level * 100).toFixed(0)}%
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchAnalytics}>
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">예측 분석</TabsTrigger>
            <TabsTrigger value="recommendations">개선 제안</TabsTrigger>
            <TabsTrigger value="optimization">최적화</TabsTrigger>
          </TabsList>

          {/* 예측 분석 탭 */}
          <TabsContent value="predictions" className="space-y-6 mt-6">
            {/* 리드타임 예측 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">리드타임</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {data.predictions.lead_time.current_avg}h
                      </span>
                      {getTrendIcon(data.predictions.lead_time.trend)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      목표: {data.predictions.lead_time.target}h
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">다음기 예측</p>
                      <p className="text-sm font-medium">
                        {data.predictions.lead_time.predicted_next_period}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium">완료율</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {data.predictions.completion_rate.current}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        목표: {data.predictions.completion_rate.target}%
                      </span>
                    </div>
                    <Progress
                      value={data.predictions.completion_rate.current}
                      className="h-2"
                    />
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">다음기 예측</p>
                      <p className="text-sm font-medium">
                        {data.predictions.completion_rate.predicted_next_period}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <p className="text-sm font-medium">이슈</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {data.predictions.issues.recent_count}건
                      </span>
                      {getTrendIcon(data.predictions.issues.trend)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최근 30일간 발생
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">다음기 예측</p>
                      <p className="text-sm font-medium">
                        {data.predictions.issues.predicted_next_period}건
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 병목 구간 분석 */}
            {data.predictions.bottlenecks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  병목 구간 분석
                </h3>
                <div className="space-y-3">
                  {data.predictions.bottlenecks.map((bottleneck, idx) => (
                    <Card key={idx} className="border-orange-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{bottleneck.stage_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              현재: {bottleneck.current_duration}h / 목표: {bottleneck.estimated_duration}h
                            </p>
                          </div>
                          <Badge variant="destructive">
                            +{bottleneck.delay_ratio.toFixed(1)}% 지연
                          </Badge>
                        </div>
                        <Progress
                          value={(bottleneck.current_duration / bottleneck.estimated_duration) * 100}
                          className="h-2 mt-3"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 주문량 예측 */}
            {data.order_volume && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    주문량 예측
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">최근 실적</p>
                      <p className="text-xl font-bold">{data.order_volume.recent.toLocaleString()}건</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">다음기 예측</p>
                      <p className="text-xl font-bold text-green-600">
                        {data.order_volume.predicted.toLocaleString()}건
                      </p>
                      <p className="text-xs text-green-600">
                        +{data.order_volume.growth_rate}% 성장 예상
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 개선 제안 탭 */}
          <TabsContent value="recommendations" className="space-y-4 mt-6">
            {data.recommendations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      현재 개선이 필요한 사항이 없습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              data.recommendations.map((rec, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {getPriorityLabel(rec.priority)} 우선순위
                          </Badge>
                          <h3 className="font-semibold">{rec.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rec.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        추천 액션:
                      </p>
                      <ul className="space-y-1">
                        {rec.actions.map((action, actionIdx) => (
                          <li key={actionIdx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs text-green-600 font-medium">
                        기대 효과: {rec.expected_impact}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 최적화 탭 */}
          <TabsContent value="optimization" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">프로세스 자동화 기회</h3>
                    <p className="text-xs text-muted-foreground">
                      AI 분석 기반 자동화 제안
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">자동화 가능 단계</span>
                    <span className="font-medium">3개</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">예상 시간 절감</span>
                    <span className="font-medium text-green-600">40%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">투자 회수 기간</span>
                    <span className="font-medium">6개월</span>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  상세 분석 보고서 보기
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProcessAIAnalytics;
