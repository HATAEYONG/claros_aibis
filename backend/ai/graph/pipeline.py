# -*- coding: utf-8 -*-
"""LangGraph StateGraph 조립 — Intent → Schema → SQL → Safety → Interpreter."""
from typing import Callable, Optional

from langgraph.graph import END, StateGraph

from .nodes import intent_node, interpreter_node, safety_node, schema_node, sql_node
from .state import SQLPipelineState

_compiled_graph = None


def build_graph():
    graph = StateGraph(SQLPipelineState)

    graph.add_node("intent", intent_node)
    graph.add_node("schema", schema_node)
    graph.add_node("sql", sql_node)
    graph.add_node("safety", safety_node)
    graph.add_node("interpreter", interpreter_node)

    graph.set_entry_point("intent")
    graph.add_edge("intent", "schema")
    graph.add_edge("schema", "sql")
    graph.add_edge("sql", "safety")
    graph.add_edge("safety", "interpreter")
    graph.add_edge("interpreter", END)

    return graph.compile()


def get_pipeline():
    """컴파일된 그래프 싱글톤."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def run_pipeline(
    question: str,
    execute: bool = False,
    llm_call: Optional[Callable[[str, str], str]] = None,
) -> SQLPipelineState:
    """
    파이프라인을 한 번 실행하고 최종 상태를 반환한다.

    Args:
        question: 자연어 질문
        execute: True면 안전성 검증을 통과한 SQL을 실제로 실행한다
        llm_call: (system_prompt, user_prompt) -> response_text.
                   생략 시 ClaudeClient를 사용한다 (테스트에서는 fake 주입).
    """
    pipeline = get_pipeline()
    initial_state: SQLPipelineState = {
        "question": question,
        "execute": execute,
        "llm_call": llm_call,
        "trace": [],
    }
    return pipeline.invoke(initial_state)
