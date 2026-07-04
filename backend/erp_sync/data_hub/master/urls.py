# -*- coding: utf-8 -*-
"""
마스터 데이터 URL 라우팅
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MasterProductViewSet,
    MasterVendorViewSet,
    MasterCustomerViewSet,
    MasterDepartmentViewSet,
    MasterEmployeeViewSet,
    MasterEquipmentViewSet,
    MasterAccountViewSet,
    MasterWarehouseViewSet,
    MasterProcessViewSet,
    MasterBankViewSet,
)

# ViewSet 등록을 위한 라우터
router = DefaultRouter()
router.register(r'products', MasterProductViewSet, basename='master-product')
router.register(r'vendors', MasterVendorViewSet, basename='master-vendor')
router.register(r'customers', MasterCustomerViewSet, basename='master-customer')
router.register(r'departments', MasterDepartmentViewSet, basename='master-department')
router.register(r'employees', MasterEmployeeViewSet, basename='master-employee')
router.register(r'equipment', MasterEquipmentViewSet, basename='master-equipment')
router.register(r'accounts', MasterAccountViewSet, basename='master-account')
router.register(r'warehouses', MasterWarehouseViewSet, basename='master-warehouse')
router.register(r'processes', MasterProcessViewSet, basename='master-process')
router.register(r'banks', MasterBankViewSet, basename='master-bank')

urlpatterns = [
    path('', include(router.urls)),
]
