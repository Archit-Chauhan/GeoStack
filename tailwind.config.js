/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand — the single accent
        primary: 'var(--primary)',
        'primary-active': 'var(--primary-active)',
        'primary-disabled': 'var(--primary-disabled)',
        'on-primary': 'var(--on-primary)',
        // Trading semantics
        up: 'var(--up)',
        down: 'var(--down)',
        info: 'var(--info)',
        // Surfaces + text (theme-aware via CSS vars)
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        hairline: 'var(--hairline)',
        text: 'var(--text)',
        'text-strong': 'var(--text-strong)',
        muted: 'var(--muted)',
        'muted-strong': 'var(--muted-strong)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        num: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          to: { transform: 'translateX(100%)' },
        },
        dash: {
          to: { strokeDashoffset: '-26' },
        },
      },
      animation: {
        reveal: 'reveal .5s ease forwards',
        shimmer: 'shimmer 1.4s infinite',
        dash: 'dash 1.1s linear infinite',
      },
    },
  },
  plugins: [],
};
