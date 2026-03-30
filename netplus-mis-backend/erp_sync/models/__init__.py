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

# ERP 동기화 서비스 설정 모델 - 직접 import 시도
# (모델 충돌 방지를 위해 __all__에만 추가)
try:
    from ..models import ERPSyncServiceConfig, ERPSyncServiceManager
    _has_service_config = True
except ImportError:
    _has_service_config = False

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

# 서비스 설정이 있는 경우에만 추가
if _has_service_config:
    __all__.extend(['ERPSyncServiceConfig', 'ERPSyncServiceManager'])

# Data Hub 모델 (4계층 데이터 아키텍처)
try:
    from ..data_hub import (
        MasterProduct, MasterVendor, MasterCustomer, MasterDepartment,
        MasterEmployee, MasterEquipment,
        IntegratedMaterial, IntegratedProductionOrder,
        IntegratedQualityRecord, IntegratedSalesOrder,
        KPIFact, KRIFact, KPIDefinition, KRIDefinition,
    )
    _has_data_hub = True
except ImportError:
    _has_data_hub = False

if _has_data_hub:
    __all__.extend([
        # Master Data
        'MasterProduct', 'MasterVendor', 'MasterCustomer',
        'MasterDepartment', 'MasterEmployee', 'MasterEquipment',
        # Integration Layer
        'IntegratedMaterial', 'IntegratedProductionOrder',
        'IntegratedQualityRecord', 'IntegratedSalesOrder',
        # Analytics Layer
        'KPIFact', 'KRIFact', 'KPIDefinition', 'KRIDefinition',
    ])
