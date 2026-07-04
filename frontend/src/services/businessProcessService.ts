/**
 * Business Process Service
 * O2C (Order to Cash), P2P (Procure to Pay) 프로세스 관리 API 서비스
 */
import React from 'react';

export interface ProcessStage {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ElementType;
  status: string;
  order: number;
  duration: number;
  estimatedDuration: number;
  volume: number;
  value: number;
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedOrders: number;
  }>;
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: string;
  }>;
}

export interface ProcessOrder {
  id: string;
  customer?: string;
  supplier?: string;
  product?: string;
  material?: string;
  quantity: number;
  amount: number;
  stage: string;
  status: string;
  orderDate: string;
  promisedDate: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * O2C 프로세스 스테이지 데이터 조회
 */
export async function fetchO2CStages(
  periodType: string = 'monthly'
): Promise<ApiResponse<{ stages: ProcessStage[]; summary: any }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/o2c/stages/?period_type=${periodType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching O2C stages:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * O2C 주문 데이터 조회
 */
export async function fetchO2COrders(
  stage: string = 'all',
  status: string = 'all'
): Promise<ApiResponse<{ orders: ProcessOrder[]; total: number }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/o2c/orders/?stage=${stage}&status=${status}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching O2C orders:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * P2P 프로세스 스테이지 데이터 조회
 */
export async function fetchP2PStages(
  periodType: string = 'monthly'
): Promise<ApiResponse<{ stages: ProcessStage[]; summary: any }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/p2p/stages/?period_type=${periodType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching P2P stages:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * P2P 발주 데이터 조회
 */
export async function fetchP2POrders(
  stage: string = 'all',
  status: string = 'all'
): Promise<ApiResponse<{ orders: ProcessOrder[]; total: number }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/p2p/orders/?stage=${stage}&status=${status}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching P2P orders:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * O2C AI 예측 데이터 조회
 */
export async function fetchO2CPredictions(
  periodType: string = 'monthly'
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/ai/o2c/predictions/?period_type=${periodType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching O2C predictions:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * P2P AI 예측 데이터 조회
 */
export async function fetchP2PPredictions(
  periodType: string = 'monthly'
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/ai/p2p/predictions/?period_type=${periodType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching P2P predictions:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 프로세스 최적화 제안 조회
 */
export async function fetchProcessOptimization(
  processType: 'o2c' | 'p2p' = 'o2c'
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/ai/optimization/?type=${processType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching process optimization:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 이상 징후 감지 데이터 조회
 */
export async function fetchAnomalyDetection(
  processType: 'o2c' | 'p2p' = 'o2c',
  threshold: number = 2.0
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/business-process/ai/anomaly-detection/?type=${processType}&threshold=${threshold}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching anomaly detection:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// 기본 내보내
export default {
  fetchO2CStages,
  fetchO2COrders,
  fetchP2PStages,
  fetchP2POrders,
  fetchO2CPredictions,
  fetchP2PPredictions,
  fetchProcessOptimization,
  fetchAnomalyDetection
};
