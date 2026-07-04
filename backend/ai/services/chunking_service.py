# -*- coding: utf-8 -*-
"""
문서 청킹 서비스
langchain-text-splitters를 활용한 다양한 청킹 전략 구현
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import uuid

from django.conf import settings
from django.utils import timezone

from ai.models import Document, DocumentChunk

logger = logging.getLogger(__name__)


class DocumentChunker:
    """
    문서 청킹 서비스
    다양한 청킹 전략을 지원하는 통합 청커 클래스
    """

    def __init__(self):
        self.chunking_strategies = {
            'recursive': self._recursive_chunk,
            'fixed_size': self._fixed_size_chunk,
            'semantic': self._semantic_chunk,
            'paragraph': self._paragraph_chunk,
            'sentence': self._sentence_chunk,
        }

    def chunk_document(
        self,
        document: Document,
        strategy: str = 'recursive',
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
        **kwargs
    ) -> List[DocumentChunk]:
        """
        문서 청킹 수행

        Args:
            document: 청킹할 문서
            strategy: 청킹 전략 (recursive, fixed_size, semantic, paragraph, sentence)
            chunk_size: 청크 크기
            chunk_overlap: 청크 중복 크기
            separators: 분리자 목록
            **kwargs: 추가 파라미터

        Returns:
            생성된 청크 목록
        """
        if strategy not in self.chunking_strategies:
            raise ValueError(f'지원하지 않는 청킹 전략: {strategy}')

        # 문서 텍스트 가져오기 (source_uri에서 로드)
        document_text = self._load_document_text(document)

        if not document_text:
            logger.warning(f'문서 텍스트를 가져올 수 없습니다: {document.doc_id}')
            return []

        # 청킹 전략 선택
        chunker_func = self.chunking_strategies[strategy]

        # 청크 생성
        chunks_data = chunker_func(
            document_text,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            **kwargs
        )

        # 청크 저장
        created_chunks = []
        for chunk_info in chunks_data:
            chunk = DocumentChunk.objects.create(
                document=document,
                chunk_index=chunk_info['index'],
                text=chunk_info['text'],
                metadata={
                    'strategy': strategy,
                    'chunk_size': len(chunk_info['text']),
                    'start_pos': chunk_info.get('start_pos', 0),
                    'end_pos': chunk_info.get('end_pos', len(chunk_info['text'])),
                    **chunk_info.get('metadata', {})
                }
            )
            created_chunks.append(chunk)

        # 문서 처리 완료 표시
        document.is_processed = True
        document.save(update_fields=['is_processed'])

        logger.info(
            f'문서 청킹 완료: {document.title} '
            f'({len(created_chunks)}개 청크, {strategy} 전략)'
        )

        return created_chunks

    def _load_document_text(self, document: Document) -> str:
        """
        문서 텍스트 로드

        Args:
            document: 문서 객체

        Returns:
            문서 텍스트
        """
        # 실제 구현에서는 source_uri에서 파일을 읽거나
        # 데이터베이스에서 텍스트를 가져옴
        # 여기서는 간단 예시만 구현

        if document.source_type == 'file':
            try:
                # 파일 시스템에서 읽기
                import os
                file_path = document.source_uri

                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()

            except Exception as e:
                logger.error(f'파일 읽기 실패: {e}')

        elif document.source_type == 'database':
            # 데이터베이스에서 읽기
            # 각 구현에 따라 다름
            pass

        elif document.source_type == 'url':
            # URL에서 읽기
            try:
                import requests
                response = requests.get(document.source_uri, timeout=30)
                response.raise_for_status()
                return response.text
            except Exception as e:
                logger.error(f'URL 읽기 실패: {e}')

        # 기본: 메타데이터에 저장된 텍스트 반환
        return document.metadata.get('text', '')

    def _recursive_chunk(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        재귀적 청킹 (Recursive Character Text Splitter)

        Args:
            text: 텍스트
            chunk_size: 청크 크기
            chunk_overlap: 청크 중복
            separators: 분리자 목록

        Returns:
            청크 정보 목록
        """
        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter
        except ImportError:
            logger.warning('langchain-text-splitters 없음, 기본 청킹 사용')
            return self._fixed_size_chunk(text, chunk_size, chunk_overlap)

        # 기본 분리자 (한글 우선)
        default_separators = [
            '\n\n',  # 문단 구분
            '\n',    # 줄바꿈
            '. ',    # 문장 끝
            '! ',    # 느낌표
            '? ',    # 물음표
            '; ',    # 세미콜론
            ', ',    # 쉼표
            ' ',     # 공백
            '',      # 문자 단위
        ]

        separators = separators or default_separators

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            length_function=len,
        )

        texts = splitter.split_text(text)

        chunks_data = []
        current_pos = 0

        for idx, chunk_text in enumerate(texts):
            start_pos = text.find(chunk_text, current_pos)
            end_pos = start_pos + len(chunk_text)
            current_pos = end_pos - chunk_overlap if idx > 0 else end_pos

            chunks_data.append({
                'index': idx,
                'text': chunk_text,
                'start_pos': start_pos,
                'end_pos': end_pos,
                'metadata': {
                    'separator': 'recursive',
                }
            })

        return chunks_data

    def _fixed_size_chunk(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        고정 크기 청킹

        Args:
            text: 텍스트
            chunk_size: 청크 크기
            chunk_overlap: 청크 중복

        Returns:
            청크 정보 목록
        """
        chunks_data = []
        idx = 0
        current_pos = 0
        text_length = len(text)

        while current_pos < text_length:
            end_pos = min(current_pos + chunk_size, text_length)
            chunk_text = text[current_pos:end_pos]

            chunks_data.append({
                'index': idx,
                'text': chunk_text,
                'start_pos': current_pos,
                'end_pos': end_pos,
                'metadata': {
                    'separator': 'fixed_size',
                }
            })

            idx += 1
            current_pos = end_pos - chunk_overlap

        return chunks_data

    def _semantic_chunk(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        시맨틱 청킹 (의미 단위 기반)

        Args:
            text: 텍스트
            chunk_size: 청크 크기
            chunk_overlap: 청크 중복

        Returns:
            청크 정보 목록
        """
        # 시맨틱 청킹은 임베딩 기반이 필요하므로
        # 여기서는 문장 단위 청킹으로 대체
        # 실제 구현에서는 문장 임베딩 간의 코사인 유사도로 분리

        sentences = self._split_sentences(text)

        chunks_data = []
        current_chunk = []
        current_length = 0
        idx = 0
        current_pos = 0

        for sentence in sentences:
            sentence_length = len(sentence)

            if current_length + sentence_length > chunk_size and current_chunk:
                # 현재 청크 저장
                chunk_text = ''.join(current_chunk)
                start_pos = current_pos
                end_pos = current_pos + len(chunk_text)

                chunks_data.append({
                    'index': idx,
                    'text': chunk_text,
                    'start_pos': start_pos,
                    'end_pos': end_pos,
                    'metadata': {
                        'separator': 'semantic',
                        'sentence_count': len(current_chunk),
                    }
                })

                # 중복 부분 유지
                overlap_sentences = self._get_overlap_sentences(
                    current_chunk, chunk_overlap
                )
                current_chunk = overlap_sentences
                current_length = sum(len(s) for s in overlap_sentences)
                idx += 1

            current_chunk.append(sentence)
            current_length += sentence_length

        # 마지막 청크
        if current_chunk:
            chunk_text = ''.join(current_chunk)
            chunks_data.append({
                'index': idx,
                'text': chunk_text,
                'start_pos': current_pos,
                'end_pos': current_pos + len(chunk_text),
                'metadata': {
                    'separator': 'semantic',
                    'sentence_count': len(current_chunk),
                }
            })

        return chunks_data

    def _paragraph_chunk(
        self,
        text: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        문단 단위 청킹

        Args:
            text: 텍스트

        Returns:
            청크 정보 목록
        """
        # 빈 줄로 문단 분리
        paragraphs = text.split('\n\n')

        chunks_data = []
        current_pos = 0

        for idx, paragraph in enumerate(paragraphs):
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            start_pos = text.find(paragraph, current_pos)
            end_pos = start_pos + len(paragraph)
            current_pos = end_pos

            chunks_data.append({
                'index': idx,
                'text': paragraph,
                'start_pos': start_pos,
                'end_pos': end_pos,
                'metadata': {
                    'separator': 'paragraph',
                }
            })

        return chunks_data

    def _sentence_chunk(
        self,
        text: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        문장 단위 청킹

        Args:
            text: 텍스트

        Returns:
            청크 정보 목록
        """
        sentences = self._split_sentences(text)

        chunks_data = []
        current_pos = 0

        for idx, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue

            start_pos = text.find(sentence, current_pos)
            end_pos = start_pos + len(sentence)
            current_pos = end_pos

            chunks_data.append({
                'index': idx,
                'text': sentence,
                'start_pos': start_pos,
                'end_pos': end_pos,
                'metadata': {
                    'separator': 'sentence',
                }
            })

        return chunks_data

    def _split_sentences(self, text: str) -> List[str]:
        """
        문장 분리

        Args:
            text: 텍스트

        Returns:
            문장 목록
        """
        # 간단한 문장 분리 (개선 필요)
        import re

        # 한국어/영어 문장 끝 패턴
        sentence_endings = r'(?<=[.!?])\s+(?=[A-Z가-힣])'

        sentences = re.split(sentence_endings, text)

        # 결과 정리
        result = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                result.append(sentence)

        return result if result else [text]

    def _get_overlap_sentences(
        self,
        sentences: List[str],
        overlap_size: int
    ) -> List[str]:
        """
        중복 문장 가져오기

        Args:
            sentences: 문장 목록
            overlap_size: 중복 크기

        Returns:
            중복 문장 목록
        """
        if not sentences:
            return []

        overlap_sentences = []
        current_length = 0

        # 역순으로 중복 문장 선택
        for sentence in reversed(sentences):
            sentence_length = len(sentence)

            if current_length + sentence_length <= overlap_size:
                overlap_sentences.insert(0, sentence)
                current_length += sentence_length
            else:
                break

        return overlap_sentences


class BatchDocumentChunker:
    """
    배치 문서 청킹
    여러 문서를 동시에 처리하는 배치 청커
    """

    def __init__(self, chunker: Optional[DocumentChunker] = None):
        self.chunker = chunker or DocumentChunker()

    def chunk_documents(
        self,
        documents: List[Document],
        strategy: str = 'recursive',
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        **kwargs
    ) -> Dict[str, Any]:
        """
        여러 문서 배치 청킹

        Args:
            documents: 문서 목록
            strategy: 청킹 전략
            chunk_size: 청크 크기
            chunk_overlap: 청크 중복
            **kwargs: 추가 파라미터

        Returns:
            청킹 결과 요약
        """
        results = {
            'total_documents': len(documents),
            'successful': 0,
            'failed': 0,
            'total_chunks': 0,
            'errors': []
        }

        for document in documents:
            try:
                chunks = self.chunker.chunk_document(
                    document,
                    strategy=strategy,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    **kwargs
                )

                results['successful'] += 1
                results['total_chunks'] += len(chunks)

            except Exception as e:
                logger.error(f'문서 청킹 실패 ({document.doc_id}): {e}')
                results['failed'] += 1
                results['errors'].append({
                    'document_id': str(document.doc_id),
                    'title': document.title,
                    'error': str(e)
                })

        logger.info(
            f'배치 청킹 완료: {results["successful"]}/{results["total_documents"]} '
            f'성공, 총 {results["total_chunks"]}개 청크 생성'
        )

        return results


# 전역 청커 인스턴스
document_chunker = DocumentChunker()
batch_chunker = BatchDocumentChunker()
