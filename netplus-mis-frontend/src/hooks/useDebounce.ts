/**
 * frontend/src/hooks/useDebounce.ts
 * 디바운스 Hook
 */

import { useState, useEffect } from 'react';

/**
 * 값을 디바운스하는 Hook
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 타이머 설정
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 클린업: 값이 변경되면 이전 타이머 취소
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 함수를 디바운스하는 Hook
 * @param callback 디바운스할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // 이전 타이머 취소
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 새 타이머 설정
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

export default useDebounce;
