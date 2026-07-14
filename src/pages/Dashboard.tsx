import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useTransactions } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/currency';
import { DollarSign, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: string;
}> = ({ title, value, icon, iconBg = 'bg-brand-100 dark:bg-brand-900/30', trend }) => (
  <Card variant="default" className="flex items-center gap-3 sm:gap-4">
    <div className={`shrink-0 ${iconBg} p-2.5 sm:p-3 rounded-xl`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate">{title}</p>
      <p className="text-lg sm:text-2xl font-display font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
      {trend && (
        <p className="text-xs text-success-600 dark:text-success-400 flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" />{trend}
        </p>
      )}
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const { getInvoicesByStatus, calculateTotalByStatus } = useInvoices();
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

      {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Net Income"
          value={formatCurrency(stats.netIncome, settings?.currency)}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 dark:text-brand-400" />}
          iconBg="bg-brand-100 dark:bg-brand-900/30"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding, settings?.currency)}
          icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600 dark:text-warning-400" />}
          iconBg="bg-warning-50 dark:bg-warning-900/20"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(stats.overdue, settings?.currency)}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-danger-600 dark:text-danger-400" />}
          iconBg="bg-danger-50 dark:bg-danger-900/20"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(stats.income, settings?.currency)}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-success-600 dark:text-success-400" />}
          iconBg="bg-success-50 dark:bg-success-900/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Chart */}
        <Card variant="default" className="lg:col-span-2">
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Income vs Expenses
          </h2>
          {monthlyData.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <div className="min-w-[320px]">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="month" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 11 }} />
                    <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={
                        theme === 'dark'
                          ? { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px' }
                          : { borderRadius: '12px', borderColor: '#e2e8f0' }
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-center py-12 text-sm">No transactions yet</p>
          )}
        </Card>

        {/* Invoice Status */}
        <Card variant="default">
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Invoice Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Draft',   variant: 'gray'    as const, status: 'draft'   as const },
              { label: 'Sent',    variant: 'primary' as const, status: 'sent'    as const },
              { label: 'Paid',    variant: 'success' as const, status: 'paid'    as const },
              { label: 'Overdue', variant: 'danger'  as const, status: 'overdue' as const },
            ].map(({ label, variant, status }) => (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-300 text-sm">{label}</span>
                <Badge variant={variant} dot>{getInvoicesByStatus(status).length}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card variant="default">
        <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <>
            <div className="space-y-3 md:hidden">
              {recentTransactions.map((transaction) => (
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
                    <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                      {transaction.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Category</p>
                      <p className="text-gray-900 dark:text-gray-100">{transaction.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Amount</p>
                      <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, settings?.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
        )}
      </Card>
    </div>
  );
};
