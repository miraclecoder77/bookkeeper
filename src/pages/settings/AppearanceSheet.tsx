import React from 'react';
import { Modal } from './Modal';
import { Theme, useTheme } from '../../components/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Bright and high-contrast',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follows your OS preference',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
  },
];

interface AppearanceSheetProps {
  open: boolean;
  onClose: () => void;
}

export const AppearanceSheet: React.FC<AppearanceSheetProps> = ({ open, onClose }) => {
  const { theme, setTheme } = useTheme();

  return (
    <Modal open={open} onClose={onClose} title="Appearance" position="center" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-secondary">
          Choose how Bookkeeper looks. System default adapts automatically to your operating system.
        </p>

        {/* Card grid */}
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl p-3 border-2 transition-all ${
                  active
                    ? 'border-brand bg-brand/5 shadow-sm'
                    : 'border-default hover:border-border-strong bg-surface-2 hover:bg-surface'
                }`}
                aria-pressed={active}
              >
                {/* Theme preview swatch */}
                <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${
                  opt.value === 'light'
                    ? 'bg-white border border-slate-200 shadow-sm'
                    : opt.value === 'dark'
                    ? 'bg-slate-900 border border-slate-700'
                    : 'bg-gradient-to-br from-white to-slate-900 border border-slate-300'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    opt.value === 'light' ? 'text-amber-500'
                    : opt.value === 'dark' ? 'text-indigo-400'
                    : 'text-slate-500'
                  }`} />
                </div>
                <span className={`text-xs font-bold ${active ? 'text-brand' : 'text-secondary'}`}>
                  {opt.label}
                </span>
                {active && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>

        {/* Description of active choice */}
        <p className="text-xs text-secondary text-center">
          {THEME_OPTIONS.find(o => o.value === theme)?.description}
        </p>

        <button onClick={onClose} className="btn btn-ghost w-full rounded-xl">Done</button>
      </div>
    </Modal>
  );
};
