from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    MonthlyPurchase, Inventory, PurchaseOrder,
    Supplier, MaterialPrice, InventoryTurnover
)
from .serializers import (
    MonthlyPurchaseSerializer,
    InventorySerializer, InventoryListSerializer,
    PurchaseOrderSerializer, PurchaseOrderListSerializer,
    SupplierSerializer, SupplierListSerializer,
    MaterialPriceSerializer, InventoryTurnoverSerializer
)


class MonthlyPurchaseViewSet(viewsets.ModelViewSet):
    """월별 구매 ViewSet"""
    queryset = MonthlyPurchase.objects.all()
    serializer_class = MonthlyPurchaseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """구매액 트렌드"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purchases = self.queryset.filter(fiscal_year=year).order_by('fiscal_month')
        serializer = MonthlyPurchaseSerializer(purchases, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """구매 요약"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purchases = self.queryset.filter(fiscal_year=year)
        total = sum([p.purchase_amount for p in purchases])
        avg = total / len(purchases) if purchases else 0

        return Response({
            'fiscal_year': year,
            'total_purchase': total,
            'average_purchase': avg,
            'total_orders': sum([p.order_count for p in purchases]),
        })


class InventoryViewSet(viewsets.ModelViewSet):
    """재고 ViewSet"""
    queryset = Inventory.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['item_code', 'item_name']
    ordering_fields = ['stock_value', 'turnover_rate', 'current_stock']
    ordering = ['-stock_value']

    def get_serializer_class(self):
        if self.action == 'list':
            return InventoryListSerializer
        return InventorySerializer

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """ABC 분류별 재고"""
        category = request.query_params.get('category')

        queryset = self.queryset
        if category:
            queryset = queryset.filter(category=category)

        serializer = InventorySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """재고 경고 (부족/긴급)"""
        alerts = self.queryset.filter(status__in=['low', 'critical'])
        serializer = InventorySerializer(alerts, many=True)
        return Response(serializer.data)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """발주 ViewSet"""
    queryset = PurchaseOrder.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_urgent', 'supplier_name']
    search_fields = ['po_number', 'item_name', 'supplier_name']
    ordering_fields = ['order_date', 'delivery_date', 'total_amount']
    ordering = ['-order_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        return PurchaseOrderSerializer

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """입고 대기 발주"""
        pending = self.queryset.filter(status__in=['ordered', 'in-transit'])
        serializer = PurchaseOrderListSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """긴급 발주"""
        urgent = self.queryset.filter(is_urgent=True, status__in=['ordered', 'in-transit'])
        serializer = PurchaseOrderListSerializer(urgent, many=True)
        return Response(serializer.data)


class SupplierViewSet(viewsets.ModelViewSet):
    """공급업체 ViewSet"""
    queryset = Supplier.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['grade', 'trend']
    search_fields = ['supplier_code', 'supplier_name']
    ordering_fields = ['total_score', 'purchase_share']
    ordering = ['-total_score']

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        return SupplierSerializer

    @action(detail=False, methods=['get'])
    def evaluation(self, request):
        """공급업체 평가"""
        suppliers = self.queryset.order_by('-total_score')
        serializer = SupplierSerializer(suppliers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def share(self, request):
        """공급업체별 구매 비중"""
        suppliers = self.queryset.order_by('-purchase_share')
        data = [
            {
                'supplier_name': s.supplier_name,
                'purchase_share': s.purchase_share
            }
            for s in suppliers
        ]
        return Response(data)


class MaterialPriceViewSet(viewsets.ModelViewSet):
    """원자재 가격 ViewSet"""
    queryset = MaterialPrice.objects.all()
    serializer_class = MaterialPriceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'material_code']
    search_fields = ['material_code', 'material_name']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """원자재별 가격 추이"""
        material_code = request.query_params.get('material_code')
        year = request.query_params.get('year')

        queryset = self.queryset
        if material_code:
            queryset = queryset.filter(material_code=material_code)
        if year:
            queryset = queryset.filter(fiscal_year=year)

        prices = queryset.order_by('fiscal_month')
        serializer = MaterialPriceSerializer(prices, many=True)
        return Response(serializer.data)


class InventoryTurnoverViewSet(viewsets.ModelViewSet):
    """재고 회전율 ViewSet"""
    queryset = InventoryTurnover.objects.all()
    serializer_class = InventoryTurnoverSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """분류별 회전율"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        serializer = InventoryTurnoverSerializer(queryset, many=True)
        return Response(serializer.data)
