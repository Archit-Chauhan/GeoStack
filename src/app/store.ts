import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout, setAccessToken } from './authSlice';
import uiReducer from './uiSlice';
import { configureApi } from '@/lib/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

// Wire the axios token bridge to the Redux store (avoids an import cycle).
configureApi({
  getToken: () => store.getState().auth.accessToken,
  setToken: (t) => store.dispatch(setAccessToken(t)),
  onAuthFailure: () => {
    store.dispatch(logout());
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
