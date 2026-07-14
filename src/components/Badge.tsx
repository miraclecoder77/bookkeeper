import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants: Record<string, string> = {
    primary: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-800/40',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400 ring-1 ring-success-200/60 dark:ring-success-800/40',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400 ring-1 ring-warning-200/60 dark:ring-warning-800/40',
    danger:  'bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400 ring-1 ring-danger-200/60 dark:ring-danger-800/40',
    gray:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-slate-200/60 dark:ring-slate-600/40',
    purple:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200/60 dark:ring-purple-800/40',
  };

  const dotColors: Record<string, string> = {
    primary: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger:  'bg-danger-500',
    gray:    'bg-slate-400',
    purple:  'bg-purple-500',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
