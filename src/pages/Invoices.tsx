import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useUserProfile } from '../hooks/useUserProfile';
import { Money } from '../components/Money';
import type { Invoice, InvoiceLineItem } from '../types';
import { jsPDF } from 'jspdf';
import {
  FilePlus2, Search, MoreHorizontal, FileText, X, Plus, Trash2, Pencil, Download
} from 'lucide-react';

type TabType = 'All' | 'Open' | 'Paid';
type InvoiceDetails = Invoice & { lineItems: InvoiceLineItem[] };
type InvoiceLineDraft = {
  id: string;
  description: string;
  quantity: string;
  rate: string;
};

type InvoiceFormState = {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  businessName: string;
  contactInfo: string;
  taxId: string;
  clientName: string;
  clientContact: string;
  billingAddress: string;
  clientEmail: string;
  paymentMethod: string;
  paymentTerms: string;
  notes: string;
  thankYou: string;
  discountAmount: string;
  taxRate: string;
  lines: InvoiceLineDraft[];
};

const createDefaultInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `INV-${year}-${seq}`;
};

const createEmptyLineItem = (): InvoiceLineDraft => ({
  id: `item_${Math.random().toString(36).slice(2, 10)}`,
  description: '',
  quantity: '1',
  rate: '',
});

const createInitialInvoiceForm = (profile: any, clients: any[]) => {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  return {
    clientId: clients[0]?.id || '',
    invoiceNumber: createDefaultInvoiceNumber(),
    issueDate: today,
    dueDate,
    businessName: profile?.displayName || 'Your Business',
    contactInfo: profile?.displayName || '',
    taxId: profile?.taxId || '',
    clientName: clients[0]?.name || '',
    clientContact: clients[0]?.phone || '',
    clientEmail: clients[0]?.email || '',
    billingAddress: clients[0]?.billingAddress || '',
    paymentMethod: 'Bank transfer / ACH',
    paymentTerms: 'Net 14',
    notes: '',
    thankYou: 'Thank you for your business.',
    discountAmount: '0',
    taxRate: '7.5',
    lines: [createEmptyLineItem()],
  } satisfies InvoiceFormState;
};

