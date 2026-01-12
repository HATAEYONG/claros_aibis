/**
 * frontend/src/components/common/LoadingState.tsx
 * 로딩 상태 공통 컴포넌트
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';

export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';

export interface LoadingStateProps {
  /** 로딩 메시지 */
  message?: string;
  
  /** 크기 */
  size?: LoadingSize;
  
  /** 변형 */
  variant?: LoadingVariant;
  
  /** 전체 화면 */
  fullScreen?: boolean;
  
  /** 중앙 정렬 */
  centered?: boolean;
  
  /** 추가 CSS 클래스 */
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = '로딩 중...',
  size = 'md',
  variant = 'spinner',
  fullScreen = false,
  centered = true,
  className,
}) => {
  const sizeClasses: Record<LoadingSize, { spinner: string; text: string }> = {
    sm: { spinner: 'w-4 h-4', text: 'text-sm' },
    md: { spinner: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg' },
    xl: { spinner: 'w-16 h-16', text: 'text-xl' },
  };

  const renderSpinner = () => (
    <Loader2 className={cn(sizeClasses[size].spinner, 'animate-spin text-blue-600')} />
  );

  const renderDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-blue-600',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-5 h-5'
          )}
          style={{
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        'rounded-full bg-blue-600 animate-pulse',
        sizeClasses[size].spinner
      )}
    />
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-md">
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-4',
    fullScreen && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50',
    !fullScreen && centered && 'min-h-[400px]',
    className
  );

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {renderLoader()}
      {message && variant !== 'skeleton' && (
        <p className={cn('text-gray-600 font-medium', sizeClasses[size].text)}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};

// 인라인 로딩 스피너 (텍스트와 함께 사용)
export const InlineLoading: React.FC<{
  size?: LoadingSize;
  className?: string;
}> = ({ size = 'sm', className }) => {
  const sizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size];

  return (
    <Loader2
      className={cn(sizeClass, 'animate-spin text-current', className)}
      aria-hidden="true"
    />
  );
};

// 버튼 로딩 스피너
export const ButtonLoading: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ loading = false, children, className }) => {
  if (!loading) return <>{children}</>;

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      {children}
    </span>
  );
};

// 스켈레톤 로더
export const Skeleton: React.FC<{
  className?: string;
  count?: number;
}> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('bg-gray-200 rounded animate-pulse', className)}
        />
      ))}
    </>
  );
};

// CSS 애니메이션 추가 (global styles에 추가 필요)
export const loadingStyles = `
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

export default LoadingState;
