/**
 * frontend/src/utils/formatters.ts
 * 공통 포맷팅 유틸리티 함수
 */

/**
 * 통화 포맷팅
 */
export const formatCurrency = (
  value: number,
  options?: {
    locale?: string;
    currency?: string;
    compact?: boolean;
    decimals?: number;
  }
): string => {
  const {
    locale = 'ko-KR',
    currency = 'KRW',
    compact = true,
    decimals,
  } = options || {};

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals !== undefined ? decimals : compact ? 1 : 0,
  });

  return formatter.format(value);
};

/**
 * 숫자 포맷팅
 */
export const formatNumber = (
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
    compact?: boolean;
  }
): string => {
  const {
    locale = 'ko-KR',
    decimals = 0,
    compact = false,
  } = options || {};

  const formatter = new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

  return formatter.format(value);
};

/**
 * 퍼센트 포맷팅
 */
export const formatPercent = (
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string => {
  const { decimals = 1, showSign = false } = options || {};

  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';

  return `${sign}${formatted}%`;
};

/**
 * 날짜 포맷팅
 */
export const formatDate = (
  date: string | Date,
  options?: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
    timeZone?: string;
  }
): string => {
  const {
    locale = 'ko-KR',
    format = 'medium',
    timeZone = 'Asia/Seoul',
  } = options || {};

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    ...(format === 'short' && {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }),
    ...(format === 'medium' && {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    ...(format === 'long' && {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }),
    ...(format === 'full' && {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
};

/**
 * 날짜/시간 포맷팅
 */
export const formatDateTime = (
  date: string | Date,
  options?: {
    locale?: string;
    dateFormat?: 'short' | 'medium' | 'long';
    timeFormat?: 'short' | 'medium';
    timeZone?: string;
  }
): string => {
  const {
    locale = 'ko-KR',
    dateFormat = 'medium',
    timeFormat = 'short',
    timeZone = 'Asia/Seoul',
  } = options || {};

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    year: 'numeric',
    month: dateFormat === 'short' ? '2-digit' : dateFormat === 'medium' ? 'short' : 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(timeFormat === 'medium' && { second: '2-digit' }),
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
};

/**
 * 상대 시간 포맷팅 (예: "2시간 전")
 */
export const formatRelativeTime = (
  date: string | Date,
  options?: {
    locale?: string;
    now?: Date;
  }
): string => {
  const { locale = 'ko-KR', now = new Date() } = options || {};

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSec < 60) {
    return rtf.format(-diffSec, 'second');
  } else if (diffMin < 60) {
    return rtf.format(-diffMin, 'minute');
  } else if (diffHour < 24) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffDay < 7) {
    return rtf.format(-diffDay, 'day');
  } else if (diffDay < 30) {
    return rtf.format(-Math.floor(diffDay / 7), 'week');
  } else if (diffDay < 365) {
    return rtf.format(-Math.floor(diffDay / 30), 'month');
  } else {
    return rtf.format(-Math.floor(diffDay / 365), 'year');
  }
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 전화번호 포맷팅
 */
export const formatPhoneNumber = (
  phone: string,
  format: 'kr' | 'intl' = 'kr'
): string => {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');

  if (format === 'kr') {
    // 한국 전화번호
    if (numbers.length === 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }

  return phone;
};

/**
 * 사업자등록번호 포맷팅
 */
export const formatBusinessNumber = (number: string): string => {
  const numbers = number.replace(/\D/g, '');

  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }

  return number;
};

/**
 * 숫자를 약어로 변환 (예: 1000 -> 1K)
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return `${(num / 1_000_000_000).toFixed(1)}B`;
};

/**
 * 시간 duration 포맷팅 (초 -> "1h 30m 45s")
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};
