"""
정책 엔진 — 정책 규칙 평가 및 위반 탐지
"""
import logging
from typing import List, Dict, Any

from governance.models import PolicyRule, PolicyViolation

logger = logging.getLogger(__name__)


class PolicyEngine:
    """정책 엔진 — 정책 규칙 평가 및 위반 탐지"""

    @staticmethod
    def evaluate_policies(context: Dict[str, Any]) -> List[PolicyViolation]:
        """
        컨텍스트에 대해 모든 활성 정책 규칙 평가

        Args:
            context: 평가 컨텍스트

        Returns:
            탐지된 위반 목록
        """
        violations = []
        active_rules = PolicyRule.objects.filter(is_active=True)

        for rule in active_rules:
            try:
                if rule.evaluate(context):
                    violation = PolicyViolation.objects.create(
                        policy_rule=rule,
                        violating_entity=context.get("entity", "unknown"),
                        entity_type=context.get("entity_type", "system"),
                        violation_details={
                            "rule_code": rule.code,
                            "rule_name": rule.name_ko,
                            "context": context
                        },
                        severity=rule.severity
                    )
                    violations.append(violation)
                    logger.warning(f"정책 위반 탐지: {rule.code} - {context.get('entity', 'unknown')}")
            except Exception as e:
                logger.error(f"정책 평가 실패 ({rule.code}): {e}")

        return violations

    @staticmethod
    def evaluate_single_rule(rule_code: str, context: Dict[str, Any]) -> bool:
        """
        단일 정책 규칙 평가

        Args:
            rule_code: 규칙 코드
            context: 평가 컨텍스트

        Returns:
            위반 여부 (True: 위반)
        """
        try:
            rule = PolicyRule.objects.get(code=rule_code, is_active=True)
            return rule.evaluate(context)
        except PolicyRule.DoesNotExist:
            logger.error(f"정책 규칙을 찾을 수 없음: {rule_code}")
            return False

    @staticmethod
    def get_active_rules(category: str = None) -> List[PolicyRule]:
        """
        활성 정책 규칙 목록 조회

        Args:
            category: 카테고리 필터 (None이면 전체)

        Returns:
            활성 정책 규칙 목록
        """
        if category:
            return list(PolicyRule.objects.filter(is_active=True, category=category))
        return list(PolicyRule.objects.filter(is_active=True))

    @staticmethod
    def create_violation(
        rule_code: str,
        violating_entity: str,
        entity_type: str,
        context: Dict[str, Any]
    ) -> PolicyViolation:
        """
        수동 위반 생성

        Args:
            rule_code: 규칙 코드
            violating_entity: 위반 주체
            entity_type: 주체 유형
            context: 위반 컨텍스트

        Returns:
            생성된 위반
        """
        try:
            rule = PolicyRule.objects.get(code=rule_code, is_active=True)
            violation = PolicyViolation.objects.create(
                policy_rule=rule,
                violating_entity=violating_entity,
                entity_type=entity_type,
                violation_details=context,
                severity=rule.severity
            )
            logger.warning(f"수동 위반 생성: {rule_code} - {violating_entity}")
            return violation
        except PolicyRule.DoesNotExist:
            logger.error(f"정책 규칙을 찾을 수 없음: {rule_code}")
            raise
