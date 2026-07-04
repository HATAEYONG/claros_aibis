# -*- coding: utf-8 -*-
"""
Vector Store Service
벡터 임베딩 및 유사도 검색 서비스
"""
import uuid
import time
import numpy as np
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db import transaction

from ..models import DocumentChunk, Embedding


class VectorStoreService:
    """
    벡터 저장소 서비스
    임베딩 생성 및 유사도 검색
    """

    # 임베딩 모델 설정
    DEFAULT_MODEL = 'text-embedding-ada-002'
    DEFAULT_DIMENSION = 1536

    @staticmethod
    def create_embedding(
        chunk_id: uuid.UUID,
        model_name: str = None,
        embedding_method: str = 'openai'
    ) -> Dict[str, Any]:
        """
        청크에 대한 임베딩 생성

        Args:
            chunk_id: 청크 ID
            model_name: 임베딩 모델명
            embedding_method: 임베딩 방법

        Returns:
            임베딩 생성 결과
        """
        model_name = model_name or VectorStoreService.DEFAULT_MODEL

        try:
            with transaction.atomic():
                chunk = DocumentChunk.objects.get(id=chunk_id)
                chunk.embedding_status = 'processing'
                chunk.save()

                # 임베딩 생성
                start_time = time.time()

                if embedding_method == 'openai':
                    vector = VectorStoreService._create_openai_embedding(chunk.content)
                    dimension = VectorStoreService.DEFAULT_DIMENSION
                else:
                    # 다른 임베딩 방법 (필요시 구현)
                    vector = VectorStoreService._create_mock_embedding(chunk.content)
                    dimension = len(vector)

                computation_time = int((time.time() - start_time) * 1000)

                # 임베딩 저장
                embedding = Embedding.objects.create(
                    chunk=chunk,
                    vector=vector,
                    model_name=model_name,
                    dimension=dimension,
                    embedding_method=embedding_method,
                    computation_time_ms=computation_time,
                )

                chunk.embedding_status = 'completed'
                chunk.embedded_at = timezone.now()
                chunk.save()

                return {
                    'success': True,
                    'embedding_id': str(embedding.id),
                    'dimension': dimension,
                    'computation_time_ms': computation_time,
                }

        except DocumentChunk.DoesNotExist:
            return {
                'success': False,
                'error': f'Chunk not found: {chunk_id}',
            }
        except Exception as e:
            chunk.embedding_status = 'failed'
            chunk.save()

            return {
                'success': False,
                'error': str(e),
            }

    @staticmethod
    def _create_openai_embedding(text: str) -> List[float]:
        """
        OpenAI API를 통한 임베딩 생성

        Args:
            text: 임베딩할 텍스트

        Returns:
            임베딩 벡터
        """
        try:
            import openai

            # OpenAI 클라이언트 설정 (실제 구현시 API key 필요)
            response = openai.Embedding.create(
                model=VectorStoreService.DEFAULT_MODEL,
                input=text
            )

            return response['data'][0]['embedding']

        except ImportError:
            # OpenAI 패키지가 없는 경우 mock 반환
            return VectorStoreService._create_mock_embedding(text)
        except Exception:
            # API 호출 실패시 mock 반환
            return VectorStoreService._create_mock_embedding(text)

    @staticmethod
    def _create_mock_embedding(text: str) -> List[float]:
        """
        Mock 임베딩 생성 (테스트용)

        Args:
            text: 임베딩할 텍스트

        Returns:
            임베딩 벡터
        """
        # 텍스트 해시 기반 간단한 벡터 생성
        import hashlib

        hash_obj = hashlib.sha256(text.encode())
        hash_bytes = hash_obj.digest()

        # 1536 차원 벡터 생성 (실제로는 더 정교한 방법 필요)
        vector = []
        for i in range(VectorStoreService.DEFAULT_DIMENSION):
            byte_idx = i % len(hash_bytes)
            value = (hash_bytes[byte_idx] + i) / 255.0
            vector.append(value)

        return vector

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        코사인 유사도 계산

        Args:
            vec1: 벡터 1
            vec2: 벡터 2

        Returns:
            코사인 유사도 (-1 ~ 1)
        """
        try:
            import numpy as np

            arr1 = np.array(vec1)
            arr2 = np.array(vec2)

            dot_product = np.dot(arr1, arr2)
            norm1 = np.linalg.norm(arr1)
            norm2 = np.linalg.norm(arr2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))

        except ImportError:
            # NumPy가 없는 경우 직접 계산
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm1 = sum(a * a for a in vec1) ** 0.5
            norm2 = sum(b * b for b in vec2) ** 0.5

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return dot_product / (norm1 * norm2)

    @staticmethod
    def search_similar(
        query_vector: List[float],
        top_k: int = 5,
        category: Optional[str] = None,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        유사한 벡터 검색

        Args:
            query_vector: 쿼리 벡터
            top_k: 반환할 결과 수
            category: 필터링할 카테고리
            threshold: 유사도 임계값

        Returns:
            유사한 청크 목록
        """
        # 모든 임베딩 조회
        embeddings = Embedding.objects.select_related(
            'chunk__document'
        ).filter(
            chunk__embedding_status='completed'
        )

        # 카테고리 필터링
        if category:
            embeddings = embeddings.filter(chunk__document__category=category)

        # 유사도 계산
        results = []
        for emb in embeddings:
            similarity = VectorStoreService.cosine_similarity(query_vector, emb.vector)

            if similarity >= threshold:
                results.append({
                    'chunk_id': str(emb.chunk.id),
                    'document_id': str(emb.chunk.document.id),
                    'document_title': emb.chunk.document.title,
                    'content': emb.chunk.content,
                    'similarity': similarity,
                    'chunk_index': emb.chunk.chunk_index,
                })

        # 유사도순 정렬 및 top_k 반환
        results.sort(key=lambda x: x['similarity'], reverse=True)

        return results[:top_k]

    @staticmethod
    def batch_create_embeddings(
        chunk_ids: List[uuid.UUID],
        model_name: str = None,
        embedding_method: str = 'openai'
    ) -> Dict[str, Any]:
        """
        일괄 임베딩 생성

        Args:
            chunk_ids: 청크 ID 목록
            model_name: 임베딩 모델명
            embedding_method: 임베딩 방법

        Returns:
            일괄 처리 결과
        """
        results = {
            'success': [],
            'failed': [],
            'total': len(chunk_ids),
        }

        for chunk_id in chunk_ids:
            result = VectorStoreService.create_embedding(
                chunk_id,
                model_name,
                embedding_method
            )

            if result.get('success'):
                results['success'].append(str(chunk_id))
            else:
                results['failed'].append({
                    'chunk_id': str(chunk_id),
                    'error': result.get('error'),
                })

        return results

    @staticmethod
    def get_embedding_stats() -> Dict[str, Any]:
        """
        임베딩 통계 조회

        Returns:
            임베딩 통계
        """
        total_chunks = DocumentChunk.objects.count()
        embedded_chunks = DocumentChunk.objects.filter(
            embedding_status='completed'
        ).count()
        pending_chunks = DocumentChunk.objects.filter(
            embedding_status='pending'
        ).count()

        embeddings = Embedding.objects.select_related('chunk__document').all()

        # 모델별 통계
        model_stats = {}
        for emb in embeddings:
            model = emb.model_name
            if model not in model_stats:
                model_stats[model] = {
                    'count': 0,
                    'dimension': emb.dimension,
                }
            model_stats[model]['count'] += 1

        return {
            'total_chunks': total_chunks,
            'embedded_chunks': embedded_chunks,
            'pending_chunks': pending_chunks,
            'completion_rate': round(embedded_chunks / max(total_chunks, 1) * 100, 2),
            'model_stats': model_stats,
        }
