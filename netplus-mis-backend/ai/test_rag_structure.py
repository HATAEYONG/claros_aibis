# -*- coding: utf-8 -*-
"""
RAG 시스템 구조 테스트
LLM 호출 없이 RAG 시스템 구조 검증
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

import logging
from datetime import datetime

# 로깅 설정 (UTF-8)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


def print_header(title):
    """헤더 출력"""
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"  {title}")
    logger.info("=" * 80)


def main():
    """메인 함수"""
    start_time = datetime.now()

    print_header("NetPlus MIS-AI Dashboard RAG Structure Test")

    results = []

    # 1. 모듈 임포트 테스트
    print_header("1. Module Import Test")

    try:
        from ai.services.chunking_service import DocumentChunker, BatchDocumentChunker
        results.append(('Module: chunking_service', True))
        logger.info("  OK: chunking_service imported")
    except Exception as e:
        results.append(('Module: chunking_service', False))
        logger.error(f"  FAIL: chunking_service - {e}")

    try:
        from ai.services.hybrid_search_service import HybridSearchEngine, RetrievalAugmentedGenerator
        results.append(('Module: hybrid_search_service', True))
        logger.info("  OK: hybrid_search_service imported")
    except Exception as e:
        results.append(('Module: hybrid_search_service', False))
        logger.error(f"  FAIL: hybrid_search_service - {e}")

    try:
        from ai.models import Document, DocumentChunk
        results.append(('Models: Document, DocumentChunk', True))
        logger.info("  OK: Document models imported")
    except Exception as e:
        results.append(('Models: Document, DocumentChunk', False))
        logger.error(f"  FAIL: Document models - {e}")

    # 2. DocumentChunker 구조 테스트
    print_header("2. DocumentChunker Structure Test")

    try:
        chunker = DocumentChunker()

        # 전략 확인
        strategies = list(chunker.chunking_strategies.keys())
        expected_strategies = ['recursive', 'fixed_size', 'semantic', 'paragraph', 'sentence']

        logger.info(f"  Available strategies: {strategies}")

        for strategy in expected_strategies:
            if strategy in strategies:
                results.append((f'Strategy: {strategy}', True))
                logger.info(f"  OK: {strategy} strategy")
            else:
                results.append((f'Strategy: {strategy}', False))
                logger.warning(f"  MISSING: {strategy} strategy")

        # 메서드 확인
        methods_to_check = [
            'chunk_document',
            '_recursive_chunk',
            '_fixed_size_chunk',
            '_semantic_chunk',
            '_paragraph_chunk',
            '_sentence_chunk',
        ]

        for method in methods_to_check:
            has_method = hasattr(chunker, method)
            results.append((f'DocumentChunker method: {method}', has_method))
            if has_method:
                logger.info(f"  OK: {method}")
            else:
                logger.warning(f"  MISSING: {method}")

    except Exception as e:
        logger.error(f"  FAIL: DocumentChunker initialization - {e}")

    # 3. HybridSearchEngine 구조 테스트
    print_header("3. HybridSearchEngine Structure Test")

    try:
        engine = HybridSearchEngine()

        # 속성 확인
        attributes_to_check = [
            ('vector_weight', True),
            ('keyword_weight', True),
            ('top_k', True),
            ('rerank_top_k', True),
        ]

        for attr, required in attributes_to_check:
            has_attr = hasattr(engine, attr)
            results.append((f'HybridSearchEngine attribute: {attr}', has_attr))
            if has_attr:
                value = getattr(engine, attr)
                logger.info(f"  OK: {attr} = {value}")
            else:
                logger.warning(f"  MISSING: {attr}")

        # 메서드 확인
        methods_to_check = [
            'search',
            '_vector_search',
            '_keyword_search',
            '_hybrid_search',
            '_cosine_similarity',
            '_rerank_results',
        ]

        for method in methods_to_check:
            has_method = hasattr(engine, method)
            results.append((f'HybridSearchEngine method: {method}', has_method))
            if has_method:
                logger.info(f"  OK: {method}")
            else:
                logger.warning(f"  MISSING: {method}")

    except Exception as e:
        logger.error(f"  FAIL: HybridSearchEngine initialization - {e}")

    # 4. RetrievalAugmentedGenerator 구조 테스트
    print_header("4. RetrievalAugmentedGenerator Structure Test")

    try:
        generator = RetrievalAugmentedGenerator()

        # 속성 확인
        attributes_to_check = [
            ('search_engine', True),
            ('max_context_length', True),
            ('max_chunks', True),
        ]

        for attr, required in attributes_to_check:
            has_attr = hasattr(generator, attr)
            results.append((f'RAG Generator attribute: {attr}', has_attr))
            if has_attr:
                value = getattr(generator, attr)
                logger.info(f"  OK: {attr} = {value}")
            else:
                logger.warning(f"  MISSING: {attr}")

        # 메서드 확인
        methods_to_check = [
            'generate',
        ]

        for method in methods_to_check:
            has_method = hasattr(generator, method)
            results.append((f'RAG Generator method: {method}', has_method))
            if has_method:
                logger.info(f"  OK: {method}")
            else:
                logger.warning(f"  MISSING: {method}")

    except Exception as e:
        logger.error(f"  FAIL: RetrievalAugmentedGenerator initialization - {e}")

    # 5. 데이터베이스 모델 구조 테스트
    print_header("5. Database Models Structure Test")

    try:
        from ai.models import Document, DocumentChunk

        # Document 모델 필드 확인
        doc_fields = [f.name for f in Document._meta.get_fields()]
        required_doc_fields = ['doc_id', 'title', 'content_type', 'source_uri', 'metadata', 'created_at']

        for field in required_doc_fields:
            has_field = field in doc_fields
            results.append((f'Document field: {field}', has_field))
            if has_field:
                logger.info(f"  OK: Document.{field}")
            else:
                logger.warning(f"  MISSING: Document.{field}")

        # DocumentChunk 모델 필드 확인
        chunk_fields = [f.name for f in DocumentChunk._meta.get_fields()]
        required_chunk_fields = ['chunk_id', 'document', 'chunk_index', 'text', 'embedding', 'metadata', 'created_at']

        for field in required_chunk_fields:
            has_field = field in chunk_fields
            results.append((f'DocumentChunk field: {field}', has_field))
            if has_field:
                logger.info(f"  OK: DocumentChunk.{field}")
            else:
                logger.warning(f"  MISSING: DocumentChunk.{field}")

        # 기존 데이터 확인
        doc_count = Document.objects.count()
        chunk_count = DocumentChunk.objects.count()

        logger.info(f"  Existing documents: {doc_count}")
        logger.info(f"  Existing chunks: {chunk_count}")

    except Exception as e:
        logger.error(f"  FAIL: Database models check - {e}")

    # 6. 코사인 유사도 계산 테스트 (간단)
    print_header("6. Cosine Similarity Test")

    try:
        import numpy as np

        engine = HybridSearchEngine()

        # 테스트 벡터 생성
        vec1 = np.array([1.0, 0.5, 0.3, 0.8])
        vec2 = np.array([1.0, 0.6, 0.2, 0.9])

        # 유사도 계산
        sim = engine._cosine_similarity(vec1, vec2)

        # 검증: 0~1 사이 값이어야 함
        is_valid = 0 <= sim <= 1
        results.append(('Cosine similarity calculation', is_valid))

        if is_valid:
            logger.info(f"  OK: Similarity = {sim:.4f}")
        else:
            logger.error(f"  FAIL: Invalid similarity = {sim}")

    except Exception as e:
        results.append(('Cosine similarity calculation', False))
        logger.error(f"  FAIL: Cosine similarity test - {e}")

    # 최종 보고서
    print_header("Final Test Report")

    total = len(results)
    passed = sum(1 for _, result in results if result)
    failed = total - passed

    logger.info(f"")
    logger.info(f"[Summary]")
    logger.info(f"  Total checks: {total}")
    logger.info(f"  Passed: {passed}")
    logger.info(f"  Failed: {failed}")
    logger.info(f"  Success rate: {(passed/total*100):.1f}%")

    if failed > 0:
        logger.info(f"")
        logger.info(f"[Failed checks]")
        for name, result in results:
            if not result:
                logger.info(f"  - {name}")

    logger.info(f"")
    logger.info(f"[Assessment]")

    if passed == total:
        grade = "A (Excellent)"
        status = "[OK] RAG system structure is complete"
    elif passed >= total * 0.9:
        grade = "B (Good)"
        status = "[OK] RAG system structure is mostly complete"
    elif passed >= total * 0.7:
        grade = "C (Fair)"
        status = "[PARTIAL] RAG system structure needs minor improvements"
    else:
        grade = "D (Needs Improvement)"
        status = "[FAIL] RAG system structure needs significant work"

    logger.info(f"  Grade: {grade}")
    logger.info(f"  Status: {status}")

    print_header("Test Complete")

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"Test completed in {duration:.2f} seconds")

    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'grade': grade
    }


if __name__ == '__main__':
    main()
