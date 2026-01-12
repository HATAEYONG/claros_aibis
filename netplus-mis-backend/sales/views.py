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

        serializer = CustomerTierSerializer(queryset, many=True)
        return Response(serializer.data)


class SalesPipelineViewSet(viewsets.ModelViewSet):
    """영업 파이프라인 ViewSet"""
    queryset = SalesPipeline.objects.all()
    serializer_class = SalesPipelineSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'stage']
    ordering = ['-fiscal_year', '-fiscal_month']

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

        top_accounts = queryset.order_by('-revenue')[:limit]
        serializer = TopCustomerSerializer(top_accounts, many=True)
        return Response(serializer.data)
