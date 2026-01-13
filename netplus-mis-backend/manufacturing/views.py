from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg, Count

from .models import (
    WorkshopStatus, CycleTime, OEEMetric,
    ManpowerAllocation, WorkStandard, EquipmentDowntime
)
from .serializers import (
    WorkshopStatusSerializer, CycleTimeSerializer, OEEMetricSerializer,
    ManpowerAllocationSerializer, WorkStandardSerializer, EquipmentDowntimeSerializer
)


# 더미 데이터 헬퍼 함수
def get_dummy_workshop_status():
    """작업장 상태 더미 데이터"""
    return [
        {'id': 1, 'workshop_id': 'WS-001', 'workshop_name': '제1작업장', 'status': 'running', 'current_product': '타이레놀정', 'target_output': 50000, 'actual_output': 48500, 'efficiency': 97.0},
        {'id': 2, 'workshop_id': 'WS-002', 'workshop_name': '제2작업장', 'status': 'running', 'current_product': '자일리톨정', 'target_output': 45000, 'actual_output': 44200, 'efficiency': 98.2},
        {'id': 3, 'workshop_id': 'WS-003', 'workshop_name': '제3작업장', 'status': 'maintenance', 'current_product': '미용크림', 'target_output': 30000, 'actual_output': 0, 'efficiency': 0},
        {'id': 4, 'workshop_id': 'WS-004', 'workshop_name': '제4작업장', 'status': 'running', 'current_product': '비타민C', 'target_output': 35000, 'actual_output': 34100, 'efficiency': 97.4},
    ]


def get_dummy_cycle_time():
    """공정별 사이클타임 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'process_name': '혼합', 'standard_time': 15, 'actual_time': 14.8, 'variance_rate': -1.33},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'process_name': '압축', 'standard_time': 8, 'actual_time': 8.2, 'variance_rate': 2.5},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'process_name': '코팅', 'standard_time': 12, 'actual_time': 11.5, 'variance_rate': -4.17},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'process_name': '포장', 'standard_time': 10, 'actual_time': 9.8, 'variance_rate': -2.0},
    ]


def get_dummy_oee_metrics():
    """OEE 지표 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'equipment_id': 'EQ-001', 'equipment_name': '혼합기-1', 'availability': 95.5, 'performance': 92.3, 'quality': 98.8, 'oee': 87.0},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'equipment_id': 'EQ-002', 'equipment_name': '압축기-1', 'availability': 93.2, 'performance': 94.5, 'quality': 99.2, 'oee': 87.4},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'equipment_id': 'EQ-003', 'equipment_name': '코팅기-1', 'availability': 97.8, 'performance': 91.0, 'quality': 97.5, 'oee': 86.8},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'equipment_id': 'EQ-004', 'equipment_name': '포장기-1', 'availability': 98.5, 'performance': 96.2, 'quality': 99.0, 'oee': 94.0},
    ]


def get_dummy_manpower_allocation():
    """인원 배정 더미 데이터"""
    return [
        {'id': 1, 'date': '2024-12-01', 'workshop': '제1작업장', 'shift': '주간', 'allocated_workers': 25, 'present_workers': 24, 'absent_workers': 1, 'overtime_workers': 3, 'attendance_rate': 96.0},
        {'id': 2, 'date': '2024-12-01', 'workshop': '제2작업장', 'shift': '주간', 'allocated_workers': 20, 'present_workers': 20, 'absent_workers': 0, 'overtime_workers': 2, 'attendance_rate': 100.0},
        {'id': 3, 'date': '2024-12-01', 'workshop': '제3작업장', 'shift': '주간', 'allocated_workers': 18, 'present_workers': 17, 'absent_workers': 1, 'overtime_workers': 1, 'attendance_rate': 94.44},
    ]


def get_dummy_work_standards():
    """작업 표준 더미 데이터"""
    return [
        {'id': 1, 'standard_id': 'WS-001', 'title': '혼합공정 표준작업', 'process': '혼합', 'status': 'active', 'standard_time': 15, 'description': '원료 혼합 표준 작업절차'},
        {'id': 2, 'standard_id': 'WS-002', 'title': '압축공정 표준작업', 'process': '압축', 'status': 'active', 'standard_time': 8, 'description': '정제 압축 표준 작업절차'},
        {'id': 3, 'standard_id': 'WS-003', 'title': '코팅공정 표준작업', 'process': '코팅', 'status': 'active', 'standard_time': 12, 'description': '정제 코팅 표준 작업절차'},
    ]


def get_dummy_equipment_downtime():
    """설비 가동중단 더미 데이터"""
    return [
        {'id': 1, 'equipment_id': 'EQ-001', 'equipment_name': '혼합기-1', 'start_time': '2024-12-01T10:00:00', 'end_time': '2024-12-01T10:30:00', 'downtime_minutes': 30, 'reason': 'breakdown', 'description': '모터 고장'},
        {'id': 2, 'equipment_id': 'EQ-003', 'equipment_name': '코팅기-1', 'start_time': '2024-12-02T14:00:00', 'end_time': '2024-12-02T14:15:00', 'downtime_minutes': 15, 'reason': 'maintenance', 'description': '예방 정비'},
        {'id': 3, 'equipment_id': 'EQ-002', 'equipment_name': '압축기-1', 'start_time': '2024-12-03T08:30:00', 'end_time': '2024-12-03T09:00:00', 'downtime_minutes': 30, 'reason': 'setup', 'description': '제품 변경 설정'},
    ]


