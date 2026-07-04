# -*- coding: utf-8 -*-
"""
Anomaly Detection Service
이상탐지 서비스
"""
import uuid
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db.models import Q

from ..models import AnomalyDetector, AnomalyAlert, AnomalyPattern


class AnomalyDetectionService:
    """
    이상탐지 서비스
    """

    def __init__(self):
        self.service_name = "anomaly_detection"

    def create_detector(
        self,
        name: str,
        code: str,
        target_metric: str,
        detector_type: str = 'statistical',
        target_entity: str = "",
        parameters: Dict[str, Any] = None,
        threshold: float = 2.0,
        sensitivity: str = 'medium',
        description: str = ""
    ) -> Dict[str, Any]:
        """
        이상탐지기 생성

        Args:
            name: 탐지기명
            code: 탐지기 코드
            target_metric: 타겟 지표
            detector_type: 탐지기 유형
            target_entity: 타겟 엔티티
            parameters: 파라미터
            threshold: 임계값
            sensitivity: 민감도
            description: 설명

        Returns:
            생성된 탐지기 정보
        """
        try:
            detector = AnomalyDetector.objects.create(
                name=name,
                code=code,
                target_metric=target_metric,
                detector_type=detector_type,
                target_entity=target_entity,
                parameters=parameters or {},
                threshold=threshold,
                sensitivity=sensitivity,
                description=description,
                status='training',
            )

            return {
                'success': True,
                'detector_id': str(detector.id),
                'code': detector.code,
                'name': detector.name,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def detect_anomalies(
        self,
        detector_code: str,
        data_points: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        이상 탐지 수행

        Args:
            detector_code: 탐지기 코드
            data_points: 데이터 포인트 [{timestamp, value, entity_id}]

        Returns:
            탐지 결과
        """
        try:
            detector = AnomalyDetector.objects.get(code=detector_code)

            anomalies = []

            # 통계적 이상탐지
            if detector.detector_type == 'statistical':
                anomalies = self._statistical_detection(
                    detector=detector,
                    data_points=data_points
                )
            # ML 기반 이상탐지
            elif detector.detector_type == 'ml_based':
                anomalies = self._ml_detection(
                    detector=detector,
                    data_points=data_points
                )
            else:
                # 기본 탐지
                anomalies = self._statistical_detection(
                    detector=detector,
                    data_points=data_points
                )

            # 알림 생성
            alerts_created = []
            for anomaly in anomalies:
                alert = AnomalyAlert.objects.create(
                    detector=detector,
                    detected_at=anomaly['detected_at'],
                    metric_name=detector.target_metric,
                    entity_id=anomaly.get('entity_id', ''),
                    actual_value=anomaly['actual_value'],
                    expected_value=anomaly['expected_value'],
                    deviation_score=anomaly['deviation_score'],
                    severity=anomaly['severity'],
                    description=anomaly.get('description', ''),
                    context=anomaly.get('context', {}),
                )
                alerts_created.append(str(alert.id))

            return {
                'success': True,
                'detector_id': str(detector.id),
                'anomalies_detected': len(anomalies),
                'alerts_created': alerts_created,
                'anomalies': anomalies,
            }

        except AnomalyDetector.DoesNotExist:
            return {
                'success': False,
                'error': f'Detector not found: {detector_code}',
            }

    def _statistical_detection(
        self,
        detector: AnomalyDetector,
        data_points: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        통계적 이상탐지 (Z-score 방식)
        """
        anomalies = []
        values = [dp['value'] for dp in data_points]

        if len(values) < 10:
            return anomalies  # 데이터 부족

        mean = np.mean(values)
        std = np.std(values)

        if std == 0:
            return anomalies

        threshold = detector.threshold

        # 민감도별 임계값 조정
        if detector.sensitivity == 'low':
            threshold *= 1.5
        elif detector.sensitivity == 'high':
            threshold *= 0.7

        for dp in data_points:
            z_score = abs((dp['value'] - mean) / std)

            if z_score > threshold:
                # 심각도 결정
                if z_score > threshold * 2:
                    severity = 'critical'
                elif z_score > threshold * 1.5:
                    severity = 'high'
                else:
                    severity = 'medium'

                anomalies.append({
                    'detected_at': dp.get('timestamp', timezone.now()),
                    'entity_id': dp.get('entity_id', ''),
                    'actual_value': dp['value'],
                    'expected_value': float(mean),
                    'deviation_score': float(z_score),
                    'severity': severity,
                    'description': f"{detector.target_metric} 이상 감지 (Z-score: {z_score:.2f})",
                    'context': {
                        'method': 'statistical',
                        'threshold': threshold,
                        'mean': float(mean),
                        'std': float(std),
                    },
                })

        return anomalies

    def _ml_detection(
        self,
        detector: AnomalyDetector,
        data_points: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        ML 기반 이상탐지
        """
        # 실제 구현시 Isolation Forest, Autoencoder 등 사용
        # 여기서는 간단한 구현

        anomalies = []
        values = np.array([[dp['value']] for dp in data_points])

        # 간단한 이상탐지 (IQR 방식)
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        for dp in data_points:
            value = dp['value']

            if value < lower_bound or value > upper_bound:
                # 편차 계산
                if value < lower_bound:
                    deviation = abs((value - lower_bound) / iqr)
                else:
                    deviation = abs((value - upper_bound) / iqr)

                # 심각도 결정
                if deviation > 3:
                    severity = 'critical'
                elif deviation > 2:
                    severity = 'high'
                else:
                    severity = 'medium'

                anomalies.append({
                    'detected_at': dp.get('timestamp', timezone.now()),
                    'entity_id': dp.get('entity_id', ''),
                    'actual_value': float(value),
                    'expected_value': float(np.median(values)),
                    'deviation_score': float(deviation),
                    'severity': severity,
                    'description': f"{detector.target_metric} ML 이상 감지",
                    'context': {
                        'method': 'ml_based',
                        'iqr': float(iqr),
                        'lower_bound': float(lower_bound),
                        'upper_bound': float(upper_bound),
                    },
                })

        return anomalies

    def get_recent_anomalies(
        self,
        detector_code: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        최근 이상 조회

        Args:
            detector_code: 탐지기 코드 필터
            severity: 심각도 필터
            status: 상태 필터
            limit: 반환 개수

        Returns:
            이상 목록
        """
        queryset = AnomalyAlert.objects.all()

        if detector_code:
            queryset = queryset.filter(detector__code=detector_code)
        if severity:
            queryset = queryset.filter(severity=severity)
        if status:
            queryset = queryset.filter(status=status)

        alerts = queryset.order_by('-detected_at')[:limit]

        return [
            {
                'id': str(alert.id),
                'detector_name': alert.detector.name,
                'detected_at': alert.detected_at.isoformat(),
                'metric_name': alert.metric_name,
                'entity_id': alert.entity_id,
                'actual_value': alert.actual_value,
                'expected_value': alert.expected_value,
                'deviation_score': alert.deviation_score,
                'severity': alert.severity,
                'status': alert.status,
                'description': alert.description,
            }
            for alert in alerts
        ]

    def resolve_anomaly(
        self,
        alert_id: str,
        resolved_by: str,
        resolution_notes: str = ""
    ) -> Dict[str, Any]:
        """
        이상 해제

        Args:
            alert_id: 알림 ID
            resolved_by: 해결자
            resolution_notes: 해결 비고

        Returns:
            해제 결과
        """
        try:
            alert = AnomalyAlert.objects.get(id=alert_id)

            alert.status = 'resolved'
            alert.resolved_at = timezone.now()
            alert.resolved_by = resolved_by
            alert.resolution_notes = resolution_notes
            alert.save()

            return {
                'success': True,
                'alert_id': str(alert.id),
                'resolved_at': alert.resolved_at.isoformat(),
            }

        except AnomalyAlert.DoesNotExist:
            return {
                'success': False,
                'error': f'Alert not found: {alert_id}',
            }

    def get_anomaly_statistics(
        self,
        detector_code: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        이상 통계 조회

        Args:
            detector_code: 탐지기 코드
            start_date: 시작일
            end_date: 종료일

        Returns:
            이상 통계
        """
        try:
            detector = AnomalyDetector.objects.get(code=detector_code)

            queryset = AnomalyAlert.objects.filter(
                detector=detector,
                detected_at__date__gte=start_date,
                detected_at__date__lte=end_date
            )

            total_alerts = queryset.count()

            # 심각도별 집계
            by_severity = queryset.values('severity').annotate(
                count=Count('id')
            ).order_by('-count')

            # 상태별 집계
            by_status = queryset.values('status').annotate(
                count=Count('id')
            ).order_by('-count')

            stats = {
                'detector_code': detector_code,
                'detector_name': detector.name,
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                },
                'total_alerts': total_alerts,
                'by_severity': {s['severity']: s['count'] for s in by_severity},
                'by_status': {s['status']: s['count'] for s in by_status},
            }

            return stats

        except AnomalyDetector.DoesNotExist:
            return {
                'error': f'Detector not found: {detector_code}',
            }

    def configure_detector(
        self,
        detector_id: str,
        threshold: Optional[float] = None,
        sensitivity: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        탐지기 설정 변경

        Args:
            detector_id: 탐지기 ID
            threshold: 새 임계값
            sensitivity: 새 민감도
            parameters: 새 파라미터

        Returns:
            설정 변경 결과
        """
        try:
            detector = AnomalyDetector.objects.get(id=detector_id)

            if threshold is not None:
                detector.threshold = threshold
            if sensitivity is not None:
                detector.sensitivity = sensitivity
            if parameters is not None:
                detector.parameters.update(parameters)

            detector.save()

            return {
                'success': True,
                'detector_id': str(detector.id),
                'updated_fields': {
                    'threshold': detector.threshold,
                    'sensitivity': detector.sensitivity,
                    'parameters': detector.parameters,
                },
            }

        except AnomalyDetector.DoesNotExist:
            return {
                'success': False,
                'error': f'Detector not found: {detector_id}',
            }
