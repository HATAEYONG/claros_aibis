# -*- coding: utf-8 -*-
"""
통합 레이어 API 뷰
수주(Sales) -> 생산(Production) -> 품질(Quality) -> 재고(Material)가
모두 같은 제품(MasterProduct)을 통해 실제로 이어지는 것을 확인할 수 있는 API
"""
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from erp_sync.data_hub.master.models import MasterProduct
from .models import (
    IntegratedMaterial, IntegratedProductionOrder,
    IntegratedQualityRecord, IntegratedSalesOrder,
)
from .serializers import (
    IntegratedMaterialSerializer, IntegratedProductionOrderSerializer,
    IntegratedQualityRecordSerializer, IntegratedSalesOrderSerializer,
    ProcessChainSerializer,
)


class IntegratedMaterialViewSet(viewsets.ModelViewSet):
    """통합 자재(재고) ViewSet"""
    serializer_class = IntegratedMaterialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plant', 'warehouse', 'is_abcs', 'is_slow_moving']
    search_fields = ['product__product_code', 'product__product_name']
    ordering_fields = ['quantity_available', 'total_value', 'updated_at']

    def get_queryset(self):
        return IntegratedMaterial.objects.select_related('product', 'primary_vendor').all()


class IntegratedProductionOrderViewSet(viewsets.ModelViewSet):
    """통합 생산 오더 ViewSet"""
    serializer_class = IntegratedProductionOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'plant', 'line']
    search_fields = ['order_number', 'product__product_code', 'product__product_name']
    ordering_fields = ['start_date_scheduled', 'progress', 'updated_at']

    def get_queryset(self):
        return IntegratedProductionOrder.objects.select_related(
            'product', 'equipment', 'production_supervisor'
        ).all()


class IntegratedQualityRecordViewSet(viewsets.ModelViewSet):
    """통합 품질 기록 ViewSet"""
    serializer_class = IntegratedQualityRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['result', 'record_type', 'capa_required']
    search_fields = ['record_number', 'product__product_code', 'product__product_name', 'lot_number']
    ordering_fields = ['inspection_date', 'updated_at']

    def get_queryset(self):
        return IntegratedQualityRecord.objects.select_related(
            'product', 'inspector', 'customer'
        ).all()


class IntegratedSalesOrderViewSet(viewsets.ModelViewSet):
    """통합 영업 오더 ViewSet"""
    serializer_class = IntegratedSalesOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'customer']
    search_fields = ['order_number', 'customer__customer_name', 'product__product_code', 'product__product_name']
    ordering_fields = ['order_date', 'progress', 'updated_at']

    def get_queryset(self):
        return IntegratedSalesOrder.objects.select_related(
            'customer', 'product', 'sales_person'
        ).all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def process_chain(request, product_code):
    """
    제품 코드 하나로 수주 -> 생산 -> 품질 -> 재고 전 과정을 한 번에 조회.
    O2C/P2P 프로세스가 실제로 서로 연결되어 있는지 확인하기 위한 엔드포인트.
    """
    try:
        product = MasterProduct.objects.get(product_code=product_code)
    except MasterProduct.DoesNotExist:
        return Response({'error': f'제품 코드 {product_code}를 찾을 수 없습니다.'}, status=404)

    data = {
        'product_code': product.product_code,
        'product_name': product.product_name,
        'sales_orders': IntegratedSalesOrder.objects.select_related(
            'customer', 'product', 'sales_person'
        ).filter(product=product),
        'production_orders': IntegratedProductionOrder.objects.select_related(
            'product', 'equipment', 'production_supervisor'
        ).filter(product=product),
        'quality_records': IntegratedQualityRecord.objects.select_related(
            'product', 'inspector', 'customer'
        ).filter(product=product),
        'materials': IntegratedMaterial.objects.select_related(
            'product', 'primary_vendor'
        ).filter(product=product),
    }
    serializer = ProcessChainSerializer(data)
    return Response(serializer.data)
