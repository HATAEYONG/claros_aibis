# API Views for Frontend Integration
# Handles lot tracing, causal analysis, and SQL execution endpoints
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import json
import sys
import os

# Add parent directory to path for importing ai module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ai.database_connection import YHDatabaseConnection, get_yh_db_config
    YH_DB_AVAILABLE = True
except ImportError:
    YH_DB_AVAILABLE = False


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_endpoint(request):
    """Health check endpoint for frontend"""
    return Response({
        'status': 'ok',
        'timestamp': '2024-12-20T00:00:00Z'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def db_test(request):
    """Test database connection"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        if row and row[0] == 1:
            return Response({
                'connected': True,
                'message': 'Database connection successful'
            })
        else:
            return Response({
                'connected': False,
                'message': 'Database query returned unexpected result'
            })
    except Exception as e:
        return Response({
            'connected': False,
            'message': f'Database connection failed: {str(e)}'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_tables(request):
    """Get database table list"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            """)
            tables = [row[0] for row in cursor.fetchall()]

        return Response({
            'tables': tables,
            'count': len(tables)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_table_schema(request, table_name):
    """Get table schema"""
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = []
            for row in cursor.fetchall():
                columns.append({
                    'cid': row[0],
                    'name': row[1],
                    'type': row[2],
                    'notnull': row[3],
                    'dflt_value': row[4],
                    'pk': row[5]
                })

        return Response({
            'tableName': table_name,
            'schema': columns
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def trace_lot(request, lot_no):
    """
    Trace lot number through production process
    Returns product info, materials, process info, quality info, equipment, workers
    """
    # For now, return a dummy response with expected structure
    # TODO: Implement actual lot tracing logic from database
    return Response({
        'lotNo': lot_no,
        'productInfo': {
            'productCode': 'P001',
            'productName': 'Sample Product',
            'specification': 'Sample Spec',
            'quantity': 1000,
            'productionDate': '2024-12-20',
            'lineCode': 'L01'
        },
        'materialInfo': [
            {
                'materialCode': 'M001',
                'materialName': 'Raw Material A',
                'lotNo': 'MAT-2024-001',
                'supplierCode': 'S001',
                'supplierName': 'Supplier A',
                'receiveDate': '2024-12-15',
                'quantity': 500
            }
        ],
        'processInfo': [
            {
                'processCode': 'PRC001',
                'processName': 'Molding',
                'startTime': '2024-12-20T08:00:00',
                'endTime': '2024-12-20T12:00:00',
                'workerName': 'John Doe',
                'equipmentCode': 'EQ001',
                'equipmentName': 'Machine A',
                'status': 'COMPLETED'
            }
        ],
        'qualityInfo': [
            {
                'inspectionId': 'INS001',
                'inspectionType': 'In-process',
                'inspectionDate': '2024-12-20',
                'result': 'PASS',
                'inspector': 'Inspector A',
                'defectType': None,
                'defectQty': 0
            }
        ],
        'equipmentInfo': [
            {
                'equipmentCode': 'EQ001',
                'equipmentName': 'Machine A',
                'equipmentType': 'Injection Molding',
                'status': 'RUNNING',
                'lastMaintenance': '2024-12-15',
                'operatingHours': 1500
            }
        ],
        'workerInfo': [
            {
                'workerId': 'W001',
                'workerName': 'John Doe',
                'department': 'Production',
                'shift': 'Day',
                'skillLevel': 'Senior'
            }
        ],
        'defectInfo': [],
        'traceHistory': [
            {
                'timestamp': '2024-12-20T08:00:00',
                'event': 'Production Started',
                'description': 'Production lot started on line L01',
                'relatedTable': 'PP_PRODUCTION',
                'relatedId': '1'
            },
            {
                'timestamp': '2024-12-20T12:00:00',
                'event': 'Production Completed',
                'description': 'Production lot completed successfully',
                'relatedTable': 'PP_PRODUCTION',
                'relatedId': '1'
            }
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def causal_analysis(request):
    """
    Get 6M causal analysis data
    Query params: lotNo, startDate, endDate
    """
    lot_no = request.query_params.get('lotNo')
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')

    # For now, return a dummy response with expected structure
    # TODO: Implement actual causal analysis logic
    return Response({
        'man': {
            'category': 'Man',
            'subcategory': 'Worker Issues',
            'data': [
                {
                    'defect_type': 'Dimensional Defect',
                    'cause': 'Worker Skill Gap',
                    'occurrence_count': 5,
                    'actions_taken': 'Training completed'
                }
            ],
            'insights': [
                'Worker training recommended for Lot: ' + (lot_no or 'N/A'),
                'Shift patterns may affect quality'
            ]
        },
        'machine': {
            'category': 'Machine',
            'subcategory': 'Equipment Issues',
            'data': [
                {
                    'defect_type': 'Dimensional Defect',
                    'cause': 'Mold Wear',
                    'occurrence_count': 8,
                    'actions_taken': 'Mold replaced'
                }
            ],
            'insights': [
                'Preventive maintenance schedule recommended'
            ]
        },
        'material': {
            'category': 'Material',
            'subcategory': 'Raw Material Issues',
            'data': [],
            'insights': [
                'Material batch testing shows good quality'
            ]
        },
        'method': {
            'category': 'Method',
            'subcategory': 'Process Issues',
            'data': [
                {
                    'defect_type': 'Dimensional Defect',
                    'cause': 'Temperature Variance',
                    'occurrence_count': 3,
                    'actions_taken': 'Process parameters adjusted'
                }
            ],
            'insights': [
                'Process optimization reduced defects by 40%'
            ]
        },
        'summary': [
            'Primary cause: Machine (Mold Wear)',
            'Secondary cause: Method (Temperature Variance)',
            'Recommendation: Schedule mold maintenance and optimize process parameters'
        ]
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def execute_sql(request):
    """Execute SQL query and return results"""
    try:
        data = json.loads(request.body)
        sql = data.get('sql', '')

        if not sql:
            return Response({
                'success': False,
                'error': 'SQL query is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Basic SQL injection prevention
        sql_lower = sql.lower().strip()
        dangerous_keywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update']
        for keyword in dangerous_keywords:
            if keyword in sql_lower:
                return Response({
                    'success': False,
                    'error': f'Dangerous SQL keyword detected: {keyword}'
                }, status=status.HTTP_403_FORBIDDEN)

        with connection.cursor() as cursor:
            cursor.execute(sql)
            columns = [col[0] for col in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            results = [dict(zip(columns, row)) for row in rows]

        return Response({
            'success': True,
            'data': results,
            'rowCount': len(results)
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def defect_summary(request):
    """Get defect summary data"""
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')

    # For now, return a dummy response
    # TODO: Implement actual defect summary logic
    return Response([
        {
            'defect_type': 'Dimensional Defect',
            'count': 15,
            'percentage': 35.7
        },
        {
            'defect_type': 'Appearance Defect',
            'count': 12,
            'percentage': 28.6
        },
        {
            'defect_type': 'Functional Defect',
            'count': 10,
            'percentage': 23.8
        },
        {
            'defect_type': 'Other',
            'count': 5,
            'percentage': 11.9
        }
    ])


@api_view(['GET'])
@permission_classes([AllowAny])
def equipment_status(request):
    """Get equipment status"""
    # For now, return a dummy response
    # TODO: Implement actual equipment status logic
    return Response([
        {
            'equipment_code': 'EQ001',
            'equipment_name': 'Machine A',
            'status': 'RUNNING',
            'oee': 85.5,
            'availability': 92.0,
            'performance': 88.0,
            'quality': 95.0
        },
        {
            'equipment_code': 'EQ002',
            'equipment_name': 'Machine B',
            'status': 'STOPPED',
            'oee': 0.0,
            'availability': 70.0,
            'performance': 0.0,
            'quality': 0.0
        }
    ])


@api_view(['GET'])
@permission_classes([AllowAny])
def daily_production(request):
    """Get daily production data"""
    date_param = request.query_params.get('date')

    # For now, return a dummy response
    # TODO: Implement actual daily production logic
    return Response([
        {
            'date': date_param or '2024-12-20',
            'line_code': 'L01',
            'product_code': 'P001',
            'plan_qty': 1000,
            'actual_qty': 950,
            'good_qty': 920,
            'defect_qty': 30,
            'yield_rate': 96.8,
            'oee': 85.5
        }
    ])


# ============================================================================
# YH Database Specific Endpoints
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def yh_db_config(request):
    """Get YH database configuration (frontend only, no password)"""
    if YH_DB_AVAILABLE:
        config = get_yh_db_config()
        return Response({
            'success': True,
            'config': config,
            'available': True
        })
    else:
        return Response({
            'success': False,
            'available': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def yh_db_test(request):
    """Test YH database connection"""
    if not YH_DB_AVAILABLE:
        return Response({
            'success': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    db = YHDatabaseConnection()
    result = db.test_connection()

    if result['success']:
        return Response({
            'success': True,
            'database': result['database'],
            'host': result['host'],
            'port': result['port'],
            'table_count': result['table_count'],
            'tables': result.get('tables', [])[:20]  # First 20 tables
        })
    else:
        return Response({
            'success': False,
            'error': result['error']
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def yh_db_tables(request):
    """Get YH database table list with schema information"""
    if not YH_DB_AVAILABLE:
        return Response({
            'success': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    db = YHDatabaseConnection()
    if not db.connect():
        return Response({
            'success': False,
            'error': 'Database connection failed'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        table_info = db.get_table_info()

        # 포맷팅하여 반환
        formatted_tables = []
        for table_name, info in table_info.items():
            # 컬럼 정보 포맷팅
            columns = []
            for col in info['columns']:
                columns.append({
                    'name': col['column_name'],
                    'type': col['data_type'],
                    'nullable': col['is_nullable'] == 'YES',
                    'is_pk': col['column_name'] in info['primary_keys']
                })

            formatted_tables.append({
                'name': table_name,
                'comment': info['comment'],
                'column_count': len(columns),
                'primary_keys': info['primary_keys'],
                'columns': columns
            })

        return Response({
            'success': True,
            'tables': formatted_tables,
            'count': len(formatted_tables)
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        db.disconnect()


@api_view(['POST'])
@permission_classes([AllowAny])
def yh_execute_sql(request):
    """Execute SQL query on YH database"""
    if not YH_DB_AVAILABLE:
        return Response({
            'success': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        data = json.loads(request.body)
        sql = data.get('sql', '')

        if not sql:
            return Response({
                'success': False,
                'error': 'SQL query is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # SQL injection prevention
        sql_lower = sql.lower().strip()
        dangerous_keywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update', 'grant', 'revoke']
        for keyword in dangerous_keywords:
            if keyword in sql_lower:
                return Response({
                    'success': False,
                    'error': f'Dangerous SQL keyword detected: {keyword}'
                }, status=status.HTTP_403_FORBIDDEN)

        db = YHDatabaseConnection()
        if not db.connect():
            return Response({
                'success': False,
                'error': 'Database connection failed'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            results = db.execute_query(sql)

            return Response({
                'success': True,
                'data': results,
                'rowCount': len(results)
            })

        finally:
            db.disconnect()

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def yh_table_data(request):
    """Get sample data from a specific YH table

    Query params:
        table_name: 테이블명
        limit: 조회할 행 수 (기본값: 10)
        days: 최근 N일 데이터 (기본값: 90, date_column과 함께 사용)
        date_column: 날짜 컬럼명
    """
    if not YH_DB_AVAILABLE:
        return Response({
            'success': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    table_name = request.query_params.get('table_name')
    limit = int(request.query_params.get('limit', 10))
    days = int(request.query_params.get('days', 90))
    date_column = request.query_params.get('date_column')

    if not table_name:
        return Response({
            'success': False,
            'error': 'table_name parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    db = YHDatabaseConnection()
    if not db.connect():
        return Response({
            'success': False,
            'error': 'Database connection failed'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        # 날짜 범위 조회 또는 일반 조회
        if date_column:
            results = db.get_recent_data(table_name, date_column, days)
        else:
            results = db.get_sample_data(table_name, limit)

        return Response({
            'success': True,
            'table_name': table_name,
            'data': results,
            'rowCount': len(results)
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        db.disconnect()


@api_view(['GET'])
@permission_classes([AllowAny])
def yh_recent_summary(request):
    """
    Get recent data summary for dashboard (최근 3개월)
    주요 테이블의 최근 데이터 요약을 반환
    """
    if not YH_DB_AVAILABLE:
        return Response({
            'success': False,
            'error': 'YH database module not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # 기본 날짜 범위 (3개월)
    days = int(request.query_params.get('days', 90))

    # 조회할 테이블과 날짜 컬럼 매핑
    # 실제 테이블명과 컬럼명은 스키마 확인 후 수정 필요
    table_configs = {
        # 'actual_table_name': 'date_column_name'
        # 예시 - 실제 테이블에 맞게 수정 필요
        'production': 'production_date',
        'sales': 'sales_date',
        'inventory': 'inventory_date',
        'quality': 'inspection_date',
    }

    summary = {}

    db = YHDatabaseConnection()
    if not db.connect():
        return Response({
            'success': False,
            'error': 'Database connection failed'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        # 먼저 실제 테이블 목록을 가져옴
        tables = db.get_tables()
        actual_tables = [t['tablename'] for t in tables]

        # 각 테이블에서 최근 데이터 조회
        for table_name in actual_tables[:10]:  # 처음 10개 테이블만
            try:
                # 테이블의 컬럼 정보 확인
                columns = db.get_table_columns(table_name)

                # 날짜 타입 컬럼 찾기
                date_col = None
                for col in columns:
                    if 'date' in col['column_name'].lower() or col['data_type'] in ['date', 'timestamp']:
                        date_col = col['column_name']
                        break

                if date_col:
                    try:
                        recent_data = db.get_recent_data(table_name, date_col, days)
                        summary[table_name] = {
                            'date_column': date_col,
                            'row_count': len(recent_data),
                            'latest_date': recent_data[0][date_col] if recent_data else None,
                            'sample_data': recent_data[:5] if recent_data else []
                        }
                    except:
                        # 날짜 조회 실패 시 일반 조회
                        sample_data = db.get_sample_data(table_name, 5)
                        summary[table_name] = {
                            'row_count': len(sample_data),
                            'sample_data': sample_data
                        }
                else:
                    # 날짜 컬럼이 없는 경우 일반 조회
                    sample_data = db.get_sample_data(table_name, 5)
                    summary[table_name] = {
                        'row_count': len(sample_data),
                        'sample_data': sample_data
                    }

            except Exception as e:
                summary[table_name] = {
                    'error': str(e)
                }

        return Response({
            'success': True,
            'days': days,
            'summary': summary
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        db.disconnect()


# ============================================================================
# Local Analysis Endpoints (로컬 SQLite 데이터 분석)
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def local_analysis_sales(request):
    """
    로컬 매출 데이터 분석
    Query params:
        - months: 분석할 개월 수 (기본 3)
    """
    try:
        from ai.local_analysis import LocalAnalyzer

        months = int(request.query_params.get('months', 3))
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_sales(months=months)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def local_analysis_quality(request):
    """
    로컬 품질 데이터 분석
    Query params:
        - days: 분석할 일수 (기본 90)
    """
    try:
        from ai.local_analysis import LocalAnalyzer

        days = int(request.query_params.get('days', 90))
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_quality(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def local_analysis_production(request):
    """
    로컬 생산 데이터 분석
    Query params:
        - days: 분석할 일수 (기본 90)
    """
    try:
        from ai.local_analysis import LocalAnalyzer

        days = int(request.query_params.get('days', 90))
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_production(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def local_analysis_comprehensive(request):
    """
    로컬 데이터 종합 분석
    Query params:
        - days: 분석할 일수 (기본 90)
    """
    try:
        from ai.local_analysis import LocalAnalyzer

        days = int(request.query_params.get('days', 90))
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_comprehensive(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
