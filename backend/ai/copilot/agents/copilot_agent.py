# -*- coding: utf-8 -*-
"""
CopilotAgent - AI Copilot 전용 에이전트
자연어 질의응답, drill-down, 요약 설명 기능 제공
"""
import logging
from typing import Dict, Any, List, Optional

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class CopilotAgent(BaseAgent):
    """
    AI Copilot 전용 에이전트

    자연어 질문을 처리하여 답변을 생성하고,
    기존 AgentOrchestrator와 연동하여 에이전트 체인을 실행합니다.
    """
    name = "CopilotAgent"
    description = "자연어 질의응답, drill-down, 요약 설명"
    version = "1.0.0"
    domain = "general"
    layer = "interface"
    requires_human_approval = False

    def __init__(self):
        super().__init__()
        # 기존 AgentOrchestrator 가져오기
        from ai.agent_orchestration_service import AgentOrchestrator
        self.orchestrator = AgentOrchestrator()

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return bool(agent_input.query)

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        자연어 질문을 처리하여 답변 생성

        Args:
            agent_input: 질문과 컨텍스트
                - query: 사용자 질문
                - context: 대화 컨텍스트 (이전 대화, 사용자 정보 등)
                - parameters: 추가 파라미터

        Returns:
            AgentOutput: 답변, 근거, 관련 질문, 에이전트 추적
        """
        query = agent_input.query
        context = agent_input.context or {}
        params = agent_input.parameters or {}

        logger.info(f"[CopilotAgent] Processing query: {query[:100]}...")

        try:
            # 기존 AgentOrchestrator 활용
            response = self.orchestrator.process_query(
                message=query,
                context=context,
                user=agent_input.requested_by
            )

            # 응답 상태 확인
            status = response.get('status', 'success')
            if status == 'error':
                return AgentOutput(
                    request_id=agent_input.request_id,
                    agent_name=self.name,
                    status='error',
                    result={
                        'answer': response.get('answer', '질문 처리 중 오류가 발생했습니다.'),
                        'error': response.get('error', ''),
                    },
                    evidence_refs=[],
                    confidence=0.0,
                    errors=[response.get('error', 'Unknown error')],
                )

            # AgentOutput 생성
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status=status,
                result={
                    'answer': response.get('answer', ''),
                    'summary': self._extract_summary(response),
                    'data_points': self._extract_data_points(response),
                    'insights': self._extract_insights(response),
                    'related_questions': response.get('related_queries', []),
                },
                evidence_refs=response.get('evidence', []),
                confidence=response.get('confidence', 0.0),
                recommendations=response.get('recommendations', []),
                warnings=response.get('warnings', []),
                metadata={
                    'agent_trace': response.get('agent_trace', []),
                    'query_analysis': response.get('metadata', {}).get('query_analysis', {}),
                    'total_execution_time_ms': response.get('metadata', {}).get('total_execution_time_ms', 0),
                }
            )

        except Exception as e:
            logger.error(f"[CopilotAgent] Error processing query: {e}", exc_info=True)
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='error',
                result={
                    'answer': f'죄송합니다. 질문 처리 중 오류가 발생했습니다: {str(e)}',
                },
                evidence_refs=[],
                confidence=0.0,
                errors=[str(e)],
            )

    def _extract_summary(self, response: Dict[str, Any]) -> str:
        """응답에서 요약 추출"""
        # agent_trace에서 첫 번째 성공적인 결과의 요약 사용
        agent_trace = response.get('agent_trace', [])
        for trace in agent_trace:
            if trace.get('status') == 'success':
                result_summary = trace.get('result_summary', '')
                if result_summary and result_summary != '완료':
                    return result_summary

        # answer의 첫 문장을 요약으로 사용
        answer = response.get('answer', '')
        if answer:
            first_sentence = answer.split('.')[0]
            return first_sentence[:200]

        return ''

    def _extract_data_points(self, response: Dict[str, Any]) -> List[str]:
        """응답에서 데이터 포인트 추출"""
        data_points = []

        # 에이전트 추적에서 데이터 포인트 추출
        agent_trace = response.get('agent_trace', [])
        for trace in agent_trace:
            if trace.get('status') == 'success':
                # 에이전트 결과에서 데이터 포인트 추출
                evidence_count = trace.get('evidence_count', 0)
                if evidence_count > 0:
                    data_points.append(f"{trace['agent_name']}: {evidence_count}개 근거")

        # 증거에서 데이터 포인트 추출
        evidence = response.get('evidence', [])
        for ev in evidence[:5]:  # 최대 5개
            description = ev.get('description', '')
            source = ev.get('source', ev.get('evidence_type', ''))
            if description:
                data_points.append(f"[{source}] {description}")

        return data_points

    def _extract_insights(self, response: Dict[str, Any]) -> List[str]:
        """응답에서 인사이트 추출"""
        insights = []

        # 추천사항을 인사이트로 변환
        recommendations = response.get('recommendations', [])
        for rec in recommendations[:3]:  # 최대 3개
            if isinstance(rec, dict):
                title = rec.get('title', '')
                if title:
                    insights.append(f"추천: {title}")
            elif isinstance(rec, str):
                insights.append(f"추천: {rec}")

        # 경고를 인사이트로 변환
        warnings = response.get('warnings', [])
        for warning in warnings[:2]:  # 최대 2개
            if warning:
                insights.append(f"주의: {warning}")

        return insights

    def post_execute(self, output: AgentOutput) -> AgentOutput:
        """실행 후 후처리"""
        output = super().post_execute(output)

        # 답변이 없으면 기본 메시지 제공
        if not output.result.get('answer'):
            output.result['answer'] = (
                "죄송합니다. 질문에 대한 답변을 찾을 수 없습니다. "
                "다른 방식으로 질문해 주시거나 관련 부서에 문의해 주세요."
            )
            output.warnings.append("관련 정보를 찾을 수 없음")

        # 관련 질문이 없으면 기본 질문 제공
        if not output.result.get('related_questions'):
            output.result['related_questions'] = self._get_default_related_questions()

        return output

    def _get_default_related_questions(self) -> List[str]:
        """기본 관련 질문 목록"""
        return [
            "현재 KPI 현황은 어떻게 되나요?",
            "최근 품질 불량률 추이를 보여주세요",
            "예산 대비 실적은 어떤가요?",
            "생산 라인 가동률을 알려주세요",
            "원가 편차 분석을 해주세요",
        ]


class DrillDownAgent(BaseAgent):
    """
    DrillDownAgent - 상세 분석용 에이전트

    특정 데이터 포인트나 이슈에 대해 상세 분석을 제공합니다.
    """
    name = "DrillDownAgent"
    description = "데이터 포인트 상세 분석, drill-down 제공"
    version = "1.0.0"
    domain = "general"
    layer = "interface"

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        params = agent_input.parameters
        return bool(params.get('target_type') and params.get('target_id'))

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        상세 분석 실행

        Args:
            agent_input:
                - target_type: 분석 대상 유형 (kpi, event, metric 등)
                - target_id: 분석 대상 ID
                - depth: 분석 깊이 (기본값: 1)
        """
        params = agent_input.parameters
        target_type = params.get('target_type')
        target_id = params.get('target_id')
        depth = params.get('depth', 1)

        logger.info(f"[DrillDownAgent] Drilling down {target_type}:{target_id} (depth={depth})")

        # 타입별 상세 분석
        if target_type == 'kpi':
            return self._drill_down_kpi(agent_input, target_id, depth)
        elif target_type == 'event':
            return self._drill_down_event(agent_input, target_id, depth)
        elif target_type == 'metric':
            return self._drill_down_metric(agent_input, target_id, depth)
        else:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='error',
                errors=[f"Unsupported target type: {target_type}"],
            )

    def _drill_down_kpi(self, agent_input: AgentInput, kpi_id: str, depth: int) -> AgentOutput:
        """KPI 상세 분석"""
        # KPI 모델 가져오기
        try:
            from ai.models import KPIDefinition
            kpi = KPIDefinition.objects.get(id=kpi_id)

            result = {
                'kpi_name': kpi.name,
                'current_value': kpi.current_value,
                'target_value': kpi.target_value,
                'achievement_rate': kpi.achievement_rate,
                'trend': self._get_kpi_trend(kpi),
                'breakdown': self._get_kpi_breakdown(kpi, depth),
            }

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='success',
                result=result,
                evidence_refs=[{
                    'evidence_type': 'data',
                    'source': 'kpi_fact',
                    'description': f"KPI: {kpi.name}",
                }],
                confidence=0.9,
            )

        except KPIDefinition.DoesNotExist:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='error',
                errors=[f"KPI not found: {kpi_id}"],
            )

    def _drill_down_event(self, agent_input: AgentInput, event_id: str, depth: int) -> AgentOutput:
        """이벤트 상세 분석"""
        try:
            from events.models import Event
            event = Event.objects.get(id=event_id)

            result = {
                'event_type': event.event_type,
                'severity': event.severity,
                'observed_value': event.observed_value,
                'threshold_value': event.threshold_value,
                'root_causes': self._get_event_root_causes(event, depth),
                'recommendations': self._get_event_recommendations(event),
            }

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='success',
                result=result,
                evidence_refs=[{
                    'evidence_type': 'event',
                    'source': 'event_log',
                    'description': f"Event: {event.event_type}",
                }],
                confidence=0.85,
            )

        except Event.DoesNotExist:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status='error',
                errors=[f"Event not found: {event_id}"],
            )

    def _drill_down_metric(self, agent_input: AgentInput, metric_id: str, depth: int) -> AgentOutput:
        """메트릭 상세 분석"""
        # TODO: 메트릭 상세 분석 구현
        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status='success',
            result={
                'metric_id': metric_id,
                'message': 'Metric drill-down not yet implemented',
            },
            confidence=0.5,
        )

    def _get_kpi_trend(self, kpi) -> Dict[str, Any]:
        """KPI 추이 데이터"""
        # TODO: 실제 추이 데이터 계산
        return {
            'direction': 'up',  # up, down, stable
            'change_rate': 5.2,
            'period': '7일',
        }

    def _get_kpi_breakdown(self, kpi, depth: int) -> List[Dict[str, Any]]:
        """KPI 상세 분해"""
        # TODO: 실제 분해 데이터 계산
        return [
            {'factor': '요인1', 'value': 100, 'contribution': '50%'},
            {'factor': '요인2', 'value': 80, 'contribution': '40%'},
            {'factor': '기타', 'value': 20, 'contribution': '10%'},
        ]

    def _get_event_root_causes(self, event, depth: int) -> List[Dict[str, Any]]:
        """이벤트 근본 원인 분석"""
        # TODO: 실제 근본 원인 분석
        return [
            {'cause': '원인1', 'confidence': 0.8},
            {'cause': '원인2', 'confidence': 0.6},
        ]

    def _get_event_recommendations(self, event) -> List[Dict[str, Any]]:
        """이벤트 권고사항"""
        # TODO: 실제 권고사항 생성
        return [
            {'title': '권고1', 'priority': 'high'},
            {'title': '권고2', 'priority': 'medium'},
        ]
