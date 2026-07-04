# UI/UX 설계

## 개요

claros_aibis 시스템의 사용자 인터페이스 설계를 정의한다.

## 문서 개정 이력

| 버전 | 일자 | 작성자 | 수정 내용 |
|------|------|--------|----------|
| 1.0 | 2026-07-01 | AI Agent | 초기 작성 |

---

## 1. UI/UX 개요

### 1.1 디자인 원칙

| 원칙 | 설명 |
|------|------|
| 단순성 | 최소한의 클릭으로 목표 달성 |
| 일관성 | 전체 화면 동일한 패턴 적용 |
| 반응형 | 다양한 해상도 지원 |
| 접근성 | WCAG 2.1 AA 준수 |
| 피드백 | 모든 작업에 즉각적인 피드백 |

### 1.2 디자인 시스템

#### 컬러 팔레트

```css
/* Primary */
--primary-50: #E3F2FD;
--primary-100: #BBDEFB;
--primary-500: #2196F3;
--primary-700: #1976D2;
--primary-900: #0D47A1;

/* Semantic Colors */
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--info: #2196F3;

/* Neutral */
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-500: #9E9E9E;
--gray-900: #212121;
```

#### 타이포그래피

```css
/* Font Family */
--font-family-base: 'Pretendard', -apple-system, sans-serif;
--font-family-code: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

#### 스페이싱

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
```

#### 라운드

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-full: 9999px;
```

---

## 2. 레이아웃 설계

### 2.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  Header (60px)                                             │
│  ┌──────────┐  로고  메뉴1  메뉴2    사용자 정보          │
│  │          │                                           │
│  └──────────┘                                           │
├────────────┬──────────────────────────────────────────────┤
│            │                                              │
│  Sidebar   │         Content Area                         │
│  (240px)   │         (flexible)                          │
│            │                                              │
│  ────────  │  ┌────────────────────────────────────┐      │
│  📊 홈     │  │                                    │      │
│  📁 마스터  │  │            Page Content           │      │
│    데이터   │  │                                    │      │
│  📈 KPI    │  │                                    │      │
│  📊 대시보드│  │                                    │      │
│            │  │                                    │      │
│  ────────  │  └────────────────────────────────────┘      │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

### 2.2 Sidebar Navigation

**구조**:
- 로고 영역 (60px)
- 네비게이션 메뉴
- 사용자 프로필 (하단)

**메뉴 항목**:
```
홈
├── 홈 (/)
마스터 데이터
├── 계정과목 (/master/accounts)
├── 창고 (/master/warehouses)
├── 공정 (/master/processes)
└── 은행 (/master/banks)
KPI 관리
├── KPI 정의 (/kpi/definitions)
└── KPI 실적 (/kpi/facts)
대시보드
├── 경영 대시보드 (/dashboard/executive)
└── 컨트롤 타워 (/dashboard/control-tower)
```

---

## 3. 페이지 설계

### 3.1 마스터 데이터 관리 페이지

**URL**: `/master/{type}`

**레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│  [계정과목] [창고] [공정] [은행]                              │  ← 탭
├─────────────────────────────────────────────────────────┤
│  검색: [___________] 유형: [▼] 활성: [✓]                  │  ← 필터
│  [새로만들기] [내보내기] [가져오기] [일괄작업]                │  ← 액션
├─────────────────────────────────────────────────────────┤
│  ┌─────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │선택 │ 코드 │ 명칭 │ 유형 │ 상태 │ 수정 │ 삭제  │       │  ← 테이블 헤더
│  ├─────┼──────┼──────┼──────┼──────┼──────┼──────┤       │
│  │ [ ] │ 1101 │ 현금 │ 자산 │ 활성 │ ✏️   │ 🗑️   │       │  ← 데이터 행
│  │ [ ] │ 1102 │ 보통예금│ 자산│ 활성 │ ✏️   │ 🗑️   │       │
│  └─────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│                                                      [1][2][3] │  ← 페이징
└─────────────────────────────────────────────────────────┘
```

**상호작용**:
- 검색어 입력 시 실시간 필터링 (debounce 300ms)
- 필터 변경 시 자동 조회
- 정렬 헤더 클릭 시 정렬
- 체크박스 선택 후 일괄 작업 활성화
- 내보내기 클릭 시 포맷 선택 (CSV/Excel/JSON)

---

### 3.2 KPI 관리 페이지

**URL**: `/kpi/definitions`

