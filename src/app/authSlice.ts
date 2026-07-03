import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
}

const TOKEN_KEY = 'geostock-token';
const USER_KEY = 'geostock-user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

const initialToken = loadToken();
const initialUser = loadUser();

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialToken,
  // If we have a token we optimistically consider ourselves loading (hydrate via /auth/me)
  status: initialToken ? 'loading' : 'unauthenticated',
};

function persist(user: User | null, token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'authenticated';
      persist(state.user, state.accessToken);
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      persist(state.user, state.accessToken);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = 'authenticated';
      persist(state.user, state.accessToken);
    },
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
      persist(null, null);
    },
  },
});

export const { setCredentials, setAccessToken, setUser, setStatus, logout } = authSlice.actions;
export default authSlice.reducer;
