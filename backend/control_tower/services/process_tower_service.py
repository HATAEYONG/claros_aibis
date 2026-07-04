"""
프로세스 컨트롤 타워 서비스
프로세스 모니터링 및 승인 워크플로우 대시보드 데이터 제공
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max, Min, F, Q
from django.db.models.functions import TruncDate

logger = logging.getLogger(__name__)


class ProcessTowerService:
    """
    프로세스 컨트롤 타워 서비스
    프로세스 모니터링 및 워크플로우 대시보드 데이터 제공
    """

    def __init__(self):
        self.tower_type = "process"

    def get_process_tower(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        프로세스 타워 데이터 조회

        Args:
            params: {
                'process_type': str,  # 'approval', 'sop', 'all'
                'time_range_days': int,
                'department': str,
            }
        """
        process_type = params.get('process_type', 'all')
        time_range_days = params.get('time_range_days', 7)
        department = params.get('department')

        start_date = timezone.now() - timedelta(days=time_range_days)

        tower_data = {
            'summary': {},
            'approval_processes': {},
            'sop_compliance': {},
            'process_delays': [],
            'bottlenecks': [],
            'recommendations': [],
        }

        # 승인 프로세스 현황
        if process_type in ['approval', 'all']:
            tower_data['approval_processes'] = self._get_approval_processes(
                start_date, department
            )

        # SOP 준수 현황
        if process_type in ['sop', 'all']:
            tower_data['sop_compliance'] = self._get_sop_compliance(
                start_date, department
            )

        # 프로세스 지연
        if process_type in ['delay', 'all']:
            tower_data['process_delays'] = self._get_process_delays(
                start_date, department
            )

        # 병목 현황
        tower_data['bottlenecks'] = self._identify_bottlenecks(
            start_date, process_type
        )

        # 요약 통계
        tower_data['summary'] = self._generate_summary(tower_data)

        return tower_data

    def _get_approval_processes(
        self,
        start_date: datetime,
        department: Optional[str]
    ) -> Dict[str, Any]:
        """승인 프로세스 현황 조회"""
        approval_data = {
            'pending_requests': 0,
            'overdue_requests': 0,
            'average_processing_time': 0,
            'by_level': {},
            'by_status': {},
            'recent_requests': [],
        }

        try:
            from governance.models import ApprovalRequest

            requests = ApprovalRequest.objects.filter(
                created_at__gte=start_date
            )

            if department:
                requests = requests.filter(title__icontains=department)

            # 집계
            approval_data['pending_requests'] = requests.filter(status='pending').count()

            overdue_threshold = timezone.now() - timedelta(hours=24)
            approval_data['overdue_requests'] = requests.filter(
                status='pending',
                created_at__lte=overdue_threshold
            ).count()

            # 승인 레벨별 집계
            by_level = requests.values('approval_level').annotate(
                count=Count('request_id'),
                pending=Count('request_id', filter=Q(status='pending'))
            ).order_by('approval_level')

            for item in by_level:
                approval_data['by_level'][f'L{item["approval_level"]}'] = {
                    'total': item['count'],
                    'pending': item['pending'],
                }

            # 상태별 집계
            by_status = requests.values('status').annotate(
                count=Count('request_id')
            ).order_by('-count')

            approval_data['by_status'] = {
                item['status']: item['count']
                for item in by_status
            }

            # 평균 처리 시간
            approved = requests.filter(status='approved')
            if approved.count() > 0:
                time_diffs = []
                for req in approved:
                    if req.approved_at and req.created_at:
                        time_diffs.append((req.approved_at - req.created_at).total_seconds())

                if time_diffs:
                    approval_data['average_processing_time'] = round(
                        sum(time_diffs) / len(time_diffs) / 3600, 2  # 시간 단위
                    )

            # 최근 요청
            recent = requests.order_by('-created_at')[:10]

            for req in recent:
                approval_data['recent_requests'].append({
                    'request_id': str(req.request_id),
                    'title': req.title,
                    'approval_level': f'L{req.approval_level}',
                    'status': req.status,
                    'requested_by': req.requested_by,
                    'created_at': req.created_at.isoformat(),
                })

        except Exception as e:
            logger.warning(f"승인 프로세스 조회 실패: {e}")
            approval_data['error'] = str(e)

        return approval_data

    def _get_sop_compliance(
        self,
        start_date: datetime,
        department: Optional[str]
    ) -> Dict[str, Any]:
        """SOP 준수 현황 조회"""
        compliance_data = {
            'total_violations': 0,
            'open_violations': 0,
            'by_category': {},
            'compliance_rate': 0,
            'trend': 'stable',
            'recent_violations': [],
        }

        try:
            from governance.models import PolicyViolation

            violations = PolicyViolation.objects.filter(
                detected_at__gte=start_date.date(),
                detected_at__lte=timezone.now().date()
            )

            if department:
                violations = violations.filter(
                    policy_rule__category__icontains=department
                )

            # 집계
            compliance_data['total_violations'] = violations.count()
            compliance_data['open_violations'] = violations.filter(status='open').count()

            # 카테고리별 집계
            by_category = violations.values(
                'policy_rule__category'
            ).annotate(
                count=Count('violation_id')
            ).order_by('-count')

            compliance_data['by_category'] = {
                item['policy_rule__category']: item['count']
                for item in by_category
            }

            # 준수율 계산 (임시)
            total_processes = 100  # 임시 전체 프로세스 수
            if total_processes > 0:
                compliance_data['compliance_rate'] = round(
                    (1 - compliance_data['total_violations'] / total_processes) * 100, 2
                )

            # 추세
            prev_start = start_date - timedelta(days=7)
            recent_violations = violations.count()
            previous_violations = PolicyViolation.objects.filter(
                detected_at__gte=prev_start.date(),
                detected_at__lt=start_date.date()
            ).count()

            if previous_violations > 0:
                change_ratio = (recent_violations - previous_violations) / previous_violations
                if change_ratio > 0.1:
                    compliance_data['trend'] = 'improving'
                elif change_ratio < -0.1:
                    compliance_data['trend'] = 'declining'

            # 최근 위반
            recent = violations.order_by('-detected_at')[:10]

            for violation in recent:
                compliance_data['recent_violations'].append({
                    'violation_id': str(violation.violation_id),
                    'category': violation.policy_rule.category if violation.policy_rule else 'unknown',
                    'severity': violation.severity,
                    'status': violation.status,
                    'violating_entity': violation.violating_entity,
                    'detected_at': violation.detected_at.isoformat() if violation.detected_at else None,
                })

        except Exception as e:
            logger.warning(f"SOP 준수 현황 조회 실패: {e}")
            compliance_data['error'] = str(e)

        return compliance_data

    def _get_process_delays(
        self,
        start_date: datetime,
        department: Optional[str]
    ) -> List[Dict[str, Any]]:
        """프로세스 지연 조회"""
        delays = []

        try:
            from production.models import WorkOrder

            # 지연된 작업지시서 조회
            delayed_orders = WorkOrder.objects.filter(
                status='in_progress',
                planned_end__lt=date.today()
            ).order_by('planned_end')

            if department:
                # 부서별 필터링 (간소화)
                pass

            for order in delayed_orders:
                days_delayed = (date.today() - order.planned_end.date()).days

                delays.append({
                    'order_number': order.order_number,
                    'product_name': order.product_name,
                    'product_code': order.product_code,
                    'planned_end': order.planned_end.isoformat() if order.planned_end else None,
                    'actual_end': order.actual_end.isoformat() if order.actual_end else None,
                    'days_delayed': days_delayed,
                    'severity': 'critical' if days_delayed >= 5 else 'high' if days_delayed >= 3 else 'medium',
                })

        except Exception as e:
            logger.warning(f"프로세스 지연 조회 실패: {e}")

        return delays

    def _identify_bottlenecks(
        self,
        start_date: datetime,
        process_type: str
    ) -> List[Dict[str, Any]]:
        """병목 현황 식별"""
        bottlenecks = []

        try:
            # 승인 병목
            if process_type in ['approval', 'all']:
                from governance.models import ApprovalRequest

                pending_by_level = ApprovalRequest.objects.filter(
                    status='pending'
                ).values('approval_level').annotate(
                    count=Count('request_id')
                ).order_by('-count')

                for item in pending_by_level[:3]:
                    if item['count'] >= 5:
                        bottlenecks.append({
                            'type': 'approval_bottleneck',
                            'level': f'L{item["approval_level"]}',
                            'pending_count': item['count'],
                            'severity': 'high' if item['count'] >= 10 else 'medium',
                            'description': f'L{item["approval_level"]} 승인 {item["count"]}건 대기 중',
                        })

            # 품질 병목
            if process_type in ['sop', 'all']:
                from governance.models import PolicyViolation

                violation_clusters = PolicyViolation.objects.filter(
                    detected_at__gte=start_date.date(),
                    status='open'
                ).values('policy_rule__category').annotate(
                    count=Count('violation_id')
                ).order_by('-count')

                for item in violation_clusters[:3]:
                    if item['count'] >= 3:
                        bottlenecks.append({
                            'type': 'sop_bottleneck',
                            'category': item['policy_rule__category'],
                            'violation_count': item['count'],
                            'severity': 'high' if item['count'] >= 5 else 'medium',
                            'description': f'{item["policy_rule__category"]} 카테고리 SOP 위반 {item["count"]}건',
                        })

            # 생산 병목
            if process_type in ['delay', 'all']:
                delayed_count = len(self._get_process_delays(start_date, None))

                if delayed_count >= 5:
                    bottlenecks.append({
                        'type': 'production_bottleneck',
                        'delayed_orders': delayed_count,
                        'severity': 'high' if delayed_count >= 10 else 'medium',
                        'description': f'{delayed_count}건의 생산 지연 발생',
                    })

        except Exception as e:
            logger.warning(f"병목 식별 실패: {e}")

        return bottlenecks

    def _generate_summary(self, tower_data: Dict[str, Any]) -> Dict[str, Any]:
        """요약 통계 생성"""
        summary = {
            'total_issues': 0,
            'critical_issues': 0,
            'health_score': 0,
            'status': 'normal',
        }

        # 이슈 카운트
        summary['total_issues'] = (
            tower_data.get('approval_processes', {}).get('overdue_requests', 0) +
            tower_data.get('sop_compliance', {}).get('open_violations', 0) +
            len(tower_data.get('process_delays', []))
        )

        # 크리티컬 이슈
        for delay in tower_data.get('process_delays', []):
            if delay.get('severity') == 'critical':
                summary['critical_issues'] += 1

        for bottleneck in tower_data.get('bottlenecks', []):
            if bottleneck.get('severity') == 'high' or bottleneck.get('severity') == 'critical':
                summary['critical_issues'] += 1

        # 건강도 점수
        total_issues = summary['total_issues']
        if total_issues == 0:
            summary['health_score'] = 100
        elif total_issues <= 5:
            summary['health_score'] = 80
        elif total_issues <= 10:
            summary['health_score'] = 60
        else:
            summary['health_score'] = 40

        # 상태
        if summary['health_score'] >= 80:
            summary['status'] = 'good'
        elif summary['health_score'] >= 60:
            summary['status'] = 'warning'
        else:
            summary['status'] = 'critical'

        return summary


# 헬퍼 함수
def get_process_dashboard(process_type: str = 'all', days: int = 7) -> Dict[str, Any]:
    """프로세스 대시보드 조회 헬퍼 함수"""
    service = ProcessTowerService()
    return service.get_process_tower({
        'process_type': process_type,
        'time_range_days': days,
    })
