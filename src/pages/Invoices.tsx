import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { Invoice, LineItem } from '../types';
import { Plus, Trash2, Download, Edit2 } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { clients } = useClients();
  const { settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNumber: '',
    status: 'draft' as Invoice['status'],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
  });

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (filterStatus !== 'all') {
      result = result.filter((i) => i.status === filterStatus);
    }

    return result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, filterStatus]);

  const handleAddLineItem = () => {
    const newLineItem: LineItem = {
      id: Math.random().toString(36).substring(2, 11),
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newLineItem],
    });
  };

  const handleRemoveLineItem = (id: string) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((item) => item.id !== id),
    });
  };

  const handleUpdateLineItem = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.invoiceNumber || formData.lineItems.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const total = calculateTotal();
      const invoiceData = {
        clientId: formData.clientId,
        invoiceNumber: formData.invoiceNumber,
        status: formData.status,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        lineItems: formData.lineItems,
        total,
        notes: formData.notes,
      };

      if (editingId) {
        await updateInvoice({ id: editingId, ...invoiceData });
        setEditingId(null);
      } else {
        await addInvoice(invoiceData);
      }

      setFormData({
        clientId: '',
        invoiceNumber: '',
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lineItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
        notes: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const handleExportPDF = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    if (!client) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    pdf.setFontSize(20);
    pdf.text('INVOICE', pageWidth - 20, yPos, { align: 'right' });
    yPos += 15;

    // Business Info
    if (settings) {
      pdf.setFontSize(12);
      pdf.text(settings.name, 20, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      if (settings.email) pdf.text(`Email: ${settings.email}`, 20, yPos), (yPos += 5);
      if (settings.phone) pdf.text(`Phone: ${settings.phone}`, 20, yPos), (yPos += 5);
      if (settings.address) pdf.text(`Address: ${settings.address}`, 20, yPos), (yPos += 5);
    }

    yPos += 10;

    // Invoice Details
    pdf.setFontSize(10);
    pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPos);
    yPos += 5;
    pdf.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, yPos);
    yPos += 5;
    pdf.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, yPos);
    yPos += 10;

    // Client Info
    pdf.text('BILL TO:', 20, yPos);
    yPos += 5;
    pdf.text(client.name, 20, yPos);
    yPos += 5;
    pdf.text(client.email, 20, yPos);
    yPos += 5;
    if (client.address) {
      pdf.text(client.address, 20, yPos);
      yPos += 5;
    }

    yPos += 10;

    // Line Items Table
    const tableTop = yPos;
    const colWidths = { description: 80, quantity: 30, unitPrice: 30, total: 30 };
    const cellPadding = 5;

    // Header Row
    pdf.setFillColor(200, 200, 200);
    pdf.rect(20, tableTop, pageWidth - 40, 7, 'F');
    pdf.text('Description', 20 + cellPadding, tableTop + 5);
    pdf.text('Qty', 20 + colWidths.description + cellPadding, tableTop + 5);
    pdf.text('Unit Price', 20 + colWidths.description + colWidths.quantity + cellPadding, tableTop + 5);
    pdf.text('Total', 20 + colWidths.description + colWidths.quantity + colWidths.unitPrice + cellPadding, tableTop + 5);

    yPos = tableTop + 10;

    // Line Items
    invoice.lineItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      pdf.text(item.description, 20 + cellPadding, yPos);
      pdf.text(item.quantity.toString(), 20 + colWidths.description + cellPadding, yPos);
      pdf.text(formatCurrency(item.unitPrice, settings?.currency), 20 + colWidths.description + colWidths.quantity + cellPadding, yPos);
      pdf.text(formatCurrency(itemTotal, settings?.currency), 20 + colWidths.description + colWidths.quantity + colWidths.unitPrice + cellPadding, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Total
    pdf.setFontSize(12);
    pdf.text(`Total: ${formatCurrency(invoice.total, settings?.currency)}`, pageWidth - 40, yPos, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPos += 15;
      pdf.setFontSize(10);
      pdf.text('Notes:', 20, yPos);
      yPos += 5;
      const notesLines = pdf.splitTextToSize(invoice.notes, pageWidth - 40);
      pdf.text(notesLines, 20, yPos);
    }

    pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Create and manage your invoices</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Invoice' : 'Create Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select a client"
              />
              <Input
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-001"
              />
              <Input
                label="Issue Date"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Line Items</label>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <Input
                      className="col-span-5"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value))}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="col-span-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLineItem} className="mt-3">
                <Plus className="w-4 h-4" />
                Add Line Item
              </Button>
            </div>

            <div>
              <p className="text-lg font-semibold text-gray-900">
                Total: {formatCurrency(calculateTotal(), settings?.currency)}
              </p>
            </div>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />

            <Input
              label="Notes (optional)"
              placeholder="Payment terms, thank you message, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <div className="flex space-x-2">
              <Button type="submit">{editingId ? 'Update Invoice' : 'Create Invoice'}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <Card>
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
      <Card>
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Issue Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Due Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.clientId);
                  const statusVariants = {
                    draft: 'gray' as const,
                    sent: 'primary' as const,
                    paid: 'success' as const,
                    overdue: 'danger' as const,
                  };

                  return (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4 text-sm">{client?.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold">
                        {formatCurrency(invoice.total, settings?.currency)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={statusVariants[invoice.status]}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2 flex justify-center">
                        <button
                          onClick={() => handleExportPDF(invoice)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No invoices found. Create one to get started!</p>
        )}
      </Card>
    </div>
  );
};
