import React, { useState } from 'react';
import * as dal from '../services/dal';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [invoicingCurrency, setInvoicingCurrency] = useState('NGN');
  const [fiscalYearStart, setFiscalYearStart] = useState('01-01');
  const [jurisdiction, setJurisdiction] = useState('NG');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      await dal.profile.update({
        displayName: name.trim(),
        baseCurrency,
        invoicingCurrency,
        fiscalYearStart,
        jurisdiction,
        syncMode: 'local_only',
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20 animate-pulse-slow">
            <span className="text-white font-display font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Configure your books</h1>
          <p className="text-slate-400 text-sm mt-1">Let's set up your local freelance account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kolawole Ventures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white placeholder-slate-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Currency</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white transition-colors"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="KES">KES (KSh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Invoicing Currency</label>
              <select
                value={invoicingCurrency}
                onChange={(e) => setInvoicingCurrency(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white transition-colors"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="KES">KES (KSh)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jurisdiction</label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white transition-colors"
              >
                <option value="NG">Nigeria (NG)</option>
                <option value="GH">Ghana (GH)</option>
                <option value="KE">Kenya (KE)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fiscal Year Start</label>
              <input
                type="text"
                placeholder="MM-DD"
                required
                value={fiscalYearStart}
                onChange={(e) => setFiscalYearStart(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white placeholder-slate-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Open my Books'}
          </button>
        </form>
      </div>
    </div>
  );
};
