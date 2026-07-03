import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials, setStatus, setUser, logout as logoutAction } from '@/app/authSlice';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { AuthPayload, User } from '@/types';

interface LoginBody {
  email: string;
  password: string;
}
interface RegisterBody {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (body: LoginBody) => apiPost<AuthPayload>('/auth/login', body),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      connectSocket(data.accessToken);
    },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (body: RegisterBody) => apiPost<AuthPayload>('/auth/register', body),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      connectSocket(data.accessToken);
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost('/auth/logout'),
    onSettled: () => {
      disconnectSocket();
      dispatch(logoutAction());
      qc.clear();
    },
  });
}

/** Hydrate the session from the persisted token (called on app mount). */
export async function hydrateSession(dispatch: ReturnType<typeof useAppDispatch>) {
  try {
    const user = await apiGet<User>('/auth/me');
    dispatch(setUser(user));
    return user;
  } catch {
    dispatch(setStatus('unauthenticated'));
    return null;
  }
}

export function useUpdateProfile() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (body: Partial<User> & { password?: string; currentPassword?: string }) =>
      apiPatch<User>('/auth/me', body),
    onSuccess: (user) => dispatch(setUser(user)),
  });
}
