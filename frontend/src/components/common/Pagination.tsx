/**
 * frontend/src/components/common/Pagination.tsx
 * 페이지네이션 컴포넌트
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/classNames';

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number;
  
  /** 전체 페이지 수 */
  totalPages: number;
  
  /** 페이지 변경 핸들러 */
  onPageChange: (page: number) => void;
  
  /** 페이지 크기 */
  pageSize?: number;
  
  /** 페이지 크기 변경 핸들러 */
  onPageSizeChange?: (size: number) => void;
  
  /** 페이지 크기 옵션 */
  pageSizeOptions?: number[];
  
  /** 전체 아이템 수 */
  totalItems?: number;
  
  /** 표시할 페이지 버튼 수 */
  siblingCount?: number;
  
  /** 간단한 모드 (이전/다음만) */
  simple?: boolean;
  
  /** 비활성화 */
  disabled?: boolean;
  
  /** 추가 CSS 클래스 */
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 20,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  totalItems,
  siblingCount = 1,
  simple = false,
  disabled = false,
  className,
}) => {
  // 페이지 번호 배열 생성
  const generatePageNumbers = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3; // 첫 페이지 + 마지막 페이지 + 현재 페이지 주변
    const totalBlocks = totalNumbers + 2; // ... 포함

    if (totalPages <= totalBlocks) {
      // 페이지가 적으면 모두 표시
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [
        ...Array.from({ length: leftItemCount }, (_, i) => i + 1),
        '...',
        totalPages,
      ];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [
        1,
        '...',
        ...Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        ),
      ];
    }

    return [
      1,
      '...',
      ...Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      ),
      '...',
      totalPages,
    ];
  };

  const pageNumbers = generatePageNumbers();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || disabled) {
      return;
    }
    onPageChange(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange?.(newSize);
  };

  // 간단한 모드
  if (simple) {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === 1 || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </button>

        <span className="text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === totalPages || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          다음
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 일반 모드
  return (
    <div className={cn('flex items-center justify-between flex-wrap gap-4', className)}>
      {/* 왼쪽: 페이지 크기 선택 */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            페이지당 표시:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={disabled}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}개
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 가운데: 페이지 네비게이션 */}
      <div className="flex items-center gap-1">
        {/* 첫 페이지 */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === 1 || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="첫 페이지"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* 이전 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === 1 || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 페이지 번호들 */}
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === '...') {
            return (
              <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">
                ...
              </span>
            );
          }

          const page = pageNumber as number;
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              className={cn(
                'min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-label={`${page}페이지`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* 다음 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === totalPages || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 마지막 페이지 */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === totalPages || disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="마지막 페이지"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* 오른쪽: 전체 아이템 정보 */}
      {totalItems !== undefined && (
        <div className="text-sm text-gray-700">
          전체 {totalItems.toLocaleString()}개
        </div>
      )}
    </div>
  );
};

export default Pagination;
