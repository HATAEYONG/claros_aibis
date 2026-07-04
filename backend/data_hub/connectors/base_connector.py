# -*- coding: utf-8 -*-
"""
Base Connector - 데이터 소스 커넥터 기반 클래스
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """
    데이터 소스 커넥터 기반 클래스

    모든 커넥터는 이 클래스를 상속받아야 합니다.
    """

    def __init__(self, connection_params: Dict[str, Any]):
        """
        커넥터 초기화

        Args:
            connection_params: 연결 파라미터
                - host: 호스트 주소
                - port: 포트
                - user: 사용자
                - password: 비밀번호
                - database: 데이터베이스명
                - 추가 옵션들...
        """
        self.connection_params = connection_params
        self._connection = None

    @abstractmethod
    def connect(self):
        """데이터 소스에 연결"""
        pass

    @abstractmethod
    def disconnect(self):
        """연결 해제"""
        pass

    @abstractmethod
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

        Returns:
            List[Dict]: 데이터 레코드 목록
        """
        pass

    @abstractmethod
    def get_tables(self) -> List[str]:
        """
        테이블 목록 가져오기

        Returns:
            List[str]: 테이블명 목록
        """
        pass

    @abstractmethod
    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """
        테이블 스키마 가져오기

        Args:
            table_name: 테이블명

        Returns:
            Dict: 컬럼 정보
        """
        pass

    def test_connection(self) -> bool:
        """
        연결 테스트

        Returns:
            bool: 연결 성공 여부
        """
        try:
            self.connect()
            self.disconnect()
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False

    def __enter__(self):
        """컨텍스트 매니저 진입"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """컨텍스트 매니저 종료"""
        self.disconnect()


class ConnectorError(Exception):
    """커넥터 에러"""
    pass


class ConnectorConfigError(ConnectorError):
    """커넥터 설정 에러"""
    pass


class ConnectorConnectionError(ConnectorError):
    """커넥터 연결 에러"""
    pass


class ConnectorQueryError(ConnectorError):
    """커넥터 쿼리 에러"""
    pass
