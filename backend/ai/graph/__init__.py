# -*- coding: utf-8 -*-
"""
LangGraph 기반 Text-to-SQL 파이프라인

SAP PRD의 Supervisor 패턴을 최소 구성으로 반영한다:
Intent → Schema → SQL → Safety → Interpreter 5노드 그래프.

기존 ai.text_to_sql_service(SQL 생성)와 ai.sql_guard(안전성 검증)를 그대로
노드로 감싸는 형태이며, 커스텀 순차 오케스트레이터(agent_orchestration_service)를
대체하는 것이 아니라 SQL 질의 경로에 한정된 별도 파이프라인이다.
"""
from .pipeline import get_pipeline, run_pipeline
from .state import SQLPipelineState

__all__ = ["get_pipeline", "run_pipeline", "SQLPipelineState"]
