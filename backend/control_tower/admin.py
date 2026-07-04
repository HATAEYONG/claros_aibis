from django.contrib import admin
from .models import ControlTowerConfig, DashboardLayout

@admin.register(ControlTowerConfig)
class ControlTowerConfigAdmin(admin.ModelAdmin):
    """컨트롤 타워 설정 Admin"""
    list_display = ["config_id", "name", "tower_type", "is_active", "created_at"]
    list_filter = ["tower_type", "is_active"]
    search_fields = ["name", "description"]


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    """대시보드 레이아웃 Admin"""
    list_display = ["layout_id", "name", "tower_config", "is_default", "created_at"]
    list_filter = ["tower_config", "is_default"]
    search_fields = ["name", "description"]
