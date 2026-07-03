import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Paginated, Store } from '@/types';

export interface StoreSummary {
  store: Store;
  metrics: {
    products: number;
    onHand: number;
    stockValue: number;
    lowStock: number;
    utilization?: number;
  };
}

export function useStores(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.stores(params),
    queryFn: () => apiGet<Paginated<Store>>('/stores', { params }),
  });
}

export function useStoreSummary(id: string | undefined) {
  return useQuery({
    queryKey: qk.storeSummary(id ?? ''),
    queryFn: () => apiGet<StoreSummary>(`/stores/${id}/summary`),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Store>) => apiPost<Store>('/stores', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Store> }) =>
      apiPatch<Store>(`/stores/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/stores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}
