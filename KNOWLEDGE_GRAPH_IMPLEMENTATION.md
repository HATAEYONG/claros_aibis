# Knowledge Graph Implementation Guide

**Claros MIS AI Dashboard**
Phase 8: Knowledge Graph for AI Prediction System
Version: 7.0 → 8.0
Date: 2026-04-01

---

## Overview

Phase 8 implements knowledge graph-based forecasting capabilities to improve prediction accuracy by incorporating domain knowledge, causal relationships, and graph structure information.

### Goals

- **Domain Knowledge Integration**: Incorporate expert knowledge into predictions
- **Causal Inference**: Discover and use causal relationships
- **Graph Neural Networks**: GNN-based forecasting with spatial/relational patterns
- **Explainability**: Causal path explanations for predictions

---

## Architecture

### Module Structure

```
ml_pipeline/
└── knowledge_graph/                   # Knowledge Graph Module
    ├── __init__.py
    ├── urls.py
    ├── api.py                          # Knowledge Graph API
    ├── graph_forecaster.py            # Neural graph forecaster
    ├── knowledge_graph.py             # Knowledge graph management
    └── graph_features.py              # Graph feature extraction
```

### Frontend Services

```
src/services/
└── kgForecastService.ts               # Knowledge graph forecasting service
```

---

## Backend Implementation

### 1. Neural Graph Forecaster (`graph_forecaster.py`)

#### NeuralGraphForecaster

Main forecaster combining time series with knowledge graphs:

```python
from ml_pipeline.knowledge_graph import NeuralGraphForecaster

# Initialize
forecaster = NeuralGraphForecaster(
    gnn_type='gcn',              # gcn, gat, rgcn
    hidden_channels=64,
    num_layers=3,
    use_causal=True
)

# Train with temporal and graph data
result = forecaster.fit(
    temporal_data=train_df,
    graph_data=knowledge_graph_dict,
    causal_graph=causal_graph_dict,
    target_col='value'
)

print(f"Training completed: MAPE = {result['training_result']['mape']}%")

# Generate forecast
forecast = forecaster.predict(
    temporal_data=test_df,
    graph_state=current_graph_state,
    horizon=30
)

print(f"Forecast: {forecast['forecast']}")
print(f"Causal paths: {forecast['causal_paths']}")
```

**GNN Types:**

| Type | Description | Best For |
|------|-------------|----------|
| GCN | Graph Convolutional Network | General graph patterns |
| GAT | Graph Attention Network | Variable importance |
| RGCN | Relational GCN | Multiple edge types |

#### GraphNeuralNetwork

Core GNN model implementation:

```python
from ml_pipeline.knowledge_graph import GraphNeuralNetwork

# Initialize GNN
gnn = GraphNeuralNetwork(
    gnn_type='gcn',
    in_channels=64,
    hidden_channels=64,
    num_layers=3,
    out_channels=1,
    dropout=0.1
)

# Forward pass
output = gnn.forward(x, edge_index)
```

#### CausalInference

Discover causal relationships:

```python
from ml_pipeline.knowledge_graph import CausalInference

# Initialize
ci = CausalInference(
    method='pcmci',           # pcmci, var, directlingram
    max_lag=5,
    significance_level=0.05
)

# Discover causal relationships
result = ci.discover_causality(data, target_col='production')

for rel in result['causal_relationships']:
    if rel['significant']:
        print(f"{rel['cause']} → {rel['effect']}: p={rel['p_value']:.4f}")

# Explain causal path
path = ci.explain_causal_path('weather', 'production', data)
print(f"Causal path: {path['paths']}")
```

### 2. Knowledge Graph Management (`knowledge_graph.py`)

#### KnowledgeGraph

Store and query knowledge graphs:

```python
from ml_pipeline.knowledge_graph import KnowledgeGraph

# Create graph
kg = KnowledgeGraph(graph_type='knowledge')

# Add nodes
kg.add_node('weather', 'external_factor', {'source': 'sensor'})
kg.add_node('raw_material', 'input', {'supplier': 'A'})
kg.add_node('production', 'process')

# Add edges
kg.add_edge('weather', 'production', 'influences', weight=0.3)
kg.add_edge('raw_material', 'production', 'input_to', weight=0.8)

# Query neighbors
neighbors = kg.get_neighbors('production')
print(f"Production neighbors: {neighbors}")

# Find path
path = kg.get_path('weather', 'sales')
print(f"Path: {path}")

# Get statistics
stats = kg.get_statistics()
print(f"Graph: {stats['num_nodes']} nodes, {stats['num_edges']} edges")
```

