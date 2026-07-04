# -*- coding: utf-8 -*-
"""
RAG App Configuration
Retrieval Augmented Generation 앱 설정
"""
from django.apps import AppConfig


class RagConfig(AppConfig):
    """RAG 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rag'
    verbose_name = 'RAG System'

    def ready(self):
        """앱 초기화 시점에 호출"""
        # 시그널 등록 등 초기화 작업
        try:
            import rag.signals
        except ImportError:
            pass
