from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import FinancialStatement, FinancialRatio
from .serializers import (
    FinancialStatementSerializer,
    FinancialStatementListSerializer,
    FinancialRatioSerializer,
    FinancialRatioListSerializer,
)


# 더미 데이터 헬퍼 함수
def get_dummy_financial_statements():
    """재무제표 더미 데이터 (단위: 억원)"""
    return [
        {
            'id': 1,
            'statement_type': 'income',
            'fiscal_year': 2024,
            'fiscal_month': 12,
            'revenue': 15200,
            'cost_of_sales': 9800,
            'gross_profit': 5400,
            'operating_expenses': 3200,
            'operating_income': 1200,
            'net_income': 950,
        },
        {
            'id': 2,
            'statement_type': 'income',
            'fiscal_year': 2024,
            'fiscal_month': 11,
            'revenue': 14500,
            'cost_of_sales': 9300,
            'gross_profit': 5200,
            'operating_expenses': 3100,
            'operating_income': 1100,
            'net_income': 880,
        },
        {
            'id': 3,
            'statement_type': 'balance',
            'fiscal_year': 2024,
            'fiscal_month': 12,
            'total_assets': 18500,
            'current_assets': 9500,
            'non_current_assets': 9000,
            'total_liabilities': 7500,
            'total_equity': 11000,
        },
        {
            'id': 4,
            'statement_type': 'cashflow',
            'fiscal_year': 2024,
            'fiscal_month': 12,
            'operating_cashflow': 1250,
            'investing_cashflow': -850,
            'financing_cashflow': -320,
        },
        {
            'id': 5,
            'statement_type': 'cashflow',
            'fiscal_year': 2024,
            'fiscal_month': 11,
            'operating_cashflow': 1180,
            'investing_cashflow': -720,
            'financing_cashflow': -280,
        },
        {
            'id': 6,
            'statement_type': 'cashflow',
            'fiscal_year': 2024,
            'fiscal_month': 10,
            'operating_cashflow': 1120,
            'investing_cashflow': -680,
            'financing_cashflow': -250,
        },
        {
            'id': 7,
            'statement_type': 'equity',
            'fiscal_year': 2024,
            'fiscal_month': 12,
            'beginning_equity': 10250,
            'net_income': 950,
            'dividend_paid': -280,
            'treasury_stock': -120,
            'other_comprehensive_income': 80,
            'ending_equity': 10880,
        },
        {
            'id': 8,
            'statement_type': 'equity',
            'fiscal_year': 2024,
            'fiscal_month': 11,
            'beginning_equity': 9950,
            'net_income': 880,
            'dividend_paid': -250,
            'treasury_stock': -100,
            'other_comprehensive_income': 70,
            'ending_equity': 10250,
        },
        {
            'id': 9,
            'statement_type': 'equity',
            'fiscal_year': 2024,
            'fiscal_month': 10,
            'beginning_equity': 9680,
            'net_income': 820,
            'dividend_paid': -220,
            'treasury_stock': -80,
            'other_comprehensive_income': 50,
            'ending_equity': 9950,
        },
    ]


def get_dummy_financial_ratios():
    """재무비율 더미 데이터"""
    return [
        {
            'id': 1,
            'fiscal_year': 2024,
            'fiscal_month': 12,
            'current_ratio': 156.8,
            'quick_ratio': 98.5,
            'debt_to_equity': 45.2,
            'roe': 12.5,
            'roa': 8.3,
            'operating_margin': 8.0,
            'net_margin': 6.3,
            'revenue_growth': 8.5,
        },
        {
            'id': 2,
            'fiscal_year': 2024,
            'fiscal_month': 11,
            'current_ratio': 158.2,
            'quick_ratio': 99.1,
            'debt_to_equity': 46.5,
            'roe': 11.8,
            'roa': 7.9,
            'operating_margin': 7.8,
            'net_margin': 6.1,
            'revenue_growth': 7.2,
        },
        {
            'id': 3,
            'fiscal_year': 2024,
            'fiscal_month': 10,
            'current_ratio': 154.5,
            'quick_ratio': 97.2,
            'debt_to_equity': 47.1,
            'roe': 11.2,
            'roa': 7.5,
            'operating_margin': 7.5,
            'net_margin': 5.8,
            'revenue_growth': 6.8,
        },
    ]


