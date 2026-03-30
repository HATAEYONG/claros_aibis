"""
반성 에이전트
에이전트 실행 결과를 반성하고 학습
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import AgentRunLog, ReflectionLog

logger = logging.getLogger(__name__)


class ReflectionAgent(BaseAgent):
    """
    반성 에이전트
    에이전트 실행 결과를 반성하고 학습

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 학습 레이어
    """

    name = "ReflectionAgent"
    description = "에이전트 실행 반성 및 학습"
    version = "1.0.0"
    domain = "general"
    layer = "learning"
    requires_human_approval = False

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        반성 실행

        Args:
            agent_input: 입력 데이터
                - run_id: 반성할 실행 ID
                - reflection_type: 반성 유형 (outcome, process, strategy)

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters
        run_id = params.get("run_id")
        reflection_type = params.get("reflection_type", "outcome")

        if not run_id:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=["run_id 파라미터가 필요합니다"],
            )

        try:
            # 실행 로그 조회
            try:
                run_log = AgentRunLog.objects.get(request_id=run_id)
            except AgentRunLog.DoesNotExist:
                return AgentOutput(
                    request_id=agent_input.request_id,
                    agent_name=self.name,
                    status="error",
                    errors=[f"실행 로그를 찾을 수 없음: {run_id}"],
                )

            # 반성 수행
            reflection_result = self._reflect_on_run(
                run_log=run_log,
                reflection_type=reflection_type
            )

            # 반성 로그 저장
            self._save_reflection(
                run_log=run_log,
                reflection_result=reflection_result,
                reflection_type=reflection_type
            )

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result=reflection_result,
                evidence_refs=[
                    self.create_evidence_ref(
                        evidence_type="agent_reflection",
                        source="ReflectionAgent",
                        source_id=str(run_id),
                        description=f"에이전트 실행 반성: {run_log.agent_name}",
                    )
                ],
                confidence=0.8,
            )

        except Exception as e:
            logger.exception(f"반성 실패: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"반성 실패: {str(e)}"],
            )

    def _reflect_on_run(
        self,
        run_log: AgentRunLog,
        reflection_type: str
    ) -> Dict[str, Any]:
        """실행 반성"""
        reflection_result = {
            "run_id": str(run_log.request_id),
            "agent_name": run_log.agent_name,
            "reflection_type": reflection_type,
            "what_went_well": [],
            "what_went_wrong": [],
            "lessons_learned": [],
            "improvement_suggestions": [],
        }

        # 반성 유형별 분석
        if reflection_type == "outcome":
            reflection_result.update(self._reflect_on_outcome(run_log))
        elif reflection_type == "process":
            reflection_result.update(self._reflect_on_process(run_log))
        elif reflection_type == "strategy":
            reflection_result.update(self._reflect_on_strategy(run_log))
        else:
            reflection_result.update(self._reflect_on_outcome(run_log))

        return reflection_result

    def _reflect_on_outcome(self, run_log: AgentRunLog) -> Dict[str, Any]:
        """결과 반성"""
        what_went_well = []
        what_went_wrong = []
        lessons_learned = []
        improvement_suggestions = []

        # 성공 여부
        if run_log.status == "completed":
            what_went_well.append("에이전트가 성공적으로 완료됨")
        else:
            what_went_wrong.append(f"에이전트 실행 실패: {run_log.status}")

        # 신뢰도
        if run_log.confidence and run_log.confidence >= 0.8:
            what_went_well.append("높은 신뢰도로 결과 생성")
        elif run_log.confidence and run_log.confidence < 0.5:
            what_went_wrong.append("낮은 신뢰도")
            improvement_suggestions.append("신뢰도 향상 방안 모색 필요")

        # 근거
        if run_log.has_evidence:
            what_went_well.append("충분한 근거와 함께 결과 제공")
        else:
            what_went_wrong.append("근거 참조 없음")
            improvement_suggestions.append("결과에 근거 참조 추가 필요")

        # 실행 시간
        if run_log.execution_time_ms and run_log.execution_time_ms < 2000:
            what_went_well.append("빠른 실행 시간")
        elif run_log.execution_time_ms and run_log.execution_time_ms > 5000:
            what_went_wrong.append("긴 실행 시간")
            improvement_suggestions.append("성능 최적화 필요")

        # 교훈
        if run_log.status == "completed" and run_log.has_evidence:
            lessons_learned.append("높은 품질의 결과 생성 가능")

        # 출력 데이터 분석
        if run_log.output_data:
            output = run_log.output_data
            if output.get("errors"):
                what_went_wrong.append(f"에러 발생: {', '.join(output['errors'])}")
            if output.get("warnings"):
                what_went_wrong.append(f"경고 발생: {', '.join(output['warnings'])}")

        return {
            "what_went_well": what_went_well,
            "what_went_wrong": what_went_wrong,
            "lessons_learned": lessons_learned,
            "improvement_suggestions": improvement_suggestions,
        }

    def _reflect_on_process(self, run_log: AgentRunLog) -> Dict[str, Any]:
        """프로세스 반성"""
        what_went_well = []
        what_went_wrong = []
        lessons_learned = []
        improvement_suggestions = []

        # 입력 데이터 품질
        if run_log.input_data:
            input_data = run_log.input_data
            if input_data.get("context"):
                what_went_well.append("충분한 컨텍스트 제공됨")
            else:
                what_went_wrong.append("컨텍스트 부족")
                improvement_suggestions.append("입력 시 더 많은 컨텍스트 제공 권장")

        # 부모 실행 확인
        if run_log.parent_run_id:
            what_went_well.append("상위 실행과의 연계성 있음")
        else:
            lessons_learned.append("독립 실행으로서의 완결성 확인")

        return {
            "what_went_well": what_went_well,
            "what_went_wrong": what_went_wrong,
            "lessons_learned": lessons_learned,
            "improvement_suggestions": improvement_suggestions,
        }

    def _reflect_on_strategy(self, run_log: AgentRunLog) -> Dict[str, Any]:
        """전략 반성"""
        what_went_well = []
        what_went_wrong = []
        lessons_learned = []
        improvement_suggestions = []

        # 에이전트 유형별 전략
        agent_name = run_log.agent_name

        if "Monitoring" in agent_name or "Detect" in agent_name:
            lessons_learned.append("조기 감지의 중요성 확인")
            improvement_suggestions.append("감지 민감도 최적화 검토")

        elif "Analysis" in agent_name:
            lessons_learned.append("분석 깊이와 정확도의 균형 필요")
            improvement_suggestions.append("분석 파라미터 튜닝 권장")

        elif "Decision" in agent_name or "Recommend" in agent_name:
            lessons_learned.append("의사결정 품질 향상을 위한 피드백 루프 중요")
            improvement_suggestions.append("승인된 권고사항의 추적 필요")

        return {
            "what_went_well": what_went_well,
            "what_went_wrong": what_went_wrong,
            "lessons_learned": lessons_learned,
            "improvement_suggestions": improvement_suggestions,
        }

    def _save_reflection(
        self,
        run_log: AgentRunLog,
        reflection_result: Dict[str, Any],
        reflection_type: str
    ) -> None:
        """반성 로그 저장"""
        ReflectionLog.objects.create(
            agent_run=run_log,
            what_went_well=", ".join(reflection_result.get("what_went_well", [])),
            what_went_wrong=", ".join(reflection_result.get("what_went_wrong", [])),
            lessons_learned=", ".join(reflection_result.get("lessons_learned", [])),
            improvement_suggestions=reflection_result.get("improvement_suggestions", []),
        )
