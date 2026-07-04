"""
프로세스 모니터링 에이전트 (Process Monitoring Agent)
업무 프로세스 상태 및 성능 모니터링
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from django.db import models

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService


class ProcessMonitoringAgent(BaseAgent):
    """
    프로세스 모니터링 에이전트
    - 업무 프로세스 상태 추적
    - 프로세스 지연 탐지
    - 승인 프로세스 모니터링
    - SOP 준수 여부 확인
    """

    # 에이전트 메타데이터
    agent_type = "process_monitoring"
    agent_name = "ProcessMonitoringAgent"
    agent_description = "업무 프로세스 상태 및 성능 모니터링을 위한 지능형 에이전트"
    agent_domain = "process"
    agent_layer = "monitoring"  # L2: Monitoring

    # 프로세스 모니터링 기준값
    PROCESS_THRESHOLDS = {
        'approval_timeout_hours': 24,      # 승인 시간 초과 기준 (시간)
        'sop_violation_threshold': 3,      # SOP 위반 횟수 기준
        'process_delay_threshold': 2,      # 프로세스 지연 일수 기준
        'bypass_detection': True,          # 승인 우회 탐지
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        # 필수 파라미터 검증 (없으면 전체 분석)

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        프로세스 모니터링 실행

        Args:
            input_data: {
                'context': {
                    'process_type': str,  # 'approval', 'sop', 'all'
                    'time_range_days': int,  # optional, default 7
                },
                'parameters': {
                    'process_code': str,  # optional
                    'department': str,  # optional
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        process_type = context.get('process_type', 'all')
        time_range_days = context.get('time_range_days', 7)

        results = {
            'process_type': process_type,
            'time_range_days': time_range_days,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 승인 프로세스 모니터링
        if process_type in ['approval', 'all']:
            approval_findings = self._monitor_approval_processes(
                time_range_days, parameters.get('department')
            )
            results['findings'].extend(approval_findings)

            # 이벤트 생성
            for finding in approval_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_approval_event(finding)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. SOP 준수 모니터링
        if process_type in ['sop', 'all']:
            sop_findings = self._monitor_sop_compliance(
                time_range_days, parameters.get('department')
            )
            results['findings'].extend(sop_findings)

            # 이벤트 생성
            for finding in sop_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_sop_event(finding)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 3. 프로세스 지연 모니터링
        if process_type in ['delay', 'all']:
            delay_findings = self._monitor_process_delays(
                time_range_days, parameters.get('process_code')
            )
            results['findings'].extend(delay_findings)

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(results['findings'])

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='ProcessMonitoring',
                source_id=f'last_{time_range_days}_days',
                description=f'최근 {time_range_days}일간 프로세스 모니터링 데이터'
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"프로세스 모니터링 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _monitor_approval_processes(
        self,
        time_range_days: int,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        승인 프로세스 모니터링

        Args:
            time_range_days: 분석 기간 (일)
            department: 부서 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 승인 요청 데이터 조회
            from governance.models import ApprovalRequest

            cutoff_date = date.today() - timedelta(days=time_range_days)

            approval_requests = ApprovalRequest.objects.filter(
                created_at__gte=cutoff_date
            )

            if department:
                approval_requests = approval_requests.filter(requested_by__icontains=department)

            # 대기 중인 승인 요청 중 시간 초과 검사
            timeout_threshold = datetime.now() - timedelta(hours=self.PROCESS_THRESHOLDS['approval_timeout_hours'])

            pending_requests = approval_requests.filter(
                status='pending',
                created_at__lte=timeout_threshold
            )

            for request in pending_requests:
                hours_pending = (datetime.now() - request.created_at).total_seconds() / 3600

                finding = {
                    'type': 'approval_timeout',
                    'request_id': str(request.request_id),
                    'title': request.title,
                    'approval_level': request.approval_level,
                    'requested_by': request.requested_by,
                    'hours_pending': round(hours_pending, 1),
                    'description': f'{request.title} 승인이 {hours_pending:.1f}시간 경과但仍未处理',
                    'severity': 'HIGH' if hours_pending >= 48 else 'MEDIUM',
                }
                findings.append(finding)

            # 승인 우회 탐지 (높은 승인 레벨이 낮은 승인자에 의해 승인된 경우 등)
            # 여기서는 간소화하여 높은 레벨 요청이 빠르게 승인된 케이스를 탐지
            rapid_approvals = approval_requests.filter(
                status='approved',
                approval_level__gte=4
            ).annotate(
                approval_time=models.F('approved_at') - models.F('created_at')
            ).filter(
                approval_time__lte=timedelta(hours=1)
            )

            if rapid_approvals.count() > 0:
                finding = {
                    'type': 'suspicious_rapid_approval',
                    'count': rapid_approvals.count(),
                    'description': f'L4 이상 승인 요청 중 {rapid_approvals.count()}건이 1시간 이내에 승인됨',
                    'severity': 'MEDIUM',
                }
                findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'승인 프로세스 모니터링 중 오류 발생: {str(e)}'
            })

        return findings

    def _monitor_sop_compliance(
        self,
        time_range_days: int,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        SOP 준수 모니터링

        Args:
            time_range_days: 분석 기간 (일)
            department: 부서 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            from governance.models import PolicyViolation

            cutoff_date = date.today() - timedelta(days=time_range_days)

            # SOP 위반 데이터 조회
            violations = PolicyViolation.objects.filter(
                detected_at__gte=cutoff_date,
                status='open'
            )

            # 부서별 필터링 (간소화)
            if department:
                violations = violations.filter(
                    policy_rule__category__icontains=department
                )

            # 위반 유형별 집계
            violation_counts = {}

            for violation in violations:
                category = violation.policy_rule.category if violation.policy_rule else 'unknown'

                if category not in violation_counts:
                    violation_counts[category] = {
                        'category': category,
                        'count': 0,
                        'violations': [],
                    }

                violation_counts[category]['count'] += 1
                violation_counts[category]['violations'].append({
                    'violation_id': str(violation.violation_id),
                    'description': violation.violation_details.get('description', ''),
                })

            # 임계값 초과 카테고리 탐지
            for category, data in violation_counts.items():
                if data['count'] >= self.PROCESS_THRESHOLDS['sop_violation_threshold']:
                    finding = {
                        'type': 'sop_violation_cluster',
                        'category': category,
                        'violation_count': data['count'],
                        'violations': data['violations'][:5],  # 최대 5개만 표시
                        'description': f'{category} 카테고리에서 SOP 위반 {data["count"]}건 발생',
                        'severity': 'HIGH',
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'SOP 준수 모니터링 중 오류 발생: {str(e)}'
            })

        return findings

    def _monitor_process_delays(
        self,
        time_range_days: int,
        process_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        프로세스 지연 모니터링

        Args:
            time_range_days: 분석 기간 (일)
            process_code: 프로세스 코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 작업지시서 지연 검사
            from production.models import WorkOrder

            cutoff_date = date.today() - timedelta(days=time_range_days)

            # 진행중인 작업지시서 중 계획 종료일이 지난 것 조회
            delayed_orders = WorkOrder.objects.filter(
                status='in_progress',
                planned_end__lt=date.today()
            )

            if process_code:
                delayed_orders = delayed_orders.filter(product_code__icontains=process_code)

            for order in delayed_orders:
                days_delayed = (date.today() - order.planned_end.date()).days

                finding = {
                    'type': 'process_delay',
                    'order_number': order.order_number,
                    'product_name': order.product_name,
                    'planned_end': order.planned_end.isoformat() if order.planned_end else None,
                    'days_delayed': days_delayed,
                    'description': f'{order.product_name} 생산이 {days_delayed}일 지연',
                    'severity': 'HIGH' if days_delayed >= 5 else 'MEDIUM',
                }
                findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'프로세스 지연 모니터링 중 오류 발생: {str(e)}'
            })

        return findings

    def _generate_recommendations(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        발견사항 기반 추천사항 생성

        Args:
            findings: 발견사항 목록

        Returns:
            추천사항 목록
        """
        recommendations = []

        for finding in findings:
            if finding.get('type') == 'approval_timeout':
                action_items = [
                    f'승인자에게 알림 발송: {finding["title"]}',
                    '승인 프로세스 간소화 검토',
                    '승인 권한 위임 재검토',
                ]

                recommendation = {
                    'title': "승인 지연 해결",
                    'description': finding['description'],
                    'category': 'approval_process',
                    'priority': 'high' if finding['severity'] == 'HIGH' else 'medium',
                    'domain': 'process',
                    'action_items': action_items,
                    'evidence': finding,
                }
                recommendations.append(recommendation)

            elif finding.get('type') == 'sop_violation_cluster':
                action_items = [
                    f'{finding["category"]} SOP 재교육',
                    '위반 원인 분석 및 프로세스 개선',
                    'SOP 준수 모니터링 강화',
                ]

                recommendation = {
                    'title': f"{finding['category']} SOP 준수 강화",
                    'description': finding['description'],
                    'category': 'sop_compliance',
                    'priority': 'high',
                    'domain': 'process',
                    'action_items': action_items,
                    'evidence': finding,
                }
                recommendations.append(recommendation)

        return recommendations

    def _create_approval_event(self, finding: Dict[str, Any]) -> Optional[Any]:
        """승인 지연 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_approval_bypass(
                scope_type='approval',
                scope_id=finding['request_id'],
                approval_level=finding['approval_level'],
                bypass_type='timeout',
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _create_sop_event(self, finding: Dict[str, Any]) -> Optional[Any]:
        """SOP 위반 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_sop_noncompliance(
                scope_type='policy',
                scope_id=finding['category'],
                violation_type='sop_violation_cluster',
                violation_count=finding['violation_count'],
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """결과 신뢰도 계산"""
        finding_count = len(results.get('findings', []))

        if finding_count == 0:
            return 0.8  # 발견사항 없음이 정상일 수 있음
        elif finding_count >= 3:
            return 0.95
        elif finding_count >= 2:
            return 0.9
        else:
            return 0.85

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        pass
