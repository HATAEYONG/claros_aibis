from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Sum
from .models import (
    QualityInspection,
    DefectType,
    DefectRecord,
    CustomerComplaint,
    ProcessCapability,
)
from .serializers import (
    QualityInspectionSerializer,
    QualityInspectionListSerializer,
    DefectTypeSerializer,
    DefectRecordSerializer,
    CustomerComplaintSerializer,
    CustomerComplaintListSerializer,
    ProcessCapabilitySerializer,
    ProcessCapabilityListSerializer,
)


# 더미 데이터 헬퍼 함수
def get_dummy_inspections():
    """품질 검사 더미 데이터"""
    from datetime import date, timedelta
    data = []
    for i in range(10):
        d = date.today() - timedelta(days=i)
        data.append({
            'id': i + 1,
            'inspection_number': f'INS-2024-{1000+i}',
            'inspection_type': '출하검사',
            'product_name': '타이레놀정' if i % 2 == 0 else '자일리톨정',
            'product_code': 'MED-001' if i % 2 == 0 else 'MED-002',
            'lot_number': f'LOT-{d.strftime("%Y%m%d")}',
            'inspection_date': d.isoformat(),
            'sample_size': 500,
            'defect_count': 3 if i % 3 == 0 else 1,
            'result': 'pass' if i % 4 != 0 else 'fail',
        })
    return data


def get_dummy_defect_types():
    """불량 유형 더미 데이터"""
    return [
        {'id': 1, 'code': 'D001', 'name': '크기불량', 'description': '제품 크기 규격 미달'},
        {'id': 2, 'code': 'D002', 'name': '외관불량', 'description': '표면 흠집, 변색 등'},
        {'id': 3, 'code': 'D003', 'name': '중량불량', 'description': '중량 규격 미달'},
        {'id': 4, 'code': 'D004', 'name': '함량불량', 'description': '유효성분 함량 미달'},
    ]


def get_dummy_complaints():
    """고객 클레임 더미 데이터"""
    from datetime import date, timedelta
    return [
        {'id': 1, 'complaint_number': 'CMP-2024-001', 'customer_name': '삼약제약', 'product_name': '타이레놀정', 'severity': 'medium', 'status': 'resolved', 'complaint_date': (date.today() - timedelta(days=5)).isoformat()},
        {'id': 2, 'complaint_number': 'CMP-2024-002', 'customer_name': '한독약품', 'product_name': '비타민C', 'severity': 'low', 'status': 'investigating', 'complaint_date': (date.today() - timedelta(days=3)).isoformat()},
        {'id': 3, 'complaint_number': 'CMP-2024-003', 'customer_name': '동양약품', 'product_name': '미용크림', 'severity': 'high', 'status': 'in_progress', 'complaint_date': (date.today() - timedelta(days=1)).isoformat()},
    ]


def get_dummy_process_capability():
    """공정 능력 더미 데이터"""
    return [
        {'id': 1, 'product_code': 'MED-001', 'product_name': '타이레놀정', 'process_name': '정제공정', 'cpk': 1.85, 'measurement_date': '2024-12-10'},
        {'id': 2, 'product_code': 'MED-002', 'product_name': '자일리톨정', 'process_name': '정제공정', 'cpk': 1.65, 'measurement_date': '2024-12-10'},
        {'id': 3, 'product_code': 'COS-001', 'product_name': '미용크림', 'process_name': '충진공정', 'cpk': 1.25, 'measurement_date': '2024-12-10'},
        {'id': 4, 'product_code': 'MED-003', 'product_name': '비타민C', 'process_name': '혼합공정', 'cpk': 1.92, 'measurement_date': '2024-12-10'},
    ]


