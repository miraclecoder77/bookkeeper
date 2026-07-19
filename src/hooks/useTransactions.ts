import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types';
import * as dal from '../services/dal';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const res = await dal.transactions.list();
    if (res.ok && res.data) {
      setTransactions(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = useCallback(async (payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await dal.transactions.create(payload);
    if (res.ok && res.data) {
      setTransactions(prev => [res.data!, ...prev]);
      return res.data;
    }
    return null;
  }, []);

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    const res = await dal.transactions.update(id, patch);
    if (res.ok && res.data) {
      setTransactions(prev => prev.map(t => t.id === id ? res.data! : t));
    }
    return res;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const res = await dal.transactions.delete(id);
    if (res.ok) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
    return res;
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    reloadTransactions: loadTransactions,
  };
};
