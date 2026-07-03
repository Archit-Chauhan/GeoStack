import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { qk } from '@/lib/queryClient';
import type { AppNotification } from '@/types';

/**
 * Mounts the Socket.IO connection once the user is authenticated and wires
 * every server event to TanStack Query cache invalidation (keeps data live).
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const status = useAppSelector((s) => s.auth.status);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || status !== 'authenticated') return;

    const socket = connectSocket(token);

    const invalidate = (keys: readonly unknown[][]) => {
      keys.forEach((key) => qc.invalidateQueries({ queryKey: key as unknown[] }));
    };

    const onInventory = () =>
      invalidate([
        ['inventory'],
        qk.lowStock as unknown as unknown[],
        qk.analyticsOverview as unknown as unknown[],
        qk.stockByCategory as unknown as unknown[],
        qk.analyticsLowStock as unknown as unknown[],
      ]);

    const onTransfer = () =>
      invalidate([
        ['transfers'],
        ['inventory'],
        qk.analyticsOverview as unknown as unknown[],
      ]);

    const onSale = () =>
      invalidate([
        ['sales'],
        ['inventory'],
        qk.analyticsOverview as unknown as unknown[],
        qk.fastMoving as unknown as unknown[],
      ]);

    const onDashboard = () =>
      invalidate([
        qk.analyticsOverview as unknown as unknown[],
        qk.throughput(7) as unknown as unknown[],
        qk.stockByCategory as unknown as unknown[],
      ]);

    const onNotification = (payload: { notification?: AppNotification }) => {
      const n = payload?.notification;
      if (n) {
        const icon = n.level === 'critical' ? '⛔' : n.level === 'warning' ? '⚠️' : '🔔';
        toast(`${n.title}`, { icon });
      }
      qc.invalidateQueries({ queryKey: qk.notifications as unknown as unknown[] });
    };

    socket.on(SOCKET_EVENTS.inventoryUpdated, onInventory);
    socket.on(SOCKET_EVENTS.transferCreated, onTransfer);
    socket.on(SOCKET_EVENTS.transferUpdated, onTransfer);
    socket.on(SOCKET_EVENTS.saleCreated, onSale);
    socket.on(SOCKET_EVENTS.dashboardUpdate, onDashboard);
    socket.on(SOCKET_EVENTS.notificationNew, onNotification);

    return () => {
      socket.off(SOCKET_EVENTS.inventoryUpdated, onInventory);
      socket.off(SOCKET_EVENTS.transferCreated, onTransfer);
      socket.off(SOCKET_EVENTS.transferUpdated, onTransfer);
      socket.off(SOCKET_EVENTS.saleCreated, onSale);
      socket.off(SOCKET_EVENTS.dashboardUpdate, onDashboard);
      socket.off(SOCKET_EVENTS.notificationNew, onNotification);
    };
  }, [token, status, qc]);

  useEffect(() => {
    return () => {
      if (status !== 'authenticated') disconnectSocket();
    };
  }, [status]);

  return <>{children}</>;
}