class WorkshopStatusViewSet(viewsets.ModelViewSet):
    queryset = WorkshopStatus.objects.all()
    serializer_class = WorkshopStatusSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['workshop_id', 'workshop_name', 'current_product']
    ordering_fields = ['workshop_id', 'efficiency', 'actual_output']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_workshop_status())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_workshop_status()
            return Response({
                'total_workshops': len(dummy),
                'by_status': {'running': 3, 'stopped': 0, 'maintenance': 1},
                'total_output': sum(d['actual_output'] for d in dummy),
                'avg_efficiency': round(sum(d['efficiency'] for d in dummy if d['efficiency'] > 0) / len([d for d in dummy if d['efficiency'] > 0]), 2) if any(d['efficiency'] > 0 for d in dummy) else 0,
            })

        summary = {
            'total_workshops': queryset.count(),
            'by_status': {},
            'total_output': queryset.aggregate(total=Sum('actual_output'))['total'] or 0,
            'avg_efficiency': queryset.aggregate(avg=Avg('efficiency'))['avg'] or 0,
        }

        for status_code, status_name in WorkshopStatus.STATUS_CHOICES:
            summary['by_status'][status_code] = queryset.filter(status=status_code).count()

        return Response(summary)


class CycleTimeViewSet(viewsets.ModelViewSet):
    queryset = CycleTime.objects.all()
    serializer_class = CycleTimeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'process_name']
    search_fields = ['process_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'variance_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_cycle_time())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def bottlenecks(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_cycle_time()
            bottlenecks = [d for d in dummy if abs(d['variance_rate']) > 3]
            return Response(sorted(bottlenecks, key=lambda x: abs(x['variance_rate']), reverse=True))

        # 편차율이 높은 공정 (병목)
        bottlenecks = queryset.filter(variance_rate__gt=10).order_by('-variance_rate')
        return Response(self.get_serializer(bottlenecks, many=True).data)


class OEEMetricViewSet(viewsets.ModelViewSet):
    queryset = OEEMetric.objects.all()
    serializer_class = OEEMetricSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'equipment_id']
    search_fields = ['equipment_id', 'equipment_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'oee', 'availability', 'performance', 'quality']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_oee_metrics())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def avg_oee(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_oee_metrics()
            return Response({
                'avg_availability': round(sum(d['availability'] for d in dummy) / len(dummy), 2),
                'avg_performance': round(sum(d['performance'] for d in dummy) / len(dummy), 2),
                'avg_quality': round(sum(d['quality'] for d in dummy) / len(dummy), 2),
                'avg_oee': round(sum(d['oee'] for d in dummy) / len(dummy), 2),
            })

        avg = queryset.aggregate(
            avg_availability=Avg('availability'),
            avg_performance=Avg('performance'),
            avg_quality=Avg('quality'),
            avg_oee=Avg('oee')
        )
        return Response(avg)


class ManpowerAllocationViewSet(viewsets.ModelViewSet):
    queryset = ManpowerAllocation.objects.all()
    serializer_class = ManpowerAllocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['date', 'workshop', 'shift']
    search_fields = ['workshop']
    ordering_fields = ['date', 'attendance_rate', 'allocated_workers']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_manpower_allocation())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        date = request.query_params.get('date')
        queryset = self.get_queryset()
        if date:
            queryset = queryset.filter(date=date)

        if not queryset.exists():
            dummy = get_dummy_manpower_allocation()
            return Response({
                'total_allocated': sum(d['allocated_workers'] for d in dummy),
                'total_present': sum(d['present_workers'] for d in dummy),
                'total_absent': sum(d['absent_workers'] for d in dummy),
                'total_overtime': sum(d['overtime_workers'] for d in dummy),
                'avg_attendance_rate': round(sum(d['attendance_rate'] for d in dummy) / len(dummy), 2),
            })

        summary = queryset.aggregate(
            total_allocated=Sum('allocated_workers'),
            total_present=Sum('present_workers'),
            total_absent=Sum('absent_workers'),
            total_overtime=Sum('overtime_workers'),
            avg_attendance_rate=Avg('attendance_rate')
        )
        return Response(summary)


class WorkStandardViewSet(viewsets.ModelViewSet):
    queryset = WorkStandard.objects.all()
    serializer_class = WorkStandardSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'process']
    search_fields = ['standard_id', 'title', 'process']
    ordering_fields = ['updated_at', 'standard_time']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_work_standards())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def active_standards(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_work_standards() if d['status'] == 'active'])
        active = queryset.filter(status='active')
        return Response(self.get_serializer(active, many=True).data)


class EquipmentDowntimeViewSet(viewsets.ModelViewSet):
    queryset = EquipmentDowntime.objects.all()
    serializer_class = EquipmentDowntimeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment_id', 'reason']
    search_fields = ['equipment_id', 'equipment_name', 'description']
    ordering_fields = ['start_time', 'downtime_minutes']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_equipment_downtime())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_reason(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_equipment_downtime()
            result = {
                'breakdown': {'count': len([d for d in dummy if d['reason'] == 'breakdown']), 'total_minutes': sum(d['downtime_minutes'] for d in dummy if d['reason'] == 'breakdown')},
                'maintenance': {'count': len([d for d in dummy if d['reason'] == 'maintenance']), 'total_minutes': sum(d['downtime_minutes'] for d in dummy if d['reason'] == 'maintenance')},
                'setup': {'count': len([d for d in dummy if d['reason'] == 'setup']), 'total_minutes': sum(d['downtime_minutes'] for d in dummy if d['reason'] == 'setup'})},
            }
            return Response(result)

        result = {}
        for reason_code, reason_name in EquipmentDowntime.REASON_CHOICES:
            filtered = queryset.filter(reason=reason_code)
            result[reason_code] = {
                'count': filtered.count(),
                'total_minutes': filtered.aggregate(total=Sum('downtime_minutes'))['total'] or 0
            }

        return Response(result)
