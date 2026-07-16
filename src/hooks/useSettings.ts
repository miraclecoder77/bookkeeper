import { useState, useCallback, useEffect } from 'react';
import { BusinessSettings } from '../types';
import * as db from '../services/indexeddb';
import { syncManager } from '../services/syncManager';

export const useSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await db.getSettings();
        setSettings(
          data || {
            id: 'default',
            currency: 'USD',
          }
        );
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: BusinessSettings) => {
    try {
      await db.saveSettings(newSettings);
      setSettings(newSettings);
      syncManager.debouncedSync('settings');
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    loading,
    updateSettings,
  };
};
