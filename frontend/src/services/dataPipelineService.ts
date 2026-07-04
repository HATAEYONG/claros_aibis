/**
 * 데이터 파이프라인 서비스
 * 고성능 데이터 처리 및 변환 서비스
 */

import {
  validateData,
  cleanOutliers,
  imputeMissingValues,
  normalizeData,
  encodeCategorical,
  extractDateFeatures,
  groupBy,
  rollingAggregate,
  difference,
  movingAverage,
  mergeData,
  sampleData,
  resampleTimeSeries,
  createPipeline,
  processingMonitor
} from '@/utils/dataProcessingUtils';

// =====================================================
// 데이터 파이프라인 서비스
// =====================================================

export interface PipelineConfig {
  steps: PipelineStep[];
  options?: {
    parallel?: boolean;
    cacheIntermediate?: boolean;
    monitorPerformance?: boolean;
  };
}

export interface PipelineStep {
  name: string;
  type: 'validate' | 'clean' | 'impute' | 'normalize' | 'encode' | 'extract' | 'group' | 'rolling' | 'difference' | 'resample' | 'custom';
  params?: any;
}

export interface PipelineResult {
  success: boolean;
  data: any[];
  metrics: {
    inputRows: number;
    outputRows: number;
    processingTime: number;
    stepsCompleted: number;
    stepsFailed: number;
    errors: string[];
  };
  stepResults?: Array<{ step: string; duration: number; status: string }>;
}

/**
 * 데이터 파이프라인 서비스 클래스
 */
