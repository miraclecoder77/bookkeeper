import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  rightSlot?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * Shared settings list row: icon + label/description + right slot.
 * Pass onClick to get a hover/active pointer state.
 * Pass rightSlot for a custom right side (badge, toggle, chevron, etc.).
 */
export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  description,
  rightSlot,
  onClick,
  danger = false,
}) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`w-full min-h-[56px] flex items-center px-4 py-3 gap-3 text-left transition-colors ${
        onClick ? 'cursor-pointer hover:bg-surface-2 active:bg-surface-2' : ''
      }`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border shadow-sm ${
        danger
          ? 'bg-red-500/10 border-red-500/20 text-expense'
          : 'bg-surface-2 border-default text-secondary'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${danger ? 'text-expense' : 'text-primary'}`}>{label}</p>
        {description && (
          <p className="text-xs text-secondary truncate">{description}</p>
        )}
      </div>
      {rightSlot !== undefined ? (
        <div className="shrink-0 flex items-center gap-2">{rightSlot}</div>
      ) : onClick ? (
        <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
      ) : null}
    </Tag>
  );
};

/** Pill badge for settings rows */
export const StatusPill: React.FC<{ label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'muted' }> = ({ label, variant }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    muted: 'bg-surface-2 text-secondary',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[variant]}`}>
      {label}
    </span>
  );
};

/** Inline toggle switch */
export const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${
      checked ? 'bg-indigo-600' : 'bg-surface-2 border border-default'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/** Section divider inside a card group */
export const GroupDivider: React.FC = () => (
  <div className="h-px bg-border mx-4" />
);
