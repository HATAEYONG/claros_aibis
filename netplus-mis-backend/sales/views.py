from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    MonthlySales, ProductSales, CustomerTier,
    SalesPipeline, SalesTeamPerformance, TopCustomer
)
from .serializers import (
    MonthlySalesSerializer, MonthlySalesListSerializer,
    ProductSalesSerializer, ProductSalesListSerializer,
    CustomerTierSerializer, SalesPipelineSerializer,
    SalesTeamPerformanceSerializer, TopCustomerSerializer
)


# 더미 데이터 헬퍼 함수
def get_dummy_monthly_sales():
    """월별 매출 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'target_amount': 1300, 'actual_amount': 1380, 'new_customers': 5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'target_amount': 1250, 'actual_amount': 1290, 'new_customers': 3},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 10, 'target_amount': 1200, 'actual_amount': 1245, 'new_customers': 4},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 9, 'target_amount': 1150, 'actual_amount': 1180, 'new_customers': 6},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 8, 'target_amount': 1100, 'actual_amount': 1120, 'new_customers': 3},
    ]


def get_dummy_product_sales():
    """제품별 매출 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'MED-001', 'product_name': '타이레놀정', 'sales_amount': 520, 'quantity': 520000, 'share_rate': 37.7},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'MED-002', 'product_name': '자일리톨정', 'sales_amount': 380, 'quantity': 380000, 'share_rate': 27.5},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'MED-003', 'product_name': '비타민C', 'sales_amount': 250, 'quantity': 250000, 'share_rate': 18.1},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'COS-001', 'product_name': '미용크림', 'sales_amount': 150, 'quantity': 150000, 'share_rate': 10.9},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'product_code': 'COS-002', 'product_name': '선스크린', 'sales_amount': 80, 'quantity': 80000, 'share_rate': 5.8},
    ]


def get_dummy_customer_tier():
    """고객 등급별 매출 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'tier': 'VIP', 'customer_count': 25, 'revenue': 580, 'avg_revenue': 2.32},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'tier': 'GOLD', 'customer_count': 50, 'revenue': 450, 'avg_revenue': 0.9},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'tier': 'SILVER', 'customer_count': 100, 'revenue': 280, 'avg_revenue': 0.28},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'tier': 'REGULAR', 'customer_count': 200, 'revenue': 700, 'avg_revenue': 0.035},
    ]


def get_dummy_sales_pipeline():
    """영업 파이프라인 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'stage': 'lead', 'value': 500, 'count': 120},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'stage': 'contact', 'value': 350, 'count': 85},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'stage': 'proposal', 'value': 200, 'count': 45},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'stage': 'negotiation', 'value': 150, 'count': 25},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'stage': 'closing', 'value': 80, 'count': 12},
    ]


def get_dummy_sales_team():
    """영업팀 성과 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'salesperson_name': '김영업', 'team': '의약품팀', 'target_amount': 250, 'actual_amount': 280, 'deal_count': 15, 'conversion_rate': 18.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'salesperson_name': '이영업', 'team': '의약품팀', 'target_amount': 250, 'actual_amount': 265, 'deal_count': 12, 'conversion_rate': 16.8},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'salesperson_name': '박영업', 'team': '화장품팀', 'target_amount': 200, 'actual_amount': 210, 'deal_count': 18, 'conversion_rate': 22.5},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'salesperson_name': '최영업', 'team': '화장품팀', 'target_amount': 200, 'actual_amount': 195, 'deal_count': 14, 'conversion_rate': 17.2},
    ]


def get_dummy_top_customers():
    """주요 거래처 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'customer_code': 'C001', 'customer_name': '삼약제약', 'revenue': 150, 'growth_rate': 12.5, 'status': 'active'},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'customer_code': 'C002', 'customer_name': '한독약품', 'revenue': 120, 'growth_rate': 8.3, 'status': 'active'},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'customer_code': 'C003', 'customer_name': '동양약품', 'revenue': 95, 'growth_rate': -2.1, 'status': 'active'},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'customer_code': 'C004', 'customer_name': '중앙제약', 'revenue': 80, 'growth_rate': 5.7, 'status': 'active'},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'customer_code': 'C005', 'customer_name': '대한약품', 'revenue': 65, 'growth_rate': 15.2, 'status': 'active'},
    ]


