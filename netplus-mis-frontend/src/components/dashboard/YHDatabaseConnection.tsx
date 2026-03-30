import React, { useState, useEffect } from 'react';

interface ConnectionStatus {
  success: boolean;
  config?: {
    host: string;
    port: string;
    database: string;
    user: string;
  };
  available: boolean;
}

interface TestResult {
  success: boolean;
  database?: string;
  host?: string;
  port?: string;
  table_count?: number;
  tables?: string[];
  error?: string;
}

interface TableInfo {
  name: string;
  comment: string | null;
  column_count: number;
  primary_keys: string[];
}

interface SummaryResult {
  success: boolean;
  days?: number;
  summary?: Record<string, any>;
  error?: string;
}

const YHDatabaseConnection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'tables' | 'sql' | 'summary'>('config');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConnectionStatus | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [tableCount, setTableCount] = useState(0);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000/api/yh';

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/config/`);
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError('설정을 불러오는 데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch(`${API_BASE}/test/`);
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError('연결 테스트 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    setTables(null);

    try {
      const response = await fetch(`${API_BASE}/tables/`);
      const data = await response.json();

      if (data.success) {
        setTables(data.tables);
        setTableCount(data.count);
      } else {
        setError(data.error || '테이블 목록을 불러오는 데 실패했습니다');
      }
    } catch (err) {
      setError('테이블 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch(`${API_BASE}/summary/?days=90`);
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError('요약 정보 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const executeSQL = async () => {
    if (!sqlQuery.trim()) {
      setError('SQL 쿼리를 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setSqlResult(null);

    try {
      const response = await fetch(`${API_BASE}/sql/execute/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await response.json();

      if (data.success) {
        setSqlResult(data);
      } else {
        setError(data.error || 'SQL 실행 실패');
      }
    } catch (err) {
      setError('SQL 실행 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleSQL = () => {
    setSqlQuery(`-- YH 데이터베이스용 샘플 SQL 쿼리
-- 실제 테이블명과 컬럼명에 맞게 수정해주세요

SELECT *
FROM table_name
ORDER BY date_column DESC
LIMIT 10;`);
  };

  const tabs = [
    { id: 'config', label: '⚙️ DB 설정', icon: '⚙️' },
    { id: 'test', label: '🔗 연결 테스트', icon: '🔗' },
    { id: 'tables', label: '📊 테이블 목록', icon: '📊' },
    { id: 'sql', label: '💻 SQL 실행', icon: '💻' },
    { id: 'summary', label: '📅 3개월 요약', icon: '📅' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">YH 데이터베이스 연결</h1>
          <p className="text-gray-600 text-sm mt-1">실제 YH PostgreSQL 데이터베이스 연결 및 테스트</p>
        </div>
        <button onClick={loadConfig} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          🔄 설정 새로고침
        </button>
      </div>

      {/* Connection Status Banner */}
      {config && (
        <div className={`p-4 rounded-xl border ${
          config.available
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.available ? '✅' : '❌'}</span>
            <div>
              <p className="font-semibold text-gray-800">
                {config.available ? 'YH 데이터베이스 모듈 사용 가능' : 'YH 데이터베이스 모듈 사용 불가'}
              </p>
              {config.config && (
                <p className="text-sm text-gray-600 mt-1">
                  {config.config.host}:{config.config.port} / {config.config.database}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold">❌ 오류</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && config && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">데이터베이스 설정 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">호스트</span>
                <span className="font-mono font-semibold text-blue-600">{config.config?.host}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">포트</span>
                <span className="font-mono font-semibold">{config.config?.port}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">데이터베이스</span>
                <span className="font-mono font-semibold">{config.config?.database}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">사용자</span>
                <span className="font-mono font-semibold">{config.config?.user}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">연결 테스트</h2>
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '테스트 중...' : '🔗 연결 테스트'}
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {testResult.success ? (
                <div>
                  <p className="font-semibold text-green-700 mb-3">✅ 연결 성공!</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">데이터베이스</p>
                      <p className="font-semibold">{testResult.database}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">호스트</p>
                      <p className="font-semibold">{testResult.host}:{testResult.port}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">테이블 수</p>
                      <p className="font-semibold">{testResult.table_count}</p>
                    </div>
                  </div>
                  {testResult.tables && testResult.tables.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm mb-2">테이블 목록 (처음 20개):</p>
                      <div className="bg-white p-3 rounded-lg max-h-40 overflow-y-auto">
                        <code className="text-xs text-gray-700">
                          {testResult.tables.map((t, i) => (
                            <div key={i}>• {t}</div>
                          ))}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-700">❌ 연결 실패</p>
                  <p className="text-red-600 text-sm mt-2">{testResult.error}</p>
                  <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700">
                    <p className="font-semibold mb-2">해결 방법:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>프로덕션 환경에서 YH DB에 접근 가능한지 확인</li>
                      <li>방화벽 규칙과 네트워크 연결 확인</li>
                      <li>DB 서버(133.186.214.219:27455) 상태 확인</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {!testResult && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>연결 테스트 버튼을 클릭하여 YH 데이터베이스 연결 상태를 확인하세요.</p>
            </div>
          )}
        </div>
      )}

      {/* Tables Tab */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">테이블 목록</h2>
            <button
              onClick={loadTables}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '불러오는 중...' : '📊 테이블 로드'}
            </button>
          </div>

          {tables && tables.length > 0 && (
            <div>
              <p className="text-gray-600 mb-4">총 {tableCount}개의 테이블</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {tables.slice(0, 30).map((table, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="font-semibold text-blue-600">{table.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{table.comment || '설명 없음'}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      컬럼: {table.column_count} | PK: {table.primary_keys.join(', ') || '없음'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tables && tables.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>테이블이 없습니다.</p>
            </div>
          )}

          {!tables && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>테이블 목록을 불러오려면 위 버튼을 클릭하세요.</p>
            </div>
          )}
        </div>
      )}

      {/* SQL Tab */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">SQL 실행</h2>

          <div className="mb-4">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SQL 쿼리를 입력하세요..."
              className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={executeSQL}
                disabled={loading || !sqlQuery.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? '실행 중...' : '▶️ SQL 실행'}
              </button>
              <button
                onClick={loadSampleSQL}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                📝 샘플 SQL
              </button>
            </div>
          </div>

          {sqlResult && sqlResult.success && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <p className="text-sm text-gray-700">
                  ✅ 쿼리 실행 완료 - {sqlResult.rowCount}개 행 반환
                </p>
              </div>
              <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-80">
                <pre>{JSON.stringify(sqlResult.data.slice(0, 50), null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">최근 3개월 데이터 요약</h2>
            <button
              onClick={loadSummary}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '불러오는 중...' : '📊 요약 로드'}
            </button>
          </div>

          {summary && summary.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {Object.entries(summary.summary).map(([tableName, info]: any) => (
                <div key={tableName} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                  <div className="font-semibold text-blue-600">{tableName}</div>
                  {info.date_column && (
                    <div className="text-xs text-gray-500 mt-1">날짜: {info.date_column}</div>
                  )}
                  <div className="text-sm text-gray-700 mt-2">레코드: {info.row_count || 0}건</div>
                  {info.latest_date && (
                    <div className="text-xs text-green-600 mt-1">최신: {info.latest_date}</div>
                  )}
                  {info.error && (
                    <div className="text-xs text-red-600 mt-1">오류: {info.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {summary && !summary.summary && (
            <div className="text-center py-8 text-gray-500">
              <p>데이터가 없습니다.</p>
            </div>
          )}

          {!summary && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>요약 정보를 불러오려면 위 버튼을 클릭하세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default YHDatabaseConnection;