class DataPipelineService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  /**
   * 파이프라인 실행
   */
  async executePipeline(
    data: any[],
    config: PipelineConfig
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const stepResults: Array<{ step: string; duration: number; status: string }> = [];
    let currentData = data;
    const errors: string[] = [];
    let stepsCompleted = 0;
    let stepsFailed = 0;

    const monitor = config.options?.monitorPerformance !== false;

    for (const step of config.steps) {
      const stepStartTime = Date.now();

      try {
        currentData = await this.executeStep(currentData, step);
        stepsCompleted++;
        stepResults.push({
          step: step.name,
          duration: Date.now() - stepStartTime,
          status: 'completed'
        });

        // 중간 결과 캐싱
        if (config.options?.cacheIntermediate) {
          const cacheKey = `${step.name}-${JSON.stringify(step.params)}`;
          this.cache.set(cacheKey, {
            data: currentData,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        stepsFailed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${step.name}: ${errorMsg}`);
        stepResults.push({
          step: step.name,
          duration: Date.now() - stepStartTime,
          status: 'failed'
        });

        // 실패 시 중단 여부 결정
        if (step.params?.stopOnError !== false) {
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      data: currentData,
      metrics: {
        inputRows: data.length,
        outputRows: currentData.length,
        processingTime: Date.now() - startTime,
        stepsCompleted,
        stepsFailed,
        errors
      },
      stepResults
    };
  }

  /**
   * 단일 파이프라인 단계 실행
   */
  private async executeStep(data: any[], step: PipelineStep): Promise<any[]> {
    switch (step.type) {
      case 'validate':
        const validationResult = validateData(data, step.params.schema);
        if (!validationResult.isValid) {
          throw new Error(`Validation failed: ${validationResult.errors.length} errors`);
        }
        return data;

      case 'clean':
        const outlierResult = cleanOutliers(
          data.map(d => d[step.params.field]),
          step.params.method || 'iqr',
          step.params.threshold || 1.5
        );
        // Clean the data by removing outliers
        return data.filter((_, index) => !outlierResult.indices.includes(index));

      case 'impute':
        return imputeMissingValues(
          data,
          step.params.method || 'median'
        );

      case 'normalize':
        const field = step.params.field;
        return data.map(row => ({
          ...row,
          [`${field}_normalized`]: normalizeData(
            data.map(d => d[field]),
            step.params.method || 'minmax'
          )[data.indexOf(row)]
        }));

      case 'encode':
        return encodeCategorical(
          data,
          step.params.field,
          step.params.method || 'onehot'
        );

      case 'extract':
        if (step.params.featureType === 'date') {
          return extractDateFeatures(data, step.params.field);
        }
        return data;

      case 'group':
        return groupBy(
          data,
          step.params.groupByField,
          step.params.aggregations
        );

      case 'rolling':
        return rollingAggregate(
          data,
          step.params.valueField,
          step.params.window || 7,
          step.params.method || 'avg'
        );

      case 'difference':
        const differenced = difference(
          data.map(d => d[step.params.field]),
          step.params.periods || 1
        );
        return data.map((row, index) => ({
          ...row,
          [`${step.params.field}_diff`]: differenced[index]
        }));

      case 'resample':
        return resampleTimeSeries(
          data,
          step.params.freq || 'D',
          step.params.method || 'mean'
        );

      case 'custom':
        if (step.params.fn && typeof step.params.fn === 'function') {
          return step.params.fn(data);
        }
        return data;

      default:
        return data;
    }
  }

  /**
   * 사전 정의된 파이프라인 템플릿
   */
  getTemplate(name: 'ml-preprocessing' | 'timeseries-prep' | 'cleaning' | 'full'): PipelineConfig {
    switch (name) {
      case 'ml-preprocessing':
        return {
          steps: [
            {
              name: 'validate',
              type: 'validate',
              params: {
                schema: [
                  { field: 'value', type: 'number', required: true },
                  { field: 'date', type: 'date', required: true }
                ]
              }
            },
            {
              name: 'clean_outliers',
              type: 'clean',
              params: { field: 'value', method: 'iqr', threshold: 1.5 }
            },
            {
              name: 'impute_missing',
              type: 'impute',
              params: { method: 'median' }
            },
            {
              name: 'normalize',
              type: 'normalize',
              params: { field: 'value', method: 'minmax' }
            }
          ]
        };

      case 'timeseries-prep':
        return {
          steps: [
            {
              name: 'extract_date_features',
              type: 'extract',
              params: { field: 'date', featureType: 'date' }
            },
            {
              name: 'rolling_avg',
              type: 'rolling',
              params: { valueField: 'value', window: 7, method: 'avg' }
            },
            {
              name: 'difference',
              type: 'difference',
              params: { field: 'value', periods: 1 }
            }
          ]
        };

      case 'cleaning':
        return {
          steps: [
            {
              name: 'validate',
              type: 'validate',
              params: {
                schema: [
                  { field: 'id', type: 'string', required: true },
                  { field: 'value', type: 'number', required: true }
                ]
              }
            },
            {
              name: 'clean_outliers',
              type: 'clean',
              params: { field: 'value', method: 'zscore', threshold: 3 }
            },
            {
              name: 'impute_missing',
              type: 'impute',
              params: { method: 'forward' }
            }
          ]
        };

      case 'full':
        return {
          steps: [
            { name: 'validate', type: 'validate', params: {} },
            { name: 'clean', type: 'clean', params: {} },
            { name: 'impute', type: 'impute', params: {} },
            { name: 'normalize', type: 'normalize', params: {} },
            { name: 'encode', type: 'encode', params: {} }
          ]
        };

      default:
        return { steps: [] };
    }
  }

  /**
   * 배치 파이프라인 실행
   */
  async executeBatch(
    datasets: Array<{ data: any[]; config: PipelineConfig }>,
    options: { maxConcurrent?: number } = {}
  ): Promise<PipelineResult[]> {
    const { maxConcurrent = 3 } = options;
    const results: PipelineResult[] = [];

    for (let i = 0; i < datasets.length; i += maxConcurrent) {
      const batch = datasets.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(ds => this.executePipeline(ds.data, ds.config))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 파이프라인 빌더
   */
  builder(): PipelineBuilder {
    return new PipelineBuilder(this);
  }

  /**
   * 캐시 클리어
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 캐시 통계
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 성능 리포트
   */
  getPerformanceReport(): string {
    return processingMonitor.getReport();
  }
}

/**
 * 파이프라인 빌더 클래스
 */
export class PipelineBuilder {
  private config: PipelineConfig = { steps: [] };

  constructor(private service: DataPipelineService) {}

  validate(schema: any[]): this {
    this.config.steps.push({
      name: 'validate',
      type: 'validate',
      params: { schema }
    });
    return this;
  }

  clean(field: string, method: 'iqr' | 'zscore' = 'iqr', threshold: number = 1.5): this {
    this.config.steps.push({
      name: `clean_${field}`,
      type: 'clean',
      params: { field, method, threshold }
    });
    return this;
  }

  impute(method: 'mean' | 'median' | 'mode' | 'forward' | 'backward' = 'median'): this {
    this.config.steps.push({
      name: 'impute',
      type: 'impute',
      params: { method }
    });
    return this;
  }

  normalize(field: string, method: 'minmax' | 'zscore' | 'robust' = 'minmax'): this {
    this.config.steps.push({
      name: `normalize_${field}`,
      type: 'normalize',
      params: { field, method }
    });
    return this;
  }

  encode(field: string, method: 'onehot' | 'label' | 'target' = 'onehot'): this {
    this.config.steps.push({
      name: `encode_${field}`,
      type: 'encode',
      params: { field, method }
    });
    return this;
  }

  extractDates(field: string): this {
    this.config.steps.push({
      name: `extract_dates_${field}`,
      type: 'extract',
      params: { field, featureType: 'date' }
    });
    return this;
  }

  rollingAverage(field: string, window: number = 7): this {
    this.config.steps.push({
      name: `rolling_avg_${field}`,
      type: 'rolling',
      params: { valueField: field, window, method: 'avg' }
    });
    return this;
  }

  difference(field: string, periods: number = 1): this {
    this.config.steps.push({
      name: `difference_${field}`,
      type: 'difference',
      params: { field, periods }
    });
    return this;
  }

  custom(name: string, fn: (data: any) => any[]): this {
    this.config.steps.push({
      name,
      type: 'custom',
      params: { fn }
    });
    return this;
  }

  options(opts: { parallel?: boolean; cacheIntermediate?: boolean; monitorPerformance?: boolean }): this {
    this.config.options = { ...this.config.options, ...opts };
    return this;
  }

  async execute(data: any[]): Promise<PipelineResult> {
    return this.service.executePipeline(data, this.config);
  }

  build(): PipelineConfig {
    return this.config;
  }
}

// 싱글톤 인스턴스
export const dataPipelineService = new DataPipelineService();
export default dataPipelineService;
