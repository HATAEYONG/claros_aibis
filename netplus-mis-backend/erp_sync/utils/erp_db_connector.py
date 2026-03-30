# -*- coding: utf-8 -*-
"""
ERP 데이터베이스 연결 유틸리티

다양한 ERP 소스(PostgreSQL, SQL Server, MySQL, Oracle)에 대한
동적 데이터베이스 연결 및 쿼리 실행 기능 제공
"""

import logging
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class ERPDatabaseConnector:
    """ERP 데이터베이스 연결 관리자"""

    # 연결 풀 관리
    _connections = {}

    @staticmethod
    def get_connection_class(source_type):
        """
        소스 타입에 따른 DB 연결 클래스 반환

        Args:
            source_type: 데이터베이스 타입 (postgresql, mssql, mysql, oracle)

        Returns:
            연결 클래스
        """
        if source_type == 'postgresql':
            return PostgreSQLConnector
        elif source_type == 'mssql':
            return SQLServerConnector
        elif source_type == 'mysql':
            return MySQLConnector
        elif source_type == 'oracle':
            return OracleConnector
        elif source_type == 'sqlite':
            return SQLiteConnector
        else:
            raise ValueError(f"Unsupported source type: {source_type}")

    @classmethod
    def get_connection(cls, erp_source):
        """
        ERP 소스에 대한 데이터베이스 연결获取

        Args:
            erp_source: ERPSource 모델 인스턴스

        Returns:
            데이터베이스 연결 객체
        """
        cache_key = f"{erp_source.source_code}"

        # 연결 풀 확인
        if cache_key in cls._connections:
            return cls._connections[cache_key]

        # 새 연결 생성
        connector_class = cls.get_connection_class(erp_source.source_type)
        connector = connector_class(erp_source)
        cls._connections[cache_key] = connector

        return connector

    @classmethod
    def close_connection(cls, source_code):
        """연결 종료"""
        if source_code in cls._connections:
            del cls._connections[source_code]

    @classmethod
    def close_all_connections(cls):
        """모든 연결 종료"""
        cls._connections.clear()


class BaseDatabaseConnector:
    """데이터베이스 연결 기본 클래스"""

    def __init__(self, erp_source):
        """
        연결 초기화

        Args:
            erp_source: ERPSource 모델 인스턴스
        """
        self.erp_source = erp_source
        self._connection = None

    @property
    def connection_params(self) -> Dict[str, Any]:
        """연결 파라미터 반환"""
        return {
            'host': self.erp_source.host,
            'port': self.erp_source.port,
            'database': self.erp_source.database_name,
            'user': self.erp_source.username,
            'password': self.erp_source.password,
        }

    def connect(self):
        """데이터베이스 연결"""
        raise NotImplementedError("Subclasses must implement connect()")

    def disconnect(self):
        """연결 종료"""
        if self._connection:
            self._connection.close()
            self._connection = None

    @contextmanager
    def get_cursor(self):
        """커서 컨텍스트 관리자"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            yield cursor
        finally:
            cursor.close()

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        쿼리 실행

        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터

        Returns:
            조회 결과 (딕셔너리 리스트)
        """
        raise NotImplementedError("Subclasses must implement execute_query()")

    def test_connection(self) -> Dict[str, Any]:
        """
        연결 테스트

        Returns:
            테스트 결과 딕셔너리
        """
        try:
            conn = self.connect()
            self.disconnect()
            return {
                'success': True,
                'message': '연결 성공',
                'source_code': self.erp_source.source_code
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'연결 실패: {str(e)}',
                'source_code': self.erp_source.source_code
            }


class PostgreSQLConnector(BaseDatabaseConnector):
    """PostgreSQL 데이터베이스 연결"""

    def connect(self):
        """PostgreSQL 연결"""
        try:
            import psycopg2
            import psycopg2.extras

            if self._connection is None or self._connection.closed:
                self._connection = psycopg2.connect(
                    host=self.connection_params['host'],
                    port=self.connection_params['port'] or 5432,
                    database=self.connection_params['database'],
                    user=self.connection_params['user'],
                    password=self.connection_params['password'],
                    connect_timeout=10,
                    options='-c statement_timeout=30000'  # 30秒超时
                )
            return self._connection

        except ImportError:
            raise ImportError("psycopg2-binary 패키지가 필요합니다. pip install psycopg2-binary")
        except Exception as e:
            logger.error(f"PostgreSQL 연결 오류 ({self.erp_source.source_code}): {str(e)}")
            raise

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """쿼리 실행"""
        try:
            import psycopg2.extras

            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())

                # 딕셔너리 형태로 결과 변환
                columns = [desc[0] for desc in cursor.description]
                results = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]

                logger.info(f"PostgreSQL 쿼리 실행 성공: {len(results)} 행 반환 ({self.erp_source.source_code})")
                return results

        except Exception as e:
            logger.error(f"PostgreSQL 쿼리 실행 오류 ({self.erp_source.source_code}): {str(e)}")
            raise


