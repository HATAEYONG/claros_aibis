# -*- coding: utf-8 -*-
"""
RAG Models
Retrieval Augmented Generation 데이터 모델
"""
import uuid
from django.db import models
from django.utils import timezone


class Document(models.Model):
    """
    문서 모델
    RAG 시스템에서 관리하는 모든 문서
    """

    DOC_TYPE_CHOICES = [
        ('report', '보고서'),
        ('manual', '매뉴얼'),
        ('policy', '정책'),
        ('sop', '표준운영절차'),
        ('knowledge', '지식베이스'),
        ('log', '로그'),
        ('other', '기타'),
    ]

    STATUS_CHOICES = [
        ('pending', '처리 대기'),
        ('processing', '처리 중'),
        ('indexed', '인덱스 완료'),
        ('failed', '처리 실패'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    doc_type = models.CharField('문서 유형', max_length=20, choices=DOC_TYPE_CHOICES)

    title = models.CharField('제목', max_length=500)
    source_path = models.CharField('원본 경로', max_length=1000, blank=True)

    # 문서 메타데이터
    author = models.CharField('작성자', max_length=100, blank=True)
    created_at_source = models.DateTimeField('원본 생성일', null=True, blank=True)
    file_size_bytes = models.IntegerField('파일 크기(bytes)', null=True, blank=True)

    # 카테고리 분류
    category = models.CharField('카테고리', max_length=100, blank=True)
    tags = models.JSONField('태그', default=list)

    # 처리 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField('에러 메시지', blank=True)

    # 통계
    total_chunks = models.IntegerField('전체 청크 수', default=0)
    indexed_chunks = models.IntegerField('인덱스된 청크 수', default=0)

    # 시각
    uploaded_at = models.DateTimeField('업로드일', auto_now_add=True)
    processed_at = models.DateTimeField('처리완료일', null=True, blank=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'rag_document'
        verbose_name = 'RAG 문서'
        verbose_name_plural = 'RAG 문서'
        indexes = [
            models.Index(fields=['doc_type', 'status']),
            models.Index(fields=['category']),
            models.Index(fields=['status', 'uploaded_at']),
        ]

    def __str__(self):
        return f"[{self.doc_type}] {self.title}"


class DocumentChunk(models.Model):
    """
    문서 청크 모델
    문서를 작은 단위로 분할하여 관리
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chunks',
        verbose_name='문서'
    )

    # 청크 내용
    content = models.TextField('청크 내용')
    chunk_index = models.IntegerField('청크 순서')

    # 청크 메타데이터
    page_number = models.IntegerField('페이지 번호', null=True, blank=True)
    section_title = models.CharField('섹션 제목', max_length=500, blank=True)
    char_count = models.IntegerField('문자 수', default=0)
    token_count = models.IntegerField('토큰 수', default=0)

    # 청킹 전략 관련
    chunk_type = models.CharField(
        '청크 유형',
        max_length=20,
        choices=[
            ('semantic', '의미적'),
            ('fixed', '고정 크기'),
            ('recursive', '재귀적'),
        ],
        default='semantic'
    )

    # 오버랩 정보
    overlap_with_prev = models.IntegerField('이전 청크와 오버랩 문자 수', default=0)
    overlap_with_next = models.IntegerField('다음 청크와 오버랩 문자 수', default=0)

    # 임베딩 상태
    embedding_status = models.CharField(
        '임베딩 상태',
        max_length=20,
        choices=[
            ('pending', '대기'),
            ('processing', '처리 중'),
            ('completed', '완료'),
            ('failed', '실패'),
        ],
        default='pending'
    )

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    embedded_at = models.DateTimeField('임베딩일', null=True, blank=True)

    class Meta:
        db_table = 'rag_document_chunk'
        verbose_name = '문서 청크'
        verbose_name_plural = '문서 청크'
        unique_together = ['document', 'chunk_index']
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
            models.Index(fields=['embedding_status']),
        ]

    def __str__(self):
        return f"{self.document.title} - Chunk #{self.chunk_index}"


class Embedding(models.Model):
    """
    임베딩 모델
    문서 청크의 벡터 임베딩 저장
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    chunk = models.OneToOneField(
        DocumentChunk,
        on_delete=models.CASCADE,
        related_name='embedding',
        verbose_name='문서 청크'
    )

    # 임베딩 벡터
    vector = models.JSONField('임베딩 벡터')

    # 임베딩 메타데이터
    model_name = models.CharField('모델명', max_length=100)
    model_version = models.CharField('모델 버전', max_length=50, blank=True)
    dimension = models.IntegerField('벡터 차원', default=1536)  # OpenAI text-embedding-ada-002 기본값

    # 임베딩 생성 정보
    embedding_method = models.CharField('임베딩 방법', max_length=50, default='openai')
    computation_time_ms = models.IntegerField('계산 시간(ms)', null=True, blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'rag_embedding'
        verbose_name = '임베딩'
        verbose_name_plural = '임베딩'
        indexes = [
            models.Index(fields=['model_name']),
        ]

    def __str__(self):
        return f"Embedding for {self.chunk}"


class RetrievalLog(models.Model):
    """
    검색 로그 모델
    RAG 시스템의 검색 이력 기록
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 검색 쿼리
    query = models.TextField('검색 쿼리')
    query_embedding = models.JSONField('쿼리 임베딩', null=True, blank=True)

    # 검색 파라미터
    top_k = models.IntegerField('반환 결과 수', default=5)
    similarity_threshold = models.FloatField('유사도 임계값', default=0.7)
    filter_category = models.CharField('필터 카테고리', max_length=100, blank=True)

    # 검색 결과
    results = models.JSONField('검색 결과', default=list)
    result_count = models.IntegerField('결과 수', default=0)

    # 성능 메트릭
    search_time_ms = models.IntegerField('검색 시간(ms)', null=True, blank=True)
    avg_similarity = models.FloatField('평균 유사도', null=True, blank=True)

    # 사용자 피드백
    user_feedback = models.CharField(
        '사용자 피드백',
        max_length=20,
        choices=[
            ('relevant', '관련 있음'),
            ('partial', '부분적 관련'),
            ('irrelevant', '관련 없음'),
        ],
        blank=True
    )

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'rag_retrieval_log'
        verbose_name = '검색 로그'
        verbose_name_plural = '검색 로그'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['query']),
        ]

    def __str__(self):
        return f"Retrieval: {self.query[:50]}..."
