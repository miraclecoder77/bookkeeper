import { useState, useCallback, useEffect } from 'react';
import { Invoice, InvoiceLineItem } from '../types';
import * as dal from '../services/dal';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const res = await dal.invoices.list();
    if (res.ok && res.data) {
      setInvoices(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const refresh = () => loadInvoices();
    window.addEventListener('bookkeeper:invoices-changed', refresh);
    return () => window.removeEventListener('bookkeeper:invoices-changed', refresh);
  }, [loadInvoices]);

  const addInvoice = useCallback(async (payload: Parameters<typeof dal.invoices.create>[0]) => {
    const res = await dal.invoices.create(payload);
    if (res.ok && res.data) {
      setInvoices(prev => [res.data!, ...prev]);
      window.dispatchEvent(new Event('bookkeeper:invoices-changed'));
      return res.data;
    }
    return null;
  }, []);

  const updateInvoice = useCallback(async (id: string, patch: Partial<Invoice> & { lineItems?: InvoiceLineItem[] }) => {
    const res = await dal.invoices.update(id, patch);
    if (res.ok && res.data) {
      setInvoices(prev => prev.map(i => i.id === id ? res.data! : i));
      window.dispatchEvent(new Event('bookkeeper:invoices-changed'));
    }
    return res;
  }, []);

  const getInvoice = useCallback(async (id: string) => dal.invoices.get(id), []);

  const deleteInvoice = useCallback(async (id: string) => {
    const res = await dal.invoices.delete(id);
    if (res.ok) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      window.dispatchEvent(new Event('bookkeeper:invoices-changed'));
    }
    return res;
  }, []);

  const recordPayment = useCallback(async (id: string, payment: { amount: number; date: string; method: string }) => {
    const res = await dal.invoices.recordPayment(id, payment);
    if (res.ok && res.data) {
      setInvoices(prev => prev.map(i => i.id === id ? res.data! : i));
      window.dispatchEvent(new Event('bookkeeper:invoices-changed'));
    }
    return res;
  }, []);

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    getInvoice,
    deleteInvoice,
    recordPayment,
    reloadInvoices: loadInvoices,
  };
};
