# -*- coding: utf-8 -*-
"""
ERP 데이터 허브 모듈
4계층 데이터 아키텍처: Source → Integration → Analytics → Agent Ops
"""
from .master import (
    MasterProduct,
    MasterVendor,
    MasterCustomer,
    MasterDepartment,
    MasterEmployee,
    MasterEquipment,
)
from .integration import (
    IntegratedMaterial,
    IntegratedProductionOrder,
    IntegratedQualityRecord,
    IntegratedSalesOrder,
)
from .analytics import (
    KPIFact,
    KRIFact,
    KPIDefinition,
    KRIDefinition,
)

__all__ = [
    # Master Data
    'MasterProduct',
    'MasterVendor',
    'MasterCustomer',
    'MasterDepartment',
    'MasterEmployee',
    'MasterEquipment',
    # Integration Layer
    'IntegratedMaterial',
    'IntegratedProductionOrder',
    'IntegratedQualityRecord',
    'IntegratedSalesOrder',
    # Analytics Layer
    'KPIFact',
    'KRIFact',
    'KPIDefinition',
    'KRIDefinition',
]
