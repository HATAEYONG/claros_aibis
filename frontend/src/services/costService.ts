/**
 * Cost Analysis Service
 * 4M2E 코스 분석 및 코스 드라이버 분석 API 서비스
 */

interface CostDimension {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

interface CostDriver {
  id: string;
  name: string;
  dimension: string;
  category: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  impact: string;
  trend: string;
  description: string;
  optimizationPotential: number;
  actions: Array<{
    id: string;
    action: string;
    estimatedSavings: number;
    implementationTime: string;
    priority: string;
    status: string;
  }>;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * 4M2E 코스 분석 데이터 조회
 */
export async function fetchCostBreakdown4M2E(
  periodType: string = 'monthly',
  periodValue: string = '2024-12'
): Promise<ApiResponse<{ dimensions: CostDimension[]; period: { type: string; value: string } }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/cost/breakdown-4m2e/?period_type=${periodType}&period_value=${periodValue}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 코스 드라이버 분석 데이터 조회
 */
export async function fetchCostDriverAnalysis(
  dimension: string = 'ALL',
  periodType: string = 'monthly'
): Promise<ApiResponse<{ drivers: CostDriver[]; dimension: string; period: string }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/cost/driver-analysis/?dimension=${dimension}&period_type=${periodType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching cost driver analysis:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 코스 최적화 추천 조회
 */
export async function fetchCostOptimizationRecommendations(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cost/optimization-recommendations/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching cost optimization recommendations:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
