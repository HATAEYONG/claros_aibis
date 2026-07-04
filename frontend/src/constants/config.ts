/**
 * frontend/src/constants/config.ts
 * 애플리케이션 설정 상수
 */

// 환경 변수
const getEnv = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || process.env[key] || defaultValue;
};

// API 설정
export const API_CONFIG = {
  BASE_URL: getEnv('VITE_API_URL', 'http://localhost:8000'),
  WS_URL: getEnv('VITE_WS_URL', 'ws://localhost:8000'),
  TIMEOUT: 30000, // 30초
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1초
} as const;

// 인증 설정
export const AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY_MINUTES: 15,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  REMEMBER_ME_DAYS: 30,
} as const;

// 페이지네이션 설정
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// 테이블 설정
export const TABLE_CONFIG = {
  DEFAULT_SORT_ORDER: 'desc' as const,
  EMPTY_MESSAGE: '데이터가 없습니다',
  LOADING_MESSAGE: '로딩 중...',
} as const;

// Toast 알림 설정
export const TOAST_CONFIG = {
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  POSITION: 'top-right' as const,
  MAX_TOASTS: 5,
} as const;

// 파일 업로드 설정
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_DISPLAY: '10MB',
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    SPREADSHEETS: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  ACCEPTED_EXTENSIONS: {
    IMAGES: '.jpg,.jpeg,.png,.gif,.webp',
    DOCUMENTS: '.pdf,.doc,.docx',
    SPREADSHEETS: '.xls,.xlsx,.csv',
  },
} as const;

// WebSocket 설정
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 3000, // 3초
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000, // 30초
} as const;

// 캐시 설정
export const CACHE_CONFIG = {
  DASHBOARD_TTL: 60, // 1분
  LIST_DATA_TTL: 300, // 5분
  STATIC_DATA_TTL: 3600, // 1시간
} as const;

// 날짜/시간 설정
export const DATE_CONFIG = {
  LOCALE: 'ko-KR',
  TIMEZONE: 'Asia/Seoul',
  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  TIME_FORMAT: 'HH:mm:ss',
  DISPLAY_DATE_FORMAT: 'YYYY년 MM월 DD일',
  DISPLAY_DATETIME_FORMAT: 'YYYY년 MM월 DD일 HH:mm',
} as const;

// 차트 설정
export const CHART_CONFIG = {
  DEFAULT_HEIGHT: 300,
  COLORS: {
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#06b6d4',
  },
  GRID: {
    STROKE_DASHARRAY: '3 3',
    STROKE: '#e5e7eb',
  },
  TOOLTIP: {
    CURSOR_FILL: '#f3f4f6',
  },
} as const;

// 검색 설정
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // 300ms
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 10,
} as const;

// 로딩 설정
export const LOADING_CONFIG = {
  MINIMUM_DISPLAY_TIME: 300, // 최소 로딩 표시 시간 (300ms)
  SKELETON_COUNT: 5,
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  SERVER_ERROR: '서버 오류가 발생했습니다',
  UNAUTHORIZED: '로그인이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
  VALIDATION_ERROR: '입력값을 확인해주세요',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '저장되었습니다',
  UPDATE_SUCCESS: '수정되었습니다',
  DELETE_SUCCESS: '삭제되었습니다',
  CREATE_SUCCESS: '생성되었습니다',
  UPLOAD_SUCCESS: '업로드되었습니다',
  SEND_SUCCESS: '전송되었습니다',
} as const;

// 확인 메시지
export const CONFIRM_MESSAGES = {
  DELETE: '정말 삭제하시겠습니까?',
  CANCEL: '작업을 취소하시겠습니까?',
  SAVE: '변경사항을 저장하시겠습니까?',
  LOGOUT: '로그아웃하시겠습니까?',
  LEAVE_PAGE: '페이지를 떠나시겠습니까? 저장하지 않은 변경사항은 삭제됩니다.',
} as const;

// 애플리케이션 정보
export const APP_CONFIG = {
  NAME: '유한 MIS',
  FULL_NAME: '유한산업 제조 지능화 시스템',
  VERSION: '1.0.0',
  DESCRIPTION: 'Manufacturing Intelligence System',
  COMPANY: '유한산업',
  SUPPORT_EMAIL: 'support@yuhan.com',
  COPYRIGHT: '© 2024 유한산업. All rights reserved.',
} as const;

// 개발 설정
export const DEV_CONFIG = {
  ENABLE_REDUX_DEVTOOLS: import.meta.env.DEV,
  ENABLE_CONSOLE_LOGS: import.meta.env.DEV,
  ENABLE_ERROR_BOUNDARY: true,
  SHOW_API_ERRORS: import.meta.env.DEV,
} as const;

// 기능 플래그
export const FEATURE_FLAGS = {
  ENABLE_AI_CHAT: true,
  ENABLE_DARK_MODE: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: true,
  ENABLE_ANALYTICS: true,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_BATCH_OPERATIONS: true,
} as const;

// 권한 코드
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Production
  PRODUCTION_VIEW: 'production.view',
  PRODUCTION_CREATE: 'production.create',
  PRODUCTION_UPDATE: 'production.update',
  PRODUCTION_DELETE: 'production.delete',
  PRODUCTION_APPROVE: 'production.approve',
  
  // Quality
  QUALITY_VIEW: 'quality.view',
  QUALITY_CREATE: 'quality.create',
  QUALITY_APPROVE: 'quality.approve',
  
  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  
  // Equipment
  EQUIPMENT_VIEW: 'equipment.view',
  EQUIPMENT_UPDATE: 'equipment.update',
  
  // ERP
  ERP_VIEW: 'erp.view',
  ERP_EXECUTE: 'erp.execute',
  
  // AI
  AI_VIEW: 'ai.view',
  AI_EXECUTE: 'ai.execute',
  
  // Admin
  ADMIN_VIEW: 'admin.view',
  ADMIN_USER_MANAGEMENT: 'admin.user_management',
  ADMIN_PERMISSION_MANAGEMENT: 'admin.permission_management',
} as const;

// 역할
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const;

// 정규식 패턴
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  BUSINESS_NUMBER: /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NUMBER_ONLY: /^[0-9]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

// 타입 export
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = typeof ROLES[keyof typeof ROLES];
