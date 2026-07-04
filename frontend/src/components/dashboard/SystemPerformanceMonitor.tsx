import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Activity,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
}

interface PerformanceData {
  metrics: SystemMetric[];
  healthChecks: HealthCheck[];
  recommendations: string[];
  lastUpdate: string;
}

/**
 * 시스템 성능 모니터링 컴포넌트
 * API 응답 시간, 데이터베이스 성능, 리소스 사용량 모니터링
 */
const SystemPerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPerformanceData = useCallback(async () => {
    try {
      // 실제로는 백엔드 API에서 데이터를 가져와야 함
      // 현재는 모의 데이터 사용
      const mockData: PerformanceData = {
        metrics: [
          {
            name: 'API 응답 시간',
            value: 120,
            unit: 'ms',
            threshold: 500,
            status: 'good',
            trend: 'stable'
          },
          {
            name: '데이터베이스 쿼리 시간',
            value: 45,
            unit: 'ms',
            threshold: 200,
            status: 'good',
            trend: 'down'
          },
          {
            name: 'CPU 사용률',
            value: 35,
            unit: '%',
            threshold: 80,
            status: 'good',
            trend: 'stable'
          },
          {
            name: '메모리 사용률',
            value: 62,
            unit: '%',
            threshold: 85,
            status: 'good',
            trend: 'up'
          },
          {
            name: '디스크 I/O',
            value: 78,
            unit: '%',
            threshold: 90,
            status: 'warning',
            trend: 'up'
          },
          {
            name: '네트워크 대역폭',
            value: 25,
            unit: '%',
            threshold: 80,
            status: 'good',
            trend: 'stable'
          }
        ],
        healthChecks: [
          {
            component: 'API 서버',
            status: 'healthy',
            responseTime: 45,
            lastCheck: new Date().toISOString()
          },
          {
            component: '데이터베이스',
            status: 'healthy',
            responseTime: 12,
            lastCheck: new Date().toISOString()
          },
          {
            component: '캐시 서버',
            status: 'degraded',
            responseTime: 150,
            lastCheck: new Date().toISOString()
          },
          {
            component: 'AI 추천 엔진',
            status: 'healthy',
            responseTime: 230,
            lastCheck: new Date().toISOString()
          }
        ],
        recommendations: [
          '캐시 서버 응답 시간이 느려집니다. 캐시 용량을 늘리거나 TTL을 조정하세요.',
          '디스크 I/O 사용량이 증가하고 있습니다. 불필요한 로그 파일 정리를 고려하세요.'
        ],
        lastUpdate: new Date().toISOString()
      };

      setPerformanceData(mockData);
    } catch (error) {
      console.error('Performance data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // 30초마다 새로고침
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchPerformanceData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'down':
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">성능 데이터를 불러올 수 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            시스템 성능 모니터링
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
            >
              <Zap className="h-4 w-4 mr-1" />
              {autoRefresh ? '자동 새로고침 ON' : '자동 새로고침 OFF'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchPerformanceData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 시스템 메트릭 */}
        <div>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Server className="h-4 w-4" />
            시스템 리소스
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {performanceData.metrics.map((metric, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">{metric.name}</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    {getStatusIcon(metric.status)}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-bold">
                    {metric.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    목표: {metric.threshold}{metric.unit}
                  </p>
                </div>
                <Progress
                  value={(metric.value / metric.threshold) * 100}
                  className="h-1 mt-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 헬스 체크 */}
        <div>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Database className="h-4 w-4" />
            컴포넌트 상태
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {performanceData.healthChecks.map((check, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="text-sm font-medium">{check.component}</p>
                      <p className="text-xs text-muted-foreground">
                        응답 시간: {check.responseTime}ms
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(check.status)} variant="outline">
                    {check.status === 'healthy' ? '정상' : check.status === 'degraded' ? '성능 저하' : '다운'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최적화 제안 */}
        {performanceData.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              최적화 제안
            </h3>
            <div className="space-y-2">
              {performanceData.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <p className="text-sm text-yellow-800">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        <div className="text-xs text-muted-foreground text-center">
          마지막 업데이트: {new Date(performanceData.lastUpdate).toLocaleString('ko-KR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemPerformanceMonitor;
