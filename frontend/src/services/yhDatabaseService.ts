/**
 * YH Database Service
 * 실제 YH 데이터베이스 연결 및 데이터 조회 서비스
 */

const YH_API_BASE = 'http://localhost:8000/api/yh';

export interface YHTableInfo {
  name: string;
  comment: string | null;
  column_count: number;
  primary_keys: string[];
  columns: YHColumnInfo[];
}

export interface YHColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  is_pk: boolean;
}

export interface YHQueryResult {
  success: boolean;
  data: any[];
  rowCount: number;
  error?: string;
}

export interface YHDatabaseSummary {
  table_name: string;
  date_column?: string;
  row_count: number;
  latest_date?: string;
  sample_data?: any[];
  error?: string;
}

// YH 데이터베이스 설정 정보 가져오기
export async function getYHDatabaseConfig(): Promise<{
  success: boolean;
  config?: {
    host: string;
    port: string;
    database: string;
    user: string;
  };
  available: boolean;
}> {
  try {
    const response = await fetch(`${YH_API_BASE}/config/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get YH DB config:', error);
    return { success: false, available: false };
  }
}

// YH 데이터베이스 연결 테스트
export async function testYHDatabaseConnection(): Promise<{
  success: boolean;
  database?: string;
  host?: string;
  port?: string;
  table_count?: number;
  tables?: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${YH_API_BASE}/test/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('YH DB connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// YH 데이터베이스 테이블 목록 가져오기
export async function getYHDatabaseTables(): Promise<{
  success: boolean;
  tables?: YHTableInfo[];
  count?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${YH_API_BASE}/tables/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get YH DB tables:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// YH 데이터베이스에서 SQL 실행
export async function executeYHSQL(sql: string): Promise<YHQueryResult> {
  try {
    const response = await fetch(`${YH_API_BASE}/sql/execute/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('YH SQL execution failed:', error);
    return {
      success: false,
      data: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// YH 데이터베이스 테이블 데이터 조회
export async function getYHTableData(
  tableName: string,
  options?: {
    limit?: number;
    days?: number;
    dateColumn?: string;
  }
): Promise<{
  success: boolean;
  table_name?: string;
  data?: any[];
  rowCount?: number;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    params.append('table_name', tableName);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.days) params.append('days', options.days.toString());
    if (options?.dateColumn) params.append('date_column', options.dateColumn);

    const response = await fetch(`${YH_API_BASE}/data/?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get YH table data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// YH 데이터베이스 최근 데이터 요약 (3개월)
export async function getYHRecentSummary(days: number = 90): Promise<{
  success: boolean;
  days?: number;
  summary?: Record<string, YHDatabaseSummary>;
  error?: string;
}> {
  try {
    const response = await fetch(`${YH_API_BASE}/summary/?days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get YH recent summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// YH 데이터베이스 스키마를 기반으로 테이블 정보 업데이트
export async function updateYHDatabaseSchema(): Promise<{
  success: boolean;
  tables: YHTableInfo[];
  error?: string;
}> {
  // YH DB에서 테이블 목록 가져오기
  const result = await getYHDatabaseTables();

  if (!result.success || !result.tables) {
    return {
      success: false,
      tables: [],
      error: result.error || 'Failed to get tables'
    };
  }

  // 로컬 스토리지에 스키마 저장
  try {
    localStorage.setItem('yh_db_schema', JSON.stringify(result.tables));
    localStorage.setItem('yh_db_schema_updated', new Date().toISOString());
  } catch (e) {
    console.error('Failed to save schema to localStorage:', e);
  }

  return {
    success: true,
    tables: result.tables
  };
}

// 로컬 스토리지에서 YH 스키마 로드
export function loadYHDatabaseSchema(): YHTableInfo[] {
  try {
    const stored = localStorage.getItem('yh_db_schema');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load YH schema from localStorage:', e);
  }
  return [];
}

// YH 테이블에서 키워드 검색
export function searchYHTables(
  query: string,
  tables: YHTableInfo[]
): Array<{ table: YHTableInfo; score: number; matchedColumns: string[] }> {
  const normalizedQuery = query.toLowerCase();
  const matches: Array<{ table: YHTableInfo; score: number; matchedColumns: string[] }> = [];

  for (const table of tables) {
    let score = 0;
    const matchedColumns: string[] = [];

    // 테이블명 매칭
    if (table.name.toLowerCase().includes(normalizedQuery) ||
        (table.comment && table.comment.toLowerCase().includes(normalizedQuery))) {
      score += 30;
    }

    // 컬럼명 매칭
    for (const col of table.columns) {
      if (col.name.toLowerCase().includes(normalizedQuery)) {
        score += 10;
        matchedColumns.push(col.name);
      }
    }

    if (score > 0) {
      matches.push({ table, score, matchedColumns });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

// YH 테이블을 기준으로 SQL 생성
export function generateYHSQL(
  query: string,
  tables: YHTableInfo[]
): { sql: string; explanation: string; tables: YHTableInfo[] } {
  const matches = searchYHTables(query, tables);

  if (matches.length === 0) {
    return {
      sql: '',
      explanation: '질문과 관련된 테이블을 찾을 수 없습니다. YH 데이터베이스 스키마를 확인해 주세요.',
      tables: []
    };
  }

  const primaryTable = matches[0].table;

  // 날짜 컬럼 찾기
  const dateColumn = primaryTable.columns.find(col =>
    col.type.includes('date') || col.type.includes('timestamp')
  );

  // 기본 SQL 생성
  let sql = `SELECT\n`;

  // 컬럼 리스트 생성 (한글 별칭 추가)
  const columnList = primaryTable.columns.slice(0, 10).map(col => {
    const alias = col.name; // 실제 컬럼명 그대로 사용 (필요시 별칭 매핑)
    return `  ${col.name}`;
  }).join(',\n');

  sql += `${columnList}\n`;
  sql += `FROM ${primaryTable.name}\n`;

  // 날짜 조건 추가 (최근 3개월)
  if (dateColumn) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const dateStr = threeMonthsAgo.toISOString().split('T')[0];

    sql += `WHERE ${dateColumn.name} >= '${dateStr}'\n`;
  }

  sql += `ORDER BY ${dateColumn ? dateColumn.name : primaryTable.columns[0].name} DESC\n`;
  sql += `LIMIT 100;`;

  return {
    sql,
    explanation: `${primaryTable.name} 테이블에서 최근 3개월 데이터를 조회합니다.`,
    tables: matches.slice(0, 3).map(m => m.table)
  };
}
