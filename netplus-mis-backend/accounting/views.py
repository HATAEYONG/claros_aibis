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


# 더미 데이터 헬퍼 함수
def get_dummy_budget_actual():
    """예산실적 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': '매출원가', 'budget': 85000000000, 'actual': 83200000000, 'variance': -1800000000, 'variance_rate': -2.12},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': '판관비', 'budget': 25000000000, 'actual': 24800000000, 'variance': -200000000, 'variance_rate': -0.8},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 11, 'category': '매출원가', 'budget': 82000000000, 'actual': 81500000000, 'variance': -500000000, 'variance_rate': -0.61},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 11, 'category': '판관비', 'budget': 24000000000, 'actual': 24200000000, 'variance': 200000000, 'variance_rate': 0.83},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 10, 'category': '매출원가', 'budget': 80000000000, 'actual': 79500000000, 'variance': -500000000, 'variance_rate': -0.63},
    ]


def get_dummy_department_profitability():
    """부문별 수익성 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '의약품', 'revenue': 85000000000, 'cost': 52000000000, 'profit': 33000000000, 'margin': 38.82},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '화장품', 'revenue': 42000000000, 'cost': 28000000000, 'profit': 14000000000, 'margin': 33.33},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '건강기능식품', 'revenue': 23000000000, 'cost': 15000000000, 'profit': 8000000000, 'margin': 34.78},
    ]


def get_dummy_kpi_performance():
    """KPI 성과 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'kpi_name': '매출달성율', 'target': 100, 'actual': 105.5, 'achievement_rate': 105.5, 'status': 'achieved'},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'kpi_name': '영업이익율', 'target': 8.0, 'actual': 8.5, 'achievement_rate': 106.25, 'status': 'achieved'},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'kpi_name': '재고회전율', 'target': 6.0, 'actual': 5.8, 'achievement_rate': 96.67, 'status': 'on_track'},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'kpi_name': '매출채권회수일수', 'target': 45, 'actual': 42, 'achievement_rate': 107.14, 'status': 'achieved'},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'kpi_name': '현금흐름개선', 'target': 100, 'actual': 98.5, 'achievement_rate': 98.5, 'status': 'on_track'},
    ]


def get_dummy_financial_ratio():
    """재무비율 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'ratio_name': '유동비율', 'category': '유동성', 'value': 156.8, 'target': 120},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'ratio_name': '당좌비율', 'category': '유동성', 'value': 98.5, 'target': 80},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'ratio_name': '부채비율', 'category': '안정성', 'value': 45.2, 'target': 100},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'ratio_name': 'ROE', 'category': '수익성', 'value': 12.5, 'target': 10},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'ratio_name': 'ROA', 'category': '수익성', 'value': 8.3, 'target': 6},
    ]


def get_dummy_budget_allocation():
    """예산배분 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'department': '생산본부', 'allocated_budget': 45000000000, 'used_budget': 43200000000, 'remaining_budget': 1800000000, 'usage_rate': 96.0},
        {'id': 2, 'fiscal_year': 2024, 'department': '영업본부', 'allocated_budget': 32000000000, 'used_budget': 31500000000, 'remaining_budget': 500000000, 'usage_rate': 98.44},
        {'id': 3, 'fiscal_year': 2024, 'department': '연구소', 'allocated_budget': 28000000000, 'used_budget': 26500000000, 'remaining_budget': 1500000000, 'usage_rate': 94.64},
        {'id': 4, 'fiscal_year': 2024, 'department': '관리부문', 'allocated_budget': 15000000000, 'used_budget': 14200000000, 'remaining_budget': 800000000, 'usage_rate': 94.67},
    ]


def get_dummy_investment_roi():
    """투자ROI 더미 데이터"""
    return [
        {'id': 1, 'project_name': '자동화 라인 구축', 'investment_amount': 15000000000, 'expected_return': 22500000000, 'actual_return': 12000000000, 'roi': 50.0, 'payback_period': 3.5, 'status': 'in_progress'},
        {'id': 2, 'project_name': '신제품 R&D', 'investment_amount': 8000000000, 'expected_return': 20000000000, 'actual_return': 5000000000, 'roi': 62.5, 'payback_period': 4.0, 'status': 'in_progress'},
        {'id': 3, 'project_name': 'IT 시스템 고도화', 'investment_amount': 3500000000, 'expected_return': 5000000000, 'actual_return': 2800000000, 'roi': 80.0, 'payback_period': 2.5, 'status': 'completed'},
        {'id': 4, 'project_name': '친환경 설비 도입', 'investment_amount': 5000000000, 'expected_return': 7000000000, 'actual_return': 2500000000, 'roi': 50.0, 'payback_period': 4.0, 'status': 'in_progress'},
    ]


class BudgetActualViewSet(viewsets.ModelViewSet):
    queryset = BudgetActual.objects.all()
    serializer_class = BudgetActualSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['category']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'budget', 'actual', 'variance_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_budget_actual())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()

        if not queryset.exists():
            # 더미 데이터로 요약 반환
            dummy_data = get_dummy_budget_actual()
            if year:
                dummy_data = [d for d in dummy_data if d['fiscal_year'] == int(year)]

            return Response({
                'total_budget': sum(d['budget'] for d in dummy_data),
                'total_actual': sum(d['actual'] for d in dummy_data),
                'total_variance': sum(d['variance'] for d in dummy_data)
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_department_profitability())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy_data = sorted(get_dummy_department_profitability(), key=lambda x: x['profit'], reverse=True)[:10]
            return Response(dummy_data)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_kpi_performance())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy_data = get_dummy_kpi_performance()
            if year:
                dummy_data = [d for d in dummy_data if d['fiscal_year'] == int(year)]

            status_counts = {'achieved': 0, 'on_track': 0, 'at_risk': 0, 'behind': 0}
            for item in dummy_data:
                status = item.get('status', 'on_track')
                status_counts[status] = status_counts.get(status, 0) + 1

            return Response(status_counts)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_financial_ratio())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy_data = get_dummy_financial_ratio()
            if year:
                dummy_data = [d for d in dummy_data if d['fiscal_year'] == int(year)]

            result = {'유동성': [], '안정성': [], '수익성': [], '성장성': []}
            for item in dummy_data:
                cat = item.get('category', '수익성')
                if cat in result:
                    result[cat].append(item)

            return Response(result)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_budget_allocation())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def usage_summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy_data = get_dummy_budget_allocation()
            if year:
                dummy_data = [d for d in dummy_data if d['fiscal_year'] == int(year)]

            return Response({
                'total_allocated': sum(d['allocated_budget'] for d in dummy_data),
                'total_used': sum(d['used_budget'] for d in dummy_data),
                'total_remaining': sum(d['remaining_budget'] for d in dummy_data),
                'avg_usage_rate': sum(d['usage_rate'] for d in dummy_data) / len(dummy_data) if dummy_data else 0
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_investment_roi())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def portfolio_summary(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy_data = get_dummy_investment_roi()
            return Response({
                'total_investment': sum(d['investment_amount'] for d in dummy_data),
                'total_expected_return': sum(d['expected_return'] for d in dummy_data),
                'total_actual_return': sum(d['actual_return'] for d in dummy_data),
                'avg_roi': sum(d['roi'] for d in dummy_data) / len(dummy_data) if dummy_data else 0,
                'by_status': {'planning': 0, 'in_progress': 3, 'completed': 1, 'cancelled': 0}
            })

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
