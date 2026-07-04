# -*- coding: utf-8 -*-
"""
Vector Store Abstraction Layer
벡터 데이터베이스에 대한 추상화 계층

지원 백엔드:
- JSON: 기존 JSONField 사용 (개발/테스트용)
- pgvector: PostgreSQL pgvector 확장 (프로덕션용)
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from abc import ABC, abstractmethod
import numpy as np

from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)


class VectorStoreBackend(ABC):
    """벡터 스토어 백엔드 추상 클래스"""

    def __init__(self, embedding_dimension: int = 1536):
        """
        벡터 스토어 초기화

        Args:
            embedding_dimension: 임베딩 차원 수 (default: 1536 for OpenAI text-embedding-3-large)
        """
        self.embedding_dimension = embedding_dimension

    @abstractmethod
    def store(
        self,
        chunk_id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """벡터 저장"""
        pass

    @abstractmethod
    def store_batch(
        self,
        vectors: List[Tuple[str, List[float], Optional[Dict[str, Any]]]]
    ) -> int:
        """벡터 일괄 저장"""
        pass

    @abstractmethod
    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """유사 벡터 검색"""
        pass

    @abstractmethod
    def delete(self, chunk_id: str) -> bool:
        """벡터 삭제"""
        pass

    @abstractmethod
    def delete_batch(self, chunk_ids: List[str]) -> int:
        """벡터 일괄 삭제"""
        pass

    def normalize_vector(self, vector: List[float]) -> List[float]:
        """벡터 정규화 (코사인 유사도용)"""
        arr = np.array(vector)
        norm = np.linalg.norm(arr)
        if norm == 0:
            return vector
        return (arr / norm).tolist()

    def cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float]
    ) -> float:
        """코사인 유사도 계산"""
        norm1 = self.normalize_vector(vec1)
        norm2 = self.normalize_vector(vec2)
        return float(np.dot(norm1, norm2))


class JSONVectorStore(VectorStoreBackend):
    """
    JSON 기반 벡터 스토어

    Django의 JSONField를 사용하여 벡터를 저장합니다.
    개발/테스트 환경용으로, 성능은 좋지 않습니다.
    """

    def __init__(self, embedding_dimension: int = 1536):
        super().__init__(embedding_dimension)
        from ai.models import DocumentChunk
        self.DocumentChunk = DocumentChunk

    def store(
        self,
        chunk_id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """벡터 저장"""
        try:
            chunk = self.DocumentChunk.objects.get(chunk_id=chunk_id)
            chunk.embedding = embedding
            if metadata:
                chunk.metadata.update(metadata)
            chunk.save(update_fields=['embedding', 'metadata'])
            return True
        except self.DocumentChunk.DoesNotExist:
            logger.error(f"청크를 찾을 수 없습니다: {chunk_id}")
            return False
        except Exception as e:
            logger.error(f"벡터 저장 오류: {e}")
            return False

    def store_batch(
        self,
        vectors: List[Tuple[str, List[float], Optional[Dict[str, Any]]]]
    ) -> int:
        """벡터 일괄 저장"""
        stored = 0
        for chunk_id, embedding, metadata in vectors:
            if self.store(chunk_id, embedding, metadata):
                stored += 1
        return stored

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """유사 벡터 검색 (전체 스캔 - 느림)"""
        results = []

        try:
            # 전체 청크 조회
            chunks = self.DocumentChunk.objects.filter(
                embedding__isnull=False
            ).select_related('document')

            # 필터 적용
            if filters:
                for key, value in filters.items():
                    if hasattr(self.DocumentChunk, key):
                        chunks = chunks.filter(**{key: value})
                    else:
                        chunks = chunks.filter(metadata__contains={key: value})

            # 유사도 계산
            for chunk in chunks[:1000]:  # 최대 1000개로 제한
                if chunk.embedding:
                    similarity = self.cosine_similarity(query_vector, chunk.embedding)
                    results.append({
                        'chunk_id': str(chunk.chunk_id),
                        'document_id': str(chunk.document.doc_id),
                        'text': chunk.text,
                        'similarity': similarity,
                        'metadata': chunk.metadata,
                    })

            # 유사도순 정렬
            results.sort(key=lambda x: x['similarity'], reverse=True)

            return results[:top_k]

        except Exception as e:
            logger.error(f"벡터 검색 오류: {e}")
            return []

    def delete(self, chunk_id: str) -> bool:
        """벡터 삭제"""
        try:
            chunk = self.DocumentChunk.objects.get(chunk_id=chunk_id)
            chunk.embedding = None
            chunk.save(update_fields=['embedding'])
            return True
        except self.DocumentChunk.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"벡터 삭제 오류: {e}")
            return False

    def delete_batch(self, chunk_ids: List[str]) -> int:
        """벡터 일괄 삭제"""
        deleted = 0
        for chunk_id in chunk_ids:
            if self.delete(chunk_id):
                deleted += 1
        return deleted


class PgVectorStore(VectorStoreBackend):
    """
    pgvector 기반 벡터 스토어

    PostgreSQL의 pgvector 확장을 사용하여 효율적인 벡터 검색을 제공합니다.
    """

    def __init__(self, embedding_dimension: int = 1536):
        super().__init__(embedding_dimension)
        self._ensure_extension()

    def _ensure_extension(self):
        """pgvector 확장 활성화"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                logger.info("pgvector 확장 활성화 완료")
        except Exception as e:
            logger.error(f"pgvector 확장 활성화 실패: {e}")
            raise

    def store(
        self,
        chunk_id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """벡터 저장"""
        try:
            with connection.cursor() as cursor:
                # 임베딩을 vector 타입으로 변환
                vector_str = f"[{','.join(map(str, embedding))}]"

                cursor.execute("""
                    UPDATE ai_documentchunk
                    SET embedding = %s::vector
                    WHERE chunk_id = %s
                """, [vector_str, chunk_id])

                return cursor.rowcount > 0

        except Exception as e:
            logger.error(f"pgvector 저장 오류: {e}")
            return False

    def store_batch(
        self,
        vectors: List[Tuple[str, List[float], Optional[Dict[str, Any]]]]
    ) -> int:
        """벡터 일괄 저장"""
        stored = 0
        for chunk_id, embedding, _ in vectors:
            if self.store(chunk_id, embedding):
                stored += 1
        return stored

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """유사 벡터 검색 (pgvector <-> 연산자 사용)"""
        results = []

        try:
            with connection.cursor() as cursor:
                # 쿼리 벡터를 vector 타입으로 변환
                vector_str = f"[{','.join(map(str, query_vector))}]"

                # 기본 쿼리
                query = """
                    SELECT
                        dc.chunk_id,
                        dc.doc_id,
                        dc.text,
                        dc.metadata,
                        1 - (dc.embedding <=> %s::vector) as similarity
                    FROM ai_documentchunk dc
                    WHERE dc.embedding IS NOT NULL
                    ORDER BY dc.embedding <=> %s::vector
                    LIMIT %s
                """

                cursor.execute(query, [vector_str, vector_str, top_k])

                for row in cursor.fetchall():
                    results.append({
                        'chunk_id': str(row[0]),
                        'document_id': str(row[1]),
                        'text': row[2],
                        'similarity': float(row[4]),
                        'metadata': row[3],
                    })

            return results

        except Exception as e:
            logger.error(f"pgvector 검색 오류: {e}")
            # fallback to JSON store
            logger.warning("JSON 스토어로 fallback합니다")
            return JSONVectorStore(self.embedding_dimension).search(
                query_vector, top_k, filters
            )

    def delete(self, chunk_id: str) -> bool:
        """벡터 삭제"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE ai_documentchunk
                    SET embedding = NULL
                    WHERE chunk_id = %s
                """, [chunk_id])
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"벡터 삭제 오류: {e}")
            return False

    def delete_batch(self, chunk_ids: List[str]) -> int:
        """벡터 일괄 삭제"""
        try:
            with connection.cursor() as cursor:
                placeholders = ','.join(['%s'] * len(chunk_ids))
                cursor.execute(f"""
                    UPDATE ai_documentchunk
                    SET embedding = NULL
                    WHERE chunk_id IN ({placeholders})
                """, chunk_ids)
                return cursor.rowcount
        except Exception as e:
            logger.error(f"벡터 일괄 삭제 오류: {e}")
            return 0


