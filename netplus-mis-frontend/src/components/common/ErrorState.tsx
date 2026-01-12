/**
 * frontend/src/components/common/ErrorState.tsx
 * 에러 상태 공통 컴포넌트
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  WifiOff,
  ServerCrash,
  ShieldAlert,
  RefreshCw,
  Home,
} from 'lucide-react';
import { cn } from '@/utils/classNames';

export type ErrorType =
  | 'error'
  | 'warning'
  | 'network'
  | 'server'
  | 'permission'
  | 'notfound'
  | 'unknown';

export interface ErrorStateProps {
  /** 에러 타입 */
  type?: ErrorType;
  
  /** 에러 제목 */
  title?: string;
  
  /** 에러 메시지 */
  message?: string;
  
  /** 에러 객체 */
  error?: Error | unknown;
  
  /** 재시도 버튼 표시 */
  showRetry?: boolean;
  
  /** 재시도 핸들러 */
  onRetry?: () => void;
  
  /** 홈으로 가기 버튼 표시 */
  showHome?: boolean;
  
  /** 홈으로 가기 핸들러 */
  onHome?: () => void;
  
  /** 전체 화면 */
  fullScreen?: boolean;
  
  /** 추가 액션 버튼 */
  actions?: React.ReactNode;
  
  /** 추가 CSS 클래스 */
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'error',
  title,
  message,
  error,
  showRetry = true,
  onRetry,
  showHome = false,
  onHome,
  fullScreen = false,
  actions,
  className,
}) => {
  // 에러 타입별 설정
  const errorConfig: Record<
    ErrorType,
    {
      icon: React.ComponentType<{ className?: string }>;
      defaultTitle: string;
      defaultMessage: string;
      color: string;
      bgColor: string;
    }
  > = {
    error: {
      icon: XCircle,
      defaultTitle: '오류가 발생했습니다',
      defaultMessage: '요청을 처리하는 중 문제가 발생했습니다.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    warning: {
      icon: AlertTriangle,
      defaultTitle: '주의가 필요합니다',
      defaultMessage: '일부 기능이 정상적으로 작동하지 않을 수 있습니다.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    network: {
      icon: WifiOff,
      defaultTitle: '네트워크 연결 오류',
      defaultMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    server: {
      icon: ServerCrash,
      defaultTitle: '서버 오류',
      defaultMessage: '서버에서 응답이 없습니다. 잠시 후 다시 시도해주세요.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    permission: {
      icon: ShieldAlert,
      defaultTitle: '권한이 없습니다',
      defaultMessage: '이 기능에 접근할 권한이 없습니다.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    notfound: {
      icon: AlertCircle,
      defaultTitle: '페이지를 찾을 수 없습니다',
      defaultMessage: '요청하신 페이지가 존재하지 않습니다.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    unknown: {
      icon: AlertCircle,
      defaultTitle: '알 수 없는 오류',
      defaultMessage: '예상치 못한 오류가 발생했습니다.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  const errorTitle = title || config.defaultTitle;
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : null) ||
    config.defaultMessage;

  const containerClasses = cn(
    'flex flex-col items-center justify-center p-8',
    fullScreen && 'min-h-screen',
    !fullScreen && 'min-h-[400px]',
    className
  );

  return (
    <div className={containerClasses} role="alert" aria-live="assertive">
      {/* 아이콘 */}
      <div className={cn('p-4 rounded-full mb-6', config.bgColor)}>
        <Icon className={cn('w-12 h-12', config.color)} />
      </div>

      {/* 제목 */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        {errorTitle}
      </h2>

      {/* 메시지 */}
      <p className="text-gray-600 text-center max-w-md mb-8">{errorMessage}</p>

      {/* 에러 스택 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && error instanceof Error && (
        <details className="mb-6 max-w-2xl w-full">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            에러 상세 정보 (개발용)
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {error.stack}
          </pre>
        </details>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-wrap gap-3 justify-center">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        )}

        {showHome && onHome && (
          <button
            onClick={onHome}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home className="w-4 h-4" />
            홈으로
          </button>
        )}

        {actions}
      </div>
    </div>
  );
};

// 인라인 에러 (작은 영역용)
export const InlineError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// 필드 에러 (폼 필드용)
export const FieldError: React.FC<{
  message?: string;
  className?: string;
}> = ({ message, className }) => {
  if (!message) return null;

  return (
    <p className={cn('text-sm text-red-600 mt-1', className)} role="alert">
      {message}
    </p>
  );
};

// 배너 에러 (상단 알림용)
export const ErrorBanner: React.FC<{
  message: string;
  type?: 'error' | 'warning';
  onClose?: () => void;
  className?: string;
}> = ({ message, type = 'error', onClose, className }) => {
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-yellow-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-yellow-800';
  const Icon = type === 'error' ? XCircle : AlertTriangle;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 border rounded-lg',
        bgColor,
        borderColor,
        textColor,
        className
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded transition-colors"
          aria-label="닫기"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorState;
