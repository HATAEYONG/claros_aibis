# -*- coding: utf-8 -*-
"""
PostgreSQL Connector - PostgreSQL 데이터 소스 커넥터
"""
from typing import Dict, Any, List, Optional
import logging

try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

from data_hub.connectors.base_connector import (
    BaseConnector, ConnectorError, ConnectorConnectionError, ConnectorQueryError
)

logger = logging.getLogger(__name__)


class PostgreSQLConnector(BaseConnector):
    """
    PostgreSQL 커넥터
    """

    def __init__(self, connection_params: Dict[str, Any]):
        """
        PostgreSQL 커넥터 초기화

        Args:
            connection_params: 연결 파라미터
                - host: 호스트 주소 (기본값: localhost)
                - port: 포트 (기본값: 5432)
                - user: 사용자 (기본값: postgres)
                - password: 비밀번호
                - database: 데이터베이스명
                - sslmode: SSL 모드 (기본값: prefer)
                - connect_timeout: 연결 타임아웃 (기본값: 10)
        """
        if not PSYCOPG2_AVAILABLE:
            raise ConnectorError("psycopg2 is not installed. Install it with: pip install psycopg2-binary")

        super().__init__(connection_params)

        # 기본값 설정
        self.host = connection_params.get('host', 'localhost')
        self.port = connection_params.get('port', 5432)
        self.user = connection_params.get('user', 'postgres')
        self.password = connection_params.get('password', '')
        self.database = connection_params.get('database', 'postgres')
        self.sslmode = connection_params.get('sslmode', 'prefer')
        self.connect_timeout = connection_params.get('connect_timeout', 10)

    def connect(self):
        """PostgreSQL에 연결"""
        try:
            self._connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                sslmode=self.sslmode,
                connect_timeout=self.connect_timeout
            )

            # RealDictCursor를 사용하여 딕셔너리 형태로 결과 반환
            self._connection.cursor_factory = psycopg2.extras.RealDictCursor

            logger.info(f"Connected to PostgreSQL: {self.host}:{self.port}/{self.database}")

        except psycopg2.Error as e:
            raise ConnectorConnectionError(f"PostgreSQL connection failed: {e}")

    def disconnect(self):
        """연결 해제"""
        if self._connection:
            try:
                self._connection.close()
                logger.info(f"Disconnected from PostgreSQL: {self.host}:{self.port}/{self.database}")
            except psycopg2.Error as e:
                logger.error(f"Error disconnecting from PostgreSQL: {e}")
            finally:
                self._connection = None

    def fetch_data(
        self,
        query: str = None,
        table: str = None,
        limit: int = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        데이터 가져오기

        Args:
            query: SQL 쿼리 (선택)
            table: 테이블명 (선택)
            limit: 가져올 레코드 수 제한
            **kwargs: 추가 파라미터
                - where: WHERE 조건
                - order_by: 정렬 기준
                - columns: 가져올 컬럼 목록

        Returns:
            List[Dict]: 데이터 레코드 목록
        """
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()

        try:
            # 쿼리 구성
            if query:
                sql = query
            elif table:
                columns = kwargs.get('columns', ['*'])
                where = kwargs.get('where', '')
                order_by = kwargs.get('order_by', '')

                # 컬럼명 escaping 처리
                if columns != ['*']:
                    escaped_columns = [f'"{col}"' for col in columns]
                    columns_str = ', '.join(escaped_columns)
                else:
                    columns_str = '*'

                sql = f'SELECT {columns_str} FROM "{table}"'

                if where:
                    sql += f" WHERE {where}"
                if order_by:
                    sql += f" ORDER BY {order_by}"
                if limit:
                    sql += f" LIMIT {limit}"
            else:
                raise ConnectorQueryError("Either query or table must be provided")

            # 쿼리 실행
            logger.debug(f"Executing PostgreSQL query: {sql[:200]}...")
            cursor.execute(sql)

            # 결과 가져오기 (RealDictCursor 사용)
            result = [dict(row) for row in cursor.fetchall()]

            logger.info(f"Fetched {len(result)} records from PostgreSQL")
            return result

        except psycopg2.Error as e:
            raise ConnectorQueryError(f"PostgreSQL query failed: {e}")

    def get_tables(self) -> List[str]:
        """
        테이블 목록 가져오기

        Returns:
            List[str]: 테이블명 목록
        """
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()

        try:
            # 사용자 테이블 목록 조회
            query = """
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND TABLE_SCHEMA NOT IN ('pg_catalog', 'information_schema')
                ORDER BY TABLE_NAME
            """
            cursor.execute(query)

            tables = [row['table_name'] for row in cursor.fetchall()]
            logger.info(f"Found {len(tables)} tables in PostgreSQL")
            return tables

        except psycopg2.Error as e:
            raise ConnectorQueryError(f"Failed to get tables: {e}")

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """
        테이블 스키마 가져오기

        Args:
            table_name: 테이블명

        Returns:
            Dict: 컬럼 정보
        """
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()

        try:
            # 컬럼 정보 조회
            query = """
                SELECT
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    CHARACTER_MAXIMUM_LENGTH,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
            """
            cursor.execute(query, (table_name,))

            schema = {}
            for row in cursor.fetchall():
                column_name = row['column_name']
                schema[column_name] = {
                    'type': row['data_type'],
                    'nullable': row['is_nullable'] == 'YES',
                    'max_length': row['character_maximum_length'],
                    'default': row['column_default'],
                }

            logger.info(f"Retrieved schema for table {table_name}")
            return schema

        except psycopg2.Error as e:
            raise ConnectorQueryError(f"Failed to get table schema: {e}")

    def execute_query(self, query: str, params: tuple = None) -> int:
        """
        쿼리 실행 (INSERT, UPDATE, DELETE 등)

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터

        Returns:
            int: 영향받은 행 수
        """
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()

        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            affected_rows = cursor.rowcount
            self._connection.commit()

            logger.info(f"Executed query, affected {affected_rows} rows")
            return affected_rows

        except psycopg2.Error as e:
            self._connection.rollback()
            raise ConnectorQueryError(f"Query execution failed: {e}")

    def execute_batch(self, query: str, params_list: List[tuple]) -> int:
        """
        배치 쿼리 실행

        Args:
            query: SQL 쿼리
            params_list: 파라미터 목록

        Returns:
            int: 영향받은 전체 행 수
        """
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()

        try:
            cursor.executemany(query, params_list)
            total_affected = cursor.rowcount
            self._connection.commit()

            logger.info(f"Executed batch query, affected {total_affected} rows")
            return total_affected

        except psycopg2.Error as e:
            self._connection.rollback()
            raise ConnectorQueryError(f"Batch query execution failed: {e}")

    def test_connection(self) -> bool:
        """
        연결 테스트

        Returns:
            bool: 연결 성공 여부
        """
        try:
            self.connect()

            # 간단한 쿼리로 연결 테스트
            cursor = self._connection.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()

            self.disconnect()

            return result is not None and result[0] == 1

        except Exception as e:
            logger.error(f"PostgreSQL connection test failed: {e}")
            return False