def get_vector_store(
    backend: Optional[str] = None,
    embedding_dimension: int = 1536
) -> VectorStoreBackend:
    """
    벡터 스토어 인스턴스 가져오기

    Args:
        backend: 백엔드 타입 (None이면 settings에서 가져옴)
        embedding_dimension: 임베딩 차원 수

    Returns:
        VectorStoreBackend: 벡터 스토어 인스턴스
    """
    if backend is None:
        backend = getattr(settings, 'RAG_CONFIG', {}).get('VECTOR_DB_BACKEND', 'json')

    if backend == 'pgvector':
        return PgVectorStore(embedding_dimension)
    else:
        logger.warning(f"알 수 없는 벡터 스토어 백엔드: {backend}, JSON으로 fallback합니다")
        return JSONVectorStore(embedding_dimension)


# ============================================================================
# 임베딩 생성기 (Phase 1: Mock, Phase 2: OpenAI API)
# ============================================================================

class EmbeddingGenerator:
    """
    텍스트 임베딩 생성기

    Phase 1: 간단한 해시 기반 임베딩 (개발용)
    Phase 2: OpenAI Embedding API 연동
    """

    def __init__(self, dimension: int = 1536):
        self.dimension = dimension

    def generate(self, text: str) -> List[float]:
        """
        텍스트에서 임베딩 벡터 생성

        Args:
            text: 입력 텍스트

        Returns:
            List[float]: 임베딩 벡터
        """
        # Phase 1: 간단한 해시 기반 임베딩 (개발용)
        import hashlib

        # 텍스트를 여러 부분으로 나누어 해시
        hash_obj = hashlib.sha256(text.encode('utf-8'))
        hash_bytes = hash_obj.digest()

        # 해시를 벡터로 변환
        vector = []
        for i in range(self.dimension):
            # 바이너리 해시를 부동소수점으로 변환
            byte_idx = i % len(hash_bytes)
            float_val = hash_bytes[byte_idx] / 255.0
            vector.append(float_val)

        return vector

    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """일괄 임베딩 생성"""
        return [self.generate(text) for text in texts]


def get_embedding_generator(dimension: int = 1536) -> EmbeddingGenerator:
    """임베딩 생성기 인스턴스 가져오기"""
    return EmbeddingGenerator(dimension)
