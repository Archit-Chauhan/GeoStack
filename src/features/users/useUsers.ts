import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { Paginated, Role, User } from '@/types';

export function useUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: async () => {
      const data = await apiGet<Paginated<User> | User[]>('/users', { params });
      return Array.isArray(data) ? { items: data, page: 1, limit: data.length, total: data.length, pages: 1 } : data;
    },
  });
}

export interface InviteBody {
  name: string;
  email: string;
  role: Role;
  warehouse?: string;
  store?: string;
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteBody) => apiPost<User>('/users/invite', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<User> }) =>
      apiPatch<User>(`/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      apiPatch<User>(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
