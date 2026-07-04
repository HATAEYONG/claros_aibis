"""
메모리 큐레이터 에이전트
에이전트 장기 메모리 관리 및 패턴 저장
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import AgentRunLog, AgentMemory, ReflectionLog

logger = logging.getLogger(__name__)


class MemoryCuratorAgent(BaseAgent):
    """
    메모리 큐레이터 에이전트
    에이전트 장기 메모리 관리 및 패턴 저장

    Attributes:
        agent_type: 에이전트 유형
        agent_name: 에이전트명
        agent_description: 에이전트 설명
        agent_domain: 도메인 (모든 도메인 지원)
        agent_layer: 학습 레이어
    """

    # 에이전트 메타데이터
    agent_type = "memory_curator"
    agent_name = "MemoryCuratorAgent"
    agent_description = "장기 패턴 식별 및 메모리 관리"
    agent_domain = "general"
    agent_layer = "learning"  # L6: Learning

    # 메모리 관리 기준
    MEMORY_THRESHOLDS = {
        'min_importance': 0.5,      # 최소 중요도
        'min_frequency': 3,         # 최소 출현 빈도
        'access_decay_days': 30,    # 접근 감소 기간
        'min_access_count': 5,      # 최소 접근 횟수
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        operation = input_data.context.get('operation')
        if operation not in ['extract', 'update', 'cleanup', 'query']:
            raise ValueError(f"지원하지 않는 operation: {operation}")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        메모리 큐레이션 실행

        Args:
            input_data: {
                'context': {
                    'operation': str,  # 'extract', 'update', 'cleanup', 'query'
                },
                'parameters': {
                    'run_id': str,  # extract 시 실행 ID
                    'memory_id': str,  # update/query 시 메모리 ID
                    'domain': str,  # query 시 도메인 필터
                    'memory_type': str,  # 메모리 유형 필터
                    'cleanup_days': int,  # cleanup 시 보관 기간
                }
            }
        """
        params = input_data.parameters
        context = input_data.context
        operation = context.get('operation', 'extract')

        try:
            if operation == 'extract':
                # 실행에서 메모리 추출
                run_id = params.get('run_id')
                if not run_id:
                    return AgentOutput(
                        status='error',
                        data={},
                        confidence_score=0.0,
                        message='run_id 파라미터가 필요합니다',
                        evidence_refs=[],
                    )

                result = self._extract_and_store_memory(run_id)

            elif operation == 'update':
                # 메모리 업데이트
                memory_id = params.get('memory_id')
                if not memory_id:
                    return AgentOutput(
                        status='error',
                        data={},
                        confidence_score=0.0,
                        message='memory_id 파라미터가 필요합니다',
                        evidence_refs=[],
                    )

                result = self._update_memory(memory_id, params)

            elif operation == 'cleanup':
                # 오래된 메모리 정리
                cleanup_days = params.get('cleanup_days', 90)
                result = self._cleanup_old_memories(cleanup_days)

            elif operation == 'query':
                # 메모리 조회
                result = self._query_memories(
                    domain=params.get('domain'),
                    memory_type=params.get('memory_type'),
                    limit=params.get('limit', 50)
                )

            else:
                return AgentOutput(
                    status='error',
                    data={},
                    confidence_score=0.0,
                    message=f'지원하지 않는 operation: {operation}',
                    evidence_refs=[],
                )

            # 증거 생성
            evidence_refs = [
                self.create_evidence_ref(
                    source_type='memory_operation',
                    source_id=result.get('memory_id', result.get('count', '')),
                    description=f"메모리 {operation} 완료"
                )
            ]

            return AgentOutput(
                status='success',
                data=result,
                confidence_score=0.85,
                message=f"메모리 {operation} 완료",
                evidence_refs=evidence_refs,
            )

        except Exception as e:
            logger.exception(f"메모리 큐레이션 실패: {e}")
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message=f"메모리 큐레이션 실패: {str(e)}",
                evidence_refs=[],
            )

    def _extract_and_store_memory(self, run_id: str) -> Dict[str, Any]:
        """실행에서 메모리 추출 및 저장"""
        try:
            run_log = AgentRunLog.objects.get(request_id=run_id)
        except AgentRunLog.DoesNotExist:
            return {
                'error': f"실행 로그를 찾을 수 없음: {run_id}",
                'run_id': run_id,
            }

        memories_created = []

        # 1. 패턴 메모리 추출
        patterns = self._extract_patterns(run_log)
        for pattern in patterns:
            memory = self._create_memory(
                memory_type='pattern',
                domain=run_log.agent_domain,
                key=pattern['key'],
                value=pattern['value'],
                context={
                    'agent_name': run_log.agent_name,
                    'run_id': str(run_id),
                    'extracted_at': timezone.now().isoformat(),
                },
                importance=pattern.get('importance', 0.7),
            )
            if memory:
                memories_created.append(str(memory.memory_id))

        # 2. 컨텍스트 메모리 추출
        contexts = self._extract_contexts(run_log)
        for context in contexts:
            memory = self._create_memory(
                memory_type='context',
                domain=run_log.agent_domain,
                key=context['key'],
                value=context['value'],
                context={
                    'agent_name': run_log.agent_name,
                    'run_id': str(run_id),
                },
                importance=context.get('importance', 0.6),
            )
            if memory:
                memories_created.append(str(memory.memory_id))

        # 3. 선호 메모리 추출
        preferences = self._extract_preferences(run_log)
        for pref in preferences:
            memory = self._create_memory(
                memory_type='preference',
                domain=run_log.agent_domain,
                key=pref['key'],
                value=pref['value'],
                context={
                    'agent_name': run_log.agent_name,
                    'run_id': str(run_id),
                },
                importance=pref.get('importance', 0.5),
            )
            if memory:
                memories_created.append(str(memory.memory_id))

        return {
            'run_id': str(run_id),
            'agent_name': run_log.agent_name,
            'memories_created': memories_created,
            'total_count': len(memories_created),
            'extracted_at': timezone.now().isoformat(),
        }

    def _extract_patterns(self, run_log: AgentRunLog) -> List[Dict[str, Any]]:
        """패턴 추출"""
        patterns = []

        # 성공 패턴
        if run_log.status == 'completed' and run_log.confidence >= 0.8:
            patterns.append({
                'key': f"success_pattern_{run_log.agent_name}",
                'value': {
                    'pattern_type': 'success',
                    'agent': run_log.agent_name,
                    'input_context_keys': list(run_log.input_data.get('context', {}).keys()),
                    'execution_time_ms': run_log.execution_time_ms,
                    'confidence': float(run_log.confidence),
                },
                'importance': 0.8,
            })

        # 에러 패턴
        if run_log.status == 'failed':
            patterns.append({
                'key': f"error_pattern_{run_log.agent_name}",
                'value': {
                    'pattern_type': 'error',
                    'agent': run_log.agent_name,
                    'error_type': run_log.output_data.get('errors', ['unknown'])[:3],
                    'input_context': run_log.input_data.get('context', {}),
                },
                'importance': 0.9,
            })

        # 근거 패턴
        if run_log.has_evidence:
            evidence_count = len(run_log.output_data.get('evidence_refs', []))
            patterns.append({
                'key': f"evidence_pattern_{run_log.agent_name}",
                'value': {
                    'pattern_type': 'evidence_rich',
                    'agent': run_log.agent_name,
                    'evidence_count': evidence_count,
                    'output_structure': list(run_log.output_data.get('data', {}).keys()),
                },
                'importance': 0.7,
            })

        return patterns

    def _extract_contexts(self, run_log: AgentRunLog) -> List[Dict[str, Any]]:
        """컨텍스트 추출"""
        contexts = []
        input_context = run_log.input_data.get('context', {})

        for key, value in input_context.items():
            # 중요한 컨텍스트 키만 저장
            if key in ['domain', 'analysis_type', 'process_type', 'event_type']:
                contexts.append({
                    'key': f"context_{run_log.agent_name}_{key}",
                    'value': {
                        'context_key': key,
                        'context_value': value,
                        'successful_outcome': run_log.status == 'completed',
                    },
                    'importance': 0.6,
                })

        return contexts

    def _extract_preferences(self, run_log: AgentRunLog) -> List[Dict[str, Any]]:
        """선호 추출"""
        preferences = []

        # 실행 시간 선호
        if run_log.execution_time_ms and run_log.execution_time_ms < 1000:
            preferences.append({
                'key': f"preference_fast_execution_{run_log.agent_name}",
                'value': {
                    'preference_type': 'fast_execution',
                    'agent': run_log.agent_name,
                    'target_time_ms': run_log.execution_time_ms,
                },
                'importance': 0.5,
            })

        # 증거 기반 선호
        if run_log.has_evidence:
            preferences.append({
                'key': f"preference_evidence_based_{run_log.agent_name}",
                'value': {
                    'preference_type': 'evidence_based',
                    'agent': run_log.agent_name,
                    'requires_evidence': True,
                },
                'importance': 0.6,
            })

        return preferences

    def _create_memory(
        self,
        memory_type: str,
        domain: str,
        key: str,
        value: Dict[str, Any],
        context: Dict[str, Any],
        importance: float
    ) -> Optional[AgentMemory]:
        """메모리 생성"""
        try:
            # 기존 메모리 확인
            existing = AgentMemory.objects.filter(
                memory_type=memory_type,
                domain=domain,
                key=key
            ).first()

            if existing:
                # 빈도 업데이트
                existing.frequency += 1
                existing.importance = max(existing.importance, importance)
                existing.last_used = timezone.now()
                existing.save(update_fields=['frequency', 'importance', 'last_used'])
                return existing
            else:
                # 새 메모리 생성
                return AgentMemory.objects.create(
                    memory_type=memory_type,
                    domain=domain,
                    key=key,
                    value=value,
                    context=context,
                    importance=importance,
                    frequency=1,
                )
        except Exception as e:
            logger.warning(f"메모리 생성 실패: {e}")
            return None

    def _update_memory(self, memory_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """메모리 업데이트"""
        try:
            memory = AgentMemory.objects.get(memory_id=memory_id)

            # 중요도 업데이트
            if 'importance' in params:
                memory.importance = params['importance']

            # 값 업데이트
            if 'value' in params:
                memory.value.update(params['value'])
                memory.save()

            # 접근 카운트 증가
            memory.access_count += 1
            memory.last_used = timezone.now()
            memory.save(update_fields=['access_count', 'last_used', 'importance'])

            return {
                'memory_id': str(memory.memory_id),
                'updated': True,
                'access_count': memory.access_count,
                'importance': float(memory.importance),
            }

        except AgentMemory.DoesNotExist:
            return {
                'error': f"메모리를 찾을 수 없음: {memory_id}",
                'memory_id': memory_id,
            }

    def _cleanup_old_memories(self, cleanup_days: int) -> Dict[str, Any]:
        """오래된 메모리 정리"""
        cutoff_date = timezone.now() - timedelta(days=cleanup_days)

        # 낮은 중요도와 오래된 메모리 찾기
        old_memories = AgentMemory.objects.filter(
            last_used__lt=cutoff_date,
            importance__lt=self.MEMORY_THRESHOLDS['min_importance']
        )

        count = old_memories.count()
        old_memories.delete()

        return {
            'cleanup_days': cleanup_days,
            'deleted_count': count,
            'cutoff_date': cutoff_date.isoformat(),
        }

    def _query_memories(
        self,
        domain: Optional[str] = None,
        memory_type: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """메모리 조회"""
        memories = AgentMemory.objects.all()

        if domain:
            memories = memories.filter(domain=domain)

        if memory_type:
            memories = memories.filter(memory_type=memory_type)

        # 중요도와 빈도로 정렬
        memories = memories.order_by('-importance', '-frequency')[:limit]

        results = []
        for memory in memories:
            results.append({
                'memory_id': str(memory.memory_id),
                'memory_type': memory.memory_type,
                'domain': memory.domain,
                'key': memory.key,
                'value': memory.value,
                'importance': float(memory.importance),
                'frequency': memory.frequency,
                'access_count': memory.access_count,
                'last_used': memory.last_used.isoformat(),
            })

        return {
            'count': len(results),
            'memories': results,
            'filters': {
                'domain': domain,
                'memory_type': memory_type,
                'limit': limit,
            },
        }

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        # 메모리 큐레이션 성공 여부 로깅
        if output_data.status == 'success':
            logger.info(f"메모리 큐레이션 성공: {input_data.context.get('operation')}")


# 헬퍼 함수
def extract_and_store_memory(run_id: str) -> Dict[str, Any]:
    """실행에서 메모리 추출 헬퍼 함수"""
    from ai.agents.learning.memory_curator_agent import MemoryCuratorAgent
    from ai.agents.base.agent import AgentInput

    agent = MemoryCuratorAgent()
    input_data = AgentInput(
        context={'operation': 'extract'},
        parameters={'run_id': run_id}
    )
    output = agent.run(input_data)
    return output.data


def query_agent_memories(
    domain: Optional[str] = None,
    memory_type: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """에이전트 메모리 조회 헬퍼 함수"""
    from ai.agents.learning.memory_curator_agent import MemoryCuratorAgent
    from ai.agents.base.agent import AgentInput

    agent = MemoryCuratorAgent()
    input_data = AgentInput(
        context={'operation': 'query'},
        parameters={'domain': domain, 'memory_type': memory_type, 'limit': limit}
    )
    output = agent.run(input_data)
    return output.data
