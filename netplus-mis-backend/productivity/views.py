from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg

from .models import (
    HourlyProduction, LineUtilization, WorkerProductivity,
    OEEComponent, ProductionEfficiency, DailyProductionSummary
)
from .serializers import (
    HourlyProductionSerializer, LineUtilizationSerializer,
    WorkerProductivitySerializer, OEEComponentSerializer,
    ProductionEfficiencySerializer, DailyProductionSummarySerializer
)


class HourlyProductionViewSet(viewsets.ModelViewSet):
    queryset = HourlyProduction.objects.all()
    serializer_class = HourlyProductionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['production_date', 'hour', 'line_id']
    search_fields = ['line_id', 'line_name']
    ordering_fields = ['production_date', 'hour', 'achievement_rate']

    @action(detail=False, methods=['get'])
    def by_line(self, request):
        date = request.query_params.get('date')
        line_id = request.query_params.get('line_id')
        queryset = self.get_queryset()
        if date:
            queryset = queryset.filter(production_date=date)
        if line_id:
            queryset = queryset.filter(line_id=line_id)

        return Response(self.get_serializer(queryset.order_by('hour'), many=True).data)


class LineUtilizationViewSet(viewsets.ModelViewSet):
    queryset = LineUtilization.objects.all()
    serializer_class = LineUtilizationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'line_id']
    search_fields = ['line_id', 'line_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'utilization_rate']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        summary = queryset.aggregate(
            total_planned_time=Sum('planned_time'),
            total_actual_time=Sum('actual_time'),
            total_downtime=Sum('downtime'),
            avg_utilization_rate=Avg('utilization_rate')
        )
        return Response(summary)


class WorkerProductivityViewSet(viewsets.ModelViewSet):
    queryset = WorkerProductivity.objects.all()
    serializer_class = WorkerProductivitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['worker_id', 'worker_name', 'department']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'productivity', 'achievement_rate']

    @action(detail=False, methods=['get'])
    def top_performers(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        limit = int(request.query_params.get('limit', 10))
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        top = queryset.order_by('-productivity')[:limit]
        return Response(self.get_serializer(top, many=True).data)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        departments = queryset.values('department').annotate(
            avg_productivity=Avg('productivity'),
            avg_achievement=Avg('achievement_rate'),
            total_output=Sum('output_quantity')
        ).order_by('-avg_productivity')

        return Response(list(departments))


class OEEComponentViewSet(viewsets.ModelViewSet):
    queryset = OEEComponent.objects.all()
    serializer_class = OEEComponentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'line_id']
    search_fields = ['line_id', 'line_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'oee', 'availability', 'performance', 'quality_rate']

    @action(detail=False, methods=['get'])
    def avg_components(self, request):
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
            avg_quality=Avg('quality_rate'),
            avg_oee=Avg('oee')
        )
        return Response(avg)


class ProductionEfficiencyViewSet(viewsets.ModelViewSet):
    queryset = ProductionEfficiency.objects.all()
    serializer_class = ProductionEfficiencySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['category']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'efficiency']


class DailyProductionSummaryViewSet(viewsets.ModelViewSet):
    queryset = DailyProductionSummary.objects.all()
    serializer_class = DailyProductionSummarySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['production_date']
    ordering_fields = ['production_date', 'overall_efficiency', 'defect_rate']

    @action(detail=False, methods=['get'])
    def recent(self, request):
        days = int(request.query_params.get('days', 7))
        recent = self.get_queryset().order_by('-production_date')[:days]
        return Response(self.get_serializer(recent, many=True).data)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        days = int(request.query_params.get('days', 30))
        data = self.get_queryset().order_by('-production_date')[:days]

        trend_data = list(data.values(
            'production_date', 'overall_efficiency', 'defect_rate', 'total_actual'
        ))
        return Response(trend_data)
