import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  Users,
  Settings,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useSettings } from '../hooks/useSettings';
import { Badge } from './Badge';
import { useTheme } from './ThemeProvider';

interface NavigationProps {
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const location = useLocation();
  const syncStatus = useSyncStatus();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions',  icon: ArrowUpDown },
    { path: '/invoices',     label: 'Invoices',      icon: FileText },
    { path: '/clients',      label: 'Clients',       icon: Users },
    { path: '/capture',      label: 'OCR Capture',    icon: Camera },
    { path: '/insights',     label: 'AI Insights',   icon: Sparkles },
    { path: '/settings',     label: 'Settings',      icon: Settings },
  ];

  const getSyncIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Loader2 className="w-4 h-4 animate-spin text-brand-500 dark:text-brand-400" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-warning-500 dark:text-warning-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger-500 dark:text-danger-400" />;
      case 'local':
        return <CloudOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
      default:
        return <Cloud className="w-4 h-4 text-success-500 dark:text-success-400" />;
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus.status) {
      case 'syncing': return <Badge variant="primary" dot>Syncing…</Badge>;
      case 'offline': return <Badge variant="warning" dot>Offline</Badge>;
      case 'error':   return <Badge variant="danger"  dot>Sync Error</Badge>;
      case 'local':   return <Badge variant="gray"    dot>Local Mode</Badge>;
      default:        return <Badge variant="success" dot>Synced</Badge>;
    }
  };

  return (
    <>
      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center shadow-sm shadow-brand-600/25">
                <span className="text-white font-display font-bold text-sm">B</span>
              </div>
              <span className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Bookkeeper
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all duration-150 ${
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Sync status — full badge on desktop, icon-only on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                {getSyncIcon()}
                {getSyncBadge()}
              </div>
              <div
                className="flex sm:hidden items-center"
                title={`Sync: ${syncStatus.status}`}
              >
                {getSyncIcon()}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Logout */}
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 min-h-[40px] px-2 py-1 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Business settings"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                  {settings?.logo ? (
                    <img src={settings.logo} alt={settings?.name || 'Logo'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-display font-bold text-slate-700 dark:text-slate-100">{(settings?.name?.[0] || 'B').toUpperCase()}</span>
                  )}
                </div>
                <span className="hidden sm:inline">{settings?.name || 'Business'}</span>
              </Link>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-2 sm:px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/80 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center gap-1 py-3 px-1 min-h-[56px] text-[10px] font-semibold transition-all duration-200 ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {/* Active indicator pill */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-brand-600 dark:bg-brand-400"
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};
