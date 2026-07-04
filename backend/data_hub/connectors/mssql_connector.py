# -*- coding: utf-8 -*-
"""
MSSQL Connector - MS SQL Server 데이터 소스 커넥터
"""
from typing import Dict, Any, List, Optional
import logging

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False

from data_hub.connectors.base_connector import (
    BaseConnector, ConnectorError, ConnectorConnectionError, ConnectorQueryError
)

logger = logging.getLogger(__name__)


class MSSQLConnector(BaseConnector):
    """
    MS SQL Server 커넥터

    기존 ERP 연동을 위한 MSSQL 커넥터
    """

    def __init__(self, connection_params: Dict[str, Any]):
        """
        MSSQL 커넥터 초기화

        Args:
            connection_params: 연결 파라미터
                - host: 호스트 주소
                - port: 포트 (기본값: 1433)
                - user: 사용자
                - password: 비밀번호
                - database: 데이터베이스명
                - driver: ODBC 드라이버 (기본값: ODBC Driver 17 for SQL Server)
                - encrypt: 암호화 여부 (기본값: no)
                - trust_server_certificate: 서버 인증서 신뢰 여부 (기본값: yes)
                - connection_timeout: 연결 타임아웃 (기본값: 30)
        """
        if not PYODBC_AVAILABLE:
            raise ConnectorError("pyodbc is not installed. Install it with: pip install pyodbc")

        super().__init__(connection_params)

        # 기본값 설정
        self.host = connection_params.get('host', 'localhost')
        self.port = connection_params.get('port', 1433)
        self.user = connection_params.get('user', '')
        self.password = connection_params.get('password', '')
        self.database = connection_params.get('database', '')
        self.driver = connection_params.get('driver', 'ODBC Driver 17 for SQL Server')
        self.encrypt = connection_params.get('encrypt', 'no')
        self.trust_server_certificate = connection_params.get('trust_server_certificate', 'yes')
        self.connection_timeout = connection_params.get('connection_timeout', 30)

    def connect(self):
        """MSSQL에 연결"""
        try:
            # 연결 문자열 구성
            connection_string = (
                f"DRIVER={{{self.driver}}};"
                f"SERVER={self.host},{self.port};"
                f"DATABASE={self.database};"
                f"UID={self.user};"
                f"PWD={self.password};"
                f"Encrypt={self.encrypt};"
                f"TrustServerCertificate={self.trust_server_certificate};"
                f"Connection Timeout={self.connection_timeout};"
            )

            self._connection = pyodbc.connect(connection_string)
            logger.info(f"Connected to MSSQL: {self.host}:{self.port}/{self.database}")

            # 커서 설정
            self._connection.autocommit = False

        except pyodbc.Error as e:
            raise ConnectorConnectionError(f"MSSQL connection failed: {e}")

    def disconnect(self):
        """연결 해제"""
        if self._connection:
            try:
                self._connection.close()
                logger.info(f"Disconnected from MSSQL: {self.host}:{self.port}/{self.database}")
            except pyodbc.Error as e:
                logger.error(f"Error disconnecting from MSSQL: {e}")
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

                sql = f"SELECT {', '.join(columns) if columns != ['*'] else '*'} FROM {table}"

                if where:
                    sql += f" WHERE {where}"
                if order_by:
                    sql += f" ORDER BY {order_by}"
                if limit:
                    sql += f" OFFSET 0 ROWS FETCH NEXT {limit} ROWS ONLY"
            else:
                raise ConnectorQueryError("Either query or table must be provided")

            # 쿼리 실행
            logger.debug(f"Executing MSSQL query: {sql[:200]}...")
            cursor.execute(sql)

            # 결과 가져오기
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()

            # 딕셔너리로 변환
            result = []
            for row in rows:
                result.append(dict(zip(columns, row)))

            logger.info(f"Fetched {len(result)} records from MSSQL")
            return result

        except pyodbc.Error as e:
            raise ConnectorQueryError(f"MSSQL query failed: {e}")

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
                ORDER BY TABLE_NAME
            """
            cursor.execute(query)

            tables = [row[0] for row in cursor.fetchall()]
            logger.info(f"Found {len(tables)} tables in MSSQL")
            return tables

        except pyodbc.Error as e:
            raise ConnectorQueryError(f"Failed to get tables: {e}")

    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """
        테이블 스키마 가져오기

        Args:
            table_name: 테이블명

        Returns:
            Dict: 컬럼 정보
                {
                    'column_name': {
                        'type': 'data type',
                        'nullable': bool,
                        'max_length': int,
                        'default': any,
                    }
                }
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
                WHERE TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            """
            cursor.execute(query, table_name)

            schema = {}
            for row in cursor.fetchall():
                column_name = row[0]
                schema[column_name] = {
                    'type': row[1],
                    'nullable': row[2] == 'YES',
                    'max_length': row[3],
                    'default': row[4],
                }

            logger.info(f"Retrieved schema for table {table_name}")
            return schema

        except pyodbc.Error as e:
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

        except pyodbc.Error as e:
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
        total_affected = 0

        try:
            for params in params_list:
                cursor.execute(query, params)
                total_affected += cursor.rowcount

            self._connection.commit()

            logger.info(f"Executed batch query, affected {total_affected} rows")
            return total_affected

        except pyodbc.Error as e:
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
            logger.error(f"MSSQL connection test failed: {e}")
            return False
