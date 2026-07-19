import { useState, useCallback, useEffect } from 'react';
import { BusinessSettings } from '../types';
import * as dal from '../services/dal';

export const useSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await dal.profile.get();
    if (res.ok && res.data) {
      const p = res.data;
      setSettings({
        id: p.id,
        name: p.displayName,
        currency: p.baseCurrency,
        logo: p.logoUrl,
        taxId: p.taxId,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings: BusinessSettings) => {
    const res = await dal.profile.update({
      displayName: newSettings.name,
      baseCurrency: newSettings.currency,
      invoicingCurrency: newSettings.currency,
      logoUrl: newSettings.logo,
      taxId: newSettings.taxId,
    });
    if (res.ok && res.data) {
      const p = res.data;
      setSettings({
        id: p.id,
        name: p.displayName,
        currency: p.baseCurrency,
        logo: p.logoUrl,
        taxId: p.taxId,
      });
    }
  }, []);

  return {
    settings,
    loading,
    updateSettings,
  };
};
