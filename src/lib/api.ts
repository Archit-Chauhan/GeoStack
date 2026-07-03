import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

// =====================================================================
// axios instance — attaches Bearer token, refreshes on 401 once,
// unwraps the { success, data, message } envelope for callers.
// =====================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// --- token bridge (Redux store injects getters/setters to avoid a cycle) ---
type TokenBridge = {
  getToken: () => string | null;
  setToken: (t: string | null) => void;
  onAuthFailure: () => void;
};

let bridge: TokenBridge = {
  getToken: () => {
    try {
      return localStorage.getItem('geostock-token');
    } catch {
      return null;
    }
  },
  setToken: (t) => {
    try {
      if (t) localStorage.setItem('geostock-token', t);
      else localStorage.removeItem('geostock-token');
    } catch {
      /* ignore */
    }
  },
  onAuthFailure: () => {
    /* replaced by store */
  },
};

export function configureApi(next: Partial<TokenBridge>): void {
  bridge = { ...bridge, ...next };
}

// --- request: attach bearer ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = bridge.getToken();
  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- response: unwrap + refresh on 401 ---
interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token: string | undefined = res.data?.data?.accessToken;
    if (token) {
      bridge.setToken(token);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute = url.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      if (!refreshing) refreshing = doRefresh();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        return api(original);
      }
      bridge.setToken(null);
      bridge.onAuthFailure();
    }
    return Promise.reject(error);
  }
);

/** Extract a human message from an axios error / envelope. */
export function apiMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: unknown } | undefined;
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// --- typed helpers that unwrap res.data.data ---
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get(url, config);
  return res.data.data as T;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post(url, body, config);
  return res.data.data as T;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch(url, body, config);
  return res.data.data as T;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete(url, config);
  return res.data.data as T;
}
