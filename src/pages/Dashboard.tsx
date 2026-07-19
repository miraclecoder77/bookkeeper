import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useTransactions } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import { getDB } from '../services/indexeddb';
import { TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { Category } from '../types';

const StatCard: React.FC<{
  title: string;
  amountMinorUnits: number;
  currency: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: string;
}> = ({ title, amountMinorUnits, currency, icon, iconBg = 'bg-brand-100 dark:bg-brand-900/30', trend }) => (
  <Card variant="default" className="flex items-center gap-3 sm:gap-4 bg-slate-900 border border-slate-800">
    <div className={`shrink-0 ${iconBg} p-2.5 sm:p-3 rounded-xl`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-xs sm:text-sm truncate">{title}</p>
      <div className="text-lg sm:text-2xl font-display font-bold text-white truncate">
        <Money amountMinorUnits={amountMinorUnits} currency={currency} />
      </div>
      {trend && (
        <p className="text-xs text-green-400 flex items-center gap-0.5 mt-0.5">
          <ArrowUpRight className="w-3 h-3" />{trend}
        </p>
      )}
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const { invoices } = useInvoices();
  const { profile } = useUserProfile();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const db = getDB();
        const cats = await db.getAll('categories');
        setCategories(cats);
      } catch (e) {
        console.error(e);
      }
    };
    loadCategories();
  }, []);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const currency = profile?.baseCurrency || 'NGN';

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amountMinorUnits, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountMinorUnits, 0);

    const outstanding = invoices
      .filter((i) => i.status === 'sent')
      .reduce((sum, i) => sum + (i.totalMinorUnits - i.amountPaidMinorUnits), 0);

    const overdue = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.totalMinorUnits - i.amountPaidMinorUnits), 0);

    return {
      income,
      expenses,
      netIncome: income - expenses,
      outstanding,
      overdue,
    };
  }, [transactions, invoices]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { income: number; expenses: number } } = {};

    transactions.forEach((t) => {
      try {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!months[monthKey]) {
          months[monthKey] = { income: 0, expenses: 0 };
        }

        if (t.type === 'income') {
          months[monthKey].income += t.amountMinorUnits / 100;
        } else {
          months[monthKey].expenses += t.amountMinorUnits / 100;
        }
      } catch {}
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
      }))
      .slice(-12);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-display">Financial Dashboard</h1>
        <p className="text-slate-400 text-sm">Offline-first freelance accounting ledger</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Net Income"
          amountMinorUnits={stats.netIncome}
          currency={currency}
          icon={<span className="text-brand-400 font-semibold text-lg sm:text-xl">₦</span>}
          iconBg="bg-brand-500/10"
        />
        <StatCard
          title="Outstanding"
          amountMinorUnits={stats.outstanding}
          currency={currency}
          icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />}
          iconBg="bg-yellow-500/10"
        />
        <StatCard
          title="Overdue"
          amountMinorUnits={stats.overdue}
          currency={currency}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />}
          iconBg="bg-red-500/10"
        />
        <StatCard
          title="Total Income"
          amountMinorUnits={stats.income}
          currency={currency}
          icon={<span className="text-green-500 font-semibold text-lg sm:text-xl">₦</span>}
          iconBg="bg-green-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Chart */}
        <Card variant="default" className="lg:col-span-2 bg-slate-900 border border-slate-800">
          <h2 className="font-display text-base sm:text-lg font-semibold text-white mb-4">
            Income vs Expenses
          </h2>
          {monthlyData.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <div className="min-w-[320px]">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12 text-sm">No transactions logged yet</p>
          )}
        </Card>

        {/* Invoice Status */}
        <Card variant="default" className="bg-slate-900 border border-slate-800">
          <h2 className="font-display text-base sm:text-lg font-semibold text-white mb-4">
            Invoice Tracking
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Draft',   variant: 'gray'    as const, count: invoices.filter(i => i.status === 'draft').length },
              { label: 'Sent',    variant: 'primary' as const, count: invoices.filter(i => i.status === 'sent').length },
              { label: 'Paid',    variant: 'success' as const, count: invoices.filter(i => i.status === 'paid').length },
              { label: 'Overdue', variant: 'danger'  as const, count: invoices.filter(i => i.status === 'overdue').length },
            ].map(({ label, variant, count }) => (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-slate-300 text-sm">{label}</span>
                <Badge variant={variant} dot>{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card variant="default" className="bg-slate-900 border border-slate-800">
        <h2 className="font-display text-base sm:text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <>
            <div className="space-y-3 md:hidden">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{transaction.notes || 'No description'}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={transaction.type === 'income' ? 'success' : 'danger'}>
                      {transaction.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Category</p>
                      <p className="text-slate-200">{catMap.get(transaction.categoryId) || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Amount</p>
                      <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}<Money amountMinorUnits={transaction.amountMinorUnits} currency={transaction.currency} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-slate-200">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th className="text-left py-2 px-4 text-slate-400 font-semibold">Date</th>
                    <th className="text-left py-2 px-4 text-slate-400 font-semibold">Description</th>
                    <th className="text-left py-2 px-4 text-slate-400 font-semibold">Category</th>
                    <th className="text-left py-2 px-4 text-slate-400 font-semibold">Type</th>
                    <th className="text-right py-2 px-4 text-slate-400 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                      <td className="py-3 px-4">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{t.notes || 'No notes'}</td>
                      <td className="py-3 px-4">{catMap.get(t.categoryId) || 'Uncategorized'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}<Money amountMinorUnits={t.amountMinorUnits} currency={t.currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-center py-8">No transactions logged yet</p>
        )}
      </Card>
    </div>
  );
};
export default Dashboard;
