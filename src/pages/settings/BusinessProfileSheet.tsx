import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { UserProfile } from '../../types';
import { Upload, Check, AlertCircle, Building2 } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', label: '🇺🇸 USD — US Dollar' },
  { code: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { code: 'EUR', label: '🇪🇺 EUR — Euro' },
  { code: 'NGN', label: '🇳🇬 NGN — Nigerian Naira' },
  { code: 'GHS', label: '🇬🇭 GHS — Ghanaian Cedi' },
  { code: 'KES', label: '🇰🇪 KES — Kenyan Shilling' },
  { code: 'ZAR', label: '🇿🇦 ZAR — South African Rand' },
  { code: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { code: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
];

interface BusinessProfileSheetProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (patch: Partial<UserProfile>) => Promise<void>;
}

export const BusinessProfileSheet: React.FC<BusinessProfileSheetProps> = ({
  open, onClose, profile, onSave,
}) => {
  const [form, setForm] = useState({
    businessName: '',
    taxId: '',
    businessAddress: '',
    baseCurrency: 'USD',
    defaultTaxRate: '',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && profile) {
      setForm({
        businessName: profile.businessName || profile.displayName || '',
        taxId: profile.taxId || '',
        businessAddress: profile.businessAddress || '',
        baseCurrency: profile.baseCurrency || 'USD',
        defaultTaxRate: profile.defaultTaxRate != null ? String(profile.defaultTaxRate) : '',
        logoUrl: profile.logoUrl || '',
      });
      setLogoPreview(profile.logoUrl || null);
      setSaved(false);
      setError(null);
    }
  }, [open, profile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setForm(f => ({ ...f, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const taxRateNum = parseFloat(form.defaultTaxRate);
  const taxRateError = form.defaultTaxRate && (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100)
    ? 'Tax rate must be between 0 and 100.' : null;

  const canSave = form.businessName.trim().length >= 2 && !taxRateError && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        businessName: form.businessName.trim(),
        taxId: form.taxId.trim() || undefined,
        businessAddress: form.businessAddress.trim() || undefined,
        baseCurrency: form.baseCurrency,
        invoicingCurrency: form.baseCurrency,
        defaultTaxRate: form.defaultTaxRate ? taxRateNum : undefined,
        logoUrl: form.logoUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 900);
    } catch (e: any) {
      setError(e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Business Profile">
      <div className="space-y-5">
        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl border-2 border-dashed border-default flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand transition-colors shrink-0"
            onClick={() => fileRef.current?.click()}
            title="Upload logo"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-secondary" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-ghost rounded-xl text-sm px-3 h-9"
            >
              <Upload className="w-4 h-4" /> Upload Logo
            </button>
            <p className="text-[11px] text-secondary mt-0.5">PNG or JPG, max 2 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="biz-name">
            Business Name
          </label>
          <input
            id="biz-name"
            type="text"
            value={form.businessName}
            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
            placeholder="Northstar Design Ltd"
            className="field"
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="biz-taxid">
            Tax ID / VAT Number
          </label>
          <input
            id="biz-taxid"
            type="text"
            value={form.taxId}
            onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
            placeholder="e.g. GB123456789"
            className="field"
          />
        </div>

        {/* Business Address */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="biz-address">
            Business Address
          </label>
          <textarea
            id="biz-address"
            value={form.businessAddress}
            onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))}
            placeholder="123 Design Street&#10;London, UK"
            rows={3}
            className="field resize-none py-2.5"
          />
        </div>

        {/* Currency + Tax Rate side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="biz-currency">
              Currency
            </label>
            <select
              id="biz-currency"
              value={form.baseCurrency}
              onChange={e => setForm(f => ({ ...f, baseCurrency: e.target.value }))}
              className="field pr-8 appearance-none"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="biz-taxrate">
              Default Tax Rate (%)
            </label>
            <input
              id="biz-taxrate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.defaultTaxRate}
              onChange={e => setForm(f => ({ ...f, defaultTaxRate: e.target.value }))}
              placeholder="7.5"
              className="field"
            />
            {taxRateError && (
              <p className="text-xs text-expense flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{taxRateError}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-3 bg-expense/10 border border-expense/20 text-expense text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn btn-ghost flex-1 rounded-xl">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn btn-primary flex-1 rounded-xl disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4" />Saved</span>
            ) : 'Save Profile'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
