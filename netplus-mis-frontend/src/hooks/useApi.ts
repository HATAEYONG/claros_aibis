import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      });
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { ...state, refetch: fetchData };
}

// ========== Accounting Hooks ==========
export function useBudgetActual(params?: string) {
  return useApi(
    () => api.accounting.getBudgetActual(params),
    [params]
  );
}

export function useDepartmentProfitability(params?: string) {
  return useApi(
    () => api.accounting.getDepartmentProfitability(params),
    [params]
  );
}

export function useKPIPerformance(params?: string) {
  return useApi(
    () => api.accounting.getKPIPerformance(params),
    [params]
  );
}

export function useFinancialRatio(params?: string) {
  return useApi(
    () => api.accounting.getFinancialRatio(params),
    [params]
  );
}

export function useBudgetAllocation(params?: string) {
  return useApi(
    () => api.accounting.getBudgetAllocation(params),
    [params]
  );
}

export function useInvestmentROI(params?: string) {
  return useApi(
    () => api.accounting.getInvestmentROI(params),
    [params]
  );
}

// ========== Manufacturing Hooks ==========
export function useWorkshopStatus(params?: string) {
  return useApi(
    () => api.manufacturing.getWorkshopStatus(params),
    [params]
  );
}

export function useWorkshopSummary() {
  return useApi(() => api.manufacturing.getWorkshopSummary(), []);
}

export function useCycleTime(params?: string) {
  return useApi(
    () => api.manufacturing.getCycleTime(params),
    [params]
  );
}

export function useOEEMetric(params?: string) {
  return useApi(
    () => api.manufacturing.getOEEMetric(params),
    [params]
  );
}

export function useManpowerAllocation(params?: string) {
  return useApi(
    () => api.manufacturing.getManpowerAllocation(params),
    [params]
  );
}

export function useWorkStandard(params?: string) {
  return useApi(
    () => api.manufacturing.getWorkStandard(params),
    [params]
  );
}

// ========== Productivity Hooks ==========
export function useHourlyProduction(params?: string) {
  return useApi(
    () => api.productivity.getHourlyProduction(params),
    [params]
  );
}

export function useLineUtilization(params?: string) {
  return useApi(
    () => api.productivity.getLineUtilization(params),
    [params]
  );
}

export function useWorkerProductivity(params?: string) {
  return useApi(
    () => api.productivity.getWorkerProductivity(params),
    [params]
  );
}

export function useOEEComponent(params?: string) {
  return useApi(
    () => api.productivity.getOEEComponent(params),
    [params]
  );
}

export function useDailySummary(params?: string) {
  return useApi(
    () => api.productivity.getDailySummary(params),
    [params]
  );
}

export function useRecentSummary(days?: number) {
  return useApi(
    () => api.productivity.getRecentSummary(days),
    [days]
  );
}

// ========== Development Hooks ==========
export function useRDProject(params?: string) {
  return useApi(
    () => api.development.getRDProject(params),
    [params]
  );
}

export function useRDProjectSummary() {
  return useApi(() => api.development.getRDProjectSummary(), []);
}

export function useInnovationMetric(params?: string) {
  return useApi(
    () => api.development.getInnovationMetric(params),
    [params]
  );
}

export function usePatent(params?: string) {
  return useApi(
    () => api.development.getPatent(params),
    [params]
  );
}

export function useRDPersonnel(params?: string) {
  return useApi(
    () => api.development.getRDPersonnel(params),
    [params]
  );
}

export function useTechnologyRoadmap(params?: string) {
  return useApi(
    () => api.development.getTechnologyRoadmap(params),
    [params]
  );
}

export function useRDBudget(params?: string) {
  return useApi(
    () => api.development.getRDBudget(params),
    [params]
  );
}

// ========== Reports Hooks ==========
export function useExecutiveSummary(params?: string) {
  return useApi(
    () => api.reports.getExecutiveSummary(params),
    [params]
  );
}

export function useLatestExecutiveSummary() {
  return useApi(() => api.reports.getLatestExecutiveSummary(), []);
}

export function useDepartmentComparison(params?: string) {
  return useApi(
    () => api.reports.getDepartmentComparison(params),
    [params]
  );
}

export function useKeyMetric(params?: string) {
  return useApi(
    () => api.reports.getKeyMetric(params),
    [params]
  );
}

export function useAlerts() {
  return useApi(() => api.reports.getAlerts(), []);
}

export function useRiskOpportunity(params?: string) {
  return useApi(
    () => api.reports.getRiskOpportunity(params),
    [params]
  );
}

export function useRecommendation(params?: string) {
  return useApi(
    () => api.reports.getRecommendation(params),
    [params]
  );
}

export function useMonthlyReport(params?: string) {
  return useApi(
    () => api.reports.getMonthlyReport(params),
    [params]
  );
}
