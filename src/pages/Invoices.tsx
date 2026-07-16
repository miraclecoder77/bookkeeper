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
import { formatCurrency, formatCurrencyForPDF } from '../utils/currency';
import { Invoice, LineItem } from '../types';
import { Plus, Trash2, Download, Edit2 } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { clients } = useClients();
  const { settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialFormData = {
    clientId: '',
    invoiceNumber: '',
    status: 'draft' as Invoice['status'],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const handleReset = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setFormData({
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems.map((item) => ({ ...item })),
      notes: invoice.notes || '',
    });
    setShowForm(true);
  };

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
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = margin;

    // Attempt HTML-to-canvas rendering first so fonts and currency symbols render exactly
    // as in the browser (handles symbols like ₦). Fall back to programmatic jsPDF layout
    // below if rendering fails.
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.style.color = '#111827';
      container.style.padding = '24px';
      container.style.boxSizing = 'border-box';
      container.style.fontFamily = 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif';

      // Build simple HTML invoice for rendering
      const rowsHtml = invoice.lineItems.map((it) => {
        const itemTotal = (it.quantity * it.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${(it.description || '-')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${it.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${(settings?.currency ? settings.currency.toUpperCase() : 'USD')} ${it.unitPrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${(settings?.currency ? settings.currency.toUpperCase() : 'USD')} ${itemTotal}</td>
          </tr>`;
      }).join('\n');

      container.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <div style="font-weight:700;font-size:18px">${settings?.name || ''}</div>
              <div style="font-size:12px;color:#6b7280">${settings?.email || ''}</div>
              <div style="font-size:12px;color:#6b7280">${settings?.phone || ''}</div>
              <div style="font-size:12px;color:#6b7280">${settings?.address || ''}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:22px;font-weight:700">INVOICE</div>
              <div style="font-size:12px;color:#6b7280">Invoice #: ${invoice.invoiceNumber}</div>
              <div style="font-size:12px;color:#6b7280">Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
              <div style="font-size:12px;color:#6b7280">Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-weight:600;font-size:12px;color:#374151">Bill To</div>
            <div style="font-size:13px">${client.name}</div>
            <div style="font-size:12px;color:#6b7280">${client.email}</div>
            <div style="font-size:12px;color:#6b7280">${client.address || ''}</div>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <thead>
              <tr style="background:#f3f4f6;color:#111827;font-weight:600;">
                <th style="text-align:left;padding:8px 12px;">Description</th>
                <th style="text-align:right;padding:8px 12px;">Qty</th>
                <th style="text-align:right;padding:8px 12px;">Unit</th>
                <th style="text-align:right;padding:8px 12px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <div style="width:320px;border-top:1px solid #e5e7eb;padding-top:12px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;">
                <div>Subtotal</div>
                <div>${(settings?.currency ? settings.currency.toUpperCase() : 'USD')} ${invoice.total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Wait briefly for fonts and images to settle
      await new Promise((res) => setTimeout(res, 200));

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      pdf.setProperties({ title: `Invoice ${invoice.invoiceNumber}` });
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

      // cleanup
      document.body.removeChild(container);
      return;
    } catch (err) {
      console.warn('HTML-to-canvas PDF export failed, falling back to programmatic PDF layout', err);
      // continue to existing jsPDF programmatic rendering below
    }

    // Add logo (if available) - downscale and convert to JPEG for smaller PDFs
    if (settings?.logo) {
      try {
        const img = new Image();
        img.src = settings.logo;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        const maxLogoWidth = 120;
        const ratio = img.width / img.height || 1;
        const imgWidth = Math.min(maxLogoWidth, img.width);
        const imgHeight = imgWidth / ratio;

        // Convert to JPEG at 0.8 quality to reduce size
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const jpegData = canvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(jpegData, 'JPEG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 8;
        }
      } catch (e) {
        // image failed to load; continue without logo
        console.warn('Failed to load logo for PDF export', e);
      }
    }

    // Title
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
    yPos += 24;

    // Business Info (left) and Invoice meta (right)
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    const leftX = margin;
    const rightX = pageWidth - margin;

    if (settings) {
      let infoY = yPos - 6;
      pdf.text(settings.name || '', leftX, infoY);
      infoY += 14;
      if (settings.email) pdf.text(`Email: ${settings.email}`, leftX, infoY), (infoY += 12);
      if (settings.phone) pdf.text(`Phone: ${settings.phone}`, leftX, infoY), (infoY += 12);
      if (settings.address) pdf.text(settings.address, leftX, infoY), (infoY += 12);
    }

    // Invoice meta on the right
    pdf.text(`Invoice #: ${invoice.invoiceNumber}`, rightX, yPos, { align: 'right' });
    yPos += 14;
    pdf.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, rightX, yPos, { align: 'right' });
    yPos += 14;
    pdf.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, rightX, yPos, { align: 'right' });
    yPos += 18;

    // Bill To
    pdf.setFont(undefined, 'bold');
    pdf.text('BILL TO:', leftX, yPos);
    pdf.setFont(undefined, 'normal');
    yPos += 14;
    pdf.text(client.name, leftX, yPos);
    yPos += 14;
    pdf.text(client.email, leftX, yPos);
    yPos += 14;
    if (client.address) {
      pdf.text(client.address, leftX, yPos);
      yPos += 14;
    }

    yPos += 6;

    // Table header
    const tableX = leftX;
    const tableWidth = pageWidth - margin * 2;
    const colDescWidth = tableWidth * 0.55;
    const colQtyWidth = tableWidth * 0.12;
    const colUnitWidth = tableWidth * 0.16;
    const colTotalWidth = tableWidth * 0.17;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(tableX, yPos, tableWidth, 22, 'F');
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(10);
    // Column X/righthand coordinates for aligned numeric values
    const colDescX = tableX + 6;
    const colQtyRight = tableX + colDescWidth + colQtyWidth - 6;
    const colUnitRight = tableX + colDescWidth + colQtyWidth + colUnitWidth - 6;
    const colTotalRight = tableX + tableWidth - 6;

    pdf.text('Description', colDescX, yPos + 14);
    pdf.text('Qty', colQtyRight, yPos + 14, { align: 'right' });
    pdf.text('Unit', colUnitRight, yPos + 14, { align: 'right' });
    pdf.text('Total', colTotalRight, yPos + 14, { align: 'right' });
    yPos += 28;

    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);

    // Rows
    invoice.lineItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const descLines = pdf.splitTextToSize(item.description || '-', colDescWidth - 10);
      const rowHeight = Math.max(14, descLines.length * 12);

      // Page break
      const bottomLimit = pdf.internal.pageSize.getHeight() - margin - 60;
      if (yPos + rowHeight > bottomLimit) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.text(descLines, colDescX, yPos + 12);
      pdf.text(String(item.quantity), colQtyRight, yPos + 12, { align: 'right' });
      pdf.text(formatCurrencyForPDF(item.unitPrice, settings?.currency), colUnitRight, yPos + 12, { align: 'right' });
      pdf.text(formatCurrencyForPDF(itemTotal, settings?.currency), colTotalRight, yPos + 12, { align: 'right' });

      yPos += rowHeight + 6;
    });

    // Total block
    const totalY = yPos + 8;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.text('Subtotal', tableX + colDescWidth + colQtyWidth + 6, totalY);
    pdf.text(formatCurrencyForPDF(invoice.total, settings?.currency), colTotalRight, totalY, { align: 'right' });

    // Notes
    if (invoice.notes) {
      let notesY = totalY + 24;
      const notesLines = pdf.splitTextToSize(invoice.notes, tableWidth);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.text('Notes:', tableX, notesY);
      notesY += 14;
      pdf.text(notesLines, tableX, notesY);
    }

    pdf.setProperties({ title: `Invoice ${invoice.invoiceNumber}` });
    pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage your invoices</p>
        </div>
        <Button
          onClick={() => {
            handleReset();
            setShowForm(!showForm);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          New Invoice
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? 'Edit Invoice' : 'Create Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Line Items</label>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 rounded-lg">
                {formData.lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <div className="flex items-center justify-between mb-3 sm:hidden">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Item {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label={`Remove line item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 sm:items-end">
                      <div className="sm:col-span-5">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:hidden">
                          Description
                        </p>
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:hidden">
                          Quantity
                        </p>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:hidden">
                          Unit Price
                        </p>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="hidden sm:flex sm:col-span-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label={`Remove line item ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddLineItem}
                leftIcon={<Plus className="w-4 h-4" />}
                className="mt-3 w-full sm:w-auto"
              >
                Add Line Item
              </Button>
            </div>

            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Update Invoice' : 'Create Invoice'}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="w-full sm:w-auto"
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
          <>
            <div className="space-y-3 md:hidden">
              {filteredInvoices.map((invoice) => {
                const client = clients.find((c) => c.id === invoice.clientId);
                const statusVariants = {
                  draft: 'gray' as const,
                  sent: 'primary' as const,
                  paid: 'success' as const,
                  overdue: 'danger' as const,
                };

                return (
                  <div
                    key={invoice.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client?.name || 'Unknown client'}</p>
                      </div>
                      <Badge variant={statusVariants[invoice.status]}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Issue Date</p>
                        <p className="text-gray-900 dark:text-gray-100">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                        <p className="text-gray-900 dark:text-gray-100">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(invoice.total, settings?.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportPDF(invoice)}
                        className="inline-flex items-center justify-center gap-2 flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="inline-flex items-center justify-center gap-2 flex-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="inline-flex items-center justify-center gap-2 flex-1 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-yellow-600 hover:text-yellow-700"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
          </>
        ) : (
          <p className="text-gray-500 text-center py-12">No invoices found. Create one to get started!</p>
        )}
      </Card>
    </div>
  );
};
