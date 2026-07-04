# -*- coding: utf-8 -*-
"""
멀티 소스 쿼리 실행 — AI 파이프라인이 Django 기본 DB뿐 아니라
erp_sync.ERPSource로 등록된 임의의 소스(PostgreSQL/MSSQL/MySQL/Oracle/SQLite)에
대해서도 동일한 SQL Guard를 거쳐 조회할 수 있도록 하는 얇은 연결 계층.

SAP PRD의 "멀티 RDB 확장" 요구사항에 대응한다. MSSQL 실접속은 이번 단계에서
검증되지 않았다 (자격증명 없음) — SQLite/PostgreSQL 소스로 대체 검증한다.
"""
from typing import Any, Dict, List

from erp_sync.utils.erp_db_connector import execute_erp_query


class ERPSourceNotFound(Exception):
    pass


def run_query_for_source(source_code: str, sql: str) -> List[Dict[str, Any]]:
    """
    source_code로 등록된 ERPSource를 찾아 SQL Guard를 거쳐 쿼리를 실행한다.

    Args:
        source_code: erp_sync.models.ERPSource.source_code
        sql: 실행할 SQL (단일 SELECT/WITH만 허용 — execute_erp_query가 강제)

    Raises:
        ERPSourceNotFound: 해당 source_code의 ERPSource가 없는 경우
        SQLGuardViolation: sql이 SELECT 전용이 아닌 경우
    """
    from erp_sync.models import ERPSource

    try:
        erp_source = ERPSource.objects.get(source_code=source_code, is_active=True)
    except ERPSource.DoesNotExist:
        raise ERPSourceNotFound(f"활성화된 ERPSource를 찾을 수 없습니다: {source_code}")

    return execute_erp_query(erp_source, sql)
