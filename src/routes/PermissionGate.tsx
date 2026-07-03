import type { ReactNode } from 'react';
import { usePermissions } from '@/app/hooks';
import type { Permission } from '@/types';

/** Renders children only when the current role holds the permission. */
export function Can({
  permission,
  permissions,
  children,
  fallback = null,
}: {
  permission?: Permission;
  permissions?: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, canAll } = usePermissions();
  const allowed = permission ? can(permission) : permissions ? canAll(permissions) : true;
  return <>{allowed ? children : fallback}</>;
}
