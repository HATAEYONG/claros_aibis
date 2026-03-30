# -*- coding: utf-8 -*-
"""
NetPlus MIS-AI Dashboard API 테스트
주요 API 엔드포인트 기능 테스트
"""
import os
import sys
import json
import requests
from datetime import datetime, timedelta

# 로깅 설정
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API 기본 URL
# 참고: AI URLs는 /api/ai/predictions/ 경로로 포함됨
BASE_URL = "http://localhost:8000/api"

# 테스트 결과 저장
test_results = []


def api_test(name: str, method: str, endpoint: str, data: dict = None, params: dict = None):
    """
    API 테스트 헬퍼 함수

    Args:
        name: 테스트 이름
        method: HTTP 메서드 (GET, POST, PUT, DELETE)
        endpoint: API 엔드포인트
        data: 요청 바디
        params: 쿼리 파라미터

    Returns:
        응답 JSON 또는 None
    """
    url = f"{BASE_URL}{endpoint}"

    logger.info(f"\n{'='*60}")
    logger.info(f"테스트: {name}")
    logger.info(f"메서드: {method} {url}")

    if data:
        logger.info(f"데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
    if params:
        logger.info(f"파라미터: {params}")

    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, params=params, timeout=10)
        elif method == "PUT":
            response = requests.put(url, json=data, params=params, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, params=params, timeout=10)
        else:
            logger.error(f"지원하지 않는 메서드: {method}")
            return None

        # 상태 코드
        status_code = response.status_code
        logger.info(f"상태 코드: {status_code}")

        # 결과 저장
        success = 200 <= status_code < 300
        test_results.append({
            'name': name,
            'method': method,
            'endpoint': endpoint,
            'success': success,
            'status_code': status_code,
        })

        # 응답 출력
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                result = response.json()
                logger.info(f"응답: {json.dumps(result, indent=2, ensure_ascii=False)}")
                return result
            except json.JSONDecodeError:
                logger.info(f"응답 (text): {response.text[:500]}")
        else:
            logger.info(f"응답: {response.text[:500]}")

        return response

    except requests.exceptions.ConnectionError:
        logger.error("연결 실패 - 서버가 실행 중인지 확인하세요")
        test_results.append({
            'name': name,
            'method': method,
            'endpoint': endpoint,
            'success': False,
            'status_code': 0,
            'error': 'Connection failed'
        })
        return None
    except requests.exceptions.Timeout:
        logger.error("요청 시간 초과")
        test_results.append({
            'name': name,
            'method': method,
            'endpoint': endpoint,
            'success': False,
            'status_code': 0,
            'error': 'Timeout'
        })
        return None
    except Exception as e:
        logger.error(f"요청 실패: {e}")
        test_results.append({
            'name': name,
            'method': method,
            'endpoint': endpoint,
            'success': False,
            'status_code': 0,
            'error': str(e)
        })
        return None


def test_server_health():
    """서버 건강 상태 테스트"""
    return api_test(
        name="서버 건강 상태",
        method="GET",
        endpoint="/"
    )


