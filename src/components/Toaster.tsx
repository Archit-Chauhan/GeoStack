import { Toaster as HotToaster } from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';

/** react-hot-toast styled to the GeoStock theme (flat surfaces, hairline border). */
export function Toaster() {
  const theme = useAppSelector((s) => s.ui.theme);
  const isDark = theme === 'dark';
  return (
    <HotToaster
      position="bottom-right"
      gutter={12}
      toastOptions={{
        duration: 5000,
        style: {
          background: isDark ? '#1e2329' : '#ffffff',
          color: isDark ? '#eaecef' : '#181a20',
          border: `1px solid ${isDark ? '#2b3139' : '#eaecef'}`,
          borderRadius: '8px',
          fontSize: '13px',
          padding: '12px 14px',
          boxShadow: isDark ? '0 8px 30px rgba(0,0,0,.45)' : '0 8px 30px rgba(15,23,42,.08)',
          maxWidth: '380px',
        },
        success: { iconTheme: { primary: '#0ecb81', secondary: isDark ? '#1e2329' : '#fff' } },
        error: { iconTheme: { primary: '#f6465d', secondary: isDark ? '#1e2329' : '#fff' } },
      }}
    />
  );
}
