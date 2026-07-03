import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Paginated, Warehouse } from '@/types';

export interface WarehouseSummary {
  warehouse: Warehouse;
  metrics: {
    products: number;
    onHand: number;
    stockValue: number;
    lowStock: number;
    utilization: number;
  };
}

export function useWarehouses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.warehouses(params),
    queryFn: () => apiGet<Paginated<Warehouse>>('/warehouses', { params }),
  });
}

export function useWarehouseSummary(id: string | undefined) {
  return useQuery({
    queryKey: qk.warehouseSummary(id ?? ''),
    queryFn: () => apiGet<WarehouseSummary>(`/warehouses/${id}/summary`),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Warehouse>) => apiPost<Warehouse>('/warehouses', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Warehouse> }) =>
      apiPatch<Warehouse>(`/warehouses/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/warehouses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}
