# -*- coding: utf-8 -*-
"""
LangChain Integration Module (Phase 1 - Simplified)
LangChain 프레임워크를 활용한 에이전트 툴 연동

주요 기능:
- Claude LLM과 LangChain 통합
- 툴 정의 및 등록
- 메모리 관리
"""
import os
import logging
from typing import Dict, Any, List, Optional, Callable, Type
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from django.conf import settings
from pydantic import BaseModel, Field

from .llm import ClaudeClient, Message as ClaudeMessage

logger = logging.getLogger(__name__)


@dataclass
class LangChainTool:
    """
    LangChain 툴 데이터 클래스

    기존 에이전트 시스템의 기능을 LangChain 툴로 노출하기 위해 사용.
    """

    name: str
    description: str
    func: Callable
    args_schema: Optional[Type[BaseModel]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "name": self.name,
            "description": self.description,
            "metadata": self.metadata,
        }


class AgentMemory:
    """
    에이전트 메모리 구현

    대화 기록 및 컨텍스트를 관리합니다.
    """

    def __init__(
        self,
        max_history: int = 10,
        summary_threshold: int = 5
    ):
        self.chat_history: List[Dict[str, str]] = []
        self.max_history = max_history
        self.summary_threshold = summary_threshold

    @property
    def memory_variables(self) -> List[str]:
        """메모리 변수 이름 반환"""
        return ["chat_history"]

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """메모리 변수 로드"""
        history_text = "\n".join([
            f"{m['role']}: {m['content']}"
            for m in self.chat_history[-self.max_history:]
        ])
        return {"chat_history": history_text}

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, Any]) -> None:
        """컨텍스트 저장"""
        # 사용자 입력 저장
        if "input" in inputs:
            self.chat_history.append({
                "role": "user",
                "content": inputs["input"]
            })

        # 에이전트 출력 저장
        if "output" in outputs:
            self.chat_history.append({
                "role": "assistant",
                "content": outputs["output"]
            })

        # 메모리 정리 (요약)
        if len(self.chat_history) > self.max_history + self.summary_threshold:
            self._summarize_old_messages()

    def clear(self) -> None:
        """메모리 클리어"""
        self.chat_history = []

    def _summarize_old_messages(self) -> None:
        """오래된 메시지 요약"""
        # 최근 N개만 유지
        self.chat_history = self.chat_history[-self.max_history:]


class ToolRegistry:
    """
    툴 레지스트리

    사용 가능한 모든 툴을 중앙 관리합니다.
    """

    _tools: Dict[str, LangChainTool] = {}

    @classmethod
    def register(cls, tool: LangChainTool) -> None:
        """툴 등록"""
        cls._tools[tool.name] = tool
        logger.info(f"툴 등록: {tool.name}")

    @classmethod
    def get(cls, name: str) -> Optional[LangChainTool]:
        """툴 조회"""
        return cls._tools.get(name)

    @classmethod
    def list(cls) -> List[LangChainTool]:
        """모든 툴 목록"""
        return list(cls._tools.values())

    @classmethod
    def create_tool(
        cls,
        name: str,
        description: str,
        func: Callable,
        args_schema: Optional[Type[BaseModel]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LangChainTool:
        """
        툴 생성 및 등록

        Args:
            name: 툴 이름
            description: 툴 설명
            func: 실행 함수
            args_schema: 인자 스키마
            metadata: 추가 메타데이터

        Returns:
            LangChainTool: 생성된 툴
        """
        tool = LangChainTool(
            name=name,
            description=description,
            func=func,
            args_schema=args_schema,
            metadata=metadata or {},
        )
        cls.register(tool)
        return tool


def get_langchain_tools() -> List[LangChainTool]:
    """
    등록된 모든 LangChain 툴 가져오기

    Returns:
        List[LangChainTool]: 툴 리스트
    """
    return ToolRegistry.list()


# ============================================================================
# 기본 툴 정의
# ============================================================================

def _register_default_tools():
    """기본 툴 등록"""

    # 데이터 조회 툴
    ToolRegistry.create_tool(
        name="query_database",
        description="데이터베이스에서 데이터를 조회합니다. SQL 쿼리를 실행할 수 있습니다.",
        func=lambda query: f"SQL 실행 결과: {query[:100]}...",
        metadata={"category": "database"}
    )

    # KPI 조회 툴
    ToolRegistry.create_tool(
        name="get_kpi",
        description="특정 KPI의 현재 값을 조회합니다.",
        func=lambda kpi_name, period="today": f"KPI {kpi_name}의 {period} 값: 95.5%",
        metadata={"category": "kpi"}
    )

    # 이벤트 조회 툴
    ToolRegistry.create_tool(
        name="get_events",
        description="최근 이벤트 목록을 조회합니다.",
        func=lambda event_type=None, limit=10: f"최근 {limit}개의 이벤트: [...]",
        metadata={"category": "events"}
    )

    # 예측 실행 툴
    ToolRegistry.create_tool(
        name="run_prediction",
        description="AI 예측 모델을 실행합니다.",
        func=lambda model_name, params: f"예측 결과 (모델: {model_name}): [...]",
        metadata={"category": "prediction"}
    )

    # 보고서 생성 툴
    ToolRegistry.create_tool(
        name="generate_report",
        description="분석 보고서를 생성합니다.",
        func=lambda report_type, data: f"{report_type} 보고서 생성 완료: [...]",
        metadata={"category": "report"}
    )

    # RAG 검색 툴
    ToolRegistry.create_tool(
        name="rag_search",
        description="문서에서 관련 정보를 검색합니다.",
        func=lambda query, top_k=5: f"RAG 검색 결과 (쿼리: {query}): [...]",
        metadata={"category": "rag"}
    )

    logger.info(f"기본 툴 {len(ToolRegistry.list())}개 등록 완료")


# 모듈 로드 시 기본 툴 등록
_register_default_tools()
