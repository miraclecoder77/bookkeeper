import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import {
  ArrowDownLeft, ArrowUpRight, Calendar, Search, SlidersHorizontal, ArrowLeftRight, X
} from 'lucide-react';

type FilterType = 'All' | 'Income' | 'Expenses';

export const Activity: React.FC = () => {
  const { transactions } = useTransactions();
  const { profile } = useUserProfile();
  
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const currency = profile?.baseCurrency || 'GBP';
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

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
    // Determine the base list: either real hook data or static fallback
    let list = transactions.length > 0 ? [...transactions] : [
      { id: '1', notes: 'Client Project — Acme', type: 'income', date: new Date().toISOString(), amountMinorUnits: 120000, currency: 'GBP', category: 'Bank transfer' },
      { id: '2', notes: 'Adobe Creative Cloud', type: 'expense', date: new Date().toISOString(), amountMinorUnits: 5498, currency: 'GBP', category: 'Software · Recurring' },
      { id: '3', notes: 'Invoice #INV-042 paid', type: 'income', date: new Date(Date.now() - 86400000).toISOString(), amountMinorUnits: 340000, currency: 'GBP', category: 'Nova Labs · 1:42 PM', isInvoice: true },
      { id: '4', notes: 'Invoice #INV-044 sent', type: 'pending', date: new Date(Date.now() - 86400000).toISOString(), amountMinorUnits: 125000, currency: 'GBP', category: 'Acme Corp · Due 17 Apr', isInvoice: true },
      { id: '5', notes: 'Figma Professional', type: 'expense', date: new Date(Date.now() - 2 * 86400000).toISOString(), amountMinorUnits: 1500, currency: 'GBP', category: 'Software · Recurring' },
    ];

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
      {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-[0.1em] mb-1">
            Your money, in motion
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Activity</h1>
        </div>
        <button className="btn btn-ghost w-11 h-11 p-0 flex items-center justify-center rounded-xl">
          <Calendar className="w-5 h-5 text-secondary" />
        </button>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Money in · {monthName}</p>
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-income shrink-0" />
            <div className="font-display font-bold text-xl text-income">
              <Money amountMinorUnits={transactions.length ? moneyIn : 580000} currency={currency} />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Money out · {monthName}</p>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-expense shrink-0" />
            <div className="font-display font-bold text-xl text-expense">
              <Money amountMinorUnits={transactions.length ? moneyOut : 48600} currency={currency} />
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
