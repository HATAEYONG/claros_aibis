/**
 * frontend/src/components/auth/LoginPage.tsx
 * 로그인 페이지
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/classNames';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // 리다이렉트 경로 (로그인 전 접근하려던 페이지)
  const from = (location.state as any)?.from?.pathname || '/';

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (password.length < 4) {
      newErrors.password = '비밀번호는 최소 4자 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await login(username, password);
      toast.success('로그인 성공', `${username}님 환영합니다!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        toast.error('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다');
        setErrors({ password: '아이디 또는 비밀번호를 확인해주세요' });
      } else if (error.response?.status === 429) {
        toast.error('로그인 실패', '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요');
      } else {
        toast.error('로그인 실패', '서버 오류가 발생했습니다');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">유한 MIS</h1>
          <p className="text-gray-600">Manufacturing Intelligence System</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 아이디 입력 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  className={cn(
                    'block w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  )}
                  placeholder="아이디를 입력하세요"
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={cn(
                    'block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                    errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  )}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 로그인 유지 */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                로그인 상태 유지
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* 하단 링크 */}
          <div className="mt-6 text-center space-y-2">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2024 유한산업. All rights reserved.</p>
          <p className="mt-1">
            문의:{' '}
            <a href="mailto:support@yuhan.com" className="text-blue-600 hover:underline">
              support@yuhan.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
