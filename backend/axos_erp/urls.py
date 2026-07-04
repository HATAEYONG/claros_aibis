"""
AXOS ERP V10.4 통합 URL 설정

이 URL 설정은 AXOS ERP V10.4 Production Stack의 기능을 통합하기 위한 API 엔드포인트를 정의합니다.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# 라우터 생성
router = DefaultRouter()
router.register(r"events", views.EventHubViewSet, basename="axos-event-hub")
router.register(r"risk/scores", views.RiskScoreViewSet, basename="axos-risk-score")
router.register(r"forecast/forecasts", views.ForecastRecordViewSet, basename="axos-forecast")
router.register(r"alerts", views.AlertRecordViewSet, basename="axos-alert")
router.register(r"workflow/tasks", views.WorkflowTaskViewSet, basename="axos-workflow-task")
router.register(r"graph/nodes", views.ProcessGraphViewSet, basename="axos-graph-node")
router.register(r"graph/edges", views.ProcessGraphEdgeViewSet, basename="axos-graph-edge")

app_name = "axos_erp"

urlpatterns = [
    # 라우터 URL
    path("", include(router.urls)),

    # 이벤트 허브
    path("events/publish/", views.EventHubViewSet.as_view({"post": "publish"}), name="event-publish"),
    path("events/topics/", views.EventHubViewSet.as_view({"get": "topics"}), name="event-topics"),
    path("events/statistics/", views.EventHubViewSet.as_view({"get": "statistics"}), name="event-statistics"),

    # 리스크 분석
    path("risk/score/", views.calculate_risk_score, name="risk-score-calculate"),

    # 포캐스팅
    path("forecast/margin/", views.calculate_forecast_margin, name="forecast-margin"),

    # 프로세스 그래프
    path("graph/", views.get_graph_data, name="graph-data"),
    path("graph/update/", views.update_graph, name="graph-update"),

    # 헬스 체크 및 대시보드
    path("health/", views.axos_health_check, name="health-check"),
    path("dashboard/summary/", views.axos_dashboard_summary, name="dashboard-summary"),
]
