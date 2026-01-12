/**
 * frontend/src/components/common/SearchBar.tsx
 * 검색 바 컴포넌트
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchBarProps {
  /** 검색어 */
  value?: string;
  
  /** 검색어 변경 핸들러 */
  onChange?: (value: string) => void;
  
  /** 검색 실행 핸들러 */
  onSearch?: (value: string) => void;
  
  /** placeholder */
  placeholder?: string;
  
  /** 디바운스 지연 시간 (ms) */
  debounceDelay?: number;
  
  /** 로딩 상태 */
  loading?: boolean;
  
  /** 자동 포커스 */
  autoFocus?: boolean;
  
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  
  /** 전체 너비 */
  fullWidth?: boolean;
  
  /** 비활성화 */
  disabled?: boolean;
  
  /** 추가 CSS 클래스 */
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = '검색...',
  debounceDelay = 300,
  loading = false,
  autoFocus = false,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
}) => {
  const [searchValue, setSearchValue] = useState(value);
  const debouncedValue = useDebounce(searchValue, debounceDelay);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  // 외부 value 변경 시 동기화
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // 디바운스된 값 변경 시 검색 실행
  useEffect(() => {
    // 첫 렌더링 시에는 검색 실행 안함
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setSearchValue('');
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(searchValue);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn('relative', fullWidth ? 'w-full' : 'w-full max-w-md', className)}>
      {/* 검색 아이콘 */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {loading ? (
          <Loader2 className={cn(iconSizeClasses[size], 'text-gray-400 animate-spin')} />
        ) : (
          <Search className={cn(iconSizeClasses[size], 'text-gray-400')} />
        )}
      </div>

      {/* 입력 필드 */}
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          'block w-full pl-10 pr-10 border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'placeholder-gray-400',
          'transition-colors',
          sizeClasses[size],
          disabled && 'bg-gray-100 cursor-not-allowed',
          !disabled && 'bg-white'
        )}
        aria-label="검색"
      />

      {/* 지우기 버튼 */}
      {searchValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 transition-colors"
          aria-label="검색어 지우기"
        >
          <X className={cn(iconSizeClasses[size], 'text-gray-400')} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