**레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│  [재무] [원가] [생산] [품질] [영업] [구매] [제조] [관리회계]    │  ← 카테고리 탭
├─────────────────────────────────────────────────────────┤
│  재무 KPI 10개                                            │
│  [🔄 전체 재계산]                                          │  ← 액션
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  매출총이익률   │  │  영업이익률    │  │    당기순이익   │   │
│  │   15.2%       │  │   8.5%       │  │   ₩1.2B      │   │  ← KPI 카드
│  │   ✓ 양호      │  │   ✓ 양호      │  │   ! 주의      │   │
│  │  📊 📁 ⚙️     │  │  📊 📁 ⚙️     │  │  📊 📁 ⚙️     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   ROI        │  │   ROA        │  │   부채비율     │   │
│  │   12.3%      │  │   8.7%       │  │   45.2%       │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**KPI 카드 상세**:
```
┌──────────────────────────┐
│  [KPI명]                  │
│  [실적값] [단위]           │
│  목표: [목표값]            │
│  [상태 아이콘]            │
│  [📊 그래프] [📁 상세]     │
│  [⚙️ 설정]                │
└──────────────────────────┘
```

**상태 표시**:
- 🟢 양호 (green): 목표 달성
- 🟡 주의 (yellow): 경고 임계값 도달
- 🔴 위험 (red): 위험 임계값 도달
- ⚪ 중립 (gray): 데이터 없음

---

### 3.3 대시보드 페이지

**URL**: `/dashboard/executive`

**레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│  경영 대시보드                                              │
│  기간: [1월▼] 공장: [P1▼] [🔄]                             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ 매출액    │  │ 영업이익률│  │ 생산량    │  │ 수율     ││
│  │ ₩10.5B   │  │  8.5%    │  │ 50K      │  │ 98.5%   ││
│  │ ▲ 12%    │  │ ▲ 0.5%   │  │ ▲ 5%     │  │ ▲ 0.2%  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┬─────────────────────┐   │
│  │     매출 추이               │    불량률 추이        │   │
│  │     [선 그래프]             │    [선 그래프]        │   │
│  └────────────────────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐     │
│  │         KPI 현황 (카테고리별)                       │     │
│  │  [원형 차트 - 양호/주의/위험 비율]                  │     │
│  └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 컴포넌트 설계

### 4.1 공통 컴포넌트

#### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}
```

#### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}
```

#### Card

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}
```

---

### 4.2 폼 컴포넌트

#### FormField

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'select' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: (value: any) => string | null;
}
```

#### Form

```typescript
interface FormProps {
  fields: FormFieldProps[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
}
```

---

### 4.3 데이터 컴포넌트

#### DataTable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;
  sortable?: boolean;
  pagination?: PaginationProps;
  onSelectionChange?: (selected: T[]) => void;
}

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
}
```

#### KPICard

```typescript
interface KPICardProps {
  kpi: KPI;
  showTrend?: boolean;
  showActions?: boolean;
  onClick?: () => void;
}
```

---

## 5. 상태 설계

### 5.1 로딩 상태

```typescript
interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;  // 0-100
}
```

**UI 표시**:
- 전체 로딩: 스피너 + 메시지
- 부분 로딩: 스켈레톤 UI
- 진행률: 프로그레스 바

### 5.2 에러 상태

```typescript
interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**UI 표시**:
- 에러 아이콘
- 에러 메시지
- 재시도 버튼

---

## 6. 반응형 설계

### 6.1 브레이크포인트

```css
/* Mobile First */
@media (min-width: 640px)   /* sm */
@media (min-width: 768px)   /* md */
@media (min-width: 1024px)  /* lg */
@media (min-width: 1280px)  /* xl */
```

### 6.2 그리드 시스템

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
/* ... */
.col-12 { grid-column: span 12; }
```

---

## 7. 접근성

### 7.1 키보드 내비게이션

| 키 | 동작 |
|----|------|
| Tab | 다음 포커스 이동 |
| Shift+Tab | 이전 포커스 이동 |
| Enter | 현재 포커스 실행 |
| Escape | 모달/드롭다운 닫기 |
| Space | 체크박스/라디오 토글 |

### 7.2 ARIA 라벨

```html
<!-- 버튼 -->
<button aria-label="닫기" aria-pressed="false">

<!-- 모달 -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

<!-- 로딩 -->
<div role="status" aria-live="polite" aria-busy="true">
```

---

## 8. 애니메이션

### 8.1 기본 트랜지션

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;

--easing-linear: linear;
--easing-ease: ease;
--easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
--easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
--easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 8.2 모션 지침

- 페이지 전환: fade-in (200ms)
- 모달: scale + fade (200ms)
- 드롭다운: slide-down (150ms)
- 버튼 호버: background-color (150ms)
- 로딩: rotate (1s 무한)

---

## 9. 아이콘

**라이브러리**: Lucide React

주요 아이콘:
- 내비게이션: Home, Folder, PieChart, Database
- 액션: Plus, Edit, Trash, Download, Upload
- 상태: Check, Alert, Info, X
- 방향: ChevronLeft, ChevronRight, ChevronDown

---

## 10. 참고 문서

- [요구사항 정의](../01_요구사항/README.md)
- [아키텍처 설계](./아키텍처.md)
- [API 설계](./API설계.md)
