"""
품질 지능형 에이전트 (Quality Intelligence Agent)
불량 모니터링 및 CAPA 추적
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService
from quality.models import QualityInspection, DefectType, DefectRecord


class QualityIntelligenceAgent(BaseAgent):
    """
    품질 지능형 에이전트
    - 불량률 모니터링
    - 불량 유형 분석
    - CAPA 지연 추적
    - 품질 추이 분석
    """

    # 에이전트 메타데이터
    agent_type = "quality_intelligence"
    agent_name = "QualityIntelligenceAgent"
    agent_description = "품질 관리 및 불량 분석을 위한 지능형 에이전트"
    agent_domain = "quality"
    agent_layer = "intelligence"  # L3: Domain Intelligence

    # 품질 기준값
    QUALITY_THRESHOLDS = {
        'defect_rate_warning': 2.0,       # 불량률 경고 기준 (%)
        'defect_rate_critical': 5.0,      # 불량률 긴급 기준 (%)
        'cluster_threshold': 3,            # 군집 기준 (동일 유형 3건 이상)
        'capa_overdue_days': 7,           # CAPA 지연 기준 (일)
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        # 필수 파라미터 검증 (없으면 전체 분석)

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        품질 지능 분석 실행

        Args:
            input_data: {
                'context': {
                    'analysis_type': str,  # 'defect', 'capa', 'trend', 'all'
                    'start_date': str,  # optional (YYYY-MM-DD)
                    'end_date': str,  # optional (YYYY-MM-DD)
                },
                'parameters': {
                    'product_code': str,  # optional
                    'defect_type': str,  # optional
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        analysis_type = context.get('analysis_type', 'all')

        results = {
            'analysis_type': analysis_type,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 불량률 분석 (Defect Rate Analysis)
        if analysis_type in ['defect', 'all']:
            defect_findings = self._analyze_defect_rate(parameters.get('product_code'))
            results['findings'].extend(defect_findings)

            # 이벤트 생성
            for finding in defect_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_defect_event(finding)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. 불량 유형 분석 (Defect Type Analysis)
        if analysis_type in ['defect', 'all']:
            type_findings = self._analyze_defect_types(parameters.get('product_code'))
            results['findings'].extend(type_findings)

        # 3. CAPA 지연 추적 (CAPA Tracking)
        if analysis_type in ['capa', 'all']:
            capa_findings = self._track_capa_delays()
            results['findings'].extend(capa_findings)

            # 이벤트 생성
            for finding in capa_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_capa_event(finding)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(results['findings'])

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='QualityInspection',
                source_id='latest',
                description='최근 품질 검사 데이터'
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"품질 지능 분석 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _analyze_defect_rate(self, product_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        불량률 분석

        Args:
            product_code: 분석할 제품 코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 품질 검사 데이터 조회
            inspections = QualityInspection.objects.all()

            if product_code:
                inspections = inspections.filter(product_code=product_code)

            # 최근 검사 순으로 정렬
            inspections = inspections.order_by('-inspection_date')[:100]

            # 제품별 불량률 집계
            product_stats = {}

            for inspection in inspections:
                key = inspection.product_code
                if key not in product_stats:
                    product_stats[key] = {
                        'product_code': inspection.product_code,
                        'product_name': inspection.product_name,
                        'total_inspected': 0,
                        'total_defects': 0,
                        'inspection_count': 0,
                        'fail_count': 0,
                    }

                product_stats[key]['total_inspected'] += inspection.sample_size
                product_stats[key]['total_defects'] += inspection.defect_count
                product_stats[key]['inspection_count'] += 1

                if inspection.result == 'fail':
                    product_stats[key]['fail_count'] += 1

            # 불량률 계산 및 발견사항 생성
            for product_code_key, stats in product_stats.items():
                if stats['total_inspected'] > 0:
                    defect_rate = (stats['total_defects'] / stats['total_inspected']) * 100

                    # 불량률 기준 검사
                    if defect_rate >= self.QUALITY_THRESHOLDS['defect_rate_critical']:
                        severity = 'CRITICAL'
                    elif defect_rate >= self.QUALITY_THRESHOLDS['defect_rate_warning']:
                        severity = 'HIGH'
                    else:
                        continue  # 정상 범위

                    finding = {
                        'type': 'defect_cluster',
                        'product_code': stats['product_code'],
                        'product_name': stats['product_name'],
                        'total_inspected': stats['total_inspected'],
                        'total_defects': stats['total_defects'],
                        'defect_rate': defect_rate,
                        'inspection_count': stats['inspection_count'],
                        'fail_count': stats['fail_count'],
                        'description': f'{stats["product_name"]} 불량률 초과 ({defect_rate:.2f}%)',
                        'severity': severity,
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'불량률 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_defect_types(self, product_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        불량 유형 분석

        Args:
            product_code: 분석할 제품 코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 불량 기록 조회
            defect_records = DefectRecord.objects.select_related('inspection', 'defect_type').all()

            if product_code:
                defect_records = defect_records.filter(inspection__product_code=product_code)

            # 불량 유형별 집계
            defect_type_stats = {}

            for record in defect_records:
                defect_type = record.defect_type
                if defect_type:
                    key = defect_type.code
                    if key not in defect_type_stats:
                        defect_type_stats[key] = {
                            'defect_type': defect_type,
                            'count': 0,
                            'severity': defect_type.severity,
                        }

                    defect_type_stats[key]['count'] += 1

            # 군집 탐지 (동일 유형 3건 이상)
            for key, stats in defect_type_stats.items():
                if stats['count'] >= self.QUALITY_THRESHOLDS['cluster_threshold']:
                    severity = 'CRITICAL' if stats['severity'] == 'critical' else 'HIGH'

                    finding = {
                        'type': 'defect_type_cluster',
                        'defect_type_code': stats['defect_type'].code,
                        'defect_type_name': stats['defect_type'].name,
                        'count': stats['count'],
                        'severity_level': stats['severity'],
                        'description': f'{stats["defect_type"].name} 불량 {stats["count"]}건 발생',
                        'severity': severity,
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'불량 유형 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _track_capa_delays(self) -> List[Dict[str, Any]]:
        """
        CAPA 지연 추적

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # CAPA 관련 모델이 있다면 여기서 처리
            # 현재 quality 앱에는 CAPA 모델이 없으므로
            # 품질 검사 실패에 대한 지연 처리로 대체

            # 실패한 검사 중 최근 것들 조회
            failed_inspections = QualityInspection.objects.filter(
                result='fail'
            ).order_by('-inspection_date')[:50]

            # 7일 이상 된 미해결 불합격 건수 확인
            overdue_threshold = date.today() - timedelta(days=self.QUALITY_THRESHOLDS['capa_overdue_days'])

            overdue_count = 0
            for inspection in failed_inspections:
                if inspection.inspection_date and inspection.inspection_date < overdue_threshold:
                    overdue_count += 1

            if overdue_count > 0:
                finding = {
                    'type': 'capa_overdue',
                    'overdue_count': overdue_count,
                    'threshold_days': self.QUALITY_THRESHOLDS['capa_overdue_days'],
                    'description': f'{overdue_count}건의 불합격 건이 {self.QUALITY_THRESHOLDS["capa_overdue_days"]}일 이상 미해결',
                    'severity': 'HIGH' if overdue_count >= 5 else 'MEDIUM',
                }
                findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'CAPA 지연 추적 중 오류 발생: {str(e)}'
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
            if finding.get('type') == 'defect_cluster':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = [
                        f'{finding["product_name"]} 불량 원인 분석',
                        '공정 조건 재검토',
                        '원자재 품질 점검',
                        '작업자 재교육',
                    ]

                    recommendation = {
                        'title': f"{finding['product_name']} 품질 개선 필요",
                        'description': finding['description'],
                        'category': 'quality_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'quality',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'defect_type_cluster':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = self._get_defect_type_recommendations(
                        finding['defect_type_code'],
                        finding['severity_level']
                    )

                    recommendation = {
                        'title': f"{finding['defect_type_name']} 개선 대책 필요",
                        'description': finding['description'],
                        'category': 'defect_type_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'quality',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'capa_overdue':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = [
                        f'{finding["overdue_count"]}건의 미해결 CAPA 일정 확인',
                        'CAPA 추진 책임자 지정',
                        '주간 진행 상황 점검',
                    ]

                    recommendation = {
                        'title': "CAPA 지연 해결 필요",
                        'description': finding['description'],
                        'category': 'capa_management',
                        'priority': 'high',
                        'domain': 'quality',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

        return recommendations

    def _get_defect_type_recommendations(self, defect_type: str, severity: str) -> List[str]:
        """
        불량 유형별 추천사항

        Args:
            defect_type: 불량 유형 코드
            severity: 심각도

        Returns:
            추천사항 목록
        """
        # 일반적인 추천사항 (실제로는 불량 유형별로 세분화 필요)
        recommendations = {
            'default': [
                '해당 불량 유형 발생 원인 분석',
                '공정 조건 최적화',
                '검사 기준 재검토',
                '작업 표준서(SOP) 업데이트',
            ],
        }

        return recommendations.get(defect_type, recommendations['default'])

    def _create_defect_event(self, finding: Dict[str, Any]) -> Optional[Any]:
        """불량 발생 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_quality_issue(
                scope_type='product',
                scope_id=finding['product_code'],
                product_code=finding['product_code'],
                product_name=finding['product_name'],
                defect_rate=finding['defect_rate'],
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _create_capa_event(self, finding: Dict[str, Any]) -> Optional[Any]:
        """CAPA 지연 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_capa_overdue(
                scope_type='quality',
                scope_id='capa_overdue',
                overdue_count=finding['overdue_count'],
                threshold_days=finding['threshold_days'],
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
