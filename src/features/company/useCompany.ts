import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Company } from '@/types';

export function useCompany() {
  return useQuery({
    queryKey: qk.company,
    queryFn: () => apiGet<Company>('/company'),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Company>) => apiPatch<Company>('/company', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.company }),
  });
}
