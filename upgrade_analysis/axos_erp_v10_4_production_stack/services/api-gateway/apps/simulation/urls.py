from django.urls import path
from .views import ReleaseProductionOrderView, EquipmentDowntimeView
urlpatterns = [
    path("release-production-order/", ReleaseProductionOrderView.as_view()),
    path("equipment-downtime/", EquipmentDowntimeView.as_view()),
]
