import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../components/ThemeProvider';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useAppPreferences } from '../hooks/useAppPreferences';
import {
  ShieldCheck, Cloud, Bell, Edit2,
  Sun, Moon, Monitor, Lock, HelpCircle, Briefcase,
  Database, Fingerprint, LogOut
} from 'lucide-react';

// Sub-sheets
import { ProfileEditModal }        from './settings/ProfileEditModal';
import { BusinessProfileSheet }    from './settings/BusinessProfileSheet';
import { GoogleDriveSheet }        from './settings/GoogleDriveSheet';
import { DataBackupsSheet }        from './settings/DataBackupsSheet';
import { AppearanceSheet }         from './settings/AppearanceSheet';
import { PaymentRemindersSheet }   from './settings/PaymentRemindersSheet';
import { PrivacySheet }            from './settings/PrivacySheet';
import { SecuritySheet }           from './settings/SecuritySheet';
import { HelpFeedbackSheet }       from './settings/HelpFeedbackSheet';
import { SettingsRow, StatusPill, Toggle } from './settings/SettingsRow';

// ─── Toggle (local alias for inline rows) ─────────────────────────────────
// (Already exported from SettingsRow, just using it here)

type Sheet =
  | 'profile'
  | 'business'
  | 'drive'
  | 'backups'
  | 'appearance'
  | 'reminders'
  | 'privacy'
  | 'security'
  | 'help'
  | null;

// ─── Row group wrapper ────────────────────────────────────────────────────
const RowGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <h2 className="text-sm font-bold text-primary mb-3 ml-1">{label}</h2>
    <div className="bg-surface rounded-2xl border border-default shadow-sm divide-y divide-default overflow-hidden">
      {children}
    </div>
  </div>
);

interface SettingsProps {
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const { profile, updateProfile } = useUserProfile();
  const { theme, resolvedTheme } = useTheme();
  const syncStatus = useSyncStatus();
  const { prefs, updatePrefs } = useAppPreferences();

  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const open  = (sheet: Sheet) => setActiveSheet(sheet);
  const close = ()              => setActiveSheet(null);

  // ── Derived display values ──────────────────────────────────────────────
  const name         = profile?.displayName || 'your brand name';
  const email        = profile?.email       || 'email@example.com';
  const businessName = profile?.businessName || profile?.displayName || 'Northstar Design Ltd';
  const initials     = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Sync status pill
  const driveConnected = profile?.syncMode === 'electric_cloud';
  const syncLabel      = driveConnected
    ? syncStatus.status === 'syncing' ? 'Syncing…' : 'Connected'
    : 'Local only';
  const syncVariant    = driveConnected
    ? (syncStatus.status === 'syncing' ? 'yellow' : 'green')
    : 'muted';

  const themeIcon =
    theme === 'system' ? <Monitor className="w-4 h-4" />
    : resolvedTheme === 'dark' ? <Moon className="w-4 h-4" />
    : <Sun className="w-4 h-4" />;

  const themeLabel =
    theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  // ── Profile save handler ────────────────────────────────────────────────
  const handleProfileSave = async (patch: Partial<typeof profile>) => {
    if (!patch) return;
    await updateProfile(patch as any);
  };

