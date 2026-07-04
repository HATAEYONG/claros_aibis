# -*- coding: utf-8 -*-
"""
NetworkX 기반 지식 그래프 빌더
"""
import logging
from typing import Dict, List, Any, Optional
import networkx as nx
from datetime import datetime

from ontology.models import OntologyNode, OntologyEdge

logger = logging.getLogger(__name__)


class GraphBuilder:
    """NetworkX 기반 지식 그래프 빌더"""
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self._built_at = None
        self._node_count = 0
        self._edge_count = 0
    
    def build_from_db(
        self,
        node_types=None,
        relationship_types=None,
        category=None
    ):
        """데이터베이스로부터 그래프 빌드"""
        self.graph = nx.DiGraph()
        
        # 노드 로드
        nodes_queryset = OntologyNode.objects.filter(is_active=True)
        
        if node_types:
            nodes_queryset = nodes_queryset.filter(node_type__in=node_types)
        
        if category:
            nodes_queryset = nodes_queryset.filter(category=category)
        
        nodes = nodes_queryset.all()
        
        for node in nodes:
            self.graph.add_node(
                str(node.node_id),
                node_type=node.node_type,
                name=node.name,
                code=node.code or '',
                category=node.category or '',
                labels=node.labels or [],
                properties=node.properties or {},
                metadata=node.metadata or {},
                created_at=node.created_at.isoformat() if node.created_at else None,
            )
        
        self._node_count = len(nodes)
        
        # 엣지 로드
        edges_queryset = OntologyEdge.objects.filter(is_active=True)
        
        if relationship_types:
            edges_queryset = edges_queryset.filter(relationship_type__in=relationship_types)
        
        edges = edges_queryset.select_related('source_node', 'target_node').all()
        
        for edge in edges:
            source_id = str(edge.source_node.node_id)
            target_id = str(edge.target_node.node_id)
            
            if self.graph.has_node(source_id) and self.graph.has_node(target_id):
                self.graph.add_edge(
                    source_id,
                    target_id,
                    edge_id=str(edge.edge_id),
                    relationship_type=edge.relationship_type,
                    weight=edge.weight,
                    confidence=edge.confidence,
                    properties=edge.properties or {},
                    metadata=edge.metadata or {},
                    created_at=edge.created_at.isoformat() if edge.created_at else None,
                )
        
        self._edge_count = len(self.graph.edges)
        self._built_at = datetime.now()
        
        logger.info(f'그래프 빌드 완료: {self._node_count} 노드, {self._edge_count} 엣지')
        
        return self.graph
    
    def get_graph(self):
        """현재 그래프 반환"""
        return self.graph
    
    def get_graph_stats(self):
        """그래프 통계 정보 반환"""
        return {
            'node_count': self.graph.number_of_nodes(),
            'edge_count': self.graph.number_of_edges(),
            'density': nx.density(self.graph),
            'is_directed': self.graph.is_directed(),
            'is_multigraph': self.graph.is_multigraph(),
            'built_at': self._built_at.isoformat() if self._built_at else None,
        }
