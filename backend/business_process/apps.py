from django.apps import AppConfig


class BusinessProcessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'business_process'
    verbose_name = '비즈니스 프로세스'
    verbose_name_plural = '비즈니스 프로세스 관리'
