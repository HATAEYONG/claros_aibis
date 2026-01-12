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
        
        return Response({
            'year1': FinancialRatioListSerializer(ratios_year1, many=True).data,
            'year2': FinancialRatioListSerializer(ratios_year2, many=True).data,
        })