import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Warehouse as WarehouseIcon,
  Store as StoreIcon,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser, usePermissions } from '@/app/hooks';
import { setMobileDrawer } from '@/app/uiSlice';
import { useTransfers } from '@/features/transfers/useTransfers';
import { ROLE_LABELS } from '@/lib/rbac';
import { initials } from '@/lib/format';
import type { Permission } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  badgeKey?: 'transfers';
  end?: boolean;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/map', label: 'Network map', icon: Map },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/warehouses', label: 'Warehouses', icon: WarehouseIcon, permission: 'warehouses:read' },
      { to: '/stores', label: 'Stores', icon: StoreIcon, permission: 'stores:read' },
      { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory:read' },
      { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, permission: 'transfers:read', badgeKey: 'transfers' },
      { to: '/sales', label: 'Sales', icon: ShoppingCart, permission: 'sales:read' },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics:read' },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export function Sidebar() {
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const { can } = usePermissions();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  // pending-approval count for the Transfers badge
  const { data: pending } = useTransfers({ status: 'requested', limit: 1 });
  const pendingCount = pending?.total ?? 0;

  const closeDrawer = () => dispatch(setMobileDrawer(false));

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="glyph">◆</span>
        {!collapsed && (
          <span className="name">
            Geo<b>Stock</b>
          </span>
        )}
      </div>

      <nav className="side-nav">
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((it) => !it.permission || can(it.permission));
          if (visible.length === 0) return null;
          return (
            <div key={gi}>
              {group.heading ? <div className="side-group">{group.heading}</div> : null}
              {visible.map((it) => {
                const Icon = it.icon;
                const badge = it.badgeKey === 'transfers' && pendingCount > 0 ? pendingCount : null;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    onClick={closeDrawer}
                    className={({ isActive }) => `side-item${isActive ? ' active' : ''}`}
                  >
                    <span className="ico">
                      <Icon size={18} />
                    </span>
                    <span className="lbl">{it.label}</span>
                    {badge ? <span className="badge-count">{badge}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="role-chip">
        <span className="av" style={user?.avatarColor ? { background: user.avatarColor } : undefined}>
          {initials(user?.name)}
        </span>
        <span className="meta">
          <span className="who">{user?.name ?? 'User'}</span>
          <span className="role">{user ? ROLE_LABELS[user.role] : ''}</span>
        </span>
      </div>
    </aside>
  );
}
