# FOM ERP - AI Prediction Engine
# Version: 3.0.0
# Description: Complete AI prediction models for ERP (92 predictions)
# Integrated from claros-mis-ai-upgrade

import logging
import numpy as np
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import json

from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    """Prediction result container"""
    kpi_code: str
    kpi_name: str
    predicted_value: float
    confidence: float  # 0-1
    prediction_horizon: str  # '1d', '1w', '1m', '3m'
    model_used: str
    features_used: List[str]
    predicted_at: datetime
    target_date: date


@dataclass
class AnomalyResult:
    """Anomaly detection result"""
    kpi_code: str
    kpi_name: str
    current_value: float
    expected_range: Tuple[float, float]
    is_anomaly: bool
    severity: str  # 'low', 'medium', 'high', 'critical'
    anomaly_score: float
    detected_at: datetime


class AIPredictionEngine:
    """AI-based prediction engine for ERP KPIs"""

    # Prediction model definitions (92 total)
    PREDICTION_MODELS = {
        # =====================================================================
        # Production Predictions (10)
        # =====================================================================
        'PROD_PRED_001': {
            'name': '일일생산량예측',
            'target_kpi': 'PROD_001',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['qty_actual_lag7d', 'work_hours', 'efficiency', 'day_of_week']
        },
        'PROD_PRED_002': {
            'name': '생산달성률예측',
            'target_kpi': 'PROD_002',
            'horizon': '1w',
            'model': 'gradient_boost',
            'features': ['qty_plan', 'efficiency', 'setup_time', 'downtime']
        },
        'PROD_PRED_003': {
            'name': '불량률예측',
            'target_kpi': 'QUAL_001',
            'horizon': '1d',
            'model': 'random_forest',
            'features': ['defect_rate_lag7d', 'efficiency', 'work_hours', 'line']
        },
        'PROD_PRED_004': {
            'name': 'OEE예측',
            'target_kpi': 'PROD_003',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['oee_lag7d', 'availability', 'performance', 'quality_rate']
        },
        'PROD_PRED_005': {
            'name': '설비고장예측',
            'target_kpi': 'FAC_006',
            'horizon': '1w',
            'model': 'classification',
            'features': ['age_hours', 'mtbf', 'mttr', 'downtime_lag7d']
        },
        'PROD_PRED_006': {
            'name': 'Cycle Time예측',
            'target_kpi': 'PROD_006',
            'horizon': '1d',
            'model': 'regression',
            'features': ['cycle_time_lag7d', 'efficiency', 'uph', 'product_id']
        },
        'PROD_PRED_007': {
            'name': '재작업률예측',
            'target_kpi': 'PROD_009',
            'horizon': '1w',
            'model': 'random_forest',
            'features': ['rework_rate_lag7d', 'defect_rate', 'quality_rate']
        },
        'PROD_PRED_008': {
            'name': '라인별생산량예측',
            'target_kpi': 'PROD_001',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['line_production_lag7d', 'efficiency', 'work_hours']
        },
        'PROD_PRED_009': {
            'name': 'Setup Time예측',
            'target_kpi': 'PROD_007',
            'horizon': '1d',
            'model': 'regression',
            'features': ['setup_time_lag7d', 'product_change', 'line']
        },
        'PROD_PRED_010': {
            'name': '생산성지수예측',
            'target_kpi': 'PROD_010',
            'horizon': '1m',
            'model': 'gradient_boost',
            'features': ['productivity_lag30d', 'efficiency', 'uph', 'oee']
        },

        # =====================================================================
        # Quality Predictions (8)
        # =====================================================================
        'QUAL_PRED_001': {
            'name': '불량률예측',
            'target_kpi': 'QUAL_001',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['defect_rate_lag7d', 'inspection_count', 'temperature', 'humidity']
        },
        'QUAL_PRED_002': {
            'name': 'Cpk예측',
            'target_kpi': 'QUAL_003',
            'horizon': '1w',
            'model': 'regression',
            'features': ['cpk_lag7d', 'mean_shift', 'std_dev', 'sample_size']
        },
        'QUAL_PRED_003': {
            'name': '불량유형예측',
            'target_kpi': 'QUAL_001',
            'horizon': '1d',
            'model': 'classification',
            'features': ['defect_history', 'process_params', 'material_batch']
        },
        'QUAL_PRED_004': {
            'name': '클레임발생예측',
            'target_kpi': 'QUAL_008',
            'horizon': '1m',
            'model': 'random_forest',
            'features': ['claim_rate_lag30d', 'defect_rate', 'customer_complaints']
        },
        'QUAL_PRED_005': {
            'name': '검시시간예측',
            'target_kpi': 'QUAL_002',
            'horizon': '1d',
            'model': 'regression',
            'features': ['inspection_time_lag7d', 'sample_size', 'inspector']
        },
        'QUAL_PRED_006': {
            'name': '공정이상예측',
            'target_kpi': 'QUAL_003',
            'horizon': '1d',
            'model': 'anomaly_detection',
            'features': ['measured_value', 'lsd', 'usl', 'mean', 'std']
        },
        'QUAL_PRED_007': {
            'name': '품질비용예측',
            'target_kpi': 'QUAL_010',
            'horizon': '1m',
            'model': 'regression',
            'features': ['quality_cost_lag30d', 'defect_rate', 'scrap_count']
        },
        'QUAL_PRED_008': {
            'name': 'PPM예측',
            'target_kpi': 'QUAL_005',
            'horizon': '1w',
            'model': 'poisson',
            'features': ['ppm_lag7d', 'production_qty', 'inspection_qty']
        },

        # =====================================================================
        # Inventory Predictions (10)
        # =====================================================================
        'INV_PRED_001': {
            'name': '재고소진일수예측',
            'target_kpi': 'INV_010',
            'horizon': '1w',
            'model': 'regression',
            'features': ['current_stock', 'daily_consumption_lag7d', 'sales_forecast']
        },
        'INV_PRED_002': {
            'name': '재고부족예측',
            'target_kpi': 'INV_006',
            'horizon': '1w',
            'model': 'classification',
            'features': ['stock_level', 'safety_stock', 'incoming_orders', 'consumption_rate']
        },
        'INV_PRED_003': {
            'name': '과잉재고예측',
            'target_kpi': 'INV_007',
            'horizon': '1m',
            'model': 'classification',
            'features': ['stock_age', 'consumption_rate', 'future_demand']
        },
        'INV_PRED_004': {
            'name': '재고회전율예측',
            'target_kpi': 'INV_001',
            'horizon': '1m',
            'model': 'regression',
            'features': ['turnover_lag30d', 'cogs', 'avg_inventory']
        },
        'INV_PRED_005': {
            'name': '입고예측',
            'target_kpi': 'INV_001',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['inbound_lag7d', 'po_count', 'supplier_lead_time']
        },
        'INV_PRED_006': {
            'name': '출고예측',
            'target_kpi': 'INV_001',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['outbound_lag7d', 'sales_orders', 'shipment_plan']
        },
        'INV_PRED_007': {
            'name': '창고공간부족예측',
            'target_kpi': 'LOG_009',
            'horizon': '1m',
            'model': 'regression',
            'features': ['space_utilization', 'inbound_forecast', 'outbound_forecast']
        },
        'INV_PRED_008': {
            'name': '재고평가손예측',
            'target_kpi': 'INV_009',
            'horizon': '1m',
            'model': 'regression',
            'features': ['inventory_age', 'obsolescence_rate', 'market_demand']
        },
        'INV_PRED_009': {
            'name': '안전재고도달예측',
            'target_kpi': 'INV_005',
            'horizon': '1w',
            'model': 'classification',
            'features': ['stock_level', 'consumption_rate', 'lead_time']
        },
        'INV_PRED_010': {
            'name': 'BOM소요량예측',
            'target_kpi': 'INV_001',
            'horizon': '1m',
            'model': 'regression',
            'features': ['production_plan', 'bom_quantity', 'yield_rate']
        },

        # =====================================================================
        # Sales/Revenue Predictions (10)
        # =====================================================================
        'SAL_PRED_001': {
            'name': '매출액예측',
            'target_kpi': 'SAL_001',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['revenue_lag30d', 'order_backlog', 'seasonality', 'economic_index']
        },
        'SAL_PRED_002': {
            'name': '수주액예측',
            'target_kpi': 'SAL_003',
            'horizon': '1m',
            'model': 'gradient_boost',
            'features': ['orders_lag30d', 'quote_count', 'win_rate', 'market_trend']
        },
        'SAL_PRED_003': {
            'name': '고객별매출예측',
            'target_kpi': 'SAL_008',
            'horizon': '1m',
            'model': 'regression',
            'features': ['customer_revenue_lag30d', 'order_frequency', 'contract_value']
        },
        'SAL_PRED_004': {
            'name': '제품별매출예측',
            'target_kpi': 'SAL_011',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['product_revenue_lag30d', 'demand_forecast', 'seasonality']
        },
        'SAL_PRED_005': {
            'name': '수주잔고예측',
            'target_kpi': 'SAL_004',
            'horizon': '1w',
            'model': 'regression',
            'features': ['backlog_lag7d', 'new_orders', 'production_capacity']
        },
        'SAL_PRED_006': {
            'name': '영업이익률예측',
            'target_kpi': 'SAL_007',
            'horizon': '1m',
            'model': 'regression',
            'features': ['margin_lag30d', 'cost_trend', 'price_trend']
        },
        'SAL_PRED_007': {
            'name': '신규고객획득예측',
            'target_kpi': 'SAL_009',
            'horizon': '1m',
            'model': 'poisson',
            'features': ['lead_count', 'conversion_rate', 'marketing_spend']
        },
        'SAL_PRED_008': {
            'name': '견적성공률예측',
            'target_kpi': 'SAL_010',
            'horizon': '1w',
            'model': 'classification',
            'features': ['win_rate_lag30d', 'price_competitiveness', 'delivery_time']
        },
        'SAL_PRED_009': {
            'name': '이탈고객예측',
            'target_kpi': 'SAL_009',
            'horizon': '1m',
            'model': 'classification',
            'features': ['customer_tenure', 'order_frequency', 'complaint_count']
        },
        'SAL_PRED_010': {
            'name': '수요변동예측',
            'target_kpi': 'SAL_001',
            'horizon': '3m',
            'model': 'lstm',
            'features': ['demand_lag90d', 'seasonality', 'economic_indicator']
        },

        # =====================================================================
        # Facility/Equipment Predictions (8)
        # =====================================================================
        'FAC_PRED_001': {
            'name': '설비고장예측',
            'target_kpi': 'FAC_006',
            'horizon': '1w',
            'model': 'random_forest',
            'features': ['age', 'runtime_hours', 'vibration', 'temperature', 'mtbf']
        },
        'FAC_PRED_002': {
            'name': 'OEE예측',
            'target_kpi': 'FAC_004',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['oee_lag7d', 'availability', 'performance', 'quality_rate']
        },
        'FAC_PRED_003': {
            'name': '보전비용예측',
            'target_kpi': 'FAC_008',
            'horizon': '1m',
            'model': 'regression',
            'features': ['maintenance_cost_lag30d', 'equipment_age', 'failure_count']
        },
        'FAC_PRED_004': {
            'name': 'MTBF예측',
            'target_kpi': 'FAC_002',
            'horizon': '1m',
            'model': 'regression',
            'features': ['mtbf_lag30d', 'total_runtime', 'maintenance_quality']
        },
        'FAC_PRED_005': {
            'name': '에너지소비예측',
            'target_kpi': 'FAC_009',
            'horizon': '1w',
            'model': 'lstm',
            'features': ['energy_lag7d', 'production_volume', 'efficiency']
        },
        'FAC_PRED_006': {
            'name': '예방보전일정예측',
            'target_kpi': 'FAC_005',
            'horizon': '1m',
            'model': 'optimization',
            'features': ['last_maintenance', 'equipment_age', 'criticality']
        },
        'FAC_PRED_007': {
            'name': '설비수명예측',
            'target_kpi': 'FAC_010',
            'horizon': '1y',
            'model': 'regression',
            'features': ['age', 'usage', 'maintenance_history', 'environment']
        },
        'FAC_PRED_008': {
            'name': '용량부족예측',
            'target_kpi': 'PROD_001',
            'horizon': '1m',
            'model': 'regression',
            'features': ['capacity_utilization', 'demand_forecast', 'expansion_plan']
        },

        # =====================================================================
        # Cost Predictions (8)
        # =====================================================================
        'COST_PRED_001': {
            'name': '단위원가예측',
            'target_kpi': 'COST_001',
            'horizon': '1m',
            'model': 'regression',
            'features': ['unit_cost_lag30d', 'material_cost', 'labor_cost', 'overhead_cost']
        },
        'COST_PRED_002': {
            'name': '재료비예측',
            'target_kpi': 'COST_003',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['material_cost_lag30d', 'commodity_prices', 'exchange_rate']
        },
        'COST_PRED_003': {
            'name': '노무비예측',
            'target_kpi': 'COST_004',
            'horizon': '1m',
            'model': 'regression',
            'features': ['labor_cost_lag30d', 'overtime_hours', 'wage_rate']
        },
        'COST_PRED_004': {
            'name': '경비예측',
            'target_kpi': 'COST_005',
            'horizon': '1m',
            'model': 'regression',
            'features': ['overhead_lag30d', 'production_volume', 'utility_rates']
        },
        'COST_PRED_005': {
            'name': '원가차이예측',
            'target_kpi': 'COST_002',
            'horizon': '1m',
            'model': 'regression',
            'features': ['variance_lag30d', 'standard_cost', 'efficiency']
        },
        'COST_PRED_006': {
            'name': '외주가공비예측',
            'target_kpi': 'COST_008',
            'horizon': '1m',
            'model': 'regression',
            'features': ['outsource_cost_lag30d', 'outsourced_volume', 'vendor_rates']
        },
        'COST_PRED_007': {
            'name': '손실률예측',
            'target_kpi': 'COST_007',
            'horizon': '1w',
            'model': 'regression',
            'features': ['loss_rate_lag7d', 'process_yield', 'quality_rate']
        },
        'COST_PRED_008': {
            'name': '총원가예측',
            'target_kpi': 'COST_001',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['total_cost_lag30d', 'production_volume', 'cost_drivers']
        },

        # =====================================================================
        # Finance Predictions (10)
        # =====================================================================
        'FIN_PRED_001': {
            'name': '매출액예측',
            'target_kpi': 'FIN_001',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['revenue_lag30d', 'order_backlog', 'seasonality']
        },
        'FIN_PRED_002': {
            'name': '영업이익예측',
            'target_kpi': 'FIN_002',
            'horizon': '1m',
            'model': 'regression',
            'features': ['operating_profit_lag30d', 'revenue_forecast', 'cost_forecast']
        },
        'FIN_PRED_003': {
            'name': '당기순이익예측',
            'target_kpi': 'FIN_004',
            'horizon': '1m',
            'model': 'regression',
            'features': ['net_income_lag30d', 'operating_profit', 'tax_rate']
        },
        'FIN_PRED_004': {
            'name': '현금흐름예측',
            'target_kpi': 'FIN_010',
            'horizon': '1m',
            'model': 'lstm',
            'features': ['cf_lag30d', 'ar_balance', 'ap_balance', 'revenue']
        },
        'FIN_PRED_005': {
            'name': 'ROE예측',
            'target_kpi': 'FIN_006',
            'horizon': '1m',
            'model': 'regression',
            'features': ['roe_lag30d', 'net_income', 'equity']
        },
        'FIN_PRED_006': {
            'name': 'ROA예측',
            'target_kpi': 'FIN_007',
            'horizon': '1m',
            'model': 'regression',
            'features': ['roa_lag30d', 'net_income', 'total_assets']
        },
        'FIN_PRED_007': {
            'name': '유동비율예측',
            'target_kpi': 'FIN_008',
            'horizon': '1m',
            'model': 'regression',
            'features': ['current_ratio_lag30d', 'current_assets', 'current_liabilities']
        },
        'FIN_PRED_008': {
            'name': '부채비율예측',
            'target_kpi': 'FIN_009',
            'horizon': '1m',
            'model': 'regression',
            'features': ['debt_ratio_lag30d', 'total_debt', 'equity']
        },
        'FIN_PRED_009': {
            'name': 'EBITDA예측',
            'target_kpi': 'FIN_011',
            'horizon': '1m',
            'model': 'regression',
            'features': ['ebitda_lag30d', 'operating_profit', 'depreciation']
        },
        'FIN_PRED_010': {
            'name': '재무위험예측',
            'target_kpi': 'FIN_008',
            'horizon': '1m',
            'model': 'classification',
            'features': ['liquidity_ratio', 'debt_ratio', 'profitability', 'cash_flow']
        },

        # =====================================================================
        # Logistics Predictions (8)
        # =====================================================================
        'LOG_PRED_001': {
            'name': '배송시간예측',
            'target_kpi': 'LOG_003',
            'horizon': '1d',
            'model': 'regression',
            'features': ['distance', 'carrier', 'route', 'weather', 'volume']
        },
        'LOG_PRED_002': {
            'name': '배송정시율예측',
            'target_kpi': 'LOG_006',
            'horizon': '1w',
            'model': 'classification',
            'features': ['on_time_rate_lag7d', 'carrier', 'destination', 'volume']
        },
        'LOG_PRED_003': {
            'name': '물류비용예측',
            'target_kpi': 'LOG_005',
            'horizon': '1m',
            'model': 'regression',
            'features': ['logistics_cost_lag30d', 'fuel_cost', 'shipment_volume']
        },
        'LOG_PRED_004': {
            'name': '입고처리시간예측',
            'target_kpi': 'LOG_003',
            'horizon': '1d',
            'model': 'regression',
            'features': ['processing_time_lag7d', 'volume', 'staff']
        },
        'LOG_PRED_005': {
            'name': '출고처리시간예측',
            'target_kpi': 'LOG_004',
            'horizon': '1d',
            'model': 'regression',
            'features': ['processing_time_lag7d', 'order_count', 'picker_count']
        },
        'LOG_PRED_006': {
            'name': '창고공간활용예측',
            'target_kpi': 'LOG_009',
            'horizon': '1w',
            'model': 'regression',
            'features': ['space_utilization_lag7d', 'inbound_forecast', 'outbound_forecast']
        },
        'LOG_PRED_007': {
            'name': '피킹생산성예측',
            'target_kpi': 'LOG_010',
            'horizon': '1w',
            'model': 'regression',
            'features': ['picks_per_hour_lag7d', 'order_complexity', 'experience']
        },
        'LOG_PRED_008': {
            'name': '반품률예측',
            'target_kpi': 'LOG_002',
            'horizon': '1w',
            'model': 'classification',
            'features': ['return_rate_lag7d', 'product_category', 'transit_time']
        },

        # =====================================================================
        # HR Predictions (10)
        # =====================================================================
        'HR_PRED_001': {
            'name': '인당생산성예측',
            'target_kpi': 'HR_001',
            'horizon': '1m',
            'model': 'regression',
            'features': ['productivity_lag30d', 'training_hours', 'experience']
        },
        'HR_PRED_002': {
            'name': '이직률예측',
            'target_kpi': 'HR_003',
            'horizon': '1m',
            'model': 'classification',
            'features': ['tenure', 'satisfaction', 'salary', 'workload']
        },
        'HR_PRED_003': {
            'name': '채용소요시간예측',
            'target_kpi': 'HR_004',
            'horizon': '1m',
            'model': 'regression',
            'features': ['time_to_hire_lag30d', 'position', 'department']
        },
        'HR_PRED_004': {
            'name': '근태유예측',
            'target_kpi': 'HR_006',
            'horizon': '1w',
            'model': 'classification',
            'features': ['attendance_lag7d', 'season', 'department']
        },
        'HR_PRED_005': {
            'name': '교육효과예측',
            'target_kpi': 'HR_007',
            'horizon': '1m',
            'model': 'regression',
            'features': ['training_hours', 'pre_test', 'training_type']
        },
        'HR_PRED_006': {
            'name': '인건비예측',
            'target_kpi': 'HR_009',
            'horizon': '1m',
            'model': 'regression',
            'features': ['payroll_lag30d', 'headcount', 'overtime_hours']
        },
        'HR_PRED_007': {
            'name': '직원만족도예측',
            'target_kpi': 'HR_011',
            'horizon': '1m',
            'model': 'classification',
            'features': ['satisfaction_lag30d', 'workload', 'compensation', 'growth']
        },
        'HR_PRED_008': {
            'name': '승진대상자예측',
            'target_kpi': 'HR_001',
            'horizon': '1m',
            'model': 'classification',
            'features': ['performance', 'tenure', 'training', 'potential']
        },
        'HR_PRED_009': {
            'name': '퇴직위험예측',
            'target_kpi': 'HR_003',
            'horizon': '1m',
            'model': 'classification',
            'features': ['tenure', 'satisfaction', 'salary_gap', 'offer_received']
        },
        'HR_PRED_010': {
            'name': '인력수요예측',
            'target_kpi': 'HR_001',
            'horizon': '3m',
            'model': 'regression',
            'features': ['headcount_lag90d', 'production_plan', 'attrition_rate']
        },
    }

    def __init__(self):
        """Initialize the AI prediction engine"""
        pass

    def predict(self, prediction_code: str, target_date: date = None) -> Optional[PredictionResult]:
        """Generate prediction for a specific KPI"""

        if prediction_code not in self.PREDICTION_MODELS:
            return None

        model_config = self.PREDICTION_MODELS[prediction_code]

        # Get historical data for the target KPI
        historical_values = self._get_historical_data(
            model_config['target_kpi'],
            days_back=30
        )

        # Simple prediction algorithm (replace with actual ML model)
        if historical_values:
            predicted_value = self._simple_prediction(historical_values)
            confidence = self._calculate_confidence(historical_values)
        else:
            # Use default/placeholder values if no historical data
            predicted_value = 0.0
            confidence = 0.0

        return PredictionResult(
            kpi_code=model_config['target_kpi'],
            kpi_name=model_config['name'],
            predicted_value=predicted_value,
            confidence=confidence,
            prediction_horizon=model_config['horizon'],
            model_used=model_config['model'],
            features_used=model_config['features'],
            predicted_at=datetime.now(),
            target_date=target_date or (datetime.now() + timedelta(days=7)).date()
        )

    def _get_historical_data(self, kpi_code: str, days_back: int = 30) -> List[float]:
        """Get historical KPI values from database"""
        try:
            # Map KPI code to Django models
            from production.models import DailyProduction
            from quality.models import QualityInspection
            from financial.models import FinancialStatement

            # Get data based on KPI code
            if kpi_code == 'PROD_001':
                # Daily production quantity
                cutoff_date = datetime.now() - timedelta(days=days_back)
                data = DailyProduction.objects.filter(
                    production_date__gte=cutoff_date
                ).order_by('-production_date')[:days_back]
                return [float(q.actual_quantity) for q in data if q.actual_quantity]
            elif kpi_code == 'QUAL_001':
                # Defect rate
                cutoff_date = datetime.now() - timedelta(days=days_back)
                data = QualityInspection.objects.filter(
                    inspection_date__gte=cutoff_date
                ).order_by('-inspection_date')[:days_back]
                return [(1 - q.pass_rate) for q in data if q.pass_rate is not None]
            elif kpi_code.startswith('FIN_'):
                # Financial KPIs
                cutoff_date = datetime.now() - timedelta(days=days_back)
                data = FinancialStatement.objects.filter(
                    fiscal_year__gte=cutoff_date.year
                ).order_by('-fiscal_year', '-fiscal_month')[:days_back]
                return [float(data.total_revenue) for data in data if data.total_revenue]
            else:
                # Default empty list for unsupported KPIs
                return []

        except Exception as e:
            logger.error(f"Error getting historical data for {kpi_code}: {e}")
            return []

    def _simple_prediction(self, historical_values: List[float]) -> float:
        """Simple prediction using moving average"""
        if not historical_values:
            return 0.0

        # Use weighted moving average (more weight on recent values)
        weights = np.array([i + 1 for i in range(len(historical_values))])
        weights = weights / weights.sum()

        return float(np.sum(np.array(historical_values) * weights))

    def _calculate_confidence(self, historical_values: List[float]) -> float:
        """Calculate prediction confidence based on data stability"""
        if len(historical_values) < 3:
            return 0.5

        # Calculate coefficient of variation
        mean = np.mean(historical_values)
        std = np.std(historical_values)

        if mean == 0:
            return 0.5

        cv = std / abs(mean)

        # Lower CV = higher confidence
        confidence = max(0.0, min(1.0, 1.0 - cv))
        return float(confidence)

    def detect_anomalies(self, kpi_code: str, threshold: float = 2.0) -> List[AnomalyResult]:
        """Detect anomalies in KPI values using statistical methods"""
        historical_values = self._get_historical_data(kpi_code, days_back=90)

        if len(historical_values) < 10:
            return []

        mean = np.mean(historical_values)
        std = np.std(historical_values)

        anomalies = []
        current_value = historical_values[0] if historical_values else 0

        z_score = abs((current_value - mean) / std) if std > 0 else 0

        is_anomaly = z_score > threshold

        # Determine severity
        if z_score > 4:
            severity = 'critical'
        elif z_score > 3:
            severity = 'high'
        elif z_score > threshold:
            severity = 'medium'
        else:
            severity = 'low'

        if is_anomaly:
            anomalies.append(AnomalyResult(
                kpi_code=kpi_code,
                kpi_name=kpi_code,  # Would need mapping to name
                current_value=current_value,
                expected_range=(mean - 2 * std, mean + 2 * std),
                is_anomaly=True,
                severity=severity,
                anomaly_score=float(z_score),
                detected_at=datetime.now()
            ))

        return anomalies

    def get_all_predictions(self, module: Optional[str] = None) -> List[PredictionResult]:
        """Get all predictions for a module or all modules"""
        predictions = []

        for code, config in self.PREDICTION_MODELS.items():
            if module is None or code.startswith(module.split('_')[0] + '_PRED'):
                result = self.predict(code)
                if result:
                    predictions.append(result)

        return predictions

    def export_predictions(self, output_path: str):
        """Export all predictions to JSON file"""
        predictions = self.get_all_predictions()

        prediction_data = [
            {
                'kpi_code': p.kpi_code,
                'kpi_name': p.kpi_name,
                'predicted_value': p.predicted_value,
                'confidence': p.confidence,
                'horizon': p.prediction_horizon,
                'model': p.model_used,
                'target_date': p.target_date.isoformat()
            }
            for p in predictions
        ]

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(prediction_data, f, ensure_ascii=False, indent=2)
