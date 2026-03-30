from django.contrib import admin
from django.utils.html import format_html
import importlib.util
import os

# 기존 모델 import - models.py 파일을 직접 로드
# models/ 디렉토리와 models.py가 공존하므로, models.py를 직접 import
_current_dir = os.path.dirname(os.path.abspath(__file__))
_models_py_path = os.path.join(_current_dir, 'models.py')

spec = importlib.util.spec_from_file_location("erp_sync.models_legacy", _models_py_path)
legacy_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy_models)

# 기존 모델들을 namespace에 추가
ERPSalesYearPlan = legacy_models.ERPSalesYearPlan
ERPShipmentPlan = legacy_models.ERPShipmentPlan
ERPShipmentPlanItem = legacy_models.ERPShipmentPlanItem
ERPDeliveryHistory = legacy_models.ERPDeliveryHistory
ERPBOM = legacy_models.ERPBOM
ERPMRP = legacy_models.ERPMRP
ERPMRPMaterial = legacy_models.ERPMRPMaterial
ERPProductionResult = legacy_models.ERPProductionResult
ERPMESData = legacy_models.ERPMESData
ERPQualityItem = legacy_models.ERPQualityItem
ERPShipmentInspection = legacy_models.ERPShipmentInspection
ERPShipmentDefect = legacy_models.ERPShipmentDefect
ERPSupplier = legacy_models.ERPSupplier
ERPSupplierEvaluation = legacy_models.ERPSupplierEvaluation
ERPSPC = legacy_models.ERPSPC
ERPBarcodeDelivery = legacy_models.ERPBarcodeDelivery
ERPMaterialPlan = legacy_models.ERPMaterialPlan
ERPInventoryCheck = legacy_models.ERPInventoryCheck
ERPLocation = legacy_models.ERPLocation
ERPLocationStock = legacy_models.ERPLocationStock
ERPWorkInProcess = legacy_models.ERPWorkInProcess
ERPProductLedger = legacy_models.ERPProductLedger
ERPAccountLedger = legacy_models.ERPAccountLedger
ERPSyncLog = legacy_models.ERPSyncLog
ERPSyncConfig = legacy_models.ERPSyncConfig

# 신규 매핑 관리 모델 import
from erp_sync.models import (
    ERPSource,
    ERPTableDefinition,
    ERPFieldDefinition,
    ERPTargetModel,
    ERPTargetField,
    ERPTableMapping,
    ERPFieldMapping,
)


# ========== 동기화 관리 ==========

