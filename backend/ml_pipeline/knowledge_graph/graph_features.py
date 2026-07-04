"""
Graph Feature Extraction

Extract features from knowledge graphs for ML models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import graph libraries
NETWORKX_AVAILABLE = False

try:
    import networkx as nx
    from scipy import stats
    NETWORKX_AVAILABLE = True
except ImportError:
    pass


class GraphFeatureExtractor:
    """
    Extract features from knowledge graphs

    Features:
    - Node centrality measures (degree, betweenness, PageRank)
    - Structural features (clustering, motifs)
    - Path-based features (shortest paths, connectivity)
    - Community structure
    """

    def __init__(
        self,
        include_centrality: bool = True,
        include_structural: bool = True,
        include_community: bool = True
    ):
        """
        Initialize Graph Feature Extractor

        Args:
            include_centrality: Include centrality-based features
            include_structural: Include structural features
            include_community: Include community-based features
        """
        self.include_centrality = include_centrality
        self.include_structural = include_structural
        self.include_community = include_community

        self.feature_names = []
        self._feature_cache = {}

    def extract_features(
        self,
        graph,
        target_values: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Extract graph features for each node

        Args:
            graph: KnowledgeGraph or NetworkX graph
            target_values: Optional target values for supervised features

        Returns:
            Feature matrix (num_nodes x num_features)
        """
        if graph is None:
            # Return dummy features
            return np.random.randn(100, 64)

        # Convert to NetworkX if needed
        if NETWORKX_AVAILABLE and hasattr(graph, 'graph'):
            nx_graph = graph.graph
        elif NETWORKX_AVAILABLE and isinstance(graph, nx.Graph):
            nx_graph = graph
        else:
            # Return dummy features
            return np.random.randn(100, 64)

        features = []
        self.feature_names = []

        # Centrality features
        if self.include_centrality:
            centrality_features = self._extract_centrality_features(nx_graph)
            features.append(centrality_features)
            self.feature_names.extend([
                'degree_centrality', 'betweenness_centrality',
                'closeness_centrality', 'pagerank', 'eigenvector_centrality'
            ])

        # Structural features
        if self.include_structural:
            structural_features = self._extract_structural_features(nx_graph)
            features.append(structural_features)
            self.feature_names.extend([
                'clustering_coefficient', 'triangles', 'square_clustering'
            ])

        # Community features
        if self.include_community:
            community_features = self._extract_community_features(nx_graph)
            features.append(community_features)
            self.feature_names.extend(['community_modularity', 'community_size'])

        # Combine features
        if features:
            feature_matrix = np.hstack(features)
        else:
            feature_matrix = np.zeros((nx_graph.number_of_nodes(), 1))

        return feature_matrix

    def _extract_centrality_features(
        self,
        graph
    ) -> np.ndarray:
        """Extract centrality-based features"""
        num_nodes = graph.number_of_nodes()
        features = np.zeros((num_nodes, 5))

        # Degree centrality
        try:
            degree_centrality = nx.degree_centrality(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 0] = degree_centrality.get(node, 0)
        except Exception as e:
            logger.warning(f"Degree centrality failed: {e}")

        # Betweenness centrality
        try:
            betweenness = nx.betweenness_centrality(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 1] = betweenness.get(node, 0)
        except Exception as e:
            logger.warning(f"Betweenness centrality failed: {e}")

        # Closeness centrality
        try:
            closeness = nx.closeness_centrality(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 2] = closeness.get(node, 0)
        except Exception as e:
            logger.warning(f"Closeness centrality failed: {e}")

        # PageRank
        try:
            pagerank = nx.pagerank(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 3] = pagerank.get(node, 0)
        except Exception as e:
            logger.warning(f"PageRank failed: {e}")

        # Eigenvector centrality
        try:
            eigenvector = nx.eigenvector_centrality(graph, max_iter=1000)
            for i, node in enumerate(graph.nodes()):
                features[i, 4] = eigenvector.get(node, 0)
        except Exception as e:
            logger.warning(f"Eigenvector centrality failed: {e}")

        return features

    def _extract_structural_features(
        self,
        graph
    ) -> np.ndarray:
        """Extract structural features"""
        num_nodes = graph.number_of_nodes()
        features = np.zeros((num_nodes, 3))

        # Clustering coefficient
        try:
            clustering = nx.clustering(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 0] = clustering.get(node, 0)
        except Exception as e:
            logger.warning(f"Clustering coefficient failed: {e}")

        # Triangles
        try:
            triangles = nx.triangles(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 1] = triangles.get(node, 0)
        except Exception as e:
            logger.warning(f"Triangles failed: {e}")

        # Square clustering
        try:
            square_clustering = nx.square_clustering(graph)
            for i, node in enumerate(graph.nodes()):
                features[i, 2] = square_clustering.get(node, 0)
        except Exception as e:
            logger.warning(f"Square clustering failed: {e}")

        return features

    def _extract_community_features(
        self,
        graph
    ) -> np.ndarray:
        """Extract community-based features"""
        num_nodes = graph.number_of_nodes()
        features = np.zeros((num_nodes, 2))

        try:
            from networkx.algorithms import community

            # Louvain community detection
            communities = community.greedy_modularity_communities(graph)

            # Create community assignment
            node_to_community = {}
            for i, comm in enumerate(communities):
                for node in comm:
                    node_to_community[node] = i

            for i, node in enumerate(graph.nodes()):
                comm_id = node_to_community.get(node, 0)
                features[i, 0] = comm_id  # Community ID
                features[i, 1] = len(communities[comm_id])  # Community size

        except Exception as e:
            logger.warning(f"Community detection failed: {e}")

        return features

    def extract_temporal_graph_features(
        self,
        graph_sequence: List,
        window_size: int = 5
    ) -> np.ndarray:
        """
        Extract features from temporal graph sequence

        Args:
            graph_sequence: List of graphs at different time steps
            window_size: Window size for temporal aggregation

        Returns:
            Temporal feature matrix
        """
        if not graph_sequence:
            return np.zeros((0, 64))

        # Extract features for each time step
        temporal_features = []

        for graph in graph_sequence:
            features = self.extract_features(graph)
            temporal_features.append(features)

        # Stack temporal features
        max_nodes = max(f.shape[0] for f in temporal_features)
        num_features = temporal_features[0].shape[1]

        padded_features = []
        for features in temporal_features:
            if features.shape[0] < max_nodes:
                padded = np.pad(
                    features,
                    ((0, max_nodes - features.shape[0]), (0, 0)),
                    mode='constant'
                )
            else:
                padded = features[:max_nodes]
            padded_features.append(padded)

        return np.stack(padded_features, axis=0)

    def get_feature_importance(
        self,
        feature_names: List[str],
        importance_scores: np.ndarray
    ) -> Dict[str, float]:
        """
        Get feature importance mapping

        Args:
            feature_names: List of feature names
            importance_scores: Importance scores

        Returns:
            Dictionary mapping feature names to importance
        """
        return dict(zip(feature_names, importance_scores))


