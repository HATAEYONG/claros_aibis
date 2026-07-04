/**
 * Knowledge Graph Forecast Service
 *
 * TypeScript service for knowledge graph-based forecasting API endpoints
 * Phase 8: Knowledge Graph for AI Prediction System
 */

// Types
export interface GraphForecasterConfig {
  gnn_type?: 'gcn' | 'gat' | 'rgcn';
  hidden_channels?: number;
  num_layers?: number;
  dropout?: number;
  use_causal?: boolean;
  prediction_length?: number;
}

export interface TrainGraphForecasterRequest {
  temporal_data: Record<string, number[]>;
  graph_data?: Record<string, any>;
  causal_graph?: Record<string, any>;
  target_col?: string;
  config?: GraphForecasterConfig;
}

export interface TrainGraphForecasterResponse {
  success: boolean;
  training_result: {
    status: string;
    gnn_type: string;
    use_causal: boolean;
    hidden_channels: number;
    num_layers: number;
    training_result: {
      epochs: number;
      final_loss: number;
      mape: number;
      mae: number;
      samples: number;
    };
  };
  trained_at: string;
}

export interface GraphPredictRequest {
  temporal_data: Record<string, number[]>;
  graph_state?: Record<string, any>;
  horizon?: number;
}

export interface GraphPredictResponse {
  success: boolean;
  forecast: {
    forecast: number[];
    dates: string[];
    horizon: number;
    causal_paths: Array<{
      path: string;
      strength: number;
      contribution: string;
    }>;
    graph_importance: {
      temporal_importance: number;
      spatial_importance: number;
      causal_importance: number;
    };
    generated_at: string;
  };
}

export interface DiscoverCausalityRequest {
  data: Record<string, number[]>;
  target_col?: string;
  method?: 'pcmci' | 'var' | 'directlingram';
  max_lag?: number;
}

export interface DiscoverCausalityResponse {
  success: boolean;
  causal_result: {
    method: string;
    causal_relationships: Array<{
      cause: string;
      effect: string;
      correlation?: number;
      p_value: number;
      significant: boolean;
    }>;
    target_col: string;
  };
  discovered_at: string;
}

export interface ExplainCausalPathRequest {
  source: string;
  target: string;
  data: Record<string, number[]>;
}

export interface ExplainCausalPathResponse {
  success: boolean;
  causal_path: {
    source: string;
    target: string;
    paths: Array<{
      type: string;
      path: string[];
      strength: number;
    }>;
    has_causality: boolean;
  };
}

export interface BuildKnowledgeGraphRequest {
  build_type: 'correlation' | 'domain' | 'causal' | 'sample';
  data?: Record<string, number[]>;
  entities?: Array<{
    id: string;
    type: string;
    [key: string]: any;
  }>;
  relationships?: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
    [key: string]: any;
  }>;
  config?: {
    threshold?: number;
    method?: string;
  };
}

export interface BuildKnowledgeGraphResponse {
  success: boolean;
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      [key: string]: any;
    }>;
    edges: Array<{
      source: string;
      target: string;
      relation: string;
      weight: number;
      [key: string]: any;
    }>;
    metadata: Record<string, any>;
    graph_type: string;
  };
  statistics: {
    num_nodes: number;
    num_edges: number;
    is_directed: boolean;
    density?: number;
    avg_degree?: number;
  };
  built_at: string;
}

export interface ExtractGraphFeaturesRequest {
  graph: Record<string, any>;
  feature_types?: Array<'centrality' | 'structural' | 'community'>;
}

export interface ExtractGraphFeaturesResponse {
  success: boolean;
  features: number[][];
  feature_names: string[];
  num_features: number;
  extracted_at: string;
}

export interface ExtractCausalFeaturesRequest {
  data: Record<string, number[]>;
  causal_graph?: Record<string, any>;
  max_lag?: number;
}

export interface ExtractCausalFeaturesResponse {
  success: boolean;
  features: number[][];
  feature_shape: [number, number];
  extracted_at: string;
}

export interface ComputeCausalEffectRequest {
  data: Record<string, number[]>;
  treatment: string;
  outcome: string;
  intervention_value?: number;
}

export interface ComputeCausalEffectResponse {
  success: boolean;
  causal_effect: {
    ate: number;
    confidence_interval: [number, number];
    p_value: number;
    method: string;
  };
  computed_at: string;
}

export interface GetGraphPathRequest {
  source: string;
  target: string;
  graph_data: Record<string, any>;
}

export interface GetGraphPathResponse {
  success: boolean;
  path: string[] | null;
  path_length: number;
  exists: boolean;
}

