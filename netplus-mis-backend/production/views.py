from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Avg, Count
from .models import ProductionLine, WorkOrder, DailyProduction, Equipment
from .serializers import (
    ProductionLineSerializer,
    WorkOrderSerializer,
    WorkOrderListSerializer,
    DailyProductionSerializer,
    EquipmentSerializer,
    EquipmentListSerializer,
)


# 더미 데이터 헬퍼 함수
def get_dummy_production_lines():
    """생산 라인 더미 데이터"""
    return [
        {'id': 1, 'code': 'LINE-001', 'name': '의약품 생산라인 A', 'location': '공장1층', 'is_active': True, 'capacity': 500000},
        {'id': 2, 'code': 'LINE-002', 'name': '의약품 생산라인 B', 'location': '공장1층', 'is_active': True, 'capacity': 450000},
        {'id': 3, 'code': 'LINE-003', 'name': '화장품 생산라인', 'location': '공장2층', 'is_active': True, 'capacity': 300000},
    ]


def get_dummy_work_orders():
    """작업 지시 더미 데이터"""
    return [
        {'id': 1, 'order_number': 'WO-2024-001', 'product_code': 'MED-001', 'product_name': '타이레놀정', 'status': 'in_progress', 'target_quantity': 100000, 'actual_quantity': 65000},
        {'id': 2, 'order_number': 'WO-2024-002', 'product_code': 'MED-002', 'product_name': '자일리톨정', 'status': 'in_progress', 'target_quantity': 80000, 'actual_quantity': 45000},
        {'id': 3, 'order_number': 'WO-2024-003', 'product_code': 'COS-001', 'product_name': '미용크림', 'status': 'completed', 'target_quantity': 50000, 'actual_quantity': 52000},
        {'id': 4, 'order_number': 'WO-2024-004', 'product_code': 'MED-003', 'product_name': '비타민C', 'status': 'planned', 'target_quantity': 120000, 'actual_quantity': 0},
        {'id': 5, 'order_number': 'WO-2024-005', 'product_code': 'COS-002', 'product_name': '선스크린', 'status': 'completed', 'target_quantity': 70000, 'actual_quantity': 71000},
    ]


def get_dummy_daily_production():
    """일일 생산 실적 더미 데이터"""
    from datetime import date, timedelta

    data = []
    for i in range(7):
        d = date.today() - timedelta(days=i)
        data.append({
            'id': i + 1,
            'production_date': d.isoformat(),
            'target_quantity': 450000,
            'actual_quantity': 438000 + (i * 2000),
            'defect_quantity': 850 + (i * 100),
            'efficiency': 97.5 + (i * 0.2),
        })
    return data


def get_dummy_equipment():
    """설비 더미 데이터"""
    return [
        {'id': 1, 'code': 'EQ-001', 'name': '정제기', 'status': 'running', 'production_line': 1, 'utilization_rate': 95.5},
        {'id': 2, 'code': 'EQ-002', 'name': '코팅기', 'status': 'running', 'production_line': 1, 'utilization_rate': 92.3},
        {'id': 3, 'code': 'EQ-003', 'name': '포장기', 'status': 'maintenance', 'production_line': 2, 'utilization_rate': 0},
        {'id': 4, 'code': 'EQ-004', 'name': '혼합기', 'status': 'running', 'production_line': 2, 'utilization_rate': 88.7},
        {'id': 5, 'code': 'EQ-005', 'name': '충진기', 'status': 'running', 'production_line': 3, 'utilization_rate': 91.2},
    ]


class ProductionLineViewSet(viewsets.ModelViewSet):
    """생산 라인 ViewSet"""
    queryset = ProductionLine.objects.all()
    serializer_class = ProductionLineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'location']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_production_lines())
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """라인별 성과 정보"""
        line = self.get_object()

        # 최근 30일 실적
        recent_productions = DailyProduction.objects.filter(
            production_line=line
        ).order_by('-production_date')[:30]

        total_target = sum([p.target_quantity for p in recent_productions])
        total_actual = sum([p.actual_quantity for p in recent_productions])
        avg_efficiency = recent_productions.aggregate(Avg('efficiency'))['efficiency__avg'] or 0

        return Response({
            'line_name': line.name,
            'total_target': total_target,
            'total_actual': total_actual,
            'achievement_rate': round((total_actual / total_target * 100), 2) if total_target > 0 else 0,
            'average_efficiency': round(avg_efficiency, 2),
            'active_equipment': line.equipment.filter(status='running').count(),
            'total_equipment': line.equipment.count(),
        })


