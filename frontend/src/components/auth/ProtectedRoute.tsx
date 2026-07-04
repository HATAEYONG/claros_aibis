/**
 * frontend/src/components/auth/ProtectedRoute.tsx
 * 보호된 라우트 컴포넌트
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** 필요한 권한 (하나라도 있으면 접근 가능) */
  permissions?: string[];
  /** 필요한 역할 (하나라도 있으면 접근 가능) */
  roles?: string[];
  /** 권한 없을 때 리다이렉트 경로 */
  redirectTo?: string;
  /** 권한 없을 때 에러 표시 여부 (true면 에러 페이지, false면 리다이렉트) */
  showError?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions = [],
  roles = [],
  redirectTo = '/login',
  showError = false,
}) => {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // 로딩 중
  if (isLoading) {
    return <LoadingState message="인증 확인 중..." fullScreen />;
  }

  // 인증되지 않음
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 권한 확인
  const hasRequiredPermission =
    permissions.length === 0 || permissions.some((p) => hasPermission(p));

  const hasRequiredRole = roles.length === 0 || roles.some((r) => hasRole(r));

  // 권한 없음
  if (!hasRequiredPermission || !hasRequiredRole) {
    if (showError) {
      return (
        <ErrorState
          type="permission"
          title="접근 권한이 없습니다"
          message="이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하세요."
          showHome
          onHome={() => (window.location.href = '/')}
          fullScreen
        />
      );
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 권한 있음 - 자식 컴포넌트 렌더링
  return <>{children}</>;
};

// 권한 체크 HOC (Higher-Order Component)
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// 특정 권한이 있을 때만 렌더링하는 컴포넌트
export const Can: React.FC<{
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, role, children, fallback = null }) => {
  const { hasPermission, hasRole } = useAuth();

  const canAccess =
    (!permission || hasPermission(permission)) && (!role || hasRole(role));

  return <>{canAccess ? children : fallback}</>;
};

export default ProtectedRoute;
