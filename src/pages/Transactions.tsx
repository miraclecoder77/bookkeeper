import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/currency';
import { Plus, Trash2, Download, Edit2 } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, filterByType } = useTransactions();
  const { settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      type: 'income',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
    });
    setShowForm(true);
  };

  const categories = {
    income: ['Client Payment', 'Refund', 'Other Income'],
    expense: ['Software', 'Office Supplies', 'Travel', 'Meals', 'Equipment', 'Other Expense'],
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filterType !== 'all') {
      result = filterByType(filterType);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.category.toLowerCase().includes(lowerSearch)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, searchTerm, filterByType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        await updateTransaction({
          id: editingId,
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
        });
        setEditingId(null);
      } else {
        await addTransaction({
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
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
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount.toFixed(2),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your income and expenses</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            onClick={exportToCSV}
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
              />
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categories[formData.type].map((cat) => ({ value: cat, label: cat }))}
                placeholder="Select a category"
              />
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this transaction for?"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? 'Update Transaction' : 'Add Transaction'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); handleReset(); }} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by description or category..."
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
      <Card>
        {filteredTransactions.length > 0 ? (
          <>
            <div className="space-y-3 md:hidden">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                      {transaction.type}
                    </Badge>
                    <p className={`text-base font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, settings?.currency)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Category</p>
                      <p className="text-gray-900 dark:text-gray-100">{transaction.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-gray-900 dark:text-gray-100">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-gray-900 dark:text-gray-100">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm">{transaction.description}</td>
                    <td className="py-3 px-4 text-sm">{transaction.category}</td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, settings?.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-yellow-600 hover:text-yellow-700 inline-flex items-center space-x-1 mr-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-700 inline-flex items-center space-x-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No transactions found. Add one to get started!</p>
        )}
      </Card>
    </div>
  );
};
