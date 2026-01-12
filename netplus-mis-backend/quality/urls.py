from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QualityInspectionViewSet,
    DefectTypeViewSet,
    DefectRecordViewSet,
    CustomerComplaintViewSet,
    ProcessCapabilityViewSet,
)

router = DefaultRouter()
router.register(r'inspections', QualityInspectionViewSet, basename='quality-inspection')
router.register(r'defect-types', DefectTypeViewSet, basename='defect-type')
router.register(r'defect-records', DefectRecordViewSet, basename='defect-record')
router.register(r'complaints', CustomerComplaintViewSet, basename='customer-complaint')
router.register(r'process-capabilities', ProcessCapabilityViewSet, basename='process-capability')

urlpatterns = [
    path('', include(router.urls)),
]