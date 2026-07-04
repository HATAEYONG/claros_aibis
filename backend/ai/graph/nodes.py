# -*- coding: utf-8 -*-
"""SQL 파이프라인 그래프의 노드 구현 (Intent/Schema/SQL/Safety/Interpreter)."""
from django.db import connection

from ai.sql_guard import SQLGuardViolation, validate_select_only
from ai.text_to_sql_service import (
    SYSTEM_PROMPT,
    _default_llm_call,
    _extract_explanation,
    _extract_sql,
    _extract_tables,
    get_schema_summary,
)

from .state import SQLPipelineState

# SQL 질의로 라우팅할지 판단하는 데 쓰는 키워드
# (현재는 이 그래프 자체가 SQL 전용 파이프라인이라 항상 'sql_query'로 귀결되지만,
#  향후 Supervisor가 여러 파이프라인 중 이 그래프로 보낼지 판단하는 근거로 재사용 가능)
_SQL_INTENT_KEYWORDS = (
    "매출", "revenue", "생산", "production", "품질", "quality",
    "sql", "쿼리", "query", "목록", "리스트", "조회", "재고", "inventory",
)


def _trace(state: SQLPipelineState, node_name: str) -> None:
    state.setdefault("trace", [])
    state["trace"].append(node_name)


def intent_node(state: SQLPipelineState) -> SQLPipelineState:
    _trace(state, "intent")
    question_lower = state.get("question", "").lower()
    state["intent"] = (
        "sql_query" if any(k in question_lower for k in _SQL_INTENT_KEYWORDS) else "sql_query_fallback"
    )
    return state


def schema_node(state: SQLPipelineState) -> SQLPipelineState:
    _trace(state, "schema")
    state["schema"] = get_schema_summary()
    return state


def sql_node(state: SQLPipelineState) -> SQLPipelineState:
    _trace(state, "sql")
    llm_call = state.get("llm_call") or _default_llm_call
    user_prompt = (
        f"데이터베이스 스키마:\n{state.get('schema', '')}\n\n"
        f"질문: {state['question']}\n\nSQL:"
    )
    response_text = llm_call(SYSTEM_PROMPT, user_prompt)

    state["raw_llm_output"] = response_text
    state["sql"] = _extract_sql(response_text)
    state["explanation"] = _extract_explanation(response_text)
    state["tables"] = _extract_tables(state["sql"])
    return state


def safety_node(state: SQLPipelineState) -> SQLPipelineState:
    _trace(state, "safety")
    sql = state.get("sql", "")

    if not sql:
        state["safe"] = False
        state["guard_violation"] = "NO_SQL_GENERATED"
        return state

    try:
        state["sql"] = validate_select_only(sql)
        state["safe"] = True
        state["guard_violation"] = None
    except SQLGuardViolation as e:
        state["safe"] = False
        state["guard_violation"] = e.reason_code

    return state


def interpreter_node(state: SQLPipelineState) -> SQLPipelineState:
    """
    안전성 검증을 통과하지 못했으면 실행하지 않고 사유를 남긴다.
    통과했고 execute=True인 경우에만 실제 SQL을 실행해 결과를 채운다.

    state에 source_code가 있으면 erp_sync.ERPSource로 등록된 외부 소스
    (PostgreSQL/MSSQL/MySQL/Oracle/SQLite)를 SQL Guard를 거쳐 조회하고,
    없으면 기존과 동일하게 Django 기본 연결(connection)을 사용한다.
    """
    _trace(state, "interpreter")

    if not state.get("safe"):
        state["error"] = f"SQL 안전성 검증 실패 ({state.get('guard_violation')})"
        state["results"] = []
        return state

    if not state.get("execute"):
        state["results"] = []
        return state

    source_code = state.get("source_code")
    try:
        if source_code:
            from ai.multi_source_query import run_query_for_source

            state["results"] = run_query_for_source(source_code, state["sql"])
        else:
            with connection.cursor() as cursor:
                cursor.execute(state["sql"])
                columns = [col[0] for col in cursor.description]
                state["results"] = [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        state["error"] = str(e)
        state["results"] = []

    return state