class SQLServerConnector(BaseDatabaseConnector):
    """SQL Server 데이터베이스 연결"""

    def connect(self):
        """SQL Server 연결"""
        try:
            import pyodbc

            if self._connection is None:
                # 연결 문자열 구성
                conn_str = (
                    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                    f"SERVER={self.connection_params['host']};"
                    f"PORT={self.connection_params['port'] or 1433};"
                    f"DATABASE={self.connection_params['database']};"
                    f"UID={self.connection_params['user']};"
                    f"PWD={self.connection_params['password']};"
                    f"TrustConnection=no;"
                )
                self._connection = pyodbc.connect(conn_str, timeout=10)
            return self._connection

        except ImportError:
            raise ImportError("pyodbc 패키지가 필요합니다. pip install pyodbc")
        except Exception as e:
            logger.error(f"SQL Server 연결 오류 ({self.erp_source.source_code}): {str(e)}")
            raise

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """쿼리 실행"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())

                # 딕셔너리 형태로 결과 변환
                columns = [column[0] for column in cursor.description]
                results = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]

                logger.info(f"SQL Server 쿼리 실행 성공: {len(results)} 행 반환 ({self.erp_source.source_code})")
                return results

        except Exception as e:
            logger.error(f"SQL Server 쿼리 실행 오류 ({self.erp_source.source_code}): {str(e)}")
            raise


class MySQLConnector(BaseDatabaseConnector):
    """MySQL 데이터베이스 연결"""

    def connect(self):
        """MySQL 연결"""
        try:
            import pymysql

            if self._connection is None or not self._connection.open:
                self._connection = pymysql.connect(
                    host=self.connection_params['host'],
                    port=self.connection_params['port'] or 3306,
                    database=self.connection_params['database'],
                    user=self.connection_params['user'],
                    password=self.connection_params['password'],
                    connect_timeout=10,
                    charset='utf8mb4'
                )
            return self._connection

        except ImportError:
            raise ImportError("pymysql 패키지가 필요합니다. pip install pymysql")
        except Exception as e:
            logger.error(f"MySQL 연결 오류 ({self.erp_source.source_code}): {str(e)}")
            raise

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """쿼리 실행"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())

                # 딕셔너리 형태로 결과 변환
                results = cursor.fetchall()

                logger.info(f"MySQL 쿼리 실행 성공: {len(results)} 행 반환 ({self.erp_source.source_code})")
                return results

        except Exception as e:
            logger.error(f"MySQL 쿼리 실행 오류 ({self.erp_source.source_code}): {str(e)}")
            raise


class OracleConnector(BaseDatabaseConnector):
    """Oracle 데이터베이스 연결"""

    def connect(self):
        """Oracle 연결"""
        try:
            import oracledb

            if self._connection is None:
                # thick 모드 사용 (클라이언트 라이브러리 필요)
                oracledb.init_oracle_client()

                dsn = f"{self.connection_params['host']}:{self.connection_params['port'] or 1521}/{self.connection_params['database']}"
                self._connection = oracledb.connect(
                    user=self.connection_params['user'],
                    password=self.connection_params['password'],
                    dsn=dsn
                )
            return self._connection

        except ImportError:
            raise ImportError("oracledb 패키지가 필요합니다. pip install oracledb")
        except Exception as e:
            logger.error(f"Oracle 연결 오류 ({self.erp_source.source_code}): {str(e)}")
            raise

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """쿼리 실행"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())

                # 딕셔너리 형태로 결과 변환
                columns = [desc[0] for desc in cursor.description]
                results = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]

                logger.info(f"Oracle 쿼리 실행 성공: {len(results)} 행 반환 ({self.erp_source.source_code})")
                return results

        except Exception as e:
            logger.error(f"Oracle 쿼리 실행 오류 ({self.erp_source.source_code}): {str(e)}")
            raise


class SQLiteConnector(BaseDatabaseConnector):
    """SQLite 데이터베이스 연결"""

    def connect(self):
        """SQLite 연결"""
        try:
            import sqlite3

            if self._connection is None:
                self._connection = sqlite3.connect(
                    self.connection_params['database'],
                    timeout=10
                )
                # 딕셔너리 형태로 반환 설정
                self._connection.row_factory = sqlite3.Row
            return self._connection

        except Exception as e:
            logger.error(f"SQLite 연결 오류 ({self.erp_source.source_code}): {str(e)}")
            raise

    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """쿼리 실행"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())

                # Row 객체를 딕셔너리로 변환
                results = [dict(row) for row in cursor.fetchall()]

                logger.info(f"SQLite 쿼리 실행 성공: {len(results)} 행 반환 ({self.erp_source.source_code})")
                return results

        except Exception as e:
            logger.error(f"SQLite 쿼리 실행 오류 ({self.erp_source.source_code}): {str(e)}")
            raise


# 유틸리티 함수
def execute_erp_query(erp_source, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
    """
    ERP 소스에서 쿼리 실행 (유틸리티 함수)

    Args:
        erp_source: ERPSource 모델 인스턴스
        query: SQL 쿼리
        params: 쿼리 파라미터

    Returns:
        조회 결과 (딕셔너리 리스트)
    """
    connector = ERPDatabaseConnector.get_connection(erp_source)
    return connector.execute_query(query, params)


def test_erp_connection(erp_source) -> Dict[str, Any]:
    """
    ERP 소스 연결 테스트 (유틸리티 함수)

    Args:
        erp_source: ERPSource 모델 인스턴스

    Returns:
        테스트 결과 딕셔너리
    """
    connector = ERPDatabaseConnector.get_connection(erp_source)
    return connector.test_connection()