@admin.register(ERPSyncLog)
class ERPSyncLogAdmin(admin.ModelAdmin):
    list_display = ['sync_id', 'target_table', 'sync_type', 'status_badge',
                    'total_count', 'success_count', 'error_count', 'started_at', 'duration']
    list_filter = ['status', 'sync_type', 'target_table', 'started_at']
    search_fields = ['target_table', 'error_message']
    readonly_fields = ['sync_id', 'started_at', 'finished_at', 'total_count',
                       'success_count', 'error_count', 'error_message']
    ordering = ['-started_at']

    def status_badge(self, obj):
        colors = {
            'running': '#3b82f6',
            'success': '#22c55e',
            'failed': '#ef4444',
            'partial': '#f59e0b',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = '상태'

    def duration(self, obj):
        if obj.finished_at and obj.started_at:
            delta = obj.finished_at - obj.started_at
            return f'{delta.seconds}초'
        return '-'
    duration.short_description = '소요시간'


@admin.register(ERPSyncConfig)
class ERPSyncConfigAdmin(admin.ModelAdmin):
    list_display = ['erp_table', 'mis_model', 'sync_interval', 'is_active', 'last_sync_at']
    list_filter = ['is_active', 'sync_interval']
    search_fields = ['erp_table', 'mis_model']
    list_editable = ['is_active', 'sync_interval']


# ========== 영업 ==========

@admin.register(ERPSalesYearPlan)
class ERPSalesYearPlanAdmin(admin.ModelAdmin):
    list_display = ['plan_year', 'plan_mon', 'cust_nm', 'itm_nm', 'plan_qty', 'plan_amt', 'is_synced']
    list_filter = ['plan_year', 'plan_mon', 'fac_cd', 'is_synced']
    search_fields = ['cust_nm', 'itm_nm', 'itm_cd']
    ordering = ['-plan_year', '-plan_mon']


@admin.register(ERPShipmentPlan)
class ERPShipmentPlanAdmin(admin.ModelAdmin):
    list_display = ['plan_no', 'dlv_dt', 'cust_nm', 'is_synced']
    list_filter = ['dlv_dt', 'is_synced']
    search_fields = ['plan_no', 'cust_nm']
    date_hierarchy = 'dlv_dt'


@admin.register(ERPShipmentPlanItem)
class ERPShipmentPlanItemAdmin(admin.ModelAdmin):
    list_display = ['plan_no', 'plan_sq', 'itm_nm', 'plan_qty', 'out_qty', 'rem_qty']
    list_filter = ['qc_yn', 'is_synced']
    search_fields = ['plan_no', 'itm_nm']


# ========== 생산 ==========

@admin.register(ERPProductionResult)
class ERPProductionResultAdmin(admin.ModelAdmin):
    list_display = ['prd_dt', 'line_cd', 'itm_nm', 'plan_qty', 'prd_qty', 'good_qty', 'bad_qty', 'achievement_rate']
    list_filter = ['prd_dt', 'fac_cd', 'line_cd', 'is_synced']
    search_fields = ['itm_nm', 'itm_cd']
    date_hierarchy = 'prd_dt'

    def achievement_rate(self, obj):
        if obj.plan_qty and obj.plan_qty > 0:
            rate = float(obj.prd_qty) / float(obj.plan_qty) * 100
            color = '#22c55e' if rate >= 100 else '#f59e0b' if rate >= 90 else '#ef4444'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color, rate
            )
        return '-'
    achievement_rate.short_description = '달성률'


@admin.register(ERPBOM)
class ERPBOMAdmin(admin.ModelAdmin):
    list_display = ['parent_itm_nm', 'child_itm_nm', 'bom_qty', 'loss_rt', 'bom_level']
    list_filter = ['bom_level', 'is_synced']
    search_fields = ['parent_itm_nm', 'child_itm_nm']


@admin.register(ERPMESData)
class ERPMESDataAdmin(admin.ModelAdmin):
    list_display = ['tag_dt', 'equip_cd', 'tag_nm', 'tag_val', 'tag_unit']
    list_filter = ['equip_cd', 'tag_nm']
    search_fields = ['equip_cd', 'tag_nm']
    date_hierarchy = 'tag_dt'


# ========== 품질 ==========

@admin.register(ERPShipmentInspection)
class ERPShipmentInspectionAdmin(admin.ModelAdmin):
    list_display = ['qc_no', 'qc_dt', 'itm_nm', 'qc_qty', 'pass_qty', 'fail_qty', 'qc_result_badge', 'inspector']
    list_filter = ['qc_dt', 'qc_result', 'fac_cd', 'is_synced']
    search_fields = ['qc_no', 'itm_nm', 'lot_no']
    date_hierarchy = 'qc_dt'

    def qc_result_badge(self, obj):
        if obj.qc_result == 'PASS':
            return format_html('<span style="color: #22c55e; font-weight: bold;">PASS</span>')
        return format_html('<span style="color: #ef4444; font-weight: bold;">FAIL</span>')
    qc_result_badge.short_description = '결과'


@admin.register(ERPShipmentDefect)
class ERPShipmentDefectAdmin(admin.ModelAdmin):
    list_display = ['qc_no', 'defect_sq', 'defect_nm', 'defect_qty', 'defect_rt']
    list_filter = ['defect_cd', 'is_synced']
    search_fields = ['qc_no', 'defect_nm']


