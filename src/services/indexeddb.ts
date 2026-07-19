import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION } from '../config';
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

interface BookkeeperDB extends DBSchema {
  userProfile: {
    key: string;
    value: UserProfile;
  };
  clients: {
    key: string;
    value: Client;
  };
  categories: {
    key: string;
    value: Category;
  };
  transactions: {
    key: string;
    value: Transaction;
  };
  invoices: {
    key: string;
    value: Invoice;
  };
  invoiceLineItems: {
    key: string;
    value: InvoiceLineItem;
  };
  attachments: {
    key: string;
    value: Attachment;
  };
  syncMeta: {
    key: string;
    value: SyncMeta;
  };
  accounts: {
    key: string;
    value: Account;
  };
  devices: {
    key: string;
    value: Device;
  };
  capturedDocuments: {
    key: string;
    value: CapturedDocument;
  };
  insights: {
    key: string;
    value: Insight;
  };
  aiConsent: {
    key: string;
    value: AIConsent;
  };
}

let db: IDBPDatabase<BookkeeperDB> | null = null;

// System default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_consulting', name: 'Consulting Income', type: 'income', isTaxDeductible: false, isSystemDefault: true },
  { id: 'cat_sales', name: 'Product Sales', type: 'income', isTaxDeductible: false, isSystemDefault: true },
  { id: 'cat_rent', name: 'Office Rent', type: 'expense', isTaxDeductible: true, isSystemDefault: true },
  { id: 'cat_internet', name: 'Internet & Data', type: 'expense', isTaxDeductible: true, isSystemDefault: true },
  { id: 'cat_software', name: 'Software Subscriptions', type: 'expense', isTaxDeductible: true, isSystemDefault: true },
  { id: 'cat_transport', name: 'Transport & Fuel', type: 'expense', isTaxDeductible: true, isSystemDefault: true },
  { id: 'cat_power', name: 'Generator Fuel & Power', type: 'expense', isTaxDeductible: true, isSystemDefault: true },
];

export const initDB = async (): Promise<IDBPDatabase<BookkeeperDB>> => {
  if (db) return db;

  // We increment the version to DB_VERSION + 1 or force DB_VERSION=2 to trigger upgrades
  db = await openDB<BookkeeperDB>(DB_NAME, 2, {
    upgrade(db, oldVersion, newVersion) {
      // Helper function to create stores if they don't exist
      const createStore = (name: any, options = { keyPath: 'id' }) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, options);
        }
      };

      createStore('userProfile');
      createStore('clients');
      createStore('categories');
      createStore('transactions');
      createStore('invoices');
      createStore('invoiceLineItems');
      createStore('attachments');
      createStore('syncMeta');
      createStore('accounts');
      createStore('devices');
      createStore('capturedDocuments');
      createStore('insights');
      createStore('aiConsent');
    },
  });

  // Seed default categories if empty
  const tx = db.transaction('categories', 'readwrite');
  const count = await tx.store.count();
  if (count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await tx.store.put(cat);
    }
  }
  await tx.done;

  // Seed default syncMeta if empty
  const syncTx = db.transaction('syncMeta', 'readwrite');
  const metaCount = await syncTx.store.count();
  if (metaCount === 0) {
    await syncTx.store.put({
      id: 'default',
      syncMode: 'local_only',
      lastLocalChangeAt: new Date().toISOString(),
      syncStatus: 'idle',
      estimatedDataUsageBytes: 0,
    });
  }
  await syncTx.done;

  // Seed default userProfile if empty
  const profileTx = db.transaction('userProfile', 'readwrite');
  const profileCount = await profileTx.store.count();
  if (profileCount === 0) {
    await profileTx.store.put({
      id: 'default',
      displayName: 'Freelancer',
      baseCurrency: 'NGN',
      invoicingCurrency: 'NGN',
      fiscalYearStart: '01-01',
      jurisdiction: 'NG',
      invoiceNumberFormat: 'INV-YYYY-XXXX',
      syncMode: 'local_only',
      createdAt: new Date().toISOString(),
    });
  }
  await profileTx.done;

  // Seed default aiConsent if empty
  const consentTx = db.transaction('aiConsent', 'readwrite');
  const consentCount = await consentTx.store.count();
  if (consentCount === 0) {
    await consentTx.store.put({
      id: 'default',
      consentGiven: false,
      insightFrequency: 'weekly',
      excludedClientIds: [],
      excludedCategoryIds: [],
    });
  }
  await consentTx.done;

  return db;
};

export const getDB = (): IDBPDatabase<BookkeeperDB> => {
  if (!db) throw new Error('Database not initialized. Call initDB first.');
  return db;
};

// Generic CRUD helper generator
export function createCrudHelpers<T extends { id: string }>(storeName: keyof BookkeeperDB) {
  return {
    async get(id: string): Promise<T | undefined> {
      const db = getDB();
      return (await db.get(storeName as any, id)) as unknown as T | undefined;
    },
    async list(): Promise<T[]> {
      const db = getDB();
      return (await db.getAll(storeName as any)) as unknown as T[];
    },
    async create(item: T): Promise<T> {
      const db = getDB();
      await db.add(storeName as any, item);
      return item;
    },
    async update(item: T): Promise<T> {
      const db = getDB();
      await db.put(storeName as any, item);
      return item;
    },
    async delete(id: string): Promise<void> {
      const db = getDB();
      await db.delete(storeName as any, id);
    }
  };
}
