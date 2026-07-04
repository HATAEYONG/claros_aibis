// -*- coding: utf-8 -*-
/**
 * 기준정보 관리 페이지
 * 계정과목, 창고, 공정, 은행 관리
 */
import React, { useState, useEffect } from 'react';
import {
  accountAPI,
  warehouseAPI,
  processAPI,
  bankAPI,
  type MasterAccount,
  type MasterWarehouse,
  type MasterProcess,
  type MasterBank,
  type PaginatedResponse,
  type BatchOperationResult
} from '@/services/masterDataService';

// Tab 타입
type TabType = 'account' | 'warehouse' | 'process' | 'bank';

// 컬럼 정의
const ACCOUNT_COLUMNS = [
  { key: 'account_code', label: '계정 코드', sortable: true },
  { key: 'account_name', label: '계정과목명', sortable: true },
  { key: 'account_type', label: '계정 유형', sortable: true },
  { key: 'category_l1', label: '대분류', sortable: true },
  { key: 'category_l2', label: '중분류', sortable: true },
  { key: 'is_consolidated', label: '통합 항목', sortable: true },
  { key: 'is_tax_related', label: '세무 관련', sortable: true },
];

const WAREHOUSE_COLUMNS = [
  { key: 'warehouse_code', label: '창고 코드', sortable: true },
  { key: 'warehouse_name', label: '창고명', sortable: true },
  { key: 'warehouse_type', label: '창고 유형', sortable: true },
  { key: 'plant', label: '공장', sortable: true },
  { key: 'capacity', label: '용량', sortable: true },
  { key: 'current_utilization', label: '사용률(%)', sortable: true },
  { key: 'temperature_controlled', label: '온도 제어', sortable: true },
];

const PROCESS_COLUMNS = [
  { key: 'process_code', label: '공정 코드', sortable: true },
  { key: 'process_name', label: '공정명', sortable: true },
  { key: 'process_type', label: '공정 유형', sortable: true },
  { key: 'plant', label: '공장', sortable: true },
  { key: 'line', label: '라인', sortable: true },
  { key: 'standard_cycle_time', label: '표준 공시간(초)', sortable: true },
  { key: 'standard_capacity', label: '능률(개/시)', sortable: true },
];

const BANK_COLUMNS = [
  { key: 'bank_code', label: '은행 코드', sortable: true },
  { key: 'bank_name', label: '은행명', sortable: true },
  { key: 'bank_type', label: '은행 유형', sortable: true },
  { key: 'swift_code', label: 'SWIFT 코드', sortable: true },
  { key: 'bank_branch_name', label: '지점명', sortable: true },
  { key: 'contact_phone', label: '연락처', sortable: true },
];

const MasterDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // 데이터 로딩
  useEffect(() => {
    loadData();
  }, [activeTab, page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
      };

      let response: PaginatedResponse<any>;
      switch (activeTab) {
        case 'account':
          response = await accountAPI.getAccounts(params);
          break;
        case 'warehouse':
          response = await warehouseAPI.getWarehouses(params);
          break;
        case 'process':
          response = await processAPI.getProcesses(params);
          break;
        case 'bank':
          response = await bankAPI.getBanks(params);
          break;
        default:
          response = { count: 0, next: null, previous: null, results: [] };
      }

      setData(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  // 아이템 선택 토글
  const toggleItemSelection = (id: string | number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(String(id))) {
      newSelected.delete(String(id));
    } else {
      newSelected.add(String(id));
    }
    setSelectedItems(newSelected);
  };

  // 전체 선택 토글
  const toggleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => String(item.id || item.account_id || item.warehouse_id || item.process_id || item.bank_id))));
    }
  };

  // 아이템 추가/수정 모달 열기
  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setShowModal(true);
  };

  // 아이템 저장
  const handleSave = async (itemData: any) => {
    try {
      let result;
      if (editingItem) {
        // 수정
        const id = editingItem.id || editingItem.account_id || editingItem.warehouse_id || editingItem.process_id || editingItem.bank_id;
        switch (activeTab) {
          case 'account':
            result = await accountAPI.updateAccount(id, itemData);
            break;
          case 'warehouse':
            result = await warehouseAPI.updateWarehouse(id, itemData);
            break;
          case 'process':
            result = await processAPI.updateProcess(id, itemData);
            break;
          case 'bank':
            result = await bankAPI.updateBank(id, itemData);
            break;
        }
      } else {
        // 생성
        switch (activeTab) {
          case 'account':
            result = await accountAPI.createAccount(itemData);
            break;
          case 'warehouse':
            result = await warehouseAPI.createWarehouse(itemData);
            break;
          case 'process':
            result = await processAPI.createProcess(itemData);
            break;
          case 'bank':
            result = await bankAPI.createBank(itemData);
            break;
        }
      }

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      alert(`저장 실패: ${err.message}`);
    }
  };

  // 아이템 삭제
  const handleDelete = async (id: string | number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      switch (activeTab) {
        case 'account':
          await accountAPI.deleteAccount(Number(id));
          break;
        case 'warehouse':
          await warehouseAPI.deleteWarehouse(Number(id));
          break;
        case 'process':
          await processAPI.deleteProcess(Number(id));
          break;
        case 'bank':
          await bankAPI.deleteBank(Number(id));
          break;
      }
      loadData();
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  // 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedItems.size}개 항목을 삭제하시겠습니까?`)) return;

    try {
      const ids = Array.from(selectedItems).map(id => Number(id));
      let result: BatchOperationResult;

      switch (activeTab) {
        case 'account':
          result = await accountAPI.batchDeleteAccounts(ids);
          break;
        case 'warehouse':
          result = await warehouseAPI.batchDeleteWarehouses(ids);
          break;
        case 'process':
          result = await processAPI.batchDeleteProcesses(ids);
          break;
        case 'bank':
          result = await bankAPI.batchDeleteBanks(ids);
          break;
        default:
          return;
      }

      if (result.failed && result.failed > 0) {
        alert(`${result.failed}개 항목 삭제 실패`);
      } else {
        setSelectedItems(new Set());
        loadData();
      }
    } catch (err: any) {
      alert(`일괄 삭제 실패: ${err.message}`);
    }
  };

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    try {
      let blob: Blob;
      switch (activeTab) {
        case 'account':
          blob = await accountAPI.exportExcel({ search: searchTerm || undefined });
          break;
        case 'warehouse':
          blob = await warehouseAPI.exportExcel({ search: searchTerm || undefined });
          break;
        case 'process':
          blob = await processAPI.exportExcel({ search: searchTerm || undefined });
          break;
        case 'bank':
          blob = await bankAPI.exportExcel({ search: searchTerm || undefined });
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`엑셀 다운로드 실패: ${err.message}`);
    }
  };

  // CSV 가져오기
  const handleImportCSV = async (file: File) => {
    try {
      let result: BatchOperationResult;
      switch (activeTab) {
        case 'account':
          result = await accountAPI.importCSV(file);
          break;
        case 'warehouse':
          result = await warehouseAPI.importCSV(file);
          break;
        case 'process':
          result = await processAPI.importCSV(file);
          break;
        case 'bank':
          result = await bankAPI.importCSV(file);
          break;
        default:
          return;
      }

      alert(`가져오기 완료: ${result.imported || 0}개 성공, ${result.failed || 0}개 실패`);
      loadData();
    } catch (err: any) {
      alert(`CSV 가져오기 실패: ${err.message}`);
    }
  };

  // 컬럼 가져오기
  const getColumns = () => {
    switch (activeTab) {
      case 'account': return ACCOUNT_COLUMNS;
      case 'warehouse': return WAREHOUSE_COLUMNS;
      case 'process': return PROCESS_COLUMNS;
      case 'bank': return BANK_COLUMNS;
      default: return [];
    }
  };

  // ID 필드 가져오기
  const getIdField = () => {
    switch (activeTab) {
      case 'account': return 'account_id';
      case 'warehouse': return 'warehouse_id';
      case 'process': return 'process_id';
      case 'bank': return 'bank_id';
      default: return 'id';
    }
  };

  const columns = getColumns();
  const idField = getIdField();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">기준정보 관리</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">계정과목, 창고, 공정, 은행 기준 정보 관리</p>
      </div>

      {/* Tab 메뉴 */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            계정과목
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'warehouse'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            창고
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'process'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            공정
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bank'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            은행
          </button>
        </nav>
      </div>

      {/* 도구 모음 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            검색
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            추가
          </button>
          <button
            onClick={() => selectedItems.size > 0 && handleBatchDelete()}
            disabled={selectedItems.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            일괄 삭제 ({selectedItems.size})
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            엑셀 다운로드
          </button>
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm cursor-pointer">
            CSV 가져오기
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files && e.target.files[0] && handleImportCSV(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">데이터가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === data.length && data.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item) => (
                  <tr key={item[idField]} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(String(item[idField]))}
                        onChange={() => toggleItemSelection(item[idField])}
                        className="rounded"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item[col.key] !== undefined ? String(item[col.key]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(item[idField])}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalCount > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            총 {totalCount}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)}개
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              이전
            </button>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 편집 모달 (간단 버전) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 dark:text-white">
              {editingItem ? '수정' : '추가'}
            </h2>
            <EditForm
              item={editingItem}
              tabType={activeTab}
              onSave={handleSave}
              onCancel={() => {
                setShowModal(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 편집 폼 컴포넌트
interface EditFormProps {
  item: any;
  tabType: TabType;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ item, tabType, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    item || {}
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // 각 탭별 필드 정의
  const renderFields = () => {
    switch (tabType) {
      case 'account':
        return (
          <>
            <FormField name="account_code" label="계정 코드" value={formData.account_code || ''} onChange={handleChange} required />
            <FormField name="account_name" label="계정과목명" value={formData.account_name || ''} onChange={handleChange} required />
            <SelectField name="account_type" label="계정 유형" value={formData.account_type || ''} onChange={handleChange} options={[
              { value: 'asset', label: '자산' },
              { value: 'liability', label: '부채' },
              { value: 'equity', label: '자본' },
              { value: 'revenue', label: '수익' },
              { value: 'expense', label: '비용' },
            ]} required />
            <FormField name="category_l1" label="대분류" value={formData.category_l1 || ''} onChange={handleChange} />
            <FormField name="category_l2" label="중분류" value={formData.category_l2 || ''} onChange={handleChange} />
            <CheckboxField name="is_consolidated" label="통합 항목" checked={formData.is_consolidated || false} onChange={handleChange} />
            <CheckboxField name="is_tax_related" label="세무 관련" checked={formData.is_tax_related !== false} onChange={handleChange} />
          </>
        );
      case 'warehouse':
        return (
          <>
            <FormField name="warehouse_code" label="창고 코드" value={formData.warehouse_code || ''} onChange={handleChange} required />
            <FormField name="warehouse_name" label="창고명" value={formData.warehouse_name || ''} onChange={handleChange} required />
            <SelectField name="warehouse_type" label="창고 유형" value={formData.warehouse_type || ''} onChange={handleChange} options={[
              { value: 'raw_material', label: '원자재 창고' },
              { value: 'finished_good', label: '완제품 창고' },
              { value: 'semi_finished', label: '반제품 창고' },
              { value: 'component', label: '부품 창고' },
              { value: 'consumable', label: '소모품 창고' },
              { value: 'general', label: '일반 창고' },
            ]} required />
            <FormField name="plant" label="공장" value={formData.plant || ''} onChange={handleChange} />
            <FormField name="building" label="건물" value={formData.building || ''} onChange={handleChange} />
            <FormField name="floor" label="층" value={formData.floor || ''} onChange={handleChange} />
            <NumberField name="capacity" label="용량" value={formData.capacity || ''} onChange={handleChange} />
            <CheckboxField name="temperature_controlled" label="온도 제어" checked={formData.temperature_controlled || false} onChange={handleChange} />
          </>
        );
      case 'process':
        return (
          <>
            <FormField name="process_code" label="공정 코드" value={formData.process_code || ''} onChange={handleChange} required />
            <FormField name="process_name" label="공정명" value={formData.process_name || ''} onChange={handleChange} required />
            <SelectField name="process_type" label="공정 유형" value={formData.process_type || ''} onChange={handleChange} options={[
              { value: 'casting', label: '주조' },
              { value: 'machining', label: '가공' },
              { value: 'forming', label: '성형' },
              { value: 'assembly', label: '조립' },
              { value: 'inspection', label: '검사' },
              { value: 'packing', label: '포장' },
              { value: 'heat_treatment', label: '열처리' },
              { value: 'surface_treatment', label: '표면처리' },
              { value: 'testing', label: '시험' },
              { value: 'other', label: '기타' },
            ]} required />
            <FormField name="plant" label="공장" value={formData.plant || ''} onChange={handleChange} />
            <FormField name="line" label="라인" value={formData.line || ''} onChange={handleChange} />
            <FormField name="work_center" label="작업장" value={formData.work_center || ''} onChange={handleChange} />
            <NumberField name="standard_cycle_time" label="표준 공시간(초)" value={formData.standard_cycle_time || ''} onChange={handleChange} />
            <NumberField name="standard_setup_time" label="표준 준비 시간(분)" value={formData.standard_setup_time || ''} onChange={handleChange} />
            <NumberField name="standard_capacity" label="표준 능률(개/시)" value={formData.standard_capacity || ''} onChange={handleChange} />
          </>
        );
      case 'bank':
        return (
          <>
            <FormField name="bank_code" label="은행 코드" value={formData.bank_code || ''} onChange={handleChange} required />
            <FormField name="bank_name" label="은행명" value={formData.bank_name || ''} onChange={handleChange} required />
            <SelectField name="bank_type" label="은행 유형" value={formData.bank_type || ''} onChange={handleChange} options={[
              { value: 'commercial', label: '시중은행' },
              { value: 'specialized', label: '특수은행' },
              { value: 'foreign', label: '외국은행' },
              { value: 'internet', label: '인터넷은행' },
              { value: 'savings', label: '저축은행' },
              { value: 'post', label: '우체국' },
            ]} required />
            <FormField name="swift_code" label="SWIFT 코드" value={formData.swift_code || ''} onChange={handleChange} />
            <FormField name="bank_branch_code" label="지점 코드" value={formData.bank_branch_code || ''} onChange={handleChange} />
            <FormField name="bank_branch_name" label="지점명" value={formData.bank_branch_name || ''} onChange={handleChange} />
            <FormField name="contact_phone" label="연락처" value={formData.contact_phone || ''} onChange={handleChange} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {renderFields()}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          저장
        </button>
      </div>
    </form>
  );
};

// 폼 필드 컴포넌트들
const FormField: React.FC<{ name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean }> = ({ name, label, value, onChange, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label} {required && <span className="text-red-500">*</span>}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
    />
  </div>
);

const NumberField: React.FC<{ name: string; label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ name, label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
    />
  </div>
);

const SelectField: React.FC<{ name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: Array<{ value: string; label: string }>; required?: boolean }> = ({ name, label, value, onChange, options, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label} {required && <span className="text-red-500">*</span>}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
    >
      <option value="">선택</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const CheckboxField: React.FC<{ name: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ name, label, checked, onChange }) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="rounded"
    />
    <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
  </div>
);

export default MasterDataManagement;
