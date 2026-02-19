# AI Prediction URLs
from django.urls import path, include
from rest_framework.routers import SimpleRouter

from .views import PredictionViewSet


router = SimpleRouter()
router.register(r'', PredictionViewSet, basename='prediction')

urlpatterns = [
    path('', include(router.urls)),
]
