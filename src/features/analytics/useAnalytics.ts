import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { CategorySlice, FastMovingRow, Inventory, KPIs, ThroughputPoint } from '@/types';

export function useOverview() {
  return useQuery({
    queryKey: qk.analyticsOverview,
    queryFn: () => apiGet<KPIs>('/analytics/overview'),
  });
}

export function useThroughput(days = 7) {
  return useQuery({
    queryKey: qk.throughput(days),
    queryFn: () => apiGet<ThroughputPoint[]>(`/analytics/throughput?days=${days}`),
  });
}

export function useStockByCategory() {
  return useQuery({
    queryKey: qk.stockByCategory,
    queryFn: () => apiGet<CategorySlice[]>('/analytics/stock-by-category'),
  });
}

export function useFastMoving() {
  return useQuery({
    queryKey: qk.fastMoving,
    queryFn: () => apiGet<FastMovingRow[]>('/analytics/fast-moving'),
  });
}

export function useAnalyticsLowStock() {
  return useQuery({
    queryKey: qk.analyticsLowStock,
    queryFn: () => apiGet<Inventory[]>('/analytics/low-stock'),
  });
}
