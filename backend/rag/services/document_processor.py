# -*- coding: utf-8 -*-
"""
Document Processor Service
문서 처리 및 청킹 서비스
"""
import re
import uuid
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db import transaction

from ..models import Document, DocumentChunk


class DocumentProcessor:
    """
    문서 처리 서비스
    문서를 청크로 분할하고 메타데이터 추출
    """

    # 청킹 파라미터
    DEFAULT_CHUNK_SIZE = 1000  # 문자
    DEFAULT_CHUNK_OVERLAP = 200  # 문자
    MIN_CHUNK_SIZE = 100  # 최소 청크 크기

    @staticmethod
    def process_document(
        document_id: uuid.UUID,
        content: str,
        chunk_type: str = 'semantic',
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> Dict[str, Any]:
        """
        문서 처리 및 청킹

        Args:
            document_id: 문서 ID
            content: 문서 내용
            chunk_type: 청킹 유형 (semantic, fixed, recursive)
            chunk_size: 청크 크기 (문자)
            chunk_overlap: 오버랩 크기 (문자)

        Returns:
            처리 결과
        """
        chunk_size = chunk_size or DocumentProcessor.DEFAULT_CHUNK_SIZE
        chunk_overlap = chunk_overlap or DocumentProcessor.DEFAULT_CHUNK_OVERLAP

        try:
            with transaction.atomic():
                document = Document.objects.get(id=document_id)
                document.status = 'processing'
                document.save()

                # 청킹 실행
                if chunk_type == 'semantic':
                    chunks = DocumentProcessor._semantic_chunk(content, chunk_size, chunk_overlap)
                elif chunk_type == 'fixed':
                    chunks = DocumentProcessor._fixed_chunk(content, chunk_size, chunk_overlap)
                else:  # recursive
                    chunks = DocumentProcessor._recursive_chunk(content, chunk_size, chunk_overlap)

                # 청크 저장
                chunk_objects = []
                for idx, chunk_data in enumerate(chunks):
                    chunk = DocumentChunk.objects.create(
                        document=document,
                        content=chunk_data['content'],
                        chunk_index=idx,
                        chunk_type=chunk_type,
                        char_count=len(chunk_data['content']),
                        overlap_with_prev=chunk_data.get('overlap_prev', 0),
                        overlap_with_next=chunk_data.get('overlap_next', 0),
                        section_title=chunk_data.get('section_title', ''),
                    )
                    chunk_objects.append(chunk)

                # 문서 상태 업데이트
                document.status = 'indexed'
                document.total_chunks = len(chunk_objects)
                document.indexed_chunks = len(chunk_objects)
                document.processed_at = timezone.now()
                document.save()

                return {
                    'success': True,
                    'document_id': str(document_id),
                    'chunk_count': len(chunk_objects),
                    'chunk_type': chunk_type,
                }

        except Document.DoesNotExist:
            return {
                'success': False,
                'error': f'Document not found: {document_id}',
            }
        except Exception as e:
            document.status = 'failed'
            document.error_message = str(e)
            document.save()

            return {
                'success': False,
                'error': str(e),
            }

    @staticmethod
    def _semantic_chunk(
        content: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[Dict[str, Any]]:
        """
        의미적 청킹
        문장, 단락 단위로 내용을 분할

        Args:
            content: 원본 내용
            chunk_size: 목표 청크 크기
            chunk_overlap: 오버랩 크기

        Returns:
            청크 목록
        """
        chunks = []

        # 문장 단위 분리
        sentences = re.split(r'(?<=[.!?])\s+', content)

        current_chunk = []
        current_size = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            sentence_size = len(sentence)

            # 현재 청크에 문장 추가
            if current_size + sentence_size <= chunk_size:
                current_chunk.append(sentence)
                current_size += sentence_size
            else:
                # 청크 저장
                if current_chunk:
                    chunk_content = ' '.join(current_chunk)
                    chunks.append({
                        'content': chunk_content,
                        'overlap_prev': 0,
                        'overlap_next': min(chunk_overlap, sentence_size),
                    })

                # 오버랩 고려하여 새 청크 시작
                current_chunk = [sentence]
                current_size = sentence_size

        # 마지막 청크
        if current_chunk:
            chunk_content = ' '.join(current_chunk)
            chunks.append({
                'content': chunk_content,
                'overlap_prev': min(chunk_overlap, current_size),
                'overlap_next': 0,
            })

        return chunks

    @staticmethod
    def _fixed_chunk(
        content: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[Dict[str, Any]]:
        """
        고정 크기 청킹
        지정된 크기로 고정 분할

        Args:
            content: 원본 내용
            chunk_size: 청크 크기
            chunk_overlap: 오버랩 크기

        Returns:
            청크 목록
        """
        chunks = []
        start = 0
        content_len = len(content)

        while start < content_len:
            end = start + chunk_size
            chunk_content = content[start:end]

            chunks.append({
                'content': chunk_content,
                'overlap_prev': chunk_overlap if start > 0 else 0,
                'overlap_next': chunk_overlap if end < content_len else 0,
            })

            start = end - chunk_overlap

        return chunks

    @staticmethod
    def _recursive_chunk(
        content: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[Dict[str, Any]]:
        """
        재귀적 청킹
        다양한 구분자를 시도하여 자연스러운 분할

        Args:
            content: 원본 내용
            chunk_size: 청크 크기
            chunk_overlap: 오버랩 크기

        Returns:
            청크 목록
        """
        # 구분자 우선순위
        separators = [
            ('\n\n', '단락'),
            ('\n', '줄'),
            ('. ', '문장'),
            ('! ', '문장'),
            ('? ', '문장'),
            (' ', '단어'),
            ('', '문자'),
        ]

        chunks = []
        remaining_content = content

        while len(remaining_content) > chunk_size:
            chunk_found = False

            for separator, sep_name in separators:
                # 지정된 구분자로 분할 시도
                split_pos = chunk_size

                if separator:
                    # 구분자 위치 찾기
                    split_pos = remaining_content.rfind(separator, 0, chunk_size)

                    if split_pos > 0:
                        split_pos += len(separator)
                    else:
                        continue

                if split_pos > DocumentProcessor.MIN_CHUNK_SIZE:
                    chunk_content = remaining_content[:split_pos]
                    chunks.append({
                        'content': chunk_content.strip(),
                        'overlap_prev': chunk_overlap if len(chunks) > 0 else 0,
                        'overlap_next': chunk_overlap,
                        'section_title': sep_name,
                    })

                    remaining_content = remaining_content[split_pos - chunk_overlap:]
                    chunk_found = True
                    break

            if not chunk_found:
                # 찾지 못한 경우 고정 크기로 분할
                chunk_content = remaining_content[:chunk_size]
                chunks.append({
                    'content': chunk_content,
                    'overlap_prev': chunk_overlap if len(chunks) > 0 else 0,
                    'overlap_next': chunk_overlap,
                })
                remaining_content = remaining_content[chunk_size - chunk_overlap:]

        # 남은 내용
        if remaining_content:
            chunks.append({
                'content': remaining_content.strip(),
                'overlap_prev': chunk_overlap if len(chunks) > 0 else 0,
                'overlap_next': 0,
            })

        return chunks

    @staticmethod
    def extract_metadata(content: str) -> Dict[str, Any]:
        """
        문서에서 메타데이터 추출

        Args:
            content: 문서 내용

        Returns:
            추출된 메타데이터
        """
        metadata = {}

        # 제목 추출 (첫 번째 줄 또는 # 헤딩)
        lines = content.split('\n')
        for line in lines[:5]:
            line = line.strip()
            if line.startswith('#'):
                metadata['title'] = line.lstrip('#').strip()
                break

        # 날짜 패턴 추출
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{4}/\d{2}/\d{2}',
            r'\d{4}\.\d{2}\.\d{2}',
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, content)
            if matches:
                metadata['dates'] = matches
                break

        # 키워드 추출 (빈도 기반)
        words = re.findall(r'\b\w+\b', content.lower())
        word_freq = {}
        for word in words:
            if len(word) > 2:
                word_freq[word] = word_freq.get(word, 0) + 1

        # 상위 10개 키워드
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        metadata['keywords'] = [word for word, freq in top_keywords]

        return metadata

    @staticmethod
    def rechunk_document(
        document_id: uuid.UUID,
        new_chunk_type: str,
        new_chunk_size: int = None,
        new_chunk_overlap: int = None
    ) -> Dict[str, Any]:
        """
        문서 재청킹

        Args:
            document_id: 문서 ID
            new_chunk_type: 새 청킹 유형
            new_chunk_size: 새 청크 크기
            new_chunk_overlap: 새 오버랩 크기

        Returns:
            재청킹 결과
        """
        try:
            document = Document.objects.get(id=document_id)

            # 기존 청크 삭제
            DocumentChunk.objects.filter(document=document).delete()

            # 원본 내용 재구성 (실제로는 원본 문서에서 다시 읽어야 함)
            # 여기서는 청크들의 내용을 합치는 방식으로 구현
            chunks = DocumentChunk.objects.filter(document=document).order_by('chunk_index')
            content = '\n\n'.join([chunk.content for chunk in chunks])

            # 새로 청킹
            return DocumentProcessor.process_document(
                document_id,
                content,
                new_chunk_type,
                new_chunk_size,
                new_chunk_overlap
            )

        except Document.DoesNotExist:
            return {
                'success': False,
                'error': f'Document not found: {document_id}',
            }
