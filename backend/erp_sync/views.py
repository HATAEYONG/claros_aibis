# -*- coding: utf-8 -*-
"""
ERP 맵핑 관리 API 뷰
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    ERPSyncConfig, ERPSyncLog, ERPSyncServiceConfig,
    ERPSalesYearPlan, ERPShipmentPlan, ERPShipmentPlanItem,
    ERPDeliveryHistory, ERPBOM, ERPMRP, ERPMRPMaterial,
    ERPProductionResult, ERPMESData,
    ERPQualityItem, ERPShipmentInspection, ERPShipmentDefect,
    ERPSupplier, ERPSupplierEvaluation, ERPSPC,
    ERPBarcodeDelivery, ERPMaterialPlan, ERPInventoryCheck,
    ERPLocation, ERPLocationStock,
    ERPWorkInProcess, ERPProductLedger, ERPAccountLedger,
    # FOM Models
    FOMProductionData, FOMInventoryData, FOMQualityData, FOMEquipmentData,
    FOMCostData, FOMFinanceData, FOMProductMaster, FOMEquipmentMaster, FOMBOMData
)
from .serializers import (
    ERPSyncConfigSerializer, ERPSyncLogSerializer, ERPSyncServiceConfigSerializer,
    ERPTableMappingSerializer, ERPModuleMappingSerializer, ERPFieldMappingSerializer
)

# ERPSyncServiceManager 기능을 별도로 구현 (importlib 사용하지 않음)
class ServiceManagerHelper:
    """ERPSyncServiceManager의 기능을 대체하는 헬퍼 클래스"""

    @staticmethod
    def get_all_services():
        """모든 서비스 설정 조회"""
        services = {}
        for config in ERPSyncServiceConfig.objects.all():
            services[config.service_type] = config
        return services

    @staticmethod
    def get_service_config(service_type):
        """특정 서비스 타입의 설정 조회"""
        try:
            return ERPSyncServiceConfig.objects.get(service_type=service_type)
        except ERPSyncServiceConfig.DoesNotExist:
            return None

    @staticmethod
    def toggle_service(service_type):
        """서비스 활성화/비활성화 토글"""
        config = ServiceManagerHelper.get_service_config(service_type)
        if config:
            config.is_enabled = not config.is_enabled
            config.sync_status = 'idle' if config.is_enabled else 'disabled'
            config.save()
        return config

# ============================================================
# ERP 매핑 관리 시스템 ViewSets (신규)
# ============================================================
# 모듈화된 매핑 관리 ViewSets import
from erp_sync.views import (
    # ERP Source
    ERPSourceViewSet,
    ERPTableDefinitionViewSet,
    ERPFieldDefinitionViewSet,
    # MIS Target
    ERPTargetModelViewSet,
    ERPTargetFieldViewSet,
    # Mapping
    ERPTableMappingViewSet,
    ERPFieldMappingViewSet,
    ERPMappingValidationViewSet,
    ERPMappingImportViewSet,
)


# ERP 테이블 맵핑 정의 (유한DB 기준)
ERP_TABLE_MAPPINGS = {
    # 영업 관련
    'SDY100_YH': {
        'module': 'sales',
        'module_name': '영업관리',
        'table_name': '년제품판매계획',
        'mis_model': 'sales.MonthlySales',
        'mis_model_name': '월별매출',
        'priority': 1,
        'description': '연간 제품 판매 계획 정보',
        'key_fields': ['co_cd', 'plan_year', 'plan_rev', 'fac_cd', 'plan_mon', 'cust_cd', 'itm_id'],
        'field_mappings': {
            'co_cd': {'target': 'company_code', 'type': 'CharField'},
            'plan_year': {'target': 'fiscal_year', 'type': 'IntegerField'},
            'plan_mon': {'target': 'fiscal_month', 'type': 'IntegerField'},
            'cust_cd': {'target': 'customer_code', 'type': 'CharField'},
            'cust_nm': {'target': 'customer_name', 'type': 'CharField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_cd': {'target': 'product_code', 'type': 'CharField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'plan_qty': {'target': 'target_quantity', 'type': 'DecimalField'},
            'plan_amt': {'target': 'target_amount', 'type': 'DecimalField'},
        }
    },
    'SDA500_YH': {
        'module': 'production',
        'module_name': '생산관리',
        'table_name': '일일출하계획',
        'mis_model': 'production.WorkOrder',
        'mis_model_name': '작업지시',
        'priority': 1,
        'description': '일일 출하 계획서',
        'key_fields': ['plan_no'],
        'field_mappings': {
            'plan_no': {'target': 'order_number', 'type': 'CharField'},
            'dlv_dt': {'target': 'delivery_date', 'type': 'DateField'},
            'cust_cd': {'target': 'customer_code', 'type': 'CharField'},
            'cust_nm': {'target': 'customer_name', 'type': 'CharField'},
        }
    },
    'SDA510_YH': {
        'module': 'production',
        'module_name': '생산관리',
        'table_name': '일일출하계획품목',
        'mis_model': 'production.WorkOrder',
        'mis_model_name': '작업지시상세',
        'priority': 1,
        'description': '일일 출하 계획 품목',
        'key_fields': ['plan_no', 'plan_sq'],
        'field_mappings': {
            'plan_no': {'target': 'order_number', 'type': 'CharField'},
            'plan_sq': {'target': 'sequence', 'type': 'IntegerField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_cd': {'target': 'product_code', 'type': 'CharField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'plan_qty': {'target': 'target_quantity', 'type': 'DecimalField'},
        }
    },

    # 생산 관련
    'DMB110_yuhan': {
        'module': 'production',
        'module_name': '생산관리',
        'table_name': 'BOM',
        'mis_model': 'production.DimBOM',
        'mis_model_name': 'BOM',
        'priority': 2,
        'description': '제품 구성 (BOM)',
        'key_fields': ['parent_itm_id', 'child_itm_id'],
        'field_mappings': {
            'parent_itm_id': {'target': 'parent_product', 'type': 'IntegerField'},
            'child_itm_id': {'target': 'child_product', 'type': 'IntegerField'},
            'bom_qty': {'target': 'quantity', 'type': 'DecimalField'},
            'bom_level': {'target': 'level', 'type': 'IntegerField'},
        }
    },
    'ppc100_counter': {
        'module': 'production',
        'module_name': '생산관리',
        'table_name': '생산실적',
        'mis_model': 'production.DailyProduction',
        'mis_model_name': '일별생산',
        'priority': 1,
        'description': '생산 실적 - 절단기 카운터',
        'key_fields': ['prd_dt', 'fac_cd', 'line_cd', 'itm_id'],
        'field_mappings': {
            'prd_dt': {'target': 'production_date', 'type': 'DateField'},
            'fac_cd': {'target': 'factory_code', 'type': 'CharField'},
            'line_cd': {'target': 'line_code', 'type': 'CharField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'plan_qty': {'target': 'target_quantity', 'type': 'DecimalField'},
            'prd_qty': {'target': 'actual_quantity', 'type': 'DecimalField'},
            'good_qty': {'target': 'good_quantity', 'type': 'DecimalField'},
            'bad_qty': {'target': 'defect_quantity', 'type': 'DecimalField'},
        }
    },
    'MESTagValue_YH': {
        'module': 'production',
        'module_name': '생산관리',
        'table_name': 'MES데이터',
        'mis_model': 'production.Equipment',
        'mis_model_name': '설비상태',
        'priority': 2,
        'description': 'MES 통신 접점 데이터',
        'key_fields': ['tag_id'],
        'field_mappings': {
            'tag_dt': {'target': 'timestamp', 'type': 'DateTimeField'},
            'equip_cd': {'target': 'equipment_code', 'type': 'CharField'},
            'tag_nm': {'target': 'tag_name', 'type': 'CharField'},
            'tag_val': {'target': 'tag_value', 'type': 'CharField'},
        }
    },

    # 품질 관련
    'QDA100_yuhan': {
        'module': 'quality',
        'module_name': '품질관리',
        'table_name': '품질ITEM',
        'mis_model': 'quality.DimProduct',
        'mis_model_name': '품질제품',
        'priority': 2,
        'description': '품목 검사 대상 정보',
        'key_fields': ['itm_id'],
        'field_mappings': {
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_cd': {'target': 'product_code', 'type': 'CharField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'itm_spec': {'target': 'specification', 'type': 'CharField'},
            'qc_bc': {'target': 'inspection_type', 'type': 'CharField'},
        }
    },
    'QMO100': {
        'module': 'quality',
        'module_name': '품질관리',
        'table_name': '출하검사',
        'mis_model': 'quality.QualityInspection',
        'mis_model_name': '품질검사',
        'priority': 1,
        'description': '출하 검사 정보',
        'key_fields': ['qc_no'],
        'field_mappings': {
            'qc_no': {'target': 'inspection_number', 'type': 'CharField'},
            'qc_dt': {'target': 'inspection_date', 'type': 'DateField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'lot_no': {'target': 'lot_number', 'type': 'CharField'},
            'qc_qty': {'target': 'inspected_quantity', 'type': 'DecimalField'},
            'pass_qty': {'target': 'pass_count', 'type': 'DecimalField'},
            'fail_qty': {'target': 'fail_count', 'type': 'DecimalField'},
            'qc_result': {'target': 'result', 'type': 'CharField'},
        }
    },
    'QMO110': {
        'module': 'quality',
        'module_name': '품질관리',
        'table_name': '출하검사불량',
        'mis_model': 'quality.DefectRecord',
        'mis_model_name': '불량기록',
        'priority': 2,
        'description': '출하 검사 불량 내역',
        'key_fields': ['qc_no', 'defect_sq'],
        'field_mappings': {
            'qc_no': {'target': 'inspection_number', 'type': 'CharField'},
            'defect_sq': {'target': 'sequence', 'type': 'IntegerField'},
            'defect_cd': {'target': 'defect_code', 'type': 'CharField'},
            'defect_nm': {'target': 'defect_name', 'type': 'CharField'},
            'defect_qty': {'target': 'defect_quantity', 'type': 'DecimalField'},
        }
    },
    'QPM100_YH': {
        'module': 'quality',
        'module_name': '품질관리',
        'table_name': 'SPC',
        'mis_model': 'quality.ProcessCapability',
        'mis_model_name': '공정능력',
        'priority': 3,
        'description': 'SPC 자료 집계',
        'key_fields': ['spc_id'],
        'field_mappings': {
            'spc_dt': {'target': 'analysis_date', 'type': 'DateField'},
            'proc_cd': {'target': 'process_code', 'type': 'CharField'},
            'proc_nm': {'target': 'process_name', 'type': 'CharField'},
            'usl': {'target': 'upper_spec_limit', 'type': 'DecimalField'},
            'lsl': {'target': 'lower_spec_limit', 'type': 'DecimalField'},
            'cpk': {'target': 'cpk', 'type': 'DecimalField'},
        }
    },

    # 자재/구매 관련
    'BAR200': {
        'module': 'purchase',
        'module_name': '구매관리',
        'table_name': '바코드납품',
        'mis_model': 'purchase.PurchaseOrder',
        'mis_model_name': '구매주문',
        'priority': 1,
        'description': '바코드 납품 리스트',
        'key_fields': ['bar_id'],
        'field_mappings': {
            'bar_no': {'target': 'barcode_number', 'type': 'CharField'},
            'cust_cd': {'target': 'supplier_code', 'type': 'CharField'},
            'cust_nm': {'target': 'supplier_name', 'type': 'CharField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'dlv_dt': {'target': 'delivery_date', 'type': 'DateField'},
            'dlv_qty': {'target': 'delivery_quantity', 'type': 'DecimalField'},
        }
    },
    'MMY100_YH': {
        'module': 'purchase',
        'module_name': '구매관리',
        'table_name': '자재소요계획',
        'mis_model': 'purchase.MaterialPlan',
        'mis_model_name': '자재계획',
        'priority': 2,
        'description': '연간 자재 소요 계획',
        'key_fields': ['plan_id'],
        'field_mappings': {
            'plan_year': {'target': 'plan_year', 'type': 'IntegerField'},
            'plan_mon': {'target': 'plan_month', 'type': 'IntegerField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'req_qty': {'target': 'required_quantity', 'type': 'DecimalField'},
            'unit_price': {'target': 'unit_price', 'type': 'DecimalField'},
        }
    },
    'LCB100': {
        'module': 'purchase',
        'module_name': '구매관리',
        'table_name': '로케이션재고',
        'mis_model': 'purchase.Inventory',
        'mis_model_name': '재고',
        'priority': 1,
        'description': 'LOCATION 품목 보관 현황',
        'key_fields': ['loc_cd', 'itm_id', 'lot_no'],
        'field_mappings': {
            'loc_cd': {'target': 'location_code', 'type': 'CharField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'lot_no': {'target': 'lot_number', 'type': 'CharField'},
            'stk_qty': {'target': 'stock_quantity', 'type': 'DecimalField'},
            'stk_dt': {'target': 'stock_date', 'type': 'DateField'},
        }
    },
    'LCA100': {
        'module': 'purchase',
        'module_name': '구매관리',
        'table_name': '로케이션',
        'mis_model': 'purchase.Location',
        'mis_model_name': '창고위치',
        'priority': 3,
        'description': 'LOCATION 코드',
        'key_fields': ['loc_cd'],
        'field_mappings': {
            'loc_cd': {'target': 'location_code', 'type': 'CharField'},
            'loc_nm': {'target': 'location_name', 'type': 'CharField'},
            'fac_cd': {'target': 'factory_code', 'type': 'CharField'},
            'wh_cd': {'target': 'warehouse_code', 'type': 'CharField'},
        }
    },
    'QMM600': {
        'module': 'purchase',
        'module_name': '구매관리',
        'table_name': '공급업체',
        'mis_model': 'purchase.Supplier',
        'mis_model_name': '협력사',
        'priority': 2,
        'description': '공급업체 대장',
        'key_fields': ['sply_cd'],
        'field_mappings': {
            'sply_cd': {'target': 'supplier_code', 'type': 'CharField'},
            'sply_nm': {'target': 'supplier_name', 'type': 'CharField'},
            'biz_no': {'target': 'business_number', 'type': 'CharField'},
            'grade': {'target': 'grade', 'type': 'CharField'},
        }
    },

    # 재무/회계 관련
    'CAM900_YH': {
        'module': 'financial',
        'module_name': '재무관리',
        'table_name': '계정원장',
        'mis_model': 'financial.FinancialStatement',
        'mis_model_name': '재무제표',
        'priority': 2,
        'description': '계정원장 업로드',
        'key_fields': ['fiscal_year', 'fiscal_month', 'acct_cd'],
        'field_mappings': {
            'fiscal_year': {'target': 'fiscal_year', 'type': 'IntegerField'},
            'fiscal_month': {'target': 'fiscal_month', 'type': 'IntegerField'},
            'acct_cd': {'target': 'account_code', 'type': 'CharField'},
            'acct_nm': {'target': 'account_name', 'type': 'CharField'},
            'dr_amt': {'target': 'debit_amount', 'type': 'DecimalField'},
            'cr_amt': {'target': 'credit_amount', 'type': 'DecimalField'},
            'balance': {'target': 'balance', 'type': 'DecimalField'},
        }
    },
    'CAM200_YH': {
        'module': 'financial',
        'module_name': '재무관리',
        'table_name': '재공품명세',
        'mis_model': 'financial.WorkInProcess',
        'mis_model_name': '재공품',
        'priority': 3,
        'description': '재공품 명세서',
        'key_fields': ['wip_id'],
        'field_mappings': {
            'fiscal_year': {'target': 'fiscal_year', 'type': 'IntegerField'},
            'fiscal_month': {'target': 'fiscal_month', 'type': 'IntegerField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'itm_nm': {'target': 'product_name', 'type': 'CharField'},
            'wip_amt': {'target': 'wip_amount', 'type': 'DecimalField'},
        }
    },
    'CAM300_YH': {
        'module': 'financial',
        'module_name': '재무관리',
        'table_name': '제품수불부',
        'mis_model': 'financial.ProductLedger',
        'mis_model_name': '제품수불',
        'priority': 3,
        'description': '제품 수불부',
        'key_fields': ['ledger_id'],
        'field_mappings': {
            'fiscal_year': {'target': 'fiscal_year', 'type': 'IntegerField'},
            'fiscal_month': {'target': 'fiscal_month', 'type': 'IntegerField'},
            'itm_id': {'target': 'product_id', 'type': 'IntegerField'},
            'in_qty': {'target': 'in_quantity', 'type': 'DecimalField'},
            'out_qty': {'target': 'out_quantity', 'type': 'DecimalField'},
            'end_qty': {'target': 'end_quantity', 'type': 'DecimalField'},
        }
    },
}

# 모듈별 정의
MODULE_INFO = {
    'sales': {'name': '영업관리', 'description': '매출, 수주, 고객 관리'},
    'production': {'name': '생산관리', 'description': '생산계획, 작업지시, 설비 관리'},
    'quality': {'name': '품질관리', 'description': '검사, 불량, 공정능력 관리'},
    'purchase': {'name': '구매관리', 'description': '자재, 협력사, 재고 관리'},
    'financial': {'name': '재무관리', 'description': '재무제표, 계정원장, 원가 관리'},
}


class ERPSyncConfigViewSet(viewsets.ModelViewSet):
    """ERP 동기화 설정 ViewSet"""
    queryset = ERPSyncConfig.objects.all()
    serializer_class = ERPSyncConfigSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['is_active', 'sync_priority', 'sync_interval']
    search_fields = ['erp_table', 'mis_model']

    @action(detail=False, methods=['get'])
    def modules(self, request):
        """모듈별 맵핑 정보 조회"""
        result = []

        for module_code, module_info in MODULE_INFO.items():
            # 해당 모듈의 테이블 목록 필터링
            module_tables = {
                k: v for k, v in ERP_TABLE_MAPPINGS.items() if v['module'] == module_code
            }

            tables = []
            for table_name, table_info in module_tables.items():
                # DB에서 설정 조회
                config = ERPSyncConfig.objects.filter(erp_table=table_name).first()

                tables.append({
                    'module': table_info['module'],
                    'erp_table': table_name,
                    'erp_table_name': table_info['table_name'],
                    'mis_model': table_info['mis_model'],
                    'mis_model_name': table_info['mis_model_name'],
                    'sync_priority': table_info['priority'],
                    'is_active': config.is_active if config else False,
                    'last_sync_at': config.last_sync_at if config else None,
                    'field_count': len(table_info.get('field_mappings', {})),
                    'description': table_info.get('description', ''),
                })

            result.append({
                'module_code': module_code,
                'module_name': module_info['name'],
                'module_description': module_info['description'],
                'table_count': len(tables),
                'tables': tables
            })

        serializer = ERPModuleMappingSerializer(result, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def tables(self, request):
        """전체 테이블 맵핑 목록 조회"""
        module = request.query_params.get('module', None)
        is_active = request.query_params.get('is_active', None)

        result = []
        for table_name, table_info in ERP_TABLE_MAPPINGS.items():
            # 모듈 필터
            if module and table_info['module'] != module:
                continue

            # DB에서 설정 조회
            config = ERPSyncConfig.objects.filter(erp_table=table_name).first()

            # 활성화 필터
            if is_active is not None:
                is_active_bool = is_active.lower() == 'true'
                if config and config.is_active != is_active_bool:
                    continue
                if not config and is_active_bool:
                    continue

            result.append({
                'module': table_info['module'],
                'erp_table': table_name,
                'erp_table_name': table_info['table_name'],
                'mis_model': table_info['mis_model'],
                'mis_model_name': table_info['mis_model_name'],
                'sync_priority': table_info['priority'],
                'is_active': config.is_active if config else False,
                'last_sync_at': config.last_sync_at if config else None,
                'field_count': len(table_info.get('field_mappings', {})),
                'description': table_info.get('description', ''),
            })

        serializer = ERPTableMappingSerializer(result, many=True)
        return Response({'count': len(result), 'results': serializer.data})

    @action(detail=False, methods=['get'], url_path='tables/(?P<erp_table>[^/]+)')
    def table_detail(self, request, erp_table=None):
        """테이블 상세 맵핑 정보 조회"""
        if erp_table not in ERP_TABLE_MAPPINGS:
            return Response(
                {'error': f'Table not found: {erp_table}'},
                status=status.HTTP_404_NOT_FOUND
            )

        table_info = ERP_TABLE_MAPPINGS[erp_table]
        config = ERPSyncConfig.objects.filter(erp_table=erp_table).first()

        # 필드 매핑 정보 생성
        field_mappings = []
        key_fields = table_info.get('key_fields', [])

        for erp_field, field_info in table_info.get('field_mappings', {}).items():
            mis_field = field_info['target']
            field_mappings.append({
                'erp_field': erp_field,
                'erp_field_type': field_info['type'],
                'mis_field': mis_field,
                'mis_field_type': field_info['type'],
                'is_key': erp_field in key_fields,
                'is_required': erp_field in key_fields,
                'transform_rule': None
            })

        result = {
            'erp_table': erp_table,
            'erp_table_name': table_info['table_name'],
            'module': table_info['module'],
            'module_name': MODULE_INFO.get(table_info['module'], {}).get('name', ''),
            'mis_model': table_info['mis_model'],
            'mis_model_name': table_info['mis_model_name'],
            'sync_priority': table_info['priority'],
            'description': table_info.get('description', ''),
            'is_active': config.is_active if config else False,
            'sync_interval': config.sync_interval if config else '5min',
            'last_sync_at': config.last_sync_at if config else None,
            'key_fields': key_fields,
            'field_mappings': field_mappings,
        }

        return Response(result)

    @action(detail=False, methods=['post'], url_path='tables/(?P<erp_table>[^/]+)/toggle')
    def toggle_table(self, request, erp_table=None):
        """테이블 동기화 활성화/비활성화"""
        if erp_table not in ERP_TABLE_MAPPINGS:
            return Response(
                {'error': f'Table not found: {erp_table}'},
                status=status.HTTP_404_NOT_FOUND
            )

        config, created = ERPSyncConfig.objects.get_or_create(
            erp_table=erp_table,
            defaults={
                'mis_model': ERP_TABLE_MAPPINGS[erp_table]['mis_model'],
                'is_active': True,
                'sync_interval': '5min',
                'sync_priority': ERP_TABLE_MAPPINGS[erp_table]['priority'],
            }
        )

        config.is_active = not config.is_active
        config.save()

        return Response({
            'erp_table': erp_table,
            'is_active': config.is_active,
            'message': f"{'활성화' if config.is_active else '비활성화'}되었습니다."
        })

    @action(detail=False, methods=['post'], url_path='sync/(?P<erp_table>[^/]+)')
    def sync_table(self, request, erp_table=None):
        """테이블 동기화 실행"""
        if erp_table not in ERP_TABLE_MAPPINGS:
            return Response(
                {'error': f'Table not found: {erp_table}'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 동기화 로그 생성
        sync_log = ERPSyncLog.objects.create(
            sync_type='manual',
            target_table=erp_table,
            status='running',
            started_at=timezone.now()
        )

        # TODO: 실제 동기화 로직 호출
        # from .services import ERPSyncService
        # service = ERPSyncService()
        # service.sync_table(erp_table)

        # 데모용: 즉시 완료 처리
        sync_log.status = 'success'
        sync_log.total_count = 0
        sync_log.success_count = 0
        sync_log.finished_at = timezone.now()
        sync_log.save()

        serializer = ERPSyncLogSerializer(sync_log)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='sync-all')
    def sync_all(self, request):
        """전체 테이블 동기화 실행"""
        sync_type = request.data.get('sync_type', 'incremental')
        priority = request.data.get('priority', None)

        logs = []
        tables_to_sync = list(ERP_TABLE_MAPPINGS.keys())

        # 우선순위 필터
        if priority:
            tables_to_sync = [
                t for t in tables_to_sync
                if ERP_TABLE_MAPPINGS[t]['priority'] == int(priority)
            ]

        for table_name in tables_to_sync:
            sync_log = ERPSyncLog.objects.create(
                sync_type=sync_type,
                target_table=table_name,
                status='running',
                started_at=timezone.now()
            )

            # TODO: 실제 동기화 로직 호출
            sync_log.status = 'success'
            sync_log.total_count = 0
            sync_log.success_count = 0
            sync_log.finished_at = timezone.now()
            sync_log.save()

            logs.append(sync_log)

        serializer = ERPSyncLogSerializer(logs, many=True)
        return Response({
            'message': f'{len(logs)}개 테이블 동기화 시작',
            'logs': serializer.data
        })


class ERPSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ERP 동기화 로그 ViewSet"""
    queryset = ERPSyncLog.objects.all()
    serializer_class = ERPSyncLogSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['sync_type', 'status', 'target_table']
    ordering = ['-started_at']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """동기화 요약 정보"""
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)

        queryset = ERPSyncLog.objects.filter(started_at__gte=since)

        total_count = queryset.count()
        success_count = queryset.filter(status='success').count()
        failed_count = queryset.filter(status='failed').count()
        running_count = queryset.filter(status='running').count()

        # 최근 로그
        recent_logs = queryset[:10]
        serializer = ERPSyncLogSerializer(recent_logs, many=True)

        # 테이블별 상태
        table_status = {}
        for table in ERP_TABLE_MAPPINGS.keys():
            table_logs = queryset.filter(target_table=table).order_by('-started_at')[:1]
            if table_logs:
                latest = table_logs.first()
                table_status[table] = {
                    'status': latest.status,
                    'last_sync_at': latest.started_at,
                }

        return Response({
            'summary': {
                'total_count': total_count,
                'success_count': success_count,
                'failed_count': failed_count,
                'running_count': running_count,
                'success_rate': round(success_count / total_count * 100, 2) if total_count > 0 else 0
            },
            'recent_logs': serializer.data,
            'table_status': table_status
        })

    @action(detail=False, methods=['get'])
    def by_table(self, request):
        """테이블별 동기화 현황"""
        result = []

        for table_name, table_info in ERP_TABLE_MAPPINGS.items():
            # 최근 동기화 로그 조회
            recent_log = ERPSyncLog.objects.filter(
                target_table=table_name
            ).order_by('-started_at').first()

            # 전체 동기화 통계
            all_logs = ERPSyncLog.objects.filter(target_table=table_name)
            total = all_logs.count()
            success = all_logs.filter(status='success').count()
            failed = all_logs.filter(status='failed').count()

            result.append({
                'erp_table': table_name,
                'table_name': table_info['table_name'],
                'module': table_info['module'],
                'module_name': MODULE_INFO.get(table_info['module'], {}).get('name', ''),
                'priority': table_info['priority'],
                'last_sync': recent_log.started_at if recent_log else None,
                'last_status': recent_log.status if recent_log else None,
                'total_sync_count': total,
                'success_count': success,
                'failed_count': failed,
                'success_rate': round(success / total * 100, 2) if total > 0 else 0
            })

        # 모듈별로 그룹화
        grouped = {}
        for item in result:
            module = item['module']
            if module not in grouped:
                grouped[module] = {
                    'module_code': module,
                    'module_name': MODULE_INFO.get(module, {}).get('name', module),
                    'tables': []
                }
            grouped[module]['tables'].append(item)

        return Response(list(grouped.values()))


