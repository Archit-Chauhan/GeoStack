import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Central query-key registry so socket handlers + hooks stay in sync.
export const qk = {
  auth: ['auth', 'me'] as const,
  company: ['company'] as const,
  users: (params?: unknown) => ['users', params ?? {}] as const,
  roles: ['roles'] as const,
  warehouses: (params?: unknown) => ['warehouses', params ?? {}] as const,
  warehouse: (id: string) => ['warehouses', id] as const,
  warehouseSummary: (id: string) => ['warehouses', id, 'summary'] as const,
  stores: (params?: unknown) => ['stores', params ?? {}] as const,
  store: (id: string) => ['stores', id] as const,
  storeSummary: (id: string) => ['stores', id, 'summary'] as const,
  products: (params?: unknown) => ['products', params ?? {}] as const,
  product: (id: string) => ['products', id] as const,
  inventory: (params?: unknown) => ['inventory', params ?? {}] as const,
  lowStock: ['inventory', 'low-stock'] as const,
  transfers: (params?: unknown) => ['transfers', params ?? {}] as const,
  transfer: (id: string) => ['transfers', id] as const,
  sales: (params?: unknown) => ['sales', params ?? {}] as const,
  sale: (id: string) => ['sales', id] as const,
  analyticsOverview: ['analytics', 'overview'] as const,
  throughput: (days: number) => ['analytics', 'throughput', days] as const,
  stockByCategory: ['analytics', 'stock-by-category'] as const,
  fastMoving: ['analytics', 'fast-moving'] as const,
  analyticsLowStock: ['analytics', 'low-stock'] as const,
  notifications: ['notifications'] as const,
  audit: (params?: unknown) => ['audit', params ?? {}] as const,
};
