# -*- coding: utf-8 -*-
"""
AI 채팅 및 분석 서비스
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from django.db import connection
from datetime import datetime
import json
import re

from ai.audit import log_ai_sql_execution
from ai.sql_guard import SQLGuardViolation, validate_select_only
from ai.text_to_sql_service import generate_sql as generate_sql_llm


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_chat(request):
    """
    AI 챗봇 엔드포인트 - 자연어 질문 처리 및 답변 생성

    Request Body:
    {
        "message": "질문 내용",
        "context": {...},  // 선택적: 대화 컨텍스트
        "module": "all"    // 선택적: 검색 대상 모듈
    }

    Response:
    {
        "answer": "답변 내용",
        "sources": [...],    // 출처 정보
        "related_queries": [...],  // 관련 질문
        "confidence": float
    }
    """
    message = request.data.get('message', '').strip()
    context = request.data.get('context', {})
    module = request.data.get('module', 'all')

    if not message:
        return Response(
            {'error': 'message 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # AI 질문 유형 분석
    question_type = _analyze_question_type(message)

    # 질문 유형별 처리
    if question_type == 'kpi':
        result = _handle_kpi_question(message, module)
    elif question_type == 'lot_trace':
        result = _handle_lot_trace_question(message)
    elif question_type == 'causal':
        result = _handle_causal_question(message)
    elif question_type == 'ontology':
        result = _handle_ontology_question(message)
    elif question_type == 'sql':
        result = _handle_sql_question(message)
    else:
        result = _handle_general_question(message, module)

    return Response(result)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def text_to_sql(request):
    """
    Text-to-SQL 엔드포인트 - 자연어를 SQL로 변환

    Request Body:
    {
        "query": "자연어 질문",
        "execute": false  // 선택적: SQL 실행 여부
    }

    Response:
    {
        "sql": "생성된 SQL 쿼리",
        "explanation": "SQL 설명",
        "results": [...],  # execute=true인 경우
        "execution_time": float
    }
    """
    query = request.data.get('query', '').strip()
    execute = request.data.get('execute', False)

    if not query:
        return Response(
            {'error': 'query 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    start_time = datetime.now()

    # SQL 생성 (LLM 기반, SQL Guard 검증 포함)
    sql_result = _generate_sql(query)

    if not sql_result.get('safe', True):
        # SQL Guard가 생성 단계에서 이미 차단한 경우 — 실행하지 않는다
        if execute:
            log_ai_sql_execution(
                request, query, sql_result['sql'],
                guard_violation=sql_result.get('guard_violation')
            )
        return Response({
            'sql': sql_result['sql'],
            'explanation': sql_result['explanation'],
            'guard_violation': sql_result.get('guard_violation'),
            'execution_time': (datetime.now() - start_time).total_seconds()
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    if execute and sql_result.get('sql'):
        # 실행 직전 재검증 — 이 실행 경로에 도달하는 SQL이 어디서 왔든 항상 SELECT 전용을 강제한다
        try:
            safe_sql = validate_select_only(sql_result['sql'])
        except SQLGuardViolation as e:
            log_ai_sql_execution(request, query, sql_result['sql'], guard_violation=e.reason_code)
            return Response({
                'sql': sql_result['sql'],
                'explanation': sql_result['explanation'],
                'error': f'SQL Guard 차단 ({e.reason_code}): {e}',
                'guard_violation': e.reason_code,
                'execution_time': (datetime.now() - start_time).total_seconds()
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            with connection.cursor() as cursor:
                cursor.execute(safe_sql)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]

            execution_time = (datetime.now() - start_time).total_seconds()

            log_ai_sql_execution(request, query, safe_sql, result_count=len(results))

            return Response({
                'sql': safe_sql,
                'explanation': sql_result['explanation'],
                'results': results,
                'result_count': len(results),
                'execution_time': execution_time
            })
        except Exception as e:
            log_ai_sql_execution(request, query, safe_sql, error=str(e))
            return Response({
                'sql': safe_sql,
                'explanation': sql_result['explanation'],
                'error': str(e),
                'execution_time': (datetime.now() - start_time).total_seconds()
            })
    else:
        return Response({
            'sql': sql_result['sql'],
            'explanation': sql_result['explanation']
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def ontology_search(request):
    """
    온톨로지 검색 엔드포인트 - 6M/4M2E 개념 검색

    Query Parameters:
    - term: 검색어
    - category: 카테고리 (man, machine, material, method, measurement, mother_nature, 4m2e)
    - depth: 검색 깊이 (기본값: 1)

    Response:
    {
        "term": "검색어",
        "results": [
            {
                "concept": "개념",
                "category": "카테고리",
                "description": "설명",
                "related": [...]
            },
            ...
        ]
    }
    """
    term = request.query_params.get('term', '').strip()
    category = request.query_params.get('category', '')
    depth = int(request.query_params.get('depth', 1))

    if not term:
        return Response(
            {'error': 'term 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    results = _search_ontology(term, category, depth)

    return Response({
        'term': term,
        'category': category or 'all',
        'depth': depth,
        'results': results
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def causal_analysis(request):
    """
    인과관계 분석 엔드포인트 - 원인-결과 분석

    Request Body:
    {
        "issue": "문제 현상",
        "analysis_type": "6m",  # 6m 또는 4m2e
        "depth": 2  # 분석 깊이
    }

    Response:
    {
        "issue": "문제 현상",
        "root_causes": [...],
        "causal_chain": [...],
        "recommendations": [...]
    }
    """
    issue = request.data.get('issue', '').strip()
    analysis_type = request.data.get('analysis_type', '6m')
    depth = int(request.data.get('depth', 2))

    if not issue:
        return Response(
            {'error': 'issue 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 인과관계 분석 수행
    result = _perform_causal_analysis(issue, analysis_type, depth)

    return Response(result)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def lot_trace(request, lot_no):
    """
    로트 추적 엔드포인트 - 전체 공정 추적

    Path Parameters:
    - lot_no: 로트 번호

    Query Parameters:
    - detail: 상세 정보 포함 여부 (기본값: false)

    Response:
    {
        "lot_no": "로트 번호",
        "trace_info": {
            "raw_materials": [...],
            "production": [...],
            "quality": [...],
            "equipment": [...],
            "workers": [...]
        },
        "timeline": [...]
    }
    """
    detail = request.query_params.get('detail', 'false').lower() == 'true'

    trace_data = _trace_lot(lot_no, detail)

    return Response(trace_data)


# 도움 함수

def _analyze_question_type(message):
    """질문 유형 분석"""
    message_lower = message.lower()

    # 로트 추적 관련 질문
    if any(keyword in message_lower for keyword in ['로트', 'lot', '추적', 'trace']):
        return 'lot_trace'

    # 원인 분석 관련 질문
    if any(keyword in message_lower for keyword in ['원인', '왜', '분석', 'causal', '시나리오']):
        return 'causal'

    # 온톨로지 관련 질문
    if any(keyword in message_lower for keyword in ['6m', '4m2e', '온톨로지', 'ontology', '개념']):
        return 'ontology'

    # SQL 관련 질문
    if any(keyword in message_lower for keyword in ['sql', '쿼리', 'query', '목록', '리스트']):
        return 'sql'

    # KPI 관련 질문
    if any(keyword in message_lower for keyword in ['kpi', '지표', '성과', '달성율']):
        return 'kpi'

    return 'general'


def _handle_kpi_question(message, module):
    """KPI 질문 처리"""
    try:
        if module == 'all' or module == 'financial':
            from financial.kpi_engine import FinanceKPIEngine
            engine = FinanceKPIEngine()
            kpis = engine.calculate_all_kpis()
            kpi_list = list(kpis.values())
        else:
            kpi_list = []

        # 관련 KPI 찾기
        related_kpis = []
        for kpi in kpi_list:
            if any(keyword in message for keyword in [kpi['name'], kpi['code']]):
                related_kpis.append(kpi)

        if related_kpis:
            return {
                'answer': f"찾으시는 KPI 정보입니다. {len(related_kpis)}개의 관련 KPI를 찾았습니다.",
                'kpis': related_kpis,
                'sources': ['financial_kpi_engine'],
                'confidence': 0.9
            }
        else:
            return {
                'answer': "해당하는 KPI를 찾지 못했습니다. 더 구체적인 질문을 해주세요.",
                'suggested_kpis': kpi_list[:5],
                'sources': [],
                'confidence': 0.3
            }
    except Exception as e:
        return {
            'answer': f"KPI 조회 중 오류가 발생했습니다: {str(e)}",
            'sources': [],
            'confidence': 0.0
        }


def _handle_lot_trace_question(message):
    """로트 추적 질문 처리"""
    # 로트 번호 추출
    lot_match = re.search(r'LOT[-\s]?[\d]+', message, re.IGNORECASE)
    if lot_match:
        lot_no = lot_match.group()
        trace_data = _trace_lot(lot_no, True)
        return {
            'answer': f"로트 {lot_no} 추적 결과입니다.",
            'trace_data': trace_data,
            'sources': ['lot_trace'],
            'confidence': 0.95
        }
    else:
        return {
            'answer': "로트 번호를 찾을 수 없습니다. 로트 번호를 포함하여 질문해주세요.",
            'sources': [],
            'confidence': 0.0
        }


def _handle_causal_question(message):
    """인과관계 분석 질문 처리"""
    issue = message
    result = _perform_causal_analysis(issue, '6m', 2)
    return {
        'answer': f"'{issue}'에 대한 원인 분석 결과입니다.",
        'analysis': result,
        'sources': ['causal_analysis'],
        'confidence': 0.85
    }


def _handle_ontology_question(message):
    """온톨로지 질문 처리"""
    # 검색어 추출
    search_term = message.replace('6m', '').replace('4m2e', '').replace('온톨로지', '').replace('ontology', '').strip()
    results = _search_ontology(search_term, '', 1)

    return {
        'answer': f"'{search_term}'에 대한 온톨로지 검색 결과입니다.",
        'results': results,
        'sources': ['ontology'],
        'confidence': 0.8
    }


def _handle_sql_question(message):
    """SQL 질문 처리"""
    sql_result = _generate_sql(message)

    return {
        'answer': f"질문에 대한 SQL 쿼리입니다.",
        'sql': sql_result['sql'],
        'explanation': sql_result['explanation'],
        'sources': ['text_to_sql'],
        'confidence': 0.75
    }


def _handle_general_question(message, module):
    """일반 질문 처리"""
    # 답변 생성 (간단 규칙 기반)
    response = {
        'answer': f"'{message}' 질문에 대한 답변을 준비 중입니다.",
        'related_queries': [
            '현재 KPI 현황은 어떻게 되나요?',
            '최근 품질 불량률 추이를 보여주세요',
            '로트 추적이 가능한가요?'
        ],
        'sources': ['general_knowledge'],
        'confidence': 0.5
    }

    return response


def _generate_sql(query):
    """
    텍스트를 SQL로 변환 (LLM 기반, SQL Guard 검증 포함).

    ai.text_to_sql_service.generate_sql()에 위임한다 — 실제 DB 스키마를 인지한
    Claude 기반 동적 SQL 생성이며, SELECT 전용 여부는 SQL Guard가 검증한다.
    LLM 호출이 실패(API 키 미설정 등)하면 result.safe=False로 반환되어
    호출측(text_to_sql 뷰)이 422로 응답하고 실행하지 않는다.
    """
    result = generate_sql_llm(query)
    return result.to_dict()


def _search_ontology(term, category, depth):
    """온톨로지 검색"""
    # 6M/4M2E 온톨로지 데이터 (간단 예시)
    ontology_data = {
        'man': [
            {'concept': '작업자', 'description': '생산 라인 근로자', 'related': ['숙련도', '교육']},
            {'concept': '숙련도', 'description': '작업자 기술 수준', 'related': ['작업자', '품질']},
            {'concept': '교육', 'description': '작업자 교육 상태', 'related': ['작업자', '안전']},
        ],
        'machine': [
            {'concept': '설비', 'description': '생산 설비', 'related': ['가동률', '보전']},
            {'concept': '가동률', 'description': '설비 가동률', 'related': ['설비', '생산량']},
            {'concept': '보전', 'description': '설비 보전', 'related': ['설비', '고장']},
        ],
        'material': [
            {'concept': '원자재', 'description': '생산 원자재', 'related': ['품질', '원가']},
            {'concept': '품질', 'description': '원자재 품질', 'related': ['원자재', '불량']},
        ],
        'method': [
            {'concept': '작업 표준', 'description': '표준 작업 방법', 'related': ['생산', '품질']},
            {'concept': '공정', 'description': '생산 공정', 'related': ['사이클타임', '품질']},
        ],
        'measurement': [
            {'concept': '검사', 'description': '품질 검사', 'related': ['불량률', 'CPK']},
            {'concept': '측정', 'description': '공정 측정', 'related': ['공정 능력', '정밀도']},
        ],
        'mother_nature': [
            {'concept': '온도', 'description': '공정 온도', 'related': ['습도', '품질']},
            {'concept': '습도', 'description': '공정 습도', 'related': ['온도', '품질']},
        ],
    }

    results = []
    for cat, concepts in ontology_data.items():
        if category and category != cat:
            continue

        for concept in concepts:
            if term.lower() in concept['concept'].lower() or term.lower() in concept['description'].lower():
                results.append({
                    'concept': concept['concept'],
                    'category': cat,
                    'description': concept['description'],
                    'related': concept['related']
                })

    return results


def _perform_causal_analysis(issue, analysis_type, depth):
    """인과관계 분석 수행"""
    # 간단 규칙 기반 인과관계 분석
    root_causes = []
    causal_chain = []
    recommendations = []

    if '불량' in issue or '품질' in issue:
        root_causes = [
            {'cause': '원자재 품질 변동', 'impact': 'high', 'probability': 0.7},
            {'cause': '설비 노후화', 'impact': 'medium', 'probability': 0.5},
            {'cause': '작업자 숙련도 부족', 'impact': 'medium', 'probability': 0.4},
        ]
        causal_chain = [
            {'step': 1, 'item': '원자재 품질 변동', 'result': '불량 발생'},
            {'step': 2, 'item': '공정 불안정', 'result': '치수 불량'},
            {'step': 3, 'item': '검사', 'result': '불량품 탐지'},
        ]
        recommendations = [
            {'priority': 'high', 'action': '원자재 입고 검사 강화', 'expected_impact': '불량률 30% 감소'},
            {'priority': 'medium', 'action': '설비 정비 주기 단축', 'expected_impact': '가동률 10% 개선'},
        ]
    elif '생산' in issue or '설비' in issue:
        root_causes = [
            {'cause': '설비 고장', 'impact': 'high', 'probability': 0.6},
            {'cause': '작업자 부족', 'impact': 'medium', 'probability': 0.5},
            {'cause': '원자재 지연', 'impact': 'medium', 'probability': 0.4},
        ]
        causal_chain = [
            {'step': 1, 'item': '설비 고장', 'result': '생산 중단'},
            {'step': 2, 'item': '가동률 저하', 'result': '생산 감소'},
            {'step': 3, 'item': '납기 지연', 'result': '고객 불만'},
        ]
        recommendations = [
            {'priority': 'high', 'action': '예방 보전 강화', 'expected_impact': '고장률 40% 감소'},
            {'priority': 'medium', 'action': '여유 인력 확보', 'expected_impact': '생산 안정화'},
        ]
    else:
        root_causes = [
            {'cause': '데이터 부족', 'impact': 'medium', 'probability': 0.5},
        ]
        causal_chain = []
        recommendations = [
            {'priority': 'low', 'action': '데이터 수집', 'expected_impact': '분석 정확도 향상'},
        ]

    return {
        'issue': issue,
        'analysis_type': analysis_type,
        'root_causes': root_causes,
        'causal_chain': causal_chain,
        'recommendations': recommendations
    }


def _trace_lot(lot_no, detail):
    """로트 추적 수행"""
    # 간단 예시 데이터
    trace_data = {
        'lot_no': lot_no,
        'trace_info': {
            'raw_materials': [
                {'material': '원료A', 'supplier': '공급사A', 'lot': 'MAT-2024-001', 'quantity': '500kg'}
            ],
            'production': [
                {'process': '혼합', 'line': 'LINE-001', 'date': '2024-12-01', 'operator': '홍길동'}
            ],
            'quality': [
                {'inspection': '입고검사', 'result': '합격', 'inspector': '김검사', 'date': '2024-12-02'}
            ],
            'equipment': [
                {'equipment': '혼합기1', 'status': '정상', 'utilization': '95%'}
            ],
            'workers': [
                {'worker': '홍길동', 'role': '작업자', 'shift': '주간'}
            ]
        },
        'timeline': [
            {'date': '2024-12-01', 'event': '원자재 입고', 'location': '창고'},
            {'date': '2024-12-02', 'event': '생산 시작', 'location': 'LINE-001'},
            {'date': '2024-12-03', 'event': '품질 검사', 'location': '검사실'},
            {'date': '2024-12-04', 'event': '완제품 입고', 'location': '제품창고'},
        ]
    }

    return trace_data
