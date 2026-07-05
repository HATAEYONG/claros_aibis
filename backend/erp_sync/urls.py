# -*- coding: utf-8 -*-
"""
ERP 맵핑 관리 URL 설정
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# 기본 import
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ViewSets import (from views package)
from .views import (
    # 기존 ViewSets
    ERPSyncConfigViewSet,
    ERPSyncLogViewSet,
    ERPMappingViewSet,
    ERPSyncServiceConfigViewSet,
    # 신규 매핑 관리 ViewSets
    ERPSourceViewSet,
    ERPTableDefinitionViewSet,
    ERPFieldDefinitionViewSet,
    ERPTargetModelViewSet,
    ERPTargetFieldViewSet,
    ERPTableMappingViewSet,
    ERPFieldMappingViewSet,
    ERPMappingValidationViewSet,
    ERPMappingImportViewSet,
)

# 연결 설정 관리 ViewSet (신규)
from .views.connection_config_views import ERPConnectionConfigViewSet

# 별도 뷰 함수 import
from .service_config_views import enable_sample_service_view, generate_sample_data_view

# 데이터 서비스 임포트
from .services.dashboard_data_service import (
    DashboardDataService,
    KPIDataService,
    RawTableDataService,
)
from .services.financial_statement_service import FinancialStatementDataService
from .services.financial_management_data_service import FinancialManagementDataService
from .services.hr_management_data_service import HRManagementDataService
from .services.material_management_data_service import MaterialManagementDataService
from .services.productivity_data_service import ProductivityDataService
from .services.sales_data_service import SalesDataService
from .services.development_data_service import DevelopmentDataService
from .services.production_data_service import ProductionDataService
from .services.quality_data_service import QualityDataService
from .services.procurement_management_data_service import ProcurementManagementDataService
from .services.logistics_management_data_service import LogisticsManagementDataService
from .services.equipment_management_data_service import EquipmentManagementDataService
from .services.manufacturing_management_data_service import ManufacturingManagementDataService
from .services.cost_management_data_service import CostManagementDataService
from .services.project_management_data_service import ProjectManagementDataService
from .services.managerial_accounting_data_service import ManagerialAccountingDataService

router = DefaultRouter()

# 기존 라우팅
router.register(r'config', ERPSyncConfigViewSet, basename='erp-sync-config')
router.register(r'logs', ERPSyncLogViewSet, basename='erp-sync-log')
router.register(r'mapping', ERPMappingViewSet, basename='erp-mapping')
router.register(r'service-config', ERPSyncServiceConfigViewSet, basename='erp-sync-service-config')

# 연결 설정 관리 라우팅 (신규)
router.register(r'connection-config', ERPConnectionConfigViewSet, basename='erp-connection-config')

# 신규 매핑 관리 라우팅
router.register(r'sources', ERPSourceViewSet, basename='erp-source')
router.register(r'table-definitions', ERPTableDefinitionViewSet, basename='erp-table-definition')
router.register(r'field-definitions', ERPFieldDefinitionViewSet, basename='erp-field-definition')
router.register(r'target-models', ERPTargetModelViewSet, basename='erp-target-model')
router.register(r'target-fields', ERPTargetFieldViewSet, basename='erp-target-field')
router.register(r'table-mappings', ERPTableMappingViewSet, basename='erp-table-mapping')
router.register(r'field-mappings', ERPFieldMappingViewSet, basename='erp-field-mapping')
router.register(r'validations', ERPMappingValidationViewSet, basename='erp-mapping-validation')
router.register(r'import-export', ERPMappingImportViewSet, basename='erp-import-export')

urlpatterns = [
    # Service Config 별도 URL 패턴 (ViewSet action 보충) - router.urls보다 먼저 정의
    path('service-config/sample/activate/', enable_sample_service_view, name='erp-sync-activate-sample'),
    path('service-config/sample/generate/', generate_sample_data_view, name='erp-sync-generate-sample'),
    # 기타 URL 패턴
    path('', include(router.urls)),
    # Dashboard 레이어 데이터 API
    path('dashboard/executive-summary/', DashboardDataService.get_executive_summary),
    path('dashboard/sales/', DashboardDataService.get_sales_dashboard),
    path('dashboard/production/', DashboardDataService.get_production_dashboard),
    path('dashboard/quality/', DashboardDataService.get_quality_dashboard),
    path('dashboard/inventory/', DashboardDataService.get_inventory_dashboard),
    path('dashboard/procurement/', DashboardDataService.get_procurement_dashboard),
    path('dashboard/financial/', DashboardDataService.get_financial_dashboard),
    path('dashboard/hr/', DashboardDataService.get_hr_dashboard),
    # KPI 레이어 데이터 API
    path('kpi/sales-performance/', KPIDataService.get_sales_performance),
    path('kpi/production-performance/', KPIDataService.get_production_performance),
    path('kpi/quality-performance/', KPIDataService.get_quality_performance),
    path('kpi/equipment-efficiency/', KPIDataService.get_equipment_efficiency),
    # 원본 ERP 테이블 데이터 API
    path('data/<str:app_label>/<str:table_name>/', RawTableDataService.get_raw_table_data),
    # 재무제표 데이터 API
    path('financial/income-statement/', FinancialStatementDataService.get_income_statement),
    path('financial/balance-sheet/', FinancialStatementDataService.get_balance_sheet),
    path('financial/cash-flow-statement/', FinancialStatementDataService.get_cash_flow_statement),
    path('financial/equity-statement/', FinancialStatementDataService.get_equity_statement),
    # 재무관리 데이터 API
    path('financial/budget-vs-actual/', FinancialManagementDataService.get_budget_vs_actual),
    path('financial/department-profitability/', FinancialManagementDataService.get_department_profitability),
    path('financial/account-ledger/', FinancialManagementDataService.get_account_ledger),
    path('financial/product-cost/', FinancialManagementDataService.get_product_cost),
    path('financial/monthly-financial-summary/', FinancialManagementDataService.get_monthly_financial_summary),
    path('financial/cost-analysis/', FinancialManagementDataService.get_cost_analysis),
    # 생산성분석 데이터 API
    path('productivity/oee-analysis/', ProductivityDataService.get_oee_analysis),
    path('productivity/line-productivity/', ProductivityDataService.get_line_productivity),
    path('productivity/equipment-utilization/', ProductivityDataService.get_equipment_utilization),
    path('productivity/hourly-production/', ProductivityDataService.get_hourly_production),
    # 영업관리 데이터 API
    path('sales/sales-performance/', SalesDataService.get_sales_performance),
    path('sales/customer-analysis/', SalesDataService.get_customer_analysis),
    path('sales/order-management/', SalesDataService.get_order_management),
    path('sales/sales-trend/', SalesDataService.get_sales_trend),
    path('sales/delivery-status/', SalesDataService.get_delivery_status),
    # 개발관리 데이터 API
    path('development/rd-projects/', DevelopmentDataService.get_rd_projects),
    path('development/development-schedule/', DevelopmentDataService.get_development_schedule),
    path('development/development-budget/', DevelopmentDataService.get_development_budget),
    path('development/resource-allocation/', DevelopmentDataService.get_resource_allocation),
    path('development/development-performance/', DevelopmentDataService.get_development_performance),
    # 생산관리 데이터 API
    path('production/production-plan/', ProductionDataService.get_production_plan),
    path('production/production-status/', ProductionDataService.get_production_status),
    path('production/work-orders/', ProductionDataService.get_work_orders),
    path('production/bom-list/', ProductionDataService.get_bom_list),
    path('production/mrp-plan/', ProductionDataService.get_mrp_plan),
    path('production/equipment-status/', ProductionDataService.get_equipment_status),
    # 품질관리 데이터 API
    path('quality/incoming-inspection/', QualityDataService.get_incoming_inspection),
    path('quality/defect-management/', QualityDataService.get_defect_management),
    path('quality/spc-analysis/', QualityDataService.get_spc_analysis),
    path('quality/quality-claims/', QualityDataService.get_quality_claims),
    path('quality/quality-improvement/', QualityDataService.get_quality_improvement),
    path('quality/quality-metrics/', QualityDataService.get_quality_metrics),
    # 인사관리 데이터 API
    path('hr/employee-list/', HRManagementDataService.get_employee_list),
    path('hr/department-organization/', HRManagementDataService.get_department_organization),
    path('hr/salary-information/', HRManagementDataService.get_salary_information),
    path('hr/attendance-management/', HRManagementDataService.get_attendance_management),
    path('hr/hr-statistics/', HRManagementDataService.get_hr_statistics),
    path('hr/leave-management/', HRManagementDataService.get_leave_management),
    # 자재관리 데이터 API (재고 및 창고 운영 중심)
    path('material/inventory-status/', MaterialManagementDataService.get_inventory_status),
    path('material/material-requirement-planning/', MaterialManagementDataService.get_material_requirement_planning),
    path('material/warehouse-management/', MaterialManagementDataService.get_warehouse_management),
    path('material/material-consumption/', MaterialManagementDataService.get_material_consumption),
    path('material/inventory-movement/', MaterialManagementDataService.get_inventory_movement),
    path('material/material-ledger/', MaterialManagementDataService.get_material_ledger),
    # 구매관리 데이터 API (구매 활동 중심)
    path('procurement/purchase-orders/', ProcurementManagementDataService.get_purchase_orders),
    path('procurement/purchase-requests/', ProcurementManagementDataService.get_purchase_requests),
    path('procurement/purchase-performance/', ProcurementManagementDataService.get_purchase_performance),
    path('procurement/procurement-planning/', ProcurementManagementDataService.get_procurement_planning),
    path('procurement/supplier-evaluation/', ProcurementManagementDataService.get_supplier_evaluation),
    path('procurement/supplier-management/', ProcurementManagementDataService.get_supplier_management),
    path('procurement/purchase-statistics/', ProcurementManagementDataService.get_purchase_statistics),
    # 물류관리 데이터 API
    path('logistics/inbound-management/', LogisticsManagementDataService.get_inbound_management),
    path('logistics/outbound-management/', LogisticsManagementDataService.get_outbound_management),
    path('logistics/warehouse-management/', LogisticsManagementDataService.get_warehouse_management),
    path('logistics/delivery-management/', LogisticsManagementDataService.get_delivery_management),
    path('logistics/inventory-movement/', LogisticsManagementDataService.get_inventory_movement),
    path('logistics/transport-management/', LogisticsManagementDataService.get_transport_management),
    # 설비관리 데이터 API
    path('equipment/equipment-list/', EquipmentManagementDataService.get_equipment_list),
    path('equipment/equipment-status/', EquipmentManagementDataService.get_equipment_status),
    path('equipment/preventive-maintenance/', EquipmentManagementDataService.get_preventive_maintenance),
    path('equipment/breakdown-maintenance/', EquipmentManagementDataService.get_breakdown_maintenance),
    path('equipment/equipment-repair-history/', EquipmentManagementDataService.get_equipment_repair_history),
    path('equipment/equipment-performance/', EquipmentManagementDataService.get_equipment_performance),
    # 제조관리 데이터 API
    path('manufacturing/production-plan/', ManufacturingManagementDataService.get_production_plan),
    path('manufacturing/work-order/', ManufacturingManagementDataService.get_work_order),
    path('manufacturing/production-result/', ManufacturingManagementDataService.get_production_result),
    path('manufacturing/process-management/', ManufacturingManagementDataService.get_process_management),
    path('manufacturing/routing-management/', ManufacturingManagementDataService.get_routing_management),
    path('manufacturing/work-center-management/', ManufacturingManagementDataService.get_work_center_management),
    # 원가관리 데이터 API
    path('cost/product-cost-analysis/', CostManagementDataService.get_product_cost_analysis),
    path('cost/material-cost-analysis/', CostManagementDataService.get_material_cost_analysis),
    path('cost/labor-cost-analysis/', CostManagementDataService.get_labor_cost_analysis),
    path('cost/overhead-cost-analysis/', CostManagementDataService.get_overhead_cost_analysis),
    path('cost/cost-allocation/', CostManagementDataService.get_cost_allocation),
    path('cost/cost-comparison/', CostManagementDataService.get_cost_comparison),
    # 프로젝트관리 데이터 API
    path('project/project-list/', ProjectManagementDataService.get_project_list),
    path('project/project-progress/', ProjectManagementDataService.get_project_progress),
    path('project/project-budget/', ProjectManagementDataService.get_project_budget),
    path('project/resource-allocation/', ProjectManagementDataService.get_project_resource_allocation),
    path('project/milestone/', ProjectManagementDataService.get_project_milestone),
    path('project/performance/', ProjectManagementDataService.get_project_performance),
    # 관리회계 데이터 API
    path('managerial-accounting/cost-center-analysis/', ManagerialAccountingDataService.get_cost_center_analysis),
    path('managerial-accounting/profit-center-analysis/', ManagerialAccountingDataService.get_profit_center_analysis),
    path('managerial-accounting/variance-analysis/', ManagerialAccountingDataService.get_variance_analysis),
    path('managerial-accounting/break-even-analysis/', ManagerialAccountingDataService.get_break_even_analysis),
    path('managerial-accounting/budget-vs-actual/', ManagerialAccountingDataService.get_budget_vs_actual),
    path('managerial-accounting/abc-costing/', ManagerialAccountingDataService.get_abc_costing),
]
