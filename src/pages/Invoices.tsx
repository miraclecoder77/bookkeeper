import React, { useState, useMemo } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import {
  FilePlus2, Search, ChevronRight, MoreHorizontal,
  Clock, CheckCircle2, AlertCircle, FileText, X
} from 'lucide-react';

type TabType = 'All' | 'Open' | 'Paid';

export const Invoices: React.FC = () => {
  const { invoices } = useInvoices();
  const { clients } = useClients();
  const { profile } = useUserProfile();

  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const currency = profile?.baseCurrency || 'GBP';

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Combined data (hook + static fallback if empty)
  const allInvoices = useMemo(() => {
    if (invoices.length > 0) {
      return invoices.map(inv => {
        const client = clientMap.get(inv.clientId);
        return {
          id: inv.id,
          clientName: client?.name || 'Unknown Client',
          number: inv.invoiceNumber,
          description: inv.notes || 'Invoice',
          amountMinorUnits: inv.totalMinorUnits,
          dueDate: inv.dueDate,
          status: inv.status, // draft, sent, paid, overdue, cancelled
        };
      });
    }

    return [
      { id: '1', clientName: 'Northstar Studio', number: 'INV-046', description: 'Brand system — Phase 2', amountMinorUnits: 240000, dueDate: '2026-04-24', status: 'sent' }, // Due soon
      { id: '2', clientName: 'Acme Corp', number: 'INV-045', description: 'Product design retainer', amountMinorUnits: 125000, dueDate: '2026-04-17', status: 'overdue' },
      { id: '3', clientName: 'Nova Labs', number: 'INV-044', description: 'UX audit & roadmap', amountMinorUnits: 340000, dueDate: '2026-04-15', status: 'paid' },
      { id: '4', clientName: 'Formfield', number: 'INV-043', description: 'Research workshop', amountMinorUnits: 98000, dueDate: '', status: 'draft' },
    ];
  }, [invoices, clientMap]);

  // Stats
  const openCount = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
  const paidCount = allInvoices.filter(i => i.status === 'paid').length;
  
  const totalBilled = allInvoices.reduce((sum, i) => sum + i.amountMinorUnits, 0);
  const totalPaid = allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amountMinorUnits, 0);
  const totalOutstanding = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amountMinorUnits, 0);
  
  const progressPct = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  // Filtered list
  const filteredInvoices = useMemo(() => {
    let list = allInvoices;

    if (activeTab === 'Open') {
      list = list.filter(i => i.status === 'sent' || i.status === 'overdue');
    } else if (activeTab === 'Paid') {
      list = list.filter(i => i.status === 'paid');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.clientName.toLowerCase().includes(q) || 
        i.number.toLowerCase().includes(q)
      );
    }

    // Sort by due date if possible, otherwise keep order
    list.sort((a, b) => {
      if (a.status === 'paid' && b.status !== 'paid') return 1;
      if (a.status !== 'paid' && b.status === 'paid') return -1;
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });

    return list;
  }, [allInvoices, activeTab, searchQuery]);

  const getClientColor = (name: string) => {
    if (name.includes('Acme')) return 'bg-indigo-500/20 text-indigo-500';
    if (name.includes('Nova')) return 'bg-violet-500/20 text-violet-500';
    if (name.includes('Northstar')) return 'bg-amber-500/20 text-amber-500';
    return 'bg-slate-500/20 text-slate-500 dark:text-slate-400';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatStatus = (status: string, dueDate: string) => {
    if (status === 'overdue') return { label: 'Overdue', color: 'bg-expense/15 text-expense' };
    if (status === 'paid') return { label: 'Paid', color: 'bg-income/15 text-income' };
    if (status === 'draft') return { label: 'Draft', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
    
    // Status is 'sent', check due date
    return { label: 'Due soon', color: 'bg-outstanding/15 text-outstanding' };
  };

  return (
    <div className="space-y-6 pb-6 max-w-5xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-widest mb-1">
            Keep cash moving
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Invoices</h1>
        </div>
        <button className="btn btn-primary h-11 px-4 shadow-brand text-sm gap-1.5">
          <FilePlus2 className="w-4 h-4" />
          New
        </button>
      </div>

      {/* 2. OUTSTANDING SUMMARY CARD */}
      <div className="bg-surface rounded-2xl p-5 shadow-card border-y border-r border-l-4 border-default border-l-outstanding">
        <p className="text-secondary text-sm font-semibold mb-1">Outstanding this month</p>
        <div className="font-display font-bold text-[32px] leading-tight text-outstanding mb-1">
          <Money amountMinorUnits={invoices.length ? totalOutstanding : 365000} currency={currency} />
        </div>
        <p className="text-secondary text-xs font-medium mb-4">
          {invoices.length ? openCount : 3} awaiting payment
        </p>
        
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${invoices.length ? progressPct : 70}%` }} 
            />
          </div>
          <p className="text-secondary text-xs">
            <Money amountMinorUnits={invoices.length ? totalPaid : 870000} currency={currency} /> paid of <Money amountMinorUnits={invoices.length ? totalBilled : 1235000} currency={currency} /> billed
          </p>
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
          placeholder="Search by client or invoice"
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

      {/* 4. TABS */}
      <div className="flex border-b border-default overflow-x-auto no-scrollbar">
        {(['All', 'Open', 'Paid'] as TabType[]).map(tab => {
          const isActive = activeTab === tab;
          let count = 0;
          if (tab === 'All') count = allInvoices.length;
          if (tab === 'Open') count = openCount;
          if (tab === 'Paid') count = paidCount;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-secondary hover:text-primary'
              }`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-surface-2 text-secondary'
              }`}>
                {count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 5. INVOICE CARDS */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-2">
          {filteredInvoices.map((inv) => {
            const statusInfo = formatStatus(inv.status, inv.dueDate);
            return (
              <div key={inv.id} className="bg-surface rounded-2xl p-4 border border-default shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${getClientColor(inv.clientName)}`}>
                    {getInitials(inv.clientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-primary truncate">{inv.clientName}</p>
                    <p className="text-xs text-secondary truncate">{inv.number} · {inv.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <div className="font-display font-bold text-lg text-primary">
                    <Money amountMinorUnits={inv.amountMinorUnits} currency={currency} />
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                    {inv.dueDate && (
                      <span className="text-[10px] text-secondary font-medium">
                        {inv.status === 'paid' ? 'Paid on' : 'Due'} {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-default pl-4 shrink-0">
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      View <span aria-hidden="true">→</span>
                    </button>
                    <button className="p-2 -mr-2 rounded-full text-secondary hover:bg-surface-2 hover:text-primary transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-secondary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary mb-1">No invoices found</h3>
          <p className="text-sm text-secondary mb-6">Create your first invoice or adjust filters.</p>
          {(searchQuery || activeTab !== 'All') && (
            <button 
              onClick={() => { setActiveTab('All'); setSearchQuery(''); }}
              className="btn btn-ghost"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
