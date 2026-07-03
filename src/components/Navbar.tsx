import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, PanelLeft, Search, Sun, LogOut, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/app/hooks';
import { setMobileDrawer, toggleSidebar, toggleTheme } from '@/app/uiSlice';
import { useLogout } from '@/features/auth/useAuth';
import { useMarkAllRead, useNotifications } from '@/features/notifications/useNotifications';
import { initials, timeAgo } from '@/lib/format';
import { eid } from '@/lib/entity';
import { cn } from '@/lib/cn';

export function Navbar({ title, crumb }: { title: string; crumb?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const theme = useAppSelector((s) => s.ui.theme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useNotifications();
  const markAll = useMarkAllRead();
  const logout = useLogout();
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="topnav">
      <button
        className="icon-btn hamburger"
        onClick={() => dispatch(setMobileDrawer(true))}
        aria-label="menu"
      >
        <Menu size={18} />
      </button>
      <button className="icon-btn" onClick={() => dispatch(toggleSidebar())} aria-label="collapse sidebar">
        <PanelLeft size={18} />
      </button>

      <div className="page-title">
        {title} {crumb ? <span className="crumb">· {crumb}</span> : null}
      </div>

      <div className="searchbar">
        <Search size={16} />
        <input placeholder="Search warehouses, SKUs, transfers…" aria-label="search" />
        <kbd>Ctrl K</kbd>
      </div>

      <div className="nav-right" ref={wrapRef} style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => dispatch(toggleTheme())} aria-label="toggle theme">
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* notifications */}
        <button
          className="icon-btn"
          onClick={() => {
            setNotifOpen((v) => !v);
            setAvatarOpen(false);
          }}
          aria-label="notifications"
        >
          <Bell size={18} />
          {unread > 0 ? <span className="dot" /> : null}
        </button>

        {notifOpen ? (
          <div className="menu-pop">
            <div className="menu-pop__head">
              <span>Notifications</span>
              {unread > 0 ? (
                <button className="link" style={{ fontSize: 12 }} onClick={() => markAll.mutate()}>
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="menu-list">
              {(notifications ?? []).length === 0 ? (
                <div className="menu-item" style={{ cursor: 'default' }}>
                  <div className="msg">You're all caught up.</div>
                </div>
              ) : (
                (notifications ?? []).slice(0, 8).map((n) => (
                  <div key={eid(n)} className={cn('menu-item', !n.read && 'unread')}>
                    <span className={cn('lvl', n.level)} />
                    <div>
                      <div className="ttl">{n.title}</div>
                      <div className="msg">{n.message}</div>
                      <div className="tm">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* avatar menu */}
        <button
          className="avatar-btn"
          onClick={() => {
            setAvatarOpen((v) => !v);
            setNotifOpen(false);
          }}
        >
          <span className="av" style={user?.avatarColor ? { background: user.avatarColor } : undefined}>
            {initials(user?.name)}
          </span>
          <span className="nm">{user?.name?.split(' ')[0] ?? 'User'}</span>
          <span className="mute">▾</span>
        </button>

        {avatarOpen ? (
          <div className="menu-pop narrow">
            <div className="menu-pop__head" style={{ display: 'block' }}>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div className="card__sub" style={{ marginTop: 2 }}>{user?.email}</div>
            </div>
            <div className="menu-row" onClick={() => { setAvatarOpen(false); navigate('/settings'); }}>
              <UserIcon size={16} /> Profile &amp; settings
            </div>
            <div className="menu-row" onClick={() => { setAvatarOpen(false); dispatch(toggleTheme()); }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Switch theme
            </div>
            <div
              className="menu-row"
              style={{ color: 'var(--down)', borderTop: '1px solid var(--hairline)' }}
              onClick={() => logout.mutate()}
            >
              <LogOut size={16} /> Sign out
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
