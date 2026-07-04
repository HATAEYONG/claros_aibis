"""
URL configuration for Claros MIS project.
유한산업 경영정보시스템 대시보드 API
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.views.static import serve as static_serve
import os

from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
import utils.dashboard_aggregator
from ai import local_analysis_views

schema_view = get_schema_view(
    openapi.Info(
        title="Claros MIS AI Dashboard API",
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
        'message': 'Claros MIS AI Dashboard API',
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
            'dashboard': '/api/dashboard/',
            # AIBIS Enterprise AI Platform
            'events': '/api/events/',
            'agents': '/api/agents/',
            'governance': '/api/governance/',
            'control_tower': '/api/control-tower/',
            'knowledge_graph': '/api/knowledge-graph/',
            'recommendations': '/api/recommendations/',
            # Phase 1: Copilot, Data Hub
            'copilot': '/api/copilot/',
            'data_hub': '/api/data-hub/',
            # Phase 2: RAG System
            'rag': '/api/rag/',
            # Phase 3: Advanced Analytics
            'ml_pipeline': '/api/ml-pipeline/',
            'ml_pipeline_v2': '/api/ml-pipeline/v2/',
            'mlops': '/api/ml-pipeline/mlops/',
            'xai': '/api/ml-pipeline/xai/',
            'llm': '/api/ml-pipeline/llm/',
            'optimization': '/api/ml-pipeline/optimization/',
            'automl': '/api/ml-pipeline/automl/',
            'multimodal': '/api/ml-pipeline/multimodal/',
            'federated': '/api/ml-pipeline/federated/',
            'knowledge_graph': '/api/ml-pipeline/knowledge_graph/',
            'reinforcement_learning': '/api/ml-pipeline/reinforcement_learning/',
            'integrated_ai': '/api/ml-pipeline/integrated_ai/',
            'next_gen_ai': '/api/ml-pipeline/next_gen_ai/',
            'forecasting': '/api/forecasting/',
            'forecasting_v2': '/api/forecasting/v2/',
            'anomaly_detection': '/api/anomaly-detection/',
            # Phase 4: External Integration & Visualization
            'integrations': '/api/integrations/',
            'visualization': '/api/visualization/',
            # Phase 5: Performance, Security & DevOps
            'monitoring': '/api/monitoring/',
            'security': '/api/security/',
            # AXOS ERP V10.4 Integration
            'axos_erp': '/api/axos-erp/',
            # Frontend integration endpoints
            'lot_trace': '/api/lot/trace/{lot_no}/',
            'causal_analysis': '/api/analysis/causal/',
            'sql_execute': '/api/sql/execute/',
            'db_test': '/api/db/test/',
            'db_tables': '/api/db/tables/',
            'dashboard_defects': '/api/dashboard/defects/',
            'dashboard_equipment': '/api/dashboard/equipment/',
            'dashboard_production': '/api/dashboard/production/',
        }
    })

# 통합 대시보드 엔드포인트
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_summary(request):
    """통합 대시보드 요약 데이터 - 더미 데이터 반환 (단위: 억원)"""
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

# React SPA 서빙 함수
def _serve_react(request, *args, **kwargs):
    """React SPA index.html 반환"""
    react_index = os.path.join(settings.BASE_DIR, "static", "react", "index.html")
    if os.path.exists(react_index):
        return FileResponse(open(react_index, "rb"), content_type="text/html")
    raise Http404("React build not found")

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
    path('api/erp-sync/', include('erp_sync.urls')),
    path('api/business-process/', include('business_process.urls')),
    path('api/domain-agents/', include('domain_agents.urls')),

    # AIBIS Enterprise AI Platform Routes
    path('api/events/', include('events.urls')),
    path('api/agents/', include('ai.agent_urls')),
    path('api/governance/', include('governance.urls')),
    path('api/control-tower/', include('control_tower.urls')),

    # Phase 1: Copilot & Data Hub Routes
    path('api/copilot/', include('ai.copilot.urls')),
    path('api/data-hub/', include('data_hub.urls')),

    # Phase 2: RAG System Routes
    path('api/rag/', include('rag.urls')),

    # Phase 3: Advanced Analytics Routes
    path('api/ml-pipeline/', include('ml_pipeline.urls')),
    path('api/forecasting/', include('forecasting.urls')),
    path('api/anomaly-detection/', include('anomaly_detection.urls')),

    # Phase 4: External Integration & Visualization Routes
    path('api/integrations/', include('integrations.urls')),
    path('api/visualization/', include('visualization.urls')),

    # Phase 5: Performance, Security & DevOps Routes
    path('api/monitoring/', include('monitoring.urls')),
    path('api/security/', include('security.urls')),
    path('api/ai/', include('ai.urls')),

    # AXOS ERP V10.4 Integration Routes
    path('api/axos-erp/', include('axos_erp.urls')),

    # API Documentation
    path('api/docs/', include('config.api_docs_urls')),

    # Dashboard Aggregate Endpoints
    path('api/dashboard/overview/', utils.dashboard_aggregator.dashboard_overview, name='dashboard-overview'),
    path('api/dashboard/kpis/', utils.dashboard_aggregator.dashboard_kpis, name='dashboard-kpis'),
    path('api/dashboard/trends/', utils.dashboard_aggregator.dashboard_trends, name='dashboard-trends'),
    path('api/dashboard/alerts/', utils.dashboard_aggregator.dashboard_alerts, name='dashboard-alerts'),

    # Frontend Integration API
    path('api/', include('config.api_urls')),

    # AI Prediction & Monitoring
    path('api/ai/predictions/', include('ai.urls')),
    path('api/health/', include('utils.health_urls')),

    # Local Analysis Endpoints
    path('api/local-analysis/comprehensive/', local_analysis_views.comprehensive_analysis, name='local-analysis-comprehensive'),
    path('api/local-analysis/sales/', local_analysis_views.sales_analysis, name='local-analysis-sales'),
    path('api/local-analysis/quality/', local_analysis_views.quality_analysis, name='local-analysis-quality'),
    path('api/local-analysis/production/', local_analysis_views.production_analysis, name='local-analysis-production'),

    # Prometheus Metrics
    path('metrics/', lambda r: HttpResponse(
        __import__('utils.metrics', fromlist=['metrics_collector']).metrics_collector.get_metrics(),
        content_type='text/plain'
    )),

    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # ── React 정적 파일 (JS/CSS) ────
    re_path(
        r"^assets/(?P<path>.*)$",
        static_serve,
        {"document_root": os.path.join(settings.BASE_DIR, "static", "react", "assets")},
        name="react-assets",
    ),
    
    # ── React SPA (catch-all, 맨 마지막에 위치) ────
    re_path(r"^(?!api/|admin/|swagger|redoc).*$", _serve_react, name="react-spa"),
]
