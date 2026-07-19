import { getDB, createCrudHelpers } from './indexeddb';
import {
  UserProfile,
  Client,
  Category,
  Transaction,
  Invoice,
  InvoiceLineItem,
  Attachment,
  SyncMeta,
  Account,
  Device,
  CapturedDocument,
  Insight,
  AIConsent
} from '../types';

export interface DalResult<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

// Helper to make success or error response
const okRes = <T>(data: T): DalResult<T> => ({ ok: true, data });
const errRes = <T>(code: string, message: string, recoverable = true): DalResult<T> => ({
  ok: false,
  error: { code, message, recoverable }
});

// Generic CRUD implementations
const clientCrud = createCrudHelpers<Client>('clients');
const transactionCrud = createCrudHelpers<Transaction>('transactions');
const invoiceCrud = createCrudHelpers<Invoice>('invoices');
const categoryCrud = createCrudHelpers<Category>('categories');
const attachmentCrud = createCrudHelpers<Attachment>('attachments');
const capDocCrud = createCrudHelpers<CapturedDocument>('capturedDocuments');
const insightCrud = createCrudHelpers<Insight>('insights');

// Active device session tracking
let currentDeviceId = localStorage.getItem('bookkeeper_device_id') || '';
if (!currentDeviceId) {
  currentDeviceId = 'dev_' + Math.random().toString(36).substring(2, 11);
  localStorage.setItem('bookkeeper_device_id', currentDeviceId);
}

