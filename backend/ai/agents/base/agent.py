"""
BaseAgent — 모든 에이전트의 추상 기반 클래스
설계 원칙:
  - 모든 출력은 typed schema (AgentOutput)
  - 모든 결과에 evidence_refs 필수
  - 실행 로그 자동 기록
  - pre/post 훅으로 전처리/후처리 확장 가능
"""
import time
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Optional, Any, Dict
from datetime import datetime

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AgentInput(BaseModel):
    """모든 Agent 입력의 기본 스키마"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str = ""
    context: Dict[str, Any] = Field(default_factory=dict)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    evidence_required: bool = True
    requested_by: str = "system"
    parent_run_id: Optional[str] = None
    domain: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent


class AgentOutput(BaseModel):
    """모든 Agent 출력의 기본 스키마"""
    request_id: str
    agent_name: str
    status: str = "success"  # success | partial | error | needs_human
    result: Dict[str, Any] = Field(default_factory=dict)
    evidence_refs: list[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    recommendations: list[Dict[str, Any]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: int = 0
    next_agents: list[str] = Field(default_factory=list)


class BaseAgent(ABC):
    """모든 에이전트의 추상 기반 클래스"""

    name: str = "BaseAgent"
    description: str = ""
    version: str = "1.0.0"
    domain: str = "general"
    layer: str = "intelligence"
    requires_human_approval: bool = False

    @abstractmethod
    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """에이전트 핵심 실행 로직 — 하위 클래스에서 구현"""
        pass

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증 — 필요 시 오버라이드"""
        return True

    def pre_execute(self, agent_input: AgentInput) -> AgentInput:
        """실행 전 전처리 — 컨텍스트 보강 등"""
        return agent_input

    def post_execute(self, output: AgentOutput) -> AgentOutput:
        """실행 후 후처리 — 근거 검증, 로깅"""
        # evidence_required는 input의 속성이므로 체크하지 않음
        # 근거가 없고 성공한 경우 경고만 추가
        if not output.evidence_refs and output.status == "success":
            output.warnings.append("evidence_refs 비어 있음 — 근거 없는 결과")
        return output

    def run(self, agent_input: AgentInput) -> AgentOutput:
        """전체 실행 파이프라인 (validate → pre → execute → post → log)"""
        start = time.time()
        request_id = agent_input.request_id

        logger.info(f"[{self.name}] 실행 시작 (request={request_id})")

        try:
            # 유효성 검증
            if not self.validate_input(agent_input):
                return AgentOutput(
                    request_id=request_id,
                    agent_name=self.name,
                    status="error",
                    errors=["입력 유효성 검증 실패"],
                )

            # 전처리
            agent_input = self.pre_execute(agent_input)

            # 실행
            output = self.execute(agent_input)

            # 실행 시간
            output.execution_time_ms = int((time.time() - start) * 1000)

            # 후처리
            output = self.post_execute(output)

        except Exception as e:
            logger.exception(f"[{self.name}] 실행 오류: {e}")
            output = AgentOutput(
                request_id=request_id,
                agent_name=self.name,
                status="error",
                errors=[str(e)],
                execution_time_ms=int((time.time() - start) * 1000),
            )

        # 실행 로그 저장
        self._save_run_log(agent_input, output)

        logger.info(
            f"[{self.name}] 실행 완료: status={output.status}, "
            f"confidence={output.confidence:.2f}, "
            f"time={output.execution_time_ms}ms"
        )
        return output

    def _save_run_log(self, agent_input: AgentInput, output: AgentOutput):
        """Agent 실행 이력 DB 저장"""
        try:
            from ai.models import AgentRunLog
            AgentRunLog.objects.create(
                request_id=uuid.UUID(agent_input.request_id),
                agent_name=self.name,
                agent_version=self.version,
                agent_layer=self.layer,
                agent_domain=self.domain,
                input_data=agent_input.model_dump(mode="json"),
                output_data=output.model_dump(mode="json"),
                status=output.status,
                confidence=output.confidence,
                execution_time_ms=output.execution_time_ms,
                has_evidence=bool(output.evidence_refs),
                parent_run_id=(
                    uuid.UUID(agent_input.parent_run_id)
                    if agent_input.parent_run_id
                    else None
                ),
            )
        except Exception as e:
            logger.error(f"[{self.name}] 실행 로그 저장 실패: {e}")

    def create_evidence_ref(
        self,
        evidence_type: str,
        source: str,
        source_id: str,
        description: str = "",
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """근거 참조 생성 헬퍼"""
        return {
            "evidence_type": evidence_type,
            "source": source,
            "source_id": source_id,
            "description": description,
            "data": data or {},
            "timestamp": datetime.now().isoformat()
        }
