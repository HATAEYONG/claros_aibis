"""
ERP 매핑 관리 시스템 모델
ERP 소스, 테이블/필드 정의, 매핑 관련 모델 포함
"""

# 신규 매핑 관리 모델
from .erp_source import (
    ERPSource,
    ERPTableDefinition,
    ERPFieldDefinition,
)
from .mis_target import (
    ERPTargetModel,
    ERPTargetField,
)
from .mapping import (
    ERPTableMapping,
    ERPFieldMapping,
    ERPMappingValidation,
)

# 레거시 모델들은 models.py에서 import (Django가 모델을 찾을 수 있도록)
# 상대 import 사용하여 순환 import 방지
import sys
import os
models_path = os.path.join(os.path.dirname(__file__), '..', 'models.py')

# models.py를 임포트하여 레거시 모델들을 __all__에 추가
if 'erp_sync.models_py' not in sys.modules:
    import importlib.util
    spec = importlib.util.spec_from_file_location('erp_sync.models_py', models_path)
    if spec and spec.loader:
        models_py = importlib.util.module_from_spec(spec)
        sys.modules['erp_sync.models_py'] = models_py
        try:
            spec.loader.exec_module(models_py)
            # 레거시 모델들을 현재 모듈의 네임스페이스에 추가
            ERPSalesYearPlan = models_py.ERPSalesYearPlan
            ERPShipmentPlan = models_py.ERPShipmentPlan
            ERPShipmentPlanItem = models_py.ERPShipmentPlanItem
            ERPDeliveryHistory = models_py.ERPDeliveryHistory
            ERPBOM = models_py.ERPBOM
            ERPMRP = models_py.ERPMRP
            ERPMRPMaterial = models_py.ERPMRPMaterial
            ERPProductionResult = models_py.ERPProductionResult
            ERPMESData = models_py.ERPMESData
            ERPQualityItem = models_py.ERPQualityItem
            ERPShipmentInspection = models_py.ERPShipmentInspection
            ERPShipmentDefect = models_py.ERPShipmentDefect
            ERPSupplier = models_py.ERPSupplier
            ERPSupplierEvaluation = models_py.ERPSupplierEvaluation
            ERPSPC = models_py.ERPSPC
            ERPBarcodeDelivery = models_py.ERPBarcodeDelivery
            ERPMaterialPlan = models_py.ERPMaterialPlan
            ERPInventoryCheck = models_py.ERPInventoryCheck
            ERPLocation = models_py.ERPLocation
            ERPLocationStock = models_py.ERPLocationStock
            ERPWorkInProcess = models_py.ERPWorkInProcess
            ERPProductLedger = models_py.ERPProductLedger
            ERPAccountLedger = models_py.ERPAccountLedger
            ERPSyncLog = models_py.ERPSyncLog
            ERPSyncConfig = models_py.ERPSyncConfig
            ERPSyncServiceConfig = models_py.ERPSyncServiceConfig
            ERPSyncServiceManager = models_py.ERPSyncServiceManager

            _has_legacy_models = True
        except Exception as e:
            # import 실패 시 무시 (Django가 이미 모델을 로드했을 수 있음)
            _has_legacy_models = False
else:
    _has_legacy_models = False

__all__ = [
    # ERP Source (신규)
    'ERPSource',
    'ERPTableDefinition',
    'ERPFieldDefinition',
    # MIS Target (신규)
    'ERPTargetModel',
    'ERPTargetField',
    # Mapping (신규)
    'ERPTableMapping',
    'ERPFieldMapping',
    'ERPMappingValidation',
]

# 레거시 모델들이 있는 경우 __all__에 추가
if '_has_legacy_models' in locals() and _has_legacy_models:
    __all__.extend([
        # 동기화 관리
        'ERPSyncLog', 'ERPSyncConfig', 'ERPSyncServiceConfig',
        # 영업
        'ERPSalesYearPlan', 'ERPShipmentPlan', 'ERPShipmentPlanItem', 'ERPDeliveryHistory',
        # 생산
        'ERPProductionResult', 'ERPBOM', 'ERPMRP', 'ERPMRPMaterial', 'ERPMESData',
        # 품질
        'ERPQualityItem', 'ERPShipmentInspection', 'ERPShipmentDefect', 'ERPSPC',
        # 자재/구매
        'ERPSupplier', 'ERPSupplierEvaluation', 'ERPBarcodeDelivery', 'ERPMaterialPlan', 'ERPInventoryCheck',
        # 물류/재고
        'ERPLocation', 'ERPLocationStock',
        # 회계
        'ERPWorkInProcess', 'ERPProductLedger', 'ERPAccountLedger',
        # 서비스 관리
        'ERPSyncServiceManager',
    ])
