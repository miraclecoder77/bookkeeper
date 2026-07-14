import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types';
import * as db from '../services/indexeddb';
import { syncManager } from '../services/syncManager';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await db.getAllTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>) => {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
      };

      try {
        await db.addTransaction(newTransaction);
        setTransactions((prev) => [...prev, newTransaction]);
        syncManager.debouncedSync('transactions');
        return newTransaction;
      } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
      }
    },
    []
  );

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    try {
      await db.updateTransaction(transaction);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? transaction : t))
      );
      syncManager.debouncedSync('transactions');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await db.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      syncManager.debouncedSync('transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, []);

  const filterByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
    },
    [transactions]
  );

  const filterByType = useCallback(
    (type: 'income' | 'expense') => {
      return transactions.filter((t) => t.type === type);
    },
    [transactions]
  );

  const filterByCategory = useCallback(
    (category: string) => {
      return transactions.filter((t) => t.category === category);
    },
    [transactions]
  );

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filterByDateRange,
    filterByType,
    filterByCategory,
  };
};
