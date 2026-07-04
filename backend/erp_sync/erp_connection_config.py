# -*- coding: utf-8 -*-
"""
ERP 연결 관리 설정

ERP 데이터베이스 연결을 위한 설정 및 연결 관리 기능
"""
import logging
from django.conf import settings
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ERPConnectionConfig:
    """ERP 연결 설정 관리"""

    # 연결 상태 추적
    _connection_status: Dict[str, Dict[str, Any]] = {}

    # 연결 실패시 재시각하지 않을 시간 (초)
    CONNECTION_COOLDOWN = 300  # 5분

    # 최대 연결 재시도 횟수
    MAX_RETRY_ATTEMPTS = 3

    # 연결 타임아웃 (초)
    CONNECTION_TIMEOUT = 10

    # 쿼리 타임아웃 (초)
    QUERY_TIMEOUT = 30

    @classmethod
    def get_source_config(cls, source_code: str) -> Dict[str, Any]:
        """
        ERP 소스별 설정 반환

        Args:
            source_code: ERP 소스 코드

        Returns:
            설정 딕셔너리
        """
        configs = {
            'YH': {
                'host': getattr(settings, 'YH_DB_HOST', '133.186.214.219'),
                'port': getattr(settings, 'YH_DB_PORT', 27455),
                'database': 'YH',
                'user': 'yh',
                'connection_timeout': cls.CONNECTION_TIMEOUT,
                'query_timeout': cls.QUERY_TIMEOUT,
                'enabled': True,  # 활성화 여부
                'fallback_to_mock': True,  # 연결 실패시 모의 데이터 사용
                'suppress_errors': True,  # 에러 로그 억제
            },
            'FOM': {
                'host': getattr(settings, 'MSSQL_HOST', '133.186.214.219'),
                'port': getattr(settings, 'MSSQL_PORT', 27455),
                'database': 'YH',
                'driver': 'ODBC Driver 17 for SQL Server',
                'enabled': True,
                'fallback_to_mock': True,
                'suppress_errors': True,
            },
            'AXOS': {
                'host': getattr(settings, 'AXOS_DB_HOST', 'localhost'),
                'port': getattr(settings, 'AXOS_DB_PORT', 1521),
                'database': 'AXOS',
                'enabled': False,  # 기본 비활성화
                'fallback_to_mock': True,
                'suppress_errors': True,
            },
        }

        return configs.get(source_code, {
            'enabled': False,
            'fallback_to_mock': True,
            'suppress_errors': True,
        })

    @classmethod
    def can_attempt_connection(cls, source_code: str) -> bool:
        """
        연결 시도 가능 여부 확인 (쿨다운 기간)

        Args:
            source_code: ERP 소스 코드

        Returns:
            연결 시도 가능 여부
        """
        if source_code not in cls._connection_status:
            return True

        status = cls._connection_status[source_code]

        # 연결이 활성화되지 않은 경우
        if not status.get('enabled', True):
            return False

        # 마지막 실패 후 쿨다운 기간이 지나지 않은 경우
        if 'last_failure' in status:
            last_failure = status['last_failure']
            cooldown_until = last_failure + timedelta(seconds=cls.CONNECTION_COOLDOWN)

            if datetime.now() < cooldown_until:
                return False

        return True

    @classmethod
    def record_connection_success(cls, source_code: str):
        """연결 성공 기록"""
        cls._connection_status[source_code] = {
            'enabled': True,
            'status': 'connected',
            'last_success': datetime.now(),
            'failure_count': 0,
        }

    @classmethod
    def record_connection_failure(cls, source_code: str, error: Exception):
        """연결 실패 기록"""
        if source_code not in cls._connection_status:
            cls._connection_status[source_code] = {
                'enabled': True,
                'failure_count': 0,
            }

        status = cls._connection_status[source_code]
        status['failure_count'] = status.get('failure_count', 0) + 1
        status['last_failure'] = datetime.now()
        status['last_error'] = str(error)

        # 너무 많은 실패시 일시적으로 비활성화
        if status['failure_count'] >= cls.MAX_RETRY_ATTEMPTS:
            status['enabled'] = False
            logger.warning(f"[ERPConfig] {source_code} 연결이 {cls.MAX_RETRY_ATTEMPTS}회 실패하여 일시적으로 비활성화되었습니다.")

    @classmethod
    def get_connection_status(cls, source_code: str) -> Dict[str, Any]:
        """연결 상태 반환"""
        config = cls.get_source_config(source_code)
        status = cls._connection_status.get(source_code, {})

        return {
            'source_code': source_code,
            'enabled': config.get('enabled', False) and status.get('enabled', True),
            'status': status.get('status', 'unknown'),
            'last_success': status.get('last_success'),
            'last_failure': status.get('last_failure'),
            'failure_count': status.get('failure_count', 0),
            'fallback_enabled': config.get('fallback_to_mock', True),
        }

    @classmethod
    def should_use_fallback(cls, source_code: str) -> bool:
        """
        폴백 데이터 사용 여부 확인

        Args:
            source_code: ERP 소스 코드

        Returns:
            폴백 데이터 사용 여부
        """
        config = cls.get_source_config(source_code)

        # 연결 비활성화되거나 폴백 활성화된 경우
        if not config.get('enabled', True):
            return True

        # 쿨다운 기간 중인 경우
        if not cls.can_attempt_connection(source_code):
            return True

        return False

    @classmethod
    def log_connection_error(cls, source_code: str, error: Exception, suppress: bool = None):
        """
        연결 에러 로그 출력 (설정에 따라 억제 가능)

        Args:
            source_code: ERP 소스 코드
            error: 에러 객체
            suppress: 에러 로그 억제 여부 (None인 경우 설정 사용)
        """
        config = cls.get_source_config(source_code)

        # 에러 억제 설정 확인
        should_suppress = suppress if suppress is not None else config.get('suppress_errors', True)

        if should_suppress:
            # 에러 억제: DEBUG 레벨로만 기록
            logger.debug(f"[ERP] {source_code} 연결 에러 (억제됨): {str(error)}")
        else:
            # 에러 출력
            logger.warning(f"[ERP] {source_code} 연결 실패: {str(error)}")

    @classmethod
    def reset_connection_status(cls, source_code: Optional[str] = None):
        """
        연결 상태 초기화

        Args:
            source_code: 초기화할 소스 코드 (None인 경우 전체 초기화)
        """
        if source_code:
            if source_code in cls._connection_status:
                del cls._connection_status[source_code]
                logger.info(f"[ERPConfig] {source_code} 연결 상태가 초기화되었습니다.")
        else:
            cls._connection_status.clear()
            logger.info("[ERPConfig] 모든 ERP 연결 상태가 초기화되었습니다.")


def get_erp_connection_config():
    """
    ERP 연결 설정 싱글톤 인스턴스 반환

    Returns:
        ERPConnectionConfig 인스턴스
    """
    return ERPConnectionConfig