def test_agent_endpoints():
    """에이전트 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("에이전트 엔드포인트 테스트")
    logger.info("="*80)

    # 1. 에이전트 레지스트리 조회
    api_test(
        name="에이전트 레지스트리",
        method="GET",
        endpoint="/agents/registry/"
    )

    # 2. 에이전트 실행 (테스트용) - /predictions/agents/execute/ 경로 사용
    api_test(
        name="에이전트 실행 (test)",
        method="POST",
        endpoint="/ai/predictions/agents/execute/",
        data={
            "agent_name": "KPIAgent",
            "query": "KPI 현황 조회",
            "parameters": {
                "kpi_codes": ["production_output"],
                "period_from": "2026-01-01",
                "period_to": "2026-03-30"
            },
            "requested_by": "test_user"
        }
    )

    # 3. 에이전트 실행 히스토리
    api_test(
        name="에이전트 실행 히스토리",
        method="GET",
        endpoint="/ai/predictions/agents/history/",
        params={"limit": 10}
    )


def test_control_tower_endpoints():
    """컨트롤 타워 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("컨트롤 타워 엔드포인트 테스트")
    logger.info("="*80)

    # 1. 경영진 컨트롤 타워 (ViewSet list endpoint)
    api_test(
        name="경영진 컨트롤 타워",
        method="GET",
        endpoint="/control-tower/executive/",
        params={
            "time_range": "month",
            "domains": "financial,production"
        }
    )

    # 2. 기능별 컨트롤 타워 (ViewSet list endpoint)
    api_test(
        name="기능별 컨트롤 타워 (functional)",
        method="GET",
        endpoint="/control-tower/functional/",
        params={"domain": "cost"}
    )

    # 3. 프로세스 컨트롤 타워 (ViewSet list endpoint)
    api_test(
        name="프로세스 컨트롤 타워 (process)",
        method="GET",
        endpoint="/control-tower/process/",
        params={"process_type": "approval", "days": 30}
    )

    # 4. 컨트롤 타워 설정
    api_test(
        name="컨트롤 타워 설정",
        method="GET",
        endpoint="/control-tower/configs/"
    )


def test_event_endpoints():
    """이벤트 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("이벤트 엔드포인트 테스트")
    logger.info("="*80)

    # 1. 이벤트 목록 조회 (ViewSet list endpoint)
    api_test(
        name="이벤트 목록 조회",
        method="GET",
        endpoint="/events/events/",
        params={"limit": 10}
    )

    # 2. 이벤트 통계 (events ViewSet action)
    api_test(
        name="이벤트 통계",
        method="GET",
        endpoint="/events/events/statistics/",
        params={"days": 7}
    )

    # 3. 이벤트 클러스터 (events ViewSet action)
    api_test(
        name="이벤트 클러스터",
        method="GET",
        endpoint="/events/events/clusters/",
        params={"hours": 24, "min_events": 2}
    )


def test_knowledge_graph_endpoints():
    """지식 그래프 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("지식 그래프 엔드포인트 테스트")
    logger.info("="*80)

    # Note: 이 엔드포인트들은 인증이 필요할 수 있음 (403 예상)
    # 1. 지식 그래프 통계
    api_test(
        name="지식 그래프 통계",
        method="GET",
        endpoint="/ontology/kg/stats/"
    )

    # 2. 노드 목록
    api_test(
        name="온톨로지 노드 목록",
        method="GET",
        endpoint="/ontology/kg/nodes/",
        params={"limit": 5}
    )

    # 3. 그래프 쿼리
    api_test(
        name="지식 그래프 쿼리",
        method="POST",
        endpoint="/ontology/kg/query/",
        data={
            "query_type": "neighbors",
            "parameters": {
                "node_id": "test",
                "depth": 1
            }
        }
    )

    # 4. 온톨로지 기본 엔드포인트
    api_test(
        name="온톨로지 카테고리",
        method="GET",
        endpoint="/ontology/categories/",
        params={"limit": 5}
    )


