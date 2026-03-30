# -*- coding: utf-8 -*-
"""
AI Copilot용 에이전트 오케스트레이션 서비스
자연어 질문을 분석하여 적절한 에이전트에 라우팅하고 응답을 생성
"""
import logging
import uuid
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from django.db.models import Q
from django.utils import timezone

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.agents.base.registry import registry

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    AI Copilot용 에이전트 오케스트레이터
    자연어 질문을 분석하여 적절한 에이전트에 라우팅하고 결과를 통합
    """

    def __init__(self):
        self.query_analyzer = QueryAnalyzer()
        self.response_builder = ResponseBuilder()

    def process_query(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        user: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        자연어 쿼리를 처리하여 에이전트 응답 생성

        Args:
            message: 사용자 질문
            context: 대화 컨텍스트
            user: 사용자 정보

        Returns:
            통합 응답 (answer, evidence, agent_trace, related_queries)
        """
        request_id = str(uuid.uuid4())
        context = context or {}

        try:
            # 1. 질문 분석
            query_analysis = self.query_analyzer.analyze(message, context)
            logger.info(f"Query analysis: {query_analysis}")

            # 2. 적절한 에이전트 선택
            selected_agents = self._select_agents(query_analysis)
            logger.info(f"Selected {len(selected_agents)} agents: {[a.name for a in selected_agents]}")

            # 3. 에이전트 실행 및 결과 수집
            agent_results = []
            execution_trace = []

            for agent in selected_agents:
                agent_input = AgentInput(
                    request_id=str(uuid.uuid4()),
                    query=message,
                    context={
                        **context,
                        'query_analysis': query_analysis,
                        'original_request_id': request_id,
                    },
                    parameters=query_analysis.get('parameters', {}),
                    evidence_required=True,
                    requested_by=user or 'copilot',
                    domain=query_analysis.get('domain'),
                )

                # 에이전트 실행
                trace_entry = {
                    'agent_name': agent.name,
                    'agent_domain': agent.domain,
                    'agent_layer': agent.layer,
                    'started_at': timezone.now().isoformat(),
                    'status': 'running',
                }
                execution_trace.append(trace_entry)

                try:
                    output = agent.run(agent_input)
                    trace_entry['status'] = output.status
                    trace_entry['confidence'] = output.confidence
                    trace_entry['execution_time_ms'] = output.execution_time_ms
                    trace_entry['completed_at'] = timezone.now().isoformat()

                    if output.status == 'success':
                        agent_results.append({
                            'agent': agent,
                            'output': output,
                            'trace': trace_entry,
                        })
                except Exception as e:
                    trace_entry['status'] = 'error'
                    trace_entry['error'] = str(e)
                    trace_entry['completed_at'] = timezone.now().isoformat()
                    logger.error(f"Agent {agent.name} execution failed: {e}")

            # 4. 응답 빌딩
            response = self.response_builder.build(
                message=message,
                query_analysis=query_analysis,
                agent_results=agent_results,
                execution_trace=execution_trace,
                context=context,
            )

            return response

        except Exception as e:
            logger.exception(f"Query processing failed: {e}")
            return {
                'answer': f"죄송합니다. 질문 처리 중 오류가 발생했습니다: {str(e)}",
                'status': 'error',
                'confidence': 0.0,
                'agent_trace': [],
                'evidence': [],
                'related_queries': [],
                'error': str(e),
            }

    def _select_agents(self, query_analysis: Dict[str, Any]) -> List[BaseAgent]:
        """쿼리 분석 결과를 기반으로 적절한 에이전트 선택"""
        selected = []

        query_type = query_analysis.get('type', 'general')
        domain = query_analysis.get('domain')
        intent = query_analysis.get('intent', 'query')

        # 1. 도메인별 에이전트 우선 선택
        if domain:
            domain_agents = registry.get_by_domain(domain)
            selected.extend(domain_agents)

        # 2. 쿼리 타입별 에이전트 선택
        if query_type == 'kpi':
            selected.extend(registry.get_by_name_pattern(r'.*KPI.*'))
        elif query_type == 'forecast':
            selected.extend(registry.get_by_name_pattern(r'.*Forecast.*'))
        elif query_type == 'root_cause':
            selected.extend(registry.get_by_name_pattern(r'.*RootCause.*'))
        elif query_type == 'variance':
            selected.extend(registry.get_by_name_pattern(r'.*Variance.*'))
        elif query_type == 'scenario':
            selected.extend(registry.get_by_name_pattern(r'.*Scenario.*'))
        elif query_type == 'risk':
            selected.extend(registry.get_by_name_pattern(r'.*Risk.*'))
        elif query_type == 'recommendation':
            selected.extend(registry.get_by_name_pattern(r'.*Recommendation.*'))

        # 3. 의도별 에이전트 선택
        if intent == 'decision':
            selected.extend(registry.get_by_layer('decision'))
        elif intent == 'monitor':
            selected.extend(registry.get_by_layer('monitoring'))

        # 4. 중복 제거 및 우선순위 정렬
        seen = set()
        unique_agents = []
        for agent in selected:
            agent_key = (agent.name, agent.domain)
            if agent_key not in seen:
                seen.add(agent_key)
                unique_agents.append(agent)

        # 우선순위: 모니터링 > 도메인 지능 > 분석 > 의사결정 > 학습
        layer_priority = {
            'monitoring': 1,
            'domain': 2,
            'intelligence': 2,
            'analysis': 3,
            'decision': 4,
            'learning': 5,
        }

        unique_agents.sort(key=lambda a: layer_priority.get(a.layer, 99))

        return unique_agents[:5]  # 최대 5개 에이전트만 실행


