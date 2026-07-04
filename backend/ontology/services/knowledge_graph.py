# -*- coding: utf-8 -*-
"""
지식 그래프 서비스
온톨로지 기반 지식 그래프 고수준 API
"""
import logging
from typing import Dict, List, Any, Optional
import networkx as nx

from ontology.models import OntologyNode, OntologyEdge
from .graph_builder import GraphBuilder
from .graph_query import GraphQueryService

logger = logging.getLogger(__name__)


class KnowledgeGraphService:
    """지식 그래프 서비스"""
    
    def __init__(self):
        self.builder = GraphBuilder()
        self.query_service = None
        self._current_graph = None
    
    def build_and_query(
        self,
        node_types: Optional[List[str]] = None,
        relationship_types: Optional[List[str]] = None,
        category: Optional[str] = None
    ) -> GraphQueryService:
        """
        그래프 빌드 및 쿼리 서비스 반환
        
        Args:
            node_types: 포함할 노드 유형
            relationship_types: 포함할 관계 유형
            category: 필터링할 카테고리
            
        Returns:
            GraphQueryService 인스턴스
        """
        # 그래프 빌드
        self._current_graph = self.builder.build_from_db(
            node_types=node_types,
            relationship_types=relationship_types,
            category=category
        )
        
        # 쿼리 서비스 초기화
        self.query_service = GraphQueryService(self._current_graph)
        
        return self.query_service
    
    def get_node_by_name(self, name: str) -> Optional[OntologyNode]:
        """이름으로 노드 조회"""
        try:
            return OntologyNode.objects.filter(
                name__icontains=name,
                is_active=True
            ).first()
        except Exception as e:
            logger.error(f'노드 조회 실패: {e}')
            return None
    
    def get_nodes_by_type(self, node_type: str) -> List[OntologyNode]:
        """유형별 노드 조회"""
        try:
            return list(OntologyNode.objects.filter(
                node_type=node_type,
                is_active=True
            ))
        except Exception as e:
            logger.error(f'노드 조회 실패: {e}')
            return []
    
    def get_nodes_by_category(self, category: str) -> List[OntologyNode]:
        """카테고리별 노드 조회"""
        try:
            return list(OntologyNode.objects.filter(
                category=category,
                is_active=True
            ))
        except Exception as e:
            logger.error(f'노드 조회 실패: {e}')
            return []
    
    def search_nodes(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        노드 검색
        
        Args:
            query: 검색어
            limit: 반환 건수
            
        Returns:
            노드 정보 목록
        """
        try:
            nodes = OntologyNode.objects.filter(
                name__icontains=query,
                is_active=True
            )[:limit]
            
            return [
                {
                    'node_id': str(node.node_id),
                    'node_type': node.node_type,
                    'name': node.name,
                    'code': node.code or '',
                    'category': node.category or '',
                    'labels': node.labels or [],
                    'properties': node.properties or {},
                }
                for node in nodes
            ]
        except Exception as e:
            logger.error(f'노드 검색 실패: {e}')
            return []
    
    def get_graph_statistics(self) -> Dict[str, Any]:
        """지식 그래프 통계"""
        try:
            # 노드/엣지 수
            node_count = OntologyNode.objects.filter(is_active=True).count()
            edge_count = OntologyEdge.objects.filter(is_active=True).count()
            
            # 노드 유형별 분포
            from django.db.models import Count
            node_types = OntologyNode.objects.filter(
                is_active=True
            ).values('node_type').annotate(
                count=Count('node_id')
            )
            
            # 관계 유형별 분포
            edge_types = OntologyEdge.objects.filter(
                is_active=True
            ).values('relationship_type').annotate(
                count=Count('edge_id')
            )
            
            return {
                'total_nodes': node_count,
                'total_edges': edge_count,
                'node_types': list(node_types),
                'edge_types': list(edge_types),
            }
        except Exception as e:
            logger.error(f'그래프 통계 조회 실패: {e}')
            return {}
