import { useMemo } from 'react';
import { Invoice, Transaction } from '../types';

const inPeriod = (date: string, year: number, month: number) => {
  const value = new Date(`${date}T00:00:00`);
  return value.getFullYear() === year && value.getMonth() === month;
};

const percentageChange = (current: number, previous: number) =>
  previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / Math.abs(previous)) * 100;

export const useDashboardMetrics = (transactions: Transaction[], invoices: Invoice[]) => useMemo(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previous = new Date(currentYear, currentMonth - 1, 1);
  const totals = (year: number, month: number) => {
    const periodTransactions = transactions.filter(t => inPeriod(t.date, year, month));
    const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinorUnits, 0);
    const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountMinorUnits, 0);
    // Invoice payments are revenue only when there is no matching income ledger entry.
    const invoiceRevenue = invoices.filter(i => i.status === 'paid' && inPeriod(i.issueDate, year, month))
      .reduce((sum, i) => sum + i.amountPaidMinorUnits, 0);
    return { income, expenses, net: income + invoiceRevenue - expenses };
  };
  const current = totals(currentYear, currentMonth);
  const prior = totals(previous.getFullYear(), previous.getMonth());
  const unpaid = invoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status));
  const paid = invoices.filter(i => i.status === 'paid');
  return {
    netIncome: current.net,
    netIncomeChange: percentageChange(current.net, prior.net),
    expenses: current.expenses,
    expensesChange: percentageChange(current.expenses, prior.expenses),
    outstandingAmount: unpaid.reduce((sum, i) => sum + Math.max(0, i.totalMinorUnits - i.amountPaidMinorUnits), 0),
    outstandingCount: unpaid.length,
    paidAmount: paid.reduce((sum, i) => sum + i.amountPaidMinorUnits, 0),
    paidCount: paid.length,
  };
}, [transactions, invoices]);

export const dashboardChartData = (transactions: Transaction[], invoices: Invoice[]) => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    const year = date.getFullYear(); const month = date.getMonth();
    const tx = transactions.filter(t => inPeriod(t.date, year, month));
    const paidInvoices = invoices.filter(i => i.status === 'paid' && inPeriod(i.issueDate, year, month));
    return {
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      income: (tx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinorUnits, 0) + paidInvoices.reduce((sum, i) => sum + i.amountPaidMinorUnits, 0)) / 100,
      expenses: tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountMinorUnits, 0) / 100,
    };
  });
};
