// -*- coding: utf-8 -*-
/**
 * 마스터 데이터 서비스
 * 기준정보 관리 API 호출
 */
import api from './api';

// 계정과목 (Account)
export interface MasterAccount {
  account_id?: number;
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: string;
  category_l1?: string;
  category_l2?: string;
  description?: string;
  control_account?: number;
  control_account_name?: string;
  control_account_code?: string;
  is_consolidated?: boolean;
  is_tax_related?: boolean;
  tax_code?: string;
  erp_sources?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 창고 (Warehouse)
export interface MasterWarehouse {
  warehouse_id?: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_name_en?: string;
  warehouse_type: string;
  plant?: string;
  building?: string;
  floor?: string;
  location?: string;
  capacity?: number;
  capacity_unit?: string;
  current_utilization?: number;
  manager?: number;
  manager_name?: string;
  manager_code?: string;
  temperature_controlled?: boolean;
  temperature_min?: number;
  temperature_max?: number;
  erp_sources?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 공정 (Process)
export interface MasterProcess {
  process_id?: number;
  process_code: string;
  process_name: string;
  process_name_en?: string;
  process_type: string;
  process_category?: string;
  plant?: string;
  line?: string;
  work_center?: string;
  standard_cycle_time?: number;
  standard_setup_time?: number;
  standard_capacity?: number;
  equipment?: number[];
  responsible_person?: number;
  responsible_person_name?: string;
  responsible_person_code?: string;
  quality_standard?: string;
  acceptance_criteria?: string;
  erp_sources?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 은행 (Bank)
export interface MasterBank {
  bank_id?: number;
  bank_code: string;
  bank_name: string;
  bank_name_en?: string;
  bank_type: string;
  bank_category?: string;
  swift_code?: string;
  bank_branch_code?: string;
  bank_branch_name?: string;
  contact_phone?: string;
  contact_email?: string;
  fax?: string;
  address?: string;
  postal_code?: string;
  country?: string;
  virtual_account_prefix?: string;
  default_account_number?: string;
  payment_method?: string;
  transfer_fee_rate?: number;
  erp_sources?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// API 응답 타입
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BatchOperationResult {
  created?: number;
  updated?: number;
  deleted?: number;
  failed?: number;
  results?: any[];
  errors?: any[];
}

// 계정과목 API
export const accountAPI = {
  getAccounts: async (params?: Record<string, any>): Promise<PaginatedResponse<MasterAccount>> => {
    const response = await api.get('/api/data-hub/master/accounts/', { params });
    return response.data;
  },

  getAccount: async (accountId: number): Promise<MasterAccount> => {
    const response = await api.get(`/api/data-hub/master/accounts/${accountId}/`);
    return response.data;
  },

  createAccount: async (account: Partial<MasterAccount>): Promise<MasterAccount> => {
    const response = await api.post('/api/data-hub/master/accounts/', account);
    return response.data;
  },

  updateAccount: async (accountId: number, account: Partial<MasterAccount>): Promise<MasterAccount> => {
    const response = await api.put(`/api/data-hub/master/accounts/${accountId}/`, account);
    return response.data;
  },

  deleteAccount: async (accountId: number): Promise<void> => {
    await api.delete(`/api/data-hub/master/accounts/${accountId}/`);
  },

  batchCreateAccounts: async (items: Partial<MasterAccount>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/accounts/batch-create/', { items });
    return response.data;
  },

  batchUpdateAccounts: async (items: Partial<MasterAccount>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/accounts/batch-update/', { items });
    return response.data;
  },

  batchDeleteAccounts: async (ids: number[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/accounts/batch-delete/', { ids });
    return response.data;
  },

  exportCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/accounts/export/csv/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/accounts/export/excel/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  importCSV: async (file: File): Promise<BatchOperationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/data-hub/master/accounts/import/csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAccountTypes: async (): Promise<{ account_types: string[] }> => {
    const response = await api.get('/api/data-hub/master/accounts/account_types/');
    return response.data;
  },
};

// 창고 API
export const warehouseAPI = {
  getWarehouses: async (params?: Record<string, any>): Promise<PaginatedResponse<MasterWarehouse>> => {
    const response = await api.get('/api/data-hub/master/warehouses/', { params });
    return response.data;
  },

  getWarehouse: async (warehouseId: number): Promise<MasterWarehouse> => {
    const response = await api.get(`/api/data-hub/master/warehouses/${warehouseId}/`);
    return response.data;
  },

  createWarehouse: async (warehouse: Partial<MasterWarehouse>): Promise<MasterWarehouse> => {
    const response = await api.post('/api/data-hub/master/warehouses/', warehouse);
    return response.data;
  },

  updateWarehouse: async (warehouseId: number, warehouse: Partial<MasterWarehouse>): Promise<MasterWarehouse> => {
    const response = await api.put(`/api/data-hub/master/warehouses/${warehouseId}/`, warehouse);
    return response.data;
  },

  deleteWarehouse: async (warehouseId: number): Promise<void> => {
    await api.delete(`/api/data-hub/master/warehouses/${warehouseId}/`);
  },

  batchCreateWarehouses: async (items: Partial<MasterWarehouse>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/warehouses/batch-create/', { items });
    return response.data;
  },

  batchUpdateWarehouses: async (items: Partial<MasterWarehouse>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/warehouses/batch-update/', { items });
    return response.data;
  },

  batchDeleteWarehouses: async (ids: number[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/warehouses/batch-delete/', { ids });
    return response.data;
  },

  exportCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/warehouses/export/csv/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/warehouses/export/excel/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  importCSV: async (file: File): Promise<BatchOperationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/data-hub/master/warehouses/import/csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getWarehouseTypes: async (): Promise<{ warehouse_types: string[] }> => {
    const response = await api.get('/api/data-hub/master/warehouses/warehouse_types/');
    return response.data;
  },
};

// 공정 API
export const processAPI = {
  getProcesses: async (params?: Record<string, any>): Promise<PaginatedResponse<MasterProcess>> => {
    const response = await api.get('/api/data-hub/master/processes/', { params });
    return response.data;
  },

  getProcess: async (processId: number): Promise<MasterProcess> => {
    const response = await api.get(`/api/data-hub/master/processes/${processId}/`);
    return response.data;
  },

  createProcess: async (process: Partial<MasterProcess>): Promise<MasterProcess> => {
    const response = await api.post('/api/data-hub/master/processes/', process);
    return response.data;
  },

  updateProcess: async (processId: number, process: Partial<MasterProcess>): Promise<MasterProcess> => {
    const response = await api.put(`/api/data-hub/master/processes/${processId}/`, process);
    return response.data;
  },

  deleteProcess: async (processId: number): Promise<void> => {
    await api.delete(`/api/data-hub/master/processes/${processId}/`);
  },

  batchCreateProcesses: async (items: Partial<MasterProcess>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/processes/batch-create/', { items });
    return response.data;
  },

  batchUpdateProcesses: async (items: Partial<MasterProcess>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/processes/batch-update/', { items });
    return response.data;
  },

  batchDeleteProcesses: async (ids: number[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/processes/batch-delete/', { ids });
    return response.data;
  },

  exportCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/processes/export/csv/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/processes/export/excel/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  importCSV: async (file: File): Promise<BatchOperationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/data-hub/master/processes/import/csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getProcessTypes: async (): Promise<{ process_types: string[] }> => {
    const response = await api.get('/api/data-hub/master/processes/process_types/');
    return response.data;
  },
};

// 은행 API
export const bankAPI = {
  getBanks: async (params?: Record<string, any>): Promise<PaginatedResponse<MasterBank>> => {
    const response = await api.get('/api/data-hub/master/banks/', { params });
    return response.data;
  },

  getBank: async (bankId: number): Promise<MasterBank> => {
    const response = await api.get(`/api/data-hub/master/banks/${bankId}/`);
    return response.data;
  },

  createBank: async (bank: Partial<MasterBank>): Promise<MasterBank> => {
    const response = await api.post('/api/data-hub/master/banks/', bank);
    return response.data;
  },

  updateBank: async (bankId: number, bank: Partial<MasterBank>): Promise<MasterBank> => {
    const response = await api.put(`/api/data-hub/master/banks/${bankId}/`, bank);
    return response.data;
  },

  deleteBank: async (bankId: number): Promise<void> => {
    await api.delete(`/api/data-hub/master/banks/${bankId}/`);
  },

  batchCreateBanks: async (items: Partial<MasterBank>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/banks/batch-create/', { items });
    return response.data;
  },

  batchUpdateBanks: async (items: Partial<MasterBank>[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/banks/batch-update/', { items });
    return response.data;
  },

  batchDeleteBanks: async (ids: number[]): Promise<BatchOperationResult> => {
    const response = await api.post('/api/data-hub/master/banks/batch-delete/', { ids });
    return response.data;
  },

  exportCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/banks/export/csv/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get('/api/data-hub/master/banks/export/excel/', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  importCSV: async (file: File): Promise<BatchOperationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/data-hub/master/banks/import/csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getBankTypes: async (): Promise<{ bank_types: string[] }> => {
    const response = await api.get('/api/data-hub/master/banks/bank_types/');
    return response.data;
  },
};
