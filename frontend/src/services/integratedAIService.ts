/**
 * Integrated AI Service
 *
 * TypeScript service for integrated AI system API endpoints
 * Phase 10: Complete System Integration & Production Deployment
 */

// Types
export interface OrchestratePredictionRequest {
  data: Record<string, number[]>;
  mode?: 'production' | 'experiment' | 'canary' | 'shadow';
  target_col?: string;
  horizon?: number;
  model_id?: string;
  ensemble?: boolean;
}

export interface OrchestratePredictionResponse {
  success: boolean;
  result: {
    prediction: {
      forecast: number[];
      method?: string;
      num_models?: number;
    };
    models_used: string[];
    confidence: number;
    metadata: {
      mode: string;
      ensemble: boolean;
      timestamp: string;
    };
  };
}

export interface AutoOptimizeRequest {
  training_data: Record<string, number[]>;
  validation_data: Record<string, number[]>;
  target_col?: string;
  max_iterations?: number;
}

export interface AutoOptimizeResponse {
  success: boolean;
  optimization_result: {
    status: string;
    pipeline: any;
    score: number;
    iterations: number;
    improvement: number;
  };
}

export interface MetaTrainRequest {
  tasks: Array<{
    support: Record<string, number[]>;
    query: Record<string, number[]>;
  }>;
  num_iterations?: number;
}

export interface MetaTrainResponse {
  success: boolean;
  meta_training_result: {
    status: string;
    meta_loss_history: number[];
    final_meta_loss: number;
    iterations: number;
  };
}

export interface DeployModelRequest {
  model_id: string;
  model_version: string;
  environment?: string;
  strategy?: 'canary' | 'blue_green' | 'rolling' | 'shadow';
  config?: {
    canary_percent?: number;
    monitoring_duration?: number;
    batch_size?: number;
    total_instances?: number;
    duration?: number;
  };
}

export interface DeployModelResponse {
  success: boolean;
  deployment_result: {
    success: boolean;
    strategy: string;
    canary_percent?: number;
    monitoring_duration?: number;
    deployed_instances?: number;
    total_instances?: number;
    error_rate?: number;
    final_error_rate?: number;
    rolled_back?: boolean;
    reason?: string;
    stages?: any[];
  };
}

export interface RollbackDeploymentRequest {
  deployment_id: string;
  reason?: string;
}

export interface RollbackDeploymentResponse {
  success: boolean;
  rollback_result: {
    deployment_id: string;
    rolled_back_at: string;
  };
}

export interface RecordMetricRequest {
  metric_name: string;
  value: number;
  labels?: Record<string, string>;
}

export interface RecordMetricResponse {
  success: boolean;
  metric_recorded: {
    name: string;
    value: number;
    labels: Record<string, string>;
  };
}

export interface CheckComplianceRequest {
  model_id: string;
  model_info: {
    data_minimization?: boolean;
    explainability?: boolean;
    retention_policy?: string;
    risk_classification?: string;
    transparency_report?: any;
    human_oversight?: boolean;
    encrypted?: boolean;
    access_control?: boolean;
    vulnerability_scan_done?: boolean;
    demographic_parity?: number;
    equalized_odds?: number;
    accuracy?: number;
    bias_score?: number;
    explainability_score?: number;
    has_audit_trail?: boolean;
    privacy_preservation?: number;
  };
}

export interface CheckComplianceResponse {
  success: boolean;
  compliance_result: {
    model_id: string;
    compliant: boolean;
    standards: Record<string, {
      compliant: boolean;
      checks: any[];
      failed_checks?: any[];
    }>;
    checked_at: string;
  };
}

export interface AuditModelRequest {
  model_id: string;
  model_info: any;
  audit_type?: string;
}

export interface AuditModelResponse {
  success: boolean;
  audit_result: {
    model_id: string;
    audit_type: string;
    started_at: string;
    completed_at: string;
    compliance: any;
    performance: {
      pass: boolean;
      metrics: Record<string, number>;
    };
    security: {
      pass: boolean;
      checks: any[];
    };
    bias: {
      pass: boolean;
      metrics: Record<string, number>;
    };
    overall_pass: boolean;
  };
}

