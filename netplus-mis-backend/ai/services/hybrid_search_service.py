# -*- coding: utf-8 -*-
"""
하이브리드 검색 서비스
벡터 유사도 검색과 키워드 검색을 결합한 RAG 검색
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import uuid

from django.conf import settings
from django.utils import timezone
from django.db.models import Q, F, Value, FloatField
from django.db.models.functions import Coalesce

from ai.models import Document, DocumentChunk

logger = logging.getLogger(__name__)


class HybridSearchEngine:
    """
    하이브리드 검색 엔진
    벡터 검색과 키워드 검색을 결합하여 최적의 결과 제공
    """

    def __init__(self):
        self.vector_weight = getattr(settings, 'RAG_VECTOR_WEIGHT', 0.7)
        self.keyword_weight = getattr(settings, 'RAG_KEYWORD_WEIGHT', 0.3)
        self.rerank_top_k = getattr(settings, 'RAG_RERANK_TOP_K', 20)
        self.top_k = getattr(settings, 'RAG_TOP_K', 5)

    def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        top_k: Optional[int] = None,
        min_score: float = 0.0,
        search_type: str = 'hybrid'
    ) -> List[Dict[str, Any]]:
        """
        하이브리드 검색 수행

        Args:
            query: 검색 쿼리
            filters: 필터 조건 (content_type, source_type 등)
            top_k: 반환할 결과 수
            min_score: 최소 점수
            search_type: 검색 유형 (hybrid, vector, keyword)

        Returns:
            검색 결과 목록
        """
        top_k = top_k or self.top_k

        if search_type == 'hybrid':
            results = self._hybrid_search(query, filters, top_k, min_score)
        elif search_type == 'vector':
            results = self._vector_search(query, filters, top_k, min_score)
        elif search_type == 'keyword':
            results = self._keyword_search(query, filters, top_k, min_score)
        else:
            raise ValueError(f'지원하지 않는 검색 유형: {search_type}')

        # 재순위 (Reranking)
        if search_type == 'hybrid' and results:
            results = self._rerank_results(query, results)

        return results[:top_k]

    def _hybrid_search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]],
        top_k: int,
        min_score: float
    ) -> List[Dict[str, Any]]:
        """
        하이브리드 검색 (벡터 + 키워드)

        Args:
            query: 검색 쿼리
            filters: 필터 조건
            top_k: 반환할 결과 수
            min_score: 최소 점수

        Returns:
            검색 결과 목록
        """
        # 벡터 검색 결과
        vector_results = self._vector_search(
            query, filters, self.rerank_top_k, min_score
        )

        # 키워드 검색 결과
        keyword_results = self._keyword_search(
            query, filters, self.rerank_top_k, min_score
        )

        # 결과 병합 및 점수 계산
        combined_scores = {}

        # 벡터 점수 추가
        for idx, result in enumerate(vector_results):
            chunk_id = result['chunk_id']
            # 순위 기반 가중 점수 (상위일수록 높음)
            position_score = 1.0 / (idx + 1)
            vector_score = result['score'] * position_score

            combined_scores[chunk_id] = {
                'chunk_id': chunk_id,
                'vector_score': vector_score,
                'keyword_score': 0.0,
                'hybrid_score': vector_score * self.vector_weight,
                'chunk_data': result['chunk_data'],
            }

        # 키워드 점수 병합
        for idx, result in enumerate(keyword_results):
            chunk_id = result['chunk_id']
            position_score = 1.0 / (idx + 1)
            keyword_score = result['score'] * position_score

            if chunk_id in combined_scores:
                combined_scores[chunk_id]['keyword_score'] = keyword_score
                combined_scores[chunk_id]['hybrid_score'] += keyword_score * self.keyword_weight
            else:
                combined_scores[chunk_id] = {
                    'chunk_id': chunk_id,
                    'vector_score': 0.0,
                    'keyword_score': keyword_score,
                    'hybrid_score': keyword_score * self.keyword_weight,
                    'chunk_data': result['chunk_data'],
                }

        # 점수 기반 정렬
        sorted_results = sorted(
            combined_scores.values(),
            key=lambda x: x['hybrid_score'],
            reverse=True
        )

        # 최소 점수 필터링
        filtered_results = [
            r for r in sorted_results if r['hybrid_score'] >= min_score
        ]

        return filtered_results

    def _vector_search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]],
        top_k: int,
        min_score: float
    ) -> List[Dict[str, Any]]:
        """
        벡터 유사도 검색

        Args:
            query: 검색 쿼리
            filters: 필터 조건
            top_k: 반환할 결과 수
            min_score: 최소 점수

        Returns:
            검색 결과 목록
        """
        # 쿼리 임베딩 생성
        query_embedding = self._get_query_embedding(query)

        if not query_embedding:
            logger.warning('쿼리 임베딩 생성 실패, 빈 결과 반환')
            return []

        # 청크 쿼리셋 생성
        chunks = DocumentChunk.objects.select_related('document').all()

        # 필터 적용
        if filters:
            if 'content_type' in filters:
                chunks = chunks.filter(
                    document__content_type=filters['content_type']
                )
            if 'source_type' in filters:
                chunks = chunks.filter(
                    document__source_type=filters['source_type']
                )
            if 'document_id' in filters:
                chunks = chunks.filter(
                    document__doc_id=filters['document_id']
                )

        # 임베딩이 있는 청크만 필터링
        chunks = chunks.exclude(embedding__isnull=True)

        # 코사인 유사도 계산
        results = []

        for chunk in chunks:
            chunk_embedding = chunk.embedding

            if not chunk_embedding:
                continue

            # 코사인 유사도 계산
            similarity = self._cosine_similarity(query_embedding, chunk_embedding)

            if similarity >= min_score:
                results.append({
                    'chunk_id': str(chunk.chunk_id),
                    'score': similarity,
                    'chunk_data': {
                        'chunk_id': str(chunk.chunk_id),
                        'text': chunk.text,
                        'chunk_index': chunk.chunk_index,
                        'metadata': chunk.metadata,
                        'document_id': str(chunk.document.doc_id),
                        'document_title': chunk.document.title,
                        'content_type': chunk.document.content_type,
                        'source_uri': chunk.document.source_uri,
                    }
                })

        # 점수 기반 정렬
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:top_k]

    def _keyword_search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]],
        top_k: int,
        min_score: float
    ) -> List[Dict[str, Any]]:
        """
        키워드 검색 (전체 텍스트 검색)

        Args:
            query: 검색 쿼리
            filters: 필터 조건
            top_k: 반환할 결과 수
            min_score: 최소 점수

        Returns:
            검색 결과 목록
        """
        # 쿼리 토큰화
        query_terms = self._tokenize_query(query)

        if not query_terms:
            return []

        # 청크 쿼리셋 생성
        chunks = DocumentChunk.objects.select_related('document').all()

        # 필터 적용
        if filters:
            if 'content_type' in filters:
                chunks = chunks.filter(
                    document__content_type=filters['content_type']
                )
            if 'source_type' in filters:
                chunks = chunks.filter(
                    document__source_type=filters['source_type']
                )
            if 'document_id' in filters:
                chunks = chunks.filter(
                    document__doc_id=filters['document_id']
                )

        # 전체 텍스트 검색
        results = []

        for chunk in chunks:
            # 키워드 매칭 점수 계산
            score = self._calculate_keyword_score(chunk.text, query_terms)

            if score >= min_score:
                results.append({
                    'chunk_id': str(chunk.chunk_id),
                    'score': score,
                    'chunk_data': {
                        'chunk_id': str(chunk.chunk_id),
                        'text': chunk.text,
                        'chunk_index': chunk.chunk_index,
                        'metadata': chunk.metadata,
                        'document_id': str(chunk.document.doc_id),
                        'document_title': chunk.document.title,
                        'content_type': chunk.document.content_type,
                        'source_uri': chunk.document.source_uri,
                    }
                })

        # 점수 기반 정렬
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:top_k]

    def _rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        결과 재순위 (Reranking)

        Args:
            query: 검색 쿼리
            results: 검색 결과

        Returns:
            재순위된 결과
        """
        # 간단한 재순위: 쿼리와의 텍스트 유사도 추가 고려
        query_terms = set(self._tokenize_query(query))

        for result in results:
            chunk_text = result['chunk_data']['text']
            chunk_terms = set(self._tokenize_query(chunk_text))

            # Jaccard 유사도
            intersection = query_terms & chunk_terms
            union = query_terms | chunk_terms
            jaccard_similarity = len(intersection) / len(union) if union else 0

            # 재순위 점수 (하이브리드 점수 + Jaccard 유사도)
            result['rerank_score'] = (
                result['hybrid_score'] * 0.8 + jaccard_similarity * 0.2
            )

        # 재순위 점수 기반 정렬
        results.sort(key=lambda x: x['rerank_score'], reverse=True)

        return results

    def _get_query_embedding(self, query: str) -> Optional[List[float]]:
        """
        쿼리 임베딩 생성

        Args:
            query: 쿼리 텍스트

        Returns:
            임베딩 벡터
        """
        # 실제 구현에서는 임베딩 모델 사용
        # 여기서는 간단한 해시 기반 임베딩 (개선 필요)

        try:
            # OpenAI 임베딩 API 사용 예시
            import openai

            client = openai.Client(api_key=getattr(settings, 'OPENAI_API_KEY', None))

            response = client.embeddings.create(
                model='text-embedding-3-small',
                input=query
            )

            return response.data[0].embedding

        except Exception as e:
            logger.error(f'임베딩 생성 실패: {e}')

            # 대안: 간단한 해시 기반 임베딩
            return self._fallback_embedding(query)

    def _fallback_embedding(self, text: str, dim: int = 1536) -> List[float]:
        """
        대체 임베딩 (해시 기반)

        Args:
            text: 텍스트
            dim: 임베딩 차원

        Returns:
            임베딩 벡터
        """
        import hashlib

        # 텍스트 해시 생성
        hash_obj = hashlib.sha256(text.encode('utf-8'))
        hash_bytes = hash_obj.digest()

        # 해시를 임베딩으로 변환
        embedding = []
        for i in range(dim):
            byte_index = i % len(hash_bytes)
            bit_index = (i // len(hash_bytes)) % 8
            byte_val = hash_bytes[byte_index]
            bit_val = (byte_val >> bit_index) & 1

            # -1에서 1 사이의 값으로 정규화
            embedding.append(float(bit_val) * 2 - 1)

        return embedding

    def _cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float]
    ) -> float:
        """
        코사인 유사도 계산

        Args:
            vec1: 벡터 1
            vec2: 벡터 2

        Returns:
            코사인 유사도 (-1 ~ 1)
        """
        if len(vec1) != len(vec2):
            # 길이가 다르면 짧은 쪽에 맞춤
            min_len = min(len(vec1), len(vec2))
            vec1 = vec1[:min_len]
            vec2 = vec2[:min_len]

        try:
            import numpy as np

            v1 = np.array(vec1)
            v2 = np.array(vec2)

            dot_product = np.dot(v1, v2)
            norm_v1 = np.linalg.norm(v1)
            norm_v2 = np.linalg.norm(v2)

            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0

            return float(dot_product / (norm_v1 * norm_v2))

        except Exception as e:
            logger.error(f'코사인 유사도 계산 실패: {e}')
            return 0.0

    def _tokenize_query(self, query: str) -> List[str]:
        """
        쿼리 토큰화

        Args:
            query: 쿼리 텍스트

        Returns:
            토큰 목록
        """
        # 간단한 공백 기반 토큰화
        # 실제 구현에서는 형태소 분석기 사용 권장

        # 소문자 변환 및 공백 기반 분리
        tokens = query.lower().split()

        # 불용어 제거
        stopwords = {'은', '는', '이', '가', '을', '를', '의', '에', '에서',
                    'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for'}

        filtered_tokens = [
            token for token in tokens
            if len(token) > 1 and token not in stopwords
        ]

        return filtered_tokens

    def _calculate_keyword_score(
        self,
        text: str,
        query_terms: List[str]
    ) -> float:
        """
        키워드 점수 계산

        Args:
            text: 텍스트
            query_terms: 쿼리 토큰

        Returns:
            점수 (0 ~ 1)
        """
        if not query_terms:
            return 0.0

        text_lower = text.lower()
        matched_terms = 0
        total_match_count = 0

        for term in query_terms:
            # 정확히 일치하는 횟수
            exact_count = text_lower.count(term)
            # 부분 일치도 고려
            partial_count = sum(1 for word in text_lower.split() if term in word)

            match_count = max(exact_count, partial_count)
            if match_count > 0:
                matched_terms += 1
                total_match_count += match_count

        # 매칭된 용어 비율
        term_ratio = matched_terms / len(query_terms)

        # 전체 매칭 빈도 (정규화)
        text_length = len(text.split())
        match_density = min(total_match_count / text_length, 1.0) if text_length > 0 else 0

        # 종합 점수
        score = (term_ratio * 0.7 + match_density * 0.3)

        return score


