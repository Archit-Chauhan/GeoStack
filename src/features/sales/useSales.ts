import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Paginated, Sale } from '@/types';

export interface SaleFilters {
  store?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateSaleBody {
  store: string;
  items: { product: string; quantity: number }[];
  tax?: number;
  customer?: { name?: string };
}

export function useSales(filters?: SaleFilters) {
  return useQuery({
    queryKey: qk.sales(filters),
    queryFn: () => apiGet<Paginated<Sale>>('/sales', { params: filters }),
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSaleBody) => apiPost<Sale>('/sales', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: qk.analyticsOverview });
    },
  });
}

export function useRefundSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Sale>(`/sales/${id}/refund`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
