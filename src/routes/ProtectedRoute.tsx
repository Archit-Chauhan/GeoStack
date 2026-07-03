import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Spinner } from '@/components/ui/Spinner';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAppSelector((s) => s.auth.status);
  const token = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  // Still hydrating from a persisted token → show a splash.
  if (status === 'loading' && token) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--primary)' }}>
            <Spinner size={28} />
          </span>
          <span style={{ fontSize: 13 }}>Loading your workspace…</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
