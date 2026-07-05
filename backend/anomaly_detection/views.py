# -*- coding: utf-8 -*-
"""
Anomaly Detection API Views
이상탐지 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import AnomalyDetector, AnomalyAlert, AnomalyPattern
from .serializers import AnomalyDetectorSerializer, AnomalyAlertSerializer
from .services.anomaly_service import AnomalyDetectionService


class AnomalyDetectorViewSet(viewsets.ModelViewSet):
    """이상탐지기 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = AnomalyDetector.objects.all()
    serializer_class = AnomalyDetectorSerializer

    def get_queryset(self):
        return AnomalyDetector.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def detect(self, request, pk=None):
        """이상 탐지 수행"""
        detector = self.get_object()

        data_points = request.data.get('data_points', [])

        service = AnomalyDetectionService()
        result = service.detect_anomalies(
            detector_code=detector.code,
            data_points=data_points
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def configure(self, request, pk=None):
        """탐지기 설정 변경"""
        detector_id = str(pk)

        service = AnomalyDetectionService()
        result = service.configure_detector(
            detector_id=detector_id,
            threshold=request.data.get('threshold'),
            sensitivity=request.data.get('sensitivity'),
            parameters=request.data.get('parameters'),
        )

        return Response(result)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """탐지기 통계"""
        detector = self.get_object()

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date and end_date:
            from datetime import datetime

            service = AnomalyDetectionService()
            stats = service.get_anomaly_statistics(
                detector_code=detector.code,
                start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
                end_date=datetime.strptime(end_date, '%Y-%m-%d').date(),
            )

            return Response(stats)

        return Response({
            'message': 'Provide start_date and end_date parameters'
        })


class AnomalyAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """이상 알림 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = AnomalyAlert.objects.all()
    serializer_class = AnomalyAlertSerializer

    def get_queryset(self):
        return AnomalyAlert.objects.all().order_by('-detected_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 이상 알림 조회"""
        detector_code = request.query_params.get('detector_code')
        severity = request.query_params.get('severity')
        status = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))

        service = AnomalyDetectionService()
        anomalies = service.get_recent_anomalies(
            detector_code=detector_code,
            severity=severity,
            status=status,
            limit=limit
        )

        return Response({
            'anomalies': anomalies,
            'count': len(anomalies),
        })

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """이상 해제"""
        alert_id = str(pk)

        resolved_by = request.data.get('resolved_by', request.user.username if request.user.is_authenticated else 'system')
        resolution_notes = request.data.get('resolution_notes', '')

        service = AnomalyDetectionService()
        result = service.resolve_anomaly(
            alert_id=alert_id,
            resolved_by=resolved_by,
            resolution_notes=resolution_notes
        )

        return Response(result)


class AnomalyDetectionViewSet(viewsets.ViewSet):
    """이상탐지 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_detector(self, request):
        """탐지기 생성"""
        name = request.data.get('name')
        code = request.data.get('code')
        target_metric = request.data.get('target_metric')
        detector_type = request.data.get('detector_type', 'statistical')
        target_entity = request.data.get('target_entity', '')
        parameters = request.data.get('parameters', {})
        threshold = request.data.get('threshold', 2.0)
        sensitivity = request.data.get('sensitivity', 'medium')
        description = request.data.get('description', '')

        service = AnomalyDetectionService()
        result = service.create_detector(
            name=name,
            code=code,
            target_metric=target_metric,
            detector_type=detector_type,
            target_entity=target_entity,
            parameters=parameters,
            threshold=threshold,
            sensitivity=sensitivity,
            description=description,
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def detect(self, request):
        """이상 탐지 수행"""
        detector_code = request.data.get('detector_code')
        data_points = request.data.get('data_points', [])

        service = AnomalyDetectionService()
        result = service.detect_anomalies(
            detector_code=detector_code,
            data_points=data_points
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def recent_anomalies(self, request):
        """최근 이상 조회"""
        detector_code = request.query_params.get('detector_code')
        severity = request.query_params.get('severity')
        status = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))

        service = AnomalyDetectionService()
        anomalies = service.get_recent_anomalies(
            detector_code=detector_code,
            severity=severity,
            status=status,
            limit=limit
        )

        return Response({
            'anomalies': anomalies,
            'count': len(anomalies),
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """이상 통계 조회"""
        detector_code = request.query_params.get('detector_code')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not all([detector_code, start_date, end_date]):
            return Response({
                'error': 'detector_code, start_date, and end_date are required',
            }, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime

        service = AnomalyDetectionService()
        stats = service.get_anomaly_statistics(
            detector_code=detector_code,
            start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
            end_date=datetime.strptime(end_date, '%Y-%m-%d').date(),
        )

        return Response(stats)
