"""
지식 업데이트 에이전트
에이전트 발견사항 기반 지식 그래프 업데이트
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import AgentRunLog
from ontology.models import OntologyNode, OntologyEdge

logger = logging.getLogger(__name__)


class KnowledgeUpdateAgent(BaseAgent):
    """
    지식 업데이트 에이전트
    에이전트 발견사항 기반 지식 그래프 업데이트

    Attributes:
        agent_type: 에이전트 유형
        agent_name: 에이전트명
        agent_description: 에이전트 설명
        agent_domain: 도메인 (모든 도메인 지원)
        agent_layer: 학습 레이어
    """

    # 에이전트 메타데이터
    agent_type = "knowledge_update"
    agent_name = "KnowledgeUpdateAgent"
    agent_description = "지식 그래프 업데이트 및 관리"
    agent_domain = "general"
    agent_layer = "learning"  # L6: Learning

    # 지식 업데이트 기준
    KNOWLEDGE_THRESHOLDS = {
        'min_confidence': 0.7,       # 최소 신뢰도
        'min_occurrence': 3,         # 최소 출현 횟수
        'relation_strength': 0.6,    # 관계 강도
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        update_type = input_data.context.get('update_type')
        if update_type not in ['nodes', 'edges', 'patterns', 'sync']:
            raise ValueError(f"지원하지 않는 update_type: {update_type}")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        지식 업데이트 실행

        Args:
            input_data: {
                'context': {
                    'update_type': str,  # 'nodes', 'edges', 'patterns', 'sync'
                },
                'parameters': {
                    'run_id': str,  # 실행 ID (기반 데이터)
                    'domain': str,  # 도메인 필터
                    'batch_size': int,  # 배치 처리 크기
                }
            }
        """
        params = input_data.parameters
        context = input_data.context
        update_type = context.get('update_type', 'nodes')

        try:
            if update_type == 'nodes':
                # 노드 업데이트
                result = self._update_nodes(
                    run_id=params.get('run_id'),
                    domain=params.get('domain')
                )

            elif update_type == 'edges':
                # 엣지 업데이트
                result = self._update_edges(
                    run_id=params.get('run_id'),
                    domain=params.get('domain')
                )

            elif update_type == 'patterns':
                # 패턴 기반 지식 업데이트
                result = self._update_from_patterns(
                    domain=params.get('domain'),
                    days=params.get('days', 7)
                )

            elif update_type == 'sync':
                # 지식 그래프 동기화
                result = self._sync_knowledge_graph(
                    domain=params.get('domain')
                )

            else:
                return AgentOutput(
                    status='error',
                    data={},
                    confidence_score=0.0,
                    message=f'지원하지 않는 update_type: {update_type}',
                    evidence_refs=[],
                )

            # 증거 생성
            evidence_refs = [
                self.create_evidence_ref(
                    source_type='knowledge_update',
                    source_id=result.get('update_id', ''),
                    description=f"지식 그래프 {update_type} 업데이트"
                )
            ]

            return AgentOutput(
                status='success',
                data=result,
                confidence_score=0.85,
                message=f"지식 그래프 {update_type} 업데이트 완료",
                evidence_refs=evidence_refs,
            )

        except Exception as e:
            logger.exception(f"지식 업데이트 실패: {e}")
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message=f"지식 업데이트 실패: {str(e)}",
                evidence_refs=[],
            )

    def _update_nodes(
        self,
        run_id: Optional[str] = None,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """노드 업데이트"""
        nodes_created = []
        nodes_updated = []

        # 실행 로그에서 엔티티 추출
        if run_id:
            entities = self._extract_entities_from_run(run_id)
            for entity in entities:
                node = self._create_or_update_node(
                    node_type='entity',
                    name=entity['name'],
                    labels=entity.get('labels', []),
                    properties=entity.get('properties', {}),
                    metadata=entity.get('metadata', {}),
                )
                if node:
                    if node.created_at == node.updated_at:
                        nodes_created.append(str(node.node_id))
                    else:
                        nodes_updated.append(str(node.node_id))

        # 도메인별 개념 노드 생성
        if domain:
            concepts = self._get_domain_concepts(domain)
            for concept in concepts:
                node = self._create_or_update_node(
                    node_type='concept',
                    name=concept['name'],
                    labels=concept.get('labels', [domain]),
                    properties=concept.get('properties', {}),
                    metadata={'domain': domain},
                )
                if node:
                    nodes_created.append(str(node.node_id))

        return {
            'update_id': str(uuid.uuid4()),
            'nodes_created': nodes_created,
            'nodes_updated': nodes_updated,
            'total_changes': len(nodes_created) + len(nodes_updated),
        }

    def _update_edges(
        self,
        run_id: Optional[str] = None,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """엣지 업데이트"""
        edges_created = []
        edges_updated = []

        # 실행 로그에서 관계 추출
        if run_id:
            relationships = self._extract_relationships_from_run(run_id)
            for rel in relationships:
                edge = self._create_or_update_edge(
                    source_node_id=rel['source_id'],
                    target_node_id=rel['target_id'],
                    relationship_type=rel['type'],
                    properties=rel.get('properties', {}),
                )
                if edge:
                    edges_created.append(str(edge.edge_id))

        # 도메인별 관계 생성
        if domain:
            relationships = self._get_domain_relationships(domain)
            for rel in relationships:
                edge = self._create_or_update_edge(
                    source_node_id=rel['source_id'],
                    target_node_id=rel['target_id'],
                    relationship_type=rel['type'],
                    properties=rel.get('properties', {}),
                )
                if edge:
                    edges_created.append(str(edge.edge_id))

        return {
            'update_id': str(uuid.uuid4()),
            'edges_created': edges_created,
            'edges_updated': edges_updated,
            'total_changes': len(edges_created) + len(edges_updated),
        }

    def _update_from_patterns(
        self,
        domain: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """패턴 기반 지식 업데이트"""
        from ai.models import AgentMemory

        cutoff_date = timezone.now() - timedelta(days=days)

        # 메모리에서 패턴 조회
        patterns = AgentMemory.objects.filter(
            memory_type='pattern',
            last_used__gte=cutoff_date,
            importance__gte=self.KNOWLEDGE_THRESHOLDS['min_confidence']
        )

        if domain:
            patterns = patterns.filter(domain=domain)

        updates = {
            'nodes_created': [],
            'edges_created': [],
            'patterns_processed': 0,
        }

        for pattern in patterns:
            pattern_value = pattern.value

            # 패턴에서 노드 추출
            if pattern_value.get('pattern_type') == 'success':
                node = self._create_or_update_node(
                    node_type='pattern',
                    name=f"success_pattern_{pattern_value.get('agent')}",
                    labels=['success_pattern'],
                    properties=pattern_value,
                    metadata={
                        'frequency': pattern.frequency,
                        'importance': float(pattern.importance),
                    },
                )
                if node:
                    updates['nodes_created'].append(str(node.node_id))

            # 패턴 간 관계 생성
            if pattern.frequency >= self.KNOWLEDGE_THRESHOLDS['min_occurrence']:
                # 유사 패턴 간 연결
                similar_patterns = patterns.filter(
                    memory_type='pattern',
                    domain=pattern.domain
                ).exclude(memory_id=pattern.memory_id)[:5]

                for similar in similar_patterns:
                    edge = self._create_or_update_edge(
                        source_node_id=pattern.key,
                        target_node_id=similar.key,
                        relationship_type='similar_to',
                        properties={
                            'similarity_score': 0.7,
                            'domain': pattern.domain,
                        },
                    )
                    if edge:
                        updates['edges_created'].append(str(edge.edge_id))

            updates['patterns_processed'] += 1

        return updates

    def _sync_knowledge_graph(
        self,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """지식 그래프 동기화"""
        # 연결되지 않은 노드 정리
        orphaned_nodes = OntologyNode.objects.all()

        if domain:
            orphaned_nodes = orphaned_nodes.filter(
                labels__contains=domain
            )

        # 연결 확인
        connected_node_ids = set()
        for edge in OntologyEdge.objects.all():
            connected_node_ids.add(edge.source_node_id)
            connected_node_ids.add(edge.target_node_id)

        orphaned_count = orphaned_nodes.exclude(
            node_id__in=connected_node_ids
        ).count()

        # 가중치 재계산
        for edge in OntologyEdge.objects.all()[:100]:  # 배치 처리
            edge.weight = self._calculate_edge_weight(edge)
            edge.save(update_fields=['weight'])

        return {
            'update_id': str(uuid.uuid4()),
            'orphaned_nodes': orphaned_count,
            'edges_reweighted': 100,
            'sync_status': 'completed',
        }

    def _extract_entities_from_run(self, run_id: str) -> List[Dict[str, Any]]:
        """실행 로그에서 엔티티 추출"""
        try:
            run_log = AgentRunLog.objects.get(request_id=run_id)
        except AgentRunLog.DoesNotExist:
            return []

        entities = []

        # 입력 데이터에서 엔티티 추출
        input_data = run_log.input_data
        context = input_data.get('context', {})

        # 도메인 엔티티
        if context.get('domain'):
            entities.append({
                'name': context['domain'],
                'labels': ['domain', context['domain']],
                'properties': {
                    'agent_name': run_log.agent_name,
                    'layer': run_log.agent_layer,
                },
                'metadata': {
                    'source_run_id': str(run_id),
                },
            })

        # 이벤트 관련 엔티티
        if context.get('event_type'):
            entities.append({
                'name': context['event_type'],
                'labels': ['event_type'],
                'properties': {
                    'domain': context.get('domain', 'unknown'),
                },
                'metadata': {
                    'source_run_id': str(run_id),
                },
            })

        # 출력 데이터에서 엔티티 추출
        output_data = run_log.output_data
        result = output_data.get('data', {})

        if result.get('findings'):
            for finding in result['findings'][:5]:  # 최대 5개
                if finding.get('domain'):
                    entities.append({
                        'name': finding.get('description', finding.get('type', ''))[:100],
                        'labels': ['finding', finding.get('domain', 'unknown')],
                        'properties': {
                            'severity': finding.get('severity'),
                            'type': finding.get('type'),
                        },
                        'metadata': {
                            'source_run_id': str(run_id),
                        },
                    })

        return entities

    def _extract_relationships_from_run(self, run_id: str) -> List[Dict[str, Any]]:
        """실행 로그에서 관계 추출"""
        try:
            run_log = AgentRunLog.objects.get(request_id=run_id)
        except AgentRunLog.DoesNotExist:
            return []

        relationships = []

        # 부모-자식 관계
        if run_log.parent_run_id:
            relationships.append({
                'source_id': str(run_log.parent_run_id),
                'target_id': str(run_log.request_id),
                'type': 'triggered',
                'properties': {
                    'agent_name': run_log.agent_name,
                },
            })

        # 이벤트 연결
        if run_log.triggered_event_id:
            relationships.append({
                'source_id': str(run_log.triggered_event_id),
                'target_id': str(run_log.request_id),
                'type': 'detected_by',
                'properties': {
                    'agent_name': run_log.agent_name,
                },
            })

        # 도메인 관계
        input_data = run_log.input_data
        context = input_data.get('context', {})

        domain = context.get('domain')
        if domain:
            # 도메인과 에이전트 관계
            source_node = self._find_or_create_node_by_name(domain)
            target_node = self._find_or_create_node_by_name(run_log.agent_name)

            if source_node and target_node:
                relationships.append({
                    'source_id': str(source_node.node_id),
                    'target_id': str(target_node.node_id),
                    'type': 'has_agent',
                    'properties': {
                        'layer': run_log.agent_layer,
                    },
                })

        return relationships

    def _get_domain_concepts(self, domain: str) -> List[Dict[str, Any]]:
        """도메인 개념 조회"""
        concepts = []

        # 도메인별 기본 개념
        domain_concepts = {
            'cost': [
                {'name': 'material_cost', 'labels': ['cost', '4m2e']},
                {'name': 'labor_cost', 'labels': ['cost', '4m2e']},
                {'name': 'overhead_cost', 'labels': ['cost', '4m2e']},
            ],
            'quality': [
                {'name': 'defect', 'labels': ['quality', 'issue']},
                {'name': 'capa', 'labels': ['quality', 'action']},
                {'name': 'inspection', 'labels': ['quality', 'process']},
            ],
            'production': [
                {'name': 'work_order', 'labels': ['production', 'process']},
                {'name': 'equipment', 'labels': ['production', 'resource']},
                {'name': 'production_plan', 'labels': ['production', 'plan']},
            ],
            'purchase': [
                {'name': 'supplier', 'labels': ['purchase', 'entity']},
                {'name': 'purchase_order', 'labels': ['purchase', 'document']},
                {'name': 'inventory', 'labels': ['purchase', 'resource']},
            ],
        }

        for concept in domain_concepts.get(domain, []):
            concepts.append({
                'name': concept['name'],
                'labels': concept['labels'],
                'properties': {
                    'domain': domain,
                },
            })

        return concepts

    def _get_domain_relationships(self, domain: str) -> List[Dict[str, Any]]:
        """도메인 관계 조회"""
        relationships = []

        # 도메인별 기본 관계
        if domain == 'cost':
            relationships.append({
                'source_id': 'material_cost',
                'target_id': 'labor_cost',
                'type': 'related_to',
                'properties': {'domain': 'cost', 'category': '4m2e'},
            })
        elif domain == 'quality':
            relationships.append({
                'source_id': 'defect',
                'target_id': 'capa',
                'type': 'requires',
                'properties': {'domain': 'quality'},
            })
        elif domain == 'production':
            relationships.append({
                'source_id': 'work_order',
                'target_id': 'equipment',
                'type': 'uses',
                'properties': {'domain': 'production'},
            })

        return relationships

    def _create_or_update_node(
        self,
        node_type: str,
        name: str,
        labels: List[str],
        properties: Dict[str, Any],
        metadata: Dict[str, Any]
    ) -> Optional[OntologyNode]:
        """노드 생성 또는 업데이트"""
        try:
            # 기존 노드 확인
            existing = OntologyNode.objects.filter(
                node_type=node_type,
                name=name
            ).first()

            if existing:
                # 속성 병합
                existing.properties.update(properties)
                existing.labels = list(set(existing.labels + labels))
                existing.metadata.update(metadata)
                existing.save()
                return existing
            else:
                # 새 노드 생성
                return OntologyNode.objects.create(
                    node_type=node_type,
                    name=name,
                    labels=labels,
                    properties=properties,
                    metadata=metadata,
                )
        except Exception as e:
            logger.warning(f"노드 생성 실패: {e}")
            return None

    def _create_or_update_edge(
        self,
        source_node_id: str,
        target_node_id: str,
        relationship_type: str,
        properties: Dict[str, Any]
    ) -> Optional[OntologyEdge]:
        """엣지 생성 또는 업데이트"""
        try:
            # 노드 ID로 노드 찾기 (이름으로 대체 가능)
            source_node = self._find_node_by_id_or_name(source_node_id)
            target_node = self._find_node_by_id_or_name(target_node_id)

            if not source_node or not target_node:
                return None

            # 기존 엣지 확인
            existing = OntologyEdge.objects.filter(
                source_node=source_node,
                target_node=target_node,
                relationship_type=relationship_type
            ).first()

            weight = self._calculate_edge_weight_properties(properties)

            if existing:
                existing.properties.update(properties)
                existing.weight = max(existing.weight, weight)
                existing.save()
                return existing
            else:
                return OntologyEdge.objects.create(
                    source_node=source_node,
                    target_node=target_node,
                    relationship_type=relationship_type,
                    properties=properties,
                    weight=weight,
                )
        except Exception as e:
            logger.warning(f"엣지 생성 실패: {e}")
            return None

    def _find_node_by_id_or_name(self, identifier: str) -> Optional[OntologyNode]:
        """ID 또는 이름으로 노드 찾기"""
        try:
            # UUID 형식 확인
            try:
                uuid.UUID(identifier)
                return OntologyNode.objects.get(node_id=identifier)
            except (ValueError, OntologyNode.DoesNotExist):
                pass

            # 이름으로 찾기
            return OntologyNode.objects.filter(name=identifier).first()
        except Exception:
            return None

    def _find_or_create_node_by_name(self, name: str) -> Optional[OntologyNode]:
        """이름으로 노드 찾기 또는 생성"""
        node = OntologyNode.objects.filter(name=name).first()
        if not node:
            node = OntologyNode.objects.create(
                node_type='entity',
                name=name,
                labels=['auto_created'],
                properties={},
                metadata={},
            )
        return node

    def _calculate_edge_weight(self, edge: OntologyEdge) -> float:
        """엣지 가중치 계산"""
        base_weight = 1.0

        # 관계 유형별 가중치
        type_weights = {
            'triggered': 0.9,
            'detected_by': 0.8,
            'has_agent': 0.7,
            'requires': 0.9,
            'uses': 0.6,
            'related_to': 0.5,
            'similar_to': 0.4,
        }

        base_weight = type_weights.get(edge.relationship_type, base_weight)

        # 접근 빈도 고려 (엣지 속성에서)
        access_count = edge.properties.get('access_count', 0)
        base_weight += min(access_count * 0.1, 0.5)

        return round(min(base_weight, 1.0), 2)

    def _calculate_edge_weight_properties(self, properties: Dict[str, Any]) -> float:
        """속성 기반 엣지 가중치 계산"""
        base_weight = 0.5

        # 신뢰도가 있으면 반영
        if 'confidence' in properties:
            base_weight = max(base_weight, float(properties['confidence']))

        # 빈도가 있으면 반영
        if 'frequency' in properties:
            base_weight += min(float(properties['frequency']) * 0.1, 0.3)

        return round(min(base_weight, 1.0), 2)


# 헬퍼 함수
def update_knowledge_from_run(run_id: str) -> Dict[str, Any]:
    """실행에서 지식 업데이트 헬퍼 함수"""
    from ai.agents.learning.knowledge_update_agent import KnowledgeUpdateAgent
    from ai.agents.base.agent import AgentInput

    agent = KnowledgeUpdateAgent()
    input_data = AgentInput(
        context={'update_type': 'nodes'},
        parameters={'run_id': run_id}
    )
    output = agent.run(input_data)
    return output.data


def sync_knowledge_graph(domain: Optional[str] = None) -> Dict[str, Any]:
    """지식 그래프 동기화 헬퍼 함수"""
    from ai.agents.learning.knowledge_update_agent import KnowledgeUpdateAgent
    from ai.agents.base.agent import AgentInput

    agent = KnowledgeUpdateAgent()
    input_data = AgentInput(
        context={'update_type': 'sync'},
        parameters={'domain': domain}
    )
    output = agent.run(input_data)
    return output.data
