# -*- coding: utf-8 -*-
"""
RAG API 뷰
문서 청킹 및 하이브리드 검색 API 엔드포인트
"""
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.utils import timezone
import logging

from ai.models import Document, DocumentChunk
from ai.services import (
    document_chunker,
    batch_chunker,
    hybrid_search_engine,
    rag_generator,
)

logger = logging.getLogger(__name__)


class DocumentUploadView(APIView):
    """문서 업로드 뷰"""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """
        문서 업로드

        Request:
            file: 파일
            title: 제목
            content_type: 콘텐츠 유형
            source_type: 출처 유형 (선택)
            metadata: 메타데이터 (선택)
        """
        file_obj = request.FILES.get('file')
        title = request.data.get('title')
        content_type = request.data.get('content_type', 'document')
        source_type = request.data.get('source_type', 'upload')
        metadata = request.data.get('metadata', {})

        if not file_obj:
            return Response(
                {'error': 'file 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not title:
            title = file_obj.name

        try:
            # 파일 저장
            file_path = default_storage.save(f'documents/{file_obj.name}', file_obj)
            file_url = default_storage.url(file_path)

            # 문서 생성
            document = Document.objects.create(
                title=title,
                content_type=content_type,
                source_uri=file_path,
                source_type=source_type,
                metadata={
                    **metadata,
                    'file_name': file_obj.name,
                    'file_size': file_obj.size,
                    'file_url': file_url,
                    'uploaded_at': timezone.now().isoformat(),
                }
            )

            return Response({
                'status': 'success',
                'message': '문서 업로드 완료',
                'data': {
                    'document_id': str(document.doc_id),
                    'title': document.title,
                    'content_type': document.content_type,
                    'source_uri': document.source_uri,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f'문서 업로드 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentChunkView(APIView):
    """문서 청킹 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        문서 청킹 실행

        Request Body:
            {
                "document_id": "문서 ID",
                "strategy": "청킹 전략",
                "chunk_size": 청크 크기,
                "chunk_overlap": 중복 크기,
                "separators": 분리자 목록 (선택)
            }
        """
        document_id = request.data.get('document_id')
        strategy = request.data.get('strategy', 'recursive')
        chunk_size = int(request.data.get('chunk_size', 1000))
        chunk_overlap = int(request.data.get('chunk_overlap', 200))
        separators = request.data.get('separators')

        if not document_id:
            return Response(
                {'error': 'document_id 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 문서 조회
            document = Document.objects.get(doc_id=document_id)

            # 청킹 실행
            chunks = document_chunker.chunk_document(
                document=document,
                strategy=strategy,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=separators,
            )

            return Response({
                'status': 'success',
                'message': f'문서 청킹 완료 ({len(chunks)}개 청크 생성)',
                'data': {
                    'document_id': str(document.doc_id),
                    'title': document.title,
                    'chunk_count': len(chunks),
                    'strategy': strategy,
                    'chunks': [
                        {
                            'chunk_id': str(chunk.chunk_id),
                            'chunk_index': chunk.chunk_index,
                            'text_length': len(chunk.text),
                            'metadata': chunk.metadata,
                        }
                        for chunk in chunks
                    ]
                }
            })

        except Document.DoesNotExist:
            return Response(
                {'error': f'문서를 찾을 수 없습니다: {document_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f'문서 청킹 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchDocumentChunkView(APIView):
    """배치 문서 청킹 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        배치 문서 청킹 실행

        Request Body:
            {
                "document_ids": ["문서 ID1", "문서 ID2", ...],
                "strategy": "청킹 전략",
                "chunk_size": 청크 크기,
                "chunk_overlap": 중복 크기
            }
        """
        document_ids = request.data.get('document_ids', [])
        strategy = request.data.get('strategy', 'recursive')
        chunk_size = int(request.data.get('chunk_size', 1000))
        chunk_overlap = int(request.data.get('chunk_overlap', 200))

        if not document_ids:
            return Response(
                {'error': 'document_ids 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 문서 목록 조회
            documents = Document.objects.filter(doc_id__in=document_ids)

            # 배치 청킹
            results = batch_chunker.chunk_documents(
                documents=list(documents),
                strategy=strategy,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )

            return Response({
                'status': 'success',
                'message': f'배치 청킹 완료 ({results["total_chunks"]}개 청크 생성)',
                'data': results
            })

        except Exception as e:
            logger.exception(f'배치 문서 청킹 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HybridSearchView(APIView):
    """하이브리드 검색 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        하이브리드 검색 실행

        Request Body:
            {
                "query": "검색 쿼리",
                "filters": {"content_type": "...", "source_type": "..."},
                "top_k": 반환할 결과 수,
                "min_score": 최소 점수,
                "search_type": "검색 유형 (hybrid, vector, keyword)"
            }
        """
        query = request.data.get('query', '')
        filters = request.data.get('filters', {})
        top_k = request.data.get('top_k', 5)
        min_score = request.data.get('min_score', 0.0)
        search_type = request.data.get('search_type', 'hybrid')

        if not query:
            return Response(
                {'error': 'query 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 검색 실행
            results = hybrid_search_engine.search(
                query=query,
                filters=filters if filters else None,
                top_k=top_k,
                min_score=min_score,
                search_type=search_type,
            )

            # 결과 포맷팅
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'chunk_id': result['chunk_id'],
                    'score': result.get('rerank_score', result.get('hybrid_score', result.get('score', 0))),
                    'vector_score': result.get('vector_score', 0),
                    'keyword_score': result.get('keyword_score', 0),
                    'chunk_data': result['chunk_data'],
                })

            return Response({
                'status': 'success',
                'query': query,
                'search_type': search_type,
                'result_count': len(formatted_results),
                'data': formatted_results
            })

        except Exception as e:
            logger.exception(f'하이브리드 검색 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGGenerateView(APIView):
    """RAG 생성 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        RAG 답변 생성

        Request Body:
            {
                "query": "질문",
                "filters": {"content_type": "..."},
                "top_k": 검색할 청크 수
            }
        """
        query = request.data.get('query', '')
        filters = request.data.get('filters', {})
        top_k = request.data.get('top_k', 5)

        if not query:
            return Response(
                {'error': 'query 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # RAG 생성 실행
            result = rag_generator.generate(
                query=query,
                filters=filters if filters else None,
                top_k=top_k,
            )

            return Response({
                'status': 'success',
                'data': result
            })

        except Exception as e:
            logger.exception(f'RAG 생성 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentListView(APIView):
    """문서 목록 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        문서 목록 조회

        Query Parameters:
            - content_type: 콘텐츠 유형 필터
            - source_type: 출처 유형 필터
            - is_processed: 처리 완료 여부 필터
            - limit: 반환 건수
        """
        try:
            content_type = request.query_params.get('content_type')
            source_type = request.query_params.get('source_type')
            is_processed = request.query_params.get('is_processed')
            limit = int(request.query_params.get('limit', 50))

            documents = Document.objects.all()

            # 필터링
            if content_type:
                documents = documents.filter(content_type=content_type)
            if source_type:
                documents = documents.filter(source_type=source_type)
            if is_processed is not None:
                documents = documents.filter(is_processed=is_processed.lower() == 'true')

            documents = documents.order_by('-created_at')[:limit]

            document_list = []
            for doc in documents:
                document_list.append({
                    'document_id': str(doc.doc_id),
                    'title': doc.title,
                    'content_type': doc.content_type,
                    'source_type': doc.source_type,
                    'source_uri': doc.source_uri,
                    'is_processed': doc.is_processed,
                    'chunk_count': doc.chunk_count(),
                    'created_at': doc.created_at.isoformat() if doc.created_at else None,
                    'metadata': doc.metadata,
                })

            return Response({
                'status': 'success',
                'count': len(document_list),
                'data': document_list
            })

        except Exception as e:
            logger.exception(f'문서 목록 조회 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChunkListView(APIView):
    """청크 목록 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        청크 목록 조회

        Query Parameters:
            - document_id: 문서 ID 필터
            - limit: 반환 건수
        """
        try:
            document_id = request.query_params.get('document_id')
            limit = int(request.query_params.get('limit', 100))

            chunks = DocumentChunk.objects.select_related('document').all()

            if document_id:
                chunks = chunks.filter(document__doc_id=document_id)

            chunks = chunks.order_by('document', 'chunk_index')[:limit]

            chunk_list = []
            for chunk in chunks:
                chunk_list.append({
                    'chunk_id': str(chunk.chunk_id),
                    'document_id': str(chunk.document.doc_id),
                    'document_title': chunk.document.title,
                    'chunk_index': chunk.chunk_index,
                    'text_length': len(chunk.text),
                    'text_preview': chunk.text[:200] + '...' if len(chunk.text) > 200 else chunk.text,
                    'has_embedding': chunk.embedding is not None,
                    'metadata': chunk.metadata,
                    'created_at': chunk.created_at.isoformat() if chunk.created_at else None,
                })

            return Response({
                'status': 'success',
                'count': len(chunk_list),
                'data': chunk_list
            })

        except Exception as e:
            logger.exception(f'청크 목록 조회 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