#### GraphBuilder

Build graphs from data:

```python
from ml_pipeline.knowledge_graph import GraphBuilder

builder = GraphBuilder()

# From correlation matrix
graph = builder.build_from_correlation(data, threshold=0.7)

# From domain knowledge
entities = [
    {'id': 'weather', 'type': 'external'},
    {'id': 'production', 'type': 'process'}
]
relationships = [
    {'source': 'weather', 'target': 'production', 'type': 'influences', 'weight': 0.5}
]
graph = builder.build_from_domain_knowledge(entities, relationships)

# Temporal graph
graph = builder.build_temporal_graph(data, lag=1)
```

#### CausalGraphBuilder

Build causal graphs:

```python
from ml_pipeline.knowledge_graph import CausalGraphBuilder

builder = CausalGraphBuilder(method='pcmci')

# From causal discovery results
causal_graph = builder.build(causal_discovery_result)
```

### 3. Graph Feature Extraction (`graph_features.py`)

#### GraphFeatureExtractor

Extract features from knowledge graphs:

```python
from ml_pipeline.knowledge_graph import GraphFeatureExtractor

extractor = GraphFeatureExtractor(
    include_centrality=True,
    include_structural=True,
    include_community=True
)

# Extract features
features = extractor.extract_features(knowledge_graph)

print(f"Features shape: {features.shape}")
print(f"Feature names: {extractor.feature_names}")
```

**Feature Types:**

| Category | Features |
|----------|----------|
| Centrality | Degree, Betweenness, Closeness, PageRank, Eigenvector |
| Structural | Clustering coefficient, Triangles, Square clustering |
| Community | Community ID, Community size, Modularity |

#### CausalFeatureExtractor

Extract causal features:

```python
from ml_pipeline.knowledge_graph import CausalFeatureExtractor

extractor = CausalFeatureExtractor(max_lag=5)

# Extract causal features
features = extractor.extract_causal_features(data, causal_graph)

# Compute causal effect
effect = extractor.compute_causal_effect(
    data,
    treatment='weather',
    outcome='production',
    intervention_value=1.0
)

print(f"ATE: {effect['ate']}")
print(f"CI: {effect['confidence_interval']}")

# Get causal paths
paths = extractor.get_causal_paths('weather', 'production', max_length=5)
```

---

## API Endpoints

### Knowledge Graph API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml-pipeline/knowledge_graph/health/` | GET | Health check |
| `/api/ml-pipeline/knowledge_graph/train/` | POST | Train graph forecaster |
| `/api/ml-pipeline/knowledge_graph/predict/` | POST | Generate forecast |
| `/api/ml-pipeline/knowledge_graph/causality/discover/` | POST | Discover causality |
| `/api/ml-pipeline/knowledge_graph/causality/explain/` | POST | Explain causal path |
| `/api/ml-pipeline/knowledge_graph/causality/effect/` | POST | Compute causal effect |
| `/api/ml-pipeline/knowledge_graph/graph/build/` | POST | Build knowledge graph |
| `/api/ml-pipeline/knowledge_graph/graph/path/` | GET | Get graph path |
| `/api/ml-pipeline/knowledge_graph/features/graph/` | POST | Extract graph features |
| `/api/ml-pipeline/knowledge_graph/features/causal/` | POST | Extract causal features |
| `/api/ml-pipeline/knowledge_graph/info/` | GET | Module information |

---

## Frontend Integration

### Knowledge Graph Forecast Service

