from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    MonthlyCost, ProductCost, CostReductionProject,
    CostDriver, BreakEvenAnalysis, CostStructure
)
from .serializers import (
    MonthlyCostSerializer, MonthlyCostListSerializer,
    ProductCostSerializer, ProductCostListSerializer,
    CostReductionProjectSerializer, CostReductionProjectListSerializer,
    CostDriverSerializer, BreakEvenAnalysisSerializer, CostStructureSerializer
)


# 더미 데이터 헬퍼 함수
def get_dummy_monthly_cost():
    """월별 원가 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'total_cost': 9800, 'direct_material': 5200, 'direct_labor': 1800, 'overhead': 2800, 'unit_cost': 850},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'total_cost': 9500, 'direct_material': 5000, 'direct_labor': 1750, 'overhead': 2750, 'unit_cost': 830},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 10, 'total_cost': 9200, 'direct_material': 4850, 'direct_labor': 1700, 'overhead': 2650, 'unit_cost': 810},
    ]


def get_dummy_product_cost():
    """제품별 원가 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'MED-001', 'product_name': '타이레놀정', 'total_cost': 1500, 'unit_cost': 500, 'selling_price': 850, 'margin': 350, 'margin_rate': 41.18, 'production_volume': 30000000},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'MED-002', 'product_name': '자일리톨정', 'total_cost': 1200, 'unit_cost': 480, 'selling_price': 780, 'margin': 300, 'margin_rate': 38.46, 'production_volume': 25000000},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'COS-001', 'product_name': '미용크림', 'total_cost': 800, 'unit_cost': 3200, 'selling_price': 5500, 'margin': 2300, 'margin_rate': 41.82, 'production_volume': 2500000},
    ]


def get_dummy_cost_projects():
    """원가 절감 프로젝트 더미 데이터"""
    return [
        {'id': 1, 'project_id': 'CR-001', 'title': '자재비 절감', 'category': 'material', 'status': 'in-progress', 'progress': 65, 'target_saving': 500, 'actual_saving': 320},
        {'id': 2, 'project_id': 'CR-002', 'title': '공정 최적화', 'category': 'process', 'status': 'completed', 'progress': 100, 'target_saving': 300, 'actual_saving': 350},
        {'id': 3, 'project_id': 'CR-003', 'title': '설비 효율화', 'category': 'overhead', 'status': 'in-progress', 'progress': 45, 'target_saving': 200, 'actual_saving': 85},
    ]


def get_dummy_cost_drivers():
    """원가 동인 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'driver_name': '원료가격', 'driver_value': 12500, 'impact_rate': 45.2, 'change_rate': 3.5, 'trend': 'up'},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'driver_name': '인건비', 'driver_value': 4500, 'impact_rate': 16.8, 'change_rate': 2.1, 'trend': 'up'},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'driver_name': '에너지비', 'driver_value': 2800, 'impact_rate': 10.5, 'change_rate': -1.2, 'trend': 'down'},
    ]


def get_dummy_breakeven():
    """손익분기점 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'fixed_cost': 4500, 'variable_cost_per_unit': 650, 'selling_price_per_unit': 850, 'breakeven_quantity': 225000, 'breakeven_amount': 19125, 'margin_of_safety': 28.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'fixed_cost': 4450, 'variable_cost_per_unit': 640, 'selling_price_per_unit': 845, 'breakeven_quantity': 223000, 'breakeven_amount': 18844, 'margin_of_safety': 27.8},
    ]