@admin.register(ERPSupplier)
class ERPSupplierAdmin(admin.ModelAdmin):
    list_display = ['sply_cd', 'sply_nm', 'sply_type', 'grade', 'tel_no', 'use_yn']
    list_filter = ['sply_type', 'grade', 'use_yn']
    search_fields = ['sply_cd', 'sply_nm', 'biz_no']


@admin.register(ERPSupplierEvaluation)
class ERPSupplierEvaluationAdmin(admin.ModelAdmin):
    list_display = ['sply_cd', 'eval_year', 'eval_term', 'quality_score', 'delivery_score',
                    'price_score', 'total_score', 'grade']
    list_filter = ['eval_year', 'grade']
    search_fields = ['sply_cd']


@admin.register(ERPSPC)
class ERPSPCAdmin(admin.ModelAdmin):
    list_display = ['spc_dt', 'proc_nm', 'spec_nm', 'avg_val', 'std_val', 'cp', 'cpk_display']
    list_filter = ['spc_dt', 'fac_cd', 'proc_cd']
    search_fields = ['proc_nm', 'spec_nm']
    date_hierarchy = 'spc_dt'

    def cpk_display(self, obj):
        if obj.cpk:
            cpk = float(obj.cpk)
            color = '#22c55e' if cpk >= 1.33 else '#f59e0b' if cpk >= 1.0 else '#ef4444'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.2f}</span>',
                color, cpk
            )
        return '-'
    cpk_display.short_description = 'Cpk'


# ========== 자재/구매 ==========

@admin.register(ERPBarcodeDelivery)
class ERPBarcodeDeliveryAdmin(admin.ModelAdmin):
    list_display = ['bar_no', 'dlv_dt', 'cust_nm', 'itm_nm', 'dlv_qty', 'dlv_bc']
    list_filter = ['dlv_dt', 'dlv_bc', 'fac_cd', 'is_synced']
    search_fields = ['bar_no', 'itm_nm', 'cust_nm']
    date_hierarchy = 'dlv_dt'


@admin.register(ERPInventoryCheck)
class ERPInventoryCheckAdmin(admin.ModelAdmin):
    list_display = ['check_dt', 'itm_nm', 'book_qty', 'check_qty', 'diff_qty', 'lot_no']
    list_filter = ['check_dt', 'fac_cd', 'wh_cd']
    search_fields = ['itm_nm', 'itm_cd']
    date_hierarchy = 'check_dt'


# ========== 물류/재고 ==========

@admin.register(ERPLocation)
class ERPLocationAdmin(admin.ModelAdmin):
    list_display = ['loc_cd', 'loc_nm', 'fac_cd', 'wh_cd', 'zone_cd', 'use_yn']
    list_filter = ['fac_cd', 'wh_cd', 'use_yn']
    search_fields = ['loc_cd', 'loc_nm']


@admin.register(ERPLocationStock)
class ERPLocationStockAdmin(admin.ModelAdmin):
    list_display = ['loc_cd', 'itm_nm', 'lot_no', 'stk_qty', 'stk_dt']
    list_filter = ['loc_cd', 'stk_dt', 'is_synced']
    search_fields = ['itm_nm', 'itm_cd', 'lot_no']


# ========== 회계 ==========

@admin.register(ERPWorkInProcess)
class ERPWorkInProcessAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'itm_nm', 'wip_qty', 'wip_amt', 'mat_amt', 'labor_amt']
    list_filter = ['fiscal_year', 'fiscal_month', 'fac_cd']
    search_fields = ['itm_nm', 'itm_cd']


@admin.register(ERPProductLedger)
class ERPProductLedgerAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'itm_nm', 'prev_qty', 'in_qty', 'out_qty', 'end_qty']
    list_filter = ['fiscal_year', 'fiscal_month', 'fac_cd']
    search_fields = ['itm_nm', 'itm_cd']


@admin.register(ERPAccountLedger)
class ERPAccountLedgerAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'acct_cd', 'acct_nm', 'dr_amt', 'cr_amt', 'balance']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['acct_cd', 'acct_nm']