class ERPMappingViewSet(viewsets.ViewSet):
    """ERP 맵핑 관리 ViewSet"""
    permission_classes = [AllowAny]

    def list(self, request):
        """전체 맵핑 목록"""
        return Response({'redirect': 'Use /modules/ or /tables/ endpoints'})

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """맵핑 현황 개요"""
        total_tables = len(ERP_TABLE_MAPPINGS)
        active_configs = ERPSyncConfig.objects.filter(is_active=True).count()

        # 모듈별 테이블 수
        module_counts = {}
        for table_info in ERP_TABLE_MAPPINGS.values():
            module = table_info['module']
            module_counts[module] = module_counts.get(module, 0) + 1

        # 최근 동기화 현황
        recent_syncs = ERPSyncLog.objects.order_by('-started_at')[:10]
        sync_serializer = ERPSyncLogSerializer(recent_syncs, many=True)

        return Response({
            'total_tables': total_tables,
            'active_configs': active_configs,
            'module_counts': [
                {
                    'module': module,
                    'module_name': MODULE_INFO.get(module, {}).get('name', module),
                    'table_count': count
                }
                for module, count in module_counts.items()
            ],
            'recent_syncs': sync_serializer.data
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        """맵핑 설정 내보내기"""
        result = []

        for table_name, table_info in ERP_TABLE_MAPPINGS.items():
            config = ERPSyncConfig.objects.filter(erp_table=table_name).first()

            result.append({
                'erp_table': table_name,
                'table_name': table_info['table_name'],
                'module': table_info['module'],
                'module_name': MODULE_INFO.get(table_info['module'], {}).get('name', ''),
                'mis_model': table_info['mis_model'],
                'mis_model_name': table_info['mis_model_name'],
                'priority': table_info['priority'],
                'is_active': config.is_active if config else False,
                'sync_interval': config.sync_interval if config else '5min',
                'key_fields': table_info.get('key_fields', []),
                'field_count': len(table_info.get('field_mappings', {})),
                'description': table_info.get('description', ''),
            })

        return Response({'mappings': result})


# ============================================================
# ERP 동기화 서비스 설정 ViewSet
# ============================================================

class ERPSyncServiceConfigViewSet(viewsets.ModelViewSet):
    """ERP 동기화 서비스 설정 ViewSet"""
    queryset = ERPSyncServiceConfig.objects.all()
    serializer_class = ERPSyncServiceConfigSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def check_all_disabled(self, request):
        """모든 서비스 비활성화 상태 확인"""
        all_services = ServiceManagerHelper.get_all_services()
        erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
        all_disabled = all(not service.is_enabled for service in erp_services.values())

        return Response({
            'all_disabled': all_disabled,
            'services': {
                'sap': {
                    'is_enabled': all_services['sap'].is_enabled,
                    'service_name': all_services['sap'].service_name
                },
                'fom': {
                    'is_enabled': all_services['fom'].is_enabled,
                    'service_name': all_services['fom'].service_name
                }
            }
        })

    @action(detail=False, methods=['get'])
    def all_services(self, request):
        """모든 서비스 설정 조회"""
        services = ServiceManagerHelper.get_all_services()

        result = []
        for service_type, config in services.items():
            serializer = ERPSyncServiceConfigSerializer(config)
            result.append(serializer.data)

        return Response({
            'services': result,
            'summary': {
                'total_services': len(result),
                'enabled_count': sum(1 for s in result if s['is_enabled']),
                'disabled_count': sum(1 for s in result if not s['is_enabled'])
            }
        })

    @action(detail=False, methods=['post'], url_path='toggle/(?P<service_type>[^/]+)')
    def toggle_service(self, request, service_type=None):
        """서비스 활성화/비활성화 토글"""
        # Use ServiceManagerHelper

        if service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': f'Invalid service type: {service_type}. Must be sap, fom, or sample.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 샘플 서비스 활성화 시 모든 ERP 서비스가 비활성화되어 있는지 확인
        if service_type == 'sample':
            from .sample_data_service import SampleDataService
            sample_service = SampleDataService()
            current_config = ServiceManagerHelper.get_service_config(service_type)
            # 현재 비활성화 상태에서 활성화로 변경하려는 경우 확인
            if not current_config.is_enabled and not sample_service.is_all_services_disabled():
                return Response(
                    {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        config = ServiceManagerHelper.toggle_service(service_type)
        serializer = ERPSyncServiceConfigSerializer(config)

        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) {'활성화' if config.is_enabled else '비활성화'}되었습니다."
        })

    @action(detail=False, methods=['post'])
    def enable_service(self, request):
        """서비스 활성화"""
        # Use ServiceManagerHelper

        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': 'service_type is required and must be sap, fom, or sample'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 샘플 서비스인 경우 모든 ERP 서비스가 비활성화되어 있는지 확인
        if service_type == 'sample':
            from .sample_data_service import SampleDataService
            sample_service = SampleDataService()
            if not sample_service.is_all_services_disabled():
                return Response(
                    {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        config = ServiceManagerHelper.get_service_config(service_type)
        if not config.is_enabled:
            config.is_enabled = True
            config.sync_status = 'idle'
            config.save()

        serializer = ERPSyncServiceConfigSerializer(config)
        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) 활성화되었습니다."
        })

    @action(detail=False, methods=['post'])
    def disable_service(self, request):
        """서비스 비활성화"""
        # Use ServiceManagerHelper

        service_type = request.data.get('service_type')
        if not service_type or service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': 'service_type is required and must be sap, fom, or sample'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ServiceManagerHelper.get_service_config(service_type)
        if config.is_enabled:
            config.is_enabled = False
            config.sync_status = 'disabled'
            config.save()

        serializer = ERPSyncServiceConfigSerializer(config)
        return Response({
            'service': serializer.data,
            'message': f"{config.service_name}이(가) 비활성화되었습니다."
        })

    @action(detail=False, methods=['get'], url_path='status/(?P<service_type>[^/]+)')
    def service_status(self, request, service_type=None):
        """서비스 상태 조회"""
        # Use ServiceManagerHelper

        if service_type not in ['sap', 'fom', 'sample']:
            return Response(
                {'error': f'Invalid service type: {service_type}. Must be sap, fom, or sample.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ServiceManagerHelper.get_service_config(service_type)
        serializer = ERPSyncServiceConfigSerializer(config)

        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='update-settings')
    def update_settings(self, request):
        """서비스 설정 업데이트 (동기화 주기 등)"""
        # Use ServiceManagerHelper

        service_type = request.data.get('service_type')
        sync_interval_minutes = request.data.get('sync_interval_minutes')
        sync_table_settings = request.data.get('sync_table_settings')

        if not service_type or service_type not in ['sap', 'fom']:
            return Response(
                {'error': 'service_type is required and must be sap or fom'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ServiceManagerHelper.get_service_config(service_type)

        if sync_interval_minutes is not None:
            config.sync_interval_minutes = int(sync_interval_minutes)

        if sync_table_settings is not None:
            config.sync_table_settings = sync_table_settings

        config.save()

        serializer = ERPSyncServiceConfigSerializer(config)
        return Response({
            'service': serializer.data,
            'message': f"{config.service_name} 설정이 업데이트되었습니다."
        })

    @action(detail=False, methods=['post'], url_path='sample/activate')
    def activate_sample_service(self, request):
        """샘플 데이터 서비스 활성화"""
        from .sample_data_service import SampleDataService

        service = SampleDataService()

        if not service.is_all_services_disabled():
            return Response(
                {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = service.activate_sample_service()
        serializer = ERPSyncServiceConfigSerializer(config)

        return Response({
            'service': serializer.data,
            'message': '샘플 데이터 서비스가 활성화되었습니다.'
        })

    @action(detail=False, methods=['post'], url_path='sample/generate')
    def generate_sample_data(self, request):
        """샘플 데이터 생성"""
        from .sample_data_service import SampleDataService

        service = SampleDataService()

        if not service.is_all_services_disabled():
            return Response(
                {'error': '샘플 데이터는 모든 ERP 서비스가 비활성화된 경우에만 생성할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        days = request.data.get('days', 90)
        result = service.generate_sample_data(days)

        return Response(result)

    @action(detail=False, methods=['get'], url_path='sample/status')
    def sample_data_status(self, request):
        """샘플 데이터 상태 조회"""
        from .sample_data_service import SampleDataService

        service = SampleDataService()
        status = service.get_sample_data_status()

        return Response(status)


# ============================================================
# 별도의 뷰 함수 (URL 패턴 등록용)
# ============================================================
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
import json


@csrf_exempt
def check_all_disabled_view(request):
    """모든 서비스 비활성화 상태 확인 (별도 뷰 함수)"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    ERPSyncServiceManager = _get_service_manager()
    all_services = ServiceManagerHelper.get_all_services()
    erp_services = {k: v for k, v in all_services.items() if k in ['sap', 'fom']}
    all_disabled = all(not service.is_enabled for service in erp_services.values())

    return JsonResponse({
        'all_disabled': all_disabled,
        'services': {
            'sap': {
                'is_enabled': all_services['sap'].is_enabled,
                'service_name': all_services['sap'].service_name
            },
            'fom': {
                'is_enabled': all_services['fom'].is_enabled,
                'service_name': all_services['fom'].service_name
            }
        }
    })


@csrf_exempt
def enable_sample_service_view(request):
    """샘플 데이터 서비스 활성화 (별도 뷰 함수)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    from .sample_data_service import SampleDataService

    service = SampleDataService()

    if not service.is_all_services_disabled():
        return JsonResponse(
            {'error': '샘플 데이터 서비스는 모든 ERP 서비스가 비활성화된 경우에만 활성화할 수 있습니다.'},
            status=400
        )

    config = service.activate_sample_service()

    return JsonResponse({
        'service': {
            'config_id': config.config_id,
            'service_type': config.service_type,
            'service_name': config.service_name,
            'is_enabled': config.is_enabled,
            'sync_status': config.sync_status,
        },
        'message': '샘플 데이터 서비스가 활성화되었습니다.'
    })
