export interface UserProfile {
  id: string;
  displayName: string;
  baseCurrency: string;
  invoicingCurrency: string;
  fiscalYearStart: string; // MM-DD
  logoUrl?: string;
  taxId?: string;
  jurisdiction: string; // e.g. "NG", "GH", "KE"
  invoiceNumberFormat: string; // e.g. "INV-YYYY-XXXX"
  syncMode: 'local_only' | 'electric_cloud';
  accountId?: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  defaultCurrency: string;
  defaultPaymentTermsDays: number;
  taxId?: string;
  notes?: string;
  archivedAt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isTaxDeductible: boolean;
  isSystemDefault: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  amountMinorUnits: number;
  currency: string;
  exchangeRateSnapshot?: number | null; // e.g. 1 NGN = X USD
  categoryId: string;
  clientId?: string | null;
  invoiceId?: string | null;
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'card' | 'other';
  notes?: string;
  receiptAttachmentId?: string | null;
  sourceCapturedDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'void';
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  subtotalMinorUnits: number;
  taxTotalTotalMinorUnits?: number; // legacy
  taxTotalMinorUnits: number;
  totalMinorUnits: number;
  amountPaidMinorUnits: number;
  notes?: string;
  sourceCapturedDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceMinorUnits: number;
  taxRate: number; // e.g. 7.5 for 7.5%
  sortOrder: number;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  localBlobRef?: Blob | File | string; // or base64
  driveFileId?: string | null;
  electricSynced: boolean;
}

export interface SyncMeta {
  id: string;
  syncMode: 'local_only' | 'electric_cloud';
  electricSourceId?: string | null;
  driveFolderId?: string | null;
  lastSyncedAt?: string | null;
  lastLocalChangeAt: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  conflictState?: string | null;
  estimatedDataUsageBytes: number;
}

export interface Account {
  id: string;
  phone: string;
  email?: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  accountId: string;
  deviceName: string;
  deviceType: string;
  lastActiveAt: string;
  refreshTokenHash: string;
  deviceSecret: string; // hashed/plain device secret for remote wipe check
  createdAt: string;
  revokedAt?: string | null;
  wipeRequested: boolean;
  wipeRequestedAt?: string | null;
  wipedAt?: string | null;
}

export interface CapturedDocument {
  id: string;
  sourceAttachmentId: string;
  documentType: 'receipt' | 'incoming_invoice' | 'bank_transfer_screenshot' | 'outgoing_invoice_draft' | 'other';
  extractionMethod: 'on_device' | 'cloud_enhanced';
  extractionStatus: 'pending' | 'processing' | 'needs_review' | 'confirmed' | 'discarded';
  extractedFields: {
    date?: string;
    amountMinorUnits?: number;
    currency?: string;
    vendorName?: string;
    documentType?: string;
    [key: string]: any;
  };
  fieldConfidence: {
    date?: number;
    amountMinorUnits?: number;
    currency?: number;
    vendorName?: number;
    [key: string]: any;
  };
  linkedTransactionId?: string | null;
  linkedInvoiceId?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'reminder' | 'summary' | 'answer';
  title: string;
  body: string;
  dataRangeCovered: {
    start: string;
    end: string;
  };
  relatedEntityIds: string[]; // JSON array stored as array in TS
  modelUsed: 'local_computed' | 'gemini_3_5_flash';
  generatedAt: string;
  status: 'active' | 'dismissed' | 'saved';
}

export interface AIConsent {
  id: string;
  consentGiven: boolean;
  consentTimestamp?: string | null;
  insightFrequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  excludedClientIds: string[];
  excludedCategoryIds: string[];
  lastRevokedAt?: string | null;
}

// Retro-compatible User interface for shell compatibility
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: number;
}
