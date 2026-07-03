import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'dark' | 'light';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileDrawer: boolean;
}

const THEME_KEY = 'geostock-theme';
const COLLAPSE_KEY = 'geostock-collapsed';

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  } catch {
    return false;
  }
}

const initialState: UiState = {
  theme: loadTheme(),
  sidebarCollapsed: loadCollapsed(),
  mobileDrawer: false,
};

// apply immediately so first paint is correct
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialState.theme);
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      try {
        localStorage.setItem(THEME_KEY, state.theme);
      } catch {
        /* ignore */
      }
      document.documentElement.setAttribute('data-theme', state.theme);
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, state.theme);
      } catch {
        /* ignore */
      }
      document.documentElement.setAttribute('data-theme', state.theme);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(state.sidebarCollapsed));
      } catch {
        /* ignore */
      }
    },
    setMobileDrawer(state, action: PayloadAction<boolean>) {
      state.mobileDrawer = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, toggleSidebar, setMobileDrawer } = uiSlice.actions;
export default uiSlice.reducer;
