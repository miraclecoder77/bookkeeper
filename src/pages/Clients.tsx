import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import { Search, Plus, ChevronRight, Users, X } from 'lucide-react';

export const Clients: React.FC = () => {
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { profile } = useUserProfile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const currency = profile?.baseCurrency || 'GBP';

  // Compute combined data
  const clientData = useMemo(() => {
    if (clients.length > 0) {
      return clients.map(client => {
        const clientInvoices = invoices.filter(i => i.clientId === client.id);
        const totalBilled = clientInvoices.reduce((sum, i) => sum + i.totalMinorUnits, 0);
        const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amountPaidMinorUnits, 0);
        const openBalance = totalBilled - totalPaid;
        const draftBalance = clientInvoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.totalMinorUnits, 0);
        
        let statusText = 'All settled';
        let statusType = 'settled';
        let balanceMinorUnits = 0;

        if (openBalance > 0) {
          statusText = 'due';
          statusType = 'due';
          balanceMinorUnits = openBalance;
        } else if (draftBalance > 0) {
          statusText = 'draft';
          statusType = 'draft';
          balanceMinorUnits = draftBalance;
        }

        return {
          id: client.id,
          name: client.name,
          contactName: client.contactName || '',
          activitySummary: clientInvoices.length > 0 ? `${clientInvoices.length} invoices` : 'No activity',
          totalMinorUnits: totalBilled,
          balanceMinorUnits,
          statusText,
          statusType
        };
      });
    }

    return [
      { id: '1', name: 'Acme Corp', contactName: 'Maya Chen', activitySummary: 'Invoice sent yesterday', totalMinorUnits: 1280000, balanceMinorUnits: 125000, statusText: 'due', statusType: 'due' },
      { id: '2', name: 'Nova Labs', contactName: 'Andre Valdez', activitySummary: 'Paid invoice today', totalMinorUnits: 960000, balanceMinorUnits: 0, statusText: 'All settled', statusType: 'settled' },
      { id: '3', name: 'Northstar Studio', contactName: 'Robin Park', activitySummary: 'Active project', totalMinorUnits: 640000, balanceMinorUnits: 240000, statusText: 'due', statusType: 'due' },
      { id: '4', name: 'Formfield', contactName: 'Devon Baker', activitySummary: 'No activity this month', totalMinorUnits: 215000, balanceMinorUnits: 98000, statusText: 'draft', statusType: 'draft' },
    ];
  }, [clients, invoices]);

  // Filters
  const filteredClients = useMemo(() => {
    let list = clientData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.contactName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clientData, searchQuery]);

  // Stats
  const activeClientsCount = clients.length || 12;
  const totalOpenBalances = clientData.filter(c => c.statusType === 'due').reduce((sum, c) => sum + c.balanceMinorUnits, 0);

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

  return (
    <div className="space-y-6 pb-6 max-w-5xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-widest mb-1">
            Relationships that pay
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Clients</h1>
        </div>
        <button className="btn btn-ghost h-11 px-4 text-sm gap-1.5 border border-default shadow-sm bg-surface-2">
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Active clients</p>
          <div className="font-display font-bold text-2xl text-primary">
            {activeClientsCount}
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-default shadow-card">
          <p className="text-secondary text-xs font-semibold mb-1">Open balances</p>
          <div className="font-display font-bold text-2xl text-outstanding">
            <Money amountMinorUnits={totalOpenBalances} currency={currency} />
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
          placeholder="Search clients"
          className="field w-full pl-10 pr-10 bg-surface-2"
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

      {/* 4. CLIENT LIST */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-secondary text-[12px] font-bold uppercase tracking-widest">
            All Clients
          </span>
          <span className="text-secondary text-xs font-medium">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </span>
        </div>

        {filteredClients.length > 0 ? (
          <div className="bg-surface rounded-2xl border border-default shadow-card overflow-hidden">
            {filteredClients.map((client, idx) => {
              const isLast = idx === filteredClients.length - 1;
              return (
                <div 
                  key={client.id}
                  className={`min-h-[72px] flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-2 transition-colors ${
                    !isLast ? 'border-b border-default' : ''
                  }`}
                >
                  <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${getClientColor(client.name)}`}>
                    {getInitials(client.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary truncate">{client.name}</p>
                    <p className="text-xs text-secondary truncate">
                      {client.contactName} {client.contactName && '·'} {client.activitySummary}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-secondary font-medium mb-0.5">
                        Total: <Money amountMinorUnits={client.totalMinorUnits} currency={currency} />
                      </p>
                      {client.statusType === 'settled' ? (
                        <p className="text-xs font-bold text-income">{client.statusText}</p>
                      ) : (
                        <p className={`text-xs font-bold flex items-center justify-end gap-1 ${
                          client.statusType === 'due' ? 'text-outstanding' : 'text-slate-500'
                        }`}>
                          <Money amountMinorUnits={client.balanceMinorUnits} currency={currency} /> {client.statusText}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-secondary" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-default rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-secondary">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-primary mb-1">No clients found</h3>
            <p className="text-sm text-secondary mb-6">Add a client or adjust your search.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
