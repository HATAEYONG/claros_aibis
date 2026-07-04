from django.urls import path, include
urlpatterns = [
    path("api/v1/core/", include("apps.core.urls")),
    path("api/v1/simulate/", include("apps.simulation.urls")),
]
