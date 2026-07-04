/**
 * Text-to-SQL Service
 * 자연어 질문을 SQL 쿼리로 변환하고 적절한 테이블을 찾는 서비스
 */

import { getActiveLLM, LLMProvider } from './llmService';

// =====================================================
// 1. 데이터베이스 스키마 메타데이터 정의
// =====================================================

export interface ColumnInfo {
  name: string;
  type: string;
  description: string;
  isPK?: boolean;
  isFK?: boolean;
  fkRef?: string;
  nullable?: boolean;
}

export interface TableInfo {
  name: string;
  koreanName: string;
  description: string;
  module: string;
  columns: ColumnInfo[];
  keywords: string[]; // 테이블 검색용 키워드
  sampleQueries: string[]; // 샘플 질문들
}

// 데이터베이스 스키마 메타데이터
export const DATABASE_SCHEMA: TableInfo[] = [
  // ========== 인사 모듈 ==========
  {
    name: 'HR_EMPLOYEE',
    koreanName: '사원정보',
    description: '사원의 기본 정보를 관리하는 테이블',
    module: '인사',
    columns: [
      { name: 'emp_id', type: 'VARCHAR(20)', description: '사원번호', isPK: true },
      { name: 'emp_name', type: 'VARCHAR(100)', description: '사원명' },
      { name: 'dept_code', type: 'VARCHAR(20)', description: '부서코드', isFK: true, fkRef: 'HR_DEPARTMENT.dept_code' },
      { name: 'position', type: 'VARCHAR(50)', description: '직급' },
      { name: 'hire_date', type: 'DATE', description: '입사일' },
      { name: 'salary', type: 'DECIMAL(15,2)', description: '기본급' },
      { name: 'status', type: 'VARCHAR(20)', description: '재직상태' }
    ],
    keywords: ['사원', '직원', '인력', '인원', '입사', '퇴사', '근무'],
    sampleQueries: ['사원 목록 조회', '부서별 사원수', '입사자 현황']
  },
  {
    name: 'HR_DEPARTMENT',
    koreanName: '부서정보',
    description: '부서 조직 정보를 관리하는 테이블',
    module: '인사',
    columns: [
      { name: 'dept_code', type: 'VARCHAR(20)', description: '부서코드', isPK: true },
      { name: 'dept_name', type: 'VARCHAR(100)', description: '부서명' },
      { name: 'parent_dept', type: 'VARCHAR(20)', description: '상위부서코드' },
      { name: 'manager_id', type: 'VARCHAR(20)', description: '부서장 사원번호', isFK: true, fkRef: 'HR_EMPLOYEE.emp_id' }
    ],
    keywords: ['부서', '조직', '팀', '본부', '실'],
    sampleQueries: ['부서 목록', '조직도 조회']
  },
  {
    name: 'HR_ATTENDANCE',
    koreanName: '근태정보',
    description: '사원의 출퇴근 및 근태 기록',
    module: '인사',
    columns: [
      { name: 'att_id', type: 'BIGINT', description: '근태ID', isPK: true },
      { name: 'emp_id', type: 'VARCHAR(20)', description: '사원번호', isFK: true, fkRef: 'HR_EMPLOYEE.emp_id' },
      { name: 'work_date', type: 'DATE', description: '근무일' },
      { name: 'check_in', type: 'DATETIME', description: '출근시간' },
      { name: 'check_out', type: 'DATETIME', description: '퇴근시간' },
      { name: 'work_hours', type: 'DECIMAL(5,2)', description: '근무시간' },
      { name: 'overtime_hours', type: 'DECIMAL(5,2)', description: '연장근무시간' }
    ],
    keywords: ['출근', '퇴근', '근태', '출퇴근', '연장근무', '야근', '근무시간'],
    sampleQueries: ['월별 근태 현황', '연장근무 통계']
  },

  // ========== 급여 모듈 ==========
  {
    name: 'PAY_SALARY',
    koreanName: '급여정보',
    description: '월별 급여 지급 내역',
    module: '급여',
    columns: [
      { name: 'pay_id', type: 'BIGINT', description: '급여ID', isPK: true },
      { name: 'emp_id', type: 'VARCHAR(20)', description: '사원번호', isFK: true, fkRef: 'HR_EMPLOYEE.emp_id' },
      { name: 'pay_year', type: 'INT', description: '지급년도' },
      { name: 'pay_month', type: 'INT', description: '지급월' },
      { name: 'base_salary', type: 'DECIMAL(15,2)', description: '기본급' },
      { name: 'overtime_pay', type: 'DECIMAL(15,2)', description: '연장수당' },
      { name: 'bonus', type: 'DECIMAL(15,2)', description: '상여금' },
      { name: 'total_pay', type: 'DECIMAL(15,2)', description: '총지급액' },
      { name: 'deductions', type: 'DECIMAL(15,2)', description: '공제액' },
      { name: 'net_pay', type: 'DECIMAL(15,2)', description: '실수령액' }
    ],
    keywords: ['급여', '월급', '임금', '수당', '상여', '보너스', '연봉'],
    sampleQueries: ['월별 급여 현황', '부서별 급여 통계', '연간 급여 추이']
  },

  // ========== 자재 모듈 ==========
  {
    name: 'MM_MATERIAL',
    koreanName: '자재마스터',
    description: '자재 기본 정보 관리',
    module: '자재',
    columns: [
      { name: 'mat_code', type: 'VARCHAR(20)', description: '자재코드', isPK: true },
      { name: 'mat_name', type: 'VARCHAR(200)', description: '자재명' },
      { name: 'mat_type', type: 'VARCHAR(20)', description: '자재유형' },
      { name: 'unit', type: 'VARCHAR(10)', description: '단위' },
      { name: 'unit_price', type: 'DECIMAL(15,2)', description: '단가' },
      { name: 'safety_stock', type: 'DECIMAL(15,2)', description: '안전재고' },
      { name: 'lead_time', type: 'INT', description: '리드타임(일)' }
    ],
    keywords: ['자재', '원자재', '부품', '재료', '원료'],
    sampleQueries: ['자재 목록 조회', '자재 단가 현황']
  },
  {
    name: 'MM_INVENTORY',
    koreanName: '재고현황',
    description: '창고별 자재 재고 현황',
    module: '자재',
    columns: [
      { name: 'inv_id', type: 'BIGINT', description: '재고ID', isPK: true },
      { name: 'mat_code', type: 'VARCHAR(20)', description: '자재코드', isFK: true, fkRef: 'MM_MATERIAL.mat_code' },
      { name: 'warehouse_code', type: 'VARCHAR(20)', description: '창고코드' },
      { name: 'current_qty', type: 'DECIMAL(15,2)', description: '현재고량' },
      { name: 'reserved_qty', type: 'DECIMAL(15,2)', description: '예약수량' },
      { name: 'available_qty', type: 'DECIMAL(15,2)', description: '가용재고' },
      { name: 'last_in_date', type: 'DATE', description: '최종입고일' },
      { name: 'last_out_date', type: 'DATE', description: '최종출고일' }
    ],
    keywords: ['재고', '창고', '입고', '출고', '재고량', '가용재고'],
    sampleQueries: ['현재 재고 현황', '재고 부족 자재', '창고별 재고']
  },
  {
    name: 'MM_PURCHASE_ORDER',
    koreanName: '구매발주',
    description: '자재 구매 발주 내역',
    module: '자재',
    columns: [
      { name: 'po_no', type: 'VARCHAR(20)', description: '발주번호', isPK: true },
      { name: 'supplier_code', type: 'VARCHAR(20)', description: '공급업체코드', isFK: true, fkRef: 'MM_SUPPLIER.supplier_code' },
      { name: 'order_date', type: 'DATE', description: '발주일' },
      { name: 'delivery_date', type: 'DATE', description: '납기일' },
      { name: 'total_amount', type: 'DECIMAL(15,2)', description: '총금액' },
      { name: 'status', type: 'VARCHAR(20)', description: '진행상태' }
    ],
    keywords: ['발주', '구매', '주문', '납기', '공급업체'],
    sampleQueries: ['발주 현황', '월별 구매금액', '납기 지연 발주']
  },

  // ========== 생산 모듈 ==========
  {
    name: 'PP_WORK_ORDER',
    koreanName: '작업지시',
    description: '생산 작업지시 정보',
    module: '생산',
    columns: [
      { name: 'wo_no', type: 'VARCHAR(20)', description: '작업지시번호', isPK: true },
      { name: 'product_code', type: 'VARCHAR(20)', description: '제품코드', isFK: true, fkRef: 'PP_PRODUCT.product_code' },
      { name: 'line_code', type: 'VARCHAR(20)', description: '라인코드' },
      { name: 'plan_qty', type: 'DECIMAL(15,2)', description: '계획수량' },
      { name: 'actual_qty', type: 'DECIMAL(15,2)', description: '실적수량' },
      { name: 'start_date', type: 'DATE', description: '시작일' },
      { name: 'end_date', type: 'DATE', description: '종료일' },
      { name: 'status', type: 'VARCHAR(20)', description: '진행상태' }
    ],
    keywords: ['작업지시', '생산', '생산계획', '라인', '생산실적'],
    sampleQueries: ['작업지시 현황', '생산 달성률', '라인별 생산량']
  },
  {
    name: 'PP_PRODUCTION',
    koreanName: '생산실적',
    description: '일별 생산 실적 데이터',
    module: '생산',
    columns: [
      { name: 'prod_id', type: 'BIGINT', description: '생산ID', isPK: true },
      { name: 'wo_no', type: 'VARCHAR(20)', description: '작업지시번호', isFK: true, fkRef: 'PP_WORK_ORDER.wo_no' },
      { name: 'prod_date', type: 'DATE', description: '생산일' },
      { name: 'shift', type: 'VARCHAR(10)', description: '교대조' },
      { name: 'plan_qty', type: 'DECIMAL(15,2)', description: '계획수량' },
      { name: 'good_qty', type: 'DECIMAL(15,2)', description: '양품수량' },
      { name: 'defect_qty', type: 'DECIMAL(15,2)', description: '불량수량' },
      { name: 'yield_rate', type: 'DECIMAL(5,2)', description: '수율' }
    ],
    keywords: ['생산실적', '양품', '불량', '수율', '생산량', '일일생산'],
    sampleQueries: ['일별 생산실적', '수율 현황', '불량률 분석']
  },

  // ========== 품질 모듈 ==========
  {
    name: 'QM_INSPECTION',
    koreanName: '품질검사',
    description: '품질 검사 결과 기록',
    module: '품질',
    columns: [
      { name: 'insp_id', type: 'BIGINT', description: '검사ID', isPK: true },
      { name: 'insp_type', type: 'VARCHAR(20)', description: '검사유형' },
      { name: 'insp_date', type: 'DATE', description: '검사일' },
      { name: 'product_code', type: 'VARCHAR(20)', description: '제품코드' },
      { name: 'lot_no', type: 'VARCHAR(30)', description: '로트번호' },
      { name: 'sample_qty', type: 'INT', description: '검사수량' },
      { name: 'pass_qty', type: 'INT', description: '합격수량' },
      { name: 'fail_qty', type: 'INT', description: '불합격수량' },
      { name: 'pass_rate', type: 'DECIMAL(5,2)', description: '합격률' }
    ],
    keywords: ['품질', '검사', '합격', '불합격', '품질검사', 'QC', '로트'],
    sampleQueries: ['품질검사 현황', '합격률 추이', '불량 유형 분석']
  },
  {
    name: 'QM_DEFECT',
    koreanName: '불량현황',
    description: '불량 발생 및 처리 내역',
    module: '품질',
    columns: [
      { name: 'defect_id', type: 'BIGINT', description: '불량ID', isPK: true },
      { name: 'defect_date', type: 'DATE', description: '발생일' },
      { name: 'defect_type', type: 'VARCHAR(50)', description: '불량유형' },
      { name: 'product_code', type: 'VARCHAR(20)', description: '제품코드' },
      { name: 'defect_qty', type: 'INT', description: '불량수량' },
      { name: 'cause', type: 'VARCHAR(200)', description: '원인' },
      { name: 'action', type: 'VARCHAR(200)', description: '조치사항' },
      { name: 'status', type: 'VARCHAR(20)', description: '처리상태' }
    ],
    keywords: ['불량', '결함', '불량유형', '품질문제', '클레임'],
    sampleQueries: ['불량 현황', '불량유형별 분석', '불량 추이']
  },

  // ========== 영업 모듈 ==========
  {
    name: 'SD_SALES_ORDER',
    koreanName: '수주정보',
    description: '고객 수주 및 주문 정보',
    module: '영업',
    columns: [
      { name: 'so_no', type: 'VARCHAR(20)', description: '수주번호', isPK: true },
      { name: 'customer_code', type: 'VARCHAR(20)', description: '고객코드', isFK: true, fkRef: 'SD_CUSTOMER.customer_code' },
      { name: 'order_date', type: 'DATE', description: '수주일' },
      { name: 'delivery_date', type: 'DATE', description: '납기일' },
      { name: 'total_amount', type: 'DECIMAL(15,2)', description: '수주금액' },
      { name: 'status', type: 'VARCHAR(20)', description: '진행상태' }
    ],
    keywords: ['수주', '주문', '영업', '고객', '납기'],
    sampleQueries: ['수주 현황', '월별 수주금액', '고객별 수주']
  },
  {
    name: 'SD_SALES',
    koreanName: '매출실적',
    description: '매출 실적 데이터',
    module: '영업',
    columns: [
      { name: 'sales_id', type: 'BIGINT', description: '매출ID', isPK: true },
      { name: 'sales_date', type: 'DATE', description: '매출일' },
      { name: 'customer_code', type: 'VARCHAR(20)', description: '고객코드' },
      { name: 'product_code', type: 'VARCHAR(20)', description: '제품코드' },
      { name: 'quantity', type: 'DECIMAL(15,2)', description: '판매수량' },
      { name: 'unit_price', type: 'DECIMAL(15,2)', description: '단가' },
      { name: 'amount', type: 'DECIMAL(15,2)', description: '매출금액' }
    ],
    keywords: ['매출', '판매', '매출액', '매출실적', '영업실적'],
    sampleQueries: ['월별 매출', '제품별 매출', '고객별 매출 분석']
  },

  // ========== 원가 모듈 ==========
  {
    name: 'CO_COST_CENTER',
    koreanName: '원가센터',
    description: '원가 집계 단위 정보',
    module: '원가',
    columns: [
      { name: 'cc_code', type: 'VARCHAR(20)', description: '원가센터코드', isPK: true },
      { name: 'cc_name', type: 'VARCHAR(100)', description: '원가센터명' },
      { name: 'cc_type', type: 'VARCHAR(20)', description: '원가센터유형' },
      { name: 'dept_code', type: 'VARCHAR(20)', description: '관리부서' }
    ],
    keywords: ['원가센터', '원가', '비용', '코스트센터'],
    sampleQueries: ['원가센터 목록', '원가센터별 비용']
  },
  {
    name: 'CO_PRODUCT_COST',
    koreanName: '제품원가',
    description: '제품별 원가 정보',
    module: '원가',
    columns: [
      { name: 'cost_id', type: 'BIGINT', description: '원가ID', isPK: true },
      { name: 'product_code', type: 'VARCHAR(20)', description: '제품코드' },
      { name: 'cost_year', type: 'INT', description: '원가년도' },
      { name: 'cost_month', type: 'INT', description: '원가월' },
      { name: 'material_cost', type: 'DECIMAL(15,2)', description: '재료비' },
      { name: 'labor_cost', type: 'DECIMAL(15,2)', description: '노무비' },
      { name: 'overhead_cost', type: 'DECIMAL(15,2)', description: '경비' },
      { name: 'total_cost', type: 'DECIMAL(15,2)', description: '총원가' },
      { name: 'unit_cost', type: 'DECIMAL(15,2)', description: '단위원가' }
    ],
    keywords: ['원가', '제조원가', '재료비', '노무비', '경비', '단가'],
    sampleQueries: ['제품별 원가', '원가 추이', '원가 구성비']
  },

  // ========== 회계 모듈 ==========
  {
    name: 'FI_GL_ACCOUNT',
    koreanName: '계정과목',
    description: '회계 계정과목 마스터',
    module: '회계',
    columns: [
      { name: 'account_code', type: 'VARCHAR(20)', description: '계정코드', isPK: true },
      { name: 'account_name', type: 'VARCHAR(100)', description: '계정명' },
      { name: 'account_type', type: 'VARCHAR(20)', description: '계정유형' },
      { name: 'parent_account', type: 'VARCHAR(20)', description: '상위계정' }
    ],
    keywords: ['계정', '계정과목', '회계'],
    sampleQueries: ['계정과목 조회', '계정체계']
  },
  {
    name: 'FI_JOURNAL',
    koreanName: '분개전표',
    description: '회계 분개 전표',
    module: '회계',
    columns: [
      { name: 'journal_id', type: 'BIGINT', description: '전표ID', isPK: true },
      { name: 'journal_date', type: 'DATE', description: '전표일' },
      { name: 'account_code', type: 'VARCHAR(20)', description: '계정코드', isFK: true, fkRef: 'FI_GL_ACCOUNT.account_code' },
      { name: 'debit_amount', type: 'DECIMAL(15,2)', description: '차변금액' },
      { name: 'credit_amount', type: 'DECIMAL(15,2)', description: '대변금액' },
      { name: 'description', type: 'VARCHAR(200)', description: '적요' }
    ],
    keywords: ['전표', '분개', '차변', '대변', '회계전표'],
    sampleQueries: ['전표 조회', '계정별 거래내역']
  },
  {
    name: 'FI_BUDGET',
    koreanName: '예산정보',
    description: '부서별/계정별 예산 정보',
    module: '회계',
    columns: [
      { name: 'budget_id', type: 'BIGINT', description: '예산ID', isPK: true },
      { name: 'fiscal_year', type: 'INT', description: '회계연도' },
      { name: 'dept_code', type: 'VARCHAR(20)', description: '부서코드' },
      { name: 'account_code', type: 'VARCHAR(20)', description: '계정코드' },
      { name: 'budget_amount', type: 'DECIMAL(15,2)', description: '예산금액' },
      { name: 'actual_amount', type: 'DECIMAL(15,2)', description: '실적금액' },
      { name: 'variance', type: 'DECIMAL(15,2)', description: '차이' }
    ],
    keywords: ['예산', '예산실적', '예실대비', '비용예산'],
    sampleQueries: ['예산 현황', '예산실적 비교', '부서별 예산']
  },

  // ========== 설비 모듈 ==========
  {
    name: 'PM_EQUIPMENT',
    koreanName: '설비마스터',
    description: '생산 설비 정보',
    module: '설비',
    columns: [
      { name: 'equip_code', type: 'VARCHAR(20)', description: '설비코드', isPK: true },
      { name: 'equip_name', type: 'VARCHAR(100)', description: '설비명' },
      { name: 'equip_type', type: 'VARCHAR(50)', description: '설비유형' },
      { name: 'location', type: 'VARCHAR(50)', description: '설치위치' },
      { name: 'install_date', type: 'DATE', description: '설치일' },
      { name: 'status', type: 'VARCHAR(20)', description: '가동상태' }
    ],
    keywords: ['설비', '기계', '장비', '기기', '라인설비'],
    sampleQueries: ['설비 목록', '설비 가동현황']
  },
  {
    name: 'PM_MAINTENANCE',
    koreanName: '설비보전',
    description: '설비 보전 및 수리 이력',
    module: '설비',
    columns: [
      { name: 'maint_id', type: 'BIGINT', description: '보전ID', isPK: true },
      { name: 'equip_code', type: 'VARCHAR(20)', description: '설비코드', isFK: true, fkRef: 'PM_EQUIPMENT.equip_code' },
      { name: 'maint_type', type: 'VARCHAR(20)', description: '보전유형' },
      { name: 'maint_date', type: 'DATE', description: '보전일' },
      { name: 'downtime_hours', type: 'DECIMAL(5,2)', description: '정지시간' },
      { name: 'cost', type: 'DECIMAL(15,2)', description: '보전비용' },
      { name: 'description', type: 'VARCHAR(500)', description: '작업내용' }
    ],
    keywords: ['보전', '유지보수', '수리', '정비', '고장', '다운타임'],
    sampleQueries: ['보전 이력', '설비 고장현황', '보전비용 분석']
  }
];