def test_rag_endpoints():
    """RAG 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("RAG 엔드포인트 테스트")
    logger.info("="*80)

    # 1. 문서 목록
    api_test(
        name="RAG 문서 목록",
        method="GET",
        endpoint="/ai/predictions/rag/documents/",
        params={"limit": 5}
    )

    # 2. 청크 목록
    api_test(
        name="RAG 청크 목록",
        method="GET",
        endpoint="/ai/predictions/rag/chunks/",
        params={"limit": 5}
    )

    # 3. RAG 검색
    api_test(
        name="RAG 하이브리드 검색",
        method="POST",
        endpoint="/ai/predictions/rag/search/",
        data={
            "query": "생산 현황",
            "top_k": 3,
            "search_type": "hybrid"
        }
    )

    # 4. RAG 생성
    api_test(
        name="RAG 답변 생성",
        method="POST",
        endpoint="/ai/predictions/rag/generate/",
        data={
            "query": "최근 생산 현황은 어떤가요?",
            "top_k": 3
        }
    )

    # 5. 문서 업로드 테스트 (빈 데이터)
    api_test(
        name="RAG 문서 업로드",
        method="POST",
        endpoint="/ai/predictions/rag/upload/",
        data={
            "title": "테스트 문서",
            "content": "테스트 내용입니다."
        }
    )


def test_ai_chat_endpoints():
    """AI 챗봇 엔드포인트 테스트"""
    logger.info("\n" + "="*80)
    logger.info("AI 챗봇 엔드포인트 테스트")
    logger.info("="*80)

    # 1. AI 챗 (기존)
    api_test(
        name="AI 챗봇 (v1)",
        method="POST",
        endpoint="/ai/predictions/chat/",
        data={
            "message": "생산 현황을 알려줘",
            "context": {}
        }
    )

    # 2. AI 챗봇 (v2 - 에이전트)
    api_test(
        name="AI 챗봇 (v2 - 에이전트)",
        method="POST",
        endpoint="/ai/predictions/chat/v2/",
        data={
            "message": "원가 현황을 분석해줘",
            "context": {"test": True},
            "user": "test_user"
        }
    )

    # 3. Text-to-SQL
    api_test(
        name="Text-to-SQL",
        method="POST",
        endpoint="/ai/predictions/sql/text-to-sql/",
        data={
            "query": "최근 생산 현황을 보여줘"
        }
    )

    # 4. 온톨로지 검색 (GET 메서드, 'term' 파라미터 사용)
    api_test(
        name="온톨로지 검색",
        method="GET",
        endpoint="/ai/predictions/ontology/search/",
        params={"term": "원자재", "limit": 10}
    )

    # 5. 인과 관계 분석
    api_test(
        name="인과 관계 분석",
        method="POST",
        endpoint="/ai/predictions/analysis/causal/",
        data={
            "issue": "품질 불량 증가",
            "analysis_type": "6m"
        }
    )


def print_test_summary():
    """테스트 결과 요약 출력"""
    logger.info("\n" + "="*80)
    logger.info("테스트 결과 요약")
    logger.info("="*80)

    total = len(test_results)
    success = sum(1 for r in test_results if r['success'])
    failed = total - success

    logger.info(f"\n총 테스트: {total}개")
    logger.info(f"성공: {success}개")
    logger.info(f"실패: {failed}개")
    logger.info(f"성공률: {(success/total*100):.1f}%" if total > 0 else "성공률: 0%")

    if failed > 0:
        logger.info(f"\n실패한 테스트:")
        for result in test_results:
            if not result['success']:
                error = result.get('error', f"Status {result['status_code']}")
                logger.info(f"  - {result['name']}: {error}")

    # 엔드포인트별 그룹화
    logger.info(f"\n엔드포인트별 결과:")
    by_endpoint = {}
    for result in test_results:
        endpoint = result['endpoint']
        if endpoint not in by_endpoint:
            by_endpoint[endpoint] = []
        by_endpoint[endpoint].append(result)

    for endpoint, results in by_endpoint.items():
        success_count = sum(1 for r in results if r['success'])
        logger.info(f"  {endpoint}: {success_count}/{len(results)} 성공")


def main():
    """메인 함수"""
    start_time = datetime.now()

    logger.info("="*80)
    logger.info("NetPlus MIS-AI Dashboard API 테스트")
    logger.info(f"시작 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"API 서버: {BASE_URL}")
    logger.info("="*80)

    # 서버 연결 확인
    health = test_server_health()

    if health is None or (hasattr(health, 'status_code') and health.status_code != 200):
        logger.error("\n서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
        return

    # API 엔드포인트 테스트
    test_agent_endpoints()
    test_control_tower_endpoints()
    test_event_endpoints()
    test_knowledge_graph_endpoints()
    test_rag_endpoints()
    test_ai_chat_endpoints()

    # 결과 요약
    print_test_summary()

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"\n테스트 완료!")
    logger.info(f"총 소요 시간: {duration:.2f}초")
    logger.info("="*80)


if __name__ == '__main__':
    main()
