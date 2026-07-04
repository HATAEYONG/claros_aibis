/**
 * 데이터 처리 파이프라인 유틸리티
 * 성능 최적화된 데이터 전처리 및 변환 함수들
 */

// =====================================================
// 데이터 검증 및 Cleaning
// =====================================================

export interface DataValidationResult {
  isValid: boolean;
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
  statistics: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    completeness: number;
  };
}

/**
 * 데이터 검증 - 유효성 검사
 */
export function validateData(
  data: any[],
  schema: { field: string; type: string; required?: boolean; nullable?: boolean }[]
): DataValidationResult {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: Array<{ row: number; field: string; message: string }> = [];
  let validRows = 0;

  data.forEach((row, rowIndex) => {
    let rowValid = true;

    schema.forEach(field => {
      const value = row[field.field];

      // 필수 필드 검사
      if (field.required && (value === undefined || value === null)) {
        errors.push({
          row: rowIndex,
          field: field.field,
          message: 'Required field is missing'
        });
        rowValid = false;
      }

      // Null 허용 검사
      if (!field.nullable && value === null) {
        errors.push({
          row: rowIndex,
          field: field.field,
          message: 'Field cannot be null'
        });
        rowValid = false;
      }

      // 타입 검사
      if (value !== undefined && value !== null) {
        if (field.type === 'number' && typeof value !== 'number') {
          errors.push({
            row: rowIndex,
            field: field.field,
            message: `Expected number, got ${typeof value}`
          });
          rowValid = false;
        }
        if (field.type === 'string' && typeof value !== 'string') {
          errors.push({
            row: rowIndex,
            field: field.field,
            message: `Expected string, got ${typeof value}`
          });
          rowValid = false;
        }
        if (field.type === 'date' && !(value instanceof Date || !isNaN(Date.parse(value)))) {
          warnings.push({
            row: rowIndex,
            field: field.field,
            message: 'Invalid date format'
          });
        }
      }
    });

    if (rowValid) validRows++;
  });

  const totalFields = schema.length * data.length;
  const filledFields = data.reduce((count, row) => {
    return count + schema.filter(f => row[f.field] !== undefined && row[f.field] !== null).length;
  }, 0);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      totalRows: data.length,
      validRows,
      invalidRows: data.length - validRows,
      completeness: totalFields > 0 ? (filledFields / totalFields) * 100 : 0
    }
  };
}

/**
 * 데이터 Cleaning - 이상치 처리
 */
export function cleanOutliers(
  data: number[],
  method: 'iqr' | 'zscore' | 'isolation' = 'iqr',
  threshold: number = 1.5
): { cleaned: number[]; outliers: number[]; indices: number[] } {
  const outliers: number[] = [];
  const indices: number[] = [];

  if (method === 'iqr') {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });
  } else if (method === 'zscore') {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);

    data.forEach((value, index) => {
      const zscore = Math.abs((value - mean) / std);
      if (zscore > threshold) {
        outliers.push(value);
        indices.push(index);
      }
    });
  }

  const cleaned = data.filter((_, index) => !indices.includes(index));

  return { cleaned, outliers, indices };
}

/**
 * 누락값 처리 (Imputation)
 */
