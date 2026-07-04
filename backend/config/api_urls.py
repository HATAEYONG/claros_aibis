# API URLs for Frontend Integration
from django.urls import path
from .api_views import (
    health_check_endpoint,
    db_test,
    get_tables,
    get_table_schema,
    trace_lot,
    causal_analysis,
    execute_sql,
    defect_summary,
    equipment_status,
    daily_production,
    # YH Database endpoints
    yh_db_config,
    yh_db_test,
    yh_db_tables,
    yh_execute_sql,
    yh_table_data,
    yh_recent_summary,
    # Local Analysis endpoints
    local_analysis_sales,
    local_analysis_quality,
    local_analysis_production,
    local_analysis_comprehensive
)


urlpatterns = [
    # Health and DB endpoints
    path('health/', health_check_endpoint, name='api-health'),
    path('db/test/', db_test, name='db-test'),
    path('db/tables/', get_tables, name='get-tables'),
    path('db/schema/<str:table_name>/', get_table_schema, name='get-table-schema'),

    # Lot tracing and analysis
    path('lot/trace/<str:lot_no>/', trace_lot, name='trace-lot'),
    path('analysis/causal/', causal_analysis, name='causal-analysis'),

    # SQL execution (default SQLite)
    path('sql/execute/', execute_sql, name='execute-sql'),

    # Dashboard data
    path('dashboard/defects/', defect_summary, name='defect-summary'),
    path('dashboard/equipment/', equipment_status, name='equipment-status'),
    path('dashboard/production/', daily_production, name='daily-production'),

    # YH Database endpoints
    path('yh/config/', yh_db_config, name='yh-db-config'),
    path('yh/test/', yh_db_test, name='yh-db-test'),
    path('yh/tables/', yh_db_tables, name='yh-db-tables'),
    path('yh/sql/execute/', yh_execute_sql, name='yh-execute-sql'),
    path('yh/data/', yh_table_data, name='yh-table-data'),
    path('yh/summary/', yh_recent_summary, name='yh-recent-summary'),

    # Local Analysis endpoints (로컬 SQLite 데이터 분석)
    path('local-analysis/sales/', local_analysis_sales, name='local-analysis-sales'),
    path('local-analysis/quality/', local_analysis_quality, name='local-analysis-quality'),
    path('local-analysis/production/', local_analysis_production, name='local-analysis-production'),
    path('local-analysis/comprehensive/', local_analysis_comprehensive, name='local-analysis-comprehensive'),
]
