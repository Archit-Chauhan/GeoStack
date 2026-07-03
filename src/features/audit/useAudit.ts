import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { AuditLog, Paginated } from '@/types';

export function useAudit(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.audit(params),
    queryFn: () => apiGet<Paginated<AuditLog>>('/audit', { params }),
  });
}
