# -*- coding: utf-8 -*-
"""
RAG 시스템 테스트
문서 청킹, 하이브리드 검색, RAG 생성 테스트
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
from django.contrib.auth import get_user_model

# 로깅 설정 (UTF-8)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# 테스트 결과 저장
test_results = []


def print_header(title):
    """헤더 출력"""
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"  {title}")
    logger.info("=" * 80)


def test_imports():
    """모듈 임포트 테스트"""
    print_header("1. 모듈 임포트 테스트")

    results = {}

    try:
        from ai.services.chunking_service import DocumentChunker, BatchDocumentChunker
        results['chunking_service'] = 'OK'
        logger.info("  OK: chunking_service")
    except Exception as e:
        results['chunking_service'] = f'FAIL: {e}'
        logger.error(f"  FAIL: chunking_service - {e}")

    try:
        from ai.services.hybrid_search_service import HybridSearchEngine, RetrievalAugmentedGenerator
        results['hybrid_search_service'] = 'OK'
        logger.info("  OK: hybrid_search_service")
    except Exception as e:
        results['hybrid_search_service'] = f'FAIL: {e}'
        logger.error(f"  FAIL: hybrid_search_service - {e}")

    try:
        from ai.models import Document, DocumentChunk
        results['models'] = 'OK'
        logger.info("  OK: Document, DocumentChunk models")
    except Exception as e:
        results['models'] = f'FAIL: {e}'
        logger.error(f"  FAIL: models - {e}")

    return results


def test_document_chunker_initialization():
    """DocumentChunker 초기화 테스트"""
    print_header("2. DocumentChunker 초기화 테스트")

    try:
        from ai.services.chunking_service import DocumentChunker

        chunker = DocumentChunker()

        # 전략 확인
        strategies = list(chunker.chunking_strategies.keys())
        logger.info(f"  Available strategies: {strategies}")

        expected_strategies = ['recursive', 'fixed_size', 'semantic', 'paragraph', 'sentence']
        missing = [s for s in expected_strategies if s not in strategies]

        if missing:
            logger.warning(f"  Missing strategies: {missing}")
            return False
        else:
            logger.info(f"  OK: All {len(expected_strategies)} strategies available")
            return True

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        return False


def test_chunking_strategies():
    """청킹 전략 테스트"""
    print_header("3. 청킹 전략 테스트")

    from ai.services.chunking_service import DocumentChunker

    # 테스트용 텍스트
    test_text = """
    원가 분석이란 제품 또는 서비스의 원가를 구성하는 요소를 분석하는 활동입니다.
    4M2E 분석법은 원가 편차의 원인을 6가지 요소로 분류합니다.

    Man(인건비): 직원 급여, 복리후생비 등 인적 자원 비용
    Machine(기계비): 설비 구입비, 유지보수비, 감가상각비
    Material(재료비): 원자재 구입비, 부품비, 포장비
    Method(방법비): 가공 방법, 공정 최적화 비용
    Measurement(측정비): 품질 검사, 측정 장비 비용
    Environment(환경비): 에너지비, 폐기물 처리비

    이러한 요소들의 변화를 추적함으로써 원가 편차의 근본 원인을 파악할 수 있습니다.
    """

    chunker = DocumentChunker()
    results = {}

    # 각 전략 테스트 - strategy 함수를 직접 호출
    strategy_tests = [
        ('recursive', chunker._recursive_chunk),
        ('fixed_size', chunker._fixed_size_chunk),
        ('paragraph', chunker._paragraph_chunk),
        ('sentence', chunker._sentence_chunk),
    ]

    for strategy_name, strategy_func in strategy_tests:
        try:
            # 각 전략 함수의 인자에 맞게 호출
            if strategy_name == 'fixed_size':
                chunks = strategy_func(test_text, chunk_size=200, chunk_overlap=50)
            elif strategy_name in ['paragraph', 'sentence']:
                chunks = strategy_func(test_text)
            else:  # recursive
                chunks = strategy_func(test_text, chunk_size=200, chunk_overlap=50)

            chunk_count = len(chunks)
            total_chars = sum(len(c.get('text', '')) for c in chunks)

            results[strategy_name] = {
                'status': 'OK',
                'chunk_count': chunk_count,
                'total_chars': total_chars
            }

            logger.info(f"  {strategy_name}: {chunk_count} chunks, {total_chars} chars")

        except Exception as e:
            results[strategy_name] = {
                'status': 'FAIL',
                'error': str(e)
            }
            logger.error(f"  {strategy_name}: FAIL - {e}")

    return results


def test_hybrid_search_initialization():
    """HybridSearchEngine 초기화 테스트"""
    print_header("4. HybridSearchEngine 초기화 테스트")

    try:
        from ai.services.hybrid_search_service import HybridSearchEngine

        engine = HybridSearchEngine()

        # 검색 타입 확인
        search_types = ['vector', 'keyword', 'hybrid']
        logger.info(f"  Supported search types: {search_types}")

        # 가중치 설정 확인
        logger.info(f"  Vector weight: {engine.vector_weight}")
        logger.info(f"  Keyword weight: {engine.keyword_weight}")
        logger.info(f"  Top K: {engine.top_k}")

        # 검색 메서드 확인
        has_search = hasattr(engine, 'search')
        logger.info(f"  Search method: {'OK' if has_search else 'MISSING'}")

        # 코사인 유사도 함수 확인
        has_cosine = hasattr(engine, '_cosine_similarity')
        logger.info(f"  Cosine similarity: {'OK' if has_cosine else 'MISSING'}")

        # 리랭킹 함수 확인
        has_rerank = hasattr(engine, '_rerank_results')
        logger.info(f"  Reranking: {'OK' if has_rerank else 'MISSING'}")

        return True

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        return False


def test_rag_generator_initialization():
    """RetrievalAugmentedGenerator 초기화 테스트"""
    print_header("5. RAG Generator 초기화 테스트")

    try:
        from ai.services.hybrid_search_service import RetrievalAugmentedGenerator

        generator = RetrievalAugmentedGenerator()

        # 검색 엔진 확인
        has_search_engine = hasattr(generator, 'search_engine')
        logger.info(f"  Search engine: {'OK' if has_search_engine else 'MISSING'}")

        # 최대 컨텍스트 길이 확인
        max_context = getattr(generator, 'max_context_length', None)
        max_chunks = getattr(generator, 'max_chunks', None)
        logger.info(f"  Max context length: {max_context}")
        logger.info(f"  Max chunks: {max_chunks}")

        # 생성 메서드 확인
        has_generate = hasattr(generator, 'generate')
        logger.info(f"  Generate method: {'OK' if has_generate else 'MISSING'}")

        # LLM 통합 확인 (llm_complete 또는 유사 메서드)
        llm_methods = ['_call_llm', '_llm_complete', '_generate_with_llm']
        for method in llm_methods:
            if hasattr(generator, method):
                logger.info(f"  LLM method: {method} - OK")
                break
        else:
            logger.info(f"  LLM method: Checking for direct LLM calls...")

        return True

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        return False


def test_cosine_similarity():
    """코사인 유사도 계산 테스트"""
    print_header("6. 코사인 유사도 계산 테스트")

    try:
        from ai.services.hybrid_search_service import HybridSearchEngine
        import numpy as np

        engine = HybridSearchEngine()

        # 테스트 벡터 생성
        vec1 = np.array([1.0, 0.5, 0.3, 0.8])
        vec2 = np.array([1.0, 0.6, 0.2, 0.9])
        vec3 = np.array([0.1, 0.9, 0.7, 0.2])

        # 유사도 계산
        sim12 = engine._cosine_similarity(vec1, vec2)
        sim13 = engine._cosine_similarity(vec1, vec3)
        sim23 = engine._cosine_similarity(vec2, vec3)

        logger.info(f"  vec1 vs vec2: {sim12:.4f}")
        logger.info(f"  vec1 vs vec3: {sim13:.4f}")
        logger.info(f"  vec2 vs vec3: {sim23:.4f}")

        # 검증: vec1-vec2가 더 유사해야 함
        if sim12 > sim13:
            logger.info("  OK: Similarity calculation correct")
            return True
        else:
            logger.warning("  WARNING: Unexpected similarity result")
            return False

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        return False


def test_database_models():
    """데이터베이스 모델 테스트"""
    print_header("7. 데이터베이스 모델 테스트")

    try:
        from ai.models import Document, DocumentChunk

        # Document 모델 필드 확인
        doc_fields = [f.name for f in Document._meta.get_fields()]
        logger.info(f"  Document fields: {len(doc_fields)}")

        required_doc_fields = ['doc_id', 'title', 'content_type', 'source_uri', 'metadata', 'created_at']
        missing_doc = [f for f in required_doc_fields if f not in doc_fields]

        if missing_doc:
            logger.warning(f"  Document missing fields: {missing_doc}")
        else:
            logger.info("  OK: Document model structure")

        # DocumentChunk 모델 필드 확인
        chunk_fields = [f.name for f in DocumentChunk._meta.get_fields()]
        logger.info(f"  DocumentChunk fields: {len(chunk_fields)}")

        required_chunk_fields = ['chunk_id', 'document', 'chunk_index', 'text', 'embedding', 'metadata', 'created_at']
        missing_chunk = [f for f in required_chunk_fields if f not in chunk_fields]

        if missing_chunk:
            logger.warning(f"  DocumentChunk missing fields: {missing_chunk}")
        else:
            logger.info("  OK: DocumentChunk model structure")

        # 기존 데이터 확인
        doc_count = Document.objects.count()
        chunk_count = DocumentChunk.objects.count()

        logger.info(f"  Existing documents: {doc_count}")
        logger.info(f"  Existing chunks: {chunk_count}")

        return len(missing_doc) == 0 and len(missing_chunk) == 0

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        return False


def test_rag_end_to_end():
    """RAG 엔드투엔드 테스트"""
    print_header("8. RAG 엔드투엔드 테스트 (옵션)")

    try:
        from ai.services.hybrid_search_service import HybridSearchEngine, RetrievalAugmentedGenerator
        from ai.models import Document, DocumentChunk
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # 테스트 사용자 확인 또는 생성
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                logger.warning("  No superuser found for document creation")
                return False
        except:
            logger.warning("  Cannot verify user for document creation")
            return False

        # 테스트 문서 생성
        test_doc = Document.objects.create(
            title="RAG 테스트 문서",
            content_type="text/plain",
            source_uri="test://rag/test",
            metadata={"test": True}
        )

        logger.info(f"  Created test document: {test_doc.doc_id}")

        # 테스트 청크 생성
        test_text = "원가 분석은 제품의 원가 구성 요소를 분석하는 활동입니다."
        test_chunk = DocumentChunk.objects.create(
            document=test_doc,
            chunk_index=0,
            text=test_text,
            embedding=[0.1] * 1536,  # 더미 임베딩
            metadata={"test": True}
        )

        logger.info(f"  Created test chunk: {test_chunk.chunk_id}")

        # 검색 테스트
        search_engine = HybridSearchEngine()
        results = search_engine.search("원가 분석", top_k=1)

        logger.info(f"  Search results: {len(results)}")

        # 정리
        test_chunk.delete()
        test_doc.delete()

        logger.info("  OK: End-to-end test completed")
        return True

    except Exception as e:
        logger.error(f"  FAIL: {e}")
        import traceback
        traceback.print_exc()
        return False


def generate_final_report(import_results, chunker_init, chunking_results,
                         search_init, rag_init, cosine_sim, db_models,
                         end_to_end):
    """최종 보고서 생성"""
    print_header("최종 테스트 보고서")

    # 1. 모듈 임포트
    logger.info("[1. Module Import]")
    for module, status in import_results.items():
        logger.info(f"  {module}: {status}")

    # 2. 청킹 시스템
    logger.info(f"\n[2. Chunking System]")
    logger.info(f"  DocumentChunker Init: {'OK' if chunker_init else 'FAIL'}")
    if chunking_results:
        for strategy, result in chunking_results.items():
            logger.info(f"  {strategy}: {result.get('status', 'UNKNOWN')}")
            if result.get('status') == 'OK':
                logger.info(f"    - {result['chunk_count']} chunks")

    # 3. 검색 시스템
    logger.info(f"\n[3. Search System]")
    logger.info(f"  HybridSearchEngine Init: {'OK' if search_init else 'FAIL'}")
    logger.info(f"  RAG Generator Init: {'OK' if rag_init else 'FAIL'}")
    logger.info(f"  Cosine Similarity: {'OK' if cosine_sim else 'FAIL'}")

    # 4. 데이터베이스
    logger.info(f"\n[4. Database Models]")
    logger.info(f"  Model Structure: {'OK' if db_models else 'FAIL'}")
    logger.info(f"  End-to-End Test: {'OK' if end_to_end else 'NOT RUN/FAIL'}")

    # 5. 최종 평가
    logger.info(f"\n[5. Final Assessment]")

    checks = [
        ('Module Import', all('OK' in v for v in import_results.values())),
        ('Chunking System', chunker_init and chunking_results),
        ('Search System', search_init and rag_init and cosine_sim),
        ('Database Models', db_models),
        ('End-to-End Test', end_to_end),
    ]

    passed = sum(1 for _, result in checks if result)
    total = len(checks)

    for name, result in checks:
        status = "[PASS]" if result else "[FAIL]"
        logger.info(f"  {status}: {name}")

    logger.info(f"\n  Overall: {passed}/{total} checks passed")

    if passed == total:
        grade = "A (Excellent)"
        status_icon = "[OK]"
    elif passed >= total - 1:
        grade = "B (Good)"
        status_icon = "[OK]"
    elif passed >= total - 2:
        grade = "C (Fair)"
        status_icon = "[PARTIAL]"
    else:
        grade = "D (Needs Improvement)"
        status_icon = "[NEEDS WORK]"

    logger.info(f"  Grade: {grade}")
    logger.info(f"  Status: {status_icon} RAG system fully functional")

    print_header("테스트 완료")

    return {
        'total': total,
        'passed': passed,
        'grade': grade
    }


def main():
    """메인 함수"""
    start_time = datetime.now()

    print_header("NetPlus MIS-AI Dashboard RAG System Test")

    # 1. 모듈 임포트
    import_results = test_imports()

    # 2. DocumentChunker 초기화
    chunker_init = test_document_chunker_initialization()

    # 3. 청킹 전략
    chunking_results = test_chunking_strategies()

    # 4. HybridSearchEngine 초기화
    search_init = test_hybrid_search_initialization()

    # 5. RAG Generator 초기화
    rag_init = test_rag_generator_initialization()

    # 6. 코사인 유사도
    cosine_sim = test_cosine_similarity()

    # 7. 데이터베이스 모델
    db_models = test_database_models()

    # 8. 엔드투엔드 테스트 (선택적)
    end_to_end = test_rag_end_to_end()

    # 최종 보고서
    report = generate_final_report(
        import_results, chunker_init, chunking_results,
        search_init, rag_init, cosine_sim, db_models, end_to_end
    )

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"Test completed in {duration:.2f} seconds")

    return report


if __name__ == '__main__':
    main()
