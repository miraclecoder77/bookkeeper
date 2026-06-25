import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useTransactions } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/currency';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}> = ({ title, value, icon, trend }) => (
  <Card className="flex items-center space-x-4">
    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">{icon}</div>
    <div className="flex-1">
      <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {trend && <p className="text-sm text-green-600 dark:text-green-400">{trend}</p>}
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const { invoices, getInvoicesByStatus, calculateTotalByStatus } = useInvoices();
  const { settings } = useSettings();
  const { theme } = useTheme();

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const outstanding = calculateTotalByStatus('sent');
    const overdue = calculateTotalByStatus('overdue');

    return {
      income,
      expenses,
      netIncome: income - expenses,
      outstanding,
      overdue,
    };
  }, [transactions, calculateTotalByStatus]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { income: number; expenses: number } } = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        months[monthKey].income += t.amount;
      } else {
        months[monthKey].expenses += t.amount;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...data,
      }))
      .slice(-12);
  }, [transactions]);

  const recentTransactions = transactions.slice().reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Income"
          value={formatCurrency(stats.netIncome, settings?.currency)}
          icon={<DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(stats.outstanding, settings?.currency)}
          icon={<Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
        />
        <StatCard
          title="Overdue Invoices"
          value={formatCurrency(stats.overdue, settings?.currency)}
          icon={<TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />}
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(stats.income, settings?.currency)}
          icon={<DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Income vs Expenses</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                <Tooltip
                  contentStyle={theme === 'dark' ? { backgroundColor: '#1f2937', borderColor: '#4b5563', color: '#f3f4f6' } : undefined}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No transactions yet</p>
          )}
        </Card>

        {/* Invoice Status */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Invoice Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Draft</span>
              <Badge variant="gray">{getInvoicesByStatus('draft').length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Sent</span>
              <Badge variant="primary">{getInvoicesByStatus('sent').length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Paid</span>
              <Badge variant="success">{getInvoicesByStatus('paid').length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Overdue</span>
              <Badge variant="danger">{getInvoicesByStatus('overdue').length}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900 dark:text-gray-100">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400">Description</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400">Category</th>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400">Type</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{t.description}</td>
                    <td className="py-3 px-4">{t.category}</td>
                    <td className="py-3 px-4">
                      <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings?.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
        )}
      </Card>
    </div>
  );
};
