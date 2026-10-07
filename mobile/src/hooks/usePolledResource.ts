import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function usePolledResource<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30_000,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const isFocusedRef = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const executeFetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastFetchedAt(Date.now());
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load data. Please check your network connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      void executeFetch();

      return () => {
        isFocusedRef.current = false;
      };
    }, [executeFetch])
  );

  // Polling timer that runs only while screen is focused
  useEffect(() => {
    if (intervalMs <= 0) return;

    const timer = setInterval(() => {
      if (isFocusedRef.current) {
        void executeFetch();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, executeFetch]);

  // Initial and dependency triggered load
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await fetcherRef.current();
        if (active) {
          setData(result);
          setLastFetchedAt(Date.now());
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              'Failed to load data.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => {
    return executeFetch(true);
  }, [executeFetch]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    setData,
    lastFetchedAt,
  };
}
