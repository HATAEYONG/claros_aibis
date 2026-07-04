# -*- coding: utf-8 -*-
"""
RAG Serializers
RAG 모델 직렬화기
"""
from rest_framework import serializers
from .models import Document, DocumentChunk, Embedding, RetrievalLog


class DocumentSerializer(serializers.ModelSerializer):
    """문서 직렬화기"""

    class Meta:
        model = Document
        fields = [
            'id', 'doc_type', 'title', 'source_path',
            'author', 'created_at_source', 'file_size_bytes',
            'category', 'tags',
            'status', 'error_message',
            'total_chunks', 'indexed_chunks',
            'uploaded_at', 'processed_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uploaded_at', 'processed_at', 'updated_at']


class DocumentChunkSerializer(serializers.ModelSerializer):
    """문서 청크 직렬화기"""

    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = DocumentChunk
        fields = [
            'id', 'document', 'document_title',
            'content', 'chunk_index',
            'page_number', 'section_title',
            'char_count', 'token_count',
            'chunk_type',
            'overlap_with_prev', 'overlap_with_next',
            'embedding_status',
            'created_at', 'embedded_at',
        ]
        read_only_fields = ['id', 'created_at', 'embedded_at']


class EmbeddingSerializer(serializers.ModelSerializer):
    """임베딩 직렬화기"""

    chunk_content = serializers.CharField(source='chunk.content', read_only=True)

    class Meta:
        model = Embedding
        fields = [
            'id', 'chunk', 'chunk_content',
            'vector', 'model_name', 'model_version', 'dimension',
            'embedding_method', 'computation_time_ms',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RetrievalLogSerializer(serializers.ModelSerializer):
    """검색 로그 직렬화기"""

    class Meta:
        model = RetrievalLog
        fields = [
            'id', 'query', 'query_embedding',
            'top_k', 'similarity_threshold', 'filter_category',
            'results', 'result_count',
            'search_time_ms', 'avg_similarity',
            'user_feedback',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
