// ERP 맵핑 관리 페이지 컴포넌트
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, Settings, ChevronDown, ChevronRight, Plus, Edit } from 'lucide-react';

interface ERPSource {
  erp_source_id: number;
  source_code: string;
  source_name: string;
  source_type: string;
  is_active: boolean;
  is_default: boolean;
}

interface TableMapping {
  mapping_id: number;
  mapping_code: string;
  mapping_name: string;
  source_table: {
    source_table_name: string;
    source_table_comment: string;
    module_code: string;
  };
  target_model: {
    model_name: string;
    model_type: string;
  };
  sync_priority: number;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string;
}

interface SyncLog {
  validation_id: number;
  table_mapping: number;
  validation_type: string;
  status: string;
  validated_at: string;
  error_message: string;
}

interface MappingOverview {
  total_sources: number;
  total_mappings: number;
  active_mappings: number;
  recent_validations: SyncLog[];
}

export default function MappingManagement() {
  const [sources, setSources] = useState<ERPSource[]>([]);
  const [mappings, setMappings] = useState<TableMapping[]>([]);
  const [overview, setOverview] = useState<MappingOverview | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['SALES']));
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE = 'http://localhost:8000/api/erp-sync';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get default source or first source
      const sourcesRes = await fetch(`${API_BASE}/sources/`);
      const sourcesData = await sourcesRes.json();
      const sourcesList = sourcesData.results || sourcesData || [];
      setSources(sourcesList);

      const defaultSource = sourcesList.find((s: ERPSource) => s.is_default) || sourcesList[0];
      if (defaultSource) {
        setSelectedSource(defaultSource.erp_source_id);
        await fetchMappings(defaultSource.erp_source_id);
      }

      // Get overview data
      const mappingsRes = await fetch(`${API_BASE}/table-mappings/`);
      const mappingsData = await mappingsRes.json();
      const allMappings = mappingsData.results || mappingsData || [];

      setOverview({
        total_sources: sourcesList.length,
        total_mappings: allMappings.length,
        active_mappings: allMappings.filter((m: TableMapping) => m.is_active).length,
        recent_validations: [],
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showMessage('error', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async (sourceId: number) => {
    try {
      const response = await fetch(`${API_BASE}/table-mappings/?is_active=true`);
      const data = await response.json();
      setMappings(data.results || data || []);
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleModule = (moduleCode: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleCode)) {
      newExpanded.delete(moduleCode);
    } else {
      newExpanded.add(moduleCode);
    }
    setExpandedModules(newExpanded);
  };

  const toggleMappingStatus = async (mappingId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/table-mappings/${mappingId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        showMessage('success', '매핑 상태가 변경되었습니다.');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showMessage('error', '상태 변경에 실패했습니다.');
    }
  };

  const syncMapping = async (mappingId: number) => {
    setSyncing(prev => new Set([...prev, mappingId]));
    try {
      const response = await fetch(`${API_BASE}/table-mappings/${mappingId}/sync/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_type: 'incremental' }),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', result.message || '동기화가 시작되었습니다.');
      } else {
        showMessage('error', '동기화 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      showMessage('error', '동기화 시작에 실패했습니다.');
    } finally {
      setSyncing(prev => {
        const newSet = new Set(prev);
        newSet.delete(mappingId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; text: string }> = {
      success: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: '성공' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: '실패' },
      running: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, text: '진행중' },
      partial: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, text: '부분성공' },
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock, text: '대기중' };
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
        <Icon className="w-3 h-3" />
        {statusInfo.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const priorityMap: Record<number, { color: string; text: string }> = {
      1: { color: 'bg-red-100 text-red-700', text: '필수' },
      2: { color: 'bg-orange-100 text-orange-700', text: '중요' },
      3: { color: 'bg-blue-100 text-blue-700', text: '일반' },
      4: { color: 'bg-gray-100 text-gray-700', text: '확장' },
    };

    const info = priorityMap[priority] || { color: 'bg-gray-100 text-gray-700', text: `${priority}순위` };
    return (
      <span className={`px-2 py-1 rounded text-xs ${info.color}`}>
        {info.text}
      </span>
    );
  };

  const getModuleName = (moduleCode: string) => {
    const moduleNames: Record<string, string> = {
      'SALES': '영업관리',
      'PRODUCTION': '생산관리',
      'QUALITY': '품질관리',
      'PURCHASE': '자재/구매',
      'FINANCIAL': '회계관리',
      'ETC': '기타',
    };
    return moduleNames[moduleCode] || moduleCode;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  // Group mappings by module
  const mappingsByModule: Record<string, TableMapping[]> = {};
  mappings.forEach(mapping => {
    const moduleCode = mapping.source_table?.module_code || 'ETC';
    if (!mappingsByModule[moduleCode]) {
      mappingsByModule[moduleCode] = [];
    }
    mappingsByModule[moduleCode].push(mapping);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP 맵핑 관리</h1>
          <p className="text-gray-500 mt-1">ERP 테이블과 MIS Dashboard 간의 데이터 맵핑 설정</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
          <button
            onClick={() => window.location.href = '#/erp/sources'}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ERP 소스 관리
          </button>
          <button
            onClick={() => window.location.href = '#/erp/table-mapping'}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            테이블 매핑 편집
          </button>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* 개요 카드 */}
      {overview && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ERP 소스</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview.total_sources}</p>
              </div>
              <Database className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">전체 매핑</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview.total_mappings}</p>
              </div>
              <Settings className="w-12 h-12 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">활성화된 매핑</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{overview.active_mappings}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">비활성화</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {overview.total_mappings - overview.active_mappings}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* ERP 소스 선택 */}
      {sources.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">ERP 소스:</label>
            <select
              value={selectedSource || ''}
              onChange={(e) => {
                const sourceId = parseInt(e.target.value);
                setSelectedSource(sourceId);
                fetchMappings(sourceId);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sources.map((source) => (
                <option key={source.erp_source_id} value={source.erp_source_id}>
                  {source.source_name} ({source.source_code}){source.is_default ? ' - 기본' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 모듈별 맵핑 목록 */}
      {Object.keys(mappingsByModule).length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">모듈별 테이블 맵핑</h2>
          </div>

          <div className="divide-y">
            {Object.entries(mappingsByModule).map(([moduleCode, moduleMappings]) => (
              <div key={moduleCode} className="divide-y">
                {/* 모듈 헤더 */}
                <button
                  onClick={() => toggleModule(moduleCode)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedModules.has(moduleCode) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{getModuleName(moduleCode)}</h3>
                      <p className="text-sm text-gray-500">{moduleCode} 모듈</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {moduleMappings.filter(m => m.is_active).length} / {moduleMappings.length} 활성화
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {moduleMappings.length}개 매핑
                    </span>
                  </div>
                </button>

                {/* 테이블 목록 */}
                {expandedModules.has(moduleCode) && (
                  <div className="px-6 pb-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3 font-medium">매핑 코드</th>
                          <th className="pb-3 font-medium">소스 테이블</th>
                          <th className="pb-3 font-medium">타겟 모델</th>
                          <th className="pb-3 font-medium">우선순위</th>
                          <th className="pb-3 font-medium">마지막 동기화</th>
                          <th className="pb-3 font-medium">상태</th>
                          <th className="pb-3 font-medium text-right">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {moduleMappings.map((mapping) => (
                          <tr key={mapping.mapping_id} className="text-sm">
                            <td className="py-3 font-mono text-xs">{mapping.mapping_code}</td>
                            <td className="py-3">
                              <div>
                                <div className="font-medium text-gray-900">{mapping.source_table?.source_table_name}</div>
                                <div className="text-xs text-gray-500">{mapping.source_table?.source_table_comment || mapping.mapping_name}</div>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <div className="font-mono text-xs">{mapping.target_model?.model_name}</div>
                                <div className="text-xs text-gray-500">{mapping.target_model?.model_type}</div>
                              </div>
                            </td>
                            <td className="py-3">{getPriorityBadge(mapping.sync_priority)}</td>
                            <td className="py-3 text-gray-500">{formatDate(mapping.last_sync_at)}</td>
                            <td className="py-3">
                              {mapping.last_sync_status && getStatusBadge(mapping.last_sync_status)}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleMappingStatus(mapping.mapping_id, mapping.is_active)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    mapping.is_active ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                      mapping.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                                <button
                                  onClick={() => syncMapping(mapping.mapping_id)}
                                  disabled={syncing.has(mapping.mapping_id)}
                                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                                >
                                  {syncing.has(mapping.mapping_id) ? (
                                    <RefreshCw className="w-4 h-4 animate-spin inline" />
                                  ) : (
                                    '동기화'
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">매핑이 없습니다</h3>
          <p className="text-gray-500 mb-4">ERP 테이블과 MIS 모델 간의 매핑을 생성해주세요.</p>
          <button
            onClick={() => window.location.href = '#/erp/table-mapping'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            매핑 생성하기
          </button>
        </div>
      )}
    </div>
  );
}
