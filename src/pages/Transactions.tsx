import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { useTransactions } from '../hooks/useTransactions';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import { PaymentMethodPicker, PaymentMethod } from '../components/PaymentMethodPicker';
import { VirtualList } from '../components/VirtualList';
import { getDB } from '../services/indexeddb';
import { Category, Client } from '../types';
import { Plus, Trash2, Download, Edit2 } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { profile } = useUserProfile();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amountDecimal: '',
    categoryId: '',
    clientId: '',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const currency = profile?.baseCurrency || 'NGN';

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const db = getDB();
        const cats = await db.getAll('categories');
        const clis = await db.getAll('clients');
        setCategories(cats);
        setClients(clis.filter(c => !c.archivedAt));
      } catch (e) {
        console.error(e);
      }
    };
    loadMetadata();
  }, []);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      type: 'income',
      amountDecimal: '',
      categoryId: categories.find(c => c.type === 'income')?.id || '',
      clientId: '',
      paymentMethod: 'bank_transfer',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amountDecimal: (transaction.amountMinorUnits / 100).toString(),
      categoryId: transaction.categoryId,
      clientId: transaction.clientId || '',
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes || '',
      date: transaction.date,
    });
    setShowForm(true);
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          (t.notes || '').toLowerCase().includes(lowerSearch) ||
          (catMap.get(t.categoryId)?.name || '').toLowerCase().includes(lowerSearch)
      );
    }

    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, searchTerm, catMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(formData.amountDecimal);
    if (isNaN(amt) || amt <= 0 || !formData.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    const amountMinorUnits = Math.round(amt * 100);

    try {
      if (editingId) {
        await updateTransaction(editingId, {
          type: formData.type,
          amountMinorUnits,
          categoryId: formData.categoryId,
          clientId: formData.clientId || null,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          date: formData.date,
        });
      } else {
        await addTransaction({
          type: formData.type,
          amountMinorUnits,
          currency,
          categoryId: formData.categoryId,
          clientId: formData.clientId || null,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          date: formData.date,
        });
      }

      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Payment Method'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.notes || '',
      catMap.get(t.categoryId)?.name || 'Uncategorized',
      t.type,
      (t.amountMinorUnits / 100).toFixed(2),
      t.currency,
      t.paymentMethod
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Ledger Transactions</h1>
          <p className="text-slate-400 text-sm">Review payments, expenses, and track cashflow</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            onClick={exportToCSV}
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full sm:w-auto bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => {
              if (!showForm) {
                // Pre-fill default category based on current type selection
                const defaultCat = categories.find(c => c.type === formData.type)?.id || '';
                setFormData(f => ({ ...f, categoryId: defaultCat }));
              }
              setShowForm(!showForm);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white"
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'income' | 'expense';
                  const defaultCat = categories.find(c => c.type === newType)?.id || '';
                  setFormData({ ...formData, type: newType, categoryId: defaultCat });
                }}
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
              />
              <Input
                label={`Amount (${currency})`}
                type="number"
                step="0.01"
                required
                value={formData.amountDecimal}
                onChange={(e) => setFormData({ ...formData, amountDecimal: e.target.value })}
                placeholder="0.00"
              />
              <Select
                label="Category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categories.filter(c => c.type === formData.type).map((cat) => ({ value: cat.id, label: cat.name }))}
                placeholder="Select a category"
              />
              <Select
                label="Client (Optional)"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                options={[{ value: '', label: 'None' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <Input
                label="Date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
              <PaymentMethodPicker
                value={formData.paymentMethod}
                onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
              />
            </div>

            <Input
              label="Description / Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Broadband internet subscription"
            />
            
            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              <Button type="submit" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white">
                {editingId ? 'Update Transaction' : 'Add Transaction'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); handleReset(); }} className="w-full sm:w-auto bg-slate-800 text-slate-300 hover:bg-slate-700">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Search Description"
              placeholder="Search notes or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            label="Filter by Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            options={[
              { value: 'all', label: 'All Transactions' },
              { value: 'income', label: 'Income Only' },
              { value: 'expense', label: 'Expenses Only' },
            ]}
          />
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="bg-slate-900 border border-slate-800">
        {filteredTransactions.length > 0 ? (
          <>
            {/* Mobile rendering */}
            <div className="space-y-3 md:hidden">
              <VirtualList
                items={filteredTransactions}
                itemHeight={180}
                height={500}
                renderItem={(transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3 mb-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{transaction.notes || 'No description'}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="rounded-md p-2 text-red-400 hover:bg-red-500/10"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                        {transaction.type}
                      </Badge>
                      <p className={`text-base font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}<Money amountMinorUnits={transaction.amountMinorUnits} currency={transaction.currency} />
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Category</p>
                        <p className="text-slate-200">{catMap.get(transaction.categoryId)?.name || 'Uncategorized'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Channel</p>
                        <p className="text-slate-200 uppercase text-xs">{transaction.paymentMethod.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <VirtualList
                items={filteredTransactions}
                itemHeight={55}
                height={550}
                renderItem={(transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-12 items-center py-3.5 border-b border-slate-800 hover:bg-slate-900/30 text-sm text-slate-200"
                  >
                    <div className="col-span-2 px-4">{new Date(transaction.date).toLocaleDateString()}</div>
                    <div className="col-span-3 px-4 font-semibold truncate">{transaction.notes || 'No description'}</div>
                    <div className="col-span-2 px-4">{catMap.get(transaction.categoryId)?.name || 'Uncategorized'}</div>
                    <div className="col-span-1 px-4">
                      <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="col-span-2 px-4 text-center capitalize text-xs bg-slate-800/40 rounded py-0.5 max-w-[120px] mx-auto">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </div>
                    <div className={`col-span-1 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}<Money amountMinorUnits={transaction.amountMinorUnits} currency={transaction.currency} />
                    </div>
                    <div className="col-span-1 px-4 text-center">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-yellow-500 hover:text-yellow-400 mr-3"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-center py-12">No transactions found. Add one to get started!</p>
        )}
      </Card>
    </div>
  );
};
export default Transactions;
