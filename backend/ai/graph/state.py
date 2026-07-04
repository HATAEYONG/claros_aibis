# -*- coding: utf-8 -*-
"""SQL 파이프라인 그래프의 공유 상태 정의."""
from typing import Any, Callable, Dict, List, Optional, TypedDict


class SQLPipelineState(TypedDict, total=False):
    question: str
    execute: bool
    llm_call: Optional[Callable[[str, str], str]]
    source_code: Optional[str]  # erp_sync.ERPSource.source_code — 생략 시 Django 기본 DB 사용

    intent: str
    schema: str

    sql: str
    raw_llm_output: str
    tables: List[str]
    explanation: str

    safe: bool
    guard_violation: Optional[str]

    results: List[Dict[str, Any]]
    error: Optional[str]

    trace: List[str]
