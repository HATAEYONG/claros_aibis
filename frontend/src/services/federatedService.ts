/**
 * Federated Learning Service
 *
 * TypeScript service for federated learning API endpoints
 * Phase 7: Federated Learning
 */

// Types
export interface FederatedSystemConfig {
  base_model_type?: 'tft' | 'lstm' | 'prophet';
  num_rounds?: number;
  min_available_clients?: number;
  aggregation_method?: 'fedavg' | 'fedbuff' | 'fedprox';
  model_config?: Record<string, any>;
  target_epsilon?: number;
  target_delta?: number;
}

export interface InitializeSystemRequest {
  system_id: string;
  base_model_type?: string;
  num_rounds?: number;
  min_available_clients?: number;
  aggregation_method?: string;
  model_config?: Record<string, any>;
}

export interface InitializeSystemResponse {
  success: boolean;
  system_id: string;
  base_model_type: string;
  aggregation_method: string;
  num_rounds: number;
  privacy_budget?: {
    remaining_epsilon: number;
    remaining_delta: number;
    spent_epsilon: number;
    spent_delta: number;
  };
  initialized_at: string;
}

export interface RegisterClientRequest {
  system_id: string;
  client_id: string;
  data_info: {
    train_samples?: number;
    val_samples?: number;
    base_value?: number;
    data_source?: string;
  };
  model_config?: Record<string, any>;
}

export interface RegisterClientResponse {
  success: boolean;
  system_id: string;
  client_id: string;
  message: string;
  total_clients: number;
  registered_at: string;
}

export interface TrainRoundRequest {
  system_id: string;
  client_ids?: string[];
  epochs_per_client?: number;
  learning_rate?: number;
}

export interface TrainRoundResponse {
  success: boolean;
  system_id: string;
  round_result: {
    round: number;
    num_clients: number;
    global_metrics: Record<string, number>;
    timestamp: string;
  };
  privacy_budget?: {
    remaining_epsilon: number;
    remaining_delta: number;
    spent_epsilon: number;
    spent_delta: number;
  };
}

export interface FederatedPredictRequest {
  system_id: string;
  client_id: string;
  horizon: number;
}

export interface FederatedPredictResponse {
  success: boolean;
  system_id: string;
  forecast: number[];
  dates: string[];
  horizon: number;
  client_id: string;
  generated_at: string;
}

export interface SystemInfo {
  status: string;
  type: string;
  round: number;
  config: Record<string, any>;
  metrics: Record<string, number>;
  num_clients: number;
  aggregation_method: string;
  clients: ClientInfo[];
}

export interface ClientInfo {
  client_id: string;
  model_type: string;
  data_info: {
    train_samples?: number;
    val_samples?: number;
    base_value?: number;
    data_source?: string;
  };
  train_samples: number;
  val_samples: number;
  model_config: Record<string, any>;
}

export interface SecureAggregateRequest {
  updates: Array<{
    client_id: string;
    parameters: Record<string, number[][]>;
    num_samples: number;
  }>;
  encryption_method?: 'homomorphic' | 'additive';
}

export interface SecureAggregateResponse {
  success: boolean;
  aggregated_parameters: Record<string, number[][]>;
  num_clients: number;
  total_samples: number;
}

export interface AddDPNoiseRequest {
  parameters: Record<string, number[][]>;
  epsilon?: number;
  delta?: number;
  mechanism?: 'gaussian' | 'laplace';
}

export interface AddDPNoiseResponse {
  success: boolean;
  noisy_parameters: Record<string, number[][]>;
  privacy_spent: {
    epsilon: number;
    delta: number;
    mechanism: string;
  };
}

export interface FederatedInfoResponse {
  success: boolean;
  available_libraries: {
    flwr: boolean;
  };
  aggregation_methods: {
    [key: string]: {
      name: string;
      description: string;
      best_for: string;
    };
  };
  privacy_methods: {
    [key: string]: {
      name: string;
      description: string;
      best_for: string;
    };
  };
  timestamp: string;
}

// API Base URL
const API_BASE = '/api/ml-pipeline/federated';

