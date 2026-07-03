import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { hydrateSession } from '@/features/auth/useAuth';
import { SocketProvider } from '@/components/SocketProvider';
import { Toaster } from '@/components/Toaster';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import MapPage from '@/pages/MapPage';
import Warehouses from '@/pages/Warehouses';
import Stores from '@/pages/Stores';
import Inventory from '@/pages/Inventory';
import Transfers from '@/pages/Transfers';
import Sales from '@/pages/Sales';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const status = useAppSelector((s) => s.auth.status);

  // Hydrate the session from a persisted token on first mount.
  useEffect(() => {
    if (token && status === 'loading') {
      void hydrateSession(dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SocketProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}