```typescript
import { kgForecastService } from '@/services/kgForecastService';

// Train forecaster
const trainRequest = {
  temporal_data: {
    date: [1, 2, 3, 4, 5],
    value: [100, 102, 98, 105, 103]
  },
  graph_data: {
    nodes: [
      { id: 'weather', type: 'external' },
      { id: 'production', type: 'process' }
    ],
    edges: [
      { source: 'weather', target: 'production', relation: 'influences', weight: 0.5 }
    ]
  },
  config: {
    gnn_type: 'gcn',
    hidden_channels: 64,
    use_causal: true
  }
};

const trainResult = await kgForecastService.trainForecaster(trainRequest);
console.log('Training completed:', trainResult.training_result);

// Generate forecast
const forecast = await kgForecastService.predict({
  temporal_data: test_data,
  graph_state: current_graph,
  horizon: 30
});

console.log('Forecast:', forecast.forecast);
console.log('Causal paths:', forecast.forecast.causal_paths);
console.log('Graph importance:', forecast.forecast.graph_importance);

// Discover causality
const causalResult = await kgForecastService.discoverCausality({
  data: time_series_data,
  target_col: 'production',
  method: 'pcmci',
  max_lag: 5
});

console.log('Causal relationships:', causalResult.causal_result);

// Build knowledge graph
const graphRequest = kgForecastService.prepareCorrelationGraphRequest(data, 0.7);
const graph = await kgForecastService.buildGraph(graphRequest);
console.log('Graph:', graph.statistics);
```

---

## Usage Examples

### Example 1: Manufacturing Production Forecasting

```python
from ml_pipeline.knowledge_graph import NeuralGraphForecaster, GraphBuilder
import pandas as pd

# Load production data
data = pd.read_csv('production_data.csv')

# Build knowledge graph from domain knowledge
builder = GraphBuilder()

# Define manufacturing entities
entities = [
    {'id': 'weather', 'type': 'external', 'source': 'weather_api'},
    {'id': 'raw_material_quality', 'type': 'input'},
    {'id': 'equipment_status', 'type': 'resource'},
    {'id': 'production', 'type': 'process'},
    {'id': 'product_quality', 'type': 'output'},
    {'id': 'sales', 'type': 'output'}
]

# Define relationships
relationships = [
    {'source': 'weather', 'target': 'production', 'type': 'influences', 'weight': 0.3},
    {'source': 'raw_material_quality', 'target': 'production', 'type': 'determines', 'weight': 0.8},
    {'source': 'equipment_status', 'target': 'production', 'type': 'affects', 'weight': 0.7},
    {'source': 'production', 'target': 'product_quality', 'type': 'produces', 'weight': 0.9},
    {'source': 'product_quality', 'target': 'sales', 'type': 'influences', 'weight': 0.6}
]

kg = builder.build_from_domain_knowledge(entities, relationships)

# Train forecaster with knowledge graph
forecaster = NeuralGraphForecaster(
    gnn_type='gcn',
    use_causal=True
)

result = forecaster.fit(
    temporal_data=data,
    graph_data=kg.to_dict(),
    target_col='production'
)

# Generate forecast with causal explanations
forecast = forecaster.predict(
    temporal_data=data.tail(30),
    graph_state=kg.to_dict(),
    horizon=30
)

# Print causal paths
for path in forecast['causal_paths']:
    print(f"{path['path']}: strength={path['strength']:.2f}, contribution={path['contribution']}")
```

### Example 2: Causal Discovery

```python
from ml_pipeline.knowledge_graph import CausalInference, CausalGraphBuilder
import pandas as pd

# Load data
data = pd.read_csv('manufacturing_data.csv')

# Discover causal relationships
ci = CausalInference(method='pcmci', max_lag=5)
result = ci.discover_causality(data, target_col='production')

# Print significant causal relationships
print("Significant causal relationships:")
for rel in result['causal_relationships']:
    if rel['significant']:
        print(f"  {rel['cause']} → {rel['effect']}: p={rel['p_value']:.4f}")

# Build causal graph
builder = CausalGraphBuilder()
causal_graph = builder.build(result)

# Get statistics
stats = causal_graph.get_statistics()
print(f"Causal graph: {stats['num_nodes']} variables, {stats['num_edges']} causal links")
```

### Example 3: Causal Effect Analysis

```python
from ml_pipeline.knowledge_graph import CausalFeatureExtractor
import pandas as pd

# Load data
data = pd.read_csv('production_data.csv')

# Compute effect of weather on production
extractor = CausalFeatureExtractor()

effect = extractor.compute_causal_effect(
    data,
    treatment='temperature',
    outcome='production_volume',
    intervention_value=5.0  # 5 degree increase
)

print(f"Average Treatment Effect: {effect['ate']:.2f}")
print(f"95% CI: [{effect['confidence_interval'][0]:.2f}, {effect['confidence_interval'][1]:.2f}]")
print(f"P-value: {effect['p_value']:.4f}")

# If p < 0.05, the effect is statistically significant
if effect['p_value'] < 0.05:
    print("Temperature has a significant causal effect on production!")
```

