import { useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';

// Theme-CONSTANT brand + trading colors. Safe to use as raw SVG attribute
// values (CSS var() does NOT resolve inside SVG presentation attributes).
export const COLORS = {
  primary: '#fcd535',
  primaryActive: '#f0b90b',
  onPrimary: '#181a20',
  up: '#0ecb81',
  down: '#f6465d',
  info: '#3b82f6',
};

// Theme-DEPENDENT tones, resolved to concrete hex for charts/SVG.
const THEME_COLORS = {
  dark: {
    elevated: '#2b3139',
    hairline: '#2b3139',
    muted: '#707a8a',
    surface: '#1e2329',
    text: '#eaecef',
    neutral: '#929aa5',
  },
  light: {
    elevated: '#e9edf2',
    hairline: '#eaecef',
    muted: '#707a8a',
    surface: '#ffffff',
    text: '#181a20',
    neutral: '#5a6472',
  },
};

export type ThemeColors = (typeof THEME_COLORS)['dark'] & typeof COLORS;

/** Concrete color set for the current theme (recomputes on theme flip). */
export function useThemeColors(): ThemeColors {
  const theme = useAppSelector((s) => s.ui.theme);
  const [colors, setColors] = useState<ThemeColors>({ ...THEME_COLORS[theme], ...COLORS });
  useEffect(() => {
    setColors({ ...THEME_COLORS[theme], ...COLORS });
  }, [theme]);
  return colors;
}

/** Categorical palette for donut/pie series (theme-constant, brand-led). */
export const CATEGORY_PALETTE = [
  COLORS.primary,
  COLORS.up,
  COLORS.info,
  '#9b6dff',
  COLORS.down,
  '#f0932b',
];