class QueryAnalyzer:
    """자연어 쿼리 분석기"""

    # 도메인 키워드 매핑
    DOMAIN_KEYWORDS = {
        'cost': ['원가', 'cost', '비용', '단가', '차이', 'variance'],
        'financial': ['재무', 'financial', '매출', '이익', '예산', '현금', 'cashflow', 'budget'],
        'purchase': ['구매', 'purchase', '공급', 'supplier', '발주', '재고', 'inventory'],
        'production': ['생산', 'production', '설비', 'equipment', '가동', '라인', 'line', '작업'],
        'quality': ['품질', 'quality', '불량', 'defect', '검사', 'inspection', 'CAPA', '규격'],
        'sales': ['영업', 'sales', '판매', '고객', 'customer', '주문', 'order'],
        'hr': ['인사', 'hr', '직원', 'employee', '교육', 'training'],
    }

    # 쿼리 타입 키워드 매핑
    QUERY_TYPE_KEYWORDS = {
        'kpi': ['kpi', '지표', '성과', '달성율', '현황', 'status'],
        'forecast': ['예측', 'forecast', '전망', 'projection', '예상'],
        'root_cause': ['원인', 'root cause', '왜', 'why', '분석', 'analysis'],
        'variance': ['차이', 'variance', '차액', '실적', 'budget', '예산'],
        'scenario': ['시나리오', 'scenario', 'what-if', '가정'],
        'risk': ['위험', 'risk', '리스크', '이슈', 'issue', 'alert', '경고'],
        'recommendation': ['추천', 'recommendation', '제안', 'suggestion', '조언'],
        'lot_trace': ['로트', 'lot', '추적', 'trace', 'tracking'],
    }

    # 의도 키워드 매핑
    INTENT_KEYWORDS = {
        'query': ['?', '어떻게', '얼마', '몇', '보여줘', '알려줘', 'what', 'how', 'show'],
        'decision': ['결정', 'decide', '선택', 'choose', '승인', 'approve'],
        'monitor': ['모니터', 'monitor', '확인', 'check', '감시'],
        'action': ['실행', 'execute', '처리', 'process', '진행'],
    }

    def analyze(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        자연어 메시지 분석

        Returns:
            {
                'type': 쿼리 타입,
                'domain': 도메인,
                'intent': 의도,
                'entities': 추출된 엔티티,
                'parameters': 추출된 파라미터,
                'confidence': 분석 신뢰도,
            }
        """
        message_lower = message.lower()

        # 도메인 식별
        domain = self._identify_domain(message_lower)

        # 쿼리 타입 식별
        query_type = self._identify_query_type(message_lower)

        # 의도 식별
        intent = self._identify_intent(message_lower)

        # 엔티티 추출
        entities = self._extract_entities(message)

        # 파라미터 추출
        parameters = self._extract_parameters(message, entities, context)

        # 신뢰도 계산
        confidence = self._calculate_confidence(domain, query_type, intent, entities)

        return {
            'type': query_type,
            'domain': domain,
            'intent': intent,
            'entities': entities,
            'parameters': parameters,
            'confidence': confidence,
        }

    def _identify_domain(self, message: str) -> Optional[str]:
        """도메인 식별"""
        for domain, keywords in self.DOMAIN_KEYWORDS.items():
            if any(keyword in message for keyword in keywords):
                return domain
        return None

    def _identify_query_type(self, message: str) -> str:
        """쿼리 타입 식별"""
        for query_type, keywords in self.QUERY_TYPE_KEYWORDS.items():
            if any(keyword in message for keyword in keywords):
                return query_type
        return 'general'

    def _identify_intent(self, message: str) -> str:
        """의도 식별"""
        for intent, keywords in self.INTENT_KEYWORDS.items():
            if any(keyword in message for keyword in keywords):
                return intent
        return 'query'

    def _extract_entities(self, message: str) -> Dict[str, Any]:
        """엔티티 추출"""
        entities = {
            'dates': [],
            'numbers': [],
            'product_codes': [],
            'lot_numbers': [],
        }

        # 날짜 추출
        date_patterns = [
            r'(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})',  # YYYY-MM-DD
            r'오늘|today|이번주|이번달|올해|this week|this month|this year',
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, message)
            entities['dates'].extend(matches)

        # 숫자 추출
        numbers = re.findall(r'\d+(?:\.\d+)?', message)
        entities['numbers'] = [float(n) for n in numbers]

        # 로트 번호 추출
        lot_matches = re.findall(r'LOT[-\s]?[\w\d]+', message, re.IGNORECASE)
        entities['lot_numbers'] = lot_matches

        # 제품 코드 추출 (간단 패턴)
        product_matches = re.findall(r'[A-Z]{2,}[-]?\d{3,}', message)
        entities['product_codes'] = product_matches

        return entities

    def _extract_parameters(
        self,
        message: str,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """파라미터 추출"""
        params = {}

        # 시간 범위 추출
        if '오늘' in message or 'today' in message.lower():
            params['time_range'] = 'today'
        elif '이번주' in message or 'this week' in message.lower():
            params['time_range'] = 'week'
        elif '이번달' in message or 'this month' in message.lower():
            params['time_range'] = 'month'
        elif '올해' in message or 'this year' in message.lower():
            params['time_range'] = 'year'
        else:
            params['time_range'] = context.get('time_range', 'month')

        # 제한 설정
        limit_match = re.search(r'상위\s*(\d+)', message)
        if limit_match:
            params['limit'] = int(limit_match.group(1))
        else:
            params['limit'] = context.get('limit', 10)

        # 정렬
        if '최신' in message or 'latest' in message.lower():
            params['order'] = '-created_at'
        elif '높은' in message or 'highest' in message.lower():
            params['order'] = '-value'
        elif '낮은' in message or 'lowest' in message.lower():
            params['order'] = 'value'

        return params

    def _calculate_confidence(
        self,
        domain: Optional[str],
        query_type: str,
        intent: str,
        entities: Dict[str, Any]
    ) -> float:
        """분석 신뢰도 계산"""
        confidence = 0.5  # 기본 신뢰도

        if domain:
            confidence += 0.2

        if query_type != 'general':
            confidence += 0.15

        if intent != 'query':
            confidence += 0.1

        # 엔티티가 있으면 신뢰도 증가
        entity_count = sum(len(v) for v in entities.values())
        confidence += min(entity_count * 0.05, 0.2)

        return min(confidence, 1.0)


class ResponseBuilder:
    """에이전트 결과 통합 응답 빌더"""

    def build(
        self,
        message: str,
        query_analysis: Dict[str, Any],
        agent_results: List[Dict[str, Any]],
        execution_trace: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        에이전트 결과를 통합하여 최종 응답 생성

        Returns:
            {
                'answer': str,
                'status': str,
                'confidence': float,
                'agent_trace': list,
                'evidence': list,
                'related_queries': list,
                'recommendations': list,
                'warnings': list,
            }
        """
        if not agent_results:
            return self._build_no_results_response(message, query_analysis)

        # 1. 답변 생성
        answer = self._build_answer(message, query_analysis, agent_results)

        # 2. 증거 수집
        evidence = self._collect_evidence(agent_results)

        # 3. 에이전트 추적 생성
        agent_trace = self._build_agent_trace(agent_results, execution_trace)

        # 4. 관련 질문 생성
        related_queries = self._generate_related_queries(
            message, query_analysis, agent_results
        )

        # 5. 추천사항 수집
        recommendations = self._collect_recommendations(agent_results)

        # 6. 경고 수집
        warnings = self._collect_warnings(agent_results)

        # 7. 신뢰도 계산
        confidence = self._calculate_overall_confidence(agent_results)

        # 8. 상태 결정
        status = self._determine_status(agent_results)

        return {
            'answer': answer,
            'status': status,
            'confidence': confidence,
            'agent_trace': agent_trace,
            'evidence': evidence,
            'related_queries': related_queries,
            'recommendations': recommendations,
            'warnings': warnings,
            'metadata': {
                'query_analysis': query_analysis,
                'agents_executed': len(agent_results),
                'total_execution_time_ms': sum(
                    r['output'].execution_time_ms for r in agent_results
                ),
            },
        }

    def _build_no_results_response(
        self,
        message: str,
        query_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """에이전트 결과가 없을 때의 응답"""
        return {
            'answer': f"'{message}' 질문에 대한 정보를 찾을 수 없습니다. "
                     f"다른 방식으로 질문해 주시거나 관련 부서에 문의해 주세요.",
            'status': 'no_results',
            'confidence': 0.0,
            'agent_trace': [],
            'evidence': [],
            'related_queries': self._generate_generic_related_queries(query_analysis),
            'recommendations': [],
            'warnings': ['관련 에이전트를 찾을 수 없습니다.'],
        }

    def _build_answer(
        self,
        message: str,
        query_analysis: Dict[str, Any],
        agent_results: List[Dict[str, Any]]
    ) -> str:
        """답변 생성"""
        # 가장 높은 신뢰도를 가진 에이전트 결과 선택
        primary_result = max(agent_results, key=lambda r: r['output'].confidence)
        output = primary_result['output']

        # 기본 답변
        answer_parts = []

        # 결과 요약
        if output.result.get('summary'):
            answer_parts.append(output.result['summary'])

        # 주요 데이터 포인트
        if output.result.get('data_points'):
            data_points = output.result['data_points']
            if isinstance(data_points, list) and data_points:
                answer_parts.append("주요 내용:")
                for i, point in enumerate(data_points[:5], 1):
                    answer_parts.append(f"  {i}. {point}")

        # 인사이트
        if output.result.get('insights'):
            insights = output.result['insights']
            if isinstance(insights, list) and insights:
                answer_parts.append("\n인사이트:")
                for insight in insights[:3]:
                    answer_parts.append(f"  - {insight}")

        return "\n".join(answer_parts) if answer_parts else output.result.get('answer', '')

    def _collect_evidence(self, agent_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """증거 수집"""
        evidence = []

        for result in agent_results:
            output = result['output']
            agent = result['agent']

            # 에이전트의 증거 참조 추가
            for ref in output.evidence_refs:
                evidence.append({
                    **ref,
                    'source_agent': agent.name,
                    'source_domain': agent.domain,
                })

            # 결과 데이터에서 증거 추출
            if output.result.get('sources'):
                for source in output.result['sources']:
                    evidence.append({
                        'evidence_type': 'data_source',
                        'source': source.get('name', source),
                        'description': source.get('description', ''),
                        'source_agent': agent.name,
                    })

        return evidence

    def _build_agent_trace(
        self,
        agent_results: List[Dict[str, Any]],
        execution_trace: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """에이전트 실행 추적 생성"""
        trace = []

        for i, result in enumerate(agent_results):
            output = result['output']
            agent = result['agent']
            exec_trace = result['trace']

            trace.append({
                'sequence': i + 1,
                'agent_name': agent.name,
                'agent_domain': agent.domain,
                'agent_layer': agent.layer,
                'status': output.status,
                'confidence': output.confidence,
                'execution_time_ms': output.execution_time_ms,
                'started_at': exec_trace.get('started_at'),
                'completed_at': exec_trace.get('completed_at'),
                'result_summary': self._summarize_result(output.result),
                'evidence_count': len(output.evidence_refs),
            })

        return trace

    def _summarize_result(self, result: Dict[str, Any]) -> str:
        """결과 요약"""
        if result.get('summary'):
            summary = result['summary']
            # 문자열인 경우만 슬라이스 적용
            if isinstance(summary, str):
                return summary[:100]
            # 딕셔너리나 리스트인 경우 문자열로 변환
            return str(summary)[:100]

        if result.get('answer'):
            answer = result['answer']
            if isinstance(answer, str):
                return answer[:100]
            return str(answer)[:100]

        if result.get('data_points'):
            return f"{len(result['data_points'])}개 데이터 포인트"

        return "완료"

    def _generate_related_queries(
        self,
        message: str,
        query_analysis: Dict[str, Any],
        agent_results: List[Dict[str, Any]]
    ) -> List[str]:
        """관련 질문 생성"""
        queries = []

        query_type = query_analysis.get('type')
        domain = query_analysis.get('domain')

        # 쿼리 타입별 관련 질문
        if query_type == 'kpi':
            queries = [
                "상세 KPI 현황을 보여주세요",
                "KPI 추이를 분석해주세요",
                "KPI 달성을 위한 제안을 주세요",
            ]
        elif query_type == 'forecast':
            queries = [
                "다음 달 예측 결과는?",
                "예측 정확도는 어느 정도인가요?",
                "더 정확한 예측을 위한 요인은?",
            ]
        elif query_type == 'root_cause':
            queries = [
                "근본 원인에 대한 상세 분석",
                "원인 해결을 위한 추천 사항",
                "유사한 문제의 과거 이력",
            ]

        # 도메인별 관련 질문
        if domain == 'financial':
            queries.extend([
                "예산 대비 실적은 어떤가요?",
                "현금흐름 현황을 보여주세요",
            ])
        elif domain == 'quality':
            queries.extend([
                "불품 원인 분석",
                "CAPA 현황 확인",
            ])

        # 에이전트 결과에서 추가 질문 추출
        for result in agent_results:
            output = result['output']
            if output.result.get('related_questions'):
                queries.extend(output.result['related_questions'][:3])

        return list(set(queries))[:5]

    def _generate_generic_related_queries(self, query_analysis: Dict[str, Any]) -> List[str]:
        """일반적인 관련 질문 생성"""
        return [
            "현재 KPI 현황은 어떻게 되나요?",
            "최근 품질 불량률 추이를 보여주세요",
            "예산 대비 실적은 어떤가요?",
            "생산 라인 가동률을 알려주세요",
        ]

    def _collect_recommendations(self, agent_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """추천사항 수집"""
        recommendations = []

        for result in agent_results:
            output = result['output']
            agent = result['agent']

            # 에이전트의 추천사항
            for rec in output.recommendations:
                recommendations.append({
                    **rec,
                    'source_agent': agent.name,
                })

            # 결과에서 추천사항 추출
            if output.result.get('recommendations'):
                for rec in output.result['recommendations']:
                    recommendations.append({
                        **rec,
                        'source_agent': agent.name,
                    })

        # 우선순위 정렬
        priority_order = {'urgent': 1, 'high': 2, 'medium': 3, 'low': 4}
        recommendations.sort(key=lambda r: priority_order.get(r.get('priority', 'low'), 99))

        return recommendations[:5]

    def _collect_warnings(self, agent_results: List[Dict[str, Any]]) -> List[str]:
        """경고 메시지 수집"""
        warnings = []

        for result in agent_results:
            output = result['output']

            # 에이전트 경고
            warnings.extend(output.warnings)

            # 결과에서 경고 추출
            if output.result.get('warnings'):
                warnings.extend(output.result['warnings'])

            # 에러 메시지
            for error in output.errors:
                warnings.append(f"오류: {error}")

        return list(set(warnings))[:5]

    def _calculate_overall_confidence(self, agent_results: List[Dict[str, Any]]) -> float:
        """전체 신뢰도 계산"""
        if not agent_results:
            return 0.0

        # 가중 평균 (실행 시간이 짧을수록 더 신뢰)
        confidences = []
        weights = []

        for result in agent_results:
            output = result['output']
            weight = 1.0 / max(output.execution_time_ms, 1)  # 실행 시간 역수
            confidences.append(output.confidence)
            weights.append(weight)

        total_weight = sum(weights)
        if total_weight == 0:
            return sum(confidences) / len(confidences)

        return sum(c * w for c, w in zip(confidences, weights)) / total_weight

    def _determine_status(self, agent_results: List[Dict[str, Any]]) -> str:
        """전체 상태 결정"""
        if not agent_results:
            return 'no_results'

        # 모두 성공이면 success
        if all(r['output'].status == 'success' for r in agent_results):
            return 'success'

        # 하나라도 성공이면 partial
        if any(r['output'].status == 'success' for r in agent_results):
            return 'partial'

        # 모두 실패이면 error
        return 'error'
