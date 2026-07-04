"""
원가 지능형 에이전트 (Cost Intelligence Agent)
4M2E 기반 원가 분산 감지 및 분석
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService
from cost.models import MonthlyCost, ProductCost, CostReductionProject


class CostIntelligenceAgent(BaseAgent):
    """
    원가 지능형 에이전트
    - 4M2E 분산 감지 (원가 차이 초과)
    - 원가 추이 분석
    - 원가 절감 프로젝트 모니터링
    """

    # 에이전트 메타데이터
    agent_type = "cost_intelligence"
    agent_name = "CostIntelligenceAgent"
    agent_description = "원가 분산 감지 및 분석을 위한 지능형 에이전트"
    agent_domain = "cost"
    agent_layer = "intelligence"  # L3: Domain Intelligence

    # 4M2E 카테고리 매핑
    CATEGORY_4M2E = {
        'material': 'Material',      # 재료
        'labor': 'Man',              # 인력
        'overhead': 'Machine',       # 설비
        'selling_admin': 'Method',   # 방법
    }

    # 원가 항목별 한글명
    COST_ITEM_NAMES = {
        'material_cost': '재료비',
        'labor_cost': '노무비',
        'overhead_cost': '제조경비',
        'selling_admin_cost': '판매관리비',
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.context.get('fiscal_year'):
            raise ValueError("fiscal_year is required in context")
        if not input_data.context.get('fiscal_month'):
            raise ValueError("fiscal_month is required in context")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        원가 지능 분석 실행

        Args:
            input_data: {
                'context': {
                    'fiscal_year': int,
                    'fiscal_month': int,
                    'analysis_type': str,  # 'variance', 'trend', 'reduction', 'all'
                    'threshold_pct': float,  # optional, default 10.0
                },
                'parameters': {
                    'product_code': str,  # optional
                    'category': str,  # optional: material, labor, overhead, selling_admin
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        fiscal_year = context['fiscal_year']
        fiscal_month = context['fiscal_month']
        analysis_type = context.get('analysis_type', 'all')
        threshold_pct = context.get('threshold_pct', 10.0)

        results = {
            'fiscal_year': fiscal_year,
            'fiscal_month': fiscal_month,
            'analysis_type': analysis_type,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 원가 차이 분석 (Variance Analysis)
        if analysis_type in ['variance', 'all']:
            variance_findings = self._analyze_cost_variance(
                fiscal_year, fiscal_month, threshold_pct, parameters.get('category')
            )
            results['findings'].extend(variance_findings)

            # 이벤트 자동 생성
            for finding in variance_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_variance_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. 추이 분석 (Trend Analysis)
        if analysis_type in ['trend', 'all']:
            trend_findings = self._analyze_cost_trend(
                fiscal_year, fiscal_month, parameters.get('category')
            )
            results['findings'].extend(trend_findings)

        # 3. 원가 절감 프로젝트 모니터링
        if analysis_type in ['reduction', 'all']:
            reduction_findings = self._monitor_cost_reduction_projects(fiscal_year, fiscal_month)
            results['findings'].extend(reduction_findings)

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(
            results['findings'], fiscal_year, fiscal_month
        )

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='MonthlyCost',
                source_id=f"{fiscal_year}-{fiscal_month}",
                description=f"{fiscal_year}년 {fiscal_month}월 원가 데이터"
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"원가 지능 분석 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _analyze_cost_variance(
        self,
        fiscal_year: int,
        fiscal_month: int,
        threshold_pct: float,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        원가 차이 분석 (4M2E 분산 감지)

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            threshold_pct: 임계값 백분율
            category: 분석할 원가 항목 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 현재월 원가 데이터 조회
            current_cost = MonthlyCost.objects.filter(
                fiscal_year=fiscal_year,
                fiscal_month=fiscal_month
            ).first()

            if not current_cost:
                return [{'type': 'error', 'message': f'{fiscal_year}년 {fiscal_month}월 원가 데이터가 없습니다.'}]

            # 전월 원가 데이터 조회
            prev_month = fiscal_month - 1 if fiscal_month > 1 else 12
            prev_year = fiscal_year if fiscal_month > 1 else fiscal_year - 1

            previous_cost = MonthlyCost.objects.filter(
                fiscal_year=prev_year,
                fiscal_month=prev_month
            ).first()

            # 목표 원가 (단순히 전월 사용 - 실제로는 표준 원가 사용)
            target_cost = previous_cost if previous_cost else current_cost

            # 분석할 원가 항목
            cost_items = ['material_cost', 'labor_cost', 'overhead_cost', 'selling_admin_cost']
            if category:
                cost_items = [f'{category}_cost']

            for item in cost_items:
                current_value = getattr(current_cost, item, Decimal('0'))
                target_value = getattr(target_cost, item, Decimal('0'))

                if target_value == 0:
                    continue

                # 차이율 계산
                variance = current_value - target_value
                variance_pct = (variance / target_value) * 100

                # 임계값 초과 시 이벤트 생성
                if abs(variance_pct) >= threshold_pct:
                    severity = self._determine_variance_severity(abs(variance_pct), threshold_pct)

                    cost_item_name = self.COST_ITEM_NAMES.get(item, item)
                    category_4m2e = self.CATEGORY_4M2E.get(item.replace('_cost', ''), 'Unknown')

                    finding = {
                        'type': 'cost_variance',
                        'cost_item': item,
                        'cost_item_name': cost_item_name,
                        'category_4m2e': category_4m2e,
                        'current_value': float(current_value),
                        'target_value': float(target_value),
                        'variance': float(variance),
                        'variance_pct': float(variance_pct),
                        'threshold_pct': threshold_pct,
                        'severity': severity,
                        'direction': 'increase' if variance > 0 else 'decrease',
                        'fiscal_year': fiscal_year,
                        'fiscal_month': fiscal_month,
                    }

                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'원가 차이 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_cost_trend(
        self,
        fiscal_year: int,
        fiscal_month: int,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        원가 추이 분석 (최근 6개월)

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            category: 분석할 원가 항목 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 최근 6개월 원가 데이터 조회
            costs = MonthlyCost.objects.filter(
                fiscal_year__gte=fiscal_year,
                fiscal_year__lte=fiscal_year + 1
            ).order_by('-fiscal_year', '-fiscal_month')[:6]

            if len(costs) < 2:
                return findings

            costs = list(reversed(costs))  # 오름차순 정렬

            cost_items = ['material_cost', 'labor_cost', 'overhead_cost', 'selling_admin_cost']
            if category:
                cost_items = [f'{category}_cost']

            for item in cost_items:
                values = [getattr(c, item, Decimal('0')) for c in costs]

                if all(v == 0 for v in values):
                    continue

                # 추이 분석 (단순 선형 회귀 대신 증감 패턴 분석)
                increase_count = sum(1 for i in range(1, len(values)) if values[i] > values[i-1])
                decrease_count = len(values) - 1 - increase_count

                trend = 'increasing' if increase_count > decrease_count else 'decreasing' if decrease_count > increase_count else 'stable'

                # 평균 증감률
                if len(values) >= 2 and values[0] != 0:
                    total_change_pct = ((values[-1] - values[0]) / values[0]) * 100
                    avg_change_pct = total_change_pct / (len(values) - 1)
                else:
                    avg_change_pct = 0

                # 추이 기반 발견사항
                if trend in ['increasing', 'decreasing'] and abs(avg_change_pct) > 5:
                    cost_item_name = self.COST_ITEM_NAMES.get(item, item)

                    finding = {
                        'type': 'cost_trend',
                        'cost_item': item,
                        'cost_item_name': cost_item_name,
                        'trend': trend,
                        'period_months': len(values),
                        'avg_change_pct': float(avg_change_pct),
                        'first_value': float(values[0]),
                        'last_value': float(values[-1]),
                        'severity': 'HIGH' if abs(avg_change_pct) > 10 else 'MEDIUM',
                    }

                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'원가 추이 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _monitor_cost_reduction_projects(
        self,
        fiscal_year: int,
        fiscal_month: int
    ) -> List[Dict[str, Any]]:
        """
        원가 절감 프로젝트 모니터링

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            projects = CostReductionProject.objects.all()

            for project in projects:
                # 진척도 기반 발견사항
                if project.progress >= 100 and project.status != 'completed':
                    finding = {
                        'type': 'reduction_project',
                        'project_id': project.project_id,
                        'project_title': project.title,
                        'category': project.category,
                        'issue': 'status_mismatch',
                        'message': f'진척도 {project.progress}% 달성했으나 상태가 완료가 아닙니다.',
                        'severity': 'MEDIUM',
                        'target_saving': float(project.target_saving),
                        'actual_saving': float(project.actual_saving),
                        'progress': float(project.progress),
                    }
                    findings.append(finding)

                # 마감일 지연
                if project.due_date < date.today() and project.status not in ['completed', 'delayed']:
                    finding = {
                        'type': 'reduction_project',
                        'project_id': project.project_id,
                        'project_title': project.title,
                        'category': project.category,
                        'issue': 'deadline_missed',
                        'message': f'마감일 {project.due_date}이 지났습니다.',
                        'severity': 'HIGH',
                        'due_date': project.due_date.isoformat(),
                        'status': project.status,
                    }
                    findings.append(finding)

                # 목표 대비 실적 부진
                if project.target_saving > 0:
                    achievement_rate = (project.actual_saving / project.target_saving) * 100
                    if achievement_rate < 50 and project.progress >= 80:
                        finding = {
                            'type': 'reduction_project',
                            'project_id': project.project_id,
                            'project_title': project.title,
                            'category': project.category,
                            'issue': 'underperformance',
                            'message': f'진척도 {project.progress}%지만 목표 대비 {achievement_rate:.1f}%만 달성했습니다.',
                            'severity': 'HIGH',
                            'target_saving': float(project.target_saving),
                            'actual_saving': float(project.actual_saving),
                            'achievement_rate': float(achievement_rate),
                        }
                        findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'원가 절감 프로젝트 모니터링 중 오류 발생: {str(e)}'
            })

        return findings

    def _generate_recommendations(
        self,
        findings: List[Dict[str, Any]],
        fiscal_year: int,
        fiscal_month: int
    ) -> List[Dict[str, Any]]:
        """
        발견사항 기반 추천사항 생성

        Args:
            findings: 발견사항 목록
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            추천사항 목록
        """
        recommendations = []

        for finding in findings:
            if finding.get('type') == 'cost_variance':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    category_4m2e = finding.get('category_4m2e', 'Unknown')

                    # 4M2E 기반 추천사항
                    action_items = self._get_4m2e_recommendations(category_4m2e, finding['direction'])

                    recommendation = {
                        'title': f"{finding['cost_item_name']} 차이 대응",
                        'description': f"{finding['cost_item_name']}이 목표 대비 {abs(finding['variance_pct']):.1f}% {'증가' if finding['direction'] == 'increase' else '감소'}했습니다.",
                        'category': 'cost_variance',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'cost',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

        return recommendations

    def _get_4m2e_recommendations(self, category: str, direction: str) -> List[str]:
        """
        4M2E 카테고리별 추천사항

        Args:
            category: 4M2E 카테고리 (Man, Machine, Material, Method, etc.)
            direction: 증감 방향 (increase, decrease)

        Returns:
            추천사항 목록
        """
        recommendations_map = {
            'Material': {
                'increase': [
                    '자재 단가 인상 원인 분석 및 대체 자재 검토',
                    '공급사 다변화를 통한 구매 단가 협상',
                    '자재 수율 개선 활동 전개',
                ],
                'decrease': [
                    '자재 단가 감소 요인 파악 및 벤치마킹',
                ],
            },
            'Man': {
                'increase': [
                    '노동 생산성 향상 방안 검토',
                    '업무 프로세스 최적화',
                    '자동화 설비 도입 검토',
                ],
                'decrease': [
                    '노무비 절감 성공 요인 파악 및 확대',
                ],
            },
            'Machine': {
                'increase': [
                    '설비 가동률 점검 및 비효율 개선',
                    '설비 유지보수 최적화',
                    '에너지 사용 효율 개선',
                ],
                'decrease': [
                    '설비 비용 절감 성공 요인 파악',
                ],
            },
            'Method': {
                'increase': [
                    '판매관리비 구조 분석 및 비효율 제거',
                    '간접 업무 프로세스 간소화',
                ],
                'decrease': [
                    '판관비 절감 성공 요인 공유',
                ],
            },
        }

        return recommendations_map.get(category, {}).get(direction, [])

    def _determine_variance_severity(self, variance_pct: float, threshold_pct: float) -> str:
        """
        차이율 기반 심각도 결정

        Args:
            variance_pct: 차이율 (%)
            threshold_pct: 임계값 (%)

        Returns:
            심각도 (INFO, LOW, MEDIUM, HIGH, CRITICAL)
        """
        if variance_pct >= threshold_pct * 3:
            return 'CRITICAL'
        elif variance_pct >= threshold_pct * 2:
            return 'HIGH'
        elif variance_pct >= threshold_pct:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _create_variance_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """
        원가 차이 이벤트 생성

        Args:
            finding: 발견사항
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            생성된 Event 또는 None
        """
        try:
            from events.models import Event

            # 이벤트 타입 결정
            if finding['cost_item'] == 'material_cost':
                event_type = 'MATERIAL_PRICE_SPIKE' if finding['direction'] == 'increase' else 'COST_VARIANCE_BREACH'
            else:
                event_type = 'COST_VARIANCE_BREACH'

            # EventDetectionService 사용하여 이벤트 생성
            event = EventDetectionService.detect_cost_variance_breach(
                scope_type='monthly_cost',
                scope_id=f"{fiscal_year}-{fiscal_month}",
                cost_category=finding['cost_item'],
                actual_cost=finding['current_value'],
                target_cost=finding['target_value'],
                variance_threshold=finding['threshold_pct'],
            )

            return event

        except Exception as e:
            # 에러 로깅만 하고 계속 진행
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """
        결과 신뢰도 계산

        Args:
            results: 분석 결과

        Returns:
            신뢰도 점수 (0.0 ~ 1.0)
        """
        # 발견사항 수에 따른 신뢰도
        finding_count = len(results.get('findings', []))

        if finding_count == 0:
            return 0.5  # 데이터 없음
        elif finding_count >= 3:
            return 0.9  # 높은 신뢰도
        elif finding_count >= 2:
            return 0.8
        else:
            return 0.7  # 하나의 발견사항

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        # 추천사항 저장 (필요시)
        if output_data.data.get('recommendations'):
            pass  # 추천사항 저장 로직
