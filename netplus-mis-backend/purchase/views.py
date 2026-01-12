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


# 더미 데이터 헬퍼 함수
def get_dummy_monthly_purchase():
    """월별 구매 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'purchase_amount': 4500000000, 'order_count': 125},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'purchase_amount': 4200000000, 'order_count': 118},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 10, 'purchase_amount': 4000000000, 'order_count': 112},
    ]


def get_dummy_inventory():
    """재고 더미 데이터"""
    return [
        {'id': 1, 'item_code': 'MAT-001', 'item_name': '원료A', 'category': 'A', 'current_stock': 5000, 'unit': 'kg', 'stock_value': 250000000, 'turnover_rate': 6.5, 'status': 'normal'},
        {'id': 2, 'item_code': 'MAT-002', 'item_name': '원료B', 'category': 'A', 'current_stock': 3200, 'unit': 'kg', 'stock_value': 180000000, 'turnover_rate': 5.8, 'status': 'normal'},
        {'id': 3, 'item_code': 'MAT-003', 'item_name': '포장재', 'category': 'B', 'current_stock': 800, 'unit': 'roll', 'stock_value': 80000000, 'turnover_rate': 4.2, 'status': 'low'},
        {'id': 4, 'item_code': 'MAT-004', 'item_name': '라벨', 'category': 'C', 'current_stock': 12000, 'unit': 'ea', 'stock_value': 60000000, 'turnover_rate': 8.5, 'status': 'normal'},
        {'id': 5, 'item_code': 'MAT-005', 'item_name': '부자재', 'category': 'C', 'current_stock': 500, 'unit': 'set', 'stock_value': 35000000, 'turnover_rate': 3.2, 'status': 'critical'},
    ]


def get_dummy_purchase_orders():
    """발주 더미 데이터"""
    from datetime import date, timedelta
    return [
        {'id': 1, 'po_number': 'PO-2024-1201', 'item_name': '원료A', 'supplier_name': '신화약품', 'order_date': (date.today() - timedelta(days=3)).isoformat(), 'delivery_date': (date.today() + timedelta(days=4)).isoformat(), 'total_amount': 150000000, 'status': 'in-transit', 'is_urgent': False},
        {'id': 2, 'po_number': 'PO-2024-1202', 'item_name': '원료B', 'supplier_name': '한독바이오', 'order_date': (date.today() - timedelta(days=1)).isoformat(), 'delivery_date': (date.today() + timedelta(days=2)).isoformat(), 'total_amount': 95000000, 'status': 'ordered', 'is_urgent': True},
        {'id': 3, 'po_number': 'PO-2024-1203', 'item_name': '포장재', 'supplier_name': '삼성포장', 'order_date': (date.today() - timedelta(days=5)).isoformat(), 'delivery_date': (date.today() + timedelta(days=1)).isoformat(), 'total_amount': 55000000, 'status': 'in-transit', 'is_urgent': False},
    ]


def get_dummy_suppliers():
    """공급업체 더미 데이터"""
    return [
        {'id': 1, 'supplier_code': 'S001', 'supplier_name': '신화약품', 'total_score': 92.5, 'purchase_share': 25.5, 'grade': 'A', 'trend': 'up'},
        {'id': 2, 'supplier_code': 'S002', 'supplier_name': '한독바이오', 'total_score': 88.3, 'purchase_share': 18.2, 'grade': 'A', 'trend': 'stable'},
        {'id': 3, 'supplier_code': 'S003', 'supplier_name': '삼성포장', 'total_score': 85.7, 'purchase_share': 15.8, 'grade': 'B', 'trend': 'up'},
        {'id': 4, 'supplier_code': 'S004', 'supplier_name': '대한화학', 'total_score': 82.1, 'purchase_share': 12.5, 'grade': 'B', 'trend': 'stable'},
    ]


def get_dummy_material_prices():
    """원자재 가격 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'material_code': 'MAT-001', 'material_name': '원료A', 'unit_price': 50000, 'price_change_rate': 2.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'material_code': 'MAT-002', 'material_name': '원료B', 'unit_price': 56000, 'price_change_rate': -1.2},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 11, 'material_code': 'MAT-001', 'material_name': '원료A', 'unit_price': 48800, 'price_change_rate': 1.8},
    ]


