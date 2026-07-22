import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Users,
  Settings2,
  Cloud,
  WifiOff,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useTheme } from './ThemeProvider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavigationProps {
  onLogout: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/activity',  label: 'Activity',  icon: ArrowLeftRight  },
  { path: '/invoices',  label: 'Invoices',  icon: FileText        },
  { path: '/clients',   label: 'Clients',   icon: Users           },
  { path: '/settings',  label: 'Settings',  icon: Settings2       },
];

const TAB_COUNT = NAV_ITEMS.length; // 5

// ─── Helper: resolve active tab index ────────────────────────────────────────

function resolveActiveIndex(pathname: string): number {
  const idx = NAV_ITEMS.findIndex((item) => pathname === item.path);
  // Fallback: match prefix (e.g. /invoices/new → invoices tab)
  if (idx !== -1) return idx;
  const prefix = NAV_ITEMS.findIndex((item) => pathname.startsWith(item.path + '/'));
  return prefix !== -1 ? prefix : 0;
}

// ─── Sub-component: Sync Indicator (header right) ────────────────────────────

const SyncDot: React.FC<{ status: string }> = ({ status }) => {
  const isOffline = status === 'offline' || status === 'error';

  if (isOffline) {
    return (
      <span
        className="relative flex items-center justify-center w-5 h-5"
        aria-label="Offline"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
      </span>
    );
  }

  // Synced / syncing → pulsing green dot
  return (
    <span className="relative flex h-2 w-2" aria-label="Synced">
      {/* Ping layer */}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
      {/* Solid core */}
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  );
};

// ─── Sub-component: Sync Detail (header left, hidden on mobile) ──────────────

const SyncDetail: React.FC<{ status: string }> = ({ status }) => {
  const isOffline = status === 'offline' || status === 'error';

  return (
    <span className="hidden sm:flex items-center gap-1">
      <Cloud
        className={`w-3 h-3 ${isOffline ? 'text-amber-500' : 'text-green-500'}`}
        aria-hidden="true"
      />
      <span
        className={`text-[11px] font-medium leading-none ${
          isOffline
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-green-500 dark:text-green-400'
        }`}
      >
        {isOffline ? (status === 'error' ? 'Sync Error' : 'Offline') : 'Synced · Drive'}
      </span>
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Navigation: React.FC<NavigationProps> = ({ onLogout: _onLogout }) => {
  const location   = useLocation();
  const syncStatus = useSyncStatus();
  const { theme, toggleTheme } = useTheme();

  const activeIndex = resolveActiveIndex(location.pathname);

  // ── Indicator spring position ──────────────────────────────────────────────
  // The CSS class `.nav-indicator` already carries the spring transition on
  // its `left` property (transition: left 320ms var(--ease-spring)).
  // We compute the `left` as the centre of the active tab column.
  // Each tab occupies (100 / TAB_COUNT)% of the bottom bar width.
  // Centre of active tab = (activeIndex + 0.5) / TAB_COUNT * 100%
  // The translateX(-50%) baked into `.nav-indicator` centres the 32px pill.
  const indicatorLeftPct = `${((activeIndex + 0.5) / TAB_COUNT) * 100}%`;

  // Prevent the indicator from animating on first paint (mount flash)
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const syncStatusValue =
    (syncStatus as { status?: string })?.status ?? 'synced';

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          TOP HEADER — fixed, z-40, 56px, glass-header
          ════════════════════════════════════════════════════════════════════ */}
      <header
        className="glass-header fixed inset-x-0 top-0 z-40 flex items-center"
        style={{ height: '56px' }}
        role="banner"
      >
        <div className="w-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">

          {/* ── LEFT: Brand mark + wordmark + sync detail ── */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 min-w-0"
            aria-label="Bookkeeper home"
          >
            {/* 'B' gradient mark — 36×36, rounded-xl */}
            <span
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
                boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
              }}
              aria-hidden="true"
            >
              <span
                className="text-white font-bold text-base leading-none select-none"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                B
              </span>
            </span>

            {/* Wordmark */}
            <span
              className="font-bold text-[15px] leading-none text-slate-900 dark:text-slate-100 select-none"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              Bookkeeper
            </span>

            {/* Sync detail — hidden on mobile, visible sm+ */}
            <SyncDetail status={syncStatusValue} />
          </Link>

          {/* ── RIGHT: Sync dot + theme toggle ── */}
          <div className="flex items-center gap-2">

            {/* Pulsing sync dot */}
            <SyncDot status={syncStatusValue} />

            {/* Theme toggle — 44×44 minimum touch target */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={[
                'relative flex items-center justify-center',
                'w-11 h-11 rounded-xl',
                'text-slate-600 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-white/[0.06]',
                'focus-visible:ring-2 focus-visible:ring-indigo-500',
                'transition-colors duration-200',
              ].join(' ')}
            >
              {theme === 'dark' ? (
                <Sun
                  className="w-[18px] h-[18px] text-amber-400"
                  aria-hidden="true"
                />
              ) : (
                <Moon
                  className="w-[18px] h-[18px] text-slate-600"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM NAV — fixed, z-40, glass-nav, safe-area aware
          ════════════════════════════════════════════════════════════════════ */}
      <nav
        className="glass-nav fixed inset-x-0 bottom-0 z-40"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
        aria-label="Main navigation"
      >
        {/* Wrapper is `relative` so the absolute indicator positions against it */}
        <div className="relative">

          {/* ── Shared spring indicator pill ── */}
          {/* Uses the .nav-indicator CSS class from index.css which handles:
              - position: absolute; top: 0; height: 3px; width: 32px
              - border-radius: 0 0 4px 4px
              - indigo gradient background
              - transition: left 320ms var(--ease-spring)
              - transform: translateX(-50%) to centre on left anchor          */}
          <span
            aria-hidden="true"
            className="nav-indicator"
            style={{
              left: indicatorLeftPct,
              // Suppress spring on first render to avoid 0→activeTab flash
              transition: mounted ? undefined : 'none',
            }}
          />

          {/* ── Tab items ── */}
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item, i) => {
              const Icon     = item.icon;
              const isActive = i === activeIndex;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    // Layout
                    'relative flex flex-col items-center justify-center gap-[3px]',
                    'min-h-[56px] px-1 py-2',
                    // Typography
                    'text-[10px] font-semibold leading-none',
                    // Smooth colour transition
                    'transition-all duration-300',
                    // Active / inactive colour
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400',
                    'select-none',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'w-5 h-5',
                      'transition-all duration-300',
                      isActive ? 'scale-[1.12]' : 'scale-100',
                    ].join(' ')}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};
