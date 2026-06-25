import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  Users,
  Settings,
  LogOut,
  Cloud,
  CloudOff,
  Loader,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { Badge } from './Badge';
import { useTheme } from './ThemeProvider';

interface NavigationProps {
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const location = useLocation();
  const syncStatus = useSyncStatus();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ArrowUpDown },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const getSyncIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'local':
        return <CloudOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
      default:
        return <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />;
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Badge variant="primary">Syncing...</Badge>;
      case 'offline':
        return <Badge variant="warning">Offline</Badge>;
      case 'error':
        return <Badge variant="danger">Sync Error</Badge>;
      case 'local':
        return <Badge variant="gray">Local Mode</Badge>;
      default:
        return <Badge variant="success">Synced</Badge>;
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-150">Bookkeeper</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - Sync Status, Theme Toggle & Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getSyncIcon()}
              {getSyncBadge()}
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-500 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
