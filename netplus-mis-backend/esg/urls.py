from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ESGScoreViewSet, CarbonEmissionViewSet, EnergyConsumptionViewSet,
    FourM2EMetricViewSet, EnvironmentalProjectViewSet,
    SocialResponsibilityViewSet, GovernanceMetricViewSet
)

router = DefaultRouter()
router.register(r'scores', ESGScoreViewSet, basename='esg-score')
router.register(r'carbon', CarbonEmissionViewSet, basename='carbon-emission')
router.register(r'energy', EnergyConsumptionViewSet, basename='energy-consumption')
router.register(r'4m2e', FourM2EMetricViewSet, basename='four-m2e-metric')
router.register(r'projects', EnvironmentalProjectViewSet, basename='environmental-project')
router.register(r'social', SocialResponsibilityViewSet, basename='social-responsibility')
router.register(r'governance', GovernanceMetricViewSet, basename='governance-metric')

urlpatterns = [
    path('', include(router.urls)),
]
