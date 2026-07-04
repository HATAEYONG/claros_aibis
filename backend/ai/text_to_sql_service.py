# -*- coding: utf-8 -*-
"""
LLM 기반 Text-to-SQL 서비스

기존 chat_services._generate_sql()의 키워드 매칭 하드코딩 SQL 템플릿을 대체한다.
- 현재 연결된 DB의 실제 테이블/컬럼 스키마를 introspect해 LLM 프롬프트에 주입
- ai.llm.claude_client.ClaudeClient로 SQL 생성 (Anthropic Claude)
- ai.sql_guard로 SELECT 전용 검증 — 위반 시 실행 불가 상태로 반환

`llm_call`을 주입하면 실제 API 호출 없이 파이프라인을 테스트할 수 있다.
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Callable, List, Optional

from django.db import connection

from ai.sql_guard import SQLGuardViolation, validate_select_only

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """당신은 SQL 전문가입니다. 주어진 데이터베이스 스키마를 참고해 \
자연어 질문에 대한 read-only SQL만 생성하세요.

규칙:
1. 반드시 SELECT (또는 WITH ... SELECT) 문만 생성합니다. \
INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE 등은 절대 생성하지 않습니다.
2. 세미콜론으로 구분된 여러 statement를 생성하지 않습니다.
3. 스키마에 없는 테이블/컬럼을 임의로 만들어내지 않습니다.
4. SQL은 ```sql ... ``` 코드블록 안에 작성합니다.
5. 코드블록 뒤에 한국어로 한 줄 설명을 덧붙입니다."""


@dataclass
class TextToSQLResult:
    sql: str
    explanation: str
    tables: List[str] = field(default_factory=list)
    safe: bool = True
    guard_violation: Optional[str] = None
    raw_llm_output: str = ""

    def to_dict(self) -> dict:
        return {
            "sql": self.sql,
            "explanation": self.explanation,
            "tables": self.tables,
            "safe": self.safe,
            "guard_violation": self.guard_violation,
        }


def get_schema_summary(max_tables: int = 30) -> str:
    """현재 연결된 DB의 테이블/컬럼 목록을 LLM 프롬프트용 텍스트로 요약."""
    try:
        table_names = connection.introspection.table_names()[:max_tables]
        lines = []
        with connection.cursor() as cursor:
            for table in table_names:
                try:
                    columns = connection.introspection.get_table_description(cursor, table)
                    col_names = ", ".join(c.name for c in columns)
                    lines.append(f"- {table}({col_names})")
                except Exception:
                    continue
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"스키마 introspection 실패: {e}")
        return ""


def _extract_sql(response_text: str) -> str:
    """LLM 응답에서 SQL 코드블록을 추출."""
    match = re.search(r"```sql\s*(.*?)```", response_text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()

    match = re.search(r"\b(SELECT|WITH)\b.*", response_text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(0).strip()

    return ""


def _extract_tables(sql: str) -> List[str]:
    tables = re.findall(r"FROM\s+([A-Za-z_][A-Za-z0-9_]*)", sql, re.IGNORECASE)
    tables += re.findall(r"JOIN\s+([A-Za-z_][A-Za-z0-9_]*)", sql, re.IGNORECASE)
    return sorted(set(tables))


def _extract_explanation(response_text: str) -> str:
    without_code = re.sub(r"```sql.*?```", "", response_text, flags=re.IGNORECASE | re.DOTALL).strip()
    return without_code or "질문에 대한 SQL 쿼리입니다."


def _default_llm_call(system_prompt: str, user_prompt: str) -> str:
    """ai.llm.claude_client.ClaudeClient를 사용하는 기본 LLM 호출."""
    from ai.llm.claude_client import get_claude_client

    client = get_claude_client()
    response = client.create_simple(prompt=user_prompt, system_prompt=system_prompt)
    return response.content


def generate_sql(
    question: str,
    llm_call: Optional[Callable[[str, str], str]] = None,
) -> TextToSQLResult:
    """
    자연어 질문을 SQL로 변환한다.

    Args:
        question: 자연어 질문
        llm_call: (system_prompt, user_prompt) -> response_text 콜러블.
                   생략 시 ClaudeClient를 사용한다 (테스트에서는 fake를 주입).
    """
    schema = get_schema_summary()
    user_prompt = f"데이터베이스 스키마:\n{schema}\n\n질문: {question}\n\nSQL:"

    if llm_call is None:
        llm_call = _default_llm_call

    response_text = llm_call(SYSTEM_PROMPT, user_prompt)

    sql = _extract_sql(response_text)
    explanation = _extract_explanation(response_text)
    tables = _extract_tables(sql)

    if not sql:
        return TextToSQLResult(
            sql="",
            explanation="SQL을 생성하지 못했습니다. 질문을 더 구체적으로 작성해주세요.",
            tables=[],
            safe=False,
            guard_violation="NO_SQL_GENERATED",
            raw_llm_output=response_text,
        )

    try:
        safe_sql = validate_select_only(sql)
        return TextToSQLResult(
            sql=safe_sql,
            explanation=explanation,
            tables=tables,
            safe=True,
            raw_llm_output=response_text,
        )
    except SQLGuardViolation as e:
        logger.warning(f"SQL Guard 차단: {e.reason_code} - {sql}")
        return TextToSQLResult(
            sql=sql,
            explanation=f"생성된 SQL이 안전성 검증에 실패했습니다 ({e.reason_code}): {e}",
            tables=tables,
            safe=False,
            guard_violation=e.reason_code,
            raw_llm_output=response_text,
        )
