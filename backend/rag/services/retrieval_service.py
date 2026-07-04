# -*- coding: utf-8 -*-
"""
Retrieval Service
RAG 검색 및 생성 서비스
"""
import time
import uuid
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db.models import Q

from ..models import RetrievalLog
from .vector_store import VectorStoreService


class RetrievalService:
    """
    검색 서비스
    RAG 시스템의 검색 및 응답 생성
    """

    @staticmethod
    def retrieve(
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        threshold: float = 0.7,
        log_retrieval: bool = True
    ) -> Dict[str, Any]:
        """
        관련 문서 검색

        Args:
            query: 검색 쿼리
            top_k: 반환할 결과 수
            category: 필터링할 카테고리
            threshold: 유사도 임계값
            log_retrieval: 로그 기록 여부

        Returns:
            검색 결과
        """
        start_time = time.time()

        # 쿼리 임베딩 생성
        query_vector = VectorStoreService._create_mock_embedding(query)

        # 유사도 검색
        results = VectorStoreService.search_similar(
            query_vector=query_vector,
            top_k=top_k,
            category=category,
            threshold=threshold
        )

        search_time = int((time.time() - start_time) * 1000)

        # 평균 유사도 계산
        avg_similarity = 0.0
        if results:
            avg_similarity = sum(r['similarity'] for r in results) / len(results)

        response = {
            'query': query,
            'results': results,
            'result_count': len(results),
            'search_time_ms': search_time,
            'avg_similarity': round(avg_similarity, 4),
        }

        # 로그 기록
        if log_retrieval:
            RetrievalService._log_retrieval(
                query=query,
                query_vector=query_vector,
                top_k=top_k,
                category=category,
                threshold=threshold,
                results=response,
            )

        return response

    @staticmethod
    def retrieve_with_rerank(
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        threshold: float = 0.7,
        reranker: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        검색 및 재정렬 (Reranking)

        Args:
            query: 검색 쿼리
            top_k: 반환할 결과 수
            category: 필터링할 카테고리
            threshold: 유사도 임계값
            reranker: 재정렬 방법 (similarity, keyword, hybrid)

        Returns:
            검색 결과
        """
        # 기본 검색
        response = RetrievalService.retrieve(
            query=query,
            top_k=top_k * 2,  # 더 많은 결과 검색
            category=category,
            threshold=threshold,
            log_retrieval=False
        )

        results = response['results']

        # 재정렬
        if reranker == 'keyword':
            results = RetrievalService._rerank_by_keyword(query, results)
        elif reranker == 'hybrid':
            results = RetrievalService._rerank_hybrid(query, results)
        else:
            # 기본 유사도 재정렬 (이미 되어 있음)
            pass

        # top_k로 제한
        results = results[:top_k]

        # 평균 유사도 재계산
        avg_similarity = 0.0
        if results:
            avg_similarity = sum(r['similarity'] for r in results) / len(results)

        response['results'] = results
        response['result_count'] = len(results)
        response['avg_similarity'] = round(avg_similarity, 4)
        response['reranker'] = reranker or 'similarity'

        # 로그 기록
        RetrievalService._log_retrieval(
            query=query,
            query_vector=VectorStoreService._create_mock_embedding(query),
            top_k=top_k,
            category=category,
            threshold=threshold,
            results=response,
        )

        return response

    @staticmethod
    def _rerank_by_keyword(query: str, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        키워드 기반 재정렬

        Args:
            query: 검색 쿼리
            results: 검색 결과

        Returns:
            재정렬된 결과
        """
        query_words = set(query.lower().split())

        for result in results:
            content = result['content'].lower()
            keyword_score = sum(1 for word in query_words if word in content)
            result['rerank_score'] = keyword_score

        return sorted(results, key=lambda x: x['rerank_score'], reverse=True)

    @staticmethod
    def _rerank_hybrid(query: str, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        하이브리드 재정렬 (유사도 + 키워드)

        Args:
            query: 검색 쿼리
            results: 검색 결과

        Returns:
            재정렬된 결과
        """
        query_words = set(query.lower().split())

        for result in results:
            similarity_score = result['similarity']

            content = result['content'].lower()
            keyword_score = sum(1 for word in query_words if word in content)
            keyword_score = keyword_score / max(len(query_words), 1)

            # 가중 평균 (70% 유사도, 30% 키워드)
            result['rerank_score'] = similarity_score * 0.7 + keyword_score * 0.3

        return sorted(results, key=lambda x: x['rerank_score'], reverse=True)

    @staticmethod
    def generate_context(
        query: str,
        max_tokens: int = 2000,
        **retrieval_kwargs
    ) -> Dict[str, Any]:
        """
        RAG 컨텍스트 생성

        Args:
            query: 검색 쿼리
            max_tokens: 최대 토큰 수
            **retrieval_kwargs: 검색 파라미터

        Returns:
            생성된 컨텍스트
        """
        # 문서 검색
        response = RetrievalService.retrieve(query, **retrieval_kwargs)
        results = response['results']

        # 컨텍스트 구성
        context_parts = []
        total_tokens = 0

        for result in results:
            content = result['content']
            estimated_tokens = len(content.split())

            if total_tokens + estimated_tokens > max_tokens:
                # 토큰 제한에 맞게 자르기
                remaining = max_tokens - total_tokens
                words = content.split()[:remaining]
                content = ' '.join(words)

            context_parts.append(f"[{result['document_title']}] {content}")
            total_tokens += estimated_tokens

            if total_tokens >= max_tokens:
                break

        context = '\n\n'.join(context_parts)

        return {
            'query': query,
            'context': context,
            'sources': [
                {
                    'document_id': r['document_id'],
                    'title': r['document_title'],
                    'chunk_index': r['chunk_index'],
                    'similarity': r['similarity'],
                }
                for r in results
            ],
            'token_count': total_tokens,
            'source_count': len(results),
        }

    @staticmethod
    def _log_retrieval(
        query: str,
        query_vector: List[float],
        top_k: int,
        category: Optional[str],
        threshold: float,
        results: Dict[str, Any]
    ) -> None:
        """
        검색 로그 기록

        Args:
            query: 검색 쿼리
            query_vector: 쿼리 벡터
            top_k: 반환할 결과 수
            category: 필터링할 카테고리
            threshold: 유사도 임계값
            results: 검색 결과
        """
        RetrievalLog.objects.create(
            query=query,
            query_embedding=query_vector,
            top_k=top_k,
            filter_category=category or '',
            similarity_threshold=threshold,
            results=results.get('results', [])[:10],  # 상위 10개만 저장
            result_count=results.get('result_count', 0),
            search_time_ms=results.get('search_time_ms'),
            avg_similarity=results.get('avg_similarity'),
        )

    @staticmethod
    def get_retrieval_history(
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        검색 이력 조회

        Args:
            limit: 반환할 결과 수

        Returns:
            검색 이력
        """
        logs = RetrievalLog.objects.order_by('-created_at')[:limit]

        return [
            {
                'id': str(log.id),
                'query': log.query,
                'result_count': log.result_count,
                'avg_similarity': log.avg_similarity,
                'search_time_ms': log.search_time_ms,
                'created_at': log.created_at.isoformat(),
            }
            for log in logs
        ]

    @staticmethod
    def feedback(
        log_id: uuid.UUID,
        feedback: str
    ) -> Dict[str, Any]:
        """
        검색 결과 피드백 기록

        Args:
            log_id: 로그 ID
            feedback: 피드백 (relevant, partial, irrelevant)

        Returns:
            피드백 기록 결과
        """
        try:
            log = RetrievalLog.objects.get(id=log_id)
            log.user_feedback = feedback
            log.save()

            return {
                'success': True,
                'log_id': str(log_id),
                'feedback': feedback,
            }

        except RetrievalLog.DoesNotExist:
            return {
                'success': False,
                'error': f'Log not found: {log_id}',
            }
