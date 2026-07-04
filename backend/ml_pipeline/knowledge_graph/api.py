"""
Knowledge Graph API

REST API endpoints for knowledge graph-based forecasting
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging
from datetime import datetime

from .graph_forecaster import (
    NeuralGraphForecaster,
    CausalInference,
    get_available_gnn_libraries
)
from .knowledge_graph import (
    KnowledgeGraph,
    GraphBuilder,
    CausalGraphBuilder,
    create_sample_knowledge_graph
)
from .graph_features import (
    GraphFeatureExtractor,
    CausalFeatureExtractor
)

logger = logging.getLogger(__name__)


# Global forecaster instance
_forecaster = None


def get_forecaster():
    """Get or create global forecaster instance"""
    global _forecaster
    if _forecaster is None:
        _forecaster = NeuralGraphForecaster()
    return _forecaster


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'module': 'knowledge_graph',
        'timestamp': datetime.now().isoformat(),
        'libraries': get_available_gnn_libraries()
    })


@csrf_exempt
@require_http_methods(["POST"])
def train_graph_forecaster(request):
    """
    Train Neural Graph Forecaster

    Body:
    {
        "temporal_data": {...},  # Time series data
        "graph_data": {...},     # Knowledge graph structure
        "causal_graph": {...},   # Causal graph structure
        "target_col": "value",
        "config": {
            "gnn_type": "gcn",
            "hidden_channels": 64,
            "num_layers": 3,
            "use_causal": true
        }
    }
    """
    try:
        body = json.loads(request.body)

        # Parse data
        temporal_data = body.get('temporal_data', {})
        graph_data = body.get('graph_data')
        causal_graph = body.get('causal_graph')
        target_col = body.get('target_col', 'value')
        config = body.get('config', {})

        # Convert to DataFrame (simplified)
        import pandas as pd
        df = pd.DataFrame(temporal_data)

        # Get or create forecaster
        forecaster = get_forecaster()

        # Update config if provided
        if config:
            forecaster.gnn_type = config.get('gnn_type', forecaster.gnn_type)
            forecaster.hidden_channels = config.get('hidden_channels', forecaster.hidden_channels)
            forecaster.num_layers = config.get('num_layers', forecaster.num_layers)
            forecaster.use_causal = config.get('use_causal', forecaster.use_causal)

        # Train
        result = forecaster.fit(
            temporal_data=df,
            graph_data=graph_data,
            causal_graph=causal_graph,
            target_col=target_col
        )

        return JsonResponse({
            'success': True,
            'training_result': result,
            'trained_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Training failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def graph_predict(request):
    """
    Generate graph-based forecast

    Body:
    {
        "temporal_data": {...},
        "graph_state": {...},
        "horizon": 30
    }
    """
    try:
        body = json.loads(request.body)

        temporal_data = body.get('temporal_data', {})
        graph_state = body.get('graph_state')
        horizon = body.get('horizon', 30)

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(temporal_data)

        # Get forecaster
        forecaster = get_forecaster()

        if not forecaster.is_fitted:
            return JsonResponse({
                'success': False,
                'error': 'Model must be trained before prediction'
            }, status=400)

        # Generate forecast
        result = forecaster.predict(
            temporal_data=df,
            graph_state=graph_state,
            horizon=horizon
        )

        return JsonResponse({
            'success': True,
            'forecast': result
        })

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def discover_causality(request):
    """
    Discover causal relationships

    Body:
    {
        "data": {...},
        "target_col": "value",
        "method": "pcmci",
        "max_lag": 5
    }
    """
    try:
        body = json.loads(request.body)

        data = body.get('data', {})
        target_col = body.get('target_col', 'value')
        method = body.get('method', 'pcmci')
        max_lag = body.get('max_lag', 5)

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Create causal inference
        ci = CausalInference(method=method, max_lag=max_lag)

        # Discover causality
        result = ci.discover_causality(df, target_col)

        return JsonResponse({
            'success': True,
            'causal_result': result,
            'discovered_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Causality discovery failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def explain_causal_path(request):
    """
    Explain causal path between variables

    Body:
    {
        "source": "weather",
        "target": "production",
        "data": {...}
    }
    """
    try:
        body = json.loads(request.body)

        source = body.get('source')
        target = body.get('target')
        data = body.get('data', {})

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Create causal inference
        ci = CausalInference()

        # Explain path
        result = ci.explain_causal_path(source, target, df)

        return JsonResponse({
            'success': True,
            'causal_path': result
        })

    except Exception as e:
        logger.error(f"Causal path explanation failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def build_knowledge_graph(request):
    """
    Build knowledge graph from data

    Body:
    {
        "build_type": "correlation",
        "data": {...},
        "entities": [...],
        "relationships": [...],
        "config": {
            "threshold": 0.7,
            "method": "pcmci"
        }
    }
    """
    try:
        body = json.loads(request.body)

        build_type = body.get('build_type', 'correlation')
        data = body.get('data', {})
        entities = body.get('entities', [])
        relationships = body.get('relationships', [])
        config = body.get('config', {})

        import pandas as pd

        graph = None

        if build_type == 'correlation':
            # Build from correlation
            df = pd.DataFrame(data)
            builder = GraphBuilder()
            threshold = config.get('threshold', 0.7)
            graph = builder.build_from_correlation(df, threshold)

        elif build_type == 'domain':
            # Build from domain knowledge
            builder = GraphBuilder()
            graph = builder.build_from_domain_knowledge(entities, relationships)

        elif build_type == 'causal':
            # Build causal graph
            causal_data = {'causal_relationships': relationships}
            builder = CausalGraphBuilder(method=config.get('method', 'pcmci'))
            graph = builder.build(causal_data)

        elif build_type == 'sample':
            # Create sample graph
            graph = create_sample_knowledge_graph()

        if graph is None:
            return JsonResponse({
                'success': False,
                'error': f'Unknown build type: {build_type}'
            }, status=400)

        # Get statistics
        stats = graph.get_statistics()

        return JsonResponse({
            'success': True,
            'graph': graph.to_dict(),
            'statistics': stats,
            'built_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Knowledge graph building failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def extract_graph_features(request):
    """
    Extract graph features

    Body:
    {
        "graph": {...},
        "feature_types": ["centrality", "structural", "community"]
    }
    """
    try:
        body = json.loads(request.body)

        graph_data = body.get('graph', {})
        feature_types = body.get('feature_types', ['centrality', 'structural', 'community'])

        # Build graph from data
        graph = KnowledgeGraph()
        graph.build_from_dict(graph_data)

        # Extract features
        extractor = GraphFeatureExtractor(
            include_centrality='centrality' in feature_types,
            include_structural='structural' in feature_types,
            include_community='community' in feature_types
        )

        features = extractor.extract_features(graph)

        return JsonResponse({
            'success': True,
            'features': features.tolist(),
            'feature_names': extractor.feature_names,
            'num_features': features.shape[1] if len(features.shape) > 1 else 0,
            'extracted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Graph feature extraction failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def extract_causal_features(request):
    """
    Extract causal features

    Body:
    {
        "data": {...},
        "causal_graph": {...},
        "max_lag": 5
    }
    """
    try:
        body = json.loads(request.body)

        data = body.get('data', {})
        causal_graph = body.get('causal_graph')
        max_lag = body.get('max_lag', 5)

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Extract features
        extractor = CausalFeatureExtractor(max_lag=max_lag)
        features = extractor.extract_causal_features(df, causal_graph)

        return JsonResponse({
            'success': True,
            'features': features.tolist(),
            'feature_shape': features.shape,
            'extracted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Causal feature extraction failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def compute_causal_effect(request):
    """
    Compute causal effect

    Body:
    {
        "data": {...},
        "treatment": "weather",
        "outcome": "production",
        "intervention_value": 1.0
    }
    """
    try:
        body = json.loads(request.body)

        data = body.get('data', {})
        treatment = body.get('treatment')
        outcome = body.get('outcome')
        intervention_value = body.get('intervention_value', 1.0)

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Compute effect
        extractor = CausalFeatureExtractor()
        effect = extractor.compute_causal_effect(
            df,
            treatment,
            outcome,
            intervention_value
        )

        return JsonResponse({
            'success': True,
            'causal_effect': effect,
            'computed_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Causal effect computation failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_graph_path(request):
    """
    Get path between nodes in graph

    Query params:
    - source: Source node ID
    - target: Target node ID
    - graph_data: Graph data (JSON encoded)
    """
    try:
        source = request.GET.get('source')
        target = request.GET.get('target')
        graph_data_str = request.GET.get('graph_data', '{}')

        if not source or not target:
            return JsonResponse({
                'success': False,
                'error': 'source and target are required'
            }, status=400)

        # Build graph
        graph_data = json.loads(graph_data_str)
        graph = KnowledgeGraph()
        graph.build_from_dict(graph_data)

        # Get path
        path = graph.get_path(source, target)

        return JsonResponse({
            'success': True,
            'path': path,
            'path_length': len(path) - 1 if path else 0,
            'exists': path is not None
        })

    except Exception as e:
        logger.error(f"Path finding failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_knowledge_graph_info(request):
    """
    Get knowledge graph module information
    """
    return JsonResponse({
        'success': True,
        'info': {
            'module': 'knowledge_graph',
            'version': '1.0.0',
            'description': 'Knowledge Graph-based forecasting with GNN and causal inference',
            'features': {
                'gnn_models': ['GCN', 'GAT', 'RGCN'],
                'causal_methods': ['PCMCI', 'VAR', 'Correlation'],
                'graph_types': ['knowledge', 'causal', 'entity'],
                'feature_extraction': ['centrality', 'structural', 'community', 'causal']
            },
            'available_libraries': get_available_gnn_libraries(),
            'supported_gnn_types': ['gcn', 'gat', 'rgcn'],
            'supported_causal_methods': ['pcmci', 'var', 'directlingram'],
            'timestamp': datetime.now().isoformat()
        }
    })
