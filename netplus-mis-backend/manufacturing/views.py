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


class WorkshopStatusViewSet(viewsets.ModelViewSet):
    queryset = WorkshopStatus.objects.all()
    serializer_class = WorkshopStatusSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['workshop_id', 'workshop_name', 'current_product']
    ordering_fields = ['workshop_id', 'efficiency', 'actual_output']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

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

    @action(detail=False, methods=['get'])
    def bottlenecks(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

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

    @action(detail=False, methods=['get'])
    def avg_oee(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

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

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        date = request.query_params.get('date')
        queryset = self.get_queryset()
        if date:
            queryset = queryset.filter(date=date)

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

    @action(detail=False, methods=['get'])
    def active_standards(self, request):
        active = self.get_queryset().filter(status='active')
        return Response(self.get_serializer(active, many=True).data)


class EquipmentDowntimeViewSet(viewsets.ModelViewSet):
    queryset = EquipmentDowntime.objects.all()
    serializer_class = EquipmentDowntimeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment_id', 'reason']
    search_fields = ['equipment_id', 'equipment_name', 'description']
    ordering_fields = ['start_time', 'downtime_minutes']

    @action(detail=False, methods=['get'])
    def by_reason(self, request):
        queryset = self.get_queryset()

        result = {}
        for reason_code, reason_name in EquipmentDowntime.REASON_CHOICES:
            filtered = queryset.filter(reason=reason_code)
            result[reason_code] = {
                'count': filtered.count(),
                'total_minutes': filtered.aggregate(total=Sum('downtime_minutes'))['total'] or 0
            }

        return Response(result)
