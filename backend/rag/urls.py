# -*- coding: utf-8 -*-
"""
RAG URL Configuration
Retrieval Augmented Generation API 엔드포인트
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentViewSet,
    DocumentChunkViewSet,
    RetrievalViewSet,
    VectorStoreViewSet
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='rag-document')
router.register(r'chunks', DocumentChunkViewSet, basename='rag-chunk')
router.register(r'retrieval', RetrievalViewSet, basename='rag-retrieval')
router.register(r'vector-store', VectorStoreViewSet, basename='rag-vector-store')

app_name = 'rag'

urlpatterns = [
    path('', include(router.urls)),
]
