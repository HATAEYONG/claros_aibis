"""
알림 에이전트 (Alert Agent)
이벤트 및 에이전트 분석 결과 기반 알림 생성 및 전송
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput


class AlertAgent(BaseAgent):
    """
    알림 에이전트
    - 이벤트 기반 알림 생성
    - 에이전트 분석 결과 알림
    - 알림 우선순위 결정
    - 알림 채널 라우팅
    - 알림 전송 및 추적
    """

    # 에이전트 메타데이터
    agent_type = "alert"
    agent_name = "AlertAgent"
    agent_description = "이벤트 및 분석 결과 기반 알림 생성을 위한 지능형 에이전트"
    agent_domain = "notification"
    agent_layer = "decision"  # L5: Decision

    # 알림 우선순위
    ALERT_PRIORITIES = {
        'critical': 1,  # 즉시 전송
        'high': 2,      # 30분 이내
        'medium': 3,   # 2시간 이내
        'low': 4,       # 4시간 이내
    }

    # 알림 채널
    ALERT_CHANNELS = {
        'email': '이메일',
        'sms': 'SMS',
        'web': '웹 대시판',
        'mobile': '모바일 앱 푸시',
        'slack': 'Slack',
        'teams': 'Microsoft Teams',
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.parameters.get('events') and not input_data.parameters.get('findings'):
            raise ValueError("events or findings parameter is required")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        알림 생성 실행

        Args:
            input_data: {
                'context': {
                    'alert_type': str,  # 'event', 'agent', 'custom'
                },
                'parameters': {
                    'events': List[Dict],  # 이벤트 목록
                    'findings': List[Dict],  # 에이전트 분석 결과
                    'channels': List[str],  # 알림 채널 (optional)
                    'recipients': List[Dict],  # 수신자 정보
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters

        alert_type = context.get('alert_type', 'event')
        events = parameters.get('events', [])
        findings = parameters.get('findings', [])
        channels = parameters.get('channels', ['web'])
        recipients = parameters.get('recipients', [])

        results = {
            'alert_type': alert_type,
            'alerts_created': [],
            'summary': {},
        }

        # 1. 이벤트 기반 알림 생성
        if alert_type in ['event', 'all'] and events:
            event_alerts = self._create_event_alerts(events, channels, recipients)
            results['alerts_created'].extend(event_alerts)

        # 2. 에이전트 분석 결과 기반 알림
        if alert_type in ['agent', 'all'] and findings:
            finding_alerts = self._create_finding_alerts(findings, channels, recipients)
            results['alerts_created'].extend(finding_alerts)

        # 3. 알림 요약 통계
        results['summary'] = self._generate_alert_summary(results['alerts_created'])

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='AlertGeneration',
                source_id=f'{alert_type}_{len(results["alerts_created"])}_alerts',
                description=f'{alert_type} 타입 {len(results["alerts_created"])}개 알림 생성'
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=0.95,  # 알림은 확정적이므로 높은 신뢰도
            message=f"알림 생성 완료: {len(results['alerts_created'])}개의 알림",
            evidence_refs=evidence_refs,
        )

    def _create_event_alerts(
        self,
        events: List[Dict[str, Any]],
        channels: List[str],
        recipients: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        이벤트 기반 알림 생성

        Args:
            events: 이벤트 목록
            channels: 알림 채널 목록
            recipients: 수신자 목록

        Returns:
            생성된 알림 목록
        """
        alerts = []

        for event in events:
            # 우선순위 결정
            priority = self._determine_event_priority(event)

            # 알림 채널 결정
            alert_channels = self._select_channels(priority, channels)

            # 수신자 결정
            alert_recipients = self._select_recipients(event, recipients)

            # 알림 생성
            alert = {
                'alert_id': str(uuid.uuid4()),
                'alert_type': 'event_alert',
                'source_type': 'event',
                'source_id': event.get('event_id'),
                'priority': priority,
                'title': self._generate_alert_title(event),
                'message': self._generate_alert_message(event),
                'channels': alert_channels,
                'recipients': alert_recipients,
                'action_required': self._is_action_required(event),
                'created_at': datetime.now().isoformat(),
                'expires_at': self._calculate_expires_at(priority).isoformat(),
                'metadata': {
                    'event_severity': event.get('severity'),
                    'event_type': event.get('event_type'),
                    'event_domain': event.get('domain'),
                },
            }

            alerts.append(alert)

        return alerts

    def _create_finding_alerts(
        self,
        findings: List[Dict[str, Any]],
        channels: List[str],
        recipients: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        에이전트 분석 결과 기반 알림 생성

        Args:
            findings: 에이전트 분석 결과
            channels: 알림 채널 목록
            recipients: 수신자 목록

        Returns:
            생성된 알림 목록
        """
        alerts = []

        # 발견사항 그룹화 (심각도/도메인별)
        grouped_findings = self._group_findings(findings)

        for group_key, group_findings in grouped_findings.items():
            # 그룹의 가장 높은 심각도 결정
            highest_severity = self._get_highest_severity(group_findings)

            # 우선순위 결정
            priority = self._severity_to_priority(highest_severity)

            # 알림 채널 결정
            alert_channels = self._select_channels(priority, channels)

            # 수신자 결정
            alert_recipients = self._select_recipients_for_findings(group_findings, recipients)

            # 알림 생성
            alert = {
                'alert_id': str(uuid.uuid4()),
                'alert_type': 'finding_alert',
                'source_type': 'agent_finding',
                'source_id': group_key,
                'priority': priority,
                'title': self._generate_finding_alert_title(group_key, group_findings),
                'message': self._generate_finding_alert_message(group_findings),
                'channels': alert_channels,
                'recipients': alert_recipients,
                'action_required': True,
                'findings': group_findings,
                'created_at': datetime.now().isoformat(),
                'expires_at': self._calculate_expires_at(priority).isoformat(),
                'metadata': {
                    'finding_count': len(group_findings),
                    'domains': list(set(f.get('domain') for f in group_findings)),
                },
            }

            alerts.append(alert)

        return alerts

    def _group_findings(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """발견사항 그룹화"""
        groups = {}

        for finding in findings:
            # 도메인별 그룹화
            domain = finding.get('domain', 'unknown')

            # 도메인과 심각도로 그룹핑 키 생성
            severity = finding.get('severity', 'MEDIUM')
            group_key = f"{domain}_{severity}"

            if group_key not in groups:
                groups[group_key] = []
            groups[group_key].append(finding)

        return groups

    def _get_highest_severity(self, findings: List[Dict[str, Any]]) -> str:
        """가장 높은 심각도 반환"""
        severity_order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

        for severity in severity_order:
            if any(f.get('severity') == severity for f in findings):
                return severity

        return 'MEDIUM'

    def _determine_event_priority(self, event: Dict[str, Any]) -> str:
        """이벤트 우선순위 결정"""
        severity = event.get('severity', 'MEDIUM')

        if severity == 'CRITICAL':
            return 'critical'
        elif severity == 'HIGH':
            return 'high'
        elif severity == 'MEDIUM':
            return 'medium'
        else:
            return 'low'

    def _severity_to_priority(self, severity: str) -> str:
        """심각도를 우선순위로 변환"""
        mapping = {
            'CRITICAL': 'critical',
            'HIGH': 'high',
            'MEDIUM': 'medium',
            'LOW': 'low',
            'INFO': 'low',
        }
        return mapping.get(severity, 'medium')

    def _select_channels(self, priority: str, requested_channels: List[str]) -> List[str]:
        """우선순위에 따른 알림 채널 선택"""
        # critical은 모든 채널, high는 이메일+웹, 나머지는 웹만
        if priority == 'critical':
            return ['web', 'email', 'mobile', 'slack', 'teams']
        elif priority == 'high':
            return ['web', 'email', 'mobile']
        else:
            return ['web']

        # 요청된 채널과 교집합
        return list(set(requested_channels) & set(['web', 'email', 'mobile', 'slack', 'teams']))

    def _select_recipients(self, event: Dict[str, Any], recipients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """이벤트별 수신자 선택"""
        # 간단 구현: 도메인별 담당자 할당
        event_domain = event.get('domain', 'general')

        domain_recipients_map = {
            'cost': ['cost_manager', 'cfo'],
            'financial': ['financial_manager', 'cfo'],
            'production': ['production_manager', 'coo'],
            'quality': ['quality_manager', 'coo'],
            'purchase': ['purchase_manager', 'coo'],
            'sales': ['sales_manager', 'ceo'],
            'hr': ['hr_manager', 'ceo'],
        }

        recipient_roles = domain_recipients_map.get(event_domain, ['admin'])

        # 수신자 정보 필터링
        matched = []
        for recipient in recipients:
            if recipient.get('role') in recipient_roles or recipient.get('role') == 'admin':
                matched.append(recipient)

        return matched if matched else recipients

    def _select_recipients_for_findings(
        self,
        findings: List[Dict[str, Any]],
        recipients: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """발견사항별 수신자 선택"""
        # 도메인별 담당자 결정
        domains = set(f.get('domain') for f in findings)

        recipient_roles = []
        for domain in domains:
            if domain == 'cost':
                recipient_roles.extend(['cost_manager', 'cfo'])
            elif domain == 'financial':
                recipient_roles.extend(['financial_manager', 'cfo'])
            elif domain == 'production':
                recipient_roles.extend(['production_manager', 'coo'])
            elif domain == 'quality':
                recipient_roles.extend(['quality_manager', 'coo'])
            elif domain == 'purchase':
                recipient_roles.extend(['purchase_manager', 'coo'])

        # 중복 제거
        recipient_roles = list(set(recipient_roles))

        # 수신자 정보 필터링
        matched = []
        for recipient in recipients:
            if recipient.get('role') in recipient_roles or recipient.get('role') == 'admin':
                matched.append(recipient)

        return matched if matched else recipients

    def _generate_alert_title(self, event: Dict[str, Any]) -> str:
        """이벤트 알림 제목 생성"""
        severity = event.get('severity', 'MEDIUM')
        event_type = event.get('event_type', '이벤트')
        event_title = event.get('title', '')

        severity_label = {
            'CRITICAL': '[긴급]',
            'HIGH': '[중요]',
            'MEDIUM': '[알림]',
            'LOW': '[정보]',
        }.get(severity, '[알림]')

        if event_title:
            return f"{severity_label} {event_title}"
        else:
            return f"{severity_label} 새로운 {event_type} 이벤트 발생"

    def _generate_alert_message(self, event: Dict[str, Any]) -> str:
        """이벤트 알림 메시지 생성"""
        title = event.get('title', '')
        description = event.get('description', '')
        severity = event.get('severity', 'MEDIUM')

        message = f"심각도: {severity}\n"

        if title:
            message += f"제목: {title}\n"
        if description:
            message += f"내용: {description}\n"

        # 도메인 정보
        domain = event.get('domain')
        if domain:
            message += f"도메인: {domain}\n"

        # 시간 정보
        event_time = event.get('event_time') or event.get('detected_at')
        if event_time:
            message += f"발생시각: {event_time}\n"

        return message

    def _generate_finding_alert_title(self, group_key: str, findings: List[Dict[str, Any]]) -> str:
        """발견사항 알림 제목 생성"""
        domain = group_key.split('_')[0] if '_' in group_key else 'general'
        count = len(findings)

        return f"[{domain}] {count}건의 발견사항 발생"

    def _generate_finding_alert_message(self, findings: List[Dict[str, Any]]) -> str:
        """발견사항 알림 메시지 생성"""
        message = f"{len(findings)}건의 발견사항이 있습니다.\n\n"

        # 상위 3개 발견사항만 표시
        sorted_findings = sorted(
            findings,
            key=lambda x: self._severity_to_priority(x.get('severity', 'MEDIUM')),
            reverse=True
        )[:3]

        for i, finding in enumerate(sorted_findings, 1):
            message += f"{i}. {finding.get('description', finding.get('title', ''))}\n"

        return message

    def _generate_alert_summary(self, alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """알림 요약 통계"""
        summary = {
            'total_alerts': len(alerts),
            'by_priority': {},
            'by_channel': {},
            'by_type': {},
        }

        for alert in alerts:
            # 우선순위별 집계
            priority = alert['priority']
            summary['by_priority'][priority] = summary['by_priority'].get(priority, 0) + 1

            # 채널별 집계
            for channel in alert['channels']:
                summary['by_channel'][channel] = summary['by_channel'].get(channel, 0) + 1

            # 타입별 집계
            alert_type = alert['alert_type']
            summary['by_type'][alert_type] = summary['by_type'].get(alert_type, 0) + 1

        return summary

    def _is_action_required(self, event: Dict[str, Any]) -> bool:
        """즉시 조치가 필요한 이벤트인지 확인"""
        severity = event.get('severity')
        return severity in ['CRITICAL', 'HIGH']

    def _calculate_expires_at(self, priority: str) -> datetime:
        """알림 만료 시각 계산"""
        now = datetime.now()

        expiry_hours = {
            'critical': 1,
            'high': 6,
            'medium': 12,
            'low': 24,
        }.get(priority, 24)

        return now + timedelta(hours=expiry_hours)


# 알림 전송 서비스 (별도 모듈로 분리 가능)
class AlertService:
    """
    알림 전송 서비스
    - 알림 전송
    - 전송 상태 추적
    - 승인 요청
    """

    def __init__(self):
        self.pending_alerts = []
        self.sent_alerts = []

    def send_alert(self, alert: Dict[str, Any]) -> bool:
        """
        알림 전송

        Args:
            alert: 알림 객체

        Returns:
            전송 성공 여부
        """
        try:
            # 각 채널별 전송
            for channel in alert['channels']:
                if channel == 'email':
                    self._send_email(alert)
                elif channel == 'sms':
                    self._send_sms(alert)
                elif channel == 'web':
                    self._send_web_notification(alert)
                elif channel == 'mobile':
                    self._send_mobile_push(alert)
                elif channel == 'slack':
                    self._send_slack(alert)
                elif channel == 'teams':
                    self._send_teams(alert)

            self.sent_alerts.append(alert)
            return True

        except Exception as e:
            print(f"알림 전송 실패: {str(e)}")
            return False

    def _send_email(self, alert: Dict[str, Any]) -> None:
        """이메일 전송 (구현 필요)"""
        # Django email backend 사용
        pass

    def _send_sms(self, alert: Dict[str, Any]) -> None:
        """SMS 전송 (구현 필요)"""
        pass

    def _send_web_notification(self, alert: Dict[str, Any]) -> None:
        """웹 알림 (알림 모델에 저장)"""
        pass

    def _send_mobile_push(self, alert: Dict[str, Any]) -> None:
        """모바일 푸시 전송 (구현 필요)"""
        pass

    def _send_slack(self, alert: Dict[str, Any]) -> None:
        """Slack 전송 (구현 필요)"""
        pass

    def _send_teams(self, alert: Dict[str, Any]) -> None:
        """Microsoft Teams 전송 (구현 필요)"""
        pass


# 알림 생성 헬퍼 함수
def create_event_alerts(events: List[Dict[str, Any]], channels: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    이벤트 알림 생성 헬퍼 함수

    Args:
        events: 이벤트 목록
        channels: 알림 채널 (optional)

    Returns:
        생성된 알림 목록
    """
    from ai.agents.decision.alert_agent import AlertAgent

    agent = AlertAgent()

    input_data = AgentInput(
        context={'alert_type': 'event'},
        parameters={
            'events': events,
            'channels': channels or ['web'],
            'recipients': [],
        }
    )

    output = agent.run(input_data)
    return output.data.get('alerts_created', [])


def create_finding_alerts(findings: List[Dict[str, Any]], channels: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    발견사항 알림 생성 헬퍼 함수

    Args:
        findings: 발견사항 목록
        channels: 알림 채널 (optional)

    Returns:
        생성된 알림 목록
    """
    from ai.agents.decision.alert_agent import AlertAgent

    agent = AlertAgent()

    input_data = AgentInput(
        context={'alert_type': 'agent'},
        parameters={
            'findings': findings,
            'channels': channels or ['web'],
            'recipients': [],
        }
    )

    output = agent.run(input_data)
    return output.data.get('alerts_created', [])
