import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from '../config';
import { Transaction, Invoice, Client, BusinessSettings, User } from '../types';

interface BookkeeperDB extends DBSchema {
  [STORES.transactions]: {
    key: string;
    value: Transaction;
  };
  [STORES.invoices]: {
    key: string;
    value: Invoice;
  };
  [STORES.clients]: {
    key: string;
    value: Client;
  };
  [STORES.settings]: {
    key: string;
    value: BusinessSettings;
  };
  [STORES.user]: {
    key: string;
    value: User;
  };
}

let db: IDBPDatabase<BookkeeperDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<BookkeeperDB>> => {
  if (db) return db;

  db = await openDB<BookkeeperDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.transactions)) {
        db.createObjectStore(STORES.transactions, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.invoices)) {
        db.createObjectStore(STORES.invoices, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.clients)) {
        db.createObjectStore(STORES.clients, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.user)) {
        db.createObjectStore(STORES.user, { keyPath: 'id' });
      }
    },
  });

  return db;
};

export const getDB = (): IDBPDatabase<BookkeeperDB> => {
  if (!db) throw new Error('Database not initialized. Call initDB first.');
  return db;
};

// Transactions
export const addTransaction = async (transaction: Transaction): Promise<string> => {
  const db = getDB();
  return db.add(STORES.transactions, transaction);
};

export const updateTransaction = async (transaction: Transaction): Promise<IDBValidKey> => {
  const db = getDB();
  return db.put(STORES.transactions, transaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const db = getDB();
  await db.delete(STORES.transactions, id);
};

export const getTransaction = async (id: string): Promise<Transaction | undefined> => {
  const db = getDB();
  return db.get(STORES.transactions, id);
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = getDB();
  return db.getAll(STORES.transactions);
};

// Invoices
export const addInvoice = async (invoice: Invoice): Promise<string> => {
  const db = getDB();
  return db.add(STORES.invoices, invoice);
};

export const updateInvoice = async (invoice: Invoice): Promise<IDBValidKey> => {
  const db = getDB();
  return db.put(STORES.invoices, invoice);
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const db = getDB();
  await db.delete(STORES.invoices, id);
};

export const getInvoice = async (id: string): Promise<Invoice | undefined> => {
  const db = getDB();
  return db.get(STORES.invoices, id);
};

export const getAllInvoices = async (): Promise<Invoice[]> => {
  const db = getDB();
  return db.getAll(STORES.invoices);
};

// Clients
export const addClient = async (client: Client): Promise<string> => {
  const db = getDB();
  return db.add(STORES.clients, client);
};

export const updateClient = async (client: Client): Promise<IDBValidKey> => {
  const db = getDB();
  return db.put(STORES.clients, client);
};

export const deleteClient = async (id: string): Promise<void> => {
  const db = getDB();
  await db.delete(STORES.clients, id);
};

export const getClient = async (id: string): Promise<Client | undefined> => {
  const db = getDB();
  return db.get(STORES.clients, id);
};

export const getAllClients = async (): Promise<Client[]> => {
  const db = getDB();
  return db.getAll(STORES.clients);
};

// Settings
export const getSettings = async (): Promise<BusinessSettings | undefined> => {
  const db = getDB();
  return db.get(STORES.settings, 'default');
};

export const saveSettings = async (settings: BusinessSettings): Promise<IDBValidKey> => {
  const db = getDB();
  return db.put(STORES.settings, { ...settings, id: 'default' });
};

// User
export const saveUser = async (user: User): Promise<IDBValidKey> => {
  const db = getDB();
  return db.put(STORES.user, { ...user, id: 'current' });
};

export const getUser = async (): Promise<User | undefined> => {
  const db = getDB();
  return db.get(STORES.user, 'current');
};

export const deleteUser = async (): Promise<void> => {
  const db = getDB();
  await db.delete(STORES.user, 'current');
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  const db = getDB();
  await Promise.all([
    db.clear(STORES.transactions),
    db.clear(STORES.invoices),
    db.clear(STORES.clients),
    db.clear(STORES.settings),
  ]);
};
