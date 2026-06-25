// App folder name in Google Drive
export const APP_FOLDER_NAME = 'BookkeeperApp';

// File names stored in Google Drive
export const DRIVE_FILE_NAMES = {
  transactions: 'transactions.json',
  invoices: 'invoices.json',
  clients: 'clients.json',
  settings: 'settings.json',
};

// IndexedDB database name
export const DB_NAME = 'bookkeeper';
export const DB_VERSION = 1;

// Store names for IndexedDB
export const STORES = {
  transactions: 'transactions',
  invoices: 'invoices',
  clients: 'clients',
  settings: 'settings',
  user: 'user',
};

// Sync debounce delay in milliseconds
export const SYNC_DEBOUNCE_DELAY = 2000;