class WorkOrderViewSet(viewsets.ModelViewSet):
    """작업 지시서 ViewSet"""
    queryset = WorkOrder.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'production_line']
    search_fields = ['order_number', 'product_name', 'product_code']
    ordering_fields = ['planned_start', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return WorkOrderListSerializer
        return WorkOrderSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_work_orders())
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def start_production(self, request, pk=None):
        """생산 시작"""
        work_order = self.get_object()

        if work_order.status != 'planned':
            return Response(
                {'error': '계획 상태의 작업지시서만 시작할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.utils import timezone
        work_order.status = 'in_progress'
        work_order.actual_start = timezone.now()
        work_order.save()

        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_production(self, request, pk=None):
        """생산 완료"""
        work_order = self.get_object()

        if work_order.status != 'in_progress':
            return Response(
                {'error': '진행중인 작업지시서만 완료할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.utils import timezone
        work_order.status = 'completed'
        work_order.actual_end = timezone.now()
        work_order.save()

        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """작업지시 대시보드"""
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_work_orders()
            return Response({
                'total_orders': len(dummy),
                'in_progress': len([d for d in dummy if d['status'] == 'in_progress']),
                'completed': len([d for d in dummy if d['status'] == 'completed']),
                'average_achievement_rate': 102.5,
            })

        total = queryset.count()
        in_progress = queryset.filter(status='in_progress').count()
        completed = queryset.filter(status='completed').count()

        # 평균 달성률
        completed_orders = queryset.filter(status='completed')
        total_target = sum([wo.target_quantity for wo in completed_orders])
        total_actual = sum([wo.actual_quantity for wo in completed_orders])
        avg_achievement = round((total_actual / total_target * 100), 2) if total_target > 0 else 0

        return Response({
            'total_orders': total,
            'in_progress': in_progress,
            'completed': completed,
            'average_achievement_rate': avg_achievement,
        })


class DailyProductionViewSet(viewsets.ModelViewSet):
    """일일 생산 실적 ViewSet"""
    queryset = DailyProduction.objects.all()
    serializer_class = DailyProductionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['production_line', 'production_date']
    ordering_fields = ['production_date', 'efficiency']
    ordering = ['-production_date']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_daily_production())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def weekly_summary(self, request):
        """주간 생산 요약"""
        from datetime import datetime, timedelta

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)

        productions = self.queryset.filter(
            production_date__gte=start_date,
            production_date__lte=end_date
        )

        if not productions.exists():
            dummy = get_dummy_daily_production()
            return Response({
                'period': f'{start_date} ~ {end_date}',
                'total_target': sum(d['target_quantity'] for d in dummy),
                'total_actual': sum(d['actual_quantity'] for d in dummy),
                'total_defect': sum(d['defect_quantity'] for d in dummy),
                'average_efficiency': round(sum(d['efficiency'] for d in dummy) / len(dummy), 2),
                'achievement_rate': round(sum(d['actual_quantity'] for d in dummy) / sum(d['target_quantity'] for d in dummy) * 100, 2),
            })

        summary = productions.aggregate(
            total_target=Sum('target_quantity'),
            total_actual=Sum('actual_quantity'),
            total_defect=Sum('defect_quantity'),
            avg_efficiency=Avg('efficiency'),
        )

        return Response({
            'period': f'{start_date} ~ {end_date}',
            'total_target': summary['total_target'] or 0,
            'total_actual': summary['total_actual'] or 0,
            'total_defect': summary['total_defect'] or 0,
            'average_efficiency': round(summary['avg_efficiency'] or 0, 2),
            'achievement_rate': round(
                (summary['total_actual'] / summary['total_target'] * 100)
                if summary['total_target'] else 0, 2
            ),
        })


class EquipmentViewSet(viewsets.ModelViewSet):
    """생산 설비 ViewSet"""
    queryset = Equipment.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'production_line']
    search_fields = ['name', 'code', 'manufacturer', 'model']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return EquipmentListSerializer
        return EquipmentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_equipment())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def maintenance_schedule(self, request):
        """정비 일정"""
        from datetime import datetime, timedelta

        today = datetime.now().date()
        next_30_days = today + timedelta(days=30)

        equipment_list = self.queryset.filter(
            next_maintenance__gte=today,
            next_maintenance__lte=next_30_days
        ).order_by('next_maintenance')

        if not equipment_list.exists():
            # 더미 데이터 반환
            dummy = get_dummy_equipment()[:2]
            return Response({
                'period': f'{today} ~ {next_30_days}',
                'count': len(dummy),
                'equipment': dummy,
            })

        serializer = self.get_serializer(equipment_list, many=True)
        return Response({
            'period': f'{today} ~ {next_30_days}',
            'count': equipment_list.count(),
            'equipment': serializer.data,
        })