class FinancialStatementViewSet(viewsets.ModelViewSet):
    """재무제표 ViewSet"""
    queryset = FinancialStatement.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statement_type', 'fiscal_year', 'fiscal_month']
    search_fields = ['statement_type']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'net_income']
    ordering = ['-fiscal_year', '-fiscal_month']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return FinancialStatementListSerializer
        return FinancialStatementSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_financial_statements())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """재무 요약 정보"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        statements = self.queryset.filter(fiscal_year=year)

        if not statements.exists():
            # 더미 데이터로 요약 반환
            dummy_data = get_dummy_financial_statements()
            year_statements = [s for s in dummy_data if s['fiscal_year'] == int(year)]

            income_statements = [s for s in year_statements if s['statement_type'] == 'income']
            total_revenue = sum([s['revenue'] for s in income_statements])
            total_net_income = sum([s['net_income'] for s in income_statements])

            balance_statements = [s for s in year_statements if s['statement_type'] == 'balance']
            latest_balance = balance_statements[0] if balance_statements else {}

            return Response({
                'fiscal_year': year,
                'total_revenue': total_revenue,
                'total_net_income': total_net_income,
                'total_assets': latest_balance.get('total_assets', 0),
                'total_liabilities': latest_balance.get('total_liabilities', 0),
                'total_equity': latest_balance.get('total_equity', 0),
            })

        # 손익계산서 데이터
        income_statements = statements.filter(statement_type='income')
        total_revenue = sum([s.revenue for s in income_statements])
        total_net_income = sum([s.net_income for s in income_statements])

        # 최근 재무상태표
        latest_balance = statements.filter(statement_type='balance').first()

        summary_data = {
            'fiscal_year': year,
            'total_revenue': total_revenue,
            'total_net_income': total_net_income,
            'total_assets': latest_balance.total_assets if latest_balance else 0,
            'total_liabilities': latest_balance.total_liabilities if latest_balance else 0,
            'total_equity': latest_balance.total_equity if latest_balance else 0,
        }

        return Response(summary_data)

    @action(detail=False, methods=['get'])
    def monthly_trend(self, request):
        """월별 재무 트렌드"""
        year = request.query_params.get('year')
        statement_type = request.query_params.get('type', 'income')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        statements = self.queryset.filter(
            fiscal_year=year,
            statement_type=statement_type
        ).order_by('fiscal_month')

        if not statements.exists():
            # 더미 데이터로 트렌드 반환
            dummy_data = get_dummy_financial_statements()
            filtered = [s for s in dummy_data
                       if s['fiscal_year'] == int(year) and s['statement_type'] == statement_type]
            return Response(filtered)

        serializer = self.get_serializer(statements, many=True)
        return Response(serializer.data)


class FinancialRatioViewSet(viewsets.ModelViewSet):
    """재무비율 ViewSet"""
    queryset = FinancialRatio.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'roe', 'roa']
    ordering = ['-fiscal_year', '-fiscal_month']

    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return FinancialRatioListSerializer
        return FinancialRatioSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_financial_ratios())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """연도별 비교"""
        year1 = request.query_params.get('year1')
        year2 = request.query_params.get('year2')

        if not year1 or not year2:
            return Response(
                {'error': 'year1, year2 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ratios_year1 = self.queryset.filter(fiscal_year=year1)
        ratios_year2 = self.queryset.filter(fiscal_year=year2)

        if not ratios_year1.exists() and not ratios_year2.exists():
            # 더미 데이터로 비교 반환
            dummy_data = get_dummy_financial_ratios()
            data1 = [d for d in dummy_data if d['fiscal_year'] == int(year1)]
            data2 = [d for d in dummy_data if d['fiscal_year'] == int(year2)]
            return Response({'year1': data1, 'year2': data2})

        return Response({
            'year1': FinancialRatioListSerializer(ratios_year1, many=True).data,
            'year2': FinancialRatioListSerializer(ratios_year2, many=True).data,
        })
