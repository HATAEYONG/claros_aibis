# ML Pipeline Upgrade URL Configuration
# ML Pipeline V2 API 엔드포인트

from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'ml_pipeline_upgrade'

urlpatterns = [
    # V2 API는 forecasting/urls.py에 통합됨
    # /api/forecasting/v2/ 엔드포인트 참고
]