export function imputeMissingValues(
  data: any[],
  method: 'mean' | 'median' | 'mode' | 'forward' | 'backward' | 'linear' = 'median'
): any[] {
  const numericFields = Object.keys(data[0] || {}).filter(
    key => typeof data[0]?.[key] === 'number'
  );

  const result = JSON.parse(JSON.stringify(data)); // Deep copy

  numericFields.forEach(field => {
    const values = data.map(row => row[field]).filter(v => v !== undefined && v !== null);

    if (values.length === 0) return;

    let fillValue: any;

    switch (method) {
      case 'mean':
        fillValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        fillValue = sorted[Math.floor(sorted.length / 2)];
        break;
      case 'mode':
        const frequency: Record<number, number> = {};
        values.forEach(v => {
          frequency[v] = (frequency[v] || 0) + 1;
        });
        const modeKey = Object.keys(frequency).reduce((a: string, b: string) =>
          frequency[parseInt(a)] > frequency[parseInt(b)] ? a : b
        );
        fillValue = parseInt(modeKey);
        break;
      default:
        fillValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Apply imputation
    let lastValidValue: any = null;
    result.forEach((row: any, index: number) => {
      if (row[field] === undefined || row[field] === null) {
        if (method === 'forward') {
          row[field] = lastValidValue !== null ? lastValidValue : fillValue;
        } else if (method === 'backward') {
          // Find next valid value (simplified)
          row[field] = fillValue;
        } else if (method === 'linear') {
          row[field] = fillValue; // Simplified
        } else {
          row[field] = fillValue;
        }
      } else {
        lastValidValue = row[field];
      }
    });
  });

  return result;
}

// =====================================================
// 데이터 변환
// =====================================================

/**
 * 데이터 정규화 (Normalization)
 */
export function normalizeData(
  data: number[],
  method: 'minmax' | 'zscore' | 'robust' = 'minmax'
): number[] {
  if (data.length === 0) return [];

  switch (method) {
    case 'minmax':
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      return range > 0
        ? data.map(v => (v - min) / range)
        : data.map(() => 0);

    case 'zscore':
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
      return std > 0 ? data.map(v => (v - mean) / std) : data.map(() => 0);

    case 'robust':
      const sorted = [...data].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      return iqr > 0 ? data.map(v => (v - median) / iqr) : data.map(() => 0);

    default:
      return data;
  }
}

/**
 * 범주형 데이터 인코딩
 */
export function encodeCategorical(
  data: any[],
  field: string,
  method: 'onehot' | 'label' | 'target' = 'onehot'
): any[] {
  const uniqueValues = [...new Set(data.map(row => row[field]))];

  return data.map(row => {
    const value = row[field];
    const encoded: any = { ...row };

    if (method === 'onehot') {
      uniqueValues.forEach((uv, index) => {
        encoded[`${field}_${uv}`] = value === uv ? 1 : 0;
      });
    } else if (method === 'label') {
      encoded[`${field}_encoded`] = uniqueValues.indexOf(value);
    } else if (method === 'target') {
      encoded[`${field}_encoded`] = value;
    }

    return encoded;
  });
}

/**
 * 날짜 데이터 추출
 */
export function extractDateFeatures(data: any[], dateField: string): any[] {
  return data.map(row => {
    const date = new Date(row[dateField]);
    return {
      ...row,
      [`${dateField}_year`]: date.getFullYear(),
      [`${dateField}_month`]: date.getMonth() + 1,
      [`${dateField}_day`]: date.getDate(),
      [`${dateField}_dayofweek`]: date.getDay(),
      [`${dateField}_dayofyear`]: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000),
      [`${dateField}_week`]: Math.ceil(date.getDate() / 7),
      [`${dateField}_quarter`]: Math.floor((date.getMonth() + 3) / 3),
      [`${dateField}_isweekend`]: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
      [`${dateField}_ismonthstart`]: date.getDate() === 1 ? 1 : 0,
      [`${dateField}_ismonthend`]: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() === date.getDate() ? 1 : 0
    };
  });
}

// =====================================================
// 데이터 집계 및 그룹화
// =====================================================

/**
 * 데이터 그룹화 및 집계
 */
