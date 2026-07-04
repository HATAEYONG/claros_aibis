/**
 * Prediction-related type definitions
 */

// Prediction result from the API
export interface PredictionResult {
  prediction_code?: string;
  kpi_code: string;
  kpi_name: string;
  predicted_value: number;
  confidence: number; // 0-1
  horizon: string; // '1d', '1w', '1m', '3m', '1y'
  model_used: string;
  target_date: string;
  predicted_at?: string;
  feature_importance?: Record<string, number>;
}

// Historical data point for charts
export interface HistoricalDataPoint {
  date: string;
  value?: number;
  revenue?: number;
  operating_profit?: number;
  net_income?: number;
  cash_flow?: number;
  production_quantity?: number;
  defect_rate?: number;
  oee?: number;
  cpk?: number;
  inspection_time?: number;
  stock_level?: number;
  turnover_rate?: number;
  depletion_days?: number;
  inventory_days?: number;
  stockout_count?: number;
  excess_count?: number;
  claim_count?: number;
  // Additional fields for sample data
  inbound_quantity?: number;
  outbound_quantity?: number;
  cycle_time?: number;
}

// Category-based prediction response
export interface CategoryPredictionResponse {
  category: PredictionCategory;
  category_name: string;
  predictions: PredictionResult[];
  historical_data?: HistoricalDataPoint[];
}

// Prediction categories - 12개 도메인
export type PredictionCategory =
  | 'finance'      // 재무 예측
  | 'production'   // 생산 예측
  | 'quality'      // 품질 예측
  | 'inventory'    // 재고 예측
  | 'sales'        // 영업 예측
  | 'equipment'    // 설비 예측
  | 'customer'     // 고객 예측
  | 'cost'         // 원가 예측
  | 'purchase'     // 구매 예측
  | 'logistics'    // 물류 예측
  | 'hr'           // 인사 예측
  | 'etc';         // 기타 예측

// Prediction category metadata
export interface PredictionCategoryInfo {
  id: PredictionCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  kpiCodes: string[];
  apiEndpoint: string;
}

// Time range options for predictions
export type TimeRange = '1d' | '1w' | '1m' | '3m' | '1y';

// Prediction card props
export interface PredictionCardProps {
  prediction: PredictionResult;
  currentValue?: number;
  showTrend?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Prediction chart props
export interface PredictionChartProps {
  historicalData: HistoricalDataPoint[];
  predictedValue: number;
  targetDate: string;
  confidence?: number;
  height?: number;
  type?: 'line' | 'bar';
  color?: string;
}

// Anomaly detection result
export interface AnomalyResult {
  kpi_code: string;
  kpi_name: string;
  current_value: number;
  expected_range: [number, number];
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomaly_score: number;
  detected_at: string;
}

// Prediction summary statistics
export interface PredictionSummary {
  total: number;
  high_confidence: number; // confidence > 0.8
  medium_confidence: number; // 0.5 < confidence <= 0.8
  low_confidence: number; // confidence <= 0.5
  positive_trend: number;
  negative_trend: number;
}

// Prediction filter options
export interface PredictionFilters {
  category?: PredictionCategory;
  min_confidence?: number;
  horizon?: TimeRange;
  date_range?: {
    start: string;
    end: string;
  };
}
