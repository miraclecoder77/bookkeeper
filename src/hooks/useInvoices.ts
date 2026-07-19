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

  const addInvoice = useCallback(async (payload: Parameters<typeof dal.invoices.create>[0]) => {
    const res = await dal.invoices.create(payload);
    if (res.ok && res.data) {
      setInvoices(prev => [res.data!, ...prev]);
      return res.data;
    }
    return null;
  }, []);

  const updateInvoice = useCallback(async (id: string, patch: Partial<Invoice> & { lineItems?: InvoiceLineItem[] }) => {
    const res = await dal.invoices.update(id, patch);
    if (res.ok && res.data) {
      setInvoices(prev => prev.map(i => i.id === id ? res.data! : i));
    }
    return res;
  }, []);

  const recordPayment = useCallback(async (id: string, payment: { amount: number; date: string; method: string }) => {
    const res = await dal.invoices.recordPayment(id, payment);
    if (res.ok && res.data) {
      setInvoices(prev => prev.map(i => i.id === id ? res.data! : i));
    }
    return res;
  }, []);

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    recordPayment,
    reloadInvoices: loadInvoices,
  };
};
