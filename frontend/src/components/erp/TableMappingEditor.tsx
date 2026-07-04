/**
 * 테이블 매핑 에디터 컴포넌트
 * 소스 테이블과 타겟 모델 간의 매핑을 관리하는 UI
 */

import React, { useState, useEffect } from 'react';
import {
  Network,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Play,
  Settings
} from 'lucide-react';

interface TableMapping {
  mapping_id: number;
  mapping_code: string;
  mapping_name: string;
  source_table: {
    table_id: number;
    source_table_name: string;
    erp_source: {
      source_code: string;
      source_name: string;
    };
  };
  target_model: {
    target_model_id: number;
    model_name: string;
    app_label: string;
  };
  sync_priority: number;
  sync_priority_display: string;
  sync_type: string;
  sync_type_display: string;
  is_active: boolean;
  date_column?: string;
  last_sync_at?: string;
  last_sync_status?: string;
  field_mappings_count: number;
}

interface ERPSource {
  erp_source_id: number;
  source_code: string;
  source_name: string;
}

interface TableDefinition {
  table_id: number;
  source_table_name: string;
  module_code: string;
}

interface TargetModel {
  target_model_id: number;
  model_name: string;
  model_label: string;
  app_label: string;
}

interface TableMappingFormData {
  mapping_code: string;
  mapping_name: string;
  source_table_id: number;
  target_model_id: number;
  sync_priority: number;
  sync_type: string;
  is_active: boolean;
  date_column?: string;
}

