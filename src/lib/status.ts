import type { PillTone } from '@/components/ui';
import type { TransferStatus } from '@/types';

/** In stock / Low / Critical based on available vs product minStock. */
export function stockStatus(available: number, minStock: number): { tone: PillTone; label: string } {
  if (available <= 0 || available <= Math.max(0, Math.floor(minStock / 2))) {
    return { tone: 'critical', label: 'Critical' };
  }
  if (available <= minStock) {
    return { tone: 'low', label: 'Low' };
  }
  return { tone: 'in-stock', label: 'In stock' };
}

export function transferTone(status: TransferStatus): PillTone {
  switch (status) {
    case 'received':
    case 'delivered':
      return 'in-stock';
    case 'cancelled':
      return 'critical';
    case 'requested':
      return 'low';
    default:
      return 'info';
  }
}
