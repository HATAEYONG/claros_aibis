# -*- coding: utf-8 -*-
"""
SQL Guard — AI가 생성한 SQL을 실행하기 전 안전성을 강제한다.

SAP PRD의 Safety Agent 개념을 반영: SELECT(및 WITH ... SELECT) 단일 문만 허용하고,
DDL/DML/시스템 프로시저/다중 statement/주석 삽입 등 위험 패턴을 전부 차단한다.
소스 DB 종류(SQLite/PostgreSQL/MSSQL 등)에 관계없이 동일하게 적용되는 공통 레이어다.
"""
import re

import sqlparse

# 위치에 관계없이 SQL 전체에서 발견되면 즉시 차단하는 키워드
_FORBIDDEN_KEYWORDS = (
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
    "GRANT", "REVOKE", "MERGE", "REPLACE", "EXEC", "EXECUTE", "CALL",
    "ATTACH", "DETACH", "VACUUM", "REINDEX", "PRAGMA", "BACKUP", "RESTORE",
)

# 문자열이 아니라 구조적으로 위험한 패턴 (MSSQL SELECT INTO, 시스템 프로시저, 주석)
_FORBIDDEN_PATTERNS = (
    (re.compile(r"\bSELECT\b.*\bINTO\b", re.IGNORECASE | re.DOTALL), "SELECT_INTO"),
    (re.compile(r"\bxp_\w+", re.IGNORECASE), "SYSTEM_PROC_XP"),
    (re.compile(r"\bsp_\w+", re.IGNORECASE), "SYSTEM_PROC_SP"),
    (re.compile(r"--"), "INLINE_COMMENT"),
    (re.compile(r"/\*"), "BLOCK_COMMENT"),
)

_ALLOWED_FIRST_KEYWORDS = ("SELECT", "WITH")


class SQLGuardViolation(Exception):
    """SQL이 안전성 검증을 통과하지 못했을 때 발생."""

    def __init__(self, message: str, reason_code: str):
        self.reason_code = reason_code
        super().__init__(message)


def validate_select_only(sql: str) -> str:
    """
    `sql`이 단일 read-only SELECT/WITH 문인지 검증한다.

    통과 시 앞뒤 공백과 trailing semicolon을 제거한 SQL 문자열을 반환한다.
    실패 시 SQLGuardViolation을 발생시킨다 (reason_code로 사유 구분 가능).
    """
    if not sql or not sql.strip():
        raise SQLGuardViolation("빈 SQL은 허용되지 않습니다.", "EMPTY_SQL")

    stripped = sql.strip().rstrip(";").strip()

    statements = sqlparse.parse(sql)
    non_empty = [s for s in statements if s.token_first(skip_cm=True) is not None]
    if len(non_empty) != 1:
        raise SQLGuardViolation(
            f"단일 SELECT 문만 허용됩니다 (감지된 statement 수: {len(non_empty)}).",
            "MULTI_STATEMENT",
        )

    statement = non_empty[0]
    first_token = statement.token_first(skip_cm=True)
    first_keyword = (first_token.value or "").strip().upper()

    if first_keyword not in _ALLOWED_FIRST_KEYWORDS:
        raise SQLGuardViolation(
            f"SELECT/WITH으로 시작하는 조회 쿼리만 허용됩니다 (감지: {first_keyword or '(empty)'}).",
            "NOT_SELECT",
        )

    upper_sql = stripped.upper()
    for keyword in _FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{keyword}\b", upper_sql):
            raise SQLGuardViolation(
                f"금지된 키워드가 포함되어 있습니다: {keyword}", "FORBIDDEN_KEYWORD"
            )

    for pattern, reason_code in _FORBIDDEN_PATTERNS:
        if pattern.search(stripped):
            raise SQLGuardViolation(
                f"허용되지 않는 SQL 패턴이 감지되었습니다 ({reason_code}).", reason_code
            )

    return stripped


def is_safe(sql: str) -> bool:
    """검증 결과를 bool로만 알고 싶을 때 쓰는 헬퍼."""
    try:
        validate_select_only(sql)
        return True
    except SQLGuardViolation:
        return False
