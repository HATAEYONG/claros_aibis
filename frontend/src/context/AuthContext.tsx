/**
 * frontend/src/context/AuthContext.tsx
 * 인증 Context
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 인증 확인
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // 사용자 정보 로드
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      // API에서 사용자 정보 가져오기
      const response = await api.getCurrentUser();
      setUser(response as User);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // 토큰이 유효하지 않으면 제거
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({ username, password });

      // 토큰 저장
      const accessToken = response.access || response.access_token;
      const refreshToken = response.refresh || '';
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      // 사용자 정보 설정
      setUser(response.user as User);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // 토큰 제거
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // 사용자 정보 초기화
    setUser(null);

    // 홈으로 리다이렉트
    window.location.href = '/login';
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