---

## Configuration

### System Settings

```python
# config/settings.py

KNOWLEDGE_GRAPH_SETTINGS = {
    'default_gnn_type': 'gcn',
    'hidden_channels': 64,
    'num_layers': 3,
    'dropout': 0.1,
    'use_causal': True,
    'prediction_length': 30
}

# Causal inference
CAUSAL_SETTINGS = {
    'default_method': 'pcmci',
    'max_lag': 5,
    'significance_level': 0.05
}

# Graph feature extraction
GRAPH_FEATURE_SETTINGS = {
    'include_centrality': True,
    'include_structural': True,
    'include_community': True
}
```

---

## Performance Expectations

### Accuracy Improvement

| Scenario | Without KG | With KG | Improvement |
|----------|-----------|---------|-------------|
| Manufacturing | 6% MAPE | 4.5% MAPE | 25% |
| Sales | 8% MAPE | 6.5% MAPE | 19% |
| Quality | 5% MAPE | 4% MAPE | 20% |

### Feature Contribution

| Feature Type | Importance |
|--------------|------------|
| Temporal patterns | 50-70% |
| Graph structure | 15-30% |
| Causal relationships | 10-20% |

---

## Dependencies

### Python

```txt
# Graph processing
networkx>=3.0
scipy>=1.10.0

# GNN (optional)
torch>=2.0.0
torch-geometric>=2.3.0

# Causal inference (optional)
tigramm>=1.0.0
causal-learn>=0.1.0
```

### Installation Commands

```bash
# Core dependencies
pip install networkx scipy

# PyTorch Geometric (for GNN)
pip install torch-geometric

# Causal discovery libraries
pip install tigramm causal-learn
```

---

## Troubleshooting

### PyTorch Geometric Not Available

**Problem**: GNN models require PyTorch Geometric
- **Solution**: Install with `pip install torch-geometric` or use simulation mode

### NetworkX Not Available

**Problem**: Graph operations require NetworkX
- **Solution**: Install with `pip install networkx`

### Weak Causal Relationships

**Problem**: No significant causal relationships found
- **Solution**: Increase `max_lag` or decrease `significance_level`

---

## Testing

### Unit Tests

```bash
# Backend
pytest ml_pipeline/knowledge_graph/tests/

# Frontend
npm test -- kgForecastService.test.ts
```

### Integration Tests

```bash
# Test knowledge graph pipeline
pytest ml_pipeline/knowledge_graph/tests/integration/test_pipeline.py
```

---

## Best Practices

### 1. Start with Domain Knowledge

```python
# Use domain knowledge to build initial graph
entities = [{'id': 'raw_material', 'type': 'input'}]
relationships = [{'source': 'raw_material', 'target': 'production', 'weight': 0.8}]

kg = builder.build_from_domain_knowledge(entities, relationships)
```

### 2. Validate Causal Relationships

```python
# Always check p-values
for rel in causal_result['causal_relationships']:
    if rel['p_value'] < 0.05:
        print(f"Valid causal link: {rel['cause']} → {rel['effect']}")
```

### 3. Use Ensemble of Features

```python
# Combine temporal, graph, and causal features
from ml_pipeline.knowledge_graph import combine_graph_and_temporal_features

combined = combine_graph_and_temporal_features(
    temporal_features,
    graph_features,
    method='concatenation'
)
```

---

## Future Enhancements

### Possible Extensions

- **Knowledge Graph Embeddings**: TransE, ComplEx, RotatE
- **Link Prediction**: Predict new relationships
- **Graph Attention Networks**: Multi-head attention
- **Temporal Knowledge Graphs**: Time-evolving graphs
- **Causal Discovery with Interventions**: Active learning

---

## Changelog

### Version 8.0.0 (2026-04-01)

**Added**
- NeuralGraphForecaster with GCN/GAT support
- KnowledgeGraph management system
- CausalInference with VAR/PCMCI methods
- GraphFeatureExtractor with centrality/structural/community features
- CausalFeatureExtractor with causal effect computation
- Complete knowledge graph API (12 endpoints)
- Frontend kgForecastService

**Improved**
- Domain knowledge integration
- Causal relationship discovery
- Graph-based feature extraction
- Explainability with causal paths

---

**Document Version**: 1.0
**Author**: AI Architecture Team
**Status**: ✅ Complete
