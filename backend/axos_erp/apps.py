"""
AXOS ERP V10.4 통합 앱 설정
"""
from django.apps import AppConfig


class AxosErpConfig(AppConfig):
    """AXOS ERP V10.4 통합 앱 설정"""
    default_auto_field = "django.db.models.BigAutoField"
    name = "axos_erp"
    verbose_name = "AXOS ERP V10.4 통합"
