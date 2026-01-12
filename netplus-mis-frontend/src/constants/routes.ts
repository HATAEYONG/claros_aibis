/**
 * frontend/src/constants/routes.ts
 * 라우트 경로 상수
 */

// 인증 관련 라우트
export const AUTH_ROUTES = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
} as const;

// 대시보드 라우트
export const DASHBOARD_ROUTES = {
  ROOT: '/dashboard',
  EXECUTIVE: '/dashboard/executive',
  PRODUCTION: '/dashboard/production',
  QUALITY: '/dashboard/quality',
  FINANCE: '/dashboard/finance',
  COST: '/dashboard/cost',
  INVENTORY: '/dashboard/inventory',
  EQUIPMENT: '/dashboard/equipment',
} as const;

// ERP 관련 라우트
export const ERP_ROUTES = {
  ROOT: '/erp',
  CONNECTIONS: '/erp/connections',
  TABLES: '/erp/tables',
  SYNC_JOBS: '/erp/sync-jobs',
  SETTINGS: '/erp/settings',
} as const;

// AI 관련 라우트
export const AI_ROUTES = {
  CHAT: '/chat',
  ASSISTANT: '/ai/assistant',
  ANALYSIS: '/ai/analysis',
  INSIGHTS: '/ai/insights',
} as const;

// 생산 관리 라우트
export const PRODUCTION_ROUTES = {
  ROOT: '/production',
  WORK_ORDERS: '/production/work-orders',
  WORK_ORDER_DETAIL: '/production/work-orders/:id',
  PERFORMANCE: '/production/performance',
  SCHEDULE: '/production/schedule',
  BOM: '/production/bom',
} as const;

// 품질 관리 라우트
export const QUALITY_ROUTES = {
  ROOT: '/quality',
  INSPECTIONS: '/quality/inspections',
  INSPECTION_DETAIL: '/quality/inspections/:id',
  DEFECTS: '/quality/defects',
  REPORTS: '/quality/reports',
  STANDARDS: '/quality/standards',
} as const;

// 재고 관리 라우트
export const INVENTORY_ROUTES = {
  ROOT: '/inventory',
  ITEMS: '/inventory/items',
  ITEM_DETAIL: '/inventory/items/:id',
  WAREHOUSES: '/inventory/warehouses',
  MOVEMENTS: '/inventory/movements',
  STOCK_TAKING: '/inventory/stock-taking',
} as const;

// 설비 관리 라우트
export const EQUIPMENT_ROUTES = {
  ROOT: '/equipment',
  LIST: '/equipment/list',
  EQUIPMENT_DETAIL: '/equipment/:id',
  MAINTENANCE: '/equipment/maintenance',
  BREAKDOWN: '/equipment/breakdown',
  OEE: '/equipment/oee',
} as const;

// 인사 관리 라우트
export const HR_ROUTES = {
  ROOT: '/hr',
  EMPLOYEES: '/hr/employees',
  EMPLOYEE_DETAIL: '/hr/employees/:id',
  DEPARTMENTS: '/hr/departments',
  ATTENDANCE: '/hr/attendance',
  PERFORMANCE: '/hr/performance',
} as const;

// 보고서 라우트
export const REPORT_ROUTES = {
  ROOT: '/reports',
  PRODUCTION: '/reports/production',
  QUALITY: '/reports/quality',
  INVENTORY: '/reports/inventory',
  FINANCIAL: '/reports/financial',
  CUSTOM: '/reports/custom',
} as const;

// 설정 라우트
export const SETTINGS_ROUTES = {
  ROOT: '/settings',
  PROFILE: '/settings/profile',
  ACCOUNT: '/settings/account',
  PREFERENCES: '/settings/preferences',
  NOTIFICATIONS: '/settings/notifications',
  SECURITY: '/settings/security',
  SYSTEM: '/settings/system',
  USERS: '/settings/users',
  ROLES: '/settings/roles',
  PERMISSIONS: '/settings/permissions',
} as const;

// 기타 라우트
export const MISC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  HELP: '/help',
  CONTACT: '/contact',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
  SERVER_ERROR: '/500',
} as const;

// 모든 라우트
export const ROUTES = {
  ...MISC_ROUTES,
  AUTH: AUTH_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  ERP: ERP_ROUTES,
  AI: AI_ROUTES,
  PRODUCTION: PRODUCTION_ROUTES,
  QUALITY: QUALITY_ROUTES,
  INVENTORY: INVENTORY_ROUTES,
  EQUIPMENT: EQUIPMENT_ROUTES,
  HR: HR_ROUTES,
  REPORTS: REPORT_ROUTES,
  SETTINGS: SETTINGS_ROUTES,
} as const;