def get_dummy_inventory_turnover():
    """재고 회전율 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'A', 'turnover_rate': 6.2, 'days_in_inventory': 58},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'B', 'turnover_rate': 4.5, 'days_in_inventory': 81},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'C', 'turnover_rate': 5.8, 'days_in_inventory': 63},
    ]


class MonthlyPurchaseViewSet(viewsets.ModelViewSet):
    """월별 구매 ViewSet"""
    queryset = MonthlyPurchase.objects.all()
    serializer_class = MonthlyPurchaseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_monthly_purchase())
        return super().list(request, *args, **kwargs)

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

        if not purchases.exists():
            dummy = [d for d in get_dummy_monthly_purchase() if d['fiscal_year'] == int(year)]
            return Response(dummy)

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

        if not purchases.exists():
            dummy = [d for d in get_dummy_monthly_purchase() if d['fiscal_year'] == int(year)]
            return Response({
                'fiscal_year': year,
                'total_purchase': sum(d['purchase_amount'] for d in dummy),
                'average_purchase': sum(d['purchase_amount'] for d in dummy) / len(dummy) if dummy else 0,
                'total_orders': sum(d['order_count'] for d in dummy),
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_inventory())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """ABC 분류별 재고"""
        category = request.query_params.get('category')

        queryset = self.queryset
        if category:
            queryset = queryset.filter(category=category)

        if not queryset.exists():
            dummy = get_dummy_inventory()
            if category:
                dummy = [d for d in dummy if d['category'] == category]
            return Response(dummy)

        serializer = InventorySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """재고 경고 (부족/긴급)"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = [d for d in get_dummy_inventory() if d['status'] in ['low', 'critical']]
            return Response(dummy)

        alerts = queryset.filter(status__in=['low', 'critical'])
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_purchase_orders())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """입고 대기 발주"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = [d for d in get_dummy_purchase_orders() if d['status'] in ['ordered', 'in-transit']]
            return Response(dummy)

        pending = queryset.filter(status__in=['ordered', 'in-transit'])
        serializer = PurchaseOrderListSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """긴급 발주"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = [d for d in get_dummy_purchase_orders() if d['is_urgent']]
            return Response(dummy)

        urgent = queryset.filter(is_urgent=True, status__in=['ordered', 'in-transit'])
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_suppliers())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def evaluation(self, request):
        """공급업체 평가"""
        queryset = self.queryset

        if not queryset.exists():
            return Response(sorted(get_dummy_suppliers(), key=lambda x: x['total_score'], reverse=True))

        suppliers = queryset.order_by('-total_score')
        serializer = SupplierSerializer(suppliers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def share(self, request):
        """공급업체별 구매 비중"""
        queryset = self.queryset

        if not queryset.exists():
            suppliers = sorted(get_dummy_suppliers(), key=lambda x: x['purchase_share'], reverse=True)
            data = [{'supplier_name': s['supplier_name'], 'purchase_share': s['purchase_share']} for s in suppliers]
            return Response(data)

        suppliers = queryset.order_by('-purchase_share')
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_material_prices())
        return super().list(request, *args, **kwargs)

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

        if not queryset.exists():
            dummy = get_dummy_material_prices()
            if material_code:
                dummy = [d for d in dummy if d['material_code'] == material_code]
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response(sorted(dummy, key=lambda x: x.get('fiscal_month', 0)))

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_inventory_turnover())
        return super().list(request, *args, **kwargs)

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

        if not queryset.exists():
            dummy = get_dummy_inventory_turnover()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

        serializer = InventoryTurnoverSerializer(queryset, many=True)
        return Response(serializer.data)