export const TableMappingEditor: React.FC = () => {
  const [mappings, setMappings] = useState<TableMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<TableMapping | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

  // 필터링 관련 상태
  const [erpSources, setErpSources] = useState<ERPSource[]>([]);
  const [tableDefinitions, setTableDefinitions] = useState<TableDefinition[]>([]);
  const [targetModels, setTargetModels] = useState<TargetModel[]>([]);

  useEffect(() => {
    fetchMappings();
    fetchErpSources();
    fetchTargetModels();
  }, [selectedSource]);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const url = selectedSource
        ? `/api/erp/table-mappings/?source_table__erp_source=${selectedSource}`
        : '/api/erp/table-mappings/';

      const response = await fetch(url);
      const data = await response.json();
      setMappings(data.results || []);
    } catch (error) {
      console.error('Error fetching table mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchErpSources = async () => {
    try {
      const response = await fetch('/api/erp/sources/');
      const data = await response.json();
      setErpSources(data.results || []);

      // 기본 소스 자동 선택
      const defaultSource = data.results?.find((s: ERPSource) => s.is_default);
      if (defaultSource) {
        setSelectedSource(defaultSource.erp_source_id);
      }
    } catch (error) {
      console.error('Error fetching ERP sources:', error);
    }
  };

  const fetchTargetModels = async () => {
    try {
      const response = await fetch('/api/erp/target-models/');
      const data = await response.json();
      setTargetModels(data.results || []);
    } catch (error) {
      console.error('Error fetching target models:', error);
    }
  };

  const fetchTableDefinitions = async (sourceId: number) => {
    try {
      const response = await fetch(`/api/erp/table-definitions/?erp_source=${sourceId}`);
      const data = await response.json();
      setTableDefinitions(data.results || []);
    } catch (error) {
      console.error('Error fetching table definitions:', error);
    }
  };

  const handleCreate = () => {
    setEditingMapping(null);
    if (selectedSource) {
      fetchTableDefinitions(selectedSource);
    }
    setShowModal(true);
  };

  const handleEdit = (mapping: TableMapping) => {
    setEditingMapping(mapping);
    setShowModal(true);
  };

  const handleDelete = async (mappingId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/erp/table-mappings/${mappingId}/`, {
        method: 'DELETE'
      });
      fetchMappings();
    } catch (error) {
      console.error('Error deleting table mapping:', error);
    }
  };

  const handleValidate = async (mappingId: number) => {
    try {
      const response = await fetch(`/api/erp/table-mappings/${mappingId}/validate/`, {
        method: 'POST'
      });
      const result = await response.json();

      alert(result.results?.structure?.status === 'passed' ? '검증 통과' : '검증 실패');
    } catch (error) {
      alert('검증 실패');
    }
  };

  const handleSync = async (mappingId: number) => {
    if (!confirm('동기화를 실행하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/erp/table-mappings/${mappingId}/sync/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      alert('동기화가 시작되었습니다.');
    } catch (error) {
      alert('동기화 실패');
    }
  };

  const handleSave = async (formData: TableMappingFormData) => {
    try {
      const url = editingMapping
        ? `/api/erp/table-mappings/${editingMapping.mapping_id}/`
        : '/api/erp/table-mappings/';

      const method = editingMapping ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setShowModal(false);
      fetchMappings();
    } catch (error) {
      console.error('Error saving table mapping:', error);
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels: { [key: number]: string } = {
      1: '필수',
      2: '중요',
      3: '일반',
      4: '확장'
    };
    return labels[priority] || '-';
  };

  const getPriorityColor = (priority: number) => {
    const colors: { [key: number]: string } = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-blue-100 text-blue-800',
      4: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold text-gray-900">테이블 매핑</h2>
          <p className="text-gray-600 mt-1">소스 테이블과 타겟 모델 간의 매핑을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSource || ''}
            onChange={(e) => setSelectedSource(parseInt(e.target.value) || null)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">전체 ERP 소스</option>
            {erpSources.map((source) => (
              <option key={source.erp_source_id} value={source.erp_source_id}>
                {source.source_code} - {source.source_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            신규 매핑
          </button>
        </div>
      </div>

      {/* 매핑 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                매핑 코드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                소스 테이블
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                타겟 모델
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                동기화 타입
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                필드 매핑
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
            {mappings.map((mapping) => (
              <tr key={mapping.mapping_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {mapping.mapping_code}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mapping.mapping_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {mapping.source_table.erp_source.source_code}
                    </span>
                    <span className="text-sm text-gray-900">
                      {mapping.source_table.source_table_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{mapping.target_model.app_label}.{mapping.target_model.model_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(mapping.sync_priority)}`}>
                    {getPriorityLabel(mapping.sync_priority)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mapping.sync_type_display}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {mapping.field_mappings_count}개
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mapping.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleValidate(mapping.mapping_id)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="검증"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSync(mapping.mapping_id)}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="동기화"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(mapping)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="편집"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(mapping.mapping_id)}
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

      {/* 매핑 편집 모달 */}
      {showModal && (
        <TableMappingModal
          mapping={editingMapping}
          tableDefinitions={tableDefinitions}
          targetModels={targetModels}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// 테이블 매핑 모달 컴포넌트
interface TableMappingModalProps {
  mapping: TableMapping | null;
  tableDefinitions: TableDefinition[];
  targetModels: TargetModel[];
  onSave: (data: TableMappingFormData) => void;
  onClose: () => void;
}

const TableMappingModal: React.FC<TableMappingModalProps> = ({
  mapping,
  tableDefinitions,
  targetModels,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<TableMappingFormData>({
    mapping_code: mapping?.mapping_code || '',
    mapping_name: mapping?.mapping_name || '',
    source_table_id: mapping?.source_table.table_id || 0,
    target_model_id: mapping?.target_model.target_model_id || 0,
    sync_priority: mapping?.sync_priority || 2,
    sync_type: mapping?.sync_type || 'incremental',
    is_active: mapping?.is_active ?? true,
    date_column: mapping?.date_column || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // 모델을 앱별로 그룹화
  const modelsByApp = targetModels.reduce((acc, model) => {
    if (!acc[model.app_label]) {
      acc[model.app_label] = [];
    }
    acc[model.app_label].push(model);
    return acc;
  }, {} as { [key: string]: TargetModel[] });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">
            {mapping ? '테이블 매핑 수정' : '테이블 매핑 등록'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매핑 코드 *
              </label>
              <input
                type="text"
                value={formData.mapping_code}
                onChange={(e) => setFormData({ ...formData, mapping_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SDY100_YH_TO_MONTHLY_SALES"
                required
                disabled={!!mapping}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매핑명 *
              </label>
              <input
                type="text"
                value={formData.mapping_name}
                onChange={(e) => setFormData({ ...formData, mapping_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SDY100_YH → MonthlySales"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소스 테이블 *
              </label>
              <select
                value={formData.source_table_id}
                onChange={(e) => setFormData({ ...formData, source_table_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">선택</option>
                {tableDefinitions.map((table) => (
                  <option key={table.table_id} value={table.table_id}>
                    [{table.module_code}] {table.source_table_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타겟 모델 *
              </label>
              <select
                value={formData.target_model_id}
                onChange={(e) => setFormData({ ...formData, target_model_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">선택</option>
                {Object.entries(modelsByApp).map(([app, models]) => (
                  <optgroup key={app} label={app}>
                    {models.map((model) => (
                      <option key={model.target_model_id} value={model.target_model_id}>
                        {model.model_label} ({model.model_name})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                동기화 우선순위 *
              </label>
              <select
                value={formData.sync_priority}
                onChange={(e) => setFormData({ ...formData, sync_priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="1">1 - 필수 (실시간)</option>
                <option value="2">2 - 중요 (시간별)</option>
                <option value="3">3 - 일반 (일별)</option>
                <option value="4">4 - 확장 (주별/월별)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                동기화 타입 *
              </label>
              <select
                value={formData.sync_type}
                onChange={(e) => setFormData({ ...formData, sync_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="full">전체 동기화</option>
                <option value="incremental">증분 동기화</option>
                <option value="cdc">변경 데이터 캡처</option>
              </select>
            </div>

            {formData.sync_type === 'incremental' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 컬럼 *
                </label>
                <input
                  type="text"
                  value={formData.date_column}
                  onChange={(e) => setFormData({ ...formData, date_column: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="plan_date, created_at"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  증분 동기화 기준이 되는 날짜 컬럼명을 입력하세요.
                </p>
              </div>
            )}

            <div className="col-span-2">
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

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <div className="flex gap-3">
              {mapping && (
                <button
                  type="button"
                  onClick={() => {/* TODO: 필드 매핑 페이지로 이동 */}}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  필드 매핑
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableMappingEditor;
