"""
추천 에이전트
분석 결과를 바탕으로 실행 가능한 추천사항 생성
증거 기반 추천 지원
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta, date

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import Recommendation, AgentRunLog
from django.utils import timezone

logger = logging.getLogger(__name__)


class RecommendationAgent(BaseAgent):
    """
    추천 에이전트
    분석 결과를 바탕으로 실행 가능한 추천사항 생성

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 의사결정 레이어
    """

    # 에이전트 메타데이터
    agent_type = "recommendation"
    agent_name = "RecommendationAgent"
    agent_description = "실행 가능한 증거 기반 추천사항 생성"
    agent_domain = "general"
    agent_layer = "decision"  # L5: Decision

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.parameters.get('root_causes') and not input_data.parameters.get('findings'):
            logger.warning("root_causes 또는 findings 파라미터가 없습니다.")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        추천 생성 실행

        Args:
            input_data: {
                'context': {
                    'domain': str,  # 도메인
                    'analysis_type': str,  # 분석 유형
                },
                'parameters': {
                    'root_causes': List[Dict],  # 근본 원인
                    'findings': List[Dict],  # 발견사항
                    'context': Dict,  # 추가 컨텍스트
                    'event_ids': List[str],  # 관련 이벤트 ID
                    'kpis': List[Dict],  # 관련 KPI
                }
            }
        """
        params = input_data.parameters
        context = input_data.context

        try:
            # 증거 수집
            evidence = self._collect_evidence(
                params=params,
                context=context,
                agent_input=input_data
            )

            # 추천 생성
            recommendations = self._generate_recommendations(
                analysis_type=context.get('analysis_type', 'general'),
                root_causes=params.get("root_causes", []),
                findings=params.get("findings", []),
                context=params.get("context", {}),
                evidence=evidence,
                agent_input=input_data
            )

            # 결과 생성
            result_data = {
                'recommendation_count': len(recommendations),
                'evidence_summary': self._generate_evidence_summary(evidence),
                'recommendations': [
                    {
                        'recommendation_id': str(r.recommendation_id),
                        'title': r.title,
                        'description': r.description,
                        'priority': r.priority,
                        'domain': r.domain,
                        'impact_area': r.impact_area,
                        'evidence_count': len(r.evidence_refs),
                        'action_item_count': len(r.action_items),
                        'estimated_impact': r.estimated_impact,
                    }
                    for r in recommendations
                ]
            }

            # 증거 레퍼런스 생성
            evidence_refs = []
            for rec in recommendations:
                evidence_refs.extend([
                    self.create_evidence_ref(
                        source_type='recommendation',
                        source_id=str(rec.recommendation_id),
                        description=f"추천: {rec.title}"
                    )
                ])

                # 추천의 증거 레퍼런스도 포함
                for ev in rec.evidence_refs:
                    evidence_refs.append(
                        self.create_evidence_ref(
                            source_type=ev.get('type', 'evidence'),
                            source_id=ev.get('id', ''),
                            description=ev.get('description', '')
                        )
                    )

            return AgentOutput(
                status='success',
                data=result_data,
                confidence_score=self._calculate_confidence(evidence, recommendations),
                message=f"추천 생성 완료: {len(recommendations)}개의 증거 기반 추천",
                evidence_refs=evidence_refs,
            )

        except Exception as e:
            logger.exception(f"추천 생성 실패: {e}")
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message=f"추천 생성 실패: {str(e)}",
                evidence_refs=[],
            )

    def _collect_evidence(
        self,
        params: Dict[str, Any],
        context: Dict[str, Any],
        agent_input: AgentInput
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        증거 수집

        Args:
            params: 입력 파라미터
            context: 컨텍스트
            agent_input: 에이전트 입력

        Returns:
            수집된 증거
        """
        evidence = {
            'root_causes': [],
            'findings': [],
            'events': [],
            'kpis': [],
            'agent_runs': [],
            'data_points': [],
        }

        # 근본 원인 증거
        for cause in params.get('root_causes', []):
            evidence['root_causes'].append({
                'category': cause.get('category'),
                'cause': cause.get('cause'),
                'contribution': cause.get('contribution', 0),
                'confidence': cause.get('confidence', 0.8),
                'source': cause.get('source', 'root_cause_analysis'),
            })

        # 발견사항 증거
        for finding in params.get('findings', []):
            evidence['findings'].append({
                'type': finding.get('type'),
                'description': finding.get('description'),
                'severity': finding.get('severity'),
                'domain': finding.get('domain'),
                'source': finding.get('source', 'agent_finding'),
            })

        # 이벤트 증거
        event_ids = params.get('event_ids', [])
        if event_ids:
            try:
                from events.models import Event
                events = Event.objects.filter(event_id__in=event_ids)
                for event in events:
                    evidence['events'].append({
                        'event_id': str(event.event_id),
                        'event_type': event.event_type,
                        'severity': event.severity,
                        'title': event.title,
                        'detected_at': event.detected_at.isoformat() if event.detected_at else None,
                        'source': 'event_system',
                    })
            except Exception as e:
                logger.warning(f"이벤트 조회 실패: {e}")

        # KPI 증거
        kpis = params.get('kpis', [])
        if kpis:
            for kpi in kpis:
                evidence['kpis'].append({
                    'kpi_code': kpi.get('code'),
                    'kpi_name': kpi.get('name'),
                    'current_value': kpi.get('current_value'),
                    'target_value': kpi.get('target_value'),
                    'variance_pct': kpi.get('variance_pct'),
                    'trend': kpi.get('trend'),
                    'source': 'kpi_system',
                })

        # 에이전트 실행 증거
        if agent_input.request_id:
            try:
                agent_runs = AgentRunLog.objects.filter(
                    request_id=agent_input.request_id
                )
                for run in agent_runs:
                    evidence['agent_runs'].append({
                        'agent_name': run.agent_name,
                        'status': run.status,
                        'confidence': run.confidence,
                        'execution_time_ms': run.execution_time_ms,
                        'has_evidence': run.has_evidence,
                        'created_at': run.created_at.isoformat() if run.created_at else None,
                        'source': 'agent_execution',
                    })
            except Exception as e:
                logger.warning(f"에이전트 실행 조회 실패: {e}")

        return evidence

    def _generate_evidence_summary(self, evidence: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """증거 요약"""
        return {
            'total_evidence_count': sum(len(v) for v in evidence.values()),
            'root_cause_count': len(evidence['root_causes']),
            'finding_count': len(evidence['findings']),
            'event_count': len(evidence['events']),
            'kpi_count': len(evidence['kpis']),
            'agent_run_count': len(evidence['agent_runs']),
            'severity_breakdown': self._get_severity_breakdown(evidence),
        }

    def _get_severity_breakdown(self, evidence: Dict[str, List[Dict]]) -> Dict[str, int]:
        """심각도별 분류"""
        breakdown = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'INFO': 0}

        for finding in evidence['findings']:
            severity = finding.get('severity', 'MEDIUM')
            breakdown[severity] = breakdown.get(severity, 0) + 1

        for event in evidence['events']:
            severity = event.get('severity', 'MEDIUM')
            breakdown[severity] = breakdown.get(severity, 0) + 1

        return breakdown

    def _generate_recommendations(
        self,
        analysis_type: str,
        root_causes: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        context: Dict[str, Any],
        evidence: Dict[str, List[Dict]],
        agent_input: AgentInput
    ) -> List[Recommendation]:
        """
        추천사항 생성

        Args:
            analysis_type: 분석 유형
            root_causes: 근본 원인 목록
            findings: 발견사항 목록
            context: 추가 컨텍스트
            evidence: 수집된 증거
            agent_input: 에이전트 입력

        Returns:
            생성된 추천사항 목록
        """
        recommendations = []

        # 근본 원인별 추천 생성
        for cause in root_causes[:5]:  # 상위 5개 원인
            category = cause.get('category', '')
            cause_desc = cause.get('cause', '')

            # 증거 필터링
            relevant_evidence = self._filter_relevant_evidence(
                category=category,
                evidence=evidence
            )

            # 카테고리별 추천 생성
            recommendation = self._create_category_recommendation(
                category=category,
                cause=cause_desc,
                context=context,
                analysis_type=analysis_type,
                agent_input=agent_input,
                relevant_evidence=relevant_evidence
            )

            if recommendation:
                recommendations.append(recommendation)

        # 발견사항 기반 추천
        for finding in findings[:3]:
            recommendation = self._create_finding_recommendation(
                finding=finding,
                context=context,
                agent_input=agent_input,
                evidence=evidence
            )
            if recommendation:
                recommendations.append(recommendation)

        # 시스템 레벨 추천
        system_recommendations = self._generate_system_recommendations(
            analysis_type=analysis_type,
            context=context,
            agent_input=agent_input,
            evidence=evidence
        )

        recommendations.extend(system_recommendations)

        return recommendations

    def _filter_relevant_evidence(
        self,
        category: str,
        evidence: Dict[str, List[Dict]]
    ) -> Dict[str, List[Dict]]:
        """관련 증거 필터링"""
        relevant = {
            'root_causes': [],
            'findings': [],
            'events': [],
            'kpis': [],
        }

        # 카테고리 관련 근본 원인
        for cause in evidence['root_causes']:
            if cause.get('category') == category:
                relevant['root_causes'].append(cause)

        # 심각도 높은 발견사항 포함
        for finding in evidence['findings']:
            if finding.get('severity') in ['HIGH', 'CRITICAL']:
                relevant['findings'].append(finding)

        # 이벤트와 KPI는 모두 포함
        relevant['events'] = evidence['events']
        relevant['kpis'] = evidence['kpis']

        return relevant

    def _create_category_recommendation(
        self,
        category: str,
        cause: str,
        context: Dict[str, Any],
        analysis_type: str,
        agent_input: AgentInput,
        relevant_evidence: Dict[str, List[Dict]]
    ) -> Optional[Recommendation]:
        """카테고리별 추천 생성"""
        # 도메인 결정
        domain_map = {
            "Man": "hr",
            "Machine": "production",
            "Material": "purchasing",
            "Method": "production",
            "Measurement": "quality",
            "Management": "compliance",
        }
        domain = domain_map.get(category, "general")

        # 우선순위 결정
        priority = self._determine_priority(
            analysis_type=analysis_type,
            evidence=relevant_evidence
        )

        # 추천 내용 생성
        title, description, action_items = self._get_recommendation_content(
            category=category,
            cause=cause,
            analysis_type=analysis_type
        )

        # 증거 레퍼런스 생성
        evidence_refs = self._create_evidence_refs(relevant_evidence)

        # 예상 효과 계산
        estimated_impact = self._calculate_estimated_impact(
            category=category,
            evidence=relevant_evidence
        )

        # 관련 이벤트 ID
        related_event_ids = [
            ev['event_id'] for ev in relevant_evidence.get('events', [])
        ]

        # 관련 KPI
        related_kpis = [
            {'code': kpi['kpi_code'], 'name': kpi['kpi_name']}
            for kpi in relevant_evidence.get('kpis', [])
        ]

        # 추천 생성
        recommendation = Recommendation.objects.create(
            title=title,
            description=description,
            domain=domain,
            priority=priority,
            impact_area=f"{category} 관리",
            action_items=action_items,
            generated_by_agent=self.agent_name,
            agent_run_id=agent_input.request_id,
            related_events=related_event_ids,
            related_kpis=related_kpis,
            evidence_refs=evidence_refs,
            estimated_impact=estimated_impact,
            approval_level=self._suggest_approval_level(priority, domain),
            expires_at=timezone.now() + timedelta(days=30),
        )

        return recommendation

    def _create_finding_recommendation(
        self,
        finding: Dict[str, Any],
        context: Dict[str, Any],
        agent_input: AgentInput,
        evidence: Dict[str, List[Dict]]
    ) -> Optional[Recommendation]:
        """발견사항 기반 추천 생성"""
        finding_type = finding.get('type', 'unknown')
        domain = finding.get('domain', 'general')

        # 우선순위 결정
        severity_to_priority = {
            'CRITICAL': 'urgent',
            'HIGH': 'high',
            'MEDIUM': 'medium',
            'LOW': 'low',
        }
        priority = severity_to_priority.get(
            finding.get('severity', 'MEDIUM'),
            'medium'
        )

        # 추천 내용 생성
        title = f"{finding_type} 문제 해결"
        description = finding.get('description', '')

        action_items = [
            {'task': f'{finding_type} 원인 파악', 'priority': 'high'},
            {'task': '해결 방안 수립', 'priority': 'high'},
            {'task': '재발 방지 조치', 'priority': 'medium'},
        ]

        # 증거 레퍼런스
        evidence_refs = [{
            'type': 'finding',
            'id': finding.get('id', str(uuid.uuid4())),
            'description': finding.get('description', ''),
            'severity': finding.get('severity'),
            'source': 'agent_finding',
        }]

        recommendation = Recommendation.objects.create(
            title=title,
            description=description,
            domain=domain,
            priority=priority,
            impact_area=f"{finding_type} 관리",
            action_items=action_items,
            generated_by_agent=self.agent_name,
            agent_run_id=agent_input.request_id,
            evidence_refs=evidence_refs,
            estimated_impact={
                'improvement_pct': 20,
                'time_to_impact_days': 14,
            },
            approval_level=self._suggest_approval_level(priority, domain),
        )

        return recommendation

    def _determine_priority(
        self,
        analysis_type: str,
        evidence: Dict[str, List[Dict]]
    ) -> str:
        """우선순위 결정"""
        # 증거 기반 우선순위
        high_severity_count = (
            sum(1 for f in evidence['findings'] if f.get('severity') in ['HIGH', 'CRITICAL']) +
            sum(1 for e in evidence['events'] if e.get('severity') in ['HIGH', 'CRITICAL'])
        )

        if high_severity_count >= 2:
            return 'urgent'
        elif high_severity_count >= 1:
            return 'high'
        elif analysis_type in ['quality_issue', 'production_shortfall']:
            return 'high'
        else:
            return 'medium'

    def _create_evidence_refs(self, evidence: Dict[str, List[Dict]]) -> List[Dict[str, Any]]:
        """증거 레퍼런스 생성"""
        refs = []

        for cause in evidence['root_causes']:
            refs.append({
                'type': 'root_cause',
                'id': str(uuid.uuid4()),
                'description': f"근본 원인: {cause.get('category')} - {cause.get('cause')}",
                'confidence': cause.get('confidence', 0.8),
                'source': 'root_cause_analysis',
            })

        for finding in evidence['findings']:
            refs.append({
                'type': 'finding',
                'id': str(uuid.uuid4()),
                'description': f"발견사항: {finding.get('description')}",
                'severity': finding.get('severity'),
                'source': 'agent_finding',
            })

        for event in evidence['events']:
            refs.append({
                'type': 'event',
                'id': event['event_id'],
                'description': f"이벤트: {event['title']}",
                'severity': event['severity'],
                'source': 'event_system',
            })

        for kpi in evidence['kpis']:
            refs.append({
                'type': 'kpi',
                'id': kpi['kpi_code'],
                'description': f"KPI: {kpi['kpi_name']} (현재: {kpi.get('current_value')}, 목표: {kpi.get('target_value')})",
                'variance_pct': kpi.get('variance_pct'),
                'source': 'kpi_system',
            })

        return refs

    def _calculate_estimated_impact(
        self,
        category: str,
        evidence: Dict[str, List[Dict]]
    ) -> Dict[str, Any]:
        """예상 효과 계산"""
        # 기본 개선 효과
        base_improvement = 10

        # 심각도에 따른 조정
        high_severity_count = sum(
            1 for f in evidence['findings'] if f.get('severity') in ['HIGH', 'CRITICAL']
        )
        improvement_pct = base_improvement + (high_severity_count * 5)

        return {
            'improvement_pct': min(improvement_pct, 50),
            'time_to_impact_days': 30 if category in ['Method', 'Management'] else 14,
            'expected_benefit': self._estimate_benefit(category, improvement_pct),
        }

    def _estimate_benefit(self, category: str, improvement_pct: int) -> str:
        """기대 효과 설명"""
        benefit_map = {
            "Man": "작업 효율 향상 및 인건비 절감",
            "Machine": "설비 가동률 향상 및 생산량 증대",
            "Material": "자재비 절감 및 품질 개선",
            "Method": "프로세스 효율화 및 리드타임 단축",
            "Measurement": "측정 정확도 향상 및 불량률 감소",
            "Management": "의사결정 품질 향상 및 리스크 감소",
        }
        return benefit_map.get(category, "전반적인 프로세스 개선")

    def _get_recommendation_content(
        self,
        category: str,
        cause: str,
        analysis_type: str
    ) -> tuple[str, str, List[Dict[str, Any]]]:
        """추천 내용 반환"""
        content_map = {
            "Man": (
                f"인력 관리 개선: {cause}",
                f"'{cause}' 문제를 해결하기 위한 인력 관리 개선이 필요합니다.",
                [
                    {"task": "작업자 교육 프로그램 강화", "priority": "high"},
                    {"task": "숙련도 매핑 및 배치 최적화", "priority": "medium"},
                    {"task": "근태 관리 프로세스 개선", "priority": "medium"},
                ]
            ),
            "Machine": (
                f"설비 관리 강화: {cause}",
                f"'{cause}' 문제를 해결하기 위한 설비 관리 강화가 필요합니다.",
                [
                    {"task": "예방 정비 스케줄 최적화", "priority": "high"},
                    {"task": "설비 성능 모니터링 강화", "priority": "high"},
                    {"task": "비상 대체 장비 확보", "priority": "medium"},
                ]
            ),
            "Material": (
                f"자재 관리 개선: {cause}",
                f"'{cause}' 문제를 해결하기 위한 자재 관리 개선이 필요합니다.",
                [
                    {"task": "공급자 품질 관리 강화", "priority": "high"},
                    {"task": "안전재고 수준 재검토", "priority": "medium"},
                    {"task": "대체 자재원 확보", "priority": "medium"},
                ]
            ),
            "Method": (
                f"프로세스 최적화: {cause}",
                f"'{cause}' 문제를 해결하기 위한 프로세스 최적화가 필요합니다.",
                [
                    {"task": "표준 작업 절차 재검토", "priority": "high"},
                    {"task": "프로세스 매핑 및 병목 제거", "priority": "high"},
                    {"task": "작업 표준 준수 모니터링", "priority": "medium"},
                ]
            ),
        }

        return content_map.get(
            category,
            (
                f"개선 제안: {cause}",
                f"'{cause}' 문제에 대한 개선이 필요합니다.",
                [{"task": "사항 파악 및 원인 분석", "priority": "high"}]
            )
        )

    def _generate_system_recommendations(
        self,
        analysis_type: str,
        context: Dict[str, Any],
        agent_input: AgentInput,
        evidence: Dict[str, List[Dict]]
    ) -> List[Recommendation]:
        """시스템 레벨 추천 생성"""
        recommendations = []

        # 데이터 품질 개선 추천
        if context.get("data_quality_issues"):
            recommendation = Recommendation.objects.create(
                title="데이터 품질 개선",
                description="분석에 활용되는 데이터의 품질을 개선해야 합니다.",
                domain="compliance",
                priority="medium",
                impact_area="데이터 관리",
                action_items=[
                    {"task": "데이터 수집 프로세스 표준화", "priority": "high"},
                    {"task": "데이터 검증 규칙 강화", "priority": "high"},
                    {"task": "데이터 사전 유지보수", "priority": "medium"},
                ],
                generated_by_agent=self.agent_name,
                agent_run_id=agent_input.request_id,
                evidence_refs=[{
                    'type': 'system_analysis',
                    'description': '데이터 품질 분석 결과',
                    'source': 'RecommendationAgent',
                }],
                estimated_impact={
                    'improvement_pct': 15,
                    'time_to_impact_days': 30,
                },
            )
            recommendations.append(recommendation)

        return recommendations

    def _suggest_approval_level(self, priority: str, domain: str) -> str:
        """승인 레벨 제안"""
        level_map = {
            'urgent': 'L4',
            'high': 'L3',
            'medium': 'L2',
            'low': 'L1',
        }

        base_level = level_map.get(priority, 'L2')

        # 도메인별 조정
        if domain in ['finance', 'quality']:
            levels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
            current_idx = levels.index(base_level)
            return levels[min(current_idx + 1, 5)]

        return base_level

    def _calculate_confidence(
        self,
        evidence: Dict[str, List[Dict]],
        recommendations: List[Recommendation]
    ) -> float:
        """신뢰도 계산"""
        base_confidence = 0.7

        # 증거 수에 따른 신뢰도 조정
        evidence_count = sum(len(v) for v in evidence.values())
        if evidence_count >= 5:
            base_confidence += 0.1
        elif evidence_count >= 3:
            base_confidence += 0.05

        # 높은 신뢰도 증거 가중치
        high_confidence_evidence = sum(
            1 for e in evidence.get('root_causes', [])
            if e.get('confidence', 0) >= 0.8
        )
        if high_confidence_evidence >= 2:
            base_confidence += 0.1

        return min(base_confidence, 0.95)