export const Invoices: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, getInvoice, deleteInvoice } = useInvoices();
  const { clients } = useClients();
  const { profile, updateProfile } = useUserProfile();

  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDetails | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [openInvoiceMenuId, setOpenInvoiceMenuId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(() => createInitialInvoiceForm(profile, clients));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const invoiceMenuRef = useRef<HTMLDivElement>(null);

  const currency = profile?.baseCurrency || 'GBP';

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  useEffect(() => {
    if (!isInvoiceModalOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeInvoiceModal();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isInvoiceModalOpen]);

  useEffect(() => {
    if (!openInvoiceMenuId) return;

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (!invoiceMenuRef.current?.contains(event.target as Node)) {
        setOpenInvoiceMenuId(null);
      }
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenInvoiceMenuId(null);
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [openInvoiceMenuId]);

  const closeInvoiceModal = () => {
    setFormErrors({});
    setSaving(false);
    setIsInvoiceModalOpen(false);
    setEditingInvoiceId(null);
    setInvoiceForm(createInitialInvoiceForm(profile, clients));
  };

  const openInvoiceModal = () => {
    setInvoiceForm(createInitialInvoiceForm(profile, clients));
    setFormErrors({});
    setEditingInvoiceId(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = async (id: string) => {
    setOpenInvoiceMenuId(null);
    const result = await getInvoice(id);
    if (!result.ok || !result.data) {
      window.alert('Unable to load this invoice for editing. Please try again.');
      return;
    }

    const invoice = result.data;
    const client = clientMap.get(invoice.clientId);
    setInvoiceForm({
      ...createInitialInvoiceForm(profile, clients),
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientName: client?.name || '',
      clientContact: client?.phone || '',
      clientEmail: client?.email || '',
      billingAddress: client?.billingAddress || '',
      notes: invoice.notes || '',
      thankYou: '',
      taxRate: String(invoice.lineItems[0]?.taxRate ?? 0),
      lines: invoice.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: String(item.quantity),
        rate: String(item.unitPriceMinorUnits / 100),
      })),
    });
    setFormErrors({});
    setEditingInvoiceId(id);
    setIsInvoiceModalOpen(true);
  };

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    setOpenInvoiceMenuId(null);
    if (!window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;

    const result = await deleteInvoice(id);
    if (!result.ok) {
      window.alert('Unable to delete this invoice. Please try again.');
    }
  };

  const handleViewInvoice = async (id: string) => {
    const result = await getInvoice(id);
    if (!result.ok || !result.data) {
      window.alert('Unable to load this invoice. Please try again.');
      return;
    }
    setViewingInvoice(result.data);
  };

  const handleDownloadInvoicePdf = (invoice: InvoiceDetails) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const client = clientMap.get(invoice.clientId);
    let y = 22;

    if (profile?.logoUrl?.startsWith('data:image/')) {
      try {
        const imageType = profile.logoUrl.match(/^data:image\/(png|jpe?g|webp)/i)?.[1]?.toUpperCase().replace('JPG', 'JPEG') || 'PNG';
        doc.addImage(profile.logoUrl, imageType, margin, y - 8, 30, 18);
      } catch {
        // A malformed image should not prevent a user from downloading their invoice.
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(profile?.displayName || 'Invoice', pageWidth - margin, y, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice ${invoice.invoiceNumber}`, pageWidth - margin, y + 7, { align: 'right' });
    y += 30;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILL TO', margin, y);
    doc.text('INVOICE DETAILS', pageWidth - margin, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(client?.name || 'Unknown client', margin, y);
    doc.text(`Issued: ${invoice.issueDate}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
    if (client?.email) doc.text(client.email, margin, y);
    doc.text(`Due: ${invoice.dueDate}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
    if (client?.billingAddress) {
      doc.text(doc.splitTextToSize(client.billingAddress, 75), margin, y);
    }
    y += 18;

    const drawTableHeader = () => {
      doc.setFillColor(245, 246, 248);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DESCRIPTION', margin + 3, y);
      doc.text('QTY', pageWidth - 54, y, { align: 'right' });
      doc.text('AMOUNT', pageWidth - margin - 3, y, { align: 'right' });
      y += 8;
      doc.setFont('helvetica', 'normal');
    };
    drawTableHeader();

    invoice.lineItems.forEach(item => {
      const description = doc.splitTextToSize(item.description, 100);
      const rowHeight = Math.max(8, description.length * 5 + 3);
      if (y + rowHeight > pageHeight - 30) {
        doc.addPage();
        y = 22;
        drawTableHeader();
      }
      doc.setFontSize(10);
      doc.text(description, margin + 3, y);
      doc.text(String(item.quantity), pageWidth - 54, y, { align: 'right' });
      doc.text(`${invoice.currency} ${(item.quantity * item.unitPriceMinorUnits / 100).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
      y += rowHeight;
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y - 3, pageWidth - margin, y - 3);
    });

    y += 6;
    if (y > pageHeight - 35) {
      doc.addPage();
      y = 25;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL', pageWidth - 62, y, { align: 'right' });
    doc.text(`${invoice.currency} ${(invoice.totalMinorUnits / 100).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

    if (invoice.notes) {
      y += 16;
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 25;
      }
      doc.setFontSize(9);
      doc.text('NOTES', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(invoice.notes, pageWidth - margin * 2), margin, y + 6);
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Please choose an image smaller than 2 MB.');
      return;
    }

    setLogoSaving(true);
    setLogoError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the logo file'));
        reader.readAsDataURL(file);
      });
      const result = await updateProfile({ logoUrl: dataUrl });
      if (!result.ok) throw new Error('Could not save the logo');
    } catch (error) {
      console.error('Failed to save invoice logo', error);
      setLogoError('Unable to save the logo. Please try again.');
    } finally {
      setLogoSaving(false);
    }
  };

  const handleLogoRemove = async () => {
    setLogoSaving(true);
    setLogoError('');
    try {
      const result = await updateProfile({ logoUrl: undefined });
      if (!result.ok) throw new Error('Could not remove the logo');
    } catch (error) {
      console.error('Failed to remove invoice logo', error);
      setLogoError('Unable to remove the logo. Please try again.');
    } finally {
      setLogoSaving(false);
    }
  };

  const updateInvoiceField = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => {
    setInvoiceForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => ({ ...prev, [key]: '' }));
  };

  const updateLineItem = (id: string, key: keyof InvoiceLineDraft, value: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      lines: prev.lines.map(line => line.id === id ? { ...line, [key]: value } : line),
    }));
    setFormErrors(prev => ({ ...prev, lines: '' }));
  };

  const addLineItem = () => {
    setInvoiceForm(prev => ({ ...prev, lines: [...prev.lines, createEmptyLineItem()] }));
  };

  const removeLineItem = (id: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      lines: prev.lines.length > 1 ? prev.lines.filter(line => line.id !== id) : prev.lines,
    }));
  };

  const lineSummaries = useMemo(() => {
    return invoiceForm.lines.map(line => {
      const quantity = Number(line.quantity) || 0;
      const rate = Number(line.rate) || 0;
      const lineTotalMinorUnits = Math.round(quantity * rate * 100);
      return { ...line, quantity, rate, lineTotalMinorUnits };
    });
  }, [invoiceForm.lines]);

  const subtotalMinorUnits = lineSummaries.reduce((sum, line) => sum + line.lineTotalMinorUnits, 0);
  const discountMinorUnits = Math.round((Number(invoiceForm.discountAmount) || 0) * 100);
  const taxRate = Number(invoiceForm.taxRate) || 0;
  const taxMinorUnits = Math.round(subtotalMinorUnits * (taxRate / 100));
  const totalMinorUnits = Math.max(subtotalMinorUnits - discountMinorUnits + taxMinorUnits, 0);

  const validateInvoiceForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!invoiceForm.clientId) {
      nextErrors.clientId = 'Pick a client to invoice';
    }
    if (!invoiceForm.invoiceNumber.trim()) {
      nextErrors.invoiceNumber = 'Invoice number is required';
    }
    if (!invoiceForm.issueDate) {
      nextErrors.issueDate = 'Issue date is required';
    }
    if (!invoiceForm.dueDate) {
      nextErrors.dueDate = 'Due date is required';
    }
    if (invoiceForm.issueDate && invoiceForm.dueDate && new Date(invoiceForm.dueDate) < new Date(invoiceForm.issueDate)) {
      nextErrors.dueDate = 'Due date must be on or after issue date';
    }

    const hasValidLine = invoiceForm.lines.some(line => {
      const quantity = Number(line.quantity) || 0;
      const rate = Number(line.rate) || 0;
      return line.description.trim().length > 0 && quantity > 0 && rate > 0;
    });

    if (!hasValidLine) {
      nextErrors.lines = 'Add at least one valid line item';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInvoiceSubmit = async (action: 'draft' | 'send') => {
    if (!validateInvoiceForm()) {
      return;
    }

    setSaving(true);

    try {
      const invoicePayload = {
        clientId: invoiceForm.clientId,
        invoiceNumber: invoiceForm.invoiceNumber,
        dueDate: invoiceForm.dueDate,
        issueDate: invoiceForm.issueDate,
        currency,
        notes: [invoiceForm.notes, invoiceForm.thankYou].filter(Boolean).join('\n\n'),
        sourceCapturedDocumentId: null,
        lineItems: invoiceForm.lines.map((line, index) => ({
          description: line.description,
          quantity: Number(line.quantity) || 0,
          unitPriceMinorUnits: Math.round((Number(line.rate) || 0) * 100),
          taxRate: Number(invoiceForm.taxRate) || 0,
          sortOrder: index,
        })),
      };

      if (editingInvoiceId) {
        const updateResult = await updateInvoice(editingInvoiceId, {
          ...invoicePayload,
          lineItems: invoicePayload.lineItems.map((line, index) => ({
            ...line,
            id: invoiceForm.lines[index].id,
            invoiceId: editingInvoiceId,
          })),
          ...(action === 'send' ? { status: 'sent' as const } : {}),
        });
        if (!updateResult.ok) throw new Error('Unable to update invoice');
      } else {
        const createdInvoice = await addInvoice(invoicePayload);

        if (!createdInvoice) {
          throw new Error('Unable to create invoice');
        }

        if (action === 'send') {
          await updateInvoice(createdInvoice.id, { status: 'sent' });
        }
      }

      closeInvoiceModal();
    } catch (error) {
      console.error('Failed to save invoice', error);
      setFormErrors({ submit: 'Unable to save invoice right now. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Combined data (hook + static fallback if empty)
  const allInvoices = useMemo(() => {
    if (invoices.length > 0) {
      return invoices.map(inv => {
        const client = clientMap.get(inv.clientId);
        return {
          id: inv.id,
          clientName: client?.name || 'Unknown Client',
          number: inv.invoiceNumber,
          description: inv.notes || 'Invoice',
          amountMinorUnits: inv.totalMinorUnits,
          dueDate: inv.dueDate,
          status: inv.status, // draft, sent, paid, overdue, cancelled
        };
      });
    }

    return [];
  }, [invoices, clientMap]);

  // Stats
  const openCount = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
  const paidCount = allInvoices.filter(i => i.status === 'paid').length;
  
  const totalBilled = allInvoices.reduce((sum, i) => sum + i.amountMinorUnits, 0);
  const totalPaid = allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amountMinorUnits, 0);
  const totalOutstanding = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amountMinorUnits, 0);
  
  const progressPct = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  // Filtered list
  const filteredInvoices = useMemo(() => {
    let list = allInvoices;

    if (activeTab === 'Open') {
      list = list.filter(i => i.status === 'sent' || i.status === 'overdue');
    } else if (activeTab === 'Paid') {
      list = list.filter(i => i.status === 'paid');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.clientName.toLowerCase().includes(q) || 
        i.number.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (a.status === 'paid' && b.status !== 'paid') return 1;
      if (a.status !== 'paid' && b.status === 'paid') return -1;
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    });

    return list;
  }, [allInvoices, activeTab, searchQuery]);

  const getClientColor = (name: string) => {
    if (name.includes('Acme')) return 'bg-indigo-500/20 text-indigo-500';
    if (name.includes('Nova')) return 'bg-violet-500/20 text-violet-500';
    if (name.includes('Northstar')) return 'bg-amber-500/20 text-amber-500';
    return 'bg-slate-500/20 text-slate-500 dark:text-slate-400';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatStatus = (status: string) => {
    if (status === 'overdue') return { label: 'Overdue', color: 'bg-expense/15 text-expense' };
    if (status === 'paid') return { label: 'Paid', color: 'bg-income/15 text-income' };
    if (status === 'draft') return { label: 'Draft', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
    return { label: 'Due soon', color: 'bg-outstanding/15 text-outstanding' };
  };

  return (
    <div className="space-y-6 pb-6 max-w-5xl mx-auto">
      {viewingInvoice && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setViewingInvoice(null)} />
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-preview-title"
              className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-default bg-surface shadow-2xl sm:rounded-[24px]"
              onClick={event => event.stopPropagation()}
            >
              <header className="flex items-start justify-between border-b border-default p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">Invoice</p>
                  <h2 id="invoice-preview-title" className="mt-1 font-display text-2xl font-bold text-primary">{viewingInvoice.invoiceNumber}</h2>
                  <p className="mt-1 text-sm text-secondary">Issued {new Date(viewingInvoice.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleDownloadInvoicePdf(viewingInvoice)} className="btn btn-ghost h-11 gap-2 px-3 text-sm">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button type="button" onClick={() => setViewingInvoice(null)} aria-label="Close invoice preview" className="flex h-11 w-11 items-center justify-center rounded-full text-secondary hover:bg-surface-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div className="space-y-6 overflow-y-auto p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="label-section">Bill to</p>
                    <p className="mt-2 font-semibold text-primary">{clientMap.get(viewingInvoice.clientId)?.name || 'Unknown client'}</p>
                    {clientMap.get(viewingInvoice.clientId)?.email && <p className="text-sm text-secondary">{clientMap.get(viewingInvoice.clientId)?.email}</p>}
                    {clientMap.get(viewingInvoice.clientId)?.billingAddress && <p className="mt-1 whitespace-pre-line text-sm text-secondary">{clientMap.get(viewingInvoice.clientId)?.billingAddress}</p>}
                  </div>
                  <div className="sm:text-right">
                    <p className="label-section">Amount due</p>
                    <div className="mt-2 font-display text-2xl font-bold text-primary"><Money amountMinorUnits={viewingInvoice.totalMinorUnits} currency={viewingInvoice.currency} /></div>
                    <p className="mt-1 text-sm text-secondary">Due {new Date(viewingInvoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-default">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-surface-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-secondary">
                    <span>Description</span><span>Qty</span><span>Amount</span>
                  </div>
                  {viewingInvoice.lineItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-default px-4 py-3 text-sm">
                      <span className="text-primary">{item.description}</span>
                      <span className="text-secondary">{item.quantity}</span>
                      <span className="font-medium text-primary"><Money amountMinorUnits={item.quantity * item.unitPriceMinorUnits} currency={viewingInvoice.currency} /></span>
                    </div>
                  ))}
                  <div className="flex justify-end border-t border-default bg-surface-2 px-4 py-3 text-sm font-bold text-primary">
                    <span className="mr-8">Total</span><Money amountMinorUnits={viewingInvoice.totalMinorUnits} currency={viewingInvoice.currency} />
                  </div>
                </div>

                {viewingInvoice.notes && (
                  <div>
                    <p className="label-section">Notes</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-secondary">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {isInvoiceModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeInvoiceModal}
          />
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-modal-title"
              aria-describedby="invoice-modal-description"
              tabIndex={-1}
              className="relative w-full max-w-5xl rounded-t-[24px] sm:rounded-[24px] border border-default bg-surface shadow-2xl max-h-[90dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden animate-scale-in"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-default bg-surface p-4 sm:p-5">
                <div>
                  <h2 id="invoice-modal-title" className="font-display font-bold text-xl text-primary">{editingInvoiceId ? 'Edit Invoice' : 'Create Invoice'}</h2>
                  <p id="invoice-modal-description" className="text-xs text-secondary">Draft and send polished invoices from one responsive workspace.</p>
                </div>
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label="Close create invoice modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="label-section">Your Details</p>
                          <span className="text-[10px] text-secondary">Business</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="label-section">Business / Your Name</label>
                            <input value={invoiceForm.businessName} onChange={(e) => updateInvoiceField('businessName', e.target.value)} className="field mt-2" />
                          </div>
                          <div>
                            <label className="label-section">Contact Info</label>
                            <input value={invoiceForm.contactInfo} onChange={(e) => updateInvoiceField('contactInfo', e.target.value)} className="field mt-2" />
                          </div>
                          <div>
                            <label className="label-section">Tax ID</label>
                            <input value={invoiceForm.taxId} onChange={(e) => updateInvoiceField('taxId', e.target.value)} className="field mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="label-section">Client Information</p>
                          <span className="text-[10px] text-secondary">Billing</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="label-section">Client / Business Name</label>
                            <select value={invoiceForm.clientId} onChange={(e) => {
                              const selectedClient = clients.find(client => client.id === e.target.value);
                              updateInvoiceField('clientId', e.target.value);
                              updateInvoiceField('clientName', selectedClient?.name || '');
                              updateInvoiceField('clientContact', selectedClient?.phone || '');
                              updateInvoiceField('clientEmail', selectedClient?.email || '');
                              updateInvoiceField('billingAddress', selectedClient?.billingAddress || '');
                            }} className="field mt-2">
                              <option value="">Select a client</option>
                              {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                              ))}
                            </select>
                            {formErrors.clientId && <p className="mt-1 text-sm text-expense">{formErrors.clientId}</p>}
                          </div>
                          <div>
                            <label className="label-section">Main Contact Person</label>
                            <input value={invoiceForm.clientContact} onChange={(e) => updateInvoiceField('clientContact', e.target.value)} className="field mt-2" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="label-section">Billing Address</label>
                            <textarea value={invoiceForm.billingAddress} onChange={(e) => updateInvoiceField('billingAddress', e.target.value)} className="field mt-2 min-h-[88px] py-3" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="label-section">Email</label>
                            <input type="email" value={invoiceForm.clientEmail} onChange={(e) => updateInvoiceField('clientEmail', e.target.value)} className="field mt-2" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="label-section">Invoice Details</p>
                          <span className="text-[10px] text-secondary">Metadata</span>
                        </div>
                        <div className="grid gap-3">
                          <div>
                            <label className="label-section">Invoice Number</label>
                            <input value={invoiceForm.invoiceNumber} onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)} className="field mt-2" />
                            {formErrors.invoiceNumber && <p className="mt-1 text-sm text-expense">{formErrors.invoiceNumber}</p>}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="label-section">Issue Date</label>
                              <input type="date" value={invoiceForm.issueDate} onChange={(e) => updateInvoiceField('issueDate', e.target.value)} className="field mt-2" />
                              {formErrors.issueDate && <p className="mt-1 text-sm text-expense">{formErrors.issueDate}</p>}
                            </div>
                            <div>
                              <label className="label-section">Due Date</label>
                              <input type="date" value={invoiceForm.dueDate} onChange={(e) => updateInvoiceField('dueDate', e.target.value)} className="field mt-2" />
                              {formErrors.dueDate && <p className="mt-1 text-sm text-expense">{formErrors.dueDate}</p>}
                            </div>
                          </div>
                          <div>
                            <label className="label-section">Payment Terms</label>
                            <input value={invoiceForm.paymentTerms} onChange={(e) => updateInvoiceField('paymentTerms', e.target.value)} className="field mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="label-section">Payment & Notes</p>
                          <span className="text-[10px] text-secondary">Send details</span>
                        </div>
                        <div className="grid gap-3">
                          <div>
                            <label className="label-section">Payment Method / Bank Details</label>
                            <textarea value={invoiceForm.paymentMethod} onChange={(e) => updateInvoiceField('paymentMethod', e.target.value)} className="field mt-2 min-h-[88px] py-3" />
                          </div>
                          <div>
                            <label className="label-section">Notes</label>
                            <textarea value={invoiceForm.notes} onChange={(e) => updateInvoiceField('notes', e.target.value)} className="field mt-2 min-h-[88px] py-3" />
                          </div>
                          <div>
                            <label className="label-section">Thank You Message</label>
                            <textarea value={invoiceForm.thankYou} onChange={(e) => updateInvoiceField('thankYou', e.target.value)} className="field mt-2 min-h-[80px] py-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="label-section">Line Items</p>
                      <button type="button" onClick={addLineItem} className="btn btn-ghost h-9 px-3 text-xs gap-1.5">
                        <Plus className="w-4 h-4" />
                        Add item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {invoiceForm.lines.map((line, index) => (
                        <div key={line.id} className="grid gap-3 rounded-xl border border-default bg-surface p-3 sm:grid-cols-5">
                          <div className="sm:col-span-2">
                            <label className="label-section">Description</label>
                            <input value={line.description} onChange={(e) => updateLineItem(line.id, 'description', e.target.value)} className="field mt-2" placeholder="Consulting services" />
                          </div>
                          <div>
                            <label className="label-section">Qty / Hours</label>
                            <input type="number" min="0" step="0.25" value={line.quantity} onChange={(e) => updateLineItem(line.id, 'quantity', e.target.value)} className="field mt-2" />
                          </div>
                          <div>
                            <label className="label-section">Rate / Unit</label>
                            <input type="number" min="0" step="0.01" value={line.rate} onChange={(e) => updateLineItem(line.id, 'rate', e.target.value)} className="field mt-2" />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="label-section">Line total</label>
                              <div className="field mt-2 flex items-center justify-between bg-surface-2 text-sm text-primary">
                                <Money amountMinorUnits={lineSummaries[index]?.lineTotalMinorUnits || 0} currency={currency} />
                              </div>
                            </div>
                            <button type="button" onClick={() => removeLineItem(line.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-secondary hover:bg-surface-2 hover:text-expense" aria-label="Remove line item">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formErrors.lines && <p className="mt-2 text-sm text-expense">{formErrors.lines}</p>}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="label-section">Totals</p>
                        <span className="text-[10px] text-secondary">Live summary</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-secondary">
                          <span>Subtotal</span>
                          <Money amountMinorUnits={subtotalMinorUnits} currency={currency} />
                        </div>
                        <div>
                          <label className="label-section">Discounts / Adjustments</label>
                          <input type="number" min="0" step="0.01" value={invoiceForm.discountAmount} onChange={(e) => updateInvoiceField('discountAmount', e.target.value)} className="field mt-2" />
                        </div>
                        <div>
                          <label className="label-section">Tax Rate (%)</label>
                          <input type="number" min="0" step="0.01" value={invoiceForm.taxRate} onChange={(e) => updateInvoiceField('taxRate', e.target.value)} className="field mt-2" />
                        </div>
                        <div className="flex items-center justify-between text-sm text-secondary">
                          <span>Tax Amount</span>
                          <Money amountMinorUnits={taxMinorUnits} currency={currency} />
                        </div>
                        <div className="rounded-xl bg-surface p-3 border border-default">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-secondary">Total Amount Due</span>
                            <div className="font-display font-bold text-lg text-primary">
                              <Money amountMinorUnits={totalMinorUnits} currency={currency} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-default bg-surface-2/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="label-section">Branding</p>
                        <span className="text-[10px] text-secondary">Optional</span>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-xl border border-dashed border-default p-4 text-sm text-secondary">
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
                            <span className="rounded-full bg-surface px-3 py-2 text-primary">{logoSaving ? 'Saving logo…' : profile?.logoUrl ? 'Replace logo' : 'Upload logo'}</span>
                            <span>Used on every new invoice until you replace or remove it.</span>
                            <input type="file" accept="image/*" disabled={logoSaving} onChange={handleLogoUpload} className="hidden" />
                          </label>
                        </div>
                        {profile?.logoUrl && (
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-default bg-surface p-3">
                            <img src={profile.logoUrl} alt="Business logo preview" className="h-20 max-w-[70%] rounded-lg object-contain" />
                            <button type="button" onClick={handleLogoRemove} disabled={logoSaving} className="text-sm font-semibold text-expense hover:underline disabled:opacity-50">Remove</button>
                          </div>
                        )}
                        {logoError && <p className="text-sm text-expense">{logoError}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-default bg-surface p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-secondary">
                    {formErrors.submit ? <span className="text-expense">{formErrors.submit}</span> : 'Drafts are stored locally and can be sent later.'}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleInvoiceSubmit('draft')} disabled={saving} className="btn btn-ghost">
                      {saving ? 'Saving...' : editingInvoiceId ? 'Save Changes' : 'Save Draft'}
                    </button>
                    <button type="button" onClick={() => handleInvoiceSubmit('send')} disabled={saving} className="btn btn-primary">
                      {saving ? 'Sending...' : editingInvoiceId ? 'Save & Send Invoice' : 'Create & Send Invoice'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-[12px] font-bold uppercase tracking-widest mb-1">
            Keep cash moving
          </p>
          <h1 className="font-display font-bold text-2xl text-primary">Invoices</h1>
        </div>
        <button
          type="button"
          onClick={openInvoiceModal}
          className="btn btn-ghost h-11 px-3 flex items-center gap-2 rounded-xl"
        >
          <FilePlus2 className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold text-primary">Create Invoice</span>
        </button>
      </div>

      {/* 2. OUTSTANDING SUMMARY CARD */}
      <div className="bg-surface rounded-2xl p-5 shadow-card border-y border-r border-l-4 border-default border-l-outstanding">
        <p className="text-secondary text-sm font-semibold mb-1">Outstanding this month</p>
        <div className="font-display font-bold text-[32px] leading-tight text-outstanding mb-1">
          <Money amountMinorUnits={invoices.length ? totalOutstanding : 365000} currency={currency} />
        </div>
        <p className="text-secondary text-xs font-medium mb-4">
          {invoices.length ? openCount : 3} awaiting payment
        </p>
        
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${invoices.length ? progressPct : 70}%` }} 
            />
          </div>
          <p className="text-secondary text-xs">
            <Money amountMinorUnits={invoices.length ? totalPaid : 870000} currency={currency} /> paid of <Money amountMinorUnits={invoices.length ? totalBilled : 1235000} currency={currency} /> billed
          </p>
        </div>
      </div>

      {/* 3. SEARCH FIELD */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client or invoice"
          className="field w-full pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. TABS */}
      <div className="flex border-b border-default overflow-x-auto no-scrollbar">
        {(['All', 'Open', 'Paid'] as TabType[]).map(tab => {
          const isActive = activeTab === tab;
          let count = 0;
          if (tab === 'All') count = allInvoices.length;
          if (tab === 'Open') count = openCount;
          if (tab === 'Paid') count = paidCount;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-secondary hover:text-primary'
              }`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/20 dark:text-indigo-300' : 'bg-surface-2 text-secondary'
              }`}>
                {count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 5. INVOICE CARDS */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-2">
          {filteredInvoices.map((inv) => {
            const statusInfo = formatStatus(inv.status);
            return (
              <div key={inv.id} className="bg-surface rounded-2xl p-4 border border-default shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${getClientColor(inv.clientName)}`}>
                    {getInitials(inv.clientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-primary truncate">{inv.clientName}</p>
                    <p className="text-xs text-secondary truncate">{inv.number} · {inv.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <div className="font-display font-bold text-lg text-primary">
                    <Money amountMinorUnits={inv.amountMinorUnits} currency={currency} />
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                    {inv.dueDate && (
                      <span className="text-[10px] text-secondary font-medium">
                        {inv.status === 'paid' ? 'Paid on' : 'Due'} {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-default pl-4 shrink-0">
                    <button type="button" onClick={() => handleViewInvoice(inv.id)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      View <span aria-hidden="true">→</span>
                    </button>
                    <div
                      ref={openInvoiceMenuId === inv.id ? invoiceMenuRef : undefined}
                      className="relative"
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openInvoiceMenuId === inv.id}
                        aria-label={`Actions for invoice ${inv.number}`}
                        onClick={() => setOpenInvoiceMenuId(current => current === inv.id ? null : inv.id)}
                        className="p-2 -mr-2 rounded-full text-secondary hover:bg-surface-2 hover:text-primary transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openInvoiceMenuId === inv.id && (
                        <div
                          role="menu"
                          aria-label={`Actions for invoice ${inv.number}`}
                          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-default bg-white py-1 shadow-lg dark:bg-slate-900"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleEditInvoice(inv.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-surface-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleDeleteInvoice(inv.id, inv.number)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-expense hover:bg-surface-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-secondary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary mb-1">No invoices found</h3>
          <p className="text-sm text-secondary mb-6">Create your first invoice or adjust filters.</p>
          {(searchQuery || activeTab !== 'All') && (
            <button 
              onClick={() => { setActiveTab('All'); setSearchQuery(''); }}
              className="btn btn-ghost"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
