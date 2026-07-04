# 도메인 에이전트 분석 URL 설정
from django.urls import path
from . import views

app_name = 'domain_agents'

urlpatterns = [
    # 원가 분석
    path('cost-analysis/cost-structure/', views.cost_analysis_view, {'analysis_type': 'cost-structure'}, name='cost_structure'),
    path('cost-analysis/cost-breakdown/', views.cost_analysis_view, {'analysis_type': 'cost-breakdown'}, name='cost_breakdown'),
    path('cost-analysis/cost-driver/', views.cost_analysis_view, {'analysis_type': 'cost-driver'}, name='cost_driver'),
    path('cost-analysis/cost-comparison/', views.cost_analysis_view, {'analysis_type': 'cost-comparison'}, name='cost_comparison'),
    path('cost-analysis/cost-trends/', views.cost_analysis_view, {'analysis_type': 'cost-trends'}, name='cost_trends'),
    path('cost-analysis/savings-opportunities/', views.cost_analysis_view, {'analysis_type': 'savings-opportunities'}, name='savings_opportunities'),

    # 품질 분석
    path('quality-analysis/defect-rate/', views.quality_analysis_view, {'analysis_type': 'defect-rate'}, name='defect_rate'),
    path('quality-analysis/defect-trends/', views.quality_analysis_view, {'analysis_type': 'defect-trends'}, name='defect_trends'),
    path('quality-analysis/root-cause/', views.quality_analysis_view, {'analysis_type': 'root-cause'}, name='root_cause'),
    path('quality-analysis/pareto-analysis/', views.quality_analysis_view, {'analysis_type': 'pareto-analysis'}, name='pareto_analysis'),
    path('quality-analysis/process-capability/', views.quality_analysis_view, {'analysis_type': 'process-capability'}, name='process_capability'),
    path('quality-analysis/quality-cost/', views.quality_analysis_view, {'analysis_type': 'quality-cost'}, name='quality_cost'),

    # 생산 분석
    path('production-analysis/production-plan/', views.production_analysis_view, {'analysis_type': 'production-plan'}, name='production_plan'),
    path('production-analysis/utilization-rate/', views.production_analysis_view, {'analysis_type': 'utilization-rate'}, name='utilization_rate'),
    path('production-analysis/oee-analysis/', views.production_analysis_view, {'analysis_type': 'oee-analysis'}, name='oee_analysis'),
    path('production-analysis/production-capacity/', views.production_analysis_view, {'analysis_type': 'production-capacity'}, name='production_capacity'),
    path('production-analysis/lead-time/', views.production_analysis_view, {'analysis_type': 'lead-time'}, name='lead_time'),
    path('production-analysis/bottleneck/', views.production_analysis_view, {'analysis_type': 'bottleneck'}, name='bottleneck'),

    # 재고 분석
    path('inventory-analysis/inventory-level/', views.inventory_analysis_view, {'analysis_type': 'inventory-level'}, name='inventory_level'),
    path('inventory-analysis/turnover-rate/', views.inventory_analysis_view, {'analysis_type': 'turnover-rate'}, name='turnover_rate'),
    path('inventory-analysis/safety-stock/', views.inventory_analysis_view, {'analysis_type': 'safety-stock'}, name='safety_stock'),
    path('inventory-analysis/inventory-forecast/', views.inventory_analysis_view, {'analysis_type': 'inventory-forecast'}, name='inventory_forecast'),
    path('inventory-analysis/abc-analysis/', views.inventory_analysis_view, {'analysis_type': 'abc-analysis'}, name='abc_analysis'),

    # 재무 분석
    path('finance-analysis/financial-statements/', views.finance_analysis_view, {'analysis_type': 'financial-statements'}, name='financial_statements'),
    path('finance-analysis/budget-management/', views.finance_analysis_view, {'analysis_type': 'budget-management'}, name='budget_management'),
    path('finance-analysis/cash-flow/', views.finance_analysis_view, {'analysis_type': 'cash-flow'}, name='cash_flow'),
    path('finance-analysis/profitability/', views.finance_analysis_view, {'analysis_type': 'profitability'}, name='profitability'),
    path('finance-analysis/profit-loss/', views.finance_analysis_view, {'analysis_type': 'profit-loss'}, name='profit_loss'),

    # 물류 분석
    path('logistics-analysis/route-optimization/', views.logistics_analysis_view, {'analysis_type': 'route-optimization'}, name='route_optimization'),
    path('logistics-analysis/logistics-cost/', views.logistics_analysis_view, {'analysis_type': 'logistics-cost'}, name='logistics_cost'),
    path('logistics-analysis/delivery-forecast/', views.logistics_analysis_view, {'analysis_type': 'delivery-forecast'}, name='delivery_forecast'),
    path('logistics-analysis/warehouse-optimization/', views.logistics_analysis_view, {'analysis_type': 'warehouse-optimization'}, name='warehouse_optimization'),
]
