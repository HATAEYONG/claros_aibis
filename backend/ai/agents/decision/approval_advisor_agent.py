"""
승인 자문 에이전트
승인 요청에 대한 자문 제공
워크플로우 통합 지원
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from decimal import Decimal
from django.utils import timezone

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import Recommendation
from governance.models import ApprovalRequest, ApprovalWorkflow

logger = logging.getLogger(__name__)


class ApprovalAdvisorAgent(BaseAgent):
    """
    승인 자문 에이전트
    승인 요청에 대한 자문 제공

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 의사결정 레이어
    """

    # 에이전트 메타데이터
    agent_type = "approval_advisor"
    agent_name = "ApprovalAdvisorAgent"
    agent_description = "승인 요청 자문 및 위험 평가"
    agent_domain = "general"
    agent_layer = "decision"  # L5: Decision

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        recommendation_id = input_data.parameters.get('recommendation_id')
        if not recommendation_id:
            raise ValueError("recommendation_id 파라미터가 필요합니다")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        승인 자문 실행

        Args:
            input_data: {
                'context': {
                    'auto_create_request': bool,  # 자동 승인 요청 생성
                    'workflow_code': str,  # 워크플로우 코드 (optional)
                },
                'parameters': {
                    'recommendation_id': str,  # 추천 ID
                    'approval_context': Dict,  # 승인 컨텍스트
                    'create_request': bool,  # 승인 요청 생성 여부
                }
            }
        """
        params = input_data.parameters
        context = input_data.context
        recommendation_id = params.get("recommendation_id")

        if not recommendation_id:
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message="recommendation_id 파라미터가 필요합니다",
                evidence_refs=[],
            )

        try:
            # 추천 조회
            try:
                recommendation = Recommendation.objects.get(
                    recommendation_id=recommendation_id
                )
            except Recommendation.DoesNotExist:
                return AgentOutput(
                    status='error',
                    data={},
                    confidence_score=0.0,
                    message=f"추천을 찾을 수 없음: {recommendation_id}",
                    evidence_refs=[],
                )

            # 워크플로우 평가 (있는 경우)
            workflow_info = None
            if context.get('workflow_code'):
                workflow_info = self._evaluate_workflow(
                    workflow_code=context['workflow_code'],
                    recommendation=recommendation,
                    approval_context=params.get("approval_context", {})
                )

            # 승인 자문 생성
            advice = self._generate_approval_advice(
                recommendation=recommendation,
                context=params.get("approval_context", {}),
                workflow_info=workflow_info
            )

            # 승인 요청 자동 생성 (요청 시)
            approval_request_id = None
            if params.get('create_request') or context.get('auto_create_request'):
                approval_request_id = self._create_approval_request(
                    recommendation=recommendation,
                    advice=advice,
                    workflow_info=workflow_info
                )

            # 결과 생성
            result_data = {
                'recommendation_id': str(recommendation.recommendation_id),
                'recommendation_title': recommendation.title,
                'advice': advice,
                'workflow_info': workflow_info,
                'approval_request_id': str(approval_request_id) if approval_request_id else None,
            }

            # 증거 생성
            evidence_refs = [
                self.create_evidence_ref(
                    source_type='approval_advice',
                    source_id=str(recommendation_id),
                    description=f"추천 승인 자문: {recommendation.title}"
                )
            ]

            if workflow_info:
                evidence_refs.append(
                    self.create_evidence_ref(
                        source_type='workflow_evaluation',
                        source_id=workflow_info.get('workflow_id', ''),
                        description=f"워크플로우 평가: {workflow_info.get('workflow_code', '')}"
                    )
                )

            return AgentOutput(
                status='success',
                data=result_data,
                confidence_score=advice.get('confidence', 0.7),
                message=f"승인 자문 생성 완료 (요청 ID: {approval_request_id})" if approval_request_id else "승인 자문 생성 완료",
                evidence_refs=evidence_refs,
            )

        except Exception as e:
            logger.exception(f"승인 자문 생성 실패: {e}")
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message=f"승인 자문 생성 실패: {str(e)}",
                evidence_refs=[],
            )

    def _evaluate_workflow(
        self,
        workflow_code: str,
        recommendation: Recommendation,
        approval_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        워크플로우 평가

        Args:
            workflow_code: 워크플로우 코드
            recommendation: 추천 객체
            approval_context: 승인 컨텍스트

        Returns:
            워크플로우 평가 정보
        """
        try:
            workflow = ApprovalWorkflow.objects.get(
                code=workflow_code,
                is_active=True
            )

            # 컨텍스트에 추천 정보 추가
            context = {
                **approval_context,
                'recommendation': {
                    'id': str(recommendation.recommendation_id),
                    'title': recommendation.title,
                    'domain': recommendation.domain,
                    'priority': recommendation.priority,
                }
            }

            # 필요 승인 레벨 계산
            required_level = workflow.get_required_level(context)

            return {
                'workflow_id': str(workflow.workflow_id),
                'workflow_code': workflow.code,
                'workflow_name': workflow.name,
                'required_level': required_level,
                'approval_levels': workflow.approval_levels[:required_level],
                'category': workflow.category,
            }

        except ApprovalWorkflow.DoesNotExist:
            logger.warning(f"워크플로우를 찾을 수 없음: {workflow_code}")
            return None
        except Exception as e:
            logger.error(f"워크플로우 평가 실패: {e}")
            return None

    def _generate_approval_advice(
        self,
        recommendation: Recommendation,
        context: Dict[str, Any],
        workflow_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """승인 자문 생성"""
        # 위험도 평가
        risk_level = self._assess_risk_level(recommendation)

        # 승인 권장사항
        approval_recommendation = self._get_approval_recommendation(
            risk_level=risk_level,
            recommendation=recommendation
        )

        # 승인 조건
        conditions = self._get_approval_conditions(
            risk_level=risk_level,
            recommendation=recommendation
        )

        # 추가 검토 필요사항
        review_items = self._get_review_items(
            risk_level=risk_level,
            recommendation=recommendation
        )

        # 제안 승인 레벨 (워크플로우가 있으면 우선)
        suggested_level = None
        if workflow_info:
            suggested_level = f"L{workflow_info['required_level']}"
        else:
            level = self._suggest_approval_level(
                risk_level=risk_level,
                domain=recommendation.domain
            )
            suggested_level = f"L{level}"

        return {
            'recommendation_id': str(recommendation.recommendation_id),
            'recommendation_title': recommendation.title,
            'risk_level': risk_level,
            'approval_recommendation': approval_recommendation,
            'approval_conditions': conditions,
            'review_items': review_items,
            'suggested_approval_level': suggested_level,
            'business_impact': self._assess_business_impact(recommendation),
            'estimated_benefits': recommendation.estimated_impact,
            'evidence_count': len(recommendation.evidence_refs),
            'confidence': self._calculate_advice_confidence(recommendation),
        }

    def _create_approval_request(
        self,
        recommendation: Recommendation,
        advice: Dict[str, Any],
        workflow_info: Optional[Dict[str, Any]] = None
    ) -> Optional[uuid.UUID]:
        """
        승인 요청 생성

        Args:
            recommendation: 추천 객체
            advice: 승인 자문
            workflow_info: 워크플로우 정보

        Returns:
            생성된 승인 요청 ID
        """
        try:
            # 승인 레벨 결정
            if workflow_info:
                approval_level = workflow_info['required_level']
            else:
                level_map = {'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}
                approval_level = level_map.get(recommendation.priority, 2)

            # 업무 영향도 결정
            business_impact_map = {
                'urgent': 'critical',
                'high': 'high',
                'medium': 'medium',
                'low': 'low',
            }
            business_impact = business_impact_map.get(recommendation.priority, 'medium')

            # 승인 요청 생성
            approval_request = ApprovalRequest.objects.create(
                recommendation=recommendation,
                title=f"[승인] {recommendation.title}",
                description=recommendation.description,
                requested_by="RecommendationAgent",  # 자동 생성
                approval_level=approval_level,
                business_impact=business_impact,
                current_approver=self._get_current_approver(approval_level),
                approval_history=[{
                    'action': 'created',
                    'agent': 'ApprovalAdvisorAgent',
                    'timestamp': timezone.now().isoformat(),
                    'auto_created': True,
                }]
            )

            logger.info(f"승인 요청 자동 생성: {approval_request.request_id}")
            return approval_request.request_id

        except Exception as e:
            logger.error(f"승인 요청 생성 실패: {e}")
            return None

    def _get_current_approver(self, approval_level: int) -> str:
        """현재 승인자 결정 (간소화)"""
        # 실제 구현에서는 조직도/역할 기반 결정
        approvers = {
            1: '팀장',
            2: '부서장',
            3: '본부장',
            4: '임원',
            5: 'C레벨',
            6: 'CEO',
        }
        return approvers.get(approval_level, '부서장')

    def _assess_risk_level(self, recommendation: Recommendation) -> str:
        """위험도 평가"""
        # 우선순위 기반 위험도
        priority_risk = {
            "urgent": "critical",
            "high": "high",
            "medium": "medium",
            "low": "low",
        }

        base_risk = priority_risk.get(recommendation.priority, "medium")

        # 도메인별 위험도 조정
        domain_risk_adjustment = {
            "quality": 1,  # 품질은 위험도 상향
            "production": 1,
            "finance": 0,
            "hr": -1,
        }

        adjustment = domain_risk_adjustment.get(recommendation.domain, 0)

        # 위험도 레벨
        levels = ["low", "medium", "high", "critical"]
        current_level_idx = levels.index(base_risk)
        adjusted_level_idx = max(0, min(3, current_level_idx + adjustment))

        return levels[adjusted_level_idx]

    def _get_approval_recommendation(
        self,
        risk_level: str,
        recommendation: Recommendation
    ) -> str:
        """승인 권장사항"""
        if risk_level == "low":
            return "approve"  # 승인 권장
        elif risk_level == "medium":
            return "approve_with_conditions"  # 조건부 승인 권장
        elif risk_level == "high":
            return "review_recommended"  # 검토 후 승인 권장
        else:  # critical
            return "escalate"  # 상위 레벨 에스컬레이션

    def _get_approval_conditions(
        self,
        risk_level: str,
        recommendation: Recommendation
    ) -> List[str]:
        """승인 조건"""
        conditions = []

        if risk_level in ["medium", "high"]:
            conditions.append("실행 계획 수립 후 승인")
            conditions.append("영향도 모니터링 계획 포함")

        if risk_level in ["high", "critical"]:
            conditions.append("이해관계자 동의 필요")
            conditions.append("롤백 계획 수립")

        if risk_level == "critical":
            conditions.append("상위 관리자 승인 필요")
            conditions.append("파일럿 테스트 후 전개")

        return conditions

    def _get_review_items(
        self,
        risk_level: str,
        recommendation: Recommendation
    ) -> List[str]:
        """검토 필요사항"""
        items = [
            "추천사항의 타당성 검토",
            "비용-편익 분석 확인",
        ]

        if risk_level in ["medium", "high", "critical"]:
            items.extend([
                "대안 검토",
                "리스크 완화 방안 확인",
            ])

        if risk_level in ["high", "critical"]:
            items.extend([
                "영향도 분석 검토",
                "스테이크홀더 피드백 확인",
            ])

        if risk_level == "critical":
            items.extend([
                "법적/규제적 영향 검토",
                "외부 전문가 의견 청취",
            ])

        return items

    def _assess_business_impact(self, recommendation: Recommendation) -> Dict[str, Any]:
        """업무 영향도 평가"""
        estimated_impact = recommendation.estimated_impact or {}

        return {
            'improvement_pct': estimated_impact.get('improvement_pct', 10),
            'time_to_impact_days': estimated_impact.get('time_to_impact_days', 30),
            'affected_areas': [recommendation.impact_area],
            'priority': recommendation.priority,
            'level': self._map_priority_to_impact_level(recommendation.priority),
        }

    def _map_priority_to_impact_level(self, priority: str) -> str:
        """우선순위를 영향도 레벨로 매핑"""
        mapping = {
            'urgent': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low',
        }
        return mapping.get(priority, 'medium')

    def _calculate_advice_confidence(self, recommendation: Recommendation) -> float:
        """자문 신뢰도 계산"""
        # 기본 신뢰도
        base_confidence = 0.7

        # 증거 수에 따른 신뢰도 조정
        evidence_count = len(recommendation.evidence_refs)
        if evidence_count >= 5:
            base_confidence += 0.15
        elif evidence_count >= 3:
            base_confidence += 0.1

        # 실행 이력이 있으면 신뢰도 상향
        if recommendation.agent_run_id:
            try:
                from ai.models import AgentRunLog
                run_log = AgentRunLog.objects.filter(
                    request_id=recommendation.agent_run_id
                ).first()
                if run_log and run_log.confidence:
                    base_confidence = max(base_confidence, float(run_log.confidence))
            except Exception:
                pass

        return min(base_confidence, 0.95)

    def _suggest_approval_level(
        self,
        risk_level: str,
        domain: str
    ) -> int:
        """승인 레벨 제안 (1-6)"""
        # 위험도별 기본 승인 레벨
        level_map = {
            "low": 1,
            "medium": 2,
            "high": 3,
            "critical": 4,
        }

        base_level = level_map.get(risk_level, 2)

        # 도메인별 조정
        domain_adjustment = {
            "finance": 1,  # 재무는 한 레벨 높음
            "quality": 1,
            "production": 0,
            "hr": -1,
        }

        adjustment = domain_adjustment.get(domain, 0)
        suggested_level = max(1, min(6, base_level + adjustment))

        return suggested_level
