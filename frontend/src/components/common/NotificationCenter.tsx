import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'kpi';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: {
    category?: string;
    trend?: 'up' | 'down' | 'stable';
    currentValue?: number;
    targetValue?: number;
  };
}

interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * 알림 센터 컴포넌트
 * 실시간 비즈니스 알림과 KPI 경고를 표시
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  maxNotifications = 10,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const { toast } = useToast();

  // 샘플 알림 데이터 생성
  const generateSampleNotifications = useCallback((): Notification[] => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'warning',
        title: 'O2C 생산 스테이지 지연',
        message: '원자재 공급 지연으로 인한 생산 차질 발생. 영향 주문: 12건',
        timestamp: new Date(now.getTime() - 1000 * 60 * 5),
        read: false,
        priority: 'high',
        metadata: { category: 'o2c' }
      },
      {
        id: '2',
        type: 'error',
        title: 'P2P 품질 검사 불합격 증가',
        message: '입고 검사 불합격률이 목표(2%)를 초과했습니다. 현재: 3.2%',
        timestamp: new Date(now.getTime() - 1000 * 60 * 15),
        read: false,
        priority: 'high',
        metadata: { category: 'p2p', trend: 'up' }
      },
      {
        id: '3',
        type: 'kpi',
        title: '매출 달성률 개선',
        message: '월간 매출 달성률이 104%로 목표 초과 달성했습니다.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30),
        read: true,
        priority: 'medium',
        metadata: {
          category: 'sales',
          trend: 'up',
          currentValue: 104,
          targetValue: 100
        }
      },
      {
        id: '4',
        type: 'info',
        title: 'ERP 데이터 동기화 완료',
        message: '매출, 생산, 품질 데이터 동기화가 완료되었습니다.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 45),
        read: true,
        priority: 'low',
        metadata: { category: 'system' }
      },
      {
        id: '5',
        type: 'warning',
        title: '재고 회전율 저하',
        message: '부품 A-123의 재고 회전율이 목표(5회/월) 미달입니다. 현재: 3.2회/월',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60),
        read: true,
        priority: 'medium',
        metadata: {
          category: 'inventory',
          trend: 'down',
          currentValue: 3.2,
          targetValue: 5
        }
      }
    ];
  }, []);

  // 알림 데이터 로드
  useEffect(() => {
    setNotifications(generateSampleNotifications());
  }, [generateSampleNotifications]);

  // 새 알림 토스트 표시
  useEffect(() => {
    const newUnread = notifications.filter(n => !n.read && n.priority === 'high');
    newUnread.forEach(notification => {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });
    });
  }, [notifications, toast]);

  // 알림 읽음 처리
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // 전체 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== id)
    );
  }, []);

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'kpi':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // 시간 포맷
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div className={className}>
      {/* 알림 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* 알림 패널 */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 센터
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 text-xs"
                  >
                    전체 읽음
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, maxNotifications).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                                    새로움
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                {notification.metadata?.trend && (
                                  <span className="text-xs flex items-center gap-1">
                                    {notification.metadata.trend === 'up' ? (
                                      <TrendingUp className="h-3 w-3 text-green-500" />
                                    ) : notification.metadata.trend === 'down' ? (
                                      <TrendingDown className="h-3 w-3 text-red-500" />
                                    ) : null}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;
