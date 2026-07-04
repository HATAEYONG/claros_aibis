# -*- coding: utf-8 -*-
"""
AI-SQL 실행 감사로그 연동

기존 security.AuditLog 모델은 존재했지만 AI/Text-to-SQL 실행 경로와
연결되어 있지 않았다 (0% 연동). 이 모듈이 그 연결점이다.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def log_ai_sql_execution(
    request,
    question: str,
    sql: str,
    guard_violation: Optional[str] = None,
    result_count: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    """
    AI가 생성/실행 시도한 SQL을 security.AuditLog에 기록한다.

    감사로그 기록 자체가 실패하더라도 사용자 응답 흐름을 막아서는 안 되므로
    예외를 삼키고 경고만 남긴다.
    """
    try:
        from security.models import AuditLog

        if guard_violation or error:
            audit_status = "failed"
        else:
            audit_status = "success"

        actor = getattr(request, "user", None) if request is not None else None
        if actor is not None and not getattr(actor, "is_authenticated", False):
            actor = None

        error_message = ""
        if guard_violation:
            error_message = f"SQL Guard 차단: {guard_violation}"
        elif error:
            error_message = error

        AuditLog.objects.create(
            action="ai_text_to_sql_execute",
            actor=actor,
            actor_type="user" if actor is not None else "api",
            target_type="sql_query",
            ip_address=_get_client_ip(request),
            status=audit_status,
            error_message=error_message,
            metadata={
                "question": question,
                "sql": sql,
                "guard_violation": guard_violation,
                "result_count": result_count,
            },
        )
    except Exception as e:
        logger.warning(f"AuditLog 기록 실패 (AI 응답에는 영향 없음): {e}")


def _get_client_ip(request) -> Optional[str]:
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
