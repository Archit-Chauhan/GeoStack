import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { permissionsForRole, roleHasPermission, roleHasAll } from '@/lib/rbac';
import type { Permission } from '@/types';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Current authenticated user (or null). */
export function useCurrentUser() {
  return useAppSelector((s) => s.auth.user);
}

/** Permission helpers derived from the current user's role. */
export function usePermissions() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return {
    role,
    permissions: permissionsForRole(role),
    can: (perm: Permission) => roleHasPermission(role, perm),
    canAll: (perms: Permission[]) => roleHasAll(role, perms),
    isReadOnly: role === 'analyst',
  };
}
