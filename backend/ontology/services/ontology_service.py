# -*- coding: utf-8 -*-
"""
Ontology Service
온톨로지 관련 비즈니스 로직 서비스

Phase 2: 지능 계층 확장
- GraphQueryService: 지식 그래프 조회 서비스
- EntityExtractionService: 텍스트에서 개체 추출
"""
import re
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from django.db.models import Q, Count, Avg, Sum, Prefetch
from django.utils import timezone
from collections import deque

from ..models import (
    OntologyCategory,
    OntologyElement,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog,
    OntologyNode,
    OntologyEdge,
)


class OntologyService:
    """온톨로지 서비스"""

    @staticmethod
    def get_category_summary() -> List[Dict[str, Any]]:
        """
        카테고리별 요약 정보 조회

        Returns:
            카테고리 요약 리스트
        """
        categories = OntologyCategory.objects.filter(is_active=True)

        summaries = []
        for category in categories:
            element_count = OntologyElement.objects.filter(
                category=category,
                is_active=True
            ).count()

            summaries.append({
                'category_code': category.code,
                'category_name': category.name_ko,
                'element_count': element_count,
                'level': category.level,
            })

        return summaries

    @staticmethod
    def get_data_flow_chain(start: str, end: str) -> List[Dict[str, Any]]:
        """
        데이터 흐름 체인 조회

        Args:
            start: 시작 카테고리 코드
            end: 끝 카테고리 코드

        Returns:
            데이터 흐름 체인
        """
        # 시작 요소 조회
        start_elements = OntologyElement.objects.filter(
            category__code=start,
            is_active=True
        )

        # 끝 요소 조회
        end_elements = OntologyElement.objects.filter(
            category__code=end,
            is_active=True
        )

        chains = []
        for start_elem in start_elements:
            for end_elem in end_elements:
                # 관계 찾기
                relations = OntologyRelation.objects.filter(
                    Q(source=start_elem, target=end_elem) |
                    Q(source=end_elem, target=start_elem),
                    is_active=True
                )

                for relation in relations:
                    chains.append({
                        'source': {
                            'code': relation.source.code,
                            'name': relation.source.name_ko,
                            'category': relation.source.category.code,
                        },
                        'target': {
                            'code': relation.target.code,
                            'name': relation.target.name_ko,
                            'category': relation.target.category.code,
                        },
                        'relation_type': relation.relation_type,
                        'strength': relation.strength,
                    })

        return chains

    @staticmethod
    def create_analysis_log(
        analysis_type: str,
        parameters: Dict[str, Any],
        requested_by: str
    ) -> OntologyAnalysisLog:
        """
        분석 로그 생성

        Args:
            analysis_type: 분석 유형
            parameters: 분석 파라미터
            requested_by: 요청자

        Returns:
            생성된 분석 로그
        """
        return OntologyAnalysisLog.objects.create(
            analysis_type=analysis_type,
            parameters=parameters,
            status='running',
            requested_by=requested_by,
            started_at=timezone.now(),
        )

    @staticmethod
    def complete_analysis_log(
        log_id: str,
        result: Dict[str, Any],
        status: str = 'completed'
    ) -> None:
        """
        분석 로그 완료

        Args:
            log_id: 로그 ID
            result: 분석 결과
            status: 상태
        """
        try:
            log = OntologyAnalysisLog.objects.get(log_id=log_id)
            log.result = result
            log.status = status
            log.completed_at = timezone.now()

            if status == 'completed':
                duration = (log.completed_at - log.started_at).total_seconds()
                log.execution_time_ms = int(duration * 1000)

            log.save()
        except OntologyAnalysisLog.DoesNotExist:
            pass

    @staticmethod
    def get_4m2e_impact_analysis(target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        4M2E 영향도 분석

        Args:
            target_date: 대상 날짜

        Returns:
            4M2E 영향도 분석 결과
        """
        # 4M2E 카테고리 코드
        m2e_categories = ['MAN', 'MACHINE', 'MATERIAL', 'METHOD',
                         'MEASUREMENT', 'ENVIRONMENT', 'INFORMATION', 'MANAGEMENT']

        analysis = {
            'target_date': target_date or date.today(),
            'categories': []
        }

        for category_code in m2e_categories:
            try:
                element = OntologyElement.objects.get(code=category_code)

                # 관련 관계 조회
                relations = OntologyRelation.objects.filter(
                    Q(source=element) | Q(target=element),
                    is_active=True
                )

                # 영향도 계산
                impact_score = sum(r.strength for r in relations) / max(relations.count(), 1)

                analysis['categories'].append({
                    'category': category_code,
                    'name': element.name_ko,
                    'impact_score': round(impact_score, 2),
                    'relation_count': relations.count(),
                })

            except OntologyElement.DoesNotExist:
                continue

        return analysis

    @staticmethod
    def trace_cost_to_esg(cost_mon: str) -> Dict[str, Any]:
        """
        원가에서 ESG로 추적

        Args:
            cost_mon: 원가 월 (YYYY-MM 형식)

        Returns:
            추적 결과
        """
        try:
            year, month = map(int, cost_mon.split('-'))
            target_date = date(year, month, 1)
        except (ValueError, AttributeError):
            target_date = date.today()

        return {
            'cost_period': cost_mon,
            'trace_chain': [
                {'stage': 'cost', 'description': '원가 분석'},
                {'stage': '4m2e', 'description': '4M2E 분류'},
                {'stage': '6m', 'description': '6M 상위 분류'},
                {'stage': 'esg', 'description': 'ESG 연결'},
            ],
            'impact_summary': {
                'environmental': 0.35,
                'social': 0.40,
                'governance': 0.25,
            }
        }

    @staticmethod
    def get_relations_graph() -> Dict[str, Any]:
        """
        관계 그래프 데이터 조회

        Returns:
            그래프 데이터
        """
        nodes = []
        edges = []

        # 노드 데이터 생성
        elements = OntologyElement.objects.filter(is_active=True).select_related('category')
        for elem in elements:
            nodes.append({
                'id': str(elem.pk),  # pk 사용 (element_id 필드가 없음)
                'code': elem.code,
                'name': elem.name_ko,
                'category': elem.category.code if elem.category else None,
                'level': elem.category.level if elem.category else 1,
            })

        # 엣지 데이터 생성
        relations = OntologyRelation.objects.filter(is_active=True).select_related(
            'source_element__category', 'target_element__category'
        )
        for rel in relations:
            edges.append({
                'source': str(rel.source_element.pk),
                'target': str(rel.target_element.pk),
                'type': rel.relation_type,
                'weight': float(rel.weight),
            })

        return {
            'nodes': nodes,
            'edges': edges,
            'node_count': len(nodes),
            'edge_count': len(edges),
        }

    @staticmethod
    def get_metrics_summary(category_code: Optional[str] = None) -> Dict[str, Any]:
        """
        메트릭 요약 조회

        Args:
            category_code: 카테고리 코드

        Returns:
            메트릭 요약
        """
        queryset = DataFlowMetrics.objects.filter(is_active=True)

        if category_code:
            queryset = queryset.filter(category__code=category_code)

        metrics = queryset.aggregate(
            total_count=Count('metric_id'),
            avg_flow_rate=Avg('flow_rate'),
            avg_quality_score=Avg('quality_score'),
            total_volume=Sum('volume'),
        )

        return {
            'category_code': category_code,
            'total_metrics': metrics['total_count'] or 0,
            'avg_flow_rate': round(metrics['avg_flow_rate'] or 0, 2),
            'avg_quality_score': round(metrics['avg_quality_score'] or 0, 2),
            'total_volume': metrics['total_volume'] or 0,
        }


# ==========================================
# Phase 2: 지능 계층 확장 서비스
# ==========================================

class GraphQueryService:
    """
    지식 그래프 조회 서비스
    OntologyNode, OntologyEdge 기반 복잡한 그래프 쿼리 수행
    """

    @staticmethod
    def query_affects(node_id: uuid.UUID, depth: int = 2) -> Dict[str, Any]:
        """
        AFFECTS 관계 조회: 지정된 노드가 영향을 미치는 모든 노드 탐색

        Args:
            node_id: 시작 노드 ID
            depth: 탐색 깊이 (기본값: 2)

        Returns:
            영향 관계 그래프 데이터
        """
        visited = set()
        result_edges = []
        result_nodes = {}

        try:
            start_node = OntologyNode.objects.get(node_id=node_id)
            result_nodes[str(node_id)] = {
                'id': str(start_node.node_id),
                'name': start_node.name,
                'type': start_node.node_type,
                'category': start_node.category,
            }
        except OntologyNode.DoesNotExist:
            return {'nodes': [], 'edges': [], 'error': 'Start node not found'}

        queue = deque([(node_id, 0)])

        while queue:
            current_id, current_depth = queue.popleft()

            if current_depth >= depth or current_id in visited:
                continue

            visited.add(current_id)

            # AFFECTS 관계 (causal, transformation, dependency)
            edges = OntologyEdge.objects.filter(
                source_node_id=current_id,
                relationship_type__in=['causal', 'transformation', 'dependency'],
                is_active=True
            ).select_related('target_node')

            for edge in edges:
                target_id = str(edge.target_node.node_id)

                if target_id not in result_nodes:
                    result_nodes[target_id] = {
                        'id': target_id,
                        'name': edge.target_node.name,
                        'type': edge.target_node.node_type,
                        'category': edge.target_node.category,
                    }

                result_edges.append({
                    'source': str(edge.source_node.node_id),
                    'target': target_id,
                    'type': edge.relationship_type,
                    'weight': edge.weight,
                    'confidence': edge.confidence,
                })

                if target_id not in visited:
                    queue.append((uuid.UUID(target_id), current_depth + 1))

        return {
            'nodes': list(result_nodes.values()),
            'edges': result_edges,
            'start_node': str(node_id),
            'depth': depth,
            'node_count': len(result_nodes),
            'edge_count': len(result_edges),
        }

    @staticmethod
    def query_caused_by(node_id: uuid.UUID, depth: int = 2) -> Dict[str, Any]:
        """
        CAUSED_BY 관계 조회: 지정된 노드에 영향을 미치는 원인 노드 탐색

        Args:
            node_id: 대상 노드 ID
            depth: 탐색 깊이 (기본값: 2)

        Returns:
            원인 관계 그래프 데이터
        """
        visited = set()
        result_edges = []
        result_nodes = {}

        try:
            end_node = OntologyNode.objects.get(node_id=node_id)
            result_nodes[str(node_id)] = {
                'id': str(end_node.node_id),
                'name': end_node.name,
                'type': end_node.node_type,
                'category': end_node.category,
            }
        except OntologyNode.DoesNotExist:
            return {'nodes': [], 'edges': [], 'error': 'Target node not found'}

        queue = deque([(node_id, 0)])

        while queue:
            current_id, current_depth = queue.popleft()

            if current_depth >= depth or current_id in visited:
                continue

            visited.add(current_id)

            # CAUSED_BY 관계 (incoming edges)
            edges = OntologyEdge.objects.filter(
                target_node_id=current_id,
                relationship_type__in=['causal', 'transformation', 'dependency'],
                is_active=True
            ).select_related('source_node')

            for edge in edges:
                source_id = str(edge.source_node.node_id)

                if source_id not in result_nodes:
                    result_nodes[source_id] = {
                        'id': source_id,
                        'name': edge.source_node.name,
                        'type': edge.source_node.node_type,
                        'category': edge.source_node.category,
                    }

                result_edges.append({
                    'source': source_id,
                    'target': str(edge.target_node.node_id),
                    'type': edge.relationship_type,
                    'weight': edge.weight,
                    'confidence': edge.confidence,
                })

                if source_id not in visited:
                    queue.append((uuid.UUID(source_id), current_depth + 1))

        return {
            'nodes': list(result_nodes.values()),
            'edges': result_edges,
            'end_node': str(node_id),
            'depth': depth,
            'node_count': len(result_nodes),
            'edge_count': len(result_edges),
        }

    @staticmethod
    def query_connected_to(node_id: uuid.UUID, relationship_type: Optional[str] = None) -> Dict[str, Any]:
        """
        CONNECTED_TO 관계 조회: 지정된 노드와 연결된 모든 노드 탐색

        Args:
            node_id: 중심 노드 ID
            relationship_type: 필터링할 관계 유형 (None이면 모든 관계)

        Returns:
            연결 관계 그래프 데이터
        """
        try:
            center_node = OntologyNode.objects.get(node_id=node_id)
        except OntologyNode.DoesNotExist:
            return {'nodes': [], 'edges': [], 'error': 'Center node not found'}

        nodes = {
            str(node_id): {
                'id': str(center_node.node_id),
                'name': center_node.name,
                'type': center_node.node_type,
                'category': center_node.category,
            }
        }

        edges = []

        # Outgoing edges
        outgoing_query = OntologyEdge.objects.filter(
            source_node_id=node_id,
            is_active=True
        )
        if relationship_type:
            outgoing_query = outgoing_query.filter(relationship_type=relationship_type)

        for edge in outgoing_query.select_related('target_node'):
            target_id = str(edge.target_node.node_id)
            if target_id not in nodes:
                nodes[target_id] = {
                    'id': target_id,
                    'name': edge.target_node.name,
                    'type': edge.target_node.node_type,
                    'category': edge.target_node.category,
                }

            edges.append({
                'source': str(edge.source_node.node_id),
                'target': target_id,
                'type': edge.relationship_type,
                'weight': edge.weight,
                'confidence': edge.confidence,
            })

        # Incoming edges
        incoming_query = OntologyEdge.objects.filter(
            target_node_id=node_id,
            is_active=True
        )
        if relationship_type:
            incoming_query = incoming_query.filter(relationship_type=relationship_type)

        for edge in incoming_query.select_related('source_node'):
            source_id = str(edge.source_node.node_id)
            if source_id not in nodes:
                nodes[source_id] = {
                    'id': source_id,
                    'name': edge.source_node.name,
                    'type': edge.source_node.node_type,
                    'category': edge.source_node.category,
                }

            edges.append({
                'source': source_id,
                'target': str(edge.target_node.node_id),
                'type': edge.relationship_type,
                'weight': edge.weight,
                'confidence': edge.confidence,
            })

        return {
            'nodes': list(nodes.values()),
            'edges': edges,
            'center_node': str(node_id),
            'relationship_type': relationship_type,
            'node_count': len(nodes),
            'edge_count': len(edges),
        }

    @staticmethod
    def find_shortest_path(start_id: uuid.UUID, end_id: uuid.UUID) -> Dict[str, Any]:
        """
        두 노드 간의 최단 경로 찾기 (BFS)

        Args:
            start_id: 시작 노드 ID
            end_id: 끝 노드 ID

        Returns:
            최단 경로 데이터
        """
        # 경로 추적을 위한 parent 맵
        parent = {}
        visited = set()

        queue = deque([start_id])
        visited.add(start_id)

        while queue:
            current_id = queue.popleft()

            if current_id == end_id:
                # 경로 재구성
                path = []
                node_id = end_id

                while node_id != start_id:
                    path.append(node_id)
                    node_id = parent[node_id]

                path.append(start_id)
                path.reverse()

                # 노드 상세 정보 조회
                nodes = {}
                edges = []

                for i, nid in enumerate(path):
                    node = OntologyNode.objects.get(node_id=nid)
                    nodes[str(nid)] = {
                        'id': str(node.node_id),
                        'name': node.name,
                        'type': node.node_type,
                        'category': node.category,
                    }

                    if i > 0:
                        # 엣지 조회
                        edge = OntologyEdge.objects.filter(
                            source_node_id=path[i-1],
                            target_node_id=nid,
                            is_active=True
                        ).first()

                        if edge:
                            edges.append({
                                'source': str(edge.source_node.node_id),
                                'target': str(edge.target_node.node_id),
                                'type': edge.relationship_type,
                                'weight': edge.weight,
                            })

                return {
                    'path': [str(p) for p in path],
                    'nodes': list(nodes.values()),
                    'edges': edges,
                    'path_length': len(path),
                    'success': True,
                }

            # 인접 노드 탐색
            for edge in OntologyEdge.objects.filter(
                Q(source_node_id=current_id) | Q(target_node_id=current_id),
                is_active=True
            ):
                neighbor_id = edge.target_node.node_id if edge.source_node.node_id == current_id else edge.source_node.node_id

                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    parent[neighbor_id] = current_id
                    queue.append(neighbor_id)

        return {
            'success': False,
            'error': 'No path found between nodes',
        }

    @staticmethod
    def query_by_criteria(
        node_type: Optional[str] = None,
        category: Optional[str] = None,
        labels: Optional[List[str]] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        조건별 노드 조회

        Args:
            node_type: 노드 유형 필터
            category: 카테고리 필터
            labels: 레이블 필터 (OR 조건)
            limit: 최대 결과 수

        Returns:
            조건에 맞는 노드 목록
        """
        queryset = OntologyNode.objects.filter(is_active=True)

        if node_type:
            queryset = queryset.filter(node_type=node_type)

        if category:
            queryset = queryset.filter(category=category)

        if labels:
            # labels는 JSON 배열이므로 JSON 필터 사용
            for label in labels:
                queryset = queryset.filter(labels__contains=[label])

        nodes = queryset[:limit]

        return {
            'nodes': [
                {
                    'id': str(node.node_id),
                    'name': node.name,
                    'type': node.node_type,
                    'category': node.category,
                    'labels': node.labels,
                    'properties': node.properties,
                }
                for node in nodes
            ],
            'count': nodes.count() if hasattr(nodes, 'count') else len(list(nodes)),
        }


class EntityExtractionService:
    """
    개체 추출 서비스
    텍스트에서 온톨로지 개체와 관계를 추출
    """

    # 온톨로지 관련 키워드 패턴
    PATTERNS = {
        '4M2E': {
            'MAN': r'(?:작업자|운영원|담당자|사원)',
            'MACHINE': r'(?:설비|기계|장치|로봇)',
            'MATERIAL': r'(?:원자재|자재|부품|소재)',
            'METHOD': r'(?:공정|프로세스|방법|절차)',
            'MEASUREMENT': r'(?:측정|검사|품질|계측)',
            'ENVIRONMENT': r'(?:환경|온도|습도|청정도)',
        },
        'COST': {
            'DIRECT_MATERIAL': r'(?:직접재료비|재료비)',
            'DIRECT_LABOR': r'(?:직접노무비|노무비)',
            'OVERHEAD': r'(?:간접비|제조간접비)',
        },
        'KPI': r'(?:생산성|수율|가동률|불량률|재고회전율)',
    }

    @staticmethod
    def extract_entities(text: str) -> List[Dict[str, Any]]:
        """
        텍스트에서 개체 추출

        Args:
            text: 분석할 텍스트

        Returns:
            추출된 개체 목록
        """
        entities = []

        # 기존 온톨로지 요소와 매칭
        ontology_elements = OntologyElement.objects.filter(is_active=True)

        for element in ontology_elements:
            # 이름 검색
            if element.name_ko in text:
                entities.append({
                    'text': element.name_ko,
                    'type': 'ontology_element',
                    'category': element.category.code,
                    'code': element.code,
                    'confidence': 0.9,
                })

            # 코드 검색
            if element.code in text:
                entities.append({
                    'text': element.code,
                    'type': 'ontology_element',
                    'category': element.category.code,
                    'code': element.code,
                    'confidence': 0.95,
                })

        # 패턴 기반 추출
        for category, patterns in EntityExtractionService.PATTERNS.items():
            if category == 'KPI':
                matches = re.finditer(patterns, text)
                for match in matches:
                    entities.append({
                        'text': match.group(),
                        'type': 'kpi',
                        'category': 'KPI',
                        'confidence': 0.7,
                    })
            else:
                for sub_type, pattern in patterns.items():
                    matches = re.finditer(pattern, text)
                    for match in matches:
                        entities.append({
                            'text': match.group(),
                            'type': '4m2e_element',
                            'category': category,
                            'sub_type': sub_type,
                            'confidence': 0.75,
                        })

        return entities

    @staticmethod
    def extract_relations(text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        텍스트에서 개체 간 관계 추출

        Args:
            text: 분석할 텍스트
            entities: 추출된 개체 목록

        Returns:
            추출된 관계 목록
        """
        relations = []

        # 관계 키워드 패턴
        relation_patterns = {
            'causal': [r'(?:때문에|원인으로|영향을|결과로)'],
            'transformation': [r'(?:변환되어|처리되어|가공되어)'],
            'dependency': [r'(?:의존하여|기반으로|연계되어)'],
            'association': [r'(?:관련된|연결된)'],
        }

        sentences = re.split(r'[.!?]+', text)

        for sentence in sentences:
            sentence_entities = [
                e for e in entities
                if e['text'] in sentence
            ]

            # 문장 내에서 개체 쌍 찾기
            for i, e1 in enumerate(sentence_entities):
                for e2 in sentence_entities[i+1:]:
                    # 관계 유형 추정
                    relation_type = None
                    confidence = 0.5

                    for rel_type, patterns in relation_patterns.items():
                        for pattern in patterns:
                            if re.search(pattern, sentence):
                                relation_type = rel_type
                                confidence = 0.7
                                break
                        if relation_type:
                            break

                    if relation_type:
                        relations.append({
                            'source': e1['text'],
                            'target': e2['text'],
                            'type': relation_type,
                            'confidence': confidence,
                            'context': sentence.strip(),
                        })

        return relations

    @staticmethod
    def suggest_nodes(text: str) -> List[Dict[str, Any]]:
        """
        텍스트를 분석하여 새로운 노드 생성 제안

        Args:
            text: 분석할 텍스트

        Returns:
            생성 제안 노드 목록
        """
        entities = EntityExtractionService.extract_entities(text)
        suggestions = []

        for entity in entities:
            # 기존 노드 확인
            existing = OntologyNode.objects.filter(
                name=entity['text']
            ).first()

            if not existing and entity['confidence'] > 0.7:
                suggestions.append({
                    'name': entity['text'],
                    'node_type': 'entity',
                    'category': entity.get('category', 'general'),
                    'suggested_labels': [entity['type']],
                    'confidence': entity['confidence'],
                    'reason': f'"{entity["text"]}" 발견 (신뢰도: {entity["confidence"]})',
                })

        return suggestions
