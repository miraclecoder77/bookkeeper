import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import { getDB } from '../services/indexeddb';
import { Category } from '../types';
import {
  ArrowDownLeft, ArrowUpRight, Calendar, Search, SlidersHorizontal, ArrowLeftRight, X, Plus
} from 'lucide-react';

type FilterType = 'All' | 'Income' | 'Expenses';

type ActivityFormState = {
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  date: string;
  categoryId: string;
  payee: string;
  account: string;
  description: string;
  receiptFile: File | null;
};

const DEFAULT_FORM_STATE: ActivityFormState = {
  type: 'expense',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
  payee: '',
  account: '',
  description: '',
  receiptFile: null,
};

const ACCOUNT_OPTIONS = [
  'Operating Checking',
  'Petty Cash',
  'Savings',
  'Card Account',
];

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    GHS: '₵',
    KES: 'KSh',
  };
  return symbols[currency] || currency.slice(0, 1).toUpperCase();
};

export const Activity: React.FC = () => {
  const { transactions, addTransaction } = useTransactions();
  const { profile } = useUserProfile();
  
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activityForm, setActivityForm] = useState<ActivityFormState>(DEFAULT_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const currency = profile?.baseCurrency || 'NGN';
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    if (!isAddModalOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeActivityModal();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const loadCategories = async () => {
      try {
        const db = getDB();
        const allCategories = await db.getAll('categories');
        setCategories(allCategories);
        setActivityForm(prev => ({
          ...prev,
          categoryId: allCategories.find(c => c.type === prev.type)?.id || allCategories[0]?.id || '',
        }));
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };

    loadCategories();
    window.addEventListener('keydown', handleKeyDown);

    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isAddModalOpen]);

  const closeActivityModal = () => {
    setActivityForm(DEFAULT_FORM_STATE);
    setFormErrors({});
    setIsAddModalOpen(false);
  };

  const handleActivityFieldChange = <K extends keyof ActivityFormState>(key: K, value: ActivityFormState[K]) => {
    setActivityForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateActivityForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!activityForm.type) nextErrors.type = 'Transaction type is required';
    if (!activityForm.amount || Number.isNaN(Number(activityForm.amount)) || Number(activityForm.amount) <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than zero';
    }
    if (!activityForm.date) nextErrors.date = 'Date is required';
    if (!activityForm.categoryId) nextErrors.categoryId = 'Category is required';
    if (!activityForm.account) nextErrors.account = 'Account is required';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateActivityForm()) {
      return;
    }

    setSaving(true);

    try {
      const amountMinorUnits = Math.round(Number(activityForm.amount) * 100);
      const category = categories.find(cat => cat.id === activityForm.categoryId);

      await addTransaction({
        type: activityForm.type,
        amountMinorUnits,
        currency,
        categoryId: category?.id || activityForm.categoryId,
        clientId: null,
        paymentMethod: 'cash',
        notes: activityForm.description || activityForm.payee || '',
        payee: activityForm.payee || null,
        account: activityForm.account || null,
        receiptAttachmentId: activityForm.receiptFile ? activityForm.receiptFile.name : null,
        date: activityForm.date,
      });

      closeActivityModal();
    } catch (error) {
      console.error('Failed to save activity', error);
      setFormErrors({ amount: 'Unable to save activity right now. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Compute stats
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const moneyIn = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinorUnits, 0);
  const moneyOut = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountMinorUnits, 0);

  // Group transactions
  const groupedTransactions = useMemo(() => {
    let list = [...transactions];

    // Filter
    if (filter !== 'All') {
      list = list.filter(t => filter === 'Income' ? t.type === 'income' : t.type === 'expense');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.notes?.toLowerCase().includes(q) || (t as any).category?.toLowerCase().includes(q));
    }

    // Sort by date desc
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group
    const groups: { [key: string]: typeof list } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    list.forEach(t => {
      const d = new Date(t.date);
      const ds = d.toDateString();
      let key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (ds === today) key = 'Today';
      else if (ds === yesterday) key = 'Yesterday';

      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return groups;
  }, [transactions, filter, searchQuery]);

  const hasResults = Object.keys(groupedTransactions).length > 0;

  return (
    <div className="space-y-6 pb-6 max-w-4xl mx-auto">
      {isAddModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeActivityModal}
          />
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-modal-title"
              aria-describedby="activity-modal-description"
              tabIndex={-1}
              className="relative w-full max-w-lg rounded-t-[24px] sm:rounded-[24px] border border-default bg-surface shadow-2xl max-h-[90dvh] sm:max-h-[85dvh] flex flex-col overflow-hidden animate-scale-in"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-default bg-surface p-4 sm:p-5">
                <div>
                  <h2 id="activity-modal-title" className="font-display font-bold text-xl text-primary">Create Activity</h2>
                  <p id="activity-modal-description" className="text-xs text-secondary">Add a new transaction or note to your activity feed.</p>
                </div>
                <button
                  type="button"
                  onClick={closeActivityModal}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label="Close create activity modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveActivity} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <label className="label-section">Transaction Type</label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(['expense', 'income', 'transfer'] as const).map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              const fallbackCategory = categories.find(cat => cat.type === option)?.id || '';
                              setActivityForm(prev => ({ ...prev, type: option, categoryId: fallbackCategory }));
                              setFormErrors(prev => ({ ...prev, type: '', categoryId: '' }));
                            }}
                            className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold transition-colors ${
                              activityForm.type === option
                                ? 'border-brand bg-brand/10 text-primary'
                                : 'border-default bg-surface-2 text-secondary hover:bg-surface-3'
                            }`}
                          >
                            {option === 'transfer' ? 'Transfer' : option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                      {formErrors.type && <p className="mt-1 text-sm text-expense">{formErrors.type}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-section">Amount</label>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm font-semibold">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={activityForm.amount}
                            onChange={(e) => handleActivityFieldChange('amount', e.target.value)}
                            placeholder="0.00"
                            className="field pl-8"
                            aria-label="Amount"
                          />
                        </div>
                        {formErrors.amount && <p className="mt-1 text-sm text-expense">{formErrors.amount}</p>}
                      </div>

                      <div>
                        <label className="label-section">Date</label>
                        <input
                          type="date"
                          value={activityForm.date}
                          onChange={(e) => handleActivityFieldChange('date', e.target.value)}
                          className="field mt-2"
                          aria-label="Date"
                        />
                        {formErrors.date && <p className="mt-1 text-sm text-expense">{formErrors.date}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="label-section">Category</label>
                      <select
                        value={activityForm.categoryId}
                        onChange={(e) => handleActivityFieldChange('categoryId', e.target.value)}
                        className="field mt-2"
                        aria-label="Category"
                      >
                        <option value="">Select a category</option>
                        {categories
                          .filter(cat => activityForm.type === 'transfer' ? true : cat.type === activityForm.type)
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                      </select>
                      {formErrors.categoryId && <p className="mt-1 text-sm text-expense">{formErrors.categoryId}</p>}
                    </div>

                    <div>
                      <label className="label-section">Payee / Payer / Merchant</label>
                      <input
                        type="text"
                        value={activityForm.payee}
                        onChange={(e) => handleActivityFieldChange('payee', e.target.value)}
                        placeholder="e.g. MTN Nigeria or Client Name"
                        className="field mt-2"
                        aria-label="Payee / Payer / Merchant"
                      />
                    </div>

                    <div>
                      <label className="label-section">Account</label>
                      <select
                        value={activityForm.account}
                        onChange={(e) => handleActivityFieldChange('account', e.target.value)}
                        className="field mt-2"
                        aria-label="Account"
                      >
                        <option value="">Select an account</option>
                        {ACCOUNT_OPTIONS.map(account => (
                          <option key={account} value={account}>{account}</option>
                        ))}
                      </select>
                      {formErrors.account && <p className="mt-1 text-sm text-expense">{formErrors.account}</p>}
                    </div>

                    <div>
                      <label className="label-section">Description / Note</label>
                      <textarea
                        value={activityForm.description}
                        onChange={(e) => handleActivityFieldChange('description', e.target.value)}
                        placeholder="Optional details, invoice reference, or memo"
                        className="field mt-2 min-h-[90px] resize-y"
                        aria-label="Description / Note"
                      />
                    </div>

                    <div>
                      <label className="label-section">Receipt / Attachment Upload</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleActivityFieldChange('receiptFile', e.target.files?.[0] || null)}
                        className="field mt-2"
                        aria-label="Receipt / Attachment Upload"
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-default bg-surface p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={closeActivityModal}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-[0.1em] mb-1">
            Your money, in motion
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Activity</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-ghost h-11 px-3 flex items-center gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-primary">Add Activity</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Money in · {monthName}</p>
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-income shrink-0" />
            <div className="font-display font-bold text-xl text-income">
              <Money amountMinorUnits={transactions.length ? moneyIn : 0.00} currency={currency} />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Money out · {monthName}</p>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-expense shrink-0" />
            <div className="font-display font-bold text-xl text-expense">
              <Money amountMinorUnits={transactions.length ? moneyOut : 0.00} currency={currency} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH FIELD */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search activity"
          className="field w-full pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. FILTER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Income', 'Expenses'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-[44px] px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-surface-2 text-secondary border border-default hover:bg-surface-3'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="flex-1 min-w-[8px]" />
        <button className="min-h-[44px] w-11 flex-shrink-0 flex items-center justify-center rounded-full bg-surface-2 border border-default text-secondary hover:bg-surface-3">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 5. GROUPED TIMELINE */}
      {hasResults ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-secondary mb-3 pl-1">
                {dateLabel}
              </h2>
              <div className="bg-surface rounded-2xl border border-default shadow-sm overflow-hidden px-4">
                {items.map((t, idx) => {
                  const isIncome = t.type === 'income';
                  const isPending = t.type === 'pending';
                  const isInvoice = (t as any).isInvoice;
                  
                  let Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                  let iconColorClass = isIncome ? 'text-income bg-income/10' : 'text-expense bg-expense/10';
                  
                  if (isInvoice) {
                    if (isIncome) {
                      iconColorClass = 'text-blue-500 bg-blue-500/10';
                    }
                  }
                  if (isPending) {
                    Icon = ArrowUpRight;
                    iconColorClass = 'text-amber-500 bg-amber-500/10';
                  }

                  let amountColorClass = isIncome ? 'text-income' : 'text-expense';
                  if (isInvoice && isIncome) amountColorClass = 'text-blue-500';
                  if (isPending) amountColorClass = 'text-amber-500';

                  return (
                    <div 
                      key={t.id} 
                      className={`min-h-[60px] flex items-center gap-3 py-3 ${
                        idx !== items.length - 1 ? 'border-b border-default' : ''
                      } ${transactions.length > 0 ? 'cursor-pointer hover:bg-surface-2 -mx-4 px-4 transition-colors' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${iconColorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-primary truncate">
                          {t.notes || 'Unnamed transaction'}
                        </p>
                        <p className="text-xs text-secondary truncate">
                          {(t as any).category || (isIncome ? 'Income' : 'Expense')}
                        </p>
                      </div>
                      <div className={`font-bold text-sm whitespace-nowrap ${amountColorClass}`}>
                        {isIncome ? '+' : (isPending ? '' : '-')}
                        <Money amountMinorUnits={t.amountMinorUnits} currency={t.currency} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-secondary">
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary mb-1">No activity found</h3>
          <p className="text-sm text-secondary mb-6">Try adjusting your search or filters.</p>
          <button 
            onClick={() => { setFilter('All'); setSearchQuery(''); }}
            className="btn btn-ghost"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
