# -*- coding: utf-8 -*-
"""
RAG API Views
Retrieval Augmented Generation API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Document, DocumentChunk, RetrievalLog
from .serializers import (
    DocumentSerializer,
    DocumentChunkSerializer,
    RetrievalLogSerializer
)
from .services import (
    DocumentProcessor,
    VectorStoreService,
    RetrievalService
)


class DocumentViewSet(viewsets.ModelViewSet):
    """문서 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = Document.objects.all()

    def get_queryset(self):
        return Document.objects.all().order_by('-uploaded_at')

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """문서 처리 및 청킹"""
        document = self.get_object()

        content = request.data.get('content', '')
        chunk_type = request.data.get('chunk_type', 'semantic')
        chunk_size = request.data.get('chunk_size', 1000)
        chunk_overlap = request.data.get('chunk_overlap', 200)

        if not content:
            return Response({
                'error': 'Content is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = DocumentProcessor.process_document(
            document_id=document.id,
            content=content,
            chunk_type=chunk_type,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def rechunk(self, request, pk=None):
        """문서 재청킹"""
        document = self.get_object()

        new_chunk_type = request.data.get('chunk_type', 'semantic')
        new_chunk_size = request.data.get('chunk_size', 1000)
        new_chunk_overlap = request.data.get('chunk_overlap', 200)

        result = DocumentProcessor.rechunk_document(
            document_id=document.id,
            new_chunk_type=new_chunk_type,
            new_chunk_size=new_chunk_size,
            new_chunk_overlap=new_chunk_overlap
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def create_embeddings(self, request, pk=None):
        """청크 임베딩 생성"""
        document = self.get_object()

        chunks = DocumentChunk.objects.filter(
            document=document,
            embedding_status='pending'
        )

        chunk_ids = [chunk.id for chunk in chunks]

        result = VectorStoreService.batch_create_embeddings(
            chunk_ids=chunk_ids,
            model_name=request.data.get('model_name', 'text-embedding-ada-002'),
            embedding_method=request.data.get('embedding_method', 'openai')
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """문서 통계"""
        total_docs = Document.objects.count()
        indexed_docs = Document.objects.filter(status='indexed').count()
        pending_docs = Document.objects.filter(status='pending').count()

        return Response({
            'total_documents': total_docs,
            'indexed_documents': indexed_docs,
            'pending_documents': pending_docs,
            'completion_rate': round(indexed_docs / max(total_docs, 1) * 100, 2),
        })


# ViewSet에 직렬화기 설정
DocumentViewSet.serializer_class = DocumentSerializer


class DocumentChunkViewSet(viewsets.ReadOnlyModelViewSet):
    """문서 청크 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = DocumentChunk.objects.all()

    def get_queryset(self):
        return DocumentChunk.objects.all().order_by('document', 'chunk_index')

    @action(detail=True, methods=['post'])
    def create_embedding(self, request, pk=None):
        """단일 청크 임베딩 생성"""
        chunk = self.get_object()

        result = VectorStoreService.create_embedding(
            chunk_id=chunk.id,
            model_name=request.data.get('model_name'),
            embedding_method=request.data.get('embedding_method', 'openai')
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def batch_create_embeddings(self, request):
        """일괄 임베딩 생성"""
        chunk_ids = request.data.get('chunk_ids', [])

        result = VectorStoreService.batch_create_embeddings(
            chunk_ids=chunk_ids,
            model_name=request.data.get('model_name'),
            embedding_method=request.data.get('embedding_method', 'openai')
        )

        return Response(result)


# ViewSet에 직렬화기 설정
DocumentChunkViewSet.serializer_class = DocumentChunkSerializer


class RetrievalViewSet(viewsets.ViewSet):
    """검색 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def search(self, request):
        """문서 검색"""
        query = request.data.get('query', '')
        top_k = request.data.get('top_k', 5)
        category = request.data.get('category')
        threshold = request.data.get('threshold', 0.7)

        result = RetrievalService.retrieve(
            query=query,
            top_k=top_k,
            category=category,
            threshold=threshold
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def search_with_rerank(self, request):
        """검색 및 재정렬"""
        query = request.data.get('query', '')
        top_k = request.data.get('top_k', 5)
        category = request.data.get('category')
        threshold = request.data.get('threshold', 0.7)
        reranker = request.data.get('reranker', 'hybrid')

        result = RetrievalService.retrieve_with_rerank(
            query=query,
            top_k=top_k,
            category=category,
            threshold=threshold,
            reranker=reranker
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def generate_context(self, request):
        """RAG 컨텍스트 생성"""
        query = request.data.get('query', '')
        max_tokens = request.data.get('max_tokens', 2000)
        top_k = request.data.get('top_k', 5)
        category = request.data.get('category')
        threshold = request.data.get('threshold', 0.7)

        result = RetrievalService.generate_context(
            query=query,
            max_tokens=max_tokens,
            top_k=top_k,
            category=category,
            threshold=threshold
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """검색 이력 조회"""
        limit = int(request.query_params.get('limit', 50))

        results = RetrievalService.get_retrieval_history(limit=limit)

        return Response({
            'logs': results
        })

    @action(detail=False, methods=['post'])
    def feedback(self, request):
        """검색 결과 피드백"""
        log_id = request.data.get('log_id')
        feedback = request.data.get('feedback')

        if not log_id or not feedback:
            return Response({
                'error': 'log_id and feedback are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = RetrievalService.feedback(
            log_id=log_id,
            feedback=feedback
        )

        return Response(result)


class VectorStoreViewSet(viewsets.ViewSet):
    """벡터 저장소 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """임베딩 통계"""
        stats = VectorStoreService.get_embedding_stats()

        return Response(stats)

    @action(detail=False, methods=['post'])
    def search(self, request):
        """벡터 유사도 검색"""
        query = request.data.get('query', '')
        top_k = request.data.get('top_k', 5)
        category = request.data.get('category')
        threshold = request.data.get('threshold', 0.7)

        # 쿼리 임베딩 생성
        query_vector = VectorStoreService._create_mock_embedding(query)

        # 유사도 검색
        results = VectorStoreService.search_similar(
            query_vector=query_vector,
            top_k=top_k,
            category=category,
            threshold=threshold
        )

        return Response({
            'query': query,
            'results': results,
            'result_count': len(results),
        })
