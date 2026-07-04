# -*- coding: utf-8 -*-
"""
마스터 데이터 모델
정규화된 마스터 데이터 (제품, 공급처, 고객, 부서, 직원, 설비)
"""
from .models import (
    MasterProduct,
    MasterVendor,
    MasterCustomer,
    MasterDepartment,
    MasterEmployee,
    MasterEquipment,
)

__all__ = [
    'MasterProduct',
    'MasterVendor',
    'MasterCustomer',
    'MasterDepartment',
    'MasterEmployee',
    'MasterEquipment',
]
