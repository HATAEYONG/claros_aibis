import { useState, useEffect, useCallback, useRef } from 'react';

interface RealtimeDataOptions {
  endpoint: string;
  interval?: number; // polling interval in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface RealtimeDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isStale: boolean;
}

/**
 * 실시간 데이터 업데이트 Hook
 * 주기적으로 데이터를 폴링하여 최신 상태 유지
 */
export function useRealtimeData<T>({
  endpoint,
  interval = 30000, // default 30 seconds
  enabled = true,
  onError
}: RealtimeDataOptions): RealtimeDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const staleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stale data timeout (5 seconds after expected update)
  const STALE_TIMEOUT = interval + 5000;

  const fetchData = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
      setLastUpdate(new Date());
      setIsStale(false);
      setError(null);

      // Reset stale timeout
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current);
      }
      staleTimeoutRef.current = setTimeout(() => {
        setIsStale(true);
      }, STALE_TIMEOUT);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't treat as error
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, onError, STALE_TIMEOUT]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    isStale
  };
}

/**
 * WebSocket 기반 실시간 데이터 Hook
 * WebSocket 연결을 통해 실시간 데이터 수신
 */
export function useWebSocketData<T>(url: string, enabled: boolean = true) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const jsonData = JSON.parse(event.data);
          setData(jsonData);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket');
      setError(error);
    }
  }, [url, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    data,
    connected,
    error,
    sendMessage
  };
}

/**
 * 실시간 KPI 데이터 Hook
 * 여러 엔드포인트에서 데이터를 수집하여 KPI로 표시
 */
export function useRealtimeKPI<T>(endpoints: string[], interval: number = 30000) {
  const [kpis, setKpis] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  useEffect(() => {
    const fetchAllKPIs = async () => {
      setLoading(true);
      const results: Record<string, T> = {};
      const newErrors: Record<string, Error> = {};

      await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            results[endpoint] = data;
          } catch (err) {
            newErrors[endpoint] = err instanceof Error ? err : new Error('Unknown error');
          }
        })
      );

      setKpis(results);
      setErrors(newErrors);
      setLoading(false);
    };

    fetchAllKPIs();
    const intervalId = setInterval(fetchAllKPIs, interval);

    return () => clearInterval(intervalId);
  }, [endpoints, interval]);

  return {
    kpis,
    loading,
    errors
  };
}

export default useRealtimeData;
