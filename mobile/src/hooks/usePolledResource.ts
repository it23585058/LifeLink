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

  const isFocusedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!data) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
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
  }, [data]);

  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      loadData();

      return () => {
        isFocusedRef.current = false;
      };
    }, [loadData])
  );

  // Polling timer that runs only while screen is focused
  useEffect(() => {
    if (intervalMs <= 0) return;

    const timer = setInterval(() => {
      if (isFocusedRef.current) {
        loadData();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, loadData]);

  // Reload when dependencies change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    setData,
  };
}
