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


# 더미 데이터 헬퍼 함수
def get_dummy_hourly_production():
    """시간별 생산 더미 데이터"""
    return [
        {'id': 1, 'production_date': '2024-12-01', 'hour': 8, 'line_id': 'LINE-001', 'line_name': '제1라인', 'target': 5000, 'actual': 4850, 'achievement_rate': 97.0},
        {'id': 2, 'production_date': '2024-12-01', 'hour': 9, 'line_id': 'LINE-001', 'line_name': '제1라인', 'target': 5000, 'actual': 4920, 'achievement_rate': 98.4},
        {'id': 3, 'production_date': '2024-12-01', 'hour': 10, 'line_id': 'LINE-002', 'line_name': '제2라인', 'target': 4500, 'actual': 4420, 'achievement_rate': 98.2},
    ]


def get_dummy_line_utilization():
    """라인 가동률 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-001', 'line_name': '제1라인', 'planned_time': 600, 'actual_time': 580, 'downtime': 20, 'utilization_rate': 96.7},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-002', 'line_name': '제2라인', 'planned_time': 600, 'actual_time': 570, 'downtime': 30, 'utilization_rate': 95.0},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-003', 'line_name': '제3라인', 'planned_time': 480, 'actual_time': 465, 'downtime': 15, 'utilization_rate': 96.9},
    ]


def get_dummy_worker_productivity():
    """작업자 생산성 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'worker_id': 'W-001', 'worker_name': '김작업', 'department': '제1작업장', 'output_quantity': 12500, 'working_hours': 160, 'productivity': 78.1, 'achievement_rate': 102.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'worker_id': 'W-002', 'worker_name': '이작업', 'department': '제1작업장', 'output_quantity': 11800, 'working_hours': 160, 'productivity': 73.8, 'achievement_rate': 97.5},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'worker_id': 'W-003', 'worker_name': '박작업', 'department': '제2작업장', 'output_quantity': 11200, 'working_hours': 155, 'productivity': 72.3, 'achievement_rate': 98.2},
    ]


def get_dummy_oee_components():
    """OEE 구성요소 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-001', 'line_name': '제1라인', 'availability': 95.5, 'performance': 92.3, 'quality_rate': 98.8, 'oee': 87.0},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-002', 'line_name': '제2라인', 'availability': 93.2, 'performance': 94.5, 'quality_rate': 99.2, 'oee': 87.4},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'line_id': 'LINE-003', 'line_name': '제3라인', 'availability': 97.8, 'performance': 91.0, 'quality_rate': 97.5, 'oee': 86.8},
    ]


def get_dummy_production_efficiency():
    """생산 효율 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': '라인', 'efficiency': 96.5, 'target': 95, 'variance': 1.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': '설비', 'efficiency': 92.3, 'target': 90, 'variance': 2.3},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': '인력', 'efficiency': 98.2, 'target': 95, 'variance': 3.2},
    ]


def get_dummy_daily_production_summary():
    """일일 생산 요약 더미 데이터"""
    return [
        {'id': 1, 'production_date': '2024-12-01', 'total_target': 140000, 'total_actual': 136800, 'overall_efficiency': 97.7, 'defect_count': 1450, 'defect_rate': 1.06, 'downtime_minutes': 65},
        {'id': 2, 'production_date': '2024-12-02', 'total_target': 140000, 'total_actual': 137500, 'overall_efficiency': 98.2, 'defect_count': 1280, 'defect_rate': 0.93, 'downtime_minutes': 45},
        {'id': 3, 'production_date': '2024-12-03', 'total_target': 140000, 'total_actual': 135200, 'overall_efficiency': 96.6, 'defect_count': 1620, 'defect_rate': 1.2, 'downtime_minutes': 85},
    ]