class QualityInspectionViewSet(viewsets.ModelViewSet):
    """품질 검사 ViewSet"""
    queryset = QualityInspection.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['inspection_type', 'result', 'inspection_date']
    search_fields = ['inspection_number', 'product_name', 'product_code', 'lot_number']
    ordering_fields = ['inspection_date']
    ordering = ['-inspection_date']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return QualityInspectionListSerializer
        return QualityInspectionSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_inspections())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """검사 통계"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset

        if not queryset.exists():
            dummy = get_dummy_inspections()
            total = len(dummy)
            passed = len([d for d in dummy if d['result'] == 'pass'])
            failed = len([d for d in dummy if d['result'] == 'fail'])
            total_samples = sum(d['sample_size'] for d in dummy)
            total_defects = sum(d['defect_count'] for d in dummy)

            return Response({
                'total_inspections': total,
                'passed': passed,
                'failed': failed,
                'pass_rate': round((passed / total * 100), 2) if total > 0 else 0,
                'average_defect_rate': round((total_defects / total_samples * 100), 2) if total_samples > 0 else 0,
            })

        if year:
            queryset = queryset.filter(inspection_date__year=year)
        if month:
            queryset = queryset.filter(inspection_date__month=month)

        total = queryset.count()
        passed = queryset.filter(result='pass').count()
        failed = queryset.filter(result='fail').count()

        # 평균 불량률
        total_samples = sum([i.sample_size for i in queryset])
        total_defects = sum([i.defect_count for i in queryset])
        avg_defect_rate = round((total_defects / total_samples * 100), 2) if total_samples > 0 else 0

        return Response({
            'total_inspections': total,
            'passed': passed,
            'failed': failed,
            'pass_rate': round((passed / total * 100), 2) if total > 0 else 0,
            'average_defect_rate': avg_defect_rate,
        })

    @action(detail=False, methods=['get'])
    def defect_analysis(self, request):
        """불량 분석"""
        from datetime import datetime, timedelta

        days = int(request.query_params.get('days', 30))
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)

        inspections = self.queryset.filter(
            inspection_date__gte=start_date,
            inspection_date__lte=end_date
        )

        if not inspections.exists():
            dummy = get_dummy_defect_types()
            return Response({
                'period': f'{start_date} ~ {end_date}',
                'defect_by_type': [{'defect_type__name': d['name'], 'total': 10 - i} for i, d in enumerate(dummy)],
            })

        # 불량 유형별 집계
        defect_records = DefectRecord.objects.filter(
            inspection__in=inspections
        ).values('defect_type__name').annotate(
            total=Sum('quantity')
        ).order_by('-total')[:10]

        return Response({
            'period': f'{start_date} ~ {end_date}',
            'defect_by_type': list(defect_records),
        })


class DefectTypeViewSet(viewsets.ModelViewSet):
    """불량 유형 ViewSet"""
    queryset = DefectType.objects.all()
    serializer_class = DefectTypeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'description']

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response(get_dummy_defect_types())
        return super().list(request, *args, **kwargs)


class DefectRecordViewSet(viewsets.ModelViewSet):
    """불량 기록 ViewSet"""
    queryset = DefectRecord.objects.all()
    serializer_class = DefectRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'defect_type']


class CustomerComplaintViewSet(viewsets.ModelViewSet):
    """고객 클레임 ViewSet"""
    queryset = CustomerComplaint.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'severity', 'complaint_date']
    search_fields = ['complaint_number', 'customer_name', 'product_name']
    ordering_fields = ['complaint_date', 'severity']
    ordering = ['-complaint_date']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return CustomerComplaintListSerializer
        return CustomerComplaintSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_complaints())
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """담당자 할당"""
        complaint = self.get_object()
        assigned_to = request.data.get('assigned_to')

        if not assigned_to:
            return Response(
                {'error': '담당자(assigned_to)가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint.assigned_to = assigned_to
        complaint.status = 'investigating'
        complaint.save()

        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """클레임 해결"""
        complaint = self.get_object()

        from django.utils import timezone
        complaint.status = 'resolved'
        complaint.resolution_date = timezone.now().date()
        complaint.save()

        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """클레임 요약"""
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_complaints()
            by_status = [
                {'status': 'resolved', 'count': len([d for d in dummy if d['status'] == 'resolved'])},
                {'status': 'investigating', 'count': len([d for d in dummy if d['status'] == 'investigating'])},
                {'status': 'in_progress', 'count': len([d for d in dummy if d['status'] == 'in_progress'])},
            ]
            by_severity = [
                {'severity': 'high', 'count': len([d for d in dummy if d['severity'] == 'high'])},
                {'severity': 'medium', 'count': len([d for d in dummy if d['severity'] == 'medium'])},
                {'severity': 'low', 'count': len([d for d in dummy if d['severity'] == 'low'])},
            ]
            return Response({
                'total_complaints': len(dummy),
                'by_status': by_status,
                'by_severity': by_severity,
            })

        total = queryset.count()
        by_status = queryset.values('status').annotate(count=Count('id'))
        by_severity = queryset.values('severity').annotate(count=Count('id'))

        return Response({
            'total_complaints': total,
            'by_status': list(by_status),
            'by_severity': list(by_severity),
        })


class ProcessCapabilityViewSet(viewsets.ModelViewSet):
    """공정 능력 ViewSet"""
    queryset = ProcessCapability.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product_code', 'measurement_date']
    search_fields = ['product_name', 'product_code', 'process_name']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return ProcessCapabilityListSerializer
        return ProcessCapabilitySerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_process_capability())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def below_threshold(self, request):
        """CPK 1.33 미만 공정"""
        threshold = float(request.query_params.get('threshold', 1.33))

        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_process_capability()
            below = [d for d in dummy if d['cpk'] < threshold]
            return Response({
                'threshold': threshold,
                'count': len(below),
                'processes': below,
            })

        processes = queryset.filter(cpk__lt=threshold).order_by('cpk')
        serializer = self.get_serializer(processes, many=True)

        return Response({
            'threshold': threshold,
            'count': processes.count(),
            'processes': serializer.data,
        })
