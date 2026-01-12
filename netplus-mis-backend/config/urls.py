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
        }
    })

# 통합 대시보드 엔드포인트
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_summary(request):
    """통합 대시보드 요약 데이터"""
    from reports.models import ExecutiveSummary

    try:
        latest_summary = ExecutiveSummary.objects.order_by('-fiscal_year', '-fiscal_month').first()

        if latest_summary:
            data = {
                'fiscal_year': latest_summary.fiscal_year,
                'fiscal_month': latest_summary.fiscal_month,
                'revenue': float(latest_summary.revenue),
                'revenue_growth': float(latest_summary.revenue_growth),
                'operating_profit': float(latest_summary.operating_profit),
                'operating_margin': float(latest_summary.operating_margin),
                'net_profit': float(latest_summary.net_profit),
                'net_margin': float(latest_summary.net_margin),
                'production_volume': latest_summary.production_volume,
                'quality_rate': float(latest_summary.quality_rate),
                'employee_count': latest_summary.employee_count,
            }
        else:
            # 초기 데이터가 없는 경우 기본값 반환
            data = {
                'fiscal_year': 2024,
                'fiscal_month': 12,
                'revenue': 0,
                'revenue_growth': 0,
                'operating_profit': 0,
                'operating_margin': 0,
                'net_profit': 0,
                'net_margin': 0,
                'production_volume': 0,
                'quality_rate': 0,
                'employee_count': 0,
            }

        return Response(data)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

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

    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
