/**
 * Process Chain Service
 * 수주(Sales) -> 생산(Production) -> 품질(Quality) -> 재고(Material)가
 * 마스터 데이터(제품)를 통해 실제로 이어지는지 확인하기 위한 통합 레이어 API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface IntegratedSalesOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  product_code: string;
  product_name: string;
  quantity_ordered: string;
  quantity_shipped: string;
  status: string;
  progress: string;
  sales_person_name: string;
  order_date: string;
  promise_date: string;
}

export interface IntegratedProductionOrder {
  order_id: number;
  order_number: string;
  product_code: string;
  product_name: string;
  equipment_name: string;
  quantity_ordered: string;
  quantity_produced: string;
  quantity_scrapped: string;
  status: string;
  progress: string;
  production_supervisor_name: string;
}

export interface IntegratedQualityRecord {
  record_id: number;
  record_number: string;
  product_code: string;
  product_name: string;
  inspector_name: string;
  customer_name: string;
  inspection_quantity: string;
  ok_quantity: string;
  ng_quantity: string;
  result: string;
  capa_required: boolean;
  capa_number: string;
}

export interface IntegratedMaterial {
  material_id: number;
  product_code: string;
  product_name: string;
  primary_vendor_name: string;
  plant: string;
  warehouse: string;
  quantity_available: string;
  safety_stock: string;
  is_abcs: string;
}

export interface ProcessChain {
  product_code: string;
  product_name: string;
  sales_orders: IntegratedSalesOrder[];
  production_orders: IntegratedProductionOrder[];
  quality_records: IntegratedQualityRecord[];
  materials: IntegratedMaterial[];
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function fetchProcessChain(productCode: string): Promise<ApiResponse<ProcessChain>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/data-hub/integration/process-chain/${encodeURIComponent(productCode)}/`,
      { headers: authHeaders() }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching process chain:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function fetchProductCodes(): Promise<ApiResponse<{ product_code: string; product_name: string }[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data-hub/master/products/`, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const results = data.results || data;
    return { data: results.map((p: any) => ({ product_code: p.product_code, product_name: p.product_name })) };
  } catch (error) {
    console.error('Error fetching product codes:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default { fetchProcessChain, fetchProductCodes };
