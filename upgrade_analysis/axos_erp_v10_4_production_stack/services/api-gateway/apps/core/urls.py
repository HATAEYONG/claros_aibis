from django.urls import path
from .views import HealthView, DashboardSummaryView, EventListView, ScoreListView, AlertListView, TaskListView, ForecastListView
urlpatterns = [
    path("health/", HealthView.as_view()),
    path("dashboard/summary/", DashboardSummaryView.as_view()),
    path("events/", EventListView.as_view()),
    path("scores/", ScoreListView.as_view()),
    path("alerts/", AlertListView.as_view()),
    path("tasks/", TaskListView.as_view()),
    path("forecasts/", ForecastListView.as_view()),
]
