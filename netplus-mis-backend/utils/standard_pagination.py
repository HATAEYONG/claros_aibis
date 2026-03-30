# -*- coding: utf-8 -*-
"""
표준 페이지네이션 및 필터링 설정
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend


class StandardPageNumberPagination(PageNumberPagination):
    """
    표준 페이지네이션 클래스

    Query Parameters:
    - page: 페이지 번호 (기본값: 1)
    - page_size: 페이지 당 아이템 수 (기본값: 50, 최대: 1000)

    Response Format:
    {
        "count": int,
        "next": "url" or null,
        "previous": "url" or null,
        "results": [...]
    }
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000


class LargeResultsSetPagination(PageNumberPagination):
    """
    대용량 결과셋 페이지네이션

    기본 page_size: 100
    최대 page_size: 5000
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 5000


class SmallResultsSetPagination(PageNumberPagination):
    """
    소용량 결과셋 페이지네이션

    기본 page_size: 10
    최대 page_size: 100
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class StandardViewSetMixin:
    """
    표준 ViewSet 믹스인 - 페이지네이션, 필터, 검색, 정렬 설정

    사용법:
    class MyViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
        pagination_class = StandardPageNumberPagination
        filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
        filterset_fields = ['field1', 'field2']
        search_fields = ['field1', 'field2']
        ordering_fields = ['field1', 'field2']
        ordering = ['-id']
    """
    pagination_class = StandardPageNumberPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]


# 표준 필터 백엔드 설정
STANDARD_FILTER_BACKENDS = [
    DjangoFilterBackend,
    SearchFilter,
    OrderingFilter,
]


# 일반적으로 사용되는 검색 필드
COMMON_SEARCH_FIELDS = {
    'financial': ['statement_type'],
    'production': ['order_number', 'product_name', 'product_code'],
    'quality': ['inspection_number', 'product_name', 'product_code', 'lot_number'],
    'sales': ['customer_name', 'customer_code', 'product_name'],
    'purchase': ['supplier_name', 'supplier_code', 'item_name'],
}


# 일반적으로 사용되는 정렬 필드
COMMON_ORDERING_FIELDS = {
    'financial': ['fiscal_year', 'fiscal_month', 'revenue', 'net_income'],
    'production': ['production_date', 'target_quantity', 'actual_quantity', 'efficiency'],
    'quality': ['inspection_date', 'result', 'defect_count'],
    'sales': ['fiscal_year', 'fiscal_month', 'actual_amount'],
    'purchase': ['fiscal_year', 'fiscal_month', 'purchase_amount'],
}


def get_standard_filterset_fields(model):
    """
    모델에 대한 표준 filterset_fields를 반환합니다.
    """
    fields = []

    # 연도/월 필드 (있는 경우)
    if hasattr(model, 'fiscal_year'):
        fields.append('fiscal_year')
    if hasattr(model, 'fiscal_month'):
        fields.append('fiscal_month')

    # 상태 필드 (있는 경우)
    if hasattr(model, 'status'):
        fields.append('status')

    # 타입 필드 (있는 경우)
    if hasattr(model, 'type'):
        fields.append('type')

    # 생성일 필드 (있는 경우)
    if hasattr(model, 'created_at'):
        fields.append('created_at')

    return fields
