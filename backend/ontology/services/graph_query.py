# -*- coding: utf-8 -*-
"""
NetworkX 그래프 쿼리 서비스
경로 찾기, 중심성 분석, 하위 그래프 추출
"""
import logging
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx

logger = logging.getLogger(__name__)


class GraphQueryService:
    """NetworkX 그래프 쿼리 서비스"""
    
    def __init__(self, graph: nx.DiGraph):
        self.graph = graph
    
    def find_shortest_path(
        self,
        source: str,
        target: str,
        weight: Optional[str] = None
    ) -> Optional[List[str]]:
        """
        최단 경로 찾기
        
        Args:
            source: 시작 노드 ID
            target: 목표 노드 ID
            weight: 가중치 속성명 (None = 비가중치)
            
        Returns:
            노드 ID 목록 또는 None
        """
        try:
            if weight:
                path = nx.shortest_path(self.graph, source, target, weight=weight)
            else:
                path = nx.shortest_path(self.graph, source, target)
            return path
        except nx.NetworkXNoPath:
            return None
        except Exception as e:
            logger.error(f'최단 경로 찾기 실패: {e}')
            return None
    
    def find_all_paths(
        self,
        source: str,
        target: str,
        max_length: int = 5
    ) -> List[List[str]]:
        """
        모든 경로 찾기 (길이 제한)
        
        Args:
            source: 시작 노드 ID
            target: 목표 노드 ID
            max_length: 최대 경로 길이
            
        Returns:
            경로 목록
        """
        try:
            paths = list(nx.all_simple_paths(
                self.graph,
                source,
                target,
                cutoff=max_length
            ))
            return paths
        except Exception as e:
            logger.error(f'모든 경로 찾기 실패: {e}')
            return []
    
    def get_neighbors(
        self,
        node_id: str,
        direction: str = 'out',
        depth: int = 1
    ) -> List[Dict[str, Any]]:
        """
        이웃 노드 조회
        
        Args:
            node_id: 중심 노드 ID
            direction: 'out'(나가는), 'in'(들어오는), 'both'(양방향)
            depth: 탐색 깊이
            
        Returns:
            이웃 노드 정보 목록
        """
        neighbors = []
        
        if direction == 'out':
            edges = self.graph.out_edges(node_id)
        elif direction == 'in':
            edges = self.graph.in_edges(node_id)
        else:  # both
            edges = self.graph.edges(node_id)
        
        for source, target in edges:
            neighbor_id = target if direction == 'out' else source
            edge_data = self.graph.edges[source, target]
            
            neighbors.append({
                'node_id': neighbor_id,
                'direction': direction,
                'edge_data': edge_data,
            })
        
        return neighbors
    
    def calculate_centrality(
        self,
        method: str = 'degree',
        top_n: int = 10
    ) -> Dict[str, float]:
        """
        중심성 계산
        
        Args:
            method: 중심성 방법 ('degree', 'betweenness', 'closeness', 'pagerank')
            top_n: 상위 N개
            
        Returns:
            {노드 ID: 중심성 값} 딕셔너리
        """
        try:
            if method == 'degree':
                centrality = nx.degree_centrality(self.graph)
            elif method == 'betweenness':
                centrality = nx.betweenness_centrality(self.graph)
            elif method == 'closeness':
                centrality = nx.closeness_centrality(self.graph)
            elif method == 'pagerank':
                centrality = nx.pagerank(self.graph)
            else:
                logger.warning(f'지원하지 않는 중심성 방법: {method}')
                return {}
            
            # 상위 N개 반환
            sorted_nodes = sorted(
                centrality.items(),
                key=lambda x: x[1],
                reverse=True
            )[:top_n]
            
            return dict(sorted_nodes)
            
        except Exception as e:
            logger.error(f'중심성 계산 실패: {e}')
            return {}
    
    def get_subgraph(
        self,
        node_ids: List[str],
        include_neighbors: bool = False
    ) -> nx.DiGraph:
        """
        하위 그래프 추출
        
        Args:
            node_ids: 포함할 노드 ID 목록
            include_neighbors: 이웃 노드 포함 여부
            
        Returns:
            하위 그래프
        """
        if include_neighbors:
            # 이웃 노드 포함
            nodes_to_include = set(node_ids)
            for node_id in node_ids:
                nodes_to_include.update(self.graph.neighbors(node_id))
                nodes_to_include.update(self.graph.predecessors(node_id))
            
            return self.graph.subgraph(nodes_to_include)
        else:
            return self.graph.subgraph(node_ids)
    
    def find_communities(
        self,
        method: str = 'label_propagation'
    ) -> Dict[str, List[str]]:
        """
        커뮤니티 발견 (클러스터링)
        
        Args:
            method: 클러스터링 방법
            
        Returns:
            {커뮤니티 ID: [노드 ID 목록]} 딕셔너리
        """
        try:
            if method == 'label_propagation':
                communities = nx.community.label_propagation_communities(self.graph)
            else:
                logger.warning(f'지원하지 않는 클러스터링 방법: {method}')
                return {}
            
            # 결과 정리
            result = {}
            for i, community in enumerate(communities):
                result[f'community_{i}'] = list(community)
            
            return result
            
        except Exception as e:
            logger.error(f'커뮤니티 발견 실패: {e}')
            return {}
    
    def analyze_connectivity(self) -> Dict[str, Any]:
        """그래프 연결성 분석"""
        try:
            # 강하게 연결된 컴포넌트
            is_strongly_connected = nx.is_strongly_connected(self.graph)
            
            # 약하게 연결된 컴포넌트
            is_weakly_connected = nx.is_weakly_connected(self.graph)
            
            # 강하게 연결된 컴포넌트 수
            scc_count = nx.number_strongly_connected_components(self.graph)
            
            # 약하게 연결된 컴포넌트 수
            wcc_count = nx.number_weakly_connected_components(self.graph)
            
            return {
                'is_strongly_connected': is_strongly_connected,
                'is_weakly_connected': is_weakly_connected,
                'scc_count': scc_count,
                'wcc_count': wcc_count,
            }
        except Exception as e:
            logger.error(f'연결성 분석 실패: {e}')
            return {}