export function groupBy(
  data: any[],
  groupByField: string,
  aggregations: { field: string; method: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'std' }[]
): any[] {
  const groups: Record<string, any[]> = {};

  // Grouping
  data.forEach(row => {
    const key = String(row[groupByField]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  // Aggregation
  return Object.entries(groups).map(([key, rows]) => {
    const result: any = { [groupByField]: key };

    aggregations.forEach(agg => {
      const values = rows.map(r => r[agg.field]).filter(v => v !== undefined && v !== null);

      switch (agg.method) {
        case 'sum':
          result[`${agg.field}_${agg.method}`] = values.reduce((sum: number, v) => sum + v, 0);
          break;
        case 'avg':
          result[`${agg.field}_${agg.method}`] = values.length > 0
            ? values.reduce((sum, v) => sum + v, 0) / values.length
            : 0;
          break;
        case 'count':
          result[`${agg.field}_${agg.method}`] = values.length;
          break;
        case 'min':
          result[`${agg.field}_${agg.method}`] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          result[`${agg.field}_${agg.method}`] = values.length > 0 ? Math.max(...values) : null;
          break;
        case 'std':
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          result[`${agg.field}_${agg.method}`] = values.length > 0
            ? Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)
            : 0;
          break;
      }
    });

    return result;
  });
}

/**
 * 롤링 집계 (시계열용)
 */
export function rollingAggregate(
  data: any[],
  valueField: string,
  window: number,
  method: 'sum' | 'avg' | 'min' | 'max' | 'std' = 'avg'
): any[] {
  return data.map((row, index) => {
    const start = Math.max(0, index - window + 1);
    const windowData = data.slice(start, index + 1).map(r => r[valueField]);

    let result: number;
    switch (method) {
      case 'sum':
        result = windowData.reduce((sum, v) => sum + (v || 0), 0);
        break;
      case 'avg':
        result = windowData.length > 0
          ? windowData.reduce((sum, v) => sum + (v || 0), 0) / windowData.length
          : 0;
        break;
      case 'min':
        result = windowData.length > 0 ? Math.min(...windowData.filter(v => v !== undefined)) : 0;
        break;
      case 'max':
        result = windowData.length > 0 ? Math.max(...windowData.filter(v => v !== undefined)) : 0;
        break;
      case 'std':
        const mean = windowData.reduce((sum, v) => sum + (v || 0), 0) / windowData.length;
        result = windowData.length > 0
          ? Math.sqrt(windowData.reduce((sum, v) => sum + Math.pow((v || 0) - mean, 2), 0) / windowData.length)
          : 0;
        break;
      default:
        result = 0;
    }

    return {
      ...row,
      [`${valueField}_rolling_${method}_${window}`]: result
    };
  });
}

/**
 * 시계열 차분 (Differencing)
 */
export function difference(data: number[], periods: number = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < periods) {
      result.push(NaN); // or null
    } else {
      result.push(data[i] - data[i - periods]);
    }
  }
  return result;
}

/**
 * 시계열 이동 평균 (Moving Average)
 */
export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

// =====================================================
// 데이터 병합 및 조인
// =====================================================

/**
 * 데이터 병합 (Merge/Join)
 */
export function mergeData(
  left: any[],
  right: any[],
  on: { left: string; right: string } | string,
  how: 'inner' | 'left' | 'right' | 'outer' = 'inner'
): any[] {
  const leftKey = typeof on === 'string' ? on : on.left;
  const rightKey = typeof on === 'string' ? on : on.right;

  const rightMap = new Map(
    right.map(row => [String(row[rightKey]), row])
  );

  const result: any[] = [];

  // Left join logic
  left.forEach(leftRow => {
    const keyValue = String(leftRow[leftKey]);
    const rightRow = rightMap.get(keyValue);

    if (rightRow) {
      result.push({ ...leftRow, ...rightRow });
    } else if (how === 'left' || how === 'outer') {
      result.push(leftRow);
    }
  });

  // Right join logic
  if (how === 'right' || how === 'outer') {
    const leftKeys = new Set(left.map(row => String(row[leftKey])));
    right.forEach(rightRow => {
      const keyValue = String(rightRow[rightKey]);
      if (!leftKeys.has(keyValue)) {
        result.push(rightRow);
      }
    });
  }

  return result;
}

// =====================================================
// 데이터 샘플링
// =====================================================

/**
 * 데이터 샘플링
 */
export function sampleData(
  data: any[],
  method: 'random' | 'systematic' | 'stratified' = 'random',
  size: number = 100,
  stratifyField?: string
): any[] {
  if (size >= data.length) return data;

  switch (method) {
    case 'random':
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, size);

    case 'systematic':
      const step = Math.floor(data.length / size);
      return data.filter((_, index) => index % step === 0).slice(0, size);

    case 'stratified':
      if (!stratifyField) {
        console.warn('Stratified sampling requires stratifyField');
        return sampleData(data, 'random', size);
      }
      const strata: Record<string, any[]> = {};
      data.forEach(row => {
        const key = String(row[stratifyField]);
        if (!strata[key]) strata[key] = [];
        strata[key].push(row);
      });
      const sampled: any[] = [];
      Object.entries(strata).forEach(([key, rows]) => {
        const stratumSize = Math.floor(rows.length * (size / data.length));
        sampled.push(...sampleData(rows, 'random', stratumSize));
      });
      return sampled.slice(0, size);

    default:
      return data.slice(0, size);
  }
}