  return (
    <>
      {/* ── Page layout ─────────────────────────────────────────────────── */}
      <div className="space-y-6 pb-6 max-w-3xl mx-auto">

        {/* Header */}
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-widest mb-1">
            Workspace &amp; account
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Settings</h1>
        </div>

        {/* Profile card */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card flex items-center gap-4">
          {/* Avatar — show logo if set, else initials */}
          {profile?.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover shrink-0 border border-default shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-gradient shrink-0 flex items-center justify-center shadow-sm">
              <span className="font-display font-bold text-white text-lg">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-primary truncate">{name}</p>
            <p className="text-sm text-secondary truncate">{email}</p>
          </div>
          <button
            onClick={() => open('profile')}
            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-2 hover:text-primary transition-colors border border-transparent hover:border-default"
            aria-label="Edit profile"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Settings groups */}
        <div className="space-y-6">

          {/* ── Workspace ───────────────────────────────────────────────── */}
          <RowGroup label="Workspace">
            <SettingsRow
              icon={<Briefcase className="w-4 h-4" />}
              label="Business profile"
              rightSlot={<span className="text-xs text-secondary truncate max-w-[120px] sm:max-w-[160px]">{businessName}</span>}
              onClick={() => open('business')}
            />
            <SettingsRow
              icon={<Cloud className="w-4 h-4" />}
              label="Google Drive sync"
              rightSlot={
                <>
                  <StatusPill label={syncLabel} variant={syncVariant} />
                  {driveConnected && (
                    <span className="text-xs text-secondary hidden sm:inline">
                      {syncStatus.lastSync
                        ? `${Math.floor((Date.now() - syncStatus.lastSync.getTime()) / 60000)} min ago`
                        : 'Synced recently'}
                    </span>
                  )}
                </>
              }
              onClick={() => open('drive')}
            />
            <SettingsRow
              icon={<Database className="w-4 h-4" />}
              label="Data &amp; backups"
              description="Export, import, or purge local data"
              onClick={() => open('backups')}
            />
          </RowGroup>

          {/* ── Preferences ─────────────────────────────────────────────── */}
          <RowGroup label="Preferences">
            <SettingsRow
              icon={themeIcon}
              label="Appearance"
              description={`${themeLabel} theme`}
              onClick={() => open('appearance')}
            />
            <SettingsRow
              icon={<Bell className="w-4 h-4" />}
              label="Payment reminders"
              description="Nudge clients before invoices are due"
              rightSlot={
                <Toggle
                  checked={prefs.remindersEnabled}
                  onChange={() => {
                    // Quick toggle from the row; full config in the sheet
                    updatePrefs({ remindersEnabled: !prefs.remindersEnabled });
                  }}
                  label="Toggle reminders"
                />
              }
              onClick={() => open('reminders')}
            />
          </RowGroup>

          {/* ── Privacy &amp; support ────────────────────────────────────── */}
          <RowGroup label="Privacy &amp; support">
            <SettingsRow
              icon={<ShieldCheck className="w-4 h-4" />}
              label="Privacy controls"
              description="Offline-first &amp; encrypted"
              onClick={() => open('privacy')}
            />
            <SettingsRow
              icon={<Lock className="w-4 h-4" />}
              label="Security"
              description={prefs.passcodeEnabled ? 'Passcode enabled' : 'Passcode &amp; biometric unlock'}
              rightSlot={prefs.passcodeEnabled ? <StatusPill label="Enabled" variant="green" /> : undefined}
              onClick={() => open('security')}
            />
            <SettingsRow
              icon={<HelpCircle className="w-4 h-4" />}
              label="Help &amp; feedback"
              onClick={() => open('help')}
            />
            {onLogout && (
              <SettingsRow
                icon={<LogOut className="w-4 h-4 text-red-500" />}
                label={<span className="text-red-500">Log out</span>}
                onClick={onLogout}
              />
            )}
          </RowGroup>
        </div>

        {/* Bottom privacy note */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-sm flex gap-3 mt-2">
          <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-secondary leading-relaxed">
            <strong className="text-primary font-semibold">Private by design.</strong>{' '}
            Bookkeeper keeps your data local and only syncs to the Google Drive folder you control.
          </p>
        </div>
      </div>

      {/* ── Sub-sheets / modals ─────────────────────────────────────────── */}
      <ProfileEditModal
        open={activeSheet === 'profile'}
        onClose={close}
        profile={profile}
        onSave={handleProfileSave}
      />

      <BusinessProfileSheet
        open={activeSheet === 'business'}
        onClose={close}
        profile={profile}
        onSave={updateProfile}
      />

      <GoogleDriveSheet
        open={activeSheet === 'drive'}
        onClose={close}
        conflictStrategy={prefs.conflictStrategy}
        onUpdateConflictStrategy={s => updatePrefs({ conflictStrategy: s })}
      />

      <DataBackupsSheet
        open={activeSheet === 'backups'}
        onClose={close}
      />

      <AppearanceSheet
        open={activeSheet === 'appearance'}
        onClose={close}
      />

      <PaymentRemindersSheet
        open={activeSheet === 'reminders'}
        onClose={close}
        prefs={prefs}
        onUpdate={updatePrefs}
      />

      <PrivacySheet
        open={activeSheet === 'privacy'}
        onClose={close}
      />

      <SecuritySheet
        open={activeSheet === 'security'}
        onClose={close}
        prefs={prefs}
        onUpdate={updatePrefs}
      />

      <HelpFeedbackSheet
        open={activeSheet === 'help'}
        onClose={close}
      />
    </>
  );
};
