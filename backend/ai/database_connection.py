# -*- coding: utf-8 -*-
"""
YH Database Direct Connection Service
실제 데이터베이스에 직접 연결하여 데이터를 조회하는 서비스
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# YH 데이터베이스 연결 정보
YH_DB_CONFIG = {
    'host': '133.186.214.219',
    'port': 27455,
    'database': 'YH',
    'user': 'yh',
    'password': 'db!@yh#$1!',
    'sslmode': 'require',
    'connect_timeout': 10
}


class YHDatabaseConnection:
    """YH 데이터베이스 연결 클래스"""

    def __init__(self):
        self.conn = None

    def connect(self):
        """데이터베이스 연결"""
        try:
            self.conn = psycopg2.connect(**YH_DB_CONFIG)
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            return False

    def disconnect(self):
        """연결 종료"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        쿼리 실행 및 결과 반환

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터

        Returns:
            조회 결과 (딕셔너리 리스트)
        """
        if not self.conn:
            if not self.connect():
                raise Exception("Database connection failed")

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                columns = [desc[0] for desc in cursor.description]
                results = cursor.fetchall()

                # RealDictRow를 일반 dict로 변환
                return [dict(row) for row in results]
        except Exception as e:
            raise Exception(f"Query execution error: {e}")

    def get_tables(self) -> List[Dict[str, Any]]:
        """모든 테이블 목록 조회"""
        query = """
            SELECT
                schemaname,
                tablename,
                tableowner
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """
        return self.execute_query(query)

    def get_table_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """
        테이블 컬럼 정보 조회

        Args:
            table_name: 테이블명

        Returns:
            컬럼 정보 리스트
        """
        query = """
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = %s
            ORDER BY ordinal_position;
        """
        return self.execute_query(query, (table_name,))

    def get_table_info(self) -> Dict[str, Any]:
        """
        전체 테이블 정보 조회 (컬럼 포함)

        Returns:
            {테이블명: {columns: [...], primary_keys: [...], comment: "..."}}
        """
        tables = self.get_tables()
        result = {}

        for table in tables:
            table_name = table['tablename']

            # 컬럼 정보
            columns = self.get_table_columns(table_name)

            # 기본 키 정보
            pk_query = """
                SELECT a.attname AS column_name
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid
                    AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass
                    AND i.indisprimary = true;
            """
            primary_keys = [row['column_name'] for row in self.execute_query(pk_query, (f"public.{table_name}",))]

            # 테이블 코멘트
            comment_query = """
                SELECT obj_description((table_name::regclass)::oid, 'pg_class') as table_comment
                FROM information_schema.tables
                WHERE table_schema = 'public'
                    AND table_name = %s;
            """
            comment_result = self.execute_query(comment_query, (table_name,))
            table_comment = comment_result[0]['table_comment'] if comment_result else None

            result[table_name] = {
                'table_name': table_name,
                'comment': table_comment,
                'columns': columns,
                'primary_keys': primary_keys
            }

        return result

    def get_recent_data(self, table_name: str, date_column: str, days: int = 90) -> List[Dict[str, Any]]:
        """
        최근 N일간의 데이터 조회

        Args:
            table_name: 테이블명
            date_column: 날짜 컬럼명
            days: 조회할 일수 (기본값: 90일)

        Returns:
            조회 결과
        """
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        query = f"""
            SELECT *
            FROM "{table_name}"
            WHERE "{date_column}" >= %s
            ORDER BY "{date_column}" DESC
            LIMIT 1000;
        """

        return self.execute_query(query, (cutoff_date,))

    def get_sample_data(self, table_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        테이블 샘플 데이터 조회

        Args:
            table_name: 테이블명
            limit: 조회할 행 수

        Returns:
            샘플 데이터
        """
        query = f"""
            SELECT *
            FROM "{table_name}"
            LIMIT %s;
        """

        return self.execute_query(query, (limit,))

    def test_connection(self) -> Dict[str, Any]:
        """
        데이터베이스 연결 테스트

        Returns:
            연결 상태 정보
        """
        result = {
            'success': False,
            'database': YH_DB_CONFIG['database'],
            'host': YH_DB_CONFIG['host'],
            'port': YH_DB_CONFIG['port'],
            'error': None,
            'table_count': 0,
            'tables': []
        }

        try:
            if not self.connect():
                result['error'] = 'Unable to connect to database server. Please check network connectivity and firewall settings.'
                return result

            # 테이블 목록 조회
            tables = self.get_tables()
            result['success'] = True
            result['table_count'] = len(tables)
            result['tables'] = [t['tablename'] for t in tables[:20]]  # 처음 20개만

            # 버전 정보 조회
            version_query = "SELECT version();"
            version_result = self.execute_query(version_query)
            result['database_version'] = version_result[0]['version'] if version_result else 'Unknown'

        except Exception as e:
            result['error'] = str(e)
        finally:
            self.disconnect()

        return result


# 싱글톤 인스턴스
_db_connection = None

def get_db_connection() -> YHDatabaseConnection:
    """데이터베이스 연결 인스턴스 반환"""
    global _db_connection
    if _db_connection is None:
        _db_connection = YHDatabaseConnection()
    return _db_connection


def get_yh_db_config() -> Dict[str, str]:
    """YH 데이터베이스 설정 반환 (프론트엔드용)"""
    return {
        'host': YH_DB_CONFIG['host'],
        'port': str(YH_DB_CONFIG['port']),
        'database': YH_DB_CONFIG['database'],
        'user': YH_DB_CONFIG['user']
    }


if __name__ == '__main__':
    """테스트 실행"""
    print("=" * 50)
    print("YH Database Connection Test")
    print("=" * 50)

    db = YHDatabaseConnection()
    result = db.test_connection()

    print(f"\nDatabase: {result['database']}")
    print(f"Host: {result['host']}:{result['port']}")
    print(f"Success: {result['success']}")

    if result['success']:
        print(f"Table Count: {result['table_count']}")
        print(f"\nTables (first 20):")
        for table in result['tables']:
            print(f"  - {table}")
        if 'database_version' in result:
            print(f"\nVersion: {result['database_version'][:50]}...")
    else:
        print(f"Error: {result['error']}")
