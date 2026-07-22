import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../components/ThemeProvider';
import {
  ShieldCheck, Cloud, Bell, ChevronRight, Edit2,
  Sun, Moon, Lock, HelpCircle, Briefcase
} from 'lucide-react';

// Custom toggle switch component
const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-indigo-600' : 'bg-surface-2 border border-default'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0 border border-default/50'
      }`}
    />
  </button>
);

export const Settings: React.FC = () => {
  const { profile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();

  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const name = profile?.displayName || 'Jordan Harris';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const businessName = profile?.businessName || 'Northstar Design Ltd';
  const email = profile?.email || (name.toLowerCase().split(' ')[0] + '@northstar.design');

  return (
    <div className="space-y-6 pb-6 max-w-3xl mx-auto">
      {/* 1. HEADER */}
      <div>
        <p className="text-secondary text-[12px] font-bold uppercase tracking-widest mb-1">
          Workspace & account
        </p>
        <h1 className="font-display font-bold text-2xl text-primary">Settings</h1>
      </div>

      {/* 2. PROFILE CARD */}
      <div className="bg-surface rounded-2xl p-4 border border-default shadow-card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-gradient shrink-0 flex items-center justify-center shadow-sm">
          <span className="font-display font-bold text-white text-lg">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-primary truncate">{name}</p>
          <p className="text-sm text-secondary truncate">{email}</p>
        </div>
        <button className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-2 hover:text-primary transition-colors border border-transparent hover:border-default">
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      {/* 3. SETTINGS GROUPS */}
      <div className="space-y-6">
        {/* Group 1: Workspace */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-3 ml-1">Workspace</h2>
          <div className="bg-surface rounded-2xl border border-default shadow-sm divide-y divide-default">
            
            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">Business profile</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-secondary truncate max-w-[120px] sm:max-w-[160px]">{businessName}</p>
                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
              </div>
            </div>

            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">Google Drive sync</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-bold">Connected</span>
                <span className="text-xs text-secondary hidden sm:inline">Synced 2 min ago</span>
                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
              </div>
            </div>

            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">Data & backups</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary hidden sm:inline">Your data stays on device</span>
                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
              </div>
            </div>

          </div>
        </div>

        {/* Group 2: Preferences */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-3 ml-1">Preferences</h2>
          <div className="bg-surface rounded-2xl border border-default shadow-sm divide-y divide-default">
            
            <div className="min-h-[56px] flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-primary truncate">Appearance</p>
                  <p className="text-xs text-secondary truncate">Switch between light and dark</p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className="w-11 h-11 shrink-0 rounded-xl bg-surface-2 hover:bg-surface-3 border border-default flex items-center justify-center text-secondary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            </div>

            <div className="min-h-[56px] flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-primary truncate">Payment reminders</p>
                  <p className="text-xs text-secondary truncate hidden sm:block">Nudge clients before invoices are due</p>
                </div>
              </div>
              <Toggle checked={remindersEnabled} onChange={() => setRemindersEnabled(!remindersEnabled)} />
            </div>

          </div>
        </div>

        {/* Group 3: Privacy & support */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-3 ml-1">Privacy & support</h2>
          <div className="bg-surface rounded-2xl border border-default shadow-sm divide-y divide-default">
            
            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-sm text-primary">Privacy controls</p>
                <p className="text-xs text-secondary truncate hidden sm:block mr-2">Offline-first & encrypted</p>
              </div>
              <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
            </div>

            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-sm text-primary">Security</p>
                <p className="text-xs text-secondary truncate hidden sm:block mr-2">Passcode & biometric unlock</p>
              </div>
              <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
            </div>

            <div className="min-h-[56px] flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-2 shrink-0 flex items-center justify-center text-secondary border border-default shadow-sm">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">Help & feedback</p>
              </div>
              <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
            </div>

          </div>
        </div>
      </div>

      {/* 4. BOTTOM PRIVACY NOTE */}
      <div className="bg-surface rounded-2xl p-4 border border-default shadow-sm flex gap-3 mt-8">
        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
        <p className="text-[13px] text-secondary leading-relaxed">
          <strong className="text-primary font-semibold">Private by design.</strong> Bookkeeper keeps your data local and only syncs to the Google Drive folder you control.
        </p>
      </div>

    </div>
  );
};
