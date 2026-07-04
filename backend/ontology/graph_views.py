# -*- coding: utf-8 -*-
"""
지식 그래프 API 뷰
NetworkX 기반 지식 그래프 쿼리 및 분석 API
"""
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from typing import Dict, Any, List
import logging

from ontology.models import OntologyNode, OntologyEdge
from ontology.services.graph_builder import graph_builder
from ontology.services.graph_query import GraphQueryService

logger = logging.getLogger(__name__)


class KnowledgeGraphQueryView(APIView):
    """지식 그래프 쿼리 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        그래프 쿼리 실행

        Request Body:
        {
            "query_type": "path|neighbors|subgraph|centrality|impact|communities",
            "params": {...}
        }
        """
        query_type = request.data.get('query_type')
        params = request.data.get('params', {})

        if not query_type:
            return Response(
                {'error': 'query_type 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if query_type == 'path':
                result = self._query_path(params)
            elif query_type == 'neighbors':
                result = self._query_neighbors(params)
            elif query_type == 'subgraph':
                result = self._query_subgraph(params)
            elif query_type == 'centrality':
                result = self._query_centrality(params)
            elif query_type == 'impact':
                result = self._query_impact(params)
            elif query_type == 'communities':
                result = self._query_communities(params)
            elif query_type == 'node':
                result = self._query_node(params)
            else:
                return Response(
                    {'error': f'지원하지 않는 쿼리 유형: {query_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'status': 'success',
                'query_type': query_type,
                'data': result
            })

        except Exception as e:
            logger.exception(f'그래프 쿼리 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _query_node(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """노드 조회"""
        node_id = params.get('node_id')

        if not node_id:
            raise ValueError('node_id 파라미터가 필요합니다.')

        node_data = GraphQueryService.get_node(node_id)

        if not node_data:
            raise ValueError(f'노드를 찾을 수 없습니다: {node_id}')

        # 이웃 노드 포함
        include_neighbors = params.get('include_neighbors', False)
        if include_neighbors:
            neighbor_depth = params.get('neighbor_depth', 1)
            neighbors = GraphQueryService.get_neighbors(
                node_id, depth=neighbor_depth, direction='both'
            )
            node_data['neighbors'] = neighbors

        return node_data

    def _query_path(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """경로 찾기"""
        source_id = params.get('source_id')
        target_id = params.get('target_id')
        method = params.get('method', 'shortest')

        if not source_id or not target_id:
            raise ValueError('source_id와 target_id 파라미터가 필요합니다.')

        paths = GraphQueryService.find_path(source_id, target_id, method)

        if not paths:
            raise ValueError(f'경로를 찾을 수 없습니다: {source_id} → {target_id}')

        return paths

    def _query_neighbors(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """이웃 노드 조회"""
        node_id = params.get('node_id')
        depth = params.get('depth', 1)
        direction = params.get('direction', 'both')

        if not node_id:
            raise ValueError('node_id 파라미터가 필요합니다.')

        neighbors = GraphQueryService.get_neighbors(node_id, depth, direction)

        if not neighbors:
            raise ValueError(f'노드를 찾을 수 없거나 이웃이 없습니다: {node_id}')

        return neighbors

    def _query_subgraph(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """하위 그래프 추출"""
        node_ids = params.get('node_ids', [])
        include_neighbors = params.get('include_neighbors', False)
        neighbor_depth = params.get('neighbor_depth', 1)

        if not node_ids:
            raise ValueError('node_ids 파라미터가 필요합니다.')

        subgraph = GraphQueryService.get_subgraph(
            node_ids, include_neighbors, neighbor_depth
        )

        if subgraph['statistics']['node_count'] == 0:
            raise ValueError('하위 그래프를 생성할 수 없습니다.')

        return subgraph

    def _query_centrality(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """중심성 분석"""
        node_id = params.get('node_id')
        limit = params.get('limit', 10)

        centrality = GraphQueryService.get_centrality_measures(node_id, limit)

        if not centrality:
            raise ValueError('중심성 데이터를 찾을 수 없습니다.')

        return centrality

    def _query_impact(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """영향도 분석"""
        node_id = params.get('node_id')
        direction = params.get('direction', 'downstream')

        if not node_id:
            raise ValueError('node_id 파라미터가 필요합니다.')

        impact_nodes = GraphQueryService.get_impact_analysis(node_id, direction)

        if not impact_nodes:
            raise ValueError(f'영향도 분석 결과가 없습니다: {node_id}')

        return impact_nodes

    def _query_communities(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """커뮤니티 탐지"""
        method = params.get('method', 'louvain')

        communities = GraphQueryService.find_communities(method)

        if not communities:
            raise ValueError('커뮤니티를 찾을 수 없습니다.')

        return communities


class KnowledgeGraphStatsView(APIView):
    """지식 그래프 통계 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """그래프 통계 정보 반환"""
        try:
            stats = graph_builder.get_statistics()

            # 추가 통계 정보
            graph = graph_builder.graph

            # 노드 유형별 분포
            node_type_distribution = {}
            for node_id, node_data in graph.nodes(data=True):
                node_type = node_data.get('node_type', 'unknown')
                node_type_distribution[node_type] = node_type_distribution.get(node_type, 0) + 1

            # 관계 유형별 분포
            edge_type_distribution = {}
            for u, v, edge_data in graph.edges(data=True):
                rel_type = edge_data.get('relationship_type', 'unknown')
                edge_type_distribution[rel_type] = edge_type_distribution.get(rel_type, 0) + 1

            stats['node_type_distribution'] = node_type_distribution
            stats['edge_type_distribution'] = edge_type_distribution

            return Response({
                'status': 'success',
                'data': stats
            })

        except Exception as e:
            logger.exception(f'그래프 통계 조회 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class KnowledgeGraphRebuildView(APIView):
    """지식 그래프 재구축 뷰"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """그래프 재구축"""
        try:
            clear_existing = request.data.get('clear_existing', True)
            stats = graph_builder.build_from_db(clear_existing=clear_existing)

            return Response({
                'status': 'success',
                'message': '그래프 재구축 완료',
                'data': stats
            })

        except Exception as e:
            logger.exception(f'그래프 재구축 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OntologyNodeViewSetView(APIView):
    """온톨로지 노드 관리 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """노드 목록 조회"""
        try:
            nodes = OntologyNode.objects.filter(is_active=True)

            # 필터링
            node_type = request.query_params.get('node_type')
            category = request.query_params.get('category')
            search = request.query_params.get('search')

            if node_type:
                nodes = nodes.filter(node_type=node_type)
            if category:
                nodes = nodes.filter(category=category)
            if search:
                from django.db.models import Q
                nodes = nodes.filter(
                    Q(name__icontains=search) | Q(code__icontains=search)
                )

            node_list = []
            for node in nodes:
                node_list.append({
                    'node_id': str(node.node_id),
                    'node_type': node.node_type,
                    'name': node.name,
                    'code': node.code,
                    'category': node.category,
                    'labels': node.labels,
                    'properties': node.properties,
                    'created_at': node.created_at.isoformat() if node.created_at else None,
                })

            return Response({
                'status': 'success',
                'count': len(node_list),
                'data': node_list
            })

        except Exception as e:
            logger.exception(f'노드 목록 조회 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """새 노드 생성"""
        try:
            from ontology.serializers import OntologyNodeSerializer

            serializer = OntologyNodeSerializer(data=request.data)
            if serializer.is_valid():
                node = serializer.save()

                # 그래프에 추가
                graph_builder.add_node(node)

                return Response({
                    'status': 'success',
                    'message': '노드 생성 완료',
                    'data': {
                        'node_id': str(node.node_id),
                        'name': node.name,
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': '유효하지 않은 데이터',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f'노드 생성 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OntologyEdgeViewSetView(APIView):
    """온톨로지 엣지 관리 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """엣지 목록 조회"""
        try:
            edges = OntologyEdge.objects.filter(is_active=True)

            # 필터링
            source_id = request.query_params.get('source_id')
            target_id = request.query_params.get('target_id')
            relationship_type = request.query_params.get('relationship_type')

            if source_id:
                edges = edges.filter(source_node__node_id=source_id)
            if target_id:
                edges = edges.filter(target_node__node_id=target_id)
            if relationship_type:
                edges = edges.filter(relationship_type=relationship_type)

            edge_list = []
            for edge in edges:
                edge_list.append({
                    'edge_id': str(edge.edge_id),
                    'source_node_id': str(edge.source_node.node_id),
                    'target_node_id': str(edge.target_node.node_id),
                    'relationship_type': edge.relationship_type,
                    'weight': edge.weight,
                    'confidence': edge.confidence,
                    'properties': edge.properties,
                    'created_at': edge.created_at.isoformat() if edge.created_at else None,
                })

            return Response({
                'status': 'success',
                'count': len(edge_list),
                'data': edge_list
            })

        except Exception as e:
            logger.exception(f'엣지 목록 조회 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """새 엣지 생성"""
        try:
            from ontology.serializers import OntologyEdgeSerializer

            serializer = OntologyEdgeSerializer(data=request.data)
            if serializer.is_valid():
                edge = serializer.save()

                # 그래프에 추가
                graph_builder.add_edge(edge)

                return Response({
                    'status': 'success',
                    'message': '엣지 생성 완료',
                    'data': {
                        'edge_id': str(edge.edge_id),
                        'source_node': str(edge.source_node.node_id),
                        'target_node': str(edge.target_node.node_id),
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': '유효하지 않은 데이터',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f'엣지 생성 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GraphSearchView(APIView):
    """그래프 검색 뷰"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """그래프 내 노드/엣지 검색"""
        try:
            search_term = request.query_params.get('term', '')
            search_type = request.query_params.get('type', 'node')  # node, edge, all

            if not search_term:
                return Response({
                    'error': 'term 파라미터가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)

            results = {
                'nodes': [],
                'edges': []
            }

            graph = graph_builder.graph

            # 노드 검색
            if search_type in ['node', 'all']:
                for node_id, node_data in graph.nodes(data=True):
                    name = node_data.get('name', '')
                    code = node_data.get('code', '')
                    category = node_data.get('category', '')

                    if (search_term.lower() in name.lower() or
                        search_term.lower() in code.lower() or
                        search_term.lower() in category.lower()):
                        results['nodes'].append({
                            'node_id': node_id,
                            **node_data
                        })

            # 엣지 검색
            if search_type in ['edge', 'all']:
                for u, v, edge_data in graph.edges(data=True):
                    rel_type = edge_data.get('relationship_type', '')

                    if search_term.lower() in rel_type.lower():
                        results['edges'].append({
                            'source': u,
                            'target': v,
                            **edge_data
                        })

            return Response({
                'status': 'success',
                'search_term': search_term,
                'search_type': search_type,
                'data': results
            })

        except Exception as e:
            logger.exception(f'그래프 검색 실패: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
