import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { RolesResponse } from '@/types';

export function useRoles() {
  return useQuery({
    queryKey: qk.roles,
    queryFn: () => apiGet<RolesResponse>('/roles'),
    staleTime: 10 * 60_000,
  });
}
