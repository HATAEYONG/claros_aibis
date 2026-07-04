"""
생산 지능형 에이전트 (Production Intelligence Agent)
생산량 모니터링 및 가용율 분석
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService
from production.models import ProductionLine, WorkOrder


class ProductionIntelligenceAgent(BaseAgent):
    """
    생산 지능형 에이전트
    - 생산량 모니터링
    - 가용율 분석
    - 불량률 추적
    - 설비 과부하 탐지
    """

    # 에이전트 메타데이터
    agent_type = "production_intelligence"
    agent_name = "ProductionIntelligenceAgent"
    agent_description = "생산 관리 및 설비 가용율 분석을 위한 지능형 에이전트"
    agent_domain = "production"
    agent_layer = "intelligence"  # L3: Domain Intelligence

    # 생산 성과 기준값
    PRODUCTION_THRESHOLDS = {
        'achievement_rate_warning': 90.0,    # 달성률 경고 기준 (%)
        'achievement_rate_critical': 80.0,   # 달성률 긴급 기준 (%)
        'defect_rate_warning': 2.0,          # 불량률 경고 기준 (%)
        'defect_rate_critical': 5.0,         # 불량률 긴급 기준 (%)
        'capacity_utilization_high': 95.0,   # 가동률 과부하 기준 (%)
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.context.get('fiscal_year'):
            raise ValueError("fiscal_year is required in context")
        if not input_data.context.get('fiscal_month'):
            raise ValueError("fiscal_month is required in context")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        생산 지능 분석 실행

        Args:
            input_data: {
                'context': {
                    'fiscal_year': int,
                    'fiscal_month': int,
                    'analysis_type': str,  # 'output', 'quality', 'capacity', 'all'
                },
                'parameters': {
                    'production_line_code': str,  # optional
                    'product_code': str,  # optional
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        fiscal_year = context['fiscal_year']
        fiscal_month = context['fiscal_month']
        analysis_type = context.get('analysis_type', 'all')

        results = {
            'fiscal_year': fiscal_year,
            'fiscal_month': fiscal_month,
            'analysis_type': analysis_type,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 생산량 분석 (Output Analysis)
        if analysis_type in ['output', 'all']:
            output_findings = self._analyze_production_output(
                fiscal_year, fiscal_month, parameters.get('production_line_code')
            )
            results['findings'].extend(output_findings)

            # 이벤트 생성
            for finding in output_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_output_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. 품질 분석 (Quality Analysis)
        if analysis_type in ['quality', 'all']:
            quality_findings = self._analyze_production_quality(
                fiscal_year, fiscal_month, parameters.get('production_line_code')
            )
            results['findings'].extend(quality_findings)

        # 3. 가용율/용량 분석 (Capacity Analysis)
        if analysis_type in ['capacity', 'all']:
            capacity_findings = self._analyze_capacity_utilization(
                fiscal_year, fiscal_month
            )
            results['findings'].extend(capacity_findings)

            # 이벤트 생성
            for finding in capacity_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_capacity_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(
            results['findings'], fiscal_year, fiscal_month
        )

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='WorkOrder',
                source_id=f"{fiscal_year}-{fiscal_month}",
                description=f"{fiscal_year}년 {fiscal_month}월 생산 데이터"
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"생산 지능 분석 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _analyze_production_output(
        self,
        fiscal_year: int,
        fiscal_month: int,
        production_line_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        생산량 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            production_line_code: 생산 라인 코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 작업지시서 조회
            work_orders = WorkOrder.objects.filter(
                status__in=['completed', 'in_progress']
            )

            # 생산 라인 필터
            if production_line_code:
                work_orders = work_orders.filter(production_line__code=production_line_code)

            # 월별 필터링 (간소화 - 실제로는 날짜 범위로 필터링 필요)
            # 여기서는 전체 데이터 분석으로 대체

            for order in work_orders:
                if order.target_quantity > 0:
                    achievement_rate = (order.actual_quantity / order.target_quantity) * 100

                    # 달성률 기반 발견사항
                    if achievement_rate < self.PRODUCTION_THRESHOLDS['achievement_rate_critical']:
                        severity = 'CRITICAL'
                    elif achievement_rate < self.PRODUCTION_THRESHOLDS['achievement_rate_warning']:
                        severity = 'HIGH'
                    else:
                        continue  # 정상 범위

                    finding = {
                        'type': 'production_shortfall',
                        'order_number': order.order_number,
                        'production_line': order.production_line.name,
                        'product_name': order.product_name,
                        'product_code': order.product_code,
                        'target_quantity': order.target_quantity,
                        'actual_quantity': order.actual_quantity,
                        'achievement_rate': achievement_rate,
                        'shortfall_quantity': order.target_quantity - order.actual_quantity,
                        'status': order.status,
                        'description': f'{order.product_name} 생산 목표 달성 실패 ({achievement_rate:.1f}%)',
                        'severity': severity,
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'생산량 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_production_quality(
        self,
        fiscal_year: int,
        fiscal_month: int,
        production_line_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        생산 품질 분석 (불량률)

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            production_line_code: 생산 라인 코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 작업지시서 조회
            work_orders = WorkOrder.objects.filter(
                status__in=['completed', 'in_progress']
            )

            if production_line_code:
                work_orders = work_orders.filter(production_line__code=production_line_code)

            for order in work_orders:
                if order.actual_quantity > 0:
                    defect_rate = (order.defect_quantity / order.actual_quantity) * 100

                    # 불량률 기준 검사
                    if defect_rate >= self.PRODUCTION_THRESHOLDS['defect_rate_critical']:
                        severity = 'CRITICAL'
                    elif defect_rate >= self.PRODUCTION_THRESHOLDS['defect_rate_warning']:
                        severity = 'HIGH'
                    else:
                        continue  # 정상 범위

                    finding = {
                        'type': 'quality_issue',
                        'order_number': order.order_number,
                        'production_line': order.production_line.name,
                        'product_name': order.product_name,
                        'product_code': order.product_code,
                        'actual_quantity': order.actual_quantity,
                        'defect_quantity': order.defect_quantity,
                        'defect_rate': defect_rate,
                        'description': f'{order.product_name} 불량률 초과 ({defect_rate:.2f}%)',
                        'severity': severity,
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'품질 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_capacity_utilization(
        self,
        fiscal_year: int,
        fiscal_month: int
    ) -> List[Dict[str, Any]]:
        """
        가용율/용량 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 생산 라인별 가동률 분석
            production_lines = ProductionLine.objects.filter(is_active=True)

            for line in production_lines:
                # 해당 라인의 작업지시서 조회
                work_orders = WorkOrder.objects.filter(
                    production_line=line,
                    status__in=['completed', 'in_progress']
                )

                # 총 생산량 계산
                total_quantity = sum(order.actual_quantity for order in work_orders)

                # 가동률 계산 (간소화)
                if line.capacity > 0:
                    # 최근 작업지시서의 일일 평균 생산량
                    if work_orders.count() > 0:
                        avg_daily_production = total_quantity / max(work_orders.count(), 1)
                        capacity_utilization = (avg_daily_production / line.capacity) * 100
                    else:
                        capacity_utilization = 0

                    # 과부하 탐지
                    if capacity_utilization >= self.PRODUCTION_THRESHOLDS['capacity_utilization_high']:
                        finding = {
                            'type': 'capacity_overload',
                            'production_line': line.name,
                            'line_code': line.code,
                            'capacity': line.capacity,
                            'avg_daily_production': avg_daily_production,
                            'capacity_utilization': capacity_utilization,
                            'description': f'{line.name} 가동률 과부하 ({capacity_utilization:.1f}%)',
                            'severity': 'HIGH',
                        }
                        findings.append(finding)

                    # 저가동 경고
                    elif capacity_utilization < 50:
                        finding = {
                            'type': 'underutilization',
                            'production_line': line.name,
                            'line_code': line.code,
                            'capacity': line.capacity,
                            'avg_daily_production': avg_daily_production,
                            'capacity_utilization': capacity_utilization,
                            'description': f'{line.name} 가동률 저조 ({capacity_utilization:.1f}%)',
                            'severity': 'MEDIUM',
                        }
                        findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'가용율 분석 중 오류 발생: {str(e)}'
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
            if finding.get('type') == 'production_shortfall':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = [
                        f'{finding["production_line"]} 생산 계획 재검토',
                        '설비 가동률 점검',
                        '자재 공급 현황 확인',
                        '인력 배치 최적화',
                    ]

                    recommendation = {
                        'title': f"{finding['product_name']} 생산량 회복 필요",
                        'description': finding['description'],
                        'category': 'production_recovery',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'production',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'quality_issue':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = [
                        f'{finding["product_name"]} 불량 원인 분석',
                        '공정 조건 재검토',
                        '작업자 교육 강화',
                        '원자재 품질 점검',
                    ]

                    recommendation = {
                        'title': f"{finding['product_name']} 품질 개선 필요",
                        'description': finding['description'],
                        'category': 'quality_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'production',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'capacity_overload':
                action_items = [
                    f'{finding["production_line"]} 설비 추가 검토',
                    '생산 일정 재조정',
                    '외주 생산 검토',
                ]

                recommendation = {
                    'title': f"{finding['production_line']} 용량 확대 필요",
                    'description': finding['description'],
                    'category': 'capacity_expansion',
                    'priority': 'high',
                    'domain': 'production',
                    'action_items': action_items,
                    'evidence': finding,
                }
                recommendations.append(recommendation)

        return recommendations

    def _create_output_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """생산량 미달 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_output_shortfall(
                scope_type='work_order',
                scope_id=finding['order_number'],
                product_code=finding['product_code'],
                product_name=finding['product_name'],
                target_quantity=finding['target_quantity'],
                actual_quantity=finding['actual_quantity'],
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _create_capacity_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """설비 과부하 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_capacity_overload(
                scope_type='production_line',
                scope_id=finding['line_code'],
                equipment_name=finding['production_line'],
                capacity_utilization=finding['capacity_utilization'],
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """결과 신뢰도 계산"""
        finding_count = len(results.get('findings', []))

        if finding_count == 0:
            return 0.5
        elif finding_count >= 3:
            return 0.9
        elif finding_count >= 2:
            return 0.8
        else:
            return 0.7

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        pass