// =====================================================
// 2. 테이블 검색 및 매칭 로직
// =====================================================

export interface TableMatch {
  table: TableInfo;
  score: number;
  matchedKeywords: string[];
}

/**
 * 질문에서 관련 테이블 찾기
 */
export function findRelevantTables(question: string): TableMatch[] {
  const normalizedQuestion = question.toLowerCase();
  const matches: TableMatch[] = [];

  for (const table of DATABASE_SCHEMA) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 키워드 매칭
    for (const keyword of table.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // 테이블 한글명 매칭
    if (normalizedQuestion.includes(table.koreanName.toLowerCase())) {
      score += 20;
      matchedKeywords.push(table.koreanName);
    }

    // 모듈명 매칭
    if (normalizedQuestion.includes(table.module.toLowerCase())) {
      score += 5;
      matchedKeywords.push(table.module);
    }

    // 컬럼 설명 매칭
    for (const column of table.columns) {
      if (normalizedQuestion.includes(column.description.toLowerCase())) {
        score += 8;
        matchedKeywords.push(column.description);
      }
    }

    if (score > 0) {
      matches.push({ table, score, matchedKeywords });
    }
  }

  // 점수 내림차순 정렬
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * 모듈별 테이블 그룹화
 */
export function getTablesByModule(): Record<string, TableInfo[]> {
  const grouped: Record<string, TableInfo[]> = {};

  for (const table of DATABASE_SCHEMA) {
    if (!grouped[table.module]) {
      grouped[table.module] = [];
    }
    grouped[table.module].push(table);
  }

  return grouped;
}

// =====================================================
// 3. SQL 생성 로직
// =====================================================

export interface SQLGenerationResult {
  sql: string;
  tables: TableInfo[];
  explanation: string;
  provider?: LLMProvider | 'local';
}

/**
 * 자연어 질문을 SQL로 변환하기 위한 프롬프트 생성
 */
function buildSQLPrompt(question: string, relevantTables: TableMatch[]): string {
  const tableSchemas = relevantTables.slice(0, 5).map(match => {
    const t = match.table;
    const columns = t.columns.map(c =>
      `  - ${c.name} (${c.type}): ${c.description}${c.isPK ? ' [PK]' : ''}${c.isFK ? ` [FK→${c.fkRef}]` : ''}`
    ).join('\n');
    return `테이블: ${t.name} (${t.koreanName})
설명: ${t.description}
컬럼:
${columns}`;
  }).join('\n\n');

  return `당신은 SQL 전문가입니다. 다음 데이터베이스 스키마를 참고하여 사용자 질문에 맞는 SQL 쿼리를 생성해주세요.

## 데이터베이스 스키마
${tableSchemas}

## 사용자 질문
${question}

## 요구사항
1. 표준 SQL 문법 사용
2. 한글 컬럼명은 alias로 표시
3. 날짜/기간 조건이 필요하면 적절히 추가
4. 집계가 필요하면 GROUP BY 사용
5. 정렬이 필요하면 ORDER BY 추가

## 응답 형식
SQL:
\`\`\`sql
(여기에 SQL 쿼리 작성)
\`\`\`

설명:
(쿼리에 대한 간단한 설명)`;
}

/**
 * LLM을 사용하여 SQL 생성
 */
export async function generateSQL(question: string): Promise<SQLGenerationResult> {
  // 1. 관련 테이블 찾기
  const relevantTables = findRelevantTables(question);

  if (relevantTables.length === 0) {
    // 키워드 매칭 실패 시 기본 응답
    return {
      sql: '',
      tables: [],
      explanation: '질문과 관련된 테이블을 찾을 수 없습니다. 더 구체적인 키워드를 사용해주세요.\n\n사용 가능한 키워드: 사원, 급여, 재고, 생산, 품질, 매출, 원가, 설비 등',
      provider: 'local'
    };
  }

  // 2. LLM 설정 확인
  const activeLLM = getActiveLLM();

  if (!activeLLM) {
    // LLM 미설정 시 로컬 템플릿 SQL 생성
    return generateLocalSQL(question, relevantTables);
  }

  // 3. LLM을 사용한 SQL 생성
  const prompt = buildSQLPrompt(question, relevantTables);

  try {
    const response = await callLLMForSQL(prompt, activeLLM);
    const parsed = parseSQLResponse(response);

    return {
      sql: parsed.sql,
      tables: relevantTables.map(m => m.table),
      explanation: parsed.explanation,
      provider: activeLLM.provider
    };
  } catch (error) {
    console.error('LLM SQL generation error:', error);
    // 폴백: 로컬 SQL 생성
    return generateLocalSQL(question, relevantTables);
  }
}

/**
 * 로컬 템플릿 기반 SQL 생성 (LLM 없이)
 */
function generateLocalSQL(question: string, relevantTables: TableMatch[]): SQLGenerationResult {
  const primaryTable = relevantTables[0].table;
  const columns = primaryTable.columns.map(c => `${c.name} AS "${c.description}"`).join(',\n  ');

  // 기본 SELECT 쿼리 생성
  let sql = `SELECT\n  ${columns}\nFROM ${primaryTable.name}`;

  // 질문에서 조건 추출 시도
  const lowerQ = question.toLowerCase();

  // 날짜 관련 조건
  if (lowerQ.includes('이번 달') || lowerQ.includes('당월')) {
    const dateCol = primaryTable.columns.find(c => c.type.includes('DATE'));
    if (dateCol) {
      sql += `\nWHERE ${dateCol.name} >= DATE_TRUNC('month', CURRENT_DATE)`;
    }
  }

  // 정렬 조건
  const dateCol = primaryTable.columns.find(c => c.type.includes('DATE'));
  if (dateCol) {
    sql += `\nORDER BY ${dateCol.name} DESC`;
  }

  sql += '\nLIMIT 100;';

  return {
    sql,
    tables: [primaryTable],
    explanation: `${primaryTable.koreanName} 테이블에서 데이터를 조회합니다. (로컬 템플릿 사용)`,
    provider: 'local'
  };
}

/**
 * LLM API 호출 (SQL 생성용)
 */
async function callLLMForSQL(prompt: string, config: { provider: LLMProvider; apiKey?: string; endpoint?: string; model?: string }): Promise<string> {
  switch (config.provider) {
    case 'ollama':
      const ollamaRes = await fetch(`${config.endpoint || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama2',
          prompt,
          stream: false
        })
      });
      const ollamaData = await ollamaRes.json();
      return ollamaData.response || '';

    case 'chatgpt':
      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        })
      });
      const gptData = await gptRes.json();
      return gptData.choices?.[0]?.message?.content || '';

    case 'gemini':
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const geminiData = await geminiRes.json();
      return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    default:
      throw new Error('Unknown LLM provider');
  }
}

/**
 * LLM 응답에서 SQL과 설명 추출
 */
function parseSQLResponse(response: string): { sql: string; explanation: string } {
  // SQL 코드 블록 추출
  const sqlMatch = response.match(/```sql\n?([\s\S]*?)```/i);
  const sql = sqlMatch ? sqlMatch[1].trim() : '';

  // 설명 추출
  const explanationMatch = response.match(/설명[:\s]*([\s\S]*?)(?:$|```)/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : '쿼리가 생성되었습니다.';

  return { sql, explanation };
}

// =====================================================
// 4. 질문 분류 및 인텐트 감지
// =====================================================

export type QueryIntent = 'select' | 'aggregate' | 'compare' | 'trend' | 'detail' | 'unknown';

export function detectQueryIntent(question: string): QueryIntent {
  const lowerQ = question.toLowerCase();

  // 집계 관련
  if (/합계|총|전체|sum|count|개수|몇 개|몇명/.test(lowerQ)) {
    return 'aggregate';
  }

  // 비교 관련
  if (/비교|대비|vs|차이|증감/.test(lowerQ)) {
    return 'compare';
  }

  // 추이/트렌드 관련
  if (/추이|트렌드|변화|흐름|월별|일별|연도별/.test(lowerQ)) {
    return 'trend';
  }

  // 상세 조회
  if (/상세|세부|자세히|내역/.test(lowerQ)) {
    return 'detail';
  }

  // 기본 조회
  if (/조회|보여|알려|목록|리스트|현황/.test(lowerQ)) {
    return 'select';
  }

  return 'unknown';
}

// =====================================================
// 5. 스키마 요약 정보 (챗봇용)
// =====================================================

export function getSchemaSummary(): string {
  const moduleGroups = getTablesByModule();

  let summary = '## 사용 가능한 데이터베이스 테이블\n\n';

  for (const [module, tables] of Object.entries(moduleGroups)) {
    summary += `### ${module} 모듈\n`;
    for (const table of tables) {
      summary += `- **${table.koreanName}** (${table.name}): ${table.description}\n`;
    }
    summary += '\n';
  }

  return summary;
}
