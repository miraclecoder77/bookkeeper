import { useState, useCallback } from 'react';
import { AppPreferences } from '../types';

const PREFS_KEY = 'bookkeeper-app-prefs';

const DEFAULT_PREFS: AppPreferences = {
  remindersEnabled: true,
  reminderSchedule: ['3_days_before', 'day_of'],
  emailTemplate:
    `Hi {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards,\n{{business_name}}`,
  autoLockMinutes: 15,
  passcodeEnabled: false,
  biometricEnabled: false,
  conflictStrategy: 'keep_local',
};

function loadPrefs(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: AppPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export const useAppPreferences = () => {
  const [prefs, setPrefsState] = useState<AppPreferences>(loadPrefs);

  const updatePrefs = useCallback((patch: Partial<AppPreferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
};