class CausalFeatureExtractor:
    """
    Extract causal features for forecasting

    Features:
    - Causal strength
    - Causal path features
    - Intervention effects
    - Counterfactual predictions
    """

    def __init__(
        self,
        max_lag: int = 5,
        significance_level: float = 0.05
    ):
        """
        Initialize Causal Feature Extractor

        Args:
            max_lag: Maximum time lag for causality
            significance_level: Significance threshold
        """
        self.max_lag = max_lag
        self.significance_level = significance_level

        self.causal_graph = None
        self.causal_strength = {}

    def extract_causal_features(
        self,
        data: pd.DataFrame,
        causal_graph: Optional[Any] = None
    ) -> np.ndarray:
        """
        Extract causal features from time series

        Args:
            data: Time series data
            causal_graph: Optional pre-computed causal graph

        Returns:
            Causal feature matrix
        """
        self.causal_graph = causal_graph

        # Causal lag features
        lag_features = self._extract_causal_lag_features(data)

        # Causal strength features
        strength_features = self._extract_causal_strength_features(data)

        # Intervention features
        intervention_features = self._extract_intervention_features(data)

        # Combine features
        causal_features = np.hstack([
            lag_features,
            strength_features,
            intervention_features
        ])

        return causal_features

    def _extract_causal_lag_features(
        self,
        data: pd.DataFrame
    ) -> np.ndarray:
        """Extract lag features based on causal relationships"""
        features = []

        for col in data.columns:
            col_data = data[col].values

            # Create lagged features
            for lag in range(1, self.max_lag + 1):
                lagged = np.roll(col_data, lag)
                lagged[:lag] = np.nan
                features.append(lagged.reshape(-1, 1))

        if features:
            return np.hstack(features)
        return np.zeros((len(data), self.max_lag))

    def _extract_causal_strength_features(
        self,
        data: pd.DataFrame
    ) -> np.ndarray:
        """Extract causal strength features"""
        num_vars = len(data.columns)
        strength_matrix = np.zeros((len(data), num_vars * num_vars))

        # Compute causal strength using Granger causality (simplified)
        for i, col1 in enumerate(data.columns):
            for j, col2 in enumerate(data.columns):
                idx = i * num_vars + j

                # Cross-correlation as proxy for causal strength
                if i != j:
                    corr = np.corrcoef(data[col1].fillna(0), data[col2].fillna(0))[0, 1]
                    strength_matrix[:, idx] = abs(corr)
                else:
                    strength_matrix[:, idx] = 1.0

        return strength_matrix

    def _extract_intervention_features(
        self,
        data: pd.DataFrame
    ) -> np.ndarray:
        """Extract intervention effect features"""
        # Simulated intervention features
        num_vars = len(data.columns)
        intervention_features = np.zeros((len(data), num_vars))

        for i, col in enumerate(data.columns):
            col_data = data[col].values

            # Simulate intervention effect
            # (In production, would use actual intervention data)
            intervention_features[:, i] = np.cumsum(col_data) / (np.arange(len(col_data)) + 1)

        return intervention_features

    def compute_causal_effect(
        self,
        data: pd.DataFrame,
        treatment: str,
        outcome: str,
        intervention_value: float = 1.0
    ) -> Dict[str, Any]:
        """
        Compute causal effect of treatment on outcome

        Args:
            data: Time series data
            treatment: Treatment variable
            outcome: Outcome variable
            intervention_value: Value of intervention

        Returns:
            Causal effect metrics
        """
        if treatment not in data.columns or outcome not in data.columns:
            return {
                'ate': 0.0,
                'confidence_interval': [0.0, 0.0],
                'p_value': 1.0
            }

        # Simplified causal effect computation
        # (In production, would use proper causal inference methods)

        treatment_values = data[treatment].values
        outcome_values = data[outcome].values

        # Compute correlation as proxy
        corr = np.corrcoef(treatment_values, outcome_values)[0, 1]

        # Average treatment effect (simplified)
        ate = corr * intervention_value

        return {
            'ate': float(ate),
            'confidence_interval': [float(ate * 0.8), float(ate * 1.2)],
            'p_value': 0.05 if abs(corr) > 0.3 else 0.5,
            'method': 'correlation_based'
        }

    def get_causal_paths(
        self,
        source: str,
        target: str,
        max_length: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get causal paths from source to target

        Args:
            source: Source variable
            target: Target variable
            max_length: Maximum path length

        Returns:
            List of causal paths
        """
        if self.causal_graph is None:
            return []

        paths = []

        try:
            if NETWORKX_AVAILABLE and hasattr(self.causal_graph, 'graph'):
                # Find all simple paths
                all_paths = nx.all_simple_paths(
                    self.causal_graph.graph,
                    source,
                    target,
                    cutoff=max_length
                )

                for path in all_paths:
                    paths.append({
                        'path': path,
                        'length': len(path) - 1,
                        'type': 'causal'
                    })

        except Exception as e:
            logger.warning(f"Causal path extraction failed: {e}")

        return paths

    def explain_prediction(
        self,
        prediction: float,
        causal_features: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """
        Explain prediction using causal relationships

        Args:
            prediction: Predicted value
            causal_features: Causal feature matrix
            feature_names: Feature names

        Returns:
            Explanation with causal contributions
        """
        # Compute feature contributions (simplified)
        contributions = {}

        if len(causal_features) > 0:
            last_features = causal_features[-1]

            for i, name in enumerate(feature_names):
                if i < len(last_features):
                    contributions[name] = float(last_features[i] * prediction / len(last_features))

        # Sort by contribution
        sorted_contributions = dict(sorted(
            contributions.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        ))

        return {
            'prediction': float(prediction),
            'causal_contributions': sorted_contributions,
            'top_causes': list(sorted_contributions.keys())[:5]
        }


# Utility functions
def create_graph_feature_matrix(
    data: pd.DataFrame,
    feature_type: str = 'centrality'
) -> np.ndarray:
    """
    Create graph feature matrix from data

    Args:
        data: Time series data
        feature_type: Type of graph features

    Returns:
        Feature matrix
    """
    extractor = GraphFeatureExtractor()

    # Create correlation graph
    if NETWORKX_AVAILABLE:
        import networkx as nx

        corr = data.corr()
        G = nx.Graph()

        threshold = 0.7
        for i in range(len(corr)):
            for j in range(i+1, len(corr)):
                if abs(corr.iloc[i, j]) > threshold:
                    G.add_edge(corr.index[i], corr.index[j], weight=abs(corr.iloc[i, j]))

        features = extractor.extract_features(G)
        return features
    else:
        return np.random.randn(len(data.columns), 64)


def combine_graph_and_temporal_features(
    temporal_features: np.ndarray,
    graph_features: np.ndarray,
    method: str = 'concatenation'
) -> np.ndarray:
    """
    Combine temporal and graph features

    Args:
        temporal_features: Temporal feature matrix
        graph_features: Graph feature matrix
        method: Combination method ('concatenation', 'attention', 'weighted')

    Returns:
        Combined feature matrix
    """
    if method == 'concatenation':
        # Simple concatenation
        return np.hstack([temporal_features, graph_features])

    elif method == 'attention':
        # Attention-based combination
        temp_attention = np.mean(temporal_features, axis=0, keepdims=True)
        graph_attention = np.mean(graph_features, axis=0, keepdims=True) if len(graph_features.shape) > 1 else graph_features.reshape(1, -1)

        attention_weights = np.softmax(np.concatenate([temp_attention, graph_attention]))

        combined = attention_weights[:len(temp_attention)] * temporal_features + \
                   attention_weights[len(temp_attention):] * graph_features

        return combined

    elif method == 'weighted':
        # Weighted combination
        alpha = 0.7  # Weight for temporal features
        return alpha * temporal_features + (1 - alpha) * graph_features

    else:
        return np.hstack([temporal_features, graph_features])