export interface SystemStatusResponse {
  success: boolean;
  system_status: {
    registered_models: number;
    available_models: string[];
    routing_strategy: string;
    adaptation_enabled: boolean;
    monitoring_enabled: boolean;
    pipeline_executions: number;
    model_performance: Record<string, number>;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
    suggested_models?: string[];
    suggested_approaches?: string[];
    model_id?: string;
    action?: string;
  }>;
}

export interface ModelsListResponse {
  success: boolean;
  models: Array<{
    model_id: string;
    available: boolean;
    task_type: string;
    domains: string[];
    accuracy: number;
    download_url: string;
  }>;
}

export interface SystemHealthResponse {
  success: boolean;
  system_health: {
    status: string;
    timestamp: string;
    uptime_seconds: number;
    metrics: Record<string, {
      count: number;
      mean: number;
      std: number;
      min: number;
      max: number;
      p50: number;
      p95: number;
      p99: number;
    }>;
  };
}

export interface MetricsSummaryResponse {
  success: boolean;
  metric_summary: {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface GovernanceReportResponse {
  success: boolean;
  governance_report: {
    generated_at: string;
    standards: string[];
    audit_summary: {
      total_audits: number;
      passed: number;
      failed: number;
      pass_rate: number;
    };
    compliance_summary: any;
    policy_violations: any[];
  };
}

export interface IntegratedAIInfoResponse {
  success: boolean;
  info: {
    module: string;
    version: string;
    description: string;
    features: {
      orchestration: string[];
      meta_learning: string[];
      deployment: string[];
      observability: string[];
      governance: string[];
    };
    deployment_strategies: string[];
    compliance_standards: string[];
    timestamp: string;
  };
}

// API Base URL
const API_BASE = '/api/ml-pipeline/integrated_ai';

/**
 * Integrated AI Service Class
 */
class IntegratedAIService {
  /**
   * Check integrated AI module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Orchestrate prediction using AI system
   */
  async orchestratePredict(request: OrchestratePredictionRequest): Promise<OrchestratePredictionResponse> {
    const response = await fetch(`${API_BASE}/orchestrate/predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction orchestration failed');
    }

    return response.json();
  }

  /**
   * Auto-optimize AI system
   */
  async autoOptimize(request: AutoOptimizeRequest): Promise<AutoOptimizeResponse> {
    const response = await fetch(`${API_BASE}/orchestrate/optimize/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Auto-optimization failed');
    }

    return response.json();
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatusResponse> {
    const response = await fetch(`${API_BASE}/orchestrate/status/`);

    if (!response.ok) {
      throw new Error('Failed to get system status');
    }

    return response.json();
  }

  /**
   * Get system recommendations
   */
  async getRecommendations(data: Record<string, number[]>): Promise<RecommendationsResponse> {
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));

    const response = await fetch(`${API_BASE}/orchestrate/recommendations/?${params}`);

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    return response.json();
  }

  /**
   * Train meta-learner
   */
  async metaTrain(request: MetaTrainRequest): Promise<MetaTrainResponse> {
    const response = await fetch(`${API_BASE}/meta/train/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Meta-training failed');
    }

    return response.json();
  }

  /**
   * Few-shot adaptation
   */
  async fewShotAdapt(request: {
    support_data: Record<string, number[]>;
    support_labels: number[];
    query_data: Record<string, number[]>;
  }): Promise<any> {
    const response = await fetch(`${API_BASE}/meta/few_shot/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Few-shot adaptation failed');
    }

    return response.json();
  }

  /**
   * List models in model zoo
   */
  async listModels(
    taskType?: string,
    domain?: string,
    minAccuracy?: number
  ): Promise<ModelsListResponse> {
    const params = new URLSearchParams();
    if (taskType) params.append('task_type', taskType);
    if (domain) params.append('domain', domain);
    if (minAccuracy !== undefined) params.append('min_accuracy', minAccuracy.toString());

    const response = await fetch(`${API_BASE}/meta/models/?${params}`);

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    return response.json();
  }

  /**
   * Deploy model to production
   */
  async deployModel(request: DeployModelRequest): Promise<DeployModelResponse> {
    const response = await fetch(`${API_BASE}/deploy/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Model deployment failed');
    }

    return response.json();
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(request: RollbackDeploymentRequest): Promise<RollbackDeploymentResponse> {
    const response = await fetch(`${API_BASE}/deploy/rollback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Rollback failed');
    }

    return response.json();
  }

  /**
   * Record system metric
   */
  async recordMetric(request: RecordMetricRequest): Promise<RecordMetricResponse> {
    const response = await fetch(`${API_BASE}/metrics/record/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record metric');
    }

    return response.json();
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const response = await fetch(`${API_BASE}/metrics/health/`);

    if (!response.ok) {
      throw new Error('Failed to get system health');
    }

    return response.json();
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(
    metricName: string,
    windowMinutes: number = 60
  ): Promise<MetricsSummaryResponse> {
    const params = new URLSearchParams();
    params.append('metric_name', metricName);
    params.append('window_minutes', windowMinutes.toString());

    const response = await fetch(`${API_BASE}/metrics/summary/?${params}`);

    if (!response.ok) {
      throw new Error('Failed to get metrics summary');
    }

    return response.json();
  }

  /**
   * Check model compliance
   */
  async checkCompliance(request: CheckComplianceRequest): Promise<CheckComplianceResponse> {
    const response = await fetch(`${API_BASE}/governance/compliance/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Compliance check failed');
    }

    return response.json();
  }

  /**
   * Audit model
   */
  async auditModel(request: AuditModelRequest): Promise<AuditModelResponse> {
    const response = await fetch(`${API_BASE}/governance/audit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Model audit failed');
    }

    return response.json();
  }

  /**
   * Get governance report
   */
  async getGovernanceReport(modelId?: string): Promise<GovernanceReportResponse> {
    const params = modelId ? `?model_id=${modelId}` : '';
    const response = await fetch(`${API_BASE}/governance/report/${params}`);

    if (!response.ok) {
      throw new Error('Failed to get governance report');
    }

    return response.json();
  }

  /**
   * Get integrated AI module information
   */
  async getInfo(): Promise<IntegratedAIInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get integrated AI info');
    }

    return response.json();
  }

  /**
   * Helper method: Prepare orchestration request
   */
  static prepareOrchestrationRequest(
    data: Record<string, number[]>,
    options: Partial<OrchestratePredictionRequest> = {}
  ): OrchestratePredictionRequest {
    return {
      data,
      mode: options.mode || 'production',
      target_col: options.target_col || 'value',
      horizon: options.horizon || 30,
      model_id: options.model_id,
      ensemble: options.ensemble !== undefined ? options.ensemble : true
    };
  }

  /**
   * Helper method: Prepare deployment request
   */
  static prepareDeploymentRequest(
    modelId: string,
    modelVersion: string,
    strategy: 'canary' | 'blue_green' | 'rolling' | 'shadow' = 'blue_green',
    config?: DeployModelRequest['config']
  ): DeployModelRequest {
    return {
      model_id: modelId,
      model_version: modelVersion,
      environment: 'production',
      strategy,
      config: config || {}
    };
  }

  /**
   * Helper method: Prepare canary deployment request
   */
  static prepareCanaryDeployment(
    modelId: string,
    modelVersion: string,
    canaryPercent: number = 10,
    monitoringDuration: number = 300
  ): DeployModelRequest {
    return this.prepareDeploymentRequest(modelId, modelVersion, 'canary', {
      canary_percent: canaryPercent,
      monitoring_duration: monitoringDuration
    });
  }

  /**
   * Helper method: Prepare blue-green deployment request
   */
  static prepareBlueGreenDeployment(
    modelId: string,
    modelVersion: string
  ): DeployModelRequest {
    return this.prepareDeploymentRequest(modelId, modelVersion, 'blue_green');
  }
}

// Export singleton instance
export const integratedAIService = new IntegratedAIService();
export default integratedAIService;
