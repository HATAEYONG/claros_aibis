# -*- coding: utf-8 -*-
"""
AI 채팅 및 분석 서비스 (에이전트 오케스트레이션 기반)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from django.db import connection
from datetime import datetime
import json
import re
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_chat_enhanced(request):
    """
    AI 챗봇 엔드포인트 (에이전트 오케스트레이션 기반)

    자연어 질문을 분석하여 적절한 에이전트에 라우팅하고
    증거 기반의 응답을 생성합니다.

    Request Body:
    {
        "message": "질문 내용",
        "context": {...},      // 선택적: 대화 컨텍스트
        "user": "사용자",      // 선택적: 사용자 정보
        "use_agents": true     // 선택적: 에이전트 사용 여부 (기본값: true)
    }

    Response:
    {
        "answer": "답변 내용",
        "status": "success|partial|error|no_results",
        "confidence": float,
        "agent_trace": [...],      // 에이전트 실행 추적
        "evidence": [...],         // 증거 목록
        "related_queries": [...],  // 관련 질문
        "recommendations": [...],  // 추천사항
        "warnings": [...],         // 경고 메시지
        "metadata": {...}          // 추가 메타데이터
    }
    """
    message = request.data.get('message', '').strip()
    context = request.data.get('context', {})
    user = request.data.get('user', request.user.username if hasattr(request, 'user') else 'anonymous')
    use_agents = request.data.get('use_agents', True)

    if not message:
        return Response(
            {'error': 'message 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        if use_agents:
            # 에이전트 오케스트레이션 사용
            from ai.agent_orchestration_service import AgentOrchestrator

            orchestrator = AgentOrchestrator()
            result = orchestrator.process_query(
                message=message,
                context=context,
                user=user
            )

            # 기존 호환성을 위해 소스 필드 추가
            if result.get('evidence'):
                result['sources'] = [
                    e.get('source', e.get('source_agent', 'unknown'))
                    for e in result['evidence']
                ]

            return Response(result)
        else:
            # 기존 규칙 기반 처리
            return _handle_with_legacy_logic(message, context, user)

    except Exception as e:
        logger.exception(f"AI chat processing failed: {e}")
        return Response(
            {
                'answer': f"죄송합니다. 질문 처리 중 오류가 발생했습니다: {str(e)}",
                'status': 'error',
                'confidence': 0.0,
                'agent_trace': [],
                'evidence': [],
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def agent_execute(request):
    """
    특정 에이전트 직접 실행 엔드포인트

    Request Body:
    {
        "agent_name": "에이전트명",
        "query": "쿼리",
        "parameters": {...},
        "context": {...}
    }

    Response:
    {
        "agent_name": "에이전트명",
        "status": "success",
        "result": {...},
        "confidence": float,
        "evidence": [...],
        "execution_time_ms": int
    }
    """
    agent_name = request.data.get('agent_name', '').strip()
    query = request.data.get('query', '').strip()
    parameters = request.data.get('parameters', {})
    context = request.data.get('context', {})

    if not agent_name:
        return Response(
            {'error': 'agent_name 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not query:
        return Response(
            {'error': 'query 파라미터가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        from ai.agents.base.registry import registry
        from ai.agents.base.agent import AgentInput

        # 에이전트 조회
        agent = registry.get(agent_name)
        if not agent:
            available_agents = [a['name'] for a in registry.list_agents()]
            return Response(
                {
                    'error': f'에이전트를 찾을 수 없습니다: {agent_name}',
                    'available_agents': available_agents,
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # 에이전트 입력 생성
        agent_input = AgentInput(
            query=query,
            context=context,
            parameters=parameters,
            evidence_required=True,
            requested_by=request.user.username if hasattr(request, 'user') else 'api',
        )

        # 에이전트 실행
        output = agent.run(agent_input)

        return Response({
            'agent_name': agent_name,
            'status': output.status,
            'result': output.result,
            'confidence': output.confidence,
            'evidence': output.evidence_refs,
            'recommendations': output.recommendations,
            'warnings': output.warnings,
            'errors': output.errors,
            'execution_time_ms': output.execution_time_ms,
            'metadata': output.metadata,
        })

    except Exception as e:
        logger.exception(f"Agent execution failed: {e}")
        return Response(
            {
                'agent_name': agent_name,
                'status': 'error',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def agent_registry(request):
    """
    등록된 에이전트 목록 조회 엔드포인트

    Response:
    {
        "total_count": int,
        "agents": [
            {
                "name": "에이전트명",
                "version": "버전",
                "domain": "도메인",
                "layer": "계층",
                "description": "설명",
                "requires_human_approval": bool
            },
            ...
        ]
    }
    """
    try:
        from ai.agents.base.registry import registry

        agents = registry.list_agents()

        # 도메인별 그룹화
        by_domain = {}
        for agent in agents:
            domain = agent['domain']
            if domain not in by_domain:
                by_domain[domain] = []
            by_domain[domain].append(agent)

        # 계층별 그룹화
        by_layer = {}
        for agent in agents:
            layer = agent['layer']
            if layer not in by_layer:
                by_layer[layer] = []
            by_layer[layer].append(agent)

        return Response({
            'total_count': len(agents),
            'agents': agents,
            'by_domain': by_domain,
            'by_layer': by_layer,
        })

    except Exception as e:
        logger.exception(f"Agent registry query failed: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def agent_execution_history(request):
    """
    에이전트 실행 이력 조회 엔드포인트

    Query Parameters:
    - agent_name: 에이전트명 (선택)
    - limit: 반환 건수 (기본값: 20)
    - status: 상태 필터 (success, error, partial)

    Response:
    {
        "total_count": int,
        "executions": [...]
    }
    """
    agent_name = request.query_params.get('agent_name', '')
    limit = int(request.query_params.get('limit', 20))
    status_filter = request.query_params.get('status', '')

    try:
        from ai.models import AgentRunLog
        from django.db.models import Q

        queryset = AgentRunLog.objects.all()

        if agent_name:
            queryset = queryset.filter(agent_name__icontains=agent_name)

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        executions = queryset.order_by('-created_at')[:limit]

        execution_list = []
        for exec_log in executions:
            execution_list.append({
                'request_id': str(exec_log.request_id),
                'agent_name': exec_log.agent_name,
                'agent_version': exec_log.agent_version,
                'agent_layer': exec_log.agent_layer,
                'agent_domain': exec_log.agent_domain,
                'status': exec_log.status,
                'confidence': float(exec_log.confidence) if exec_log.confidence else None,
                'execution_time_ms': exec_log.execution_time_ms,
                'has_evidence': exec_log.has_evidence,
                'created_at': exec_log.created_at.isoformat() if exec_log.created_at else None,
                'parent_run_id': str(exec_log.parent_run_id) if exec_log.parent_run_id else None,
            })

        return Response({
            'total_count': queryset.count(),
            'executions': execution_list,
        })

    except Exception as e:
        logger.exception(f"Execution history query failed: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== 기존 호환성을 위한 레거시 함수들 ====================

def _handle_with_legacy_logic(message: str, context: dict, user: str) -> Response:
    """기존 규칙 기반 로직으로 처리 (호환성 유지)"""
    # AI 질문 유형 분석
    question_type = _analyze_question_type(message)

    # 질문 유형별 처리
    if question_type == 'kpi':
        result = _handle_kpi_question(message, context.get('module', 'all'))
    elif question_type == 'lot_trace':
        result = _handle_lot_trace_question(message)
    elif question_type == 'causal':
        result = _handle_causal_question(message)
    elif question_type == 'ontology':
        result = _handle_ontology_question(message)
    elif question_type == 'sql':
        result = _handle_sql_question(message)
    else:
        result = _handle_general_question(message, context.get('module', 'all'))

    # 에이전트 포맷으로 변환
    result['status'] = 'success' if result.get('confidence', 0) > 0.5 else 'partial'
    result['agent_trace'] = [{
        'agent_name': 'LegacyChatBot',
        'agent_domain': 'general',
        'status': result['status'],
        'confidence': result.get('confidence', 0.5),
    }]
    result['evidence'] = result.get('sources', [])
    result['warnings'] = []
    result['recommendations'] = []

    return Response(result)


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
    """텍스트를 SQL로 변환"""
    query_lower = query.lower()

    # 간단한 패턴 매칭 기반 SQL 생성
    sql = "SELECT * FROM data WHERE 1=1"
    explanation = ""

    if '매출' in query or 'revenue' in query_lower:
        sql = "SELECT fiscal_year, fiscal_month, SUM(actual_amount) as total_sales FROM sales_monthlysales"
        explanation = "월별 매출 집계를 조회합니다."

        if '올해' in query or '이번해' in query:
            current_year = datetime.now().year
            sql += f" WHERE fiscal_year = {current_year}"
            explanation += f" 올해({current_year}) 데이터를 조회합니다."

    elif '생산' in query or 'production' in query_lower:
        sql = "SELECT production_date, SUM(actual_quantity) as total_production FROM production_dailyproduction"
        explanation = "일일 생산 실적을 조회합니다."

        if '오늘' in query:
            sql += f" WHERE production_date = '{datetime.now().date()}'"
            explanation += " 오늘의 생산 실적을 조회합니다."

    elif '품질' in query or 'quality' in query_lower:
        sql = "SELECT inspection_date, result, COUNT(*) as count FROM quality_qualityinspection"
        explanation = "품질 검사 결과를 조회합니다."

        if '불량' in query:
            sql += " WHERE result = 'fail'"
            explanation += " 불량 검사 결과만 조회합니다."

    else:
        sql = "SELECT * FROM data LIMIT 10"
        explanation = "데이터를 조회합니다. (상위 10건)"

    return {'sql': sql, 'explanation': explanation}


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
