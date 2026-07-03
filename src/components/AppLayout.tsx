import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/app/hooks';
import { setMobileDrawer } from '@/app/uiSlice';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import type { Company } from '@/types';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/map': 'Network map',
  '/warehouses': 'Warehouses',
  '/stores': 'Stores',
  '/inventory': 'Inventory',
  '/transfers': 'Transfers',
  '/sales': 'Sales',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function AppLayout() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useCurrentUser();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const drawer = useAppSelector((s) => s.ui.mobileDrawer);

  const title = useMemo(() => {
    const path = location.pathname;
    const key = Object.keys(TITLES).find((k) => k !== '/' && path.startsWith(k));
    return key ? TITLES[key] : TITLES['/'];
  }, [location.pathname]);

  const companyName =
    user && typeof user.company === 'object' ? (user.company as Company).name : undefined;

  return (
    <div className="app" data-collapsed={collapsed} data-drawer={drawer}>
      <div className="backdrop" onClick={() => dispatch(setMobileDrawer(false))} />
      <Sidebar />
      <div className="main-col">
        <Navbar title={title} crumb={companyName} />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="content"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