// -------------------------------------------------------------
// 1. Clients DAL
// -------------------------------------------------------------
export const clients = {
  async list(filters?: { archived?: boolean }): Promise<DalResult<Client[]>> {
    try {
      const all = await clientCrud.list();
      const showArchived = filters?.archived ?? false;
      const filtered = all.filter(c => showArchived ? true : !c.archivedAt);
      return okRes(filtered);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async get(id: string): Promise<DalResult<Client>> {
    try {
      const item = await clientCrud.get(id);
      if (!item) return errRes('NOT_FOUND', 'Client not found');
      return okRes(item);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async create(payload: Omit<Client, 'id'>): Promise<DalResult<Client>> {
    try {
      const newClient: Client = {
        ...payload,
        id: 'cli_' + Math.random().toString(36).substring(2, 11),
      };
      await clientCrud.create(newClient);
      await sync.markChange();
      return okRes(newClient);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async update(id: string, patch: Partial<Client>): Promise<DalResult<Client>> {
    try {
      const existing = await clientCrud.get(id);
      if (!existing) return errRes('NOT_FOUND', 'Client not found');
      const updated = { ...existing, ...patch };
      await clientCrud.update(updated);
      await sync.markChange();
      return okRes(updated);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async archive(id: string): Promise<DalResult<Client>> {
    return this.update(id, { archivedAt: new Date().toISOString() });
  }
};

// -------------------------------------------------------------
// 2. Transactions DAL
// -------------------------------------------------------------
export const transactions = {
  async list(filters?: {
    type?: 'income' | 'expense';
    dateRange?: { start: string; end: string };
    clientId?: string;
    categoryId?: string;
  }): Promise<DalResult<Transaction[]>> {
    try {
      let all = await transactionCrud.list();
      if (filters) {
        if (filters.type) {
          all = all.filter(t => t.type === filters.type);
        }
        if (filters.clientId) {
          all = all.filter(t => t.clientId === filters.clientId);
        }
        if (filters.categoryId) {
          all = all.filter(t => t.categoryId === filters.categoryId);
        }
        if (filters.dateRange) {
          const { start, end } = filters.dateRange;
          all = all.filter(t => t.date >= start && t.date <= end);
        }
      }
      // Sort newest first
      all.sort((a, b) => b.date.localeCompare(a.date));
      return okRes(all);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async get(id: string): Promise<DalResult<Transaction>> {
    try {
      const item = await transactionCrud.get(id);
      if (!item) return errRes('NOT_FOUND', 'Transaction not found');
      return okRes(item);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async create(payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<DalResult<Transaction>> {
    try {
      const now = new Date().toISOString();
      const newTx: Transaction = {
        ...payload,
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        createdAt: now,
        updatedAt: now,
      };
      await transactionCrud.create(newTx);
      await sync.markChange();
      return okRes(newTx);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async update(id: string, patch: Partial<Transaction>): Promise<DalResult<Transaction>> {
    try {
      const existing = await transactionCrud.get(id);
      if (!existing) return errRes('NOT_FOUND', 'Transaction not found');
      const updated: Transaction = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await transactionCrud.update(updated);
      await sync.markChange();
      return okRes(updated);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async delete(id: string): Promise<DalResult<void>> {
    try {
      await transactionCrud.delete(id);
      await sync.markChange();
      return okRes(undefined);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  }
};

// -------------------------------------------------------------
// 3. Invoices DAL
// -------------------------------------------------------------
export const invoices = {
  async list(filters?: {
    status?: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'void';
    clientId?: string;
  }): Promise<DalResult<Invoice[]>> {
    try {
      let all = await invoiceCrud.list();
      if (filters) {
        if (filters.status) {
          all = all.filter(i => i.status === filters.status);
        }
        if (filters.clientId) {
          all = all.filter(i => i.clientId === filters.clientId);
        }
      }
      all.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
      return okRes(all);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async get(id: string): Promise<DalResult<Invoice & { lineItems: InvoiceLineItem[] }>> {
    try {
      const invoice = await invoiceCrud.get(id);
      if (!invoice) return errRes('NOT_FOUND', 'Invoice not found');
      
      const db = getDB();
      const allItems = await db.getAll('invoiceLineItems');
      const lineItems = allItems.filter(item => item.invoiceId === id);
      lineItems.sort((a, b) => a.sortOrder - b.sortOrder);
      
      return okRes({ ...invoice, lineItems });
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async create(payload: {
    clientId: string;
    invoiceNumber: string;
    dueDate: string;
    issueDate: string;
    currency: string;
    lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[];
    notes?: string;
    sourceCapturedDocumentId?: string | null;
  }): Promise<DalResult<Invoice>> {
    try {
      const db = getDB();
      const invoiceId = 'inv_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();

      // Calculate totals
      let subtotal = 0;
      let taxTotal = 0;
      payload.lineItems.forEach(item => {
        const itemSub = item.quantity * item.unitPriceMinorUnits;
        const itemTax = Math.round(itemSub * (item.taxRate / 100));
        subtotal += itemSub;
        taxTotal += itemTax;
      });

      const total = subtotal + taxTotal;

      const newInvoice: Invoice = {
        id: invoiceId,
        invoiceNumber: payload.invoiceNumber,
        clientId: payload.clientId,
        status: 'draft',
        issueDate: payload.issueDate,
        dueDate: payload.dueDate,
        currency: payload.currency,
        subtotalMinorUnits: subtotal,
        taxTotalMinorUnits: taxTotal,
        totalMinorUnits: total,
        amountPaidMinorUnits: 0,
        notes: payload.notes,
        sourceCapturedDocumentId: payload.sourceCapturedDocumentId,
        createdAt: now,
        updatedAt: now,
      };

      // Save line items
      const tx = db.transaction('invoiceLineItems', 'readwrite');
      let index = 0;
      for (const item of payload.lineItems) {
        await tx.store.put({
          id: 'li_' + Math.random().toString(36).substring(2, 11),
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPriceMinorUnits: item.unitPriceMinorUnits,
          taxRate: item.taxRate,
          sortOrder: item.sortOrder ?? index++,
        });
      }
      await tx.done;

      await invoiceCrud.create(newInvoice);
      await sync.markChange();
      return okRes(newInvoice);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async update(id: string, patch: Partial<Invoice> & { lineItems?: InvoiceLineItem[] }): Promise<DalResult<Invoice>> {
    try {
      const db = getDB();
      const existing = await invoiceCrud.get(id);
      if (!existing) return errRes('NOT_FOUND', 'Invoice not found');

      let { lineItems, ...invoicePatch } = patch;
      let updatedInvoice = { ...existing, ...invoicePatch };

      if (lineItems) {
        // Calculate new totals
        let subtotal = 0;
        let taxTotal = 0;
        lineItems.forEach(item => {
          const itemSub = item.quantity * item.unitPriceMinorUnits;
          const itemTax = Math.round(itemSub * (item.taxRate / 100));
          subtotal += itemSub;
          taxTotal += itemTax;
        });
        updatedInvoice.subtotalMinorUnits = subtotal;
        updatedInvoice.taxTotalMinorUnits = taxTotal;
        updatedInvoice.totalMinorUnits = subtotal + taxTotal;

        // Clear existing line items first
        const allItems = await db.getAll('invoiceLineItems');
        const toDelete = allItems.filter(item => item.invoiceId === id);
        const tx = db.transaction('invoiceLineItems', 'readwrite');
        for (const item of toDelete) {
          await tx.store.delete(item.id);
        }
        // Save new line items
        for (const item of lineItems) {
          await tx.store.put({
            ...item,
            id: item.id || 'li_' + Math.random().toString(36).substring(2, 11),
            invoiceId: id,
          });
        }
        await tx.done;
      }

      updatedInvoice.updatedAt = new Date().toISOString();
      await invoiceCrud.update(updatedInvoice);
      await sync.markChange();
      return okRes(updatedInvoice);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async recordPayment(id: string, payment: { amount: number; date: string; method: string }): Promise<DalResult<Invoice>> {
    try {
      const detailsResult = await this.get(id);
      if (!detailsResult.ok || !detailsResult.data) return errRes('NOT_FOUND', 'Invoice not found');
      const invoice = detailsResult.data;

      const newPaidAmount = invoice.amountPaidMinorUnits + payment.amount;
      const status = newPaidAmount >= invoice.totalMinorUnits ? 'paid' : 'partially_paid';

      // Log transaction as income linked to this invoice
      const categoryList = await categoryCrud.list();
      const incomeCat = categoryList.find(c => c.type === 'income') || { id: 'cat_consulting' };

      await transactions.create({
        type: 'income',
        date: payment.date,
        amountMinorUnits: payment.amount,
        currency: invoice.currency,
        categoryId: incomeCat.id,
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        paymentMethod: payment.method as any,
        notes: `Payment for Invoice #${invoice.invoiceNumber}`,
      });

      return this.update(id, {
        amountPaidMinorUnits: newPaidAmount,
        status,
      });
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async render(id: string, format: 'pdf' | 'html'): Promise<DalResult<string>> {
    // Return standard mock PDF metadata or HTML representation
    return okRes(`[rendered:${format}:${id}]`);
  }
};

// -------------------------------------------------------------
// 4. Reports DAL
// -------------------------------------------------------------
export const reports = {
  async profitAndLoss(dateRange: { start: string; end: string }): Promise<DalResult<{
    income: number;
    expenses: number;
    netIncome: number;
    byCategory: { name: string; amount: number; type: 'income' | 'expense' }[];
  }>> {
    try {
      const txsResult = await transactions.list({ dateRange });
      if (!txsResult.ok || !txsResult.data) return errRes('REPORT_ERROR', 'Could not fetch transactions');
      const txs = txsResult.data;

      const categoriesList = await categoryCrud.list();
      const catMap = new Map(categoriesList.map(c => [c.id, c]));

      let income = 0;
      let expenses = 0;
      const catBreakdown: Record<string, number> = {};

      txs.forEach(t => {
        if (t.type === 'income') {
          income += t.amountMinorUnits;
        } else {
          expenses += t.amountMinorUnits;
        }

        const cat = catMap.get(t.categoryId);
        const name = cat ? cat.name : 'Uncategorized';
        catBreakdown[name] = (catBreakdown[name] || 0) + t.amountMinorUnits;
      });

      const byCategory = Object.entries(catBreakdown).map(([name, amount]) => {
        const matchingCat = categoriesList.find(c => c.name === name);
        return {
          name,
          amount,
          type: matchingCat ? matchingCat.type : 'expense'
        };
      });

      return okRes({
        income,
        expenses,
        netIncome: income - expenses,
        byCategory,
      });
    } catch (e: any) {
      return errRes('REPORT_ERROR', e.message);
    }
  },

  async taxSummary(dateRange: { start: string; end: string }): Promise<DalResult<{
    totalDeductibleExpenses: number;
    nonDeductibleExpenses: number;
    estimatedTaxPayable: number;
  }>> {
    try {
      const txsResult = await transactions.list({ dateRange });
      if (!txsResult.ok || !txsResult.data) return errRes('REPORT_ERROR', 'Could not fetch transactions');
      const txs = txsResult.data;

      const categoriesList = await categoryCrud.list();
      const catMap = new Map(categoriesList.map(c => [c.id, c]));

      let totalDeductibleExpenses = 0;
      let nonDeductibleExpenses = 0;
      let totalIncome = 0;

      txs.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amountMinorUnits;
        } else {
          const cat = catMap.get(t.categoryId);
          if (cat?.isTaxDeductible) {
            totalDeductibleExpenses += t.amountMinorUnits;
          } else {
            nonDeductibleExpenses += t.amountMinorUnits;
          }
        }
      });

      // Simple Nigerian tax model (e.g. 15% estimated on net taxable income)
      const taxableProfit = Math.max(0, totalIncome - totalDeductibleExpenses);
      const estimatedTaxPayable = Math.round(taxableProfit * 0.15);

      return okRes({
        totalDeductibleExpenses,
        nonDeductibleExpenses,
        estimatedTaxPayable,
      });
    } catch (e: any) {
      return errRes('REPORT_ERROR', e.message);
    }
  },

  async export(options: { reportType: string; format: 'csv' | 'pdf'; dateRange: { start: string; end: string } }): Promise<DalResult<string>> {
    // Generate a mock CSV download payload
    if (options.format === 'csv') {
      const txs = await transactionCrud.list();
      let csv = 'Date,Type,Amount,Currency,Notes\n';
      txs.forEach(t => {
        csv += `${t.date},${t.type},${(t.amountMinorUnits / 100).toFixed(2)},${t.currency},"${t.notes || ''}"\n`;
      });
      return okRes(csv);
    }
    return okRes(`[pdf_report_binary_string]`);
  }
};

// -------------------------------------------------------------
// 5. Authentication DAL (Simulated Server Side Behaviors)
// -------------------------------------------------------------
export const auth = {
  async requestOtp(phone: string): Promise<DalResult<{ provider: 'sms' | 'whatsapp'; waitSeconds: number }>> {
    try {
      console.log(`[AUTH] Requested OTP for ${phone}`);
      // Simulate SMS or WhatsApp decision (WhatsApp if phone contains certain prefix or is fallback)
      const provider = phone.includes('+234') || phone.startsWith('0') ? 'whatsapp' : 'sms';
      return okRes({ provider, waitSeconds: 30 });
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  },

  async verifyOtp(phone: string, code: string): Promise<DalResult<{
    account: Account;
    device: Device;
    refreshToken: string;
    accessToken: string;
  }>> {
    try {
      if (code !== '123456' && code !== '1234') {
        return errRes('INVALID_OTP', 'The verification code entered is incorrect.', false);
      }

      const db = getDB();
      const accountId = 'acc_' + Math.random().toString(36).substring(2, 11);
      const deviceId = currentDeviceId;
      const deviceSecret = 'sec_' + Math.random().toString(36).substring(2, 20);

      const account: Account = {
        id: accountId,
        phone,
        createdAt: new Date().toISOString(),
      };

      const device: Device = {
        id: deviceId,
        accountId,
        deviceName: navigator.userAgent.substring(0, 30) || 'Generic Browser',
        deviceType: 'web_pwa',
        lastActiveAt: new Date().toISOString(),
        refreshTokenHash: 'hash_' + Math.random().toString(36).substring(2, 11),
        deviceSecret,
        createdAt: new Date().toISOString(),
        wipeRequested: false,
      };

      // Store device and account details locally in IndexedDB to support simulations
      await db.put('accounts', account);
      await db.put('devices', device);

      // Link UserProfile to this account
      const profile = await db.get('userProfile', 'default');
      if (profile) {
        profile.accountId = accountId;
        profile.syncMode = 'electric_cloud';
        await db.put('userProfile', profile);
      }

      // Also update SyncMeta
      const syncMeta = await db.get('syncMeta', 'default');
      if (syncMeta) {
        syncMeta.syncMode = 'electric_cloud';
        syncMeta.lastSyncedAt = new Date().toISOString();
        await db.put('syncMeta', syncMeta);
      }

      // Save tokens in secure platform storage (simulated by localStorage with token encryption or simply localStorage)
      localStorage.setItem('bk_access_token', 'mock_jwt_access_' + Math.random().toString(36).substring(2));
      localStorage.setItem('bk_refresh_token', 'mock_jwt_refresh_' + Math.random().toString(36).substring(2));
      localStorage.setItem(`bk_device_secret_${deviceId}`, deviceSecret);

      return okRes({
        account,
        device,
        accessToken: 'access_tok',
        refreshToken: 'refresh_tok'
      });
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  },

  async refreshToken(refreshToken: string): Promise<DalResult<{ accessToken: string }>> {
    return okRes({ accessToken: 'new_access_token_' + Math.random() });
  },

  async logout(deviceId?: string): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const profile = await db.get('userProfile', 'default');
      if (profile) {
        profile.accountId = null;
        profile.syncMode = 'local_only';
        await db.put('userProfile', profile);
      }
      const syncMeta = await db.get('syncMeta', 'default');
      if (syncMeta) {
        syncMeta.syncMode = 'local_only';
        await db.put('syncMeta', syncMeta);
      }

      localStorage.removeItem('bk_access_token');
      localStorage.removeItem('bk_refresh_token');

      return okRes(undefined);
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  },

  async listDevices(): Promise<DalResult<Device[]>> {
    try {
      const db = getDB();
      const all = await db.getAll('devices');
      return okRes(all);
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  },

  async revokeDevice(deviceId: string, options?: { wipeData?: boolean }): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const d = await db.get('devices', deviceId);
      if (d) {
        d.revokedAt = new Date().toISOString();
        if (options?.wipeData) {
          d.wipeRequested = true;
          d.wipeRequestedAt = new Date().toISOString();
        }
        await db.put('devices', d);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  },

  async checkWipeStatus(deviceId: string, deviceSecret: string): Promise<DalResult<{ wipeRequested: boolean }>> {
    try {
      const db = getDB();
      const d = await db.get('devices', deviceId);
      // Secret must match
      if (d && d.deviceSecret === deviceSecret) {
        return okRes({ wipeRequested: d.wipeRequested });
      }
      return okRes({ wipeRequested: false });
    } catch (e: any) {
      // Fail open (normal rendering) on timeout/error
      return okRes({ wipeRequested: false });
    }
  },

  async acknowledgeWipeComplete(deviceId: string, deviceSecret: string): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const d = await db.get('devices', deviceId);
      if (d && d.deviceSecret === deviceSecret) {
        d.wipedAt = new Date().toISOString();
        await db.put('devices', d);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('AUTH_ERROR', e.message);
    }
  }
};

// -------------------------------------------------------------
// 6. Sync DAL (Postgres + ElectricSQL Sync Simulator)
// -------------------------------------------------------------
export const sync = {
  async status(): Promise<DalResult<SyncMeta>> {
    try {
      const db = getDB();
      const meta = await db.get('syncMeta', 'default');
      return okRes(meta || {
        id: 'default',
        syncMode: 'local_only',
        lastLocalChangeAt: new Date().toISOString(),
        syncStatus: 'idle',
        estimatedDataUsageBytes: 0
      });
    } catch (e: any) {
      return errRes('SYNC_ERROR', e.message);
    }
  },

  async markChange(): Promise<void> {
    try {
      const db = getDB();
      const meta = await db.get('syncMeta', 'default');
      if (meta) {
        meta.lastLocalChangeAt = new Date().toISOString();
        meta.syncStatus = 'idle';
        await db.put('syncMeta', meta);
      }
    } catch {}
  },

  async pushNow(): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const meta = await db.get('syncMeta', 'default');
      if (!meta || meta.syncMode === 'local_only') {
        return okRes(undefined);
      }

      meta.syncStatus = 'syncing';
      await db.put('syncMeta', meta);

      // Simulate network request delays and estimated data transfers (e.g., 2.4KB)
      await new Promise(r => setTimeout(r, 1000));

      meta.syncStatus = 'idle';
      meta.lastSyncedAt = new Date().toISOString();
      meta.estimatedDataUsageBytes += Math.round(Math.random() * 3000) + 500;
      await db.put('syncMeta', meta);

      return okRes(undefined);
    } catch (e: any) {
      return errRes('SYNC_ERROR', e.message);
    }
  },

  async resolveConflict(strategy: 'keep_local' | 'keep_cloud'): Promise<DalResult<void>> {
    return okRes(undefined);
  },

  async upgradeToCloud(): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const profile = await db.get('userProfile', 'default');
      if (profile) {
        profile.syncMode = 'electric_cloud';
        await db.put('userProfile', profile);
      }
      const meta = await db.get('syncMeta', 'default');
      if (meta) {
        meta.syncMode = 'electric_cloud';
        await db.put('syncMeta', meta);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('SYNC_ERROR', e.message);
    }
  },

  async downgradeToLocal(): Promise<DalResult<void>> {
    try {
      const db = getDB();
      const profile = await db.get('userProfile', 'default');
      if (profile) {
        profile.syncMode = 'local_only';
        profile.accountId = null;
        await db.put('userProfile', profile);
      }
      const meta = await db.get('syncMeta', 'default');
      if (meta) {
        meta.syncMode = 'local_only';
        await db.put('syncMeta', meta);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('SYNC_ERROR', e.message);
    }
  },

  electric: {
    connect(credentials: any) {
      return okRes(undefined);
    },
    subscribeShape(def: any) {
      return okRes(undefined);
    },
    write(entity: string, payload: any) {
      return okRes(undefined);
    },
    status() {
      return okRes('connected');
    }
  },

  drive: {
    async backupNow(): Promise<DalResult<{ driveFileId: string }>> {
      try {
        const db = getDB();
        const profile = await db.get('userProfile', 'default');
        const syncMeta = await db.get('syncMeta', 'default');
        
        // Simulating encrypted backup bundle creation
        await new Promise(r => setTimeout(r, 1500));
        
        if (syncMeta) {
          syncMeta.lastSyncedAt = new Date().toISOString();
          await db.put('syncMeta', syncMeta);
        }

        return okRes({ driveFileId: 'drv_file_' + Math.random().toString(36).substring(2, 11) });
      } catch (e: any) {
        return errRes('DRIVE_ERROR', e.message);
      }
    },

    async restoreFromBackup(passphrase: string): Promise<DalResult<void>> {
      try {
        await new Promise(r => setTimeout(r, 1500));
        return okRes(undefined);
      } catch (e: any) {
        return errRes('DRIVE_ERROR', e.message);
      }
    }
  }
};

// -------------------------------------------------------------
// 7. OCR / Document Capture DAL
// -------------------------------------------------------------
export const capture = {
  async create(payload: { imageBlob: Blob | File | string; documentTypeHint?: string }): Promise<DalResult<CapturedDocument>> {
    try {
      const now = new Date().toISOString();
      const attachmentId = 'att_' + Math.random().toString(36).substring(2, 11);
      
      const attachment: Attachment = {
        id: attachmentId,
        filename: 'receipt_' + Date.now() + '.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 154200,
        localBlobRef: payload.imageBlob,
        electricSynced: false
      };
      await attachmentCrud.create(attachment);

      const newDoc: CapturedDocument = {
        id: 'cd_' + Math.random().toString(36).substring(2, 11),
        sourceAttachmentId: attachmentId,
        documentType: (payload.documentTypeHint || 'receipt') as any,
        extractionMethod: 'on_device',
        extractionStatus: 'pending',
        extractedFields: {},
        fieldConfidence: {},
        createdAt: now,
      };
      await capDocCrud.create(newDoc);
      return okRes(newDoc);
    } catch (e: any) {
      return errRes('CAPTURE_ERROR', e.message);
    }
  },

  async extract(id: string, options: { method: 'on_device' | 'cloud_enhanced' }): Promise<DalResult<CapturedDocument>> {
    try {
      const doc = await capDocCrud.get(id);
      if (!doc) return errRes('NOT_FOUND', 'Document not found');

      doc.extractionMethod = options.method;
      doc.extractionStatus = 'processing';
      await capDocCrud.update(doc);

      // Simulate OCR processing time
      await new Promise(r => setTimeout(r, 1200));

      if (options.method === 'on_device') {
        // Offline regex parser simulator
        doc.extractedFields = {
          date: new Date().toISOString().split('T')[0],
          amountMinorUnits: 1500000, // ₦15,000 or $150
          currency: 'NGN',
          vendorName: 'MTN Nigeria Ltd',
          documentType: 'receipt'
        };
        doc.fieldConfidence = {
          date: 0.85,
          amountMinorUnits: 0.9,
          currency: 0.95,
          vendorName: 0.7,
        };
      } else {
        // High fidelity Cloud OCR / Gemini fallback
        doc.extractedFields = {
          date: new Date().toISOString().split('T')[0],
          amountMinorUnits: 1450000, // Precise ₦14,500
          currency: 'NGN',
          vendorName: 'MTN Nigeria Corporate Sales',
          documentType: 'receipt'
        };
        doc.fieldConfidence = {
          date: 0.99,
          amountMinorUnits: 0.98,
          currency: 0.99,
          vendorName: 0.96,
        };
      }

      doc.extractionStatus = 'needs_review';
      await capDocCrud.update(doc);
      return okRes(doc);
    } catch (e: any) {
      return errRes('CAPTURE_ERROR', e.message);
    }
  },

  async confirm(id: string, correctedFields: any): Promise<DalResult<CapturedDocument>> {
    try {
      const doc = await capDocCrud.get(id);
      if (!doc) return errRes('NOT_FOUND', 'Document not found');

      doc.extractedFields = { ...doc.extractedFields, ...correctedFields };
      doc.extractionStatus = 'confirmed';
      doc.confirmedAt = new Date().toISOString();
      await capDocCrud.update(doc);
      return okRes(doc);
    } catch (e: any) {
      return errRes('CAPTURE_ERROR', e.message);
    }
  },

  async discard(id: string): Promise<DalResult<void>> {
    try {
      const doc = await capDocCrud.get(id);
      if (doc) {
        doc.extractionStatus = 'discarded';
        await capDocCrud.update(doc);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('CAPTURE_ERROR', e.message);
    }
  },

  async reprocess(id: string): Promise<DalResult<CapturedDocument>> {
    return this.extract(id, { method: 'on_device' });
  }
};

// -------------------------------------------------------------
// 8. AI Insights DAL
// -------------------------------------------------------------
export const ai = {
  async getConsentStatus(): Promise<DalResult<AIConsent>> {
    try {
      const db = getDB();
      const consent = await db.get('aiConsent', 'default');
      return okRes(consent || {
        id: 'default',
        consentGiven: false,
        insightFrequency: 'weekly',
        excludedClientIds: [],
        excludedCategoryIds: []
      });
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async setConsent(payload: Partial<AIConsent>): Promise<DalResult<AIConsent>> {
    try {
      const db = getDB();
      const existing = await db.get('aiConsent', 'default');
      const updated = {
        ...existing,
        ...payload,
        id: 'default',
        consentTimestamp: payload.consentGiven ? new Date().toISOString() : undefined,
        lastRevokedAt: payload.consentGiven === false ? new Date().toISOString() : existing?.lastRevokedAt
      } as AIConsent;
      await db.put('aiConsent', updated);
      return okRes(updated);
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async generateInsights(scope?: any): Promise<DalResult<Insight[]>> {
    try {
      const consent = await this.getConsentStatus();
      if (!consent.ok || !consent.data?.consentGiven) {
        return okRes([]); // Gate active - returns empty list if no consent
      }

      // Generate a mock list of insights
      const mockInsights: Insight[] = [
        {
          id: 'ins_1',
          type: 'trend',
          title: 'Power & Fuel Expense Spike',
          body: 'Your spending on generator fuel increased by 35% this month. Consider tracking backup inverter battery health to optimize fuel costs.',
          dataRangeCovered: { start: '2026-06-01', end: '2026-07-01' },
          relatedEntityIds: [],
          modelUsed: 'local_computed',
          generatedAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'ins_2',
          type: 'reminder',
          title: 'Unpaid Invoices Follow-up',
          body: 'Client "Glo Telecom" has an invoice overdue by 14 days. We suggest sending a WhatsApp reminder.',
          dataRangeCovered: { start: '2026-06-01', end: '2026-07-01' },
          relatedEntityIds: [],
          modelUsed: 'gemini_3_5_flash',
          generatedAt: new Date().toISOString(),
          status: 'active'
        }
      ];

      // Store in DB
      for (const ins of mockInsights) {
        await insightCrud.create(ins);
      }

      return okRes(mockInsights);
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async ask(question: string): Promise<DalResult<{ answer: string; modelUsed: 'local_computed' | 'gemini_3_5_flash' }>> {
    try {
      const consent = await this.getConsentStatus();
      if (!consent.ok || !consent.data?.consentGiven) {
        return errRes('CONSENT_REQUIRED', 'Please enable AI Insights consent in Settings to ask questions.');
      }

      // Local query resolution for basic words: "balance", "profit", "tax"
      const lower = question.toLowerCase();
      if (lower.includes('balance') || lower.includes('profit') || lower.includes('make')) {
        const pnl = await reports.profitAndLoss({ start: '2026-01-01', end: '2026-12-31' });
        if (pnl.ok && pnl.data) {
          const formatted = (pnl.data.netIncome / 100).toLocaleString();
          return okRes({
            answer: `Based on your local transaction ledger, your net income for this year is ₦${formatted}.`,
            modelUsed: 'local_computed'
          });
        }
      }

      // External call simulator to Gemini 3.5 Flash for open-ended questions
      // Log in AI Activity Log
      const activityLog = JSON.parse(localStorage.getItem('bk_ai_activity_log') || '[]');
      activityLog.push({
        timestamp: new Date().toISOString(),
        question,
        sentBytes: question.length * 2,
      });
      localStorage.setItem('bk_ai_activity_log', JSON.stringify(activityLog));

      return okRes({
        answer: `Gemini 3.5 Flash: Based on your overall ledger history, your top client is Glo Telecom contributing 65% of your consulting earnings. Your tax liability is well within limits.`,
        modelUsed: 'gemini_3_5_flash'
      });
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async dismissInsight(id: string): Promise<DalResult<void>> {
    try {
      const ins = await insightCrud.get(id);
      if (ins) {
        ins.status = 'dismissed';
        await insightCrud.update(ins);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async saveInsight(id: string): Promise<DalResult<void>> {
    try {
      const ins = await insightCrud.get(id);
      if (ins) {
        ins.status = 'saved';
        await insightCrud.update(ins);
      }
      return okRes(undefined);
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  },

  async listInsights(filters?: { status?: 'active' | 'dismissed' | 'saved' }): Promise<DalResult<Insight[]>> {
    try {
      let all = await insightCrud.list();
      if (filters?.status) {
        all = all.filter(i => i.status === filters.status);
      }
      return okRes(all);
    } catch (e: any) {
      return errRes('AI_ERROR', e.message);
    }
  }
};

// -------------------------------------------------------------
// 9. Profile & General DAL
// -------------------------------------------------------------
export const profile = {
  async get(): Promise<DalResult<UserProfile>> {
    try {
      const db = getDB();
      const p = await db.get('userProfile', 'default');
      return okRes(p!);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  },

  async update(patch: Partial<UserProfile>): Promise<DalResult<UserProfile>> {
    try {
      const db = getDB();
      const existing = await db.get('userProfile', 'default');
      const updated = { ...existing, ...patch } as UserProfile;
      await db.put('userProfile', updated);
      return okRes(updated);
    } catch (e: any) {
      return errRes('DB_ERROR', e.message);
    }
  }
};
