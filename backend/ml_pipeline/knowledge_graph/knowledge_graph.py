"""
Knowledge Graph Management

Knowledge graph construction and management for AI prediction system
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

# Try to import graph libraries
NETWORKX_AVAILABLE = False

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    pass


class KnowledgeGraph:
    """
    Knowledge Graph for time series forecasting

    Stores entities, relationships, and domain knowledge
    that can be used to improve forecasting accuracy
    """

    def __init__(self, graph_type: str = 'knowledge'):
        """
        Initialize Knowledge Graph

        Args:
            graph_type: Type of graph ('knowledge', 'causal', 'entity')
        """
        self.graph_type = graph_type

        if NETWORKX_AVAILABLE:
            self.graph = nx.DiGraph() if graph_type == 'causal' else nx.Graph()
        else:
            self.graph = None
            self._edges = []
            self._nodes = []

        self.metadata = {}
        self.created_at = datetime.now()

        logger.info(f"KnowledgeGraph initialized with type={graph_type}")

    def add_node(
        self,
        node_id: str,
        node_type: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add a node to the graph

        Args:
            node_id: Unique identifier for the node
            node_type: Type of node (entity, variable, feature, etc.)
            attributes: Additional node attributes

        Returns:
            True if successful
        """
        if self.graph is not None:
            self.graph.add_node(
                node_id,
                type=node_type,
                **(attributes or {})
            )
        else:
            self._nodes.append({
                'id': node_id,
                'type': node_type,
                'attributes': attributes or {}
            })

        logger.debug(f"Added node: {node_id} (type={node_type})")
        return True

    def add_edge(
        self,
        source: str,
        target: str,
        relation_type: str,
        weight: float = 1.0,
        attributes: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add an edge to the graph

        Args:
            source: Source node ID
            target: Target node ID
            relation_type: Type of relationship
            weight: Edge weight
            attributes: Additional edge attributes

        Returns:
            True if successful
        """
        edge_data = {
            'relation': relation_type,
            'weight': weight,
            **(attributes or {})
        }

        if self.graph is not None:
            self.graph.add_edge(source, target, **edge_data)
        else:
            self._edges.append({
                'source': source,
                'target': target,
                'data': edge_data
            })

        logger.debug(f"Added edge: {source} -> {target} (relation={relation_type})")
        return True

    def get_neighbors(
        self,
        node_id: str,
        relation_type: Optional[str] = None
    ) -> List[str]:
        """
        Get neighbors of a node

        Args:
            node_id: Node ID
            relation_type: Filter by relation type

        Returns:
            List of neighbor node IDs
        """
        if self.graph is not None:
            neighbors = list(self.graph.neighbors(node_id))

            if relation_type:
                neighbors = [
                    n for n in neighbors
                    if self.graph[node_id][n].get('relation') == relation_type
                ]

            return neighbors
        else:
            # Fallback for simple list-based storage
            neighbors = []
            for edge in self._edges:
                if edge['source'] == node_id:
                    if relation_type is None or edge['data']['relation'] == relation_type:
                        neighbors.append(edge['target'])
            return neighbors

    def get_path(
        self,
        source: str,
        target: str
    ) -> Optional[List[str]]:
        """
        Find shortest path between nodes

        Args:
            source: Source node ID
            target: Target node ID

        Returns:
            List of node IDs in path, or None if no path exists
        """
        if self.graph is not None:
            try:
                return nx.shortest_path(self.graph, source, target)
            except (nx.NodeNotFound, nx.NetworkXNoPath):
                return None
        else:
            # Simple BFS for path finding
            from collections import deque

            queue = deque([[source]])
            visited = {source}

            while queue:
                path = queue.popleft()
                node = path[-1]

                if node == target:
                    return path

                for neighbor in self.get_neighbors(node):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        new_path = list(path)
                        new_path.append(neighbor)
                        queue.append(new_path)

            return None

    def get_subgraph(
        self,
        nodes: List[str]
    ) -> 'KnowledgeGraph':
        """
        Extract subgraph containing specified nodes

        Args:
            nodes: List of node IDs

        Returns:
            New KnowledgeGraph containing subgraph
        """
        subgraph = KnowledgeGraph(self.graph_type)

        if self.graph is not None:
            sg = self.graph.subgraph(nodes)

            for node in sg.nodes():
                subgraph.add_node(
                    node,
                    sg.nodes[node].get('type', 'unknown'),
                    sg.nodes[node]
                )

            for source, target in sg.edges():
                edge_data = sg[source][target]
                subgraph.add_edge(
                    source,
                    target,
                    edge_data.get('relation', 'related'),
                    edge_data.get('weight', 1.0),
                    edge_data
                )

        return subgraph

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert graph to dictionary representation

        Returns:
            Dictionary with nodes and edges
        """
        if self.graph is not None:
            nodes = []
            for node in self.graph.nodes():
                node_data = dict(self.graph.nodes[node])
                node_data['id'] = node
                nodes.append(node_data)

            edges = []
            for source, target in self.graph.edges():
                edge_data = dict(self.graph[source][target])
                edge_data['source'] = source
                edge_data['target'] = target
                edges.append(edge_data)

            return {
                'nodes': nodes,
                'edges': edges,
                'metadata': self.metadata,
                'graph_type': self.graph_type
            }
        else:
            return {
                'nodes': self._nodes,
                'edges': self._edges,
                'metadata': self.metadata,
                'graph_type': self.graph_type
            }

    def build_from_dict(self, data: Dict[str, Any]) -> None:
        """
        Build graph from dictionary representation

        Args:
            data: Dictionary with nodes and edges
        """
        for node in data.get('nodes', []):
            node_id = node.pop('id', node.get('name', 'unknown'))
            node_type = node.pop('type', 'unknown')
            self.add_node(node_id, node_type, node)

        for edge in data.get('edges', []):
            source = edge.pop('source', edge.get('from', ''))
            target = edge.pop('target', edge.get('to', ''))
            relation = edge.pop('relation', edge.get('type', 'related'))
            weight = edge.pop('weight', 1.0)
            self.add_edge(source, target, relation, weight, edge)

        self.metadata = data.get('metadata', {})

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get graph statistics

        Returns:
            Dictionary with graph metrics
        """
        if self.graph is not None:
            return {
                'num_nodes': self.graph.number_of_nodes(),
                'num_edges': self.graph.number_of_edges(),
                'is_directed': isinstance(self.graph, nx.DiGraph),
                'density': nx.density(self.graph),
                'avg_degree': sum(dict(self.graph.degree()).values()) / max(1, self.graph.number_of_nodes())
            }
        else:
            return {
                'num_nodes': len(self._nodes),
                'num_edges': len(self._edges),
                'is_directed': self.graph_type == 'causal'
            }


class GraphBuilder:
    """
    Build knowledge graphs from data
    """

    def __init__(self):
        """Initialize Graph Builder"""
        self.graph = KnowledgeGraph()

    def build_from_correlation(
        self,
        data: pd.DataFrame,
        threshold: float = 0.7
    ) -> KnowledgeGraph:
        """
        Build graph from correlation matrix

        Args:
            data: Time series data
            threshold: Correlation threshold for edges

        Returns:
            KnowledgeGraph
        """
        corr = data.corr()

        # Add nodes
        for col in data.columns:
            self.graph.add_node(col, 'variable', {
                'mean': float(data[col].mean()),
                'std': float(data[col].std()),
                'min': float(data[col].min()),
                'max': float(data[col].max())
            })

        # Add edges for high correlations
        for i in range(len(corr)):
            for j in range(i+1, len(corr)):
                corr_val = corr.iloc[i, j]

                if abs(corr_val) > threshold:
                    relation = 'positive_correlation' if corr_val > 0 else 'negative_correlation'
                    self.graph.add_edge(
                        corr.index[i],
                        corr.index[j],
                        relation_type=relation,
                        weight=abs(corr_val),
                        correlation=float(corr_val)
                    )

        return self.graph

    def build_from_domain_knowledge(
        self,
        entities: List[Dict[str, Any]],
        relationships: List[Dict[str, Any]]
    ) -> KnowledgeGraph:
        """
        Build graph from domain knowledge

        Args:
            entities: List of entities with attributes
            relationships: List of relationships

        Returns:
            KnowledgeGraph
        """
        # Add entities as nodes
        for entity in entities:
            self.graph.add_node(
                entity['id'],
                entity.get('type', 'entity'),
                entity
            )

        # Add relationships as edges
        for rel in relationships:
            self.graph.add_edge(
                rel['source'],
                rel['target'],
                rel.get('type', 'related'),
                rel.get('weight', 1.0),
                rel
            )

        return self.graph

    def build_temporal_graph(
        self,
        data: pd.DataFrame,
        time_col: str = 'date',
        lag: int = 1
    ) -> KnowledgeGraph:
        """
        Build temporal graph with lagged connections

        Args:
            data: Time series data
            time_col: Time column name
            lag: Lag steps

        Returns:
            KnowledgeGraph
        """
        for col in data.columns:
            if col == time_col:
                continue

            # Add temporal nodes
            self.graph.add_node(f"{col}_t", 'variable', {'original': col, 'time': 'current'})
            self.graph.add_node(f"{col}_t-1", 'variable', {'original': col, 'time': f'-{lag}'})

            # Add temporal edge
            self.graph.add_edge(
                f"{col}_t-1",
                f"{col}_t",
                'temporal_dependency',
                weight=0.9
            )

        return self.graph


class CausalGraphBuilder:
    """
    Build causal graphs for causal inference
    """

    def __init__(self, method: str = 'pcmci'):
        """
        Initialize Causal Graph Builder

        Args:
            method: Causal discovery method ('pcmci', 'var', 'directlingram')
        """
        self.method = method

    def build(
        self,
        causal_data: Dict[str, Any]
    ) -> KnowledgeGraph:
        """
        Build causal graph from discovered relationships

        Args:
            causal_data: Causal discovery results

        Returns:
            KnowledgeGraph representing causal structure
        """
        graph = KnowledgeGraph(graph_type='causal')

        # Add nodes
        relationships = causal_data.get('causal_relationships', [])

        nodes = set()
        for rel in relationships:
            nodes.add(rel['cause'])
            nodes.add(rel['effect'])

        for node in nodes:
            graph.add_node(node, 'variable')

        # Add causal edges
        for rel in relationships:
            strength = rel.get('correlation', rel.get('strength', 0.5))
            p_value = rel.get('p_value', 0.05)

            graph.add_edge(
                rel['cause'],
                rel['effect'],
                relation_type='causal',
                weight=strength,
                p_value=p_value,
                significant=rel.get('significant', p_value < 0.05)
            )

        return graph

    def build_from_pc(
        self,
        data: pd.DataFrame,
        alpha: float = 0.05
    ) -> KnowledgeGraph:
        """
        Build causal graph using PC algorithm

        Args:
            data: Time series data
            alpha: Significance level

        Returns:
            KnowledgeGraph
        """
        # Simplified PC algorithm (would use causal-learn or cd-t in production)
        from scipy.stats import pearsonr

        graph = KnowledgeGraph(graph_type='causal')

        # Add all variables as nodes
        for col in data.columns:
            graph.add_node(col, 'variable')

        # Find significant correlations as potential causal links
        for i, col1 in enumerate(data.columns):
            for col2 in data.columns[i+1:]:
                corr, p_value = pearsonr(data[col1].dropna(), data[col2].dropna())

                if p_value < alpha and abs(corr) > 0.3:
                    # Direction based on temporal precedence (simplified)
                    graph.add_edge(
                        col1,
                        col2,
                        relation_type='causal',
                        weight=abs(corr),
                        p_value=p_value
                    )

        return graph


# Utility functions
def create_sample_knowledge_graph() -> KnowledgeGraph:
    """
    Create a sample manufacturing knowledge graph

    Returns:
        KnowledgeGraph with sample manufacturing entities
    """
    kg = KnowledgeGraph()

    # Add entities
    entities = [
        {'id': 'weather', 'type': 'external_factor'},
        {'id': 'raw_material', 'type': 'input'},
        {'id': 'production', 'type': 'process'},
        {'id': 'quality', 'type': 'output'},
        {'id': 'sales', 'type': 'output'}
    ]

    for entity in entities:
        kg.add_node(entity['id'], entity['type'])

    # Add relationships
    relationships = [
        {'source': 'weather', 'target': 'production', 'type': 'influences', 'weight': 0.3},
        {'source': 'raw_material', 'target': 'production', 'type': 'input_to', 'weight': 0.8},
        {'source': 'production', 'target': 'quality', 'type': 'determines', 'weight': 0.9},
        {'source': 'quality', 'target': 'sales', 'type': 'influences', 'weight': 0.7},
        {'source': 'production', 'target': 'sales', 'type': 'produces', 'weight': 0.6}
    ]

    for rel in relationships:
        kg.add_edge(rel['source'], rel['target'], rel['type'], rel['weight'])

    return kg


def merge_graphs(
    graphs: List[KnowledgeGraph],
    merge_method: str = 'union'
) -> KnowledgeGraph:
    """
    Merge multiple knowledge graphs

    Args:
        graphs: List of KnowledgeGraph instances
        merge_method: How to merge ('union', 'intersection', 'weighted')

    Returns:
        Merged KnowledgeGraph
    """
    if not graphs:
        return KnowledgeGraph()

    merged = KnowledgeGraph(graph_type=graphs[0].graph_type)

    if merge_method == 'union':
        # Union of all nodes and edges
        for graph in graphs:
            graph_dict = graph.to_dict()

            for node in graph_dict['nodes']:
                node_id = node['id']
                if node_id not in [n.get('id') for n in merged.to_dict()['nodes']]:
                    merged.add_node(
                        node_id,
                        node.get('type', 'unknown'),
                        node
                    )

            for edge in graph_dict['edges']:
                merged.add_edge(
                    edge['source'],
                    edge['target'],
                    edge.get('relation', 'related'),
                    edge.get('weight', 1.0),
                    edge
                )

    elif merge_method == 'intersection':
        # Intersection only
        if graphs:
            first_nodes = {n['id'] for n in graphs[0].to_dict()['nodes']}

            for graph in graphs[1:]:
                first_nodes.intersection_update({n['id'] for n in graph.to_dict()['nodes']})

            # Add common nodes
            for node in graphs[0].to_dict()['nodes']:
                if node['id'] in first_nodes:
                    merged.add_node(
                        node['id'],
                        node.get('type', 'unknown'),
                        node
                    )

    return merged
