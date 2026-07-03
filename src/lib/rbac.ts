// =====================================================================
// RBAC — client mirror of server/src/constants/roles.js
// The server ALWAYS enforces; this is only for hiding UI the role lacks.
// (We also fetch GET /roles once to reconcile, but keep a local fallback.)
// =====================================================================
import type { Permission, Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  company_owner: 'Company Owner',
  company_admin: 'Company Admin',
  warehouse_manager: 'Warehouse Manager',
  warehouse_staff: 'Warehouse Staff',
  warehouse_helper: 'Warehouse Helper',
  store_manager: 'Store Manager',
  cashier: 'Cashier',
  store_helper: 'Store Helper',
  analyst: 'Analyst',
};

const ALL_PERMISSIONS: Permission[] = [
  'company:read',
  'company:update',
  'users:read',
  'users:invite',
  'users:update',
  'users:delete',
  'roles:read',
  'roles:assign',
  'warehouses:read',
  'warehouses:create',
  'warehouses:update',
  'warehouses:delete',
  'stores:read',
  'stores:create',
  'stores:update',
  'stores:delete',
  'products:read',
  'products:create',
  'products:update',
  'products:delete',
  'inventory:read',
  'inventory:update',
  'inventory:adjust',
  'transfers:read',
  'transfers:create',
  'transfers:approve',
  'transfers:dispatch',
  'transfers:receive',
  'transfers:cancel',
  'sales:read',
  'sales:create',
  'sales:refund',
  'analytics:read',
  'notifications:read',
  'notifications:manage',
  'audit:read',
];

const READ_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith(':read'));

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  company_owner: ALL_PERMISSIONS,
  company_admin: ALL_PERMISSIONS,
  analyst: [...READ_PERMISSIONS, 'analytics:read', 'audit:read'],
  warehouse_manager: [
    'company:read',
    'warehouses:read',
    'warehouses:update',
    'stores:read',
    'products:read',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'transfers:read',
    'transfers:create',
    'transfers:approve',
    'transfers:dispatch',
    'transfers:receive',
    'transfers:cancel',
    'analytics:read',
    'notifications:read',
    'users:read',
  ],
  warehouse_staff: [
    'warehouses:read',
    'products:read',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'transfers:read',
    'transfers:dispatch',
    'transfers:receive',
    'notifications:read',
  ],
  warehouse_helper: [
    'warehouses:read',
    'products:read',
    'inventory:read',
    'transfers:read',
    'notifications:read',
  ],
  store_manager: [
    'company:read',
    'stores:read',
    'stores:update',
    'products:read',
    'inventory:read',
    'transfers:read',
    'transfers:create',
    'transfers:receive',
    'sales:read',
    'sales:create',
    'sales:refund',
    'analytics:read',
    'notifications:read',
    'users:read',
  ],
  cashier: [
    'stores:read',
    'products:read',
    'inventory:read',
    'sales:read',
    'sales:create',
    'notifications:read',
  ],
  store_helper: [
    'stores:read',
    'products:read',
    'inventory:read',
    'sales:read',
    'notifications:read',
  ],
};

export function permissionsForRole(role: Role | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: Role | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function roleHasAll(role: Role | undefined, perms: Permission[]): boolean {
  const set = permissionsForRole(role);
  return perms.every((p) => set.includes(p));
}