export interface KnowledgeGraphInfoResponse {
  success: boolean;
  info: {
    module: string;
    version: string;
    description: string;
    features: {
      gnn_models: string[];
      causal_methods: string[];
      graph_types: string[];
      feature_extraction: string[];
    };
    available_libraries: {
      torch_geometric: boolean;
      networkx: boolean;
    };
    supported_gnn_types: string[];
    supported_causal_methods: string[];
    timestamp: string;
  };
}

// API Base URL
const API_BASE = '/api/ml-pipeline/knowledge_graph';

/**
 * Knowledge Graph Forecast Service Class
 */
class KnowledgeGraphForecastService {
  /**
   * Check knowledge graph module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Train Neural Graph Forecaster
   */
  async trainForecaster(request: TrainGraphForecasterRequest): Promise<TrainGraphForecasterResponse> {
    const response = await fetch(`${API_BASE}/train/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training failed');
    }

    return response.json();
  }

  /**
   * Generate graph-based forecast
   */
  async predict(request: GraphPredictRequest): Promise<GraphPredictResponse> {
    const response = await fetch(`${API_BASE}/predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Discover causal relationships
   */
  async discoverCausality(request: DiscoverCausalityRequest): Promise<DiscoverCausalityResponse> {
    const response = await fetch(`${API_BASE}/causality/discover/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Causality discovery failed');
    }

    return response.json();
  }

  /**
   * Explain causal path
   */
  async explainCausalPath(request: ExplainCausalPathRequest): Promise<ExplainCausalPathResponse> {
    const response = await fetch(`${API_BASE}/causality/explain/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Causal path explanation failed');
    }

    return response.json();
  }

  /**
   * Compute causal effect
   */
  async computeCausalEffect(request: ComputeCausalEffectRequest): Promise<ComputeCausalEffectResponse> {
    const response = await fetch(`${API_BASE}/causality/effect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Causal effect computation failed');
    }

    return response.json();
  }

  /**
   * Build knowledge graph
   */
  async buildGraph(request: BuildKnowledgeGraphRequest): Promise<BuildKnowledgeGraphResponse> {
    const response = await fetch(`${API_BASE}/graph/build/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Graph building failed');
    }

    return response.json();
  }

  /**
   * Get path between nodes
   */
  async getGraphPath(request: GetGraphPathRequest): Promise<GetGraphPathResponse> {
    const params = new URLSearchParams({
      source: request.source,
      target: request.target,
      graph_data: JSON.stringify(request.graph_data)
    });

    const response = await fetch(`${API_BASE}/graph/path/?${params}`);

    if (!response.ok) {
      throw new Error('Path finding failed');
    }

    return response.json();
  }

  /**
   * Extract graph features
   */
  async extractGraphFeatures(request: ExtractGraphFeaturesRequest): Promise<ExtractGraphFeaturesResponse> {
    const response = await fetch(`${API_BASE}/features/graph/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Graph feature extraction failed');
    }

    return response.json();
  }

  /**
   * Extract causal features
   */
  async extractCausalFeatures(request: ExtractCausalFeaturesRequest): Promise<ExtractCausalFeaturesResponse> {
    const response = await fetch(`${API_BASE}/features/causal/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Causal feature extraction failed');
    }

    return response.json();
  }

  /**
   * Get knowledge graph module information
   */
  async getInfo(): Promise<KnowledgeGraphInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get knowledge graph info');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare temporal data from array
   */
  static prepareTemporalData(
    dates: string[],
    values: number[],
    additionalFeatures?: Record<string, number[]>
  ): Record<string, number[]> {
    const data: Record<string, number[]> = {
      date: dates.map(d => new Date(d).getTime()),
      value: values
    };

    if (additionalFeatures) {
      Object.assign(data, additionalFeatures);
    }

    return data;
  }

  /**
   * Helper method: Prepare correlation graph build request
   */
  static prepareCorrelationGraphRequest(
    data: Record<string, number[]>,
    threshold: number = 0.7
  ): BuildKnowledgeGraphRequest {
    return {
      build_type: 'correlation',
      data,
      config: { threshold }
    };
  }

  /**
   * Helper method: Prepare domain knowledge graph build request
   */
  static prepareDomainGraphRequest(
    entities: BuildKnowledgeGraphRequest['entities'],
    relationships: BuildKnowledgeGraphRequest['relationships']
  ): BuildKnowledgeGraphRequest {
    return {
      build_type: 'domain',
      entities,
      relationships
    };
  }

  /**
   * Helper method: Prepare causal graph build request
   */
  static prepareCausalGraphRequest(
    relationships: BuildKnowledgeGraphRequest['relationships'],
    method: string = 'pcmci'
  ): BuildKnowledgeGraphRequest {
    return {
      build_type: 'causal',
      relationships,
      config: { method }
    };
  }
}

// Export singleton instance
export const kgForecastService = new KnowledgeGraphForecastService();
export default kgForecastService;
