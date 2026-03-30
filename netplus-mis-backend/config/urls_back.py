"""
URL configuration for NetPlus MIS project.
유한산업 경영정보시스템 대시보드 API
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="NetPlus MIS AI Dashboard API",
        default_version='v1',
        description="유한산업 경영정보시스템 대시보드 API",
        contact=openapi.Contact(email="admin@yuhan.co.kr"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

# API 루트 상태 확인
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
    """API 루트 상태 확인"""
    return Response({
        'status': 'ok',
        'message': 'NetPlus MIS AI Dashboard API',
        'version': 'v1',
        'endpoints': {
            'financial': '/api/financial/',
            'production': '/api/production/',
            'quality': '/api/quality/',
            'sales': '/api/sales/',
            'purchase': '/api/purchase/',
            'esg': '/api/esg/',
            'cost': '/api/cost/',
            'accounting': '/api/accounting/',
            'manufacturing': '/api/manufacturing/',
            'productivity': '/api/productivity/',
            'development': '/api/development/',
            'reports': '/api/reports/',
            'ontology': '/api/ontology/',
            'ai': '/api/ai/',
            'erp_sync': '/api/erp-sync/',
            'health': '/api/health/',
        }
    })

# 통합 대시보드 엔드포인트
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_summary(request):
    """통합 대시보드 요약 데이터 - 더미 데이터 반환 (단위: 억원)"""
    # 데이터베이스에 초기 데이터가 없는 경우 더미 데이터 반환
    data = {
        'fiscal_year': 2024,
        'fiscal_month': 12,
        'revenue': 15000,
        'revenue_growth': 8.5,
        'operating_profit': 1200,
        'operating_margin': 8.0,
        'net_profit': 950,
        'net_margin': 6.3,
        'production_volume': 12500000,
        'quality_rate': 98.5,
        'employee_count': 850,
    }
    return Response(data)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Root
    path('api/', api_root, name='api-root'),

    # 통합 대시보드
    path('api/dashboard/summary/', dashboard_summary, name='dashboard-summary'),

    # API Routes
    path('api/financial/', include('financial.urls')),
    path('api/production/', include('production.urls')),
    path('api/quality/', include('quality.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/purchase/', include('purchase.urls')),
    path('api/esg/', include('esg.urls')),
    path('api/cost/', include('cost.urls')),
    path('api/accounting/', include('accounting.urls')),
    path('api/manufacturing/', include('manufacturing.urls')),
    path('api/productivity/', include('productivity.urls')),
    path('api/development/', include('development.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/ontology/', include('ontology.urls')),

    # AI Prediction & Monitoring
    path('api/ai/predictions/', include('ai.urls')),
    path('api/health/', include('utils.health_urls')),

    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
