# Health Check URLs
from django.urls import path

from .health_views import health_check, readiness_check, liveness_check


urlpatterns = [
    path('', health_check, name='health-check'),
    path('readiness/', readiness_check, name='readiness-check'),
    path('liveness/', liveness_check, name='liveness-check'),
]
