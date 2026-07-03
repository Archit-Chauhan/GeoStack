import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { LocationType, Paginated, Transfer, TransferStatus } from '@/types';

export interface TransferFilters {
  status?: TransferStatus | '';
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransferBody {
  fromType: LocationType;
  from: string;
  toType: LocationType;
  to: string;
  items: { product: string; quantity: number }[];
  notes?: string;
}

// map status → transition endpoint
export type TransferAction =
  | 'approve'
  | 'dispatch'
  | 'in-transit'
  | 'deliver'
  | 'receive'
  | 'cancel';

export function useTransfers(filters?: TransferFilters) {
  return useQuery({
    queryKey: qk.transfers(filters),
    queryFn: () => apiGet<Paginated<Transfer>>('/transfers', { params: filters }),
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: qk.transfer(id ?? ''),
    queryFn: () => apiGet<Transfer>(`/transfers/${id}`),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTransferBody) => apiPost<Transfer>('/transfers', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: qk.analyticsOverview });
    },
  });
}

export function useTransferAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: TransferAction; note?: string }) =>
      apiPost<Transfer>(`/transfers/${id}/${action}`, note ? { note } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: qk.analyticsOverview });
    },
  });
}

/**
 * Given a current status, returns the primary next action (endpoint) and its
 * label + required permission — used to render per-transfer buttons.
 */
export function nextAction(status: TransferStatus): {
  action: TransferAction;
  label: string;
  permission: string;
} | null {
  switch (status) {
    case 'requested':
      return { action: 'approve', label: 'Approve', permission: 'transfers:approve' };
    case 'approved':
      return { action: 'dispatch', label: 'Dispatch', permission: 'transfers:dispatch' };
    case 'dispatched':
      return { action: 'in-transit', label: 'Mark in transit', permission: 'transfers:dispatch' };
    case 'in_transit':
      return { action: 'deliver', label: 'Mark delivered', permission: 'transfers:dispatch' };
    case 'delivered':
      return { action: 'receive', label: 'Receive', permission: 'transfers:receive' };
    default:
      return null;
  }
}
