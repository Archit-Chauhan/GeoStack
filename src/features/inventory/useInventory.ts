import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Inventory, LocationType, Paginated } from '@/types';

export interface InventoryFilters {
  warehouse?: string;
  store?: string;
  product?: string;
  lowStock?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}

export function useInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: qk.inventory(filters),
    queryFn: () => apiGet<Paginated<Inventory>>('/inventory', { params: filters }),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: qk.lowStock,
    queryFn: () => apiGet<Inventory[]>('/inventory/low-stock'),
  });
}

export interface AdjustBody {
  product: string;
  locationType: LocationType;
  warehouse?: string;
  store?: string;
  field: 'available' | 'reserved' | 'incoming' | 'outgoing' | 'damaged';
  delta: number;
  note?: string;
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdjustBody) => apiPost<Inventory>('/inventory/adjust', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: qk.analyticsOverview });
    },
  });
}
