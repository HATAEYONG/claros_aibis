/**
 * frontend/src/components/common/Toast.tsx
 * Toast 알림 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useToast, Toast as ToastType } from '@/context/ToastContext';

interface ToastItemProps {
  toast: ToastType;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / (toast.duration || 5000)) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500',
    },
  };

  const style = config[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300',
        style.bgColor,
        style.borderColor,
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slide-in'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* 진행 바 */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className={cn('h-full transition-all duration-50', style.progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        {/* 아이콘 */}
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-gray-700">{toast.message}</p>

          {/* 액션 버튼 */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// Toast 컨테이너
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

// CSS 애니메이션 (global styles에 추가)
export const toastStyles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

export default ToastContainer;