class RetrievalAugmentedGenerator:
    """
    검색 증강 생성 (RAG) 엔진
    검색된 문맥을 활용하여 답변 생성
    """

    def __init__(self):
        self.search_engine = HybridSearchEngine()
        self.max_context_length = getattr(settings, 'RAG_MAX_CONTEXT_LENGTH', 4000)
        self.max_chunks = getattr(settings, 'RAG_MAX_CHUNKS', 5)

    def generate(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        top_k: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        RAG 생성 수행

        Args:
            query: 질문/쿼리
            filters: 검색 필터
            top_k: 검색할 청크 수
            **kwargs: 추가 파라미터

        Returns:
            생성 결과
        """
        # 관련 청크 검색
        search_results = self.search_engine.search(
            query=query,
            filters=filters,
            top_k=top_k or self.max_chunks,
        )

        if not search_results:
            return {
                'query': query,
                'answer': '죄송합니다. 관련 정보를 찾을 수 없습니다.',
                'sources': [],
                'confidence': 0.0,
            }

        # 컨텍스트 구성
        context = self._build_context(search_results)

        # 답변 생성
        answer = self._generate_answer(query, context, **kwargs)

        # 출처 정보 추출
        sources = self._extract_sources(search_results)

        # 신뢰도 계산
        confidence = self._calculate_confidence(search_results)

        return {
            'query': query,
            'answer': answer,
            'context': context,
            'sources': sources,
            'confidence': confidence,
            'search_results': search_results,
        }

    def _build_context(self, search_results: List[Dict[str, Any]]) -> str:
        """
        컨텍스트 구성

        Args:
            search_results: 검색 결과

        Returns:
            컨텍스트 텍스트
        """
        context_parts = []

        for idx, result in enumerate(search_results[:self.max_chunks]):
            chunk_data = result['chunk_data']
            context_parts.append(
                f"[문서 {idx + 1}] {chunk_data['document_title']}\n"
                f"{chunk_data['text']}\n"
            )

            # 길이 제한 확인
            current_length = sum(len(part) for part in context_parts)
            if current_length >= self.max_context_length:
                break

        return '\n'.join(context_parts)

    def _generate_answer(
        self,
        query: str,
        context: str,
        **kwargs
    ) -> str:
        """
        답변 생성

        Args:
            query: 질문
            context: 컨텍스트
            **kwargs: 추가 파라미터

        Returns:
            생성된 답변
        """
        # 실제 구현에서는 LLM을 사용하여 답변 생성
        # 여기서는 간단한 템플릿 기반 답변

        answer_template = f"""제공된 문서를 바탕으로 답변드립니다.

질문: {query}

관련 문서:
{context}

답변:"""

        # LLM이 없는 경우 간단 답변 반환
        if not context:
            return "죄송합니다. 관련 정보를 찾을 수 없습니다."

        # 실제로는 여기서 LLM API 호출
        try:
            import openai

            client = openai.Client(api_key=getattr(settings, 'OPENAI_API_KEY', None))

            response = client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=[
                    {
                        'role': 'system',
                        'content': '당신은 문서를 바탕으로 질문에 답변하는 AI 어시스턴트입니다.'
                    },
                    {
                        'role': 'user',
                        'content': answer_template
                    }
                ],
                max_tokens=1000,
                temperature=0.7,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f'LLM 답변 생성 실패: {e}')

            # 대안: 첫 번째 검색 결과 반환
            if context:
                first_chunk = context.split('\n')[2] if len(context.split('\n')) > 2 else ''
                return f"관련 정보를 찾았습니다:\n{first_chunk}"

            return "답변 생성 중 오류가 발생했습니다."

    def _extract_sources(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        출처 정보 추출

        Args:
            search_results: 검색 결과

        Returns:
            출처 목록
        """
        sources = []

        for result in search_results:
            chunk_data = result['chunk_data']
            sources.append({
                'document_id': chunk_data['document_id'],
                'document_title': chunk_data['document_title'],
                'content_type': chunk_data['content_type'],
                'source_uri': chunk_data['source_uri'],
                'score': result.get('hybrid_score', result.get('score', 0)),
            })

        return sources

    def _calculate_confidence(self, search_results: List[Dict[str, Any]]) -> float:
        """
        신뢰도 계산

        Args:
            search_results: 검색 결과

        Returns:
            신뢰도 (0 ~ 1)
        """
        if not search_results:
            return 0.0

        # 상위 결과의 평균 점수
        top_scores = [
            r.get('hybrid_score', r.get('score', 0))
            for r in search_results[:3]
        ]

        if not top_scores:
            return 0.0

        avg_score = sum(top_scores) / len(top_scores)

        # 결과 수에 따른 가중치
        result_count_weight = min(len(search_results) / 5, 1.0)

        # 종합 신뢰도
        confidence = avg_score * 0.7 + result_count_weight * 0.3

        return round(confidence, 3)


# 전역 인스턴스
hybrid_search_engine = HybridSearchEngine()
rag_generator = RetrievalAugmentedGenerator()
