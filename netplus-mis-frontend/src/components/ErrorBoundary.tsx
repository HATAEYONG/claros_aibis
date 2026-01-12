/**
 * frontend/src/components/ErrorBoundary.tsx
 * 전역 에러 바운더리
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './common/ErrorState';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 에러 정보 저장
    this.setState({
      error,
      errorInfo,
    });

    // 외부 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 에러 리포팅 서비스로 전송 (Sentry 등)
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.handleRetry
        );
      }

      // 기본 에러 화면
      return (
        <ErrorState
          type="error"
          title="예상치 못한 오류가 발생했습니다"
          message="죄송합니다. 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
          error={this.state.error}
          showRetry
          onRetry={this.handleRetry}
          showHome
          onHome={() => (window.location.href = '/')}
          fullScreen
        />
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트용 HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
