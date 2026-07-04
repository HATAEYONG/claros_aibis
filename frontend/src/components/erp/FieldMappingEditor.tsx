/**
 * 필드 매핑 에디터 컴포넌트
 * 소스 필드와 타겟 필드 간의 매핑을 관리하는 UI
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';

interface SourceField {
  field_id: number;
  source_field_name: string;
  source_field_type: string;
  source_field_comment?: string;
  is_primary_key: boolean;
  is_nullable: boolean;
}

interface TargetField {
  target_field_id: number;
  field_name: string;
  field_type: string;
  field_label?: string;
  is_required: boolean;
}

interface FieldMapping {
  field_mapping_id: number;
  source_field: SourceField;
  target_field: TargetField;
  is_key_field: boolean;
  is_required: boolean;
  transform_rule: string;
  default_value?: string;
}

interface FieldMappingFormData {
  source_field_id: number;
  target_field_id: number;
  is_key_field: boolean;
  is_required: boolean;
  transform_rule: string;
  default_value: string;
}

interface FieldMappingEditorProps {
  tableMappingId: number;
}

export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({ tableMappingId }) => {
  const [sourceFields, setSourceFields] = useState<SourceField[]>([]);
  const [targetFields, setTargetFields] = useState<TargetField[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);

  useEffect(() => {
    fetchFieldMappings();
    fetchSourceFields();
    fetchTargetFields();
  }, [tableMappingId]);

  const fetchFieldMappings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/erp/field-mappings/?table_mapping=${tableMappingId}`);
      const data = await response.json();
      setMappings(data.results || []);
    } catch (error) {
      console.error('Error fetching field mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceFields = async () => {
    try {
      // 테이블 매핑 정보에서 소스 테이블 ID를 가져와야 함
      const mappingResponse = await fetch(`/api/erp/table-mappings/${tableMappingId}/`);
      const mappingData = await mappingResponse.json();

      const sourceTableId = mappingData.source_table.table_id;
      const response = await fetch(`/api/erp/field-definitions/?table_definition=${sourceTableId}`);
      const data = await response.json();
      setSourceFields(data.results || []);
    } catch (error) {
      console.error('Error fetching source fields:', error);
    }
  };

  const fetchTargetFields = async () => {
    try {
      const mappingResponse = await fetch(`/api/erp/table-mappings/${tableMappingId}/`);
      const mappingData = await mappingResponse.json();

      const targetModelId = mappingData.target_model.target_model_id;
      const response = await fetch(`/api/erp/target-fields/?target_model=${targetModelId}`);
      const data = await response.json();
      setTargetFields(data.results || []);
    } catch (error) {
      console.error('Error fetching target fields:', error);
    }
  };

  const handleAutoMatch = async () => {
    setAutoMatching(true);
    try {
      const response = await fetch('/api/erp/field-mappings/bulk_create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_mapping_id: tableMappingId,
          auto_match: true,
          mappings: []
        })
      });
      const result = await response.json();
      alert(`${result.created_count}개 필드가 자동 매칭되었습니다.`);
      fetchFieldMappings();
    } catch (error) {
      alert('자동 매칭 실패');
    } finally {
      setAutoMatching(false);
    }
  };

  const handleDelete = async (mappingId: number) => {
    try {
      await fetch(`/api/erp/field-mappings/${mappingId}/`, {
        method: 'DELETE'
      });
      fetchFieldMappings();
    } catch (error) {
      console.error('Error deleting field mapping:', error);
    }
  };

  const handleSave = async (formData: FieldMappingFormData) => {
    try {
      await fetch('/api/erp/field-mappings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_mapping: tableMappingId,
          ...formData
        })
      });
      setShowAddModal(false);
      fetchFieldMappings();
    } catch (error) {
      console.error('Error saving field mapping:', error);
    }
  };

  const getTransformRuleLabel = (rule: string) => {
    const labels: { [key: string]: string } = {
      'none': '없음',
      'upper': '대문자',
      'lower': '소문자',
      'trim': '공백 제거',
      'date_format': '날짜 변환',
      'decimal_cast': '소수 변환',
      'concat': '결합',
      'lookup': '룩업',
      'custom': '사용자 정의'
    };
    return labels[rule] || rule;
  };

  const getTypeCompatibility = (sourceType: string, targetType: string) => {
    // 간단한 타입 호환성 체크
    const sourceBase = sourceType.toLowerCase().split('(')[0];
    const targetBase = targetType.toLowerCase();

    const compatible: { [key: string]: string[] } = {
      'varchar': ['charfield', 'textfield'],
      'char': ['charfield', 'textfield'],
      'text': ['textfield'],
      'integer': ['integerfield'],
      'int': ['integerfield'],
      'decimal': ['decimalfield'],
      'numeric': ['decimalfield'],
      'float': ['floatfield'],
      'date': ['datefield'],
      'datetime': ['datetimefield'],
      'timestamp': ['datetimefield'],
      'boolean': ['booleanfield'],
      'bool': ['booleanfield'],
    };

    if (compatible[sourceBase]?.includes(targetBase)) {
      return 'compatible';
    } else if (sourceBase === targetBase) {
      return 'compatible';
    }
    return 'incompatible';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // 매핑되지 않은 소스/타겟 필드 필터링
  const mappedSourceIds = new Set(mappings.map(m => m.source_field.field_id));
  const mappedTargetIds = new Set(mappings.map(m => m.target_field.target_field_id));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">필드 매핑</h2>
          <p className="text-gray-600 mt-1">소스 필드와 타겟 필드 간의 매핑을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoMatch}
            disabled={autoMatching}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {autoMatching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            자동 매칭
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            매핑 추가
          </button>
        </div>
      </div>

      {/* 매핑 현황 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">소스 필드</div>
          <div className="text-2xl font-bold text-gray-900">{sourceFields.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">타겟 필드</div>
          <div className="text-2xl font-bold text-gray-900">{targetFields.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">매핑 완료</div>
          <div className="text-2xl font-bold text-green-600">{mappings.length}</div>
        </div>
      </div>

      {/* 매핑 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                소스 필드
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                변환
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                타겟 필드
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                옵션
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping) => {
              const compatibility = getTypeCompatibility(
                mapping.source_field.source_field_type,
                mapping.target_field.field_type
              );

              return (
                <tr key={mapping.field_mapping_id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {mapping.source_field.is_primary_key && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                          PK
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.source_field.source_field_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mapping.source_field.source_field_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {getTransformRuleLabel(mapping.transform_rule)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.target_field.field_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mapping.target_field.field_type}
                        </div>
                      </div>
                      {compatibility === 'incompatible' && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                          타입 불일치
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {mapping.is_key_field && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          키
                        </span>
                      )}
                      {mapping.is_required && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                          필수
                        </span>
                      )}
                      {mapping.default_value && (
                        <span className="text-xs text-gray-500">
                          기본값: {mapping.default_value}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(mapping.field_mapping_id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {mappings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>매핑된 필드가 없습니다.</p>
            <button
              onClick={handleAutoMatch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              자동 매칭 시작
            </button>
          </div>
        )}
      </div>

      {/* 매핑 추가 모달 */}
      {showAddModal && (
        <FieldMappingModal
          sourceFields={sourceFields.filter(f => !mappedSourceIds.has(f.field_id))}
          targetFields={targetFields.filter(f => !mappedTargetIds.has(f.target_field_id))}
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// 필드 매핑 모달 컴포넌트
interface FieldMappingModalProps {
  sourceFields: SourceField[];
  targetFields: TargetField[];
  onSave: (data: FieldMappingFormData) => void;
  onClose: () => void;
}

const FieldMappingModal: React.FC<FieldMappingModalProps> = ({
  sourceFields,
  targetFields,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<FieldMappingFormData>({
    source_field_id: 0,
    target_field_id: 0,
    is_key_field: false,
    is_required: false,
    transform_rule: 'none',
    default_value: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.source_field_id === 0 || formData.target_field_id === 0) {
      alert('소스 필드와 타겟 필드를 모두 선택하세요.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">필드 매핑 추가</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소스 필드 *
              </label>
              <select
                value={formData.source_field_id}
                onChange={(e) => setFormData({ ...formData, source_field_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">선택</option>
                {sourceFields.map((field) => (
                  <option key={field.field_id} value={field.field_id}>
                    {field.source_field_name} ({field.source_field_type})
                    {field.is_primary_key && ' [PK]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타겟 필드 *
              </label>
              <select
                value={formData.target_field_id}
                onChange={(e) => setFormData({ ...formData, target_field_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">선택</option>
                {targetFields.map((field) => (
                  <option key={field.target_field_id} value={field.target_field_id}>
                    {field.field_name} ({field.field_type})
                    {field.is_required && ' [필수]'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              변환 규칙
            </label>
            <select
              value={formData.transform_rule}
              onChange={(e) => setFormData({ ...formData, transform_rule: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="none">없음</option>
              <option value="upper">대문자 변환</option>
              <option value="lower">소문자 변환</option>
              <option value="trim">공백 제거</option>
              <option value="date_format">날짜 형식 변환</option>
              <option value="decimal_cast">소수형 변환</option>
              <option value="concat">문자열 결합</option>
              <option value="lookup">룩업 테이블 참조</option>
              <option value="custom">사용자 정의</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본값
            </label>
            <input
              type="text"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="소스가 NULL인 경우 사용할 기본값"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_key_field}
                onChange={(e) => setFormData({ ...formData, is_key_field: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">키 필드</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">필수 매핑</span>
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldMappingEditor;
