"""
Agent 레지스트리 — 모든 에이전트 등록 및 조회
"""
import logging
from typing import Type, Optional, Dict, Any, List

from .agent import BaseAgent

logger = logging.getLogger(__name__)


class AgentRegistry:
    """싱글톤 Agent 레지스트리"""
    _instance: Optional["AgentRegistry"] = None
    _agents: Dict[str, BaseAgent] = {}

    def __new__(cls) -> "AgentRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._agents = {}
        return cls._instance

    def register(self, agent: BaseAgent) -> None:
        """에이전트 등록"""
        # agent_name 속성이 있으면 사용, 아니면 name 사용
        agent_key = getattr(agent, 'agent_name', agent.name)
        self._agents[agent_key] = agent
        logger.info(f"Agent 등록: {agent_key} (v{agent.version})")

    def get(self, name: str) -> Optional[BaseAgent]:
        """이름으로 에이전트 조회"""
        return self._agents.get(name)

    def list_agents(self) -> List[Dict[str, Any]]:
        """등록된 에이전트 목록"""
        return [
            {
                "name": getattr(a, 'agent_name', a.name),
                "version": a.version,
                "domain": a.domain,
                "layer": a.layer,
                "description": a.description,
                "requires_human_approval": a.requires_human_approval,
            }
            for a in self._agents.values()
        ]

    def get_by_domain(self, domain: str) -> List[BaseAgent]:
        """도메인별 에이전트 조회"""
        return [a for a in self._agents.values() if a.domain == domain]

    def get_by_layer(self, layer: str) -> List[BaseAgent]:
        """계층별 에이전트 조회"""
        return [a for a in self._agents.values() if a.layer == layer]

    def get_by_name_pattern(self, pattern: str) -> List[BaseAgent]:
        """이름 패턴으로 에이전트 조회"""
        import re
        regex = re.compile(pattern)
        return [a for a in self._agents.values() if regex.match(getattr(a, 'agent_name', a.name))]

    def count(self) -> int:
        """등록된 에이전트 수"""
        return len(self._agents)

    def clear(self) -> None:
        """모든 에이전트 제거 (테스트용)"""
        self._agents.clear()
        logger.warning("모든 에이전트가 제거되었습니다.")


# 전역 레지스트리 인스턴스
registry = AgentRegistry()


def register_agent(agent: BaseAgent) -> None:
    """에이전트 등록 헬퍼 함수"""
    registry.register(agent)


def get_agent(name: str) -> Optional[BaseAgent]:
    """에이전트 조회 헬퍼 함수"""
    return registry.get(name)


def list_all_agents() -> List[Dict[str, Any]]:
    """모든 에이전트 목록 헬퍼 함수"""
    return registry.list_agents()