// 라우트 빌더 함수
export const buildRoute = {
  workOrderDetail: (id: string | number) => `/production/work-orders/${id}`,
  inspectionDetail: (id: string | number) => `/quality/inspections/${id}`,
  itemDetail: (id: string | number) => `/inventory/items/${id}`,
  equipmentDetail: (id: string | number) => `/equipment/${id}`,
  employeeDetail: (id: string | number) => `/hr/employees/${id}`,
} as const;

// 네비게이션 메뉴 구성
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  permissions?: string[];
  children?: NavItem[];
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    label: '대시보드',
    path: DASHBOARD_ROUTES.ROOT,
    children: [
      { label: '경영 대시보드', path: DASHBOARD_ROUTES.EXECUTIVE },
      { label: '생산 현황', path: DASHBOARD_ROUTES.PRODUCTION },
      { label: '품질 현황', path: DASHBOARD_ROUTES.QUALITY },
      { label: '재무 현황', path: DASHBOARD_ROUTES.FINANCE },
    ],
  },
  {
    label: '생산 관리',
    path: PRODUCTION_ROUTES.ROOT,
    permissions: ['production.view'],
    children: [
      { label: '작업 지시', path: PRODUCTION_ROUTES.WORK_ORDERS },
      { label: '생산 실적', path: PRODUCTION_ROUTES.PERFORMANCE },
      { label: '생산 계획', path: PRODUCTION_ROUTES.SCHEDULE },
      { label: 'BOM 관리', path: PRODUCTION_ROUTES.BOM },
    ],
  },
  {
    label: '품질 관리',
    path: QUALITY_ROUTES.ROOT,
    permissions: ['quality.view'],
    children: [
      { label: '품질 검사', path: QUALITY_ROUTES.INSPECTIONS },
      { label: '불량 관리', path: QUALITY_ROUTES.DEFECTS },
      { label: '품질 보고서', path: QUALITY_ROUTES.REPORTS },
    ],
  },
  {
    label: '재고 관리',
    path: INVENTORY_ROUTES.ROOT,
    permissions: ['inventory.view'],
    children: [
      { label: '품목 관리', path: INVENTORY_ROUTES.ITEMS },
      { label: '창고 관리', path: INVENTORY_ROUTES.WAREHOUSES },
      { label: '재고 이동', path: INVENTORY_ROUTES.MOVEMENTS },
    ],
  },
  {
    label: '설비 관리',
    path: EQUIPMENT_ROUTES.ROOT,
    permissions: ['equipment.view'],
    children: [
      { label: '설비 목록', path: EQUIPMENT_ROUTES.LIST },
      { label: '보전 관리', path: EQUIPMENT_ROUTES.MAINTENANCE },
      { label: '고장 이력', path: EQUIPMENT_ROUTES.BREAKDOWN },
      { label: 'OEE 분석', path: EQUIPMENT_ROUTES.OEE },
    ],
  },
  {
    label: 'ERP 연계',
    path: ERP_ROUTES.ROOT,
    permissions: ['erp.view'],
    children: [
      { label: '연결 관리', path: ERP_ROUTES.CONNECTIONS },
      { label: '테이블 매핑', path: ERP_ROUTES.TABLES },
      { label: '동기화 작업', path: ERP_ROUTES.SYNC_JOBS },
    ],
  },
  {
    label: 'AI 어시스턴트',
    path: AI_ROUTES.CHAT,
    permissions: ['ai.view'],
  },
  {
    label: '보고서',
    path: REPORT_ROUTES.ROOT,
    permissions: ['report.view'],
    children: [
      { label: '생산 보고서', path: REPORT_ROUTES.PRODUCTION },
      { label: '품질 보고서', path: REPORT_ROUTES.QUALITY },
      { label: '재고 보고서', path: REPORT_ROUTES.INVENTORY },
      { label: '재무 보고서', path: REPORT_ROUTES.FINANCIAL },
    ],
  },
];

// 사이드바 하단 메뉴
export const BOTTOM_NAVIGATION: NavItem[] = [
  { label: '설정', path: SETTINGS_ROUTES.ROOT },
  { label: '도움말', path: MISC_ROUTES.HELP },
];

// 타입 export
export type RouteKey = keyof typeof ROUTES;
