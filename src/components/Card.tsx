import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
  hover,
}) => {
  const variants: Record<string, string> = {
    default:
      'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-card',
    elevated:
      'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/40 shadow-elevated',
    glass:
      'glass-light dark:glass shadow-card',
    gradient:
      'bg-gradient-card border border-brand-200/50 dark:border-brand-800/30 shadow-card',
  };

  const paddings: Record<string, string> = {
    none: '',
    sm:   'p-3 sm:p-4',
    md:   'p-4 sm:p-6',
    lg:   'p-6 sm:p-8',
  };

  const hoverStyles =
    (hover || onClick)
      ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-card transition-all duration-200'
      : '';

  return (
    <div
      className={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