class HourlyProductionViewSet(viewsets.ModelViewSet):
    queryset = HourlyProduction.objects.all()
    serializer_class = HourlyProductionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['production_date', 'hour', 'line_id']
    search_fields = ['line_id', 'line_name']
    ordering_fields = ['production_date', 'hour', 'achievement_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_hourly_production())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_line(self, request):
        date = request.query_params.get('date')
        line_id = request.query_params.get('line_id')
        queryset = self.get_queryset()
        if date:
            queryset = queryset.filter(production_date=date)
        if line_id:
            queryset = queryset.filter(line_id=line_id)

        if not queryset.exists():
            dummy = get_dummy_hourly_production()
            if date:
                dummy = [d for d in dummy if d['production_date'] == date]
            if line_id:
                dummy = [d for d in dummy if d['line_id'] == line_id]
            return Response(sorted(dummy, key=lambda x: x['hour']))

        return Response(self.get_serializer(queryset.order_by('hour'), many=True).data)


class LineUtilizationViewSet(viewsets.ModelViewSet):
    queryset = LineUtilization.objects.all()
    serializer_class = LineUtilizationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'line_id']
    search_fields = ['line_id', 'line_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'utilization_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_line_utilization())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_line_utilization()
            return Response({
                'total_planned_time': sum(d['planned_time'] for d in dummy),
                'total_actual_time': sum(d['actual_time'] for d in dummy),
                'total_downtime': sum(d['downtime'] for d in dummy),
                'avg_utilization_rate': round(sum(d['utilization_rate'] for d in dummy) / len(dummy), 2),
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_worker_productivity())
        return super().list(request, *args, **kwargs)

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

        if not queryset.exists():
            dummy = sorted(get_dummy_worker_productivity(), key=lambda x: x['productivity'], reverse=True)
            return Response(dummy[:limit])

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

        if not queryset.exists():
            dummy = get_dummy_worker_productivity()
            dept_map = {}
            for d in dummy:
                if d['department'] not in dept_map:
                    dept_map[d['department']] = {'total_productivity': 0, 'total_achievement': 0, 'total_output': 0, 'count': 0}
                dept_map[d['department']]['total_productivity'] += d['productivity']
                dept_map[d['department']]['total_achievement'] += d['achievement_rate']
                dept_map[d['department']]['total_output'] += d['output_quantity']
                dept_map[d['department']]['count'] += 1

            result = [{'department': k, 'avg_productivity': round(v['total_productivity'] / v['count'], 2),
                       'avg_achievement': round(v['total_achievement'] / v['count'], 2), 'total_output': v['total_output']}
                      for k, v in dept_map.items()]
            return Response(sorted(result, key=lambda x: x['avg_productivity'], reverse=True))

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_oee_components())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def avg_components(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_oee_components()
            return Response({
                'avg_availability': round(sum(d['availability'] for d in dummy) / len(dummy), 2),
                'avg_performance': round(sum(d['performance'] for d in dummy) / len(dummy), 2),
                'avg_quality': round(sum(d['quality_rate'] for d in dummy) / len(dummy), 2),
                'avg_oee': round(sum(d['oee'] for d in dummy) / len(dummy), 2),
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_production_efficiency())
        return super().list(request, *args, **kwargs)


class DailyProductionSummaryViewSet(viewsets.ModelViewSet):
    queryset = DailyProductionSummary.objects.all()
    serializer_class = DailyProductionSummarySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['production_date']
    ordering_fields = ['production_date', 'overall_efficiency', 'defect_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_daily_production_summary())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        days = int(request.query_params.get('days', 7))
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response(sorted(get_dummy_daily_production_summary(), key=lambda x: x['production_date'], reverse=True)[:days])
        recent = queryset.order_by('-production_date')[:days]
        return Response(self.get_serializer(recent, many=True).data)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        days = int(request.query_params.get('days', 30))
        queryset = self.get_queryset()
        if not queryset.exists():
            dummy = sorted(get_dummy_daily_production_summary(), key=lambda x: x['production_date'], reverse=True)[:days]
            trend_data = [{'production_date': d['production_date'], 'overall_efficiency': d['overall_efficiency'],
                          'defect_rate': d['defect_rate'], 'total_actual': d['total_actual']} for d in dummy]
            return Response(trend_data)
        data = queryset.order_by('-production_date')[:days]

        trend_data = list(data.values(
            'production_date', 'overall_efficiency', 'defect_rate', 'total_actual'
        ))
        return Response(trend_data)