class MonthlySalesViewSet(viewsets.ModelViewSet):
    """월별 매출 ViewSet"""
    queryset = MonthlySales.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'actual_amount']
    ordering = ['-fiscal_year', '-fiscal_month']

    def get_serializer_class(self):
        if self.action == 'list':
            return MonthlySalesListSerializer
        return MonthlySalesSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_monthly_sales())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """매출 요약 정보"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        monthly_sales = self.queryset.filter(fiscal_year=year)

        if not monthly_sales.exists():
            dummy = get_dummy_monthly_sales()
            year_data = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response({
                'fiscal_year': year,
                'total_target': sum(d['target_amount'] for d in year_data),
                'total_actual': sum(d['actual_amount'] for d in year_data),
                'average_achievement_rate': round(sum(d['actual_amount'] for d in year_data) / sum(d['target_amount'] for d in year_data) * 100, 1),
                'total_new_customers': sum(d['new_customers'] for d in year_data),
            })

        total_target = sum([s.target_amount for s in monthly_sales])
        total_actual = sum([s.actual_amount for s in monthly_sales])
        avg_achievement = (total_actual / total_target * 100) if total_target else 0

        return Response({
            'fiscal_year': year,
            'total_target': total_target,
            'total_actual': total_actual,
            'average_achievement_rate': round(avg_achievement, 1),
            'total_new_customers': sum([s.new_customers for s in monthly_sales]),
        })

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """월별 매출 트렌드"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sales = self.queryset.filter(fiscal_year=year).order_by('fiscal_month')

        if not sales.exists():
            dummy = [d for d in get_dummy_monthly_sales() if d['fiscal_year'] == int(year)]
            return Response(dummy)

        serializer = MonthlySalesSerializer(sales, many=True)
        return Response(serializer.data)


class ProductSalesViewSet(viewsets.ModelViewSet):
    """제품별 매출 ViewSet"""
    queryset = ProductSales.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'product_code']
    search_fields = ['product_name', 'product_code']
    ordering_fields = ['sales_amount', 'share_rate']
    ordering = ['-sales_amount']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductSalesListSerializer
        return ProductSalesSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_product_sales())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """상위 제품"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        limit = int(request.query_params.get('limit', 5))

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_product_sales()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(sorted(dummy, key=lambda x: x['sales_amount'], reverse=True)[:limit])

        top_products = queryset.order_by('-sales_amount')[:limit]
        serializer = ProductSalesSerializer(top_products, many=True)
        return Response(serializer.data)


class CustomerTierViewSet(viewsets.ModelViewSet):
    """고객 등급별 매출 ViewSet"""
    queryset = CustomerTier.objects.all()
    serializer_class = CustomerTierSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'tier']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_customer_tier())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def distribution(self, request):
        """등급별 분포"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_customer_tier()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

        serializer = CustomerTierSerializer(queryset, many=True)
        return Response(serializer.data)


class SalesPipelineViewSet(viewsets.ModelViewSet):
    """영업 파이프라인 ViewSet"""
    queryset = SalesPipeline.objects.all()
    serializer_class = SalesPipelineSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'stage']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_sales_pipeline())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def funnel(self, request):
        """파이프라인 퍼널"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_sales_pipeline()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            stage_order = ['lead', 'contact', 'proposal', 'negotiation', 'closing']
            return Response([next((d for d in dummy if d['stage'] == s), {'stage': s, 'value': 0, 'count': 0}) for s in stage_order])

        # 단계 순서대로 정렬
        stage_order = ['lead', 'contact', 'proposal', 'negotiation', 'closing']
        pipeline_data = []
        for stage in stage_order:
            stage_data = queryset.filter(stage=stage).first()
            if stage_data:
                pipeline_data.append(SalesPipelineSerializer(stage_data).data)

        return Response(pipeline_data)


class SalesTeamPerformanceViewSet(viewsets.ModelViewSet):
    """영업팀 성과 ViewSet"""
    queryset = SalesTeamPerformance.objects.all()
    serializer_class = SalesTeamPerformanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    search_fields = ['salesperson_name']
    ordering_fields = ['actual_amount', 'deal_count', 'conversion_rate']
    ordering = ['-actual_amount']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_sales_team())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        """영업 성과 랭킹"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = sorted(get_dummy_sales_team(), key=lambda x: x['actual_amount'], reverse=True)
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response(dummy)

        ranking = queryset.order_by('-actual_amount')
        serializer = SalesTeamPerformanceSerializer(ranking, many=True)
        return Response(serializer.data)


class TopCustomerViewSet(viewsets.ModelViewSet):
    """주요 거래처 ViewSet"""
    queryset = TopCustomer.objects.all()
    serializer_class = TopCustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'status']
    search_fields = ['customer_name', 'customer_code']
    ordering_fields = ['revenue', 'growth_rate']
    ordering = ['-revenue']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_top_customers())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def top_accounts(self, request):
        """상위 거래처"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        limit = int(request.query_params.get('limit', 10))

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = sorted(get_dummy_top_customers(), key=lambda x: x['revenue'], reverse=True)
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response(dummy[:limit])

        top_accounts = queryset.order_by('-revenue')[:limit]
        serializer = TopCustomerSerializer(top_accounts, many=True)
        return Response(serializer.data)
