from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg

from .models import (
    BudgetActual, DepartmentProfitability, KPIPerformance,
    FinancialRatioAnalysis, BudgetAllocation, InvestmentROI
)
from .serializers import (
    BudgetActualSerializer, DepartmentProfitabilitySerializer,
    KPIPerformanceSerializer, FinancialRatioAnalysisSerializer,
    BudgetAllocationSerializer, InvestmentROISerializer
)


class BudgetActualViewSet(viewsets.ModelViewSet):
    queryset = BudgetActual.objects.all()
    serializer_class = BudgetActualSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['category']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'budget', 'actual', 'variance_rate']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)

        summary = queryset.aggregate(
            total_budget=Sum('budget'),
            total_actual=Sum('actual'),
            total_variance=Sum('variance')
        )
        return Response(summary)


class DepartmentProfitabilityViewSet(viewsets.ModelViewSet):
    queryset = DepartmentProfitability.objects.all()
    serializer_class = DepartmentProfitabilitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['department']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'profit', 'margin']

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        return Response(self.get_serializer(queryset.order_by('-profit')[:10], many=True).data)


class KPIPerformanceViewSet(viewsets.ModelViewSet):
    queryset = KPIPerformance.objects.all()
    serializer_class = KPIPerformanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'status']
    search_fields = ['kpi_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'achievement_rate']

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)

        status_counts = {}
        for status_code, status_name in KPIPerformance.STATUS_CHOICES:
            status_counts[status_code] = queryset.filter(status=status_code).count()

        return Response(status_counts)


class FinancialRatioAnalysisViewSet(viewsets.ModelViewSet):
    queryset = FinancialRatioAnalysis.objects.all()
    serializer_class = FinancialRatioAnalysisSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['ratio_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'value']

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        result = {}
        for cat_code, cat_name in FinancialRatioAnalysis.CATEGORY_CHOICES:
            result[cat_code] = self.get_serializer(
                queryset.filter(category=cat_code), many=True
            ).data

        return Response(result)


class BudgetAllocationViewSet(viewsets.ModelViewSet):
    queryset = BudgetAllocation.objects.all()
    serializer_class = BudgetAllocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'department']
    search_fields = ['department']
    ordering_fields = ['fiscal_year', 'allocated_budget', 'usage_rate']

    @action(detail=False, methods=['get'])
    def usage_summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)

        summary = queryset.aggregate(
            total_allocated=Sum('allocated_budget'),
            total_used=Sum('used_budget'),
            total_remaining=Sum('remaining_budget'),
            avg_usage_rate=Avg('usage_rate')
        )
        return Response(summary)


class InvestmentROIViewSet(viewsets.ModelViewSet):
    queryset = InvestmentROI.objects.all()
    serializer_class = InvestmentROISerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['project_name']
    ordering_fields = ['investment_amount', 'roi', 'payback_period', 'created_at']

    @action(detail=False, methods=['get'])
    def portfolio_summary(self, request):
        queryset = self.get_queryset()

        summary = {
            'total_investment': queryset.aggregate(total=Sum('investment_amount'))['total'] or 0,
            'total_expected_return': queryset.aggregate(total=Sum('expected_return'))['total'] or 0,
            'total_actual_return': queryset.aggregate(total=Sum('actual_return'))['total'] or 0,
            'avg_roi': queryset.aggregate(avg=Avg('roi'))['avg'] or 0,
            'by_status': {}
        }

        for status_code, status_name in InvestmentROI.STATUS_CHOICES:
            summary['by_status'][status_code] = queryset.filter(status=status_code).count()

        return Response(summary)
