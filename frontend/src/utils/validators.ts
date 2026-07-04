/**
 * frontend/src/utils/validators.ts
 * 데이터 검증 유틸리티
 */

import { REGEX_PATTERNS } from '@/constants/config';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 이메일 유효성 검사
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: '이메일을 입력해주세요' };
  }

  if (!REGEX_PATTERNS.EMAIL.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식이 아닙니다' };
  }

  return { isValid: true };
};

/**
 * 전화번호 유효성 검사
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, error: '전화번호를 입력해주세요' };
  }

  if (!REGEX_PATTERNS.PHONE.test(phone)) {
    return { isValid: false, error: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)' };
  }

  return { isValid: true };
};

/**
 * 비밀번호 유효성 검사
 */
export const validatePassword = (
  password: string,
  options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  }
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = true,
  } = options || {};

  if (!password) {
    return { isValid: false, error: '비밀번호를 입력해주세요' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `비밀번호는 최소 ${minLength}자 이상이어야 합니다` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: '대문자를 포함해야 합니다' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: '소문자를 포함해야 합니다' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: '숫자를 포함해야 합니다' };
  }

  if (requireSpecialChar && !/[@$!%*?&]/.test(password)) {
    return { isValid: false, error: '특수문자(@$!%*?&)를 포함해야 합니다' };
  }

  return { isValid: true };
};

/**
 * 비밀번호 확인 검사
 */
export const validatePasswordConfirm = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: '비밀번호 확인을 입력해주세요' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: '비밀번호가 일치하지 않습니다' };
  }

  return { isValid: true };
};

/**
 * 사업자등록번호 유효성 검사
 */
export const validateBusinessNumber = (number: string): ValidationResult => {
  if (!number) {
    return { isValid: false, error: '사업자등록번호를 입력해주세요' };
  }

  const cleaned = number.replace(/[^0-9]/g, '');

  if (cleaned.length !== 10) {
    return { isValid: false, error: '사업자등록번호는 10자리여야 합니다' };
  }

  // 검증 알고리즘
  const checkDigit = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * checkDigit[i];
  }

  sum += Math.floor((parseInt(cleaned[8]) * 5) / 10);
  const lastDigit = (10 - (sum % 10)) % 10;

  if (lastDigit !== parseInt(cleaned[9])) {
    return { isValid: false, error: '올바른 사업자등록번호가 아닙니다' };
  }

  return { isValid: true };
};

/**
 * 필수 입력 검사
 */
export const validateRequired = (value: any, fieldName = '필드'): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName}은(는) 필수 입력입니다` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName}은(는) 필수 입력입니다` };
  }

  return { isValid: true };
};

/**
 * 최소 길이 검사
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName = '필드'
): ValidationResult => {
  if (!value || value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다`,
    };
  }

  return { isValid: true };
};

/**
 * 최대 길이 검사
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName = '필드'
): ValidationResult => {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다`,
    };
  }

  return { isValid: true };
};

/**
 * 숫자 범위 검사
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName = '값'
): ValidationResult => {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName}은(는) ${min}에서 ${max} 사이여야 합니다`,
    };
  }

  return { isValid: true };
};

/**
 * 숫자만 입력 검사
 */
export const validateNumberOnly = (value: string): ValidationResult => {
  if (!REGEX_PATTERNS.NUMBER_ONLY.test(value)) {
    return { isValid: false, error: '숫자만 입력 가능합니다' };
  }

  return { isValid: true };
};

/**
 * 영문/숫자만 입력 검사
 */
export const validateAlphanumeric = (value: string): ValidationResult => {
  if (!REGEX_PATTERNS.ALPHANUMERIC.test(value)) {
    return { isValid: false, error: '영문자와 숫자만 입력 가능합니다' };
  }

  return { isValid: true };
};

/**
 * 날짜 유효성 검사
 */
export const validateDate = (
  date: string | Date,
  options?: {
    min?: Date;
    max?: Date;
  }
): ValidationResult => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: '올바른 날짜 형식이 아닙니다' };
  }

  if (options?.min && dateObj < options.min) {
    return {
      isValid: false,
      error: `날짜는 ${options.min.toLocaleDateString('ko-KR')} 이후여야 합니다`,
    };
  }

  if (options?.max && dateObj > options.max) {
    return {
      isValid: false,
      error: `날짜는 ${options.max.toLocaleDateString('ko-KR')} 이전이어야 합니다`,
    };
  }

  return { isValid: true };
};

/**
 * 파일 크기 검사
 */
export const validateFileSize = (
  file: File,
  maxSizeInBytes: number
): ValidationResult => {
  if (file.size > maxSizeInBytes) {
    const maxSizeMB = (maxSizeInBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다`,
    };
  }

  return { isValid: true };
};

/**
 * 파일 타입 검사
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): ValidationResult => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 형식입니다`,
    };
  }

  return { isValid: true };
};

/**
 * URL 유효성 검사
 */
export const validateURL = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: false, error: 'URL을 입력해주세요' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: '올바른 URL 형식이 아닙니다' };
  }
};

/**
 * 여러 검증 규칙 실행
 */
export const validate = (
  value: any,
  rules: Array<(value: any) => ValidationResult>
): ValidationResult => {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
};

/**
 * 폼 검증
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, (value: any) => ValidationResult>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, rule] of Object.entries(rules)) {
    if (rule) {
      const result = rule(data[field as keyof T]);
      if (!result.isValid) {
        errors[field as keyof T] = result.error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// 타입 가드
export const isEmail = (value: string): boolean => validateEmail(value).isValid;
export const isPhone = (value: string): boolean => validatePhone(value).isValid;
export const isURL = (value: string): boolean => validateURL(value).isValid;