// =====================================================
// 데이터 내보내기 (Resampling)
// =====================================================

/**
 * 시계열 리샘플링
 */
export function resampleTimeSeries(
  data: Array<{ date: string | Date; value: number }>,
  freq: 'D' | 'W' | 'M' | 'Q' | 'Y' = 'D',
  method: 'mean' | 'sum' | 'first' | 'last' = 'mean'
): Array<{ date: string; value: number }> {
  const grouped: Record<string, number[]> = {};

  data.forEach(point => {
    const date = new Date(point.date);
    let key: string;

    switch (freq) {
      case 'D':
        key = date.toISOString().split('T')[0];
        break;
      case 'W':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'M':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'Q':
        key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
        break;
      case 'Y':
        key = String(date.getFullYear());
        break;
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(point.value);
  });

  return Object.entries(grouped).map(([date, values]) => {
    let value: number;
    switch (method) {
      case 'sum':
        value = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'first':
        value = values[0];
        break;
      case 'last':
        value = values[values.length - 1];
        break;
      case 'mean':
      default:
        value = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    return { date, value };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// =====================================================
// 파이프라인 빌더
// =====================================================

export class DataPipeline {
  private steps: Array<(data: any) => any> = [];

  /**
   * 파이프라인에 단계 추가
   */
  addStep(step: (data: any) => any): this {
    this.steps.push(step);
    return this;
  }

  /**
   * 파이프라인 실행
   */
  execute(data: any): any {
    return this.steps.reduce((result, step) => step(result), data);
  }

  /**
   * 파이프라인 클리어
   */
  clear(): this {
    this.steps = [];
    return this;
  }

  /**
   * 파이프라인 복제
   */
  clone(): DataPipeline {
    const pipeline = new DataPipeline();
    pipeline.steps = [...this.steps];
    return pipeline;
  }
}

/**
 * 데이터 처리 파이프라인 빌더 헬퍼
 */
export function createPipeline(): DataPipeline {
  return new DataPipeline();
}

// =====================================================
// 성능 모니터링
// =====================================================

export interface ProcessingMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  inputRows: number;
  outputRows: number;
  memoryUsage?: number;
}

class ProcessingMonitor {
  private metrics: ProcessingMetrics[] = [];

  start(operation: string, inputRows: number): number {
    const startTime = Date.now();
    return startTime;
  }

  end(
    operation: string,
    startTime: number,
    inputRows: number,
    outputRows: number
  ): ProcessingMetrics {
    const endTime = Date.now();
    const metric: ProcessingMetrics = {
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      inputRows,
      outputRows,
      memoryUsage: this.estimateMemoryUsage(inputRows, outputRows)
    };
    this.metrics.push(metric);
    return metric;
  }

  private estimateMemoryUsage(inputRows: number, outputRows: number): number {
    // 간단한 추정: 각 행당 약 100바이트 가정
    return (inputRows + outputRows) * 100;
  }

  getMetrics(operation?: string): ProcessingMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageDuration(operation?: string): number {
    const relevant = this.getMetrics(operation);
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, m) => sum + m.duration, 0) / relevant.length;
  }

  clear(): void {
    this.metrics = [];
  }

  getReport(): string {
    const report: string[] = [];
    report.push('=== Data Processing Performance Report ===\n');

    const byOperation = new Map<string, ProcessingMetrics[]>();
    this.metrics.forEach(m => {
      if (!byOperation.has(m.operation)) {
        byOperation.set(m.operation, []);
      }
      byOperation.get(m.operation)!.push(m);
    });

    byOperation.forEach((metrics, operation) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const totalRows = metrics.reduce((sum, m) => sum + m.inputRows, 0);
      report.push(`${operation}:`);
      report.push(`  Calls: ${metrics.length}`);
      report.push(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
      report.push(`  Total Rows Processed: ${totalRows}`);
      report.push('');
    });

    return report.join('\n');
  }
}

export const processingMonitor = new ProcessingMonitor();
