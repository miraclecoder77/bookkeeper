import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  Sparkles, ScanLine, Camera, Upload, X, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  onScanComplete?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onScanComplete }) => {
  const { transactions } = useTransactions();
  const { invoices } = useInvoices();
  const { profile } = useUserProfile();

  const [scanState, setScanState] = useState<'idle' | 'choose' | 'processing' | 'result'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [aiBadgeCount, setAiBadgeCount] = useState(3);
  const [showAiSheet, setShowAiSheet] = useState(false);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = profile?.displayName?.split(' ')[0] || 'there';

  // Stats
  const currency = profile?.baseCurrency || 'GBP';
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinorUnits, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountMinorUnits, 0);
  const netIncome = income - expenses;
  const outstandingInvoices = invoices.filter(i => i.status === 'sent');
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.totalMinorUnits - i.amountPaidMinorUnits), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const paidAmount = paidInvoices.reduce((sum, i) => sum + i.amountPaidMinorUnits, 0);

  // Chart Data
  const monthlyData = useMemo(() => {
    // If no transactions, use static data
    if (transactions.length === 0) {
      return [
        { month: 'Sep', income: 4200, expenses: 2100 },
        { month: 'Oct', income: 5100, expenses: 2800 },
        { month: 'Nov', income: 3800, expenses: 1900 },
        { month: 'Dec', income: 6200, expenses: 3100 },
        { month: 'Jan', income: 4900, expenses: 2200 },
        { month: 'Feb', income: 7100, expenses: 3500 },
        { month: 'Mar', income: 8420, expenses: 3200 },
      ];
    }
    const months: { [key: string]: { income: number; expenses: number } } = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[k]) months[k] = { income: 0, expenses: 0 };
      if (t.type === 'income') months[k].income += t.amountMinorUnits / 100;
      else months[k].expenses += t.amountMinorUnits / 100;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
      month: new Date(k + '-01').toLocaleDateString('en-US', { month: 'short' }),
      income: v.income,
      expenses: v.expenses,
    })).slice(-7);
  }, [transactions]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    if (transactions.length === 0) {
      return [
        { id: '1', notes: 'Client Project — Acme', type: 'income', date: new Date().toISOString(), amountMinorUnits: 120000, currency: 'GBP', categoryId: 'cat_income' },
        { id: '2', notes: 'Adobe CC Subscription', type: 'expense', date: new Date(Date.now() - 86400000).toISOString(), amountMinorUnits: 5400, currency: 'GBP', categoryId: 'cat_software' },
        { id: '3', notes: 'Freelance Invoice #42', type: 'income', date: new Date('2026-03-03').toISOString(), amountMinorUnits: 340000, currency: 'GBP', categoryId: 'cat_income' },
        { id: '4', notes: 'Notion Team Plan', type: 'expense', date: new Date('2026-03-02').toISOString(), amountMinorUnits: 1600, currency: 'GBP', categoryId: 'cat_software' },
      ];
    }
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [transactions]);

  // Scanner Logic
  useEffect(() => {
    let interval: any;
    if (scanState === 'processing') {
      const steps = [18, 42, 67, 88, 100];
      let stepIdx = 0;
      interval = setInterval(() => {
        setScanProgress(steps[stepIdx]);
        stepIdx++;
        if (stepIdx >= steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            setScanState('result');
            setAiBadgeCount(c => c + 1);
            onScanComplete?.();
          }, 400);
        }
      }, 400);
    }
    return () => clearInterval(interval);
  }, [scanState, onScanComplete]);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. GREETING & TITLE */}
      <div>
        <p className="text-secondary text-sm font-medium mb-1">
          {greeting}, {name}
        </p>
        <h1 className="font-display font-bold text-[28px] leading-tight text-primary">
          Your <span className="text-brand-gradient">finances</span>, under control
        </h1>
      </div>

      {/* 2. METRIC GRID */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Net Income */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Net Income</p>
          <div className="font-display font-bold text-xl text-primary mb-1">
            <Money amountMinorUnits={transactions.length ? netIncome : 842000} currency={currency} />
          </div>
          <p className="text-income text-[10px] font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12.4%
          </p>
        </div>
        {/* Card 2: Outstanding */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Outstanding</p>
          <div className="font-display font-bold text-xl text-primary mb-1">
            <Money amountMinorUnits={transactions.length ? outstandingAmount : 215000} currency={currency} />
          </div>
          <p className="text-outstanding text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {outstandingInvoices.length || 3} invoices
          </p>
        </div>
        {/* Card 3: Total Expenses */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Total Expenses</p>
          <div className="font-display font-bold text-xl text-primary mb-1">
            <Money amountMinorUnits={transactions.length ? expenses : 320000} currency={currency} />
          </div>
          <p className="text-expense text-[10px] font-bold flex items-center gap-0.5">
            <TrendingDown className="w-3 h-3" /> -4.1%
          </p>
        </div>
        {/* Card 4: Paid Invoices */}
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Paid Invoices</p>
          <div className="font-display font-bold text-xl text-primary mb-1">
            <Money amountMinorUnits={transactions.length ? paidAmount : 1160000} currency={currency} />
          </div>
          <p className="text-blue-500 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {paidInvoices.length || 18} paid
          </p>
        </div>
      </div>

      {/* 3. OCR RECEIPT SCANNER MODULE */}
      <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-primary">Scan a Receipt</h2>
            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">OCR · auto-fills your expense</p>
          </div>
        </div>

        {scanState === 'idle' && (
          <button
            onClick={() => setScanState('choose')}
            className="w-full min-h-[140px] rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/5 transition-colors flex flex-col items-center justify-center gap-2 p-4"
          >
            <div className="relative">
              <ScanLine className="w-8 h-8 text-indigo-400" />
              <Sparkles className="w-4 h-4 text-violet-400 absolute -top-1 -right-2 animate-pulse" />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">Tap to scan or upload</span>
            <span className="text-secondary text-xs">Supports PDF, JPG, PNG</span>
          </button>
        )}

        {scanState === 'choose' && (
          <div className="grid grid-cols-2 gap-3 min-h-[140px]">
            <button
              onClick={() => setScanState('processing')}
              className="rounded-xl border border-default bg-surface hover:bg-surface-2 transition-colors flex flex-col items-center justify-center gap-3 p-4"
            >
              <Camera className="w-8 h-8 text-primary" />
              <span className="font-semibold text-sm text-primary">Camera</span>
            </button>
            <button
              onClick={() => setScanState('processing')}
              className="rounded-xl border border-default bg-surface hover:bg-surface-2 transition-colors flex flex-col items-center justify-center gap-3 p-4"
            >
              <Upload className="w-8 h-8 text-primary" />
              <span className="font-semibold text-sm text-primary">Upload File</span>
            </button>
          </div>
        )}

        {scanState === 'processing' && (
          <div className="relative w-full h-[160px] rounded-xl bg-surface-2 border border-default overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Animated scan line */}
            <div className="absolute inset-x-0 h-0.5 bg-brand-gradient shadow-glow-brand animate-scan-line z-10" />
            <div className="absolute inset-0 animate-skeleton opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
            
            <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse mb-3 z-20" />
            <p className="text-primary font-semibold text-sm z-20">Reading your receipt…</p>
            <div className="w-full max-w-[200px] mt-4 z-20">
              <div className="flex justify-between text-xs font-bold text-indigo-500 mb-1">
                <span>Extracting data</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {scanState === 'result' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-income bg-income/10 px-3 py-2 rounded-lg text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Extracted — review & save
            </div>
            
            <div className="space-y-3">
              <div className="bg-surface-2 rounded-lg p-3 border border-default">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary font-medium">Merchant</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-1.5 rounded">99%</span>
                </div>
                <input type="text" className="w-full bg-transparent text-primary font-semibold outline-none" defaultValue="Apple Store — Regent St" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-lg p-3 border border-default">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary font-medium">Total Amount</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-1.5 rounded">98%</span>
                  </div>
                  <input type="text" className="w-full bg-transparent text-primary font-semibold outline-none" defaultValue="£1,249.00" />
                </div>
                <div className="bg-surface-2 rounded-lg p-3 border border-default">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary font-medium">Date</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-1.5 rounded">97%</span>
                  </div>
                  <input type="text" className="w-full bg-transparent text-primary font-semibold outline-none" defaultValue="18 Jul 2026" />
                </div>
              </div>
            </div>

            <div className="border border-default rounded-xl overflow-hidden text-sm">
              <details className="group">
                <summary className="flex items-center justify-between p-3 font-semibold text-primary cursor-pointer bg-surface-2 group-open:border-b group-open:border-default select-none">
                  Line items (2)
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-3 space-y-2 bg-surface">
                  <div className="flex justify-between">
                    <span className="text-secondary">MacBook Air M4</span>
                    <span className="font-semibold text-primary">£1,149.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">AppleCare+</span>
                    <span className="font-semibold text-primary">£100.00</span>
                  </div>
                </div>
              </details>
              <details className="group border-t border-default">
                <summary className="flex items-center justify-between p-3 font-semibold text-primary cursor-pointer bg-surface-2 group-open:border-b group-open:border-default select-none">
                  Tax & category
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-3 space-y-2 bg-surface">
                  <div className="flex justify-between">
                    <span className="text-secondary">VAT (20%)</span>
                    <span className="font-semibold text-primary">£208.17</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Net</span>
                    <span className="font-semibold text-primary">£1,040.83</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-default/50">
                    <span className="text-secondary">Category</span>
                    <span className="font-semibold text-primary">Equipment</span>
                  </div>
                </div>
              </details>
            </div>

            <button
              onClick={() => { setScanState('idle'); setScanProgress(0); }}
              className="btn btn-primary w-full shadow-brand"
            >
              + Add expense · £1,249.00
            </button>
          </div>
        )}
      </div>

      {/* 4. INCOME CHART CARD */}
      <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
        <div className="mb-4">
          <h2 className="font-display font-bold text-base text-primary">Income vs Expenses</h2>
          <p className="text-xs text-secondary font-medium">Last 7 months</p>
        </div>
        <div className="h-[180px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#080B14', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={2} fillOpacity={0.15} fill="#16A34A" />
              <Area type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} strokeDasharray="4 4" fillOpacity={0.05} fill="#DC2626" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-[10px] font-semibold text-secondary">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-income" /> Income</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-expense" /> Expenses</div>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS */}
      <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base text-primary">Recent Transactions</h2>
          <Link to="/activity" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            All →
          </Link>
        </div>
        <div className="space-y-4">
          {recentTransactions.map((t, i) => (
            <div key={t.id || i} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-income' : 'bg-expense'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary truncate">{t.notes}</p>
                <p className="text-[10px] text-secondary truncate">
                  {t.type === 'income' ? 'Income' : 'Software'} · {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'income' ? '+' : '-'}
                <Money amountMinorUnits={t.amountMinorUnits} currency={t.currency} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. AI FAB & BOTTOM SHEET */}
      <button
        onClick={() => setShowAiSheet(true)}
        className="fixed z-30 bottom-[calc(72px+16px)] right-4 w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand-lg animate-fab-pulse"
        aria-label="AI Insights"
      >
        <Sparkles className="w-6 h-6 text-white" />
        {aiBadgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-expense rounded-full border-2 border-canvas flex items-center justify-center text-[10px] font-bold text-white">
            {aiBadgeCount}
          </span>
        )}
      </button>

      {showAiSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAiSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-w-[448px] mx-auto bg-surface rounded-t-[24px] animate-sheet-up flex flex-col max-h-[85vh]">
            <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 mb-2 shrink-0" />
            
            <div className="px-4 pb-4 overflow-y-auto">
              <div className="flex items-start justify-between mb-6 pt-2">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-primary">AI Insights</h2>
                    <p className="text-secondary text-xs font-medium">3 optimizations from your data</p>
                  </div>
                </div>
                <button onClick={() => setShowAiSheet(false)} className="p-1 rounded-full bg-surface-2 text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Impact card */}
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Potential impact this quarter</p>
                  <p className="font-display font-bold text-2xl text-income">+£2,142</p>
                </div>
                <div className="flex items-end gap-1 h-8">
                  <div className="w-1.5 h-3 bg-income/40 rounded-full" />
                  <div className="w-1.5 h-5 bg-income/60 rounded-full" />
                  <div className="w-1.5 h-4 bg-income/40 rounded-full" />
                  <div className="w-1.5 h-8 bg-income rounded-full" />
                  <div className="w-1.5 h-6 bg-income/80 rounded-full" />
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-3 mb-6">
                <div className="bg-surface border border-default rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-sm text-primary mb-1">2 overdue invoices need chasing</h3>
                  <p className="text-xs text-secondary leading-relaxed mb-3">Acme (#39) and Nova (#41) are 14+ days past due — worth £1,950 combined.</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-1 bg-income/10 text-income text-[10px] font-bold rounded">Recover £1,950</span>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Apply</button>
                  </div>
                </div>

                <div className="bg-surface border border-default rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-sm text-primary mb-1">Duplicate software spend</h3>
                  <p className="text-xs text-secondary leading-relaxed mb-3">Notion and Coda overlap. Cancelling one saves on recurring costs.</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded">Save £192/yr</span>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Apply</button>
                  </div>
                </div>

                <div className="bg-surface border border-default rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-sm text-primary mb-1">Set aside for tax</h3>
                  <p className="text-xs text-secondary leading-relaxed mb-3">Based on Q1 income, reserve 22% now to avoid a shortfall in July.</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-500 text-[10px] font-bold rounded">Reserve £1,852</span>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Apply</button>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full shadow-brand">
                Apply all recommendations
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
