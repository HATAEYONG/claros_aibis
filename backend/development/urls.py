from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RDProjectViewSet, InnovationMetricViewSet, PatentViewSet,
    RDPersonnelViewSet, TechnologyRoadmapViewSet, RDBudgetViewSet
)

router = DefaultRouter()
router.register(r'rd-project', RDProjectViewSet)
router.register(r'innovation-metric', InnovationMetricViewSet)
router.register(r'patent', PatentViewSet)
router.register(r'rd-personnel', RDPersonnelViewSet)
router.register(r'technology-roadmap', TechnologyRoadmapViewSet)
router.register(r'rd-budget', RDBudgetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
