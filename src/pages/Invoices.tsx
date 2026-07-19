import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import { getDB } from '../services/indexeddb';
import { Invoice, InvoiceLineItem, Client } from '../types';
import { Plus, Trash2, Download, CheckCircle } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, recordPayment } = useInvoices();
  const { clients } = useClients();
  const { profile } = useUserProfile();
  
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentAmountDecimal, setPaymentAmountDecimal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const defaultCurrency = profile?.invoicingCurrency || 'NGN';
  const defaultTaxRate = profile?.jurisdiction === 'NG' ? 7.5 : 0; // Nigeria standard VAT is 7.5%

  const initialFormData = {
    clientId: '',
    invoiceNumber: '',
    status: 'draft' as Invoice['status'],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: defaultCurrency,
    lineItems: [
      {
        description: '',
        quantity: 1,
        unitPriceDecimal: '',
        taxRate: defaultTaxRate,
      }
    ],
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (profile) {
      setFormData(f => ({ ...f, currency: profile.invoicingCurrency }));
    }
  }, [profile]);

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      currency: profile?.invoicingCurrency || 'NGN',
    });
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      const db = getDB();
      const allItems = await db.getAll('invoiceLineItems');
      const invoiceItems = allItems.filter(item => item.invoiceId === invoice.id);
      
      setEditingId(invoice.id);
      setFormData({
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        notes: invoice.notes || '',
        lineItems: invoiceItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceDecimal: (item.unitPriceMinorUnits / 100).toString(),
          taxRate: item.taxRate,
        })),
      });
      setShowForm(true);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (filterStatus !== 'all') {
      result = result.filter((i) => i.status === filterStatus);
    }
    return [...result].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [invoices, filterStatus]);

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPriceDecimal: '', taxRate: defaultTaxRate }],
    });
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.invoiceNumber || formData.lineItems.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const preparedLineItems = formData.lineItems.map((item, idx) => {
      const price = parseFloat(item.unitPriceDecimal) || 0;
      return {
        description: item.description || 'Line Item',
        quantity: Number(item.quantity) || 1,
        unitPriceMinorUnits: Math.round(price * 100),
        taxRate: Number(item.taxRate) || 0,
        sortOrder: idx,
      };
    });

    try {
      if (editingId) {
        await updateInvoice(editingId, {
          clientId: formData.clientId,
          invoiceNumber: formData.invoiceNumber,
          status: formData.status,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          currency: formData.currency,
          notes: formData.notes,
          lineItems: preparedLineItems as any,
        });
      } else {
        await addInvoice({
          clientId: formData.clientId,
          invoiceNumber: formData.invoiceNumber,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          currency: formData.currency,
          notes: formData.notes,
          lineItems: preparedLineItems,
        });
      }

      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!showPaymentModal) return;
    const amt = parseFloat(paymentAmountDecimal);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = Math.round(amt * 100);
    const res = await recordPayment(showPaymentModal, {
      amount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
    });

    if (res.ok) {
      alert('Payment recorded and linked to transaction logs.');
      setShowPaymentModal(null);
      setPaymentAmountDecimal('');
    } else {
      alert('Failed to record payment');
    }
  };

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Simple PDF generator fallback
  const handleExportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`INVOICE #${invoice.invoiceNumber}`, 20, 20);
    doc.setFontSize(11);
    doc.text(`Issue Date: ${invoice.issueDate}`, 20, 30);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 36);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 42);
    doc.text(`Total Due: ${invoice.currency} ${(invoice.totalMinorUnits / 100).toFixed(2)}`, 20, 52);
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 20, 70);
    }
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between font-display">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoice Manager</h1>
          <p className="text-slate-400 text-sm">Issue and track client invoices</p>
        </div>
        <Button
          onClick={() => {
            handleReset();
            setShowForm(!showForm);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white"
        >
          Add Invoice
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Edit Invoice' : 'Create Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Client (Required)"
                value={formData.clientId}
                onChange={(e) => {
                  const client = clientMap.get(e.target.value);
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    currency: client?.defaultCurrency || defaultCurrency,
                  });
                }}
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select a client"
                required
              />
              <Input
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="e.g. INV-2026-001"
                required
              />
              <Input
                label="Issue Date"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { value: 'NGN', label: 'NGN (₦)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GHS', label: 'GHS (₵)' },
                  { value: 'KES', label: 'KES (KSh)' },
                ]}
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'partially_paid', label: 'Partially Paid' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'void', label: 'Void' },
                ]}
              />
            </div>

            <div className="space-y-3 pt-3">
              <h3 className="font-semibold text-white">Line Items</h3>
              {formData.lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Input
                      label="Description"
                      value={item.description}
                      onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                      placeholder="e.g. Design consulting"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Qty"
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(e) => handleUpdateLineItem(idx, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      label="Unit Price"
                      type="number"
                      value={item.unitPriceDecimal}
                      onChange={(e) => handleUpdateLineItem(idx, 'unitPriceDecimal', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-2.5 text-red-400 border border-slate-800 rounded-xl hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={handleAddLineItem} className="bg-slate-800 hover:bg-slate-700 text-xs">
                Add Item Row
              </Button>
            </div>

            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment terms, bank details, etc."
            />

            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              <Button type="submit" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white">
                Save Invoice
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  handleReset();
                }}
                className="w-full sm:w-auto bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-900 border border-slate-800">
        <Select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          options={[
            { value: 'all', label: 'All Invoices' },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
          ]}
        />
      </Card>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInvoices.map((inv) => {
          const client = clientMap.get(inv.clientId);
          return (
            <Card key={inv.id} className="bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white font-display">Invoice #{inv.invoiceNumber}</h3>
                  <p className="text-xs text-slate-400">{client ? client.name : 'Unknown Client'}</p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      inv.status === 'paid'
                        ? 'success'
                        : inv.status === 'overdue'
                        ? 'danger'
                        : inv.status === 'sent'
                        ? 'primary'
                        : 'gray'
                    }
                  >
                    {inv.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <p className="text-slate-500 text-xs">Issue / Due</p>
                  <p className="text-xs">{inv.issueDate} / {inv.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">Total Amount</p>
                  <p className="font-semibold text-white text-base">
                    <Money amountMinorUnits={inv.totalMinorUnits} currency={inv.currency} />
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-800/80 pt-3">
                {inv.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowPaymentModal(inv.id);
                      setPaymentAmountDecimal(((inv.totalMinorUnits - inv.amountPaidMinorUnits) / 100).toString());
                    }}
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs"
                  >
                    Record Payment
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleEditInvoice(inv)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleExportPDF(inv)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  PDF
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-lg">Record Invoice Payment</h3>
            <Input
              label="Amount Paid"
              type="number"
              value={paymentAmountDecimal}
              onChange={(e) => setPaymentAmountDecimal(e.target.value)}
            />
            <Select
              label="Payment Channel"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'mobile_money', label: 'Mobile Money' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
              ]}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button
                onClick={() => setShowPaymentModal(null)}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPaymentSubmit}
                className="bg-brand-600 text-white hover:bg-brand-500"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Invoices;
