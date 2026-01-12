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

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """진행 중인 프로젝트"""
        projects = self.queryset.filter(status='in-progress')
        serializer = CostReductionProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """절감 요약"""
        projects = self.queryset.all()

        total_target = sum([p.target_saving for p in projects])
        total_actual = sum([p.actual_saving for p in projects])
        achievement = (total_actual / total_target * 100) if total_target else 0

        return Response({
            'total_target_saving': total_target,
            'total_actual_saving': total_actual,
            'achievement_rate': round(achievement, 1),
            'project_count': projects.count(),
            'completed_count': projects.filter(status='completed').count(),
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

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """최신 분석"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

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

        serializer = CostStructureSerializer(queryset, many=True)
        return Response(serializer.data)
