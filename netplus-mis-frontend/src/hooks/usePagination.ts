/**
 * frontend/src/hooks/usePagination.ts
 * 페이지네이션 상태 관리 Hook
 */

import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  /** 초기 페이지 (1부터 시작) */
  initialPage?: number;
  
  /** 초기 페이지 크기 */
  initialPageSize?: number;
  
  /** 전체 아이템 수 */
  totalItems: number;
}

export interface PaginationState {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number;
  
  /** 페이지 크기 */
  pageSize: number;
  
  /** 전체 페이지 수 */
  totalPages: number;
  
  /** 전체 아이템 수 */
  totalItems: number;
  
  /** 현재 페이지 첫 아이템 인덱스 (0부터 시작) */
  startIndex: number;
  
  /** 현재 페이지 마지막 아이템 인덱스 (0부터 시작) */
  endIndex: number;
  
  /** 페이지 변경 */
  setPage: (page: number) => void;
  
  /** 페이지 크기 변경 */
  setPageSize: (size: number) => void;
  
  /** 다음 페이지로 이동 */
  nextPage: () => void;
  
  /** 이전 페이지로 이동 */
  previousPage: () => void;
  
  /** 첫 페이지로 이동 */
  firstPage: () => void;
  
  /** 마지막 페이지로 이동 */
  lastPage: () => void;
  
  /** 첫 페이지 여부 */
  isFirstPage: boolean;
  
  /** 마지막 페이지 여부 */
  isLastPage: boolean;
  
  /** 리셋 */
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  totalItems,
}: UsePaginationOptions): PaginationState {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 전체 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  // 인덱스 계산
  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalItems - 1);
  }, [startIndex, pageSize, totalItems]);

  // 페이지 변경
  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  // 페이지 크기 변경
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      // 페이지 크기 변경 시 첫 페이지로 이동
      setCurrentPage(1);
    },
    []
  );

  // 다음 페이지
  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  // 이전 페이지
  const previousPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  // 첫 페이지
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  // 마지막 페이지
  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  // 리셋
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    setPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    reset,
  };
}

/**
 * 배열을 페이지네이션하는 Hook
 */
export function usePaginatedData<T>(
  data: T[],
  options: Omit<UsePaginationOptions, 'totalItems'>
): PaginationState & { paginatedData: T[] } {
  const pagination = usePagination({
    ...options,
    totalItems: data.length,
  });

  const paginatedData = useMemo(() => {
    return data.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [data, pagination.startIndex, pagination.endIndex]);

  return {
    ...pagination,
    paginatedData,
  };
}

export default usePagination;
