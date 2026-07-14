import { useState, useCallback, useEffect } from 'react';
import { Invoice } from '../types';
import * as db from '../services/indexeddb';
import { syncManager } from '../services/syncManager';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await db.getAllInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const addInvoice = useCallback(
    async (invoice: Omit<Invoice, 'id'>) => {
      const newInvoice: Invoice = {
        ...invoice,
        id: generateId(),
      };

      try {
        await db.addInvoice(newInvoice);
        setInvoices((prev) => [...prev, newInvoice]);
        syncManager.debouncedSync('invoices');
        return newInvoice;
      } catch (error) {
        console.error('Error adding invoice:', error);
        throw error;
      }
    },
    []
  );

  const updateInvoice = useCallback(async (invoice: Invoice) => {
    try {
      await db.updateInvoice(invoice);
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoice.id ? invoice : i))
      );
      syncManager.debouncedSync('invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      await db.deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      syncManager.debouncedSync('invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }, []);

  const getInvoicesByStatus = useCallback(
    (status: Invoice['status']) => {
      return invoices.filter((i) => i.status === status);
    },
    [invoices]
  );

  const getInvoicesByClient = useCallback(
    (clientId: string) => {
      return invoices.filter((i) => i.clientId === clientId);
    },
    [invoices]
  );

  const calculateTotalByStatus = useCallback(
    (status: Invoice['status']) => {
      return getInvoicesByStatus(status).reduce((sum, i) => sum + i.total, 0);
    },
    [getInvoicesByStatus]
  );

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoicesByStatus,
    getInvoicesByClient,
    calculateTotalByStatus,
  };
};
