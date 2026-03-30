"""
ERP 연결 서비스
ERP 시스템 연결 및 테이블/필드 메타데이터 가져오기
"""

import time
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class ERPConnectionService:
    """ERP 연결 서비스"""

    def test_connection(self, erp_source) -> Dict[str, Any]:
        """
        ERP 소스 연결 테스트

        Args:
            erp_source: ERPSource 모델 인스턴스

        Returns:
            연결 테스트 결과 딕셔너리
        """
        start_time = time.time()

        try:
            if erp_source.source_type == 'postgresql':
                return self._test_postgresql_connection(erp_source, start_time)
            elif erp_source.source_type == 'mssql':
                return self._test_mssql_connection(erp_source, start_time)
            elif erp_source.source_type == 'mysql':
                return self._test_mysql_connection(erp_source, start_time)
            elif erp_source.source_type == 'sqlite':
                return self._test_sqlite_connection(erp_source, start_time)
            elif erp_source.source_type == 'api':
                return self._test_api_connection(erp_source, start_time)
            else:
                return {
                    'status': 'error',
                    'message': f'지원하지 않는 소스 타입: {erp_source.source_type}'
                }
        except Exception as e:
            logger.error(f"Connection test failed for {erp_source.source_code}: {str(e)}")
            return {
                'status': 'error',
                'message': '연결 실패',
                'error_code': 'CONNECTION_FAILED',
                'error_details': str(e)
            }

    def _test_postgresql_connection(self, erp_source, start_time) -> Dict[str, Any]:
        """PostgreSQL 연결 테스트"""
        try:
            import psycopg2
            import psycopg2.extras

            conn = psycopg2.connect(
                host=erp_source.host,
                port=erp_source.port or 5432,
                database=erp_source.database_name,
                user='postgres',  # 설정에서 가져오기
                password=''  # 설정에서 가져오기
            )

            cursor = conn.cursor()
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s",
                          [erp_source.schema_name or 'public'])
            table_count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                'status': 'success',
                'message': '연결 성공',
                'latency_ms': latency_ms,
                'database_info': {
                    'version': version,
                    'table_count': table_count,
                    'schema': erp_source.schema_name or 'public'
                }
            }
        except ImportError:
            return {
                'status': 'error',
                'message': 'psycopg2 라이브러리가 설치되지 않았습니다.',
                'error_code': 'LIBRARY_NOT_FOUND'
            }
        except Exception as e:
            raise

    def _test_mssql_connection(self, erp_source, start_time) -> Dict[str, Any]:
        """MS SQL Server 연결 테스트"""
        try:
            import pyodbc

            conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};" \
                      f"SERVER={erp_source.host},{erp_source.port or 1433};" \
                      f"DATABASE={erp_source.database_name};" \
                      f"Trusted_Connection=yes;"

            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]

            cursor.execute(f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES")
            table_count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                'status': 'success',
                'message': '연결 성공',
                'latency_ms': latency_ms,
                'database_info': {
                    'version': version.split('\n')[0],
                    'table_count': table_count
                }
            }
        except ImportError:
            return {
                'status': 'error',
                'message': 'pyodbc 라이브러리가 설치되지 않았습니다.',
                'error_code': 'LIBRARY_NOT_FOUND'
            }
        except Exception as e:
            raise

    def _test_mysql_connection(self, erp_source, start_time) -> Dict[str, Any]:
        """MySQL 연결 테스트"""
        try:
            import pymysql

            conn = pymysql.connect(
                host=erp_source.host,
                port=erp_source.port or 3306,
                database=erp_source.database_name,
                user='root',
                password=''
            )

            cursor = conn.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM information_schema.tables")
            table_count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                'status': 'success',
                'message': '연결 성공',
                'latency_ms': latency_ms,
                'database_info': {
                    'version': version,
                    'table_count': table_count
                }
            }
        except ImportError:
            return {
                'status': 'error',
                'message': 'pymysql 라이브러리가 설치되지 않았습니다.',
                'error_code': 'LIBRARY_NOT_FOUND'
            }
        except Exception as e:
            raise

    def _test_sqlite_connection(self, erp_source, start_time) -> Dict[str, Any]:
        """SQLite 연결 테스트"""
        try:
            import sqlite3

            conn = sqlite3.connect(erp_source.database_name)
            cursor = conn.cursor()
            cursor.execute("SELECT sqlite_version()")
            version = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
            table_count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                'status': 'success',
                'message': '연결 성공',
                'latency_ms': latency_ms,
                'database_info': {
                    'version': version,
                    'table_count': table_count
                }
            }
        except Exception as e:
            raise

    def _test_api_connection(self, erp_source, start_time) -> Dict[str, Any]:
        """REST API 연결 테스트"""
        try:
            import requests

            headers = {}
            if erp_source.api_key:
                headers['Authorization'] = f'Bearer {erp_source.api_key}'

            response = requests.get(
                f"{erp_source.api_base_url}/health",
                headers=headers,
                timeout=10
            )

            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code == 200:
                return {
                    'status': 'success',
                    'message': '연결 성공',
                    'latency_ms': latency_ms,
                    'api_info': response.json() if response.content else {}
                }
            else:
                return {
                    'status': 'error',
                    'message': f'API 오류: HTTP {response.status_code}',
                    'latency_ms': latency_ms
                }
        except Exception as e:
            raise

    def import_table_definitions(self, erp_source, module_filter=None,
                                  table_name_pattern='%', import_fields=True) -> Dict[str, Any]:
        """
        테이블 정의 가져오기

        Args:
            erp_source: ERPSource 모델 인스턴스
            module_filter: 모듈 필터 목록
            table_name_pattern: 테이블명 패턴
            import_fields: 필드 정보 가져오기 여부

        Returns:
            가져오기 결과 딕셔너리
        """
        from erp_sync.models.erp_source import ERPTableDefinition, ERPFieldDefinition

        try:
            if erp_source.source_type == 'postgresql':
                tables = self._get_postgresql_tables(erp_source, module_filter, table_name_pattern)
            elif erp_source.source_type == 'mssql':
                tables = self._get_mssql_tables(erp_source, module_filter, table_name_pattern)
            elif erp_source.source_type == 'sqlite':
                tables = self._get_sqlite_tables(erp_source, module_filter, table_name_pattern)
            else:
                return {
                    'status': 'error',
                    'message': f'지원하지 않는 소스 타입: {erp_source.source_type}'
                }

            imported_tables = 0
            imported_fields = 0
            errors = []

            for table_info in tables:
                try:
                    # 테이블 정의 생성 또는 업데이트
                    table_def, created = ERPTableDefinition.objects.update_or_create(
                        erp_source=erp_source,
                        source_table_name=table_info['table_name'],
                        defaults={
                            'source_table_comment': table_info.get('comment', ''),
                            'module_code': table_info.get('module_code', 'ETC'),
                            'module_name': table_info.get('module_name', ''),
                            'record_count': table_info.get('record_count', 0),
                        }
                    )

                    if created:
                        imported_tables += 1

                    # 필드 정보 가져오기
                    if import_fields:
                        fields = self._get_table_fields(erp_source, table_def)
                        for field_info in fields:
                            ERPFieldDefinition.objects.get_or_create(
                                table_definition=table_def,
                                source_field_name=field_info['field_name'],
                                defaults={
                                    'source_field_type': field_info['field_type'],
                                    'source_field_comment': field_info.get('comment', ''),
                                    'is_primary_key': field_info.get('is_primary_key', False),
                                    'is_nullable': field_info.get('is_nullable', True),
                                    'is_foreign_key': field_info.get('is_foreign_key', False),
                                    'referenced_table': field_info.get('referenced_table', ''),
                                    'referenced_field': field_info.get('referenced_field', ''),
                                    'field_position': field_info.get('position', 0),
                                }
                            )
                            imported_fields += 1

                except Exception as e:
                    errors.append({
                        'table': table_info['table_name'],
                        'error': str(e)
                    })
                    logger.error(f"Error importing table {table_info['table_name']}: {str(e)}")

            return {
                'status': 'success',
                'imported_tables': imported_tables,
                'imported_fields': imported_fields,
                'skipped_tables': len(tables) - imported_tables,
                'errors': errors
            }

        except Exception as e:
            logger.error(f"Error importing table definitions: {str(e)}")
            raise

    def _get_postgresql_tables(self, erp_source, module_filter, table_name_pattern):
        """PostgreSQL 테이블 목록 조회"""
        import psycopg2

        conn = psycopg2.connect(
            host=erp_source.host,
            port=erp_source.port or 5432,
            database=erp_source.database_name,
            user='postgres',
            password=''
        )
        cursor = conn.cursor()

        query = """
            SELECT table_name,
                   COALESCE(obj_description((table_schema||'.'||table_name)::regclass, 'pg_class'), '') as comment
            FROM information_schema.tables
            WHERE table_schema = %s AND table_name LIKE %s
            ORDER BY table_name
        """

        cursor.execute(query, [erp_source.schema_name or 'public', table_name_pattern])
        tables = []

        for row in cursor.fetchall():
            table_name, comment = row

            # 모듈 코드 추출 (테이블명 접두사 등)
            module_code = self._extract_module_code(table_name)

            if module_filter and module_code not in module_filter:
                continue

            tables.append({
                'table_name': table_name,
                'comment': comment,
                'module_code': module_code,
                'module_name': self._get_module_name(module_code)
            })

        cursor.close()
        conn.close()
        return tables

    def _get_table_fields(self, erp_source, table_def):
        """테이블 필드 정보 조회"""
        if erp_source.source_type == 'postgresql':
            return self._get_postgresql_fields(erp_source, table_def)
        elif erp_source.source_type == 'mssql':
            return self._get_mssql_fields(erp_source, table_def)
        elif erp_source.source_type == 'sqlite':
            return self._get_sqlite_fields(erp_source, table_def)
        return []

    def _get_postgresql_fields(self, erp_source, table_def):
        """PostgreSQL 필드 정보 조회"""
        import psycopg2

        conn = psycopg2.connect(
            host=erp_source.host,
            port=erp_source.port or 5432,
            database=erp_source.database_name,
            user='postgres',
            password=''
        )
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        query = """
            SELECT column_name, data_type, character_maximum_length,
                   is_nullable, column_default,
                   COALESCE(col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position), '') as comment,
                   ordinal_position
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
        """

        cursor.execute(query, [erp_source.schema_name or 'public', table_def.source_table_name])
        fields = []

        primary_keys = self._get_postgresql_primary_keys(erp_source, table_def)

        for row in cursor.fetchall():
            fields.append({
                'field_name': row['column_name'],
                'field_type': self._format_postgresql_type(row),
                'comment': row['comment'],
                'is_primary_key': row['column_name'] in primary_keys,
                'is_nullable': row['is_nullable'] == 'YES',
                'is_foreign_key': False,  # TODO: 외래키 조회
                'position': row['ordinal_position']
            })

        cursor.close()
        conn.close()
        return fields

    def _get_postgresql_primary_keys(self, erp_source, table_def):
        """PostgreSQL 기본키 조회"""
        import psycopg2

        conn = psycopg2.connect(
            host=erp_source.host,
            port=erp_source.port or 5432,
            database=erp_source.database_name,
            user='postgres',
            password=''
        )
        cursor = conn.cursor()

        query = """
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = %s::regclass AND i.indisprimary
        """

        cursor.execute(query, [f"{erp_source.schema_name or 'public'}.{table_def.source_table_name}"])
        primary_keys = [row[0] for row in cursor.fetchall()]

        cursor.close()
        conn.close()
        return primary_keys

    def _format_postgresql_type(self, row):
        """PostgreSQL 데이터 타입 포맷팅"""
        data_type = row['data_type']
        max_length = row['character_maximum_length']

        if max_length and data_type in ('character varying', 'varchar', 'char'):
            return f'varchar({max_length})'
        elif data_type == 'USER-DEFINED':
            return 'enum'
        return data_type

    def _extract_module_code(self, table_name):
        """테이블명에서 모듈 코드 추출"""
        # 예: SDY100_YH -> SALES, DMB110 -> PRODUCTION
        if table_name.startswith('SD') or table_name.startswith('SA'):
            return 'SALES'
        elif table_name.startswith('DM') or table_name.startswith('PP'):
            return 'PRODUCTION'
        elif table_name.startswith('QM') or table_name.startswith('Q'):
            return 'QUALITY'
        elif table_name.startswith('MM') or table_name.startswith('LC'):
            return 'PURCHASE'
        elif table_name.startswith('CA') or table_name.startswith('FI'):
            return 'FINANCIAL'
        return 'ETC'

    def _get_module_name(self, module_code):
        """모듈 코드로 모듈명 조회"""
        module_names = {
            'SALES': '영업',
            'PRODUCTION': '생산',
            'QUALITY': '품질',
            'PURCHASE': '구매',
            'FINANCIAL': '재무',
            'ETC': '기타'
        }
        return module_names.get(module_code, '기타')

    def import_field_definitions(self, table_definition) -> Dict[str, Any]:
        """
        필드 정의 가져오기

        Args:
            table_definition: ERPTableDefinition 모델 인스턴스

        Returns:
            가져오기 결과 딕셔너리
        """
        from erp_sync.models.erp_source import ERPFieldDefinition

        try:
            erp_source = table_definition.erp_source
            fields = self._get_table_fields(erp_source, table_definition)

            imported_fields = 0

            for field_info in fields:
                field, created = ERPFieldDefinition.objects.update_or_create(
                    table_definition=table_definition,
                    source_field_name=field_info['field_name'],
                    defaults={
                        'source_field_type': field_info['field_type'],
                        'source_field_comment': field_info.get('comment', ''),
                        'is_primary_key': field_info.get('is_primary_key', False),
                        'is_nullable': field_info.get('is_nullable', True),
                        'is_foreign_key': field_info.get('is_foreign_key', False),
                        'referenced_table': field_info.get('referenced_table', ''),
                        'referenced_field': field_info.get('referenced_field', ''),
                        'field_position': field_info.get('position', 0),
                    }
                )
                if created:
                    imported_fields += 1

            return {
                'status': 'success',
                'imported_fields': imported_fields,
                'total_fields': len(fields)
            }

        except Exception as e:
            logger.error(f"Error importing field definitions: {str(e)}")
            raise

    # MSSQL, SQLite 관련 메서드는 실제 구현 시 필요에 따라 추가
    def _get_mssql_tables(self, erp_source, module_filter, table_name_pattern):
        """MS SQL Server 테이블 목록 조회 (TODO: 구현 필요)"""
        return []

    def _get_sqlite_tables(self, erp_source, module_filter, table_name_pattern):
        """SQLite 테이블 목록 조회 (TODO: 구현 필요)"""
        return []

    def _get_mssql_fields(self, erp_source, table_def):
        """MS SQL Server 필드 정보 조회 (TODO: 구현 필요)"""
        return []

    def _get_sqlite_fields(self, erp_source, table_def):
        """SQLite 필드 정보 조회 (TODO: 구현 필요)"""
        return []
