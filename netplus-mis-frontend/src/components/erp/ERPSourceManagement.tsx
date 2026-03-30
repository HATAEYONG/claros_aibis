/**
 * ERP 소스 관리 컴포넌트
 * ERP 시스템 소스를 등록하고 관리하는 UI
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Play
} from 'lucide-react';

interface ERPSource {
  erp_source_id: number;
  source_code: string;
  source_name: string;
  source_type: 'postgresql' | 'mssql' | 'mysql' | 'oracle' | 'api' | 'sqlite';
  description?: string;
  host?: string;
  port?: number;
  database_name?: string;
  is_default: boolean;
  is_active: boolean;
  table_count?: number;
  created_at: string;
  updated_at: string;
}

interface ERPSourceFormData {
  source_code: string;
  source_name: string;
  source_type: string;
  description: string;
  host: string;
  port: number;
  database_name: string;
  is_default: boolean;
  is_active: boolean;
}

export const ERPSourceManagement: React.FC = () => {
  const [sources, setSources] = useState<ERPSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState<ERPSource | null>(null);
  const [testingSource, setTestingSource] = useState<number | null>(null);
  const [importingSource, setImportingSource] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: any } | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erp/sources/');
      const data = await response.json();
      setSources(data.results || []);
    } catch (error) {
      console.error('Error fetching ERP sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSource(null);
    setShowModal(true);
    setTestResult(null);
  };

  const handleEdit = (source: ERPSource) => {
    setEditingSource(source);
    setShowModal(true);
    setTestResult(null);
  };

  const handleDelete = async (sourceId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/erp/sources/${sourceId}/`, {
        method: 'DELETE'
      });
      fetchSources();
    } catch (error) {
      console.error('Error deleting ERP source:', error);
    }
  };

  const handleTestConnection = async (sourceId: number) => {
    setTestingSource(sourceId);
    setTestResult(null);

    try {
      const response = await fetch(`/api/erp/sources/${sourceId}/test_connection/`, {
        method: 'POST'
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        status: 'error',
        message: '연결 테스트 실패'
      });
    } finally {
      setTestingSource(null);
    }
  };

  const handleImportTables = async (sourceId: number) => {
    if (!confirm('테이블 정의를 가져오시겠습니까?')) return;

    setImportingSource(sourceId);

    try {
      const response = await fetch(`/api/erp/sources/${sourceId}/import_tables/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_fields: true
        })
      });
      const result = await response.json();

      alert(`${result.imported_tables}개 테이블, ${result.imported_fields}개 필드를 가져왔습니다.`);
      fetchSources();
    } catch (error) {
      alert('테이블 가져오기 실패');
    } finally {
      setImportingSource(null);
    }
  };

  const handleSave = async (formData: ERPSourceFormData) => {
    try {
      const url = editingSource
        ? `/api/erp/sources/${editingSource.erp_source_id}/`
        : '/api/erp/sources/';

      const method = editingSource ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setShowModal(false);
      fetchSources();
    } catch (error) {
      console.error('Error saving ERP source:', error);
    }
  };

  const getSourceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'postgresql': 'PostgreSQL',
      'mssql': 'SQL Server',
      'mysql': 'MySQL',
      'oracle': 'Oracle',
      'api': 'REST API',
      'sqlite': 'SQLite'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ERP 소스 관리</h2>
          <p className="text-gray-600 mt-1">ERP 시스템 소스를 등록하고 관리합니다</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          신규 등록
        </button>
      </div>

      {/* 소스 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                코드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                소스명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                타입
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                연결 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                테이블
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.erp_source_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {source.is_default && (
                      <span className="mr-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        기본
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {source.source_code}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {source.source_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getSourceTypeLabel(source.source_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {source.host}:{source.port}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {source.table_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {source.is_active ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      활성
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      비활성
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleTestConnection(source.erp_source_id)}
                      disabled={testingSource === source.erp_source_id}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="연결 테스트"
                    >
                      {testingSource === source.erp_source_id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleImportTables(source.erp_source_id)}
                      disabled={importingSource === source.erp_source_id}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="테이블 가져오기"
                    >
                      {importingSource === source.erp_source_id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(source)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="편집"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(source.erp_source_id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 연결 테스트 결과 */}
      {testResult && (
        <div className={`p-4 rounded-lg ${
          testResult.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {testResult.status === 'success' ? '연결 성공' : '연결 실패'}
              </p>
              {testResult.latency_ms && (
                <p className="text-sm text-gray-600">지연 시간: {testResult.latency_ms}ms</p>
              )}
              {testResult.database_info && (
                <p className="text-sm text-gray-600">
                  버전: {testResult.database_info.version}
                </p>
              )}
              {testResult.message && (
                <p className="text-sm text-gray-600">{testResult.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 소스 편집 모달 */}
      {showModal && (
        <ERPSourceModal
          source={editingSource}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// 소스 편집 모달 컴포넌트
interface ERPSourceModalProps {
  source: ERPSource | null;
  onSave: (data: ERPSourceFormData) => void;
  onClose: () => void;
}

const ERPSourceModal: React.FC<ERPSourceModalProps> = ({ source, onSave, onClose }) => {
  const [formData, setFormData] = useState<ERPSourceFormData>({
    source_code: source?.source_code || '',
    source_name: source?.source_name || '',
    source_type: source?.source_type || 'postgresql',
    description: source?.description || '',
    host: source?.host || '',
    port: source?.port || 5432,
    database_name: source?.database_name || '',
    is_default: source?.is_default || false,
    is_active: source?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            {source ? 'ERP 소스 수정' : 'ERP 소스 등록'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소스 코드 *
              </label>
              <input
                type="text"
                value={formData.source_code}
                onChange={(e) => setFormData({ ...formData, source_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="YH, FOM, SAP"
                required
                disabled={!!source}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소스명 *
              </label>
              <input
                type="text"
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="유한 DB"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소스 타입 *
              </label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mssql">SQL Server</option>
                <option value="mysql">MySQL</option>
                <option value="oracle">Oracle</option>
                <option value="sqlite">SQLite</option>
                <option value="api">REST API</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                포트
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                호스트 *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="localhost 또는 IP 주소"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                데이터베이스명 *
              </label>
              <input
                type="text"
                value={formData.database_name}
                onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">기본 소스</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ERPSourceManagement;
