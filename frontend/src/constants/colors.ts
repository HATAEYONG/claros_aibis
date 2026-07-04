/**
 * frontend/src/constants/colors.ts
 * 색상 상수 정의
 */

// KPI 색상
export const KPI_COLORS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500',
    border: 'border-green-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-500',
    border: 'border-yellow-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500',
    border: 'border-purple-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-500',
    border: 'border-red-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-500',
    border: 'border-orange-200',
  },
} as const;

// 상태 색상 (심각도)
export const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
} as const;

// 우선순위 색상
export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-purple-100 text-purple-800 border-purple-200',
} as const;

// 상태 색상 (작업 상태)
export const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  running: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

// 설비 상태 색상
export const EQUIPMENT_STATUS_COLORS = {
  operating: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-500',
    label: '가동중',
  },
  idle: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'bg-yellow-500',
    label: '대기',
  },
  maintenance: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
    label: '보전',
  },
  breakdown: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-500',
    label: '고장',
  },
} as const;

// 직원 상태 색상
export const EMPLOYEE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  leave: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
} as const;

// 품질 상태 색상
export const QUALITY_STATUS_COLORS = {
  good: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
} as const;

// 차트 색상 팔레트
export const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  blue: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
  green: ['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'],
  red: ['#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
  purple: ['#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
} as const;

// 배지 색상
export const BADGE_COLORS = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
} as const;

// 텍스트 색상
export const TEXT_COLORS = {
  primary: 'text-gray-900',
  secondary: 'text-gray-600',
  muted: 'text-gray-500',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
} as const;

// 타입 정의
export type KPIColor = keyof typeof KPI_COLORS;
export type SeverityLevel = keyof typeof SEVERITY_COLORS;
export type PriorityLevel = keyof typeof PRIORITY_COLORS;
export type StatusType = keyof typeof STATUS_COLORS;
export type EquipmentStatus = keyof typeof EQUIPMENT_STATUS_COLORS;
export type EmployeeStatus = keyof typeof EMPLOYEE_STATUS_COLORS;
export type QualityStatus = keyof typeof QUALITY_STATUS_COLORS;
export type BadgeColor = keyof typeof BADGE_COLORS;
export type TextColor = keyof typeof TEXT_COLORS;
