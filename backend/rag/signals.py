# -*- coding: utf-8 -*-
"""
RAG Signals
문서 및 청크 이벤트 처리
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender='rag.Document')
def document_created_handler(sender, instance, created, **kwargs):
    """문서 생성 시그널 핸들러"""
    if created:
        # 문서 생성 시 초기 처리 로직
        pass


@receiver(post_save, sender='rag.DocumentChunk')
def chunk_created_handler(sender, instance, created, **kwargs):
    """청크 생성 시그널 핸들러"""
    if created:
        # 청크 생성 시 임베딩 대기 상태 설정
        pass


@receiver(post_delete, sender='rag.Document')
def document_deleted_handler(sender, instance, **kwargs):
    """문서 삭제 시그널 핸들러"""
    # 관련 청크 및 임베딩 정리
    pass