def get_dummy_cost_structure():
    """원가 구조 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'cost_type': 'direct_material', 'amount': 5200, 'ratio': 53.1},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'cost_type': 'direct_labor', 'amount': 1800, 'ratio': 18.4},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'cost_type': 'overhead', 'amount': 2800, 'ratio': 28.5},
    ]


class MonthlyCostViewSet(viewsets.ModelViewSet):
    """월별 원가 ViewSet"""
    queryset = MonthlyCost.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    def get_serializer_class(self):
        if self.action == 'list':
            return MonthlyCostListSerializer
        return MonthlyCostSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_monthly_cost())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """원가 트렌드"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        costs = self.queryset.filter(fiscal_year=year).order_by('fiscal_month')

        if not costs.exists():
            dummy = [d for d in get_dummy_monthly_cost() if d['fiscal_year'] == int(year)]
            return Response(dummy)

        serializer = MonthlyCostSerializer(costs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """원가 요약"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        costs = self.queryset.filter(fiscal_year=year)

        if not costs.exists():
            dummy = [d for d in get_dummy_monthly_cost() if d['fiscal_year'] == int(year)]
            return Response({
                'fiscal_year': year,
                'total_cost': sum(d['total_cost'] for d in dummy),
                'average_unit_cost': round(sum(d['unit_cost'] for d in dummy) / len(dummy), 2) if dummy else 0,
                'month_count': len(dummy),
            })

        total = sum([c.total_cost for c in costs])
        avg_unit = sum([c.unit_cost for c in costs]) / len(costs) if costs else 0

        return Response({
            'fiscal_year': year,
            'total_cost': total,
            'average_unit_cost': round(avg_unit, 2),
            'month_count': len(costs),
        })


class ProductCostViewSet(viewsets.ModelViewSet):
    """제품별 원가 ViewSet"""
    queryset = ProductCost.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'product_code']
    search_fields = ['product_name', 'product_code']
    ordering_fields = ['total_cost', 'margin_rate', 'production_volume']
    ordering = ['-fiscal_year', '-fiscal_month', '-margin_rate']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductCostListSerializer
        return ProductCostSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_product_cost())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """제품별 비교"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_product_cost()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

        serializer = ProductCostSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def profitability(self, request):
        """수익성 분석"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_product_cost()
            products = sorted(dummy, key=lambda x: x['margin_rate'], reverse=True)
            data = [{'product_name': p['product_name'], 'margin_rate': p['margin_rate'], 'margin': p['margin'], 'total_cost': p['total_cost']} for p in products]
            return Response(data)

        products = queryset.order_by('-margin_rate')
        data = [
            {
                'product_name': p.product_name,
                'margin_rate': p.margin_rate,
                'margin': p.margin,
                'total_cost': p.total_cost,
            }
            for p in products
        ]
        return Response(data)


class CostReductionProjectViewSet(viewsets.ModelViewSet):
    """원가 절감 프로젝트 ViewSet"""
    queryset = CostReductionProject.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['project_id', 'title', 'responsible_person']
    ordering_fields = ['progress', 'target_saving', 'actual_saving']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CostReductionProjectListSerializer
        return CostReductionProjectSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_cost_projects())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """진행 중인 프로젝트"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = [d for d in get_dummy_cost_projects() if d['status'] == 'in-progress']
            return Response(dummy)

        projects = queryset.filter(status='in-progress')
        serializer = CostReductionProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """절감 요약"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = get_dummy_cost_projects()
            return Response({
                'total_target_saving': sum(d['target_saving'] for d in dummy),
                'total_actual_saving': sum(d['actual_saving'] for d in dummy),
                'achievement_rate': round(sum(d['actual_saving'] for d in dummy) / sum(d['target_saving'] for d in dummy) * 100, 1),
                'project_count': len(dummy),
                'completed_count': len([d for d in dummy if d['status'] == 'completed']),
            })

        total_target = sum([p.target_saving for p in queryset])
        total_actual = sum([p.actual_saving for p in queryset])
        achievement = (total_actual / total_target * 100) if total_target else 0

        return Response({
            'total_target_saving': total_target,
            'total_actual_saving': total_actual,
            'achievement_rate': round(achievement, 1),
            'project_count': queryset.count(),
            'completed_count': queryset.filter(status='completed').count(),
        })


class CostDriverViewSet(viewsets.ModelViewSet):
    """원가 동인 ViewSet"""
    queryset = CostDriver.objects.all()
    serializer_class = CostDriverSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'trend']
    search_fields = ['driver_name']
    ordering_fields = ['impact_rate', 'change_rate']
    ordering = ['-fiscal_year', '-fiscal_month', '-impact_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_cost_drivers())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def analysis(self, request):
        """동인 분석"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = sorted(get_dummy_cost_drivers(), key=lambda x: x['impact_rate'], reverse=True)
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

        drivers = queryset.order_by('-impact_rate')
        serializer = CostDriverSerializer(drivers, many=True)
        return Response(serializer.data)


class BreakEvenAnalysisViewSet(viewsets.ModelViewSet):
    """손익분기점 분석 ViewSet"""
    queryset = BreakEvenAnalysis.objects.all()
    serializer_class = BreakEvenAnalysisSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_breakeven())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """최신 분석"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = [d for d in get_dummy_breakeven() if not year or d['fiscal_year'] == int(year)]
            if dummy:
                return Response(dummy[0])
            return Response({'error': '데이터가 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

        latest = queryset.first()
        if not latest:
            return Response({'error': '데이터가 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BreakEvenAnalysisSerializer(latest)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """손익분기점 트렌드"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = [d for d in get_dummy_breakeven() if not year or d['fiscal_year'] == int(year)]
            return Response(dummy)

        analyses = queryset.order_by('fiscal_month')
        serializer = BreakEvenAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)


class CostStructureViewSet(viewsets.ModelViewSet):
    """원가 구조 ViewSet"""
    queryset = CostStructure.objects.all()
    serializer_class = CostStructureSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'cost_type']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_cost_structure())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def breakdown(self, request):
        """원가 구조 분석"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_cost_structure()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

        serializer = CostStructureSerializer(queryset, many=True)
        return Response(serializer.data)
