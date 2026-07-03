import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/** Connect (or reconnect) the socket with the current access token. */
export function connectSocket(token: string): Socket {
  if (socket) {
    // update auth token and reconnect if needed
    (socket.auth as { token: string }).token = token;
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1500,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// Server → client event names (ARCHITECTURE §6)
export const SOCKET_EVENTS = {
  inventoryUpdated: 'inventory:updated',
  transferCreated: 'transfer:created',
  transferUpdated: 'transfer:updated',
  saleCreated: 'sale:created',
  notificationNew: 'notification:new',
  dashboardUpdate: 'dashboard:update',
} as const;