/**
 * Federated Learning Service Class
 */
class FederatedService {
  /**
   * Check federated learning module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Initialize federated learning system
   */
  async initializeSystem(request: InitializeSystemRequest): Promise<InitializeSystemResponse> {
    const response = await fetch(`${API_BASE}/initialize/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'System initialization failed');
    }

    return response.json();
  }

  /**
   * Register a client
   */
  async registerClient(request: RegisterClientRequest): Promise<RegisterClientResponse> {
    const response = await fetch(`${API_BASE}/register_client/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Client registration failed');
    }

    return response.json();
  }

  /**
   * Execute training round
   */
  async trainRound(request: TrainRoundRequest): Promise<TrainRoundResponse> {
    const response = await fetch(`${API_BASE}/train_round/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training round failed');
    }

    return response.json();
  }

  /**
   * Generate federated prediction
   */
  async predict(request: FederatedPredictRequest): Promise<FederatedPredictResponse> {
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
   * Get system information
   */
  async getSystemInfo(systemId: string): Promise<{ success: boolean; info: SystemInfo }> {
    const response = await fetch(`${API_BASE}/system_info/?system_id=${systemId}`);

    if (!response.ok) {
      throw new Error('Failed to get system info');
    }

    return response.json();
  }

  /**
   * Get client information
   */
  async getClientInfo(systemId: string, clientId: string): Promise<{ success: boolean; client_info: ClientInfo }> {
    const response = await fetch(`${API_BASE}/client_info/?system_id=${systemId}&client_id=${clientId}`);

    if (!response.ok) {
      throw new Error('Failed to get client info');
    }

    return response.json();
  }

  /**
   * Perform secure aggregation
   */
  async secureAggregate(request: SecureAggregateRequest): Promise<SecureAggregateResponse> {
    const response = await fetch(`${API_BASE}/secure_aggregate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Secure aggregation failed');
    }

    return response.json();
  }

  /**
   * Add differential privacy noise
   */
  async addDPNoise(request: AddDPNoiseRequest): Promise<AddDPNoiseResponse> {
    const response = await fetch(`${API_BASE}/add_dp_noise/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'DP noise addition failed');
    }

    return response.json();
  }

  /**
   * Get federated learning information
   */
  async getInfo(): Promise<FederatedInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get federated info');
    }

    return response.json();
  }

  /**
   * List all federated systems
   */
  async listSystems(): Promise<any> {
    const response = await fetch(`${API_BASE}/systems/`);

    if (!response.ok) {
      throw new Error('Failed to list systems');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare system initialization request with defaults
   */
  static prepareSystemRequest(
    systemId: string,
    options: Partial<InitializeSystemRequest> = {}
  ): InitializeSystemRequest {
    return {
      system_id: systemId,
      base_model_type: options.base_model_type || 'tft',
      num_rounds: options.num_rounds || 10,
      min_available_clients: options.min_available_clients || 2,
      aggregation_method: options.aggregation_method || 'fedavg',
      model_config: options.model_config || {}
    };
  }

  /**
   * Helper method: Prepare client registration request with defaults
   */
  static prepareClientRequest(
    systemId: string,
    clientId: string,
    trainSamples: number,
    valSamples: number,
    options: Partial<RegisterClientRequest> = {}
  ): RegisterClientRequest {
    return {
      system_id: systemId,
      client_id: clientId,
      data_info: {
        train_samples: trainSamples,
        val_samples: valSamples,
        base_value: options.data_info?.base_value || 100,
        data_source: options.data_info?.data_source
      },
      model_config: options.model_config || {}
    };
  }

  /**
   * Helper method: Prepare training round request with defaults
   */
  static prepareTrainRoundRequest(
    systemId: string,
    options: Partial<TrainRoundRequest> = {}
  ): TrainRoundRequest {
    return {
      system_id: systemId,
      client_ids: options.client_ids,
      epochs_per_client: options.epochs_per_client || 5,
      learning_rate: options.learning_rate || 0.01
    };
  }
}

// Export singleton instance
export const federatedService = new FederatedService();
export default federatedService;
