import React, { DragEvent, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Loader2, ScanLine, Sparkles, TrendingDown, TrendingUp, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useUserProfile } from '../hooks/useUserProfile';
import { dashboardChartData, useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useReceiptScanner } from '../hooks/useReceiptScanner';
import { Money } from '../components/Money';
import { getDB } from '../services/indexeddb';
import { Category } from '../types';

const relativeDate = (date: string) => {
  const target = new Date(`${date}T00:00:00`); const today = new Date();
  const days = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - target.getTime()) / 86400000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : target.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
const changeText = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export const Dashboard: React.FC = () => {
  const { transactions, loading, addTransaction, reloadTransactions } = useTransactions();
  const { invoices } = useInvoices();
  const { profile } = useUserProfile();
  const scanner = useReceiptScanner();
  const [draft, setDraft] = useState<{ vendor: string; amount: string; date: string; categoryId: string } | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [aiBadgeCount, setAiBadgeCount] = useState(3);
  const metrics = useDashboardMetrics(transactions, invoices);
  const chartData = useMemo(() => dashboardChartData(transactions, invoices), [transactions, invoices]);
  const recent = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [transactions]);
  const currency = profile?.baseCurrency || 'NGN';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const extracted = scanner.result?.extractedFields;
  const startReview = async () => {
    if (!scanner.result) return;
    const categories = await getDB().getAll('categories');
    setExpenseCategories(categories.filter(c => c.type === 'expense'));
    setDraft({ vendor: extracted?.vendorName || '', amount: String((extracted?.amountMinorUnits || 0) / 100), date: extracted?.date || new Date().toISOString().slice(0, 10), categoryId: categories.find(c => c.type === 'expense')?.id || '' });
  };
  const saveExpense = async () => {
    if (!draft || !scanner.result) return;
    const amount = Math.round(Number(draft.amount) * 100);
    if (!draft.vendor || !draft.categoryId || !Number.isFinite(amount) || amount <= 0) return;
    const confirmation = await import('../services/dal').then(({ capture }) => capture.confirm(scanner.result!.id, { vendorName: draft.vendor, date: draft.date, amountMinorUnits: amount, currency }));
    if (!confirmation.ok) return;
    const item = await addTransaction({ type: 'expense', date: draft.date, amountMinorUnits: amount, currency, categoryId: draft.categoryId, clientId: null, paymentMethod: 'card', notes: `Extracted from receipt: ${draft.vendor}`, sourceCapturedDocumentId: scanner.result.id });
    if (item) { setDraft(null); scanner.clear(); reloadTransactions(); }
  };
  const drop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) scanner.scan(file); };
  return <div className="space-y-6 pb-24 md:pb-6">
    <div><p className="text-secondary text-sm font-medium mb-1">{greeting}, {profile?.displayName?.split(' ')[0] || 'kay'}</p><h1 className="font-display font-bold text-[28px] leading-tight text-primary">Your <span className="text-brand-gradient">finances</span>, under control</h1></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <Metric title="Net Income" amount={metrics.netIncome} currency={currency} icon={metrics.netIncomeChange >= 0 ? <TrendingUp /> : <TrendingDown />} detail={changeText(metrics.netIncomeChange)} positive={metrics.netIncomeChange >= 0} />
      <Metric title="Outstanding" amount={metrics.outstandingAmount} currency={currency} icon={<Clock />} detail={`${metrics.outstandingCount} invoice${metrics.outstandingCount === 1 ? '' : 's'}`} />
      <Metric title="Total Expenses" amount={metrics.expenses} currency={currency} icon={metrics.expensesChange <= 0 ? <TrendingDown /> : <TrendingUp />} detail={changeText(metrics.expensesChange)} positive={metrics.expensesChange <= 0} />
      <Metric title="Paid Invoices" amount={metrics.paidAmount} currency={currency} icon={<CheckCircle2 />} detail={`${metrics.paidCount} paid`} positive />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7 lg:col-span-8 space-y-6">
        <section className="bg-surface rounded-2xl p-4 border border-default shadow-card"><h2 className="font-display font-bold text-base text-primary">Income vs Expenses</h2><p className="text-xs text-secondary font-medium mb-4">Last 7 months</p><div className="h-[220px]"><ResponsiveContainer><AreaChart data={chartData}><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis hide/><Tooltip/><Area dataKey="income" stroke="#16A34A" fill="#16A34A" fillOpacity={.15}/><Area dataKey="expenses" stroke="#DC2626" fill="#DC2626" fillOpacity={.06}/></AreaChart></ResponsiveContainer></div></section>
        <section className="bg-surface rounded-2xl p-4 border border-default shadow-card"><div className="flex items-center gap-3 mb-4"><ScanLine className="text-indigo-500"/><div><h2 className="font-display font-bold text-base text-primary">Scan a Receipt</h2><p className="text-[10px] text-secondary">OCR · auto-fills your expense</p></div></div><input ref={scanner.inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => e.target.files?.[0] && scanner.scan(e.target.files[0])}/>{scanner.processing ? <div className="h-36 flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-indigo-500"/><p className="text-sm text-secondary">Reading your receipt…</p></div> : scanner.result ? <div className="space-y-3"><div className="rounded-lg bg-income/10 text-income p-3 text-sm font-semibold">Receipt extracted — review before saving.</div><button onClick={startReview} className="btn btn-primary w-full">Review and add expense</button></div> : <button onDrop={drop} onDragOver={e => e.preventDefault()} onClick={() => scanner.inputRef.current?.click()} className="w-full min-h-[140px] rounded-xl border-2 border-dashed border-indigo-500/30 flex flex-col items-center justify-center gap-2"><Upload className="text-indigo-400"/><span className="font-semibold text-indigo-500">Drop a receipt or upload</span><span className="text-xs text-secondary">PDF, JPG, PNG</span></button>}{scanner.error && <p className="mt-3 text-sm text-expense">{scanner.error}</p>}</section>
      </div>
      <section className="md:col-span-5 lg:col-span-4 bg-surface rounded-2xl p-4 border border-default shadow-card"><div className="flex justify-between mb-4"><h2 className="font-display font-bold text-base text-primary">Recent Transactions</h2><Link to="/activity" className="text-xs font-bold text-indigo-600">All →</Link></div>{loading ? <p className="text-secondary text-sm">Loading transactions…</p> : recent.length === 0 ? <p className="text-secondary text-sm py-8 text-center">No transactions yet.</p> : <div className="space-y-4">{recent.map(t => <div key={t.id} className="flex gap-3"><span className={`w-2 h-2 mt-2 rounded-full ${t.type === 'income' ? 'bg-income' : 'bg-expense'}`}/><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-primary truncate">{t.notes || 'Untitled transaction'}</p><p className="text-[10px] text-secondary">{t.sourceCapturedDocumentId ? 'Extracted from receipt' : t.type === 'income' ? 'Income' : 'Expense'} · {relativeDate(t.date)}</p></div><span className={t.type === 'income' ? 'text-income font-bold' : 'text-expense font-bold'}>{t.type === 'income' ? '+' : '-'}<Money amountMinorUnits={t.amountMinorUnits} currency={t.currency}/></span></div>)}</div>}</section>
    </div>
    {draft && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={e => { e.preventDefault(); saveExpense(); }} className="bg-surface w-full max-w-md rounded-2xl p-5 space-y-4"><h2 className="font-display font-bold text-primary">New Expense</h2><input className="w-full input" value={draft.vendor} onChange={e => setDraft({...draft, vendor:e.target.value})} placeholder="Merchant"/><input className="w-full input" type="number" step=".01" value={draft.amount} onChange={e => setDraft({...draft, amount:e.target.value})} placeholder="Amount"/><input className="w-full input" type="date" value={draft.date} onChange={e => setDraft({...draft, date:e.target.value})}/><select className="w-full input" value={draft.categoryId} onChange={e => setDraft({...draft, categoryId:e.target.value})}><option value="">Choose a category</option>{expenseCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><div className="flex gap-2"><button type="button" onClick={() => setDraft(null)} className="btn w-full">Cancel</button><button type="submit" className="btn btn-primary w-full">Save expense</button></div></form></div>}
    <button onClick={() => { setShowAiSheet(true); setAiBadgeCount(0); }} className="fixed z-30 bottom-[calc(72px+16px)] right-4 w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand-lg animate-fab-pulse" aria-label="Open AI insights"><Sparkles className="w-6 h-6 text-white" />{aiBadgeCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-expense rounded-full border-2 border-canvas flex items-center justify-center text-[10px] font-bold text-white">{aiBadgeCount}</span>}</button>
    {showAiSheet && <><div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowAiSheet(false)} /><aside role="dialog" aria-modal="true" aria-label="AI Insights" className="fixed inset-x-0 bottom-0 z-50 max-w-[448px] mx-auto bg-surface rounded-t-[24px] animate-sheet-up max-h-[85vh] overflow-y-auto"><div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3"/><div className="p-4"><div className="flex items-start justify-between mb-6"><div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center"><Sparkles className="w-5 h-5 text-white"/></div><div><h2 className="font-display font-bold text-xl text-primary">AI Insights</h2><p className="text-secondary text-xs font-medium">3 optimizations from your data</p></div></div><button onClick={() => setShowAiSheet(false)} className="p-1 rounded-full bg-surface-2 text-secondary" aria-label="Close AI insights"><X className="w-5 h-5"/></button></div><div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 mb-4"><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Potential impact this quarter</p><p className="font-display font-bold text-2xl text-income">+₦214,200.00</p></div><div className="space-y-3"><Insight title="Invoices need follow-up" body="Review outstanding invoices and send a reminder to improve cash flow." action="Review invoices"/><Insight title="Duplicate software spend" body="Recurring software charges may overlap. Check subscriptions before renewal." action="Review expenses"/><Insight title="Set aside for tax" body="Based on your income, reserve part of this month’s profit for taxes." action="View insights"/></div></div></aside></>}
  </div>;
};
const Metric: React.FC<{title:string;amount:number;currency:string;icon:React.ReactNode;detail:string;positive?:boolean}> = ({title, amount, currency, icon, detail, positive}) => <div className="bg-surface rounded-2xl p-4 border border-default shadow-card"><p className="text-secondary text-xs font-semibold mb-1">{title}</p><div className="font-display font-bold text-xl text-primary mb-1"><Money amountMinorUnits={amount} currency={currency}/></div><p className={`${positive ? 'text-income' : 'text-outstanding'} text-[10px] font-bold flex gap-1 items-center`}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{className:string}>, {className:'w-3 h-3'}) : icon}{detail}</p></div>;
const Insight: React.FC<{title: string; body: string; action: string}> = ({ title, body, action }) => <article className="bg-surface border border-default rounded-xl p-4 shadow-sm"><h3 className="font-bold text-sm text-primary mb-1">{title}</h3><p className="text-xs text-secondary leading-relaxed mb-3">{body}</p><button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{action}</button></article>;
